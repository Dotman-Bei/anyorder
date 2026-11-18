/**
 * The single gate command of every UI task:
 *
 *   pnpm -C web ui-gate landing     the landing page, dist/index.html
 *   pnpm -C web ui-gate app         the dApp, dist/app/index.html, against a seeded chain
 *
 * 1. Builds dist/ (tsc + vite build).
 * 2. app only: starts its own Anvil on 127.0.0.1:8546 (a dev chain on 8545 is
 *    never touched), builds and deploys the contracts, funds the traders,
 *    seeds the demo state with one-hour batches (so nothing changes during the
 *    check) and writes dist/deployment.json for the built app to read.
 * 3. Arms the design-taste-frontend finish gate for this page unless a build
 *    for this page is already open in web/.taste-skill/ (git-ignored).
 * 4. Runs the skill's gate.mjs on the built page, prints its output, stops
 *    Anvil, and exits with the gate's code. Its last line is the verdict:
 *    "GATE: PASS" is the only accepted result.
 *
 * The skill is never copied into the repo: gate.mjs runs from the skill's
 * install folder (~/.claude/skills/design-taste-frontend).
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { type Anvil, startAnvil } from './lib/anvil'
import { run, runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

const GATE = join(homedir(), '.claude', 'skills', 'design-taste-frontend', 'scripts', 'gate.mjs')
const CATEGORY = 'a batch-auction exchange for Ethereum traders'
const PAGES = {
  landing: { page: 'dist/index.html', primary: 'Open the app' },
  app: { page: 'dist/app/index.html', primary: 'Place an order' },
} as const
type PageName = keyof typeof PAGES

function openBuildPage(): string | null | undefined {
  const marker = join(WEB_DIR, '.taste-skill', 'build.json')
  if (!existsSync(marker)) return undefined
  try {
    const page = (JSON.parse(readFileSync(marker, 'utf8')) as { page?: string | null }).page
    return typeof page === 'string' ? page.replace(/\\/g, '/') : null
  } catch {
    return null
  }
}

async function main(): Promise<number> {
  const name = process.argv[2]
  if (name !== 'landing' && name !== 'app') {
    console.log('usage: pnpm -C web ui-gate landing|app')
    return 2
  }
  const target = PAGES[name as PageName]
  if (!existsSync(GATE)) {
    console.log(`GATE: SETUP (the design-taste-frontend skill is not installed at ${GATE})`)
    return 3
  }
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], { cwd: WEB_DIR })
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: WEB_DIR })

  let anvil: Anvil | undefined
  try {
    if (name === 'app') {
      anvil = await startAnvil(8546)
      await deployLocal(anvil.rpcUrl, join(WEB_DIR, 'dist', 'deployment.json'), 3600)
    }
    const open = openBuildPage()
    if (open !== target.page) {
      const arm = ['--start', target.page, '--root', 'dist', '--kind', 'software', '--category', CATEGORY, '--primary', target.primary]
      if (open !== undefined) arm.push('--new')
      await runChecked(process.execPath, [GATE, ...arm], { cwd: WEB_DIR })
    }
    const result = await run(process.execPath, [GATE, target.page, '--root', 'dist'], { cwd: WEB_DIR })
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    return result.code
  } finally {
    await anvil?.stop()
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.log(`GATE: ERROR (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    process.exit(2)
  })
