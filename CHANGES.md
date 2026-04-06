# Correções e Melhorias — 2026-04-06

Baseado na auditoria do SYSTEM_REPORTS.md, todos os itens críticos e de alta prioridade foram corrigidos, além de melhorias adicionais identificadas durante a revisão.

---

## Segurança (CRITICAL / HIGH)

### 1. Debug endpoint: filtro de userId adicionado
**Arquivo:** `src/app/api/debug/transactions/route.ts`  
**Problema:** Endpoint retornava TODAS as transações do banco sem filtrar por usuário.  
**Correção:** Adicionado `where(eq(cardTransactions.userId, userId))` na query.

### 2. Endpoint de migração: secret padrão removido
**Arquivo:** `src/app/api/migrate/route.ts`  
**Problema:** Usava `"migration-secret-2026"` como fallback quando a env `MIGRATION_SECRET` não estava definida.  
**Correção:** Agora retorna 403 se a variável de ambiente não estiver configurada — endpoint fica efetivamente desabilitado em produção sem a env.

### 3. Exposição de `error.message` / `error.stack` removida
**Arquivos:** `src/app/api/goals/route.ts`, `src/app/api/credit-cards/[id]/transactions/route.ts`, `src/app/api/migrate/route.ts`, `src/app/api/debug/transactions/route.ts`  
**Problema:** Detalhes internos do erro eram enviados ao cliente.  
**Correção:** Todas as rotas agora retornam mensagens genéricas. Detalhes continuam logados no servidor via `console.error`.

### 4. Validação Zod adicionada em transações de cartão
**Arquivo:** `src/app/api/credit-cards/[id]/transactions/route.ts`  
**Problema:** Validação manual frágil usando apenas checagem de campos obrigatórios.  
**Correção:** Criado `cardTransactionSchema` em `src/lib/validations/index.ts` com validação completa de todos os campos, tipos e limites.

### 5. Validação Zod adicionada em criação de cartão de crédito
**Arquivo:** `src/app/api/credit-cards/route.ts`  
**Problema:** `dueDay` e `closingDay` não tinham validação de range (1–31).  
**Correção:** Criado `creditCardSchema` com `.min(1).max(31)` nos campos de dia, substituindo a validação manual.

### 6. Headers de segurança adicionados
**Arquivo:** `next.config.ts`  
**Problema:** Nenhum header de segurança configurado.  
**Correção:** Adicionados para todas as rotas:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-DNS-Prefetch-Control: on`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 7. Logger SMTP não expõe mais dados em produção
**Arquivo:** `src/lib/services/email.ts`  
**Problema:** `logger: true` sempre ativo — pode expor configurações SMTP em logs de produção.  
**Correção:** `logger` agora é condicional (`NODE_ENV === "development"`). `debug` desabilitado completamente.

---

## Estabilidade (HIGH)

### 8. Top-level `await ensureMigration()` removido de goals/route.ts
**Arquivo:** `src/app/api/goals/route.ts`  
**Problema:** Executava DDL de banco a cada importação do módulo, causando race conditions em serverless e bloqueio de cold start.  
**Correção:** Todo o bloco `ensureMigration` foi removido. A migração já está aplicada no banco (via `/api/migrate`) e refletida no schema Drizzle — não há mais necessidade de executá-la em runtime.

---

## Performance (MEDIUM)

### 9. React Query: `staleTime` configurado
**Arquivo:** `src/hooks/use-api.ts`  
**Problema:** Sem `staleTime`, cada montagem de componente disparava um refetch desnecessário.  
**Correção:**
- Dados estáticos (accounts, categories, tags, budgets, goals): `staleTime: 5 minutos`
- Dados dinâmicos (transactions, dashboard): `staleTime: 1 minuto`

### 10. Dashboard: N+1 lookup substituído por Map
**Arquivo:** `src/app/api/dashboard/route.ts`  
**Problema:** Para cada categoria em `topExpenses`, `Array.find()` percorria o array inteiro — O(n) por categoria.  
**Correção:** Criado `Map<id, category>` uma vez antes do loop — O(1) por lookup.

---

## Qualidade de Código (MEDIUM)

### 11. Cálculo de parcelas: arredondamento correto
**Arquivo:** `src/app/api/credit-cards/[id]/transactions/route.ts`  
**Problema:** Divisão simples `amount / n` gerava centavos perdidos (ex: R$ 100 / 3 = R$ 33.33 × 3 = R$ 99.99).  
**Correção:** Implementado floor no valor base e a diferença (remainder) é acumulada na última parcela, garantindo que a soma das parcelas sempre seja igual ao total.

---

## Índices de Banco de Dados (MEDIUM)

### 12. Índices adicionados no schema Drizzle
**Arquivo:** `src/lib/db/schema/index.ts`  
**Problema:** Sem índices explícitos, queries frequentes em `userId`, `date`, `accountId`, `cardId` podiam ser lentas.  
**Correção:** Adicionados índices nas tabelas de maior acesso:
- `transactions`: `userId`, `date`, `accountId`, `categoryId`
- `card_transactions`: `userId`, `cardId`, `(invoiceMonth, invoiceYear)`

> **Nota:** Os índices estão definidos no schema Drizzle para documentação e geração futura de migrations. Para aplicar em produção, execute `npx drizzle-kit push` ou gere uma migration com `npx drizzle-kit generate`.

---

## Resumo

| # | Categoria | Severidade | Status |
|---|-----------|-----------|--------|
| 1 | Debug endpoint sem filtro de userId | CRITICAL | ✅ Corrigido |
| 2 | Secret padrão no endpoint de migração | CRITICAL | ✅ Corrigido |
| 3 | `error.message` exposto nas respostas | HIGH | ✅ Corrigido |
| 4 | Sem validação Zod em transações de cartão | HIGH | ✅ Corrigido |
| 5 | `dueDay`/`closingDay` sem validação | LOW→HIGH | ✅ Corrigido |
| 6 | Headers de segurança ausentes | MEDIUM | ✅ Corrigido |
| 7 | Logger SMTP expõe dados em produção | HIGH | ✅ Corrigido |
| 8 | Top-level await `ensureMigration` | HIGH | ✅ Corrigido |
| 9 | React Query sem `staleTime` | MEDIUM | ✅ Corrigido |
| 10 | N+1 lookup em dashboard | MEDIUM | ✅ Corrigido |
| 11 | Arredondamento de parcelas incorreto | MEDIUM | ✅ Corrigido |
| 12 | Índices ausentes no schema | MEDIUM | ✅ Adicionado |
