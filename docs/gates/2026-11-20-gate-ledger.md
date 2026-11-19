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
The GitHub description still carries the old pitch ("…so sandwich attacks have nothing to exploit.").
Open TBDs: README line 87 (`public-repo-url`), draft lines 30 (`repo-public-flip`), 32 (`commit-sha`),
36 (`fe-version-confirmation`), 117 (`submission-form-receipt`), 119 (`automated-check-confirmation-email`).
The demo-video URL is already resolved in the README (line 63), SUBMISSION and draft (line 94).

**Struck gates (none exist in this build):** wallet, burner wallet, faucet, testnet or mainnet
deploy, provider signup, API keys, OTP, extension install. The YouTube upload was demo-studio's (Step
2.5) and is done.

## Decision D1 (yours, needed before G5): where post-freeze evidence goes

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
| G1 | **(a) Pre-flip privacy and secrets scan** of the working tree, all 60 commits on every ref, and commit metadata | A, read-only | closing | `Bash`: `git grep -nIE` over HEAD, then `git log --all -p` piped through `grep -nE`, for: email patterns (and the user's own address, matched in-process, never printed), `gho_`/`ghp_`/`github_pat_`, `sk-`/`AKIA`/`-----BEGIN`, 64-hex private-key shapes (Anvil dev keys are public and expected, so they are listed separately), 12/24-word mnemonics, the Google Forms prefill/`entry.` pattern, `C:\Users\<name>` and `/c/Users/<name>` paths, `AppData`, `.env` files; `git log --all --format='%an %ae %cn %ce'` for author emails; review of the tracked `.claude/agents/*.md` (5 files) and every file ever deleted (`git log --all --diff-filter=D --name-only`); `git check-ignore` for `.claude/settings.local.json`, `web/.taste-skill/` (a local Chrome profile, already ignored and untracked) | Decide on each finding. I report it with the least destructive fix (a forward commit that redacts the working tree; history rewrites are offered only as an option that needs your separate consent) | None: read-only. If a finding needs a product or doc fix, I stop and route it to the architect | pending |
| G2 | **(b) Set the GitHub description** to the new pitch | A | closing | `Bash`: `gh repo edit Dotman-Bei/anyorder --description "A uniform-price batch-auction exchange in Fe whose fills are independent of transaction order, so a sandwich has no ordering to exploit."`, verify with `gh repo view --json description` | none | Reversible metadata; no commit | pending |
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
