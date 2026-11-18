#!/usr/bin/env bash
# Gas spike: measures the prototype clearing's gas on a local Anvil chain with
# Osaka's per-transaction gas cap enforced, for N = 10, 50 and 100 orders, and
# sets the per-batch order cap and the demo batch size from the measurement.
#
#   bash scripts/gas-spike.sh
#
# Writes deploy/params.json and docs/gas/spike.md. Last line: SPIKE: PASS ...
# Uses only Anvil's unlocked public dev accounts: no key is read or stored.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=8547
RPC="http://127.0.0.1:${PORT}"
CAP=16777216
BUDGET=8388608   # half the cap: headroom for the full clearing code
SIZES=(10 50 100)

fe build "${ROOT}/spikes/gas" --out-dir "${ROOT}/spikes/gas/out" > /dev/null

anvil --hardfork osaka --enable-tx-gas-limit --port "${PORT}" --silent > /dev/null 2>&1 &
ANVIL_PID=$!
trap 'kill "${ANVIL_PID}" 2> /dev/null || true' EXIT
for _ in $(seq 1 50); do
  if cast chain-id --rpc-url "${RPC}" > /dev/null 2>&1; then break; fi
  sleep 0.2
done

mapfile -t ACCOUNTS < <(cast rpc --rpc-url "${RPC}" eth_accounts | tr -d '[]" ' | tr ',' '\n')
DEPLOYER="${ACCOUNTS[0]}"
BYTECODE="0x$(cat "${ROOT}/spikes/gas/out/GasSpike.bin")"

field() { grep -o "\"$1\":\"[^\"]*\"" | head -n 1 | cut -d '"' -f 4; }

declare -A GAS
for n in "${SIZES[@]}"; do
  spike="$(cast send --rpc-url "${RPC}" --unlocked --from "${DEPLOYER}" --create "${BYTECODE}" --json | field contractAddress)"
  for ((k = 0; k < n; k++)); do
    trader="${ACCOUNTS[$((1 + k % 9))]}"
    limit=$(( (9 + (k * 7) % 6) * 1000000000000000 + k ))
    quantity="$(( 1 + (k * 3) % 5 ))000000000000000000"
    side=false
    if (( k % 2 == 0 )); then side=true; fi
    cast send --rpc-url "${RPC}" --unlocked --from "${trader}" "${spike}" "place(bool,uint256,uint256)" "${side}" "${limit}" "${quantity}" > /dev/null
  done
  receipt="$(cast send --rpc-url "${RPC}" --unlocked --from "${DEPLOYER}" "${spike}" "clear()" --gas-limit "${CAP}" --json 2> /dev/null || true)"
  status="$(printf '%s' "${receipt}" | field status)"
  if [[ "${status}" == "0x1" ]]; then
    GAS[$n]=$(( $(printf '%s' "${receipt}" | field gasUsed) ))
  else
    GAS[$n]=-1
  fi
  echo "N=${n} clear gas=${GAS[$n]}"
done

max_orders=0
for n in "${SIZES[@]}"; do
  if (( GAS[$n] > 0 && GAS[$n] <= BUDGET )); then max_orders=$n; fi
done
if (( max_orders == 0 )); then
  echo "SPIKE: FAIL (even N=${SIZES[0]} exceeds the ${BUDGET} gas budget)"
  exit 1
fi
demo=$(( max_orders < 20 ? max_orders : 20 ))

mkdir -p "${ROOT}/deploy" "${ROOT}/docs/gas"
cat > "${ROOT}/deploy/params.json" << JSON
{
  "maxOrders": ${max_orders},
  "demoBatchSize": ${demo},
  "batchSeconds": 120,
  "minQuantity": "1000000000000000",
  "maxPrice": "1000000000000000000000",
  "measuredBy": "scripts/gas-spike.sh",
  "clearGas": { "10": ${GAS[10]}, "50": ${GAS[50]}, "100": ${GAS[100]} }
}
JSON

cat > "${ROOT}/docs/gas/spike.md" << MD
# Gas spike: clearing cost on Anvil (Osaka cap enforced)

Measured by \`bash scripts/gas-spike.sh\` on \`anvil --hardfork osaka --enable-tx-gas-limit\`
(per-transaction cap ${CAP} gas). The prototype in \`spikes/gas\` stores orders in
AnyOrder's planned storage shape, then clears like AnyOrder: it loads every order,
sorts, sweeps the candidate prices and writes every order's fill (the worst case
for storage writes).

| Orders in the batch | \`clear()\` gas | Share of the cap |
|---:|---:|---:|
| 10 | ${GAS[10]} | $(( GAS[10] * 100 / CAP ))% |
| 50 | ${GAS[50]} | $(( GAS[50] * 100 / CAP ))% |
| 100 | ${GAS[100]} | $(( GAS[100] * 100 / CAP ))% |

Rule: the per-batch order cap is the largest measured N whose clearing used at most
${BUDGET} gas (half the cap, leaving headroom for the full clearing code), and the
demo batch size is the smaller of that cap and 20.

Result: \`maxOrders = ${max_orders}\`, \`demoBatchSize = ${demo}\` (in \`deploy/params.json\`).
The real contract's full batch is measured again by the dApp's end-to-end test.
MD

echo "SPIKE: PASS maxOrders=${max_orders} demoBatchSize=${demo}"
