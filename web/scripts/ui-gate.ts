/**
 * The single gate command of every UI task:
 *
 *   pnpm -C web ui-gate landing         the landing page, dist/index.html
 *   pnpm -C web ui-gate app             the dApp, dist/app/index.html, against a seeded chain
 *   pnpm -C web ui-gate app --hosted    the dApp as the public host builds it (dapp:14),
 *                                       dist-hosted/app/index.html
 *
 * 1. Builds dist/ (tsc + vite build). A local build runs without VERCEL in its
 *    environment, so it is local wherever it runs; --hosted builds with
 *    VERCEL=1, exactly as Vercel does, which turns hosted mode on, into
 *    dist-hosted/ (git-ignored). Its own folder makes it its own page for the
 *    skill's gate, as landing and app are: alternating it with the local app
 *    build in one folder would spend a round on every run.
 * 2. app only: starts its own Anvil on 127.0.0.1:8546 (a dev chain on 8545 is
 *    never touched), builds and deploys the contracts, funds the traders,
 *    seeds the demo state with one-hour batches (so nothing changes during the
 *    check) and writes dist/deployment.json for the built app to read.
 *    --hosted: no chain at all. It removes dist-hosted/deployment.json (the public host
 *    has none) and checks the built page in headless Chrome
 *    (scripts/lib/hosted-check.ts): last line before the gate's output is
 *    "HOSTED: OK", else "HOSTED: FAIL (...)" and exit 1 without the gate.
 * 3. Arms the design-taste-frontend finish gate for this page unless a build
 *    for this page is already open in web/.taste-skill/ (git-ignored).
 * 4. Runs the skill's gate.mjs on the built page, prints its output, stops
 *    Anvil, and exits with the gate's code. Its last line is the verdict:
 *    "GATE: PASS" is the only accepted result.
 *
 * The skill is never copied into the repo: gate.mjs runs from the skill's
 * install folder (~/.claude/skills/design-taste-frontend).
 */
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { type Anvil, startAnvil } from './lib/anvil'
import { checkHosted } from './lib/hosted-check'
import { run, runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'
import { deployLocal } from './deploy-local'

const GATE = join(homedir(), '.claude', 'skills', 'design-taste-frontend', 'scripts', 'gate.mjs')
const CATEGORY = 'a batch-auction exchange for Ethereum traders'
const PAGES = {
  landing: { page: 'dist/index.html', primary: 'Open the app' },
  app: { page: 'dist/app/index.html', primary: 'Place an order' },
} as const
const HOSTED_PAGE = 'dist-hosted/app/index.html'
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
  const hosted = process.argv.includes('--hosted')
  if ((name !== 'landing' && name !== 'app') || (hosted && name !== 'app')) {
    console.log('usage: pnpm -C web ui-gate landing|app [--hosted, app only]')
    return 2
  }
  const primary = PAGES[name as PageName].primary
  const root = hosted ? 'dist-hosted' : 'dist'
  const page = hosted ? HOSTED_PAGE : PAGES[name as PageName].page
  if (!existsSync(GATE)) {
    console.log(`GATE: SETUP (the design-taste-frontend skill is not installed at ${GATE})`)
    return 3
  }
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], { cwd: WEB_DIR })
  const env: NodeJS.ProcessEnv = { ...process.env }
  if (hosted) env['VERCEL'] = '1'
  else delete env['VERCEL']
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--outDir', root], { cwd: WEB_DIR, env })

  let anvil: Anvil | undefined
  try {
    if (hosted) {
      rmSync(join(WEB_DIR, root, 'deployment.json'), { force: true })
      const problem = await checkHosted(join(WEB_DIR, root))
      if (problem !== null) {
        console.log(`HOSTED: FAIL (${problem})`)
        return 1
      }
      console.log('HOSTED: OK (one hosted notice each in #trade, #book, #settle, #sandwich; static panels, recorded hero and sandwich table kept; no deployment.json or RPC request)')
    } else if (name === 'app') {
      anvil = await startAnvil(8546)
      await deployLocal(anvil.rpcUrl, join(WEB_DIR, 'dist', 'deployment.json'), 3600)
    }
    const open = openBuildPage()
    if (open !== page) {
      const arm = ['--start', page, '--root', root, '--kind', 'software', '--category', CATEGORY, '--primary', primary]
      if (open !== undefined) arm.push('--new')
      await runChecked(process.execPath, [GATE, ...arm], { cwd: WEB_DIR })
    }
    const result = await run(process.execPath, [GATE, page, '--root', root], { cwd: WEB_DIR })
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
