/**
 * Mounts the islands of /app. The page is static HTML built to the design
 * skill's recipes; each island replaces only the content of its
 * `[data-island]` element, so the page reads correctly with scripts off.
 */
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BatchHero } from './BatchHero'
import { islands } from './islands'

const registry: Record<string, () => ReactNode> = { batch: () => <BatchHero />, ...islands }

for (const element of document.querySelectorAll<HTMLElement>('[data-island]')) {
  const render = registry[element.dataset['island'] ?? '']
  if (render) createRoot(element).render(render())
}
