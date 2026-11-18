/** Repository paths, resolved from this file so the working directory never matters. */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runChecked } from './proc'

export const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const REPO_ROOT = resolve(WEB_DIR, '..')

/** The only contracts the local run deploys. Test harnesses never are. */
export const DEPLOYED = ['AnyOrder', 'TestToken', 'ConstantProductPool'] as const
export type Deployed = (typeof DEPLOYED)[number]

export interface Params {
  maxOrders: number
  demoBatchSize: number
  batchSeconds: number
  minQuantity: string
  maxPrice: string
}

export function readParams(root = REPO_ROOT): Params {
  return JSON.parse(readFileSync(join(root, 'deploy', 'params.json'), 'utf8')) as Params
}

export function bytecode(name: Deployed, outDir = join(REPO_ROOT, 'out')): `0x${string}` {
  return `0x${readFileSync(join(outDir, `${name}.bin`), 'utf8').trim()}`
}

/** Builds every contract with `fe build` into out/ at the repository root. */
export async function feBuild(root = REPO_ROOT): Promise<void> {
  await runChecked('fe', ['build', root, '--out-dir', join(root, 'out')])
}

export async function feVersion(): Promise<string> {
  return (await runChecked('fe', ['--version'])).trim()
}

export async function gitCommit(root = REPO_ROOT): Promise<string> {
  try {
    return (await runChecked('git', ['-C', root, 'rev-parse', '--short', 'HEAD'])).trim()
  } catch {
    return 'uncommitted'
  }
}
