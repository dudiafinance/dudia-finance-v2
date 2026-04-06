# Correções e Melhorias — 2026-04-06

Baseado na auditoria do SYSTEM_REPORTS.md e varredura completa posterior do código, todos os itens críticos, de alta e média prioridade foram corrigidos.

---

## Varredura Completa — Rodada 2 (2026-04-06)

### Segurança (CRITICAL — IDOR)

#### 13. Verificação de ownership do cartão antes de criar transações
**Arquivo:** `src/app/api/credit-cards/[id]/transactions/route.ts`  
**Problema:** POST não validava se o `cardId` da URL pertencia ao usuário autenticado. Qualquer usuário podia lançar transações no cartão de outro usuário conhecendo o UUID.  
**Correção:** Adicionada query de verificação `SELECT id FROM credit_cards WHERE id = cardId AND user_id = userId` antes de qualquer inserção.

#### 14. Verificação de ownership da meta antes de criar contribuições
**Arquivo:** `src/app/api/goal-contributions/route.ts`  
**Problema:** POST não validava se o `goalId` do body pertencia ao usuário. Permitia manipulação financeira de metas de outros usuários.  
**Correção:** Adicionada query de verificação `SELECT id FROM goals WHERE id = goalId AND user_id = userId` antes do insert.

#### 15. Remoção de `as any` em código de autenticação
**Arquivos:** `src/auth.ts`, `src/lib/auth-utils.ts`  
**Problema:** `(session.user as any).id` e `(session?.user as any)?.id` — tipo inseguro em código crítico de autenticação. O tipo já estava declarado corretamente em `src/types/next-auth.d.ts`.  
**Correção:** Removidos os casts, código usa tipos corretos diretamente.

### Validação (HIGH)

#### 16. Validação de ordem de datas em orçamentos e metas
**Arquivo:** `src/lib/validations/index.ts`  
**Problema:** Schemas de `budgetSchema` e `goalSchema` não validavam se `endDate > startDate`. Usuários podiam criar registros com datas invertidas.  
**Correção:** Adicionados refinements Zod com mensagem de erro clara em ambos os schemas.

#### 17. Validação Zod no PUT de cartão de crédito
**Arquivo:** `src/app/api/credit-cards/[id]/route.ts`  
**Problema:** Atualização usava whitelist manual com `updateData as any`, sem validação de tipos ou ranges (dueDay/closingDay).  
**Correção:** Substituído por `creditCardSchema.partial().safeParse()`, incluindo validação 1–31 nos dias.

### Qualidade de Código (MEDIUM)

#### 18. `updateData: any` substituído por `Record<string, unknown>`
**Arquivos:** `src/app/api/goals/[id]/route.ts`, `src/app/api/goal-contributions/[id]/route.ts`, `src/app/api/transactions/[id]/route.ts`  
**Correção:** Tipo explícito e seguro em todos os objetos de update parcial.

#### 19. `error.message` restante removido de goals/[id]
**Arquivo:** `src/app/api/goals/[id]/route.ts`  
**Correção:** Substituído por mensagem genérica.

#### 20. Try/catch adicionado em todos os GET routes
**Arquivos:** `accounts/route.ts`, `categories/route.ts`, `budgets/route.ts`, `goals/route.ts`, `transactions/route.ts`, `forecast/route.ts`  
**Problema:** Erros de banco retornavam 500 sem tratamento.  
**Correção:** Try/catch com `console.error` no servidor e mensagem genérica ao cliente.

#### 21. Parâmetro `email` não utilizado removido do debug endpoint
**Arquivo:** `src/app/api/debug/transactions/route.ts`  
**Correção:** Parâmetro removido, função simplificada, `userId` não mais exposto na resposta.

### Banco de Dados

#### 22. Tabela `goal_contributions` criada em produção
**Problema:** A tabela existia no schema Drizzle mas nunca havia sido criada no banco de dados de produção.  
**Correção:** Tabela criada via SQL direto com todas as colunas, constraints e índices.

#### 23. Índices adicionados para `budgets` e `goals`
**Schema + Banco:** `budgets_user_id_idx`, `goals_user_id_idx`, `goal_contributions_goal_id_idx`, `goal_contributions_user_id_idx`, `goal_contributions_month_year_idx`

---

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
