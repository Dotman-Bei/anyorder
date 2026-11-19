/**
 * React hooks that every island of /app uses to read the chain. Reads refresh
 * on every new block; nothing is shown until a read has succeeded, so a
 * screen never shows an unknown value as zero.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { anyOrderAbi } from '../chain/abi'
import { type Clients, clientsFor } from '../chain/client'
import { type Deployment, loadDeployment } from '../chain/deployment'
import { type ChainState, POLL_MS, type Probe, isStale, nextChainState } from '../chain/state'

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
