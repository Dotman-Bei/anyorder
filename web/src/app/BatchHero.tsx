/**
 * #batch: the live batch. The curves plot the contract's own book; the price
 * marker is the contract's preview(), the same pure clearing called read-only.
 */
import { anyOrderAbi } from '../chain/abi'
import { batchPhase, secondsLeft } from '../chain/state'
import { curvePoints } from '../lib/curves'
import { UNKNOWN, formatCountdown, formatPrice, formatTokens } from '../lib/format'
import { type BatchSnapshot, readBatch, useBlockRead } from './live'
import { ChainNotice, useLive } from './shared'

function Curves({ snap }: { snap: BatchSnapshot }) {
  const points = curvePoints(snap.orders)
  if (points.length === 0) return null
  const maxQ = points.reduce((m, p) => (p.demand > m ? p.demand : p.supply > m ? p.supply : m), 1n)
  const lo = points[0]?.price ?? 0n
  const hi = points[points.length - 1]?.price ?? 1n
  const x = (p: bigint) => (hi === lo ? 50 : Number(((p - lo) * 100n) / (hi - lo)))
  const y = (q: bigint) => 100 - Number((q * 100n) / maxQ)
  const line = (key: 'demand' | 'supply') => points.map((p) => `${x(p.price)},${y(p[key])}`).join(' ')
  return (
    <svg viewBox="-4 -4 108 108" role="img" aria-label="Supply and demand of this batch, read from the contract">
      <polyline points={line('demand')} fill="none" stroke="currentColor" strokeWidth="1.2" data-curve="demand" />
      <polyline points={line('supply')} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2" data-curve="supply" />
      {snap.preview.traded ? <line x1={x(snap.preview.price)} x2={x(snap.preview.price)} y1="0" y2="100" stroke="currentColor" strokeWidth="0.6" data-marker="preview" /> : null}
    </svg>
  )
}

export function BatchHero() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const current = useBlockRead(
    chain,
    clients && deployment
      ? async () => {
          const batch = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' })
          return readBatch(clients, deployment, batch)
        }
      : undefined,
    [deployment?.addresses.anyOrder],
  )
  const snap = current.data
  if (chain.kind !== 'live' || !snap) return <ChainNotice live={live} />
  const phase = batchPhase(snap.info)
  return (
    <div className="batch-live" data-phase={phase}>
      <ChainNotice live={live} />
      <dl className="batch-facts">
        <div>
          <dt>Batch</dt>
          <dd>{snap.batch.toString()}</dd>
        </div>
        <div>
          <dt>Closes in</dt>
          <dd>{formatCountdown(secondsLeft(snap.info.end, chain.blockTime))}</dd>
        </div>
        <div>
          <dt>Orders</dt>
          <dd>{snap.info.order_count.toString()}</dd>
        </div>
        <div>
          <dt>Indicative price (contract preview)</dt>
          <dd>{snap.preview.traded ? formatPrice(snap.preview.price) : UNKNOWN}</dd>
        </div>
        <div>
          <dt>Volume at that price</dt>
          <dd>{snap.preview.traded ? formatTokens(snap.preview.volume) : UNKNOWN}</dd>
        </div>
      </dl>
      {phase === 'empty' ? <p className="batch-empty">No orders in batch {snap.batch.toString()} yet.</p> : <Curves snap={snap} />}
    </div>
  )
}
