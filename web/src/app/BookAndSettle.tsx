/**
 * #book: the current batch's orders as the contract stores them, sorted by
 * price (the arrival column is shown only to make the point that clearing
 * never reads it). #settle: clear a closed batch, read its result, claim.
 */
import { useState } from 'react'
import { anyOrderAbi } from '../chain/abi'
import { send } from '../chain/client'
import { batchPhase } from '../chain/state'
import { formatEth, formatPrice, formatTokens, shortAddress } from '../lib/format'
import { type OrderRow, readBatch, useBlockRead } from './live'
import { ChainNotice, TRADER_NOTE, errorName, useLive } from './shared'

function labelOf(owner: string, traders: { label: string; address: string }[]): string {
  return traders.find((t) => t.address.toLowerCase() === owner.toLowerCase())?.label ?? shortAddress(owner)
}

export function BookTable() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [arrival, setArrival] = useState(false)
  const snap = useBlockRead(
    chain,
    clients && deployment
      ? async () => readBatch(clients, deployment, await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' }))
      : undefined,
    [deployment?.addresses.anyOrder],
  ).data
  if (chain.kind !== 'live' || !deployment) return <ChainNotice live={live} />
  if (!snap) return <p className="chain-notice" data-state="loading">Reading the orders…</p>
  if (snap.orders.length === 0) return <p className="batch-empty">No orders in batch {snap.batch.toString()} yet.</p>
  const rows: OrderRow[] = arrival ? snap.orders : [...snap.orders].sort((a, b) => (a.limit < b.limit ? 1 : a.limit > b.limit ? -1 : 0))
  return (
    <div className="book">
      <div className="ui-head">
        <span className="ui-title">Batch {snap.batch.toString()}, open</span>
        <span className="ui-spacer"></span>
        <span className="ui-meta">{snap.orders.length} orders</span>
      </div>
      <label className="toggle">
        <input type="checkbox" className="m-check" checked={arrival} onChange={(e) => setArrival(e.target.checked)} /> Show arrival order (clearing never reads it)
      </label>
      <div className="table-scroll" role="region" aria-label="Orders in the open batch" tabIndex={0}>
        <table className="orders">
          <thead>
            <tr>
              <th scope="col">Arrival</th>
              <th scope="col">Trader</th>
              <th scope="col">Side</th>
              <th scope="col" className="num">
                Limit
              </th>
              <th scope="col" className="num">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.index.toString()}>
                <td className="idx">{o.index.toString()}</td>
                <td className="who">{labelOf(o.owner, deployment.traders)}</td>
                <td className="side">{o.is_buy ? 'Buy' : 'Sell'}</td>
                <td className="num lim">{formatPrice(o.limit)}</td>
                <td className="num qty">{formatTokens(o.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ao-foot note">{TRADER_NOTE}</p>
    </div>
  )
}

export function SettlePanel() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [status, setStatus] = useState('')
  const snap = useBlockRead(
    chain,
    clients && deployment
      ? async () => {
          const now = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' })
          const open = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'batchInfo', args: [now] })
          return { last: now > 0n ? await readBatch(clients, deployment, now - 1n) : undefined, openEnd: open.end }
        }
      : undefined,
    [deployment?.addresses.anyOrder],
  ).data
  if (chain.kind !== 'live' || !deployment || !clients) return <ChainNotice live={live} />
  if (!snap) return <p className="chain-notice" data-state="loading">Reading the last batch…</p>
  const exchange = deployment.addresses.anyOrder
  const act = async (what: string, run: () => Promise<unknown>) => {
    setStatus(`Sending: ${what}…`)
    try {
      await run()
      setStatus(`Confirmed: ${what}`)
    } catch (e) {
      setStatus(`Reverted: ${what}: ${errorName(e)}`)
    }
  }
  const advance = () =>
    act('advance the dev chain to the end of the open batch', async () => {
      await clients.test.setNextBlockTimestamp({ timestamp: snap.openEnd })
      await clients.test.mine({ blocks: 1 })
    })
  const last = snap.last
  const phase = last ? batchPhase(last.info) : undefined
  return (
    <div className="settle">
      <div className="ui-head">
        <span className="ui-title">{last ? `Batch ${last.batch.toString()}, ${phase}` : 'Settlement'}</span>
        <span className="ui-spacer"></span>
        <span className="ui-meta">{last ? `${last.orders.length} orders` : 'none closed'}</span>
      </div>
      <div className="settle__bar">
        <button type="button" className="btn btn--secondary" onClick={() => void advance()}>
          Advance time to close the batch (dev chain control)
        </button>
        {last && phase === 'closed' ? (
          <button type="button" className="btn btn--primary" onClick={() => void act(`clear batch ${last.batch}`, () => send(clients, { from: deployment.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [last.batch] }))}>
            Clear batch {last.batch.toString()}
          </button>
        ) : null}
      </div>
      {!last ? <p className="batch-empty">No batch has closed yet.</p> : null}
      {last && phase === 'cleared' ? (
        <div className="cleared">
          <p className="cleared__result">
            Batch {last.batch.toString()} cleared {last.info.traded ? `at ${formatPrice(last.info.price)} for ${formatTokens(last.info.volume)}` : 'with no trade'}. Every fill below is
            the contract&apos;s; buyers&apos; costs round up and sellers&apos; proceeds round down, so at most 1 wei per order stays in the contract.
          </p>
          <div className="table-scroll" role="region" aria-label="Fills of the cleared batch" tabIndex={0}>
            <table className="orders fills">
              <thead>
                <tr>
                  <th scope="col">Trader</th>
                  <th scope="col">Side</th>
                  <th scope="col" className="num">
                    Limit
                  </th>
                  <th scope="col" className="num">
                    Filled
                  </th>
                  <th scope="col" className="num">
                    Locked
                  </th>
                  <th scope="col" className="num">
                    Claim
                  </th>
                </tr>
              </thead>
              <tbody>
                {last.orders.map((o) => (
                  <tr key={o.index.toString()}>
                    <td className="who">{labelOf(o.owner, deployment.traders)}</td>
                    <td className="side">{o.is_buy ? 'Buy' : 'Sell'}</td>
                    <td className="num lim" data-label="Limit">
                      {formatPrice(o.limit)}
                    </td>
                    <td className="num" data-label="Filled">
                      {formatTokens(o.filled)}
                    </td>
                    <td className="num" data-label="Locked">
                      {o.is_buy ? formatEth(o.locked) : formatTokens(o.quantity)}
                    </td>
                    <td className="num act">
                      {o.claimed ? (
                        'Claimed'
                      ) : (
                        <button type="button" className="btn btn--secondary" onClick={() => void act(`claim order ${o.index}`, () => send(clients, { from: deployment.deployer, address: exchange, abi: anyOrderAbi, functionName: 'claim', args: [last.batch, o.index] }))}>
                          Claim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <div className="ao-foot">
        <p className="note">{TRADER_NOTE}</p>
        <p className="tx-status" role="status">
          {status}
        </p>
      </div>
    </div>
  )
}
