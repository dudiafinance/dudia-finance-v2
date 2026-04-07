# System Report: DUD.IA Finance V2

**Data da Auditoria:** 2026-04-06  
**Versão do Sistema:** 0.1.0  
**Escopo:** Completo (src/, scripts/, configurações)
**Auditor:** Kilo AI Assistant (Auditoria Linha a Linha)

---

## 1. Estatus Quo

### 1.1 Visão Geral
DUD.IA Finance V2 é uma aplicação de controle financeiro pessoal construída com Next.js 16, React 19, TypeScript, PostgreSQL (Neon) e Drizzle ORM. O sistema permite gerenciamento de contas bancárias, transações, categorias, orçamentos, metas financeiras, cartões de crédito com controle de faturas, e projeções financeiras.

### 1.2 Stack Tecnológica
| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| Linguagem | TypeScript | 5.x |
| Auth | NextAuth.js | 5.0.0-beta.30 |
| Banco de Dados | PostgreSQL (Neon) | - |
| ORM | Drizzle ORM | 0.45.2 |
| State Management | TanStack Query + Zustand | 5.96.2 + 5.0.12 |
| Validação | Zod |4.3.6 |
| Estilização | Tailwind CSS | 4.x |
| Charts | Recharts | 3.8.1 |
| Email | Nodemailer | 7.0.13 |

### 1.3 Estrutura de Arquivos
```
src/
├── app/
│   ├── (app)/# Rotas protegidas (dashboard, transactions, etc)
│   ├── (auth)/             # Rotas de autenticação (login, register)
│   ├── api/
│   │   ├── accounts/       # CRUD contas bancárias
│   │   ├── auth/           # Auth endpoints (register, reset-password)
│   │   ├── budgets/        # CRUD orçamentos
│   │   ├── categories/     # CRUD categorias
│   │   ├── credit-cards/   # CRUD cartões + transações
│   │   ├── dashboard/      # Dados do dashboard
│   │   ├── debug/          # ⚠️ Endpoint de debug (CRÍTICO)
│   │   ├── forecast/       # Projeções financeiras
│   │   ├── goals/          # CRUD metas financeiras
│   │   ├── goal-contributions/ # Contribuições de metas
│   │   ├── migrate/        # ⚠️ Migração manual (CRÍTICO)
│   │   ├── tags/           # Tags globais
│   │   └── transactions/   # CRUD transações
│   └── layout.tsx
├── components/
│   ├── layout/             # Header, Sidebar, MobileNav
│   ├── providers/          # ThemeProvider, ReactQuery
│   └── ui/                 # Componentes reutilizáveis
├── hooks/
│   └── use-api.ts          # Hooks do React Query
├── lib/
│   ├── auth/               # Password hashing
│   ├── db/
│   │   ├── schema/         # Schema Drizzle (290 linhas)
│   │   ├── index.ts        # Instância do db
│   │   └── migrate.ts      # Migrações
│   ├── services/
│   │   └── email.ts        # Serviço de email (Brevo SMTP)
│   ├── validations/        # Schemas Zod
│   ├── auth-utils.ts       # Helper getUserId()
│   ├── credit-card-utils.ts # Recalcular saldo, transações fixas
│   └── utils.ts            # Utilitários (cn)
├── types/
│   └── index.ts            # Tipos TypeScript
├── auth.ts                 # Configuração NextAuth
├── middleware.ts           # Middleware de rotas
└── ...
```

### 1.4 Funcionalidades Implementadas
- ✅ Autenticação com email/senha (NextAuth JWT)
- ✅ CRUD completo de contas bancárias
- ✅ CRUD de categorias com hierarquia (parent/children)
- ✅ Transações com suporte a: single, fixed, recurring
- ✅ Orçamentos mensais/semanais/anuais com alertas
- ✅ Metas financeiras (target amount ou monthly contribution)
- ✅ Cartões de crédito com cálculo automático de fatura
- ✅ Lançamento de compras: single, parcelado, fixo
- ✅ Projeções financeiras (forecast) para 12 meses
- ✅ Dashboard com resumo, top expenses, metas
- ✅ Tema dark/light com next-themes
- ✅ Tags globais para categorização

---

## 2. Mapa de Vulnerabilidades

### 2.1 Segurança (Severidade)

#### CRITICAL - Debug Endpoint Exposto sem Filtro Adequado
**Arquivo:** `src/app/api/debug/transactions/route.ts:17-21`**Problema:** O endpoint retorna TODAS as transações do banco sem filtrar por userId. Apenas o userId do usuário autenticado é retornado na resposta, mas todas as transações são consultadas.**Código:**
```typescript
const recent = await db
  .select()
  .from(cardTransactions)
  .orderBy(desc(cardTransactions.createdAt))
  .limit(10); //Sem WHERE userId =userId
```
**Recomendação:** Remover endpoint em produção OU adicionar filtro `WHERE userId = userId`.

---

#### CRITICAL - Migração com Secret Padrão
**Arquivo:** `src/app/api/migrate/route.ts:7`
**Problema:** Endpoint de migração usa secret padrão "migration-secret-2026" se variável de ambiente não configurada. Qualquer pessoa com conhecimento do código pode executar migrações.**Código:**
```typescript
const expectedAuth = process.env.MIGRATION_SECRET || "migration-secret-2026";
```
**Recomendação:** Remover valor padrão, falhar se env não configurado em produção.

---

#### HIGH - Validação Zod Ausente em Transações de Cartão
**Arquivo:** `src/app/api/credit-cards/[id]/transactions/route.ts:39-143`**Problema:** O endpoint POST não usa validação Zod. Dados são inseridos diretamente sem schema validado. Apenas validação manual básica de campos obrigatórios.**Código:**
```typescript
// Sem schema Zod - validação manual frágil
if (!description || !amount || !date || !launchType || !invoiceMonth || !invoiceYear) {
  return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
}
```
**Recomendação:** Criar `cardTransactionSchema` em `src/lib/validations/` e usar `safeParse`.

---

#### HIGH - Exposição de Erros Detalhados
**Arquivos:** 
- `src/app/api/goals/route.ts:136-140`
- `src/app/api/credit-cards/[id]/transactions/route.ts:156-160`**Problema:** Erros internos são retornados com `error.message` e até `error.stack`, expondo detalhes do sistema.**Código:**
```typescript
return NextResponse.json({
  error: "Erro ao criar meta",
  details: error instanceof Error ? error.message : "Erro desconhecido"
}, { status: 500 });
```
**Recomendação:** Logar detalhes no servidor, retornar mensagem genérica ao cliente.

---

#### HIGH - Debug Log com Credenciais SMTP
**Arquivo:** `src/lib/services/email.ts:21-22`
**Problema:** Configuração do transporter com `logger: true` e `debug: true` em desenvolvimento pode expor credenciaisSMTP em logs.**Recomendação:** Remover logs sensíveis, usar logger condicional apenas para eventos, não credenciais.

---

#### MEDIUM - Rate Limiting Ausente
**Arquivo:** Todas as API routes
**Problema:** Não há proteção contra brute force em login ou abuso de API.**Recomendação:** Implementar rate limiting com `@upstash/ratelimit` ou middleware customizado.

---

#### MEDIUM - Headers de Segurança Ausentes
**Arquivo:** `next.config.ts`
**Problema:** Configuração mínima. Faltam headers críticos: CSP, X-Frame-Options, X-Content-Type-Options, etc.**Recomendação:**
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
```

---

#### MEDIUM - CSRF Protection Não Configurado
**Arquivo:** `src/auth.ts`
**Problema:** NextAuth JWT mode não configura CSRF protection explícito.**Recomendação:** Adicionar configuração CSRF explícita e verificar origem das requisições POST.

---

#### LOW - Validação de dueDay/closingDay
**Arquivo:** `src/app/api/credit-cards/route.ts:27`
**Problema:** Campos dueDay e closingDay não validados (devem ser 1-31).**Recomendação:** Adicionar validação `.min(1).max(31)` no schema.

---

### 2.2 Lógica de Negócio (Severidade)

#### HIGH - Migração em Top-Level Await
**Arquivo:** `src/app/api/goals/route.ts:8-86`
**Problema:** Migrações de banco executadas no top-level do módulo com `await ensureMigration()`. Causa:
1. Execução em toda importação do módulo
2. Race conditions em serverless
3. Bloqueio do cold start**Código:**
```typescript
let migrationApplied = false;
// ... função ensureMigration ...
await ensureMigration(); // ← Top-level await
export async function GET() { ... }
```
**Recomendação:** Mover para script separado `scripts/migrate-goals.ts` ou usar drizzle-kit migrate.

---

#### HIGH - Cálculo de Fatura com Bug de Ano
**Arquivo:** `src/lib/credit-card-utils.ts:19-31`
**Problema:** Lógica de transição de ano tem bug potencial quando o mês incrementa de 12 para 1:**Código:**
```typescript
if (now.getDate() > card.closingDay) {
  invoiceMonth++;
  if (invoiceMonth > 12) {
    invoiceMonth = 1;
    invoiceYear++;
  }
}
```
**Edge Cases Não Tratados:**
- Dia 31 em meses com 30 dias
- Fevereiro (28/29 dias)
- Closing day > dias no mês**Recomendação:** Adicionar testes unitários e usar biblioteca de datas (date-fns/dayjs).

---

#### MEDIUM - Transações Parceladas com Cálculo Incorreto
**Arquivo:** `src/app/api/credit-cards/[id]/transactions/route.ts:88-119`
**Problema:** Cálculo de parcelas usa divisão simples que pode gerar centavos perdidos:**Código:**
```typescript
const perInstallment = Number(amount) / n; // Pode gerar 33.333...// amount é string, depois toFixed(2)string: String(perInstallment.toFixed(2))
```
**Recomendação:** Usar arredondamento correto ou biblioteca decimal.js para valores financeiros.

---

#### MEDIUM - Transações Recorrentes Não São Geradas Automaticamente
**Arquivo:** `src/app/api/transactions/route.ts:51-81`**Problema:** Transações recorrentes são criadas como múltiplos registros no momento da criação, mas não há cron job para gerar ocorrências futuras.**Recomendação:** Implementar cron job (Vercel Cron ou BullMQ) para gerar recorrências.

---

#### MEDIUM - Metas Financeiras Não Atualizam currentAmount
**Arquivo:** `src/app/api/goals/route.ts`
**Problema:** `currentAmount` é definido na criação mas não há lógica para atualizá-lo automaticamente baseado em transações ou contribuições.**Recomendação:** Criar endpoint para recalcular ou trigger em contribution create.

---

#### MEDIUM - Fixed Card Transactions Geram em Loop Infinito
**Arquivo:** `src/lib/credit-card-utils.ts:59-107`
**Problema:** `generateFixedFutureTransactions` gera transações para 11 meses à frente, mas não há mecanismo para gerar mais quando esses meses passam.**Recomendação:** Implementar cron job mensal para estender transações fixas.

---

#### LOW - Orçamentos Não Consideram Transações de Cartão
**Arquivo:** `src/app/api/budgets/route.ts`
**Problema:** A query de orçamentos não cruza dados com `cardTransactions`.**Recomendação:** Incluir gastos de cartão no cálculo de uso de orçamento.

---

### 2.3 Banco de Dados (Severidade)

#### MEDIUM -Índices Ausentes
**Arquivo:** `src/lib/db/schema/index.ts`
**Problema:** Schema não define índices explicitamente. Queries frequentes em `userId`, `date`, `accountId`, `cardId` podem ser lentas com grande volume.**Recomendação:**
```typescript
// Adicionar aos indexes
pgTable('transactions', {...}, (table) => ({
  userIdIdx: index('transactions_user_id_idx').on(table.userId),
  dateIdx: index('transactions_date_idx').on(table.date),
  accountIdIdx: index('transactions_account_id_idx').on(table.accountId),
}));
```

---

#### MEDIUM - Tipos Decimais como String
**Arquivo:** Todo o código
**Problema:** Valores decimais (`amount`, `balance`, `limit`) são `String` no banco e convertidos com `Number()` em runtime. Pode causar:
1. Perda de precisão em valores grandes
2. Rounding errors em cálculos
3. Inconsistência de tipos**Recomendação:** Usar `decimal.js` ou `big.js` para operações financeiras.

---

#### LOW - Sem Soft Delete
**Arquivo:** Todo o schema
**Problema:** Exclusões são permanentes (hard delete).**Recomendação:** Adicionar campo `deletedAt` para soft delete e auditoria.

---

### 2.4 Performance (Severidade)

#### MEDIUM - React Query sem Cache Configuration
**Arquivo:** `src/hooks/use-api.ts`**Problema:** Hooks não configuram `staleTime` ou `gcTime`. Causa refetches desnecessários e requests redundantes.**Recomendação:**
```typescript
// Configurar cache por tipo de dado
export function useAccounts() {
  return useQuery({ 
    queryKey: ["accounts"], 
    queryFn: () => apiFetch<any[]>("/api/accounts"),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

---

#### MEDIUM - Dashboard com Múltiplas Queries Sequenciais
**Arquivo:** `src/app/api/dashboard/route.ts:20-44`
**Problema:** 5 queries sequenciais em Promise.all (bom), mas cada query retorna TODAS as colunas com `select()`.**Recomendação:** Usar `select({ campo1, campo2 })` para reduzir payload e adicionar índices.

---

#### MEDIUM - N+1 Lookup em Top Expenses
**Arquivo:** `src/app/api/dashboard/route.ts:128-136`
**Problema:** Para cada categoria no topExpenses, há um `.find()` em memória.**Código:**
```typescript
const topExpenses = topCatIds.map((catId) => {
  const cat = allCategories.find((c) => c.id === catId); // O(n) por categoria
  ...
});
```
**Recomendação:** Usar `Map<string, Category>` para lookup O(1).

---

#### LOW - Componentes sem Memoization
**Arquivo:** `src/app/(app)/dashboard/page.tsx`, `src/app/(app)/credit-cards/page.tsx`
**Problema:** Componentes re-renderizam sem necessidade em atualizações de estado.**Recomendação:** Adicionar `React.memo` em componentes puros como `CardVisual`, `TxRow`.

---

#### LOW - Bundle Size Não Otimizado
**Problema:** Dependências como `recharts` e `lucide-react` importadas completamente.**Recomendação:** Usar tree-shaking e `next/bundle-analyzer` para identificar otimizações.

---

### 2.5 Código (Severidade)

#### MEDIUM - Tipos `any` em Runtime Functions
**Arquivo:** Vários arquivos
**Problema:** Uso de `any` em funções de API hooks perde type safety.**Exemplo:** `use-api.ts:17` - `apiFetch<any[]>`**Recomendação:** Criar tipos específicos para cada resposta de API.

---

#### MEDIUM - Error Handling Inconsistente
**Arquivo:** API routes
**Problema:** Alguns endpoints retornam `{ error: "..." }`, outros retornam `{ success: false, error: "..." }`.**Recomendação:** Padronizar estrutura de resposta de erro.

---

#### LOW - Logs em Produção
**Arquivo:** Vários arquivos
**Problema:** `console.log` e `console.error` usados em produção.**Recomendação:** Usar biblioteca de logging (winston, pino) com níveis por ambiente.

---

## 3. Plano de Evolução (Roadmap)

### 3.1 Quick Wins (Implementação Imediata)

| Prioridade | Tarefa | Impacto | Esforço | Arquivo |
|-----------|--------|---------|---------|---------|
| CRITICAL | Remover endpoint `/api/debug/transactions` ou adicionar filtro userId | Segurança | Baixo | `src/app/api/debug/transactions/route.ts` |
| CRITICAL | Remover secret padrão `/api/migrate` | Segurança | Baixo | `src/app/api/migrate/route.ts` |
| HIGH | Adicionar validação Zod em transações de cartão | Segurança | Médio | Novo: `cardTransactionSchema` |
| HIGH | Remover `error.message` das respostas de erro | Segurança | Baixo | API routes |
| HIGH | Mover migração de goals para script separado | Estabilidade | Médio | `scripts/migrate-goals.ts` |
| MEDIUM | Configurar `staleTime` no React Query | Performance | Baixo | `src/hooks/use-api.ts` |
| MEDIUM | Adicionar headers de segurança | Segurança | Baixo | `next.config.ts` |
| MEDIUM | Adicionar índices no schema | Performance | Médio | `src/lib/db/schema/index.ts` |
| MEDIUM | Implementar rate limiting | Segurança | Médio | Middleware ou lib |
| LOW | Adicionar `React.memo` em componentes | Performance | Baixo | Componentes de lista |

---

### 3.2 Refatorações Estruturais

#### A. Sistema de Jobs Assíncronos
**Problema:** Transações recorrentes, envio de emails e recalculo de metas são síncronos.  
**Solução:** Implementar BullMQ + Redis para processamento em background.
```typescript
// Estrutura proposta
src/queues/
├── email.queue.ts      # Envio de emails
├── recurring.queue.ts  # Geração de transações recorrentes
└── goals.queue.ts      # Recálculo de metas
```

---

#### B. Camada de Serviço
**Problema:** Lógica de negócio espalhada em API routes.  
**Solução:** Criar `src/services/` com funções puras:
```typescript
src/services/
├── transaction.service.ts   # Criar, editar, recorrentes
├── credit-card.service.ts   # Faturas, recalculateUsedAmount
├── goal.service.ts          # Progresso, contribuições
├── budget.service.ts        # Uso de orçamento
└── forecast.service.ts      # Projeções
```

---

#### C. Sistema de Notificações
**Problema:** Não há notificações para usuário.  
**Solução:** Implementar sistema de notificações in-app + email:
- Alerta de orçamento atingindo limite
- Lembrete de fatura vencendo
- Meta atingida

---

#### D. Precisão Decimal
**Problema:** Uso de `Number()` e `String()` para valores decimais.  
**Solução:** Integrar `decimal.js` ou `big.js` para cálculos financeiros precisos.

---

### 3.3 Novas Funcionalidades Sugeridas

#### A. Multi-Moeda
- Suporte a transações em USD, EUR, etc.
- Conversão automática via API (ex: ExchangeRate-API)
- Saldo consolidado em moeda base

#### B. Relatórios Avançados
- Exportação CSV/PDF de faturas e extratos
- Gráficos de tendências (6/12 meses)
- Comparativo mês a mês

#### C. Integração Bancária (Open Finance)
- Importação automática de transações via API bancária
- Conciliação automática
- Suporte a bancos brasileiros (BB, Itaú, Nubank)

#### D. IA para Categorização
- Sugestão automática de categoria baseada em descrição
- Detecção de padrões de gasto
- Alertas de anomalias

#### E. Compartilhamento de Conta
- Contas conjuntas (casal, família)
- Permissões granulares (admin, viewer)
- Histórico de alterações

#### F. PWA e Offline
- Service Worker para funcionamento offline
- Sync automático quando online
- Notificações push

---

## 4. Guia de Agentes

### 4.1 Estrutura Criada
```
.agents/
├── skills/
│   ├── code-auditor.md       # Clean Code, SOLID, DRY
│   ├── finance-logic.md      # Regras financeiras, edge cases
│   ├── pentester.md         # Segurança, OWASP
│   ├── db-architect.md      # DB, índices, queries│   └── performance.md        # Core Web Vitals, cache
└── workflows/                # (vazio, pronto para workflows)
```

### 4.2 Como Usar

#### Auditor de Código (`code-auditor.md`)
**Quando usar:** Após criar/modificar funções complexas.  
**Como acionar:** "Auditar código de [arquivo/função] com skill code-auditor"  
**Output:** Lista de issues classificados por Critical/Warning/Info.

#### Engenheiro de Lógica Financeira (`finance-logic.md`)
**Quando usar:** Ao implementar cálculos de fatura, saldo, metas, orçamentos.  
**Como acionar:** "Validar lógica de [funcionalidade] com skill finance-logic"  
**Output:** Cenários de teste e edge cases identificados.

#### Pentester (`pentester.md`)
**Quando usar:** Antes de deploy, após mudanças em auth/rotas.  
**Como acionar:** "Auditar segurança de [rota/módulo] com skill pentester"  
**Output:** Vulnerabilidades por severidade (Critical/High/Medium/Low).

#### Arquiteto de DB (`db-architect.md`)
**Quando usar:** Ao modificar schema ou queries lentas.  
**Como acionar:** "Otimizar queries de [rota] com skill db-architect"  
**Output:** Sugestões de índices e otimizações.

#### Estrategista de Performance (`performance.md`)
**Quando usar:** Ao identificar lentidão no frontend.  
**Como acionar:** "Analisar performance de [componente] com skill performance"  
**Output:** Métricas e sugestões de otimização.

### 4.3 Workflow Recomendado
1. **Antes do commit:** Rodar `code-auditor` no código alterado
2. **Antes do deploy:** Rodar `pentester` em rotas críticas
3. **Semanalmente:** Rodar `db-architect` para analisar queries lentas
4. **Mensalmente:** Rodar `performance` no dashboard e páginas principais

---

## 5. Resumo Executivo

### Pontos Fortes
- ✅ Arquitetura limpa com separação de responsabilidades
- ✅ Validação robusta com Zod na maioria das rotas
- ✅ Tipos TypeScript bem definidos
- ✅ Schema de banco bem modelado com relacionamentos
- ✅ UI moderna com Tailwind e componentes reutilizáveis
- ✅ Autenticação com NextAuth JWT
- ✅ Hash de senha com bcrypt (cost 12)

### Pontos Críticos
- 🔴 **CRITICAL:** Endpoint de debug expõe todos os dados
- 🔴 **CRITICAL:** Migração com secret padrão fraco
- 🔴 **HIGH:** Falta validação Zod em transações de cartão
- 🔴 **HIGH:** Migrações executadas em top-level await
- 🔴 **HIGH:** Exposição de error.message em respostas
- 🟡 **MEDIUM:** Ausência de rate limiting
- 🟡 **MEDIUM:** Headers de segurança ausentes
- 🟡 **MEDIUM:** React Query sem cache configuration
- 🟡 **MEDIUM:** índices ausentes no schema

### Próximos Passos Imediatos
1. **CRÍTICO:** Remover/fix endpoint de debug (`/api/debug/transactions`)
2. **CRÍTICO:** Remover secret padrão de migração
3. **HIGH:** Adicionar validação Zod faltante
4. **HIGH:** Mover migrações para arquivos separados
5. **MEDIUM:** Configurar cache do React Query
6. **MEDIUM:** Adicionar índices no schema
7. **MEDIUM:** Implementar rate limiting
8. **MEDIUM:** Adicionar headers de segurança

---

## 6. Checklist de Segurança

- [ ] Remover endpoint `/api/debug/transactions` em produção
- [ ] Remover secret padrão em `/api/migrate`
- [ ] Adicionar validação Zod em todas as rotas POST
- [ ] Implementar rate limiting em `/api/auth/login`
- [ ] Configurar headers de segurança (CSP, X-Frame-Options)
- [ ] Remover logs com dados sensíveis
- [ ] Configurar CSRF protection
- [ ] Auditoria de logs de produção
- [ ] Testar edge cases de autenticação
- [ ] Verificar ownership de recursos em todas as rotas [id]

---

**Gerado por:** Kilo AI Assistant  
**Data:** 2026-04-06  
**Versão do Relatório:** 2.0