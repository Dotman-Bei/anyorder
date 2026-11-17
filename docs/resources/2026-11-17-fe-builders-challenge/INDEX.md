# Resource pack — Fe Builders Challenge 2026 (Step 0a)

- **Extracted:** 2026-11-17 (00:00–01:00 UTC) by resource-extractor (main seat `claude-opus-5-5`, effort high), for campaign repo `Dotman-Bei/fe-builders-challenge-2026`.
- **Pinned toolchain:** Fe **26.6.0** (allowed ≥ 26.5.0).
- **Registration closes 2026-11-17 23:59 UTC (2026-11-18 00:59 WAT). Submission closes 2026-11-24 23:59 UTC (2026-11-25 00:59 WAT).**
- **Read order for idea-forge:** `event.md` → `tracks.md` → `prior-art.md` → `sponsors/fe-lang.md` → `seeds.md`.
- **Read order for the architect:** `sponsors/fe-lang.md` → `sponsors/fe-lang-examples.md` → `sponsors/fe-changelog-26.5-26.6.md` → `sponsors/fe-stdlib-index.md`.

## Contents

| File | What it holds |
|---|---|
| [event.md](event.md) | Deadlines (UTC + WAT), eligibility, submission requirements and mechanics, **judging weights verbatim** (30/25/20/15/10), prizes, testnet/mainnet and EVM/native rules, jury |
| [tracks.md](tracks.md) | The four "starting points" (one shared pool, no sponsor bounties), their verbatim statements, organiser prompts, minimum bar |
| [sponsors/fe-lang.md](sponsors/fe-lang.md) | Fe as the stack: Windows toolchain finding, `fe.toml`, CLI, language essentials, the test runner (and its missing cheatcodes and fuzzing), 26.5→26.6 starter impact, **known limitations**, stale-doc traps |
| [sponsors/fe-lang-examples.md](sponsors/fe-lang-examples.md) | Verbatim 26.6-syntax code (Apache-2.0): ballot contract + tests, proxy-actor multi-caller pattern, storage-as-effects, effect mocking, custom errors, `mul_div` quote, `TSlot` guard, payable fallback |
| [sponsors/fe-changelog-26.5-26.6.md](sponsors/fe-changelog-26.5-26.6.md) | Curated features, fixes and breaking changes for 26.5.0, 26.5.1 and 26.6.0, with the starter impact |
| [sponsors/fe-stdlib-index.md](sponsors/fe-stdlib-index.md) | Generated index of all 932 public `core`/`std` items in 26.6.0 |
| [prior-art.md](prior-art.md) | 15 public competing entries in this contest, the Fe team's showcases (rosetta governance/AMM/escrow, fevm, Uniswap-v3 port), 2023 winners, older Fe auctions, judges' projects |
| [seeds.md](seeds.md) | The newest Fe capabilities (26.5–26.6) mapped to mechanism-design affordances |

## Provenance (every source)

| # | Source | URL / ref | Fetched | Tool | Primary? | Confidence / gaps |
|---|---|---|---|---|---|---|
| 1 | Contest page (rules, FAQ, rubric, jury, dates) | https://fe-lang.org/contest/ | 2026-11-17 | curl (raw HTML→text) + WebFetch cross-check | **Primary** | High. Static page, fully rendered; all FAQ entries captured. |
| 2 | Announcement post | `fe-lang/blog` `content/posts/fe-builders-challenge.md` (2026-10-27); blog.fe-lang.org | 2026-11-17 | git clone | Secondary (organiser) | High. Rubric wording differs slightly from #1 (same weights; adds "clear security assumptions"). Recorded in event.md. |
| 3 | Project-ideas post | `fe-lang/blog` `fe-builders-challenge-project-ideas.md` (2026-10-29) | 2026-11-17 | git clone | Secondary (organiser) | High. One stale claim ("no JSON parser") is noted. Blog repo has no license, so code was not copied. |
| 4 | Release posts 26.5 / 26.6; 2023 winners; simple-DAO post | `fe-lang/blog` `release-26-5.md`, `release-26-6.md`, `announcement-of-hackathon-winners.md`, `simple-dao-written-in-fe-go-break-it.md` | 2026-11-17 | git clone | Secondary | High. |
| 5 | Starter repo | https://github.com/fe-lang/builders-challenge-starter @ `f9d9aa92a03af82c2bbb0dc2e0810244eb13e686` (2026-10-27) | 2026-11-17 | git clone; `gh run list` | **Primary** | High. CI green on 26.5.0 for all 3 commits. **Not compiled on 26.6.0 locally** (no `fe`). |
| 6 | Fe compiler source + CHANGELOG + CLI.md + std/core ingots + test fixtures + feup.sh + CI workflow | https://github.com/argotorg/fe @ tag `v26.6.0` (`5b3f96a`) | 2026-11-17 | shallow git clone (`core.longpaths=true` needed on Windows) | **Primary** | High for text. Behavioural claims (e.g. no cheatcodes) come from grep and are absence-of-evidence. |
| 7 | Releases v26.5.0 / v26.5.1 / v26.6.0 + assets | `gh release view/list -R argotorg/fe` | 2026-11-17 | gh | **Primary** | High. |
| 8 | Open issues (101) + selected bodies (#537, #1114, #1205, #1245, #1349, #1350, #1372, #1387, #1538, #1539, #1670, #2002) | https://github.com/argotorg/fe/issues | 2026-11-17 | gh | Primary | Medium. Most open issues predate the 2026 rewrite and are likely stale. Only recent ones are treated as live limitations. |
| 9 | Fe guide (fe-lang.org) source | `fe-lang/www` @ `9ff8138` (2026-11-11), `src/content/docs/**` (README: "targets Fe 26.6") | 2026-11-17 | git clone | **Primary** | High. Live site spot-checked: installation page via WebFetch matched the source. One stale table found (`effects/built-in.md`: `value()`/`timestamp()` shown as `u256`). |
| 10 | Stdlib API docs | `fe-lang/fe-docs` `26.6.0/docs.json.gz` → https://docs.fe-lang.dev | 2026-11-17 | git clone + Python extraction; **Chrome** render check (page reads "Fe 26.6.0 Standard Library") | **Primary** | High (generated from the compiler's own docs output). |
| 11 | Fe-team showcase repos | `fe-lang/{rosetta, fevm, json, lutz, keccak, swisstable, eisenbote, uniswap-v3-core-fe, bountiful, fe-examples}` | 2026-11-17 | shallow git clone | Secondary | High for descriptions. rosetta and the Uniswap port use pre-26.5 syntax. |
| 12 | Competing contest entries | GitHub repos listed in prior-art.md §1 | 2026-11-17 | `gh search repos` / `gh search code` / `gh api` | Secondary | Medium. Public and self-labelled only; code not audited; search-index lag possible. |
| 13 | Past/older Fe auction and DAO code | prior-art.md §3–4 repos | 2026-11-17 | gh api / code search | Secondary | Medium. Old v0 syntax; existence and dates only. |
| 14 | Judges' projects | https://plankevm.github.io, github.com/plankevm, github.com/EVVM-org, github.com/scaffold-eth | 2026-11-17 | WebSearch (standard) + gh | Secondary (shallow) | Low–medium. Taste signal only. |
| 15 | Machine probes (fe absent, WSL distros, autocrlf, file endings) | local | 2026-11-17 | Bash / PowerShell (read-only) | Primary (local) | High. |

## Gaps (labelled, not filled)

1. **Fe Zulip office-hours** (https://fe-lang.zulipchat.com/#narrow/channel/594128-office-hours): Chrome redirected to `/login/`. The channel is **not web-public**. Not logged in (extraction rules). No Zulip-sourced facts are in this pack.
2. **Nothing was compiled.** `fe` is not installed (tollgate row 19). Syntax comes from 26.6-targeted docs and v26.6.0 fixtures. Unverified locally: the starter on 26.6.0; whether `fe fmt --check` objects to CRLF files on Windows.
3. **Registration and submission forms** (Google Forms) were not opened; extraction never touches forms. Their field lists come from the contest page and blog descriptions.
4. **Competitor completeness:** private or unannounced entries are invisible to GitHub search. 15 public entries found.
5. **Test-runner cheatcodes:** "none exist" is from grepping `ingots/std` and `crates/fe/src/test` at v26.6.0 (no warp, prank, deal or roll). Absence of evidence; ask on Zulip if it becomes load-bearing.
6. **Windows release binary feature set** (e.g. whether `wasm` is enabled) was not inspected. Native executables are documented as unavailable on Windows.
