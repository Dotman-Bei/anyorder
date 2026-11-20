/**
 * What every island shares: the selected trader (a tiny store, because each
 * island is its own React root), the live chain hooks, error decoding and the
 * notice shown for every state that is not live (on a public host, dapp:14,
 * the hosted notice in its place).
 */
import { useSyncExternalStore } from 'react'
import { BaseError, ContractFunctionRevertedError } from 'viem'
import type { Clients } from '../chain/client'
import type { Deployment } from '../chain/deployment'
import { type ChainState, RECOVERY } from '../chain/state'
import { formatAge } from '../lib/format'
import { HOSTED, HOSTED_LINKS } from '../lib/hosted'
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
  /** A build for a public host (dapp:14): nothing is read, and every notice is the hosted notice. */
  hosted: boolean
}

export function useLive(hosted: boolean = HOSTED): Live {
  const { deployment, error } = useDeployment(!hosted)
  const clients = useClients(deployment)
  const { state, stale } = useChain(deployment, clients)
  return {
    ...(deployment ? { deployment } : {}),
    ...(clients ? { clients } : {}),
    chain: error ? { kind: 'unavailable', reason: 'unreachable', detail: error } : state,
    stale,
    ...(error ? { error } : {}),
    hosted,
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

/** dapp:14: on a public host, the one notice in place of every state that is not live. */
export function HostedNotice() {
  return (
    <div className="chain-notice" data-state="hosted" role="note">
      <p>
        This app needs a local Anvil chain (chain id 31337, Anvil dev accounts, test funds): <code>pnpm -C web install</code>, then <code>pnpm -C web local</code>.
      </p>
      <p className="chain-notice__links">
        <a href={HOSTED_LINKS.video}>Watch the demo video</a>
        <a href={HOSTED_LINKS.repo}>Source on GitHub</a>
      </p>
    </div>
  )
}

/** Shown in place of an island's data whenever the chain is not live. */
export function ChainNotice({ live }: { live: Live }) {
  if (live.hosted) return <HostedNotice />
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
