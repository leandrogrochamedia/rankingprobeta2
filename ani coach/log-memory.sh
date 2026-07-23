#!/bin/bash
# Append to Ani Coach memory logs
# Usage: ./log-memory.sh <type> "message" [project]
# Types: session | decision | preference | project | role
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TYPE="${1:?type required: session|decision|preference|project|role}"
MSG="${2:?message required}"
PROJECT="${3:-}"
STAMP="$(date '+%Y-%m-%d %H:%M')"

mkdir -p "$SCRIPT_DIR/memory/history" "$SCRIPT_DIR/memory/projects"

case "$TYPE" in
  session)
    FILE="$SCRIPT_DIR/memory/history/session-log.md"
    cat >> "$FILE" <<EOF

---
[$STAMP] $MSG
---
EOF
    ;;
  decision)
    FILE="$SCRIPT_DIR/memory/history/decisions.log"
    cat >> "$FILE" <<EOF
---
[timestamp: $STAMP]
project: ${PROJECT:-general}
decision: $MSG
---
EOF
    ;;
  preference)
    FILE="$SCRIPT_DIR/memory/history/preferences.log"
    cat >> "$FILE" <<EOF
---
[timestamp: $STAMP]
preference: $MSG
---
EOF
    ;;
  project)
    SLUG="${PROJECT:-general}"
    SLUG="$(echo "$SLUG" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')"
    FILE="$SCRIPT_DIR/memory/projects/${SLUG}.md"
    if [[ ! -f "$FILE" ]]; then
      printf '# %s\n\n' "$PROJECT" > "$FILE"
    fi
    cat >> "$FILE" <<EOF

---
[$STAMP] $MSG
---
EOF
    ;;
  role)
    FILE="$SCRIPT_DIR/memory/role-evolution.log"
    cat >> "$FILE" <<EOF
---
[timestamp: $STAMP]
role: $MSG
summary: (manual entry)
traits: (see message)
evolution: manual via log-memory.sh
---
EOF
    ;;
  *)
    echo "Unknown type: $TYPE" >&2
    exit 1
    ;;
esac

echo "✅ Logged to $(basename "$FILE")"