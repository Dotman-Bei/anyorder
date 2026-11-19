/**
 * dapp:11's check on a real idle chain. Builds dist/, deploys to its own Anvil
 * (127.0.0.1:8547, one-hour batches, so nothing is mined while it waits; a dev
 * chain on 8545 is never touched) and opens the built /app in headless Chrome.
 *
 *   1. The hero must show live data within 30 s.
 *   2. For 30 s no transaction is sent: the chain answers every poll with the
 *      same block. Sampled every second, no island may show any chain notice
 *      (stale, loading, unavailable, not deployed).
 *   3. Anvil is stopped: within 20 s the page must say the chain is unavailable.
 *
 *   pnpm -C web exec tsx scripts/idle-check.ts
 *   last line: IDLE: OK (30 s idle: live, no stale notice; RPC stopped: unavailable)
 */
import { join } from 'node:path'
import { startAnvil } from './lib/anvil'
import { launchChrome, serveDir } from './lib/chrome'
import { runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

const IDLE_SECONDS = 30
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

interface View {
  live: boolean
  notices: string[]
}

const READ = `(() => ({
  live: document.querySelector('[data-island="batch"] .batch-live') !== null,
  notices: [...document.querySelectorAll('.chain-notice')].map((n) => n.getAttribute('data-state') ?? '?'),
}))()`

async function main(): Promise<boolean> {
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], { cwd: WEB_DIR })
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: WEB_DIR })
  const anvil = await startAnvil(8547)
  let anvilUp = true
  const server = await serveDir(join(WEB_DIR, 'dist'))
  const browser = await launchChrome(1440, 900)
  try {
    await deployLocal(anvil.rpcUrl, join(WEB_DIR, 'dist', 'deployment.json'), 3600)
    const rpc = async (method: string): Promise<string> => {
      const r = await fetch(anvil.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [] }) })
      return ((await r.json()) as { result: string }).result
    }
    await browser.page.goto(`${server.url}/app/`)
    let view: View = { live: false, notices: [] }
    for (let i = 0; i < 60 && !(view.live && view.notices.length === 0); i++) {
      await sleep(500)
      view = await browser.page.evaluate<View>(READ)
    }
    if (!view.live) {
      console.log(`IDLE: FAIL (the hero never went live; notices: ${view.notices.join(', ') || 'none'})`)
      return false
    }
    const startBlock = await rpc('eth_blockNumber')
    console.log(`live at block ${Number(startBlock)}; idling ${IDLE_SECONDS} s`)
    for (let s = 1; s <= IDLE_SECONDS; s++) {
      await sleep(1000)
      view = await browser.page.evaluate<View>(READ)
      if (!view.live || view.notices.length > 0) {
        console.log(`IDLE: FAIL (after ${s} s idle: live=${String(view.live)}, notices: ${view.notices.join(', ') || 'none'})`)
        return false
      }
    }
    const endBlock = await rpc('eth_blockNumber')
    if (endBlock !== startBlock) {
      console.log(`IDLE: FAIL (the chain was not idle: block ${Number(startBlock)} -> ${Number(endBlock)})`)
      return false
    }
    console.log(`${IDLE_SECONDS} s idle at block ${Number(endBlock)}: live, no chain notice`)
    await anvil.stop()
    anvilUp = false
    for (let s = 1; s <= 20; s++) {
      await sleep(1000)
      view = await browser.page.evaluate<View>(READ)
      if (view.notices.includes('unavailable')) {
        console.log(`RPC stopped: unavailable after ${s} s`)
        console.log(`IDLE: OK (${IDLE_SECONDS} s idle: live, no stale notice; RPC stopped: unavailable)`)
        return true
      }
    }
    console.log(`IDLE: FAIL (20 s after the RPC stopped the page shows: ${view.notices.join(', ') || 'no notice'})`)
    return false
  } finally {
    await browser.close()
    await server.close()
    if (anvilUp) await anvil.stop()
  }
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error: unknown) => {
    console.log(`IDLE: ERROR (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    process.exit(2)
  })
