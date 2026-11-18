/**
 * Records the sandwich contrast from a real run on the local chain into
 * public/recorded/sandwich.json, which the landing page shows labelled as a
 * recording. The chain must be running with the contracts deployed
 * (pnpm -C web local, in another terminal).
 *
 *   pnpm -C web scenario
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { clientsFor } from '../src/chain/client'
import { type Deployment, parseDeployment } from '../src/chain/deployment'
import { runSandwich } from '../src/scenario/sandwich'
import { WEB_DIR, feVersion, gitCommit } from './lib/repo'

export const RECORDING = join(WEB_DIR, 'public', 'recorded', 'sandwich.json')

export async function recordScenario(deployment: Deployment, outFile = RECORDING) {
  const result = await runSandwich(clientsFor(deployment.rpcUrl), deployment)
  const record = {
    recordedAt: new Date().toISOString(),
    commit: await gitCommit(),
    feVersion: await feVersion(),
    chainId: deployment.chainId,
    source: 'pnpm -C web scenario on a local Anvil chain (osaka, tx gas cap on)',
    result,
  }
  mkdirSync(join(outFile, '..'), { recursive: true })
  writeFileSync(outFile, `${JSON.stringify(record, null, 2)}\n`)
  return record
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('scenario.ts')) {
  const deployment = parseDeployment(JSON.parse(readFileSync(join(WEB_DIR, 'public', 'deployment.json'), 'utf8')))
  recordScenario(deployment)
    .then((r) => console.log(`recorded sandwich run at block ${r.result.block}`))
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exit(1)
    })
}
