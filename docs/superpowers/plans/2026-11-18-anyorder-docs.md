# AnyOrder Docs Implementation Plan

**Goal:** Write the judge-facing README.md and SUBMISSION.md from what the build actually proved.
**Architecture:** README.md follows the kit's R2-contract-protocol v1 schema with the event overlay
(the starter's SUBMISSION.md headings R2 lacks); SUBMISSION.md keeps the starter's exact structure.
Every number is one the tests assert or the recording shows.
**Tech Stack:** Markdown; PowerShell 5.1 for the conformance gates of Tasks 1-2 and 5; Git Bash (bash 5, GNU awk,
git grep) for the gates of Tasks 3-4; fe 26.6.0 for the version line.
**Source spec:** docs/superpowers/specs/2026-11-18-anyorder-docs-stretch-design.md

Conventions: the gates of Tasks 1, 2 and 5 are PowerShell 5.1 one-liners, and the gates of Tasks 3 and 4
are Git Bash (Tasks 3 and 4 added 2026-11-19, Task 5 on 2026-11-20, as follow-up tasks; each gate step says which shell). Run PowerShell gates from the
repository root, not Git Bash. Other `Run:` lines are Git Bash. Cross-plan dependencies are written
`Task <subsystem>:<N>`. Never write the private submission code anywhere.

---

### Task 1: README.md: R2-contract-protocol v1 with the event overlay

**Files:**
- Modify: `README.md`

**Depends on:** Task core:12, Task core:13, Task dapp:9
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
- **# AnyOrder** + one line: "A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit." (wording revised 2026-11-19 by Task 4) Optional CI badge.
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

---

### Task 3: One gas story in the README and spec §9

**Files:**
- Create: `scripts/check-gas-story.sh`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-11-18-anyorder-core-design.md`

**Depends on:** Task stretch:1
**Effort:** low
**Provides:** `bash scripts/check-gas-story.sh -> last line GAS-STORY: OK`
**Requires:** `README.md (R2-contract-protocol v1 + event-overlay)`

- [ ] **Step 1: Context**
Edits `README.md (R2-contract-protocol v1 + event-overlay)` (its `#`/`##` headings are locked: add or remove none) and section 9 of the core design spec. Three sets of `clear()` gas measurements are quoted today, and two of them conflict at first sight. All ran on `anvil --hardfork osaka --enable-tx-gas-limit` (cap 16,777,216):
1. **The gas spike** (`spikes/gas`, a prototype in the planned storage shape that writes a fill for every order, the worst case). The architect measured it, and core task 2 measured it again with `bash scripts/gas-spike.sh`: 409,402 / 2,161,907 / 4,426,468 gas at 10 / 50 / 100 orders. It set `maxOrders = 100`.
2. **The architect's planning measurement** of the verified contract code, before the build: 333,508 / 1,446,094 / 2,809,751 gas at 10 / 50 / 100 orders. **Which orders were placed was not recorded**: the architect searched the repository, its history and the planning session's scratch files on 2026-11-19 and found only the figures. Say exactly that; never invent an order mix for it.
3. **The gas table** (stretch task S1, `pnpm -C web exec tsx scripts/gas-table.ts`, `docs/gas.md`): the deployed contract with the demo order mix (limits 0.009-0.014 ETH per token, 1-4 tokens per order, three makers): 358462 / 807348 / 1567284 / 2380590 / 3156298 gas at 10 / 25 / 50 / 75 / 100 orders. The end-to-end test `web/test/e2e/lifecycle.e2e.test.ts` clears `maxOrders` orders of the same mix (`demoOrder`), so it measures the same 3,156,298.

The figures differ because they measured different things: `clear()` gas grows with the order count and with the number of non-zero fills, each one a storage write. Every gas figure gets one of three exact labels, and the check script enforces it:
- `gas spike (prototype, every order filled)`
- `architect's planning measurement (real contract, order mix not recorded)`
- `gas table (real contract, demo order mix)`

`docs/gas.md` and `docs/gas/spike.md` stay as they are: each is one labelled measurement with its method.

- [ ] **Step 2: The check script**
Write `scripts/check-gas-story.sh` with exactly this content:
```bash
#!/usr/bin/env bash
# docs:3 gate: one gas story. Every clear() gas figure in README.md and in
# section 9 of the core design spec carries the label of the measurement it
# comes from, and figures of a known set carry exactly their own set's label:
#   gas spike (prototype, every order filled)
#   architect's planning measurement (real contract, order mix not recorded)
#   gas table (real contract, demo order mix)
# A table row counts as labelled when the row itself or its table's header line
# carries the label. The per-transaction cap (16,777,216) and the half-cap rule
# (8,388,608) are limits, not measurements, and need no label. In README.md a
# line is in scope when it lies under "### Gas" or contains the word "gas"; in
# the spec, every line of section 9.
#
#   bash scripts/check-gas-story.sh      last line: GAS-STORY: OK
set -euo pipefail
cd "$(dirname "$0")/.."

SPEC=docs/superpowers/specs/2026-11-18-anyorder-core-design.md

check_file() {
  awk -v file="$1" -v mode="$2" '
    BEGIN {
      SPIKE = "gas spike (prototype, every order filled)"
      PLAN = "architect\047s planning measurement (real contract, order mix not recorded)"
      TABLE = "gas table (real contract, demo order mix)"
      split("409402 2161907 4426468", a, " "); for (i in a) set[a[i]] = SPIKE
      split("333508 1446094 2809751", a, " "); for (i in a) set[a[i]] = PLAN
      split("358462 807348 1567284 2380590 3156298", a, " "); for (i in a) set[a[i]] = TABLE
      bad = 0; inGas = 0; inSec = 0; prevRow = 0; header = ""; seenPlan = 0; seenTable = 0
    }
    {
      line = $0
      row = (line ~ /^\|/)
      if (row && !prevRow) header = line
      if (!row) header = ""
      prevRow = row
      if (mode == "readme") {
        if (line ~ /^### Gas$/) { inGas = 1 } else if (line ~ /^#/) { inGas = 0 }
        scope = inGas || (tolower(line) ~ /(^|[^a-z-])gas([^a-z-]|$)/)
      } else {
        if (line ~ /^## 9\. Gas$/) { inSec = 1 } else if (line ~ /^## /) { inSec = 0 }
        scope = inSec
      }
      if (!scope) next
      text = tolower(line " " (row ? header : ""))
      rest = line
      while (match(rest, /[0-9]{1,3}(,[0-9]{3})+|[0-9]{6,}/)) {
        fig = substr(rest, RSTART, RLENGTH); rest = substr(rest, RSTART + RLENGTH)
        n = fig; gsub(/,/, "", n)
        if (n == "16777216" || n == "8388608") continue
        if (n in set) {
          ok = index(text, set[n]) > 0
          if (ok && n == "2809751") seenPlan = 1
          if (ok && n == "3156298") seenTable = 1
        } else {
          ok = index(text, SPIKE) || index(text, PLAN) || index(text, TABLE)
        }
        if (!ok) { printf "UNLABELLED %s:%d: %s\n", file, NR, fig; bad = 1 }
      }
    }
    END {
      if (!seenPlan) { printf "MISSING %s: 2,809,751 with its label\n", file; bad = 1 }
      if (!seenTable) { printf "MISSING %s: 3,156,298 with its label\n", file; bad = 1 }
      exit bad
    }
  ' "$1"
}

status=0
check_file README.md readme || status=1
check_file "$SPEC" spec || status=1
if [ "$status" -eq 0 ]; then echo 'GAS-STORY: OK'; else echo 'GAS-STORY: FAIL'; exit 1; fi
```

- [ ] **Step 3: Run it to confirm it fails on today's text**
Run: `bash scripts/check-gas-story.sh`
Expected: FAIL: 11 `UNLABELLED README.md:...` lines (README lines 147-161), 7 `UNLABELLED docs/superpowers/specs/...` lines (spec lines 250-254), 4 `MISSING ...` lines, and last `GAS-STORY: FAIL`.

- [ ] **Step 4: README: the Gas sub-section and one row of the Build & test table**
In `README.md`, replace everything from the line `### Gas` up to the blank line before `## Build & test` (that heading and everything after it stay) with exactly this text, followed by one blank line:
```markdown
### Gas

Three sets of `clear()` measurements exist. All ran on `anvil --hardfork osaka --enable-tx-gas-limit` (per-transaction cap 16,777,216 gas), and they differ because they measured different things: `clear()` gas grows with the number of orders and with how many of them fill, since every non-zero fill is a storage write.

**1. The gas spike (prototype, every order filled).** Measured before the contract existed, by the architect and again by core task 2 with `bash scripts/gas-spike.sh`. The prototype in `spikes/gas` stores orders in AnyOrder's planned storage shape and writes a fill for every order (the worst case). It sets the per-batch cap; the result is in `docs/gas/spike.md` and `deploy/params.json`.

| Orders in the batch | `clear()` gas, gas spike (prototype, every order filled) | Share of the cap |
|---:|---:|---:|
| 10 | 409,402 | 2% |
| 50 | 2,161,907 | 12% |
| 100 | 4,426,468 | 26% |

The rule: `maxOrders` is the largest measured N whose clearing used at most 8,388,608 gas (half the cap); that gives `maxOrders = 100`, and `demoBatchSize = 20` (the smaller of that and 20).

**2. The architect's planning measurement (real contract, order mix not recorded).** During planning (2026-11-18) the architect cleared batches of 10 / 50 / 100 orders on the verified contract code and recorded the gas in the core design spec, section 9, but not which orders were placed: 333,508 / 1,446,094 / 2,809,751 gas. It shows the scale only; it is not comparable row by row with the gas table below, which used a known order mix.

**3. The gas table (real contract, demo order mix).** These are the numbers to quote. Stretch task S1 measured the deployed contract with `pnpm -C web exec tsx scripts/gas-table.ts` and the demo order mix (limits 0.009-0.014 ETH per token, 1-4 tokens per order, three makers); full table and method in [`docs/gas.md`](docs/gas.md). The end-to-end test `pnpm -C web test:e2e` clears a full batch of `maxOrders` with the same mix under the cap and prints the gas it used.

| Orders in the batch | `clear()` gas, gas table (real contract, demo order mix) | Share of the cap |
|---:|---:|---:|
| 10 | 358462 | 2.1% |
| 25 | 807348 | 4.8% |
| 50 | 1567284 | 9.3% |
| 75 | 2380590 | 14.2% |
| 100 | 3156298 | 18.8% |

No gas-efficiency claim is made beyond these measured numbers.
```
Then, in the Build & test table, replace the row
```markdown
| `bash scripts/gas-spike.sh` | the clearing gas at N = 10, 50, 100 (table above) |
```
with
```markdown
| `bash scripts/gas-spike.sh` | the gas spike (prototype, every order filled) at N = 10, 50, 100 (under Security notes, Gas) |
```

- [ ] **Step 5: Spec §9**
In `docs/superpowers/specs/2026-11-18-anyorder-core-design.md`, replace everything from the line `## 9. Gas` up to the blank line before `## 10. Evidence suite` with exactly this text, followed by one blank line:
```markdown
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
```

- [ ] **Step 6: The README schema is intact (PowerShell, from the repository root)**
Re-run Task 1's conformance one-liner (Task 1, Step 3) unchanged in PowerShell 5.1.
Expected: the single line `PASS` (no `#`/`##` heading was added or removed)

- [ ] **Step 7: Gate: every gas figure carries its label (Git Bash)**
Run: `bash scripts/check-gas-story.sh`
Expected: PASS — `GAS-STORY: OK`

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `docs: one gas story, every clear() figure labelled by what it measured`

---

### Task 4: Pitch wording that matches what the tests prove

**Files:**
- Modify: `README.md`
- Modify: `SUBMISSION.md`
- Modify: `docs/gates/submission-draft.md`
- Modify: `docs/superpowers/specs/2026-11-18-anyorder-core-design.md`
- Modify: `docs/superpowers/specs/2026-11-18-anyorder-docs-stretch-design.md`

**Depends on:** Task 3
**Effort:** low
**Provides:** nothing other tasks name
**Requires:** nothing from other tasks

- [ ] **Step 1: Context**
The old one-sentence pitch says more than the tests prove: no test shows that a sandwich has nothing at all to exploit. The tests prove the fills do not depend on transaction order. The old sentence:
```text
A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so sandwich attacks have nothing to exploit.
```
The new sentence, exactly, everywhere the old one stood:
```text
A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit.
```
Where the old sentence stands (checked 2026-11-19 with `git grep`): `README.md` line 4; the `**Pitch:**` line of `SUBMISSION.md`; `docs/gates/submission-draft.md` under "The short pitch (one sentence)" (wrapped over two lines); the `**Project:**` line of core spec §1 (wrapped, inside a longer sentence). The docs/stretch spec names the brief as the pitch's source, so that line changes too. **Not changed:** the brief `docs/idea-forge/2026-11-17-anyorder-brief.md` (a history document), and the plans under `docs/superpowers/plans/`, which are the architect's (they quote both sentences as instructions; the architect already put the new one into docs Task 1's body).
**No UI copy repeats it.** `web/index.html`, `web/app/index.html` and `web/src` say it in their own words ("transaction order cannot change your fill"), so there is no UI task and no UI gate here; the gate's `git grep` covers `web/` too.
**Not a file, not this task:** the GitHub repository's description still carries the old sentence. Changing it is an account setting, done at the Step-3 closing pass with the user's go (tollgate Notes).

- [ ] **Step 2: Run the gate to confirm it fails on today's text (Git Bash)**
Run: `p='A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit.'; ok=1; left=$(git grep -l -i -e 'nothing to explo[i]t' -- . ':!docs/idea-forge/' ':!docs/superpowers/plans/'); [ -z "$left" ] || { echo "OLD PITCH IN: $left"; ok=0; }; for f in README.md SUBMISSION.md docs/gates/submission-draft.md docs/superpowers/specs/2026-11-18-anyorder-core-design.md; do grep -qF "$p" "$f" || { echo "NEW PITCH MISSING: $f"; ok=0; }; done; [ "$(sed -n 4p README.md)" = "$p" ] || { echo 'README line 4 is not the pitch'; ok=0; }; grep -qxF "**Pitch:** $p" SUBMISSION.md || { echo 'SUBMISSION Pitch line differs'; ok=0; }; if [ "$ok" = 1 ]; then echo 'PITCH: OK'; else echo 'PITCH: FAIL'; false; fi`
Expected: FAIL: `OLD PITCH IN:` listing `README.md`, `SUBMISSION.md`, `docs/gates/submission-draft.md` and the core spec; four `NEW PITCH MISSING:` lines; `README line 4 is not the pitch`; `SUBMISSION Pitch line differs`; last `PITCH: FAIL`.

- [ ] **Step 3: README.md and SUBMISSION.md**
Replace line 4 of `README.md` (the old sentence, alone on its line) with the new sentence, alone on its line. In `SUBMISSION.md` replace the line `**Pitch:** ` + old sentence with `**Pitch:** ` + new sentence.

- [ ] **Step 4: The submission draft**
In `docs/gates/submission-draft.md`, under `## The short pitch (one sentence)`, replace the two lines
```markdown
A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so
sandwich attacks have nothing to exploit.
```
with the new sentence on one line.

- [ ] **Step 5: The specs**
In `docs/superpowers/specs/2026-11-18-anyorder-core-design.md` §1, replace the three lines
```markdown
- **Project:** "AnyOrder — a uniform-price batch-auction exchange in Fe whose fills are independent of
  transaction order, so sandwich attacks have nothing to exploit, shipped as a full dApp (landing page
  at /, app at /app) over a local Anvil chain."
```
with exactly
```markdown
- **Project:** AnyOrder: "A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit." Shipped as a full dApp (landing page at /, app at /app) over a local Anvil chain.
  (Pitch wording revised 2026-11-19 by plan task docs:4 to match what the tests prove; the kickoff's
  original wording is kept in the brief, `docs/idea-forge/2026-11-17-anyorder-brief.md`.)
```
In `docs/superpowers/specs/2026-11-18-anyorder-docs-stretch-design.md`, replace
```markdown
Content sources: the one-sentence pitch is the brief's solution line;
```
with
```markdown
Content sources: the one-sentence pitch is the sentence in core spec §1 (plan task docs:4 revised the
brief's solution line to match what the tests prove);
```
(the rest of that line, from ` the numbers are the core spec`, stays).

- [ ] **Step 6: Gate: the old sentence is gone from every non-history file, the new one is in each place (Git Bash)**
Run: `p='A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit.'; ok=1; left=$(git grep -l -i -e 'nothing to explo[i]t' -- . ':!docs/idea-forge/' ':!docs/superpowers/plans/'); [ -z "$left" ] || { echo "OLD PITCH IN: $left"; ok=0; }; for f in README.md SUBMISSION.md docs/gates/submission-draft.md docs/superpowers/specs/2026-11-18-anyorder-core-design.md; do grep -qF "$p" "$f" || { echo "NEW PITCH MISSING: $f"; ok=0; }; done; [ "$(sed -n 4p README.md)" = "$p" ] || { echo 'README line 4 is not the pitch'; ok=0; }; grep -qxF "**Pitch:** $p" SUBMISSION.md || { echo 'SUBMISSION Pitch line differs'; ok=0; }; if [ "$ok" = 1 ]; then echo 'PITCH: OK'; else echo 'PITCH: FAIL'; false; fi`
Expected: PASS — `PITCH: OK`

- [ ] **Step 7: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `docs: pitch wording that matches what the tests prove`

---

### Task 5: Live landing page in the README and the submission draft

**Files:**
- Modify: `README.md`
- Modify: `SUBMISSION.md`
- Modify: `docs/gates/submission-draft.md`

**Depends on:** Task dapp:15
**Effort:** low
**Provides:** nothing other tasks name
**Requires:** nothing from other tasks

- [ ] **Step 1: Context, and what may be claimed**
Added 2026-11-20. The site is deployed on Vercel at https://anyorder.suitz.xyz/. What is true there, and all that the docs may say about it: `/` is a static landing page that shows the recorded run (baked in at build time, labelled "Recorded on a local Anvil chain, 2026-11-18, commit 48c0246"); `/app/` loads, and after Task dapp:14 its live sections say that the app needs a local Anvil chain and how to start it. **Nothing trades there:** no chain, no contracts, no live market, and the app does not run on the hosted site. This task depends on dapp:15 (and through it on dapp:14) so the line goes in only after both are green.

The line, exactly, the same in all three files:
```text
Live page: https://anyorder.suitz.xyz/ (the landing page; the app needs a local chain, see Quickstart)
```
"Quickstart" is the README's `## Quickstart` section (`pnpm -C web install`, `pnpm -C web local`); SUBMISSION.md links the README's Demo section on the line above it. Do not add the domain anywhere else in these files, and add no other sentence about the hosted site. The gate counts every mention of `anyorder.suitz.xyz` in each file: exactly one, the line itself.

- [ ] **Step 2: Run the gate to confirm it fails on today's docs (PowerShell 5.1, from the repository root)**
Run the PowerShell line of Step 4.
Expected: FAIL: `LIVE PAGE LINE: FAIL in README.md (line hits 0, domain mentions 0)`, the same for `SUBMISSION.md` and `docs/gates/submission-draft.md`, no `SCHEMA: FAIL` line (the docs:1 and docs:2 structure checks pass on today's text), last line `LIVE PAGE: FAIL`. Measured by the architect.

- [ ] **Step 3: The three edits**
- `README.md`, in `## Demo`: directly after the line `Demo video: https://youtu.be/8QCVwiO_9c8`, insert an empty line, then the line. (The empty line before `## What it does` stays.)
- `SUBMISSION.md`, in `## Demo`: directly after the paragraph line that ends `are in [README, Demo](README.md#demo).`, insert an empty line, then the line. (The empty line before `## Limitations` stays.)
- `docs/gates/submission-draft.md`, in `## Demo or reproducible example (...)`: directly after the line `  - https://youtu.be/8QCVwiO_9c8 (unlisted; recorded and verified at Step 2.5)`, insert the line as a list item: `- ` followed by the line.

- [ ] **Step 4: Gate: the README and SUBMISSION structure gates still pass, and the line is in each file's Demo section, once, with no other mention of the domain (PowerShell 5.1)**
The README and SUBMISSION checks are the gates of docs:1 and docs:2, unchanged. Measured by the architect with these exact edits: `LIVE PAGE: OK`.
Run: `$line = 'Live page: https://anyorder.suitz.xyz/ (the landing page; the app needs a local chain, see Quickstart)'; $script:ok = $true; function Get-Heads($lines) { $inFence = $false; foreach ($l in $lines) { if ($l -match '^\x60{3}') { $inFence = -not $inFence } elseif (-not $inFence -and $l -cmatch '^#{1,2} ') { $l } } }; function Test-Live($name, $lines, $from, $to, $whole) { $a = [array]::IndexOf($lines, $from); $b = [array]::IndexOf($lines, $to); $hits = @(for ($i = 0; $i -lt $lines.Count; $i++) { if (($whole -and $lines[$i] -ceq $line) -or ((-not $whole) -and $lines[$i].Contains($line))) { $i } }); $urls = @($lines | Where-Object { $_.Contains('anyorder.suitz.xyz') }).Count; if ($a -lt 0 -or $b -lt 0 -or $hits.Count -ne 1 -or $hits[0] -le $a -or $hits[0] -ge $b -or $urls -ne 1) { "LIVE PAGE LINE: FAIL in $name (line hits $($hits.Count), domain mentions $urls)"; $script:ok = $false } }; $readme = @(Get-Content README.md -Encoding UTF8); $sub = @(Get-Content SUBMISSION.md -Encoding UTF8); $draft = @(Get-Content docs/gates/submission-draft.md -Encoding UTF8); $wantR = @('# AnyOrder','## Demo','## What it does','## Quickstart','## Built at Fe Builders Challenge 2026','## Contract addresses','## How it works','## Security notes','## Build & test','## Deploy','## The problem','## Approach','## Fe highlight','## Architecture','## Limitations','## Declaration','## Team','## Roadmap','## License'); $wantS = @('# AnyOrder','## The problem','## Approach','## Fe highlight','## Architecture','## Build and test','## Demo','## Limitations','## Declaration','## Team','## License'); if (((@(Get-Heads $readme)) -join '|') -cne ($wantR -join '|') -or $readme[0] -cne '<!-- readme-schema: R2-contract-protocol v1 + event-overlay -->') { 'README SCHEMA: FAIL'; $script:ok = $false }; if (((@(Get-Heads $sub)) -join '|') -cne ($wantS -join '|') -or @($sub -cmatch '^\*\*Pitch:\*\* ').Count -ne 1) { 'SUBMISSION SCHEMA: FAIL'; $script:ok = $false }; Test-Live 'README.md' $readme '## Demo' '## What it does' $true; Test-Live 'SUBMISSION.md' $sub '## Demo' '## Limitations' $true; Test-Live 'docs/gates/submission-draft.md' $draft '## Demo or reproducible example ("A short demo: a video, screenshots, or a reproducible CLI example")' '## Declaration ("A declaration of pre-existing work, reused code, and AI assistance")' $false; if ($script:ok) { 'LIVE PAGE: OK' } else { 'LIVE PAGE: FAIL' }`
Expected: PASS — `LIVE PAGE: OK`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `docs: live landing page in the README and the submission`
