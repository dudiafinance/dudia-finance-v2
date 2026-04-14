# Dudia Finance v2 - Memória de Desenvolvimento

## 📌 Status Atual
- **Data:** 14/04/2026
- **Versão:** 1.0.x (PRIMARY RELEASE)
- **Fase:** Produção — Live em https://dudia-finance-v2.vercel.app
- **Último Commit:** `3816aed` — "fix: remove db:setup from vercel build command"
- **Branch:** main

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

### Vercel Environment (Production)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_WEBHOOK_SECRET`
- `CRON_SECRET`
- `OPENROUTER_API_KEY`
