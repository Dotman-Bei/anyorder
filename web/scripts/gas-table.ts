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
