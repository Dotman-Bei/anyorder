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
