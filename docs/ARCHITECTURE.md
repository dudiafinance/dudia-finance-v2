# Arquitetura Técnica — Dudia Finance v2

## Visão Geral do Sistema
- Frontend: Next.js 16 (App Router) + React 19 + Tailwind CSS
- Backend: Next.js Server Actions + API Routes
- ORM: Drizzle ORM
- Database: PostgreSQL (Neon) — serverless
- Auth: Clerk
- Infra: Vercel (serverless functions)

## Estratégia de Escalabilidade

### Camada de Aplicação
- Vercel automatic scaling: 100+ instâncias simultâneas
- Rate limiting: Redis (Vercel KV) — compartilhado entre todas as instâncias ✅
- Stateless: Sem estado em memória entre requisições ✅

### Camada de Dados
- Neon Serverless: até 100 conexões simultâneas
- Connection pool: 1 conexão por função serverless
- Estimated max concurrent users: ~50-100 antes de connection pressure

### Camada de Cache
- React Query com staleTime configurado (1-5 minutos)
- Dados de sessão: Clerk (gerenciado externamente)
- Não há cache Redis para dados de aplicação (decisão de design — preferiu-se consistência sobre velocidade)

## Métricas de Produção (SLIs)

| Métrica | Target | Current |
|---------|--------|---------|
| API Latency (p50) | < 200ms | unknown |
| API Latency (p99) | < 1000ms | unknown |
| Error Rate | < 1% | unknown |
| Availability | > 99.5% | unknown |
| Build Time | < 120s | ~90s |

## Proposta de Melhorias de Escala

1. **Curto prazo:** Adicionar Vercel KV para cache de queries frequentes (dashboard, budgets)
2. **Médio prazo:** Migrar polling de notificações para Server-Sent Events
3. **Longo prazo:** Considerar API Gateway (Vercel Edge) para offload de autenticação e rate limiting

## Análise de Riscos

### Risco: Conexões Neon
**Severidade:** Média

Com `max: 1` conexão por função serverless e Neon com limite de 100 conexões:
- Vercel pode escalar para 100+ instâncias
- Em burst de tráfego, conexões podem ser saturadas
- Mitigação: O `idle_timeout: 20s` ajuda a liberar conexões rapidamente

### Risco: Cron Job em Múltiplas Instâncias
**Severidade:** Baixa

O endpoint `/api/cron/process-recurring` é protegido por `CRON_SECRET`:
- Vercel Cron faz 请求 HTTP, não execução direta
- Sem lock distribuído, múltiplas instâncias podem processar a mesma recorrência
- Mitigação atual: MAX_CATCH_UP = 3 previne duplicatas em massa
- Recomendação futura: Adicionar idempotency key para operações de cron
