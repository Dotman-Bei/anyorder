# Fe 26.6 — working code excerpts (copied verbatim, with provenance)

All excerpts are Apache-2.0: `fe-lang/www` (the guide, which "targets Fe 26.6"), `argotorg/fe` @ v26.6.0 test fixtures (compiled and run by Fe's CI at that tag), and `fe-lang/builders-challenge-starter` @ `f9d9aa9` (CI green on 26.5.0). If you copy any of this into the project, attribute it in the README's "Third-party code" declaration. Fetched 2026-11-17. **Not compiled locally** (no `fe` on this machine).

The starter itself (`src/lib.fe` time-locked ETH vault, `src/tests.fe` with `#[test(balance = …)]`, `.github/workflows/ci.yml`, `SUBMISSION.md`) is not duplicated here. Clone it from <https://github.com/fe-lang/builders-challenge-starter>.

---

## A. A complete governance-flavoured contract with tests (deadline, map, events, typed time)

Source: `fe-lang/www` `src/content/docs/examples/voting.md` (live: <https://fe-lang.org/examples/voting/>).

```fe
use std::abi::sol
use std::evm::minutes

msg BallotMsg {
    #[selector = sol("vote(uint256)")]
    Vote { proposal: u256 },
    #[selector = sol("votes(uint256)")]
    Votes { proposal: u256 } -> u256,
}

#[event]
struct VoteCast {
    #[indexed]
    voter: Address,
    proposal: u256,
}

pub contract Ballot {
    deadline: Timestamp,
    mut voted: StorageMap<Address, bool>,
    mut totals: StorageMap<u256, u256>,

    init(closes_at: Timestamp) uses (ctx: Ctx, mut deadline) {
        assert!(closes_at > ctx.timestamp(), "deadline must be in future")
        deadline = closes_at
    }

    recv BallotMsg {
        Vote { proposal } uses (ctx: Ctx, log: mut Log, deadline, mut voted, mut totals) {
            assert!(ctx.timestamp() < deadline, "voting closed")
            assert!(proposal < 2, "unknown proposal")
            let voter = ctx.caller()
            assert!(!voted.get(key: voter), "already voted")
            voted.set(key: voter, value: true)
            totals.set(key: proposal, value: totals.get(key: proposal) + 1)
            log.emit(event: VoteCast { voter, proposal })
        }
        Votes { proposal } -> u256 uses totals {
            assert!(proposal < 2, "unknown proposal")
            totals.get(key: proposal)
        }
    }
}

#[test]
fn records_vote() uses (evm: mut Evm) {
    let addr = evm.create2<Ballot>(value: Wei::zero(), args: (evm.timestamp() + minutes(5),), salt: 0)
    evm.call(addr, gas: 200000, value: Wei::zero(), message: BallotMsg::Vote { proposal: 1 })
    let votes: u256 = evm.call(addr, gas: 100000, value: Wei::zero(), message: BallotMsg::Votes { proposal: 1 })
    assert!(votes == 1)
    let other: u256 = evm.call(addr, gas: 100000, value: Wei::zero(), message: BallotMsg::Votes { proposal: 0 })
    assert!(other == 0)
}

#[test]
fn rejects_duplicate_vote() uses (evm: mut Evm) {
    let addr = evm.create2<Ballot>(value: Wei::zero(), args: (evm.timestamp() + minutes(5),), salt: 0)
    evm.call(addr, gas: 200000, value: Wei::zero(), message: BallotMsg::Vote { proposal: 0 })
    let second = evm.try_call(addr, gas: 200000, value: Wei::zero(), message: BallotMsg::Vote { proposal: 1 })
    assert!(!second.success())
}
```

What the guide says about this example: negative tests "make only the call under test with `try_call`", and setup uses `evm.call` "so a failing setup step fails the test instead of counting as the expected revert". The guide also says "One address is not necessarily one person: this example provides no identity or eligibility system", and "An application extending this example should test the exact deadline boundary and define eligibility, tie handling, and how the result becomes final."

## B. Multi-actor testing without cheatcodes: the proxy-actor pattern

Source: `argotorg/fe` @ v26.6.0, `crates/fe/tests/fixtures/fe_test/ownable.fe` (abridged; `escrow.fe` in the same folder applies it to a buyer/arbiter state machine). The runner can't impersonate addresses, so deploy a forwarding contract. Its address becomes `ctx.caller()` in the target.

```fe
/// Helper: calls Ownable methods from a different address.
msg ProxyMsg {
    #[selector = 0x10]
    TryIncrement { target: Address } -> u256,
}

pub contract NonOwnerCaller uses (call: mut Call) {
    recv ProxyMsg {
        TryIncrement { target } -> u256 uses (mut call) {
            call.call(
                addr: target,
                gas: 100000,
                value: Wei::zero(),
                message: OwnableMsg::ProtectedIncrement {},
            )
        }
    }
}

#[test]
fn test_ownable() uses (evm: mut Evm) {
    // Deploy — test runner becomes owner via ctx.caller() in init
    let ownable = evm.create2<Ownable>(value: Wei::zero(), args: (), salt: 0)
    // ...
    // Deploy a proxy (different address)
    let proxy = evm.create2<NonOwnerCaller>(value: Wei::zero(), args: (), salt: 1)
    // Non-owner rejected (returns 0)
    let res: u256 = evm.call(addr: proxy, gas: 200000, value: Wei::zero(), message: ProxyMsg::TryIncrement { target: ownable })
    assert!(res == 0)
    // ...
}
```

Note the raw integer selector `#[selector = 0x10]`, which is valid alongside `sol("…")`. For N bidders or voters, deploy N proxy instances with different `salt`s.

## C. Storage structs as effects + `Ctx` (methods on storage, not on the contract)

Source: `fe-lang/www` `effects/storage.md`.

```fe
use std::abi::sol

msg TokenMsg {
    #[selector = sol("totalSupply()")]
    GetSupply -> u256,

    #[selector = sol("mint(address,uint256)")]
    Mint { to: Address, amount: u256 },
}

struct TokenStore {
    total_supply: u256,
    owner: Address,
}

impl TokenStore {
    fn get_supply(self) -> u256 {
        self.total_supply
    }

    fn do_mint(mut self, to: Address, amount: u256) uses (ctx: Ctx) {
        assert!(ctx.caller() == self.owner)
        self.total_supply += amount
    }
}

pub contract Token uses (ctx: Ctx) {
    mut store: TokenStore

    init(owner: Address) uses (mut store) {
        store.total_supply = 0
        store.owner = owner
    }

    recv TokenMsg {
        GetSupply -> u256 uses (store) {
            store.get_supply()
        }

        Mint { to, amount } uses (mut store, ctx) {
            store.do_mint(to, amount)
        }
    }
}
```

## D. Effect mocking (unit-test mechanism logic with no EVM)

Source: `fe-lang/www` `testing/mocking.md`.

```fe
struct Counter {
    value: u256,
    limit: u256,
}

fn increment() -> bool uses (counter: mut Counter) {
    if counter.value >= counter.limit {
        return false
    }
    counter.value += 1
    true
}

fn current() -> u256 uses (counter: Counter) {
    counter.value
}

#[test]
fn test_increment_with_limit() {
    var counter = Counter { value: 0, limit: 2 }

    with (mut counter) {
        assert!(increment() == true)
        assert!(current() == 1)
        assert!(increment() == true)
        assert!(current() == 2)
        assert!(increment() == false)
        assert!(current() == 2)
    }
}
```

The same mechanism helps with time: make "now" an effect value (e.g. `struct Clock { now: Timestamp }`) in pure mechanism code. Tests provide any time; the contract handler builds it from `ctx.timestamp()`. *(Pattern suggestion: an inference from the docs, not an official example.)*

## E. Custom errors and revert-reason assertions

Source: `fe-lang/www` `testing/unit-testing.md`.

```fe
#[error]
pub struct InsufficientBalance {
    pub balance: u256,
    pub required: u256,
}

fn withdraw(balance: u256, amount: u256) -> u256 {
    if amount > balance {
        revert_error(InsufficientBalance { balance, required: amount })
    }
    balance - amount
}

// bytes4(keccak256("InsufficientBalance(uint256,uint256)")) = 0xcf479181
#[test(should_revert, selector = 0xcf479181)]
fn test_withdraw_too_much() {
    let _ = withdraw(balance: 100, amount: 200)
}

#[test(should_revert, panic = 0x11)]
fn test_overflow_panics() {
    let x: u8 = 255
    let _ = x + 1
}
```

## F. Exchange math building block (full-precision `mul_div`)

Source: `fe-lang/www` `examples/dex.md`. The guide says this is "not a deployable exchange".

```fe
use core::num::mul_div

fn quote(amount_in: u256, reserve_in: u256, reserve_out: u256, min_out: u256) -> u256 {
    assert!(amount_in > 0, "zero input")
    assert!(reserve_in > 0 && reserve_out > 0, "empty pool")
    let input_with_fee = amount_in * 997
    let amount_out = mul_div(input_with_fee, reserve_out, reserve_in * 1000 + input_with_fee)
    assert!(amount_out > 0, "output rounds to zero")
    assert!(amount_out >= min_out, "slippage limit")
    amount_out
}
```

The guide's next steps for a real swap: validate deadline and min output, collect input, "measure the actual balance change", update reserves, transfer output, emit an event, and handle fee-on-transfer tokens and reentrancy.

## G. Transient-storage reentrancy guard + fixed-slot placement

Source: `fe-lang/www` `contracts/storage.md`.

```fe
use std::abi::sol
use std::evm::TSlot

msg GuardMsg {
    #[selector = sol("enter()")]
    Enter -> u256,
}

pub contract Guarded {
    mut entered: TSlot<bool>,
    mut calls: u256,

    recv GuardMsg {
        Enter -> u256 uses (mut entered, mut calls) {
            assert!(!entered.value, "reentrant call")
            entered.value = true
            calls += 1
            entered.value = false
            calls
        }
    }
}
```

`#[slot(0x7a9f)] mut legacy: u256` pins a field (ERC-7201-style namespaces). Other fields skip the placed slots.

## H. Payable fallback in a bare `recv`

Source: `fe-lang/www` `contracts/receive-blocks.md`.

```fe
pub contract Donations {
    mut received: u256,

    recv {
        DonationMsg::Received {} -> u256 uses received { received }

        #[payable]
        _ uses (ctx: Ctx, mut received) {
            received += ctx.value().as_wei()
        }
    }
}
```

## I. Fixed point with scale in the type (organisers' "one codebase" example — reference only)

Source: `fe-lang/blog` `content/posts/fe-builders-challenge-project-ideas.md` (2026-10-29). The blog repo has **no license file**, so the code is not copied here. Key APIs it uses (all also in `fe-stdlib-index.md` / `core::fixed`):
- `use core::fixed::Wad`
- `const FEE: Wad = Wad::from_ratio(3, 1000)`
- `Wad::one()`, `Wad::from_int(1000)`, `Wad::from_raw(amount_in)`, `out.raw()`
- `Wad` arithmetic with `* / + -`
- contract fields typed `mut reserve_in: Wad`
- a free `pub fn amount_out(...)` shared by the contract and a native `simulate` loop (`var` counters, `while`).
