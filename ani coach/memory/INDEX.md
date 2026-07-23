# Ani Coach — Memory System

Append-only logs. **Never delete history** — Ani reads these every session.

| File | Purpose |
|------|---------|
| `role-evolution.log` | Persona roles Ani takes on (coach layers) |
| `projects/registry.md` | Index of app projects you manage |
| `projects/*.md` | Per-project facts, stack, goals, blockers |
| `history/session-log.md` | Session open/close + recap lines |
| `history/decisions.log` | Product & tech decisions |
| `history/preferences.log` | How you like to work (learned over time) |

## Tell Ani in chat

- `remember: …` → saves to preferences
- `log decision: …` → decisions.log
- `update project: …` → active project file
- `add role: …` → role-evolution.log
- `session recap: …` → session-log (she writes at end of work)

## Manual CLI

```bash
./log-memory.sh preference "I want terse answers for code"
./log-memory.sh decision "Ranking Pro: menu lateral stays DEV-only"
./register-project.sh "Ranking Pro" "../.." "Reputation app MVP"
```