# AnyOrder

**Pitch:** A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit.

## The problem

On a continuous exchange such as a constant-product pool, the order of transactions decides the price each trader gets. A sandwich attacker trades just before and just after a victim, moves the price against the victim and keeps the difference. In the recorded pool scenario the victim receives 13.773314203730272596 TKN instead of 14.457831325301204819 TKN and the attacker nets 0.008090638930163447 ETH. Ordinary traders lose; whoever controls ordering profits. Details: [README, The problem](README.md#the-problem).

## Approach

Make ordering irrelevant by construction. Orders are collected for a fixed-length batch, then all are cleared at one uniform price chosen by a pure function of the book, so being first or last is worth nothing. The rule maximises traded volume, then minimises the imbalance, then breaks the remaining tie by price; marginal orders are rationed pro rata with exact rounding. Funds are locked at placement and credited by `claim`, so clearing never moves funds.

Built during the contest: the clearing ingot, the batch exchange contract, a test ERC20, a constant-product pool as the baseline victim, proxy actors, seeded property tests, a stdlib-only exact-rational Python reference that regenerates the test vectors, and a dApp (landing page at `/`, app at `/app`) that reads the real contracts on a local Anvil chain. See [README, How it works](README.md#how-it-works).

## Fe highlight

Effects make the claim checkable from signatures. The price rule has no effects at all, and the handler that accepts orders cannot call out of the contract:

```fe
pub fn select_price(_ orders: MemVec<Order>) -> Clearing

pub fn place(owner: Address, is_buy: bool, limit: u256, quantity: u256) -> OrderRef
uses (clock: Clock, settings: Settings, book: mut Book, funds: mut Funds, log: mut Log)
```

`select_price` has no `uses` clause: it cannot read the clock, a caller or storage, or move funds. `place` names the effects it touches and none is `Call`, so it cannot make an external call; likewise `clear_batch` and `claim`. The same property makes the clock testable: `Clock` is an effect, so the production `AnyOrder` and the test-only `AnyOrderTestClock` call the same free functions. Full table: [README, Fe highlight](README.md#fe-highlight).

## Architecture

Two ingots in one Fe workspace, plus a reference, scripts and the dApp:

- `ingots/clearing`: pure library, no contract, no effects (`select_price`, `allocate`, money rounding), with its driving tests, property tests and generated vectors.
- `ingots/exchange`: the `AnyOrder` contract, with every handler as a free function with its `uses` clause (`logic.fe`), the storage structs as effects (`state.fe`), the frozen ABI (`interface.fe`), `TestToken`, `ConstantProductPool` (baseline only) and test-only actors.
- `ref/clearing_ref.py`: exact reference; regenerates `vectors.fe`.
- `abi/` and `scripts/check-abi.sh`: the frozen ABIs of the three deployed contracts and their check.
- `web/`: the dApp, which reads the real contract and never clears a book in TypeScript.

Only `AnyOrder`, `TestToken` and `ConstantProductPool` are ever deployed. Full tree: [README, Architecture](README.md#architecture).

## Build and test

```sh
fe --version                        # fe 26.6.0 (5b3f96a)
fe fmt --check ingots/clearing
fe fmt --check ingots/exchange
fe test
fe build
python ref/clearing_ref.py --check
python ref/clearing_ref.py --selftest
bash scripts/check-abi.sh
bash scripts/mutant-reentrancy.sh
pnpm -C web install
pnpm -C web test
pnpm -C web local                   # local Anvil + fe build + deploy + seed + Vite
```

Tools: fe 26.6.0 (on Windows, the release asset; elsewhere `feup`), Foundry (`anvil`, `cast`), Node 22 with pnpm 10, Python 3.12. `pnpm -C web test:e2e` needs Anvil and a built `out/`. What each command proves: [README, Build & test](README.md#build--test).

## Demo

The reproducible CLI example runs the real compiler against the real contracts:

```sh
fe test --filter sandwich           # test result: ok. 6 passed; 0 failed
```

It asserts the numbers in the README's Demo table: in the pool the attacker profits; in the batch the victim's fill and the price are unchanged and the attacker nets 0 tokens and -1 wei. The demo video (https://youtu.be/8QCVwiO_9c8), the recorded run, the table of results and the one-command browser demo (`pnpm -C web local`) are in [README, Demo](README.md#demo).

Live page: https://anyorder.suitz.xyz/ (the landing page; the app needs a local chain, see Quickstart)

## Limitations

- **Works:** the full lifecycle on a local Anvil chain (deposit, place, clear, claim, withdraw); the clearing, rationing and rounding rules, checked against the exact reference; the sandwich comparison, recorded and live on a local chain.
- **Where the claim stops:** the batch removes ordering, not market power. One-sided or uneven orders can move the price (in the tests, 0.011 becomes 0.012), and the attacker then holds inventory. A leg at exactly the clearing price joins the marginal pool. Orders are public before close; builders can censor; timestamp skew can move an order to the next batch.
- **Security assumptions:** unaudited prototype for a local chain. Standard ERC20 only; no oracle; batch-filling griefing is bounded by `maxOrders` and stated, not solved. `withdraw`, the only function that pays out, finishes its state changes first and holds a transient lock; the lock is the only thing refusing a re-entered `withdraw` on the ETH payout (a test, and `scripts/mutant-reentrancy.sh` shows the test fails without the check), while the token payout relies on the standard-ERC20 assumption.
- **Unfinished:** no public network, no hosting, no audit; the native backend is not used.

All fourteen assumptions: [README, Security notes](README.md#security-notes).

## Declaration

- **Pre-existing work:** none beyond the starter (`fe-lang/builders-challenge-starter` @ `f9d9aa9`, Apache-2.0: LICENSE, CI layout, SUBMISSION.md template; the vault example was not kept). Everything else was written during the contest.
- **Third-party code:** the TestToken adapted from the Fe guide's ERC20 and the v26.6.0 `erc20.fe` fixture; the proxy-actor pattern from the v26.6.0 `ownable.fe` and `escrow.fe` fixtures; the pool pricing after the guide's DEX `quote` (all Apache-2.0, argotorg/fe and fe-lang/www); the design kit's runtime files in `web/public/assets/` (Leonxlnx/taste-skill, MIT, notice included in `web/public/assets/THIRD-PARTY-NOTICE.md`).
- **AI assistance:** built with Claude Code (the build-system pipeline: architect, orchestrator, executors); every task gated by tests the human contact can re-run.

## Team

Built by Dotman-Bei (GitHub), with Claude Code as described in the Declaration.

## License

Apache-2.0, from the starter (see `LICENSE`). The design kit's runtime files under `web/public/assets/` are MIT; see `web/public/assets/THIRD-PARTY-NOTICE.md`.
