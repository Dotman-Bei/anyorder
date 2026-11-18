/**
 * The recorded sandwich run (public/recorded/sandwich.json, written by
 * `pnpm -C web scenario` from a real run on a local Anvil chain) as display
 * strings. vite.config.ts injects them into the HTML at build time as
 * `{{rec:<key>}}` tokens, so both pages read correctly with scripts off. Every
 * value is labelled on the page as a recording.
 */
import { formatEth, formatPrice, formatTokens, formatWei } from './format'

export interface Recording {
  recordedAt: string
  commit: string
  feVersion: string
  result: {
    block: string
    pool: { victimTokensAlone: string; victimTokensSandwiched: string; attackerTokens: string; attackerEthBack: string; attackerProfitWei: string }
    batchAlone: { batch: string; price: string; victimTokens: string; victimPaidWei: string }
    batchSandwiched: { batch: string; price: string; victimTokens: string; victimPaidWei: string; attackerTokenChange: string; attackerWeiChange: string }
    oneSided: { batch: string; price: string; victimTokens: string; victimPaidWei: string; attackerTokens: string; attackerPaidWei: string }
  }
}

export function recordedTokens(rec: Recording): Record<string, string> {
  const r = rec.result
  const b = (v: string) => BigInt(v)
  return {
    recordedAt: rec.recordedAt.slice(0, 10),
    commit: rec.commit,
    feVersion: rec.feVersion,
    block: r.block,
    'pool.victimAlone': formatTokens(b(r.pool.victimTokensAlone), 4),
    'pool.victimSandwiched': formatTokens(b(r.pool.victimTokensSandwiched), 4),
    'pool.attackerTokens': formatTokens(b(r.pool.attackerTokens), 4),
    'pool.attackerProfit': formatEth(b(r.pool.attackerProfitWei), 6),
    'batch.price': formatPrice(b(r.batchSandwiched.price)),
    'batch.priceAlone': formatPrice(b(r.batchAlone.price)),
    'batch.victimTokens': formatTokens(b(r.batchSandwiched.victimTokens), 4),
    'batch.victimPaid': formatEth(b(r.batchSandwiched.victimPaidWei), 6),
    'batch.attackerTokens': `${r.batchSandwiched.attackerTokenChange} TKN`,
    'batch.attackerWei': formatWei(b(r.batchSandwiched.attackerWeiChange)),
    'oneSided.price': formatPrice(b(r.oneSided.price)),
    'oneSided.victimPaid': formatEth(b(r.oneSided.victimPaidWei), 6),
    'oneSided.attackerPaid': formatEth(b(r.oneSided.attackerPaidWei), 6),
    'oneSided.attackerTokens': formatTokens(b(r.oneSided.attackerTokens), 4),
  }
}

/** Replaces every `{{rec:<key>}}` token; an unknown key is an error, never a blank. */
export function injectRecorded(html: string, tokens: Record<string, string>): string {
  return html.replace(/\{\{rec:([A-Za-z.]+)\}\}/g, (_, key: string) => {
    const value = tokens[key]
    if (value === undefined) throw new Error(`unknown recorded token {{rec:${key}}}`)
    return value
  })
}
