/**
 * The sandwich contrast, run against the deployed contracts on a local Anvil
 * chain. Every number is read from the chain (contract views, simulated
 * calls of the real contracts, balance changes); none is computed here. Each
 * variant runs inside an Anvil snapshot and is rolled back afterwards, so the
 * chain returns to its demo state. Used by `pnpm scenario` (which records
 * public/recorded/sandwich.json) and by the app's "Run on your local chain".
 */
import { anyOrderAbi, poolAbi, testTokenAbi } from '../chain/abi'
import { type Clients, send } from '../chain/client'
import type { Address, Deployment } from '../chain/deployment'

const T = 10n ** 18n
const MILLI = 10n ** 15n
export const FRONT_RUN_ETH = 110n * MILLI
export const VICTIM_ETH = 165n * MILLI
export const VICTIM_QUANTITY = 15n * T
export const VICTIM_LIMIT = 12n * MILLI
export const ATTACKER_BUY_LIMIT = 26n * MILLI
export const ATTACKER_SELL_LIMIT = 1n * MILLI
export const ONE_SIDED_QUANTITY = 10n * T

export interface PoolOutcome {
  victimTokensAlone: string
  victimTokensSandwiched: string
  attackerTokens: string
  attackerEthBack: string
  attackerProfitWei: string
}

export interface BatchOutcome {
  batch: string
  price: string
  victimTokens: string
  victimPaidWei: string
}

export interface SandwichResult {
  block: string
  pool: PoolOutcome
  batchAlone: BatchOutcome
  batchSandwiched: BatchOutcome & { attackerTokenChange: string; attackerWeiChange: string }
  oneSided: BatchOutcome & { attackerTokens: string; attackerPaidWei: string }
}

interface Cast {
  maker1: Address
  maker2: Address
  maker3: Address
  victim: Address
  attacker: Address
  deployer: Address
}

function castOf(d: Deployment): Cast {
  const at = (i: number): Address => {
    const t = d.traders[i]
    if (t === undefined) throw new Error('deployment lists fewer than five traders')
    return t.address
  }
  return { maker1: at(0), maker2: at(1), maker3: at(2), victim: at(3), attacker: at(4), deployer: d.deployer }
}

async function withSnapshot<T>(clients: Clients, body: () => Promise<T>): Promise<T> {
  const id = await clients.test.snapshot()
  try {
    return await body()
  } finally {
    await clients.test.revert({ id })
  }
}

async function tokenBalance(clients: Clients, d: Deployment, who: Address): Promise<bigint> {
  return (await clients.public.readContract({ address: d.addresses.testToken, abi: testTokenAbi, functionName: 'balanceOf', args: [who] })) as bigint
}

async function poolBuy(clients: Clients, d: Deployment, who: Address, eth: bigint): Promise<bigint> {
  const before = await tokenBalance(clients, d, who)
  await send(clients, { from: who, address: d.addresses.pool, abi: poolAbi, functionName: 'buyTokens', args: [0n], value: eth })
  return (await tokenBalance(clients, d, who)) - before
}

async function poolOutcome(clients: Clients, d: Deployment, cast: Cast): Promise<PoolOutcome> {
  const alone = await withSnapshot(clients, () => poolBuy(clients, d, cast.victim, VICTIM_ETH))
  return withSnapshot(clients, async () => {
    const attackerTokens = await poolBuy(clients, d, cast.attacker, FRONT_RUN_ETH)
    const victimTokens = await poolBuy(clients, d, cast.victim, VICTIM_ETH)
    await send(clients, { from: cast.attacker, address: d.addresses.testToken, abi: testTokenAbi, functionName: 'approve', args: [d.addresses.pool, attackerTokens] })
    const { result } = await clients.public.simulateContract({
      account: cast.attacker,
      address: d.addresses.pool,
      abi: poolAbi,
      functionName: 'sellTokens',
      args: [attackerTokens, 0n],
    })
    const back = result as bigint
    await send(clients, { from: cast.attacker, address: d.addresses.pool, abi: poolAbi, functionName: 'sellTokens', args: [attackerTokens, 0n] })
    return {
      victimTokensAlone: alone.toString(),
      victimTokensSandwiched: victimTokens.toString(),
      attackerTokens: attackerTokens.toString(),
      attackerEthBack: back.toString(),
      attackerProfitWei: (back - FRONT_RUN_ETH).toString(),
    }
  })
}

type Leg = { who: Address; isBuy: boolean; limit: bigint; quantity: bigint }

function background(cast: Cast): Leg[] {
  return [
    { who: cast.maker1, isBuy: false, limit: 10n * MILLI, quantity: 10n * T },
    { who: cast.maker2, isBuy: false, limit: 11n * MILLI, quantity: 10n * T },
    { who: cast.maker3, isBuy: false, limit: 12n * MILLI, quantity: 10n * T },
    { who: cast.maker1, isBuy: false, limit: 13n * MILLI, quantity: 10n * T },
    { who: cast.maker3, isBuy: true, limit: 9n * MILLI, quantity: 5n * T },
  ]
}

async function balancesOf(clients: Clients, d: Deployment, who: Address): Promise<{ base: bigint; quote: bigint }> {
  return (await clients.public.readContract({ address: d.addresses.anyOrder, abi: anyOrderAbi, functionName: 'balances', args: [who] })) as {
    base: bigint
    quote: bigint
  }
}

/** Runs one batch from a fresh batch boundary: places `legs` in order, clears, claims every order. */
async function runBatch(clients: Clients, d: Deployment, cast: Cast, legs: Leg[]) {
  const exchange = d.addresses.anyOrder
  const now = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'currentBatch' })) as bigint
  const open = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [now] })) as { end: bigint }
  await clients.test.setNextBlockTimestamp({ timestamp: open.end })
  await clients.test.mine({ blocks: 1 })
  const batch = now + 1n
  const before = new Map<Address, { base: bigint; quote: bigint }>()
  for (const leg of legs) before.set(leg.who, await balancesOf(clients, d, leg.who))
  const indices: bigint[] = []
  for (const leg of legs) {
    await send(clients, { from: leg.who, address: exchange, abi: anyOrderAbi, functionName: leg.isBuy ? 'placeBuy' : 'placeSell', args: [leg.limit, leg.quantity] })
    indices.push(BigInt(indices.length))
  }
  const placed = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })) as { end: bigint }
  await clients.test.setNextBlockTimestamp({ timestamp: placed.end })
  await clients.test.mine({ blocks: 1 })
  await send(clients, { from: cast.deployer, address: exchange, abi: anyOrderAbi, functionName: 'clear', args: [batch] })
  for (const index of indices) {
    await send(clients, { from: cast.deployer, address: exchange, abi: anyOrderAbi, functionName: 'claim', args: [batch, index] })
  }
  const info = (await clients.public.readContract({ address: exchange, abi: anyOrderAbi, functionName: 'batchInfo', args: [batch] })) as {
    price: bigint
  }
  const change = async (who: Address) => {
    const after = await balancesOf(clients, d, who)
    const start = before.get(who) ?? { base: 0n, quote: 0n }
    return { base: after.base - start.base, quote: after.quote - start.quote }
  }
  return { batch, price: info.price, change }
}

async function batchOutcome(clients: Clients, d: Deployment, cast: Cast, legs: Leg[]) {
  const r = await runBatch(clients, d, cast, legs)
  const victim = await r.change(cast.victim)
  const attacker = await r.change(cast.attacker)
  return {
    batch: r.batch.toString(),
    price: r.price.toString(),
    victimTokens: victim.base.toString(),
    victimPaidWei: (-victim.quote).toString(),
    attacker,
  }
}

export async function runSandwich(clients: Clients, d: Deployment): Promise<SandwichResult> {
  const cast = castOf(d)
  const block = await clients.public.getBlockNumber()
  return withSnapshot(clients, async () => {
    const pool = await poolOutcome(clients, d, cast)
    const attackerTokens = BigInt(pool.attackerTokens)
    const victim: Leg = { who: cast.victim, isBuy: true, limit: VICTIM_LIMIT, quantity: VICTIM_QUANTITY }
    const front: Leg = { who: cast.attacker, isBuy: true, limit: ATTACKER_BUY_LIMIT, quantity: attackerTokens }
    const back: Leg = { who: cast.attacker, isBuy: false, limit: ATTACKER_SELL_LIMIT, quantity: attackerTokens }
    const push: Leg = { who: cast.attacker, isBuy: true, limit: ATTACKER_BUY_LIMIT, quantity: ONE_SIDED_QUANTITY }
    const alone = await withSnapshot(clients, () => batchOutcome(clients, d, cast, [...background(cast), victim]))
    const sandwiched = await withSnapshot(clients, () => batchOutcome(clients, d, cast, [...background(cast), front, victim, back]))
    const oneSided = await withSnapshot(clients, () => batchOutcome(clients, d, cast, [...background(cast), push, victim]))
    const { attacker: _a, ...aloneRow } = alone
    const { attacker: s, ...sandwichedRow } = sandwiched
    const { attacker: o, ...oneSidedRow } = oneSided
    return {
      block: block.toString(),
      pool,
      batchAlone: aloneRow,
      batchSandwiched: { ...sandwichedRow, attackerTokenChange: s.base.toString(), attackerWeiChange: s.quote.toString() },
      oneSided: { ...oneSidedRow, attackerTokens: o.base.toString(), attackerPaidWei: (-o.quote).toString() },
    }
  })
}
