import { describe, expect, it } from 'vitest'
import { type Recording, injectRecorded, recordedTokens } from './recorded'

const rec: Recording = {
  recordedAt: '2026-11-18T00:01:22.890Z',
  commit: 'abc1234',
  feVersion: 'fe 26.6.0 (5b3f96a)',
  result: {
    block: '56',
    pool: {
      victimTokensAlone: '14457831325301204819',
      victimTokensSandwiched: '13773314203730272596',
      attackerTokens: '9756097560975609756',
      attackerEthBack: '118090638930163447',
      attackerProfitWei: '8090638930163447',
    },
    batchAlone: { batch: '3', price: '11000000000000000', victimTokens: '15000000000000000000', victimPaidWei: '165000000000000000' },
    batchSandwiched: {
      batch: '3',
      price: '11000000000000000',
      victimTokens: '15000000000000000000',
      victimPaidWei: '165000000000000000',
      attackerTokenChange: '0',
      attackerWeiChange: '-1',
    },
    oneSided: {
      batch: '3',
      price: '12000000000000000',
      victimTokens: '15000000000000000000',
      victimPaidWei: '180000000000000000',
      attackerTokens: '10000000000000000000',
      attackerPaidWei: '120000000000000000',
    },
  },
}

describe('recorded tokens', () => {
  it('formats the recorded run', () => {
    const t = recordedTokens(rec)
    expect(t['pool.victimSandwiched']).toBe('13.7733 TKN')
    expect(t['pool.attackerProfit']).toBe('0.00809 ETH')
    expect(t['batch.price']).toBe('0.011 ETH/TKN')
    expect(t['batch.attackerWei']).toBe('-1 wei')
    expect(t['oneSided.price']).toBe('0.012 ETH/TKN')
    expect(t['recordedAt']).toBe('2026-11-18')
  })

  it('injects tokens and refuses unknown keys', () => {
    const t = recordedTokens(rec)
    expect(injectRecorded('<p>{{rec:batch.price}}</p>', t)).toBe('<p>0.011 ETH/TKN</p>')
    expect(() => injectRecorded('<p>{{rec:nope}}</p>', t)).toThrow('unknown recorded token')
  })
})
