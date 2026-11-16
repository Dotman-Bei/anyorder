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
- `Dotman-Bei/fe-builders-challenge-2026` — **private**, created by the guide via the user's gh (repo-bootstrap.md), 2026-11-17.
- Local clone: `C:\Users\<user>\Documents\VIBE CODE\Hackathons\fe-builders-challenge-2026` (sibling of the kit).
- Event-named; idea-forge Step 4 renames it to the project slug. After a rename the local folder keeps the old name; record both here.
- Public flip is a consent-gated Step-3 action (required at submission; OSI license, Apache-2.0 from the starter).

## Tollgate
- Report: not yet created — Step 0a Stage 0 creates `docs/tollgate/2026-11-17-tollgate.md`.
- Guide-side preflight 2026-11-17: git PASS (2.54, identity set) · gh PASS (Dotman-Bei, repo scope) · kit PASS (not behind origin) · node PASS (v22) · python 3.12 PASS · free disk 65 GB PASS.
- Fe toolchain: `fe` NOT installed on this machine. Release v26.6.0 ships `fe_windows_amd64.exe`; the documented installer is bash-based (feup). Cargo is present, but no MSVC build tools were found, so build-from-source is the worse path. → Stack row for the architect; user installs Fe before Step 2.
- Verdicts: 0a pending Stage 0.

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
| Registration | pending (user) | project ID + submission link by email | — | — |
| 0a | pending | `docs/resources/<date>-fe-builders-challenge/` | — | |
| 0 | pending | `docs/idea-forge/*-brief.md` | — | |
| 1 | pending | spec + plans + manifest | — | |
| 2 | pending | commits | — | |
| 2.5 | deferred | | | |
| 3 | pending | gate ledger + submission | — | |

## Next action
User: register for the challenge today (before 2026-11-17 23:59 UTC), in parallel with Step 0a kickoff in a fresh tab.

## Open blockers
- Registration closes in ~24h; nothing else can be submitted without it.
- `fe` not installed locally (needed by Step 2; ideally installed before Step 1 so the architect can probe it).
