# Gas spike: clearing cost on Anvil (Osaka cap enforced)

Measured by `bash scripts/gas-spike.sh` on `anvil --hardfork osaka --enable-tx-gas-limit`
(per-transaction cap 16777216 gas). The prototype in `spikes/gas` stores orders in
AnyOrder's planned storage shape, then clears like AnyOrder: it loads every order,
sorts, sweeps the candidate prices and writes every order's fill (the worst case
for storage writes).

| Orders in the batch | `clear()` gas | Share of the cap |
|---:|---:|---:|
| 10 | 409402 | 2% |
| 50 | 2161907 | 12% |
| 100 | 4426468 | 26% |

Rule: the per-batch order cap is the largest measured N whose clearing used at most
8388608 gas (half the cap, leaving headroom for the full clearing code), and the
demo batch size is the smaller of that cap and 20.

Result: `maxOrders = 100`, `demoBatchSize = 20` (in `deploy/params.json`).
The real contract's full batch is measured again by the dApp's end-to-end test.
