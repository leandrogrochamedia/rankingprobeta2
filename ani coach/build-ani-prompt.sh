#!/bin/bash
# Assembles full Ani Coach system prompt: persona + model + all memory
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_PROMPT="$SCRIPT_DIR/agent-prompts/ani-coach-base.txt"
MODEL_FILE="$SCRIPT_DIR/ani-comp.md"
OUTPUT_FILE="$SCRIPT_DIR/.runtime/system-prompt.txt"
HISTORY_TAIL_LINES="${ANI_HISTORY_TAIL:-120}"

mkdir -p "$SCRIPT_DIR/.runtime"

append_file() {
  local title="$1"
  local file="$2"
  local tail_lines="${3:-0}"

  printf '## %s\n\n' "$title"
  if [[ -f "$file" ]] && [[ -s "$file" ]]; then
    if [[ "$tail_lines" -gt 0 ]]; then
      tail -n "$tail_lines" "$file"
    else
      cat "$file"
    fi
  else
    printf '_empty_\n'
  fi
  printf '\n\n'
}

{
  if [[ -f "$BASE_PROMPT" ]]; then
    cat "$BASE_PROMPT"
    printf '\n\n'
  fi

  append_file "Character Model (ani-comp.md)" "$MODEL_FILE"

  append_file "Role Evolution Log" "$SCRIPT_DIR/memory/role-evolution.log"

  append_file "App Projects Registry" "$SCRIPT_DIR/memory/projects/registry.md"

  printf '## Project Memory Files\n\n'
  shopt -s nullglob
  for proj in "$SCRIPT_DIR/memory/projects/"*.md; do
    [[ "$(basename "$proj")" == "registry.md" ]] && continue
    append_file "Project: $(basename "$proj" .md)" "$proj"
  done
  shopt -u nullglob

  append_file "Preferences (how user works)" "$SCRIPT_DIR/memory/history/preferences.log"

  append_file "Decisions Log" "$SCRIPT_DIR/memory/history/decisions.log"

  append_file "Recent Session History (latest entries)" \
    "$SCRIPT_DIR/memory/history/session-log.md" "$HISTORY_TAIL_LINES"

} > "$OUTPUT_FILE"

echo "$OUTPUT_FILE"