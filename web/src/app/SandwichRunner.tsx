/**
 * #sandwich: the contrast, from the recorded run (labelled) until the visitor
 * runs it live on their own chain. Live runs use the same scenario module as
 * the recorder and roll the chain back afterwards.
 */
import { useEffect, useState } from 'react'
import { type SandwichResult, runSandwich } from '../scenario/sandwich'
import { formatEth, formatPrice, formatTokens, formatWei } from '../lib/format'
import { ChainNotice, TRADER_NOTE, errorName, useLive } from './shared'

interface Recording {
  recordedAt: string
  commit: string
  result: SandwichResult
}

function Table({ r }: { r: SandwichResult }) {
  return (
    <table className="contrast">
      <thead>
        <tr>
          <th scope="col">Same three orders</th>
          <th scope="col">Constant-product pool (baseline)</th>
          <th scope="col">AnyOrder batch</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Victim gets</th>
          <td data-label="Pool">
            {formatTokens(BigInt(r.pool.victimTokensSandwiched))} (alone: {formatTokens(BigInt(r.pool.victimTokensAlone))})
          </td>
          <td data-label="Batch">
            {formatTokens(BigInt(r.batchSandwiched.victimTokens))} for {formatEth(BigInt(r.batchSandwiched.victimPaidWei))} (alone: the same)
          </td>
        </tr>
        <tr>
          <th scope="row">Clearing price</th>
          <td data-label="Pool">moves with every trade</td>
          <td data-label="Batch">
            {formatPrice(BigInt(r.batchSandwiched.price))} (alone: {formatPrice(BigInt(r.batchAlone.price))})
          </td>
        </tr>
        <tr>
          <th scope="row">Attacker nets</th>
          <td data-label="Pool">{formatEth(BigInt(r.pool.attackerProfitWei), 18)} profit</td>
          <td data-label="Batch">
            {r.batchSandwiched.attackerTokenChange} TKN and {formatWei(BigInt(r.batchSandwiched.attackerWeiChange))} (rounding, kept by the contract)
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function SandwichRunner() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [recording, setRecording] = useState<Recording | undefined>()
  const [mine, setMine] = useState<SandwichResult | undefined>()
  const [status, setStatus] = useState('')
  useEffect(() => {
    fetch('/recorded/sandwich.json')
      .then((r) => (r.ok ? (r.json() as Promise<Recording>) : undefined))
      .then(setRecording)
      .catch(() => setRecording(undefined))
  }, [])
  const shown = mine ?? recording?.result
  const run = async () => {
    if (!clients || !deployment) return
    setStatus('Running the four scenarios on your local chain…')
    try {
      setMine(await runSandwich(clients, deployment))
      setStatus('Done: every number above was read from your chain, which was then rolled back.')
    } catch (e) {
      setStatus(`The run failed: ${errorName(e)}`)
    }
  }
  return (
    <div className="sandwich">
      <div className="ui-head">
        <span className="ui-title">Pool against batch</span>
      </div>
      {shown ? (
        <>
          <p className="note sandwich__source">{mine ? 'Measured just now on your local chain.' : `Recorded on a local Anvil chain, ${recording?.recordedAt ?? ''}, commit ${recording?.commit ?? ''}.`}</p>
          <Table r={shown} />
          <p className="note sandwich__cast">The victim, the attacker and the makers are {TRADER_NOTE.charAt(0).toLowerCase() + TRADER_NOTE.slice(1)}</p>
          <div className="limits">
            <p>
              Where the guarantee stops: the fill stays identical only when the attacker&apos;s buy and sell are the same size and priced outside every other order (condition C). A
              one-sided buy moves the price from {formatPrice(BigInt(shown.batchAlone.price))} to {formatPrice(BigInt(shown.oneSided.price))}; the victim then pays{' '}
              {formatEth(BigInt(shown.oneSided.victimPaidWei))} and the attacker pays {formatEth(BigInt(shown.oneSided.attackerPaidWei))} at that same price.
            </p>
          </div>
        </>
      ) : (
        <p className="batch-empty">No recorded run yet: run it on your local chain.</p>
      )}
      <div className="sandwich__run">
        {chain.kind === 'live' ? (
          <button type="button" className="btn btn--secondary" onClick={() => void run()}>
            Run the sandwich on your local chain
          </button>
        ) : (
          <ChainNotice live={live} />
        )}
        <p className="tx-status" role="status">
          {status}
        </p>
      </div>
    </div>
  )
}
