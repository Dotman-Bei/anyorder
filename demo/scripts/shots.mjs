// Calibration screenshots (not footage): where each target section sits at 1920x1080.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

mkdirSync('capture/calib', { recursive: true })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
const jobs = [
  ['/', 0, 'land-hero'],
  ['/', 2160, 'land-sandwich'],
  ['/', 4320, 'land-fe'],
  ['/app/', 6480, 'app-contact'],
  ['/app/', 4320, 'app-sandwich-a'],
  ['/app/', 5400, 'app-sandwich-b'],
  ['/app/', 1080, 'app-trade'],
  ['/app/', 3240, 'app-settle'],
]
for (const [path, y, name] of jobs) {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:5173' + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.evaluate((yy) => window.scrollTo(0, yy), y)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: `capture/calib/${name}.png` })
  await page.close()
}
await browser.close()
