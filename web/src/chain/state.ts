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
