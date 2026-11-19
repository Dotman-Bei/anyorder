# Submission draft — Fe Builders Challenge 2026 (AnyOrder)

The platform form, pre-answered by the Step 1 architect (2026-11-18) from the brief, the specs and the
pack's `event.md`. The Step-3 closing pass resolves the `TBD-post-build:` lines and pastes the rest.
The form's exact field list was not extracted (pack gap 3: forms are never opened by extraction); the
fields below are every item the contest page and blog require, in their words.

**Never write the private submission code, the project ID or the contact email into this file or the
repo.** The personal submission link prefills them; the user enters anything else by hand.

## Identity

- **Project name:** AnyOrder
- **Project ID / private submission code / contact email:** prefilled by the personal submission link
  from the registration email. Not stored here.
- **Team:** Dotman-Bei (solo human contact), building with an AI pipeline (Claude Code: architect,
  orchestrator, executors). "Every project needs one responsible human contact": Dotman-Bei.
- **Starting point:** Rethink a protocol (exchange), with the "Make the math work" (clearing math with
  explicit test vectors) and "Build for the next builder" (the clearing core as a reusable ingot)
  angles. One pool; the starting points are not separate tracks.

## The short pitch (one sentence)

A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit.

## Repository, commit, manifest, Fe version ("The full commit SHA, project manifest, and exact Fe version")

- **Public GitHub repository with an OSI-approved license:** https://github.com/Dotman-Bei/anyorder,
  Apache-2.0 (the starter's LICENSE).
  - TBD-post-build:repo-public-flip (the consent-gated Step-3 action; the repo is private until then)
- **Commit SHA to judge:**
  - TBD-post-build:commit-sha (the full 40-hex SHA of the final pushed commit on `main`)
- **Project manifest:** `fe.toml` (workspace `anyorder`, members `ingots/clearing` = ingot
  `anyorder_clearing`, `ingots/exchange` = ingot `anyorder`).
- **Exact Fe version:** `fe 26.6.0 (5b3f96a)` (release v26.6.0).
  - TBD-post-build:fe-version-confirmation (re-run `fe --version` on the judged commit)

## README ("A README covering the approach, architecture, and limitations")

`README.md` (schema R2-contract-protocol v1 + the contest overlay: The problem, Approach, Fe highlight,
Architecture, Limitations, Declaration, Team) and `SUBMISSION.md` (the starter's template, filled).

- **Problem:** on a continuous DEX the order in which transactions land decides who trades at what
  price, so ordering itself is the attack surface: a searcher wraps a victim's swap in a front-run and
  a back-run and pockets the price impact. Nothing in the Fe ecosystem shows an exchange where
  ordering cannot matter, or proves it.
- **Approach:** a periodic uniform-price call auction. Orders collect in a batch; once it closes, one
  `clear(batch)` picks the volume-maximising price (ties: minimum imbalance, then the highest price
  with demand at least supply, else the lowest), fills every order at that one price, rations only the
  long side at exactly that price, rounds in the contract's favour, and lets anyone claim. The
  clearing rule is a pure function in its own ingot: no `Ctx` or caller effect; the only identity it
  reads is each order's recorded owner, for the final tie-breaks, which decide at most 1 base unit per
  order.
- **Architecture:** `anyorder_clearing` (pure: `select_price`, `allocate`, money rounding, an oracle)
  → `anyorder` (AnyOrder contract whose handlers are free functions with explicit `uses` clauses; the
  test-only clock twin and proxy actors; TestToken; the baseline constant-product pool) →
  `ref/clearing_ref.py` (exact-rational reference that regenerates the vectors) → `web/` (Vite +
  React islands + viem over local Anvil: the landing page and the dApp, every number read from the
  real contracts).
- **Limitations and security assumptions:** the core spec's fourteen (ordering removed, market power
  not; censorship; timestamp skew; DoS bounded by the measured order cap; rounding dust; reentrancy
  lock; standard ERC20 only; key-domain checks; no oracle; batch-filling griefing; the owner tie-break;
  the test-only clock twin; unaudited prototype on a not-yet-production compiler). The sandwich claim
  holds exactly under condition C (equal legs priced outside every other order) and is stated with
  where it does not hold.

## Fe-specific highlight (one, with a code excerpt)

Effects make the safety claim a compile-time fact: the clearing function declares no effects at all,
and the order-placing and clearing handlers declare no `Call`, so they cannot move funds; only
`deposit_token` and `withdraw` hold `Call`.

```fe
pub fn select_price(_ orders: MemVec<Order>) -> Clearing

pub fn place(owner: Address, is_buy: bool, limit: u256, quantity: u256) -> OrderRef
uses (clock: Clock, settings: Settings, book: mut Book, funds: mut Funds, log: mut Log)
```

Time is an effect too (`Clock`), which is how `fe test` (no time warp) drives the same handler code
through a test-clock twin while the deployed contract reads the block timestamp.

## Demo or reproducible example ("A short demo: a video, screenshots, or a reproducible CLI example")

- **Reproducible CLI example (the money shot):** `fe test --filter sandwich` (the pool sandwich nets
  the attacker 0.008090638930163447 ETH; the same three orders in one batch: price 0.011 either way,
  the victim's 15 TKN for exactly 0.165 ETH either way, the attacker −1 wei and 0 tokens; the one-sided
  case where the price does move) and `fe test --filter permutation` (256 pure shuffles and 2 × 128
  contract-level interleavings: the same price and per-owner fills every time).
- **Working demo:** `pnpm -C web install` then `pnpm -C web local` (local Anvil, Osaka rules with the
  per-transaction gas cap on; the landing page at `/`, the dApp at `/app` with built-in Anvil dev
  traders, no wallet extension needed).
- **Video:** optional.
  - TBD-post-build:demo-video-url (only if Step 2.5 records one)

## Declaration ("A declaration of pre-existing work, reused code, and AI assistance")

- **Pre-existing work:** none of AnyOrder existed before 2026-11-03. The repository starts from
  `fe-lang/builders-challenge-starter` @ `f9d9aa9` (Apache-2.0): its LICENSE, CI layout and
  SUBMISSION.md template; its vault example was not kept. Everything else was built 2026-11-17 to
  2026-11-24.
- **Reused code (third party):** TestToken adapted from the Fe guide's ERC20 and argotorg/fe v26.6.0's
  `erc20.fe` fixture; the proxy-actor pattern from the v26.6.0 `ownable.fe`/`escrow.fe` fixtures; the
  pool's pricing after the guide's DEX `quote` example (all Apache-2.0). The design kit's runtime CSS/JS
  files in `web/public/assets/` are from Leonxlnx/taste-skill (MIT, notice included).
- **AI assistance:** designed and built with Claude Code (Anthropic) through the build-system
  pipeline: an architect session wrote the specs and the test-first plans (and verified the code with
  fe 26.6.0 before planning), an orchestrator dispatched one executor agent per task and re-ran every
  gate before committing. The human contact chose the idea, approved every design decision, and can
  re-run every test.

## Submission mechanics (Step 3)

- Submit through the personal submission link before **2026-11-24 23:59 UTC** (internal target
  2026-11-24 18:00 UTC). "The latest valid submission counts. Include the exact commit SHA you want
  judged."
  - TBD-post-build:submission-form-receipt (the form's receipt; not proof of acceptance)
  - TBD-post-build:automated-check-confirmation-email ("an email confirms whether the automated checks
    passed or explains what needs correcting"; check spam or ask on Zulip if none arrives)
