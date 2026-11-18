# AnyOrder Core (Fe) Implementation Plan

**Goal:** Build AnyOrder's Fe core — the pure clearing ingot, the batch-auction contract with its
test harnesses, the evidence suite and the sandwich contrast — test-first, on Fe 26.6.0.
**Architecture:** A two-ingot Fe workspace: `ingots/clearing` (`anyorder_clearing`, pure functions,
no effects) and `ingots/exchange` (`anyorder`: AnyOrder, TestToken, the baseline pool, test-only
clock twin and proxy actors), plus a stdlib-only Python reference that regenerates the test vectors
and a throwaway gas spike measured on Anvil.
**Tech Stack:** fe 26.6.0 (`fe --version` → `fe 26.6.0 (5b3f96a)`), EVM revision Osaka, Python 3.12
(stdlib only), Foundry anvil/cast 1.7.1 (gas spike only), Git Bash.
**Source spec:** docs/superpowers/specs/2026-11-18-anyorder-core-design.md

Conventions for every task in this plan:
- Every `Run:` line is a Git Bash command run from the repository root.
- Every code block is the exact file content, already compiled and run with fe 26.6.0 in the
  architect's scratch build; write it byte for byte (LF line endings).
- `fe fmt` does not walk the workspace root: it is always run per member (`ingots/clearing`,
  `ingots/exchange`).
- Cross-plan dependencies are written `Task <subsystem>:<N>`.

---

### Task 1: Walking skeleton: workspace, starter files, one pure function, one proxy-actor test

**Files:**
- Create: `.gitattributes`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `SUBMISSION.md`
- Create: `.github/workflows/ci.yml`
- Create: `fe.toml`
- Create: `ingots/clearing/fe.toml`
- Create: `ingots/clearing/src/lib.fe`
- Create: `ingots/clearing/src/types.fe`
- Create: `ingots/clearing/src/money.fe`
- Test: `ingots/clearing/src/money_tests.fe`
- Create: `ingots/exchange/fe.toml`
- Create: `ingots/exchange/src/lib.fe`
- Create: `ingots/exchange/src/token.fe`
- Test: `ingots/exchange/src/token_tests.fe`

**Effort:** medium
**Provides:** `struct Order { is_buy: bool, limit: u256, quantity: u256, owner: u256, owner_seq: u256 }`, `struct Clearing { traded: bool, price: u256, volume: u256, demand: u256, supply: u256 }`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`, `const UNIT: u256 = 10^18, const MAX_QUANTITY: u256 = 10^30`, `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)`
**Requires:** nothing from other tasks

- [ ] **Step 1: Line endings first (fe fmt --check fails on CRLF)**
Write `.gitattributes` with exactly this content:
```
# fe fmt --check rejects CRLF files, and the frozen ABI snapshots are compared byte for byte,
# so every text file is checked out with LF on every machine (this one has core.autocrlf=true).
* text=auto eol=lf
```

- [ ] **Step 2: Ignore build outputs and local gate state**
Write `.gitignore` with exactly this content:
```
# Build outputs
out/
spikes/gas/out/
# Web
web/node_modules/
web/dist/
web/public/deployment.json
# The design skill's finish-gate state: local only
web/.taste-skill/
# Python
__pycache__/
```

- [ ] **Step 3: Take the starter's LICENSE (Apache-2.0) and SUBMISSION.md template at f9d9aa9**
Run: `curl -fsSL https://raw.githubusercontent.com/fe-lang/builders-challenge-starter/f9d9aa92a03af82c2bbb0dc2e0810244eb13e686/LICENSE -o LICENSE && curl -fsSL https://raw.githubusercontent.com/fe-lang/builders-challenge-starter/f9d9aa92a03af82c2bbb0dc2e0810244eb13e686/SUBMISSION.md -o SUBMISSION.md && head -n 1 LICENSE`
Expected: exit 0; the first line is the Apache License header. (The starter's vault `src/` is not kept.)

- [ ] **Step 4: CI: the starter's workflow, FE_VERSION bumped to v26.6.0, fmt per member**
Write `.github/workflows/ci.yml` with exactly this content:
```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

env:
  # Any Fe release from 26.5.0 on is allowed for the contest; this build pins 26.6.0.
  FE_VERSION: v26.6.0

jobs:
  fe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install Fe
        run: |
          curl -fsSL https://raw.githubusercontent.com/argotorg/fe/master/feup/feup.sh | bash -s -- --version "$FE_VERSION" --no-modify-path
          echo "$HOME/.fe/bin" >> "$GITHUB_PATH"
      - run: fe --version
      # fe fmt does not walk a workspace root: check each member.
      - run: fe fmt --check ingots/clearing
      - run: fe fmt --check ingots/exchange
      - run: fe test
      - run: fe build
```

- [ ] **Step 5: Workspace root**
Write `fe.toml` with exactly this content:
```toml
[workspace]
name = "anyorder"
version = "0.1.0"
members = ["ingots/clearing", "ingots/exchange"]
exclude = ["target", "web", "spikes"]
```

- [ ] **Step 6: Clearing ingot manifest**
Write `ingots/clearing/fe.toml` with exactly this content:
```toml
[ingot]
name = "anyorder_clearing"
version = "0.1.0"
```

- [ ] **Step 7: Write the failing test for the pure money functions**
Write `ingots/clearing/src/money_tests.fe` with exactly this content:
```fe
use std::evm::wei
use ingot::{cost_ceil, proceeds_floor}

#[test]
fn money_rounds_buyers_up_and_sellers_down() {
    // 10 tokens + 1 base unit at 0.011 ETH per token is not a whole number of wei.
    let odd = 10_000_000_000_000_000_001
    let price = 11_000_000_000_000_000
    assert!(
        cost_ceil(quantity: odd, price) == wei(110_000_000_000_000_001),
    )
    assert!(
        proceeds_floor(quantity: odd, price) == wei(110_000_000_000_000_000),
    )
    // A whole number of wei rounds neither way.
    assert!(
        cost_ceil(quantity: 15_000_000_000_000_000_000, price) == wei(165_000_000_000_000_000),
    )
    assert!(
        proceeds_floor(quantity: 15_000_000_000_000_000_000, price) == wei(165_000_000_000_000_000),
    )
}
```

- [ ] **Step 8: Clearing ingot root (types and money only for now)**
Write `ingots/clearing/src/lib.fe` with exactly this content:
```fe
//! AnyOrder's clearing core: a uniform-price call auction as pure functions.
//!
//! Nothing in this ingot declares an effect. Clearing has no `Ctx`, so it
//! cannot read the caller, the block or the time; it touches no storage and
//! cannot call out. The only identity it reads is each order's recorded owner,
//! used only for the final tie-breaks (owner, then the owner's own order
//! sequence), which decide at most one base unit per order.

pub use types::{Clearing, Order, UNIT, MAX_QUANTITY}
pub use money::{cost_ceil, proceeds_floor}
```

- [ ] **Step 9: Clearing types**
Write `ingots/clearing/src/types.fe` with exactly this content:
```fe
/// Base units per whole token. Prices are quoted in wei per whole token.
pub const UNIT: u256 = 1_000_000_000_000_000_000

/// The largest order quantity, in base units (10^12 whole tokens). The
/// rationing arithmetic relies on it: quantity times remainder stays far
/// below 2^256 for any batch the contract accepts.
pub const MAX_QUANTITY: u256 = 1_000_000_000_000_000_000_000_000_000_000

/// One limit order as clearing sees it. `owner` is the recorded owner's
/// address word and `owner_seq` that owner's own order sequence; clearing
/// reads them only for the final tie-breaks of rationing.
pub struct Order {
    pub is_buy: bool,
    pub limit: u256,
    pub quantity: u256,
    pub owner: u256,
    pub owner_seq: u256,
}

impl Copy for Order {}

/// The outcome of price selection. `demand` and `supply` are the totals at
/// `price`: buys with limit at or above it, sells with limit at or below it.
pub struct Clearing {
    pub traded: bool,
    pub price: u256,
    pub volume: u256,
    pub demand: u256,
    pub supply: u256,
}

impl Copy for Clearing {}

impl Clearing {
    /// The batch does not trade: no price matches any volume.
    pub fn none() -> Clearing {
        Clearing { traded: false, price: 0, volume: 0, demand: 0, supply: 0 }
    }
}
```

- [ ] **Step 10: Run the test before the implementation exists**
Run: `fe test ingots/clearing`
Expected: FAIL — a compile error: `money` (or `cost_ceil`) is not found

- [ ] **Step 11: The pure money functions: no `uses`, rounding in the contract's favour**
Write `ingots/clearing/src/money.fe` with exactly this content:
```fe
use core::num::{mul_div, mul_div_ceil}
use std::evm::wei
use ingot::types::UNIT

/// What a buyer pays for `quantity` base units at `price` wei per token:
/// rounded up, so rounding always favours the contract.
pub fn cost_ceil(quantity: u256, price: u256) -> Wei {
    wei(mul_div_ceil(quantity, price, UNIT))
}

/// What a seller receives for `quantity` base units at `price` wei per token:
/// rounded down, so rounding always favours the contract.
pub fn proceeds_floor(quantity: u256, price: u256) -> Wei {
    wei(mul_div(quantity, price, UNIT))
}
```

- [ ] **Step 12: Exchange ingot manifest (path dependency on the clearing ingot)**
Write `ingots/exchange/fe.toml` with exactly this content:
```toml
[ingot]
name = "anyorder"
version = "0.1.0"

[dependencies]
anyorder_clearing = { path = "../clearing" }
```

- [ ] **Step 13: Exchange ingot root (the token only for now)**
Write `ingots/exchange/src/lib.fe` with exactly this content:
```fe
//! The AnyOrder exchange ingot: the `AnyOrder` contract, the `TestToken` it
//! trades, and the `ConstantProductPool` baseline for the sandwich contrast.
//! `AnyOrderTestClock`, `Trader` and `Reenterer` are test-only harnesses.

pub use token::{TestToken, TokenMsg}
```

- [ ] **Step 14: The proxy-actor test for the token (fails until token.fe exists)**
Write `ingots/exchange/src/token_tests.fe` with exactly this content:
```fe
//! TestToken basics, driven through a proxy actor so `ctx.caller()` is a
//! second address (the walking skeleton's multi-actor test).

use std::abi::sol
use ingot::token::{TestToken, TokenMsg}

msg HolderMsg {
    #[selector = sol("send(address,address,uint256)")]
    Send { token: Address, to: Address, amount: u256 } -> bool,
}

/// TEST ONLY: holds tokens and transfers them as itself.
pub contract TokenHolder uses (call: mut Call) {
    recv HolderMsg {
        Send { token, to, amount } -> bool uses (mut call) {
            call.call(
                addr: token,
                gas: 100000,
                value: Wei::zero(),
                message: TokenMsg::Transfer { to, amount },
            )
        }
    }
}

fn balance_of(token: Address, account: Address) -> u256 uses (evm: mut Evm) {
    evm.call(
        addr: token,
        gas: 100000,
        value: Wei::zero(),
        message: TokenMsg::BalanceOf { account },
    )
}

#[test]
fn token_proxy_actor_transfers_as_itself() uses (evm: mut Evm) {
    let token = evm.create2<TestToken>(value: Wei::zero(), args: (), salt: 0)
    let holder = evm.create2<TokenHolder>(value: Wei::zero(), args: (), salt: 1)
    let minted: bool = evm
        .call(
            addr: token,
            gas: 200000,
            value: Wei::zero(),
            message: TokenMsg::Mint { to: holder, amount: 100 },
        )
    assert!(minted)
    let receiver = Address::new(0xbeef)
    let sent: bool = evm
        .call(
            addr: holder,
            gas: 300000,
            value: Wei::zero(),
            message: HolderMsg::Send { token, to: receiver, amount: 40 },
        )
    assert!(sent)
    assert!(balance_of(token, account: holder) == 60)
    assert!(balance_of(token, account: receiver) == 40)
}

#[test(should_revert)]
fn token_transfer_beyond_balance_reverts() uses (evm: mut Evm) {
    let token = evm.create2<TestToken>(value: Wei::zero(), args: (), salt: 0)
    let holder = evm.create2<TokenHolder>(value: Wei::zero(), args: (), salt: 1)
    // The holder never received any tokens, so sending one reverts.
    let _: bool = evm
        .call(
            addr: holder,
            gas: 300000,
            value: Wei::zero(),
            message: HolderMsg::Send { token, to: holder, amount: 1 },
        )
}
```

- [ ] **Step 15: TestToken**
Write `ingots/exchange/src/token.fe` with exactly this content:
```fe
//! TestToken: a plain 18-decimal ERC20 with an owner-only mint, for the demo
//! and the tests. Adapted from the Fe guide's ERC20 example and the
//! `erc20.fe` test fixture of argotorg/fe v26.6.0 (Apache-2.0).

use std::abi::sol
use std::evm::StorageMap

pub msg TokenMsg {
    #[selector = sol("decimals()")]
    Decimals -> u8,
    #[selector = sol("totalSupply()")]
    TotalSupply -> u256,
    #[selector = sol("balanceOf(address)")]
    BalanceOf { account: Address } -> u256,
    #[selector = sol("allowance(address,address)")]
    Allowance { owner: Address, spender: Address } -> u256,
    #[selector = sol("transfer(address,uint256)")]
    Transfer { to: Address, amount: u256 } -> bool,
    #[selector = sol("approve(address,uint256)")]
    Approve { spender: Address, amount: u256 } -> bool,
    #[selector = sol("transferFrom(address,address,uint256)")]
    TransferFrom { from: Address, to: Address, amount: u256 } -> bool,
    #[selector = sol("mint(address,uint256)")]
    Mint { to: Address, amount: u256 } -> bool,
}

#[event]
pub struct Transfer {
    #[indexed]
    pub from: Address,
    #[indexed]
    pub to: Address,
    pub value: u256,
}

#[event]
pub struct Approval {
    #[indexed]
    pub owner: Address,
    #[indexed]
    pub spender: Address,
    pub value: u256,
}

pub struct Ledger {
    pub minter: Address,
    pub total_supply: u256,
    pub balances: StorageMap<Address, u256>,
    pub allowances: StorageMap<(Address, Address), u256>,
}

fn move_tokens(from: Address, to: Address, amount: u256)
uses (ledger: mut Ledger, log: mut Log)
{
    let have = ledger.balances.get(key: from)
    assert!(have >= amount, "balance too low")
    ledger.balances.set(key: from, value: have - amount)
    ledger.balances.set(key: to, value: ledger.balances.get(key: to) + amount)
    log.emit(Transfer { from, to, value: amount })
}

pub contract TestToken uses (ctx: Ctx, log: mut Log) {
    mut ledger: Ledger,

    init() uses (ctx, mut ledger) { ledger.minter = ctx.caller() }

    recv TokenMsg {
        Decimals -> u8 {
            18
        }

        TotalSupply -> u256 uses (ledger) {
            ledger.total_supply
        }

        BalanceOf { account } -> u256 uses (ledger) {
            ledger.balances.get(key: account)
        }

        Allowance { owner, spender } -> u256 uses (ledger) {
            ledger.allowances.get(key: (owner, spender))
        }

        Transfer { to, amount } -> bool uses (ctx, mut ledger, mut log) {
            move_tokens(from: ctx.caller(), to, amount)
            true
        }

        Approve { spender, amount } -> bool uses (ctx, mut ledger, mut log) {
            ledger.allowances.set(key: (ctx.caller(), spender), value: amount)
            log.emit(Approval { owner: ctx.caller(), spender, value: amount })
            true
        }

        TransferFrom { from, to, amount } -> bool
        uses (ctx, mut ledger, mut log)
        {
            let allowed = ledger.allowances.get(key: (from, ctx.caller()))
            assert!(allowed >= amount, "allowance too low")
            ledger.allowances.set(key: (from, ctx.caller()), value: allowed - amount)
            move_tokens(from, to, amount)
            true
        }

        Mint { to, amount } -> bool uses (ctx, mut ledger, mut log) {
            assert!(ctx.caller() == ledger.minter, "only the minter")
            ledger.total_supply += amount
            ledger.balances.set(key: to, value: ledger.balances.get(key: to) + amount)
            log.emit(Transfer { from: Address::new(0), to, value: amount })
            true
        }
    }
}
```

- [ ] **Step 16: Format check per member, the whole workspace's tests, and a build**
Also expect `fe build` to print `Wrote ...out/TestToken.bin` and exit 0.
Run: `fe fmt --check ingots/clearing && fe fmt --check ingots/exchange && fe test && fe build`
Expected: PASS — `test result: ok. 3 passed; 0 failed`

- [ ] **Step 17: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `chore(core): walking skeleton on fe 26.6.0 (workspace, starter files, money, token)`

---

### Task 2: Gas spike: measure clearing on capped Anvil and set the order cap

**Files:**
- Create: `spikes/gas/fe.toml`
- Create: `spikes/gas/src/lib.fe`
- Create: `scripts/gas-spike.sh`
- Create: `deploy/params.json`
- Create: `docs/gas/spike.md`

**Depends on:** Task 1
**Effort:** medium
**Provides:** `deploy/params.json { maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice }`, `docs/gas/spike.md`
**Requires:** nothing from other tasks

- [ ] **Step 1: Prerequisites**
`anvil` and `cast` (Foundry 1.7.1) on PATH; `fe` 26.6.0. The script starts its own Anvil on port 8547 and stops it.

- [ ] **Step 2: The throwaway prototype ingot manifest (not a workspace member)**
Write `spikes/gas/fe.toml` with exactly this content:
```toml
[ingot]
name = "gas_spike"
version = "0.1.0"
```

- [ ] **Step 3: The prototype: AnyOrder's storage shape, sort-and-sweep, worst-case fill writes**
Write `spikes/gas/src/lib.fe` with exactly this content:
```fe
//! THROWAWAY GAS SPIKE. Not part of AnyOrder and not a workspace member.
//! `GasSpike` stores orders in AnyOrder's planned storage shape, then clears a
//! batch the way AnyOrder will: load every order, sort, sweep the candidate
//! prices, write each order's fill. scripts/gas-spike.sh measures `clear()` on
//! Anvil with Osaka's per-transaction gas cap enforced.

use core::ops::{Eq, Ord}
use core::ptr::MemVec
use std::abi::sol
use std::evm::StorageMap

struct Slot {
    owner: Address,
    is_buy: bool,
    limit: u256,
    quantity: u256,
    owner_seq: u256,
    locked: Wei,
    filled: u256,
    claimed: bool,
}

impl Copy for Slot {}

struct Level { limit: u256, quantity: u256 }

impl Copy for Level {}

impl Eq for Level {
    fn eq(self, _ other: Level) -> bool {
        self.limit == other.limit
    }
}

impl Ord for Level {
    fn lt(self, _ other: Level) -> bool {
        self.limit < other.limit
    }
    fn le(self, _ other: Level) -> bool {
        self.limit <= other.limit
    }
    fn gt(self, _ other: Level) -> bool {
        self.limit > other.limit
    }
    fn ge(self, _ other: Level) -> bool {
        self.limit >= other.limit
    }
}

pub struct Spike { count: u256, orders: StorageMap<(u256, u256), Slot> }

pub msg SpikeMsg {
    #[selector = sol("place(bool,uint256,uint256)")]
    Place { is_buy: bool, limit: u256, quantity: u256 } -> u256,
    #[selector = sol("clear()")]
    Clear -> u256,
}

fn place(owner: Address, is_buy: bool, limit: u256, quantity: u256) -> u256
uses (spike: mut Spike)
{
    let index = spike.count
    spike
        .orders
        .set(
            key: (0, index),
            value: Slot {
                owner,
                is_buy,
                limit,
                quantity,
                owner_seq: index,
                locked: Wei::zero(),
                filled: 0,
                claimed: false,
            },
        )
    spike.count = index + 1
    index
}

fn clear() -> u256 uses (spike: mut Spike) {
    var buys = MemVec<Level>::new()
    var sells = MemVec<Level>::new()
    var prices = MemVec<u256>::new()
    var demand: u256 = 0
    var i: u256 = 0
    while i < spike.count {
        let o = spike.orders.get(key: (0, i))
        if o.is_buy {
            buys.push(Level { limit: o.limit, quantity: o.quantity })
            demand += o.quantity
        } else {
            sells.push(Level { limit: o.limit, quantity: o.quantity })
        }
        prices.push(o.limit)
        i += 1
    }
    buys.sort()
    sells.sort()
    prices.sort()
    var supply: u256 = 0
    var nb: usize = 0
    var ns: usize = 0
    var best_volume: u256 = 0
    var best_price: u256 = 0
    var k: usize = 0
    while k < prices.len() {
        let p = prices[k]
        while nb < buys.len() && buys[nb].limit < p {
            demand -= buys[nb].quantity
            nb += 1
        }
        while ns < sells.len() && sells[ns].limit <= p {
            supply += sells[ns].quantity
            ns += 1
        }
        let volume = if demand < supply { demand } else { supply }
        if volume > best_volume {
            best_volume = volume
            best_price = p
        }
        k += 1
    }
    // Worst case for storage: every order's fill is written.
    i = 0
    while i < spike.count {
        var o = spike.orders.get(key: (0, i))
        o.filled = o.quantity / 2 + 1
        spike.orders.set(key: (0, i), value: o)
        i += 1
    }
    best_price
}

pub contract GasSpike uses (ctx: Ctx) {
    mut spike: Spike,

    recv SpikeMsg {
        Place { is_buy, limit, quantity } -> u256
        uses (ctx, mut spike)
        {
            place(owner: ctx.caller(), is_buy, limit, quantity)
        }

        Clear -> u256 uses (mut spike) {
            clear()
        }
    }
}
```

- [ ] **Step 4: The measurement script (quoted paths, unlocked dev accounts, no key)**
Write `scripts/gas-spike.sh` with exactly this content:
```bash
#!/usr/bin/env bash
# Gas spike: measures the prototype clearing's gas on a local Anvil chain with
# Osaka's per-transaction gas cap enforced, for N = 10, 50 and 100 orders, and
# sets the per-batch order cap and the demo batch size from the measurement.
#
#   bash scripts/gas-spike.sh
#
# Writes deploy/params.json and docs/gas/spike.md. Last line: SPIKE: PASS ...
# Uses only Anvil's unlocked public dev accounts: no key is read or stored.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=8547
RPC="http://127.0.0.1:${PORT}"
CAP=16777216
BUDGET=8388608   # half the cap: headroom for the full clearing code
SIZES=(10 50 100)

fe build "${ROOT}/spikes/gas" --out-dir "${ROOT}/spikes/gas/out" > /dev/null

anvil --hardfork osaka --enable-tx-gas-limit --port "${PORT}" --silent > /dev/null 2>&1 &
ANVIL_PID=$!
trap 'kill "${ANVIL_PID}" 2> /dev/null || true' EXIT
for _ in $(seq 1 50); do
  if cast chain-id --rpc-url "${RPC}" > /dev/null 2>&1; then break; fi
  sleep 0.2
done

mapfile -t ACCOUNTS < <(cast rpc --rpc-url "${RPC}" eth_accounts | tr -d '[]" ' | tr ',' '\n')
DEPLOYER="${ACCOUNTS[0]}"
BYTECODE="0x$(cat "${ROOT}/spikes/gas/out/GasSpike.bin")"

field() { grep -o "\"$1\":\"[^\"]*\"" | head -n 1 | cut -d '"' -f 4; }

declare -A GAS
for n in "${SIZES[@]}"; do
  spike="$(cast send --rpc-url "${RPC}" --unlocked --from "${DEPLOYER}" --create "${BYTECODE}" --json | field contractAddress)"
  for ((k = 0; k < n; k++)); do
    trader="${ACCOUNTS[$((1 + k % 9))]}"
    limit=$(( (9 + (k * 7) % 6) * 1000000000000000 + k ))
    quantity="$(( 1 + (k * 3) % 5 ))000000000000000000"
    side=false
    if (( k % 2 == 0 )); then side=true; fi
    cast send --rpc-url "${RPC}" --unlocked --from "${trader}" "${spike}" "place(bool,uint256,uint256)" "${side}" "${limit}" "${quantity}" > /dev/null
  done
  receipt="$(cast send --rpc-url "${RPC}" --unlocked --from "${DEPLOYER}" "${spike}" "clear()" --gas-limit "${CAP}" --json 2> /dev/null || true)"
  status="$(printf '%s' "${receipt}" | field status)"
  if [[ "${status}" == "0x1" ]]; then
    GAS[$n]=$(( $(printf '%s' "${receipt}" | field gasUsed) ))
  else
    GAS[$n]=-1
  fi
  echo "N=${n} clear gas=${GAS[$n]}"
done

max_orders=0
for n in "${SIZES[@]}"; do
  if (( GAS[$n] > 0 && GAS[$n] <= BUDGET )); then max_orders=$n; fi
done
if (( max_orders == 0 )); then
  echo "SPIKE: FAIL (even N=${SIZES[0]} exceeds the ${BUDGET} gas budget)"
  exit 1
fi
demo=$(( max_orders < 20 ? max_orders : 20 ))

mkdir -p "${ROOT}/deploy" "${ROOT}/docs/gas"
cat > "${ROOT}/deploy/params.json" << JSON
{
  "maxOrders": ${max_orders},
  "demoBatchSize": ${demo},
  "batchSeconds": 120,
  "minQuantity": "1000000000000000",
  "maxPrice": "1000000000000000000000",
  "measuredBy": "scripts/gas-spike.sh",
  "clearGas": { "10": ${GAS[10]}, "50": ${GAS[50]}, "100": ${GAS[100]} }
}
JSON

cat > "${ROOT}/docs/gas/spike.md" << MD
# Gas spike: clearing cost on Anvil (Osaka cap enforced)

Measured by \`bash scripts/gas-spike.sh\` on \`anvil --hardfork osaka --enable-tx-gas-limit\`
(per-transaction cap ${CAP} gas). The prototype in \`spikes/gas\` stores orders in
AnyOrder's planned storage shape, then clears like AnyOrder: it loads every order,
sorts, sweeps the candidate prices and writes every order's fill (the worst case
for storage writes).

| Orders in the batch | \`clear()\` gas | Share of the cap |
|---:|---:|---:|
| 10 | ${GAS[10]} | $(( GAS[10] * 100 / CAP ))% |
| 50 | ${GAS[50]} | $(( GAS[50] * 100 / CAP ))% |
| 100 | ${GAS[100]} | $(( GAS[100] * 100 / CAP ))% |

Rule: the per-batch order cap is the largest measured N whose clearing used at most
${BUDGET} gas (half the cap, leaving headroom for the full clearing code), and the
demo batch size is the smaller of that cap and 20.

Result: \`maxOrders = ${max_orders}\`, \`demoBatchSize = ${demo}\` (in \`deploy/params.json\`).
The real contract's full batch is measured again by the dApp's end-to-end test.
MD

echo "SPIKE: PASS maxOrders=${max_orders} demoBatchSize=${demo}"
```

- [ ] **Step 5: Run the spike; it writes deploy/params.json and docs/gas/spike.md**
The architect measured 409,402 / 2,161,907 / 4,426,468 gas for N = 10 / 50 / 100 with this exact code. If a number differs, report it; the rule in the script decides, not this text.
Run: `bash scripts/gas-spike.sh`
Expected: PASS — `SPIKE: PASS maxOrders=100 demoBatchSize=20`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(core): gas spike on capped Anvil sets maxOrders and demoBatchSize`

---

### Task 3: Price selection (select_price) and the brute-force oracle

**Files:**
- Modify: `ingots/clearing/src/lib.fe`
- Create: `ingots/clearing/src/select.fe`
- Create: `ingots/clearing/src/oracle.fe`
- Test: `ingots/clearing/src/select_tests.fe`

**Depends on:** Task 1
**Effort:** xhigh
**Model tier:** top
**Provides:** `select_price(_ orders: MemVec<Order>) -> Clearing`, `oracle::{demand_at, supply_at, volume_at, max_volume_between}`
**Requires:** `struct Order { is_buy: bool, limit: u256, quantity: u256, owner: u256, owner_seq: u256 }`, `struct Clearing { traded: bool, price: u256, volume: u256, demand: u256, supply: u256 }`

- [ ] **Step 1: Context**
Upstream types (ingots/clearing/src/types.fe, Task 1): `struct Order { is_buy: bool, limit: u256, quantity: u256, owner: u256, owner_seq: u256 }`, `struct Clearing { traded: bool, price: u256, volume: u256, demand: u256, supply: u256 }`, `Clearing::none()`. The rule (core spec section 5): maximise min(D, S), then minimise |D - S|, then the highest remaining price with D >= S, else the lowest.

- [ ] **Step 2: The oracle used by the tests (definition-level demand and supply)**
Write `ingots/clearing/src/oracle.fe` with exactly this content:
```fe
//! A brute-force oracle for the property tests: demand and supply at any
//! price, computed directly from the definition.

use core::ptr::MemVec
use ingot::types::Order

/// Total quantity of buys whose limit is at least `price`.
pub fn demand_at(_ orders: MemVec<Order>, _ price: u256) -> u256 {
    var total: u256 = 0
    for o in orders {
        if o.is_buy && o.limit >= price {
            total += o.quantity
        }
    }
    total
}

/// Total quantity of sells whose limit is at most `price`.
pub fn supply_at(_ orders: MemVec<Order>, _ price: u256) -> u256 {
    var total: u256 = 0
    for o in orders {
        if !o.is_buy && o.limit <= price {
            total += o.quantity
        }
    }
    total
}

/// The matched volume min(demand, supply) at `price`.
pub fn volume_at(_ orders: MemVec<Order>, _ price: u256) -> u256 {
    let d = demand_at(orders, price)
    let s = supply_at(orders, price)
    if d < s { d } else { s }
}

/// The largest matched volume over every integer price in `[low, high]`.
pub fn max_volume_between(_ orders: MemVec<Order>, low: u256, high: u256) -> u256 {
    var best: u256 = 0
    var p = low
    while p <= high {
        let v = volume_at(orders, p)
        if v > best { best = v }
        p += 1
    }
    best
}
```

- [ ] **Step 3: Write the failing tests**
Write `ingots/clearing/src/select_tests.fe` with exactly this content:
```fe
use core::ptr::MemVec
use ingot::{Order, select_price}
use ingot::oracle::max_volume_between

fn o(_ is_buy: bool, _ limit: u256, _ quantity: u256, _ owner: u256) -> Order {
    Order { is_buy, limit, quantity, owner, owner_seq: 0 }
}

#[test]
fn select_simple_cross_takes_the_highest_tie_with_demand_at_least_supply() {
    var book = MemVec<Order>::new()
    book.push(o(true, 10, 5, 1))
    book.push(o(false, 8, 5, 2))
    let c = select_price(book)
    assert!(c.traded && c.price == 10 && c.volume == 5)
}

#[test]
fn select_no_cross_does_not_trade() {
    var book = MemVec<Order>::new()
    book.push(o(true, 7, 5, 1))
    book.push(o(false, 9, 5, 2))
    let c = select_price(book)
    assert!(!c.traded && c.volume == 0)
}

#[test]
fn select_excess_supply_takes_the_lowest_tie() {
    var book = MemVec<Order>::new()
    book.push(o(false, 11, 10, 1))
    book.push(o(true, 12, 4, 2))
    let c = select_price(book)
    assert!(c.traded && c.price == 11 && c.volume == 4)
    assert!(c.demand == 4 && c.supply == 10)
}

#[test]
fn select_strictly_better_buy_is_never_left_needing_rationing() {
    // Lowest-price tie-breaking would pick 10 and leave the buy at 12 short.
    var book = MemVec<Order>::new()
    book.push(o(true, 12, 10, 1))
    book.push(o(false, 8, 3, 2))
    book.push(o(false, 10, 3, 3))
    let c = select_price(book)
    assert!(c.price == 12 && c.volume == 6)
}

#[test]
fn select_mixed_sign_tie_takes_the_last_excess_demand_price() {
    var book = MemVec<Order>::new()
    book.push(o(true, 10, 3, 1))
    book.push(o(false, 5, 1, 2))
    book.push(o(true, 1, 7, 3))
    book.push(o(false, 2, 6, 4))
    book.push(o(false, 11, 2, 5))
    book.push(o(false, 6, 2, 6))
    book.push(o(true, 8, 5, 7))
    book.push(o(false, 8, 6, 8))
    book.push(o(true, 7, 6, 9))
    book.push(o(true, 8, 1, 10))
    book.push(o(true, 12, 4, 11))
    book.push(o(false, 0, 4, 11))
    let c = select_price(book)
    assert!(c.price == 7 && c.volume == 13)
    assert!(c.volume == max_volume_between(book, low: 0, high: 13))
}
```

- [ ] **Step 4: Run them**
Run: `fe test ingots/clearing`
Expected: FAIL — a compile error: `select_price` is not found

- [ ] **Step 5: Implement select_price: sort, then one ascending sweep**
Write `ingots/clearing/src/select.fe` with exactly this content:
```fe
use core::ops::{Eq, Ord}
use core::ptr::MemVec
use ingot::types::{Clearing, Order}

// A resting quantity at one limit price, ordered by the limit.
struct Level { limit: u256, quantity: u256 }

impl Copy for Level {}

impl Eq for Level {
    fn eq(self, _ other: Level) -> bool {
        self.limit == other.limit && self.quantity == other.quantity
    }
}

impl Ord for Level {
    fn lt(self, _ other: Level) -> bool {
        self.limit < other.limit
    }
    fn le(self, _ other: Level) -> bool {
        self.limit <= other.limit
    }
    fn gt(self, _ other: Level) -> bool {
        self.limit > other.limit
    }
    fn ge(self, _ other: Level) -> bool {
        self.limit >= other.limit
    }
}

fn smaller(_ a: u256, _ b: u256) -> u256 {
    if a < b { a } else { b }
}

fn gap(_ a: u256, _ b: u256) -> u256 {
    if a >= b { a - b } else { b - a }
}

/// Chooses the uniform clearing price of a batch. The candidates are the
/// distinct limit prices. Among them it maximises the matched volume
/// min(demand, supply), then minimises the imbalance |demand - supply|, then
/// takes the highest remaining price at which demand is at least supply, or,
/// if there is none, the lowest remaining price. The result depends only on
/// the multiset of orders, never on their position in `orders`.
pub fn select_price(_ orders: MemVec<Order>) -> Clearing {
    var buys = MemVec<Level>::new()
    var sells = MemVec<Level>::new()
    var prices = MemVec<u256>::new()
    var demand: u256 = 0
    for o in orders {
        if o.is_buy {
            buys.push(Level { limit: o.limit, quantity: o.quantity })
            demand += o.quantity
        } else {
            sells.push(Level { limit: o.limit, quantity: o.quantity })
        }
        prices.push(o.limit)
    }
    buys.sort()
    sells.sort()
    prices.sort()

    var supply: u256 = 0
    var next_buy: usize = 0
    var next_sell: usize = 0
    var found = false
    var best_volume: u256 = 0
    var best_gap: u256 = 0
    var low_price: u256 = 0
    var low_demand: u256 = 0
    var low_supply: u256 = 0
    var has_high = false
    var high_price: u256 = 0
    var high_demand: u256 = 0
    var high_supply: u256 = 0

    var i: usize = 0
    while i < prices.len() {
        let p = prices[i]
        if i == 0 || p != prices[i - 1] {
            // Demand at p: buys whose limit is at least p.
            while next_buy < buys.len() && buys[next_buy].limit < p {
                demand -= buys[next_buy].quantity
                next_buy += 1
            }
            // Supply at p: sells whose limit is at most p.
            while next_sell < sells.len() && sells[next_sell].limit <= p {
                supply += sells[next_sell].quantity
                next_sell += 1
            }
            let volume = smaller(demand, supply)
            let imbalance = gap(demand, supply)
            if volume > 0 {
                if !found
                    || volume > best_volume
                    || (volume == best_volume && imbalance < best_gap) {
                    found = true
                    best_volume = volume
                    best_gap = imbalance
                    low_price = p
                    low_demand = demand
                    low_supply = supply
                    has_high = demand >= supply
                    high_price = p
                    high_demand = demand
                    high_supply = supply
                } else if volume == best_volume && imbalance == best_gap && demand >= supply {
                    has_high = true
                    high_price = p
                    high_demand = demand
                    high_supply = supply
                }
            }
        }
        i += 1
    }

    if !found {
        return Clearing::none()
    }
    if has_high {
        return Clearing {
            traded: true,
            price: high_price,
            volume: best_volume,
            demand: high_demand,
            supply: high_supply,
        }
    }
    Clearing {
        traded: true,
        price: low_price,
        volume: best_volume,
        demand: low_demand,
        supply: low_supply,
    }
}
```

- [ ] **Step 6: Export it from the ingot root**
Write `ingots/clearing/src/lib.fe` with exactly this content:
```fe
//! AnyOrder's clearing core: a uniform-price call auction as pure functions.
//!
//! Nothing in this ingot declares an effect. Clearing has no `Ctx`, so it
//! cannot read the caller, the block or the time; it touches no storage and
//! cannot call out. The only identity it reads is each order's recorded owner,
//! used only for the final tie-breaks (owner, then the owner's own order
//! sequence), which decide at most one base unit per order.

pub use types::{Clearing, Order, UNIT, MAX_QUANTITY}
pub use money::{cost_ceil, proceeds_floor}
pub use select::select_price
```

- [ ] **Step 7: Format and run the clearing tests**
Run: `fe fmt --check ingots/clearing && fe test ingots/clearing`
Expected: PASS — `test result: ok. 6 passed; 0 failed`

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(core): uniform clearing price selection with order-content-only tie-breaks`

---

### Task 4: Rationing (allocate): only the long side at exactly the price

**Files:**
- Modify: `ingots/clearing/src/lib.fe`
- Create: `ingots/clearing/src/ration.fe`
- Test: `ingots/clearing/src/ration_tests.fe`

**Depends on:** Task 3
**Effort:** xhigh
**Model tier:** top
**Provides:** `allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256>`
**Requires:** `struct Order { is_buy: bool, limit: u256, quantity: u256, owner: u256, owner_seq: u256 }`, `struct Clearing { traded: bool, price: u256, volume: u256, demand: u256, supply: u256 }`, `select_price(_ orders: MemVec<Order>) -> Clearing`

- [ ] **Step 1: Context**
Upstream: `select_price(_ orders: MemVec<Order>) -> Clearing` (Task 3), `struct Order { is_buy: bool, limit: u256, quantity: u256, owner: u256, owner_seq: u256 }`, `struct Clearing { traded: bool, price: u256, volume: u256, demand: u256, supply: u256 }` (Task 1). Rationing (core spec section 5): strictly better orders and the short side fill in full; marginal orders share `marginal - |D - S|` pro rata, rounded down; leftover units by largest remainder, then larger quantity, lower owner, earlier owner_seq.

- [ ] **Step 2: Write the failing tests**
Write `ingots/clearing/src/ration_tests.fe` with exactly this content:
```fe
use core::ptr::MemVec
use ingot::{Order, allocate, select_price}

fn o(_ is_buy: bool, _ limit: u256, _ quantity: u256, _ owner: u256, _ owner_seq: u256) -> Order {
    Order { is_buy, limit, quantity, owner, owner_seq }
}

#[test]
fn ration_marginal_buys_share_pro_rata_and_the_largest_remainder_gets_the_leftover() {
    var book = MemVec<Order>::new()
    book.push(o(false, 8, 10, 4, 0))
    book.push(o(true, 9, 7, 1, 0))
    book.push(o(true, 9, 5, 2, 0))
    book.push(o(true, 9, 3, 3, 0))
    let fills = allocate(book, select_price(book))
    // 10 units for 15 wanted: 4.67, 3.33, 2.00 -> 4, 3, 2, and the leftover unit to 7's remainder.
    assert!(
        fills[0] == 10 && fills[1] == 5 && fills[2] == 3 && fills[3] == 2,
    )
}

#[test]
fn ration_equal_remainders_go_to_the_lower_owner() {
    var book = MemVec<Order>::new()
    book.push(o(false, 5, 2, 8, 0))
    book.push(o(true, 5, 1, 9, 0))
    book.push(o(true, 5, 1, 4, 0))
    book.push(o(true, 5, 1, 7, 0))
    let fills = allocate(book, select_price(book))
    assert!(fills[1] == 0 && fills[2] == 1 && fills[3] == 1)
}

#[test]
fn ration_one_owners_identical_orders_go_by_its_own_sequence() {
    var book = MemVec<Order>::new()
    book.push(o(false, 5, 1, 8, 0))
    book.push(o(true, 5, 1, 3, 1))
    book.push(o(true, 5, 1, 3, 0))
    let fills = allocate(book, select_price(book))
    assert!(fills[1] == 0 && fills[2] == 1)
}

#[test]
fn ration_strictly_better_and_short_side_fill_in_full() {
    var book = MemVec<Order>::new()
    book.push(o(true, 12, 10, 1, 0))
    book.push(o(false, 8, 3, 2, 0))
    book.push(o(false, 10, 3, 3, 0))
    let fills = allocate(book, select_price(book))
    assert!(fills[0] == 6 && fills[1] == 3 && fills[2] == 3)
}

#[test]
fn ration_no_trade_fills_nothing() {
    var book = MemVec<Order>::new()
    book.push(o(true, 7, 5, 1, 0))
    book.push(o(false, 9, 5, 2, 0))
    let fills = allocate(book, select_price(book))
    assert!(fills.len() == 2 && fills[0] == 0 && fills[1] == 0)
}
```

- [ ] **Step 3: Run them**
Run: `fe test ingots/clearing`
Expected: FAIL — a compile error: `allocate` is not found

- [ ] **Step 4: Implement allocate**
Write `ingots/clearing/src/ration.fe` with exactly this content:
```fe
use core::ops::{Eq, Ord}
use core::ptr::MemVec
use ingot::types::{Clearing, Order}

// A marginal order's claim on the rationing remainder. Sorting puts the order
// that gets the next leftover unit first: the largest fractional remainder,
// then the larger quantity, then the lower owner, then that owner's earlier
// order.
struct Rank { index: usize, remainder: u256, quantity: u256, owner: u256, owner_seq: u256 }

impl Copy for Rank {}

impl Eq for Rank {
    fn eq(self, _ other: Rank) -> bool {
        self.remainder == other.remainder
            && self.quantity == other.quantity
            && self.owner == other.owner
            && self.owner_seq == other.owner_seq
    }
}

impl Ord for Rank {
    fn lt(self, _ other: Rank) -> bool {
        if self.remainder != other.remainder {
            return self.remainder > other.remainder
        }
        if self.quantity != other.quantity {
            return self.quantity > other.quantity
        }
        if self.owner != other.owner {
            return self.owner < other.owner
        }
        self.owner_seq < other.owner_seq
    }
    fn le(self, _ other: Rank) -> bool {
        !other.lt(self)
    }
    fn gt(self, _ other: Rank) -> bool {
        other.lt(self)
    }
    fn ge(self, _ other: Rank) -> bool {
        !self.lt(other)
    }
}

/// The filled quantity of every order, in the order of `orders`, at the price
/// `clearing` chose. Orders strictly better than the price, and every order of
/// the short side that can trade, fill in full. Only the long side's orders at
/// exactly the price are rationed: pro rata by quantity, rounded down, with the
/// leftover units handed out one each in `Rank` order.
pub fn allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256> {
    var fills = MemVec<u256>::new()
    if !clearing.traded {
        for _ in orders {
            fills.push(0)
        }
        return fills
    }
    let p = clearing.price
    let buyers_long = clearing.demand >= clearing.supply
    let excess = if buyers_long {
        clearing.demand - clearing.supply
    } else {
        clearing.supply - clearing.demand
    }

    var marginal: u256 = 0
    for o in orders {
        if o.is_buy == buyers_long && o.limit == p {
            marginal += o.quantity
        }
    }
    // The selection rule guarantees marginal >= excess: the orders strictly
    // better than the price always fit. Checked arithmetic reverts otherwise.
    let share = marginal - excess

    var ranks = MemVec<Rank>::new()
    var handed: u256 = 0
    var index: usize = 0
    for o in orders {
        var fill: u256 = 0
        let long_side = o.is_buy == buyers_long
        let better = if o.is_buy { o.limit > p } else { o.limit < p }
        if better || (o.limit == p && !long_side) {
            fill = o.quantity
        } else if o.limit == p {
            fill = o.quantity * share / marginal
            handed += fill
            ranks
                .push(
                    Rank {
                        index,
                        remainder: o.quantity * share % marginal,
                        quantity: o.quantity,
                        owner: o.owner,
                        owner_seq: o.owner_seq,
                    },
                )
        }
        fills.push(fill)
        index += 1
    }

    ranks.sort()
    var leftover = share - handed
    var k: usize = 0
    while leftover > 0 {
        let at = ranks[k].index
        fills.set(at, fills[at] + 1)
        leftover -= 1
        k += 1
    }
    fills
}
```

- [ ] **Step 5: Export it**
Write `ingots/clearing/src/lib.fe` with exactly this content:
```fe
//! AnyOrder's clearing core: a uniform-price call auction as pure functions.
//!
//! Nothing in this ingot declares an effect. Clearing has no `Ctx`, so it
//! cannot read the caller, the block or the time; it touches no storage and
//! cannot call out. The only identity it reads is each order's recorded owner,
//! used only for the final tie-breaks (owner, then the owner's own order
//! sequence), which decide at most one base unit per order.

pub use types::{Clearing, Order, UNIT, MAX_QUANTITY}
pub use money::{cost_ceil, proceeds_floor}
pub use select::select_price
pub use ration::allocate
```

- [ ] **Step 6: Format and run the clearing tests**
Run: `fe fmt --check ingots/clearing && fe test ingots/clearing`
Expected: PASS — `test result: ok. 11 passed; 0 failed`

- [ ] **Step 7: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(core): pro-rata rationing at the marginal price with largest-remainder units`

---

### Task 5: Python exact-rational reference and generated test vectors

**Files:**
- Create: `ref/clearing_ref.py`
- Create: `ingots/clearing/src/vectors.fe`
- Modify: `.github/workflows/ci.yml`

**Depends on:** Task 4
**Effort:** xhigh
**Model tier:** top
**Provides:** `python ref/clearing_ref.py --write | --check | --selftest`, `vector_* tests (17) in ingots/clearing/src/vectors.fe`
**Requires:** `select_price(_ orders: MemVec<Order>) -> Clearing`, `allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256>`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`

- [ ] **Step 1: Context**
The reference restates the rule in Python (stdlib only: fractions, random, subprocess, tempfile) and generates `vectors.fe` through `fe fmt` (called with an argument list, so paths with spaces are safe). The vectors call `select_price(_ orders: MemVec<Order>) -> Clearing`, `allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256>`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`.

- [ ] **Step 2: The reference and generator**
Write `ref/clearing_ref.py` with exactly this content:
```python
#!/usr/bin/env python3
"""AnyOrder clearing reference: exact integer and rational arithmetic, stdlib only.

It restates the clearing rule from the spec in Python, checks it against a
brute-force oracle that tries every integer price, and generates the Fe test
vectors in ingots/clearing/src/vectors.fe.

    python ref/clearing_ref.py --write      regenerate ingots/clearing/src/vectors.fe
    python ref/clearing_ref.py --check      exit 1 if the committed vectors differ
    python ref/clearing_ref.py --selftest   random books: rule vs oracle and the lemmas

--write and --check pass the generated text through `fe fmt` (it must be on
PATH), so the committed file is exactly what the formatter accepts.
"""
import argparse
import pathlib
import random
import subprocess
import sys
import tempfile
from fractions import Fraction

UNIT = 10**18
ROOT = pathlib.Path(__file__).resolve().parent.parent
VECTORS = ROOT / "ingots" / "clearing" / "src" / "vectors.fe"


class Order:
    def __init__(self, is_buy, limit, quantity, owner, owner_seq=0):
        self.is_buy = is_buy
        self.limit = limit
        self.quantity = quantity
        self.owner = owner
        self.owner_seq = owner_seq


def buy(limit, quantity, owner, owner_seq=0):
    return Order(True, limit, quantity, owner, owner_seq)


def sell(limit, quantity, owner, owner_seq=0):
    return Order(False, limit, quantity, owner, owner_seq)


def demand_at(book, p):
    return sum(o.quantity for o in book if o.is_buy and o.limit >= p)


def supply_at(book, p):
    return sum(o.quantity for o in book if not o.is_buy and o.limit <= p)


def select_price(book):
    """Returns (traded, price, volume, demand, supply) by the spec's rule."""
    rows = []
    for p in sorted({o.limit for o in book}):
        d, s = demand_at(book, p), supply_at(book, p)
        rows.append((p, d, s, min(d, s), abs(d - s)))
    best_volume = max((r[3] for r in rows), default=0)
    if best_volume == 0:
        return (False, 0, 0, 0, 0)
    tied = [r for r in rows if r[3] == best_volume]
    best_gap = min(r[4] for r in tied)
    tied = [r for r in tied if r[4] == best_gap]
    at_least = [r for r in tied if r[1] >= r[2]]
    p, d, s, v, _ = max(at_least) if at_least else min(tied)
    return (True, p, v, d, s)


def allocate(book, clearing):
    traded, p, _, demand, supply = clearing
    if not traded:
        return [0] * len(book)
    buyers_long = demand >= supply
    excess = abs(demand - supply)
    marginal = sum(o.quantity for o in book if o.is_buy == buyers_long and o.limit == p)
    share = marginal - excess
    assert share >= 0, "a strictly better order would need rationing"
    fills, ranks = [], []
    for i, o in enumerate(book):
        long_side = o.is_buy == buyers_long
        better = o.limit > p if o.is_buy else o.limit < p
        if better or (o.limit == p and not long_side):
            fills.append(o.quantity)
        elif o.limit == p:
            exact = Fraction(o.quantity * share, marginal)
            fills.append(exact.numerator // exact.denominator)
            ranks.append((-(o.quantity * share % marginal), -o.quantity, o.owner, o.owner_seq, i))
        else:
            fills.append(0)
    leftover = share - sum(fills[r[4]] for r in ranks)
    for r in sorted(ranks)[:leftover]:
        fills[r[4]] += 1
    return fills


def cost_ceil(quantity, price):
    return -(-quantity * price // UNIT)


def proceeds_floor(quantity, price):
    return quantity * price // UNIT


def oracle_check(book, clearing, fills):
    traded, p, v, d, s = clearing
    high = max((o.limit for o in book), default=0) + 2
    best = max(min(demand_at(book, q), supply_at(book, q)) for q in range(0, high + 1)) if high <= 4096 else None
    if best is not None:
        assert v == best, "not volume-maximal over every integer price"
    if traded:
        assert (d, s) == (demand_at(book, p), supply_at(book, p))
    assert sum(f for f, o in zip(fills, book) if o.is_buy) == v
    assert sum(f for f, o in zip(fills, book) if not o.is_buy) == v
    for f, o in zip(fills, book):
        assert 0 <= f <= o.quantity
        if f:
            assert (o.limit >= p) if o.is_buy else (o.limit <= p)


T = 10**18      # one whole token, in base units
MILLI = 10**15  # 0.001 ETH, in wei

CASES = [
    ("simple_cross", "one buy and one sell that cross: ties resolve to the highest price where demand >= supply",
     [buy(10, 5, 1), sell(8, 5, 2)]),
    ("no_cross", "the best bid is below the best ask: no trade",
     [buy(7, 5, 1), sell(9, 5, 2)]),
    ("one_side_only", "buys only: no trade",
     [buy(7, 5, 1), buy(8, 3, 2)]),
    ("buyers_long_largest_remainder", "excess demand at the price: marginal buys share pro rata, the leftover unit goes to the largest remainder",
     [sell(8, 10, 4), buy(9, 7, 1), buy(9, 5, 2), buy(9, 3, 3)]),
    ("sellers_long_largest_remainder", "excess supply: the mirror image, ties resolve to the lowest price",
     [buy(9, 10, 4), sell(8, 7, 1), sell(8, 5, 2), sell(8, 3, 3)]),
    ("equal_remainders_owner_tiebreak", "equal remainders and quantities: the lower owner gets the leftover units",
     [sell(5, 2, 8), buy(5, 1, 9), buy(5, 1, 4), buy(5, 1, 7)]),
    ("owner_seq_tiebreak", "one owner's two identical orders: the earlier own order gets the leftover unit",
     [sell(5, 1, 8), buy(5, 1, 3, 1), buy(5, 1, 3, 0)]),
    ("strictly_better_needs_highest", "with lowest-price tie-breaking the buy at 12 would need rationing; the rule picks 12",
     [buy(12, 10, 1), sell(8, 3, 2), sell(10, 3, 3)]),
    ("mixed_sign_tie", "a tie of excess demand then excess supply: the highest excess-demand price keeps rationing feasible",
     [buy(10, 3, 1), sell(5, 1, 2), buy(1, 7, 3), sell(2, 6, 4), sell(11, 2, 5), sell(6, 2, 6),
      buy(8, 5, 7), sell(8, 6, 8), buy(7, 6, 9), buy(8, 1, 10), buy(12, 4, 11, 0), sell(0, 4, 11, 1)]),
    ("one_sided_baseline", "the attacker-free book of the one-sided case",
     [buy(10, 5, 1), buy(8, 5, 2), sell(6, 5, 3), sell(9, 5, 4)]),
    ("one_sided_buy_moves_price", "a one-sided buy at 12 moves the price from 8 to 10; it pays 10 too",
     [buy(10, 5, 1), buy(8, 5, 2), sell(6, 5, 3), sell(9, 5, 4), buy(12, 5, 5)]),
    ("wash_pair_in_range_moves_price", "an in-range wash pair moves the price from 7 to 6; both legs fill",
     [buy(7, 5, 1), sell(2, 5, 2), buy(6, 1, 3, 0), sell(5, 1, 3, 1)]),
    ("sandwich_demo_attacker_free", "the demo batch without the attacker (tokens and wei)",
     [sell(10 * MILLI, 10 * T, 1), sell(11 * MILLI, 10 * T, 2), sell(12 * MILLI, 10 * T, 3), sell(13 * MILLI, 10 * T, 4),
      buy(9 * MILLI, 5 * T, 5), buy(12 * MILLI, 15 * T, 6)]),
    ("sandwich_demo_attacked", "the same batch with the attacker's legs outside every other limit (condition C)",
     [sell(10 * MILLI, 10 * T, 1), sell(11 * MILLI, 10 * T, 2), sell(12 * MILLI, 10 * T, 3), sell(13 * MILLI, 10 * T, 4),
      buy(9 * MILLI, 5 * T, 5), buy(12 * MILLI, 15 * T, 6),
      buy(26 * MILLI, 10 * T + 1, 7, 0), sell(1 * MILLI, 10 * T + 1, 7, 1)]),
]

MONEY = [
    ("money_odd_lot", 10 * T + 1, 11 * MILLI),
    ("money_exact", 15 * T, 11 * MILLI),
    ("money_one_unit", 1, 3),
]


def fe_bool(b):
    return "true" if b else "false"


def render():
    out = []
    out.append("// GENERATED by ref/clearing_ref.py. Do not edit by hand:")
    out.append("// run `python ref/clearing_ref.py --write` and commit the result.")
    out.append("")
    out.append("use core::ptr::MemVec")
    out.append("use std::evm::wei")
    out.append("use ingot::{Order, allocate, cost_ceil, proceeds_floor, select_price}")
    for name, about, book in CASES:
        clearing = select_price(book)
        fills = allocate(book, clearing)
        oracle_check(book, clearing, fills)
        traded, p, v, _, _ = clearing
        out.append("")
        out.append(f"/// {about}")
        out.append("#[test]")
        out.append(f"fn vector_{name}() {{")
        out.append("    var book = MemVec<Order>::new()")
        for o in book:
            out.append(
                "    book.push(Order { "
                f"is_buy: {fe_bool(o.is_buy)}, limit: {o.limit}, quantity: {o.quantity}, "
                f"owner: {o.owner}, owner_seq: {o.owner_seq} }})"
            )
        out.append("    let c = select_price(book)")
        out.append(f"    assert!(c.traded == {fe_bool(traded)})")
        out.append(f"    assert!(c.price == {p})")
        out.append(f"    assert!(c.volume == {v})")
        out.append("    let fills = allocate(book, c)")
        for i, f in enumerate(fills):
            out.append(f"    assert!(fills[{i}] == {f})")
        out.append("}")
    for name, quantity, price in MONEY:
        out.append("")
        out.append(f"/// {quantity} base units at {price} wei per token: buyers round up, sellers down.")
        out.append("#[test]")
        out.append(f"fn vector_{name}() {{")
        out.append(f"    assert!(cost_ceil(quantity: {quantity}, price: {price}) == wei({cost_ceil(quantity, price)}))")
        out.append(f"    assert!(proceeds_floor(quantity: {quantity}, price: {price}) == wei({proceeds_floor(quantity, price)}))")
        out.append("}")
    return "\n".join(out) + "\n"


def formatted(raw):
    """The generated text as `fe fmt` writes it. Arguments go as a list, so a
    path with spaces is safe."""
    with tempfile.TemporaryDirectory(prefix="anyorder vectors ") as tmp:
        path = pathlib.Path(tmp) / "vectors.fe"
        path.write_text(raw, encoding="utf-8", newline="\n")
        subprocess.run(["fe", "fmt", str(path)], check=True, stdout=subprocess.DEVNULL)
        return path.read_text(encoding="utf-8")


def selftest(rounds):
    rng = random.Random(20261118)
    traded_books = 0
    for _ in range(rounds):
        n = rng.randint(1, 14)
        book = [Order(rng.random() < 0.5, rng.randint(2, 16), rng.randint(1, 9), rng.randint(1, 4), k) for k in range(n)]
        c = select_price(book)
        fills = allocate(book, c)
        oracle_check(book, c, fills)
        if not c[0]:
            continue
        traded_books += 1
        a = rng.randint(1, 30)
        attacked = book + [Order(True, max(o.limit for o in book) + 1, a, 99, 0),
                           Order(False, min(o.limit for o in book) - 1, a, 99, 1)]
        ca = select_price(attacked)
        fa = allocate(attacked, ca)
        assert ca[1] == c[1] and fa[:n] == fills and fa[n:] == [a, a], "condition C invariance failed"
    print(f"selftest: {rounds} random books, {traded_books} traded: rule = oracle, lemmas hold, condition C holds")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--write", action="store_true")
    group.add_argument("--check", action="store_true")
    group.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        selftest(20000)
        return 0
    text = formatted(render())
    if args.write:
        VECTORS.write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {VECTORS.relative_to(ROOT)} ({len(CASES)} clearing vectors, {len(MONEY)} money vectors)")
        return 0
    current = VECTORS.read_text(encoding="utf-8") if VECTORS.exists() else ""
    if current != text:
        print(f"{VECTORS.relative_to(ROOT)} is stale: run python ref/clearing_ref.py --write", file=sys.stderr)
        return 1
    print("vectors: up to date")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: Generate the vectors**
Run: `python ref/clearing_ref.py --write`
Expected: `wrote ingots/clearing/src/vectors.fe (14 clearing vectors, 3 money vectors)` (path separator may be a backslash)

- [ ] **Step 4: Check the generated file**
Compare `ingots/clearing/src/vectors.fe` with the block below; they must be identical. If they differ, stop and report BLOCKED (the rule or the formatter changed).

- [ ] **Step 5: The expected generated file (for review; the generator wrote it)**
Write `ingots/clearing/src/vectors.fe` with exactly this content:
```fe
// GENERATED by ref/clearing_ref.py. Do not edit by hand:
// run `python ref/clearing_ref.py --write` and commit the result.

use core::ptr::MemVec
use std::evm::wei
use ingot::{Order, allocate, cost_ceil, proceeds_floor, select_price}

/// one buy and one sell that cross: ties resolve to the highest price where demand >= supply
#[test]
fn vector_simple_cross() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 10, quantity: 5, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 8, quantity: 5, owner: 2, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 10)
    assert!(c.volume == 5)
    let fills = allocate(book, c)
    assert!(fills[0] == 5)
    assert!(fills[1] == 5)
}

/// the best bid is below the best ask: no trade
#[test]
fn vector_no_cross() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 7, quantity: 5, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 9, quantity: 5, owner: 2, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == false)
    assert!(c.price == 0)
    assert!(c.volume == 0)
    let fills = allocate(book, c)
    assert!(fills[0] == 0)
    assert!(fills[1] == 0)
}

/// buys only: no trade
#[test]
fn vector_one_side_only() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 7, quantity: 5, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 8, quantity: 3, owner: 2, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == false)
    assert!(c.price == 0)
    assert!(c.volume == 0)
    let fills = allocate(book, c)
    assert!(fills[0] == 0)
    assert!(fills[1] == 0)
}

/// excess demand at the price: marginal buys share pro rata, the leftover unit goes to the largest remainder
#[test]
fn vector_buyers_long_largest_remainder() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: false, limit: 8, quantity: 10, owner: 4, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 9, quantity: 7, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 9, quantity: 5, owner: 2, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 9, quantity: 3, owner: 3, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 9)
    assert!(c.volume == 10)
    let fills = allocate(book, c)
    assert!(fills[0] == 10)
    assert!(fills[1] == 5)
    assert!(fills[2] == 3)
    assert!(fills[3] == 2)
}

/// excess supply: the mirror image, ties resolve to the lowest price
#[test]
fn vector_sellers_long_largest_remainder() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 9, quantity: 10, owner: 4, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 8, quantity: 7, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 8, quantity: 5, owner: 2, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 8, quantity: 3, owner: 3, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 8)
    assert!(c.volume == 10)
    let fills = allocate(book, c)
    assert!(fills[0] == 10)
    assert!(fills[1] == 5)
    assert!(fills[2] == 3)
    assert!(fills[3] == 2)
}

/// equal remainders and quantities: the lower owner gets the leftover units
#[test]
fn vector_equal_remainders_owner_tiebreak() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: false, limit: 5, quantity: 2, owner: 8, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 5, quantity: 1, owner: 9, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 5, quantity: 1, owner: 4, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 5, quantity: 1, owner: 7, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 5)
    assert!(c.volume == 2)
    let fills = allocate(book, c)
    assert!(fills[0] == 2)
    assert!(fills[1] == 0)
    assert!(fills[2] == 1)
    assert!(fills[3] == 1)
}

/// one owner's two identical orders: the earlier own order gets the leftover unit
#[test]
fn vector_owner_seq_tiebreak() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: false, limit: 5, quantity: 1, owner: 8, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 5, quantity: 1, owner: 3, owner_seq: 1 },
    )
    book.push(
        Order { is_buy: true, limit: 5, quantity: 1, owner: 3, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 5)
    assert!(c.volume == 1)
    let fills = allocate(book, c)
    assert!(fills[0] == 1)
    assert!(fills[1] == 0)
    assert!(fills[2] == 1)
}

/// with lowest-price tie-breaking the buy at 12 would need rationing; the rule picks 12
#[test]
fn vector_strictly_better_needs_highest() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 12, quantity: 10, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 8, quantity: 3, owner: 2, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 10, quantity: 3, owner: 3, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 12)
    assert!(c.volume == 6)
    let fills = allocate(book, c)
    assert!(fills[0] == 6)
    assert!(fills[1] == 3)
    assert!(fills[2] == 3)
}

/// a tie of excess demand then excess supply: the highest excess-demand price keeps rationing feasible
#[test]
fn vector_mixed_sign_tie() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 10, quantity: 3, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 5, quantity: 1, owner: 2, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 1, quantity: 7, owner: 3, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 2, quantity: 6, owner: 4, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 11, quantity: 2, owner: 5, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 6, quantity: 2, owner: 6, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 8, quantity: 5, owner: 7, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 8, quantity: 6, owner: 8, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 7, quantity: 6, owner: 9, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 8, quantity: 1, owner: 10, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 12, quantity: 4, owner: 11, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 0, quantity: 4, owner: 11, owner_seq: 1 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 7)
    assert!(c.volume == 13)
    let fills = allocate(book, c)
    assert!(fills[0] == 3)
    assert!(fills[1] == 1)
    assert!(fills[2] == 0)
    assert!(fills[3] == 6)
    assert!(fills[4] == 0)
    assert!(fills[5] == 2)
    assert!(fills[6] == 5)
    assert!(fills[7] == 0)
    assert!(fills[8] == 0)
    assert!(fills[9] == 1)
    assert!(fills[10] == 4)
    assert!(fills[11] == 4)
}

/// the attacker-free book of the one-sided case
#[test]
fn vector_one_sided_baseline() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 10, quantity: 5, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 8, quantity: 5, owner: 2, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 6, quantity: 5, owner: 3, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 9, quantity: 5, owner: 4, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 8)
    assert!(c.volume == 5)
    let fills = allocate(book, c)
    assert!(fills[0] == 5)
    assert!(fills[1] == 0)
    assert!(fills[2] == 5)
    assert!(fills[3] == 0)
}

/// a one-sided buy at 12 moves the price from 8 to 10; it pays 10 too
#[test]
fn vector_one_sided_buy_moves_price() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 10, quantity: 5, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 8, quantity: 5, owner: 2, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 6, quantity: 5, owner: 3, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 9, quantity: 5, owner: 4, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 12, quantity: 5, owner: 5, owner_seq: 0 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 10)
    assert!(c.volume == 10)
    let fills = allocate(book, c)
    assert!(fills[0] == 5)
    assert!(fills[1] == 0)
    assert!(fills[2] == 5)
    assert!(fills[3] == 5)
    assert!(fills[4] == 5)
}

/// an in-range wash pair moves the price from 7 to 6; both legs fill
#[test]
fn vector_wash_pair_in_range_moves_price() {
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 7, quantity: 5, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 2, quantity: 5, owner: 2, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: true, limit: 6, quantity: 1, owner: 3, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 5, quantity: 1, owner: 3, owner_seq: 1 },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 6)
    assert!(c.volume == 6)
    let fills = allocate(book, c)
    assert!(fills[0] == 5)
    assert!(fills[1] == 5)
    assert!(fills[2] == 1)
    assert!(fills[3] == 1)
}

/// the demo batch without the attacker (tokens and wei)
#[test]
fn vector_sandwich_demo_attacker_free() {
    var book = MemVec<Order>::new()
    book.push(
        Order {
            is_buy: false,
            limit: 10000000000000000,
            quantity: 10000000000000000000,
            owner: 1,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: false,
            limit: 11000000000000000,
            quantity: 10000000000000000000,
            owner: 2,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: false,
            limit: 12000000000000000,
            quantity: 10000000000000000000,
            owner: 3,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: false,
            limit: 13000000000000000,
            quantity: 10000000000000000000,
            owner: 4,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: true,
            limit: 9000000000000000,
            quantity: 5000000000000000000,
            owner: 5,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: true,
            limit: 12000000000000000,
            quantity: 15000000000000000000,
            owner: 6,
            owner_seq: 0,
        },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 11000000000000000)
    assert!(c.volume == 15000000000000000000)
    let fills = allocate(book, c)
    assert!(fills[0] == 10000000000000000000)
    assert!(fills[1] == 5000000000000000000)
    assert!(fills[2] == 0)
    assert!(fills[3] == 0)
    assert!(fills[4] == 0)
    assert!(fills[5] == 15000000000000000000)
}

/// the same batch with the attacker's legs outside every other limit (condition C)
#[test]
fn vector_sandwich_demo_attacked() {
    var book = MemVec<Order>::new()
    book.push(
        Order {
            is_buy: false,
            limit: 10000000000000000,
            quantity: 10000000000000000000,
            owner: 1,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: false,
            limit: 11000000000000000,
            quantity: 10000000000000000000,
            owner: 2,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: false,
            limit: 12000000000000000,
            quantity: 10000000000000000000,
            owner: 3,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: false,
            limit: 13000000000000000,
            quantity: 10000000000000000000,
            owner: 4,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: true,
            limit: 9000000000000000,
            quantity: 5000000000000000000,
            owner: 5,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: true,
            limit: 12000000000000000,
            quantity: 15000000000000000000,
            owner: 6,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: true,
            limit: 26000000000000000,
            quantity: 10000000000000000001,
            owner: 7,
            owner_seq: 0,
        },
    )
    book.push(
        Order {
            is_buy: false,
            limit: 1000000000000000,
            quantity: 10000000000000000001,
            owner: 7,
            owner_seq: 1,
        },
    )
    let c = select_price(book)
    assert!(c.traded == true)
    assert!(c.price == 11000000000000000)
    assert!(c.volume == 25000000000000000001)
    let fills = allocate(book, c)
    assert!(fills[0] == 10000000000000000000)
    assert!(fills[1] == 5000000000000000000)
    assert!(fills[2] == 0)
    assert!(fills[3] == 0)
    assert!(fills[4] == 0)
    assert!(fills[5] == 15000000000000000000)
    assert!(fills[6] == 10000000000000000001)
    assert!(fills[7] == 10000000000000000001)
}

/// 10000000000000000001 base units at 11000000000000000 wei per token: buyers round up, sellers down.
#[test]
fn vector_money_odd_lot() {
    assert!(
        cost_ceil(quantity: 10000000000000000001, price: 11000000000000000)
            == wei(110000000000000001),
    )
    assert!(
        proceeds_floor(quantity: 10000000000000000001, price: 11000000000000000)
            == wei(110000000000000000),
    )
}

/// 15000000000000000000 base units at 11000000000000000 wei per token: buyers round up, sellers down.
#[test]
fn vector_money_exact() {
    assert!(
        cost_ceil(quantity: 15000000000000000000, price: 11000000000000000)
            == wei(165000000000000000),
    )
    assert!(
        proceeds_floor(quantity: 15000000000000000000, price: 11000000000000000)
            == wei(165000000000000000),
    )
}

/// 1 base units at 3 wei per token: buyers round up, sellers down.
#[test]
fn vector_money_one_unit() {
    assert!(cost_ceil(quantity: 1, price: 3) == wei(1))
    assert!(proceeds_floor(quantity: 1, price: 3) == wei(0))
}
```

- [ ] **Step 6: CI runs the reference too**
Write `.github/workflows/ci.yml` with exactly this content:
```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

env:
  # Any Fe release from 26.5.0 on is allowed for the contest; this build pins 26.6.0.
  FE_VERSION: v26.6.0

jobs:
  fe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install Fe
        run: |
          curl -fsSL https://raw.githubusercontent.com/argotorg/fe/master/feup/feup.sh | bash -s -- --version "$FE_VERSION" --no-modify-path
          echo "$HOME/.fe/bin" >> "$GITHUB_PATH"
      - run: fe --version
      # fe fmt does not walk a workspace root: check each member.
      - run: fe fmt --check ingots/clearing
      - run: fe fmt --check ingots/exchange
      - run: fe test
      - run: fe build
      - uses: actions/setup-python@v6
        with:
          python-version: "3.12"
      # The exact-rational reference: vectors are current, and the rule matches the oracle.
      - run: python ref/clearing_ref.py --check
      - run: python ref/clearing_ref.py --selftest
```

- [ ] **Step 7: Vectors current, rule = oracle on 20,000 random books, all clearing tests**
Also expect `vectors: up to date` and `selftest: 20000 random books, 15959 traded: rule = oracle, lemmas hold, condition C holds`.
Run: `python ref/clearing_ref.py --check && python ref/clearing_ref.py --selftest && fe test ingots/clearing`
Expected: PASS — `test result: ok. 28 passed; 0 failed`

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `test(core): exact-rational reference regenerates 17 clearing test vectors`

---

### Task 6: Seeded property suite (permutation, limits, conservation, volume-max, sandwich invariance)

**Files:**
- Test: `ingots/clearing/src/props.fe`

**Depends on:** Task 5
**Effort:** xhigh
**Model tier:** top
**Provides:** `property_* (3), permutation_full_shuffle_keeps_price_and_owner_totals, sandwich_invariance_property`
**Requires:** `select_price(_ orders: MemVec<Order>) -> Clearing`, `allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256>`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`, `oracle::{demand_at, supply_at, volume_at, max_volume_between}`

- [ ] **Step 1: Context**
Uses `select_price(_ orders: MemVec<Order>) -> Clearing`, `allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256>`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`, `oracle::{demand_at, supply_at, volume_at, max_volume_between}` and `std::evm::random::{KeccakRng, Rng, shuffle_slice}` (`KeccakRng::seeded(n)`, `with (Rng = rng) { ... }`). 256 rounds per property, fixed seeds 1-5. The pure-level permutation test shuffles everything (within-owner order too) and compares per-owner aggregates (core spec section 10). `sandwich_invariance_property` also asserts the unconditional wash-pair property and the in-range example where the price moves (7 -> 6).

- [ ] **Step 2: The property suite (the implementation already exists; these must pass, and a broken rule must fail them)**
Write `ingots/clearing/src/props.fe` with exactly this content:
```fe
//! Seeded, hand-rolled property tests (`fe test` has no fuzzer). Every test
//! draws its books from `KeccakRng` with a fixed seed, so a failure replays.

use core::ptr::MemVec
use std::evm::random::{KeccakRng, Rng, shuffle_slice}
use ingot::{Clearing, Order, allocate, cost_ceil, proceeds_floor, select_price}
use ingot::oracle::{demand_at, max_volume_between, supply_at, volume_at}

const ROUNDS: u256 = 256
const OWNERS: u256 = 4

// A book of `n` orders: limits 2..=16, quantities 1..=9, owners 1..=OWNERS.
// `owner_seq` is the order's draw index, so it is unique for every owner.
fn small_book(_ n: u256) -> MemVec<Order> uses (rng: mut Rng) {
    var book = MemVec<Order>::new()
    var k: u256 = 0
    while k < n {
        book.push(
            Order {
                is_buy: rng.uniform(2) == 0,
                limit: 2 + rng.uniform(15),
                quantity: 1 + rng.uniform(9),
                owner: 1 + rng.uniform(OWNERS),
                owner_seq: k,
            },
        )
        k += 1
    }
    book
}

// A book with token-sized quantities and wei-precise prices, so quote
// rounding happens: quantities near 10^17 base units, prices near 10^16 wei.
fn scaled_book(_ n: u256) -> MemVec<Order> uses (rng: mut Rng) {
    var book = MemVec<Order>::new()
    var k: u256 = 0
    while k < n {
        book.push(
            Order {
                is_buy: rng.uniform(2) == 0,
                limit: (2 + rng.uniform(15)) * 1_000_000_000_000_000 + rng.uniform(997),
                quantity: (1 + rng.uniform(9)) * 100_000_000_000_000_000 + rng.uniform(1_000_003),
                owner: 1 + rng.uniform(OWNERS),
                owner_seq: k,
            },
        )
        k += 1
    }
    book
}

fn min_limit(_ book: MemVec<Order>) -> u256 {
    var low = book[0].limit
    for o in book {
        if o.limit < low {
            low = o.limit
        }
    }
    low
}

fn max_limit(_ book: MemVec<Order>) -> u256 {
    var high = book[0].limit
    for o in book {
        if o.limit > high {
            high = o.limit
        }
    }
    high
}

// Per-owner totals: base bought, base sold, quote paid, quote received, by
// owner 0..=OWNERS (index 0 unused).
fn owner_totals(_ book: MemVec<Order>, _ fills: MemVec<u256>, _ c: Clearing) -> MemVec<u256> {
    var totals = MemVec<u256>::new()
    var j: u256 = 0
    while j < 4 * (OWNERS + 1) {
        totals.push(0)
        j += 1
    }
    var i: usize = 0
    while i < book.len() {
        let o = book[i]
        let f = fills[i]
        let at: usize = (o.owner * 4).downcast_unchecked()
        if o.is_buy {
            totals.set(at, totals[at] + f)
            totals.set(
                    at + 2,
                    totals[at + 2] + cost_ceil(quantity: f, price: c.price).as_wei(),
                )
        } else {
            totals.set(at + 1, totals[at + 1] + f)
            totals
                .set(
                    at + 3,
                    totals[at + 3] + proceeds_floor(quantity: f, price: c.price).as_wei(),
                )
        }
        i += 1
    }
    totals
}

#[test]
fn property_fills_respect_limits_and_strictly_better_orders_fill() {
    var rng = KeccakRng::seeded(1)
    var round: u256 = 0
    while round < ROUNDS {
        let n = 1 + rng.uniform(14)
        let book = with (Rng = rng) {
            small_book(n)
        }
        let c = select_price(book)
        let fills = allocate(book, c)
        var i: usize = 0
        while i < book.len() {
            let o = book[i]
            let f = fills[i]
            assert!(f <= o.quantity)
            if f > 0 {
                assert!(c.traded)
                if o.is_buy {
                    assert!(o.limit >= c.price)
                } else {
                    assert!(o.limit <= c.price)
                }
            }
            if c.traded && ((o.is_buy && o.limit > c.price) || (!o.is_buy && o.limit < c.price)) {
                assert!(f == o.quantity)
            }
            i += 1
        }
        round += 1
    }
}

#[test]
fn property_base_and_quote_conservation() {
    var rng = KeccakRng::seeded(2)
    var round: u256 = 0
    while round < ROUNDS {
        let n = 1 + rng.uniform(14)
        let book = with (Rng = rng) {
            scaled_book(n)
        }
        let c = select_price(book)
        let fills = allocate(book, c)
        var bought: u256 = 0
        var sold: u256 = 0
        var paid: u256 = 0
        var received: u256 = 0
        var filled_orders: u256 = 0
        var i: usize = 0
        while i < book.len() {
            let f = fills[i]
            if f > 0 {
                filled_orders += 1
            }
            if book[i].is_buy {
                bought += f
                paid += cost_ceil(quantity: f, price: c.price).as_wei()
            } else {
                sold += f
                received += proceeds_floor(quantity: f, price: c.price).as_wei()
            }
            i += 1
        }
        assert!(bought == sold)
        assert!(bought == c.volume)
        // Buyers always cover sellers; the dust is at most one wei per filled order.
        assert!(paid >= received)
        assert!(paid - received <= filled_orders)
        round += 1
    }
}

#[test]
fn property_volume_is_maximal_over_every_integer_price() {
    var rng = KeccakRng::seeded(3)
    var round: u256 = 0
    while round < ROUNDS {
        let n = 1 + rng.uniform(14)
        let book = with (Rng = rng) {
            small_book(n)
        }
        let c = select_price(book)
        // Limits are 2..=16, so prices 0..=18 cover every price that matters.
        let best = max_volume_between(book, low: 0, high: 18)
        if c.traded {
            assert!(c.volume == best)
            assert!(volume_at(book, c.price) == c.volume)
            assert!(demand_at(book, c.price) == c.demand)
            assert!(supply_at(book, c.price) == c.supply)
        } else {
            assert!(best == 0)
        }
        round += 1
    }
}

#[test]
fn permutation_full_shuffle_keeps_price_and_owner_totals() {
    var rng = KeccakRng::seeded(4)
    var book = with (Rng = rng) {
        scaled_book(14)
    }
    let first = select_price(book)
    let first_totals = owner_totals(book, allocate(book, first), first)
    var round: u256 = 0
    while round < ROUNDS {
        with (Rng = rng) {
            shuffle_slice(mut book.as_slice())
        }
        let c = select_price(book)
        assert!(
            c.traded == first.traded && c.price == first.price && c.volume == first.volume,
        )
        let totals = owner_totals(book, allocate(book, c), c)
        var j: usize = 0
        while j < totals.len() {
            assert!(totals[j] == first_totals[j])
            j += 1
        }
        round += 1
    }
}

#[test]
fn sandwich_invariance_property() {
    var rng = KeccakRng::seeded(5)
    var round: u256 = 0
    var checked: u256 = 0
    while round < ROUNDS {
        let n = 1 + rng.uniform(14)
        let book = with (Rng = rng) {
            small_book(n)
        }
        let c = select_price(book)
        let size = 1 + rng.uniform(30)

        // Condition C: equal legs, the buy above and the sell below every other limit.
        if c.traded {
            var attacked = MemVec<Order>::new()
            for o in book {
                attacked.push(o)
            }
            attacked
                .push(
                    Order {
                        is_buy: true,
                        limit: max_limit(book) + 1,
                        quantity: size,
                        owner: 99,
                        owner_seq: 0,
                    },
                )
            attacked
                .push(
                    Order {
                        is_buy: false,
                        limit: min_limit(book) - 1,
                        quantity: size,
                        owner: 99,
                        owner_seq: 1,
                    },
                )
            let ca = select_price(attacked)
            assert!(
                ca.traded && ca.price == c.price && ca.volume == c.volume + size,
            )
            let fills = allocate(book, c)
            let attacked_fills = allocate(attacked, ca)
            var i: usize = 0
            while i < book.len() {
                assert!(attacked_fills[i] == fills[i])
                i += 1
            }
            assert!(
                attacked_fills[book.len()] == size && attacked_fills[book.len() + 1] == size,
            )
            checked += 1
        }

        // Unconditional: whatever the limits, a trader whose equal buy and
        // sell both fill in full nets zero tokens and at most zero wei.
        var washed = MemVec<Order>::new()
        for o in book {
            washed.push(o)
        }
        let wash_size = 1 + rng.uniform(9)
        washed
            .push(
                Order {
                    is_buy: true,
                    limit: 1 + rng.uniform(17),
                    quantity: wash_size,
                    owner: 98,
                    owner_seq: 0,
                },
            )
        washed
            .push(
                Order {
                    is_buy: false,
                    limit: 1 + rng.uniform(17),
                    quantity: wash_size,
                    owner: 98,
                    owner_seq: 1,
                },
            )
        let cw = select_price(washed)
        let wash_fills = allocate(washed, cw)
        let last = washed.len()
        if wash_fills[last - 2] == wash_size && wash_fills[last - 1] == wash_size {
            let scaled = wash_size * 1_000_000_000_000_000 + 7
            let price = cw.price * 1_000_000_000_000_000 + 3
            assert!(
                proceeds_floor(quantity: scaled, price) <= cost_ceil(quantity: scaled, price),
            )
        }
        round += 1
    }
    assert!(checked > 0)

    // The in-range wash pair that moves the price: the book clears at 7 alone,
    // at 6 with the pair, and the pair's owner still nets <= 0.
    var book = MemVec<Order>::new()
    book.push(
        Order { is_buy: true, limit: 7, quantity: 5, owner: 1, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 2, quantity: 5, owner: 2, owner_seq: 0 },
    )
    assert!(select_price(book).price == 7)
    book.push(
        Order { is_buy: true, limit: 6, quantity: 1, owner: 3, owner_seq: 0 },
    )
    book.push(
        Order { is_buy: false, limit: 5, quantity: 1, owner: 3, owner_seq: 1 },
    )
    let moved = select_price(book)
    assert!(moved.price == 6)
    let moved_fills = allocate(book, moved)
    assert!(moved_fills[2] == 1 && moved_fills[3] == 1)
    assert!(
        proceeds_floor(quantity: 1, price: moved.price)
            <= cost_ceil(quantity: 1, price: moved.price),
    )
}
```

- [ ] **Step 3: Mutation check (do not commit it)**
Temporarily change `if has_high {` to `if has_high && false {` in `select.fe`, run `fe test ingots/clearing --filter property_`: at least two tests must FAIL. Restore the line before the gate.

- [ ] **Step 4: Format and run all clearing tests**
Run: `fe fmt --check ingots/clearing && fe test ingots/clearing`
Expected: PASS — `test result: ok. 33 passed; 0 failed`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `test(core): seeded property suite for the clearing core`

---

### Task 7: Exchange interface and storage (the frozen ABI)

**Files:**
- Modify: `ingots/exchange/src/lib.fe`
- Create: `ingots/exchange/src/interface.fe`
- Create: `ingots/exchange/src/state.fe`

**Depends on:** Task 1
**Effort:** medium
**Provides:** `msg AnyOrderMsg + #[abi] views + events + errors (core spec section 8, ingot::interface)`, `struct Clock { now: Timestamp } + storage structs Settings, Book, Funds, Guard (ingot::state)`
**Requires:** nothing from other tasks

- [ ] **Step 1: Context**
These signatures are frozen in the core spec section 8; sub-project B builds against them. Every message uses a `sol(...)` selector (raw integer selectors produce no ABI JSON).

- [ ] **Step 2: Messages, #[abi] return structs, events and custom errors**
Write `ingots/exchange/src/interface.fe` with exactly this content:
```fe
//! AnyOrder's public interface: the messages, return values, events and errors
//! that make up its ABI. The signatures here are frozen in the spec.

use std::abi::sol

#[abi]
pub struct OrderRef { pub batch: u256, pub index: u256 }

impl Copy for OrderRef {}

#[abi]
pub struct ClearingView { pub traded: bool, pub price: u256, pub volume: u256 }

impl Copy for ClearingView {}

#[abi]
pub struct Payout { pub base: u256, pub quote: Wei }

impl Copy for Payout {}

#[abi]
pub struct ConfigView {
    pub token: Address,
    pub genesis: Timestamp,
    pub batch_length: Duration,
    pub max_orders: u256,
    pub min_quantity: u256,
    pub max_price: u256,
}

impl Copy for ConfigView {}

/// `status`: 0 open, 1 closed and waiting to be cleared, 2 cleared.
#[abi]
pub struct BatchView {
    pub start: Timestamp,
    pub end: Timestamp,
    pub order_count: u256,
    pub status: u8,
    pub traded: bool,
    pub price: u256,
    pub volume: u256,
}

impl Copy for BatchView {}

#[abi]
pub struct OrderView {
    pub owner: Address,
    pub is_buy: bool,
    pub limit: u256,
    pub quantity: u256,
    pub owner_seq: u256,
    pub locked: Wei,
    pub filled: u256,
    pub claimed: bool,
}

impl Copy for OrderView {}

#[abi]
pub struct BalancesView { pub base: u256, pub quote: Wei }

impl Copy for BalancesView {}

pub msg AnyOrderMsg {
    #[selector = sol("depositEth()")]
    DepositEth,
    #[selector = sol("depositToken(uint256)")]
    DepositToken { amount: u256 },
    #[selector = sol("withdraw(uint256,uint256)")]
    Withdraw { base: u256, quote: Wei },
    #[selector = sol("placeBuy(uint256,uint256)")]
    PlaceBuy { limit: u256, quantity: u256 } -> OrderRef,
    #[selector = sol("placeSell(uint256,uint256)")]
    PlaceSell { limit: u256, quantity: u256 } -> OrderRef,
    #[selector = sol("clear(uint256)")]
    Clear { batch: u256 } -> ClearingView,
    #[selector = sol("claim(uint256,uint256)")]
    Claim { batch: u256, index: u256 } -> Payout,
    #[selector = sol("config()")]
    Config -> ConfigView,
    #[selector = sol("currentBatch()")]
    CurrentBatch -> u256,
    #[selector = sol("batchInfo(uint256)")]
    BatchInfo { batch: u256 } -> BatchView,
    #[selector = sol("orderAt(uint256,uint256)")]
    OrderAt { batch: u256, index: u256 } -> OrderView,
    #[selector = sol("preview(uint256)")]
    Preview { batch: u256 } -> ClearingView,
    #[selector = sol("balances(address)")]
    Balances { owner: Address } -> BalancesView,
}

#[event]
pub struct Deposited {
    #[indexed]
    pub owner: Address,
    pub base: u256,
    pub quote: Wei,
}

#[event]
pub struct Withdrawn {
    #[indexed]
    pub owner: Address,
    pub base: u256,
    pub quote: Wei,
}

#[event]
pub struct OrderPlaced {
    #[indexed]
    pub batch: u256,
    #[indexed]
    pub owner: Address,
    pub index: u256,
    pub is_buy: bool,
    pub limit: u256,
    pub quantity: u256,
}

#[event]
pub struct BatchCleared {
    #[indexed]
    pub batch: u256,
    pub traded: bool,
    pub price: u256,
    pub volume: u256,
}

#[event]
pub struct Claimed {
    #[indexed]
    pub batch: u256,
    #[indexed]
    pub owner: Address,
    pub index: u256,
    pub base: u256,
    pub quote: Wei,
}

#[error]
pub struct ZeroAmount {}

#[error]
pub struct InsufficientFunds { pub available: u256, pub required: u256 }

#[error]
pub struct BelowMinimum { pub quantity: u256, pub minimum: u256 }

#[error]
pub struct AboveMaximum { pub quantity: u256, pub maximum: u256 }

#[error]
pub struct PriceOutOfRange { pub limit: u256, pub max_price: u256 }

#[error]
pub struct BatchFull { pub batch: u256, pub max_orders: u256 }

#[error]
pub struct BatchStillOpen { pub batch: u256, pub ends_at: u256 }

#[error]
pub struct AlreadyCleared { pub batch: u256 }

#[error]
pub struct NotCleared { pub batch: u256 }

#[error]
pub struct UnknownOrder { pub batch: u256, pub index: u256 }

#[error]
pub struct AlreadyClaimed { pub batch: u256, pub index: u256 }

#[error]
pub struct Reentrant {}

#[error]
pub struct TransferFailed {}
```

- [ ] **Step 3: The clock effect and the storage structs**
Write `ingots/exchange/src/state.fe` with exactly this content:
```fe
//! Storage as effects. Each handler names exactly the storage it touches.

use std::evm::{StorageMap, TSlot}

/// "Now", provided as an effect. `AnyOrder` builds it from the block
/// timestamp; `AnyOrderTestClock` from a stored test time. Nothing else in
/// the exchange reads the time.
pub struct Clock { pub now: Timestamp }

impl Copy for Clock {}

/// Fixed at deployment.
pub struct Settings {
    pub token: Address,
    pub genesis: Timestamp,
    pub batch_length: Duration,
    pub max_orders: u256,
    pub min_quantity: u256,
    pub max_price: u256,
}

/// One batch: how many orders it holds and, once cleared, its result.
pub struct BatchSlot {
    pub count: u256,
    pub cleared: bool,
    pub traded: bool,
    pub price: u256,
    pub volume: u256,
}

impl Copy for BatchSlot {}

/// One order. A buy locks `locked` wei at its limit; a sell locks `quantity`
/// base units. `filled` is written when the batch clears.
pub struct OrderSlot {
    pub owner: Address,
    pub is_buy: bool,
    pub limit: u256,
    pub quantity: u256,
    pub owner_seq: u256,
    pub locked: Wei,
    pub filled: u256,
    pub claimed: bool,
}

impl Copy for OrderSlot {}

/// Orders by batch and arrival index. The index only enumerates storage;
/// clearing never reads it.
pub struct Book {
    pub batches: StorageMap<u256, BatchSlot>,
    pub orders: StorageMap<(u256, u256), OrderSlot>,
    pub seqs: StorageMap<Address, u256>,
}

/// Free (unlocked) balances: base tokens and wei.
pub struct Funds { pub base: StorageMap<Address, u256>, pub quote: StorageMap<Address, Wei> }

/// A transient-storage reentrancy lock for the payout path.
pub struct Guard { pub entered: TSlot<bool> }
```

- [ ] **Step 4: Export the interface**
Write `ingots/exchange/src/lib.fe` with exactly this content:
```fe
//! The AnyOrder exchange ingot: the `AnyOrder` contract, the `TestToken` it
//! trades, and the `ConstantProductPool` baseline for the sandwich contrast.
//! `AnyOrderTestClock`, `Trader` and `Reenterer` are test-only harnesses.

pub use interface::*
pub use token::{TestToken, TokenMsg}
```

- [ ] **Step 5: It type-checks and is formatted**
Run: `fe fmt --check ingots/exchange && fe check ingots/exchange && echo INTERFACE: OK`
Expected: PASS — `INTERFACE: OK`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(core): AnyOrder interface and storage structs`

---

### Task 8: Baseline constant-product pool (for the sandwich contrast only)

**Files:**
- Modify: `ingots/exchange/src/lib.fe`
- Create: `ingots/exchange/src/pool.fe`
- Test: `ingots/exchange/src/pool_tests.fe`

**Depends on:** Task 7
**Effort:** medium
**Provides:** `contract ConstantProductPool(token) + msg PoolMsg (seed, buyTokens, sellTokens, reserves)`
**Requires:** `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)`

- [ ] **Step 1: Context**
Uses `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)` (Task 1). No fee, so the attacker's profit in the contrast is purely the sandwich.

- [ ] **Step 2: Write the failing tests**
Write `ingots/exchange/src/pool_tests.fe` with exactly this content:
```fe
//! The baseline pool on its own: the constant-product formula and the fact
//! that an immediate round trip never returns more than it cost.

use core::num::mul_div
use std::abi::sol
use std::evm::{ether, wei}
use ingot::pool::{ConstantProductPool, PoolMsg, Reserves}
use ingot::token::{TestToken, TokenMsg}

const SEED_TOKENS: u256 = 400_000_000_000_000_000_000

fn seeded_pool() -> (Address, Address) uses (evm: mut Evm) {
    let token = evm.create2<TestToken>(value: Wei::zero(), args: (), salt: 0)
    let pool = evm.create2<ConstantProductPool>(value: Wei::zero(), args: (token,), salt: 1)
    let minted: bool = evm
        .call(
            addr: token,
            gas: 200000,
            value: Wei::zero(),
            message: TokenMsg::Mint { to: evm.address(), amount: SEED_TOKENS },
        )
    assert!(minted)
    let approved: bool = evm
        .call(
            addr: token,
            gas: 200000,
            value: Wei::zero(),
            message: TokenMsg::Approve { spender: pool, amount: SEED_TOKENS },
        )
    assert!(approved)
    evm.call(
        addr: pool,
        gas: 300000,
        value: wei(4_400_000_000_000_000_000),
        message: PoolMsg::Seed { token_amount: SEED_TOKENS },
    )
    (token, pool)
}

#[test(balance = 10_000_000_000_000_000_000)]
fn pool_buy_follows_the_constant_product_formula() uses (evm: mut Evm) {
    let (_, pool) = seeded_pool()
    let eth_in = 110_000_000_000_000_000
    let out: u256 = evm
        .call(
            addr: pool,
            gas: 300000,
            value: wei(eth_in),
            message: PoolMsg::BuyTokens { min_out: 0 },
        )
    assert!(
        out == mul_div(eth_in, SEED_TOKENS, 4_400_000_000_000_000_000 + eth_in),
    )
    let r: Reserves = evm
        .call(
            addr: pool,
            gas: 100000,
            value: Wei::zero(),
            message: PoolMsg::GetReserves {},
        )
    assert!(r.token == SEED_TOKENS - out)
    assert!(r.eth == wei(4_400_000_000_000_000_000 + eth_in))
}

msg UserMsg {
    #[selector = sol("roundTrip(address,address)")]
    RoundTrip { pool: Address, token: Address } -> Wei,
}

/// TEST ONLY: buys with the ETH it is sent, then sells everything back, and
/// can receive the ETH the pool pays out (the test runner cannot).
pub contract PoolUser uses (ctx: Ctx, call: mut Call) {
    recv UserMsg {
        #[payable]
        RoundTrip { pool, token } -> Wei uses (ctx, mut call) {
            let out: u256 = call
                .call(
                    addr: pool,
                    gas: 300000,
                    value: ctx.value(),
                    message: PoolMsg::BuyTokens { min_out: 0 },
                )
            let ok: bool = call
                .call(
                    addr: token,
                    gas: 100000,
                    value: Wei::zero(),
                    message: TokenMsg::Approve { spender: pool, amount: out },
                )
            assert!(ok)
            call.call(
                addr: pool,
                gas: 300000,
                value: Wei::zero(),
                message: PoolMsg::SellTokens { amount: out, min_out: Wei::zero() },
            )
        }
    }

    recv {
        #[payable]
        _ {}
    }
}

#[test(balance = 10_000_000_000_000_000_000)]
fn pool_round_trip_returns_no_more_than_it_cost() uses (evm: mut Evm) {
    let (token, pool) = seeded_pool()
    let user = evm.create2<PoolUser>(value: Wei::zero(), args: (), salt: 2)
    let back: Wei = evm
        .call(
            addr: user,
            gas: 1000000,
            value: ether(1),
            message: UserMsg::RoundTrip { pool, token },
        )
    assert!(back <= ether(1))
    assert!(evm.balance(user) == back)
}
```

- [ ] **Step 3: Run them**
Run: `fe test ingots/exchange`
Expected: FAIL — a compile error: `pool` / `ConstantProductPool` is not found

- [ ] **Step 4: The pool**
Write `ingots/exchange/src/pool.fe` with exactly this content:
```fe
//! BASELINE FOR THE CONTRAST, not part of AnyOrder. A constant-product pool
//! (x * y = k, no fee) whose output depends on transaction order, so a
//! sandwich around a victim's buy pays. Pricing follows the Fe guide's DEX
//! `quote` example (Apache-2.0), with no fee.

use core::num::mul_div
use std::abi::sol
use std::evm::erc20

#[abi]
pub struct Reserves { pub token: u256, pub eth: Wei }

impl Copy for Reserves {}

pub msg PoolMsg {
    #[selector = sol("seed(uint256)")]
    Seed { token_amount: u256 },
    #[selector = sol("buyTokens(uint256)")]
    BuyTokens { min_out: u256 } -> u256,
    #[selector = sol("sellTokens(uint256,uint256)")]
    SellTokens { amount: u256, min_out: Wei } -> Wei,
    #[selector = sol("reserves()")]
    GetReserves -> Reserves,
}

pub struct PoolState { pub token: Address, pub token_reserve: u256, pub eth_reserve: Wei }

pub contract ConstantProductPool uses (ctx: Ctx, call: mut Call) {
    mut pool: PoolState,

    init(token: Address) uses (mut pool) { pool.token = token }

    recv PoolMsg {
        #[payable]
        Seed { token_amount } uses (ctx, mut call, mut pool) {
            assert!(pool.token_reserve == 0, "already seeded")
            assert!(
                token_amount > 0 && ctx.value() > Wei::zero(),
                "empty seed",
            )
            pool.token_reserve = token_amount
            pool.eth_reserve = ctx.value()
            erc20::safe_transfer_from(
                token: pool.token,
                owner: ctx.caller(),
                receiver: ctx.address(),
                amount: token_amount,
            )
        }

        #[payable]
        BuyTokens { min_out } -> u256 uses (ctx, mut call, mut pool) {
            let eth_in = ctx.value()
            assert!(eth_in > Wei::zero(), "no eth")
            let out = mul_div(
                eth_in.as_wei(),
                pool.token_reserve,
                pool.eth_reserve.as_wei() + eth_in.as_wei(),
            )
            assert!(out > 0 && out >= min_out, "slippage limit")
            pool.eth_reserve = pool.eth_reserve + eth_in
            pool.token_reserve = pool.token_reserve - out
            erc20::safe_transfer(token: pool.token, receiver: ctx.caller(), amount: out)
            out
        }

        SellTokens { amount, min_out } -> Wei uses (ctx, mut call, mut pool) {
            assert!(amount > 0, "no tokens")
            let out = pool
                .eth_reserve
                .mul_div(
                    numerator: amount,
                    denominator: pool.token_reserve + amount,
                )
            assert!(out > Wei::zero() && out >= min_out, "slippage limit")
            pool.token_reserve = pool.token_reserve + amount
            pool.eth_reserve = pool.eth_reserve - out
            erc20::safe_transfer_from(
                token: pool.token,
                owner: ctx.caller(),
                receiver: ctx.address(),
                amount,
            )
            assert!(
                call.send_value(addr: ctx.caller(), gas: 50000, value: out).success(),
                "eth transfer failed",
            )
            out
        }

        GetReserves -> Reserves uses (pool) {
            Reserves { token: pool.token_reserve, eth: pool.eth_reserve }
        }
    }
}
```

- [ ] **Step 5: Export it**
Write `ingots/exchange/src/lib.fe` with exactly this content:
```fe
//! The AnyOrder exchange ingot: the `AnyOrder` contract, the `TestToken` it
//! trades, and the `ConstantProductPool` baseline for the sandwich contrast.
//! `AnyOrderTestClock`, `Trader` and `Reenterer` are test-only harnesses.

pub use interface::*
pub use pool::{ConstantProductPool, PoolMsg, Reserves}
pub use token::{TestToken, TokenMsg}
```

- [ ] **Step 6: Format and run the exchange tests**
Run: `fe fmt --check ingots/exchange && fe test ingots/exchange`
Expected: PASS — `test result: ok. 4 passed; 0 failed`

- [ ] **Step 7: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(core): constant-product baseline pool for the sandwich contrast`

---

### Task 9: Exchange logic, AnyOrder, the test-clock twin, proxy actors and lifecycle tests

**Files:**
- Modify: `ingots/exchange/src/lib.fe`
- Create: `ingots/exchange/src/logic.fe`
- Create: `ingots/exchange/src/anyorder.fe`
- Create: `ingots/exchange/src/testclock.fe`
- Create: `ingots/exchange/src/actors.fe`
- Create: `ingots/exchange/src/harness.fe`
- Test: `ingots/exchange/src/lifecycle_tests.fe`

**Depends on:** Task 8, Task 4
**Effort:** high
**Model tier:** top
**Provides:** `contract AnyOrder(token, genesis, batch_length, max_orders, min_quantity, max_price)`, `contract AnyOrderTestClock + msg TestClockMsg::SetNow { now: Timestamp } (test only)`, `contract Trader + msg TraderMsg, contract Reenterer + msg ReentererMsg (test only)`, `harness::{T, MILLI, MAX_PRICE, deploy_token, deploy_exchange, new_trader, fund_tokens, fund_eth, place_buy, place_sell, set_time, clear, claim, balances, batch_info, order_at, token_balance}`
**Requires:** `msg AnyOrderMsg + #[abi] views + events + errors (core spec section 8, ingot::interface)`, `struct Clock { now: Timestamp } + storage structs Settings, Book, Funds, Guard (ingot::state)`, `contract ConstantProductPool(token) + msg PoolMsg (seed, buyTokens, sellTokens, reserves)`, `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)`, `select_price(_ orders: MemVec<Order>) -> Clearing`, `allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256>`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`

- [ ] **Step 1: Context**
Security-sensitive: this task holds every fund movement. Upstream: `msg AnyOrderMsg + #[abi] views + events + errors (core spec section 8, ingot::interface)`, `struct Clock { now: Timestamp } + storage structs Settings, Book, Funds, Guard (ingot::state)` (Task 7), `contract ConstantProductPool(token) + msg PoolMsg (seed, buyTokens, sellTokens, reserves)` (Task 8), `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)` (Task 1), `select_price(_ orders: MemVec<Order>) -> Clearing`, `allocate(_ orders: MemVec<Order>, _ clearing: Clearing) -> MemVec<u256>`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`. Only `deposit_token` and `withdraw` hold `Call`; `place`, `clear_batch` and `claim` must not. Error selectors asserted by the tests: core spec section 8.

- [ ] **Step 2: Write the failing lifecycle and revert tests**
Write `ingots/exchange/src/lifecycle_tests.fe` with exactly this content:
```fe
//! Multi-actor lifecycle: deposit, place, clear, claim, withdraw, and every
//! revert path with its exact error selector.

use std::evm::{ether, seconds, wei}
use ingot::actors::TraderMsg
use ingot::anyorder::AnyOrder
use ingot::harness::{
    MAX_PRICE,
    MILLI,
    T,
    balances,
    batch_info,
    claim,
    clear,
    deploy_exchange,
    deploy_token,
    fund_eth,
    fund_tokens,
    new_trader,
    order_at,
    place_buy,
    place_sell,
    set_time,
    token_balance,
}
use ingot::interface::{AnyOrderMsg, ConfigView}

#[test(balance = 10_000_000_000_000_000_000)]
fn lifecycle_deposit_place_clear_claim_withdraw() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let seller = new_trader(salt: 2)
    let buyer = new_trader(salt: 3)
    fund_tokens(token, exchange, trader: seller, amount: 10 * T)
    fund_eth(exchange, trader: buyer, amount: wei(48 * MILLI))

    let s = place_sell(
        exchange,
        trader: seller,
        limit: 11 * MILLI,
        quantity: 10 * T,
    )
    let b = place_buy(
        exchange,
        trader: buyer,
        limit: 12 * MILLI,
        quantity: 4 * T,
    )
    assert!(s.batch == 0 && s.index == 0 && b.index == 1)
    // The buy locked 4 tokens at its limit: 0.048 ETH, nothing left free.
    assert!(balances(exchange, owner: buyer).quote == Wei::zero())
    assert!(
        order_at(exchange, batch: 0, index: 1).locked == wei(48 * MILLI),
    )
    assert!(batch_info(exchange, batch: 0).status == 0)

    set_time(exchange, now: 60)
    assert!(batch_info(exchange, batch: 0).status == 1)
    let c = clear(exchange, batch: 0)
    // Excess supply at both candidates, so the lowest wins: 0.011 ETH.
    assert!(c.traded && c.price == 11 * MILLI && c.volume == 4 * T)
    assert!(batch_info(exchange, batch: 0).status == 2)

    let pb = claim(exchange, batch: 0, index: 1)
    assert!(pb.base == 4 * T && pb.quote == wei(4 * MILLI))
    let ps = claim(exchange, batch: 0, index: 0)
    assert!(ps.base == 6 * T && ps.quote == wei(44 * MILLI))

    evm.call(
        addr: buyer,
        gas: 500000,
        value: Wei::zero(),
        message: TraderMsg::Withdraw { exchange, base: 4 * T, quote: wei(4 * MILLI) },
    )
    evm.call(
        addr: seller,
        gas: 500000,
        value: Wei::zero(),
        message: TraderMsg::Withdraw { exchange, base: 6 * T, quote: wei(44 * MILLI) },
    )
    assert!(token_balance(token, account: buyer) == 4 * T)
    assert!(token_balance(token, account: seller) == 6 * T)
    assert!(evm.balance(buyer) == wei(4 * MILLI))
    assert!(evm.balance(seller) == wei(44 * MILLI))
    assert!(evm.balance(exchange) == Wei::zero())
    assert!(token_balance(token, account: exchange) == 0)
}

#[test(balance = 10_000_000_000_000_000_000)]
fn lifecycle_production_contract_open_phase() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = evm
        .create2<AnyOrder>(
            value: Wei::zero(),
            args: (token, evm.timestamp(), seconds(60), 16, 1, MAX_PRICE),
            salt: 1,
        )
    let cfg: ConfigView = evm
        .call(
            addr: exchange,
            gas: 100000,
            value: Wei::zero(),
            message: AnyOrderMsg::Config {},
        )
    assert!(cfg.token == token && cfg.max_orders == 16)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: ether(1))
    let b = place_buy(exchange, trader: buyer, limit: 12 * MILLI, quantity: T)
    let now: u256 = evm
        .call(
            addr: exchange,
            gas: 100000,
            value: Wei::zero(),
            message: AnyOrderMsg::CurrentBatch {},
        )
    assert!(b.batch == now)
    // The batch that holds the order is still open: clearing it reverts.
    let r = evm
        .try_call(
            addr: exchange,
            gas: 1000000,
            value: Wei::zero(),
            message: AnyOrderMsg::Clear { batch: now },
        )
    assert!(!r.success())
}

#[test(should_revert, selector = 0xbd49034f, balance = 10_000_000_000_000_000_000)]
fn revert_below_minimum() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = evm
        .create2<AnyOrder>(
            value: Wei::zero(),
            args: (token, evm.timestamp(), seconds(60), 16, 5, MAX_PRICE),
            salt: 1,
        )
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: ether(1))
    let _ = place_buy(exchange, trader: buyer, limit: 12 * MILLI, quantity: 4)
}

#[test(should_revert, selector = 0x9c6cd57b, balance = 10_000_000_000_000_000_000)]
fn revert_price_out_of_range() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: ether(1))
    let _ = place_buy(exchange, trader: buyer, limit: MAX_PRICE + 1, quantity: 1)
}

#[test(should_revert, selector = 0x03eb8b54, balance = 10_000_000_000_000_000_000)]
fn revert_place_insufficient_funds() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: wei(47 * MILLI))
    let _ = place_buy(
        exchange,
        trader: buyer,
        limit: 12 * MILLI,
        quantity: 4 * T,
    )
}

#[test(should_revert, selector = 0xdba84217, balance = 10_000_000_000_000_000_000)]
fn revert_batch_full() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 2, salt: 1)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: ether(1))
    let _ = place_buy(exchange, trader: buyer, limit: 12 * MILLI, quantity: T)
    let _ = place_buy(exchange, trader: buyer, limit: 12 * MILLI, quantity: T)
    let _ = place_buy(exchange, trader: buyer, limit: 12 * MILLI, quantity: T)
}

#[test(should_revert, selector = 0x1fdae862)]
fn revert_clear_still_open() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    set_time(exchange, now: 59)
    let _ = clear(exchange, batch: 0)
}

#[test(should_revert, selector = 0x4813055c)]
fn revert_clear_twice() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    set_time(exchange, now: 60)
    let _ = clear(exchange, batch: 0)
    let _ = clear(exchange, batch: 0)
}

#[test(should_revert, selector = 0xfc8d5c0d, balance = 10_000_000_000_000_000_000)]
fn revert_claim_before_clear() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: ether(1))
    let _ = place_buy(exchange, trader: buyer, limit: 12 * MILLI, quantity: T)
    let _ = claim(exchange, batch: 0, index: 0)
}

#[test(should_revert, selector = 0x927e5636)]
fn revert_claim_unknown_order() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    set_time(exchange, now: 60)
    let _ = clear(exchange, batch: 0)
    let _ = claim(exchange, batch: 0, index: 0)
}

#[test(should_revert, selector = 0x6bd4745f, balance = 10_000_000_000_000_000_000)]
fn revert_claim_twice() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: ether(1))
    let _ = place_buy(exchange, trader: buyer, limit: 12 * MILLI, quantity: T)
    set_time(exchange, now: 60)
    let _ = clear(exchange, batch: 0)
    let _ = claim(exchange, batch: 0, index: 0)
    let _ = claim(exchange, batch: 0, index: 0)
}

#[test(should_revert, selector = 0x03eb8b54, balance = 10_000_000_000_000_000_000)]
fn revert_withdraw_more_than_free() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: wei(10 * MILLI))
    evm.call(
        addr: buyer,
        gas: 500000,
        value: Wei::zero(),
        message: TraderMsg::Withdraw { exchange, base: 0, quote: wei(11 * MILLI) },
    )
}

#[test(should_revert, selector = 0x1f2a2005)]
fn revert_zero_deposit() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let buyer = new_trader(salt: 2)
    fund_eth(exchange, trader: buyer, amount: Wei::zero())
}
```

- [ ] **Step 3: Run them**
Run: `fe test ingots/exchange`
Expected: FAIL — a compile error: `harness` / `AnyOrder` is not found

- [ ] **Step 4: Every handler as a free function with its `uses` clause**
Write `ingots/exchange/src/logic.fe` with exactly this content:
```fe
//! The exchange's handlers as free functions. Their `uses` clauses are the
//! point: only `deposit_token` and `withdraw` hold `Call`, so they are the
//! only functions that can move funds out of or into the contract. Placing,
//! clearing and claiming change storage and nothing else.

use core::ptr::MemVec
use std::evm::erc20
use anyorder_clearing::{MAX_QUANTITY, Order, allocate, cost_ceil, proceeds_floor, select_price}
use ingot::interface::{
    AboveMaximum,
    AlreadyClaimed,
    AlreadyCleared,
    BatchCleared,
    BatchFull,
    BatchStillOpen,
    BatchView,
    BelowMinimum,
    BalancesView,
    Claimed,
    ClearingView,
    ConfigView,
    Deposited,
    InsufficientFunds,
    NotCleared,
    OrderPlaced,
    OrderRef,
    OrderView,
    Payout,
    PriceOutOfRange,
    Reentrant,
    TransferFailed,
    UnknownOrder,
    Withdrawn,
    ZeroAmount,
}
use ingot::state::{BatchSlot, Book, Clock, Funds, Guard, OrderSlot, Settings}

/// The batch that `clock.now` falls in: batch k covers
/// [genesis + k * length, genesis + (k + 1) * length).
pub fn current_batch() -> u256 uses (clock: Clock, settings: Settings) {
    (clock.now - settings.genesis).as_seconds() / settings.batch_length.as_seconds()
}

pub fn batch_start(batch: u256) -> Timestamp uses (settings: Settings) {
    settings.genesis + settings.batch_length * batch
}

pub fn batch_end(batch: u256) -> Timestamp uses (settings: Settings) {
    settings.genesis + settings.batch_length * (batch + 1)
}

pub fn deposit_eth(owner: Address, amount: Wei)
uses (funds: mut Funds, log: mut Log)
{
    if amount == Wei::zero() {
        revert_error(ZeroAmount {})
    }
    funds.quote.set(key: owner, value: funds.quote.get(key: owner) + amount)
    log.emit(Deposited { owner, base: 0, quote: amount })
}

pub fn deposit_token(owner: Address, amount: u256)
uses (ctx: Ctx, call: mut Call, settings: Settings, funds: mut Funds, log: mut Log)
{
    if amount == 0 {
        revert_error(ZeroAmount {})
    }
    erc20::safe_transfer_from(
        token: settings.token,
        owner,
        receiver: ctx.address(),
        amount,
    )
    funds.base.set(key: owner, value: funds.base.get(key: owner) + amount)
    log.emit(Deposited { owner, base: amount, quote: Wei::zero() })
}

/// Pays `base` tokens and `quote` wei out of `owner`'s free balances. State is
/// final before either external call, and a transient lock refuses reentry.
pub fn withdraw(owner: Address, base: u256, quote: Wei)
uses (
    ctx: Ctx,
    call: mut Call,
    settings: Settings,
    funds: mut Funds,
    guard: mut Guard,
    log: mut Log,
)
{
    if guard.entered.value {
        revert_error(Reentrant {})
    }
    guard.entered.value = true
    if base == 0 && quote == Wei::zero() {
        revert_error(ZeroAmount {})
    }
    let free_base = funds.base.get(key: owner)
    if base > free_base {
        revert_error(InsufficientFunds { available: free_base, required: base })
    }
    let free_quote = funds.quote.get(key: owner)
    if quote > free_quote {
        revert_error(
            InsufficientFunds { available: free_quote.as_wei(), required: quote.as_wei() },
        )
    }
    funds.base.set(key: owner, value: free_base - base)
    funds.quote.set(key: owner, value: free_quote - quote)
    if base > 0 {
        erc20::safe_transfer(token: settings.token, receiver: owner, amount: base)
    }
    if quote > Wei::zero() {
        if !call.send_value(addr: owner, gas: 50000, value: quote).success() {
            revert_error(TransferFailed {})
        }
    }
    log.emit(Withdrawn { owner, base, quote })
    guard.entered.value = false
}

/// Places a limit order in the current batch, locking its funds. No `Call`:
/// placing an order cannot move funds.
pub fn place(owner: Address, is_buy: bool, limit: u256, quantity: u256) -> OrderRef
uses (clock: Clock, settings: Settings, book: mut Book, funds: mut Funds, log: mut Log)
{
    if quantity < settings.min_quantity {
        revert_error(BelowMinimum { quantity, minimum: settings.min_quantity })
    }
    if quantity > MAX_QUANTITY {
        revert_error(AboveMaximum { quantity, maximum: MAX_QUANTITY })
    }
    if limit == 0 || limit > settings.max_price {
        revert_error(PriceOutOfRange { limit, max_price: settings.max_price })
    }
    let batch = current_batch()
    let slot = book.batches.get(key: batch)
    if slot.count >= settings.max_orders {
        revert_error(BatchFull { batch, max_orders: settings.max_orders })
    }
    var locked = Wei::zero()
    if is_buy {
        locked = cost_ceil(quantity, price: limit)
        let free = funds.quote.get(key: owner)
        if locked > free {
            revert_error(
                InsufficientFunds { available: free.as_wei(), required: locked.as_wei() },
            )
        }
        funds.quote.set(key: owner, value: free - locked)
    } else {
        let free = funds.base.get(key: owner)
        if quantity > free {
            revert_error(InsufficientFunds { available: free, required: quantity })
        }
        funds.base.set(key: owner, value: free - quantity)
    }
    let owner_seq = book.seqs.get(key: owner)
    book.seqs.set(key: owner, value: owner_seq + 1)
    let index = slot.count
    book.orders
        .set(
            key: (batch, index),
            value: OrderSlot {
                owner,
                is_buy,
                limit,
                quantity,
                owner_seq,
                locked,
                filled: 0,
                claimed: false,
            },
        )
    book.batches
        .set(
            key: batch,
            value: BatchSlot {
                count: index + 1,
                cleared: false,
                traded: false,
                price: 0,
                volume: 0,
            },
        )
    log.emit(
        OrderPlaced { batch, owner, index, is_buy, limit, quantity },
    )
    OrderRef { batch, index }
}

/// The orders of a batch as clearing sees them: contents only.
pub fn load_orders(batch: u256, count: u256) -> MemVec<Order> uses (book: Book) {
    var orders = MemVec<Order>::new()
    var i: u256 = 0
    while i < count {
        let o = book.orders.get(key: (batch, i))
        orders
            .push(
                Order {
                    is_buy: o.is_buy,
                    limit: o.limit,
                    quantity: o.quantity,
                    owner: o.owner.word(),
                    owner_seq: o.owner_seq,
                },
            )
        i += 1
    }
    orders
}

/// Clears a closed batch. Anyone may call it once the batch has ended. No
/// `Call`, and the clock is the only thing it reads besides the book.
pub fn clear_batch(batch: u256) -> ClearingView
uses (clock: Clock, settings: Settings, book: mut Book, log: mut Log)
{
    if batch >= current_batch() {
        revert_error(
            BatchStillOpen { batch, ends_at: batch_end(batch).as_seconds() },
        )
    }
    let slot = book.batches.get(key: batch)
    if slot.cleared {
        revert_error(AlreadyCleared { batch })
    }
    let orders = load_orders(batch, count: slot.count)
    let c = select_price(orders)
    let fills = allocate(orders, c)
    var i: u256 = 0
    while i < slot.count {
        let filled = fills[i.downcast_unchecked()]
        if filled > 0 {
            var o = book.orders.get(key: (batch, i))
            o.filled = filled
            book.orders.set(key: (batch, i), value: o)
        }
        i += 1
    }
    book.batches
        .set(
            key: batch,
            value: BatchSlot {
                count: slot.count,
                cleared: true,
                traded: c.traded,
                price: c.price,
                volume: c.volume,
            },
        )
    log.emit(
        BatchCleared { batch, traded: c.traded, price: c.price, volume: c.volume },
    )
    ClearingView { traded: c.traded, price: c.price, volume: c.volume }
}

/// Settles one order of a cleared batch into its owner's free balances.
/// Anyone may call it; the proceeds always go to the order's owner.
pub fn claim(batch: u256, index: u256) -> Payout
uses (book: mut Book, funds: mut Funds, log: mut Log)
{
    let slot = book.batches.get(key: batch)
    if !slot.cleared {
        revert_error(NotCleared { batch })
    }
    if index >= slot.count {
        revert_error(UnknownOrder { batch, index })
    }
    var o = book.orders.get(key: (batch, index))
    if o.claimed {
        revert_error(AlreadyClaimed { batch, index })
    }
    o.claimed = true
    book.orders.set(key: (batch, index), value: o)
    var payout = Payout { base: 0, quote: Wei::zero() }
    if o.is_buy {
        let paid = cost_ceil(quantity: o.filled, price: slot.price)
        payout = Payout { base: o.filled, quote: o.locked - paid }
    } else {
        payout = Payout {
            base: o.quantity - o.filled,
            quote: proceeds_floor(quantity: o.filled, price: slot.price),
        }
    }
    funds.base.set(
            key: o.owner,
            value: funds.base.get(key: o.owner) + payout.base,
        )
    funds.quote.set(
            key: o.owner,
            value: funds.quote.get(key: o.owner) + payout.quote,
        )
    log.emit(
        Claimed { batch, owner: o.owner, index, base: payout.base, quote: payout.quote },
    )
    payout
}

/// The clearing a batch would get right now: the same pure functions on the
/// stored book, read-only.
pub fn preview(batch: u256) -> ClearingView uses (book: Book) {
    let slot = book.batches.get(key: batch)
    let c = select_price(load_orders(batch, count: slot.count))
    ClearingView { traded: c.traded, price: c.price, volume: c.volume }
}

pub fn config_view() -> ConfigView uses (settings: Settings) {
    ConfigView {
        token: settings.token,
        genesis: settings.genesis,
        batch_length: settings.batch_length,
        max_orders: settings.max_orders,
        min_quantity: settings.min_quantity,
        max_price: settings.max_price,
    }
}

pub fn batch_view(batch: u256) -> BatchView
uses (clock: Clock, settings: Settings, book: Book)
{
    let slot = book.batches.get(key: batch)
    var status: u8 = 0
    if slot.cleared {
        status = 2
    } else if batch < current_batch() {
        status = 1
    }
    BatchView {
        start: batch_start(batch),
        end: batch_end(batch),
        order_count: slot.count,
        status,
        traded: slot.traded,
        price: slot.price,
        volume: slot.volume,
    }
}

pub fn order_view(batch: u256, index: u256) -> OrderView uses (book: Book) {
    if index >= book.batches.get(key: batch).count {
        revert_error(UnknownOrder { batch, index })
    }
    let o = book.orders.get(key: (batch, index))
    OrderView {
        owner: o.owner,
        is_buy: o.is_buy,
        limit: o.limit,
        quantity: o.quantity,
        owner_seq: o.owner_seq,
        locked: o.locked,
        filled: o.filled,
        claimed: o.claimed,
    }
}

pub fn balances_view(owner: Address) -> BalancesView uses (funds: Funds) {
    BalancesView { base: funds.base.get(key: owner), quote: funds.quote.get(key: owner) }
}
```

- [ ] **Step 5: AnyOrder: Clock from the block timestamp**
Write `ingots/exchange/src/anyorder.fe` with exactly this content:
```fe
//! AnyOrder: a uniform-price batch-auction exchange. Every handler declares
//! the storage it touches; only `DepositToken` and `Withdraw` hold `Call`.

use ingot::interface::{
    AnyOrderMsg,
    BalancesView,
    BatchView,
    ClearingView,
    ConfigView,
    OrderRef,
    OrderView,
    Payout,
}
use ingot::logic::{
    balances_view,
    batch_view,
    claim,
    clear_batch,
    config_view,
    current_batch,
    deposit_eth,
    deposit_token,
    order_view,
    place,
    preview,
    withdraw,
}
use ingot::state::{Book, Clock, Funds, Guard, Settings}

/// The largest per-batch order cap a deployment may choose.
pub const MAX_ORDERS_CAP: u256 = 256

pub contract AnyOrder uses (ctx: Ctx, call: mut Call, log: mut Log) {
    mut settings: Settings,
    mut book: Book,
    mut funds: Funds,
    mut guard: Guard,

    init(
        token: Address,
        genesis: Timestamp,
        batch_length: Duration,
        max_orders: u256,
        min_quantity: u256,
        max_price: u256,
    )
    uses (ctx, mut settings)
    {
        assert!(genesis <= ctx.timestamp(), "genesis is in the future")
        assert!(batch_length > Duration::zero(), "batch length is zero")
        assert!(
            max_orders > 0 && max_orders <= MAX_ORDERS_CAP,
            "max orders out of range",
        )
        assert!(min_quantity > 0, "min quantity is zero")
        assert!(max_price > 0, "max price is zero")
        settings.token = token
        settings.genesis = genesis
        settings.batch_length = batch_length
        settings.max_orders = max_orders
        settings.min_quantity = min_quantity
        settings.max_price = max_price
    }

    recv AnyOrderMsg {
        #[payable]
        DepositEth uses (ctx, mut funds, mut log) {
            deposit_eth(owner: ctx.caller(), amount: ctx.value())
        }

        DepositToken { amount } uses (ctx, mut call, settings, mut funds, mut log) {
            deposit_token(owner: ctx.caller(), amount)
        }

        Withdraw { base, quote } uses (ctx, mut call, settings, mut funds, mut guard, mut log) {
            withdraw(owner: ctx.caller(), base, quote)
        }

        PlaceBuy { limit, quantity } -> OrderRef uses (
            ctx,
            settings,
            mut book,
            mut funds,
            mut log,
        ) {
            with (Clock { now: ctx.timestamp() }) {
                place(owner: ctx.caller(), is_buy: true, limit, quantity)
            }
        }

        PlaceSell { limit, quantity } -> OrderRef
        uses (ctx, settings, mut book, mut funds, mut log)
        {
            with (Clock { now: ctx.timestamp() }) {
                place(owner: ctx.caller(), is_buy: false, limit, quantity)
            }
        }

        Clear { batch } -> ClearingView uses (ctx, settings, mut book, mut log) {
            with (Clock { now: ctx.timestamp() }) {
                clear_batch(batch)
            }
        }

        Claim { batch, index } -> Payout uses (mut book, mut funds, mut log) {
            claim(batch, index)
        }

        Config -> ConfigView uses (settings) {
            config_view()
        }

        CurrentBatch -> u256 uses (ctx, settings) {
            with (Clock { now: ctx.timestamp() }) {
                current_batch()
            }
        }

        BatchInfo { batch } -> BatchView uses (ctx, settings, book) {
            with (Clock { now: ctx.timestamp() }) {
                batch_view(batch)
            }
        }

        OrderAt { batch, index } -> OrderView uses (book) {
            order_view(batch, index)
        }

        Preview { batch } -> ClearingView uses (book) {
            preview(batch)
        }

        Balances { owner } -> BalancesView uses (funds) {
            balances_view(owner)
        }
    }
}
```

- [ ] **Step 6: AnyOrderTestClock (TEST ONLY): the same functions, Clock from a stored test time**
Write `ingots/exchange/src/testclock.fe` with exactly this content:
```fe
//! TEST ONLY. `AnyOrderTestClock` is `AnyOrder` with the clock read from a
//! stored test time that `setNow` moves forward, because `fe test` cannot
//! warp the block timestamp. Every arm calls the same free functions as
//! `AnyOrder`; only the source of `Clock` differs. It is never deployed by the
//! local run or the dApp.

use std::abi::sol
use ingot::anyorder::MAX_ORDERS_CAP
use ingot::interface::{
    AnyOrderMsg,
    BalancesView,
    BatchView,
    ClearingView,
    ConfigView,
    OrderRef,
    OrderView,
    Payout,
}
use ingot::logic::{
    balances_view,
    batch_view,
    claim,
    clear_batch,
    config_view,
    current_batch,
    deposit_eth,
    deposit_token,
    order_view,
    place,
    preview,
    withdraw,
}
use ingot::state::{Book, Clock, Funds, Guard, Settings}

pub msg TestClockMsg {
    #[selector = sol("setNow(uint256)")]
    SetNow { now: Timestamp },
}

pub contract AnyOrderTestClock uses (ctx: Ctx, call: mut Call, log: mut Log) {
    mut settings: Settings,
    mut book: Book,
    mut funds: Funds,
    mut guard: Guard,
    mut test_now: Timestamp,

    init(
        token: Address,
        genesis: Timestamp,
        batch_length: Duration,
        max_orders: u256,
        min_quantity: u256,
        max_price: u256,
    )
    uses (mut settings, mut test_now)
    {
        assert!(batch_length > Duration::zero(), "batch length is zero")
        assert!(
            max_orders > 0 && max_orders <= MAX_ORDERS_CAP,
            "max orders out of range",
        )
        assert!(min_quantity > 0, "min quantity is zero")
        assert!(max_price > 0, "max price is zero")
        settings.token = token
        settings.genesis = genesis
        settings.batch_length = batch_length
        settings.max_orders = max_orders
        settings.min_quantity = min_quantity
        settings.max_price = max_price
        test_now = genesis
    }

    recv TestClockMsg {
        SetNow { now } uses (mut test_now) {
            assert!(now >= test_now, "test time only moves forward")
            test_now = now
        }
    }

    recv AnyOrderMsg {
        #[payable]
        DepositEth uses (ctx, mut funds, mut log) {
            deposit_eth(owner: ctx.caller(), amount: ctx.value())
        }

        DepositToken { amount } uses (ctx, mut call, settings, mut funds, mut log) {
            deposit_token(owner: ctx.caller(), amount)
        }

        Withdraw { base, quote } uses (ctx, mut call, settings, mut funds, mut guard, mut log) {
            withdraw(owner: ctx.caller(), base, quote)
        }

        PlaceBuy { limit, quantity } -> OrderRef uses (
            ctx,
            test_now,
            settings,
            mut book,
            mut funds,
            mut log,
        ) {
            with (Clock { now: test_now }) {
                place(owner: ctx.caller(), is_buy: true, limit, quantity)
            }
        }

        PlaceSell { limit, quantity } -> OrderRef
        uses (ctx, test_now, settings, mut book, mut funds, mut log)
        {
            with (Clock { now: test_now }) {
                place(owner: ctx.caller(), is_buy: false, limit, quantity)
            }
        }

        Clear { batch } -> ClearingView uses (test_now, settings, mut book, mut log) {
            with (Clock { now: test_now }) {
                clear_batch(batch)
            }
        }

        Claim { batch, index } -> Payout uses (mut book, mut funds, mut log) {
            claim(batch, index)
        }

        Config -> ConfigView uses (settings) {
            config_view()
        }

        CurrentBatch -> u256 uses (test_now, settings) {
            with (Clock { now: test_now }) {
                current_batch()
            }
        }

        BatchInfo { batch } -> BatchView uses (test_now, settings, book) {
            with (Clock { now: test_now }) {
                batch_view(batch)
            }
        }

        OrderAt { batch, index } -> OrderView uses (book) {
            order_view(batch, index)
        }

        Preview { batch } -> ClearingView uses (book) {
            preview(batch)
        }

        Balances { owner } -> BalancesView uses (funds) {
            balances_view(owner)
        }
    }
}
```

- [ ] **Step 7: Proxy actors (TEST ONLY): Trader and the hostile Reenterer**
Write `ingots/exchange/src/actors.fe` with exactly this content:
```fe
//! TEST ONLY. `Trader` is a proxy actor: `fe test` cannot impersonate
//! addresses, so each trader in a test is its own contract and forwards calls
//! to the exchange, the pool and the token. Pattern from the v26.6.0 test
//! fixtures `ownable.fe` and `escrow.fe` (Apache-2.0). Never deployed by the
//! local run or the dApp.

use std::abi::sol
use ingot::interface::{AnyOrderMsg, OrderRef, Payout}
use ingot::pool::PoolMsg
use ingot::token::TokenMsg

pub msg TraderMsg {
    #[selector = sol("approveToken(address,address,uint256)")]
    ApproveToken { token: Address, spender: Address, amount: u256 },
    #[selector = sol("depositToken(address,uint256)")]
    DepositToken { exchange: Address, amount: u256 },
    #[selector = sol("depositEth(address)")]
    DepositEth { exchange: Address },
    #[selector = sol("placeBuy(address,uint256,uint256)")]
    PlaceBuy { exchange: Address, limit: u256, quantity: u256 } -> OrderRef,
    #[selector = sol("placeSell(address,uint256,uint256)")]
    PlaceSell { exchange: Address, limit: u256, quantity: u256 } -> OrderRef,
    #[selector = sol("claim(address,uint256,uint256)")]
    Claim { exchange: Address, batch: u256, index: u256 } -> Payout,
    #[selector = sol("withdraw(address,uint256,uint256)")]
    Withdraw { exchange: Address, base: u256, quote: Wei },
    #[selector = sol("poolBuy(address,uint256)")]
    PoolBuy { pool: Address, min_out: u256 } -> u256,
    #[selector = sol("poolSell(address,uint256,uint256)")]
    PoolSell { pool: Address, amount: u256, min_out: Wei } -> Wei,
}

pub contract Trader uses (ctx: Ctx, call: mut Call) {
    recv TraderMsg {
        ApproveToken { token, spender, amount } uses (mut call) {
            let ok: bool = call
                .call(
                    addr: token,
                    gas: 100000,
                    value: Wei::zero(),
                    message: TokenMsg::Approve { spender, amount },
                )
            assert!(ok, "approve failed")
        }

        DepositToken { exchange, amount } uses (mut call) {
            call.call(
                addr: exchange,
                gas: 200000,
                value: Wei::zero(),
                message: AnyOrderMsg::DepositToken { amount },
            )
        }

        #[payable]
        DepositEth { exchange } uses (ctx, mut call) {
            call.call(
                addr: exchange,
                gas: 100000,
                value: ctx.value(),
                message: AnyOrderMsg::DepositEth {},
            )
        }

        PlaceBuy { exchange, limit, quantity } -> OrderRef
        uses (mut call)
        {
            call.call(
                addr: exchange,
                gas: 500000,
                value: Wei::zero(),
                message: AnyOrderMsg::PlaceBuy { limit, quantity },
            )
        }

        PlaceSell { exchange, limit, quantity } -> OrderRef
        uses (mut call)
        {
            call.call(
                addr: exchange,
                gas: 500000,
                value: Wei::zero(),
                message: AnyOrderMsg::PlaceSell { limit, quantity },
            )
        }

        Claim { exchange, batch, index } -> Payout
        uses (mut call)
        {
            call.call(
                addr: exchange,
                gas: 300000,
                value: Wei::zero(),
                message: AnyOrderMsg::Claim { batch, index },
            )
        }

        Withdraw { exchange, base, quote } uses (mut call) {
            call.call(
                addr: exchange,
                gas: 300000,
                value: Wei::zero(),
                message: AnyOrderMsg::Withdraw { base, quote },
            )
        }

        #[payable]
        PoolBuy { pool, min_out } -> u256 uses (ctx, mut call) {
            call.call(
                addr: pool,
                gas: 300000,
                value: ctx.value(),
                message: PoolMsg::BuyTokens { min_out },
            )
        }

        PoolSell { pool, amount, min_out } -> Wei
        uses (mut call)
        {
            call.call(
                addr: pool,
                gas: 300000,
                value: Wei::zero(),
                message: PoolMsg::SellTokens { amount, min_out },
            )
        }
    }

    recv {
        #[payable]
        _ {}
    }
}

pub msg ReentererMsg {
    #[selector = sol("arm(address,uint256)")]
    Arm { exchange: Address, quote: Wei },
    #[selector = sol("pull(address,uint256)")]
    Pull { exchange: Address, quote: Wei },
}

/// TEST ONLY. A hostile payee: when the exchange pays it ETH, its fallback
/// calls `withdraw` again. The transient lock must refuse the second entry.
pub contract Reenterer uses (ctx: Ctx, call: mut Call) {
    mut target: Address,
    mut amount: Wei,

    recv ReentererMsg {
        #[payable]
        Arm { exchange, quote } uses (ctx, mut call, mut target, mut amount) {
            target = exchange
            amount = quote
            call.call(
                addr: exchange,
                gas: 100000,
                value: ctx.value(),
                message: AnyOrderMsg::DepositEth {},
            )
        }

        Pull { exchange, quote } uses (mut call) {
            call.call(
                addr: exchange,
                gas: 300000,
                value: Wei::zero(),
                message: AnyOrderMsg::Withdraw { base: 0, quote },
            )
        }
    }

    recv {
        #[payable]
        _ uses (mut call, target, amount) {
            call.call(
                addr: target,
                gas: 40000,
                value: Wei::zero(),
                message: AnyOrderMsg::Withdraw { base: 0, quote: amount },
            )
        }
    }
}
```

- [ ] **Step 8: The tests' helpers (TEST ONLY)**
Write `ingots/exchange/src/harness.fe` with exactly this content:
```fe
//! TEST ONLY. Helpers that deploy the test contracts and drive them through
//! `Trader` proxies, so each test reads as the scenario it checks.

use std::evm::seconds
use ingot::actors::{Trader, TraderMsg}
use ingot::interface::{
    AnyOrderMsg,
    BalancesView,
    BatchView,
    ClearingView,
    OrderRef,
    OrderView,
    Payout,
}
use ingot::testclock::{AnyOrderTestClock, TestClockMsg}
use ingot::token::{TestToken, TokenMsg}

/// One whole token, in base units.
pub const T: u256 = 1_000_000_000_000_000_000
/// 0.001 ETH, in wei: prices in the tests are multiples of it.
pub const MILLI: u256 = 1_000_000_000_000_000
/// Batch length in the tests, in seconds.
pub const BATCH_SECONDS: u256 = 60
/// The highest limit price the test exchanges accept (1,000 ETH per token).
pub const MAX_PRICE: u256 = 1_000_000_000_000_000_000_000

pub fn deploy_token(salt: u256) -> Address uses (evm: mut Evm) {
    evm.create2<TestToken>(value: Wei::zero(), args: (), salt)
}

/// A test-clock exchange with genesis 0, 60-second batches and `max_orders`.
pub fn deploy_exchange(token: Address, max_orders: u256, salt: u256) -> Address
uses (evm: mut Evm)
{
    evm.create2<AnyOrderTestClock>(
        value: Wei::zero(),
        args: (token, Timestamp::from_seconds(0), seconds(BATCH_SECONDS), max_orders, 1, MAX_PRICE),
        salt,
    )
}

pub fn new_trader(salt: u256) -> Address uses (evm: mut Evm) {
    evm.create2<Trader>(value: Wei::zero(), args: (), salt)
}

/// Mints `amount` tokens to `trader` and deposits them into `exchange`.
pub fn fund_tokens(token: Address, exchange: Address, trader: Address, amount: u256)
uses (evm: mut Evm)
{
    let minted: bool = evm
        .call(
            addr: token,
            gas: 200000,
            value: Wei::zero(),
            message: TokenMsg::Mint { to: trader, amount },
        )
    assert!(minted)
    evm.call(
        addr: trader,
        gas: 200000,
        value: Wei::zero(),
        message: TraderMsg::ApproveToken { token, spender: exchange, amount },
    )
    evm.call(
        addr: trader,
        gas: 300000,
        value: Wei::zero(),
        message: TraderMsg::DepositToken { exchange, amount },
    )
}

/// Sends `amount` wei from the test runner through `trader` into `exchange`.
pub fn fund_eth(exchange: Address, trader: Address, amount: Wei)
uses (evm: mut Evm)
{
    evm.call(
        addr: trader,
        gas: 200000,
        value: amount,
        message: TraderMsg::DepositEth { exchange },
    )
}

pub fn place_buy(exchange: Address, trader: Address, limit: u256, quantity: u256) -> OrderRef
uses (evm: mut Evm)
{
    evm.call(
        addr: trader,
        gas: 1000000,
        value: Wei::zero(),
        message: TraderMsg::PlaceBuy { exchange, limit, quantity },
    )
}

pub fn place_sell(exchange: Address, trader: Address, limit: u256, quantity: u256) -> OrderRef
uses (evm: mut Evm)
{
    evm.call(
        addr: trader,
        gas: 1000000,
        value: Wei::zero(),
        message: TraderMsg::PlaceSell { exchange, limit, quantity },
    )
}

pub fn set_time(exchange: Address, now: u256) uses (evm: mut Evm) {
    evm.call(
        addr: exchange,
        gas: 100000,
        value: Wei::zero(),
        message: TestClockMsg::SetNow { now: Timestamp::from_seconds(now) },
    )
}

pub fn clear(exchange: Address, batch: u256) -> ClearingView uses (evm: mut Evm) {
    evm.call(
        addr: exchange,
        gas: 30000000,
        value: Wei::zero(),
        message: AnyOrderMsg::Clear { batch },
    )
}

pub fn claim(exchange: Address, batch: u256, index: u256) -> Payout
uses (evm: mut Evm)
{
    evm.call(
        addr: exchange,
        gas: 500000,
        value: Wei::zero(),
        message: AnyOrderMsg::Claim { batch, index },
    )
}

pub fn balances(exchange: Address, owner: Address) -> BalancesView
uses (evm: mut Evm)
{
    evm.call(
        addr: exchange,
        gas: 100000,
        value: Wei::zero(),
        message: AnyOrderMsg::Balances { owner },
    )
}

pub fn batch_info(exchange: Address, batch: u256) -> BatchView uses (evm: mut Evm) {
    evm.call(
        addr: exchange,
        gas: 100000,
        value: Wei::zero(),
        message: AnyOrderMsg::BatchInfo { batch },
    )
}

pub fn order_at(exchange: Address, batch: u256, index: u256) -> OrderView
uses (evm: mut Evm)
{
    evm.call(
        addr: exchange,
        gas: 100000,
        value: Wei::zero(),
        message: AnyOrderMsg::OrderAt { batch, index },
    )
}

pub fn token_balance(token: Address, account: Address) -> u256 uses (evm: mut Evm) {
    evm.call(
        addr: token,
        gas: 100000,
        value: Wei::zero(),
        message: TokenMsg::BalanceOf { account },
    )
}
```

- [ ] **Step 9: Export everything**
Write `ingots/exchange/src/lib.fe` with exactly this content:
```fe
//! The AnyOrder exchange ingot: the `AnyOrder` contract, the `TestToken` it
//! trades, and the `ConstantProductPool` baseline for the sandwich contrast.
//! `AnyOrderTestClock`, `Trader` and `Reenterer` are test-only harnesses.

pub use anyorder::{AnyOrder, MAX_ORDERS_CAP}
pub use interface::*
pub use pool::{ConstantProductPool, PoolMsg, Reserves}
pub use token::{TestToken, TokenMsg}
pub use testclock::{AnyOrderTestClock, TestClockMsg}
pub use actors::{Reenterer, ReentererMsg, Trader, TraderMsg}
```

- [ ] **Step 10: Format and run the exchange tests**
Run: `fe fmt --check ingots/exchange && fe test ingots/exchange`
Expected: PASS — `test result: ok. 17 passed; 0 failed`

- [ ] **Step 11: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(core): AnyOrder exchange with effect-scoped handlers and lifecycle tests`

---

### Task 10: Freeze the ABI of the deployed contracts

**Files:**
- Create: `abi/AnyOrder.abi.json`
- Create: `abi/TestToken.abi.json`
- Create: `abi/ConstantProductPool.abi.json`
- Create: `scripts/check-abi.sh`
- Modify: `.github/workflows/ci.yml`

**Depends on:** Task 9, Task 5
**Effort:** low
**Model tier:** fast
**Provides:** `abi/AnyOrder.abi.json, abi/TestToken.abi.json, abi/ConstantProductPool.abi.json (frozen) + bash scripts/check-abi.sh`
**Requires:** `contract AnyOrder(token, genesis, batch_length, max_orders, min_quantity, max_price)`, `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)`, `contract ConstantProductPool(token) + msg PoolMsg (seed, buyTokens, sellTokens, reserves)`

- [ ] **Step 1: Context**
The three deployed contracts: `contract AnyOrder(token, genesis, batch_length, max_orders, min_quantity, max_price)` (Task 9), `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)` (Task 1), `contract ConstantProductPool(token) + msg PoolMsg (seed, buyTokens, sellTokens, reserves)` (Task 8). Test-only contracts (AnyOrderTestClock, Trader, Reenterer) are built into out/ too but are never snapshotted or deployed.

- [ ] **Step 2: Build and snapshot only the three deployed contracts' ABIs**
Run: `fe build && mkdir -p abi && for c in AnyOrder TestToken ConstantProductPool; do cp "out/$c.abi.json" "abi/$c.abi.json"; done && ls abi`
Expected: `AnyOrder.abi.json  ConstantProductPool.abi.json  TestToken.abi.json`

- [ ] **Step 3: The check script (deployed contracts only; quoted paths)**
Write `scripts/check-abi.sh` with exactly this content:
```bash
#!/usr/bin/env bash
# Builds the contracts and checks that the ABI of every DEPLOYED contract
# (AnyOrder, TestToken, ConstantProductPool) still matches its frozen snapshot
# in abi/. Test-only contracts are built too but are not part of the frozen
# interface. Paths are quoted, so a repository path with spaces works.
#
#   bash scripts/check-abi.sh        last line: ABI: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fe build "${ROOT}" --out-dir "${ROOT}/out" > /dev/null

status=0
for contract in AnyOrder TestToken ConstantProductPool; do
  if ! cmp -s "${ROOT}/out/${contract}.abi.json" "${ROOT}/abi/${contract}.abi.json"; then
    echo "ABI changed: ${contract} (out/${contract}.abi.json differs from abi/${contract}.abi.json)"
    status=1
  fi
done
if [[ "${status}" -eq 0 ]]; then echo "ABI: OK"; else echo "ABI: FAIL"; fi
exit "${status}"
```

- [ ] **Step 4: CI runs it**
Write `.github/workflows/ci.yml` with exactly this content:
```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

env:
  # Any Fe release from 26.5.0 on is allowed for the contest; this build pins 26.6.0.
  FE_VERSION: v26.6.0

jobs:
  fe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install Fe
        run: |
          curl -fsSL https://raw.githubusercontent.com/argotorg/fe/master/feup/feup.sh | bash -s -- --version "$FE_VERSION" --no-modify-path
          echo "$HOME/.fe/bin" >> "$GITHUB_PATH"
      - run: fe --version
      # fe fmt does not walk a workspace root: check each member.
      - run: fe fmt --check ingots/clearing
      - run: fe fmt --check ingots/exchange
      - run: fe test
      - run: fe build
      - uses: actions/setup-python@v6
        with:
          python-version: "3.12"
      # The exact-rational reference: vectors are current, and the rule matches the oracle.
      - run: python ref/clearing_ref.py --check
      - run: python ref/clearing_ref.py --selftest
      # The deployed contracts' ABIs still match their frozen snapshots.
      - run: bash scripts/check-abi.sh
```

- [ ] **Step 5: The snapshots match a fresh build**
Run: `bash scripts/check-abi.sh`
Expected: PASS — `ABI: OK`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `chore(core): freeze the ABI of AnyOrder, TestToken and the baseline pool`

---

### Task 11: Contract invariants: interleaving permutations, solvency, reentrancy

**Files:**
- Test: `ingots/exchange/src/invariant_tests.fe`

**Depends on:** Task 10
**Effort:** xhigh
**Model tier:** top
**Provides:** `permutation_contract_interleavings_seed_7, permutation_contract_interleavings_seed_8, solvency_holds_after_every_step_of_a_seeded_run, reentrancy_lock_refuses_a_second_withdraw`
**Requires:** `harness::{T, MILLI, MAX_PRICE, deploy_token, deploy_exchange, new_trader, fund_tokens, fund_eth, place_buy, place_sell, set_time, clear, claim, balances, batch_info, order_at, token_balance}`, `contract AnyOrderTestClock + msg TestClockMsg::SetNow { now: Timestamp } (test only)`, `contract Trader + msg TraderMsg, contract Reenterer + msg ReentererMsg (test only)`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`

- [ ] **Step 1: Context**
Uses `harness::{T, MILLI, MAX_PRICE, deploy_token, deploy_exchange, new_trader, fund_tokens, fund_eth, place_buy, place_sell, set_time, clear, claim, balances, batch_info, order_at, token_balance}`, `contract Trader + msg TraderMsg, contract Reenterer + msg ReentererMsg (test only)`, `contract AnyOrderTestClock + msg TestClockMsg::SetNow { now: Timestamp } (test only)`, `cost_ceil(quantity: u256, price: u256) -> Wei`, `proceeds_floor(quantity: u256, price: u256) -> Wei`. The contract-level permutation test shuffles the interleaving **across owners while each owner's own order sequence stays fixed**, 128 rounds per test (one test of 256 exceeds the test runner's per-test gas budget), two seeds.

- [ ] **Step 2: The invariant tests**
Write `ingots/exchange/src/invariant_tests.fe` with exactly this content:
```fe
//! Contract-level invariants: arrival-order independence across owners,
//! solvency after every step, and the reentrancy lock.

use std::evm::{ether, wei}
use std::evm::random::{KeccakRng, Rng, shuffle}
use anyorder_clearing::{cost_ceil, proceeds_floor}
use ingot::actors::{Reenterer, ReentererMsg, TraderMsg}
use ingot::harness::{
    MILLI,
    T,
    balances,
    batch_info,
    claim,
    clear,
    deploy_exchange,
    deploy_token,
    fund_eth,
    fund_tokens,
    new_trader,
    order_at,
    place_buy,
    place_sell,
    set_time,
    token_balance,
}
use ingot::interface::OrderRef

// Rounds per test. Two seeds give 256 interleavings; one test of 256 rounds
// runs past the test runner's per-test gas budget.
const PERMUTATION_ROUNDS: u256 = 128

// Owner `owner`'s `k`-th order. Each owner's own sequence is fixed; only the
// interleaving across owners changes between rounds.
fn place_scripted(exchange: Address, trader: Address, owner: u256, k: u256) -> OrderRef
uses (evm: mut Evm)
{
    if owner == 0 {
        if k == 0 {
            return place_sell(exchange, trader, limit: 10 * MILLI, quantity: 6 * T)
        }
        if k == 1 {
            return place_sell(exchange, trader, limit: 11 * MILLI, quantity: 4 * T + 7)
        }
        return place_buy(exchange, trader, limit: 9 * MILLI, quantity: 2 * T)
    }
    if owner == 1 {
        if k == 0 {
            return place_buy(exchange, trader, limit: 12 * MILLI, quantity: 5 * T)
        }
        if k == 1 {
            return place_buy(exchange, trader, limit: 11 * MILLI, quantity: 3 * T + 3)
        }
        return place_sell(exchange, trader, limit: 13 * MILLI, quantity: 2 * T)
    }
    if owner == 2 {
        if k == 0 {
            return place_buy(exchange, trader, limit: 11 * MILLI, quantity: 4 * T + 1)
        }
        if k == 1 {
            return place_sell(exchange, trader, limit: 11 * MILLI, quantity: 3 * T)
        }
        return place_buy(exchange, trader, limit: 10 * MILLI, quantity: 4 * T)
    }
    if k == 0 {
        return place_sell(exchange, trader, limit: 12 * MILLI, quantity: 5 * T)
    }
    if k == 1 {
        return place_buy(exchange, trader, limit: 11 * MILLI, quantity: 6 * T + 5)
    }
    place_sell(exchange, trader, limit: 9 * MILLI, quantity: T)
}

// Replays one book of 12 orders from 4 owners under PERMUTATION_ROUNDS seeded
// interleavings: the order across owners is shuffled, each owner's own order
// sequence stays fixed. Every round must give the same price and the same
// per-owner balances after all claims.
fn interleavings_agree(seed: u256) uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let traders = [
        new_trader(salt: 1),
        new_trader(salt: 2),
        new_trader(salt: 3),
        new_trader(salt: 4),
    ]
    var rng = KeccakRng::seeded(seed)
    var first_price: u256 = 0
    var first_base = [0, 0, 0, 0]
    var first_quote = [0, 0, 0, 0]
    var round: u256 = 0
    while round < PERMUTATION_ROUNDS {
        let exchange = deploy_exchange(token, max_orders: 16, salt: 100 + round)
        var t: usize = 0
        while t < 4 {
            fund_tokens(token, exchange, trader: traders[t], amount: 20 * T)
            fund_eth(exchange, trader: traders[t], amount: wei(200 * MILLI))
            t += 1
        }
        var slots: [u256; 12] = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]
        with (Rng = rng) {
            shuffle(mut slots)
        }
        var next = [0, 0, 0, 0]
        var i: usize = 0
        while i < 12 {
            let owner = slots[i]
            let at: usize = owner.downcast_unchecked()
            let _ = place_scripted(exchange, trader: traders[at], owner, k: next[at])
            next[at] = next[at] + 1
            i += 1
        }
        set_time(exchange, now: 60)
        let c = clear(exchange, batch: 0)
        assert!(c.traded)
        var index: u256 = 0
        while index < 12 {
            let _ = claim(exchange, batch: 0, index)
            index += 1
        }
        if round == 0 {
            first_price = c.price
        }
        assert!(c.price == first_price)
        t = 0
        while t < 4 {
            let b = balances(exchange, owner: traders[t])
            if round == 0 {
                first_base[t] = b.base
                first_quote[t] = b.quote.as_wei()
            }
            assert!(
                b.base == first_base[t] && b.quote.as_wei() == first_quote[t],
            )
            t += 1
        }
        round += 1
    }
}

#[test(balance = 1_000_000_000_000_000_000_000)]
fn permutation_contract_interleavings_seed_7() uses (evm: mut Evm) {
    interleavings_agree(seed: 7)
}

#[test(balance = 1_000_000_000_000_000_000_000)]
fn permutation_contract_interleavings_seed_8() uses (evm: mut Evm) {
    interleavings_agree(seed: 8)
}

// What the exchange owes, read through its views: free balances plus every
// unclaimed order's lock or payout. Its holdings must always cover it.
fn assert_solvent(token: Address, exchange: Address, traders: [Address; 4], batches: u256)
uses (evm: mut Evm)
{
    var owed_base: u256 = 0
    var owed_quote: u256 = 0
    var t: usize = 0
    while t < 4 {
        let b = balances(exchange, owner: traders[t])
        owed_base += b.base
        owed_quote += b.quote.as_wei()
        t += 1
    }
    var batch: u256 = 0
    while batch < batches {
        let info = batch_info(exchange, batch)
        var i: u256 = 0
        while i < info.order_count {
            let o = order_at(exchange, batch, index: i)
            if !o.claimed {
                if info.status == 2 {
                    if o.is_buy {
                        owed_base += o.filled
                        owed_quote += (o.locked - cost_ceil(quantity: o.filled, price: info.price))
                            .as_wei()
                    } else {
                        owed_base += o.quantity - o.filled
                        owed_quote += proceeds_floor(quantity: o.filled, price: info.price).as_wei()
                    }
                } else if o.is_buy {
                    owed_quote += o.locked.as_wei()
                } else {
                    owed_base += o.quantity
                }
            }
            i += 1
        }
        batch += 1
    }
    assert!(token_balance(token, account: exchange) >= owed_base)
    assert!(evm.balance(exchange).as_wei() >= owed_quote)
}

#[test(balance = 1_000_000_000_000_000_000_000)]
fn solvency_holds_after_every_step_of_a_seeded_run() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 32, salt: 1)
    let traders = [
        new_trader(salt: 2),
        new_trader(salt: 3),
        new_trader(salt: 4),
        new_trader(salt: 5),
    ]
    var t: usize = 0
    while t < 4 {
        fund_tokens(token, exchange, trader: traders[t], amount: 200 * T)
        fund_eth(exchange, trader: traders[t], amount: ether(3))
        t += 1
    }
    var rng = KeccakRng::seeded(11)
    var batch: u256 = 0
    while batch < 3 {
        var k: u256 = 0
        while k < 10 {
            let who: usize = rng.uniform(4).downcast_unchecked()
            let limit = (9 + rng.uniform(6)) * MILLI + rng.uniform(1000)
            let quantity = (1 + rng.uniform(5)) * T + rng.uniform(1_000_003)
            if rng.uniform(2) == 0 {
                let _ = place_buy(exchange, trader: traders[who], limit, quantity)
            } else {
                let _ = place_sell(exchange, trader: traders[who], limit, quantity)
            }
            assert_solvent(token, exchange, traders, batches: batch + 1)
            k += 1
        }
        set_time(exchange, now: 60 * (batch + 1))
        let _ = clear(exchange, batch)
        assert_solvent(token, exchange, traders, batches: batch + 1)
        var i: u256 = 0
        while i < 10 {
            let _ = claim(exchange, batch, index: i)
            assert_solvent(token, exchange, traders, batches: batch + 1)
            i += 1
        }
        batch += 1
    }
    // Everyone withdraws everything: the tokens balance exactly, and only
    // rounding dust (at most one wei per filled order) stays behind.
    t = 0
    while t < 4 {
        let b = balances(exchange, owner: traders[t])
        evm.call(
            addr: traders[t],
            gas: 500000,
            value: Wei::zero(),
            message: TraderMsg::Withdraw { exchange, base: b.base, quote: b.quote },
        )
        t += 1
    }
    assert!(token_balance(token, account: exchange) == 0)
    assert!(evm.balance(exchange).as_wei() <= 30)
}

#[test(balance = 10_000_000_000_000_000_000)]
fn reentrancy_lock_refuses_a_second_withdraw() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let exchange = deploy_exchange(token, max_orders: 16, salt: 1)
    let hostile = evm.create2<Reenterer>(value: Wei::zero(), args: (), salt: 2)
    evm.call(
        addr: hostile,
        gas: 300000,
        value: ether(1),
        message: ReentererMsg::Arm { exchange, quote: ether(1) },
    )
    // The payout re-enters `withdraw`; the lock refuses it, so the whole
    // withdrawal reverts and the balance stays put.
    let r = evm
        .try_call(
            addr: hostile,
            gas: 1000000,
            value: Wei::zero(),
            message: ReentererMsg::Pull { exchange, quote: ether(1) },
        )
    assert!(!r.success())
    assert!(balances(exchange, owner: hostile).quote == ether(1))
    assert!(evm.balance(exchange) == ether(1))
}
```

- [ ] **Step 3: Format and run the exchange tests**
Run: `fe fmt --check ingots/exchange && fe test ingots/exchange`
Expected: PASS — `test result: ok. 21 passed; 0 failed`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `test(core): arrival-order, solvency and reentrancy invariants at contract level`

---

### Task 12: The sandwich contrast (the money shot)

**Files:**
- Test: `ingots/exchange/src/sandwich_tests.fe`

**Depends on:** Task 11, Task 6
**Effort:** high
**Model tier:** top
**Provides:** `sandwich_cpmm_attacker_profits, sandwich_batch_attacker_nets_dust, sandwich_one_sided_moves_price`
**Requires:** `harness::{T, MILLI, MAX_PRICE, deploy_token, deploy_exchange, new_trader, fund_tokens, fund_eth, place_buy, place_sell, set_time, clear, claim, balances, batch_info, order_at, token_balance}`, `contract ConstantProductPool(token) + msg PoolMsg (seed, buyTokens, sellTokens, reserves)`, `contract Trader + msg TraderMsg, contract Reenterer + msg ReentererMsg (test only)`, `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)`

- [ ] **Step 1: Context**
Uses `harness::{T, MILLI, MAX_PRICE, deploy_token, deploy_exchange, new_trader, fund_tokens, fund_eth, place_buy, place_sell, set_time, clear, claim, balances, batch_info, order_at, token_balance}`, `contract ConstantProductPool(token) + msg PoolMsg (seed, buyTokens, sellTokens, reserves)`, `contract Trader + msg TraderMsg, contract Reenterer + msg ReentererMsg (test only)`, `contract TestToken + msg TokenMsg (decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint)`. The constants are the core spec section 6 table, computed by ref/clearing_ref.py; the batch tests compare an attacker-free and a sandwiched exchange built from the same background book.

- [ ] **Step 2: The three contrast tests**
Write `ingots/exchange/src/sandwich_tests.fe` with exactly this content:
```fe
//! The sandwich contrast. `fe test --filter sandwich` runs all of it: the
//! pool where the sandwich pays, the batch where it does not (condition C),
//! and the one-sided case where a batch price DOES move. The constants are the
//! README's demo table; ref/clearing_ref.py computes the same numbers.

use std::evm::wei
use ingot::actors::TraderMsg
use ingot::harness::{
    MILLI,
    T,
    balances,
    claim,
    clear,
    deploy_exchange,
    deploy_token,
    fund_eth,
    fund_tokens,
    new_trader,
    place_buy,
    place_sell,
    set_time,
}
use ingot::pool::{ConstantProductPool, PoolMsg}
use ingot::token::TokenMsg

// The pool: 400 tokens against 4.4 ETH, no fee.
const POOL_TOKENS: u256 = 400_000_000_000_000_000_000
const POOL_ETH: u256 = 4_400_000_000_000_000_000
// The attacker's front-run and the victim's buy, in wei.
const FRONT_RUN_ETH: u256 = 110_000_000_000_000_000
const VICTIM_ETH: u256 = 165_000_000_000_000_000
// What ref/clearing_ref.py computes for the pool.
const ATTACKER_TOKENS: u256 = 9_756_097_560_975_609_756
const VICTIM_TOKENS_FREE: u256 = 14_457_831_325_301_204_819
const VICTIM_TOKENS_SANDWICHED: u256 = 13_773_314_203_730_272_596
const BACK_RUN_ETH: u256 = 118_090_638_930_163_447

fn deploy_pool(token: Address, salt: u256) -> Address uses (evm: mut Evm) {
    let pool = evm.create2<ConstantProductPool>(value: Wei::zero(), args: (token,), salt)
    let minted: bool = evm
        .call(
            addr: token,
            gas: 200000,
            value: Wei::zero(),
            message: TokenMsg::Mint { to: evm.address(), amount: POOL_TOKENS },
        )
    assert!(minted)
    let approved: bool = evm
        .call(
            addr: token,
            gas: 200000,
            value: Wei::zero(),
            message: TokenMsg::Approve { spender: pool, amount: POOL_TOKENS },
        )
    assert!(approved)
    evm.call(
        addr: pool,
        gas: 300000,
        value: wei(POOL_ETH),
        message: PoolMsg::Seed { token_amount: POOL_TOKENS },
    )
    pool
}

#[test(balance = 100_000_000_000_000_000_000)]
fn sandwich_cpmm_attacker_profits() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let attacker = new_trader(salt: 1)
    let victim = new_trader(salt: 2)

    // Without the attacker, the victim's 0.165 ETH buys this much.
    let calm = deploy_pool(token, salt: 10)
    let alone: u256 = evm
        .call(
            addr: victim,
            gas: 500000,
            value: wei(VICTIM_ETH),
            message: TraderMsg::PoolBuy { pool: calm, min_out: 0 },
        )
    assert!(alone == VICTIM_TOKENS_FREE)

    // The sandwich: front-run, victim, back-run, in that transaction order.
    let pool = deploy_pool(token, salt: 11)
    let bought: u256 = evm
        .call(
            addr: attacker,
            gas: 500000,
            value: wei(FRONT_RUN_ETH),
            message: TraderMsg::PoolBuy { pool, min_out: 0 },
        )
    assert!(bought == ATTACKER_TOKENS)
    let got: u256 = evm
        .call(
            addr: victim,
            gas: 500000,
            value: wei(VICTIM_ETH),
            message: TraderMsg::PoolBuy { pool, min_out: 0 },
        )
    assert!(got == VICTIM_TOKENS_SANDWICHED)
    assert!(got < alone)
    evm.call(
        addr: attacker,
        gas: 200000,
        value: Wei::zero(),
        message: TraderMsg::ApproveToken { token, spender: pool, amount: bought },
    )
    let back: Wei = evm
        .call(
            addr: attacker,
            gas: 500000,
            value: Wei::zero(),
            message: TraderMsg::PoolSell { pool, amount: bought, min_out: Wei::zero() },
        )
    assert!(back == wei(BACK_RUN_ETH))
    // The attacker ends with more ETH than it spent and no tokens: a riskless profit.
    assert!(evm.balance(attacker) == wei(BACK_RUN_ETH))
    assert!(BACK_RUN_ETH - FRONT_RUN_ETH == 8_090_638_930_163_447)
}

// The background book of the batch: four sellers and one low buyer.
fn place_background(exchange: Address, makers: [Address; 5])
uses (evm: mut Evm)
{
    let _ = place_sell(
        exchange,
        trader: makers[0],
        limit: 10 * MILLI,
        quantity: 10 * T,
    )
    let _ = place_sell(
        exchange,
        trader: makers[1],
        limit: 11 * MILLI,
        quantity: 10 * T,
    )
    let _ = place_sell(
        exchange,
        trader: makers[2],
        limit: 12 * MILLI,
        quantity: 10 * T,
    )
    let _ = place_sell(
        exchange,
        trader: makers[3],
        limit: 13 * MILLI,
        quantity: 10 * T,
    )
    let _ = place_buy(
        exchange,
        trader: makers[4],
        limit: 9 * MILLI,
        quantity: 5 * T,
    )
}

fn fund_makers(token: Address, exchange: Address, makers: [Address; 5])
uses (evm: mut Evm)
{
    fund_tokens(token, exchange, trader: makers[0], amount: 10 * T)
    fund_tokens(token, exchange, trader: makers[1], amount: 10 * T)
    fund_tokens(token, exchange, trader: makers[2], amount: 10 * T)
    fund_tokens(token, exchange, trader: makers[3], amount: 10 * T)
    fund_eth(exchange, trader: makers[4], amount: wei(45 * MILLI))
}

#[test(balance = 100_000_000_000_000_000_000)]
fn sandwich_batch_attacker_nets_dust() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let makers = [
        new_trader(salt: 1),
        new_trader(salt: 2),
        new_trader(salt: 3),
        new_trader(salt: 4),
        new_trader(salt: 5),
    ]
    let victim = new_trader(salt: 6)
    let attacker = new_trader(salt: 7)

    // The attacker-free batch.
    let calm = deploy_exchange(token, max_orders: 16, salt: 20)
    fund_makers(token, exchange: calm, makers)
    fund_eth(exchange: calm, trader: victim, amount: wei(180 * MILLI))
    place_background(exchange: calm, makers)
    let v_calm = place_buy(
        exchange: calm,
        trader: victim,
        limit: 12 * MILLI,
        quantity: 15 * T,
    )

    // The same batch with the sandwich, legs in front-run, victim, back-run order.
    let hot = deploy_exchange(token, max_orders: 16, salt: 21)
    fund_makers(token, exchange: hot, makers)
    fund_eth(exchange: hot, trader: victim, amount: wei(180 * MILLI))
    fund_eth(exchange: hot, trader: attacker, amount: wei(254 * MILLI))
    fund_tokens(
        token,
        exchange: hot,
        trader: attacker,
        amount: ATTACKER_TOKENS,
    )
    place_background(exchange: hot, makers)
    let front = place_buy(
        exchange: hot,
        trader: attacker,
        limit: 26 * MILLI,
        quantity: ATTACKER_TOKENS,
    )
    let v_hot = place_buy(
        exchange: hot,
        trader: victim,
        limit: 12 * MILLI,
        quantity: 15 * T,
    )
    let back = place_sell(
        exchange: hot,
        trader: attacker,
        limit: 1 * MILLI,
        quantity: ATTACKER_TOKENS,
    )

    set_time(exchange: calm, now: 60)
    set_time(exchange: hot, now: 60)
    let c_calm = clear(exchange: calm, batch: 0)
    let c_hot = clear(exchange: hot, batch: 0)

    // (1) The clearing price is unchanged.
    assert!(c_calm.traded && c_hot.traded)
    assert!(c_calm.price == 11 * MILLI && c_hot.price == 11 * MILLI)
    // (2) The victim's fill is identical: 15 tokens, 0.165 ETH, the same refund.
    let p_calm = claim(exchange: calm, batch: 0, index: v_calm.index)
    let p_hot = claim(exchange: hot, batch: 0, index: v_hot.index)
    assert!(p_calm.base == 15 * T && p_hot.base == 15 * T)
    assert!(p_calm.quote == p_hot.quote)
    assert!(p_hot.quote == wei(15 * MILLI))
    // (3) Both legs fill in full at the batch price; the attacker nets 0 tokens and -1 wei.
    let _ = claim(exchange: hot, batch: 0, index: front.index)
    let _ = claim(exchange: hot, batch: 0, index: back.index)
    let end = balances(exchange: hot, owner: attacker)
    assert!(end.base == ATTACKER_TOKENS)
    assert!(end.quote == wei(254 * MILLI - 1))
}

#[test(balance = 100_000_000_000_000_000_000)]
fn sandwich_one_sided_moves_price() uses (evm: mut Evm) {
    let token = deploy_token(salt: 0)
    let makers = [
        new_trader(salt: 1),
        new_trader(salt: 2),
        new_trader(salt: 3),
        new_trader(salt: 4),
        new_trader(salt: 5),
    ]
    let victim = new_trader(salt: 6)
    let attacker = new_trader(salt: 7)

    let calm = deploy_exchange(token, max_orders: 16, salt: 20)
    fund_makers(token, exchange: calm, makers)
    fund_eth(exchange: calm, trader: victim, amount: wei(180 * MILLI))
    place_background(exchange: calm, makers)
    let v_calm = place_buy(
        exchange: calm,
        trader: victim,
        limit: 12 * MILLI,
        quantity: 15 * T,
    )

    // Where the guarantee stops: a one-sided buy, no matching sell.
    let hot = deploy_exchange(token, max_orders: 16, salt: 21)
    fund_makers(token, exchange: hot, makers)
    fund_eth(exchange: hot, trader: victim, amount: wei(180 * MILLI))
    fund_eth(exchange: hot, trader: attacker, amount: wei(260 * MILLI))
    place_background(exchange: hot, makers)
    let push = place_buy(
        exchange: hot,
        trader: attacker,
        limit: 26 * MILLI,
        quantity: 10 * T,
    )
    let v_hot = place_buy(
        exchange: hot,
        trader: victim,
        limit: 12 * MILLI,
        quantity: 15 * T,
    )

    set_time(exchange: calm, now: 60)
    set_time(exchange: hot, now: 60)
    let c_calm = clear(exchange: calm, batch: 0)
    let c_hot = clear(exchange: hot, batch: 0)

    // The price moves from 0.011 to 0.012 ETH, so the victim pays 0.18 ETH, not 0.165.
    assert!(c_calm.price == 11 * MILLI)
    assert!(c_hot.price == 12 * MILLI)
    let p_calm = claim(exchange: calm, batch: 0, index: v_calm.index)
    let p_hot = claim(exchange: hot, batch: 0, index: v_hot.index)
    assert!(p_calm.base == 15 * T && p_hot.base == 15 * T)
    assert!(p_calm.quote == wei(15 * MILLI))
    assert!(p_hot.quote == Wei::zero())
    // The attacker pays the same moved price for all 10 tokens and holds them:
    // valued at the batch price its position is worth exactly what it paid.
    let mine = claim(exchange: hot, batch: 0, index: push.index)
    assert!(mine.base == 10 * T)
    let end = balances(exchange: hot, owner: attacker)
    assert!(end.quote == wei(140 * MILLI))
    assert!(end.base == 10 * T)
}
```

- [ ] **Step 3: Every sandwich test in the workspace: these 3, the clearing property and the two sandwich demo vectors**
Run: `fe fmt --check ingots/exchange && fe test --filter sandwich`
Expected: PASS — `test result: ok. 6 passed; 0 failed`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `test(core): sandwich contrast, pool vs batch, with exact asserted numbers`
