/**
 * dapp:13: the one-command local run really serves the app, and stopping it
 * really stops Anvil and Vite. Starts `pnpm -C web local` on two free ports,
 * waits until / and /app/ answer 200 with their own page (Vite would answer
 * any path with the landing page, so each page's <title> is checked) and
 * /deployment.json names the chosen RPC, finds the run's Anvil and local.ts
 * processes, then closes the command's input (local.ts's stop path, the same
 * one Ctrl+C takes) and proves the command exited, both ports refuse
 * connections and none of those processes is left. web/public/deployment.json
 * is put back as it was.
 *
 *   pnpm -C web exec tsx scripts/local-check.ts
 *   last line: LOCAL: OK
 */
import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, connect } from 'node:net'
import { join } from 'node:path'
import { run } from './lib/proc'
import { REPO_ROOT, WEB_DIR } from './lib/repo'

const READY_MS = 240_000
const STOP_MS = 20_000
const DEPLOYMENT = join(WEB_DIR, 'public', 'deployment.json')

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** A port nothing listens on right now: the OS picks it. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => (typeof address === 'object' && address !== null ? resolve(address.port) : reject(new Error('no port'))))
    })
  })
}

/** True when something accepts a TCP connection on 127.0.0.1:port. */
function listening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = connect(port, '127.0.0.1')
    socket.setTimeout(1000)
    socket.once('connect', () => (socket.destroy(), resolve(true)))
    socket.once('error', () => resolve(false))
    socket.once('timeout', () => (socket.destroy(), resolve(false)))
  })
}

/** Every running process as "pid command line". */
async function processList(): Promise<string[]> {
  const result =
    process.platform === 'win32'
      ? await run('powershell.exe', ['-NoProfile', '-Command', "Get-CimInstance Win32_Process | ForEach-Object { [string]$_.ProcessId + ' ' + $_.CommandLine }"])
      : await run('ps', ['-eo', 'pid=,args='])
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== '')
}

/** This run's Anvil and its local.ts processes, matched by the ports on their command lines. */
async function leftovers(anvilPort: number): Promise<{ anvil: string[]; local: string[] }> {
  const lines = await processList()
  return {
    anvil: lines.filter((l) => /anvil/i.test(l) && l.includes(`--port ${anvilPort}`) && !l.includes('--anvil-port')),
    local: lines.filter((l) => l.includes('local.ts') && l.includes(`--anvil-port ${anvilPort}`)),
  }
}

/** What a failed check must not leave behind: the command it started and the ports it chose. */
const launched: { child?: ChildProcess; anvilPort?: number } = {}

/** After a FAIL: ends the command's process tree and anything of this run still holding its ports. */
async function cleanUp(): Promise<void> {
  const { child, anvilPort } = launched
  if (child?.pid !== undefined && child.exitCode === null) {
    if (process.platform === 'win32') await run('taskkill', ['/pid', String(child.pid), '/t', '/f'])
    else child.kill('SIGKILL')
  }
  if (anvilPort === undefined) return
  const left = await leftovers(anvilPort)
  for (const line of [...left.anvil, ...left.local]) {
    try {
      process.kill(Number(line.split(' ')[0]))
    } catch {
      // already gone
    }
  }
}

function title(file: string): string {
  const match = /<title>([^<]+)<\/title>/.exec(readFileSync(join(WEB_DIR, file), 'utf8'))
  if (!match?.[1]) throw new Error(`${file} has no <title>`)
  return match[1]
}

async function page(url: string, want: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    const body = await response.text()
    if (response.status !== 200) return `${url} answered ${response.status}`
    return body.includes(`<title>${want}</title>`) ? null : `${url} is not the page titled "${want}"`
  } catch {
    return `${url} does not answer`
  }
}

async function deploymentProblem(url: string, rpcUrl: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (response.status !== 200) return `${url} answered ${response.status}`
    const value = JSON.parse(await response.text()) as { rpcUrl?: unknown; chainId?: unknown; addresses?: { anyOrder?: unknown } }
    if (value.rpcUrl !== rpcUrl) return `${url} names ${String(value.rpcUrl)}, not ${rpcUrl}`
    if (value.chainId !== 31337) return `${url} has chainId ${String(value.chainId)}`
    if (typeof value.addresses?.anyOrder !== 'string') return `${url} has no AnyOrder address`
    return null
  } catch (error) {
    return `${url}: ${error instanceof Error ? error.message : String(error)}`
  }
}

async function check(): Promise<string> {
  const anvilPort = await freePort()
  let webPort = await freePort()
  while (webPort === anvilPort) webPort = await freePort()
  const args = ['-C', 'web', 'local', '--anvil-port', String(anvilPort), '--port', String(webPort)]
  console.log(`local-check: pnpm ${args.join(' ')}`)
  // pnpm is a .cmd shim on Windows: start it through cmd.exe. Every argument is
  // free of spaces; the spaced repository path is only the working directory.
  const child =
    process.platform === 'win32'
      ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', 'pnpm', ...args], { cwd: REPO_ROOT, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
      : spawn('pnpm', args, { cwd: REPO_ROOT, stdio: ['pipe', 'pipe', 'pipe'] })
  launched.child = child
  launched.anvilPort = anvilPort
  let output = ''
  child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()))
  child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()))
  let exitCode: number | null = null
  const exited = new Promise<void>((resolve) => child.once('exit', (code) => ((exitCode = code ?? 1), resolve())))
  const lastLines = () => output.trim().split(/\r?\n/).slice(-3).join(' | ')

  const base = `http://127.0.0.1:${webPort}`
  const rpcUrl = `http://127.0.0.1:${anvilPort}`
  const landingTitle = title('index.html')
  const appTitle = title(join('app', 'index.html'))
  const started = Date.now()
  let problem: string | null = 'not started'
  while (Date.now() - started < READY_MS) {
    if (exitCode !== null) throw new Error(`pnpm -C web local exited ${exitCode} before serving: ${lastLines()}`)
    problem =
      (await page(`${base}/`, landingTitle)) ??
      (await page(`${base}/app/`, appTitle)) ??
      (await deploymentProblem(`${base}/deployment.json`, rpcUrl))
    if (problem === null) break
    await sleep(1000)
  }
  if (problem !== null) {
    child.stdin.end()
    throw new Error(`not serving after ${READY_MS / 1000} s (${problem}): ${lastLines()}`)
  }
  const ready = Math.round((Date.now() - started) / 1000)
  const before = await leftovers(anvilPort)
  console.log(`local-check: serving after ${ready} s: / and /app/ 200, deployment.json names ${rpcUrl}`)
  console.log(`local-check: running: ${before.anvil.length} Anvil, ${before.local.length} local.ts process(es)`)
  if (before.anvil.length === 0 || before.local.length === 0) {
    child.stdin.end()
    throw new Error('could not find the run\'s Anvil and local.ts processes, so their exit cannot be proved')
  }

  child.stdin.end()
  const stopStart = Date.now()
  await Promise.race([exited, sleep(STOP_MS)])
  if (exitCode === null) throw new Error(`pnpm -C web local still running ${STOP_MS / 1000} s after its input closed`)
  await sleep(1000)
  const after = await leftovers(anvilPort)
  const gone: string[] = []
  if (await listening(anvilPort)) gone.push(`Anvil port ${anvilPort} still accepts connections`)
  if (await listening(webPort)) gone.push(`Vite port ${webPort} still accepts connections`)
  for (const line of [...after.anvil, ...after.local]) gone.push(`left running: ${line}`)
  if (gone.length > 0) throw new Error(gone.join('; '))
  if (exitCode !== 0) throw new Error(`pnpm -C web local exited ${exitCode} on stop: ${lastLines()}`)
  return `stopped in ${Math.round((Date.now() - stopStart) / 1000)} s with exit 0; Anvil and Vite gone`
}

async function main(): Promise<boolean> {
  const saved = existsSync(DEPLOYMENT) ? readFileSync(DEPLOYMENT) : null
  try {
    const detail = await check()
    console.log(`local-check: ${detail}`)
    console.log('LOCAL: OK')
    return true
  } catch (error) {
    await cleanUp()
    console.log(`LOCAL: FAIL (${error instanceof Error ? error.message : String(error)})`)
    return false
  } finally {
    if (saved !== null) writeFileSync(DEPLOYMENT, saved)
    else rmSync(DEPLOYMENT, { force: true })
  }
}

main().then((ok) => process.exit(ok ? 0 : 1))
