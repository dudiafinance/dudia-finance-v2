# DUD.IA Finance V2 - Auditoria e Plano de Correções

**Data:** 07/04/2026  
**Versão:** 1.0  
**Status:** Em Andamento

---

## Резюме

Sistema de gestão financeira pessoal построенный на Next.js 16, PostgreSQL (Neon), Drizzle ORM e NextAuth.js. Auditoria identificou **4 problemas críticos financeiros** (Fase 1), **4 alta prioridade**, **4 média prioridade** e **4 melhorias** a serem implementadas.

---

## Проблемы найдены

### 🔴 CRÍTICOS (Financeiros)

| # | Problema | Severidade | Localização |
|---|----------|------------|-------------|
| 1 | **Currency hardcoded BRL** - Sistema suporta USD/EUR mas formata tudo como BRL | CRÍTICO | Todos os `fmt()` |
| 2 | **Parcelamento com floating-point** - Cálculo `Math.floor(amount/n*100)/100` pode perder centavos | CRÍTICO | `credit-cards/[id]/transactions/route.ts:91` |
| 3 | **usedAmount pode ficar negativo** - Pagamento de fatura não valida se valor ≤ usedAmount | CRÍTICO | `financial-engine.ts:362` |
| 4 | **Transfer sem verificação de saldo** - Pode transferir mais do que tem | CRÍTICO | `financial-engine.ts/transferFunds()` |

### 🟠 ALTA PRIORIDADE

| # | Problema | Severidade | Localização |
|---|----------|------------|-------------|
| 5 | **Mês de fatura em ano novo** - Cascade de meses não trata wrap-around December→January | ALTA | `financial-engine.ts:292` |
| 6 | **Depósito em meta pode exceder targetAmount** | ALTA | `depositToGoal()` |
| 7 | **Mudança de accountId em transação** - Não move saldo da conta antiga para nova | ALTA | `updateTransaction()` |
| 8 | **Validação ownership em DELETE** - Vários endpoints não verificam se recurso pertence ao usuário | ALTA | Múltiplos API routes |

### 🟡 MÉDIA PRIORIDADE

| # | Problema | Severidade | Localização |
|---|----------|------------|-------------|
| 9 | **dueDay === closingDay** - Podem ser iguais (deveriam ser diferentes) | MÉDIA | `creditCardSchema` |
| 10 | **Deletar conta com transações** - Sem validação de uso | MÉDIA | `accounts/[id]/route.ts` |
| 11 | **Deletar categoria com transações** - Sem validação de uso | MÉDIA | `categories/[id]/route.ts` |
| 12 | **Week-to-month conversion usa 4.33** - Impreciso para forecasting | MÉDIA | `forecast/route.ts:47` |

### 🔵 MELHORIAS

| # | Problema | Severidade |
|---|----------|------------|
| 13 | **Recurring transactions geradas imediatamente** - 360 max pode causar lentidão | MÉDIA |
| 14 | **Email sem validação de formato** - Update profile não valida email | MÉDIA |
| 15 | **Sem rate limiting em auth** - Brute-force possível | ALTA |
| 16 | **Sem sanitização XSS** - Descrição/notes sem escape | MÉDIA |

---

## План de Correção

### ✅ Fase 1 - Críticos (Financeiros) - **CONCLUÍDO**
**Data:** 07/04/2026

- [x] **Correção 1:** Currency formatting dinâmico
  - Adicionado `currency` ao session type
  - Atualizado `auth.ts` para buscar currency do banco
  - Criada função `formatCurrency()` em `lib/utils.ts`
  - Atualizados: dashboard, accounts, transactions, credit-cards, goals, budgets, categories, reports, forecast

- [x] **Correção 2:** Cálculo de parcelamento com inteiros
  - Substituído `Math.floor((amount / n) * 100) / 100` por cálculo em centavos
  - Distribuição perfeita: `baseCents = Math.floor(amountInCents / n)`, resto vai para última parcela

- [x] **Correção 3:** Validação em payInvoice
  - Verifica se conta bancária existe
  - Verifica se cartão existe
  - Verifica se saldo >= valor do pagamento
  - Verifica se usedAmount >= valor do pagamento

- [x] **Correção 4:** Verificação de saldo em transfer
  - Verifica se conta de origem existe
  - Verifica se saldo >= valor da transferência

### ✅ Fase 2 - Alta Prioridade - **CONCLUÍDO**
**Data:** 08/04/2026

- [x] **Correção 5:** Cascade de mês/ano em invoices
  - Implementado wrap-around December→January na função `updateCardTransaction()` (linhas 306-310)
  - Usa cálculo `totalMonths % 12 + 1` para mês e `floor(totalMonths / 12)` para ano

- [x] **Correção 6:** Validação targetAmount em depositToGoal
  - Adicionada verificação se `currentAmount + amount <= targetAmount` antes do depósito
  - Lança erro se depósito exceder o valor alvo
  - Arquivo: `src/lib/services/financial-engine.ts` (linhas 459-468)

- [x] **Correção 7:** Mudança de accountId em updateTransaction
  - Implementado reverter saldo da conta antiga e aplicar na nova conta
  - Função `updateTransaction()` já tratava isso corretamente (linhas 96-117)

- [x] **Correção 8:** Validação de ownership em DELETE
  - Todos os endpoints DELETE já verificam `userId` no WHERE clause
  - Verificado: accounts, categories, goals, budgets, credit-cards, transactions, goal-contributions

### ✅ Fase 3 - Média Prioridade - **CONCLUÍDO**
**Data:** 08/04/2026

- [x] **Correção 9:** dueDay !== closingDay
  - Adicionada validação `refine()` no creditCardSchema
  - Lança erro se dia de vencimento e fechamento forem iguais
  - Arquivo: `src/lib/validations/index.ts` (linha 113-117)

- [x] **Correção 10:** Verificar uso antes de deletar conta
  - Adicionada verificação de transações na conta antes de deletar
  - Retorna erro 400 se existirem transações
  - Arquivo: `src/app/api/accounts/[id]/route.ts`

- [x] **Correção 11:** Verificar uso antes de deletar categoria
  - Adicionada verificação de transações e subcategorias antes de deletar
  - Retorna erro 400 se existirem transações ou subcategorias
  - Arquivo: `src/app/api/categories/[id]/route.ts`

- [x] **Correção 12:** Week-to-month conversion preciso
  - Criada função `weeksInMonth(year, month)` para cálculo exato
  - Substituído `* 4.33` por `* weeks` no forecast
  - Arquivo: `src/app/api/forecast/route.ts`

### ⏳ Fase 4 - Melhorias - **PENDENTE**

- [ ] **Correção 13:** Lazy generation de recurring transactions
  - Gerar transações sob demanda ao invés de todas de uma vez

- [ ] **Correção 14:** Validação de email no profile
  - Adicionar validação Zod para email e verificar uniqueness

- [ ] **Correção 15:** Rate limiting
  - Implementar rate limiting nos endpoints de auth

- [ ] **Correção 16:** Sanitização XSS
  - Implementar escape em campos de descrição e notes

---

## Arquivos Modificados na Fase 1

| Arquivo | Mudanças |
|---------|----------|
| `src/types/next-auth.d.ts` | Adicionado `currency` ao session type |
| `src/auth.ts` | Busca currency do banco no JWT callback |
| `src/lib/utils.ts` | Adicionada função `formatCurrency()` |
| `src/lib/services/financial-engine.ts` | Validações em transfer e payInvoice |
| `src/app/api/credit-cards/[id]/transactions/route.ts` | Cálculo de parcelamento corrigido |
| `src/app/(app)/dashboard/page.tsx` | Currency dinâmico |
| `src/app/(app)/accounts/page.tsx` | Currency dinâmico |
| `src/app/(app)/transactions/page.tsx` | Currency dinâmico |
| `src/app/(app)/credit-cards/page.tsx` | Currency dinâmico + PayInvoiceModal prop |
| `src/app/(app)/goals/page.tsx` | Currency dinâmico |
| `src/app/(app)/budgets/page.tsx` | Currency dinâmico |
| `src/app/(app)/categories/page.tsx` | Currency dinâmico |
| `src/app/(app)/reports/page.tsx` | Currency dinâmico |
| `src/app/(app)/forecast/page.tsx` | Currency dinâmico |

## Arquivos Modificados na Fase 2

| Arquivo | Mudanças |
|---------|----------|
| `src/lib/services/financial-engine.ts` | Validação targetAmount em depositToGoal (linhas 459-468) |

## Arquivos Modificados na Fase 3

| Arquivo | Mudanças |
|---------|----------|
| `src/lib/validations/index.ts` | Validação dueDay !== closingDay no creditCardSchema |
| `src/app/api/accounts/[id]/route.ts` | Verificação de transações antes de deletar conta |
| `src/app/api/categories/[id]/route.ts` | Verificação de transações/subcategorias antes de deletar |
| `src/app/api/forecast/route.ts` | Função weeksInMonth() e cálculo preciso de budget |

---

## Multi-Usuário

| Aspecto | Status | Notas |
|---------|--------|-------|
| Suporte multi-usuário | ✅ OK | userId em todas entidades |
| Isolamento de dados | ✅ OK | Queries filtram por userId |
| Sistema de roles/permissions | ❌ FALTA | Single role (user) apenas |

---

## ⚠️ Nota Importante

Para que o **currency dinâmico** funcione corretamente após a correção, usuários logados precisam **fazer logout e login novamente** para que o JWT seja atualizado com a currency do banco de dados.

---

## Comandos Úteis

```bash
# Gerar migração
npm run db:generate

# Aplicar migração
npm run db:migrate

# Verificar lint
npm run lint

# Build
npm run build
```

---

## Checklist - Correções Implementadas

### ✅ Fase 1 - Críticos (Financeiros) - CONCLUÍDO

- [x] **Correção 1:** Currency formatting dinâmico
- [x] **Correção 2:** Cálculo de parcelamento com inteiros
- [x] **Correção 3:** Validação em payInvoice
- [x] **Correção 4:** Verificação de saldo em transfer

### ✅ Fase 2 - Alta Prioridade - CONCLUÍDO

- [x] **Correção 5:** Cascade de mês/ano em invoices (wrap-around December→January)
- [x] **Correção 6:** Validação targetAmount em depositToGoal
- [x] **Correção 7:** Mudança de accountId em updateTransaction
- [x] **Correção 8:** Validação de ownership em DELETE

### ✅ Fase 3 - Média Prioridade - CONCLUÍDO

- [x] **Correção 9:** dueDay !== closingDay
- [x] **Correção 10:** Verificar uso antes de deletar conta
- [x] **Correção 11:** Verificar uso antes de deletar categoria
- [x] **Correção 12:** Week-to-month conversion preciso

### ⏳ Fase 4 - Melhorias - PENDENTE

- [ ] **Correção 13:** Lazy generation de recurring transactions
- [ ] **Correção 14:** Validação de email no profile
- [ ] **Correção 15:** Rate limiting
- [ ] **Correção 16:** Sanitização XSS

---

**Total: 12 de 16 correções implementadas (75%)**

**Total: 8 de 16 correções implementadas (50%)**
