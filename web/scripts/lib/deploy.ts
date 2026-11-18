/**
 * Deploys AnyOrder, TestToken and the baseline pool to a local Anvil chain
 * from dev account 0, funds the five built-in traders (dev accounts 1-5) and
 * seeds a demo state: one cleared batch and an open batch of orders.
 */
import { parseEther } from 'viem'
import { anyOrderAbi, poolAbi, testTokenAbi } from '../../src/chain/abi'
import { type Clients, clientsFor, send } from '../../src/chain/client'
import { type Address, type Deployment, LOCAL_CHAIN_ID, TRADER_LABELS } from '../../src/chain/deployment'
import { type Params, bytecode, feVersion, gitCommit } from './repo'

const T = 10n ** 18n
const MILLI = 10n ** 15n
export const POOL_TOKENS = 400n * T
export const POOL_ETH = 4_400n * MILLI

async function deployContract(clients: Clients, from: Address, abi: unknown, code: `0x${string}`, args: readonly unknown[]): Promise<Address> {
  const hash = await clients.wallet.deployContract({
    account: from,
    abi,
    bytecode: code,
    args,
  } as unknown as Parameters<Clients['wallet']['deployContract']>[0])
  const receipt = await clients.public.waitForTransactionReceipt({ hash })
  if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error(`deploy failed in ${hash}`)
  return receipt.contractAddress
}

export async function deployAll(rpcUrl: string, params: Params, outDir?: string): Promise<Deployment> {
  const clients = clientsFor(rpcUrl)
  const accounts: Address[] = await clients.wallet.getAddresses()
  const deployer = accounts[0]
  if (deployer === undefined || accounts.length < 6) throw new Error('Anvil must expose at least 6 dev accounts')
  const token = await deployContract(clients, deployer, testTokenAbi, bytecode('TestToken', outDir), [])
  const latest = await clients.public.getBlock({ blockTag: 'latest' })
  const genesis = Number(latest.timestamp)
  const anyOrder = await deployContract(clients, deployer, anyOrderAbi, bytecode('AnyOrder', outDir), [
    token,
    BigInt(genesis),
    BigInt(params.batchSeconds),
    BigInt(params.maxOrders),
    BigInt(params.minQuantity),
    BigInt(params.maxPrice),
  ])
  const pool = await deployContract(clients, deployer, poolAbi, bytecode('ConstantProductPool', outDir), [token])
  await send(clients, { from: deployer, address: token, abi: testTokenAbi, functionName: 'mint', args: [deployer, POOL_TOKENS] })
  await send(clients, { from: deployer, address: token, abi: testTokenAbi, functionName: 'approve', args: [pool, POOL_TOKENS] })
  await send(clients, { from: deployer, address: pool, abi: poolAbi, functionName: 'seed', args: [POOL_TOKENS], value: POOL_ETH })
  const block = await clients.public.getBlockNumber()
  return {
    chainId: LOCAL_CHAIN_ID,
    rpcUrl,
    deployer,
    traders: TRADER_LABELS.map((label, i) => ({ label, address: accounts[i + 1] as Address })),
    addresses: { anyOrder, testToken: token, pool },
    genesis,
    batchSeconds: params.batchSeconds,
    maxOrders: params.maxOrders,
    demoBatchSize: params.demoBatchSize,
    minQuantity: params.minQuantity,
    maxPrice: params.maxPrice,
    deployBlock: Number(block),
    commit: await gitCommit(),
    feVersion: await feVersion(),
    deployedAt: new Date().toISOString(),
  }
}

/** Gives each built-in trader 1,000 TKN and 100 ETH, half of each deposited into AnyOrder. */
export async function fundTraders(deployment: Deployment): Promise<void> {
  const clients = clientsFor(deployment.rpcUrl)
  const { anyOrder, testToken } = deployment.addresses
  for (const trader of deployment.traders) {
    await send(clients, { from: deployment.deployer, address: testToken, abi: testTokenAbi, functionName: 'mint', args: [trader.address, 1_000n * T] })
    await send(clients, { from: trader.address, address: testToken, abi: testTokenAbi, functionName: 'approve', args: [anyOrder, 1_000n * T] })
    await send(clients, { from: trader.address, address: anyOrder, abi: anyOrderAbi, functionName: 'depositToken', args: [500n * T] })
    await send(clients, { from: trader.address, address: anyOrder, abi: anyOrderAbi, functionName: 'depositEth', value: parseEther('50') })
  }
}

/** The i-th demo order: limits around 0.011 ETH/TKN, makers 1-3 alternating sides. */
export function demoOrder(i: number): { maker: number; isBuy: boolean; limit: bigint; quantity: bigint } {
  const isBuy = i % 2 === 0
  const step = BigInt(i % 5)
  const limit = isBuy ? 9n * MILLI + step * MILLI : 10n * MILLI + step * MILLI
  return { maker: i % 3, isBuy, limit, quantity: BigInt(1 + (i % 4)) * T }
}

export async function advanceTo(clients: Clients, timestamp: bigint): Promise<void> {
  await clients.test.setNextBlockTimestamp({ timestamp })
  await clients.test.mine({ blocks: 1 })
}

async function placeDemo(clients: Clients, deployment: Deployment, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const o = demoOrder(i)
    const trader = deployment.traders[o.maker]
    if (trader === undefined) throw new Error('missing maker')
    await send(clients, {
      from: trader.address,
      address: deployment.addresses.anyOrder,
      abi: anyOrderAbi,
      functionName: o.isBuy ? 'placeBuy' : 'placeSell',
      args: [o.limit, o.quantity],
    })
  }
}

/** One cleared batch, then an open batch holding `demoBatchSize` orders. */
export async function seedDemo(deployment: Deployment): Promise<{ clearedBatch: bigint; openBatch: bigint }> {
  const clients = clientsFor(deployment.rpcUrl)
  const exchange = deployment.addresses.anyOrder
  const first = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'currentBatch' })) as bigint
  await placeDemo(clients, deployment, Math.min(8, deployment.demoBatchSize))
  const info = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [first] })) as {
    end: bigint
  }
  await advanceTo(clients, info.end)
  await send(clients, { from: deployment.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [first] })
  await placeDemo(clients, deployment, deployment.demoBatchSize)
  return { clearedBatch: first, openBatch: first + 1n }
}
