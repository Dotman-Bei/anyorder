# AnyOrder Docs Implementation Plan

**Goal:** Write the judge-facing README.md and SUBMISSION.md from what the build actually proved.
**Architecture:** README.md follows the kit's R2-contract-protocol v1 schema with the event overlay
(the starter's SUBMISSION.md headings R2 lacks); SUBMISSION.md keeps the starter's exact structure.
Every number is one the tests assert or the recording shows.
**Tech Stack:** Markdown; PowerShell 5.1 for the conformance gates; fe 26.6.0 for the version line.
**Source spec:** docs/superpowers/specs/2026-11-18-anyorder-docs-stretch-design.md

Conventions: the gates in this plan are PowerShell 5.1 one-liners: run them with PowerShell from the
repository root, not Git Bash. Other `Run:` lines are Git Bash. Cross-plan dependencies are written
`Task <subsystem>:<N>`. Never write the private submission code anywhere.

---

### Task 1: README.md: R2-contract-protocol v1 with the event overlay

**Files:**
- Modify: `README.md`

**Depends on:** Task core:12, Task dapp:9
**Effort:** medium
**Provides:** `README.md (R2-contract-protocol v1 + event-overlay)`
**Requires:** `web/public/recorded/sandwich.json (a real recorded run)`, `pnpm -C web local (Anvil 8545 + fe build + deploy + seed + Vite)`, `deploy/params.json { maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice }`

- [ ] **Step 1: Context**
Upstream facts: `web/public/recorded/sandwich.json (a real recorded run)`, `pnpm -C web local (Anvil 8545 + fe build + deploy + seed + Vite)`, `deploy/params.json { maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice }`. Run `fe test --filter sandwich` and `fe test --filter permutation` and paste their real summary lines.

- [ ] **Step 2: Write README.md**
Write `README.md` from the specs and what the tests assert. Line 1 is exactly `<!-- readme-schema: R2-contract-protocol v1 + event-overlay -->`. The `#`/`##` headings, verbatim and in this order (`###` sub-headings are free inside a section):

- `# AnyOrder`
- `## Demo`
- `## What it does`
- `## Quickstart`
- `## Built at Fe Builders Challenge 2026`
- `## Contract addresses`
- `## How it works`
- `## Security notes`
- `## Build & test`
- `## Deploy`
- `## The problem`
- `## Approach`
- `## Fe highlight`
- `## Architecture`
- `## Limitations`
- `## Declaration`
- `## Team`
- `## Roadmap`
- `## License`

What goes under each (sources: core spec sections 5, 6, 7, 8, 10, 11, 12; dApp spec; docs spec):
- **# AnyOrder** + one line: "A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so sandwich attacks have nothing to exploit." Optional CI badge.
- **Demo:** the money shot (`fe test --filter sandwich`, `fe test --filter permutation`) with their real output, the core spec section 6 table, the one-command local run that opens `/app`, and the line `TBD-post-build:demo-video-url` (Step 2.5 may record a video; the closing pass resolves or removes the line). Add no image files in this task. State the recording's date and commit from `web/public/recorded/sandwich.json`.
- **What it does:** problem -> solution in 3-6 plain sentences.
- **Quickstart:** `fe --version` (expect `fe 26.6.0 (5b3f96a)`), `fe test --filter sandwich`, `fe test --filter permutation`, `pnpm -C web install`, `pnpm -C web local`.
- **Built at Fe Builders Challenge 2026:** starting point "Rethink a protocol" (with the "Make the math work" and "Build for the next builder" angles), team, built 2026-11-17 to 2026-11-24 from the starter. Include the line `TBD-post-build:public-repo-url` (the repository is private until the Step-3 public flip).
- **Contract addresses:** a table `network | address | explorer` for the local Anvil chain only, with these deterministic addresses (Anvil dev account 0's first three deployments on a fresh chain, in the order `deployAll` deploys them; re-derive with `cast compute-address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --nonce 0`, `1`, `2`): TestToken `0x5FbDB2315678afecb367f032d93F642f64180aa3`, AnyOrder `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`, ConstantProductPool `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`; network `Anvil (local, chain id 31337)`; explorer `none`. Add a sentence that no public network is used and that `pnpm -C web local` writes the same addresses to `web/public/deployment.json`.
- **How it works:** batches, the clearing rule (core spec section 5, with the wording rule on the owner tie-break verbatim), rationing, rounding, settlement, the clock as an effect, the test-clock twin (test only), the dApp reading the real contract.
- **Security notes:** core spec section 11, all fourteen items, "unaudited" stated plainly; the gas measurements (core spec section 9).
- **Build & test:** every command and what it proves (core spec section 10), including `python ref/clearing_ref.py --check`, `--selftest`, `bash scripts/check-abi.sh`, `bash scripts/gas-spike.sh`, `pnpm -C web test`, `pnpm -C web test:e2e`; the tools to install (fe 26.6.0 release asset on Windows; Foundry; Node 22 + pnpm 10; Python 3.12).
- **Deploy:** the local one-command run, that paths with spaces are supported, that the built-in traders are "Anvil dev accounts. Test funds, no real value.", and that the design skill's gate (`pnpm -C web ui-gate`) is a local acceptance check that needs the skill installed (CI builds and tests the frontend without it).
- **The problem / Approach / Fe highlight / Architecture / Limitations:** the starter's questions answered; the Fe highlight is the `uses` table with a code excerpt of `pub fn select_price(_ orders: MemVec<Order>) -> Clearing` and of `pub fn place(...) -> OrderRef uses (clock: Clock, settings: Settings, book: mut Book, funds: mut Funds, log: mut Log)` showing there is no `Call`; Limitations = what works, what is unfinished, the sandwich claim's conditions (core spec section 6 "does not hold").
- **Declaration:** exactly the docs spec's declaration (pre-existing work, third-party code with licenses, AI assistance).
- **Team, Roadmap** (solver-proposed clearings verified in O(n), sealed or signed orders, per-address caps vs Sybils, a native simulator), **License** (Apache-2.0, from the starter; the design kit's files are MIT, see `web/public/assets/THIRD-PARTY-NOTICE.md`).
`TBD-post-build:` lines are allowed only for `demo-video-url` and `public-repo-url`.

- [ ] **Step 3: Schema conformance (PowerShell)**
Run: `$want = @('# AnyOrder','## Demo','## What it does','## Quickstart','## Built at Fe Builders Challenge 2026','## Contract addresses','## How it works','## Security notes','## Build & test','## Deploy','## The problem','## Approach','## Fe highlight','## Architecture','## Limitations','## Declaration','## Team','## Roadmap','## License'); $lines = Get-Content README.md -Encoding UTF8; $inFence = $false; $got = foreach ($l in $lines) { if ($l -match '^\x60{3}') { $inFence = -not $inFence } elseif (-not $inFence -and $l -cmatch '^#{1,2} ') { $l } }; $ok = ($got.Count -eq $want.Count); if ($ok) { for ($i = 0; $i -lt $want.Count; $i++) { if ($got[$i] -cne $want[$i]) { $ok = $false } } }; if ($ok -and ($lines[0] -ceq '<!-- readme-schema: R2-contract-protocol v1 + event-overlay -->')) { 'PASS' } else { 'FAIL' }`
Expected: PASS — `PASS`

- [ ] **Step 4: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `docs: README per R2-contract-protocol v1 with the contest overlay`

---

### Task 2: SUBMISSION.md: the starter's template, filled

**Files:**
- Modify: `SUBMISSION.md`

**Depends on:** Task 1
**Effort:** medium
**Provides:** nothing other tasks name
**Requires:** `README.md (R2-contract-protocol v1 + event-overlay)`

- [ ] **Step 1: Write SUBMISSION.md**
Fill `SUBMISSION.md` (the starter's template, fetched in core Task 1) for AnyOrder, keeping its structure exactly: the title `# AnyOrder`, the `**Pitch:**` line (one sentence: the README's one-liner), then `## The problem`, `## Approach`, `## Fe highlight`, `## Architecture`, `## Build and test`, `## Demo`, `## Limitations`, `## Declaration`, `## Team`, `## License`. Remove the template's HTML comment. "Build and test" carries the exact `fe --version` output (`fe 26.6.0 (5b3f96a)`) and the commands; "Demo" points to the README's Demo section and the reproducible CLI example `fe test --filter sandwich`; "Declaration" is the docs spec's text. Short: the jury reads it first; link to README sections for depth.

- [ ] **Step 2: Structure conformance (PowerShell)**
Run: `$want = @('# AnyOrder','## The problem','## Approach','## Fe highlight','## Architecture','## Build and test','## Demo','## Limitations','## Declaration','## Team','## License'); $lines = Get-Content SUBMISSION.md -Encoding UTF8; $inFence = $false; $got = foreach ($l in $lines) { if ($l -match '^\x60{3}') { $inFence = -not $inFence } elseif (-not $inFence -and $l -cmatch '^#{1,2} ') { $l } }; $ok = ($got.Count -eq $want.Count); if ($ok) { for ($i = 0; $i -lt $want.Count; $i++) { if ($got[$i] -cne $want[$i]) { $ok = $false } } }; if ($ok -and (($lines -cmatch '^\*\*Pitch:\*\* ').Count -eq 1)) { 'PASS' } else { 'FAIL' }`
Expected: PASS — `PASS`

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `docs: SUBMISSION.md for the jury`
