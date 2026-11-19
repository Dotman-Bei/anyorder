#!/usr/bin/env bash
# docs:3 gate: one gas story. Every clear() gas figure in README.md and in
# section 9 of the core design spec carries the label of the measurement it
# comes from, and figures of a known set carry exactly their own set's label:
#   gas spike (prototype, every order filled)
#   architect's planning measurement (real contract, order mix not recorded)
#   gas table (real contract, demo order mix)
# A table row counts as labelled when the row itself or its table's header line
# carries the label. The per-transaction cap (16,777,216) and the half-cap rule
# (8,388,608) are limits, not measurements, and need no label. In README.md a
# line is in scope when it lies under "### Gas" or contains the word "gas"; in
# the spec, every line of section 9.
#
#   bash scripts/check-gas-story.sh      last line: GAS-STORY: OK
set -euo pipefail
cd "$(dirname "$0")/.."

SPEC=docs/superpowers/specs/2026-11-18-anyorder-core-design.md

check_file() {
  awk -v file="$1" -v mode="$2" '
    BEGIN {
      SPIKE = "gas spike (prototype, every order filled)"
      PLAN = "architect\047s planning measurement (real contract, order mix not recorded)"
      TABLE = "gas table (real contract, demo order mix)"
      split("409402 2161907 4426468", a, " "); for (i in a) set[a[i]] = SPIKE
      split("333508 1446094 2809751", a, " "); for (i in a) set[a[i]] = PLAN
      split("358462 807348 1567284 2380590 3156298", a, " "); for (i in a) set[a[i]] = TABLE
      bad = 0; inGas = 0; inSec = 0; prevRow = 0; header = ""; seenPlan = 0; seenTable = 0
    }
    {
      line = $0
      row = (line ~ /^\|/)
      if (row && !prevRow) header = line
      if (!row) header = ""
      prevRow = row
      if (mode == "readme") {
        if (line ~ /^### Gas$/) { inGas = 1 } else if (line ~ /^#/) { inGas = 0 }
        scope = inGas || (tolower(line) ~ /(^|[^a-z-])gas([^a-z-]|$)/)
      } else {
        if (line ~ /^## 9\. Gas$/) { inSec = 1 } else if (line ~ /^## /) { inSec = 0 }
        scope = inSec
      }
      if (!scope) next
      text = tolower(line " " (row ? header : ""))
      rest = line
      while (match(rest, /[0-9]{1,3}(,[0-9]{3})+|[0-9]{6,}/)) {
        fig = substr(rest, RSTART, RLENGTH); rest = substr(rest, RSTART + RLENGTH)
        n = fig; gsub(/,/, "", n)
        if (n == "16777216" || n == "8388608") continue
        if (n in set) {
          ok = index(text, set[n]) > 0
          if (ok && n == "2809751") seenPlan = 1
          if (ok && n == "3156298") seenTable = 1
        } else {
          ok = index(text, SPIKE) || index(text, PLAN) || index(text, TABLE)
        }
        if (!ok) { printf "UNLABELLED %s:%d: %s\n", file, NR, fig; bad = 1 }
      }
    }
    END {
      if (!seenPlan) { printf "MISSING %s: 2,809,751 with its label\n", file; bad = 1 }
      if (!seenTable) { printf "MISSING %s: 3,156,298 with its label\n", file; bad = 1 }
      exit bad
    }
  ' "$1"
}

status=0
check_file README.md readme || status=1
check_file "$SPEC" spec || status=1
if [ "$status" -eq 0 ]; then echo 'GAS-STORY: OK'; else echo 'GAS-STORY: FAIL'; exit 1; fi
