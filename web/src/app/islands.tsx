/**
 * The island registry beyond the hero. Each UI task that adds an island adds
 * one line here (B6 trade, B7 book and settle, B8 sandwich, B10 wallet).
 */
import type { ReactNode } from 'react'
import { BookTable, SettlePanel } from './BookAndSettle'
import { SandwichRunner } from './SandwichRunner'
import { TradePanel } from './TradePanel'
import { WalletPanel } from './WalletPanel'

export const islands: Record<string, () => ReactNode> = {
  trade: () => <TradePanel />,
  book: () => <BookTable />,
  settle: () => <SettlePanel />,
  sandwich: () => <SandwichRunner />,
  wallet: () => <WalletPanel />,
}

/**
 * How this build treats the island named `name`:
 *   'mount'   renders the island (every island of a local build);
 *   'static'  leaves its static HTML as built (hosted: the hero card keeps its
 *             recorded figure, and #trade's notice speaks for the wallet panel);
 *   'notice'  keeps its static HTML and adds the hosted notice at its end
 *             (hosted: #trade, #book, #settle and #sandwich, whose panels hold
 *             the traders, how clearing reads the book, the recorded cleared
 *             batch and the recorded sandwich table).
 * dapp:14. Each section of a hosted /app shows one notice at most.
 */
export type IslandMode = 'mount' | 'static' | 'notice'

const HOSTED_MODES: Readonly<Record<string, IslandMode>> = { batch: 'static', wallet: 'static', trade: 'notice', book: 'notice', settle: 'notice', sandwich: 'notice' }

export function islandMode(name: string, hosted: boolean): IslandMode {
  return hosted ? (HOSTED_MODES[name] ?? 'mount') : 'mount'
}
