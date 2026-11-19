# AnyOrder dApp design (sub-project B)

Approved design, Step 1 architect session, 2026-11-18. Shared decisions, the frozen interface and
the sandwich claim live in `2026-11-18-anyorder-core-design.md`; this spec only adds what B needs.

FRONTEND SOURCE OF TRUTH (verbatim from the kickoff):
"design-taste-frontend (github.com/Leonxlnx/taste-skill, installed at ~/.claude/skills/design-taste-frontend/) is the only source of truth for every product frontend: the landing page at /, the app at /app and any other UI. No other design skill, reference, spec or library default may set or override a visual decision, and the skill is never copied into the project repo."
"In Step 2, every UI task's executor reads ~/.claude/skills/design-taste-frontend/SKILL.md in full before writing code (executors have no Skill tool), and the orchestrator accepts a UI task only after the skill's gate (scripts/gate.mjs) and its section 5 checklist pass."

## 1. Rules that bind every B task

- **Real contract only.** Every price, fill, balance and status on screen is read from the deployed
  contracts (views, receipts, simulated calls). TypeScript never clears a book. The supply/demand
  curves plot the contract's book (cumulative quantities); the price marker on them is the
  contract's `preview()` or the cleared `batchInfo` price, and is labelled as such.
- **Labels.** Content not produced live by the contract (the recorded sandwich run on `/`) is
  labelled "Recorded on a local Anvil chain, ⟨date⟩, commit ⟨sha⟩". Wherever traders appear:
  "Anvil dev accounts. Test funds, no real value."
- **Unknown is never zero.** Any value not yet read renders `—` (`UNKNOWN` in `src/lib/format.ts`)
  with its state's text; a real zero renders as `0`.
- **Keys.** None. Writes are `eth_sendTransaction` from Anvil-unlocked dev addresses. The optional
  injected-wallet mode (B10) never asks for a key.
- **Path safety (user change 1).** Every Node/shell helper passes arguments as arrays, never a shell
  string, and quotes paths. `test/e2e/tooling.e2e.test.ts` builds and checks the ABI from a temp
  folder whose path contains spaces. The README states that paths with spaces are supported.
- **Deploy allowlist (user change 3).** The local run deploys only `AnyOrder`, `TestToken`,
  `ConstantProductPool`; `AnyOrderTestClock`, `Trader`, `Reenterer` are never deployed.

## 2. Stack (pinned exactly; `web/pnpm-lock.yaml` committed)

Node ≥ 22, pnpm 10, TypeScript 5.9.3 (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`),
Vite 7.3.8 (multi-page: `index.html` → `/`, `app/index.html` → `/app`; `build.assetsDir: "_app"` so
Vite's bundles never mix with the kit's `public/assets/`), React 19.3.1 (islands only), viem 2.58.0,
Vitest 3.2.7, tsx 4.23.15, `@vitejs/plugin-react` 5.2.0, `@types/node` 22.20.5. (TypeScript 7, Vite 8 and
Vitest 5 exist but are new majors; the previous majors were verified here.)

## 3. Pages, as the skill shapes them (the deal is pinned; executors never re-deal)

The deal ran in a scratch folder outside the repo on 2026-11-18 and is fixed here:

| Item | `/app` (dApp) | `/` (landing) |
|---|---|---|
| kind / page type / site-kind | software / software / software | software / software / software |
| hero (`assets/layout/hero-<id>.html`) | **triptych** (headline, live UI collage that changes set every 2.8 s, one large button) | **collage** (text left, the app's batch window cut by the frame, one small result card) |
| palette (shared) | **lunar-grey-bronze**: near-black ground, muted bronze accent, made for fintech | same |
| type pairing (shared) | **mona**: Mona Sans + Geist Mono | same |
| radius / buttons / nav / footer / mark (shared) | **sharp** / **tonal** / **nav-centre** / **footer-statement** / **arc** | same |
| lit ground (`<html data-ground>`) | **sage** | **sage** |
| close / rhythm | **close-type** / **space** | **close-word** / **surface-pairs** |
| the one effect | **grain-gradient** (hero ground) | **gradient-mesh** (hero ground) |
| dealt moment (one: both pages have under 8 sections) | **pinned-chapters** in `#sandwich` | **word-highlight** (one statement section) |

The `:root` block `start.mjs css --page software --palette lunar-grey-bronze --type mona --radius sharp`
printed is pasted verbatim into each page's head (B5 lists it). Copy follows the skill's copy layer
(`copy.md`, `copy-voice.md`); every number on a page comes from the chain or the recording.

**`/app` sections** (each `main > section`, one `.wrap`, one screen at 1440×900; `#sandwich` two):
1. `#batch` (hero, triptych): h1 names the category and the buyer; one hard fact live (batch number,
   time to close, order count, indicative price from `preview()`); the collage's sets are live UI
   pieces (curve card, order card, fill card); button "Place an order".
2. `#trade`: trader switcher with the label, free and locked balances, deposit/withdraw, order
   ticket validated against `config()`, transaction status with decoded custom errors.
3. `#book`: the batch's orders from `orderAt()`, sorted by price; an "arrival order" toggle shows
   the same rows in arrival order, labelled as a column clearing never reads.
4. `#settle`: "Clear batch N" when closed (anyone), the cleared result, per-order fills, Claim, a dust
   note, and the dev-chain control "Advance time to close the batch" (labelled as such).
5. `#sandwich` (pinned-chapters, three steps: front-run, victim, back-run): pool vs batch side by side
   from the recording, "Run on your local chain" (`runSandwich`, snapshot + rollback), and the panel
   "Where the guarantee stops" with condition C in one sentence and the one-sided numbers.
6. close (close-type) and footer (footer-statement): the `fe test` commands, the repo link, the
   credits line with the taste-skill notice.

**`/` sections:** hero (collage: the batch window rendered from the recording; small card = the
attacker's −1 wei), how a batch clears (three steps), the sandwich contrast from the recording, the
word-highlight statement ("transaction order cannot change your fill"), the Fe highlight (the `uses`
table and the effect-free `select_price` signature as a code excerpt), the evidence (the four
commands and what each proves), close-word, footer. Numbers are injected **at build time** from
`public/recorded/sandwich.json` so the page reads correctly with scripts off.

## 4. Data flow and states

`public/deployment.json` (written by the deploy script; validated by `parseDeployment`) → viem public
client (HTTP, JSON-RPC batching) polled every 2 s → islands. Hooks in `src/app/live.ts`:
`useDeployment`, `useClients`, `useChain` (each poll folded by `nextChainState`, plus staleness), `useBlockRead` (re-read on each new
block; `data` undefined until the first success), `readBatch` (info + every order + `preview`).

| State | Trigger | What the island shows |
|---|---|---|
| loading | first read in flight | "Reading the chain…" |
| unavailable | RPC unreachable (a failed poll with nothing live on screen, or failed polls once the live data would be stale) or chain id ≠ 31337 | the reason and "Start the local chain: pnpm -C web local" + Reconnect |
| not-deployed | no code at `addresses.anyOrder` | "Deploy the contracts: pnpm -C web deploy:local" |
| stale | no answered poll for 3 polls (the RPC hangs); an idle chain that answers with the same block stays live, because Anvil mines only on transactions | the age, values dimmed |
| empty | open batch, 0 orders | "No orders in batch N yet" (no curve) |
| batch-open / batch-closed / cleared | `batchInfo.status` and count | countdown + preview / Clear button / the contract's result |

Staleness is measured from the last poll the RPC answered, never from the last new block (amended
2026-11-19, plan task dapp:11: the stale row first said "no new block for 3 polls", and that put a
false "the chain stopped answering" notice on an idle chain).

Transactions: idle, pending, confirmed, reverted with the decoded error name.

## 5. Chain tooling (B3, B4)

- `pnpm -C web local`: Anvil `--hardfork osaka --enable-tx-gas-limit --chain-id 31337` on 8545,
  `fe build`, deploy (account 0), fund traders (accounts 1-5: 1,000 TKN and 50 ETH each, 500 TKN and
  50 ETH deposited), seed (one cleared batch, then an open batch of `demoBatchSize` orders), write
  `public/deployment.json`, start Vite. `pnpm -C web deploy:local` does the same against a running
  chain. `pnpm -C web scenario` records `public/recorded/sandwich.json`.
- `src/scenario/sandwich.ts` runs the four scenarios of the core spec §6 against the deployed
  contracts inside Anvil snapshots and rolls back, so the demo state survives; the same module runs in
  Node (recording) and in the browser (live run).
- End-to-end tests (`pnpm -C web test:e2e`, files sequential): ABI module matches `abi/`; ABI check
  from a spaced path; production lifecycle with real block time; a full batch of `maxOrders` clears
  under the 16,777,216 cap; the scenario reproduces the `fe test` constants and records them.

## 6. The two gate runs (every UI task has exactly one gate command)

`pnpm -C web ui-gate app` or `pnpm -C web ui-gate landing` (`web/scripts/ui-gate.ts`):
1. `tsc --noEmit` and `vite build` into `dist/`;
2. `app` only: its own Anvil on 8546 (a dev chain on 8545 is untouched), build, deploy, fund, seed
   with one-hour batches (nothing changes during the check), `dist/deployment.json`;
3. arms the skill's gate for that page (`--start dist/app/index.html` or `dist/index.html`,
   `--root dist --kind software --category "a batch-auction exchange for Ethereum traders"
   --primary "Place an order"` or `"Open the app"`), unless a build for that page is open, adding
   `--new` when another page's build is open;
4. runs `gate.mjs`, prints it, stops Anvil. Accepted only on the last line `GATE: PASS`.

UI tasks run as one chain (never in parallel) because the gate keeps one build per folder in
`web/.taste-skill/` (git-ignored, created only by this wrapper): app shell + hero → trade → book +
settle → sandwich → landing → wallet polish. Each app task re-gates the whole `/app` page. The
orchestrator also checks the executor's §5 checklist report (each line with the gate's check ids)
before accepting. The orchestrator never invokes the skill itself (its Stop hook would hold the main
session); executors read SKILL.md and run only the wrapper. Mechanics verified: on a placeholder page
the wrapper built, seeded its chain, armed and ran the gate (`GATE: FAIL 13 (round 1 of 3)`) and
stopped Anvil in 79 s.

## 7. Kit files committed (decision 1)

Only the runtime files the built pages load, copied unmodified from
`~/.claude/skills/design-taste-frontend/assets/` to `web/public/assets/` (same relative paths), plus
`web/public/assets/THIRD-PARTY-NOTICE.md` with the upstream MIT text:
`system.css`, `system.js`, `ui/cards.css`, `ui/base.css`, `ui/ui.js`, `motion/motion.css`,
`motion/motion.js`, `backgrounds/backgrounds.css`, `backgrounds/backgrounds.js`, `layout/layout.css`,
`layout/layout.js`, `icons/icon.css`, `effects/fx.js`, `effects/grain-gradient/effect.js`,
`effects/gradient-mesh/effect.js`, `moments/moments.js`, `moments/lib.js`,
`moments/pinned-chapters/moment.css`, `moments/pinned-chapters/moment.js`,
`moments/word-highlight/moment.css`, `moments/word-highlight/moment.js` (21 files, ~490 KB). The gate's
`kit-edited` check must stay clean: no edits, no waivers for it.

## 8. CI

`.github/workflows/ci.yml` gains a `web` job: `pnpm install --frozen-lockfile`, `pnpm -C web test`,
`pnpm -C web gen:abi --check`, `pnpm -C web build`. The taste gate is local only (it needs the skill).
