/** What every screen shows for a value it does not know. Never a zero. */
export const UNKNOWN = '—'

const UNIT = 10n ** 18n

/**
 * An 18-decimal amount as a decimal string, cut (never rounded) to at most
 * `maxFraction` fraction digits, trailing zeros dropped. `undefined` and `null`
 * give UNKNOWN.
 */
export function formatUnits18(value: bigint | undefined | null, maxFraction = 6): string {
  if (value === undefined || value === null) return UNKNOWN
  const negative = value < 0n
  const abs = negative ? -value : value
  const whole = abs / UNIT
  const fraction = (abs % UNIT).toString().padStart(18, '0').slice(0, maxFraction).replace(/0+$/, '')
  const text = fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`
  return negative ? `-${text}` : text
}

export function formatEth(wei: bigint | undefined | null, maxFraction = 6): string {
  return wei === undefined || wei === null ? UNKNOWN : `${formatUnits18(wei, maxFraction)} ETH`
}

export function formatTokens(base: bigint | undefined | null, maxFraction = 6): string {
  return base === undefined || base === null ? UNKNOWN : `${formatUnits18(base, maxFraction)} TKN`
}

/** A price in wei per whole token. */
export function formatPrice(weiPerToken: bigint | undefined | null): string {
  return weiPerToken === undefined || weiPerToken === null ? UNKNOWN : `${formatUnits18(weiPerToken, 6)} ETH/TKN`
}

/** An exact wei amount, for rounding dust. */
export function formatWei(wei: bigint | undefined | null): string {
  return wei === undefined || wei === null ? UNKNOWN : `${wei.toString()} wei`
}

export function shortAddress(address: string | undefined | null): string {
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return UNKNOWN
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** How long ago something was seen, from milliseconds. */
export function formatAge(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || !Number.isFinite(ms) || ms < 0) return UNKNOWN
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds} s ago`
  return `${Math.floor(seconds / 60)} min ago`
}

/** Seconds as m:ss for the batch countdown. */
export function formatCountdown(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || !Number.isFinite(seconds)) return UNKNOWN
  const s = Math.max(0, Math.floor(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
