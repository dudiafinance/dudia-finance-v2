# Dudia Finance v2 - Memória de Desenvolvimento

## 📌 Status Atual
- **Data:** 14/04/2026
- **Versão:** 1.1.x (HOTFIX - User Auth Issues)
- **Fase:** Produção — Live em https://dudia-finance-v2.vercel.app
- **Último Commit:** `daa3a47` — "fix: improve user fallback with better logging and email handling"
- **Branch:** main

## 🚨 Bugs Críticos Corrigidos (14/04/2026)

## 🆕 Atualização desta sessão (14/04/2026)
- PRD criado: `docs/prd/USER-ONBOARDING-AUTH-LINK-PRD-2026-04-14.md`
- Hardening de vínculo de usuário em `src/lib/auth-utils.ts`:
  - Normalização de email (`trim + lowercase`)
  - Busca unificada por `clerkId` ou email normalizado
  - Update de `clerkId` quando ausente ou divergente
  - Recuperação de corrida em criação (releitura após erro de insert)
- Webhook Clerk reforçado em `src/app/api/webhooks/clerk/route.ts`:
  - Prioriza busca por `clerkId`
  - Fallback por email normalizado com comparação case-insensitive
  - Persistência de email normalizado no update/insert
- Contrato de API ajustado:
  - `payInvoiceSchema` não exige mais `userId` do cliente
  - Rota `pay-invoice` valida payload sem injetar `userId` externo
- Migração adicionada: `drizzle/0020_restore_users_clerk_id_uniqueness.sql`
  - Deduplica `clerk_id` legados mantendo o primeiro registro
  - Recria unicidade via índice parcial (`clerk_id IS NOT NULL`)
- Isolamento por usuário reforçado no motor financeiro (`src/lib/services/financial-engine.ts`):
  - `addTransaction` valida ownership de conta e categoria antes de inserir
  - `addCardTransaction` valida ownership de cartão e categoria antes de inserir
  - `depositToGoal` valida ownership de conta/categoria além da meta
  - `payCardInvoice` considera soft-delete em conta/cartão e valida categoria
- Migração aplicada com sucesso via `npm run db:migrate`.
- Testes executados com sucesso:
  - `npx vitest run src/test/validations.test.ts` (24/24)
  - `npm test` (114/114)
  - `npm run build` executado com sucesso (apenas warnings não bloqueantes de config Next.js)

### 1. MIDDLEWARE_INVOCATION_FAILED (500 Error)
- **Causa:** Redis era inicializado no topo do módulo `rate-limit.ts` com `!` (non-null assertion), crashando quando `UPSTASH_REDIS_REST_URL/TOKEN` não estavam definidos
- **Solução:** Inicialização preguiçosa (lazy init) - Redis só é criado quando `checkRateLimit()` é chamado e apenas se variáveis existirem
- **Arquivo:** `src/lib/rate-limit.ts`
- **Commit:** `a9f20b5`

### 2. 401 Unauthorized para Novos Usuários
- **Causa:** Webhook do Clerk pode não sincronizar a tempo, ou falhar. Usuários autenticados no Clerk mas não no DB retornavam 401
- **Solução:** Fallback automático em `getUserId()` que cria usuário no DB se não existir
- **Melhorias:**
  - Tenta buscar por `clerkId` primeiro
  - Fallback por email (tenta lowercase e original)
  - Criação automática do usuário com name e avatar do Clerk
  - Logs detalhados para debugging
- **Arquivo:** `src/lib/auth-utils.ts`
- **Commit:** `daa3a47`

### 3. 500 ao Criar Cartão (Novo Usuário)
- **Causa:** Relacionada ao bug #2 - `getUserId()` retornava `null` para usuários novos
- **Solução:** Mesmo fix do bug #2

### 4. Novos Usuários Não Podiam Acessar Nenhuma Tela
- **Sintomas:** 401 em `/api/notifications`, `/api/forecast`, `/api/reports`, `/api/credit-cards`
- **Causa Raiz:** Usuários autenticados no Clerk mas sem registro no banco de dados Neon
- **Solução:** Auto-criação de usuário via fallback em `getUserId()`

## 🔴 Fluxo Crítico de Autenticação

```
Novo usuário faz login no Clerk
    ↓
Clerk envia webhook user.created → /api/webhooks/clerk
    ↓
Webhook cria usuário no Neon com clerkId
    ↓
Usuário acessa API → getUserId() busca por clerkId
    ↓
Se clerkId não encontrado → tenta por email → cria usuário se não existir
```

**Nota:** O fallback automático (criação de usuário via `getUserId()`) agora funciona como backup se o webhook falhar ou ainda não tiver processado.

## ✅ Melhorias Implementadas (14/04/2026)

### Performance & Scale
- [x] **N+1 Corrigido** — `updateCardTransaction` usa `Promise.all()` para parcelas paralelas
- [x] **Upstash Redis Rate Limiting** — `@upstash/redis` substitui Map em memória (cross-instance)
- [x] **Polling otimizado** — Notificações: 2min → 5min
- [x] **staleTime aumentado** — Queries React Query agora com 2-10min de cache
- [x] **Cache-Control headers** — APIs públicas com cache otimizado
- [x] **9 índices DB** — Adicionados para soft-delete queries e otimização de leitura

### Segurança
- [x] **AES-256-GCM** — `openRouterApiKey` criptografado automaticamente no schema
- [x] **Logger estruturado** — 68 `console.log/error` substituídos por `src/lib/utils/logger.ts`
- [x] **Rate limit Redis** — Compartilhado entre instâncias (cross-instance) via Upstash
- [x] **Debug bypass** — Restrito a `NODE_ENV !== "production"`
- [x] **Migração /migrate** — Endpoint removido de produção
- [x] **Git history limpo** — Sentry DSN removido de todos os 145 commits (git filter-branch)

### Infraestrutura & CI/CD
- [x] **GitHub Actions CI/CD** — Pipeline: lint → build → deploy
- [x] **Vercel Secrets** — ORG_ID, PROJECT_ID, VERCEL_TOKEN, DATABASE_URL configurados
- [x] **Upstash Redis** — UPSTASH_REDIS_REST_URL e TOKEN configurados no Vercel
- [x] **Deploy production** — Live em dudia-finance-v2.vercel.app

### Qualidade de Código
- [x] **114 testes** passando (107 original + 7 novos de crypto)
- [x] **Lint** — 0 erros, 48 warnings (aceitáveis)
- [x] **Build** — Passando com Next.js 16 + Turbopack
- [x] **Fixtures de teste** — `src/test/fixtures.ts` para dados isolados

### Recursos Novos
- [x] **SSE Endpoint** — `/api/notifications/stream` criado para real-time (polling 5min ainda ativo como fallback)

## 📊 Capacidade Estimada (Free Tier)

| Cenário | Estimativa |
|---------|-----------|
| Vercel Free: reqs/dia | ~100k (≈ 27 usuários com 100 reqs/dia cada) |
| Vercel Free: CPU | ~20-30 usuários simultâneos (10ms CPU/ invocação) |
| Neon Free: conexões | ~50-100 simultâneas |
| Neon Free: storage | 0.5 GB (~100k transações) |

**Teto real free: ~20-30 usuários simultâneos antes de apertar.**

## 💰 Custo a Escala

| Usuários | Neon | Vercel | Total |
|----------|------|---------|-------|
| 1-20 (free) | $0 | $0 | **$0** |
| 20-50 | $0 | $5 | **$5** |
| 50-200 | $5 | $20 | **$25** |

## 🎯 Roadmap: 8.5 → 9.5

### Para chegar a 9.5/10:

#### 1. E2E Tests (prioridade ALTA)
- [ ] Configurar Playwright no CI com banco de dados de teste isolado
- [ ] Testes críticos: login, criar transação, criar cartão, dashboard load
- **Impacto:** +0.3 na nota

#### 2. Error Boundaries & Fallbacks (prioridade ALTA)
- [ ] Adicionar Error Boundary em todas as páginas
- [ ] Skeleton components para estados de loading
- [ ] Páginas de error customizadas (500, 404)
- **Impacto:** +0.2 na nota

#### 3. Telemetria & Monitoramento (prioridade MÉDIA)
- [ ] Health check endpoint `/api/health`
- [ ] Métricas customizadas no Sentry
- [ ] Dashboard de métricas no Vercel
- **Impacto:** +0.15 na nota

#### 4. SEO & PWA (prioridade MÉDIA)
- [ ] Meta tags dinâmicas por página
- [ ] manifest.json para PWA
- [ ] Sitemap.xml
- **Impacto:** +0.15 na nota

#### 5. Acessibilidade (prioridade BAIXA)
- [ ] Auditoria A11y com axe-core
- [ ] Skip links para navegação por teclado
- [ ] ARIA labels nos componentes principais
- **Impacto:** +0.2 na nota

### Estimativa de Esforço

| Tarefa | Tempo | Prioridade |
|--------|-------|------------|
| E2E Tests | 4-6h | ALTA |
| Error Boundaries | 2-3h | ALTA |
| Health Check | 1h | MÉDIA |
| SEO/PWA | 3-4h | MÉDIA |
| A11y Audit | 2-3h | BAIXA |

## 📁 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `docs/prd/FREE-SCALE-PRD-2026-04-14.md` | Plano de escala free |
| `docs/prd/AUDIT-IMPROVEMENTS-PRD-2026-04-14.md` | Plano de correções da auditoria |
| `docs/prd/VPS-HOSTING-PRD-2026-04-14.md` | Análise de VPS vs Neon |
| `docs/ARCHITECTURE.md` | Arquitetura técnica e métricas |
| `docs/DATABASE-HEALTH.md` | Saúde do banco de dados |
| `docs/VERCEL-SETUP.md` | Guia de setup Vercel + KV |

## 🧹 Limpeza Realizada (14/04/2026)
- Usuários de teste deletados do banco (2 usuários temporários)
- Conta `igorpminacio@hotmail.com` (ID: `debfc4b5-45eb-45dc-90d3-30a83d4e1064`) preservada
- Scripts de cleanup disponíveis em `scripts/cleanup-test-users.ts`
- Playwright reports e test-results removidos do git

## 🔧 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `scripts/add-missing-indexes.ts` | Adiciona 9 índices de otimização |
| `scripts/reset-igor-account.ts` | Reseta conta do Igor (wipe completo) |
| `scripts/cleanup-test-users.ts` | Remove usuários de teste |

## 🌐 URLs de Produção

- **App:** https://dudia-finance-v2.vercel.app
- **Vercel Dashboard:** https://vercel.com/dudiafinances-projects/dudia-finance-v2
- **Neon Dashboard:** https://neon.tech/console

## 🔐 Secrets Configurados

### GitHub Secrets
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`
- `DATABASE_URL`

### Vercel Environment (Production) - CRÍTICO
- `UPSTASH_REDIS_REST_URL` - Rate limiting (pode falhar graceful se ausente)
- `UPSTASH_REDIS_REST_TOKEN` - Rate limiting (pode falhar graceful se ausente)
- `CLERK_SECRET_KEY` - Autenticação (OBRIGATÓRIO)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Autenticação client-side (OBRIGATÓRIO)
- `CLERK_WEBHOOK_SECRET` - Sincronização usuário Clerk→DB (CRÍTICO para novos usuários)
- `DATABASE_URL` - Conexão Neon (OBRIGATÓRIO)
- `CRON_SECRET` - Endpoint de cron
- `OPENROUTER_API_KEY` - IA (opcional)
