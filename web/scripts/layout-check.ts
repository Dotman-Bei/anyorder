/**
 * dapp:17: the closing footer never paints the giant name over its links.
 * Builds dist/, serves it on 127.0.0.1 and opens / and /app/ in the headless
 * Chrome the other checks use (scripts/lib/chrome.ts), at each size below.
 * Motion is reduced (prefers-reduced-motion) and the page is scrolled to the
 * foot, so every box is measured where it comes to rest. On / it asserts:
 *   - .close__word does not intersect .closing__links;
 *   - no two visible text boxes inside footer.closing intersect;
 *   - the footer is at least one screen tall, and exactly one screen at
 *     1920x1080 and 1440x900, where its content fits;
 *   - no horizontal scroll.
 * On /app/: no two visible text boxes of its footer intersect, and no
 * horizontal scroll.
 *
 *   pnpm -C web exec tsx scripts/layout-check.ts      last line: LAYOUT: PASS (...)
 */
import { join } from 'node:path'
import { launchChrome, serveDir } from './lib/chrome'
import { runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'

const SIZES: ReadonlyArray<readonly [number, number]> = [
  [1920, 1080],
  [1536, 730],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1280, 600],
  [1100, 700],
  [390, 844],
]
/** Sizes where the footer's content fits one screen, so the footer must stay exactly one screen. */
const ONE_SCREEN = new Set(['1920x1080', '1440x900'])
const SETTLE_MS = 900

interface Measure {
  innerWidth: number
  innerHeight: number
  scrollWidth: number
  footerHeight: number | null
  wordOverLinks: number | null
  textOverlaps: string[]
}

/** Runs in the page: boxes of the closing footer, and every pair of its text boxes that intersect. */
const MEASURE = `(() => {
  const r = (el) => el.getBoundingClientRect()
  const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1
  const visible = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
    }
    return true
  }
  const footer = document.querySelector('footer.closing') || document.querySelector('footer')
  const boxes = []
  if (footer) {
    const walk = document.createTreeWalker(footer, NodeFilter.SHOW_TEXT)
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim() || !visible(n.parentElement)) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const b of range.getClientRects()) {
        if (b.width > 0 && b.height > 0) boxes.push({ text: n.textContent.trim().slice(0, 24), b })
      }
    }
  }
  const textOverlaps = []
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      if (boxes[i].text !== boxes[j].text && hit(boxes[i].b, boxes[j].b)) textOverlaps.push('"' + boxes[i].text + '" / "' + boxes[j].text + '"')
  const word = document.querySelector('footer.closing .close__word')
  const links = document.querySelector('footer.closing .closing__links')
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    footerHeight: footer ? Math.round(r(footer).height) : null,
    wordOverLinks: word && links ? Math.round(r(word).bottom - r(links).top) : null,
    textOverlaps,
  }
})()`

async function main(): Promise<boolean> {
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: WEB_DIR })
  const server = await serveDir(join(WEB_DIR, 'dist'))
  const browser = await launchChrome(1920, 1080)
  const problems: string[] = []
  let checks = 0
  try {
    const page = browser.page
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
    for (const [width, height] of SIZES) {
      await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
      for (const path of ['/', '/app/']) {
        await page.goto(`${server.url}${path}`)
        await page.evaluate('document.fonts.ready.then(() => true)')
        await page.evaluate('(window.scrollTo(0, document.documentElement.scrollHeight), true)')
        await new Promise((r) => setTimeout(r, SETTLE_MS))
        const m = await page.evaluate<Measure>(MEASURE)
        const at = `${path} ${width}x${height}`
        checks += 1
        if (m.scrollWidth > m.innerWidth) problems.push(`${at}: horizontal scroll (${m.scrollWidth} > ${m.innerWidth})`)
        for (const o of m.textOverlaps) problems.push(`${at}: footer text overlaps: ${o}`)
        if (path === '/') {
          if (m.wordOverLinks === null || m.footerHeight === null) problems.push(`${at}: no .close__word or .closing__links`)
          else {
            if (m.wordOverLinks > 0) problems.push(`${at}: .close__word overlaps .closing__links by ${m.wordOverLinks}px`)
            if (width >= 640 && m.footerHeight < m.innerHeight - 1) problems.push(`${at}: footer ${m.footerHeight}px is shorter than one screen`)
            if (ONE_SCREEN.has(`${width}x${height}`) && Math.abs(m.footerHeight - m.innerHeight) > 1) {
              problems.push(`${at}: footer ${m.footerHeight}px, want exactly one screen (${m.innerHeight}px)`)
            }
          }
          console.log(`layout: ${at} footer ${m.footerHeight}px, word-bottom minus links-top ${m.wordOverLinks}px`)
        }
      }
    }
  } finally {
    await browser.close()
    await server.close()
  }
  for (const p of problems) console.log(`FAIL ${p}`)
  if (problems.length > 0) {
    console.log(`LAYOUT: FAIL (${problems.length} problem(s) in ${checks} page loads)`)
    return false
  }
  console.log(`LAYOUT: PASS (${SIZES.length} sizes, / and /app/: no footer overlap, no horizontal scroll)`)
  return true
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error: unknown) => {
    console.log(`LAYOUT: ERROR (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    process.exit(2)
  })
