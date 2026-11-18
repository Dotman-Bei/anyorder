/**
 * Builds the contracts and deploys them to an Anvil chain that is already
 * running on 127.0.0.1:8545, funds the built-in traders, seeds the demo state
 * and writes public/deployment.json.
 *
 *   pnpm -C web deploy:local
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { rpcReady } from './lib/anvil'
import { deployAll, fundTraders, seedDemo } from './lib/deploy'
import { WEB_DIR, feBuild, readParams } from './lib/repo'

export const LOCAL_RPC = 'http://127.0.0.1:8545'

export async function deployLocal(rpcUrl = LOCAL_RPC, outFile = join(WEB_DIR, 'public', 'deployment.json'), batchSeconds?: number) {
  if (!(await rpcReady(rpcUrl))) throw new Error(`no Anvil chain (31337) at ${rpcUrl}: start it with pnpm -C web local`)
  await feBuild()
  const params = readParams()
  const deployment = await deployAll(rpcUrl, batchSeconds === undefined ? params : { ...params, batchSeconds })
  await fundTraders(deployment)
  const seeded = await seedDemo(deployment)
  mkdirSync(join(outFile, '..'), { recursive: true })
  writeFileSync(outFile, `${JSON.stringify(deployment, null, 2)}\n`)
  return { deployment, seeded }
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('deploy-local.ts')) {
  deployLocal()
    .then(({ deployment, seeded }) => {
      console.log(`AnyOrder ${deployment.addresses.anyOrder} (batch ${seeded.openBatch} open, ${seeded.clearedBatch} cleared)`)
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
