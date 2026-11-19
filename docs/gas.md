# Gas: clearing a batch with the real AnyOrder contract

Measured by `pnpm -C web exec tsx scripts/gas-table.ts` with fe 26.6.0 (5b3f96a) on
`anvil --hardfork osaka --enable-tx-gas-limit` (per-transaction cap 16777216 gas), the demo order mix
(limits 0.009-0.014 ETH per token, 1-4 tokens per order, three makers). One `clear(batch)` transaction
loads every order, sorts, sweeps the candidate prices, rations at the marginal price and writes each
non-zero fill.

| Orders in the batch | `clear()` gas | Share of the cap |
|---:|---:|---:|
| 10 | 358462 | 2.1% |
| 25 | 807348 | 4.8% |
| 50 | 1567284 | 9.3% |
| 75 | 2380590 | 14.2% |
| 100 | 3156298 | 18.8% |

The deployed per-batch cap is `maxOrders = 100` (from the gas spike, `deploy/params.json`).
These are measurements of this code on this EVM revision, not a gas-efficiency claim.
