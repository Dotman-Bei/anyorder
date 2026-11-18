#!/usr/bin/env bash
# Mutation check for the reentrancy lock (core spec section 10). Proves both
# halves of the claim "the lock is test-covered":
#   1. reentrancy_lock_refuses_a_second_withdraw passes on the real contract;
#   2. in a temporary copy of the workspace with the `Reentrant` check deleted
#      from `withdraw` in logic.fe, the same test fails on an assertion.
# The copy lives in a fresh temp directory that is removed on exit. The
# repository is only read, never modified, so there is nothing to restore.
#
#   bash scripts/mutant-reentrancy.sh
#   last line: MUTANT-REENTRANCY: OK (real contract passes, lock deleted fails)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST=reentrancy_lock_refuses_a_second_withdraw
LOGIC=ingots/exchange/src/logic.fe
GUARD='    if guard.entered.value {'
# What a failed `assert!` reverts with: Panic(uint256) code 0x01.
ASSERT_PANIC=0x4e487b710000000000000000000000000000000000000000000000000000000000000001

fail() {
  echo "MUTANT-REENTRANCY: FAIL ($1)"
  exit 1
}

# Half 1: the real contract.
real="$(cd "${ROOT}" && fe test --filter "${TEST}" 2>&1)" || true
if ! grep -qF "test result: ok. 1 passed; 0 failed" <<< "${real}"; then
  echo "${real}"
  fail "the test does not pass on the real contract"
fi
echo "real contract: ${TEST} passes"

# Half 2: a temporary copy with the lock check deleted.
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT
cp "${ROOT}/fe.toml" "${TMP}/fe.toml"
cp -R "${ROOT}/ingots" "${TMP}/ingots"
[[ "$(grep -cxF "${GUARD}" "${TMP}/${LOGIC}")" -eq 1 ]] \
  || fail "the guard line was not found exactly once in ${LOGIC}"
# Delete the guard: the `if` line, `revert_error(Reentrant {})` and the `}`.
sed -i "/^${GUARD}\$/,+2d" "${TMP}/${LOGIC}"
[[ "$(grep -c 'revert_error(Reentrant {})' "${TMP}/${LOGIC}")" -eq 0 ]] \
  || fail "the mutation did not remove the Reentrant check"
[[ "$(diff "${ROOT}/${LOGIC}" "${TMP}/${LOGIC}" | grep -c '^<')" -eq 3 ]] \
  || fail "the mutation did not remove exactly three lines"
echo "mutant: Reentrant check deleted from withdraw in a temp copy"

mutant="$(cd "${TMP}" && fe test --filter "${TEST}" 2>&1)" || true
if ! grep -qF "test result: FAILED. 0 passed; 1 failed" <<< "${mutant}"; then
  echo "${mutant}"
  fail "the test still passes with the lock deleted"
fi
if ! grep -qF "Test reverted: ${ASSERT_PANIC}" <<< "${mutant}"; then
  echo "${mutant}"
  fail "the mutant failed, but not on an assertion"
fi
echo "mutant: ${TEST} fails on an assertion"
echo "MUTANT-REENTRANCY: OK (real contract passes, lock deleted fails)"
