#!/bin/bash
# Register an app project in Ani Coach memory
# Usage: ./register-project.sh "Project Name" "/path/to/project" "one-line description"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NAME="${1:?project name required}"
PATH_REF="${2:?path required}"
DESC="${3:-}"
REGISTRY="$SCRIPT_DIR/memory/projects/registry.md"
SLUG="$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')"
MEM_FILE="$SCRIPT_DIR/memory/projects/${SLUG}.md"
STAMP="$(date '+%Y-%m-%d %H:%M')"

mkdir -p "$SCRIPT_DIR/memory/projects"

if [[ ! -f "$MEM_FILE" ]]; then
  cat > "$MEM_FILE" <<EOF
# $NAME

**Path:** \`$PATH_REF\`  
**Registered:** $STAMP

## Description

$DESC

## Goals

_(Ani helps fill this)_

## Blockers

## Milestones
EOF
fi

if ! grep -qF "| $NAME |" "$REGISTRY" 2>/dev/null; then
  printf '| %s | `%s` | active | `%s.md` |\n' "$NAME" "$PATH_REF" "$SLUG" >> "$REGISTRY"
fi

"$SCRIPT_DIR/log-memory.sh" session "Project registered: $NAME ($PATH_REF)"
echo "✅ Project: $NAME → memory/projects/${SLUG}.md"