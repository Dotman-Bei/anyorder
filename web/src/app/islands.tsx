/**
 * The island registry beyond the hero. Each UI task that adds an island adds
 * one line here (B6 trade, B7 book and settle, B8 sandwich, B10 wallet).
 */
import type { ReactNode } from 'react'
import { BookTable, SettlePanel } from './BookAndSettle'
import { TradePanel } from './TradePanel'

export const islands: Record<string, () => ReactNode> = {
  trade: () => <TradePanel />,
  book: () => <BookTable />,
  settle: () => <SettlePanel />,
}
