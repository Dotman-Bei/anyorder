/**
 * viem clients for the local Anvil chain, shared by the browser and the Node
 * tooling. Writes go out as eth_sendTransaction from Anvil's unlocked dev
 * accounts (a JSON-RPC account is just an address), so no private key,
 * mnemonic or signature exists anywhere in this code.
 */
import { createPublicClient, createTestClient, createWalletClient, http } from 'viem'
import { foundry } from 'viem/chains'
import { anyOrderAbi, poolAbi, testTokenAbi } from './abi'
import type { Address } from './deployment'

export function clientsFor(rpcUrl: string) {
  const transport = http(rpcUrl, { batch: true })
  return {
    public: createPublicClient({ chain: foundry, transport }),
    wallet: createWalletClient({ chain: foundry, transport }),
    test: createTestClient({ chain: foundry, mode: 'anvil', transport }),
  }
}

export type Clients = ReturnType<typeof clientsFor>

export const CLEAR_GAS_LIMIT = 16_777_216n

/** Sends one write and waits for it; throws on a reverted receipt. */
export async function send(
  clients: Clients,
  request: {
    from: Address
    address: Address
    abi: typeof anyOrderAbi | typeof testTokenAbi | typeof poolAbi
    functionName: string
    args?: readonly unknown[]
    value?: bigint
    gas?: bigint
  },
): Promise<{ hash: `0x${string}`; gasUsed: bigint; blockNumber: bigint }> {
  const hash = await clients.wallet.writeContract({
    account: request.from,
    address: request.address,
    abi: request.abi,
    functionName: request.functionName,
    args: request.args ?? [],
    ...(request.value === undefined ? {} : { value: request.value }),
    ...(request.gas === undefined ? {} : { gas: request.gas }),
  } as unknown as Parameters<Clients['wallet']['writeContract']>[0])
  const receipt = await clients.public.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success') throw new Error(`${request.functionName} reverted in ${hash}`)
  return { hash, gasUsed: receipt.gasUsed, blockNumber: receipt.blockNumber }
}
