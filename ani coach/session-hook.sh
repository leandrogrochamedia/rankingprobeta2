#!/bin/bash
# Session lifecycle hooks for Ani Coach memory
# Usage: session-hook.sh start|end [session_id]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ACTION="${1:?start or end}"
SID="${2:-$(date '+%Y%m%d-%H%M%S')}"
STAMP="$(date '+%Y-%m-%d %H:%M')"

case "$ACTION" in
  start)
    "$SCRIPT_DIR/log-memory.sh" session "SESSION START id=$SID"
    ;;
  end)
    "$SCRIPT_DIR/log-memory.sh" session "SESSION END id=$SID"
    ;;
  *)
    echo "Usage: session-hook.sh start|end [session_id]" >&2
    exit 1
    ;;
esac