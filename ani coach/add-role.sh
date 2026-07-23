#!/bin/bash
# Manually append a role to Ani Coach memory log
# Usage: ./add-role.sh "Role Name" "summary" "trait1, trait2" ["evolution note"]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MEMORY_FILE="$SCRIPT_DIR/memory/role-evolution.log"
ROLE_NAME="${1:?role name required}"
SUMMARY="${2:?summary required}"
TRAITS="${3:-helpful, clear}"
EVOLUTION="${4:-initial}"

mkdir -p "$(dirname "$MEMORY_FILE")"
STAMP="$(date '+%Y-%m-%d %H:%M')"

cat >> "$MEMORY_FILE" <<EOF
---
[timestamp: $STAMP]
role: $ROLE_NAME
summary: $SUMMARY
traits: $TRAITS
evolution: $EVOLUTION
---
EOF

printf '✅ Role logged: %s\n' "$ROLE_NAME"
printf '   → %s\n' "$MEMORY_FILE"