# Idea Forge Brief: AnyOrder, a batch-auction exchange in Fe where transaction order cannot change your fill

> Working title "AnyOrder" is provisional; the builder may rename it. This brief is the single source of
> truth handed to the architect (Step 1). It is a brief, not a spec: it fixes *what* and *why*, not *how*.

## Event + constraints

- **Date written:** 2026-11-17. Idea-forge seat `claude-opus-5-5` (the campaign's `top` binding per the
  tollgate Routing section), effort `max` (user-attested).
- **Hackathon:** Fe Builders Challenge 2026 (Argot Collective), <https://fe-lang.org/contest/>. One pool,
  three prizes ($2,500 / $1,500 / $1,000 in USDC). No sponsors and no separate tracks.
- **Registration closes 2026-11-17 23:59 UTC (2026-11-18 00:59 WAT) and is required to submit.** The form
  asks for a project name and a one-sentence idea; this brief's name and Solution line can be used.
- **Hard deadline (inert calendar fact; idea-forge does not gate on it):** submission closes
  **2026-11-24 23:59 UTC (2026-11-25 00:59 WAT)**. The runsheet's internal target is 2026-11-24 18:00 UTC.
  "The latest valid submission counts. Include the exact commit SHA you want judged."
- **Team:** solo + AI build pipeline (architect, executor pool, reviewer). Builder skills: Solidity/DeFi,
  TypeScript/React, Python/ML; new to Fe.
- **Target track:** Rethink a protocol (exchange). Two secondary angles are folded in only because they
  strengthen it: Make the math work (clearing math with explicit test vectors) and Build for the next
  builder (the clearing core ships as a reusable library ingot in the same repo).
- **Risk posture:** `safe-feasible`. The novelty lives in the mechanism and in the proof of its key
  property, not in toolchain risk. Everything in the demo runs with `fe test` and `fe build` on Windows.
- **Published judging rubric:** Technical quality 30% · Fe-specific value 25% · Originality 20% ·
  Usefulness or insight 15% · Documentation & demo 10% (details below).

## Problem

On a continuous DEX, the order in which transactions land decides who trades at what price, so ordering
itself is the attack surface. A searcher who sees a user's swap places a buy just before it and a sell
just after it, and pockets the price impact the user pays: the sandwich. Users can only tighten their
slippage limits, and every constant-product pool is exposed by construction, including the ones in Fe's
own examples. Nothing in the Fe ecosystem today shows an exchange design where ordering cannot matter,
or proves it.

## Solution (one line)

A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so
sandwich attacks have nothing to exploit.

## Must-have demo features (the minimum that makes the money shot land)

1. **The batch exchange: a Fe contract around a pure clearing core.** One market: a Fe-written ERC20
   test token quoted in native ETH (`Wei`). Traders place limit buy and sell orders, backed by deposits,
   into the open batch. Once the batch closes (time is an input; see Feasibility), anyone can trigger
   clearing. Every filled order executes at one uniform price: the volume-maximizing price, with a
   documented tie-break and a documented rationing rule at the marginal price. Both depend only on order
   contents, never on arrival sequence. Traders then collect fills and refunds. The clearing rule is a
   pure function with no `Ctx`, `Call` or storage effect, shipped as its own library ingot that the
   contract imports. Fund movement is confined to a small, named set of handlers (deposit and payout).
   Order placement and clearing carry no `Call` effect, so they cannot move funds, and the compiler
   enforces it.
2. **The evidence suite, all in `fe test`.**
   - Clearing test vectors: hand-computed and textbook order books, cross-checked by a stdlib-only Python
     exact-rational reference that regenerates them.
   - Hand-rolled, seeded property tests over many generated books: arrival-order independence under
     shuffling; every fill within its limit price; base and quote conservation; volume-maximality against
     a brute-force oracle; solvency (contract balances always cover outstanding claims).
   - Multi-actor lifecycle tests with proxy trader contracts and an injected clock.
3. **The sandwich contrast.** A test-only constant-product pool where a scripted front-run and back-run
   around a victim's buy earns the attacker a positive profit. Then the same three orders in one AnyOrder
   batch: both attacker legs clear at the batch price, the attacker nets zero minus rounding dust, and the
   victim's fill matches the attacker-free batch. The asserted numbers are the README's demo table and
   reproduce with one command.

## Target sponsor track(s)

- **Rethink a protocol (primary).** Statement: "Reimagine an auction, exchange, or governance mechanism.
  Show how Fe makes the design clearer, more expressive, or more efficient." AnyOrder reimagines the
  exchange. It replaces continuous matching with a periodic uniform-price call auction, and it makes
  "clearing cannot see who called, when, or in what order" visible in Fe's effect signatures. That answers
  the organisers' own question for order books and auctions: "every handler in a Fe contract declares
  which storage it touches and whether it can move funds. Which protocol would become easier to trust if
  that were visible in its code?"
- **Make the math work (secondary angle).** The clearing math (price selection, marginal rationing,
  rounding direction) ships with explicit test vectors and stated assumptions.
- **Build for the next builder (secondary angle).** The clearing core is a standalone, documented library
  ingot that any Fe call-market or batch-auction contract can import.
- All four starting points compete in one pool. The secondary angles are not separate entries.

## Judging criteria (published)

Contest page, verbatim weights and descriptions: **Technical quality 30%** "Correctness, architecture,
tests, and completeness." · **Fe-specific value 25%** "Meaningful use of Fe's features and abstractions." ·
**Originality 20%** "A fresh idea, implementation, or combination." · **Usefulness or insight 15%** "Value
for users, researchers, or future builders." · **Documentation & demo 10%** "A clear explanation and
reproducible results."

- The blog's wording adds "**clear security assumptions**" to the 30% axis, and says: "a claim about gas
  efficiency needs benchmarks … Explain what your project demonstrates and give the jury a way to verify
  it."
- Contest page: "Your evidence should fit your project: tests, benchmarks, test vectors, or a working
  demo. Social reach does not affect your score."
- Jury taste (pack `event.md`): two Fe core developers (Grant Wuerker, Micah Scopes); Philogy, a security
  researcher who created the Plank EVM language (the pack's note: "Will read the code adversarially");
  Marius van der Wijden, a Geth core developer focused on "testing, fuzzing, and making Ethereum's
  execution layer more robust"; plus builders, educators and dev-tooling leads.

## Why it wins

**White space.** No public contest entry implements an exchange, order book or auction (pack
`prior-art.md` §1, re-checked 2026-11-17 by GitHub repo and code search: still none). The nearest
protocol entries are an LMSR market maker, two escrow/crowdfunding contracts, and now four AI-agent
spend-limit entries (the re-check found `devprashant19/Leash`, a Safe module). Fe's own `rosetta` has a
constant-product AMM in pre-26.5 syntax and no batch or order-book exchange, and older Fe auction
examples exist only in obsolete syntax. AnyOrder takes the empty exchange slot with a mechanism class
nobody has expressed in Fe. It is also not the organisers' CoW conditional-orders prompt: it builds the
batch auction itself, on-chain, instead of order types layered on CoW's off-chain solvers.

**Head-to-head edge.** Against the strongest prior art (the `fe-lmsr` entry and `rosetta`'s AMM),
AnyOrder wins on **Fe-specific value**. Its central safety claim, that clearing cannot read the caller,
the block or the arrival order, is a compile-time fact of an effect-free clearing function, then
confirmed by a seeded permutation test. `fe-lmsr` describes itself as "built on core::fixed", and
`rosetta` predates 26.5's typed units, `core::sort` and `std::evm::random`. It also wins on **Usefulness
or insight**: the sandwich contrast measures a live DEX harm that neither addresses. It ties on Technical
quality and Documentation & demo until built.

## Demo money shot (~15 seconds)

One command, `fe test --filter sandwich`. On the constant-product baseline, the scripted sandwich earns
the attacker a positive, asserted profit. In AnyOrder the same three orders land in one batch: one
clearing price, the attacker nets zero minus dust, and the victim's fill matches the attacker-free batch.
Then `fe test --filter permutation` replays one batch under many seeded shuffles of arrival order (for
example 256) and asserts the same price and the same per-trader fills every time.

## Out of scope (explicit; keeps the build on the money shot)

- **No AMM as the entry.** The constant-product pool is a test-only baseline for the contrast.
- **No off-chain solvers or solver competition.** Clearing is computed on-chain. Solver-proposed
  clearings verified in O(n) are future work for the README.
- **No signed (EIP-712) or sealed (commit-reveal) orders.** Orders are public on-chain until close. This
  also avoids generating signatures, and therefore private keys, for test vectors.
- **Limit orders only.** No market, stop or TWAP orders. No cancels after close, no fees or keeper
  rewards, one market and no factory.
- **No native simulator or backtester in the demo.** The native backend does not build executables on
  Windows. It is at most an optional Linux-CI extra (see Stretch).
- **No web UI.** None is wanted, so the frontend design pass is not needed.
- **No mainnet, wallets, keys or faucets.** A local Anvil deploy is optional and never part of the money
  shot.
- **No gas-efficiency claims** unless benchmarked.
- **No fee-on-transfer, rebasing or hook-bearing tokens.**

## Stretch (only after the money shot is green)

1. A gas table for clearing at several batch sizes, only if a gas-measurement path is verified at Stage 1.
   Raw `gas()` is std-internal, so check `fe test --report`, `--trace-evm` or `--call-trace`.
2. A Linux CI job that also builds the pure clearing ingot with `--backend native`, matching the
   organisers' "one codebase, on-chain and off-chain" taste. It is never required for the Windows demo.

## Security assumptions and limitations the build must state (the 30% axis)

1. **What the batch removes, and what it doesn't.** It removes transaction ordering as an input, so
   within-batch front-running and sandwiching don't pay. It does not hide orders before close, stop
   strategic order placement, or remove market power: a uniform-price auction still lets a large trader
   shade demand.
2. **Censorship.** A block builder can still keep an order out of a batch.
3. **Time.** Batch boundaries come from block timestamps, which proposers can skew slightly. Skew only
   moves an order between adjacent batches.
4. **Gas and DoS.** A per-batch order cap and a minimum order size bound clearing gas. The test runner
   "lifts Osaka's per-transaction gas cap", so clearing gas at the cap must be measured before claiming
   deployability.
5. **Rounding.** Rounding always favors the contract (buyers' cost rounds up, sellers' proceeds round
   down). Dust stays in the contract, and solvency is a test.
6. **Reentrancy.** State is final before any external call (26.4+: "Live state borrows now conflict with
   `CALL`"), plus a transient-storage guard on the payout path.
7. **Tokens.** Standard ERC20 only.
8. **Key domains.** `StorageMap` returns the default for any key (issue #1538), so order and batch IDs are
   validated explicitly.
9. **No oracle.** The price is endogenous to the batch, so a thin batch can clear far from outside prices.
   Limit prices are each trader's protection.
10. **Maturity.** Fe is "not yet recommended for production use", so AnyOrder is a prototype.

## Feasibility notes for the architect (primitives, not design)

The facts below are transcribed from the resource pack (`docs/resources/2026-11-17-fe-builders-challenge/`),
with the file and section given for each. **Nothing in the pack was compiled**: `fe` was not installed
when the pack was written, and it still wasn't when this brief was written. Verify syntax as soon as `fe`
is installed.

### Campaign buildability facts (from the Step 0 kickoff; binding)

- `fe test` has **no cheatcodes** (no warp, prank, deal) and **no fuzzing**. Multi-actor tests need small
  proxy/forwarding contracts, and time-dependent logic must take time as an input rather than read it from
  the block. The mechanism must be demonstrable through ordinary `fe test` tests plus properties and
  invariants written by hand.
- This machine is Windows. EVM `fe build` / `fe test` work, but the native backend is Linux/macOS only.
  The full demo runs in `fe test` and `fe build` on Windows. A native simulator is optional extra, never
  the core.
- No mainnet deployment (no scoring advantage), no wallets, no keys, no faucets, no sponsors. A local or
  testnet deploy is optional.
- **No web UI is planned, and this brief does not want one.**
- Evidence must fit the rubric: tests, test vectors and invariants; benchmarks only if an efficiency claim
  is made; explicit security assumptions and limitations; and a Fe-specific highlight with a code excerpt
  that shows why Fe made the design clearer.

### Day-1 external dependency

- **Install `fe` 26.6.0.** This is a user action; the pipeline installs nothing. Tollgate row 19 is FAIL
  and blocks Step 2. Verified Windows path (`sponsors/fe-lang.md` §2): "Download `fe_windows_amd64.exe`
  from <https://github.com/argotorg/fe/releases/tag/v26.6.0>, rename it to `fe.exe`, and put it in a folder
  on the user PATH (for example `%USERPROFILE%\.fe\bin`)." Then "Verify in **both** shells: `fe --version`"
  should start with `fe 26.6.0`. "**`feup.sh` does NOT support Windows/Git Bash.**"
- "In the project repo, add `.gitattributes` with `*.fe text eol=lf`" (Git `core.autocrlf=true` here).
  "Starter CI pins `FE_VERSION: v26.5.0`. For the campaign pin, change it to `v26.6.0`."

### Toolchain and project layout (`sponsors/fe-lang.md` §3–4)

- "**Pinned version: Fe 26.6.0** (tag `v26.6.0`, commit `5b3f96a`, released 2026-11-10T17:55:57Z). The
  contest allows ≥ 26.5.0."
- `fe.toml`: `[ingot]` `name` ("identifier; underscores, no hyphens") and `version` ("required");
  `[dependencies]` `utils = "../shared/utils"` ("local path"); git dependencies need a full 40-hex `rev`.
  "`src/lib.fe` is required (the ingot root). Files are modules … Import your own items with
  `use ingot::{Vault, VaultMsg}`. Workspaces use `[workspace]` with `members = [...]`."
- "`fe build` | writes `out/<C>.bin` (init), `out/<C>.runtime.bin`, `out/<C>.abi.json`. `--emit
  abi,metadata,sizes,…`". "`fe test [path|glob]` | `--filter`, `--jobs N` (default 8), `--show-logs`,
  `--trace-evm`, `--call-trace`, `--ingot <member>`, `--optimize`, `--report[-dir]`". "the starter CI runs
  `fe fmt --check` → `fe test` → `fe build`".
- "The EVM revision is **Osaka**. 'The test runner lifts Osaka's per-transaction gas cap, so a passing
  high-gas test does not prove that the transaction can be submitted unchanged'."
- **Printing:** "Native I/O as effects from `std::native::Host`: `Stdout`/`Stderr`/`Stdin`,
  `print!`/`println!`/`format!`/`write!` … **Linux/macOS only.**" (`fe-changelog-26.5-26.6.md`). EVM tests
  cannot print a table, so demo numbers come from asserted values, plus emitted events via `--show-logs`
  (decoded output format unverified).

### Language primitives this mechanism leans on (`sponsors/fe-lang.md` §1, §5; `fe-stdlib-index.md`)

- **Effects:** "Every function and handler declares in `uses (…)` what it reads (`x: T`) or mutates
  (`x: mut T`). Contract storage fields are effects; `Ctx`, `Call`, `Log` and `Create` are sealed
  capability traits." "Declare: `fn f() uses (store: mut S, ctx: Ctx)`." "Provide: `with (S = value) { … }`
  or `with (value) { … }`." "Effects propagate through call chains and can be shadowed by inner `with`
  blocks." Handler arms declare their own effects:
  `Variant { field } -> RetTy uses (ctx, mut balances, mut log) { … }`. "No `impl` on contracts and no
  `self.field`. Put logic on storage structs (`impl S { fn m(mut self) … }`) or in free functions with
  `uses`."
- **Typed units:** "`Wei`, `Timestamp`, `Duration`; `ether(n)`, `gwei(n)`, `days(n)`, `hours(n)`,
  `minutes(n)`; consts `ETHER`, `DAY`, …; `Wei::zero()`, `Duration::zero()`, `.as_wei()`.
  `Timestamp + Duration → Timestamp`; `Timestamp - Timestamp → Duration`. `Ctx::value()`/`balance()`/
  `selfbalance()` return `Wei`; `Ctx::timestamp()` returns `Timestamp`." Stale-doc trap (§9):
  `effects/built-in.md` still shows `u256`; "Trust the code and the starter."
- **Fixed point and rounding:** "`UFixed<D>`, `Fixed<D>`, `Wad` (18), `Ray` (27), `SWad`; `from_int`,
  `from_raw`, `from_ratio`, `raw()`, `one()`. `+ - * / **` keep scale with 512-bit intermediates. 26.6
  adds `Wad::parse("0.3")` and `format!` display. Plus `core::num::mul_div`, `mul_div_ceil`,
  `checked_mul_div`, `full_mul`, `gcd`, `isqrt`."
- **Sorting:** `core::sort` exposes `sort`, `heap_sort`, `insertion_sort`, `is_sorted`,
  `is_sorted_unique`, `binary_search`, `lower_bound`, `dedup_sorted`, `reverse` and `swap`, for example
  `pub fn sort<S: mut Index<usize> + Len>(_ seq: mut S) uses S::E`. 26.6: "`MemSlice`/`MemArray`/`MemVec`
  `.sort()` for any `Ord` (#1940)." `core::ops` exposes `trait Ord<T = Self>` and `trait Eq<T = Self>`.
- **Randomness, for seeded property tests:** `std::evm::random` has `trait Rng`, `struct KeccakRng`
  ("Solady's PRNG: each word is the keccak256 of the previous one"), `struct ReplayRng<const N: usize>`
  ("Meant for tests"), `shuffle`, `shuffle_slice` (`uses (rng: mut Rng) where T: Copy`) and `choose`.
  Constructor signatures are not in the index; read `ingots/std/src/evm/random.fe` @ v26.6.0.
- **Storage:** "`StorageMap<K,V>`: `get(key:)`, `set(key:, value:)`, `map[key]` place syntax (`+=`),
  `remove(key)`, nested maps `map[a][b]`, tuple keys `(a, b)`." "Maps can't be iterated or copied; keep a
  separate key list if you need iteration." "`TSlot<T>` is transient storage (`.value`)."
  `std::evm::mutex::Mutex<T>`: "A storage-backed value guarded by a transient reentrancy lock."
- **Calls and tokens:** "`call.call(addr:, gas:, value: Wei, message: M::V { … }) -> M::Return` (reverts
  bubble)"; "`call.try_call(…) -> CallOutcome` (`.success()`, `.decode<R>()`, `.returndata()`)";
  "`call.send_value(addr:, gas:, value:) -> RawCallOutcome`". "Helpers: `std::evm::erc20::{safe_transfer,
  safe_transfer_from, safe_approve, try_transfer…}`". "`safe_transfer` failures use `revert(...)`, so
  wallets won't decode the reason." "Handlers reject ETH unless marked `#[payable]`." "Update state before
  calling out (the starter's vault does this); `std::evm::mutex` and `TSlot` guards exist."
- **Messages, events, errors:** "`msg M { #[selector = sol("transfer(address,uint256)")] Transfer { to:
  Address, amount: u256 } -> bool, }`. Raw integer selectors (`#[selector = 0x01]`) also compile". "A
  `recv M` block must handle every variant." "`#[event] struct E { #[indexed] who: Address, amount: Wei }`
  → `log.emit(E { … })` (needs `log: mut Log`)." "`#[error] struct X { … }` + `revert_error(X { … })` →
  selector of `X(types)`." "`assert!(c, "msg")` → `Error(string)` `0x08c379a0`. The message must be a string
  literal."
- **Types and control flow:** "Tuple structs `struct Month(pub u8)`." "const generics `struct A<const N:
  usize> where N > 0`." "Closures `|x| x + 1`, iterator adapters `filter`/`map`/`fold`/`enumerate`, `for`,
  `while`, `loop` (26.6)." "`Option`/`Result` with `?`, `match`, `if let`, `let … else`." "`HashMap` in
  memory (26.6 prelude); `MemVec`, `MemArray`, `MemBuffer`." Const `where` predicates, `const fn` and
  `static_assert` are in the language (`seeds.md`).

### Testing (`sponsors/fe-lang.md` §6; `sponsors/fe-lang-examples.md` A, B, D, E)

- "Unit tests: `#[test] fn t() { assert!(…) }`. Revert tests: `#[test(should_revert)]`, optionally
  `panic = 0x11` or `selector = 0x…` (not both)."
- "**Integration tests:** `#[test] fn t() uses (evm: mut Evm) { … }`." "`evm.create2<C>(value: Wei::zero(),
  args: (a, b,), salt: n)`; a single arg needs a trailing comma: `(x,)`." "`evm.call(addr:, gas:, value:,
  message:)` returns the typed return value; `evm.try_call(…)` returns `.success()`." "Each test gets a
  fresh EVM; state persists across calls within one test."
- "**`#[test(balance = N)]` funds the test contract** with N wei". "The test runner contract is the caller
  (`evm.address()`); `evm.timestamp()` and `evm.balance(a)` work (Ctx on Evm)."
- **Multiple actors:** "deploy small 'actor/proxy' contracts that forward calls, so `ctx.caller()`
  differs. Canonical example: v26.6.0 fixtures `escrow.fe` and `ownable.fe`". "For N bidders or voters,
  deploy N proxy instances with different `salt`s."
- **Time:** "inject time instead of relying on block time: pass a `Timestamp`/clock as an effect or
  parameter for unit tests, or use a mock-time contract variant (Uniswap-port pattern:
  `mock_time_uniswap_v3_pool.fe`). Or design phases to advance by explicit calls or deadlines set relative
  to `evm.timestamp()`." From the examples file: "make 'now' an effect value (e.g. `struct Clock { now:
  Timestamp }`) in pure mechanism code. Tests provide any time; the contract handler builds it from
  `ctx.timestamp()`. *(Pattern suggestion: an inference from the docs, not an official example.)*"
- **Effect mocking:** "`let r = with (config) { calc(amount: 400) }`; mutable via `var x …; with (mut x)
  { … }`. `Ctx`, `Call` and `Log` are sealed and can't be mocked; put logic behind your own effect type."
- Negative tests, per the guide: "make only the call under test with `try_call`", with setup through
  `evm.call` "so a failing setup step fails the test instead of counting as the expected revert".
- **No fuzzing:** "Property tests must be hand-rolled loops, or use community libraries (FeCheck, fissure
  — see prior-art.md; unaudited)."

### Known limitations that touch this build (`sponsors/fe-lang.md` §5, §7–8; changelog)

- "`as` casts must be lossless (use `downcast()`)." "Out-of-range index → `Panic(0x32)`; bad enum tag →
  `Panic(0x21)`." "Integer literals that don't fit are now errors." "Arithmetic is **checked by default**:
  overflow → `Panic(0x11)`, div/0 → `Panic(0x12)`." "Collection lengths and indices are **`usize`**, not
  `u256`."
- "**No `#[derive(Clone)]`** (issue #1245, open). Write `impl Clone` by hand; `impl Copy for X {}` is a
  marker."
- "**Const-generic array arithmetic in types** (`[T; N + 1]`) can fail unification (issue #1372, open,
  2026-03). … Test early if you use it."
- "**JSON ABI rejects `()`** as a nested type (issue #1670, open). Avoid unit-typed fields in `#[abi]`
  structs, events and errors."
- "**StorageMap** can't be iterated; `get` returns the default for **any** key. Issue #1538 … shows an
  out-of-domain sentinel key causing an unauthorized write. Validate key domains explicitly."
- "**Gas:** idiomatic calldata forwarding costs 40–60 gas/call more than solc inline assembly (issue #2002,
  open, with an std PR #2004). Make gas claims only with benchmarks." The raw ops `gas()` and
  `prevrandao()` are `pub(ingot)` in `std::evm::ops` (`fe-stdlib-index.md`), so no public in-contract gas
  reading is confirmed.
- "Fe is 'not yet recommended for production use' (installation page). Compiler bugs are possible: report
  minimal repros to argotorg/fe issues and email hello@fe-lang.org if blocked."

### Reusable code and design references (`sponsors/fe-lang-examples.md`; `prior-art.md` §2)

- Apache-2.0 and usable with attribution in the README's third-party declaration: the guide's ERC20
  ("CoolCoin"), the voting example (deadline, map, events, typed time, tests), the proxy-actor fixture,
  storage structs as effects, effect mocking, custom errors, the `TSlot` guard, and the DEX `quote`
  function built on `mul_div`. The guide says `quote` is "not a deployable exchange", which suits the
  test-only baseline.
- **Design references only, do not copy:** `fe-lang/rosetta` (no license, pre-26.5 syntax) and
  `fe-lang/uniswap-v3-core-fe` (BUSL-1.1, pre-26.5). The organisers' blog repo has no license.
- Starter: <https://github.com/fe-lang/builders-challenge-starter> @ `f9d9aa9` (`src/lib.fe` vault,
  `src/tests.fe`, `ci.yml`, `SUBMISSION.md`; Apache-2.0). "**Expected to compile unchanged on 26.6.0.
  Unverified locally.**"

### Submission requirements (`event.md`, verbatim)

"Your core technical contribution must be in Fe." Then: "A public GitHub repository with an OSI-approved
license." · "The full commit SHA, project manifest, and exact Fe version." · "Reproducible build
instructions and appropriate automated tests." · "A README covering the approach, architecture, and
limitations." · "A short pitch, a Fe-specific highlight, and a demo or reproducible example." · "A
declaration of pre-existing work, reused code, and AI assistance." The starter adds "Start from
`SUBMISSION.md`" and "A short demo: a video, screenshots, or a reproducible CLI example." **Never commit
the private submission code.** The repo stays private until the consent-gated public flip at Step 3.

### Longest pole

The pure clearing core and its property suite. Price selection, marginal rationing and rounding are
where correctness lives. Everything else (escrow, claims, proxies, the AMM baseline) is conventional
contract code. Give the clearing tasks the highest effort and the most review, and settle the
arrival-order-independent tie-break and rationing rule in the spec before any code.

## Rubric mapping (why this won, for the record)

Weights adapted to the published rubric, with intrinsic buildability kept highest:
**Intrinsic buildability & verifiability 35** (Technical quality 30, plus the `safe-feasible` +5) ·
**Fe-specific value + theme fit 25** (Fe-specific value 25) · **Demo WOW + insight 25** (Usefulness 15 plus
Documentation & demo 10) · **Novelty 15** (Originality 20, minus the `safe-feasible` 5). Divergence
produced 26 candidates and 8 bolder rewrites across auctions, exchanges and governance. Four were knocked
out at the gate for external blockers: a Uniswap v4 PoolManager, CoW's off-chain solver network, a paid
LLM API, and the Linux/macOS-only native backend.

| Candidate | Build ×35 | Fe-fit ×25 | WOW ×25 | Novelty ×15 | Total |
|---|:-:|:-:|:-:|:-:|:-:|
| **AnyOrder: sandwich-proof batch exchange** | 5 | 5 | 5 | 4 | **485** |
| Candle auction with an `Rng`-effect close | 4 | 5 | 4 | 4 | 425 |
| Solver-verified batch auction | 4 | 5 | 4 | 4 | 425 |
| Spoiler-proof Schulze election | 5 | 4 | 4 | 3 | 420 |
| Combinatorial bundle auction | 4 | 4 | 4 | 5 | 415 |

AnyOrder has no external dependency: no oracle, indexer, keys, signatures or live market. It leans only
on mainstream Fe features that have simple fallbacks, and its key property is falsifiable in `fe test`.
Its lead survives a one-point cut to its WOW score (460 against 425). The candle auction's on-chain
randomness has no confirmed public path in std, and the solver-verified variant depends on unverified
dynamic-array calldata. Both stay as README future work.
