// Browser scenes, recorded for real against the running local app. Usage:
//   node scripts/capture-browser.mjs A    (S1, S2, S7, S8: read-only pages)
//   node scripts/capture-browser.mjs B    (S4, S5: /app #sandwich, fresh chain)
//   node scripts/capture-browser.mjs C    (S6: /app lifecycle, fresh chain)
// Every scene has a gate assertion; a failing take is kept as a failed report and retaken
// by re-running the group (budget 3). Nothing is simulated: clicks and typing are real input events.
import { join } from 'node:path'
import { openBrowser, warm, recordScene, smoothScroll, clickReal, moveTo, sleep, rpc, nextTake, saveReport, probe, ROOT, BASE } from './lib.mjs'

const group = process.argv[2]
const OUT = join(ROOT, 'capture')
const { browser, context } = await openBrowser()
const summary = []

async function scene(id, path, prepare, body, gate) {
  if (process.argv[3] && process.argv[3] !== id) return { pass: true }   // optional: record one scene only
  const dir = join(OUT, id)
  const take = nextTake(dir, id)
  const name = `${id}-take${take}`
  await warm(context, path)
  const page = await context.newPage()
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  if (prepare) await prepare(page)
  let rec, checks = [], error
  try {
    rec = await recordScene(page, dir, name, () => body(page))
    checks = await gate(page, rec)
  } catch (e) {
    error = String(e?.message ?? e)
  }
  const pass = !error && checks.length > 0 && checks.every((c) => c.ok)
  const video = rec ? probe(rec.file) : undefined
  if (video && (video.width !== 1920 || video.height !== 1080)) { checks.push({ name: 'frame is 1920x1080', ok: false }) }
  saveReport(dir, name, { id, take, pass, seconds: rec?.seconds, frames: rec?.frames, video, checks, error })
  summary.push(`${id} take${take}: ${pass ? 'PASS' : 'FAIL'} ${rec ? rec.seconds.toFixed(1) + 's' : ''} ${error ?? ''}`)
  console.log(summary.at(-1))
  for (const c of checks) console.log(`   ${c.ok ? 'ok ' : 'NOT'} ${c.name}`)
  await page.close()
  return { pass, page: undefined }
}

const text = (page, sel) => page.locator(sel).first().innerText()
const waitLive = async (page) => {
  await page.waitForFunction(() => !/Reading the chain|Reading the last batch|Start the local chain/.test(document.body.innerText), null, { timeout: 20000 })
  await page.evaluate(() => document.fonts.ready)
  await sleep(1200)
}

if (group === 'A') {
  await scene('S1', '/', null, async (page) => { await sleep(11500) }, async (page) => {
    const t = await page.locator('main').innerText()
    return [
      { name: 'hero heading visible', ok: await page.getByRole('heading', { level: 1 }).first().isVisible() },
      { name: 'hero is the landing hero', ok: /one-price batch exchange/i.test(t) },
      { name: 'no unavailable/error state', ok: !/unavailable|Start the local chain|error/i.test(t.slice(0, 1500)) },
    ]
  })
  await scene('S2', '/', null, async (page) => {
    await sleep(1200)
    await smoothScroll(page, 2160, 2600)
    await sleep(2500)
    await smoothScroll(page, 2230, 8000)
  }, async (page) => {
    const t = await text(page, '#sandwich')
    const r = await page.locator('#sandwich .contrast, #sandwich table').first().boundingBox()
    return [
      { name: 'recorded label in frame', ok: /Recorded on a local Anvil chain/.test(t) },
      { name: 'recorded pool profit shown (0.00809 ETH)', ok: /0\.00809 ETH profit/.test(t) },
      { name: 'batch attacker 0 TKN and -1 wei', ok: /0 TKN and -1 wei/.test(t) },
      { name: 'table inside the viewport', ok: !!r && r.y > 0 && r.y + r.height < 1000 },
    ]
  })
  await scene('S7', '/', null, async (page) => {
    await sleep(800)
    await smoothScroll(page, 4320, 2800)
    await sleep(3000)
    await smoothScroll(page, 4400, 20000)
  }, async (page) => {
    const t = await text(page, '#fe')
    const code = await page.locator('#fe').getByText('select_price(_ orders').first().boundingBox()
    return [
      { name: 'select_price signature present', ok: /pub fn select_price\(_ orders: MemVec<Order>\) -> Clearing/.test(t) },
      { name: 'no uses clause text present', ok: /No uses clause/.test(t) },
      { name: 'place row has uses without call and Call = no', ok: /place\s+clock, settings, book, funds, log\s+no/.test(t) },
      { name: 'deposit_token and withdraw hold Call', ok: /deposit_token[\s\S]*yes[\s\S]*withdraw[\s\S]*yes/.test(t) },
      { name: 'signature inside the viewport', ok: !!code && code.y > 80 && code.y < 800 },
    ]
  })
  await scene('S8', '/app/', null, async (page) => {
    await sleep(1500)
    await smoothScroll(page, 6480, 3400)
    await sleep(8000)
  }, async (page) => {
    const t = await text(page, '#contact')
    const cmd = await page.locator('#contact').getByText('fe test --filter sandwich').first().boundingBox()
    return [
      { name: 'footer shows fe test --filter sandwich', ok: /fe test --filter sandwich/.test(t) },
      { name: 'footer shows fe test --filter permutation', ok: /fe test\s*--\s*filter permutation|fe test --filter permutation/.test(t.replace(/\s+/g, ' ')) },
      { name: 'commands sit in the upper two thirds', ok: !!cmd && cmd.y > 70 && cmd.y + cmd.height < 620 },
    ]
  })
}

if (group === 'B') {
  let blockBefore
  await scene('S4', '/app/', async (page) => {
    await waitLive(page)
    await page.evaluate(() => scrollTo(0, 4320))
    await sleep(1500)
    blockBefore = await rpc('eth_blockNumber')
  }, async (page) => {
    await sleep(1500)
    await smoothScroll(page, 5400, 6500)   // chapters 1-3, then the recorded table
    await sleep(3500)
    const btn = page.getByRole('button', { name: 'Run the sandwich on your local chain' })
    await clickReal(page, btn)
    await page.waitForFunction(() => /Measured just now on your local chain/.test(document.body.innerText), null, { timeout: 90000 })
    await sleep(5000)
  }, async (page) => {
    const t = await text(page, '#sandwich')
    const blockAfter = await rpc('eth_blockNumber')
    return [
      { name: 'live run finished ("Measured just now")', ok: /Measured just now on your local chain/.test(t) },
      { name: 'status: every number read from your chain, rolled back', ok: /Done: every number above was read from your chain, which was then rolled back/.test(t) },
      { name: 'batch price 0.011 alone and sandwiched', ok: /0\.011 ETH\/TKN \(alone: 0\.011 ETH\/TKN\)/.test(t) },
      { name: 'victim 15 TKN for 0.165 ETH', ok: /15 TKN for 0\.165 ETH/.test(t) },
      { name: 'attacker 0 TKN and -1 wei', ok: /0 TKN and -1 wei/.test(t) },
      { name: 'no failed-run message', ok: !/The run failed/.test(t) },
      { name: `chain rolled back (block ${blockBefore} -> ${blockAfter})`, ok: blockBefore === blockAfter },
    ]
  })
  // S5: same live page state is gone after page.close(); run it on a fresh load of the same chain.
  await scene('S5', '/app/', async (page) => {
    await waitLive(page)
    await page.evaluate(() => scrollTo(0, 5400))
    await sleep(2000)
  }, async (page) => {
    // park the real pointer on empty ground beside the panel, so it never covers a figure
    await page.mouse.move(1700, 960, { steps: 40 })
    await sleep(13000)
  }, async (page) => {
    const p = page.locator('#sandwich .limits p').first()
    const t = await p.innerText()
    const box = await p.boundingBox()
    return [
      { name: '"Where the guarantee stops" text', ok: /Where the guarantee stops/.test(t) },
      { name: 'condition C named', ok: /condition C/.test(t) },
      { name: 'one-sided price 0.011 -> 0.012', ok: /0\.011 ETH\/TKN to 0\.012 ETH\/TKN/.test(t) },
      { name: 'panel fully inside the viewport', ok: !!box && box.y > 80 && box.y + box.height < 840 },
    ]
  })
}

if (group === 'C') {
  const trader = 'Victim'
  let placed = false
  await scene('S6', '/app/', async (page) => {
    await waitLive(page)
    await page.evaluate(() => scrollTo(0, 1080))
    await sleep(1500)
  }, async (page) => {
    const status = page.locator('.tx-status')
    await sleep(1000)
    await clickReal(page, page.getByRole('button', { name: trader, exact: true }))
    await sleep(600)
    const limit = page.locator('.ticket input').nth(0)
    const qty = page.locator('.ticket input').nth(1)
    await clickReal(page, limit); await page.keyboard.press('Control+A'); await page.keyboard.type('0.012', { delay: 110 })
    await clickReal(page, qty); await page.keyboard.press('Control+A'); await page.keyboard.type('2', { delay: 110 })
    await sleep(500)
    await clickReal(page, page.getByRole('button', { name: 'Place the order' }))
    await page.waitForFunction(() => [...document.querySelectorAll('.tx-status')].some((e) => /Confirmed:/.test(e.textContent ?? '')), null, { timeout: 30000 })
    placed = true
    await sleep(1200)
    await smoothScroll(page, 2160, 1800)   // the book now lists the order
    await sleep(1800)
    await smoothScroll(page, 3240, 1800)   // settlement
    await sleep(900)
    await clickReal(page, page.getByRole('button', { name: /Advance time to close the batch/ }))
    await page.waitForFunction(() => /Confirmed: advance the dev chain/.test(document.body.innerText), null, { timeout: 30000 })
    await page.getByRole('button', { name: /^Clear batch \d+$/ }).waitFor({ timeout: 30000 })
    await sleep(900)
    await clickReal(page, page.getByRole('button', { name: /^Clear batch \d+$/ }))
    await page.waitForFunction(() => /Confirmed: clear batch/.test(document.body.innerText), null, { timeout: 30000 })
    await sleep(1800)
    const row = page.locator('.fills tbody tr', { has: page.locator('td.who', { hasText: trader }) }).filter({ has: page.getByRole('button', { name: 'Claim' }) }).first()
    await clickReal(page, row.getByRole('button', { name: 'Claim' }))
    await page.waitForFunction(() => /Confirmed: claim order/.test(document.body.innerText), null, { timeout: 30000 })
    await sleep(2500)
  }, async (page) => {
    const t = await text(page, '#settle')
    const body = await page.locator('body').innerText()
    return [
      { name: 'order placed (Confirmed in status)', ok: placed },
      { name: 'settlement shows the batch cleared', ok: /Batch \d+, cleared/.test(t) },
      { name: 'cleared result line with a contract price', ok: /Batch \d+ cleared at [\d.]+ ETH\/TKN/.test(t) },
      { name: 'claim confirmed', ok: /Confirmed: claim order/.test(body) },
      { name: 'a Claimed row exists', ok: /Claimed/.test(t) },
      { name: 'no reverted transaction on screen', ok: !/Reverted:/.test(body) },
    ]
  })
}

await browser.close()
console.log('\n' + summary.join('\n'))
