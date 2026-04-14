# Dudia Finance v2 - Memória de Desenvolvimento

## 📌 Status Atual
- **Data:** 14/04/2026
- **Versão:** 1.0.x (PRIMARY RELEASE)
- **Fase:** Produção — Otimizado para Escala Free
- **Último Commit:** `11738fc` — "feat: scale optimization + audit fixes + test coverage improvements"
- **Branch:** main

## ✅ Melhorias Implementadas (14/04/2026)

### Performance & Scale
- [x] **N+1 Corrigido** — `updateCardTransaction` usa `Promise.all()` para parcelas paralelas
- [x] **Redis Rate Limiting** — `@vercel/kv` substitui Map em memória (cross-instance)
- [x] **Polling otimizado** — Notificações: 2min → 5min
- [x] **staleTime aumentado** — Queries React Query agora com 2-10min de cache
- [x] **Cache-Control headers** — APIs públicas com `s-maxage=60, stale-while-revalidate=300`
- [x] **9 índices DB** — Adicionados para soft-delete queries e otimização de leitura

### Segurança
- [x] **AES-256-GCM** — `openRouterApiKey` criptografado automaticamente no schema
- [x] **Logger estruturado** — 68 `console.log/error` substituídos por `src/lib/utils/logger.ts`
- [x] **Rate limit Redis** — Compartilhado entre instâncias (cross-instance)
- [x] **Debug bypass** — Restrito a `NODE_ENV !== "production"`
- [x] **Migração /migrate** — Endpoint removido de produção

### Qualidade
- [x] **114 testes** passando (107 original + 7 novos de crypto)
- [x] **Fixtures de teste** — `src/test/fixtures.ts` para dados isolados
- [x] **Budget-hierarchy test** — Corrigido (cria seus próprios dados)
- [x] **GitHub Actions CI** — Pipeline de lint → build → test

### Infraestrutura
- [x] **KV Rate Limiting** — `src/lib/rate-limit.ts` com fail-open
- [x] **CI/CD** — `.github/workflows/ci.yml` configurado
- [x] **Setup guides** — `docs/VERCEL-SETUP.md`, `docs/DATABASE-HEALTH.md`

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
|----------|------|--------|-------|
| 1-20 (free) | $0 | $0 | **$0** |
| 20-50 | $0 | $5 | **$5** |
| 50-200 | $5 | $20 | **$25** |

## 📁 PRDs Criados

| Arquivo | Descrição |
|---------|-----------|
| `docs/prd/FREE-SCALE-PRD-2026-04-14.md` | Plano de escala free |
| `docs/prd/AUDIT-IMPROVEMENTS-PRD-2026-04-14.md` | Plano de correções da auditoria |
| `docs/prd/VPS-HOSTING-PRD-2026-04-14.md` | Análise de VPS vs Neon |
| `docs/ARCHITECTURE.md` | Arquitetura técnica e métricas |
| `docs/DATABASE-HEALTH.md` | Saúde do banco de dados |
| `docs/VERCEL-SETUP.md` | Guia de setup Vercel + KV |

## 🎯 Quando Pagar

### Pagar Neon ($5/mês)
- Quando storage > 0.5 GB
- Quando conexões simultâneas > 50

### Pagar Vercel ($5/mês)
- Quando reqs/dia > 80k (80% do free)
- Quando CPU time > 8ms por invocação
- Quando usuários simultâneos > 20

### NÃO — VPS nos EUA
- Custo 5x maior (~$28/mês) por ~15ms de melhoria
- Manutenção muito maior
- Só compensa quando Neon+Vercel não aguentarem mais

## 🧹 Limpeza Realizada (14/04/2026)
- Usuários de teste deletados do banco (2 usuários temporários)
- Conta `igorpminacio@hotmail.com` (ID: `debfc4b5-45eb-45dc-90d3-30a83d4e1064`) preservada
- Scripts de cleanup disponíveis em `scripts/cleanup-test-users.ts`
