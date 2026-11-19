# AnyOrder core design (sub-project A, plus the decisions all three share)

Approved design, Step 1 architect session, 2026-11-18. It is written for the executors and reviewers
who build from the plans. Sources: the brief `docs/idea-forge/2026-11-17-anyorder-brief.md`, the
resource pack `docs/resources/2026-11-17-fe-builders-challenge/`, and the user's approvals in the
architect session (§3 lists them).

Sister specs: `2026-11-18-anyorder-dapp-design.md` (sub-project B) and
`2026-11-18-anyorder-docs-stretch-design.md` (C and S).

## 1. Target, runtime, deadline (verbatim from the kickoff)

- **Project:** AnyOrder: "A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit." Shipped as a full dApp (landing page at /, app at /app) over a local Anvil chain.
  (Pitch wording revised 2026-11-19 by plan task docs:4 to match what the tests prove; the kickoff's
  original wording is kept in the brief, `docs/idea-forge/2026-11-17-anyorder-brief.md`.)
- **Target:** "Fe 26.6.0 (contest allows >= 26.5.0), EVM backend, EVM revision Osaka, run with
  `fe test` / `fe build` on Windows 11 (Git Bash + PowerShell 5.1). The native backend is NOT
  available on Windows: any native build is a Linux-CI stretch only, never the core."
- **Hard deadline:** "the contest closes 2026-11-24 23:59 UTC (2026-11-25 00:59 WAT); internal target
  2026-11-24 18:00 UTC (19:00 WAT)."
- **Repo:** `Dotman-Bei/anyorder` (private until the consent-gated public flip at Step 3).
- **Core contribution in Fe:** "clearing ingot, batch contract, test ERC20, proxy actors, hand-rolled
  seeded property tests". Non-Fe code allowed: "a stdlib-only Python exact-rational reference that
  regenerates the clearing test vectors, and the TypeScript/React frontend".
- **Chain:** local Anvil only, Anvil's public dev accounts only. "no private key, mnemonic or secret
  of mine is ever generated, stored or committed." No testnet, no hosting, so **no `human_gate`
  tasks** in this build.

## 2. Sub-projects, dependencies, cut order

| Id | Sub-project | Plan | Depends on |
|---|---|---|---|
| A | Fe core: clearing ingot, exchange contracts, evidence suite, sandwich contrast, gas spike | `plans/2026-11-18-anyorder-core.md` | nothing |
| B | dApp: chain tooling, landing page at `/`, app at `/app` | `plans/2026-11-18-anyorder-dapp.md` | A's frozen ABI (A task 10) and `deploy/params.json` (A task 2) only |
| C | `README.md`, `SUBMISSION.md` | `plans/2026-11-18-anyorder-docs.md` | A and B (not B's wallet polish) |
| S | Stretch: gas table, native Linux CI | `plans/2026-11-18-anyorder-stretch.md` | A, B task 3, C |

- **No A task depends on a B task.** B's first two tasks need nothing from A and can start on day 1.
- **Cut order if the schedule slips** (user, kickoff): gas-table stretch (S1), native Linux CI (S2),
  testnet/hosting (already cut), landing-page extras, then app polish (B10 wallet mode first). Never
  cut A's money-shot tests (A tasks 11 and 12).

## 3. Design decisions (question → answer → source)

1. Taste-skill runtime assets in the repo? → Commit only the runtime files the built pages load,
   unmodified, under `web/public/assets/`, with the upstream MIT notice; never SKILL.md, references/,
   scripts/, library/ or bulk photo/icon folders; prefer real product UI over stand-in photos;
   `.taste-skill/` git-ignored; CI builds the frontend but the taste gate is a local Step-2 check. →
   user, answer to question 1.
2. How the app sends transactions? → Built-in traders (Maker 1-3, Victim, Attacker = Anvil dev
   accounts 1-5; account 0 deploys) via `eth_sendTransaction` on the local RPC; an optional injected
   EIP-1193 wallet mode is the last, cut-first polish task; never ask for a key. → user, question 2.
3. Tie-break and rationing → §5 (approved §1, with changes 1-4 of the user's reply).
4. Sandwich claim → §6 (approved §2).
5. Gas path → Anvil receipts with `--enable-tx-gas-limit`; early spike sets the cap (§9). → user.
6. Architecture, interface, effects, time → §7-§8 (approved §3, with the user's path-safety,
   deploy-allowlist and test-only-contract changes).
7. Fe installed in this session → user-authorised; `fe 26.6.0 (5b3f96a)`; tollgate row 19 PASS.

## 4. Toolchain facts verified on this machine with fe 26.6.0 (2026-11-18)

Every construct below was compiled and run; the plans' code is the exact code that passed.

- Workspace: root `fe.toml` `[workspace] name/version/members`; members use
  `[dependencies] anyorder_clearing = { path = "../clearing" }`. `fe test` at the root runs both
  ingots; `--filter` is a substring match across members.
- **`fe fmt` does not walk a workspace root** ("No .fe files found", exit 1) and takes one path:
  run `fe fmt --check ingots/clearing` and `fe fmt --check ingots/exchange` separately.
- **`fe fmt --check` fails on CRLF files** and passes after LF. The repo needs
  `.gitattributes` `* text=auto eol=lf` (this machine has `core.autocrlf=true`).
- `fe build` at the root writes every member's contracts to the root `out/`
  (`<C>.bin`, `<C>.runtime.bin`, `<C>.abi.json`; the `.bin` is bare hex). A contract whose message
  uses raw integer selectors gets no ABI file, so every message here uses `sol("…")` selectors.
- `use core::ops::{Eq, Ord}` is required to implement them (all four of `lt/le/gt/ge`);
  `use std::evm::wei` / `seconds` / `ether` for the unit constructors. `mulmod` is an `extern`
  intrinsic (needs `unsafe`), so rationing uses checked `*`, `/`, `%` under `MAX_QUANTITY`.
- One `fe test` test has a gas budget: 256 contract-level permutation rounds in one test ran out
  (empty revert); 128 rounds fit, so 256 interleavings run as two seeded tests of 128.
- `fe check ingots/clearing --backend native` passes on Windows; native executables need Linux.
- Anvil 1.7.1: `--hardfork osaka` alone does **not** enforce the per-transaction gas cap;
  `--enable-tx-gas-limit` does (20,000,000 rejected, 16,777,216 accepted). Anvil answers CORS from any
  origin; chain id 31337 (`0x7a69`). `fe build` output deploys from an unlocked dev account with
  `eth_sendTransaction` (no key).

## 5. The clearing rule (the longest pole)

**Units (Fe-typed).** Quantities are base units of the 18-decimal TestToken; prices are wei per
whole token; quote amounts are `Wei`. A trade of `q` at `p` costs `q·p/10^18`: buyers pay
`cost_ceil` (rounded up, `mul_div_ceil`), sellers receive `proceeds_floor` (rounded down, `mul_div`).
A buy locks `cost_ceil(q, limit)` at placement; a sell locks `q`. `MAX_QUANTITY = 10^30` base units.

**Price selection** (`select_price`). Candidates are the distinct limit prices. D(p) = total buy
quantity with limit ≥ p; S(p) = total sell quantity with limit ≤ p.
1. maximise V(p) = min(D, S);
2. among those, minimise |D − S|;
3. among those, take **the highest price with D ≥ S; if none, the lowest**.
No price with V > 0 → no trade, everything refunded. O(N log N): sort, then one ascending sweep.

**Rationing** (`allocate`). Only the long side's orders *at exactly p\** are rationed. Strictly
better orders, and every order of the short side that can trade, fill in full. Marginal orders share
`share = marginal − |D − S|` pro rata by quantity, rounded down; the leftover units go one each to
the largest fractional remainder, then larger quantity, then lower owner (address word), then the
owner's earlier own order (`owner_seq`).

**Lemma** (rule 3 makes rationing feasible): strictly better long-side orders always fit
(`share ≥ 0`). The first draft ("else lowest") failed on a tie mixing excess demand and excess
supply; brute force found it and the vector `vector_mixed_sign_tie` pins it.

**Rejected:** max volume then lowest price (counterexample: buy 10@12 vs sells 3@8, 3@10 picks 10,
the buy at 12 would need rationing); midpoint of the max-volume range (lands between limit prices,
where strictly better orders would need rationing).

**Wording (user change 1), used verbatim by README, tests and UI:** *clearing has no `Ctx` or caller
effect; the only identity it reads is each order's recorded owner, used only for the final
tie-breaks (owner address, then the owner's own order sequence), which decide at most 1 base unit
per order.* Never write "clearing cannot see who you are".

**Verification so far.** Python, exact fractions: 159,373 random books with a trade (no strictly
better order rationed, tokens bought = sold, volume maximal over every integer price). Fe: the
property suite (§10) on the real compiler; a mutant restoring the flawed rule fails 3 of 5 property
tests.

## 6. The sandwich claim, stated precisely

**Theorem (condition C).** Let the attacker-free batch trade a positive volume. The attacker adds a
buy and a sell of the **same size a**, buy limit strictly above every other limit in the batch, sell
limit strictly below every other limit (the batch form of a sandwich's two market orders). Then:
(1) the clearing price is unchanged; (2) every other order's fill, in tokens and in wei, is identical
to the attacker-free batch; (3) both attacker legs fill in full at p\*, so the attacker nets 0 tokens
and `proceeds_floor(a,p) − cost_ceil(a,p)` ∈ {−1, 0} wei.
*Why:* inside the other orders' range the attacker adds a to D and to S at every candidate, so every
volume rises by a and every imbalance is unchanged; the attacker's own limits are new candidates with
volume a < V\* + a; both legs are strictly better than p\*, so they fill and leave `share` unchanged.

**Holds unconditionally.** Arrival order cannot change price or per-owner fills (permutation tests).
Everyone trades at the one price, so a trader whose equal buy and sell both fill in full nets 0
tokens and ≤ 0 wei, whatever the limits (user change 3).

**Does not hold.** One-sided or uneven orders can move the price (market power, not ordering): the
attacker then pays the moved price too and holds inventory. A leg at exactly p\* joins the marginal
pool and can shrink the victim's share. Orders are public before close, so cross-batch trading is
ordinary price risk. Builders can censor; timestamp skew can move an order to the next batch.

**The numbers** (pool: 400 TKN / 4.4 ETH, no fee; batch background: sells 10 TKN at 0.010, 0.011,
0.012, 0.013 ETH, a buy of 5 TKN at 0.009; victim buys 15 TKN, limit 0.012; attacker legs at 0.026
and 0.001), computed by `ref/clearing_ref.py` and asserted literally:

| Scenario | Result |
|---|---|
| Pool, victim alone (0.165 ETH in) | 14.457831325301204819 TKN |
| Pool, sandwiched: front-run 0.11 ETH | attacker gets 9.756097560975609756 TKN |
| Pool, sandwiched: victim | 13.773314203730272596 TKN |
| Pool, sandwiched: back-run | 0.118090638930163447 ETH back, **profit 0.008090638930163447 ETH** |
| Batch, alone and sandwiched | price 0.011 both; victim 15 TKN for exactly 0.165 ETH both |
| Batch, attacker (condition C) | pays 0.107317073170731708, receives …707: **−1 wei, 0 tokens** |
| One-sided buy of 10 TKN at 0.026 | price 0.011 → **0.012**; victim pays 0.18; attacker pays 0.12 at that price and holds 10 TKN |
| In-range wash pair (property test) | book buy 5@7, sell 5@2 clears at 7; with buy 1@6 + sell 1@5 it clears at **6**; the pair nets 0 tokens, ≤ 0 wei |

**Tests** (all named `sandwich_*`, so `fe test --filter sandwich` runs the boundary cases too):
`sandwich_cpmm_attacker_profits`, `sandwich_batch_attacker_nets_dust`,
`sandwich_one_sided_moves_price`, and `sandwich_invariance_property` (256 seeded books under
condition C, plus the unconditional wash-pair property and the in-range example above). The filter
also matches the two generated vectors `vector_sandwich_demo_attacker_free` and
`vector_sandwich_demo_attacked`, so the money-shot command runs 6 tests (replay-verified).

## 7. Architecture

```
fe.toml                         [workspace] anyorder: ingots/clearing, ingots/exchange
ingots/clearing/                ingot anyorder_clearing: pure library, no contract, no effects
  src/lib.fe types.fe money.fe select.fe ration.fe oracle.fe
  src/money_tests.fe select_tests.fe ration_tests.fe props.fe vectors.fe (generated)
ingots/exchange/                ingot anyorder
  src/interface.fe              messages, #[abi] views, events, errors (the frozen ABI)
  src/state.fe                  Clock, Settings, Book, Funds, Guard (storage structs as effects)
  src/logic.fe                  every handler as a free function with its `uses` clause
  src/anyorder.fe               AnyOrder (production: Clock from ctx.timestamp())
  src/testclock.fe              AnyOrderTestClock (TEST ONLY: Clock from a stored test time)
  src/token.fe pool.fe          TestToken (ERC20) and ConstantProductPool (BASELINE ONLY)
  src/actors.fe harness.fe      Trader, Reenterer (TEST ONLY) and the tests' helpers
  src/*_tests.fe                token, lifecycle, invariant (permutation, solvency, reentrancy), sandwich
ref/clearing_ref.py             stdlib-only exact reference; writes vectors.fe through `fe fmt`
spikes/gas/  scripts/gas-spike.sh   throwaway gas prototype (not a workspace member)
deploy/params.json              maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice
abi/*.abi.json  scripts/check-abi.sh  frozen ABIs of the three deployed contracts
web/                            sub-project B
```

**Effects (the Fe highlight).** `select_price(_ orders) -> Clearing` and `allocate(...)` have no
`uses` clause at all. In `logic.fe`:

| Function | `uses` | Can move funds? |
|---|---|---|
| `deposit_eth` (payable arm) | `funds, log` | receives value, no `Call` |
| `deposit_token` | `ctx, call, settings, funds, log` | yes (`transferFrom` in) |
| `withdraw` | `ctx, call, settings, funds, guard, log` | yes (state first, `TSlot` lock) |
| `place` | `clock, settings, book, funds, log` | **no `Call`** |
| `clear_batch` | `clock, settings, book, log` | **no `Call`** |
| `claim` | `book, funds, log` | **no `Call`** (credits internal balances) |
| views | read-only effects | no |

**Time.** `Clock { now: Timestamp }` is an effect. Batch k covers `[genesis + k·L, genesis + (k+1)·L)`.
`AnyOrder` arms build `Clock` from `ctx.timestamp()`; `AnyOrderTestClock` arms from `test_now`, moved
forward only by its test-only `setNow`. Both call the same free functions. `AnyOrderTestClock` and
`Trader`/`Reenterer` are built into `out/` but **never deployed**: the deploy script uses the
allowlist `AnyOrder, TestToken, ConstantProductPool`, and `abi/` and `check-abi.sh` cover only those.
The production contract's full lifecycle runs on Anvil with real block time (B task 3).

**Storage key domains** (Fe issue #1538): orders are read only with `index < count`; `clear` accepts
only `batch < currentBatch`; `orderAt`/`claim` revert `UnknownOrder` outside the domain.

## 8. Frozen interface (sub-project B builds against exactly this)

Constructor `AnyOrder(address token, uint256 genesis, uint256 batchLength, uint256 maxOrders,
uint256 minQuantity, uint256 maxPrice)` (`genesis ≤ now`, `0 < maxOrders ≤ 256`).

| Function | Returns | Notes |
|---|---|---|
| `depositEth()` payable | — | credits free wei |
| `depositToken(uint256)` | — | pulls TKN (`approve` first) |
| `withdraw(uint256 base, uint256 quote)` | — | pays out free balances |
| `placeBuy(uint256 limit, uint256 quantity)` / `placeSell(...)` | `(batch, index)` | locks funds, current batch |
| `clear(uint256 batch)` | `(traded, price, volume)` | anyone, once the batch has ended |
| `claim(uint256 batch, uint256 index)` | `(base, quote)` | anyone; credits the order's owner |
| `config()` | `(token, genesis, batch_length, max_orders, min_quantity, max_price)` | view |
| `currentBatch()` | `uint256` | view |
| `batchInfo(uint256)` | `(start, end, order_count, status, traded, price, volume)` | status 0 open, 1 closed, 2 cleared |
| `orderAt(uint256, uint256)` | `(owner, is_buy, limit, quantity, owner_seq, locked, filled, claimed)` | view |
| `preview(uint256)` | `(traded, price, volume)` | the same pure clearing on the stored book |
| `balances(address)` | `(base, quote)` | free balances |

Events: `Deposited`, `Withdrawn`, `OrderPlaced`, `BatchCleared`, `Claimed`. Errors and selectors:
`ZeroAmount()` 0x1f2a2005, `InsufficientFunds(uint256,uint256)` 0x03eb8b54,
`BelowMinimum(uint256,uint256)` 0xbd49034f, `AboveMaximum(uint256,uint256)` 0x301300f6,
`PriceOutOfRange(uint256,uint256)` 0x9c6cd57b, `BatchFull(uint256,uint256)` 0xdba84217,
`BatchStillOpen(uint256,uint256)` 0x1fdae862, `AlreadyCleared(uint256)` 0x4813055c,
`NotCleared(uint256)` 0xfc8d5c0d, `UnknownOrder(uint256,uint256)` 0x927e5636,
`AlreadyClaimed(uint256,uint256)` 0x6bd4745f, `Reentrant()` 0xed3ba6a6, `TransferFailed()` 0x90b8ec18.
`TestToken`: `decimals, totalSupply, balanceOf, allowance, transfer, approve, transferFrom, mint`
(minter = deployer). `ConstantProductPool(address token)`: `seed(uint256)` payable,
`buyTokens(uint256 minOut)` payable, `sellTokens(uint256 amount, uint256 minOut)`, `reserves()`.
The ABI JSON of all three is frozen in `abi/` by A task 10.

## 9. Gas

All three sets of `clear()` measurements ran on `anvil --hardfork osaka --enable-tx-gas-limit`
(per-transaction cap 16,777,216). `clear()` gas grows with the order count and with the number of
non-zero fills (one storage write each), so the sets differ by what they measured.

| Set | What it measured | Who measured, how | `clear()` gas at 10 / 50 / 100 orders |
|---|---|---|---|
| gas spike (prototype, every order filled) | `spikes/gas`: this storage shape, clears like AnyOrder, writes every fill (worst case) | the architect, then A task 2 with `bash scripts/gas-spike.sh` (`docs/gas/spike.md`) | 409,402 / 2,161,907 / 4,426,468 |
| architect's planning measurement (real contract, order mix not recorded) | the verified contract code before the build; which orders were placed was not recorded | the architect, 2026-11-18 | 333,508 / 1,446,094 / 2,809,751 |
| gas table (real contract, demo order mix) | the deployed contract with the demo order mix (limits 0.009-0.014 ETH per token, 1-4 tokens per order, three makers); also N = 25 and 75 in `docs/gas.md` | Stretch S1 with `pnpm -C web exec tsx scripts/gas-table.ts` | 358,462 / 1,567,284 / 3,156,298 |

- **Rule (from the gas spike):** `maxOrders` = largest N with `clear()` ≤ 8,388,608 gas (half of
  16,777,216); `demoBatchSize` = min(maxOrders, 20); written to `deploy/params.json`. Result:
  maxOrders 100, demoBatchSize 20.
- **Numbers to quote:** the gas table. The planning measurement shows scale only and is not
  comparable row by row with it. B's end-to-end test clears a full batch of `maxOrders` with the
  demo order mix under the cap and prints its gas, which matches the gas table's 100-order row.
- No gas-efficiency claim is made beyond measured numbers.

## 10. Evidence suite

| Test (filter) | What it proves |
|---|---|
| `vector_*` (17, generated) | textbook and edge books; money rounding; regenerated by `ref --check` |
| `select_*`, `ration_*`, `money_*` | the TDD drivers of the clearing core |
| `property_fills_respect_limits_and_strictly_better_orders_fill` | every fill within its limit and quantity |
| `property_base_and_quote_conservation` | tokens bought = sold = volume; buyers cover sellers; dust ≤ 1 wei per filled order |
| `property_volume_is_maximal_over_every_integer_price` | volume = the oracle's maximum over all integer prices 0..18 |
| `permutation_full_shuffle_keeps_price_and_owner_totals` | **pure level:** 256 full shuffles (within-owner order too), compares price, volume and per-owner aggregates |
| `permutation_contract_interleavings_seed_7` / `_seed_8` | **contract level:** 2 × 128 seeded shuffles of the interleaving **across owners, each owner's own order sequence fixed**; compares price and per-owner balances after all claims |
| `sandwich_*` (4) | §6 |
| `solvency_holds_after_every_step_of_a_seeded_run` | after every placement, clearing and claim, holdings cover free balances plus every unclaimed lock or payout; after full withdrawal tokens are exactly 0 and only dust wei remain |
| `reentrancy_lock_refuses_a_second_withdraw` (plan Task core:13) | the transient lock, and only the lock, refuses a re-entered `withdraw`. A hostile payee deposits 2 ether and withdraws 1; its fallback re-enters `withdraw` once for the other 1, a sum its balance covers. The re-entry reverts, so the payout fails and the outer withdrawal reverts; the exchange still holds 2 ether and the payee's balance is still 2 ether. **Mutation check:** `scripts/mutant-reentrancy.sh` deletes the `Reentrant` check from `withdraw` in a temp copy, and the test then fails on an assertion: the re-entry succeeds under the same gas and both ether leave. So the test cannot pass without the lock. It exercises the ETH payout; the token payout relies on §11 (7) |
| `lifecycle_*`, `revert_*` (13) | the full lifecycle (test clock) and the production contract's open phase; 10 of the 13 custom errors by exact selector (`Reentrant` and `TransferFailed` are exercised by the reentrancy test but not asserted by selector: the re-entry reverts `Reentrant`, which makes the payout fail and the outer withdrawal revert `TransferFailed`; `AboveMaximum` guards quantities above 10^30 base units and is not exercised) |
| `token_*` | the ERC20 and the proxy-actor pattern |

Property tests are seeded (`KeccakRng::seeded(n)`) and hand-rolled; a failure replays exactly.
Python: `python ref/clearing_ref.py --check` (vectors up to date) and `--selftest` (20,000 random
books: rule = oracle, the lemma, condition C).

## 11. Security assumptions and limitations (README "Security notes" and "Limitations")

The brief's ten, kept: (1) the batch removes ordering, not market power or strategic placement;
(2) builders can censor; (3) timestamps skew within a batch boundary; (4) DoS bounded by
`maxOrders` (measured) and `minQuantity`; (5) rounding favours the contract, solvency is a test;
(6) state final before external calls, plus a transient `TSlot` lock on `withdraw`, the only function
that pays out. The lock is test-covered: a payee re-entering `withdraw` for funds it really holds is
refused, and the test fails when the `Reentrant` check is deleted (`scripts/mutant-reentrancy.sh`,
§10). The test exercises the ETH payout; the token payout relies on (7). (7) standard ERC20 only;
(8) key domains validated explicitly; (9) no oracle, a thin batch can clear far from outside prices; (10) prototype.
Added: (11) **batch-filling griefing**: anyone can fill a batch's `maxOrders` slots with minimum
orders, costing them only locked capital; per-address caps are Sybil-able, so it is stated, not
solved; (12) the owner-address tie-break (§5 wording); (13) `AnyOrderTestClock` exists only for
`fe test` and is never deployed; (14) unaudited.

## 12. Critical-path estimate for sub-project A (for the calendar call)

Task-hours assume one orchestrator dispatching sequentially; the code in every task already compiled
and passed in the architect's scratch build, so the risk is execution, not design.

| Day (UTC) | A tasks | Est. |
|---|---|---|
| Wed 2026-11-18 | 1 skeleton, 2 gas spike, 3 price selection, 4 rationing | 3.5 h |
| Thu 2026-11-19 | 5 reference + vectors, 6 property suite, 7 interface + state, 8 pool | 3.5 h |
| Fri 2026-11-20 | 9 logic + contracts + lifecycle, 10 ABI freeze, 11 invariants, 12 sandwich | 4 h |

A is green by end of Fri 11-20 with ~1 day of slack per day of plan; B's scaffold (B1-B2) runs in
parallel from Wed, its chain tasks from Fri, its UI tasks Sat-Mon; C on Mon 11-23; submission draft
finalised by Tue 11-24 18:00 UTC.
