# RELATÓRIO — Unificar Repo Híbrido Pós-Reset

**Data:** 27/06/2026  
**Delegação:** DELEGACAO-Unificar-Repo-Hibrido-Pos-Reset-Inicial.txt  
**Arquitetura:** Opção A (raiz MVP)

---

## 1. Mapa páginas

Ver `docs/MAPA-PAGINAS-LOADER-CSS.md`.

## 2. Arquivos movidos / apagados

| Ação | Arquivo |
|------|---------|
| Movido p/ raiz | `qr-service.js`, `profile-service.js`, `qr-reviews-service.js`, `site-paths.js`, `site-nav.js`, `nucleus.css` |
| Unificado | `loader.js` (raiz slim Fase 2) |
| Unificado | `api.js` (+ `RankingProAPI`) |
| Deprecado | `js/loader.js` → redirect |
| Removido | `css/base.css`, `css/style.css`, `css/proofly-glass.css`, `css/tinder-profile.css`, `css/nucleus.css`, `css/ranking-pro.css` |
| Restaurado | `sql/002_proofly_bridge.sql`, `scripts/test-proofly-bridge.sh` |
| Adicionado | `docs/BLUEPRINT-Navegacao-v2.md` |

## 3. Fluxo index → login → seletor → home

1. **index.html** — Entrar, Escanear QR (modal), Buscar profissionais
2. **login.html** — Google fake `leandro@proofly.com` → `proofly_session`
3. **selecionar-perfil.html** — cards multi-role (cliente + prof + estab Leandro)
4. **Home** — stubs `cliente.html` / `dashboard-profissional.html` / `dashboard-estabelecimento.html`

## 4. Quebrado / dívida técnica

- RPC `002_proofly_bridge.sql` **não rodado** no Supabase (404 em RPCs; REST OK)
- Páginas MVP legado (`perfil-page`, `meu-perfil`, etc.) carregam loader slim — `menu.js` não está no CORE; dock só na Fase 3
- `cliente.js` completo não portado (correto — Fase 3)
- Muitos HTML MVP na raiz ainda **untracked** no git (reset manual do Leandro)

## 5. Pronto para Fase 3?

**Sim, com ressalvas.** Loader e CSS unificados; Fase 2 funcional. Fase 3 precisa: `cliente.html` completo, `menu.js` dock, cortar match do `cliente.js`.

## Testes

| # | Resultado |
|---|-----------|
| Ponte Proofly REST | OK (`scripts/test-proofly-bridge.sh`) |
| Multi-perfil Leandro | SIM (API) |
| 002 SQL rodado | NÃO |
| Zero `js/loader.js` em HTML Fase 2 | OK |