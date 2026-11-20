/**
 * dapp:14: hosted mode. A build on a public host shows one hosted notice per
 * live island; every other build renders exactly what it rendered before.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import type { ChainState } from '../chain/state'
import { HOSTED, HOSTED_LINKS, isHostedBuild } from '../lib/hosted'
import { islandMode } from './islands'
import { ChainNotice, type Live, useLive } from './shared'

const local = (chain: ChainState, stale = false): Live => ({ chain, stale, hosted: false })

describe('isHostedBuild', () => {
  test('a build on Vercel (VERCEL=1, set by Vercel) is hosted', () => {
    expect(isHostedBuild({ VERCEL: '1' })).toBe(true)
  })
  test('any other build is local', () => {
    expect(isHostedBuild({})).toBe(false)
    expect(isHostedBuild({ VERCEL: '' })).toBe(false)
    expect(isHostedBuild({ VERCEL: '0' })).toBe(false)
  })
  test('the unit tests run a local build', () => {
    expect(HOSTED).toBe(false)
  })
})

describe('the hosted notice', () => {
  const html = renderToStaticMarkup(<ChainNotice live={{ chain: { kind: 'loading' }, stale: false, hosted: true }} />)
  test('says what the app needs, how to run it, and where the video and the code are', () => {
    expect(html).toContain('data-state="hosted"')
    expect(html).toContain('This app needs a local Anvil chain (chain id 31337, Anvil dev accounts, test funds)')
    expect(html).toContain('<code>pnpm -C web install</code>')
    expect(html).toContain('<code>pnpm -C web local</code>')
    expect(html).toContain(`href="${HOSTED_LINKS.video}"`)
    expect(html).toContain(`href="${HOSTED_LINKS.repo}"`)
    expect(HOSTED_LINKS).toEqual({ video: 'https://youtu.be/8QCVwiO_9c8', repo: 'https://github.com/Dotman-Bei/anyorder' })
  })
  test('replaces every state that is not live, with no error text and no Reconnect', () => {
    const states: ChainState[] = [
      { kind: 'loading' },
      { kind: 'unavailable', reason: 'unreachable', detail: 'fetch failed' },
      { kind: 'not-deployed', address: '0x0' },
    ]
    for (const chain of states) {
      const out = renderToStaticMarkup(<ChainNotice live={{ chain, stale: false, hosted: true }} />)
      expect(out).toBe(html)
    }
    expect(html).not.toContain('unavailable')
    expect(html).not.toContain('Reconnect')
  })
})

describe('a local build renders exactly what it rendered before dapp:14', () => {
  test('loading', () => {
    expect(renderToStaticMarkup(<ChainNotice live={local({ kind: 'loading' })} />)).toBe('<p class="chain-notice" data-state="loading">Reading the chain…</p>')
  })
  test('unreachable', () => {
    expect(renderToStaticMarkup(<ChainNotice live={local({ kind: 'unavailable', reason: 'unreachable', detail: 'fetch failed' })} />)).toBe(
      '<div class="chain-notice" data-state="unavailable" role="status"><p>The local chain is unavailable (fetch failed).</p><p><code>Start the local chain: pnpm -C web local</code></p><button type="button" class="btn">Reconnect</button></div>',
    )
  })
  test('wrong chain', () => {
    expect(renderToStaticMarkup(<ChainNotice live={local({ kind: 'unavailable', reason: 'wrong-chain', detail: 'chain id 1' })} />)).toBe(
      '<div class="chain-notice" data-state="unavailable" role="status"><p>The local chain is unavailable (chain id 1).</p><p><code>Point the app at Anvil (chain id 31337): pnpm -C web local</code></p><button type="button" class="btn">Reconnect</button></div>',
    )
  })
  test('not deployed', () => {
    expect(renderToStaticMarkup(<ChainNotice live={local({ kind: 'not-deployed', address: '0x0' })} />)).toBe(
      '<div class="chain-notice" data-state="not-deployed" role="status"><p>The contracts are not deployed on this chain.</p><p><code>Deploy the contracts: pnpm -C web deploy:local</code></p><button type="button" class="btn">Reconnect</button></div>',
    )
  })
  test('live: nothing, or the stale line', () => {
    const now = Date.now()
    expect(renderToStaticMarkup(<ChainNotice live={local({ kind: 'live', block: 1n, blockTime: 1, seenAt: now })} />)).toBe('')
    expect(renderToStaticMarkup(<ChainNotice live={local({ kind: 'live', block: 1n, blockTime: 1, seenAt: now - 120_000 }, true)} />)).toMatch(
      /^<p class="chain-notice" data-state="stale">Data is .+: the chain stopped answering\.<\/p>$/,
    )
  })
})

describe('useLive and the islands', () => {
  function Probe({ hosted }: { hosted?: boolean }) {
    const live = hosted === undefined ? useLive() : useLive(hosted)
    return <i data-hosted={String(live.hosted)} data-kind={live.chain.kind} />
  }
  test('useLive follows the build: local by default, hosted when asked', () => {
    expect(renderToStaticMarkup(<Probe />)).toBe('<i data-hosted="false" data-kind="loading"></i>')
    expect(renderToStaticMarkup(<Probe hosted={true} />)).toBe('<i data-hosted="true" data-kind="loading"></i>')
  })
  test('a local build mounts every island', () => {
    for (const name of ['batch', 'trade', 'wallet', 'book', 'settle', 'sandwich']) expect(islandMode(name, false)).toBe('mount')
  })
  test('a hosted build keeps the hero card and the wallet panel static, and adds the notice to #trade, #book, #settle and #sandwich', () => {
    for (const name of ['batch', 'wallet']) expect(islandMode(name, true)).toBe('static')
    for (const name of ['trade', 'book', 'settle', 'sandwich']) expect(islandMode(name, true)).toBe('notice')
  })
})
