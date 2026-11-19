// Capture helpers: Playwright's own Chromium, fresh temporary profile (never the user's Chrome),
// 1920x1080 @ DPR 1, page.screencast JPEG frames -> constant-fps H.264 via ffmpeg.
import { chromium } from 'playwright'
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const BASE = 'http://127.0.0.1:5173'
export const RPC = 'http://127.0.0.1:8545'
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function openBrowser() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  // A visible pointer and click ripple, so a viewer can follow real mouse actions.
  await context.addInitScript(() => {
    const mk = () => {
      if (document.getElementById('__cur')) return
      const cur = document.createElement('div')
      cur.id = '__cur'
      cur.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)'
      cur.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M3 2l17 8-7 2.5L10 20z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>'
      document.documentElement.appendChild(cur)
      addEventListener('mousemove', (e) => { cur.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)` }, true)
      addEventListener('mousedown', (e) => {
        const r = document.createElement('div')
        r.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:44px;height:44px;border-radius:50%;border:3px solid #b8935a;z-index:2147483646;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out`
        document.documentElement.appendChild(r)
        requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0' })
        setTimeout(() => r.remove(), 600)
      }, true)
    }
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk)
    else mk()
  })
  return { browser, context }
}

// Warm the cache (fonts, scripts) so the recorded load does not flash a fallback font.
export async function warm(context, path) {
  const p = await context.newPage()
  await p.goto(BASE + path, { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.close()
}

export async function smoothScroll(page, y, ms) {
  await page.evaluate(([to, dur]) => new Promise((res) => {
    const from = scrollY, t0 = performance.now()
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur)
      scrollTo(0, from + (to - from) * ease(t))
      t < 1 ? requestAnimationFrame(step) : res()
    }
    requestAnimationFrame(step)
  }), [y, ms])
}

export async function moveTo(page, locator, ms = 700) {
  const box = await locator.boundingBox()
  if (!box) throw new Error('no box to move to')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: Math.max(8, Math.round(ms / 16)) })
}

export async function clickReal(page, locator) {
  await locator.scrollIntoViewIfNeeded()
  await moveTo(page, locator)
  await sleep(250)
  await page.mouse.down()
  await sleep(80)
  await page.mouse.up()
}

// Records page.screencast frames while `fn` runs; encodes constant 30 fps H.264. Returns {file, seconds, result}.
export async function recordScene(page, outDir, name, fn) {
  mkdirSync(outDir, { recursive: true })
  const frames = join(outDir, `${name}.frames`)
  rmSync(frames, { recursive: true, force: true })
  mkdirSync(frames, { recursive: true })
  const times = []
  let n = 0
  const t0 = performance.now()
  await page.screencast.start({
    size: { width: 1920, height: 1080 },
    quality: 95,
    onFrame: ({ data }) => {
      const i = n++
      writeFileSync(join(frames, `f${String(i).padStart(6, '0')}.jpg`), data)
      times.push((performance.now() - t0) / 1000)
    },
  })
  let result, err
  try { result = await fn() } catch (e) { err = e }
  await sleep(300)
  await page.screencast.stop()
  if (err) { rmSync(frames, { recursive: true, force: true }); throw err }
  const end = (performance.now() - t0) / 1000
  const lines = ['ffconcat version 1.0']
  for (let i = 0; i < times.length; i++) {
    const next = i + 1 < times.length ? times[i + 1] : end
    lines.push(`file f${String(i).padStart(6, '0')}.jpg`, `duration ${Math.max(0.001, next - times[i]).toFixed(4)}`)
  }
  lines.push(`file f${String(times.length - 1).padStart(6, '0')}.jpg`)
  writeFileSync(join(frames, 'list.txt'), lines.join('\n') + '\n')
  const file = join(outDir, `${name}.mp4`)
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-movflags', '+faststart', file], { cwd: frames })
  if (r.status !== 0) throw new Error('ffmpeg encode failed: ' + r.stderr?.toString())
  rmSync(frames, { recursive: true, force: true })
  return { file, seconds: end, frames: times.length, result }
}

export async function rpc(method, params = []) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
  return (await r.json()).result
}

export function nextTake(outDir, id) {
  mkdirSync(outDir, { recursive: true })
  const taken = readdirSync(outDir).filter((f) => new RegExp(`^${id}-take\\d+\\.mp4$`).test(f)).length
  return taken + 1
}

export function saveReport(outDir, name, report) {
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(report, null, 2) + '\n')
}

export function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,duration', '-of', 'json', file])
  return JSON.parse(r.stdout.toString()).streams[0]
}
export { existsSync }
