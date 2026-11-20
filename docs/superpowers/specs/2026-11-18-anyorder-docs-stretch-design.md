# AnyOrder docs and stretch design (sub-projects C and S)

Approved design, Step 1 architect session, 2026-11-18. Shared decisions live in
`2026-11-18-anyorder-core-design.md`.

## C. README.md and SUBMISSION.md

**README.md** follows the kit's `R2-contract-protocol v1` (the contracts are the pitch; the dApp is the
demo layer) with the event overlay. The overlay headings are the starter's `SUBMISSION.md` headings
that R2 does not already carry, verbatim (the contest: "A README covering the problem, your approach,
the architecture, and limitations. Start from `SUBMISSION.md`"). Resolved heading list, in order:

```
<!-- readme-schema: R2-contract-protocol v1 + event-overlay -->
# AnyOrder
## Demo
## What it does
## Quickstart
## Built at Fe Builders Challenge 2026
## Contract addresses
## How it works
## Security notes
## Build & test
## Deploy
## The problem
## Approach
## Fe highlight
## Architecture
## Limitations
## Declaration
## Team
## Roadmap
## License
```

Content sources: the one-sentence pitch is the sentence in core spec §1 (plan task docs:4 revised the
brief's solution line to match what the tests prove); the numbers are the core spec
§6 table (asserted by `fe test`); the Fe highlight is the `uses` table of core spec §7 with the
`select_price` signature and the `place` signature as the code excerpt; Security notes and Limitations
are core spec §11 verbatim in substance; Quickstart is `fe test --filter sandwich`,
`fe test --filter permutation`, `pnpm -C web install`, `pnpm -C web local`; Contract addresses is the
local Anvil table (deterministic dev-account-0 nonce addresses, written from `web/public/deployment.json`)
and says no public network is used; "Deploy" is the local one-command run, states that paths with
spaces are supported, and that the taste gate is a local Step-2 acceptance check that needs the skill
installed. `TBD-post-build:` lines are allowed only for the demo video URL and the public repo URL.

**Live page** (added 2026-11-20, plan task docs:5, after dapp:14 and dapp:15): the README's Demo
section, SUBMISSION.md's Demo section and the submission draft's Demo field each carry the one line
`Live page: https://anyorder.suitz.xyz/ (the landing page; the app needs a local chain, see Quickstart)`
and no other mention of the domain. The hosted site is a static landing page plus the recorded run;
no document may call it a live market or say the app runs there.

**Declaration** (both files): pre-existing work: none beyond the starter (`fe-lang/builders-challenge-starter`
@ `f9d9aa9`, Apache-2.0: LICENSE, CI layout, SUBMISSION.md template; the vault example was not kept).
Third-party code: the TestToken adapted from the Fe guide's ERC20 and the v26.6.0 `erc20.fe` fixture,
the proxy-actor pattern from the v26.6.0 `ownable.fe`/`escrow.fe` fixtures, the pool pricing after the
guide's DEX `quote` (all Apache-2.0, argotorg/fe and fe-lang/www); the design kit's runtime files in
`web/public/assets/` (Leonxlnx/taste-skill, MIT, notice included). AI assistance: built with Claude
Code (the build-system pipeline: architect, orchestrator, executors); every task gated by tests the
human contact can re-run. Never the private submission code.

**SUBMISSION.md** keeps the starter's exact structure: `# AnyOrder`, the `**Pitch:**` line, then
`## The problem`, `## Approach`, `## Fe highlight`, `## Architecture`, `## Build and test`, `## Demo`,
`## Limitations`, `## Declaration`, `## Team`, `## License`, with the exact `fe --version` output in
"Build and test".

## S. Stretch (cut first, in this order)

- **S1 gas table.** `web/scripts/gas-table.ts` deploys to its own capped Anvil and measures `clear()`
  of the real contract at N = 10, 25, 50, 75, 100 with the demo order mix; writes `docs/gas.md` and adds
  a `### Gas` subsection under README "Security notes". Gate prints `GAS: OK`.
- **S2 native Linux CI.** `.github/workflows/native.yml` (ubuntu): installs fe v26.6.0 with feup, runs
  `fe check ingots/clearing --backend native` and `fe test ingots/clearing --backend native --filter vector_`
  (the same pure clearing code, natively). Local gate: `fe check ingots/clearing --backend native`
  (verified to pass on Windows); the CI result itself is visible only after a push.
