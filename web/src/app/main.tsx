/**
 * Mounts the islands of /app. The page is static HTML built to the design
 * skill's recipes; each island replaces only the content of its
 * `[data-island]` element, so the page reads correctly with scripts off.
 * A hosted build (dapp:14) mounts only what islandMode() says.
 */
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { HOSTED } from '../lib/hosted'
import { BatchHero } from './BatchHero'
import { islandMode, islands } from './islands'
import { HostedNotice } from './shared'

const registry: Record<string, () => ReactNode> = { batch: () => <BatchHero />, ...islands }

// dapp:14: the page's CSS sizes a hosted build's sections for their static panels.
if (HOSTED) document.documentElement.dataset['hosted'] = 'true'

for (const element of document.querySelectorAll<HTMLElement>('[data-island]')) {
  const name = element.dataset['island'] ?? ''
  const render = registry[name]
  if (!render) continue
  const mode = islandMode(name, HOSTED)
  if (mode === 'mount') createRoot(element).render(render())
  if (mode === 'notice') {
    const slot = document.createElement('div')
    slot.className = 'hosted-slot'
    element.append(slot)
    createRoot(slot).render(<HostedNotice />)
  }
}
