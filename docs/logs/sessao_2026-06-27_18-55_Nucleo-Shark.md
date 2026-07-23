# Log de sessão — Núcleo Shark Semana 1–2
**Data:** 2026-06-27 ~18:55  
**Executor:** Magrão (agente)  
**Task origem:** `DEVSYSTEM/devtasks/devtask_2026-06-27_18-39_Nucleo-Shark-Rebuild-Semana-1-2.txt`  
**Repo:** `/Users/leandrogrocha/Documents/DEV/ranking-pro-shark`

---

## Status geral

| Fase | Status |
|------|--------|
| Fase 0 — Bootstrap repo | ✅ CONCLUÍDO |
| Fase 1 — SQL Supabase | ✅ ARQUIVO PRONTO — projeto Supabase ainda NÃO criado |
| Fase 2 — Rotas e fluxo | ✅ CONCLUÍDO |
| Fase 3 — Deploy produção | ⏳ PENDENTE (Netlify + Supabase + teste 4G) |

---

## Commits git

```
c2fdbfc feat: nucleus qr-review-public-profile
b436d58 chore: shark mode nucleus scaffold
```

Branch: `main`  
Working tree: limpo (exceto `devtool/` untracked — pasta externa, não commitar)

---

## Arquivos criados

```
ranking-pro-shark/
├── .gitignore
├── README.md
├── netlify.toml
├── config.example.js          ← copiar para config.js (NÃO no git)
├── index.html
├── css/ranking-pro.css
├── js/
│   ├── api.js
│   ├── qr-service.js
│   ├── reviews-service.js
│   └── profile-service.js
├── qr/index.html              → /qr/?token=XXX
├── avaliar/index.html         → /avaliar/?token=XXX
├── p/index.html               → /p/?slug=XXX
├── dev/gerar-qr.html          → gerador QR (dev)
├── sql/001_nucleo.sql         → rodar no Supabase SQL Editor
├── scripts/build-config.sh    → gera config.js no deploy Netlify
└── devtasks/                  → cópia da devtask
```

---

## Servidor local

**Pode estar rodando em background** (PID verificar no outro console):

```bash
cd "/Users/leandrogrocha/Documents/DEV/ranking-pro-shark"
python3 -m http.server 8765
```

URLs testadas (todas 200 OK):
- http://localhost:8765/
- http://localhost:8765/qr/
- http://localhost:8765/avaliar/
- http://localhost:8765/p/
- http://localhost:8765/dev/gerar-qr.html

Para matar servidor antigo:
```bash
lsof -ti:8765 | xargs kill
```

---

## Próximos passos (ordem obrigatória)

### 1. Criar Supabase NOVO
- **NÃO** usar projeto antigo `pyywdhjstvhmarvzijji`
- Criar em https://supabase.com
- SQL Editor → colar conteúdo de `sql/001_nucleo.sql` → Run
- Confirmar seed: profissional `joao-barbeiro-teste`

### 2. Config local
```bash
cd "/Users/leandrogrocha/Documents/DEV/ranking-pro-shark"
cp config.example.js config.js
# Editar config.js:
#   SUPABASE_URL: 'https://SEU-PROJETO.supabase.co'
#   SUPABASE_ANON_KEY: 'sua-anon-key'
```

### 3. Teste local E2E
1. http://localhost:8765/dev/gerar-qr.html → gerar QR
2. Abrir URL do QR → avaliar (nota + comentário)
3. http://localhost:8765/p/?slug=joao-barbeiro-teste → ver avaliação
4. Reabrir mesmo QR → deve bloquear ("já registrada")
5. No Supabase: `UPDATE qr_sessions SET expires_at = NOW() - INTERVAL '1 hour'` → deve bloquear ("expirou")

### 4. Deploy Netlify
```bash
# Opção UI: New site from Git → publish directory "."
# Environment variables:
#   SUPABASE_URL
#   SUPABASE_ANON_KEY
# Build command: sh scripts/build-config.sh (já no netlify.toml)
```

### 5. Teste celular 4G (DoD)
- Gerar QR no desktop (produção)
- Escanear no celular via 4G (não localhost)
- Avaliar → ver perfil → reabrir QR bloqueado

---

## RPCs Supabase (backend)

| RPC | Função |
|-----|--------|
| `validate_qr_token(p_token)` | Valida QR antes de avaliar |
| `submit_qr_review(p_token, p_rating, p_comment)` | Único INSERT em reviews |
| `create_qr_session(p_professional_id, p_expires_hours)` | Gera sessão QR (dev) |

## Tabelas (só 3 no núcleo)
- `professionals`
- `qr_sessions`
- `reviews`

## Profissional de teste
- **Slug:** `joao-barbeiro-teste`
- **Nome:** João Barbeiro (Teste)

---

## Bloqueios / dependências externas

- ❌ Supabase projeto novo — precisa criar manualmente (sem CLI/token no ambiente)
- ❌ `config.js` — não criado (sem credenciais do projeto novo)
- ❌ Netlify deploy — sem CLI/token no ambiente
- ❌ Teste celular 4G — depende de deploy + Supabase

---

## O que NÃO foi feito (proposital — fora do escopo)

- Cadastro profissional/estabelecimento
- Auth Supabase completa
- Asaas / pagamento
- Copiar arquivos do MVP (`/Users/leandrogrocha/Documents/DEV/MVP Hanking PRO`)
- Reutilizar Supabase `pyywdhjstvhmarvzijji`

---

## Relatório Supervisor (preencher após deploy)

| Campo | Valor |
|-------|-------|
| URL produção | _pendente_ |
| Supabase project ID | _pendente_ |
| Slug teste | `joao-barbeiro-teste` |
| Commit feat | `c2fdbfc` |
| Teste celular 4G | _pendente_ |

---

*Log gerado automaticamente — retomar no outro console a partir do passo 1 (Supabase).*