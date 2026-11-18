import { describe, expect, it } from 'vitest'
import { curvePoints } from './curves'

describe('curvePoints', () => {
  it('steps demand down and supply up at each distinct limit', () => {
    const points = curvePoints([
      { is_buy: true, limit: 12n, quantity: 15n },
      { is_buy: false, limit: 10n, quantity: 10n },
      { is_buy: false, limit: 11n, quantity: 10n },
      { is_buy: true, limit: 9n, quantity: 5n },
    ])
    expect(points).toEqual([
      { price: 9n, demand: 20n, supply: 0n },
      { price: 10n, demand: 15n, supply: 10n },
      { price: 11n, demand: 15n, supply: 20n },
      { price: 12n, demand: 15n, supply: 20n },
    ])
  })

  it('draws nothing for an empty book', () => {
    expect(curvePoints([])).toEqual([])
  })
})
