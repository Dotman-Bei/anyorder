// Dumps section ids, headings and buttons of / and /app so scene scripts can target real elements.
import { chromium } from 'playwright'

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
for (const path of ['/', '/app/']) {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:5173' + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const info = await page.evaluate(() => {
    const secs = [...document.querySelectorAll('main > section, footer')].map((s) => ({
      id: s.id, tag: s.tagName, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height),
      h2: (s.querySelector('h1,h2')?.textContent ?? '').trim().slice(0, 90),
    }))
    const btns = [...document.querySelectorAll('button')].map((b) => (b.textContent ?? '').trim().slice(0, 70)).filter(Boolean)
    return { title: document.title, docH: document.documentElement.scrollHeight, secs, btns }
  })
  console.log(path, JSON.stringify(info, null, 1))
  await page.close()
}
await browser.close()
