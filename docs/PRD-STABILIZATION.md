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
**Status:** 0% (Não iniciada)

#### 📋 O que será feito:
| Item | Descrição | Arquivos/Tecnologia |
|------|-----------|-------------------|
| `[SEC]` Rate Limiting | Limitar requisições por IP na API para evitar abusos | `middleware.ts` + `@upstash/ratelimit` ou solução via headers Vercel |
| `[PERF]` Optimistic Updates | Atualizar UI instantaneamente antes da confirmação do servidor | React Query (`useMutation` com `onMutate`) |
| `[PERF]` Paginação Cursor-Based | Carregar transações em blocos de 50 | API routes em `src/app/api/transactions/route.ts` |

#### 🔜 Como implementar:

**Rate Limiting:**
1. Instalar `@upstash/ratelimit` e `@upstash/redis`
2. Configurar `middleware.ts` para proteger rotas `/api/*`
3. Definir limites: 100 req/min para APIs normais, 10 req/min para autenticação

**Optimistic Updates:**
1. Nos hooks de `use-create-transaction` e `use-delete-transaction`, adicionar `onMutate` para atualizar o cache do React Query imediatamente
2. Implementar rollback em `onError` caso o servidor falhe

**Paginação Cursor-Based:**
1. Modificar `GET /api/transactions` para aceitar parâmetro `cursor` (último ID visto)
2. Retornar `{ items: [], nextCursor: string | null }`
3. Atualizar `useTransactions` hook para suportar `cursor` em vez de `page`

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
| Semana 1 | ✅ Quase Completa | 95% | Criptografia AES-256 ativa |
| Semana 2 | ✅ Completa | 100% | Nenhuma |
| Semana 3 | ⏳ Não Iniciada | 0% | Rate Limiting, Optimistic Updates, Paginação |
| Semana 4 | ⏳ Não Iniciada | 0% | Tests, E2E, Sentry Alerts |

---

## 8. Plano de Execução Atual (2026-04-13)

### Fase de Consolidação Semana 2 → Deploy

#### Passo 1: Correção de Testes (@qa)
- **Arquivo:** `src/__tests__/system-coverage.test.ts`
- **Erro:** `tx.select is not a function` — mock do Drizzle quebrado
- **Ação:** Corrigir mock do Drizzle para suportar `.select()` corretamente

#### Passo 2: Verificação de Banco (@data-engineer)
- Executar `npm run db:studio` ou verificar migrations pendentes
- Garantir que schema e migrations estão em dia

#### Passo 3: Commit (@devops)
- Criar commit com todas as alterações da Semana 2
- Mensagem: `feat(week2): refactor transactions and credit-cards pages, add skeletons and error boundary`

#### Passo 4: Deploy (@devops)
- Push para branch principal
- Verificar deploy em staging/produção
- Monitorar logs de erro

#### Passo 5: Iniciar Semana 3 (@dev)
- Rate Limiting: `middleware.ts` + `@upstash/ratelimit`
- Optimistic Updates: React Query `onMutate`
- Paginação Cursor-Based: API com `cursor` parameter

---

## 8. Próximos Passos (Ordem de Execução)

1. **Imediato:** Consolidação (Testes → Commit → Deploy)
2. **Curto Prazo:** Executar Semana 3 (infraestrutura)
3. **Médio Prazo:** Executar Semana 4 (testes e monitoramento)
4. **Validação:** Auditoria final e medição de métricas de sucesso
