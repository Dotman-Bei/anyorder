/**
 * dapp:12: the link-preview image is a still of the real built landing page.
 * Builds dist/, serves it on 127.0.0.1, opens / in headless Chrome launched the
 * way the design skill's gate launches it (scripts/lib/chrome.ts), lays the
 * page out at 1440 x 756 (the desktop width the gate judges, at 1200 x 630's
 * ratio), waits for the fonts and the hero's entrance, and captures the first
 * screen scaled to 1200 x 630 as JPEG into public/share.jpg, lowering the
 * quality in steps until the file is under 300 KB. Nothing is drawn or
 * generated: the pixels are the page's.
 *
 * dapp:15: the check also proves both pages' share meta: og:image and
 * twitter:image are absolute URLs on the real domain, og:url and the canonical
 * link name each page's own URL, and no root-relative image URL is left.
 *
 *   pnpm -C web exec tsx scripts/share-image.ts           capture, then check
 *   pnpm -C web exec tsx scripts/share-image.ts --check   check the committed image and meta only
 *   last line: SHARE: OK 1200x630 <bytes> bytes, meta on / and /app/
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { launchChrome, serveDir } from './lib/chrome'
import { runChecked } from './lib/proc'
import { WEB_DIR } from './lib/repo'

const OUT = join(WEB_DIR, 'public', 'share.jpg')
const MAX_BYTES = 300 * 1024
const WIDTH = 1200
const HEIGHT = 630
const LAYOUT_WIDTH = 1440
const LAYOUT_HEIGHT = 756
const SETTLE_MS = 4000

/** Width and height from a JPEG's start-of-frame segment, or null when the bytes are not a JPEG. */
function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null
    const marker = buf[i + 1] ?? 0
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      i += 2
      continue
    }
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  return null
}

/** The domain the site is served on (Vercel, dapp:15). */
const SITE = 'https://anyorder.suitz.xyz'

/** Each page's file, its URL path and its own og:title. */
const PAGES = [
  { file: 'index.html', name: 'web/index.html', path: '/', title: 'AnyOrder: a batch-auction exchange for Ethereum traders' },
  { file: join('app', 'index.html'), name: 'web/app/index.html', path: '/app/', title: 'AnyOrder: a batch exchange for Ethereum traders' },
] as const

/** The share lines each page must carry, exactly. */
function metaFor(page: (typeof PAGES)[number]): string[] {
  return [
    `<meta property="og:title" content="${page.title}">`,
    '<meta property="og:description" content="One clearing price per batch, computed by the contract, whatever order the transactions arrive in.">',
    `<meta property="og:url" content="${SITE}${page.path}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta property="og:image" content="${SITE}/share.jpg">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="The AnyOrder landing page: a one-price batch exchange for Ethereum traders, beside a recorded cleared batch.">',
    `<meta name="twitter:image" content="${SITE}/share.jpg">`,
    `<link rel="canonical" href="${SITE}${page.path}">`,
  ]
}

function check(): boolean {
  if (!existsSync(OUT)) {
    console.log('SHARE: FAIL (web/public/share.jpg is missing)')
    return false
  }
  const buf = readFileSync(OUT)
  const size = jpegSize(buf)
  if (!size || size.width !== WIDTH || size.height !== HEIGHT) {
    console.log(`SHARE: FAIL (share.jpg is ${size ? `${size.width}x${size.height}` : 'not a JPEG'}, want ${WIDTH}x${HEIGHT})`)
    return false
  }
  if (buf.length >= MAX_BYTES) {
    console.log(`SHARE: FAIL (share.jpg is ${buf.length} bytes, want under ${MAX_BYTES})`)
    return false
  }
  for (const page of PAGES) {
    const html = readFileSync(join(WEB_DIR, page.file), 'utf8')
    const missing = metaFor(page).filter((m) => !html.includes(m))
    if (missing.length > 0) {
      console.log(`SHARE: FAIL (${page.name} lacks ${missing.join(' ')})`)
      return false
    }
    const relative = /<meta (?:property|name)="(?:og|twitter):image" content="\//.exec(html)
    if (relative) {
      console.log(`SHARE: FAIL (${page.name} still has a root-relative share image: ${relative[0]})`)
      return false
    }
  }
  console.log(`SHARE: OK ${size.width}x${size.height} ${buf.length} bytes, meta on / and /app/`)
  return true
}

async function capture(): Promise<void> {
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], { cwd: WEB_DIR })
  await runChecked(process.execPath, [join(WEB_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { cwd: WEB_DIR })
  const server = await serveDir(join(WEB_DIR, 'dist'))
  const browser = await launchChrome(LAYOUT_WIDTH, LAYOUT_HEIGHT)
  try {
    await browser.page.goto(`${server.url}/`)
    await browser.page.evaluate('document.fonts.ready.then(() => true)')
    await new Promise((r) => setTimeout(r, SETTLE_MS))
    const clip = { x: 0, y: 0, width: LAYOUT_WIDTH, height: LAYOUT_HEIGHT, scale: WIDTH / LAYOUT_WIDTH }
    for (const quality of [86, 80, 74, 68, 62, 56, 50]) {
      const shot = await browser.page.send<{ data: string }>('Page.captureScreenshot', { format: 'jpeg', quality, clip })
      const buf = Buffer.from(shot.data, 'base64')
      if (buf.length < MAX_BYTES) {
        writeFileSync(OUT, buf)
        console.log(`captured / at ${LAYOUT_WIDTH}x${LAYOUT_HEIGHT}, quality ${quality}`)
        return
      }
    }
    throw new Error('no quality down to 50 brought share.jpg under 300 KB')
  } finally {
    await browser.close()
    await server.close()
  }
}

async function main(): Promise<boolean> {
  if (!process.argv.includes('--check')) await capture()
  return check()
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error: unknown) => {
    console.log(`SHARE: ERROR (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`)
    process.exit(2)
  })
