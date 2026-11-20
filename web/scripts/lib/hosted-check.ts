/**
 * dapp:14: what a visitor of the hosted build sees on /app. Opens the built
 * page from `distDir` in headless Chrome (scripts/lib/chrome.ts) and checks:
 *   - #trade, #book, #settle and #sandwich each show exactly one hosted notice,
 *     with both commands, chain id 31337, Anvil dev accounts, test funds, the
 *     demo video and the repo link, after their static panel (the traders, how
 *     clearing reads the book, the recorded cleared batch, the recorded
 *     sandwich table);
 *   - no other chain notice shows anywhere (no "unavailable", no Reconnect);
 *   - the hero card keeps its recorded figure and the sandwich panel its
 *     recorded table, each labelled "Recorded on a local Anvil chain", with no
 *     live part (no live batch, no run button);
 *   - the wallet island stays empty, and <html> carries data-hosted;
 *   - the page asked for no /deployment.json and no RPC.
 * Returns null when all of it holds, else what is wrong.
 */
import { launchChrome, serveDir } from './chrome'

const WAIT_MS = 15_000
const ISLANDS = ['trade', 'book', 'settle', 'sandwich']
const LINKS = ['https://youtu.be/8QCVwiO_9c8', 'https://github.com/Dotman-Bei/anyorder']
const WORDS = ['pnpm -C web install', 'pnpm -C web local', 'chain id 31337', 'Anvil dev accounts, test funds']

interface HostedView {
  notices: { island: string; text: string; links: string[] }[]
  others: string[]
  panels: string[]
  heroRecorded: boolean
  heroLive: boolean
  sandwichSource: string
  sandwichTable: boolean
  sandwichRun: boolean
  walletChildren: number
  marked: boolean
  requests: string[]
}

const READ = `(() => ({
  notices: [...document.querySelectorAll('.chain-notice[data-state="hosted"]')].map((n) => ({
    island: n.closest('[data-island]')?.getAttribute('data-island') ?? '?',
    text: n.textContent ?? '',
    links: [...n.querySelectorAll('a')].map((a) => a.href.replace(/\\/$/, '')),
  })),
  others: [...document.querySelectorAll('.chain-notice:not([data-state="hosted"])')].map((n) => n.getAttribute('data-state') ?? '?'),
  panels: ['trade', 'book', 'settle'].map((i) => document.querySelector('[data-island="' + i + '"]')?.textContent ?? ''),
  heroRecorded: (document.querySelector('[data-island="batch"]')?.textContent ?? '').includes('Recorded on a local Anvil chain'),
  heroLive: document.querySelector('[data-island="batch"] .batch-live') !== null,
  sandwichSource: document.querySelector('[data-island="sandwich"] .sandwich__source')?.textContent ?? '',
  sandwichTable: document.querySelector('[data-island="sandwich"] table.contrast') !== null,
  sandwichRun: document.querySelector('[data-island="sandwich"] .sandwich__run') !== null,
  walletChildren: document.querySelector('[data-island="wallet"]')?.childElementCount ?? -1,
  marked: document.documentElement.dataset.hosted === 'true',
  requests: performance.getEntriesByType('resource').map((e) => e.name),
}))()`

export async function checkHosted(distDir: string): Promise<string | null> {
  const server = await serveDir(distDir)
  const browser = await launchChrome(1440, 900)
  try {
    await browser.page.goto(`${server.url}/app/`)
    let view = await browser.page.evaluate<HostedView>(READ)
    for (let waited = 0; waited < WAIT_MS && view.notices.length < ISLANDS.length; waited += 500) {
      await new Promise((r) => setTimeout(r, 500))
      view = await browser.page.evaluate<HostedView>(READ)
    }
    // Long enough for a poll or a late fetch to show among the requests.
    await new Promise((r) => setTimeout(r, 3000))
    view = await browser.page.evaluate<HostedView>(READ)
    const problems: string[] = []
    const islands = view.notices.map((n) => n.island)
    if (islands.join(',') !== ISLANDS.join(',')) problems.push(`hosted notices in [${islands.join(', ')}], want [${ISLANDS.join(', ')}]`)
    for (const n of view.notices) {
      for (const want of WORDS) if (!n.text.includes(want)) problems.push(`#${n.island} notice lacks "${want}"`)
      for (const want of LINKS) if (!n.links.includes(want)) problems.push(`#${n.island} notice lacks the link ${want}`)
    }
    if (view.others.length > 0) problems.push(`other chain notices show: ${view.others.join(', ')}`)
    const [trade = '', book = '', settle = ''] = view.panels
    if (!trade.includes('Maker 1') || !trade.includes('Attacker')) problems.push('#trade lost its static list of traders')
    if (!book.includes('How clearing reads the book')) problems.push('#book lost its static panel')
    if (!settle.includes('Recorded on a local Anvil chain')) problems.push('#settle lost its recorded cleared batch')
    if (!view.heroRecorded || view.heroLive) problems.push('the hero card is not its recorded figure')
    if (!view.sandwichTable || !view.sandwichSource.startsWith('Recorded on a local Anvil chain') || view.sandwichRun) {
      problems.push('the sandwich panel is not its recorded table')
    }
    if (!view.marked) problems.push('<html> lacks data-hosted="true"')
    if (view.walletChildren !== 0) problems.push(`the wallet island has ${view.walletChildren} element(s), want none`)
    const asked = view.requests.filter((r) => r.includes('deployment.json') || /:(8545|8546|8547)\b/.test(r))
    if (asked.length > 0) problems.push(`the page asked for ${asked.join(', ')}`)
    return problems.length === 0 ? null : problems.join('; ')
  } finally {
    await browser.close()
    await server.close()
  }
}
