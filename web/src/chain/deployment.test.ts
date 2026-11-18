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
