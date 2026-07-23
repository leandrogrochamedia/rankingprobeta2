# Ponte Proofly — sessão Magrão 27/06/2026

## Código
- Commit: `c0d09a5` feat: proofly bridge — rpcs + id profile + anon qr review
- `config.js` local criado (gitignored) com credenciais MVP

## SQL 002 — AÇÃO MANUAL NECESSÁRIA
Ambiente sem psql/supabase CLI/service_role. RPCs ainda não existem no Proofly.

1. Abrir Supabase → projeto `pyywdhjstvhmarvzijji` → SQL Editor
2. Colar e executar `sql/002_proofly_bridge.sql`
3. Rodar: `./scripts/test-proofly-bridge.sh`
4. Testar UI: `python3 -m http.server 8765` → `dev/gerar-qr.html`

## Teste API (antes do 002)
- Profissionais Proofly: OK (ex. Abel Watanabe)
- RPC create_qr_session: PGRST202 (função ausente)