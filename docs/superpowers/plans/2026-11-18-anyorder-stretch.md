# AnyOrder Stretch Implementation Plan

**Goal:** Two optional extras, cut first and in this order if the schedule slips: a gas table of the
real contract, then a native Linux CI job for the pure clearing ingot.
**Architecture:** S1 reuses the dApp's Anvil tooling to measure `clear()` at five batch sizes; S2 adds a
separate GitHub Actions workflow on ubuntu that checks and tests the clearing ingot on Fe's native
backend (native executables are not built on Windows).
**Tech Stack:** fe 26.6.0, Foundry anvil 1.7.1, Node 22, pnpm 10, tsx 4.23.15, GitHub Actions ubuntu-latest.
**Source spec:** docs/superpowers/specs/2026-11-18-anyorder-docs-stretch-design.md

Conventions: `Run:` lines are Git Bash from the repository root. Cross-plan dependencies are written
`Task <subsystem>:<N>`.

---

### Task 1: S1 (cut first): gas table of the real contract

**Files:**
- Create: `web/scripts/gas-table.ts`
- Create: `docs/gas.md`
- Modify: `README.md`

**Depends on:** Task dapp:3, Task docs:1
**Effort:** medium
**Provides:** nothing other tasks name
**Requires:** `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)`, `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`, `deploy/params.json { maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice }`, `README.md (R2-contract-protocol v1 + event-overlay)`

- [ ] **Step 1: Context**
Reuses `deployAll, fundTraders, seedDemo, demoOrder, advanceTo (web/scripts/lib/deploy.ts), startAnvil, rpcReady (web/scripts/lib/anvil.ts), deployLocal(rpcUrl?, outFile?, batchSeconds?) (web/scripts/deploy-local.ts)` and `clientsFor(rpcUrl), send(clients, request), CLEAR_GAS_LIMIT (web/src/chain/client.ts)`; reads `deploy/params.json { maxOrders, demoBatchSize, batchSeconds, minQuantity, maxPrice }`. Starts its own Anvil on 8553.

- [ ] **Step 2: The measurement script**
Write `web/scripts/gas-table.ts` with exactly this content:
```ts
/**
 * Stretch S1: measures clear() of the REAL AnyOrder contract at several batch
 * sizes on its own Anvil chain (Osaka, per-transaction gas cap enforced) and
 * writes docs/gas.md. The orders are the demo mix (demoOrder).
 *
 *   pnpm -C web exec tsx scripts/gas-table.ts      last line: GAS: OK
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { anyOrderAbi } from '../src/chain/abi'
import { CLEAR_GAS_LIMIT, clientsFor, send } from '../src/chain/client'
import { startAnvil } from './lib/anvil'
import { advanceTo, demoOrder, deployAll, fundTraders } from './lib/deploy'
import { REPO_ROOT, feBuild, feVersion, readParams } from './lib/repo'

const SIZES = [10, 25, 50, 75, 100]

async function main(): Promise<void> {
  const anvil = await startAnvil(8553)
  try {
    await feBuild()
    const params = readParams()
    const d = await deployAll(anvil.rpcUrl, { ...params, batchSeconds: 3600 })
    await fundTraders(d)
    const c = clientsFor(d.rpcUrl)
    const exchange = d.addresses.anyOrder
    const rows: { n: number; gas: bigint }[] = []
    for (const n of SIZES.filter((s) => s <= d.maxOrders)) {
      const now = await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'currentBatch' })
      const open = await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [now] })
      await advanceTo(c, open.end)
      const batch = now + 1n
      for (let i = 0; i < n; i++) {
        const o = demoOrder(i)
        const trader = d.traders[o.maker]
        if (trader === undefined) throw new Error('maker missing')
        await send(c, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: o.isBuy ? 'placeBuy' : 'placeSell', args: [o.limit, o.quantity] })
      }
      const full = await c.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })
      await advanceTo(c, full.end)
      const receipt = await send(c, { from: d.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [batch], gas: CLEAR_GAS_LIMIT })
      rows.push({ n, gas: receipt.gasUsed })
      console.log(`N=${n} clear gas=${receipt.gasUsed}`)
    }
    const cap = Number(CLEAR_GAS_LIMIT)
    const table = rows.map((r) => `| ${r.n} | ${r.gas} | ${((Number(r.gas) * 100) / cap).toFixed(1)}% |`).join('\n')
    writeFileSync(
      join(REPO_ROOT, 'docs', 'gas.md'),
      `# Gas: clearing a batch with the real AnyOrder contract

Measured by \`pnpm -C web exec tsx scripts/gas-table.ts\` with ${await feVersion()} on
\`anvil --hardfork osaka --enable-tx-gas-limit\` (per-transaction cap ${cap} gas), the demo order mix
(limits 0.009-0.014 ETH per token, 1-4 tokens per order, three makers). One \`clear(batch)\` transaction
loads every order, sorts, sweeps the candidate prices, rations at the marginal price and writes each
non-zero fill.

| Orders in the batch | \`clear()\` gas | Share of the cap |
|---:|---:|---:|
${table}

The deployed per-batch cap is \`maxOrders = ${d.maxOrders}\` (from the gas spike, \`deploy/params.json\`).
These are measurements of this code on this EVM revision, not a gas-efficiency claim.
`,
    )
    const ok = rows.length > 0 && rows.every((r) => r.gas < CLEAR_GAS_LIMIT)
    console.log(ok ? 'GAS: OK' : 'GAS: FAIL')
    if (!ok) process.exitCode = 1
  } finally {
    await anvil.stop()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
```

- [ ] **Step 3: Measure (writes docs/gas.md)**
Run: `pnpm -C web exec tsx scripts/gas-table.ts`
Expected: five `N=... clear gas=...` lines (the architect measured 358462, 807348, 1567284, 2380590, 3156298) and `GAS: OK`

- [ ] **Step 4: Link it from the README**
Add a `### Gas` sub-heading at the end of README's `## Security notes` with the table from `docs/gas.md` and a link to it. Add no `#`/`##` heading (the README schema is locked).

- [ ] **Step 5: Re-measure and confirm every batch fits the cap**
Run: `pnpm -C web exec tsx scripts/gas-table.ts`
Expected: PASS — `GAS: OK`

- [ ] **Step 6: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `docs(stretch): gas table of clear() for the real contract`

---

### Task 2: S2 (cut second): native Linux CI for the pure clearing ingot

**Files:**
- Create: `.github/workflows/native.yml`

**Depends on:** Task core:6
**Effort:** low
**Provides:** nothing other tasks name
**Requires:** nothing from other tasks

- [ ] **Step 1: The native workflow (ubuntu only)**
Write `.github/workflows/native.yml` with exactly this content:
```yaml
name: Native

# Stretch: the same pure clearing code, checked and tested on Fe's native
# backend. Native executables are built only on Linux and macOS, so this job is
# never part of the Windows demo.
on:
  push:
  pull_request:

permissions:
  contents: read

env:
  FE_VERSION: v26.6.0

jobs:
  clearing-native:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - name: Install Fe
        run: |
          curl -fsSL https://raw.githubusercontent.com/argotorg/fe/master/feup/feup.sh | bash -s -- --version "$FE_VERSION" --no-modify-path
          echo "$HOME/.fe/bin" >> "$GITHUB_PATH"
      - run: fe --version
      - run: fe check ingots/clearing --backend native
      - run: fe test ingots/clearing --backend native --filter vector_
```

- [ ] **Step 2: The clearing ingot type-checks for the native target here**
The workflow itself runs only on GitHub after a push; report its first result when you see it.
Run: `fe check ingots/clearing --backend native && echo NATIVE-CHECK: OK`
Expected: PASS — `NATIVE-CHECK: OK`

- [ ] **Step 3: Commit (kernel-performed — no agent runs this)**
The orchestrator re-runs the gate, scope-checks the worktree against `Files:` and commits exactly
those paths with this message. The executor never runs git.
Message: `ci(stretch): check and test the clearing ingot on the native backend`
