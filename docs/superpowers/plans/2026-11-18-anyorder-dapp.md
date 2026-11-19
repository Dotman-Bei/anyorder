# AnyOrder dApp Implementation Plan

FRONTEND SOURCE OF TRUTH: design-taste-frontend (github.com/Leonxlnx/taste-skill, installed at ~/.claude/skills/design-taste-frontend/) is the only source of truth for every product frontend: the landing page at /, the app at /app and any other UI. No other design skill, reference, spec or library default may set or override a visual decision, and the skill is never copied into the project repo.
If the build has any web UI, put these three lines verbatim at the top of the architect and Step 2 orchestrator kickoffs; the architect plans every UI task from the skill, the landing page included.
In Step 2, every UI task's executor reads ~/.claude/skills/design-taste-frontend/SKILL.md in full before writing code (executors have no Skill tool), and the orchestrator accepts a UI task only after the skill's gate (scripts/gate.mjs) and its section 5 checklist pass.

**Goal:** Ship AnyOrder's demo layer: one-command local chain tooling over Anvil, the dApp at `/app`
and the landing page at `/`, every number read from the real contracts.
**Architecture:** A Vite multi-page static site (`web/`): static HTML built to the design skill's
recipes with React islands for live data, a shared viem client for Anvil's unlocked dev accounts,
Node tooling (deploy, seed, scenario recorder) that passes arguments as arrays, and a UI gate wrapper
that runs the skill's finish gate on the built page against a seeded chain.
**Tech Stack:** Node 22, pnpm 10, TypeScript 5.9.3, Vite 7.3.8, React 19.3.1, viem 2.58.0, Vitest 3.2.7,
tsx 4.23.15, @vitejs/plugin-react 5.2.0, @types/node 22.20.5, Foundry anvil 1.7.1, fe 26.6.0, Chrome
(for the skill's gate), the design-taste-frontend skill 2.5.1 at ~/.claude/skills/.
**Source spec:** docs/superpowers/specs/2026-11-18-anyorder-dapp-design.md

Conventions for every task in this plan:
- Every `Run:` line is a Git Bash command from the repository root; `pnpm -C web` targets the app.
- Code blocks are exact file content, type-checked (and for B1-B4 run) in the architect's build.
- No private key, mnemonic or signature anywhere: writes are `eth_sendTransaction` from Anvil's
  unlocked dev accounts.
- Paths contain spaces on this machine ("VIBE CODE"): child processes take argument arrays, never a
  shell string.
- UI tasks (5-12): read `~/.claude/skills/design-taste-frontend/SKILL.md` in full first, then
  `references/copy.md`, `copy-voice.md`, `system.md`, `layout-v4.md`, `sections.md`, `cards.md`,
  `motion.md`, `moments.md`, `effects-usage.md`, `gate.md`. Never invoke a Skill tool, never re-run a
  deal (the deal below is pinned), never edit a kit file, never add a waiver for `kit-edited`. You may
  change an island's markup and class names to fit the skill's recipes; never change its data logic.
  Finish with the gate's last line `GATE: PASS` and a report of every section 5 checklist line with
  the gate's check ids.
- Cross-plan dependencies are written `Task <subsystem>:<N>`.

The pinned deal (dealt 2026-11-18 in a scratch folder outside the repo):

| | `/app` | `/` |
|---|---|---|
| page type / site-kind / kind | software | software |
| hero | triptych (`assets/layout/hero-triptych.html`) | collage (`assets/layout/hero-collage.html`) |
| palette, type, radius | lunar-grey-bronze, mona, sharp | the same |
| buttons, nav, footer, mark | tonal, nav-centre, footer-statement, arc | the same |
| ground (`<html data-ground>`) | sage | sage |
| close, rhythm | close-type, space | close-word, surface-pairs |
| effect | grain-gradient (hero ground) | gradient-mesh (hero ground) |
| dealt moment | pinned-chapters (`#sandwich`; from `assets/moments/_demo/in-page-service.html`) | word-highlight (statement section; from `assets/moments/_demo/in-page.html`) |

The `:root` block, verbatim in both pages' `<head>`, after the stylesheet links:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mona+Sans:wdth,wght@75..125,400..600&family=Geist+Mono:wght@400..500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/system.css">
<link rel="stylesheet" href="/assets/ui/cards.css">
<link rel="stylesheet" href="/assets/motion/motion.css">
<link rel="stylesheet" href="/assets/backgrounds/backgrounds.css">
<link rel="stylesheet" href="/assets/layout/layout.css">
<link rel="stylesheet" href="/assets/icons/icon.css">
<style>
:root {
  --p-bg: #111111; --p-surface: #1c1c1c; --p-ink: #f2f2f2; --p-muted: #8f8f8f;
  --p-accent: #a08672; --p-accent-ink: #111111; --p-action: #a08672; --p-action-ink: #111111;
  --p-inv-bg: #f2f2f2; --p-inv-surface: #e0e0e0; --p-inv-ink: #111111; --p-inv-muted: #5c5c5c;
  --p-inv-accent: #a08672; --p-inv-accent-ink: #111111; --p-inv-action: #a08672; --p-inv-action-ink: #111111;
  --font-display: "Mona Sans", system-ui, sans-serif;
  --font-text: "Mona Sans", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --display-weight: 500;
  --display-tracking: -0.03em;
  --display-tracking-xl: -0.04em;
  --display-stretch: 104%;
  --ly-scale: 0.96;
}
</style>
```

---

### Task 1: Web scaffold: pinned toolchain, two-page Vite build, formatters that never show unknown as zero

**Files:**
- Create: `web/package.json`
- Create: `web/pnpm-lock.yaml`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/app/index.html`
- Create: `web/src/lib/format.ts`
- Test: `web/src/lib/format.test.ts`

**Effort:** medium
**Provides:** `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)`
**Requires:** nothing from other tasks

- [ ] **Step 1: Package with exactly pinned versions and every script the later tasks use**
Write `web/package.json` with exactly this content:
```json
{
  "name": "anyorder-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run src",
    "test:e2e": "vitest run test/e2e --no-file-parallelism",
    "gen:abi": "tsx scripts/gen-abi.ts",
    "local": "tsx scripts/local.ts",
    "deploy:local": "tsx scripts/deploy-local.ts",
    "scenario": "tsx scripts/scenario.ts",
    "ui-gate": "tsx scripts/ui-gate.ts"
  },
  "dependencies": {
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "viem": "2.58.0"
  },
  "devDependencies": {
    "@types/node": "22.20.5",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "5.2.0",
    "tsx": "4.23.15",
    "typescript": "5.9.3",
    "vite": "7.3.8",
    "vitest": "3.2.7"
  }
}
```

- [ ] **Step 2: Strict TypeScript**
Write `web/tsconfig.json` with exactly this content:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["node", "vite/client"],
    "noEmit": true
  },
  "include": ["src", "scripts", "test", "vite.config.ts"]
}
```

- [ ] **Step 3: Two pages; Vite's bundles in _app/**
Write `web/vite.config.ts` with exactly this content:
```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const page = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

// Two static pages: the landing page at / and the dApp at /app. Vite's own
// bundles go to _app/ so they never mix with the design kit's files, which
// are served unmodified from public/assets/.
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: '_app',
    rollupOptions: {
      input: {
        landing: page('./index.html'),
        app: page('./app/index.html'),
      },
    },
  },
})
```

- [ ] **Step 4: Temporary landing shell (Task 9 replaces it)**
Write `web/index.html` with exactly this content:
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AnyOrder</title>
</head>
<body>
<main><h1>AnyOrder</h1><p>The landing page is built by its UI task.</p></main>
</body>
</html>
```

- [ ] **Step 5: Temporary app shell (Task 5 replaces it)**
Write `web/app/index.html` with exactly this content:
```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AnyOrder app</title>
</head>
<body>
<main><h1>AnyOrder</h1><p>The app is built by its UI tasks.</p></main>
</body>
</html>
```

- [ ] **Step 6: Install (writes web/pnpm-lock.yaml)**
Run: `pnpm -C web install`
Expected: exit 0

- [ ] **Step 7: Write the failing tests**
Write `web/src/lib/format.test.ts` with exactly this content:
```ts
import { describe, expect, it } from 'vitest'
import {
  UNKNOWN,
  formatAge,
  formatCountdown,
  formatEth,
  formatPrice,
  formatTokens,
  formatUnits18,
  formatWei,
  shortAddress,
} from './format'

describe('unknown values are never shown as zero', () => {
  it('renders undefined and null as the em dash', () => {
    for (const f of [formatEth, formatTokens, formatPrice, formatWei, formatUnits18]) {
      expect(f(undefined)).toBe(UNKNOWN)
      expect(f(null)).toBe(UNKNOWN)
    }
    expect(shortAddress(undefined)).toBe(UNKNOWN)
    expect(formatAge(undefined)).toBe(UNKNOWN)
    expect(formatCountdown(Number.NaN)).toBe(UNKNOWN)
  })

  it('still renders a real zero as zero', () => {
    expect(formatEth(0n)).toBe('0 ETH')
    expect(formatWei(0n)).toBe('0 wei')
  })
})

describe('18-decimal formatting', () => {
  it('cuts instead of rounding and drops trailing zeros', () => {
    expect(formatUnits18(165_000_000_000_000_000n)).toBe('0.165')
    expect(formatUnits18(9_756_097_560_975_609_756n)).toBe('9.756097')
    expect(formatUnits18(15n * 10n ** 18n)).toBe('15')
    expect(formatUnits18(-1n, 18)).toBe('-0.000000000000000001')
  })

  it('labels the units', () => {
    expect(formatPrice(11_000_000_000_000_000n)).toBe('0.011 ETH/TKN')
    expect(formatTokens(10n ** 18n)).toBe('1 TKN')
    expect(formatWei(1n)).toBe('1 wei')
  })
})

describe('small helpers', () => {
  it('shortens addresses', () => {
    expect(shortAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')).toBe('0xf39F…2266')
    expect(shortAddress('not an address')).toBe(UNKNOWN)
  })

  it('formats ages and countdowns', () => {
    expect(formatAge(4_200)).toBe('4 s ago')
    expect(formatAge(125_000)).toBe('2 min ago')
    expect(formatCountdown(125)).toBe('2:05')
    expect(formatCountdown(-3)).toBe('0:00')
  })
})
```

- [ ] **Step 8: Run them**
Run: `pnpm -C web test`
Expected: FAIL — `Failed to resolve import "./format"`

- [ ] **Step 9: The formatters**
Write `web/src/lib/format.ts` with exactly this content:
```ts
/** What every screen shows for a value it does not know. Never a zero. */
export const UNKNOWN = '—'

const UNIT = 10n ** 18n

/**
 * An 18-decimal amount as a decimal string, cut (never rounded) to at most
 * `maxFraction` fraction digits, trailing zeros dropped. `undefined` and `null`
 * give UNKNOWN.
 */
export function formatUnits18(value: bigint | undefined | null, maxFraction = 6): string {
  if (value === undefined || value === null) return UNKNOWN
  const negative = value < 0n
  const abs = negative ? -value : value
  const whole = abs / UNIT
  const fraction = (abs % UNIT).toString().padStart(18, '0').slice(0, maxFraction).replace(/0+$/, '')
  const text = fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`
  return negative ? `-${text}` : text
}

export function formatEth(wei: bigint | undefined | null, maxFraction = 6): string {
  return wei === undefined || wei === null ? UNKNOWN : `${formatUnits18(wei, maxFraction)} ETH`
}

export function formatTokens(base: bigint | undefined | null, maxFraction = 6): string {
  return base === undefined || base === null ? UNKNOWN : `${formatUnits18(base, maxFraction)} TKN`
}

/** A price in wei per whole token. */
export function formatPrice(weiPerToken: bigint | undefined | null): string {
  return weiPerToken === undefined || weiPerToken === null ? UNKNOWN : `${formatUnits18(weiPerToken, 6)} ETH/TKN`
}

/** An exact wei amount, for rounding dust. */
export function formatWei(wei: bigint | undefined | null): string {
  return wei === undefined || wei === null ? UNKNOWN : `${wei.toString()} wei`
}

export function shortAddress(address: string | undefined | null): string {
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return UNKNOWN
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** How long ago something was seen, from milliseconds. */
export function formatAge(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || !Number.isFinite(ms) || ms < 0) return UNKNOWN
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds} s ago`
  return `${Math.floor(seconds / 60)} min ago`
}

/** Seconds as m:ss for the batch countdown. */
export function formatCountdown(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds)) return UNKNOWN
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
```

- [ ] **Step 10: Unit tests and a production build**
Run: `NO_COLOR=1 pnpm -C web test && pnpm -C web build`
Expected: PASS — `6 passed (6)`

- [ ] **Step 11: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `chore(dapp): web scaffold with pinned toolchain and two-page build`

---

### Task 2: Deployment file schema, chain state machine, supply/demand curve points, recorded-run tokens

**Files:**
- Create: `web/src/chain/deployment.ts`
- Test: `web/src/chain/deployment.test.ts`
- Create: `web/src/chain/state.ts`
- Test: `web/src/chain/state.test.ts`
- Create: `web/src/lib/curves.ts`
- Test: `web/src/lib/curves.test.ts`
- Create: `web/src/lib/recorded.ts`
- Test: `web/src/lib/recorded.test.ts`

**Depends on:** Task 1
**Effort:** medium
**Provides:** `parseDeployment(input: unknown): Deployment, loadDeployment(url?, fetcher?), type Deployment, TRADER_LABELS, LOCAL_CHAIN_ID (web/src/chain/deployment.ts)`, `classify, isStale, batchPhase, secondsLeft, RECOVERY, POLL_MS, type ChainState (web/src/chain/state.ts)`, `curvePoints(orders: readonly BookOrder[]): CurvePoint[] (web/src/lib/curves.ts)`, `recordedTokens(rec: Recording), injectRecorded(html, tokens) (web/src/lib/recorded.ts)`
**Requires:** `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)`

- [ ] **Step 1: Context**
Uses `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)` (Task 1). Pure modules: no network, no chain.

- [ ] **Step 2: Write the failing deployment tests**
Write `web/src/chain/deployment.test.ts` with exactly this content:
```ts
import { describe, expect, it } from 'vitest'
import { DeploymentError, TRADER_LABELS, loadDeployment, parseDeployment } from './deployment'

const addr = (n: number): string => `0x${n.toString(16).padStart(40, '0')}`

export function sampleDeployment(): Record<string, unknown> {
  return {
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    deployer: addr(1),
    traders: TRADER_LABELS.map((label, i) => ({ label, address: addr(10 + i) })),
    addresses: { anyOrder: addr(2), testToken: addr(3), pool: addr(4) },
    genesis: 1_700_000_000,
    batchSeconds: 120,
    maxOrders: 100,
    demoBatchSize: 20,
    minQuantity: '1000000000000000',
    maxPrice: '1000000000000000000000',
    deployBlock: 3,
    commit: 'abc1234',
    feVersion: 'fe 26.6.0 (5b3f96a)',
    deployedAt: '2026-11-18T00:00:00.000Z',
  }
}

describe('parseDeployment', () => {
  it('accepts a complete deployment', () => {
    const d = parseDeployment(sampleDeployment())
    expect(d.addresses.anyOrder).toBe(addr(2))
    expect(d.traders.map((t) => t.label)).toEqual([...TRADER_LABELS])
  })

  it('rejects another chain', () => {
    expect(() => parseDeployment({ ...sampleDeployment(), chainId: 1 })).toThrow(DeploymentError)
  })

  it('names the first malformed field', () => {
    const bad = { ...sampleDeployment(), addresses: { anyOrder: 'nope', testToken: addr(3), pool: addr(4) } }
    expect(() => parseDeployment(bad)).toThrow('"anyOrder"')
  })

  it('requires the five built-in traders in order', () => {
    const swapped = sampleDeployment()
    swapped['traders'] = [...TRADER_LABELS].reverse().map((label, i) => ({ label, address: addr(10 + i) }))
    expect(() => parseDeployment(swapped)).toThrow('trader 1')
  })
})

describe('loadDeployment', () => {
  it('reports an HTTP failure instead of returning defaults', async () => {
    const fetcher = (async () => new Response('missing', { status: 404 })) as unknown as typeof fetch
    await expect(loadDeployment('/deployment.json', fetcher)).rejects.toThrow('HTTP 404')
  })

  it('parses a served file', async () => {
    const fetcher = (async () => new Response(JSON.stringify(sampleDeployment()))) as unknown as typeof fetch
    await expect(loadDeployment('/deployment.json', fetcher)).resolves.toMatchObject({ maxOrders: 100 })
  })
})
```

- [ ] **Step 3: Write the failing state tests**
Write `web/src/chain/state.test.ts` with exactly this content:
```ts
import { describe, expect, it } from 'vitest'
import { RECOVERY, batchPhase, classify, isStale, secondsLeft } from './state'

describe('classify', () => {
  it('reports an unreachable RPC with its recovery action', () => {
    const s = classify({ error: 'fetch failed' }, 0)
    expect(s).toEqual({ kind: 'unavailable', reason: 'unreachable', detail: 'fetch failed' })
    expect(RECOVERY.unreachable).toContain('pnpm -C web local')
  })

  it('refuses any chain but Anvil 31337', () => {
    expect(classify({ chainId: 1 }, 0)).toMatchObject({ kind: 'unavailable', reason: 'wrong-chain' })
  })

  it('detects a chain without the contract', () => {
    expect(classify({ chainId: 31337, hasCode: false, address: '0xabc' }, 0)).toEqual({ kind: 'not-deployed', address: '0xabc' })
  })

  it('stays loading until a block is read, then goes live', () => {
    expect(classify({ chainId: 31337, hasCode: true }, 0)).toEqual({ kind: 'loading' })
    expect(classify({ chainId: 31337, hasCode: true, block: 7n, blockTime: 100 }, 5)).toEqual({
      kind: 'live',
      block: 7n,
      blockTime: 100,
      seenAt: 5,
    })
  })
})

describe('isStale', () => {
  it('turns stale after three missed polls', () => {
    const live = classify({ chainId: 31337, hasCode: true, block: 1n, blockTime: 1 }, 0)
    expect(isStale(live, 6000, 2000)).toBe(false)
    expect(isStale(live, 6001, 2000)).toBe(true)
    expect(isStale({ kind: 'loading' }, 1e9)).toBe(false)
  })
})

describe('batchPhase', () => {
  it('maps the contract status', () => {
    expect(batchPhase({ status: 0, order_count: 0n })).toBe('empty')
    expect(batchPhase({ status: 0, order_count: 3n })).toBe('open')
    expect(batchPhase({ status: 1, order_count: 3n })).toBe('closed')
    expect(batchPhase({ status: 2, order_count: 3n })).toBe('cleared')
  })

  it('never counts below zero', () => {
    expect(secondsLeft(100n, 140)).toBe(0)
    expect(secondsLeft(100n, 40)).toBe(60)
  })
})
```

- [ ] **Step 4: Write the failing curve tests**
Write `web/src/lib/curves.test.ts` with exactly this content:
```ts
import { describe, expect, it } from 'vitest'
import { curvePoints } from './curves'

describe('curvePoints', () => {
  it('steps demand down and supply up at each distinct limit', () => {
    const points = curvePoints([
      { is_buy: true, limit: 12n, quantity: 15n },
      { is_buy: false, limit: 10n, quantity: 10n },
      { is_buy: false, limit: 11n, quantity: 10n },
      { is_buy: true, limit: 9n, quantity: 5n },
    ])
    expect(points).toEqual([
      { price: 9n, demand: 20n, supply: 0n },
      { price: 10n, demand: 15n, supply: 10n },
      { price: 11n, demand: 15n, supply: 20n },
      { price: 12n, demand: 15n, supply: 20n },
    ])
  })

  it('draws nothing for an empty book', () => {
    expect(curvePoints([])).toEqual([])
  })
})
```

- [ ] **Step 5: Write the failing recorded-token tests**
Write `web/src/lib/recorded.test.ts` with exactly this content:
```ts
import { describe, expect, it } from 'vitest'
import { type Recording, injectRecorded, recordedTokens } from './recorded'

const rec: Recording = {
  recordedAt: '2026-11-18T00:01:22.890Z',
  commit: 'abc1234',
  feVersion: 'fe 26.6.0 (5b3f96a)',
  result: {
    block: '56',
    pool: {
      victimTokensAlone: '14457831325301204819',
      victimTokensSandwiched: '13773314203730272596',
      attackerTokens: '9756097560975609756',
      attackerEthBack: '118090638930163447',
      attackerProfitWei: '8090638930163447',
    },
    batchAlone: { batch: '3', price: '11000000000000000', victimTokens: '15000000000000000000', victimPaidWei: '165000000000000000' },
    batchSandwiched: {
      batch: '3',
      price: '11000000000000000',
      victimTokens: '15000000000000000000',
      victimPaidWei: '165000000000000000',
      attackerTokenChange: '0',
      attackerWeiChange: '-1',
    },
    oneSided: {
      batch: '3',
      price: '12000000000000000',
      victimTokens: '15000000000000000000',
      victimPaidWei: '180000000000000000',
      attackerTokens: '10000000000000000000',
      attackerPaidWei: '120000000000000000',
    },
  },
}

describe('recorded tokens', () => {
  it('formats the recorded run', () => {
    const t = recordedTokens(rec)
    expect(t['pool.victimSandwiched']).toBe('13.7733 TKN')
    expect(t['pool.attackerProfit']).toBe('0.00809 ETH')
    expect(t['batch.price']).toBe('0.011 ETH/TKN')
    expect(t['batch.attackerWei']).toBe('-1 wei')
    expect(t['oneSided.price']).toBe('0.012 ETH/TKN')
    expect(t['recordedAt']).toBe('2026-11-18')
  })

  it('injects tokens and refuses unknown keys', () => {
    const t = recordedTokens(rec)
    expect(injectRecorded('<p>{{rec:batch.price}}</p>', t)).toBe('<p>0.011 ETH/TKN</p>')
    expect(() => injectRecorded('<p>{{rec:nope}}</p>', t)).toThrow('unknown recorded token')
  })
})
```

- [ ] **Step 6: Run them**
Run: `pnpm -C web test`
Expected: FAIL — the four new files fail to resolve their imports

- [ ] **Step 7: deployment.json schema and loader**
Write `web/src/chain/deployment.ts` with exactly this content:
```ts
/**
 * deployment.json: what the deploy script wrote about the local chain. The app
 * reads every address from it and never invents one.
 */

export type Address = `0x${string}`

export const LOCAL_CHAIN_ID = 31337

export const TRADER_LABELS = ['Maker 1', 'Maker 2', 'Maker 3', 'Victim', 'Attacker'] as const
export type TraderLabel = (typeof TRADER_LABELS)[number]

export interface Trader {
  label: TraderLabel
  address: Address
}

export interface Deployment {
  chainId: number
  rpcUrl: string
  deployer: Address
  traders: Trader[]
  addresses: { anyOrder: Address; testToken: Address; pool: Address }
  genesis: number
  batchSeconds: number
  maxOrders: number
  demoBatchSize: number
  minQuantity: string
  maxPrice: string
  deployBlock: number
  commit: string
  feVersion: string
  deployedAt: string
}

export class DeploymentError extends Error {
  override name = 'DeploymentError'
}

const isAddress = (v: unknown): v is Address => typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isDecimal = (v: unknown): v is string => typeof v === 'string' && /^[0-9]+$/.test(v)

function field<T>(obj: Record<string, unknown>, key: string, ok: (v: unknown) => v is T): T {
  const value = obj[key]
  if (!ok(value)) throw new DeploymentError(`deployment.json: "${key}" is missing or malformed`)
  return value
}

/** Validates the parsed JSON; throws DeploymentError naming the first bad field. */
export function parseDeployment(input: unknown): Deployment {
  if (typeof input !== 'object' || input === null) throw new DeploymentError('deployment.json: not an object')
  const obj = input as Record<string, unknown>
  const addresses = obj['addresses']
  if (typeof addresses !== 'object' || addresses === null) throw new DeploymentError('deployment.json: "addresses" is missing')
  const a = addresses as Record<string, unknown>
  const rawTraders = obj['traders']
  if (!Array.isArray(rawTraders) || rawTraders.length !== TRADER_LABELS.length) {
    throw new DeploymentError('deployment.json: "traders" must list the five built-in traders')
  }
  const traders: Trader[] = rawTraders.map((t: unknown, i: number) => {
    const row = (typeof t === 'object' && t !== null ? t : {}) as Record<string, unknown>
    const label = TRADER_LABELS[i]
    if (label === undefined || row['label'] !== label || !isAddress(row['address'])) {
      throw new DeploymentError(`deployment.json: trader ${i + 1} must be ${String(label)} with an address`)
    }
    return { label, address: row['address'] }
  })
  const chainId = field(obj, 'chainId', isCount)
  if (chainId !== LOCAL_CHAIN_ID) throw new DeploymentError(`deployment.json: chainId ${chainId} is not ${LOCAL_CHAIN_ID}`)
  return {
    chainId,
    rpcUrl: field(obj, 'rpcUrl', isText),
    deployer: field(obj, 'deployer', isAddress),
    traders,
    addresses: {
      anyOrder: field(a, 'anyOrder', isAddress),
      testToken: field(a, 'testToken', isAddress),
      pool: field(a, 'pool', isAddress),
    },
    genesis: field(obj, 'genesis', isCount),
    batchSeconds: field(obj, 'batchSeconds', isCount),
    maxOrders: field(obj, 'maxOrders', isCount),
    demoBatchSize: field(obj, 'demoBatchSize', isCount),
    minQuantity: field(obj, 'minQuantity', isDecimal),
    maxPrice: field(obj, 'maxPrice', isDecimal),
    deployBlock: field(obj, 'deployBlock', isCount),
    commit: field(obj, 'commit', isText),
    feVersion: field(obj, 'feVersion', isText),
    deployedAt: field(obj, 'deployedAt', isText),
  }
}

/** Fetches and validates deployment.json next to the page. */
export async function loadDeployment(url = '/deployment.json', fetcher: typeof fetch = fetch): Promise<Deployment> {
  const response = await fetcher(url, { cache: 'no-store' })
  if (!response.ok) throw new DeploymentError(`deployment.json: HTTP ${response.status}`)
  return parseDeployment(await response.json())
}
```

- [ ] **Step 8: The states every island renders**
Write `web/src/chain/state.ts` with exactly this content:
```ts
/**
 * The states every island renders, as plain data. Islands never show a value
 * they have not read: until a read succeeds they show the state's own text.
 */
import { LOCAL_CHAIN_ID } from './deployment'

export const POLL_MS = 2000

export type ChainState =
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: 'unreachable' | 'wrong-chain'; detail: string }
  | { kind: 'not-deployed'; address: string }
  | { kind: 'live'; block: bigint; blockTime: number; seenAt: number }

/** The recovery action each failure state offers. */
export const RECOVERY = {
  unreachable: 'Start the local chain: pnpm -C web local',
  'wrong-chain': 'Point the app at Anvil (chain id 31337): pnpm -C web local',
  'not-deployed': 'Deploy the contracts: pnpm -C web deploy:local',
} as const

export interface Probe {
  chainId?: number
  error?: string
  hasCode?: boolean
  address?: string
  block?: bigint
  blockTime?: number
}

/** Turns one probe of the RPC into the chain state. */
export function classify(probe: Probe, now: number): ChainState {
  if (probe.error !== undefined) return { kind: 'unavailable', reason: 'unreachable', detail: probe.error }
  if (probe.chainId !== LOCAL_CHAIN_ID) {
    return { kind: 'unavailable', reason: 'wrong-chain', detail: `chain id ${String(probe.chainId)}` }
  }
  if (probe.hasCode !== true) return { kind: 'not-deployed', address: probe.address ?? '' }
  if (probe.block === undefined || probe.blockTime === undefined) return { kind: 'loading' }
  return { kind: 'live', block: probe.block, blockTime: probe.blockTime, seenAt: now }
}

/** Live data is stale after three missed polls. */
export function isStale(state: ChainState, now: number, pollMs = POLL_MS): boolean {
  return state.kind === 'live' && now - state.seenAt > 3 * pollMs
}

export type BatchPhase = 'empty' | 'open' | 'closed' | 'cleared'

/** status: 0 open, 1 closed and waiting to be cleared, 2 cleared (AnyOrder's batchInfo). */
export function batchPhase(view: { status: number; order_count: bigint }): BatchPhase {
  if (view.status === 2) return 'cleared'
  if (view.status === 1) return 'closed'
  return view.order_count === 0n ? 'empty' : 'open'
}

/** Seconds until the batch's end by the chain's clock, never below zero. */
export function secondsLeft(end: bigint, chainNow: number): number {
  return Math.max(0, Number(end) - chainNow)
}
```

- [ ] **Step 9: Curve points from the contract's book (plotting, not clearing)**
Write `web/src/lib/curves.ts` with exactly this content:
```ts
/**
 * Supply and demand step curves for the chart, drawn from the batch's orders
 * as the contract returns them (orderAt). This plots the book; it does not
 * clear it. The price marker on the chart is always the contract's own
 * preview() or clearing result, never computed here.
 */

export interface BookOrder {
  is_buy: boolean
  limit: bigint
  quantity: bigint
}

export interface CurvePoint {
  price: bigint
  demand: bigint
  supply: bigint
}

/** One point per distinct limit price: buys at or above it, sells at or below it. */
export function curvePoints(orders: readonly BookOrder[]): CurvePoint[] {
  const prices = [...new Set(orders.map((o) => o.limit))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return prices.map((price) => ({
    price,
    demand: orders.filter((o) => o.is_buy && o.limit >= price).reduce((sum, o) => sum + o.quantity, 0n),
    supply: orders.filter((o) => !o.is_buy && o.limit <= price).reduce((sum, o) => sum + o.quantity, 0n),
  }))
}
```

- [ ] **Step 10: The recorded run as display tokens for build-time injection**
Write `web/src/lib/recorded.ts` with exactly this content:
```ts
/**
 * The recorded sandwich run (public/recorded/sandwich.json, written by
 * `pnpm -C web scenario` from a real run on a local Anvil chain) as display
 * strings. vite.config.ts injects them into the HTML at build time as
 * `{{rec:<key>}}` tokens, so both pages read correctly with scripts off. Every
 * value is labelled on the page as a recording.
 */
import { formatEth, formatPrice, formatTokens, formatWei } from './format'

export interface Recording {
  recordedAt: string
  commit: string
  feVersion: string
  result: {
    block: string
    pool: { victimTokensAlone: string; victimTokensSandwiched: string; attackerTokens: string; attackerEthBack: string; attackerProfitWei: string }
    batchAlone: { batch: string; price: string; victimTokens: string; victimPaidWei: string }
    batchSandwiched: { batch: string; price: string; victimTokens: string; victimPaidWei: string; attackerTokenChange: string; attackerWeiChange: string }
    oneSided: { batch: string; price: string; victimTokens: string; victimPaidWei: string; attackerTokens: string; attackerPaidWei: string }
  }
}

export function recordedTokens(rec: Recording): Record<string, string> {
  const r = rec.result
  const b = (v: string) => BigInt(v)
  return {
    recordedAt: rec.recordedAt.slice(0, 10),
    commit: rec.commit,
    feVersion: rec.feVersion,
    block: r.block,
    'pool.victimAlone': formatTokens(b(r.pool.victimTokensAlone), 4),
    'pool.victimSandwiched': formatTokens(b(r.pool.victimTokensSandwiched), 4),
    'pool.attackerTokens': formatTokens(b(r.pool.attackerTokens), 4),
    'pool.attackerProfit': formatEth(b(r.pool.attackerProfitWei), 6),
    'batch.price': formatPrice(b(r.batchSandwiched.price)),
    'batch.priceAlone': formatPrice(b(r.batchAlone.price)),
    'batch.victimTokens': formatTokens(b(r.batchSandwiched.victimTokens), 4),
    'batch.victimPaid': formatEth(b(r.batchSandwiched.victimPaidWei), 6),
    'batch.attackerTokens': `${r.batchSandwiched.attackerTokenChange} TKN`,
    'batch.attackerWei': formatWei(b(r.batchSandwiched.attackerWeiChange)),
    'oneSided.price': formatPrice(b(r.oneSided.price)),
    'oneSided.victimPaid': formatEth(b(r.oneSided.victimPaidWei), 6),
    'oneSided.attackerPaid': formatEth(b(r.oneSided.attackerPaidWei), 6),
    'oneSided.attackerTokens': formatTokens(b(r.oneSided.attackerTokens), 4),
  }
}

/** Replaces every `{{rec:<key>}}` token; an unknown key is an error, never a blank. */
export function injectRecorded(html: string, tokens: Record<string, string>): string {
  return html.replace(/\{\{rec:([A-Za-z.]+)\}\}/g, (_, key: string) => {
    const value = tokens[key]
    if (value === undefined) throw new Error(`unknown recorded token {{rec:${key}}}`)
    return value
  })
}
```

- [ ] **Step 11: All unit tests**
Run: `NO_COLOR=1 pnpm -C web test`
Expected: PASS — `23 passed (23)`

- [ ] **Step 12: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): deployment schema, chain states, curve points, recorded tokens`

---

### Task 3: Chain tooling: ABI module, viem clients, Anvil, deploy + seed, the one-command local run

**Files:**
- Create: `web/scripts/gen-abi.ts`
- Create: `web/src/chain/abi.ts`
- Create: `web/src/chain/client.ts`
- Create: `web/scripts/lib/proc.ts`
- Create: `web/scripts/lib/anvil.ts`
- Create: `web/scripts/lib/repo.ts`
- Create: `web/scripts/lib/deploy.ts`
- Create: `web/scripts/deploy-local.ts`
- Create: `web/scripts/local.ts`
- Test: `web/test/e2e/tooling.e2e.test.ts`
- Test: `web/test/e2e/lifecycle.e2e.test.ts`
- Modify: `.github/workflows/ci.yml`

**Depends on:** Task 2, Task core:10, Task core:2
**Effort:** high
**Provides:** `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`, `anyOrderAbi, testTokenAbi, poolAbi (web/src/chain/abi.ts, generated from abi/)`, `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)`, `pnpm -C web local (Anvil 8545 + fe build + deploy + seed + Vite)`
**Requires:** `parseDeployment(input: unknown): Deployment, loadDeployment(url?, fetcher?), type Deployment, TRADER_LABELS, LOCAL_CHAIN_ID (web/src/chain/deployment.ts)`, `abi/AnyOrder.abi.json, abi/TestToken.abi.json, abi/ConstantProductPool.abi.json (frozen) + bash scripts/check-abi.sh`, `deploy/params.json { maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice }`

- [ ] **Step 1: Context**
Upstream: `abi/AnyOrder.abi.json, abi/TestToken.abi.json, abi/ConstantProductPool.abi.json (frozen) + bash scripts/check-abi.sh` (core Task 10), `deploy/params.json { maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice }` (core Task 2), `parseDeployment(input: unknown): Deployment, loadDeployment(url?, fetcher?), type Deployment, TRADER_LABELS, LOCAL_CHAIN_ID (web/src/chain/deployment.ts)` (Task 2). The deploy allowlist is AnyOrder, TestToken, ConstantProductPool; AnyOrderTestClock, Trader and Reenterer are never deployed. Prerequisites: `fe`, `anvil`, `bash` on PATH.

- [ ] **Step 2: The ABI generator (from abi/, deployed contracts only)**
Write `web/scripts/gen-abi.ts` with exactly this content:
```ts
/**
 * Writes src/chain/abi.ts from the frozen ABI snapshots in abi/ (the deployed
 * contracts only), so viem gets `as const` types that match `fe build` exactly.
 *
 *   pnpm -C web gen:abi            write src/chain/abi.ts
 *   pnpm -C web gen:abi --check    exit 1 if src/chain/abi.ts is stale
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT, WEB_DIR } from './lib/repo'

const EXPORTS = [
  ['anyOrderAbi', 'AnyOrder'],
  ['testTokenAbi', 'TestToken'],
  ['poolAbi', 'ConstantProductPool'],
] as const

export function renderAbiModule(abiDir = join(REPO_ROOT, 'abi')): string {
  let text = '// GENERATED by web/scripts/gen-abi.ts from abi/*.abi.json. Do not edit:\n'
  text += '// run `pnpm -C web gen:abi` after a contract interface change.\n'
  for (const [name, contract] of EXPORTS) {
    const abi: unknown = JSON.parse(readFileSync(join(abiDir, `${contract}.abi.json`), 'utf8'))
    text += `\nexport const ${name} = ${JSON.stringify(abi, null, 2)} as const\n`
  }
  return text
}

const target = join(WEB_DIR, 'src', 'chain', 'abi.ts')
const text = renderAbiModule()
if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8').replace(/\r\n/g, '\n')
  if (current !== text) {
    console.error('src/chain/abi.ts is stale: run pnpm -C web gen:abi')
    process.exit(1)
  }
  console.log('abi.ts: up to date')
} else {
  writeFileSync(target, text)
  console.log('wrote src/chain/abi.ts')
}
```

- [ ] **Step 3: Repository paths and the deploy allowlist**
Write `web/scripts/lib/repo.ts` with exactly this content:
```ts
/** Repository paths, resolved from this file so the working directory never matters. */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runChecked } from './proc'

export const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const REPO_ROOT = resolve(WEB_DIR, '..')

/** The only contracts the local run deploys. Test harnesses never are. */
export const DEPLOYED = ['AnyOrder', 'TestToken', 'ConstantProductPool'] as const
export type Deployed = (typeof DEPLOYED)[number]

export interface Params {
  maxOrders: number
  demoBatchSize: number
  batchSeconds: number
  minQuantity: string
  maxPrice: string
}

export function readParams(root = REPO_ROOT): Params {
  return JSON.parse(readFileSync(join(root, 'deploy', 'params.json'), 'utf8')) as Params
}

export function bytecode(name: Deployed, outDir = join(REPO_ROOT, 'out')): `0x${string}` {
  return `0x${readFileSync(join(outDir, `${name}.bin`), 'utf8').trim()}`
}

/** Builds every contract with `fe build` into out/ at the repository root. */
export async function feBuild(root = REPO_ROOT): Promise<void> {
  await runChecked('fe', ['build', root, '--out-dir', join(root, 'out')])
}

export async function feVersion(): Promise<string> {
  return (await runChecked('fe', ['--version'])).trim()
}

export async function gitCommit(root = REPO_ROOT): Promise<string> {
  try {
    return (await runChecked('git', ['-C', root, 'rev-parse', '--short', 'HEAD'])).trim()
  } catch {
    return 'uncommitted'
  }
}
```

- [ ] **Step 4: Child processes with argument arrays**
Write `web/scripts/lib/proc.ts` with exactly this content:
```ts
/**
 * Child processes with argument arrays, never a shell string, so paths with
 * spaces (this repo lives under "VIBE CODE") pass through unchanged.
 */
import { type ChildProcess, spawn } from 'node:child_process'

export interface RunResult {
  code: number
  stdout: string
  stderr: string
}

export function run(command: string, args: readonly string[], options: { cwd?: string } = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { cwd: options.cwd, shell: false, windowsHide: true })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }))
  })
}

/** Runs a command and throws with its output if it fails. */
export async function runChecked(command: string, args: readonly string[], options: { cwd?: string } = {}): Promise<string> {
  const result = await run(command, args, options)
  if (result.code !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited ${result.code}\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout
}

export interface Running {
  child: ChildProcess
  stop(): Promise<void>
}

/** Starts a long-running process; `stop` ends it and waits for it to exit. */
export function start(command: string, args: readonly string[], options: { cwd?: string; inherit?: boolean } = {}): Running {
  const child = spawn(command, [...args], {
    cwd: options.cwd,
    shell: false,
    windowsHide: true,
    stdio: options.inherit === true ? 'inherit' : 'ignore',
  })
  return {
    child,
    stop: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null || child.killed) return resolve()
        child.once('exit', () => resolve())
        child.kill()
      }),
  }
}
```

- [ ] **Step 5: Generate the ABI module**
Run: `pnpm -C web gen:abi`
Expected: `wrote src/chain/abi.ts`

- [ ] **Step 6: viem clients for Anvil's unlocked dev accounts**
Write `web/src/chain/client.ts` with exactly this content:
```ts
/**
 * viem clients for the local Anvil chain, shared by the browser and the Node
 * tooling. Writes go out as eth_sendTransaction from Anvil's unlocked dev
 * accounts (a JSON-RPC account is just an address), so no private key,
 * mnemonic or signature exists anywhere in this code.
 */
import { createPublicClient, createTestClient, createWalletClient, http } from 'viem'
import { foundry } from 'viem/chains'
import { anyOrderAbi, poolAbi, testTokenAbi } from './abi'
import type { Address } from './deployment'

export function clientsFor(rpcUrl: string) {
  const transport = http(rpcUrl, { batch: true })
  return {
    public: createPublicClient({ chain: foundry, transport }),
    wallet: createWalletClient({ chain: foundry, transport }),
    test: createTestClient({ chain: foundry, mode: 'anvil', transport }),
  }
}

export type Clients = ReturnType<typeof clientsFor>

export const CLEAR_GAS_LIMIT = 16_777_216n

/** Sends one write and waits for it; throws on a reverted receipt. */
export async function send(
  clients: Clients,
  request: {
    from: Address
    address: Address
    abi: typeof anyOrderAbi | typeof testTokenAbi | typeof poolAbi
    functionName: string
    args?: readonly unknown[]
    value?: bigint
    gas?: bigint
  },
): Promise<{ hash: `0x${string}`; gasUsed: bigint; blockNumber: bigint }> {
  const hash = await clients.wallet.writeContract({
    account: request.from,
    address: request.address,
    abi: request.abi,
    functionName: request.functionName,
    args: request.args ?? [],
    ...(request.value === undefined ? {} : { value: request.value }),
    ...(request.gas === undefined ? {} : { gas: request.gas }),
  } as unknown as Parameters<Clients['wallet']['writeContract']>[0])
  const receipt = await clients.public.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error(`${request.functionName} reverted in ${hash}`)
  return { hash, gasUsed: receipt.gasUsed, blockNumber: receipt.blockNumber }
}
```

- [ ] **Step 7: Anvil: Osaka, per-transaction gas cap on**
Write `web/scripts/lib/anvil.ts` with exactly this content:
```ts
/** Starts a local Anvil chain: Osaka rules, its per-transaction gas cap on. */
import { type Running, start } from './proc'

export const ANVIL_ARGS = ['--hardfork', 'osaka', '--enable-tx-gas-limit', '--chain-id', '31337', '--silent'] as const

export async function rpcReady(rpcUrl: string): Promise<boolean> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    })
    const body = (await response.json()) as { result?: string }
    return body.result === '0x7a69'
  } catch {
    return false
  }
}

export interface Anvil {
  rpcUrl: string
  stop(): Promise<void>
}

export async function startAnvil(port: number): Promise<Anvil> {
  const rpcUrl = `http://127.0.0.1:${port}`
  if (await rpcReady(rpcUrl)) throw new Error(`port ${port} already serves a chain; stop it first`)
  const anvil: Running = start('anvil', [...ANVIL_ARGS, '--port', String(port)])
  for (let i = 0; i < 100; i++) {
    if (await rpcReady(rpcUrl)) return { rpcUrl, stop: anvil.stop }
    await new Promise((r) => setTimeout(r, 150))
  }
  await anvil.stop()
  throw new Error(`anvil did not start on port ${port}`)
}
```

- [ ] **Step 8: Write the failing end-to-end tests: tooling (incl. a path with spaces)**
Write `web/test/e2e/tooling.e2e.test.ts` with exactly this content:
```ts
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { renderAbiModule } from '../../scripts/gen-abi'
import { run } from '../../scripts/lib/proc'
import { REPO_ROOT, WEB_DIR } from '../../scripts/lib/repo'

const spaced = mkdtempSync(join(tmpdir(), 'anyorder path with spaces '))
afterAll(() => rmSync(spaced, { recursive: true, force: true }))

describe('tooling', () => {
  it('src/chain/abi.ts matches the frozen abi/ snapshots', () => {
    const current = readFileSync(join(WEB_DIR, 'src', 'chain', 'abi.ts'), 'utf8').replace(/\r\n/g, '\n')
    expect(current).toBe(renderAbiModule())
  })

  it('builds and checks the ABI from a folder whose path contains spaces', async () => {
    expect(spaced).toContain(' ')
    for (const entry of ['fe.toml', 'ingots', 'abi', 'scripts']) {
      cpSync(join(REPO_ROOT, entry), join(spaced, entry), { recursive: true })
    }
    const result = await run('bash', [join(spaced, 'scripts', 'check-abi.sh')])
    expect(result.stdout.trim().split('\n').pop()).toBe('ABI: OK')
    expect(renderAbiModule(join(spaced, 'abi'))).toBe(renderAbiModule())
  }, 300_000)
})
```

- [ ] **Step 9: Write the failing end-to-end tests: production lifecycle and a full batch under the cap**
Write `web/test/e2e/lifecycle.e2e.test.ts` with exactly this content:
```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anyOrderAbi, testTokenAbi } from '../../src/chain/abi'
import { CLEAR_GAS_LIMIT, clientsFor, send } from '../../src/chain/client'
import type { Deployment } from '../../src/chain/deployment'
import { type Anvil, startAnvil } from '../../scripts/lib/anvil'
import { advanceTo, demoOrder, deployAll, fundTraders } from '../../scripts/lib/deploy'
import { feBuild, readParams } from '../../scripts/lib/repo'

const T = 10n ** 18n
const MILLI = 10n ** 15n

let anvil: Anvil
let d: Deployment

beforeAll(async () => {
  anvil = await startAnvil(8551)
  await feBuild()
  d = await deployAll(anvil.rpcUrl, readParams())
  await fundTraders(d)
}, 300_000)

afterAll(async () => {
  await anvil?.stop()
})

describe('the production AnyOrder contract on Anvil', () => {
  it('runs a full lifecycle with real block time', async () => {
    const c = clientsFor(d.rpcUrl)
    const [maker, , , victim] = d.traders
    if (maker === undefined || victim === undefined) throw new Error('traders missing')
    const exchange = d.addresses.anyOrder
    const batch = (await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'currentBatch' })) as bigint
    await send(c, { from: maker.address, address: exchange, abi: anyOrderAbi, functionName: 'placeSell', args: [11n * MILLI, 10n * T] })
    await send(c, { from: victim.address, address: exchange, abi: anyOrderAbi, functionName: 'placeBuy', args: [12n * MILLI, 4n * T] })
    const info = (await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })) as {
      end: bigint
      status: number
    }
    expect(info.status).toBe(0)
    await advanceTo(c, info.end)
    await send(c, { from: d.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [batch] })
    const cleared = (await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })) as {
      status: number
      price: bigint
      volume: bigint
    }
    expect(cleared).toMatchObject({ status: 2, price: 11n * MILLI, volume: 4n * T })
    await send(c, { from: d.deployer, address: exchange, abi: anyOrderAbi, functionName: 'claim', args: [batch, 1n] })
    const before = (await c.public.readContract({ address: d.addresses.testToken, abi: testTokenAbi, functionName: 'balanceOf', args: [victim.address] })) as bigint
    await send(c, { from: victim.address, address: exchange, abi: anyOrderAbi, functionName: 'withdraw', args: [4n * T, 0n] })
    const after = (await c.public.readContract({ address: d.addresses.testToken, abi: testTokenAbi, functionName: 'balanceOf', args: [victim.address] })) as bigint
    expect(after - before).toBe(4n * T)
  }, 300_000)

  it('clears a full batch of maxOrders under the Osaka per-transaction gas cap', async () => {
    const c = clientsFor(d.rpcUrl)
    const exchange = d.addresses.anyOrder
    const now = (await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'currentBatch' })) as bigint
    const open = (await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [now] })) as { end: bigint }
    await advanceTo(c, open.end)
    const batch = now + 1n
    for (let i = 0; i < d.maxOrders; i++) {
      const o = demoOrder(i)
      const trader = d.traders[o.maker]
      if (trader === undefined) throw new Error('maker missing')
      await send(c, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: o.isBuy ? 'placeBuy' : 'placeSell', args: [o.limit, o.quantity] })
    }
    const full = (await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })) as {
      end: bigint
      order_count: bigint
    }
    expect(full.order_count).toBe(BigInt(d.maxOrders))
    await advanceTo(c, full.end)
    const receipt = await send(c, { from: d.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [batch], gas: CLEAR_GAS_LIMIT })
    expect(receipt.gasUsed).toBeLessThan(CLEAR_GAS_LIMIT)
    console.log(`clear() of ${d.maxOrders} orders: ${receipt.gasUsed} gas (cap ${CLEAR_GAS_LIMIT})`)
  }, 600_000)
})
```

- [ ] **Step 10: Run them**
Run: `pnpm -C web exec vitest run test/e2e/lifecycle.e2e.test.ts`
Expected: FAIL — `Failed to resolve import "../../scripts/lib/deploy"`

- [ ] **Step 11: Deploy, fund and seed**
Write `web/scripts/lib/deploy.ts` with exactly this content:
```ts
/**
 * Deploys AnyOrder, TestToken and the baseline pool to a local Anvil chain
 * from dev account 0, funds the five built-in traders (dev accounts 1-5) and
 * seeds a demo state: one cleared batch and an open batch of orders.
 */
import { parseEther } from 'viem'
import { anyOrderAbi, poolAbi, testTokenAbi } from '../../src/chain/abi'
import { type Clients, clientsFor, send } from '../../src/chain/client'
import { type Address, type Deployment, LOCAL_CHAIN_ID, TRADER_LABELS } from '../../src/chain/deployment'
import { type Params, bytecode, feVersion, gitCommit } from './repo'

const T = 10n ** 18n
const MILLI = 10n ** 15n
export const POOL_TOKENS = 400n * T
export const POOL_ETH = 4_400n * MILLI

async function deployContract(clients: Clients, from: Address, abi: unknown, code: `0x${string}`, args: readonly unknown[]): Promise<Address> {
  const hash = await clients.wallet.deployContract({
    account: from,
    abi,
    bytecode: code,
    args,
  } as unknown as Parameters<Clients['wallet']['deployContract']>[0])
  const receipt = await clients.public.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error(`deploy failed in ${hash}`)
  return receipt.contractAddress
}

export async function deployAll(rpcUrl: string, params: Params, outDir?: string): Promise<Deployment> {
  const clients = clientsFor(rpcUrl)
  const accounts: Address[] = await clients.wallet.getAddresses()
  const deployer = accounts[0]
  if (deployer === undefined || accounts.length < 6) throw new Error('Anvil must expose at least 6 dev accounts')
  const token = await deployContract(clients, deployer, testTokenAbi, bytecode('TestToken', outDir), [])
  const latest = await clients.public.getBlock({ blockTag: 'latest' })
  const genesis = Number(latest.timestamp)
  const anyOrder = await deployContract(clients, deployer, anyOrderAbi, bytecode('AnyOrder', outDir), [
    token,
    BigInt(genesis),
    BigInt(params.batchSeconds),
    BigInt(params.maxOrders),
    BigInt(params.minQuantity),
    BigInt(params.maxPrice),
  ])
  const pool = await deployContract(clients, deployer, poolAbi, bytecode('ConstantProductPool', outDir), [token])
  await send(clients, { from: deployer, address: token, abi: testTokenAbi, functionName: 'mint', args: [deployer, POOL_TOKENS] })
  await send(clients, { from: deployer, address: token, abi: testTokenAbi, functionName: 'approve', args: [pool, POOL_TOKENS] })
  await send(clients, { from: deployer, address: pool, abi: poolAbi, functionName: 'seed', args: [POOL_TOKENS], value: POOL_ETH })
  const block = await clients.public.getBlockNumber()
  return {
    chainId: LOCAL_CHAIN_ID,
    rpcUrl,
    deployer,
    traders: TRADER_LABELS.map((label, i) => ({ label, address: accounts[i + 1] as Address })),
    addresses: { anyOrder, testToken: token, pool },
    genesis,
    batchSeconds: params.batchSeconds,
    maxOrders: params.maxOrders,
    demoBatchSize: params.demoBatchSize,
    minQuantity: params.minQuantity,
    maxPrice: params.maxPrice,
    deployBlock: Number(block),
    commit: await gitCommit(),
    feVersion: await feVersion(),
    deployedAt: new Date().toISOString(),
  }
}

/** Gives each built-in trader 1,000 TKN and 100 ETH, half of each deposited into AnyOrder. */
export async function fundTraders(deployment: Deployment): Promise<void> {
  const clients = clientsFor(deployment.rpcUrl)
  const { anyOrder, testToken } = deployment.addresses
  for (const trader of deployment.traders) {
    await send(clients, { from: deployment.deployer, address: testToken, abi: testTokenAbi, functionName: 'mint', args: [trader.address, 1_000n * T] })
    await send(clients, { from: trader.address, address: testToken, abi: testTokenAbi, functionName: 'approve', args: [anyOrder, 1_000n * T] })
    await send(clients, { from: trader.address, address: anyOrder, abi: anyOrderAbi, functionName: 'depositToken', args: [500n * T] })
    await send(clients, { from: trader.address, address: anyOrder, abi: anyOrderAbi, functionName: 'depositEth', value: parseEther('50') })
  }
}

/** The i-th demo order: limits around 0.011 ETH/TKN, makers 1-3 alternating sides. */
export function demoOrder(i: number): { maker: number; isBuy: boolean; limit: bigint; quantity: bigint } {
  const isBuy = i % 2 === 0
  const step = BigInt(i % 5)
  const limit = isBuy ? 9n * MILLI + step * MILLI : 10n * MILLI + step * MILLI
  return { maker: i % 3, isBuy, limit, quantity: BigInt(1 + (i % 4)) * T }
}

export async function advanceTo(clients: Clients, timestamp: bigint): Promise<void> {
  await clients.test.setNextBlockTimestamp({ timestamp })
  await clients.test.mine({ blocks: 1 })
}

async function placeDemo(clients: Clients, deployment: Deployment, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const o = demoOrder(i)
    const trader = deployment.traders[o.maker]
    if (trader === undefined) throw new Error('missing maker')
    await send(clients, {
      from: trader.address,
      address: deployment.addresses.anyOrder,
      abi: anyOrderAbi,
      functionName: o.isBuy ? 'placeBuy' : 'placeSell',
      args: [o.limit, o.quantity],
    })
  }
}

/** One cleared batch, then an open batch holding `demoBatchSize` orders. */
export async function seedDemo(deployment: Deployment): Promise<{ clearedBatch: bigint; openBatch: bigint }> {
  const clients = clientsFor(deployment.rpcUrl)
  const exchange = deployment.addresses.anyOrder
  const first = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'currentBatch' })) as bigint
  await placeDemo(clients, deployment, Math.min(8, deployment.demoBatchSize))
  const info = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [first] })) as {
    end: bigint
  }
  await advanceTo(clients, info.end)
  await send(clients, { from: deployment.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [first] })
  await placeDemo(clients, deployment, deployment.demoBatchSize)
  return { clearedBatch: first, openBatch: first + 1n }
}
```

- [ ] **Step 12: Deploy to a running chain and write public/deployment.json**
Write `web/scripts/deploy-local.ts` with exactly this content:
```ts
/**
 * Builds the contracts and deploys them to an Anvil chain that is already
 * running on 127.0.0.1:8545, funds the built-in traders, seeds the demo state
 * and writes public/deployment.json.
 *
 *   pnpm -C web deploy:local
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { rpcReady } from './lib/anvil'
import { deployAll, fundTraders, seedDemo } from './lib/deploy'
import { WEB_DIR, feBuild, readParams } from './lib/repo'

export const LOCAL_RPC = 'http://127.0.0.1:8545'

export async function deployLocal(rpcUrl = LOCAL_RPC, outFile = join(WEB_DIR, 'public', 'deployment.json'), batchSeconds?: number) {
  if (!(await rpcReady(rpcUrl))) throw new Error(`no Anvil chain (31337) at ${rpcUrl}: start it with pnpm -C web local`)
  await feBuild()
  const params = readParams()
  const deployment = await deployAll(rpcUrl, batchSeconds === undefined ? params : { ...params, batchSeconds })
  await fundTraders(deployment)
  const seeded = await seedDemo(deployment)
  mkdirSync(join(outFile, '..'), { recursive: true })
  writeFileSync(outFile, `${JSON.stringify(deployment, null, 2)}\n`)
  return { deployment, seeded }
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('deploy-local.ts')) {
  deployLocal()
    .then(({ deployment, seeded }) => {
      console.log(`AnyOrder ${deployment.addresses.anyOrder} (batch ${seeded.openBatch} open, ${seeded.clearedBatch} cleared)`)
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
```

- [ ] **Step 13: The one-command local run**
Write `web/scripts/local.ts` with exactly this content:
```ts
/**
 * The one-command local run: starts Anvil (Osaka, per-transaction gas cap on)
 * on 127.0.0.1:8545, builds and deploys the contracts, seeds the demo state and
 * serves the app with Vite. Ctrl+C stops everything.
 *
 *   pnpm -C web local
 */
import { createRequire } from 'node:module'
import { startAnvil } from './lib/anvil'
import { start } from './lib/proc'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

const require = createRequire(import.meta.url)

async function main(): Promise<void> {
  const anvil = await startAnvil(8545)
  try {
    const { deployment, seeded } = await deployLocal(anvil.rpcUrl)
    console.log(`Anvil 31337 on ${anvil.rpcUrl}; AnyOrder ${deployment.addresses.anyOrder}; batch ${seeded.openBatch} open`)
    console.log('Built-in traders are Anvil dev accounts. Test funds, no real value.')
  } catch (error) {
    await anvil.stop()
    throw error
  }
  const vite = start(process.execPath, [require.resolve('vite/bin/vite.js'), '--host', '127.0.0.1'], { cwd: WEB_DIR, inherit: true })
  const stop = async () => {
    await vite.stop()
    await anvil.stop()
    process.exit(0)
  }
  process.on('SIGINT', () => void stop())
  process.on('SIGTERM', () => void stop())
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
```

- [ ] **Step 14: CI: the web job**
Write `.github/workflows/ci.yml` with exactly this content:
```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

env:
  # Any Fe release from 26.5.0 on is allowed for the contest; this build pins 26.6.0.
  FE_VERSION: v26.6.0

jobs:
  fe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install Fe
        run: |
          curl -fsSL https://raw.githubusercontent.com/argotorg/fe/master/feup/feup.sh | bash -s -- --version "$FE_VERSION" --no-modify-path
          echo "$HOME/.fe/bin" >> "$GITHUB_PATH"
      - run: fe --version
      # fe fmt does not walk a workspace root: check each member.
      - run: fe fmt --check ingots/clearing
      - run: fe fmt --check ingots/exchange
      - run: fe test
      - run: fe build
      - uses: actions/setup-python@v6
        with:
          python-version: "3.12"
      # The exact-rational reference: vectors are current, and the rule matches the oracle.
      - run: python ref/clearing_ref.py --check
      - run: python ref/clearing_ref.py --selftest
      # The deployed contracts' ABIs still match their frozen snapshots.
      - run: bash scripts/check-abi.sh

  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v5
        with:
          node-version: "22"
          cache: pnpm
          cache-dependency-path: web/pnpm-lock.yaml
      - run: pnpm -C web install --frozen-lockfile
      - run: pnpm -C web test
      - run: pnpm -C web gen:abi --check
      - run: pnpm -C web build
      # The taste-skill gate (pnpm -C web ui-gate) is a local Step-2 check: it needs the skill installed.
```

- [ ] **Step 15: ABI module current, strict types, tooling and lifecycle end-to-end on Anvil**
The lifecycle test prints the full batch's gas (the architect measured 3,156,298 for 100 orders against the 16,777,216 cap).
Run: `pnpm -C web gen:abi --check && pnpm -C web exec tsc --noEmit && NO_COLOR=1 pnpm -C web exec vitest run test/e2e/tooling.e2e.test.ts test/e2e/lifecycle.e2e.test.ts --no-file-parallelism`
Expected: PASS — `4 passed (4)`

- [ ] **Step 16: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): local Anvil tooling, deploy allowlist and one-command run`

---

### Task 4: The sandwich scenario on the deployed contracts, its recording, and the live-data hooks

**Files:**
- Create: `web/src/scenario/sandwich.ts`
- Create: `web/scripts/scenario.ts`
- Test: `web/test/e2e/scenario.e2e.test.ts`
- Create: `web/public/recorded/sandwich.json`
- Create: `web/src/app/live.ts`

**Depends on:** Task 3
**Effort:** high
**Provides:** `runSandwich(clients, deployment): Promise<SandwichResult> (web/src/scenario/sandwich.ts), recordScenario(deployment, outFile?) (web/scripts/scenario.ts)`, `web/public/recorded/sandwich.json (a real recorded run)`, `useDeployment, useClients, useChain, useBlockRead, readBatch, type OrderRow, type BatchSnapshot (web/src/app/live.ts)`
**Requires:** `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`, `anyOrderAbi, testTokenAbi, poolAbi (web/src/chain/abi.ts, generated from abi/)`, `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)`, `parseDeployment(input: unknown): Deployment, loadDeployment(url?, fetcher?), type Deployment, TRADER_LABELS, LOCAL_CHAIN_ID (web/src/chain/deployment.ts)`, `classify, isStale, batchPhase, secondsLeft, RECOVERY, POLL_MS, type ChainState (web/src/chain/state.ts)`

- [ ] **Step 1: Context**
Upstream: `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`, `anyOrderAbi, testTokenAbi, poolAbi (web/src/chain/abi.ts, generated from abi/)`, `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)` (Task 3), `parseDeployment(input: unknown): Deployment, loadDeployment(url?, fetcher?), type Deployment, TRADER_LABELS, LOCAL_CHAIN_ID (web/src/chain/deployment.ts)`, `classify, isStale, batchPhase, secondsLeft, RECOVERY, POLL_MS, type ChainState (web/src/chain/state.ts)` (Task 2). Every number comes from the chain (views, simulated calls, balance changes) and each variant runs inside an Anvil snapshot that is rolled back. The expected constants are the core spec section 6 table, also asserted by `fe test --filter sandwich`.

- [ ] **Step 2: Write the failing end-to-end test (it also writes the recording)**
Write `web/test/e2e/scenario.e2e.test.ts` with exactly this content:
```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anyOrderAbi } from '../../src/chain/abi'
import { clientsFor } from '../../src/chain/client'
import type { Deployment } from '../../src/chain/deployment'
import { type Anvil, startAnvil } from '../../scripts/lib/anvil'
import { deployAll, fundTraders, seedDemo } from '../../scripts/lib/deploy'
import { feBuild, readParams } from '../../scripts/lib/repo'
import { recordScenario } from '../../scripts/scenario'

let anvil: Anvil
let d: Deployment
let openBatch: bigint

beforeAll(async () => {
  anvil = await startAnvil(8552)
  await feBuild()
  d = await deployAll(anvil.rpcUrl, { ...readParams(), batchSeconds: 3600 })
  await fundTraders(d)
  openBatch = (await seedDemo(d)).openBatch
}, 300_000)

afterAll(async () => {
  await anvil?.stop()
})

describe('the sandwich scenario on the deployed contracts', () => {
  it('reproduces the fe test numbers, records them, and rolls the chain back', async () => {
    const c = clientsFor(d.rpcUrl)
    const before = await c.public.readContract({ address: d.addresses.anyOrder, abi: anyOrderAbi, functionName: 'batchInfo', args: [openBatch] })
    // Records public/recorded/sandwich.json from this run: the landing page shows it.
    const r = (await recordScenario(d)).result
    // The pool: the same constants as sandwich_cpmm_attacker_profits.
    expect(r.pool.attackerTokens).toBe('9756097560975609756')
    expect(r.pool.victimTokensAlone).toBe('14457831325301204819')
    expect(r.pool.victimTokensSandwiched).toBe('13773314203730272596')
    expect(r.pool.attackerProfitWei).toBe('8090638930163447')
    // The batch: the same as sandwich_batch_attacker_nets_dust.
    expect(r.batchAlone.price).toBe('11000000000000000')
    expect(r.batchSandwiched.price).toBe('11000000000000000')
    expect(r.batchSandwiched.victimTokens).toBe(r.batchAlone.victimTokens)
    expect(r.batchSandwiched.victimPaidWei).toBe('165000000000000000')
    expect(r.batchAlone.victimPaidWei).toBe('165000000000000000')
    expect(r.batchSandwiched.attackerTokenChange).toBe('0')
    expect(r.batchSandwiched.attackerWeiChange).toBe('-1')
    // Where the guarantee stops: sandwich_one_sided_moves_price.
    expect(r.oneSided.price).toBe('12000000000000000')
    expect(r.oneSided.victimPaidWei).toBe('180000000000000000')
    expect(r.oneSided.attackerPaidWei).toBe('120000000000000000')
    // Rolled back: the demo batch is exactly as it was.
    const after = await c.public.readContract({ address: d.addresses.anyOrder, abi: anyOrderAbi, functionName: 'batchInfo', args: [openBatch] })
    expect(after).toEqual(before)
  }, 600_000)
})
```

- [ ] **Step 3: Run it**
Run: `pnpm -C web exec vitest run test/e2e/scenario.e2e.test.ts`
Expected: FAIL — `Failed to resolve import "../../scripts/scenario"`

- [ ] **Step 4: The four scenarios, snapshot and rollback**
Write `web/src/scenario/sandwich.ts` with exactly this content:
```ts
/**
 * The sandwich contrast, run against the deployed contracts on a local Anvil
 * chain. Every number is read from the chain (contract views, simulated
 * calls of the real contracts, balance changes); none is computed here. Each
 * variant runs inside an Anvil snapshot and is rolled back afterwards, so the
 * chain returns to its demo state. Used by `pnpm scenario` (which records
 * public/recorded/sandwich.json) and by the app's "Run on your local chain".
 */
import { anyOrderAbi, poolAbi, testTokenAbi } from '../chain/abi'
import { type Clients, send } from '../chain/client'
import type { Address, Deployment } from '../chain/deployment'

const T = 10n ** 18n
const MILLI = 10n ** 15n
export const FRONT_RUN_ETH = 110n * MILLI
export const VICTIM_ETH = 165n * MILLI
export const VICTIM_QUANTITY = 15n * T
export const VICTIM_LIMIT = 12n * MILLI
export const ATTACKER_BUY_LIMIT = 26n * MILLI
export const ATTACKER_SELL_LIMIT = 1n * MILLI
export const ONE_SIDED_QUANTITY = 10n * T

export interface PoolOutcome {
  victimTokensAlone: string
  victimTokensSandwiched: string
  attackerTokens: string
  attackerEthBack: string
  attackerProfitWei: string
}

export interface BatchOutcome {
  batch: string
  price: string
  victimTokens: string
  victimPaidWei: string
}

export interface SandwichResult {
  block: string
  pool: PoolOutcome
  batchAlone: BatchOutcome
  batchSandwiched: BatchOutcome & { attackerTokenChange: string; attackerWeiChange: string }
  oneSided: BatchOutcome & { attackerTokens: string; attackerPaidWei: string }
}

interface Cast {
  maker1: Address
  maker2: Address
  maker3: Address
  victim: Address
  attacker: Address
  deployer: Address
}

function castOf(d: Deployment): Cast {
  const at = (i: number): Address => {
    const t = d.traders[i]
    if (t === undefined) throw new Error('deployment lists fewer than five traders')
    return t.address
  }
  return { maker1: at(0), maker2: at(1), maker3: at(2), victim: at(3), attacker: at(4), deployer: d.deployer }
}

async function withSnapshot<T>(clients: Clients, body: () => Promise<T>): Promise<T> {
  const id = await clients.test.snapshot()
  try {
    return await body()
  } finally {
    await clients.test.revert({ id })
  }
}

async function tokenBalance(clients: Clients, d: Deployment, who: Address): Promise<bigint> {
  return (await clients.public.readContract({ address: d.addresses.testToken, abi: testTokenAbi, functionName: 'balanceOf', args: [who] })) as bigint
}

async function poolBuy(clients: Clients, d: Deployment, who: Address, eth: bigint): Promise<bigint> {
  const before = await tokenBalance(clients, d, who)
  await send(clients, { from: who, address: d.addresses.pool, abi: poolAbi, functionName: 'buyTokens', args: [0n], value: eth })
  return (await tokenBalance(clients, d, who)) - before
}

async function poolOutcome(clients: Clients, d: Deployment, cast: Cast): Promise<PoolOutcome> {
  const alone = await withSnapshot(clients, () => poolBuy(clients, d, cast.victim, VICTIM_ETH))
  return withSnapshot(clients, async () => {
    const attackerTokens = await poolBuy(clients, d, cast.attacker, FRONT_RUN_ETH)
    const victimTokens = await poolBuy(clients, d, cast.victim, VICTIM_ETH)
    await send(clients, { from: cast.attacker, address: d.addresses.testToken, abi: testTokenAbi, functionName: 'approve', args: [d.addresses.pool, attackerTokens] })
    const { result } = await clients.public.simulateContract({
      account: cast.attacker,
      address: d.addresses.pool,
      abi: poolAbi,
      functionName: 'sellTokens',
      args: [attackerTokens, 0n],
    })
    const back = result as bigint
    await send(clients, { from: cast.attacker, address: d.addresses.pool, abi: poolAbi, functionName: 'sellTokens', args: [attackerTokens, 0n] })
    return {
      victimTokensAlone: alone.toString(),
      victimTokensSandwiched: victimTokens.toString(),
      attackerTokens: attackerTokens.toString(),
      attackerEthBack: back.toString(),
      attackerProfitWei: (back - FRONT_RUN_ETH).toString(),
    }
  })
}

type Leg = { who: Address; isBuy: boolean; limit: bigint; quantity: bigint }

function background(cast: Cast): Leg[] {
  return [
    { who: cast.maker1, isBuy: false, limit: 10n * MILLI, quantity: 10n * T },
    { who: cast.maker2, isBuy: false, limit: 11n * MILLI, quantity: 10n * T },
    { who: cast.maker3, isBuy: false, limit: 12n * MILLI, quantity: 10n * T },
    { who: cast.maker1, isBuy: false, limit: 13n * MILLI, quantity: 10n * T },
    { who: cast.maker3, isBuy: true, limit: 9n * MILLI, quantity: 5n * T },
  ]
}

async function balancesOf(clients: Clients, d: Deployment, who: Address): Promise<{ base: bigint; quote: bigint }> {
  return (await clients.public.readContract({ address: d.addresses.anyOrder, abi: anyOrderAbi, functionName: 'balances', args: [who] })) as {
    base: bigint
    quote: bigint
  }
}

/** Runs one batch from a fresh batch boundary: places `legs` in order, clears, claims every order. */
async function runBatch(clients: Clients, d: Deployment, cast: Cast, legs: Leg[]) {
  const exchange = d.addresses.anyOrder
  const now = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'currentBatch' })) as bigint
  const open = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [now] })) as { end: bigint }
  await clients.test.setNextBlockTimestamp({ timestamp: open.end })
  await clients.test.mine({ blocks: 1 })
  const batch = now + 1n
  const before = new Map<Address, { base: bigint; quote: bigint }>()
  for (const leg of legs) before.set(leg.who, await balancesOf(clients, d, leg.who))
  const indices: bigint[] = []
  for (const leg of legs) {
    await send(clients, { from: leg.who, address: exchange, abi: anyOrderAbi, functionName: leg.isBuy ? 'placeBuy' : 'placeSell', args: [leg.limit, leg.quantity] })
    indices.push(BigInt(indices.length))
  }
  const placed = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })) as { end: bigint }
  await clients.test.setNextBlockTimestamp({ timestamp: placed.end })
  await clients.test.mine({ blocks: 1 })
  await send(clients, { from: cast.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [batch] })
  for (const index of indices) {
    await send(clients, { from: cast.deployer, address: exchange, abi: anyOrderAbi, functionName: 'claim', args: [batch, index] })
  }
  const info = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })) as {
    price: bigint
  }
  const change = async (who: Address) => {
    const after = await balancesOf(clients, d, who)
    const start = before.get(who) ?? { base: 0n, quote: 0n }
    return { base: after.base - start.base, quote: after.quote - start.quote }
  }
  return { batch, price: info.price, change }
}

async function batchOutcome(clients: Clients, d: Deployment, cast: Cast, legs: Leg[]) {
  const r = await runBatch(clients, d, cast, legs)
  const victim = await r.change(cast.victim)
  const attacker = await r.change(cast.attacker)
  return {
    batch: r.batch.toString(),
    price: r.price.toString(),
    victimTokens: victim.base.toString(),
    victimPaidWei: (-victim.quote).toString(),
    attacker,
  }
}

export async function runSandwich(clients: Clients, d: Deployment): Promise<SandwichResult> {
  const cast = castOf(d)
  const block = await clients.public.getBlockNumber()
  return withSnapshot(clients, async () => {
    const pool = await poolOutcome(clients, d, cast)
    const attackerTokens = BigInt(pool.attackerTokens)
    const victim: Leg = { who: cast.victim, isBuy: true, limit: VICTIM_LIMIT, quantity: VICTIM_QUANTITY }
    const front: Leg = { who: cast.attacker, isBuy: true, limit: ATTACKER_BUY_LIMIT, quantity: attackerTokens }
    const back: Leg = { who: cast.attacker, isBuy: false, limit: ATTACKER_SELL_LIMIT, quantity: attackerTokens }
    const push: Leg = { who: cast.attacker, isBuy: true, limit: ATTACKER_BUY_LIMIT, quantity: ONE_SIDED_QUANTITY }
    const alone = await withSnapshot(clients, () => batchOutcome(clients, d, cast, [...background(cast), victim]))
    const sandwiched = await withSnapshot(clients, () => batchOutcome(clients, d, cast, [...background(cast), front, victim, back]))
    const oneSided = await withSnapshot(clients, () => batchOutcome(clients, d, cast, [...background(cast), push, victim]))
    const { attacker: _a, ...aloneRow } = alone
    const { attacker: s, ...sandwichedRow } = sandwiched
    const { attacker: o, ...oneSidedRow } = oneSided
    return {
      block: block.toString(),
      pool,
      batchAlone: aloneRow,
      batchSandwiched: { ...sandwichedRow, attackerTokenChange: s.base.toString(), attackerWeiChange: s.quote.toString() },
      oneSided: { ...oneSidedRow, attackerTokens: o.base.toString(), attackerPaidWei: (-o.quote).toString() },
    }
  })
}
```

- [ ] **Step 5: The recorder CLI (pnpm -C web scenario)**
Write `web/scripts/scenario.ts` with exactly this content:
```ts
/**
 * Records the sandwich contrast from a real run on the local chain into
 * public/recorded/sandwich.json, which the landing page shows labelled as a
 * recording. The chain must be running with the contracts deployed
 * (pnpm -C web local, in another terminal).
 *
 *   pnpm -C web scenario
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { clientsFor } from '../src/chain/client'
import { type Deployment, parseDeployment } from '../src/chain/deployment'
import { runSandwich } from '../src/scenario/sandwich'
import { WEB_DIR, feVersion, gitCommit } from './lib/repo'

export const RECORDING = join(WEB_DIR, 'public', 'recorded', 'sandwich.json')

export async function recordScenario(deployment: Deployment, outFile = RECORDING) {
  const result = await runSandwich(clientsFor(deployment.rpcUrl), deployment)
  const record = {
    recordedAt: new Date().toISOString(),
    commit: await gitCommit(),
    feVersion: await feVersion(),
    chainId: deployment.chainId,
    source: 'pnpm -C web scenario on a local Anvil chain (osaka, tx gas cap on)',
    result,
  }
  mkdirSync(join(outFile, '..'), { recursive: true })
  writeFileSync(outFile, `${JSON.stringify(record, null, 2)}\n`)
  return record
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('scenario.ts')) {
  const deployment = parseDeployment(JSON.parse(readFileSync(join(WEB_DIR, 'public', 'deployment.json'), 'utf8')))
  recordScenario(deployment)
    .then((r) => console.log(`recorded sandwich run at block ${r.result.block}`))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
```

- [ ] **Step 6: The hooks the islands read the chain with**
Write `web/src/app/live.ts` with exactly this content:
```ts
/**
 * React hooks that every island of /app uses to read the chain. Reads refresh
 * on every new block; nothing is shown until a read has succeeded, so a
 * screen never shows an unknown value as zero.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { anyOrderAbi } from '../chain/abi'
import { type Clients, clientsFor } from '../chain/client'
import { type Deployment, loadDeployment } from '../chain/deployment'
import { type ChainState, POLL_MS, classify, isStale } from '../chain/state'

export function useDeployment(): { deployment?: Deployment; error?: string } {
  const [state, setState] = useState<{ deployment?: Deployment; error?: string }>({})
  useEffect(() => {
    loadDeployment('/deployment.json')
      .then((deployment) => setState({ deployment }))
      .catch((e: unknown) => setState({ error: e instanceof Error ? e.message : String(e) }))
  }, [])
  return state
}

export function useClients(deployment: Deployment | undefined): Clients | undefined {
  return useMemo(() => (deployment ? clientsFor(deployment.rpcUrl) : undefined), [deployment])
}

/** Polls the RPC; `stale` turns on after three missed polls. */
export function useChain(deployment: Deployment | undefined, clients: Clients | undefined): { state: ChainState; stale: boolean } {
  const [state, setState] = useState<ChainState>({ kind: 'loading' })
  const [now, setNow] = useState(() => Date.now())
  const last = useRef<ChainState>(state)
  useEffect(() => {
    if (!deployment || !clients) return
    let stopped = false
    const probe = async () => {
      try {
        const [chainId, code, block] = await Promise.all([
          clients.public.getChainId(),
          clients.public.getCode({ address: deployment.addresses.anyOrder }),
          clients.public.getBlock({ blockTag: 'latest' }),
        ])
        const next = classify(
          { chainId, hasCode: code !== undefined && code !== '0x', address: deployment.addresses.anyOrder, block: block.number, blockTime: Number(block.timestamp) },
          Date.now(),
        )
        const prev = last.current
        // Keep the old seenAt while the block number has not moved, so staleness can show.
        const kept = prev.kind === 'live' && next.kind === 'live' && prev.block === next.block ? prev : next
        last.current = kept
        if (!stopped) setState(kept)
      } catch (e) {
        if (stopped) return
        const failed = classify({ error: e instanceof Error ? e.message : String(e) }, Date.now())
        last.current = failed
        setState(failed)
      }
      if (!stopped) setNow(Date.now())
    }
    void probe()
    const timer = setInterval(() => void probe(), POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [deployment, clients])
  return { state, stale: isStale(state, now) }
}

/** Re-reads `read` on every new block; `data` stays undefined until the first success. */
export function useBlockRead<T>(
  state: ChainState,
  read: (() => Promise<T>) | undefined,
  deps: readonly unknown[],
): { data?: T; error?: string } {
  const [result, setResult] = useState<{ data?: T; error?: string }>({})
  const block = state.kind === 'live' ? state.block : undefined
  useEffect(() => {
    if (block === undefined || !read) return
    let current = true
    read()
      .then((data) => current && setResult({ data }))
      .catch((e: unknown) => current && setResult((r) => ({ ...r, error: e instanceof Error ? e.message : String(e) })))
    return () => {
      current = false
    }
  }, [block, ...deps])
  return result
}

export interface OrderRow {
  index: bigint
  owner: `0x${string}`
  is_buy: boolean
  limit: bigint
  quantity: bigint
  owner_seq: bigint
  locked: bigint
  filled: bigint
  claimed: boolean
}

/** One batch as the contract reports it: its info, every order, and the contract's preview. */
export async function readBatch(clients: Clients, deployment: Deployment, batch: bigint) {
  const address = deployment.addresses.anyOrder
  const info = await clients.public.readContract({ address, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })
  const indices = Array.from({ length: Number(info.order_count) }, (_, i) => BigInt(i))
  const orders: OrderRow[] = await Promise.all(
    indices.map(async (index) => ({ index, ...(await clients.public.readContract({ address, abi: anyOrderAbi, functionName: 'orderAt', args: [batch, index] })) })),
  )
  const preview = await clients.public.readContract({ address, abi: anyOrderAbi, functionName: 'preview', args: [batch] })
  return { batch, info, orders, preview }
}

export type BatchSnapshot = Awaited<ReturnType<typeof readBatch>>
```

- [ ] **Step 7: Strict types and the scenario on Anvil (writes web/public/recorded/sandwich.json)**
Commit the recording this run wrote (`web/public/recorded/sandwich.json`); its numbers must equal the table, its `recordedAt` and `commit` change per run.
Run: `pnpm -C web exec tsc --noEmit && NO_COLOR=1 pnpm -C web exec vitest run test/e2e/scenario.e2e.test.ts`
Expected: PASS — `1 passed (1)`

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): sandwich scenario on the real contracts, recorded from Anvil`

---

### Task 5: UI: the /app page shell and the live batch hero (first gate run of /app)

**Files:**
- Create: `web/scripts/ui-gate.ts`
- Modify: `web/vite.config.ts`
- Modify: `web/app/index.html`
- Create: `web/src/app/main.tsx`
- Create: `web/src/app/shared.tsx`
- Create: `web/src/app/BatchHero.tsx`
- Create: `web/src/app/islands.tsx`
- Create: `web/public/assets/THIRD-PARTY-NOTICE.md`
- Create: `web/public/assets/system.css`
- Create: `web/public/assets/system.js`
- Create: `web/public/assets/ui/cards.css`
- Create: `web/public/assets/ui/base.css`
- Create: `web/public/assets/ui/ui.js`
- Create: `web/public/assets/motion/motion.css`
- Create: `web/public/assets/motion/motion.js`
- Create: `web/public/assets/backgrounds/backgrounds.css`
- Create: `web/public/assets/backgrounds/backgrounds.js`
- Create: `web/public/assets/layout/layout.css`
- Create: `web/public/assets/layout/layout.js`
- Create: `web/public/assets/icons/icon.css`
- Create: `web/public/assets/effects/fx.js`
- Create: `web/public/assets/effects/grain-gradient/effect.js`
- Create: `web/public/assets/moments/moments.js`
- Create: `web/public/assets/moments/lib.js`
- Create: `web/public/assets/moments/pinned-chapters/moment.css`
- Create: `web/public/assets/moments/pinned-chapters/moment.js`

**Depends on:** Task 4
**Effort:** high
**Model tier:** top
**Provides:** `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`, `useLive, ChainNotice, selectTrader, useSelectedTrader, errorName, TRADER_NOTE (web/src/app/shared.tsx); island registry islands (web/src/app/islands.tsx)`, `web/app/index.html: the /app page with sections #batch, #trade, #book, #settle, #sandwich and [data-island] mount points`
**Requires:** `useDeployment, useClients, useChain, useBlockRead, readBatch, type OrderRow, type BatchSnapshot (web/src/app/live.ts)`, `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)`, `classify, isStale, batchPhase, secondsLeft, RECOVERY, POLL_MS, type ChainState (web/src/chain/state.ts)`, `curvePoints(orders: readonly BookOrder[]): CurvePoint[] (web/src/lib/curves.ts)`, `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)`, `recordedTokens(rec: Recording), injectRecorded(html, tokens) (web/src/lib/recorded.ts)`, `web/public/recorded/sandwich.json (a real recorded run)`, `parseDeployment(input: unknown): Deployment, loadDeployment(url?, fetcher?), type Deployment, TRADER_LABELS, LOCAL_CHAIN_ID (web/src/chain/deployment.ts)`, `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`

- [ ] **Step 1: Read the skill first**
Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions. The kind is **software** (`<html lang="en" data-type="software" data-radius="sharp" data-buttons="tonal" data-ground="sage" data-motion>`, `<meta name="page-type" content="software">`, `<meta name="site-kind" content="software">`). Category for the gate and the copy: "a batch-auction exchange for Ethereum traders".

- [ ] **Step 2: Copy only the runtime files /app loads, unmodified (the skill itself is never copied)**
Run: `K="$HOME/.claude/skills/design-taste-frontend/assets"; for f in system.css system.js ui/cards.css ui/base.css ui/ui.js motion/motion.css motion/motion.js backgrounds/backgrounds.css backgrounds/backgrounds.js layout/layout.css layout/layout.js icons/icon.css effects/fx.js effects/grain-gradient/effect.js moments/moments.js moments/lib.js moments/pinned-chapters/moment.css moments/pinned-chapters/moment.js; do mkdir -p "web/public/assets/$(dirname "$f")" && cp "$K/$f" "web/public/assets/$f"; done && ls -R web/public/assets | head -n 40`
Expected: 18 files under `web/public/assets/` (system.css, system.js, ui/, motion/, backgrounds/, layout/, icons/, effects/fx.js, effects/grain-gradient/, moments/{moments,lib}.js, moments/pinned-chapters/)

- [ ] **Step 3: The upstream MIT notice for those files**
Write `web/public/assets/THIRD-PARTY-NOTICE.md` with exactly this content:
````markdown
# Third-party notice: design-taste-frontend runtime files

The files in this folder (except this notice) are copied unmodified from the
design-taste-frontend skill ("tasteskill"), https://github.com/Leonxlnx/taste-skill,
version 2.5.1 (upstream main at f6b76575f949707b4e3c37cd86cb44b0b98643e8, license verified MIT on
2026-11-17). Only the runtime files the built pages load are included; the skill itself
(SKILL.md, references/, scripts/, library/) is not part of this repository.

```
MIT License

Copyright (c) 2026 Leonxlnx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
````

- [ ] **Step 4: The single gate command of every UI task**
Write `web/scripts/ui-gate.ts` with exactly this content:
```ts
/**
 * The single gate command of every UI task:
 *
 *   pnpm -C web ui-gate landing     the landing page, dist/index.html
 *   pnpm -C web ui-gate app         the dApp, dist/app/index.html, against a seeded chain
 *
 * 1. Builds dist/ (tsc + vite build).
 * 2. app only: starts its own Anvil on 127.0.0.1:8546 (a dev chain on 8545 is
 *    never touched), builds and deploys the contracts, funds the traders,
 *    seeds the demo state with one-hour batches (so nothing changes during the
 *    check) and writes dist/deployment.json for the built app to read.
 * 3. Arms the design-taste-frontend finish gate for this page unless a build
 *    for this page is already open in web/.taste-skill/ (git-ignored).
 * 4. Runs the skill's gate.mjs on the built page, prints its output, stops
 *    Anvil, and exits with the gate's code. Its last line is the verdict:
 *    "GATE: PASS" is the only accepted result.
 *
 * The skill is never copied into the repo: gate.mjs runs from the skill's
 * install folder (~/.claude/skills/design-taste-frontend).
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { type Anvil, startAnvil } from './lib/anvil'
import { run, runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

const GATE = join(homedir(), '.claude', 'skills', 'design-taste-frontend', 'scripts', 'gate.mjs')
const CATEGORY = 'a batch-auction exchange for Ethereum traders'
const PAGES = {
  landing: { page: 'dist/index.html', primary: 'Open the app' },
  app: { page: 'dist/app/index.html', primary: 'Place an order' },
} as const
type PageName = keyof typeof PAGES

function openBuildPage(): string | null | undefined {
  const marker = join(WEB_DIR, '.taste-skill', 'build.json')
  if (!existsSync(marker)) return undefined
  try {
    const page = (JSON.parse(readFileSync(marker, 'utf8')) as { page?: string | null }).page
    return typeof page === 'string' ? page.replace(/\\/g, '/') : null
  } catch {
    return null
  }
}

async function main(): Promise<number> {
  const name = process.argv[2]
  if (name !== 'landing' && name !== 'app') {
    console.log('usage: pnpm -C web ui-gate landing|app')
    return 2
  }
  const target = PAGES[name as PageName]
  if (!existsSync(GATE)) {
    console.log(`GATE: SETUP (the design-taste-frontend skill is not installed at ${GATE})`)
    return 3
  }
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], { cwd: WEB_DIR })
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: WEB_DIR })

  let anvil: Anvil | undefined
  try {
    if (name === 'app') {
      anvil = await startAnvil(8546)
      await deployLocal(anvil.rpcUrl, join(WEB_DIR, 'dist', 'deployment.json'), 3600)
    }
    const open = openBuildPage()
    if (open !== target.page) {
      const arm = ['--start', target.page, '--root', 'dist', '--kind', 'software', '--category', CATEGORY, '--primary', target.primary]
      if (open !== undefined) arm.push('--new')
      await runChecked(process.execPath, [GATE, ...arm], { cwd: WEB_DIR })
    }
    const result = await run(process.execPath, [GATE, target.page, '--root', 'dist'], { cwd: WEB_DIR })
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    return result.code
  } finally {
    await anvil?.stop()
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.log(`GATE: ERROR (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    process.exit(2)
  })
```

- [ ] **Step 5: Vite: bake the recording into the HTML at build time**
Write `web/vite.config.ts` with exactly this content:
```ts
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { type Plugin, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { type Recording, injectRecorded, recordedTokens } from './src/lib/recorded'

const page = (path: string): string => fileURLToPath(new URL(path, import.meta.url))

// Bakes the recorded sandwich run into both pages at build time ({{rec:<key>}}
// tokens), so they read correctly with scripts off. No recording, no build:
// a page never shows a blank where a number belongs.
function recorded(): Plugin {
  const file = page('./public/recorded/sandwich.json')
  return {
    name: 'anyorder-recorded',
    transformIndexHtml(html) {
      if (!html.includes('{{rec:')) return html
      if (!existsSync(file)) throw new Error('public/recorded/sandwich.json is missing: run pnpm -C web scenario')
      return injectRecorded(html, recordedTokens(JSON.parse(readFileSync(file, 'utf8')) as Recording))
    },
  }
}

// Two static pages: the landing page at / and the dApp at /app. Vite's own
// bundles go to _app/ so they never mix with the design kit's files, which
// are served unmodified from public/assets/.
export default defineConfig({
  plugins: [react(), recorded()],
  build: {
    assetsDir: '_app',
    rollupOptions: {
      input: {
        landing: page('./index.html'),
        app: page('./app/index.html'),
      },
    },
  },
})
```

- [ ] **Step 6: Shared island pieces (store, live hook, notices)**
Write `web/src/app/shared.tsx` with exactly this content:
```tsx
/**
 * What every island shares: the selected trader (a tiny store, because each
 * island is its own React root), the live chain hooks, error decoding and the
 * notice shown for every state that is not live.
 */
import { useSyncExternalStore } from 'react'
import { BaseError, ContractFunctionRevertedError } from 'viem'
import type { Clients } from '../chain/client'
import type { Deployment } from '../chain/deployment'
import { type ChainState, RECOVERY } from '../chain/state'
import { formatAge } from '../lib/format'
import { useChain, useClients, useDeployment } from './live'

let selected = 0
const listeners = new Set<() => void>()

export function selectTrader(index: number): void {
  selected = index
  for (const listener of listeners) listener()
}

export function useSelectedTrader(): number {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => selected,
  )
}

export interface Live {
  deployment?: Deployment
  clients?: Clients
  chain: ChainState
  stale: boolean
  error?: string
}

export function useLive(): Live {
  const { deployment, error } = useDeployment()
  const clients = useClients(deployment)
  const { state, stale } = useChain(deployment, clients)
  return {
    ...(deployment ? { deployment } : {}),
    ...(clients ? { clients } : {}),
    chain: error ? { kind: 'unavailable', reason: 'unreachable', detail: error } : state,
    stale,
    ...(error ? { error } : {}),
  }
}

/** The contract's custom error name, or the first line of the message. */
export function errorName(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) return reverted.data?.errorName ?? reverted.shortMessage
    return error.shortMessage
  }
  return error instanceof Error ? (error.message.split('\n')[0] ?? 'failed') : String(error)
}

/** Shown in place of an island's data whenever the chain is not live. */
export function ChainNotice({ live }: { live: Live }) {
  const s = live.chain
  if (s.kind === 'live') {
    return live.stale ? <p className="chain-notice" data-state="stale">Data is {formatAge(Date.now() - s.seenAt)}: the chain stopped answering.</p> : null
  }
  if (s.kind === 'loading') return <p className="chain-notice" data-state="loading">Reading the chain…</p>
  const text = s.kind === 'not-deployed' ? RECOVERY['not-deployed'] : RECOVERY[s.reason]
  return (
    <div className="chain-notice" data-state={s.kind === 'not-deployed' ? 'not-deployed' : 'unavailable'} role="status">
      <p>{s.kind === 'not-deployed' ? 'The contracts are not deployed on this chain.' : `The local chain is unavailable (${s.detail}).`}</p>
      <p>
        <code>{text}</code>
      </p>
      <button type="button" className="btn" onClick={() => window.location.reload()}>
        Reconnect
      </button>
    </div>
  )
}

export const TRADER_NOTE = 'Anvil dev accounts. Test funds, no real value.'
```

- [ ] **Step 7: The #batch hero island**
Write `web/src/app/BatchHero.tsx` with exactly this content:
```tsx
/**
 * #batch: the live batch. The curves plot the contract's own book; the price
 * marker is the contract's preview(), the same pure clearing called read-only.
 */
import { anyOrderAbi } from '../chain/abi'
import { batchPhase, secondsLeft } from '../chain/state'
import { curvePoints } from '../lib/curves'
import { UNKNOWN, formatCountdown, formatPrice, formatTokens } from '../lib/format'
import { type BatchSnapshot, readBatch, useBlockRead } from './live'
import { ChainNotice, useLive } from './shared'

function Curves({ snap }: { snap: BatchSnapshot }) {
  const points = curvePoints(snap.orders)
  if (points.length === 0) return null
  const maxQ = points.reduce((m, p) => (p.demand > m ? p.demand : p.supply > m ? p.supply : m), 1n)
  const lo = points[0]?.price ?? 0n
  const hi = points[points.length - 1]?.price ?? 1n
  const x = (p: bigint) => (hi === lo ? 50 : Number(((p - lo) * 100n) / (hi - lo)))
  const y = (q: bigint) => 100 - Number((q * 100n) / maxQ)
  const line = (key: 'demand' | 'supply') => points.map((p) => `${x(p.price)},${y(p[key])}`).join(' ')
  return (
    <svg viewBox="-4 -4 108 108" role="img" aria-label="Supply and demand of this batch, read from the contract">
      <polyline points={line('demand')} fill="none" stroke="currentColor" strokeWidth="1.2" data-curve="demand" />
      <polyline points={line('supply')} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" data-curve="supply" />
      {snap.preview.traded ? <line x1={x(snap.preview.price)} x2={x(snap.preview.price)} y1="0" y2="100" stroke="currentColor" strokeWidth="0.6" data-marker="preview" /> : null}
    </svg>
  )
}

export function BatchHero() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const current = useBlockRead(
    chain,
    clients && deployment
      ? async () => {
          const batch = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' })
          return readBatch(clients, deployment, batch)
        }
      : undefined,
    [deployment?.addresses.anyOrder],
  )
  const snap = current.data
  if (chain.kind !== 'live' || !snap) return <ChainNotice live={live} />
  const phase = batchPhase(snap.info)
  return (
    <div className="batch-live" data-phase={phase}>
      <ChainNotice live={live} />
      <dl className="batch-facts">
        <div>
          <dt>Batch</dt>
          <dd>{snap.batch.toString()}</dd>
        </div>
        <div>
          <dt>Closes in</dt>
          <dd>{formatCountdown(secondsLeft(snap.info.end, chain.blockTime))}</dd>
        </div>
        <div>
          <dt>Orders</dt>
          <dd>{snap.info.order_count.toString()}</dd>
        </div>
        <div>
          <dt>Indicative price (contract preview)</dt>
          <dd>{snap.preview.traded ? formatPrice(snap.preview.price) : UNKNOWN}</dd>
        </div>
        <div>
          <dt>Volume at that price</dt>
          <dd>{snap.preview.traded ? formatTokens(snap.preview.volume) : UNKNOWN}</dd>
        </div>
      </dl>
      {phase === 'empty' ? <p className="batch-empty">No orders in batch {snap.batch.toString()} yet.</p> : <Curves snap={snap} />}
    </div>
  )
}
```

- [ ] **Step 8: The island registry (empty until Task 6)**
Write `web/src/app/islands.tsx` with exactly this content:
```tsx
/**
 * The island registry beyond the hero. Each UI task that adds an island adds
 * one line here (B6 trade, B7 book and settle, B8 sandwich, B10 wallet).
 */
import type { ReactNode } from 'react'

export const islands: Record<string, () => ReactNode> = {}
```

- [ ] **Step 9: Mount the islands**
Write `web/src/app/main.tsx` with exactly this content:
```tsx
/**
 * Mounts the islands of /app. The page is static HTML built to the design
 * skill's recipes; each island replaces only the content of its
 * `[data-island]` element, so the page reads correctly with scripts off.
 */
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BatchHero } from './BatchHero'
import { islands } from './islands'

const registry: Record<string, () => ReactNode> = { batch: () => <BatchHero />, ...islands }

for (const element of document.querySelectorAll<HTMLElement>('[data-island]')) {
  const render = registry[element.dataset['island'] ?? '']
  if (render) createRoot(element).render(render())
}
```

- [ ] **Step 10: Build web/app/index.html to the skill (the whole page, now)**
Start from the skill's `assets/starter.html` structure (head block, skip link, the `m-enter` head line, `header.nav` dealt **nav-centre**, `main` of sections, the dealt **close-type** close and **footer-statement** footer) with the pinned deal and the `:root` block from this plan's header. Asset links are root-absolute (`/assets/...`); the app script is `<script type="module" src="/src/app/main.tsx"></script>`; load `/assets/system.js`, `/assets/motion/motion.js`, `/assets/layout/layout.js` as the starter does.

Sections (each `main > section` with one `.wrap`, its h2 first, `--h: 1` except `#sandwich` `--h: 2`):
1. `#batch`: copy only the `<section class="hero ..." data-enter>` of `assets/layout/hero-triptych.html`. h1 names the category and the buyer (e.g. "A batch exchange where transaction order cannot change your fill"). The collage's sets are UI pieces of this product; the first set's main piece is `<div data-island="batch">` whose static content (shown with scripts off) is the recorded clearing price `{{rec:batch.price}}` labelled "Recorded on a local Anvil chain, {{rec:recordedAt}}, commit {{rec:commit}}". The large button is "Place an order" (`href="#trade"`). The hero ground carries the one effect, `data-fx="grain-gradient"`, mounted as `effects-usage.md` says.
2. `#trade`: h2 naming trading with the built-in traders; a static explanation including "Anvil dev accounts. Test funds, no real value."; `<div data-island="trade">` (Task 6 fills it; until then its static content explains the five traders).
3. `#book`: h2 naming the batch's order book; static text that clearing sorts by price and never reads arrival order; `<div data-island="book">`.
4. `#settle`: h2 naming clearing and claims; static text on uniform price, rationing at the marginal price and rounding dust (at most 1 wei per order, kept by the contract); `<div data-island="settle">`.
5. `#sandwich`: the dealt moment **pinned-chapters**, copied from `assets/moments/_demo/in-page-service.html`, three steps: the front-run, the victim, the back-run. Its frame shows the recorded contrast with tokens: pool victim `{{rec:pool.victimSandwiched}}` vs alone `{{rec:pool.victimAlone}}`, pool attacker profit `{{rec:pool.attackerProfit}}`; batch price `{{rec:batch.price}}` either way, victim `{{rec:batch.victimTokens}}` for `{{rec:batch.victimPaid}}`, attacker `{{rec:batch.attackerTokens}}` and `{{rec:batch.attackerWei}}`. Label: "Recorded on a local Anvil chain, {{rec:recordedAt}}, commit {{rec:commit}}". A panel "Where the guarantee stops": condition C in one sentence, and the one-sided case `{{rec:oneSided.price}}`, victim pays `{{rec:oneSided.victimPaid}}`, attacker pays `{{rec:oneSided.attackerPaid}}` at that price. Mount `<div data-island="sandwich">` inside the frame (Task 8 fills it).
6. The close and the footer: the commands `fe test --filter sandwich` and `fe test --filter permutation`, the repo link, and one credits line naming the design kit (MIT) and pointing at `/assets/THIRD-PARTY-NOTICE.md`.

Wording rules: claim only "transaction order cannot change your fill" and "both legs clear at your price" unconditionally; "the same fill as without the attacker" always with condition C; clearing "has no Ctx or caller effect; the only identity it reads is each order's recorded owner, for the final tie-breaks, at most 1 base unit per order" (never "cannot see who you are"). Unknown values render `—`, never 0.

- [ ] **Step 11: Run the skill's finish gate on the built page (this is the only acceptance)**
Fix every FAIL it lists and run it again (three rounds at most, counted by the gate). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it.
Run: `pnpm -C web ui-gate app`
Expected: PASS — `GATE: PASS`

- [ ] **Step 12: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): /app page shell with the live batch hero`

---

### Task 6: UI: the #trade island (built-in traders, balances, deposits, the order ticket)

**Files:**
- Create: `web/src/app/TradePanel.tsx`
- Modify: `web/src/app/islands.tsx`
- Modify: `web/app/index.html`

**Depends on:** Task 5
**Effort:** high
**Provides:** nothing other tasks name
**Requires:** `useLive, ChainNotice, selectTrader, useSelectedTrader, errorName, TRADER_NOTE (web/src/app/shared.tsx); island registry islands (web/src/app/islands.tsx)`, `useDeployment, useClients, useChain, useBlockRead, readBatch, type OrderRow, type BatchSnapshot (web/src/app/live.ts)`, `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`, `anyOrderAbi, testTokenAbi, poolAbi (web/src/chain/abi.ts, generated from abi/)`, `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)`, `web/app/index.html: the /app page with sections #batch, #trade, #book, #settle, #sandwich and [data-island] mount points`, `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`

- [ ] **Step 1: Read the skill first**
Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions. The kind is **software** (`<html lang="en" data-type="software" data-radius="sharp" data-buttons="tonal" data-ground="sage" data-motion>`, `<meta name="page-type" content="software">`, `<meta name="site-kind" content="software">`). Category for the gate and the copy: "a batch-auction exchange for Ethereum traders".

- [ ] **Step 2: The trade island**
Write `web/src/app/TradePanel.tsx` with exactly this content:
```tsx
/**
 * #trade: pick a built-in trader, see its free and locked balances on
 * AnyOrder, deposit, withdraw and place limit orders. The ticket is checked
 * against the contract's config() before sending; the contract checks again.
 * Every write is eth_sendTransaction from the trader's unlocked Anvil dev account.
 */
import { useState } from 'react'
import { parseEther, parseUnits } from 'viem'
import { anyOrderAbi, testTokenAbi } from '../chain/abi'
import { send } from '../chain/client'
import { formatEth, formatTokens } from '../lib/format'
import { readBatch, useBlockRead } from './live'
import { ChainNotice, TRADER_NOTE, errorName, selectTrader, useLive, useSelectedTrader } from './shared'

type Status = { kind: 'idle' } | { kind: 'pending'; what: string } | { kind: 'done'; what: string; hash: string } | { kind: 'failed'; what: string; reason: string }

export function TradePanel() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const index = useSelectedTrader()
  const trader = deployment?.traders[index]
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [limit, setLimit] = useState('0.011')
  const [quantity, setQuantity] = useState('1')
  const [amount, setAmount] = useState('1')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const balances = useBlockRead(
    chain,
    clients && deployment && trader
      ? () => clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'balances', args: [trader.address] })
      : undefined,
    [trader?.address],
  )
  const config = useBlockRead(
    chain,
    clients && deployment ? () => clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'config' }) : undefined,
    [deployment?.addresses.anyOrder],
  )
  // Locked = what the trader's unclaimed orders in the open and the previous batch hold.
  const locked = useBlockRead(
    chain,
    clients && deployment && trader
      ? async () => {
          const now = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' })
          const batches = now > 0n ? [now - 1n, now] : [now]
          let eth = 0n
          let tokens = 0n
          for (const b of batches) {
            const snap = await readBatch(clients, deployment, b)
            for (const o of snap.orders) {
              if (o.claimed || o.owner.toLowerCase() !== trader.address.toLowerCase()) continue
              if (o.is_buy) eth += o.locked
              else tokens += o.quantity
            }
          }
          return { eth, tokens }
        }
      : undefined,
    [trader?.address],
  )
  if (chain.kind !== 'live' || !deployment || !clients || !trader) return <ChainNotice live={live} />

  // The ticket, checked against config() before it is sent (the contract checks again).
  const ticketProblem = ((): string | undefined => {
    const c = config.data
    if (!c) return 'Reading the contract settings…'
    let l: bigint
    let q: bigint
    try {
      l = parseUnits(limit, 18)
      q = parseUnits(quantity, 18)
    } catch {
      return 'Enter the limit and the quantity as numbers.'
    }
    if (l <= 0n || l > c.max_price) return `The limit must be above 0 and at most ${formatEth(c.max_price)} per TKN.`
    if (q < c.min_quantity) return `The quantity must be at least ${formatTokens(c.min_quantity, 18)}.`
    return undefined
  })()

  const act = async (what: string, run: () => Promise<{ hash: string }>) => {
    setStatus({ kind: 'pending', what })
    try {
      const { hash } = await run()
      setStatus({ kind: 'done', what, hash })
    } catch (e) {
      setStatus({ kind: 'failed', what, reason: errorName(e) })
    }
  }
  const exchange = deployment.addresses.anyOrder
  const placeOrder = () =>
    act(`${side} ${quantity} TKN at ${limit} ETH`, () =>
      send(clients, {
        from: trader.address,
        address: exchange,
        abi: anyOrderAbi,
        functionName: side === 'buy' ? 'placeBuy' : 'placeSell',
        args: [parseUnits(limit, 18), parseUnits(quantity, 18)],
      }),
    )
  const depositEth = () => act(`deposit ${amount} ETH`, () => send(clients, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: 'depositEth', value: parseEther(amount) }))
  const depositTokens = () =>
    act(`deposit ${amount} TKN`, async () => {
      await send(clients, { from: trader.address, address: deployment.addresses.testToken, abi: testTokenAbi, functionName: 'approve', args: [exchange, parseUnits(amount, 18)] })
      return send(clients, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: 'depositToken', args: [parseUnits(amount, 18)] })
    })
  const withdrawAll = () =>
    act('withdraw everything free', () => {
      const b = balances.data
      if (!b) throw new Error('balances not read yet')
      return send(clients, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: 'withdraw', args: [b.base, b.quote] })
    })

  return (
    <div className="trade">
      <ChainNotice live={live} />
      <fieldset className="traders">
        <legend>Trader</legend>
        {deployment.traders.map((t, i) => (
          <button key={t.address} type="button" className="btn" aria-pressed={i === index} onClick={() => selectTrader(i)}>
            {t.label}
          </button>
        ))}
        <p className="note">{TRADER_NOTE}</p>
      </fieldset>
      <dl className="balances">
        <div>
          <dt>Free ETH on AnyOrder</dt>
          <dd>{formatEth(balances.data?.quote)}</dd>
        </div>
        <div>
          <dt>Free TKN on AnyOrder</dt>
          <dd>{formatTokens(balances.data?.base)}</dd>
        </div>
        <div>
          <dt>Locked in open orders (ETH)</dt>
          <dd>{formatEth(locked.data?.eth)}</dd>
        </div>
        <div>
          <dt>Locked in open orders (TKN)</dt>
          <dd>{formatTokens(locked.data?.tokens)}</dd>
        </div>
      </dl>
      <form
        className="ticket"
        onSubmit={(e) => {
          e.preventDefault()
          if (ticketProblem === undefined) void placeOrder()
        }}
      >
        <label>
          Side
          <select value={side} onChange={(e) => setSide(e.target.value === 'sell' ? 'sell' : 'buy')}>
            <option value="buy">Buy TKN</option>
            <option value="sell">Sell TKN</option>
          </select>
        </label>
        <label>
          Limit price (ETH per TKN)
          <input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </label>
        <label>
          Quantity (TKN)
          <input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={ticketProblem !== undefined}>
          Place the order
        </button>
        {ticketProblem ? <p className="field-note">{ticketProblem}</p> : null}
      </form>
      <div className="funds">
        <label>
          Amount
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <button type="button" className="btn" onClick={() => void depositEth()}>
          Deposit ETH
        </button>
        <button type="button" className="btn" onClick={() => void depositTokens()}>
          Deposit TKN
        </button>
        <button type="button" className="btn" onClick={() => void withdrawAll()}>
          Withdraw free balances
        </button>
      </div>
      <p className="tx-status" role="status" data-state={status.kind}>
        {status.kind === 'pending' && `Sending: ${status.what}…`}
        {status.kind === 'done' && `Confirmed: ${status.what} (${status.hash.slice(0, 10)}…)`}
        {status.kind === 'failed' && `Reverted: ${status.what}: ${status.reason}`}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Register it**
Write `web/src/app/islands.tsx` with exactly this content:
```tsx
/**
 * The island registry beyond the hero. Each UI task that adds an island adds
 * one line here (B6 trade, B7 book and settle, B8 sandwich, B10 wallet).
 */
import type { ReactNode } from 'react'
import { TradePanel } from './TradePanel'

export const islands: Record<string, () => ReactNode> = {
  trade: () => <TradePanel />,
}
```

- [ ] **Step 4: Fit it into #trade**
The island already reads `config()` and refuses a ticket outside `min_quantity`/`max_price` before sending, and shows free and locked balances (locked = the trader's unclaimed orders in the open and previous batch). Adjust `#trade` in `web/app/index.html` so the island's controls sit on the system's form recipe (`system.md`, Forms: labels you can see, 44px targets, one button style) at 1440, 820, 768 and 390. Keep the static fallback text for scripts off.

- [ ] **Step 5: Run the skill's finish gate on the built page (this is the only acceptance)**
Fix every FAIL it lists and run it again (three rounds at most, counted by the gate). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it.
Run: `pnpm -C web ui-gate app`
Expected: PASS — `GATE: PASS`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): trade island with built-in Anvil traders`

---

### Task 7: UI: the #book and #settle islands (the book, clearing, claims)

**Files:**
- Create: `web/src/app/BookAndSettle.tsx`
- Modify: `web/src/app/islands.tsx`
- Modify: `web/app/index.html`

**Depends on:** Task 6
**Effort:** high
**Provides:** nothing other tasks name
**Requires:** `useLive, ChainNotice, selectTrader, useSelectedTrader, errorName, TRADER_NOTE (web/src/app/shared.tsx); island registry islands (web/src/app/islands.tsx)`, `useDeployment, useClients, useChain, useBlockRead, readBatch, type OrderRow, type BatchSnapshot (web/src/app/live.ts)`, `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`, `anyOrderAbi, testTokenAbi, poolAbi (web/src/chain/abi.ts, generated from abi/)`, `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)`, `classify, isStale, batchPhase, secondsLeft, RECOVERY, POLL_MS, type ChainState (web/src/chain/state.ts)`, `web/app/index.html: the /app page with sections #batch, #trade, #book, #settle, #sandwich and [data-island] mount points`, `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`

- [ ] **Step 1: Read the skill first**
Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions. The kind is **software** (`<html lang="en" data-type="software" data-radius="sharp" data-buttons="tonal" data-ground="sage" data-motion>`, `<meta name="page-type" content="software">`, `<meta name="site-kind" content="software">`). Category for the gate and the copy: "a batch-auction exchange for Ethereum traders".

- [ ] **Step 2: The book and settle islands**
Write `web/src/app/BookAndSettle.tsx` with exactly this content:
```tsx
/**
 * #book: the current batch's orders as the contract stores them, sorted by
 * price (the arrival column is shown only to make the point that clearing
 * never reads it). #settle: clear a closed batch, read its result, claim.
 */
import { useState } from 'react'
import { anyOrderAbi } from '../chain/abi'
import { send } from '../chain/client'
import { batchPhase } from '../chain/state'
import { formatEth, formatPrice, formatTokens, shortAddress } from '../lib/format'
import { type OrderRow, readBatch, useBlockRead } from './live'
import { ChainNotice, TRADER_NOTE, errorName, useLive } from './shared'

function labelOf(owner: string, traders: { label: string; address: string }[]): string {
  return traders.find((t) => t.address.toLowerCase() === owner.toLowerCase())?.label ?? shortAddress(owner)
}

export function BookTable() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [arrival, setArrival] = useState(false)
  const snap = useBlockRead(
    chain,
    clients && deployment
      ? async () => readBatch(clients, deployment, await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' }))
      : undefined,
    [deployment?.addresses.anyOrder],
  ).data
  if (chain.kind !== 'live' || !deployment || !snap) return <ChainNotice live={live} />
  if (snap.orders.length === 0) return <p className="batch-empty">No orders in batch {snap.batch.toString()} yet.</p>
  const rows: OrderRow[] = arrival ? snap.orders : [...snap.orders].sort((a, b) => (a.limit < b.limit ? 1 : a.limit > b.limit ? -1 : 0))
  return (
    <div className="book">
      <label className="toggle">
        <input type="checkbox" checked={arrival} onChange={(e) => setArrival(e.target.checked)} /> Show arrival order (clearing never reads it)
      </label>
      <p className="note">{TRADER_NOTE}</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Arrival</th>
            <th scope="col">Trader</th>
            <th scope="col">Side</th>
            <th scope="col">Limit</th>
            <th scope="col">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.index.toString()}>
              <td>{o.index.toString()}</td>
              <td>{labelOf(o.owner, deployment.traders)}</td>
              <td>{o.is_buy ? 'Buy' : 'Sell'}</td>
              <td>{formatPrice(o.limit)}</td>
              <td>{formatTokens(o.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SettlePanel() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [status, setStatus] = useState('')
  const snap = useBlockRead(
    chain,
    clients && deployment
      ? async () => {
          const now = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' })
          const open = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'batchInfo', args: [now] })
          return { last: now > 0n ? await readBatch(clients, deployment, now - 1n) : undefined, openEnd: open.end }
        }
      : undefined,
    [deployment?.addresses.anyOrder],
  ).data
  if (chain.kind !== 'live' || !deployment || !clients || !snap) return <ChainNotice live={live} />
  const exchange = deployment.addresses.anyOrder
  const act = async (what: string, run: () => Promise<unknown>) => {
    setStatus(`Sending: ${what}…`)
    try {
      await run()
      setStatus(`Confirmed: ${what}`)
    } catch (e) {
      setStatus(`Reverted: ${what}: ${errorName(e)}`)
    }
  }
  const advance = () =>
    act('advance the dev chain to the end of the open batch', async () => {
      await clients.test.setNextBlockTimestamp({ timestamp: snap.openEnd })
      await clients.test.mine({ blocks: 1 })
    })
  const last = snap.last
  const phase = last ? batchPhase(last.info) : undefined
  return (
    <div className="settle">
      <button type="button" className="btn" onClick={() => void advance()}>
        Advance time to close the batch (dev chain control)
      </button>
      <p className="note">{TRADER_NOTE}</p>
      {!last ? <p className="batch-empty">No batch has closed yet.</p> : null}
      {last && phase === 'closed' ? (
        <button type="button" className="btn btn-primary" onClick={() => void act(`clear batch ${last.batch}`, () => send(clients, { from: deployment.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [last.batch] }))}>
          Clear batch {last.batch.toString()}
        </button>
      ) : null}
      {last && phase === 'cleared' ? (
        <div className="cleared">
          <p>
            Batch {last.batch.toString()} cleared {last.info.traded ? `at ${formatPrice(last.info.price)} for ${formatTokens(last.info.volume)}` : 'with no trade'}. Every fill below is
            the contract&apos;s; buyers&apos; costs round up and sellers&apos; proceeds round down, so at most 1 wei per order stays in the contract.
          </p>
          <table>
            <thead>
              <tr>
                <th scope="col">Trader</th>
                <th scope="col">Side</th>
                <th scope="col">Limit</th>
                <th scope="col">Filled</th>
                <th scope="col">Locked</th>
                <th scope="col">Claim</th>
              </tr>
            </thead>
            <tbody>
              {last.orders.map((o) => (
                <tr key={o.index.toString()}>
                  <td>{labelOf(o.owner, deployment.traders)}</td>
                  <td>{o.is_buy ? 'Buy' : 'Sell'}</td>
                  <td>{formatPrice(o.limit)}</td>
                  <td>{formatTokens(o.filled)}</td>
                  <td>{o.is_buy ? formatEth(o.locked) : formatTokens(o.quantity)}</td>
                  <td>
                    {o.claimed ? (
                      'Claimed'
                    ) : (
                      <button type="button" className="btn" onClick={() => void act(`claim order ${o.index}`, () => send(clients, { from: deployment.deployer, address: exchange, abi: anyOrderAbi, functionName: 'claim', args: [last.batch, o.index] }))}>
                        Claim
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="tx-status" role="status">
        {status}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Register them**
Write `web/src/app/islands.tsx` with exactly this content:
```tsx
/**
 * The island registry beyond the hero. Each UI task that adds an island adds
 * one line here (B6 trade, B7 book and settle, B8 sandwich, B10 wallet).
 */
import type { ReactNode } from 'react'
import { BookTable, SettlePanel } from './BookAndSettle'
import { TradePanel } from './TradePanel'

export const islands: Record<string, () => ReactNode> = {
  trade: () => <TradePanel />,
  book: () => <BookTable />,
  settle: () => <SettlePanel />,
}
```

- [ ] **Step 4: Fit them into #book and #settle**
Tables follow the system's table and card rules; the arrival-order toggle and the dev-chain control are labelled exactly as in the island code, and both sections keep the trader label 'Anvil dev accounts. Test funds, no real value.' (the islands print it; keep it in the static fallback text too). Each section stays one screen at 1440x900 (the seeded open batch holds `demoBatchSize` = 20 orders: scroll inside the table's frame if needed, never a second screen).

- [ ] **Step 5: Run the skill's finish gate on the built page (this is the only acceptance)**
Fix every FAIL it lists and run it again (three rounds at most, counted by the gate). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it.
Run: `pnpm -C web ui-gate app`
Expected: PASS — `GATE: PASS`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): order book, clearing and claim islands`

---

### Task 8: UI: the #sandwich island (recorded vs live run, where the guarantee stops)

**Files:**
- Create: `web/src/app/SandwichRunner.tsx`
- Modify: `web/src/app/islands.tsx`
- Modify: `web/app/index.html`

**Depends on:** Task 7
**Effort:** high
**Model tier:** top
**Provides:** nothing other tasks name
**Requires:** `useLive, ChainNotice, selectTrader, useSelectedTrader, errorName, TRADER_NOTE (web/src/app/shared.tsx); island registry islands (web/src/app/islands.tsx)`, `runSandwich(clients, deployment): Promise<SandwichResult> (web/src/scenario/sandwich.ts), recordScenario(deployment, outFile?) (web/scripts/scenario.ts)`, `web/public/recorded/sandwich.json (a real recorded run)`, `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)`, `web/app/index.html: the /app page with sections #batch, #trade, #book, #settle, #sandwich and [data-island] mount points`, `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`

- [ ] **Step 1: Read the skill first**
Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions. The kind is **software** (`<html lang="en" data-type="software" data-radius="sharp" data-buttons="tonal" data-ground="sage" data-motion>`, `<meta name="page-type" content="software">`, `<meta name="site-kind" content="software">`). Category for the gate and the copy: "a batch-auction exchange for Ethereum traders".

- [ ] **Step 2: The sandwich island**
Write `web/src/app/SandwichRunner.tsx` with exactly this content:
```tsx
/**
 * #sandwich: the contrast, from the recorded run (labelled) until the visitor
 * runs it live on their own chain. Live runs use the same scenario module as
 * the recorder and roll the chain back afterwards.
 */
import { useEffect, useState } from 'react'
import { type SandwichResult, runSandwich } from '../scenario/sandwich'
import { formatEth, formatPrice, formatTokens, formatWei } from '../lib/format'
import { ChainNotice, TRADER_NOTE, errorName, useLive } from './shared'

interface Recording {
  recordedAt: string
  commit: string
  result: SandwichResult
}

function Table({ r }: { r: SandwichResult }) {
  return (
    <table className="contrast">
      <thead>
        <tr>
          <th scope="col">Same three orders</th>
          <th scope="col">Constant-product pool (baseline)</th>
          <th scope="col">AnyOrder batch</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Victim gets</th>
          <td>
            {formatTokens(BigInt(r.pool.victimTokensSandwiched))} (alone: {formatTokens(BigInt(r.pool.victimTokensAlone))})
          </td>
          <td>
            {formatTokens(BigInt(r.batchSandwiched.victimTokens))} for {formatEth(BigInt(r.batchSandwiched.victimPaidWei))} (alone: the same)
          </td>
        </tr>
        <tr>
          <th scope="row">Clearing price</th>
          <td>moves with every trade</td>
          <td>
            {formatPrice(BigInt(r.batchSandwiched.price))} (alone: {formatPrice(BigInt(r.batchAlone.price))})
          </td>
        </tr>
        <tr>
          <th scope="row">Attacker nets</th>
          <td>{formatEth(BigInt(r.pool.attackerProfitWei), 18)} profit</td>
          <td>
            {r.batchSandwiched.attackerTokenChange} TKN and {formatWei(BigInt(r.batchSandwiched.attackerWeiChange))} (rounding, kept by the contract)
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function SandwichRunner() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [recording, setRecording] = useState<Recording | undefined>()
  const [mine, setMine] = useState<SandwichResult | undefined>()
  const [status, setStatus] = useState('')
  useEffect(() => {
    fetch('/recorded/sandwich.json')
      .then((r) => (r.ok ? (r.json() as Promise<Recording>) : undefined))
      .then(setRecording)
      .catch(() => setRecording(undefined))
  }, [])
  const shown = mine ?? recording?.result
  const run = async () => {
    if (!clients || !deployment) return
    setStatus('Running the four scenarios on your local chain…')
    try {
      setMine(await runSandwich(clients, deployment))
      setStatus('Done: every number above was read from your chain, which was then rolled back.')
    } catch (e) {
      setStatus(`The run failed: ${errorName(e)}`)
    }
  }
  return (
    <div className="sandwich">
      {shown ? (
        <>
          <p className="source">{mine ? 'Measured just now on your local chain.' : `Recorded on a local Anvil chain, ${recording?.recordedAt ?? ''}, commit ${recording?.commit ?? ''}.`}</p>
          <Table r={shown} />
          <p className="note">The victim, the attacker and the makers are {TRADER_NOTE.charAt(0).toLowerCase() + TRADER_NOTE.slice(1)}</p>
          <div className="limits">
            <p>
              Where the guarantee stops: the fill stays identical only when the attacker&apos;s buy and sell are the same size and priced outside every other order (condition C). A
              one-sided buy moves the price from {formatPrice(BigInt(shown.batchAlone.price))} to {formatPrice(BigInt(shown.oneSided.price))}; the victim then pays{' '}
              {formatEth(BigInt(shown.oneSided.victimPaidWei))} and the attacker pays {formatEth(BigInt(shown.oneSided.attackerPaidWei))} at that same price.
            </p>
          </div>
        </>
      ) : (
        <p className="batch-empty">No recorded run yet: run it on your local chain.</p>
      )}
      {chain.kind === 'live' ? (
        <button type="button" className="btn btn-primary" onClick={() => void run()}>
          Run the sandwich on your local chain
        </button>
      ) : (
        <ChainNotice live={live} />
      )}
      <p className="tx-status" role="status">
        {status}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Register it**
Write `web/src/app/islands.tsx` with exactly this content:
```tsx
/**
 * The island registry beyond the hero. Each UI task that adds an island adds
 * one line here (B6 trade, B7 book and settle, B8 sandwich, B10 wallet).
 */
import type { ReactNode } from 'react'
import { BookTable, SettlePanel } from './BookAndSettle'
import { SandwichRunner } from './SandwichRunner'
import { TradePanel } from './TradePanel'

export const islands: Record<string, () => ReactNode> = {
  trade: () => <TradePanel />,
  book: () => <BookTable />,
  settle: () => <SettlePanel />,
  sandwich: () => <SandwichRunner />,
}
```

- [ ] **Step 4: Fit it into the pinned-chapters frame**
The island lives inside the moment's frame of `#sandwich`; the moment's three steps (front-run, victim, back-run) keep the recorded numbers as static text; the button 'Run the sandwich on your local chain' runs the real scenario and the island labels its own numbers 'Measured just now on your local chain'. The victim, attacker and makers are named with the label 'Anvil dev accounts. Test funds, no real value.' (the island prints it; keep it in the static fallback text too). The moment's behaviour comes from the kit (`moments.md`); never mount it from your own script.

- [ ] **Step 5: Run the skill's finish gate on the built page (this is the only acceptance)**
Fix every FAIL it lists and run it again (three rounds at most, counted by the gate). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it.
Run: `pnpm -C web ui-gate app`
Expected: PASS — `GATE: PASS`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): sandwich contrast island with live run and its limits`

---

### Task 9: UI: the landing page at / (second gate run: its own build)

**Files:**
- Modify: `web/index.html`
- Create: `web/public/assets/effects/gradient-mesh/effect.js`
- Create: `web/public/assets/moments/word-highlight/moment.css`
- Create: `web/public/assets/moments/word-highlight/moment.js`

**Depends on:** Task 8
**Effort:** high
**Model tier:** top
**Provides:** nothing other tasks name
**Requires:** `web/public/recorded/sandwich.json (a real recorded run)`, `recordedTokens(rec: Recording), injectRecorded(html, tokens) (web/src/lib/recorded.ts)`, `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`, `web/app/index.html: the /app page with sections #batch, #trade, #book, #settle, #sandwich and [data-island] mount points`

- [ ] **Step 1: Read the skill first**
Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions. The kind is **software** (`<html lang="en" data-type="software" data-radius="sharp" data-buttons="tonal" data-ground="sage" data-motion>`, `<meta name="page-type" content="software">`, `<meta name="site-kind" content="software">`). Category for the gate and the copy: "a batch-auction exchange for Ethereum traders".

- [ ] **Step 2: Copy the landing page's own effect and moment, unmodified**
Run: `K="$HOME/.claude/skills/design-taste-frontend/assets"; for f in effects/gradient-mesh/effect.js moments/word-highlight/moment.css moments/word-highlight/moment.js; do mkdir -p "web/public/assets/$(dirname "$f")" && cp "$K/$f" "web/public/assets/$f"; done && ls -R web/public/assets | head -n 40`
Expected: `web/public/assets/effects/gradient-mesh/effect.js` and `web/public/assets/moments/word-highlight/{moment.css,moment.js}` present

- [ ] **Step 3: Build web/index.html to the skill**
Same head, `:root` block, nav (nav-centre), mark (arc), footer (footer-statement) as `/app`; close **close-word**; rhythm **surface-pairs**; no React (a static page; numbers are `{{rec:*}}` tokens baked at build time, labelled "Recorded on a local Anvil chain, {{rec:recordedAt}}, commit {{rec:commit}}").

Sections:
1. Hero: copy only the `<section class="hero ..." data-enter>` of `assets/layout/hero-collage.html`. The window is AnyOrder's batch view rendered as static product UI from the recording (price `{{rec:batch.price}}`, the victim's fill `{{rec:batch.victimTokens}}` for `{{rec:batch.victimPaid}}`); the small card shows the attacker's result `{{rec:batch.attackerTokens}}`, `{{rec:batch.attackerWei}}`. The hero ground carries `data-fx="gradient-mesh"`. Main action "Open the app" (`href="/app/"`); one hard fact on the first screen (e.g. the pool sandwich's recorded profit `{{rec:pool.attackerProfit}}` vs `{{rec:batch.attackerWei}}` in a batch).
2. How a batch clears: three steps (orders collect; one uniform price that maximises volume; fills and refunds), each naming the contract function (`placeBuy`/`placeSell`, `clear`, `claim`).
3. The sandwich contrast from the recording (pool vs batch), with condition C in one sentence and the one-sided limit (`{{rec:oneSided.price}}`).
4. The dealt **word-highlight** statement (from `assets/moments/_demo/in-page.html`): "Transaction order cannot change your fill."
5. The Fe highlight: the effect table (which handler holds `Call`) and the `select_price` signature `pub fn select_price(_ orders: MemVec<Order>) -> Clearing` as a code excerpt, with the wording rule on the owner tie-break.
6. The evidence: `fe test --filter sandwich`, `fe test --filter permutation`, `python ref/clearing_ref.py --check`, `pnpm -C web local`, each with what it proves.
7. Close (close-word) and footer, with the design kit's credits line.

- [ ] **Step 4: Run the skill's finish gate on the built page (this is the only acceptance)**
Fix every FAIL it lists and run it again (three rounds at most, counted by the gate). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it.
Run: `pnpm -C web ui-gate landing`
Expected: PASS — `GATE: PASS`

- [ ] **Step 5: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): landing page built from the recorded run`

---

### Task 10: UI polish (cut first): optional injected-wallet mode

**Files:**
- Create: `web/src/app/WalletPanel.tsx`
- Modify: `web/src/app/islands.tsx`
- Modify: `web/app/index.html`

**Depends on:** Task 9
**Effort:** medium
**Provides:** nothing other tasks name
**Requires:** `useLive, ChainNotice, selectTrader, useSelectedTrader, errorName, TRADER_NOTE (web/src/app/shared.tsx); island registry islands (web/src/app/islands.tsx)`, `useDeployment, useClients, useChain, useBlockRead, readBatch, type OrderRow, type BatchSnapshot (web/src/app/live.ts)`, `anyOrderAbi, testTokenAbi, poolAbi (web/src/chain/abi.ts, generated from abi/)`, `web/app/index.html: the /app page with sections #batch, #trade, #book, #settle, #sandwich and [data-island] mount points`, `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`, `formatEth, formatTokens, formatPrice, formatWei, formatUnits18, formatAge, formatCountdown, shortAddress, UNKNOWN (web/src/lib/format.ts)`, `parseDeployment(input: unknown): Deployment, loadDeployment(url?, fetcher?), type Deployment, TRADER_LABELS, LOCAL_CHAIN_ID (web/src/chain/deployment.ts)`

- [ ] **Step 1: Read the skill first**
Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions. The kind is **software** (`<html lang="en" data-type="software" data-radius="sharp" data-buttons="tonal" data-ground="sage" data-motion>`, `<meta name="page-type" content="software">`, `<meta name="site-kind" content="software">`). Category for the gate and the copy: "a batch-auction exchange for Ethereum traders". This task is the first to cut if the schedule slips.

- [ ] **Step 2: The wallet island: EIP-1193 only, chain 31337 only, never a key**
Write `web/src/app/WalletPanel.tsx` with exactly this content:
```tsx
/**
 * Optional: trade from an injected EIP-1193 wallet instead of a built-in
 * trader. The app never asks for a key; it only works when the wallet is on
 * the local Anvil chain (31337), e.g. with an Anvil dev account the visitor
 * imported into their own wallet.
 */
import { useState } from 'react'
import { type EIP1193Provider, createWalletClient, custom, parseUnits } from 'viem'
import { foundry } from 'viem/chains'
import { anyOrderAbi } from '../chain/abi'
import { LOCAL_CHAIN_ID } from '../chain/deployment'
import { shortAddress } from '../lib/format'
import { ChainNotice, errorName, useLive } from './shared'

declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}

export function WalletPanel() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [account, setAccount] = useState<`0x${string}` | undefined>()
  const [status, setStatus] = useState('')
  const [limit, setLimit] = useState('0.011')
  const [quantity, setQuantity] = useState('1')
  if (chain.kind !== 'live' || !deployment || !clients) return <ChainNotice live={live} />
  const provider = typeof window === 'undefined' ? undefined : window.ethereum
  if (!provider) return <p className="note">No browser wallet found. The built-in traders above need none.</p>
  const wallet = createWalletClient({ chain: foundry, transport: custom(provider) })
  const connect = async () => {
    try {
      const chainId = await wallet.getChainId()
      if (chainId !== LOCAL_CHAIN_ID) {
        setStatus(`Your wallet is on chain ${chainId}; switch it to the local Anvil chain (31337).`)
        return
      }
      const [first] = await wallet.requestAddresses()
      setAccount(first)
      setStatus('')
    } catch (e) {
      setStatus(errorName(e))
    }
  }
  const buy = async () => {
    if (!account) return
    setStatus('Waiting for your wallet…')
    try {
      const hash = await wallet.writeContract({ account, address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'placeBuy', args: [parseUnits(limit, 18), parseUnits(quantity, 18)] })
      await clients.public.waitForTransactionReceipt({ hash })
      setStatus(`Confirmed (${hash.slice(0, 10)}…)`)
    } catch (e) {
      setStatus(`Reverted: ${errorName(e)}`)
    }
  }
  return (
    <div className="wallet">
      {account ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void buy()
          }}
        >
          <p>Connected: {shortAddress(account)} on the local chain.</p>
          <label>
            Limit price (ETH per TKN)
            <input inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </label>
          <label>
            Quantity (TKN)
            <input inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <button type="submit" className="btn">
            Place a buy from my wallet
          </button>
        </form>
      ) : (
        <button type="button" className="btn" onClick={() => void connect()}>
          Connect a browser wallet
        </button>
      )}
      <p className="tx-status" role="status">
        {status}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Register it**
Write `web/src/app/islands.tsx` with exactly this content:
```tsx
/**
 * The island registry beyond the hero. Each UI task that adds an island adds
 * one line here (B6 trade, B7 book and settle, B8 sandwich, B10 wallet).
 */
import type { ReactNode } from 'react'
import { BookTable, SettlePanel } from './BookAndSettle'
import { SandwichRunner } from './SandwichRunner'
import { TradePanel } from './TradePanel'
import { WalletPanel } from './WalletPanel'

export const islands: Record<string, () => ReactNode> = {
  trade: () => <TradePanel />,
  book: () => <BookTable />,
  settle: () => <SettlePanel />,
  sandwich: () => <SandwichRunner />,
  wallet: () => <WalletPanel />,
}
```

- [ ] **Step 4: Place it**
Add `<div data-island="wallet">` inside `#trade`, below the built-in traders, with a static line that it is optional and works only with a wallet on the local Anvil chain (31337) holding an account the visitor imported themselves. No new section.

- [ ] **Step 5: Run the skill's finish gate on the built page (this is the only acceptance)**
Fix every FAIL it lists and run it again (three rounds at most, counted by the gate). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it.
Run: `pnpm -C web ui-gate app`
Expected: PASS — `GATE: PASS`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): optional injected-wallet mode on the local chain`

---

### Task 11: Staleness means the RPC stopped answering, not that no block arrived

**Files:**
- Modify: `web/src/chain/state.ts`
- Modify: `web/src/app/live.ts`
- Test: `web/src/chain/state.test.ts`
- Create: `web/scripts/lib/chrome.ts`
- Create: `web/scripts/idle-check.ts`

**Depends on:** Task 10, Task 13
**Effort:** medium
**Model tier:** top
**Provides:** `nextChainState(prev: ChainState, probe: Probe, now: number, pollMs?: number): ChainState (web/src/chain/state.ts)`, `findChrome(), launchChrome(width, height): Promise<Browser>, serveDir(root): Promise<{ url, close }> (web/scripts/lib/chrome.ts)`, `pnpm -C web exec tsx scripts/idle-check.ts -> last line IDLE: OK (30 s idle: live, no stale notice; RPC stopped: unavailable)`
**Requires:** `classify, isStale, batchPhase, secondsLeft, RECOVERY, POLL_MS, type ChainState (web/src/chain/state.ts)`, `useDeployment, useClients, useChain, useBlockRead, readBatch, type OrderRow, type BatchSnapshot (web/src/app/live.ts)`, `useLive, ChainNotice, selectTrader, useSelectedTrader, errorName, TRADER_NOTE (web/src/app/shared.tsx); island registry islands (web/src/app/islands.tsx)`, `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)`, `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`, `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`

- [ ] **Step 1: Read the skill first**
This is a UI task: its gate is the skill's finish gate on `/app`. Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions, before you change anything. This task changes **no markup, class name or copy**: only the data logic behind the chain notice, plus two Node scripts. If the gate reports a FAIL, fix it within these files, or return BLOCKED with the check id. Never edit a kit file, and never add a waiver for `kit-edited`.

- [ ] **Step 2: Context: the defect and the upstream code you build on**
The defect, found by the dapp:5 executor and confirmed by the orchestrator (tollgate Notes): `useChain` in `web/src/app/live.ts` kept the old `seenAt` while the block number did not change. Anvil mines only on transactions, so on an idle chain the live hero said "Data is N s ago: the chain stopped answering" after about 6 s, although the chain was answering. The dApp spec's state table had the same mistake ("stale: no new block for 3 polls"); the architect corrected it on 2026-11-19 to "no answered poll for 3 polls".

The rule after this task: staleness is measured from the last poll the RPC **answered**. An idle chain stays live. A poll that fails while live data is on screen keeps that data until it would be stale, so one dropped poll does not flash "unavailable". After that, and whenever nothing live is on screen, the failure shows at once with its recovery action, as before. The hook's clock also ticks on every poll, so an RPC that hangs (no answer, no error yet) shows the stale notice before its request times out. `UNKNOWN` / "—" handling is untouched: islands still show nothing they have not read.

Upstream code, exactly as it is in the repository (`classify, isStale, batchPhase, secondsLeft, RECOVERY, POLL_MS, type ChainState (web/src/chain/state.ts)`):
```ts
export const POLL_MS = 2000

export type ChainState =
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: 'unreachable' | 'wrong-chain'; detail: string }
  | { kind: 'not-deployed'; address: string }
  | { kind: 'live'; block: bigint; blockTime: number; seenAt: number }

export interface Probe {
  chainId?: number
  error?: string
  hasCode?: boolean
  address?: string
  block?: bigint
  blockTime?: number
}

/** Turns one probe of the RPC into the chain state. */
export function classify(probe: Probe, now: number): ChainState

/** Live data is stale after three missed polls. */
export function isStale(state: ChainState, now: number, pollMs = POLL_MS): boolean {
  return state.kind === 'live' && now - state.seenAt > 3 * pollMs
}
```
`useDeployment, useClients, useChain, useBlockRead, readBatch, type OrderRow, type BatchSnapshot (web/src/app/live.ts)`: `useChain(deployment, clients): { state: ChainState; stale: boolean }` is the function this task replaces; the others stay byte for byte. `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`: `live.ts` keeps importing `type Clients, clientsFor` from it.
`useLive, ChainNotice, selectTrader, useSelectedTrader, errorName, TRADER_NOTE (web/src/app/shared.tsx); island registry islands (web/src/app/islands.tsx)`: `ChainNotice` (unchanged) renders, for a live state, `live.stale ? <p className="chain-notice" data-state="stale">Data is {formatAge(Date.now() - s.seenAt)}: the chain stopped answering.</p> : null`, and for every state that is not live a `.chain-notice` with `data-state` `loading`, `unavailable` or `not-deployed`. The hero renders `<div className="batch-live">` inside `[data-island="batch"]` once it has live data.
`deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)`: the idle check uses `startAnvil(port): Promise<{ rpcUrl: string; stop(): Promise<void> }>` and `deployLocal(rpcUrl, outFile, batchSeconds)` (it runs `fe build`, deploys, funds the traders, seeds the demo state and writes `outFile`). Also used, from files no task lists as an interface: `runChecked(command: string, args: readonly string[], options?: { cwd?: string }): Promise<string>` (`web/scripts/lib/proc.ts`, argument arrays, never a shell) and `WEB_DIR: string` (`web/scripts/lib/repo.ts`). `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)` is the gate.

- [ ] **Step 3: Write the failing tests**
In `web/src/chain/state.test.ts`, replace the import line
```ts
import { RECOVERY, batchPhase, classify, isStale, secondsLeft } from './state'
```
with
```ts
import { type ChainState, RECOVERY, batchPhase, classify, isStale, nextChainState, secondsLeft } from './state'
```
and insert this block directly above the line `describe('batchPhase', () => {` (every existing test stays as it is):
```ts
describe('nextChainState', () => {
  const answer = (block: bigint) => ({ chainId: 31337, hasCode: true, address: '0xabc', block, blockTime: 100 })
  const down = { error: 'fetch failed' }

  it('keeps an idle chain live: a poll that answers with the same block is fresh data', () => {
    let s: ChainState = { kind: 'loading' }
    for (let t = 0; t <= 30_000; t += 2000) {
      s = nextChainState(s, answer(7n), t)
      expect(isStale(s, t + 1999)).toBe(false)
    }
    expect(s).toEqual({ kind: 'live', block: 7n, blockTime: 100, seenAt: 30_000 })
  })

  it('takes a new block', () => {
    const first = nextChainState({ kind: 'loading' }, answer(7n), 0)
    expect(nextChainState(first, answer(8n), 2000)).toEqual({ kind: 'live', block: 8n, blockTime: 100, seenAt: 2000 })
  })

  it('measures staleness from the last answered poll, so an RPC that stops answering goes stale', () => {
    const live = nextChainState({ kind: 'loading' }, answer(7n), 0)
    expect(isStale(nextChainState(live, down, 4000), 6000)).toBe(false)
    expect(isStale(nextChainState(live, down, 6000), 6001)).toBe(true)
  })

  it('rides out a dropped poll, then reports an unreachable RPC with its recovery action', () => {
    const live = nextChainState({ kind: 'loading' }, answer(7n), 0)
    expect(nextChainState(live, down, 2000)).toBe(live)
    expect(nextChainState(live, down, 6000)).toBe(live)
    expect(nextChainState(live, down, 8000)).toEqual({ kind: 'unavailable', reason: 'unreachable', detail: 'fetch failed' })
  })

  it('reports at once an RPC that never answered, a wrong chain and a missing contract', () => {
    expect(nextChainState({ kind: 'loading' }, down, 0)).toEqual({ kind: 'unavailable', reason: 'unreachable', detail: 'fetch failed' })
    const live = nextChainState({ kind: 'loading' }, answer(7n), 0)
    expect(nextChainState(live, { chainId: 1 }, 2000)).toMatchObject({ kind: 'unavailable', reason: 'wrong-chain' })
    expect(nextChainState(live, { chainId: 31337, hasCode: false, address: '0xabc' }, 2000)).toEqual({ kind: 'not-deployed', address: '0xabc' })
  })
})
```

- [ ] **Step 4: Run to confirm they fail**
Run: `NO_COLOR=1 pnpm -C web test`
Expected: FAIL: the five `nextChainState > ...` tests fail with `(0 , nextChainState) is not a function`; the 23 existing tests pass.

- [ ] **Step 5: `nextChainState` in state.ts**
In `web/src/chain/state.ts`, replace exactly this block
```ts
/** Live data is stale after three missed polls. */
export function isStale(state: ChainState, now: number, pollMs = POLL_MS): boolean {
  return state.kind === 'live' && now - state.seenAt > 3 * pollMs
}
```
with
```ts
/** Live data is stale after three polls without an answer: `seenAt` is the last poll the RPC answered. */
export function isStale(state: ChainState, now: number, pollMs = POLL_MS): boolean {
  return state.kind === 'live' && now - state.seenAt > 3 * pollMs
}

/**
 * The state after one poll. Staleness is measured from the last poll the RPC
 * answered, never from the last new block: Anvil mines only on transactions,
 * so an idle chain answers with the same block and is still live. A poll that
 * fails while live data is on screen keeps that data until it would be stale
 * (one dropped poll does not flash "unavailable"); after that, and whenever
 * nothing live is on screen, the failure shows at once with its recovery action.
 */
export function nextChainState(prev: ChainState, probe: Probe, now: number, pollMs = POLL_MS): ChainState {
  const next = classify(probe, now)
  const unreachable = next.kind === 'unavailable' && next.reason === 'unreachable'
  if (unreachable && prev.kind === 'live' && !isStale(prev, now, pollMs)) return prev
  return next
}
```
Measured by the architect: a `nextChainState` that keeps the old state while the block number is unchanged (the defect) fails exactly the first new test, on `expected true to be false`.

- [ ] **Step 6: `useChain` folds every poll through `nextChainState`**
In `web/src/app/live.ts`, replace the import line
```ts
import { type ChainState, POLL_MS, classify, isStale } from '../chain/state'
```
with
```ts
import { type ChainState, POLL_MS, type Probe, isStale, nextChainState } from '../chain/state'
```
and replace the whole `useChain` function, from its one-line doc comment (it starts `/** Polls the RPC;`) to the function's closing `}`, with exactly:
```ts
/**
 * Polls the RPC every POLL_MS. Every answered poll refreshes the data's age,
 * even with no new block (an idle Anvil mines nothing). `stale` turns on after
 * three polls without an answer: the clock ticks on every poll, so an RPC that
 * hangs shows as stale before its request times out.
 */
export function useChain(deployment: Deployment | undefined, clients: Clients | undefined): { state: ChainState; stale: boolean } {
  const [state, setState] = useState<ChainState>({ kind: 'loading' })
  const [now, setNow] = useState(() => Date.now())
  const last = useRef<ChainState>(state)
  useEffect(() => {
    if (!deployment || !clients) return
    let stopped = false
    const probe = async () => {
      let result: Probe
      try {
        const [chainId, code, block] = await Promise.all([
          clients.public.getChainId(),
          clients.public.getCode({ address: deployment.addresses.anyOrder }),
          clients.public.getBlock({ blockTag: 'latest' }),
        ])
        result = { chainId, hasCode: code !== undefined && code !== '0x', address: deployment.addresses.anyOrder, block: block.number, blockTime: Number(block.timestamp) }
      } catch (e) {
        result = { error: e instanceof Error ? e.message : String(e) }
      }
      if (stopped) return
      const at = Date.now()
      last.current = nextChainState(last.current, result, at)
      setState(last.current)
      setNow(at)
    }
    void probe()
    const timer = setInterval(() => {
      setNow(Date.now())
      void probe()
    }, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [deployment, clients])
  return { state, stale: isStale(state, now) }
}
```

- [ ] **Step 7: Run the unit tests and the type check**
Run: `pnpm -C web exec tsc --noEmit && NO_COLOR=1 pnpm -C web test`
Expected: no tsc output, then `Tests  28 passed (28)`

- [ ] **Step 8: The headless Chrome helper**
Write `web/scripts/lib/chrome.ts` with exactly this content (Task 12 reuses it):
```ts
/**
 * Headless Chrome for the repo's own browser checks, launched the way the
 * design skill's checker launches it: the same executable search (CHROME_PATH,
 * then Chrome, then Edge), the same flags (WebGL on the CPU), a temp profile of
 * its own, closed by its own PID. Driven over the DevTools protocol with
 * Node 22's built-in WebSocket. `serveDir` serves a built folder on 127.0.0.1,
 * because Chrome runs no module script from file://.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'

export function findChrome(): string | null {
  const env = process.env.CHROME_PATH
  if (env && existsSync(env)) return env
  const local = process.env.LOCALAPPDATA ?? ''
  const pf = process.env.PROGRAMFILES ?? 'C:\\Program Files'
  const pf86 = process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)'
  const list = [
    join(pf, 'Google/Chrome/Application/chrome.exe'),
    join(pf86, 'Google/Chrome/Application/chrome.exe'),
    join(local, 'Google/Chrome/Application/chrome.exe'),
    join(pf86, 'Microsoft/Edge/Application/msedge.exe'),
    join(pf, 'Microsoft/Edge/Application/msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]
  return list.find((c) => existsSync(c)) ?? null
}

const FLAGS = [
  '--headless=new',
  '--remote-debugging-port=0',
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  '--hide-scrollbars',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--disable-features=Translate,MediaRouter',
  '--force-color-profile=srgb',
  '--disable-gpu',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
]

export interface Page {
  send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>
  /** Evaluates an expression in the page (awaiting a returned promise) and returns its JSON value. */
  evaluate<T>(expression: string): Promise<T>
  /** Navigates and resolves once the load event has fired. */
  goto(url: string): Promise<void>
}

export interface Browser {
  page: Page
  close(): Promise<void>
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Starts headless Chrome with one page of `width` x `height` CSS pixels at device scale 1. */
export async function launchChrome(width: number, height: number): Promise<Browser> {
  const exe = findChrome()
  if (!exe) throw new Error('no Chrome, Edge or Chromium found; set CHROME_PATH')
  const profile = mkdtempSync(join(tmpdir(), 'anyorder-chrome-'))
  const child = spawn(exe, [...FLAGS, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], {
    shell: false,
    windowsHide: true,
    stdio: 'ignore',
  })
  const kill = () => {
    if (child.pid !== undefined && child.exitCode === null) {
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      else child.kill('SIGKILL')
    }
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    } catch {
      // Chrome's helpers can hold the profile a moment longer; the OS temp folder is cleaned later.
    }
  }
  try {
    const portFile = join(profile, 'DevToolsActivePort')
    for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(150)
    if (!existsSync(portFile)) throw new Error('Chrome did not open its DevTools port')
    const port = Number(readFileSync(portFile, 'utf8').split('\n')[0])
    const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[]
    const target = targets.find((t) => t.type === 'page')
    if (!target) throw new Error('Chrome opened no page')
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise<void>((ok, fail) => {
      ws.addEventListener('open', () => ok(), { once: true })
      ws.addEventListener('error', () => fail(new Error('DevTools socket failed')), { once: true })
    })
    let nextId = 0
    const pending = new Map<number, { ok: (v: unknown) => void; fail: (e: Error) => void }>()
    const events = new Map<string, (() => void)[]>()
    ws.addEventListener('close', () => {
      for (const call of pending.values()) call.fail(new Error('DevTools socket closed'))
      pending.clear()
    })
    ws.addEventListener('message', (message: MessageEvent) => {
      const data = JSON.parse(String(message.data)) as { id?: number; result?: unknown; error?: { message: string }; method?: string }
      if (data.id !== undefined) {
        const call = pending.get(data.id)
        pending.delete(data.id)
        if (data.error) call?.fail(new Error(data.error.message))
        else call?.ok(data.result)
      } else if (data.method !== undefined) {
        const waiting = events.get(data.method) ?? []
        events.delete(data.method)
        for (const w of waiting) w()
      }
    })
    const send = <T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> =>
      new Promise<T>((ok, fail) => {
        const id = ++nextId
        pending.set(id, { ok: ok as (v: unknown) => void, fail })
        ws.send(JSON.stringify({ id, method, params }))
      })
    const once = (method: string) => new Promise<void>((ok) => events.set(method, [...(events.get(method) ?? []), ok]))
    await send('Page.enable')
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    const page: Page = {
      send,
      async evaluate<T>(expression: string): Promise<T> {
        const r = await send<{ result: { value?: unknown }; exceptionDetails?: { text: string } }>('Runtime.evaluate', {
          expression,
          awaitPromise: true,
          returnByValue: true,
        })
        if (r.exceptionDetails) throw new Error(`page script failed: ${r.exceptionDetails.text}`)
        return r.result.value as T
      },
      async goto(url: string): Promise<void> {
        const loaded = once('Page.loadEventFired')
        await send('Page.navigate', { url })
        await loaded
      },
    }
    return {
      page,
      close: async () => {
        // Chrome may exit without answering Browser.close: wait at most 2 s, then kill it by its PID.
        await Promise.race([send('Browser.close').catch(() => undefined), sleep(2000)])
        ws.close()
        await sleep(300)
        kill()
      },
    }
  } catch (error) {
    kill()
    throw error
  }
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

/** Serves `root` read-only on 127.0.0.1 at a free port; a folder serves its index.html. */
export async function serveDir(root: string): Promise<{ url: string; close(): Promise<void> }> {
  const base = resolve(root)
  const server = createServer((req, res) => {
    let file = resolve(base, `.${decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname)}`)
    if (file !== base && !file.startsWith(base + sep)) {
      res.writeHead(403).end()
      return
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!existsSync(file)) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(readFileSync(file))
  })
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((ok) => {
        server.close(() => ok())
        server.closeAllConnections()
      }),
  }
}
```

- [ ] **Step 9: The idle-chain check**
Write `web/scripts/idle-check.ts` with exactly this content:
```ts
/**
 * dapp:11's check on a real idle chain. Builds dist/, deploys to its own Anvil
 * (127.0.0.1:8547, one-hour batches, so nothing is mined while it waits; a dev
 * chain on 8545 is never touched) and opens the built /app in headless Chrome.
 *
 *   1. The hero must show live data within 30 s.
 *   2. For 30 s no transaction is sent: the chain answers every poll with the
 *      same block. Sampled every second, no island may show any chain notice
 *      (stale, loading, unavailable, not deployed).
 *   3. Anvil is stopped: within 20 s the page must say the chain is unavailable.
 *
 *   pnpm -C web exec tsx scripts/idle-check.ts
 *   last line: IDLE: OK (30 s idle: live, no stale notice; RPC stopped: unavailable)
 */
import { join } from 'node:path'
import { startAnvil } from './lib/anvil'
import { launchChrome, serveDir } from './lib/chrome'
import { runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

const IDLE_SECONDS = 30
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

interface View {
  live: boolean
  notices: string[]
}

const READ = `(() => ({
  live: document.querySelector('[data-island="batch"] .batch-live') !== null,
  notices: [...document.querySelectorAll('.chain-notice')].map((n) => n.getAttribute('data-state') ?? '?'),
}))()`

async function main(): Promise<boolean> {
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], { cwd: WEB_DIR })
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: WEB_DIR })
  const anvil = await startAnvil(8547)
  let anvilUp = true
  const server = await serveDir(join(WEB_DIR, 'dist'))
  const browser = await launchChrome(1440, 900)
  try {
    await deployLocal(anvil.rpcUrl, join(WEB_DIR, 'dist', 'deployment.json'), 3600)
    const rpc = async (method: string): Promise<string> => {
      const r = await fetch(anvil.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [] }) })
      return ((await r.json()) as { result: string }).result
    }
    await browser.page.goto(`${server.url}/app/`)
    let view: View = { live: false, notices: [] }
    for (let i = 0; i < 60 && !(view.live && view.notices.length === 0); i++) {
      await sleep(500)
      view = await browser.page.evaluate<View>(READ)
    }
    if (!view.live) {
      console.log(`IDLE: FAIL (the hero never went live; notices: ${view.notices.join(', ') || 'none'})`)
      return false
    }
    const startBlock = await rpc('eth_blockNumber')
    console.log(`live at block ${Number(startBlock)}; idling ${IDLE_SECONDS} s`)
    for (let s = 1; s <= IDLE_SECONDS; s++) {
      await sleep(1000)
      view = await browser.page.evaluate<View>(READ)
      if (!view.live || view.notices.length > 0) {
        console.log(`IDLE: FAIL (after ${s} s idle: live=${String(view.live)}, notices: ${view.notices.join(', ') || 'none'})`)
        return false
      }
    }
    const endBlock = await rpc('eth_blockNumber')
    if (endBlock !== startBlock) {
      console.log(`IDLE: FAIL (the chain was not idle: block ${Number(startBlock)} -> ${Number(endBlock)})`)
      return false
    }
    console.log(`${IDLE_SECONDS} s idle at block ${Number(endBlock)}: live, no chain notice`)
    await anvil.stop()
    anvilUp = false
    for (let s = 1; s <= 20; s++) {
      await sleep(1000)
      view = await browser.page.evaluate<View>(READ)
      if (view.notices.includes('unavailable')) {
        console.log(`RPC stopped: unavailable after ${s} s`)
        console.log(`IDLE: OK (${IDLE_SECONDS} s idle: live, no stale notice; RPC stopped: unavailable)`)
        return true
      }
    }
    console.log(`IDLE: FAIL (20 s after the RPC stopped the page shows: ${view.notices.join(', ') || 'no notice'})`)
    return false
  } finally {
    await browser.close()
    await server.close()
    if (anvilUp) await anvil.stop()
  }
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error: unknown) => {
    console.log(`IDLE: ERROR (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    process.exit(2)
  })
```

- [ ] **Step 10: Verify against a real idle Anvil**
This is how the fix is proven on a real chain. The script builds `dist/`, starts its own Anvil on 8547 (one-hour batches, so nothing is mined), deploys and seeds, and opens the built `/app` in headless Chrome. It waits until the hero is live, then idles 30 s with no transaction, sampling every second: no island may show a chain notice, and the block number must not move. Then it stops Anvil, and within 20 s the page must show the `unavailable` notice. It takes about 1.5 minutes.
Run: `pnpm -C web exec tsx scripts/idle-check.ts`
Expected: `live at block 56; idling 30 s`, `30 s idle at block 56: live, no chain notice`, `RPC stopped: unavailable after 7 s` (the block and the seconds may differ by a little), and last `IDLE: OK (30 s idle: live, no stale notice; RPC stopped: unavailable)`. Measured by the architect on the unfixed code: `IDLE: FAIL (after 4 s idle: live=true, notices: stale, stale)`, exit code 1.

- [ ] **Step 11: Gate: types, unit tests, the idle check, then the skill's finish gate on /app**
The gate re-runs the idle check, so the orchestrator proves the fix on a real idle chain itself. Fix every FAIL the skill's gate lists and run it again (three rounds at most, counted by the gate). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it. Measured by the architect with this exact code: `GATE: PASS`, no waiver, and `fade-cut` PASS (the false stale notice had caused a `fade-cut` WARN).
Run: `pnpm -C web exec tsc --noEmit && NO_COLOR=1 pnpm -C web test && pnpm -C web exec tsx scripts/idle-check.ts && pnpm -C web ui-gate app`
Expected: PASS — `GATE: PASS`

- [ ] **Step 12: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `fix(dapp): staleness is measured from the last answered poll, not the last new block`

---

### Task 12: UI polish (cut first): link-preview image from the real landing page

**Files:**
- Create: `web/scripts/share-image.ts`
- Create: `web/public/share.jpg`
- Modify: `web/index.html`

**Depends on:** Task 11, Task docs:4
**Effort:** medium
**Model tier:** top
**Provides:** `web/public/share.jpg (1200x630 still of the built landing page) + pnpm -C web exec tsx scripts/share-image.ts [--check] -> last line SHARE: OK 1200x630 <bytes> bytes`
**Requires:** `findChrome(), launchChrome(width, height): Promise<Browser>, serveDir(root): Promise<{ url, close }> (web/scripts/lib/chrome.ts)`, `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)`

- [ ] **Step 1: Read the skill first**
Read `~/.claude/skills/design-taste-frontend/SKILL.md` in full, then the references named in this plan's conventions. The skill's `references/system.md` (Head) wants `og:image` to be a still of the page's own hero, and this task makes exactly that. **Do not change the page's visual design**: no markup in `<body>`, no CSS, no copy; the only change to `web/index.html` is the five meta lines below. Never edit a kit file, never add a waiver for `kit-edited`. This task is the first to cut if the schedule slips. It depends on docs:4 only so that it runs last.

- [ ] **Step 2: Context**
The landing page's `<head>` already has `og:type`, `og:title` (`AnyOrder: a batch-auction exchange for Ethereum traders`), `og:description` (`One clearing price per batch, computed by the contract, whatever order the transactions arrive in.`) and `twitter:card` = `summary_large_image`. They stay exactly as they are; only `og:image` is missing (the skill's `share-meta` check WARNs on it). Upstream helper, from Task 11 (`findChrome(), launchChrome(width, height): Promise<Browser>, serveDir(root): Promise<{ url, close }> (web/scripts/lib/chrome.ts)`):
```ts
export function findChrome(): string | null
export interface Page {
  send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>
  evaluate<T>(expression: string): Promise<T>
  goto(url: string): Promise<void>
}
export interface Browser { page: Page; close(): Promise<void> }
export async function launchChrome(width: number, height: number): Promise<Browser>
export async function serveDir(root: string): Promise<{ url: string; close(): Promise<void> }>
```
It finds Chrome the way the skill's checker does, starts it with the same headless flags, and drives it over the DevTools protocol, with child-process arguments passed as arrays (the repo path contains a space). Also used: `runChecked` from `web/scripts/lib/proc.ts` and `WEB_DIR` from `web/scripts/lib/repo.ts` (signatures in Task 11, Step 2). `pnpm -C web ui-gate app|landing (web/scripts/ui-gate.ts)` is the gate.

The domain is not known yet (the page's own `<!-- <link rel="canonical" ...> once a domain exists -->` comment says so), so `og:image` is the root-relative `/share.jpg`. Some link-preview crawlers need an absolute URL; it becomes `https://<domain>/share.jpg` when a domain exists, which is not this task.

- [ ] **Step 3: The capture script**
Write `web/scripts/share-image.ts` with exactly this content:
```ts
/**
 * dapp:12: the link-preview image is a still of the real built landing page.
 * Builds dist/, serves it on 127.0.0.1, opens / in headless Chrome launched the
 * way the design skill's gate launches it (scripts/lib/chrome.ts), lays the
 * page out at 1440 x 756 (the desktop width the gate judges, at 1200 x 630's
 * ratio), waits for the fonts and the hero's entrance, and captures the first
 * screen scaled to 1200 x 630 as JPEG into public/share.jpg, lowering the
 * quality in steps until the file is under 300 KB. Nothing is drawn or
 * generated: the pixels are the page's.
 *
 *   pnpm -C web exec tsx scripts/share-image.ts           capture, then check
 *   pnpm -C web exec tsx scripts/share-image.ts --check   check the committed image and meta only
 *   last line: SHARE: OK 1200x630 <bytes> bytes
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { launchChrome, serveDir } from './lib/chrome'
import { runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'

const OUT = join(WEB_DIR, 'public', 'share.jpg')
const MAX_BYTES = 300 * 1024
const WIDTH = 1200
const HEIGHT = 630
const LAYOUT_WIDTH = 1440
const LAYOUT_HEIGHT = 756
const SETTLE_MS = 4000

/** Width and height from a JPEG's start-of-frame segment, or null when the bytes are not a JPEG. */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null
    const marker = buf[i + 1] ?? 0
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2
      continue
    }
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}

const META = [
  '<meta property="og:title" content="',
  '<meta property="og:description" content="',
  '<meta property="og:image" content="/share.jpg">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:image" content="/share.jpg">',
]

function check(): boolean {
  if (!existsSync(OUT)) {
    console.log('SHARE: FAIL (web/public/share.jpg is missing)')
    return false
  }
  const buf = readFileSync(OUT)
  const size = jpegSize(buf)
  if (!size || size.width !== WIDTH || size.height !== HEIGHT) {
    console.log(`SHARE: FAIL (share.jpg is ${size ? `${size.width}x${size.height}` : 'not a JPEG'}, want ${WIDTH}x${HEIGHT})`)
    return false
  }
  if (buf.length >= MAX_BYTES) {
    console.log(`SHARE: FAIL (share.jpg is ${buf.length} bytes, want under ${MAX_BYTES})`)
    return false
  }
  const html = readFileSync(join(WEB_DIR, 'index.html'), 'utf8')
  const missing = META.filter((m) => !html.includes(m))
  if (missing.length > 0) {
    console.log(`SHARE: FAIL (web/index.html lacks ${missing.join(' ')})`)
    return false
  }
  console.log(`SHARE: OK ${size.width}x${size.height} ${buf.length} bytes`)
  return true
}

async function capture(): Promise<void> {
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], { cwd: WEB_DIR })
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: WEB_DIR })
  const server = await serveDir(join(WEB_DIR, 'dist'))
  const browser = await launchChrome(LAYOUT_WIDTH, LAYOUT_HEIGHT)
  try {
    await browser.page.goto(`${server.url}/`)
    await browser.page.evaluate('document.fonts.ready.then(() => true)')
    await new Promise((r) => setTimeout(r, SETTLE_MS))
    const clip = { x: 0, y: 0, width: LAYOUT_WIDTH, height: LAYOUT_HEIGHT, scale: WIDTH / LAYOUT_WIDTH }
    for (const quality of [86, 80, 74, 68, 62, 56, 50]) {
      const shot = await browser.page.send<{ data: string }>('Page.captureScreenshot', { format: 'jpeg', quality, clip })
      const buf = Buffer.from(shot.data, 'base64')
      if (buf.length < MAX_BYTES) {
        writeFileSync(OUT, buf)
        console.log(`captured / at ${LAYOUT_WIDTH}x${LAYOUT_HEIGHT}, quality ${quality}`)
        return
      }
    }
    throw new Error('no quality down to 50 brought share.jpg under 300 KB')
  } finally {
    await browser.close()
    await server.close()
  }
}

async function main(): Promise<boolean> {
  if (!process.argv.includes('--check')) await capture()
  return check()
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error: unknown) => {
    console.log(`SHARE: ERROR (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    process.exit(2)
  })
```

- [ ] **Step 4: Confirm the check fails before the image exists**
Run: `pnpm -C web exec tsx scripts/share-image.ts --check`
Expected: FAIL: `SHARE: FAIL (web/public/share.jpg is missing)`

- [ ] **Step 5: Capture the image from the real built page**
Run: `pnpm -C web exec tsx scripts/share-image.ts`
Expected: `captured / at 1440x756, quality 86`, then `SHARE: FAIL (web/index.html lacks ...)`, because the meta lines come in Step 6. Then open `web/public/share.jpg` with your Read tool and look at it. It must show the landing hero as a visitor sees it: the nav (AnyOrder, Clearing, Sandwich, Fe, Evidence, Open the app), the headline "A one-price batch exchange for Ethereum traders", the lead, the button and the recorded-run panel, with nothing blank or half faded in. If the hero's entrance had not finished, run the capture again. Measured by the architect: 84112 bytes at quality 86.

- [ ] **Step 6: The meta lines**
In `web/index.html`, directly after the line `<meta name="twitter:card" content="summary_large_image">`, insert exactly:
```html
<meta property="og:image" content="/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The AnyOrder landing page: a one-price batch exchange for Ethereum traders, beside a recorded cleared batch.">
<meta name="twitter:image" content="/share.jpg">
```

- [ ] **Step 7: Gate: the committed image and meta, then the skill's finish gate on /**
`--check` verifies the committed file and never recaptures (a capture's bytes differ run to run, because the hero's effect is live). Fix every FAIL the skill's gate lists and run it again (three rounds at most). Then report the `GATE:` line, every waiver with its reason (none for `kit-edited`), and each section 5 checklist line of SKILL.md with the check ids that cover it. Measured by the architect with this exact code: `SHARE: OK 1200x630 84112 bytes`, `GATE: PASS`, no waiver, `share-meta` PASS.
Run: `pnpm -C web exec tsx scripts/share-image.ts --check && pnpm -C web ui-gate landing`
Expected: PASS — `GATE: PASS`

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `feat(dapp): link-preview image captured from the real landing page`

---

### Task 13: The one-command local run really starts Vite, and stopping it stops Anvil and Vite

**Files:**
- Modify: `web/scripts/local.ts`
- Modify: `web/scripts/lib/anvil.ts`
- Create: `web/scripts/local-check.ts`

**Depends on:** Task 10
**Effort:** medium
**Model tier:** top
**Provides:** `pnpm -C web local [--anvil-port N] [--port N] (Vite in-process via createServer; Ctrl+C or closed input stops Vite and Anvil)`, `pnpm -C web exec tsx scripts/local-check.ts -> last line LOCAL: OK`
**Requires:** `pnpm -C web local (Anvil 8545 + fe build + deploy + seed + Vite)`, `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)`

- [ ] **Step 1: Context: the defect, the fix, and what was checked**
This task runs **first** of the follow-up tasks (added 2026-11-19): Task 11 depends on it, because every later UI check and the demo recording use the one-command run.

The defect, found by the guide on 2026-11-19: `web/scripts/local.ts` line 26 started Vite with `require.resolve('vite/bin/vite.js')`. Vite 7.3.8's `package.json` `exports` map does not expose `./bin/vite.js`, so the headline command crashed right after the deploy and seed step with `Package subpath './bin/vite.js' is not defined by "exports" in ...\web\node_modules\vite\package.json` (`ELIFECYCLE`, exit 1). The README Quickstart and the submission draft both tell judges to run `pnpm -C web local`. No test launched `local.ts`, which is why it passed until now. The architect reproduced it on 2026-11-19 in a clone at a path with a space.

The fix: `local.ts` runs Vite's dev server **in its own process** through Vite's API (`createServer` from `vite`, the package's main export), so no path inside the vite package is needed and no extra process exists. Anvil is still a child process started with an argument array (`web/scripts/lib/anvil.ts`). Stopping:
- Ctrl+C, SIGTERM, Ctrl+Break and a closed console window all run one `stop()`: close Vite, then stop Anvil, then exit 0. Closing the command's input does the same. `vite` itself stops on closed input outside CI; `local.ts` now does it everywhere, and it is how `scripts/local-check.ts` stops the run.
- A process `'exit'` handler ends Anvil synchronously, whatever ends the process (an error, or Vite's own exit on SIGTERM). That needs `kill()` on the `Anvil` handle, added to `anvil.ts`. On Windows, Node already ends a child with its parent (libuv puts children in a job object), so this handler matters on Linux and macOS, where a child outlives its parent. The architect checked that a version without it still passes `local-check` on Windows, for that reason.

New options for the check: `--anvil-port N` (default 8545) and `--port N` (default 5173). Without `--port`, the pages port moves up when 5173 is taken, as with `vite`. With `--port` it is exact. The plain command judges run is unchanged: Anvil on 8545, pages on `127.0.0.1:5173`.

Verified by the architect in the spaced clone on 2026-11-19:
- **The gate on today's code:** `local-check` FAILs.
- **The gate on the fix:** `LOCAL: OK` on all four runs, 18-31 s each, with no Anvil or `local.ts` process left after.
- **A real console Ctrl+C:** sent to a run with `GenerateConsoleCtrlEvent` from a separate console. Both processes stopped and both ports closed.
- **Default port taken:** with 5173 in use, the pages moved to 5174 and the printed URL said so.
- **Task 11's code on top of this task:** tsc passes, 28 tests pass, `IDLE: OK`.

The same `require.resolve` pattern elsewhere (checked with `git grep` over `web/`, and in the planned scripts of Tasks 11 and 12):
- `local.ts` is the only hit.
- `ui-gate.ts`, and the planned `idle-check.ts` and `share-image.ts`, start `node_modules/vite/bin/vite.js` and `node_modules/typescript/bin/tsc` by **file path** (`join(WEB_DIR, 'node_modules', ...)`). Node applies `exports` only to package specifiers, never to file paths, so those work. All three were run by the architect. Leave them as they are.
- `gas-table.ts` starts no package bin at all.

Not in this task:
- **CI:** CI's web job installs neither Foundry nor Fe, and this check needs both plus about 30 s of chain setup. The architect could not prove it stable on GitHub's runners, so it stays a local gate, like `ui-gate`.
- **The README** needs no change: the command and its defaults are the same.

Running the check needs `anvil` and `fe` on PATH. It uses free ports, so a local chain already on 8545 or a Vite already on 5173 does not disturb it. It overwrites `web/public/deployment.json` while it runs (a gitignored file) and puts it back as it was.

- [ ] **Step 2: The check**
Write `web/scripts/local-check.ts` with exactly this content:
```ts
/**
 * dapp:13: the one-command local run really serves the app, and stopping it
 * really stops Anvil and Vite. Starts `pnpm -C web local` on two free ports,
 * waits until / and /app/ answer 200 with their own page (Vite would answer
 * any path with the landing page, so each page's <title> is checked) and
 * /deployment.json names the chosen RPC, finds the run's Anvil and local.ts
 * processes, then closes the command's input (local.ts's stop path, the same
 * one Ctrl+C takes) and proves the command exited, both ports refuse
 * connections and none of those processes is left. web/public/deployment.json
 * is put back as it was.
 *
 *   pnpm -C web exec tsx scripts/local-check.ts
 *   last line: LOCAL: OK
 */
import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, connect } from 'node:net'
import { join } from 'node:path'
import { run } from './lib/proc'
import { REPO_ROOT, WEB_DIR } from './lib/repo'

const READY_MS = 240_000
const STOP_MS = 20_000
const DEPLOYMENT = join(WEB_DIR, 'public', 'deployment.json')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** A port nothing listens on right now: the OS picks it. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => (typeof address === 'object' && address !== null ? resolve(address.port) : reject(new Error('no port'))))
    })
  })
}

/** True when something accepts a TCP connection on 127.0.0.1:port. */
function listening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1')
    socket.setTimeout(1000)
    socket.once('connect', () => (socket.destroy(), resolve(true)))
    socket.once('error', () => resolve(false))
    socket.once('timeout', () => (socket.destroy(), resolve(false)))
  })
}

/** Every running process as "pid command line". */
async function processList(): Promise<string[]> {
  const result =
    process.platform === 'win32'
      ? await run('powershell.exe', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process | ForEach-Object { [string]$_.ProcessId + ' ' + $_.CommandLine }"])
      : await run('ps', ['-eo', 'pid=,args='])
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '')
}

/** This run's Anvil and its local.ts processes, matched by the ports on their command lines. */
async function leftovers(anvilPort: number): Promise<{ anvil: string[]; local: string[] }> {
  const lines = await processList()
  return {
    anvil: lines.filter((l) => /anvil/i.test(l) && l.includes(`--port ${anvilPort}`) && !l.includes('--anvil-port')),
    local: lines.filter((l) => l.includes('local.ts') && l.includes(`--anvil-port ${anvilPort}`)),
  }
}

/** What a failed check must not leave behind: the command it started and the ports it chose. */
const launched: { child?: ChildProcess; anvilPort?: number } = {}

/** After a FAIL: ends the command's process tree and anything of this run still holding its ports. */
async function cleanUp(): Promise<void> {
  const { child, anvilPort } = launched
  if (child?.pid !== undefined && child.exitCode === null) {
    if (process.platform === 'win32') await run('taskkill', ['/pid', String(child.pid), '/t', '/f'])
    else child.kill('SIGKILL')
  }
  if (anvilPort === undefined) return
  const left = await leftovers(anvilPort)
  for (const line of [...left.anvil, ...left.local]) {
    try {
      process.kill(Number(line.split(' ')[0]))
    } catch {
      // already gone
    }
  }
}

function title(file: string): string {
  const match = /<title>([^<]+)<\/title>/.exec(readFileSync(join(WEB_DIR, file), 'utf8'))
  if (!match?.[1]) throw new Error(`${file} has no <title>`)
  return match[1]
}

async function page(url: string, want: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const body = await response.text()
    if (response.status !== 200) return `${url} answered ${response.status}`
    return body.includes(`<title>${want}</title>`) ? null : `${url} is not the page titled "${want}"`
  } catch {
    return `${url} does not answer`
  }
}

async function deploymentProblem(url: string, rpcUrl: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (response.status !== 200) return `${url} answered ${response.status}`
    const value = JSON.parse(await response.text()) as { rpcUrl?: unknown; chainId?: unknown; addresses?: { anyOrder?: unknown } }
    if (value.rpcUrl !== rpcUrl) return `${url} names ${String(value.rpcUrl)}, not ${rpcUrl}`
    if (value.chainId !== 31337) return `${url} has chainId ${String(value.chainId)}`
    if (typeof value.addresses?.anyOrder !== 'string') return `${url} has no AnyOrder address`
    return null
  } catch (error) {
    return `${url}: ${error instanceof Error ? error.message : String(error)}`
  }
}

async function check(): Promise<string> {
  const anvilPort = await freePort()
  let webPort = await freePort()
  while (webPort === anvilPort) webPort = await freePort()
  const args = ['-C', 'web', 'local', '--anvil-port', String(anvilPort), '--port', String(webPort)]
  console.log(`local-check: pnpm ${args.join(' ')}`)
  // pnpm is a .cmd shim on Windows: start it through cmd.exe. Every argument is
  // free of spaces; the spaced repository path is only the working directory.
  const child =
    process.platform === 'win32'
      ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', 'pnpm', ...args], { cwd: REPO_ROOT, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
      : spawn('pnpm', args, { cwd: REPO_ROOT, stdio: ['pipe', 'pipe', 'pipe'] })
  launched.child = child
  launched.anvilPort = anvilPort
  let output = ''
  child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()))
  child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()))
  let exitCode: number | null = null
  const exited = new Promise<void>((resolve) => child.once('exit', (code) => ((exitCode = code ?? 1), resolve())))
  const lastLines = () => output.trim().split(/\r?\n/).slice(-3).join(' | ')

  const base = `http://127.0.0.1:${webPort}`
  const rpcUrl = `http://127.0.0.1:${anvilPort}`
  const landingTitle = title('index.html')
  const appTitle = title(join('app', 'index.html'))
  const started = Date.now()
  let problem: string | null = 'not started'
  while (Date.now() - started < READY_MS) {
    if (exitCode !== null) throw new Error(`pnpm -C web local exited ${exitCode} before serving: ${lastLines()}`)
    problem =
      (await page(`${base}/`, landingTitle)) ??
      (await page(`${base}/app/`, appTitle)) ??
      (await deploymentProblem(`${base}/deployment.json`, rpcUrl))
    if (problem === null) break
    await sleep(1000)
  }
  if (problem !== null) {
    child.stdin.end()
    throw new Error(`not serving after ${READY_MS / 1000} s (${problem}): ${lastLines()}`)
  }
  const ready = Math.round((Date.now() - started) / 1000)
  const before = await leftovers(anvilPort)
  console.log(`local-check: serving after ${ready} s: / and /app/ 200, deployment.json names ${rpcUrl}`)
  console.log(`local-check: running: ${before.anvil.length} Anvil, ${before.local.length} local.ts process(es)`)
  if (before.anvil.length === 0 || before.local.length === 0) {
    child.stdin.end()
    throw new Error('could not find the run\'s Anvil and local.ts processes, so their exit cannot be proved')
  }

  child.stdin.end()
  const stopStart = Date.now()
  await Promise.race([exited, sleep(STOP_MS)])
  if (exitCode === null) throw new Error(`pnpm -C web local still running ${STOP_MS / 1000} s after its input closed`)
  await sleep(1000)
  const after = await leftovers(anvilPort)
  const gone: string[] = []
  if (await listening(anvilPort)) gone.push(`Anvil port ${anvilPort} still accepts connections`)
  if (await listening(webPort)) gone.push(`Vite port ${webPort} still accepts connections`)
  for (const line of [...after.anvil, ...after.local]) gone.push(`left running: ${line}`)
  if (gone.length > 0) throw new Error(gone.join('; '))
  if (exitCode !== 0) throw new Error(`pnpm -C web local exited ${exitCode} on stop: ${lastLines()}`)
  return `stopped in ${Math.round((Date.now() - stopStart) / 1000)} s with exit 0; Anvil and Vite gone`
}

async function main(): Promise<boolean> {
  const saved = existsSync(DEPLOYMENT) ? readFileSync(DEPLOYMENT) : null
  try {
    const detail = await check()
    console.log(`local-check: ${detail}`)
    console.log('LOCAL: OK')
    return true
  } catch (error) {
    await cleanUp()
    console.log(`LOCAL: FAIL (${error instanceof Error ? error.message : String(error)})`)
    return false
  } finally {
    if (saved !== null) writeFileSync(DEPLOYMENT, saved)
    else rmSync(DEPLOYMENT, { force: true })
  }
}

main().then((ok) => process.exit(ok ? 0 : 1))
```

- [ ] **Step 3: Run it to confirm it fails on today's code**
Run: `pnpm -C web exec tsx scripts/local-check.ts`
Expected: FAIL, exit code 1, and a last line that starts `LOCAL: FAIL (pnpm -C web local exited 1 before serving:`. When nothing serves on 8545, the line goes on with `... | Package subpath './bin/vite.js' is not defined by "exports" in ...\vite\package.json |  ELIFECYCLE  Command failed with exit code 1.)`. When a chain already serves on 8545 (today's code ignores the port options), it goes on with `port 8545 already serves a chain; stop it first`. Both were measured by the architect.

- [ ] **Step 4: `kill()` on the Anvil handle**
In `web/scripts/lib/anvil.ts`, replace
```ts
export interface Anvil {
  rpcUrl: string
  stop(): Promise<void>
}
```
with exactly
```ts
export interface Anvil {
  rpcUrl: string
  stop(): Promise<void>
  /** Ends Anvil at once, synchronously: for a process 'exit' handler, where nothing can be awaited. */
  kill(): void
}
```
and replace the line
```ts
    if (await rpcReady(rpcUrl)) return { rpcUrl, stop: anvil.stop }
```
with exactly
```ts
    if (await rpcReady(rpcUrl)) return { rpcUrl, stop: anvil.stop, kill: () => void anvil.child.kill() }
```
Nothing else in the file changes. Every other user of `startAnvil` (`ui-gate.ts`, `gas-table.ts`, the e2e tests, Task 11's `idle-check.ts`) only reads `rpcUrl` and calls `stop()`, so they are unaffected.

- [ ] **Step 5: `local.ts` starts Vite through its API**
Replace `web/scripts/local.ts` with exactly this content:
```ts
/**
 * The one-command local run: starts Anvil (Osaka, per-transaction gas cap on)
 * on 127.0.0.1:8545, builds and deploys the contracts, seeds the demo state and
 * serves both pages with Vite's dev server on 127.0.0.1:5173. Vite runs in this
 * process through its own API (`createServer`), never through a path inside the
 * vite package, which its `exports` map does not expose.
 * Ctrl+C stops Vite and Anvil together; so does closing this command's input,
 * as it does for `vite` itself.
 *
 *   pnpm -C web local                                    Anvil on 8545, pages on 5173
 *   pnpm -C web local --anvil-port 18545 --port 15173    other ports (scripts/local-check.ts)
 */
import { type ViteDevServer, createServer } from 'vite'
import { startAnvil } from './lib/anvil'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

/** The port after `name` on the command line, or `fallback` when the option is absent. */
function portOption(name: string, fallback: number): number {
  const i = process.argv.indexOf(name)
  if (i === -1) return fallback
  const port = Number(process.argv[i + 1])
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`${name} needs a port number (1-65535)`)
  return port
}

async function main(): Promise<void> {
  const anvilPort = portOption('--anvil-port', 8545)
  const webPort = portOption('--port', 5173)
  const anvil = await startAnvil(anvilPort)
  // However this process ends (Ctrl+C, closed input, an error, Vite's own exit), Anvil ends with it.
  process.on('exit', () => anvil.kill())
  let server: ViteDevServer | undefined
  try {
    const { deployment, seeded } = await deployLocal(anvil.rpcUrl)
    console.log(`Anvil 31337 on ${anvil.rpcUrl}; AnyOrder ${deployment.addresses.anyOrder}; batch ${seeded.openBatch} open`)
    console.log('Built-in traders are Anvil dev accounts. Test funds, no real value.')
    // As with `vite`: the default port moves up when taken; a port asked for with --port is exact.
    const strictPort = process.argv.includes('--port')
    server = await createServer({ root: WEB_DIR, server: { host: '127.0.0.1', port: webPort, strictPort } })
    await server.listen()
  } catch (error) {
    await server?.close()
    await anvil.stop()
    throw error
  }
  server.printUrls()
  console.log('Ctrl+C stops Vite and Anvil.')
  const running = server
  let stopping = false
  const stop = (): void => {
    if (stopping) return
    stopping = true
    void running
      .close()
      .catch(() => undefined)
      .then(() => anvil.stop())
      .finally(() => process.exit(0))
  }
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP'] as const) process.on(signal, stop)
  process.stdin.on('end', stop)
  process.stdin.resume()
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
```

- [ ] **Step 6: Types and unit tests**
Run: `pnpm -C web exec tsc --noEmit && NO_COLOR=1 pnpm -C web test`
Expected: no tsc output, then `Tests  23 passed (23)`

- [ ] **Step 7: Gate: types, unit tests, then the one-command run serves and stops**
Run: `pnpm -C web exec tsc --noEmit && NO_COLOR=1 pnpm -C web test && pnpm -C web exec tsx scripts/local-check.ts`
Expected: PASS — `LOCAL: OK`
(Before it: `serving after N s: / and /app/ 200, deployment.json names http://127.0.0.1:<port>`, `running: 1 Anvil, 1 local.ts process(es)`, `stopped in N s with exit 0; Anvil and Vite gone`.)

- [ ] **Step 8: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `fix(dapp): the one-command local run starts Vite through its API and stops cleanly`
