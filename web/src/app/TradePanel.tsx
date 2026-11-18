/**
 * #trade: pick a built-in trader, see its free and locked balances on
 * AnyOrder, deposit, withdraw and place limit orders. The ticket is checked
 * against the contract's config() before sending; the contract checks again.
 * Every write is eth_sendTransaction from the trader's unlocked Anvil dev account.
 */
import { useState } from 'react'
import { parseEther, parseUnits } from 'viem'
import { anyOrderAbi, testTokenAbi } from '../chain/abi'
import { send } from '../chain/client'
import { formatEth, formatTokens } from '../lib/format'
import { readBatch, useBlockRead } from './live'
import { ChainNotice, TRADER_NOTE, errorName, selectTrader, useLive, useSelectedTrader } from './shared'

type Status = { kind: 'idle' } | { kind: 'pending'; what: string } | { kind: 'done'; what: string; hash: string } | { kind: 'failed'; what: string; reason: string }

export function TradePanel() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const index = useSelectedTrader()
  const trader = deployment?.traders[index]
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [limit, setLimit] = useState('0.011')
  const [quantity, setQuantity] = useState('1')
  const [amount, setAmount] = useState('1')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const balances = useBlockRead(
    chain,
    clients && deployment && trader
      ? () => clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'balances', args: [trader.address] })
      : undefined,
    [trader?.address],
  )
  const config = useBlockRead(
    chain,
    clients && deployment ? () => clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'config' }) : undefined,
    [deployment?.addresses.anyOrder],
  )
  // Locked = what the trader's unclaimed orders in the open and the previous batch hold.
  const locked = useBlockRead(
    chain,
    clients && deployment && trader
      ? async () => {
          const now = await clients.public.readContract({ address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'currentBatch' })
          const batches = now > 0n ? [now - 1n, now] : [now]
          let eth = 0n
          let tokens = 0n
          for (const b of batches) {
            const snap = await readBatch(clients, deployment, b)
            for (const o of snap.orders) {
              if (o.claimed || o.owner.toLowerCase() !== trader.address.toLowerCase()) continue
              if (o.is_buy) eth += o.locked
              else tokens += o.quantity
            }
          }
          return { eth, tokens }
        }
      : undefined,
    [trader?.address],
  )
  if (chain.kind !== 'live' || !deployment || !clients || !trader) return <ChainNotice live={live} />

  // The ticket, checked against config() before it is sent (the contract checks again).
  const ticketProblem = ((): string | undefined => {
    const c = config.data
    if (!c) return 'Reading the contract settings…'
    let l: bigint
    let q: bigint
    try {
      l = parseUnits(limit, 18)
      q = parseUnits(quantity, 18)
    } catch {
      return 'Enter the limit and the quantity as numbers.'
    }
    if (l <= 0n || l > c.max_price) return `The limit must be above 0 and at most ${formatEth(c.max_price)} per TKN.`
    if (q < c.min_quantity) return `The quantity must be at least ${formatTokens(c.min_quantity, 18)}.`
    return undefined
  })()

  const act = async (what: string, run: () => Promise<{ hash: string }>) => {
    setStatus({ kind: 'pending', what })
    try {
      const { hash } = await run()
      setStatus({ kind: 'done', what, hash })
    } catch (e) {
      setStatus({ kind: 'failed', what, reason: errorName(e) })
    }
  }
  const exchange = deployment.addresses.anyOrder
  const placeOrder = () =>
    act(`${side} ${quantity} TKN at ${limit} ETH`, () =>
      send(clients, {
        from: trader.address,
        address: exchange,
        abi: anyOrderAbi,
        functionName: side === 'buy' ? 'placeBuy' : 'placeSell',
        args: [parseUnits(limit, 18), parseUnits(quantity, 18)],
      }),
    )
  const depositEth = () => act(`deposit ${amount} ETH`, () => send(clients, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: 'depositEth', value: parseEther(amount) }))
  const depositTokens = () =>
    act(`deposit ${amount} TKN`, async () => {
      await send(clients, { from: trader.address, address: deployment.addresses.testToken, abi: testTokenAbi, functionName: 'approve', args: [exchange, parseUnits(amount, 18)] })
      return send(clients, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: 'depositToken', args: [parseUnits(amount, 18)] })
    })
  const withdrawAll = () =>
    act('withdraw everything free', () => {
      const b = balances.data
      if (!b) throw new Error('balances not read yet')
      return send(clients, { from: trader.address, address: exchange, abi: anyOrderAbi, functionName: 'withdraw', args: [b.base, b.quote] })
    })

  return (
    <div className="trade">
      <div className="ui-head">
        <span className="ui-title">Trade</span>
        <span className="ui-spacer"></span>
        <span className="ui-meta">{trader.label}</span>
      </div>
      <div className="trade__section">
        <ChainNotice live={live} />
        <fieldset className="traders">
          <legend>Trader</legend>
          <div className="traders__row">
            {deployment.traders.map((t, i) => (
              <button key={t.address} type="button" className="btn btn--secondary" aria-pressed={i === index} onClick={() => selectTrader(i)}>
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <dl className="trade__section balances">
        <div>
          <dt>Free ETH on AnyOrder</dt>
          <dd>{formatEth(balances.data?.quote)}</dd>
        </div>
        <div>
          <dt>Free TKN on AnyOrder</dt>
          <dd>{formatTokens(balances.data?.base)}</dd>
        </div>
        <div>
          <dt>Locked in open orders (ETH)</dt>
          <dd>{formatEth(locked.data?.eth)}</dd>
        </div>
        <div>
          <dt>Locked in open orders (TKN)</dt>
          <dd>{formatTokens(locked.data?.tokens)}</dd>
        </div>
      </dl>
      <form
        className="trade__section ticket"
        onSubmit={(e) => {
          e.preventDefault()
          if (ticketProblem === undefined) void placeOrder()
        }}
      >
        <div className="ticket__fields">
          <label className="field">
            <span>Side</span>
            <select value={side} onChange={(e) => setSide(e.target.value === 'sell' ? 'sell' : 'buy')}>
              <option value="buy">Buy TKN</option>
              <option value="sell">Sell TKN</option>
            </select>
          </label>
          <label className="field">
            <span>Limit (ETH per TKN)</span>
            <input inputMode="decimal" autoComplete="off" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </label>
          <label className="field">
            <span>Quantity (TKN)</span>
            <input inputMode="decimal" autoComplete="off" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          <button type="submit" className="btn btn--primary" disabled={ticketProblem !== undefined}>
            Place the order
          </button>
        </div>
        {ticketProblem ? <p className="field-note">{ticketProblem}</p> : null}
      </form>
      <div className="trade__section funds">
        <label className="field">
          <span>Amount</span>
          <input inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
        <button type="button" className="btn btn--secondary" onClick={() => void depositEth()}>
          Deposit ETH
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => void depositTokens()}>
          Deposit TKN
        </button>
        <button type="button" className="btn btn--secondary funds__all" onClick={() => void withdrawAll()}>
          Withdraw free funds
        </button>
      </div>
      <div className="ao-foot">
        <p className="tx-status" role="status" data-state={status.kind}>
          {status.kind === 'idle' && TRADER_NOTE}
          {status.kind === 'pending' && `Sending: ${status.what}…`}
          {status.kind === 'done' && `Confirmed: ${status.what} (${status.hash.slice(0, 10)}…)`}
          {status.kind === 'failed' && `Reverted: ${status.what}: ${status.reason}`}
        </p>
      </div>
    </div>
  )
}
