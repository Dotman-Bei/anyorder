# Runsheet — Fe Builders Challenge 2026

Kit (doctrine, read-only): `C:\Users\<user>\Documents\VIBE CODE\Hackathons\build-system`
Guide seat: `claude-sonnet-5-5`, effort `high` (user-attested), opened 2026-11-17 00:18 WAT.

## Event
- **Name / URL:** Fe Builders Challenge 2026 — https://fe-lang.org/contest/ (funded by the Argot Collective)
- **Build window:** opened 2026-11-03 00:00 UTC
- **Registration deadline (REQUIRED to submit):** 2026-11-17 23:59 UTC = **2026-11-18 00:59 WAT**
- **Submission deadline:** 2026-11-24 23:59 UTC = **2026-11-25 00:59 WAT**. Internal target: submitted by 2026-11-24 18:00 UTC (19:00 WAT).
- **Results:** 2026-12-01 (target)
- **Prizes:** 1st $2,500 · 2nd $1,500 · 3rd $1,000 (USDC, Ethereum mainnet; all three guaranteed)
- **Judging (published):** Technical quality 30% · Fe-specific value 25% · Originality 20% · Usefulness/insight 15% · Documentation & demo 10%. Social reach does not count.
- **Tracks:** four "starting points", explicitly NOT separate tracks — one pool: Rethink a protocol / Make the math work / Build for the next builder / Take us by surprise.
- **Hard requirements:** core technical contribution in Fe (release 26.5.0+; latest is 26.6.0); public GitHub repo with OSI license; full commit SHA + `fe.toml` + exact Fe version; reproducible build + automated tests; README (problem, approach, architecture, limitations); one-sentence pitch + one Fe-specific highlight; demo or reproducible example; declaration of pre-existing work, reused code and AI assistance. Mainnet deployment gives no scoring advantage; EVM not required.
- **Links:** registration form https://docs.google.com/forms/d/e/1FAIpQLSehDUUbqfQt67Ecy21zIsOFN7pp4orx9Ko9DKCWcDkjhEUVBg/viewform · submission form https://docs.google.com/forms/d/e/1FAIpQLSd2pqUkJzFpZMu5FVQP-NtetrIoB6nI-pHG1MLTOQhCpsLKqg/viewform (personal link arrives by email after registering) · starter https://github.com/fe-lang/builders-challenge-starter · Fe repo https://github.com/argotorg/fe · Zulip https://fe-lang.zulipchat.com · contact hello@fe-lang.org
- **Judges:** Austin Griffith, Ahmed Castro, Marius van der Wijden, Philogy (Plank), Rahul Kothari, jistro (EVVM), Grant Wuerker + Micah Scopes (Fe core devs; Argot).

## Project repo
- **Current: `Dotman-Bei/anyorder`** — **private**, remote `https://github.com/Dotman-Bei/anyorder.git`. Renamed by idea-forge Step 0 on 2026-11-17 from `Dotman-Bei/fe-builders-challenge-2026` (created by the guide via the user's gh, repo-bootstrap.md). Use `Dotman-Bei/anyorder` in every kickoff's REPO field.
- Local clone (folder keeps the OLD name): `C:\Users\<user>\Documents\VIBE CODE\Hackathons\fe-builders-challenge-2026` (sibling of the kit). Origin verified = anyorder.git.
- Public flip is a consent-gated Step-3 action (required at submission; OSI license, Apache-2.0 from the starter).

## Tollgate
- Report: `docs/tollgate/2026-11-17-tollgate.md` (created by 0a Stage 0, extended in 0a session 2; one report only).
- Guide-side preflight 2026-11-17: git PASS · gh PASS (Dotman-Bei) · kit PASS (1 ahead / 0 behind origin) · node v22 · python 3.12 · disk 65 GB.
- Row 5 (Chrome) passed in 0a session 2 only; session-scoped, Step 3 re-probes at its boot.
- **Row 19 (`fe` CLI) FAIL, blocks Step 2.** feup.sh rejects Git Bash. Working path: download `fe_windows_amd64.exe` from the v26.6.0 release, rename to `fe.exe`, put it in a folder on the user PATH, then `fe --version` must show 26.6.0 in PowerShell AND Git Bash. Install before Step 1 so the architect can probe syntax.
- Verdicts: 0a DONE · 0 CLEAR · 1 CLEAR (row 19 degraded) · 2 BLOCKED (row 19) · 2.5 N-A · 3 CLEAR (provisional).

## Goal
Win — top-3 finish (1st $2,500) with a "Rethink a protocol" entry (reimagine an auction, exchange or governance mechanism in Fe).

## Strategy decisions
- **Steps:** 0a RUN (Fe 26.x is weeks old and not in the model's knowledge; the pack's Fe language/stdlib/test-runner facts are the feasibility fuel, so this is the most valuable step here) · 0 RUN (no idea chosen yet) · 1 RUN · 2 RUN · 2.5 DEFER (the form accepts a CLI example or screenshots; decide after green, only if >24h remain) · 3 closing pass RUN (public flip, submission form); preflight pass SKIP (no wallet/keys/faucets unless the architect adds a testnet deploy; mainnet gives no advantage).
- **Registration** is a user action, not a pipeline step (see Next action).
- **Mode:** guided.
- **Web UI:** none by default. The score has no UI axis (a UI helps only the 10% demo axis). The FRONTEND DESIGN PASS block is NOT sent now; if the brief or spec adds a web UI, the guide inserts the block verbatim in the architect and orchestrator kickoffs.
- **Track shortlist (all one pool):** 1) Rethink a protocol (primary — user's skill fit; auction/exchange/governance mechanism maps to Technical 30 + Originality 20 + Usefulness 15). 2) Make the math work (secondary angle — a mechanism whose core is verifiable math, e.g. fixed-point/clearing logic with explicit test vectors, feeds Technical 30 + Fe-specific 25). 3) Build for the next builder (byproduct — ship the reusable library inside the protocol repo; feeds Fe-specific 25 + Documentation 10).
- **Risk appetite:** `safe-feasible`. Reason: Technical quality (30%) is correctness/tests/completeness, Fe is not production-ready (compiler bugs cost days), the user has no Fe experience, and ~7 days remain. Put the novelty in the mechanism design, not in the toolchain.
- **Sponsor depth for 0a:** no sponsors. The Fe language is the stack. DEEP: Fe language reference + stdlib/core, effects, contracts and message handling, traits/generics/pattern matching, `fe test` runner and test syntax, `fe.toml` ingot manifest, argotorg/fe repo `examples/` and tests, the starter repo (src/lib.fe, src/tests.fe, ci.yml, SUBMISSION.md), release notes 26.5.x–26.6.0 (breaking changes), known-issues in the Fe issue tracker. SHALLOW: Zulip archives (public only), judges' own projects (Plank, EVVM, BuidlGuidl) for taste, Fe docs on the EVM/ABI interop.

## Step status
| Step | Status | Artifact | Verification | Seat settings |
|---|---|---|---|---|
| Registration | **done** (user-attested 2026-11-17 before 00:59 WAT cutoff) | project ID + private submission link by email (user keeps it; never committed) | user confirmation in guide chat | — |
| 0a | **done** (main 110b725) | `docs/resources/2026-11-17-fe-builders-challenge/` (event, tracks, prior-art, seeds, INDEX, 4 sponsors/fe-* files) | Guide verified 2026-11-17: pushed; weights 30/25/20/15/10 match the live page; deadlines in UTC+WAT; gaps labelled (Zulip login-gated, nothing compiled, private entries invisible) | claude-opus-5-5, effort high (per the session's own report) |
| 0 | **done** (cb73c4f) | `docs/idea-forge/2026-11-17-anyorder-brief.md` (AnyOrder: uniform-price batch-auction exchange in Fe, 373 lines) | Guide verified 2026-11-17 22:20 WAT: pushed, repo renamed + description set, all required fields present incl. Feasibility notes (pack facts with sources), security assumptions, out-of-scope, stretch, longest pole. Calendar fit: FITS (see Strategy). | claude-opus-5-5, effort max (user-attested). The session first reported claude-fable-5-1 and switched to Opus before real work began. |
| 1 | pending | spec + plans + manifest | — | |
| 2 | pending | commits | — | |
| 2.5 | deferred | | | |
| 3 | pending | gate ledger + submission | — | |

## Pack findings that shape the campaign (from 0a, guide-verified as recorded)
- 15 public competing entries; NONE does an auction, governance mechanism or exchange/order book. Nearest: LMSR market maker, 2 escrow/crowdfunding, 3 AI-agent spend-limit entries (crowded), math libs and test tools 3–4 each. Fe-team `rosetta` has basic governance + AMM (pre-26.5 syntax, no license); plain Fe auctions exist from old versions → originality must come from the mechanism.
- `fe test` has no cheatcodes (no warp/prank/deal) and no fuzzing: multi-actor tests need proxy-actor contracts; time-dependent logic takes time as an input.
- Native backend is Linux/macOS only: the organisers' "one codebase on-chain + off-chain simulator" idea needs WSL (no distro) or CI. Windows `fe build`/`fe test` for EVM are fine.
- Add `.gitattributes` with `*.fe text eol=lf` (machine has core.autocrlf=true). Starter CI pins v26.5.0 → bump to v26.6.0.
- Blog adds "clear security assumptions" to the 30% axis; blog also says gas claims need benchmarks.

## Calendar-fit call on AnyOrder (guide, 2026-11-17 22:20 WAT)
- Time left: ~6.1 days to the 2026-11-24 18:00 UTC internal target (submission closes 2026-11-24 23:59 UTC). Already burned: the whole of Nov 17.
- Scope: pure clearing core + property suite, one batch contract, test ERC20, proxy actors, test-only AMM baseline, Python reference, README. No UI, deploy, keys or video. **Fits** for an agent pool, provided Fe compiles as the pack says.
- Real risk = unverified Fe syntax (nothing compiled yet), not scope. Mitigations to ask of the architect: (a) first plan task is a walking skeleton: starter compiles on 26.6.0, one effect-free pure fn, one proxy-actor test, one `fe fmt --check`; (b) clearing core + property tests are the highest-effort, top-tier tasks; (c) stretch items (gas table, Linux CI native build) cut first.
- Spec risk to flag to the architect: define the "sandwich nets zero" claim PRECISELY. Attacker-free vs attacked batch price can differ if the attacker's legs shift the curves asymmetrically; a judge who reads adversarially (Philogy) will test it. State the exact condition under which the victim's fill is unchanged, and the cases where it is not, instead of an unconditional claim.

## DECISION 2026-11-17 ~22:45 WAT: AnyOrder ships as a full dApp (user override)
- The brief's "No web UI" out-of-scope line is overridden by the user (brief not hand-edited; the architect kickoff states the override). Landing at `/`, app at `/app`.
- **Frontend source of truth = `design-taste-frontend`** (user instruction, newest): architect plans every UI task from it, executors read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, orchestrator accepts a UI task only after `scripts/gate.mjs` + SKILL.md section 5 pass. Supersedes the FRONTEND DESIGN PASS block and the earlier ui-inspiration note. The user's text said the skill lives at `~/.claude/skills/`; it was only in `Hackathons\.claude\skills\`, so the guide copied it (39 MB, byte-identical) to `C:\Users\<user>\.claude\skills\design-taste-frontend`. Never copied into the project repo.
- Probes: anvil/cast/forge in `~/.foundry/bin` PASS · node v22 / npm 10.9.9 / pnpm present PASS · Chrome installed PASS (the gate drives headless Chrome) · gate.mjs runs (reports "GATE: OFF" with no build, as designed).
- Scope guard: the Fe core + money-shot tests stay the 55% of the score; dApp is a separate sub-project that depends only on the frozen ABI and is cut before the core. Chain = local Anvil (public dev accounts, no secrets) required; testnet deploy/hosting not required (would add human gates + Step 3 preflight).
- Step 2.5 (demo video) is no longer clearly deferred: with a real app it becomes cheap and valuable. Revisit after the green build.

## Next action
User: (1) **register NOW** (closes 2026-11-18 00:59 WAT) with name "AnyOrder" + the brief's Solution line · (2) install `fe` 26.6.0 (row 19; nothing compiled until then) · (3) paste the Step 1 (architect) kickoff in a fresh tab at opus + xhigh.

## Open blockers
- ~~Registration~~ done (user-attested). Remaining submission-side fact: the personal submission link (email) is needed at Step 3; user keeps it, never in the repo.
- User authorised the architect session to install `fe` 26.6.0 for them (2026-11-17 ~23:10 WAT): scoped to the official release exe, user-scope PATH append only, tollgate row 19 updated by that session. Guide re-probes row 19 afterwards.
- Architect Q1 answered: commit only loaded runtime assets, unmodified, under web/public/assets/ + MIT notice; skill files never copied.
- `fe` not installed (confirmed absent 2026-11-17 22:21 WAT): degraded for Step 1, hard block for Step 2.
