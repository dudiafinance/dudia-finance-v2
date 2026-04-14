# PRD: Escala Free — Plano de Crescimento Sem Gastar Nada

**Versão:** 1.0  
**Data:** 14/04/2026  
**Objetivo:** Permitir que o sistema escale de 1 para até 50+ usuários simultâneos mantendo tudo free ou com custo mínimo.

---

## 1. Capacidade Atual — Quanto o Sistema Aguenta no Free

### Limites por Serviço

| Serviço | Plano | Limite | Observação |
|---------|-------|--------|------------|
| **Vercel** | Free | 100k reqs/dia + 10ms CPU/ invocação |after 100k, bloqueia até reset |
| **Vercel** | $5/mês | 10M reqs/dia + 30ms CPU/ invocação | Limite prático ~500 users simultâneos |
| **Neon** | Free | 0.5 GB storage, 3 branches | ~100k transações antes de storage cheio |
| **Neon** | $5/mês | 5 GB storage | ~1M transações |
| **Cloudflare KV** | Free | 1M reads/dia, 100k writes/dia | Rate limit próprio |
| **Cloudflare Workers** | Free | 100k reqs/dia | Alternativa ao Vercel |

### Cálculo Real de Usuários Simultâneos

**Hipótese:** 1 usuário = 1 página a cada 30 segundos + polling de notificações (2 min).

```
1 usuário ≈ 62 requests/minuto ≈ 90k requests/mês
```

| Plano | Requests/mês | Usuários simultâneos estimados |
|-------|-------------|-------------------------------|
| Vercel Free | 100k | ~1-2 usuários leves |
| Vercel $5 | 10M | ~50-100 usuários reais |
| Neon Free | Ilimitado em conexões | ~50-100 conexões simultâneas |

**Cálculo CPU (mais realista que requests):**
```
Vercel Free: 10ms CPU por invocação
Página média: 200-500ms CPU (SSR + DB queries)

= 20-50 invocações por usuário antes do CPU resetar
= ~20-30 usuários simultâneos no free é o teto real
```

**Veredicto de capacidade:**
| Cenário | Estimativa |
|---------|-----------|
| 1-20 usuários simultâneos | ✅ Free tier funciona bem |
| 20-50 usuários simultâneos | ⚠️ Vercel Free começa a chiar |
| 50-100+ simultâneos | ❌ Precisa de plano pago |

---

## 2. Problemas Identificados que Limitam Escala (AGORA)

### CRÍTICO — Corrigir Agora

#### P1: CPU Time no Vercel Free
- **Problema:** Cada invocação SSR consome CPU do Vercel
- **Cálculo:** Página com DB query = ~200-500ms CPU
- **Impacto:** ~20-30 invocações por usuário por dia no free tier
- **Solução:** Reduzir CPU por request o máximo possível

#### P2: Rate Limit do Vercel Free
- **Problema:** 100k reqs/dia parece muito, mas cada page view = múltiplas API calls
- **Cálculo:** 1 page view = ~10-20 requests (SSR + API + static)
- **Impacto:** ~5k-10k page views/dia no free tier
- **Solução:** Cachear tudo que é possível no front

#### P3: Conexões simultâneas no Neon
- **Problema:** Cada invocação serverless abre 1 conexão Postgres
- **Impacto:** Com 50+ invocações simultâneas, pode bater no limit do Neon
- **Solução:** Já está com `max: 1` — correto. Mas нужно следить.

### MÉDIO — Corrigir no roadmap

#### P4: Polling de Notificações
- **Problema:** 1 user = 1 req a cada 2 min para polling
- **Impacto:** 50 users = 25 reqs/min só em notificações
- **Solução:** Aumentar intervalo de polling para 5 min (tolerável)

#### P5: Queries sem cache
- **Problema:** Dashboard, budgets, categories — toda请求 vai no banco
- **Impacto:** CPU alto + latência alta
- **Solução:** Cachear respostas com staleTime adequado

---

## 3. Plano de Ação — Corrigir AGORA

### Ações Imediatas (Hoje)

| ID | Ação | Impacto | Prioridade |
|----|------|---------|------------|
| A1 | Aplicar 9 índices faltantes no banco | -30% CPU em queries | CRÍTICA |
| A2 | Corrigir polling de notificações (2min → 5min) | -40% requests | ALTA |
| A3 | Aumentar staleTime das queries React Query | -50% requests desnecessários | ALTA |
| A4 | Cachear Dashboard com revalidate: 60s | -30% CPU | MÉDIA |
| A5 | Cachear rotas de categories/budgets com revalidate | -20% CPU | MÉDIA |

### Ações de Monitoramento

| Métrica | Como medir | Threshold |
|---------|-----------|-----------|
| CPU time/vies | Vercel Analytics | < 8ms/vies (free) |
| Requests/dia | Vercel Analytics | < 80k/dia (80% do limite) |
| DB connections | Neon console | < 50 simultaneous |
| Error rate | Sentry | < 1% |
| Latency p50 | Vercel Analytics | < 500ms |

---

## 4. Estimativa de Custo a Medida que Cresce

| Usuários simultâneos | Neon | Vercel | Total |
|---------------------|------|--------|-------|
| 1-20 (free) | $0 | $0 | **$0** |
| 20-50 (transição) | $0 | $0-$5 | **$0-$5** |
| 50-200 | $5 | $5-$20 | **$10-$25** |
| 200-1000 | $20 | $20-$100 | **$40-$120** |

---

## 5. Quando Pagar Cada Serviço

### Pagar Neon quando:
- Storage > 0.5 GB (quase impossível no free com dados text)
- Conexões simultâneas > 50 (raro em app financeiro)
- Reads/writes > 1M/dia (muito alto para app financeiro)

### Pagar Vercel quando:
- Requests/dia > 80k (80% do free)
- CPU time > 8ms por invocação
- Usuários simultâneos > 20

### Migrar para Cloudflare quando:
- Vercel ficar muito caro
- Precisar de mais controle de edge
- Aceitarlimitação em Next.js App Router

---

## 6. Setup Recomendado para Escala Free

```
┌─────────────────────────────────────────────┐
│  FRONTEND + API                            │
│  Vercel (Free)                             │
│  - ISR em páginas estáticas                │
│  - staleTime: 5-10 min em queries          │
│  - Polling: 5 min (não 2 min)              │
│  - Cache-Control headers em APIs            │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  DATABASE                                  │
│  Neon (Free)                               │
│  - 9 índices otimizados                    │
│  - max: 1 conexão por função              │
│  - Query cache: ativo                      │
└─────────────────────────────────────────────┘
```

---

## 7. Checklist de Otimização

- [ ] Índices aplicados no banco (scripts/add-missing-indexes.ts)
- [ ] Polling de notificações: 2min → 5min
- [ ] staleTime de queries aumentado para 5min
- [ ] Dashboard com ISR/revalidate: 60s
- [ ] categories/budgets cacheados
- [ ] build passando ✅
- [ ] testes 114/114 ✅
- [ ] rate limiting Redis funcionando ✅
- [ ] sem console.log em produção ✅
