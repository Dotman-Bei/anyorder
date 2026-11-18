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
