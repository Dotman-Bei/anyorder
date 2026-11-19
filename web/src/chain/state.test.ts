import { describe, expect, it } from 'vitest'
import { type ChainState, RECOVERY, batchPhase, classify, isStale, nextChainState, secondsLeft } from './state'

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
