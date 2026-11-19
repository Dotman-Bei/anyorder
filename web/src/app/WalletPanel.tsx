/**
 * Optional: trade from an injected EIP-1193 wallet instead of a built-in
 * trader. The app never asks for a key; it only works when the wallet is on
 * the local Anvil chain (31337), e.g. with an Anvil dev account the visitor
 * imported into their own wallet.
 */
import { useState } from 'react'
import { type EIP1193Provider, createWalletClient, custom, parseUnits } from 'viem'
import { foundry } from 'viem/chains'
import { anyOrderAbi } from '../chain/abi'
import { LOCAL_CHAIN_ID } from '../chain/deployment'
import { shortAddress } from '../lib/format'
import { ChainNotice, errorName, useLive } from './shared'

declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}

export function WalletPanel() {
  const live = useLive()
  const { deployment, clients, chain } = live
  const [account, setAccount] = useState<`0x${string}` | undefined>()
  const [status, setStatus] = useState('')
  const [limit, setLimit] = useState('0.011')
  const [quantity, setQuantity] = useState('1')
  if (chain.kind !== 'live' || !deployment || !clients) {
    return (
      <div className="trade__section">
        <ChainNotice live={live} />
      </div>
    )
  }
  const provider = typeof window === 'undefined' ? undefined : window.ethereum
  if (!provider) return <p className="note trade__section">No browser wallet found. The built-in traders need none.</p>
  const wallet = createWalletClient({ chain: foundry, transport: custom(provider) })
  const connect = async () => {
    try {
      const chainId = await wallet.getChainId()
      if (chainId !== LOCAL_CHAIN_ID) {
        setStatus(`Your wallet is on chain ${chainId}; switch it to the local Anvil chain (31337).`)
        return
      }
      const [first] = await wallet.requestAddresses()
      setAccount(first)
      setStatus('')
    } catch (e) {
      setStatus(errorName(e))
    }
  }
  const buy = async () => {
    if (!account) return
    setStatus('Waiting for your wallet…')
    try {
      const hash = await wallet.writeContract({ account, address: deployment.addresses.anyOrder, abi: anyOrderAbi, functionName: 'placeBuy', args: [parseUnits(limit, 18), parseUnits(quantity, 18)] })
      await clients.public.waitForTransactionReceipt({ hash })
      setStatus(`Confirmed (${hash.slice(0, 10)}…)`)
    } catch (e) {
      setStatus(`Reverted: ${errorName(e)}`)
    }
  }
  return (
    <>
      {account ? (
        <form
          className="trade__section ticket"
          onSubmit={(e) => {
            e.preventDefault()
            void buy()
          }}
        >
          <p className="field-note">Connected: {shortAddress(account)} on the local chain.</p>
          <div className="ticket__fields">
            <label className="field">
              <span>Limit (ETH per TKN)</span>
              <input inputMode="decimal" autoComplete="off" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </label>
            <label className="field">
              <span>Quantity (TKN)</span>
              <input inputMode="decimal" autoComplete="off" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
            <button type="submit" className="btn btn--primary">
              Place a buy from my wallet
            </button>
          </div>
        </form>
      ) : (
        <div className="trade__section">
          <button type="button" className="btn btn--secondary" onClick={() => void connect()}>
            Connect a browser wallet
          </button>
        </div>
      )}
      <p className="tx-status wallet__status" role="status">
        {status}
      </p>
    </>
  )
}
