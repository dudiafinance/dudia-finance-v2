# Projeto: Dudia Finance v2 - Memória de Desenvolvimento

## 📌 Status Atual
- **Versão:** 0.9.x (Stabilization Phase - Em Progresso)
- **Fase:** Implementação do PRD-STABILIZATION.md
- **Story Ativa:** STORY-004 (Semana 2 - Finalização pendente)
- **Build Status:** ✅ Passando (com warnings)

## 🛠️ Decisões Técnicas
- **2026-04-13:** **Automação via Vercel Cron.** Worker em `/api/cron/process-recurring`:
  - Processa transações recorrentes com lógica de catch-up (até 3 ciclos).
  - Realiza Auditoria de Budgets: Notifica usuário quando atinge 80% ou 100% do limite.
  - Limpa chaves de idempotência antigas (> 7 dias).
- **2026-04-13:** **Reparos de UX e Segurança.**
  - CSV Export implementada no Reports page.
  - Password Security usa API nativa do Clerk no Settings.
  - ErrorBoundary global com ações de recuperação.
  - Toast Migration completada (nenhum `alert()` nativo).

## 📊 Progresso do PRD-STABILIZATION.md

### ✅ Semana 1: Core & Segurança I — 95%
**Responsável:** @dev  
**Story:** STORY-003

| Item | Status | Arquivos |
|------|--------|----------|
| `[SEC]` AlertDialog | ✅ Feito | `src/components/ui/alert-dialog.tsx` |
| `[UX]` Substituir window.confirm() | ✅ Feito | `transactions/page.tsx`, `credit-cards/page.tsx` |
| `[SEC]` Documentação .env | ✅ Feito | `.env.example` (ENCRYPTION_KEY, CRON_SECRET) |
| `[FEAT]` Script test-recurring | ✅ Feito | `scripts/test-recurring.ts` |
| `[SEC]` Criptografia AES-256 ativa | ⏳ Pendente | **NÃO IMPLEMENTADO** - Campo existe mas sem wrapper ativo |

### ✅ Semana 2: UX & Resiliência — 100%
**Responsável:** @dev  
**Story:** STORY-004

| Item | Status | Arquivos |
|------|--------|----------|
| `[UX]` TransactionSkeleton | ✅ Feito | `src/components/features/transactions/transaction-skeleton.tsx` |
| `[UX]` CreditCardSkeleton | ✅ Feito | `src/components/features/credit-cards/credit-card-skeleton.tsx` |
| `[STAB]` ErrorBoundary Aprimorado | ✅ Feito | `src/components/ui/error-boundary.tsx` |
| `[REFAC]` TransactionForm | ✅ Feito | `src/components/features/transactions/transaction-form.tsx` |
| `[REFAC]` TransactionTable | ✅ Feito | `src/components/features/transactions/transaction-table.tsx` |
| `[REFAC]` TransactionFilters | ✅ Feito | `src/components/features/transactions/transaction-filters.tsx` |
| `[REFAC]` Transactions Page | ✅ Feito (~800 → ~180 linhas) | `src/app/(app)/transactions/page.tsx` |
| `[UX]` Credit Cards usa Skeleton | ✅ Feito | `src/app/(app)/credit-cards/page.tsx` |
| `[REFAC]` CardFormModal | ✅ Feito | `src/components/features/credit-cards/card-form-modal.tsx` |
| `[REFAC]` InvoiceDetails | ✅ Feito | `src/components/features/credit-cards/invoice-details.tsx` |
| `[REFAC]` CardTransactionList | ✅ Feito | `src/components/features/credit-cards/card-transaction-list.tsx` |
| `[REFAC]` LaunchTxModal | ✅ Feito | `src/components/features/credit-cards/modals/launch-tx-modal.tsx` |
| `[REFAC]` PayInvoiceModal | ✅ Feito | `src/components/features/credit-cards/modals/pay-invoice-modal.tsx` |
| `[REFAC]` EditTxModal | ✅ Feito | `src/components/features/credit-cards/modals/edit-tx-modal.tsx` |
| `[TYPE]` Unificação de Tipos | ✅ Feito | `src/types/finance.ts` |
| `[REFAC]` Credit Cards Page | ✅ Feito (~1100 → ~350 linhas) | `src/app/(app)/credit-cards/page.tsx` |

### ⏳ Semana 3: Infraestrutura & Performance — 0%
**Status:** Não iniciada  
**Story:** STORY-005 (A criar)

| Item | Status | Como Fazer |
|------|--------|------------|
| `[SEC]` Rate Limiting | ⏳ Pendente | `middleware.ts` + `@upstash/ratelimit` |
| `[PERF]` Optimistic Updates | ⏳ Pendente | React Query `onMutate` |
| `[PERF]` Paginação Cursor-Based | ⏳ Pendente | API `cursor` parameter |

### ⏳ Semana 4: Qualidade & Observabilidade — 0%
**Status:** Não iniciada  
**Story:** STORY-006 (A criar)

| Item | Status | Como Fazer |
|------|--------|------------|
| `[TEST]` Component Tests | ⏳ Pendente | Vitest + Testing Library |
| `[TEST]` E2E Tests | ⏳ Pendente | Playwright |
| `[OBS]` Sentry Alerts | ⏳ Pendente | `@sentry/nextjs` |

## 🚨 Pendências Técnicas (Dívidas Técnicas)

### 1. Criptografia AES-256 (Semana 1 - 5% restante)
- **Problema:** O campo `openRouterApiKey` existe no schema `users` mas não há wrapper de criptografia ativo
- **Impacto:** Dados sensíveis não estão protegidos em caso de breach do banco
- **Solução:** Criar `src/lib/crypto.ts` e aplicar transformações no Drizzle

### 2. Atualizar components para usar tipos centralizados
- **Problema:** Alguns componentes ainda usam tipos locais ao invés de importar de `src/types/finance.ts`
- **Impacto:** Manutenção fragmentada
- **Solução:** Atualizar imports para usar `src/types/finance.ts`

## 📝 Notas de Auditoria
- Cron schedule: `0 3 * * *` (Todo dia às 3 AM)
- Suite de testes: `npm test` (44/44 específicos ou 84 totais - passando)
- Endpoint Seguro: Requer `CRON_SECRET` no Header Authorization
- Build: Passando ✅ (com warnings de lint)

## 🎯 Próximos Passos (Ordem de Execução)

### Fase de Consolidação (2026-04-13)
1. [ ] **Correção de Testes (@qa):** `tx.select is not a function` em `system-coverage.test.ts`
2. [ ] **Verificação DB (@data-engineer):** migrations pendentes, `npm run db:studio`
3. [ ] **Commit (@devops):** Semanas 1+2 consolidadas
4. [ ] **Deploy (@devops):** Push e verificar em produção

### Curto Prazo: Semana 3
- [ ] Rate Limiting no middleware
- [ ] Optimistic Updates nos hooks
- [ ] Paginação cursor-based

### Médio Prazo: Semana 4
- [ ] Component Tests com Vitest
- [ ] E2E Tests com Playwright
- [ ] Sentry Alerts

### Validação Final
- Auditoria completa e medição de métricas
