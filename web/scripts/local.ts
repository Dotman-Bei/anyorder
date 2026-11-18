/**
 * The one-command local run: starts Anvil (Osaka, per-transaction gas cap on)
 * on 127.0.0.1:8545, builds and deploys the contracts, seeds the demo state and
 * serves the app with Vite. Ctrl+C stops everything.
 *
 *   pnpm -C web local
 */
import { createRequire } from 'node:module'
import { startAnvil } from './lib/anvil'
import { start } from './lib/proc'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

const require = createRequire(import.meta.url)

async function main(): Promise<void> {
  const anvil = await startAnvil(8545)
  try {
    const { deployment, seeded } = await deployLocal(anvil.rpcUrl)
    console.log(`Anvil 31337 on ${anvil.rpcUrl}; AnyOrder ${deployment.addresses.anyOrder}; batch ${seeded.openBatch} open`)
    console.log('Built-in traders are Anvil dev accounts. Test funds, no real value.')
  } catch (error) {
    await anvil.stop()
    throw error
  }
  const vite = start(process.execPath, [require.resolve('vite/bin/vite.js'), '--host', '127.0.0.1'], { cwd: WEB_DIR, inherit: true })
  const stop = async () => {
    await vite.stop()
    await anvil.stop()
    process.exit(0)
  }
  process.on('SIGINT', () => void stop())
  process.on('SIGTERM', () => void stop())
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
