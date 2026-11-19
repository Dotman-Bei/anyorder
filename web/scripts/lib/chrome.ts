/**
 * Headless Chrome for the repo's own browser checks, launched the way the
 * design skill's checker launches it: the same executable search (CHROME_PATH,
 * then Chrome, then Edge), the same flags (WebGL on the CPU), a temp profile of
 * its own, closed by its own PID. Driven over the DevTools protocol with
 * Node 22's built-in WebSocket. `serveDir` serves a built folder on 127.0.0.1,
 * because Chrome runs no module script from file://.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'

export function findChrome(): string | null {
  const env = process.env.CHROME_PATH
  if (env && existsSync(env)) return env
  const local = process.env.LOCALAPPDATA ?? ''
  const pf = process.env.PROGRAMFILES ?? 'C:\\Program Files'
  const pf86 = process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)'
  const list = [
    join(pf, 'Google/Chrome/Application/chrome.exe'),
    join(pf86, 'Google/Chrome/Application/chrome.exe'),
    join(local, 'Google/Chrome/Application/chrome.exe'),
    join(pf86, 'Microsoft/Edge/Application/msedge.exe'),
    join(pf, 'Microsoft/Edge/Application/msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]
  return list.find((c) => existsSync(c)) ?? null
}

const FLAGS = [
  '--headless=new',
  '--remote-debugging-port=0',
  '--no-first-run',
  '--no-default-browser-check',
  '--mute-audio',
  '--hide-scrollbars',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--disable-features=Translate,MediaRouter',
  '--force-color-profile=srgb',
  '--disable-gpu',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
]

export interface Page {
  send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>
  /** Evaluates an expression in the page (awaiting a returned promise) and returns its JSON value. */
  evaluate<T>(expression: string): Promise<T>
  /** Navigates and resolves once the load event has fired. */
  goto(url: string): Promise<void>
}

export interface Browser {
  page: Page
  close(): Promise<void>
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Starts headless Chrome with one page of `width` x `height` CSS pixels at device scale 1. */
export async function launchChrome(width: number, height: number): Promise<Browser> {
  const exe = findChrome()
  if (!exe) throw new Error('no Chrome, Edge or Chromium found; set CHROME_PATH')
  const profile = mkdtempSync(join(tmpdir(), 'anyorder-chrome-'))
  const child = spawn(exe, [...FLAGS, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], {
    shell: false,
    windowsHide: true,
    stdio: 'ignore',
  })
  const kill = () => {
    if (child.pid !== undefined && child.exitCode === null) {
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      else child.kill('SIGKILL')
    }
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
    } catch {
      // Chrome's helpers can hold the profile a moment longer; the OS temp folder is cleaned later.
    }
  }
  try {
    const portFile = join(profile, 'DevToolsActivePort')
    for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(150)
    if (!existsSync(portFile)) throw new Error('Chrome did not open its DevTools port')
    const port = Number(readFileSync(portFile, 'utf8').split('\n')[0])
    const targets = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[]
    const target = targets.find((t) => t.type === 'page')
    if (!target) throw new Error('Chrome opened no page')
    const ws = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise<void>((ok, fail) => {
      ws.addEventListener('open', () => ok(), { once: true })
      ws.addEventListener('error', () => fail(new Error('DevTools socket failed')), { once: true })
    })
    let nextId = 0
    const pending = new Map<number, { ok: (v: unknown) => void; fail: (e: Error) => void }>()
    const events = new Map<string, (() => void)[]>()
    ws.addEventListener('close', () => {
      for (const call of pending.values()) call.fail(new Error('DevTools socket closed'))
      pending.clear()
    })
    ws.addEventListener('message', (message: MessageEvent) => {
      const data = JSON.parse(String(message.data)) as { id?: number; result?: unknown; error?: { message: string }; method?: string }
      if (data.id !== undefined) {
        const call = pending.get(data.id)
        pending.delete(data.id)
        if (data.error) call?.fail(new Error(data.error.message))
        else call?.ok(data.result)
      } else if (data.method !== undefined) {
        const waiting = events.get(data.method) ?? []
        events.delete(data.method)
        for (const w of waiting) w()
      }
    })
    const send = <T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> =>
      new Promise<T>((ok, fail) => {
        const id = ++nextId
        pending.set(id, { ok: ok as (v: unknown) => void, fail })
        ws.send(JSON.stringify({ id, method, params }))
      })
    const once = (method: string) => new Promise<void>((ok) => events.set(method, [...(events.get(method) ?? []), ok]))
    await send('Page.enable')
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    const page: Page = {
      send,
      async evaluate<T>(expression: string): Promise<T> {
        const r = await send<{ result: { value?: unknown }; exceptionDetails?: { text: string } }>('Runtime.evaluate', {
          expression,
          awaitPromise: true,
          returnByValue: true,
        })
        if (r.exceptionDetails) throw new Error(`page script failed: ${r.exceptionDetails.text}`)
        return r.result.value as T
      },
      async goto(url: string): Promise<void> {
        const loaded = once('Page.loadEventFired')
        await send('Page.navigate', { url })
        await loaded
      },
    }
    return {
      page,
      close: async () => {
        // Chrome may exit without answering Browser.close: wait at most 2 s, then kill it by its PID.
        await Promise.race([send('Browser.close').catch(() => undefined), sleep(2000)])
        ws.close()
        await sleep(300)
        kill()
      },
    }
  } catch (error) {
    kill()
    throw error
  }
}

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

/** Serves `root` read-only on 127.0.0.1 at a free port; a folder serves its index.html. */
export async function serveDir(root: string): Promise<{ url: string; close(): Promise<void> }> {
  const base = resolve(root)
  const server = createServer((req, res) => {
    let file = resolve(base, `.${decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname)}`)
    if (file !== base && !file.startsWith(base + sep)) {
      res.writeHead(403).end()
      return
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
    if (!existsSync(file)) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(readFileSync(file))
  })
  await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok))
  const { port } = server.address() as AddressInfo
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((ok) => {
        server.close(() => ok())
        server.closeAllConnections()
      }),
  }
}
