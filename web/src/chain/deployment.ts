/**
 * deployment.json: what the deploy script wrote about the local chain. The app
 * reads every address from it and never invents one.
 */

export type Address = `0x${string}`

export const LOCAL_CHAIN_ID = 31337

export const TRADER_LABELS = ['Maker 1', 'Maker 2', 'Maker 3', 'Victim', 'Attacker'] as const
export type TraderLabel = (typeof TRADER_LABELS)[number]

export interface Trader {
  label: TraderLabel
  address: Address
}

export interface Deployment {
  chainId: number
  rpcUrl: string
  deployer: Address
  traders: Trader[]
  addresses: { anyOrder: Address; testToken: Address; pool: Address }
  genesis: number
  batchSeconds: number
  maxOrders: number
  demoBatchSize: number
  minQuantity: string
  maxPrice: string
  deployBlock: number
  commit: string
  feVersion: string
  deployedAt: string
}

export class DeploymentError extends Error {
  override name = 'DeploymentError'
}

const isAddress = (v: unknown): v is Address => typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v)
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0
const isText = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const isDecimal = (v: unknown): v is string => typeof v === 'string' && /^[0-9]+$/.test(v)

function field<T>(obj: Record<string, unknown>, key: string, ok: (v: unknown) => v is T): T {
  const value = obj[key]
  if (!ok(value)) throw new DeploymentError(`deployment.json: "${key}" is missing or malformed`)
  return value
}

/** Validates the parsed JSON; throws DeploymentError naming the first bad field. */
export function parseDeployment(input: unknown): Deployment {
  if (typeof input !== 'object' || input === null) throw new DeploymentError('deployment.json: not an object')
  const obj = input as Record<string, unknown>
  const addresses = obj['addresses']
  if (typeof addresses !== 'object' || addresses === null) throw new DeploymentError('deployment.json: "addresses" is missing')
  const a = addresses as Record<string, unknown>
  const rawTraders = obj['traders']
  if (!Array.isArray(rawTraders) || rawTraders.length !== TRADER_LABELS.length) {
    throw new DeploymentError('deployment.json: "traders" must list the five built-in traders')
  }
  const traders: Trader[] = rawTraders.map((t: unknown, i: number) => {
    const row = (typeof t === 'object' && t !== null ? t : {}) as Record<string, unknown>
    const label = TRADER_LABELS[i]
    if (label === undefined || row['label'] !== label || !isAddress(row['address'])) {
      throw new DeploymentError(`deployment.json: trader ${i + 1} must be ${String(label)} with an address`)
    }
    return { label, address: row['address'] }
  })
  const chainId = field(obj, 'chainId', isCount)
  if (chainId !== LOCAL_CHAIN_ID) throw new DeploymentError(`deployment.json: chainId ${chainId} is not ${LOCAL_CHAIN_ID}`)
  return {
    chainId,
    rpcUrl: field(obj, 'rpcUrl', isText),
    deployer: field(obj, 'deployer', isAddress),
    traders,
    addresses: {
      anyOrder: field(a, 'anyOrder', isAddress),
      testToken: field(a, 'testToken', isAddress),
      pool: field(a, 'pool', isAddress),
    },
    genesis: field(obj, 'genesis', isCount),
    batchSeconds: field(obj, 'batchSeconds', isCount),
    maxOrders: field(obj, 'maxOrders', isCount),
    demoBatchSize: field(obj, 'demoBatchSize', isCount),
    minQuantity: field(obj, 'minQuantity', isDecimal),
    maxPrice: field(obj, 'maxPrice', isDecimal),
    deployBlock: field(obj, 'deployBlock', isCount),
    commit: field(obj, 'commit', isText),
    feVersion: field(obj, 'feVersion', isText),
    deployedAt: field(obj, 'deployedAt', isText),
  }
}

/** Fetches and validates deployment.json next to the page. */
export async function loadDeployment(url = '/deployment.json', fetcher: typeof fetch = fetch): Promise<Deployment> {
  const response = await fetcher(url, { cache: 'no-store' })
  if (!response.ok) throw new DeploymentError(`deployment.json: HTTP ${response.status}`)
  return parseDeployment(await response.json())
}
