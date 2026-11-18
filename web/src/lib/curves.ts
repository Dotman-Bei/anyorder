/**
 * Supply and demand step curves for the chart, drawn from the batch's orders
 * as the contract returns them (orderAt). This plots the book; it does not
 * clear it. The price marker on the chart is always the contract's own
 * preview() or clearing result, never computed here.
 */

export interface BookOrder {
  is_buy: boolean
  limit: bigint
  quantity: bigint
}

export interface CurvePoint {
  price: bigint
  demand: bigint
  supply: bigint
}

/** One point per distinct limit price: buys at or above it, sells at or below it. */
export function curvePoints(orders: readonly BookOrder[]): CurvePoint[] {
  const prices = [...new Set(orders.map((o) => o.limit))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  return prices.map((price) => ({
    price,
    demand: orders.filter((o) => o.is_buy && o.limit >= price).reduce((sum, o) => sum + o.quantity, 0n),
    supply: orders.filter((o) => !o.is_buy && o.limit <= price).reduce((sum, o) => sum + o.quantity, 0n),
  }))
}
