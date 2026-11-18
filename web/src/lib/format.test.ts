import { describe, expect, it } from 'vitest'
import {
  UNKNOWN,
  formatAge,
  formatCountdown,
  formatEth,
  formatPrice,
  formatTokens,
  formatUnits18,
  formatWei,
  shortAddress,
} from './format'

describe('unknown values are never shown as zero', () => {
  it('renders undefined and null as the em dash', () => {
    for (const f of [formatEth, formatTokens, formatPrice, formatWei, formatUnits18]) {
      expect(f(undefined)).toBe(UNKNOWN)
      expect(f(null)).toBe(UNKNOWN)
    }
    expect(shortAddress(undefined)).toBe(UNKNOWN)
    expect(formatAge(undefined)).toBe(UNKNOWN)
    expect(formatCountdown(Number.NaN)).toBe(UNKNOWN)
  })

  it('still renders a real zero as zero', () => {
    expect(formatEth(0n)).toBe('0 ETH')
    expect(formatWei(0n)).toBe('0 wei')
  })
})

describe('18-decimal formatting', () => {
  it('cuts instead of rounding and drops trailing zeros', () => {
    expect(formatUnits18(165_000_000_000_000_000n)).toBe('0.165')
    expect(formatUnits18(9_756_097_560_975_609_756n)).toBe('9.756097')
    expect(formatUnits18(15n * 10n ** 18n)).toBe('15')
    expect(formatUnits18(-1n, 18)).toBe('-0.000000000000000001')
  })

  it('labels the units', () => {
    expect(formatPrice(11_000_000_000_000_000n)).toBe('0.011 ETH/TKN')
    expect(formatTokens(10n ** 18n)).toBe('1 TKN')
    expect(formatWei(1n)).toBe('1 wei')
  })
})

describe('small helpers', () => {
  it('shortens addresses', () => {
    expect(shortAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')).toBe('0xf39F…2266')
    expect(shortAddress('not an address')).toBe(UNKNOWN)
  })

  it('formats ages and countdowns', () => {
    expect(formatAge(4_200)).toBe('4 s ago')
    expect(formatAge(125_000)).toBe('2 min ago')
    expect(formatCountdown(125)).toBe('2:05')
    expect(formatCountdown(-3)).toBe('0:00')
  })
})
