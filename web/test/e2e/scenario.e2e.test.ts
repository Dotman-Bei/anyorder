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
