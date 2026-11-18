/** Starts a local Anvil chain: Osaka rules, its per-transaction gas cap on. */
import { type Running, start } from './proc'

export const ANVIL_ARGS = ['--hardfork', 'osaka', '--enable-tx-gas-limit', '--chain-id', '31337', '--silent'] as const

export async function rpcReady(rpcUrl: string): Promise<boolean> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
    })
    const body = (await response.json()) as { result?: string }
    return body.result === '0x7a69'
  } catch {
    return false
  }
}

export interface Anvil {
  rpcUrl: string
  stop(): Promise<void>
}

export async function startAnvil(port: number): Promise<Anvil> {
  const rpcUrl = `http://127.0.0.1:${port}`
  if (await rpcReady(rpcUrl)) throw new Error(`port ${port} already serves a chain; stop it first`)
  const anvil: Running = start('anvil', [...ANVIL_ARGS, '--port', String(port)])
  for (let i = 0; i < 100; i++) {
    if (await rpcReady(rpcUrl)) return { rpcUrl, stop: anvil.stop }
    await new Promise((r) => setTimeout(r, 150))
  }
  await anvil.stop()
  throw new Error(`anvil did not start on port ${port}`)
}
