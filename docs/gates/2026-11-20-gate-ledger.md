# Gate ledger: Fe Builders Challenge 2026 (AnyOrder)

One ledger for the campaign. Written by the Step-3 gate concierge, **closing pass**, 2026-11-20
(main seat `claude-opus-5-5`, effort `high`, tier `top` per `model-routing.md` §Seat settings).
No preflight pass ran (the manifest has no `human_gate` task), so this file is the first ledger.

**Consent rule:** nothing below runs until the user names it ("run gate N"). One consent covers one
gate. Filling the form (G6) and pressing Submit (G7) are separate consents.

**Never in this file, any commit or any message:** the personal submission link, the private
submission code, the project ID, the contact email.

## Session card (tollgate rows 5–8, 15 plus the stack rows), 2026-11-20, this session

| Row | Probe | Result |
|---|---|---|
| 2 | `gh auth status` | PASS: logged in as `Dotman-Bei` (keyring), scopes `gist, read:org, repo, workflow` |
| 5 | claude-in-chrome `tabs_context_mcp` | PASS: tab group created, one blank tab |
| 6 | computer-use | N-A: not granted (no extension install, no native app) |
| 7 | email inbox | N-A: not granted (no signup gate; the post-submission email is the user's to read) |
| 8 | wallet extension / burner | N-A: struck, no wallet gate in this build |
| 15 | `setx` probe var, `reg query`, `reg delete` | PASS (var written, seen, removed); not needed, no secrets to store |
| S1 | `fe --version` | PASS `fe 26.6.0 (5b3f96a)` |
| S2 | `anvil --version` | PASS `1.7.1` (commit 4072e48) |
| S3 | `node --version` | PASS `v22.23.4` |
| — | `pnpm --version` | PASS `10.33.0` |

**Repo state at inventory:** `main` = `321ad90d3c6ade0395f1c7ae5e43cb88965dda00`, clean, in sync with
origin; one branch (`main`), no tags, 60 commits. Visibility **PRIVATE**. LICENSE in the root, Apache
License 2.0, and GitHub detects it as `apache-2.0`. CI and Native workflows are both **success** on
`321ad90`. The manifest (`docs/superpowers/manifest.json`) has 32 tasks and **no** `human_gate`.
The GitHub description still carries the pre-docs:4 pitch sentence (the wording docs:4 replaced in the repo files).
Open TBDs: README line 87 (`public-repo-url`), draft lines 30 (`repo-public-flip`), 32 (`commit-sha`),
36 (`fe-version-confirmation`), 117 (`submission-form-receipt`), 119 (`automated-check-confirmation-email`).
The demo-video URL is already resolved in the README (line 63), SUBMISSION and draft (line 94).

**Struck gates (none exist in this build):** wallet, burner wallet, faucet, testnet or mainnet
deploy, provider signup, API keys, OTP, extension install. The YouTube upload was demo-studio's (Step
2.5) and is done.

## User decisions, 2026-11-20

- **Ledger approved.** G1 and G2 green-lit. G2 is held until G1's findings have been shown to the
  user (the user's rule: findings first).
- **HOLD G3 and everything after it.** Follow-up tasks are being planned and built first: dapp:14
  (hosted mode), dapp:15 (absolute share URLs), docs:5 (the live page line and the "Built 2026-11-17
  to 2026-11-24" wording fix). They change the commit to be judged. When the user reports them
  committed: re-sync, re-scan only the new commits (G1 delta), then continue from G3.
- **D1 decided:** the G5 commit is the freeze. After it, nothing is pushed to `main` until the deadline
  has passed. G6–G8 evidence and the exact SHA stay in this file **locally, uncommitted**. There is
  no `gates/ledger` branch. This file is committed to `main` only after the deadline.
- **Live site added to G4 and the pre-submit checks:** https://anyorder.suitz.xyz/ (Vercel,
  auto-redeploys from `main`). Expect 200 on `/` and `/app/`, `/share.jpg` served, and, once dapp:15
  is in, `og:image` as an absolute URL on that domain.

## Decision D1 (DECIDED above; original proposal kept for the record)

Your rule is that the judged SHA must be the final commit on `main`. Two facts follow from it:

1. A commit cannot contain its own SHA, so the draft's `commit-sha` line can never be resolved
   inside the commit being judged.
2. Every ledger commit moves `main`. Evidence for G6 (form filled), G7 (submitted) and G8 (receipt)
   only exists after the SHA is frozen, so committing it to `main` would make the judged SHA stale.

**Recommended:** G5's commit is the freeze. It carries the README URL, the resolved draft fields, and
this ledger with evidence for G1–G5. In that commit the draft's `commit-sha` line reads "the final
commit on `main` (a commit cannot name its own SHA); the SHA is entered in the form and recorded in
the gate ledger on branch `gates/ledger`". After the freeze, `main` is never touched again. Ledger
updates for G6–G8, including the exact SHA, are committed to a separate branch `gates/ledger`, cut
from the frozen commit and pushed. Judges read `main` at the submitted SHA, and the audit trail still
exists. *Alternative:* keep post-freeze evidence uncommitted, in this local file only, until after
the deadline.

## Gates

| # | Gate | Tier | Pass | Tool plan (exact) | Human moment | Risk note | Status |
|---|---|---|---|---|---|---|---|
| G1 | **(a) Pre-flip privacy and secrets scan** of the working tree, all 60 commits on every ref, and commit metadata | A, read-only | closing | `Bash`: `git grep -nIE` over HEAD, then `git log --all -p` piped through `grep -nE`, for: email patterns (and the user's own address, matched in-process, never printed), `gho_`/`ghp_`/`github_pat_`, `sk-`/`AKIA`/`-----BEGIN`, 64-hex private-key shapes (Anvil dev keys are public and expected, so they are listed separately), 12/24-word mnemonics, the Google Forms prefill/`entry.` pattern, `C:\Users\<name>` and `/c/Users/<name>` paths, `AppData`, `.env` files; `git log --all --format='%an %ae %cn %ce'` for author emails; review of the tracked `.claude/agents/*.md` (5 files) and every file ever deleted (`git log --all --diff-filter=D --name-only`); `git check-ignore` for `.claude/settings.local.json`, `web/.taste-skill/` (a local Chrome profile, already ignored and untracked) | Decide on each finding. I report it with the least destructive fix (a forward commit that redacts the working tree; history rewrites are offered only as an option that needs your separate consent) | None: read-only. If a finding needs a product or doc fix, I stop and route it to the architect | **done 2026-11-20**: 3 findings (F1–F3). **Fixed 2026-11-20:** F2 and F3 as forward commits (now `12a7a1a`, and `d076cc8` for the wording fix); F1 and F2 in history by the one consented rewrite plus force-push (new tip `d076cc8`). Delta scan of the 7 commits after `caba6e3`: clean apart from F1. **New pre-G3 blockers R1–R2** in the evidence log |
| G1-R | **History rewrite and force-push** (the user's separate, explicit consent for exactly one rewrite and one force-push of `main`, private repo) | A, consented | closing | `git bundle` backup outside the repo; `git filter-branch --env-filter` (identity) `--index-filter` (swaps in 20 pre-built redacted blobs, written with `hash-object --no-filters`) `-- main`; `git push --force-with-lease=main:ba44561…` with the gh credential helper; `git config` user.name/email set to the noreply identity before any commit | none | Old commits are still served by SHA on GitHub (R1); the docs cite old SHAs (R2) | **done 2026-11-20**, evidence below |
| G2 | **(b) Set the GitHub description** to the new pitch | A | closing | `Bash`: `gh repo edit Dotman-Bei/anyorder --description "A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit."`, verify with `gh repo view --json description` | none | Reversible metadata; no commit | **done 2026-11-20**: read back, equal to the new pitch; visibility still PRIVATE |
| G3 | **(c) Flip the repo public** | A, with your consent | closing | Preconditions re-checked right before the flip: G1 clean or resolved, `gh auth status` = `Dotman-Bei`, LICENSE root Apache-2.0 (`gh repo view --json licenseInfo`), CI green on HEAD (`gh run list`), README renders (`gh api -H "Accept: application/vnd.github.html" repos/Dotman-Bei/anyorder/readme`). Then `gh repo edit Dotman-Bei/anyorder --visibility public --accept-visibility-change-consequences`; verify anonymously (`curl -sI https://github.com/Dotman-Bei/anyorder` → 200 with no auth) and view the page in Chrome (`claude-in-chrome`, new tab) | Your consent is the moment | **Effectively irreversible.** Once public, forks, caches and indexers may keep copies even if the repo is made private again, so G1 must be clean first. Stars and watchers are lost if it is flipped back | pending |
| G4 | **(d) Clean-room test** of the public repo, following only the README | A | closing | `Bash`: `git -c credential.helper= clone https://github.com/Dotman-Bei/anyorder` (no credentials, which proves the clone is anonymous) into scratchpad folder `cleanroom-nospace\` and then into `clean room\` (a path with a space); in each: `fe test`, `fe test --filter sandwich`, `pnpm -C web install`, `pnpm -C web local` (background), `curl` `/` and `/app/` expecting 200, then stop it and confirm no Anvil or Vite process is left. Every deviation from the README's words is recorded. The user's own servers on 8545/5173 are untouched (`local` moves ports when they are busy) | none | Local only. A defect means I stop and send you a fix hint (no product edits by me). Precondition: G3 (the repo must be public) | pending |
| G5 | **(e) Resolve the TBD-post-build fields and freeze the SHA** | A | closing | `Edit`: README line 87 → `Repository: https://github.com/Dotman-Bei/anyorder`; draft line 30 → repo public (date, G3 evidence); line 32 → per D1; line 36 → `fe --version` re-run on HEAD; this ledger's evidence for G1–G5. One commit, pushed with the gh credential helper; wait for CI and Native to succeed on it; record the full 40-hex SHA. `git diff <G4-tested SHA>..HEAD --stat` must show only those docs | Approve D1 | This commit becomes the judged SHA. If CI fails on it, nothing is submitted. If a later fix is needed after the freeze, the freeze is redone (latest valid submission counts) | pending |
| G6 | **(f) Fill the submission form** (Google Form) from your personal link, without submitting | A (fill only) | closing | You open your personal link yourself in the tab of the session's Chrome tab group (I never see it typed into chat). `claude-in-chrome`: `get_page_text`/`read_page` to list every field, then a read of the signed-in identity: I tell you an account is signed in and you confirm it's the registered one (I don't repeat the address). `form_input`/`computer` to fill from `docs/gates/submission-draft.md` + the frozen SHA + `fe 26.6.0 (5b3f96a)`. Prefilled fields (project ID, code, email) are left untouched. I read every field back. No Submit click. Any field the draft doesn't cover is shown to you, not invented | You open the link; you confirm the signed-in account | Leaving the tab loses nothing that matters; Google Forms may keep progress for a signed-in account. A wrong identity or a logged-out state is a hard stop | pending |
| G7 | **(g) Press Submit** | A, separate consent | closing | Before it: I show every field's exact content plus the 40-hex SHA and wait for your explicit go. Then a `claude-in-chrome` click on Submit; I verify the confirmation page (text only; any "edit your response" link is sensitive and never recorded) | Your explicit go on the shown content | Irreversible as an act, but correctable: "the latest valid submission counts" before 2026-11-24 23:59 UTC. Preconditions: repo public (G3), SHA = HEAD of `main` (re-checked with `git ls-remote` seconds before) | pending |
| G8 | **(h) Receipt note and the automated-checks email** | B | closing | Receipt: confirmation-page text recorded in the ledger per D1 (date and time, SHA submitted, no link or code). The email: you check your inbox; I record what you report (passed / what to correct) | **You read the inbox** (not granted to me: a capability gap). If nothing arrives, check spam, then ask on Zulip | "The form's receipt alone is not confirmation of acceptance." A "needs correcting" email routes back to the architect/orchestrator, then a new freeze and resubmit | pending |

## Recommended order

**G1 → G2 → G3 → G4 → (D1) → G5 → G6 → G7 → G8.**

- G1 before anything public: a leak found after G3 can't be fully taken back.
- G2 before G3, so the public page opens with the right pitch (G2 can also run any time).
- G4 tests the public repo, so it needs G3. G5 comes after G4 so the freeze is the last commit on
  `main`, and its diff from the tested SHA is docs only (README line 87, draft, ledger).
- G6 and G7 need the frozen SHA. The target is 2026-11-24 18:00 UTC internally; the form closes
  2026-11-24 23:59 UTC.

## Notes for the user (not gates, no action taken)

- README line 85 and the draft's declaration say "Built 2026-11-17 to 2026-11-24". If you submit
  before the 24th, that end date is in the future. It's harmless, but a doc task could say "to the
  submission date" instead. It's your call, routed to the architect if you want it changed.
- SUBMISSION.md and the README already carry the demo video URL; the draft's video line is resolved.

## Evidence log

*(One entry per executed gate: date, command(s), observed result, commit.)*

### G1: privacy and secrets scan, 2026-11-20 (scanned `main` at `b05cba4`, all refs: 1 branch, 0 tags, 61 commits, no stash)

Commands: `git log --all --format='%an|%ae|%cn|%ce'`; `git log --all -p --full-history` (2.19 MB
patch) and `git grep -nI` on HEAD, each run against the pattern sets in the G1 row; `git log --all
--diff-filter=D --name-only`; `git check-ignore`; `strings` over every tracked image; a visual check
of `docs/demo/storyboard/contact-sheet.png` (S1–S8) and `web/public/share.jpg`. Output was masked
in-process, so neither personal address was printed in full.

- **F1: personal email in commit metadata.** All 61 commits, author and committer (`Dotman-Bei
  <b***@gmail.com>`, a personal Gmail address), including this ledger's own commit. This is git
  metadata, not file content, so it's visible to anyone who clones the repo or opens a commit
  `.patch` once it's public. Neither of the user's addresses appears in any file content, now or in
  history.
- **F2: Windows username in absolute paths**, 11 occurrences at HEAD in 3 tracked files:
  `docs/guide/2026-11-17-fe-builders-challenge-runsheet.md` lines 3, 21, 69, 79 (×2);
  `docs/tollgate/2026-11-17-tollgate.md` lines 39, 48, 74, 85 (×2); `demo/scripts/capture-terminal.ps1`
  line 64 (the literal username in the "no username in the log" assertion). History has 2 more
  lines, earlier versions of runsheet line 21 and tollgate line 74. No secret, an identifier only.
  No binary contains it.
- **F3: `.gitignore` doesn't cover `.env` / `web/.env`.** No env or secret file has ever been
  tracked and the build uses no secrets. Hardening only.
- **Clean:** no token shapes (`gh*_`, `github_pat_`, `sk-`, `AKIA`, `AIza`, `xox*-`, PEM private
  keys); no 32-byte hex key anywhere (the only 64-hex value is fe's published SHA-256; Anvil
  accounts are unlocked over JSON-RPC, so the code holds no keys); no mnemonic (12 "private key /
  mnemonic" hits are all statements that none exist); no Google Forms prefill, `formResponse` or
  `entry.` link (only the public base `viewform` URLs in `event.md` and the runsheet); no file was
  ever deleted; no env, credential, key or keystore file was ever tracked; `.claude/settings.local.json`
  and `web/.taste-skill/` (a local Chrome profile) are ignored and were never tracked; the 5
  `.claude/agents/*.md` (13 lines each) carry no identifiers; the images show no personal data. The
  only emails in content are `hello@fe-lang.org` (the organiser's, public) and the
  `noreply@anthropic.com` co-author trailers.
- **Limit:** the submission code and project ID can't be matched by value (the concierge never
  holds them); only their link and prefill shapes were checked, and they were absent. The user can
  confirm locally without sharing them: `git log --all -p -S"<value>" --oneline`, where empty
  output means absent.

### G1 fixes, delta scan, rewrite, G2: 2026-11-20

Commit SHAs below are post-rewrite unless marked "pre". The user's decisions (F1: rewrite; F2:
forward commit then history scrub; F3: ignore env files) came in the chat on 2026-11-20.

- **Identity first:** before any new commit, repo-local `git config user.name Dotman-Bei` and
  `user.email 140025488+Dotman-Bei@users.noreply.github.com` (numeric id from `gh api user`).
- **Forward fixes** (normal commits, pushed normally): `12a7a1a` redacts the username in the
  runsheet and tollgate as `<user>`; `capture-terminal.ps1` now asserts
  `$t -notmatch [regex]::Escape($env:USERNAME)` (tested: a log with the name gives False, a clean
  log gives True; the script parses with 0 errors); `.gitignore` adds `.env`, `.env.*`, `web/.env*`,
  keeping `*.env.example`. `d076cc8`: README "Built from 2026-11-17, starting from the contest
  starter"; the draft "Everything else was built from 2026-11-17 onward."; this ledger no longer
  quotes the pre-docs:4 pitch. Gates on the result: docs:1 `PASS`, docs:2 `PASS`, docs:4
  `PITCH: OK` (it was FAIL before, on this ledger only), docs:5 `LIVE PAGE: OK`.
- **G1 delta scan** of the 7 commits after `caba6e3` (pre; dapp:14, dapp:15, docs:5, two notes,
  the two fixes): 0 username, 0 emails added, 0 token or key shapes, 0 form links, 0 binaries, 0
  env files; the only absolute paths are the 10 `C:\Users\<user>` redactions. Remaining: F1 on the
  5 commits made before the identity switch.
- **Backup:** `git bundle create … --all` → `anyorder-pre-rewrite-ba44561.bundle` (3.3 MB, 69
  commits), `git bundle verify`: okay. It's in the concierge's session scratchpad (outside the repo,
  never committed; a reboot or cleanup can clear it).
- **Rewrite:** 20 historical blobs contained the username (lowercase only). Each was redacted to
  `<user>` and re-hashed with `--no-filters`, and each verified as byte-exact (size +1 per
  occurrence, content equal to the plain substitution). `git filter-branch --env-filter
  --index-filter -- main`: 69 commits in 30 s. The commit messages contained no username.
- **Verification (before the push):**
  - `git log main --format='%an %ae %cn %ce'` → `69 Dotman-Bei 140025488+Dotman-Bei@users.noreply.github.com Dotman-Bei 140025488+Dotman-Bei@users.noreply.github.com`.
  - Username in any blob of the rewritten history: 0. The only "gmail.com" string left is the masked
    mention in this ledger's F1 entry.
  - Tree at the new tip `6b549c81899757f167a901767886479de16bd502` = the pre-rewrite tip's tree
    (identical, because the forward commit had already redacted HEAD).
  - All 69 old/new pairs: author date, committer date and message identical. 3 trees identical, 66
    differ only in username/`<user>` lines, 0 problems.
- **Force-push:** remote `main` was `ba44561` (pre). `git push --force-with-lease=main:ba44561f83fc577beb897391b2b22e1f55624e6b`
  → `+ ba44561...d076cc8 main -> main (forced update)`; `ls-remote` = `d076cc84f7f1d39e8c04ae3b7a2b439836fe04dd`.
  Local `refs/original` deleted (the bundle is the backup).
- **CI and Vercel on `d076cc8`:** check-runs `clearing-native=success, fe=success, web=success`
  (the same set as `ba44561` pre); workflows CI `success`, Native `success`; commit status
  `Vercel: success Deployment has completed`. Live https://anyorder.suitz.xyz: `/` 200, `/app/` 200,
  `/share.jpg` 200 `image/jpeg` 84107 B; `og:image`, `twitter:image` and canonical are absolute on
  the domain.
- **G2:** `gh repo edit … --description "<new pitch>"`; `gh repo view` reads it back exactly;
  visibility `PRIVATE`.
- **R1 (pre-G3 blocker, the user's decision): GitHub still serves the pre-rewrite commits by SHA.**
  `gh api repos/Dotman-Bei/anyorder/commits/48c0246` returns the old commit with the Gmail author.
  Once the repo is public, anyone with an old SHA can open it, and the old SHAs are in the repo's
  own docs (R2). The fix is outside the repo: ask GitHub Support, under its sensitive-data removal
  process, to purge unreachable objects and cached views for `Dotman-Bei/anyorder` **before** G3.
  Otherwise accept the residual risk. The old commits were never public, and there are no forks
  or PRs.
- **R2 (pre-G3 doc defect, routed to the architect): the docs cite pre-rewrite SHAs.**
  User-facing: README line 61 and `web/public/recorded/sandwich.json` line 3 (`"commit":
  "48c0246"`, shown on the landing page and baked into `web/public/share.jpg`). Pre `48c0246` is
  now `dedf5c5`, the same tree apart from the redaction. Internal: the tollgate (16 distinct SHAs),
  runsheet (4), this ledger (2), the demo script (1), the docs plan (1). Fix hint: remap every
  7-hex token found in the old→new map (the concierge holds it in its scratchpad as
  `sha-map-full.txt`, 69 pairs) and regenerate `share.jpg` with `share-image.ts`. Then G1 delta,
  CI and Vercel again.
