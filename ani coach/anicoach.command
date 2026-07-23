#!/bin/bash
cd "$(dirname "$0")"
COACH_DIR="$(pwd)"
WINDOW_TITLE="Ani Coach"
SESSION_ID="$(date '+%Y%m%d-%H%M%S')"

osascript -e 'tell application "Terminal" to activate' \
          -e "tell application \"Terminal\" to set custom title of front window to \"$WINDOW_TITLE\""

GROK_BIN="${GROK_BIN:-$HOME/.grok/bin/grok}"
if [[ ! -x "$GROK_BIN" ]]; then
  GROK_BIN="$(command -v grok 2>/dev/null || true)"
fi

clear
printf '\n🎀 Ani Coach — App Project Manager\n'
printf 'Memory: memory/ (roles, projects, history)\n'
printf 'Session: %s\n\n' "$SESSION_ID"

if [[ ! -x "$GROK_BIN" ]]; then
  echo "⚠️  grok CLI não encontrado. Instale ou defina GROK_BIN."
  exec "$SHELL"
fi

chmod +x "$COACH_DIR/build-ani-prompt.sh" \
         "$COACH_DIR/log-memory.sh" \
         "$COACH_DIR/session-hook.sh" \
         "$COACH_DIR/register-project.sh" \
         "$COACH_DIR/add-role.sh" 2>/dev/null || true

"$COACH_DIR/session-hook.sh" start "$SESSION_ID"

PROMPT_FILE="$("$COACH_DIR/build-ani-prompt.sh")"
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "⚠️  Falha ao montar system prompt."
  exec "$SHELL"
fi

SYSTEM_PROMPT="$(<"$PROMPT_FILE")"

ROLE_COUNT="$(grep -c '^role:' "$COACH_DIR/memory/role-evolution.log" 2>/dev/null || echo 0)"
PROJECT_COUNT="$(find "$COACH_DIR/memory/projects" -name '*.md' ! -name registry.md 2>/dev/null | wc -l | tr -d ' ')"

printf 'Loaded: %s roles, %s project memories, session history\n' "$ROLE_COUNT" "$PROJECT_COUNT"
printf 'Chat: remember: | log decision: | update project: | session recap:\n\n'

export ANI_SESSION_ID="$SESSION_ID"
"$GROK_BIN" --cwd "$COACH_DIR" --system-prompt-override "$SYSTEM_PROMPT"
EXIT_CODE=$?

"$COACH_DIR/session-hook.sh" end "$SESSION_ID"
exit "$EXIT_CODE"