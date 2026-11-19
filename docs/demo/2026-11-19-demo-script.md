<!-- demo-script-schema: v1 -->
# AnyOrder — demo script

## 0 — Production card

| field | value |
|---|---|
| Project | AnyOrder |
| Event | Fe Builders Challenge 2026 (Argot Collective); the video is optional and supports the Documentation & demo score |
| Target length | 2:30 |
| Resolution / fps | 1920×1080 @ 30 |
| Voice | Kokoro (local, offline, English) |
| Music | off (captions-only) |
| Wallet on camera | N/A — there is no wallet in this build; the app uses Anvil's built-in dev accounts. No MetaMask, no dappwright. |
| Upload target | manual — the user uploads the file and supplies the URL; demo-studio uploads nothing and touches no account |
| Schema | v1 |

## 1 — Story & time budget

Prove: on one real local chain, the same three orders that make a constant-product pool sandwich profitable (0.008090638930163447 ETH) leave the batch price (0.011) and the victim's fill (15 TKN for exactly 0.165 ETH) unchanged and net the attacker −1 wei and 0 tokens, while the app's own panel shows where that guarantee stops (a one-sided order still moves the price).
Money shot: scene S3 (a: `fe test --filter sandwich` and `--filter permutation` with real output) completed by scene S4 (b: the `/app` `#sandwich` panel on the real local chain). S3 is the longest scene; the sandwich contrast (S2–S5) is 83 of 150 seconds.

| criterion | weight | seconds |
|---|---|---|
| Technical quality | 30% | 45 |
| Fe-specific value | 25% | 37 |
| Originality | 20% | 30 |
| Usefulness or insight | 15% | 23 |
| Documentation & demo | 10% | 15 |

Criteria and weights are quoted from the pack's `event.md`. The seconds are the scene-seconds each criterion's primary scenes carry: Technical quality = S3 (32) + S5 (13); Fe-specific value = S7 (24) + S6 (13, placing and clearing declare no `Call`); Originality = S1 (10) + S4 (20); Usefulness or insight = S2 (12) + S4 (6) + S5 (1) + S8 (4); Documentation & demo = S6 (9) + S8 (6). The column sums to 150 s.

## 2 — Pre-flight — set up before recording

| # | item | how to verify | ✓ |
|---|---|---|---|
| 1 | App running — from the repo root in Git Bash (`anvil` is on the Git Bash PATH only): `tail -f /dev/null \| pnpm -C web local`; stop it afterwards by killing the `tail`. Fresh run per scene group (S1/S2/S7/S8 read-only; S4+S5; S6), because batches last 120 s on the chain's clock. | ports 8545 and 5173 free before start (checked free 2026-11-19; if busy, report to the user, never kill); then `http://127.0.0.1:5173/` and `/app/` return 200 and `cast chain-id --rpc-url http://127.0.0.1:8545` prints 31337 | |
| 2 | Demo data — seeded by the setup script, not by hand: batch 0 (8 orders, cleared on chain at 0.011 ETH), batch 1 (20 open orders), five built-in traders (Anvil dev accounts 1–5, test funds). Nothing is placed before a take except what a scene itself does on camera. | `/app` `#settle` shows batch 0 cleared at 0.011 ETH; `#book` lists the 20 open orders (if more than 120 s have passed since seeding, restart: the state has moved on) | |
| 3 | Wallet state — N/A: no wallet in this build; the dev accounts are unlocked in Anvil, no key or mnemonic is created, stored or typed. | `web/public/deployment.json` names addresses only | |
| 4 | Browser hygiene — Playwright's own Chromium with a fresh temporary profile (never the user's Chrome profile), 1920×1080 viewport, device scale 1, 100% zoom, no extensions, no bookmarks bar, no stray popups. Browser scenes are captured from the page's own frames, so desktop contents never enter them. | first frame of each browser take measured 1920×1080 with `ffprobe`; `/` and `/app` render with no `unavailable` state | |
| 5 | Desktop hygiene — after the user's recording consent: notifications and focus assist off; the terminal scene runs in a fresh window with a unique title at a `subst` drive of the repo so the Windows username never prints (if `fe` still prints it, that region is blurred in assembly); no `.env`, registration email, submission link or account page open; capture is of that one window by title, discovered at runtime, never a hardcoded handle. | window title found at runtime; first terminal frame read as an image: no username, no secret | |
| 6 | Capture toolchain — the tollgate Step 2.5 session card, 2026-11-19: green except row 6 (no computer-use tools in this session; the terminal scene is a runner script launched in a visible window and captured by `gfxcapture`, so no device control is needed). | `docs/tollgate/2026-11-17-tollgate.md`, section "Step 2.5 session card (2026-11-19)" | |
| 7 | Assets — no logo and no music. Title overlay = the exact pitch sentence; the outro text is `github.com/Dotman-Bei/anyorder` (the repo is private until the user's public flip, so the card carries no QR); the persistent badge text is "Local Anvil chain 31337 · test funds · not a live market". | assets are text only, built in the Remotion project under `demo/` | |

## 3 — Shot list

| id | seconds | visual (route/action/window) | narration cue | driver | wallet verbs | gate assertion | retakes | take |
|---|---|---|---|---|---|---|---|---|
| S1 | 10 | `/` landing hero, no clicks; the pitch sentence as an overlay card, the badge on | S1 "This is AnyOrder…" | screencast | — | `/` returned 200; hero heading visible; the page is not in the unavailable or error state | 3 | |
| S2 | 12 | `/` the sandwich-contrast section scrolled into view; the page's own "Recorded on a local Anvil chain" label stays in frame | S2 "On a constant-product…" | screencast | — | the recorded label and the recorded pool profit figure (as the page formats `web/public/recorded/sandwich.json`) are in the final frame | 3 | |
| S3 | 32 | terminal window, runner script: `fe test --filter sandwich`, `fe test --filter permutation`, then `grep -n 8_090_638_930_163_447 ingots/exchange/src/sandwich_tests.fe` — real output, nothing typed for show; idle compile waits may be time-ramped and labelled | S3 "Here is the…" | gfxcapture | — | the run's tee'd log contains `test result: ok. 6 passed; 0 failed`, `test result: ok. 3 passed; 0 failed` and the two grep hits (lines 36 and 117); every exit code 0; first frame shows no username | 3 | |
| S4 | 25 | `/app` `#sandwich` scrolled through the three chapters, the recorded side-by-side, then click "Run the sandwich on your local chain" | S4 "Now the same…" | screencast | — | the live result's batch price is 0.011 alone and sandwiched, the victim's fill is unchanged, the attacker shows 0 tokens and −1 wei; the status line shows no error; `batchInfo` read back with `cast` is unchanged (snapshot rolled back) | 3 | |
| S5 | 14 | `/app` `#sandwich` "Where the guarantee stops" panel held in frame | S5 "This panel is…" | screencast | — | the panel's text includes "Where the guarantee stops" and "condition C" and the one-sided price 0.012, fully inside the viewport | 3 | |
| S6 | 22 | `/app` `#trade`: pick a built-in trader, place a buy into the open batch; `#settle`: click "Advance time to close the batch (dev chain control)", click "Clear batch N", click a trader's "Claim" | S6 "Now the lifecycle…" | screencast | — | each of the four transactions shows confirmed with no revert; the order appears in `#book`; the batch reads closed, then cleared at a price read from the contract; the claimed row reads Claimed; `cast call batchInfo` agrees | 3 | |
| S7 | 24 | `/` the Fe highlight section: the `select_price` signature and the `uses` table | S7 "Fe makes that…" | screencast | — | the section's text includes `select_price` and a `uses` row with `place` showing no `Call`; both fully in frame, legible at 1080p | 3 | |
| S8 | 11 | `/app` close section and footer with the `fe test` commands, the disclosure overlay and the repo text | S8 "Everything ran on…" | screencast | — | footer text shows the two `fe test` commands; the badge and the closing disclosure are on | 3 | |

## 4 — Narration script

**S1** — This is AnyOrder. A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit.
words: 24 · planned: 10s @ ~2.4 w/s · tone: calm, declarative · gloss: AnyOrder → "any order"; Fe → say it as the language's name, listen at TTS and respell if mangled

**S2** — On a constant-product pool, the order of transactions sets your price. A searcher buys just before your trade and sells just after it, and keeps what your trade moved.
words: 29 · planned: 12s @ ~2.4 w/s · tone: plain, explanatory · gloss: constant-product → "constant product"

**S3** — Here is the evidence, on the real compiler. fe test, filter sandwich: six tests pass. The test source asserts that a pool sandwich nets the attacker 0.00809 ETH; the exact figure is on screen. The same orders in one batch clear at 0.011 either way. The victim's fifteen tokens cost exactly 0.165 ETH either way, and the attacker ends at minus one wei and zero tokens. Then the permutation filter: 256 shuffles of the pure rule and 256 shuffled interleavings at contract level. Same price, same fills, every time.
words: 89 · planned: 32s @ ~2.4 w/s (89 words is +16% over the planning rate, inside the ±20% band; audio-first timing decides the real length) · tone: measured, the longest scene, let the numbers land · gloss: fe → "F E" or the language's name, same as S1; 0.00809 → "zero point zero zero eight oh nine"; 0.011 → "zero point zero one one"; 0.165 → "zero point one six five"; wei → "way"; ETH → "ether"

**S4** — Now the same contrast in the app, against the real contracts on a local Anvil chain. The side-by-side is from a recorded run, labelled as such. This button repeats the scenario live, inside a snapshot that is rolled back. The pool victim gets fewer tokens. In the batch, the victim's fill and the price do not move, and the attacker nets zero tokens and loses one wei.
words: 67 · planned: 25s @ ~2.4 w/s (+12%) · tone: confident, precise about recorded versus live · gloss: Anvil → "AN-vil"; wei → "way"

**S5** — This panel is where the guarantee stops. It holds under condition C: equal legs, priced outside every other order. A one-sided buy still moves the price, from 0.011 to 0.012 ETH. That is market power, not ordering.
words: 37 · planned: 14s @ ~2.4 w/s · tone: candid, unhurried · gloss: condition C → "condition C"; 0.012 → "zero point zero one two"

**S6** — Now the lifecycle. A built-in trader, an Anvil dev account, places an order into the open batch. The dev-chain control advances time to close the batch. Anyone can clear it, and the contract picks one price. Then the trader claims the fill. Placing and clearing declare no Call, so they cannot move funds.
words: 53 · planned: 22s @ ~2.4 w/s · tone: walk-through pace, matched to the clicks · gloss: Call → "call" (the Fe effect); Anvil → "AN-vil"

**S7** — Fe makes that claim checkable from the signature. select_price, the clearing function, declares no effects at all: it cannot read the clock, a caller or storage, or move funds. The handlers that place orders and clear batches declare no Call, and the compiler enforces it. Only deposit token and withdraw hold Call.
words: 52 · planned: 24s @ ~2.4 w/s · tone: the Fe highlight, effects named plainly · gloss: select_price → "select price"; deposit_token → "deposit token"; Call → "call"

**S8** — Everything ran on a local Anvil chain: dev accounts, test funds, and a book seeded by the setup script. Not a live market. Code and tests are in the repo.
words: 30 · planned: 11s @ ~2.4 w/s (+14%) · tone: plain closing disclosure · gloss: Anvil → "AN-vil"

## 5 — Assembly plan

Order: S1 (the title overlay is the pitch sentence, 0 extra seconds) → S2 → S3 → S4 → S5 → S6 → S7 → S8 (its tail is the outro text). Transitions: hard cuts. Captions: on, word-timed from the TTS word timestamps, bottom third, white text on a translucent dark bar, two lines at most, large enough to read at 1080p. A small corner badge stays on for the whole video: "Local Anvil chain 31337 · test funds · not a live market"; S2 and the recorded half of S4 also carry "Recorded run" in frame via the page's own label. Music: off. Loudness: −14 LUFS. Export: 1080p h264. Mechanics: references/demo-stack.md (Playwright `page.screencast` for browser scenes, `gfxcapture` by window title for the terminal, Kokoro `0.9.4`, Remotion `4.0.487`, two-pass loudnorm).

Notes for approval, kept inside this section because the schema allows no extra headings:
- **Toolchain bootstrap downloads** (needed by the stack, none done yet; asking for a yes with this script): Playwright's Chromium into a cache (~170 MB), Remotion's Chrome Headless Shell into `demo/node_modules` (~100 MB), the Kokoro Python packages with PyTorch and the Kokoro model from Hugging Face (about 1 GB in total, into a Python 3.12 venv outside the repo). If `espeak-ng` is not bundled by the Kokoro dependencies, its Windows installer is a system install, which I will ask about separately.
- **Honest wording rules the narration follows:** the terminal prints PASS lines, not the ETH figures, so S3 says "the test source asserts", and the figures come from a real `grep` of that source; the S2/S4 side-by-side is a recording and says so; the live run in S4 is a real transaction sequence inside rolled-back Anvil snapshots; the book is seeded and S8 says so; nothing says sandwiches are impossible or solved.
- **Recording is real or it is a placeholder card:** a scene that will not pass its gate after its retakes becomes a labelled BLOCKED card and is reported, never staged.
- **The pronunciation of "Fe"** is chosen by ear: listen to the first S1 render, pick the reading that sounds most natural, and use that one everywhere. No pronunciation is stated as correct anywhere in the video or the publish copy.
- **Approval notes (user, 2026-11-19):** S3 may run past 32 s so the numbers can land (audio-first timing decides; a total up to about 2:45 is fine); S7 keeps "cannot read the clock, a caller or storage" exactly and never says clearing cannot know who the traders are; the closing card shows `github.com/Dotman-Bei/anyorder` as text, no QR; the toolchain downloads are approved; an `espeak-ng` system installer, if one is needed, is asked about separately before installing.

## 6 — QC record

| check | scene(s) | pass/fail | note |
|---|---|---|---|
| money shot visible | | | |
| text legible at 1080p | | | |
| captions present + synced | | | |
| no capture yellow border | | | |
| no secret / no address that shouldn't be on screen | | | |
| per-scene duration within budget | | | |
| total duration within ±10% | | | |
| audio present, loudness sane | | | |

## 7 — Publish block

| field | value |
|---|---|
| Upload target + account | manual — uploaded by the user, in their own account |
| Title | AnyOrder: a batch exchange in Fe where transaction order can't change your fill |
| Description | A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit. This 2.5-minute demo shows `fe test --filter sandwich` and `fe test --filter permutation` on the real compiler, the same sandwich contrast on a real local chain in the app, the lifecycle (place, close, clear, claim), where the guarantee stops (a one-sided order still moves the price), and the Fe effects that make it checkable from signatures. Everything runs on a local Anvil chain (31337) with Anvil's public dev accounts and test funds; the batch book is seeded by the setup script, and the landing page's sandwich numbers are a recording of a real run. Not a live market, not deployed anywhere, unaudited prototype. Built for the Fe Builders Challenge 2026 with Fe 26.6.0. Repo: <add the public URL after the repo flip>. Music attribution: none (no music). |
| Tags | Fe, Fe language, Ethereum, batch auction, sandwich attack, MEV, smart contracts, Anvil, Fe Builders Challenge |
| Visibility | unlisted |
| URL | TBD |
| Verified logged-out | TBD |
| Resolves | submission-draft demo video URL |

## 8 — Status ledger

| date | event | by |
|---|---|---|
| 2026-11-19 | scripted | demo-studio |
| 2026-11-19 | approved (c722532, with three notes in section 5) | user |
