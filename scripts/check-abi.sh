#!/usr/bin/env bash
# Builds the contracts and checks that the ABI of every DEPLOYED contract
# (AnyOrder, TestToken, ConstantProductPool) still matches its frozen snapshot
# in abi/. Test-only contracts are built too but are not part of the frozen
# interface. Paths are quoted, so a repository path with spaces works.
#
#   bash scripts/check-abi.sh        last line: ABI: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fe build "${ROOT}" --out-dir "${ROOT}/out" > /dev/null

status=0
for contract in AnyOrder TestToken ConstantProductPool; do
  if ! cmp -s "${ROOT}/out/${contract}.abi.json" "${ROOT}/abi/${contract}.abi.json"; then
    echo "ABI changed: ${contract} (out/${contract}.abi.json differs from abi/${contract}.abi.json)"
    status=1
  fi
done
if [[ "${status}" -eq 0 ]]; then echo "ABI: OK"; else echo "ABI: FAIL"; fi
exit "${status}"
