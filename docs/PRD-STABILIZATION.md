# PRD: Estabilização e Escalonamento — Dudia Finance v2

**Status:** In Progress  
**Autor:** @analyst / @architect  
**Data:** 2026-04-13  
**Última Atualização:** 2026-04-13 (por @dev)  
**Objetivo:** Elevar a maturidade do sistema de 6.2 para 9.0+, garantindo segurança de nível bancário, UX premium e estabilidade para múltiplos usuários.

---

## 1. Visão Geral

O sistema atual é funcional para uso pessoal, mas possui dívidas técnicas em segurança, performance e polimento de interface que impedem o escalonamento. Este plano foca em transformar o MVP em um produto robusto, removendo componentes experimentais de IA e solidificando o core financeiro.

## 2. Objetivos de Negócio

- **Confiança**: Eliminar o risco de perda de dados ou exclusões acidentais.
- **Segurança**: Proteger chaves de terceiros e mitigar abusos via Rate Limiting.
- **Retenção**: Melhorar a percepção de velocidade via Optimistic Updates e Skeletons.
- **Mantenabilidade**: Reduzir a complexidade de arquivos "God Components".

---

## 3. Requisitos Funcionais (Roadmap de 4 Semanas)

### Semana 1: Core & Segurança I
**Status:** 95% (Quase completa - pendência de criptografia ativa)

#### ✅ O que foi feito:
| Item | Descrição | Arquivos |
|------|-----------|----------|
| `[SEC]` AlertDialog | Componente Shadcn/Radix para confirmação de ações destrutivas | `src/components/ui/alert-dialog.tsx` |
| `[UX]` Substituição de confirm() | Removido `window.confirm()` nativo das páginas Transactions e Credit Cards | `src/app/(app)/transactions/page.tsx`, `src/app/(app)/credit-cards/page.tsx` |
| `[SEC]` Documentação .env | Adicionada variável `ENCRYPTION_KEY` e `CRON_SECRET` no .env.example | `.env.example` |
| `[FEAT]` Script de Teste | Criado script para testar cron localmente | `scripts/test-recurring.ts` |

#### ⚠️ O que falta:
| Item | Descrição | Como Resolver |
|------|-----------|---------------|
| `[SEC]` Criptografia Real | O campo `openRouterApiKey` existe no schema, mas não há wrapper de criptografia AES-256 ativo no Drizzle | Criar `src/lib/db/encryption-wrapper.ts` e aplicar transformações `encrypt()`/`decrypt()` nos hooks de usuário |

#### 🔜 Como resolver a pendência:
1. Criar `src/lib/crypto.ts` com funções `encrypt(text)` e `decrypt(text)` usando `node:crypto` (AES-256-GCM)
2. Criar `src/lib/db/encryption-wrapper.ts` que envolve o Drizzle com hooks de transformação
3. Aplicar o wrapper na tabela `users` para o campo `openRouterApiKey`
4. Testar com `scripts/test-recurring.ts` para garantir que a criptografia não quebra o fluxo

---

### Semana 2: UX & Resiliência
**Status:** 100% ✅ (Completa)

#### ✅ O que foi feito:
| Item | Descrição | Arquivos |
|------|-----------|----------|
| `[UX]` TransactionSkeleton | Skeleton profissional para página de Transações | `src/components/features/transactions/transaction-skeleton.tsx` |
| `[UX]` CreditCardSkeleton | Skeleton profissional para página de Cartões | `src/components/features/credit-cards/credit-card-skeleton.tsx` |
| `[STAB]` ErrorBoundary Aprimorado | Detecção de erros de rede, botões de "Recarregar Página" e "Limpar Cache" | `src/components/ui/error-boundary.tsx` |
| `[REFAC]` TransactionForm | Componente isolado do formulário de transação | `src/components/features/transactions/transaction-form.tsx` |
| `[REFAC]` TransactionTable | Componente isolado da tabela de transações | `src/components/features/transactions/transaction-table.tsx` |
| `[REFAC]` TransactionFilters | Componente isolado de filtros e busca | `src/components/features/transactions/transaction-filters.tsx` |
| `[REFAC]` Transactions Page | Refatorada de ~800 linhas para ~180 linhas | `src/app/(app)/transactions/page.tsx` |
| `[REFAC]` CardFormModal | Componente isolado do formulário de cartão | `src/components/features/credit-cards/card-form-modal.tsx` |
| `[REFAC]` InvoiceDetails | Componente isolado do detalhamento da fatura | `src/components/features/credit-cards/invoice-details.tsx` |
| `[REFAC]` CardTransactionList | Componente isolado da lista de transações do cartão | `src/components/features/credit-cards/card-transaction-list.tsx` |
| `[REFAC]` LaunchTxModal | Modal de lançamento isolado | `src/components/features/credit-cards/modals/launch-tx-modal.tsx` |
| `[REFAC]` PayInvoiceModal | Modal de pagamento de fatura isolado | `src/components/features/credit-cards/modals/pay-invoice-modal.tsx` |
| `[REFAC]` EditTxModal | Modal de edição de transação isolado | `src/components/features/credit-cards/modals/edit-tx-modal.tsx` |
| `[TYPE]` Unificação de Tipos | Tipos centralizados em arquivo único | `src/types/finance.ts` |
| `[REFAC]` Credit Cards Page | Refatorada de ~1100 linhas para ~350 linhas | `src/app/(app)/credit-cards/page.tsx` |

---

### Semana 3: Infraestrutura & Performance
**Status:** 100% ✅ (Completa)

#### ✅ O que foi feito:
| Item | Descrição | Arquivos/Tecnologia |
|------|-----------|-------------------|
| `[SEC]` Rate Limiting | Limitar requisições por IP na API para evitar abusos | `src/middleware.ts` |
| `[PERF]` Optimistic Updates | Atualizar UI instantaneamente antes da confirmação do servidor | `src/hooks/use-api.ts` |
| `[PERF]` Paginação Cursor-Based | Carregar transações em blocos de 50 | `src/app/api/transactions/route.ts`, `src/app/api/dashboard/route.ts`, `src/app/api/reports/route.ts` |

#### ✅ Como foi implementado:

**Rate Limiting:**
- Implementado via headers Vercel (`x-vercel-rate-limit-*`)
- Limites: 100 req/min para APIs normais, 10 req/min para autenticação

**Optimistic Updates:**
- Hook `use-api.ts` implementa `onMutate` para atualizar cache React Query imediatamente
- Rollback em `onError` caso o servidor falhe

**Paginação Cursor-Based:**
- `GET /api/transactions` aceita parâmetro `cursor` (último ID visto)
- Retorna `{ items: [], nextCursor: string | null }`
- Hook `useTransactions` suporta `cursor` em vez de `page`

---

### Semana 4: Qualidade & Observabilidade
**Status:** 0% (Não iniciada)

#### 📋 O que será feito:
| Item | Descrição | Ferramentas |
|------|-----------|------------|
| `[TEST]` Component Tests | Cobertura de componentes React (formulários, tabelas, skeletons) | Vitest + Testing Library |
| `[TEST]` E2E Tests | Fluxos completos: pagamento de fatura, criação de transação parcelada | Playwright |
| `[OBS]` Sentry Alerts | Alertas para: saldo negativo persistente, falha no Cron, erros de API | `@sentry/nextjs` |

#### 🔜 Como implementar:

**Component Tests:**
1. Criar `src/__tests__/components/transaction-form.test.tsx`
2. Criar `src/__tests__/components/alert-dialog.test.tsx`
3. Criar `src/__tests__/components/skeleton.test.tsx`
4. Meta: 60%+ de cobertura

**E2E Tests:**
1. `tests/e2e/payment-flow.spec.ts` - Criar cartão -> Lançar compra -> Pagar fatura
2. `tests/e2e/recurring-transaction.spec.ts` - Criar transação parcelada -> Verificar recorrências

**Sentry Alerts:**
1. Configurar `sentry.client.config.ts` com ignore de erros esperados
2. Criar gatilho para `transaction.cron.failed` 
3. Criar gatilho para `account.balance < 0` por mais de 24h

---

## 4. Requisitos Não Funcionais

- **Segurança**: CSP (Content Security Policy) estrito, sem `unsafe-eval`.
- **Performance**: Tempo de carregamento (LCP) < 1.5s em 4G.
- **Escalabilidade**: Suporte para 100+ usuários ativos simultâneos sem degradação do banco Neon.

---

## 5. Itens Removidos (Não Escopo)

- [X] Implementação de Chat/IA Conversacional.
- [X] Pílulas de Insights Automáticos via LLM.
- [X] Qualquer integração com OpenRouter (A ser descontinuada para priorizar o core).

---

## 6. Métricas de Sucesso

| Métrica | Meta | Status Atual |
|---------|------|--------------|
| Nota de Auditoria interna | > 9.0 | 6.2 (em progresso) |
| Cobertura de Testes (Backend) | > 80% | 0% (Semana 4) |
| Cobertura de Testes (Frontend) | > 50% | 0% (Semana 4) |
| Erros em Produção (Sentry) | < 1% | N/A |
| Build sem Warnings | 100% | ⚠️ Warnings existem |

---

## 7. Status de Execução (Log de Auditoria)

| Semana | Status | % Completo | Pendências |
|--------|--------|------------|------------|
| Semana 1 | ✅ Quase Completa | 95% | Criptografia AES-256 (campo `openRouterApiKey` - integração adiada para quando IA for implementada) |
| Semana 2 | ✅ Completa | 100% | Nenhuma |
| Fase Consolidação | ✅ COMPLETA | 100% | Testes (66/66), DB (OK), Commit `41340f7`, Deploy |
| **Semana 3** | ✅ **Completa** | 100% | Rate Limiting, Optimistic Updates, Paginação |
| Semana 4 | ⏳ Não Iniciada | 0% | Tests, E2E, Sentry Alerts |

---

## 8. Histórico de Consolidação (2026-04-13)

### ✅ Fase de Consolidação Semana 2 → Deploy (COMPLETA)

| Passo | Status | Detalhes |
|-------|--------|----------|
| Correção de Testes | ✅ 66/66 | Corrigido `tx.select` em `system-coverage.test.ts` (mock necesitaba 2 argumentos) |
| Verificação de Banco | ✅ OK | 15 tabelas, database sincronizado via `drizzle-kit check` |
| Commit | ✅ `41340f7` | 24 arquivos, +2757/-1533 linhas |
| Deploy | ✅ Sucesso | https://dudia-finance-v2-cimbam6a2-dudiafinances-projects.vercel.app |

### 🔄 Semana 3: Em Execução via Agentes Especializados

| Agente | Tarefa | Status |
|--------|--------|--------|
| `@data-engineer` | Criptografia (Semana 1 residual) | ⏳ Pendente (IA adiada) |
| `@dev` | Rate Limiting | ✅ Completo |
| `@dev` | Optimistic Updates | ✅ Completo |
| `@dev` | Paginação Cursor-Based | ✅ Completo |
| `@qa` | Validação e testes | ✅ Aprovado (66/66) |
| `@devops` | Commit e Deploy | ✅ `bb608c4` + Deploy OK |

---

## 9. Próximos Passos (Ordem de Execução)

1. **Agora:** Executar Semana 3 via agentes especializados
   - Rate Limiting no middleware (`@dev`)
   - Optimistic Updates nos hooks (`@dev`)
   - Paginação cursor-based (`@dev`)
2. **Validação:** `@qa` valida e `@devops` faz deploy
3. **Médio Prazo:** Semana 4 (testes e monitoramento)
