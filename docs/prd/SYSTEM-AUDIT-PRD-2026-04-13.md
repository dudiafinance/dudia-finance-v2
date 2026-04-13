# PRD: Auditoria Sistêmica de Erros, Vazamentos e Melhorias
## DUD.IA Finance v2 — Relatório Técnico

> **Versão:** 1.0  
> **Data:** 13 de Abril de 2026  
> **Analista:** Atlas (Decoder) — Agente de Análise  
> **Classificação:** INTERNO — ALTA PRIORIDADE  

---

## 1. Sumário Executivo

Esta auditoria examinou o código-fonte completo do DUD.IA Finance v2, cobrindo APIs, serviços, schema de banco de dados, middleware e camada de hooks. Foram identificados **4 erros graves**, **3 vazamentos de dados/segurança** e **7 oportunidades de melhoria significativa**.

| Categoria | Quantidade | Prioridade |
|-----------|-----------|-----------|
| Erros graves (bugs com impacto real) | 4 | CRÍTICA |
| Vulnerabilidades de segurança | 3 | CRÍTICA |
| Problemas de performance | 3 | ALTA |
| Débitos técnicos e melhorias | 7 | MÉDIA |

---

## 2. Erros Graves (Bugs com Impacto Real)

### BUG-A1: `GET /api/accounts` Expõe Contas Deletadas (Soft-Delete Ausente)
**Arquivo:** `src/app/api/accounts/route.ts:16`  
**Severidade:** CRÍTICA  

**Problema:** O endpoint `GET /api/accounts` faz a query sem o filtro `isNull(accounts.deletedAt)`. Contas que foram soft-deletadas (com `deletedAt` preenchido) continuam aparecendo para o usuário — e pior, com saldo potencialmente inconsistente.

```ts
// ATUAL (bugado):
const rows = await db
  .select()
  .from(accounts)
  .where(eq(accounts.userId, userId)) // ← falta isNull(accounts.deletedAt)
  .orderBy(asc(accounts.createdAt));

// CORRETO:
.where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)))
```

**Impacto:** Usuários veem contas deletadas no seletor de contas, podendo criar transações nelas. Além disso, o `DELETE /api/accounts/[id]` faz hard-delete (`db.delete`) enquanto todos os outros usos assumem soft-delete — inconsistência que pode corromper referências de transações.

---

### BUG-A2: Transação `fixed` sem `recurringGroupId` na Primeira Ocorrência
**Arquivo:** `src/app/api/transactions/route.ts:166-213`  
**Severidade:** CRÍTICA  

**Problema:** O fluxo de criação de transação `fixed` tem um bug sutil de lógica:
1. A **primeira** transação é criada sem `recurringGroupId`
2. As **11 futuras** recebem um `groupId` novo

Resultado: ao tentar deletar "todas" as ocorrências de um `fixed` (mode=`all`), o sistema procura por `recurringGroupId` — mas a ocorrência original não tem esse campo. O usuário nunca consegue deletar o grupo inteiro.

```ts
// ATUAL (bugado):
const row = await FinancialEngine.addTransaction({
  // ↑ Criado SEM recurringGroupId
  subtype: 'fixed',
  ...
});

if (d.subtype === 'fixed') {
  const groupId = randomUUID(); // ← groupId criado DEPOIS, original nunca recebe
  await Promise.all(
    Array.from({ length: 11 }, async (_, i) => {
      return FinancialEngine.addTransaction({
        recurringGroupId: groupId, // ← apenas as futuras recebem
        ...
      });
    })
  );
}
```

**Impacto:** Impossibilidade de deletar todas as ocorrências de uma transação fixa. O grupo fica "partido".

---

### BUG-A3: Rate Limiter In-Memory Ineficaz em Produção Serverless
**Arquivo:** `src/middleware.ts:15-30`  
**Severidade:** ALTA  

**Problema:** O rate limiter usa um `Map<string, ...>` em memória de módulo. Em ambientes serverless (Vercel), cada invocação pode rodar em instâncias diferentes — o mapa é zerado a cada cold start e não é compartilhado entre pods paralelos.

```ts
// Ineficaz: cada instância serverless tem seu próprio Map
const writeCounts = new Map<string, { count: number; resetAt: number }>();
```

**Impacto:** Um atacante pode facilmente ultrapassar o limite fazendo requests distribuídos. A proteção contra abuso de escrita é ilusória.

---

### BUG-A4: Tabela `idempotency_keys` Cresce Indefinidamente
**Arquivo:** `src/lib/idempotency.ts:101`  
**Severidade:** ALTA  

**Problema:** A função `cleanupOldIdempotencyKeys` existe no código mas **nunca é chamada**. Não há cron job, não há trigger — a tabela acumula registros indefinidamente.

```ts
// Função existe mas jamais é invocada:
export async function cleanupOldIdempotencyKeys(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> { ... }
```

**Impacto:** Em produção com uso intenso, a tabela `idempotency_keys` pode chegar a dezenas de milhões de linhas, degradando queries e ocupando espaço em disco.

---

## 3. Vulnerabilidades de Segurança

### SEC-01: Debug Bypass Sem Verificação de Ambiente no Middleware
**Arquivo:** `src/middleware.ts:50-54`  
**Severidade:** CRÍTICA  

**Problema:** O middleware permite bypass completo de autenticação em **produção** se o header `x-debug-bypass` corresponder ao `AIOX_DEBUG_TOKEN`:

```ts
// middleware.ts — SEM VERIFICAÇÃO DE NODE_ENV
const isDebugBypass = request.headers.get("x-debug-bypass") === process.env.AIOX_DEBUG_TOKEN;
if (!isPublicRoute(request) && !isDebugBypass) {
  await auth.protect();
}
```

O `auth-utils.ts` corretamente verifica `NODE_ENV !== "production"`, mas o middleware **não faz essa verificação**. Se `AIOX_DEBUG_TOKEN` vazar (via log, env file commitado, etc.), qualquer pessoa consegue autenticar como um usuário fixo hardcoded (`debfc4b5-45eb-45dc-90d3-30a83d4e1064`) em produção.

**Prova:** O UUID hardcoded em `auth-utils.ts:19` é um usuário real do sistema.

---

### SEC-02: `passwordHash` — Campo Legado Expondo Dado Vestigial
**Arquivo:** `src/lib/db/schema/index.ts:21` | `src/app/api/webhooks/clerk/route.ts:82`  
**Severidade:** MÉDIA  

**Problema:** O schema `users` mantém o campo `passwordHash` (que deveria ter sido removido após migração para Clerk). No webhook de criação de usuário, o valor `'clerk_authenticated'` é gravado como senha — uma string hardcoded que não tem significado mas polui o banco e é um sinal de alerta em auditorias de conformidade (LGPD/GDPR).

Além disso, qualquer endpoint que retorne o objeto `user` completo (sem projeção específica de campos) vaza esse campo para o cliente.

---

### SEC-03: `openRouterApiKey` Armazenado como Plaintext
**Arquivo:** `src/lib/db/schema/index.ts:40`  
**Severidade:** MÉDIA  

**Problema:** O campo `openRouterApiKey` existe na tabela `users` mas **não há nenhum uso** encontrado em toda a codebase (exceto a definição do schema). Contudo, o campo existe no banco — se a funcionalidade de IA for implementada e começar a armazenar chaves reais de usuários, estas estarão em plaintext.

Chaves de API de terceiros **nunca** devem ser armazenadas sem criptografia simétrica (AES-256 ou Vault).

---

## 4. Problemas de Performance

### PERF-01: Forecast Route Carrega Todos os Dados em Memória
**Arquivo:** `src/app/api/forecast/route.ts:31-43`  
**Severidade:** ALTA  

**Problema:** Mesmo com o limite de 24 meses (BUG-011 já corrigido), a rota de forecast ainda:
1. Carrega **todas as transações** dos últimos 24 meses em memória JS
2. Carrega **todas as transações de cartão** dos últimos 24 meses em memória JS
3. Faz todos os cálculos em JavaScript ao invés de delegar ao banco

Para um usuário com ~500 transações/mês, são **12.000 registros carregados por request**.

**Correto seria:** Usar queries SQL com `GROUP BY month, year` já sumarizadas.

---

### PERF-02: N+1 Implícito em `updateCardTransaction` com `updateGroup=true`
**Arquivo:** `src/lib/services/financial-engine.ts:369-390`  
**Severidade:** ALTA  

**Problema:** Ao atualizar todas as parcelas de um grupo, o código faz um `UPDATE` individual para cada parcela:

```ts
for (const item of allGroup) {
  await tx.update(cardTransactions)
    .set({ ... })
    .where(eq(cardTransactions.id, item.id)); // ← 1 query por parcela
}
```

Para um parcelamento em 24x, são **24 queries UPDATE** sequenciais dentro de uma transaction.

---

### PERF-03: Polling de Notificações a Cada 60 Segundos
**Arquivo:** `src/hooks/use-api.ts:351`  
**Severidade:** MÉDIA  

**Problema:** O hook `useNotifications` faz polling HTTP a cada minuto para todos os usuários com a aba aberta. Isso significa que com 100 usuários simultâneos, o sistema recebe **100 requests/minuto** apenas para notificações — a maioria sem retorno novo.

```ts
refetchInterval: ONE_MINUTE, // 60.000ms — polling constante
```

**Alternativa:** Server-Sent Events (SSE) ou WebSockets para push de notificações.

---

## 5. Débitos Técnicos e Melhorias

### DEBT-01: Endpoint `/api/migrate` em Produção
**Arquivo:** `src/app/api/migrate/route.ts`  
**Severidade:** ALTA  

**Problema:** Existe um endpoint de migração DDL exposto em produção, protegido apenas por um token. Este endpoint executa `ALTER TABLE` e `CREATE TABLE` diretamente. É uma superfície de ataque desnecessária que deveria ser eliminada — migrações devem rodar via `drizzle-kit migrate` no deploy, não via HTTP em runtime.

---

### DEBT-02: Conexão de Banco sem Connection Pool Explícito
**Arquivo:** `src/lib/db/index.ts:16`  
**Severidade:** ALTA  

**Problema:** A conexão é criada com `postgres(connectionString)` sem configuração de pool. Em serverless com múltiplas invocações paralelas, cada função cria sua própria conexão Postgres. O Neon tem limite de conexões simultâneas — sem pool com `max` definido, é possível atingir esse limite e começar a receber `too many connections`.

**Correto:**
```ts
const client = postgres(connectionString, {
  max: 1, // Para serverless: 1 conexão por função
  idle_timeout: 20,
  connect_timeout: 10,
});
```

---

### DEBT-03: `any` Types no FinancialEngine
**Arquivo:** `src/lib/services/financial-engine.ts:350,353` | `src/lib/errors.ts:12`  
**Severidade:** MÉDIA  

O core financeiro do sistema usa `as any` e `data?: any` em pontos críticos, desabilitando a segurança de tipos do TypeScript. Um erro de campo (ex: passar `amount` como string numérica vs número) pode passar silenciosamente.

---

### DEBT-04: Hard Delete em Contas vs. Soft Delete no Restante
**Arquivo:** `src/app/api/accounts/[id]/route.ts:59-62`  
**Severidade:** MÉDIA  

Contas são **deletadas permanentemente** (`db.delete`) enquanto transações, metas, cartões e lançamentos usam soft-delete. A inconsistência viola o princípio de auditoria imutável do sistema. Uma conta deletada perde seu histórico de forma irreversível.

---

### DEBT-05: Ausência de Funcionalidade de Chat/IA (Feature Incompleta)
**Arquivos:** `src/lib/db/schema/index.ts:40` | diretório `src/app/api/chat/` vazio  
**Severidade:** MÉDIA  

O schema tem `openRouterApiKey` nas configurações do usuário, e existe o diretório `/api/chat/` — mas não há implementação. É uma promessa de feature sem entrega, gerando confusão e campo sem uso no banco.

---

### DEBT-06: `console.log` / `console.warn` em Rotas de Produção
**Arquivo:** `src/app/api/credit-cards/[id]/route.ts:33` (marcado como "DEBUG")  
**Severidade:** BAIXA  

Há `console.log` com prefixo "DEBUG" em rotas de produção. Além de poluir logs, podem vazar dados sensíveis (IDs de usuário, IDs de cartão) em plataformas que armazenam logs sem controle de acesso granular.

---

### DEBT-07: Ausência de Export de Dados (LGPD/GDPR)
**Severidade:** ALTA  

Não existe nenhum endpoint `GET /api/user/export` ou similar. A LGPD (Art. 18, inciso V) garante ao usuário o direito de portabilidade dos dados. Sem essa funcionalidade, o sistema está em não-conformidade regulatória.

---

## 6. Plano de Ação Prioritizado

### Prioridade CRÍTICA — Corrigir Imediatamente

| ID | Ação | Arquivo(s) | Esforço |
|----|------|-----------|---------|
| BUG-A1 | Adicionar `isNull(accounts.deletedAt)` no GET de contas | `accounts/route.ts` | 15min |
| BUG-A2 | Criar `groupId` antes da primeira transação `fixed` e repassar para todas | `transactions/route.ts` | 1h |
| SEC-01 | Adicionar `process.env.NODE_ENV !== "production"` no bypass do middleware | `middleware.ts` | 10min |

### Prioridade ALTA — Próxima Sprint

| ID | Ação | Arquivo(s) | Esforço |
|----|------|-----------|---------|
| BUG-A4 | Adicionar limpeza de `idempotency_keys` no cron existente | `cron/process-recurring/route.ts` | 30min |
| BUG-A3 | Migrar rate limiter para Vercel KV ou Upstash Redis | `middleware.ts` | 3h |
| DEBT-01 | Remover endpoint `/api/migrate` de produção | `api/migrate/route.ts` | 30min |
| DEBT-02 | Configurar `max: 1, idle_timeout` no cliente Postgres | `lib/db/index.ts` | 20min |
| DEBT-04 | Converter DELETE de accounts para soft-delete | `accounts/[id]/route.ts` | 1h |
| DEBT-07 | Implementar endpoint de export LGPD | Nova rota | 4h |

### Prioridade MÉDIA — Backlog

| ID | Ação | Esforço |
|----|------|---------|
| PERF-01 | Refatorar forecast para SQL aggregations (GROUP BY) | 6h |
| PERF-02 | Converter N+1 de parcelas para UPDATE em batch | 2h |
| PERF-03 | Substituir polling de notificações por SSE | 6h |
| SEC-02 | Remover campo `passwordHash` do schema | 2h |
| SEC-03 | Implementar criptografia para `openRouterApiKey` | 3h |
| DEBT-03 | Eliminar `any` types no FinancialEngine e Errors | 2h |
| DEBT-05 | Implementar ou remover feature de Chat/IA | 8h+ |
| DEBT-06 | Remover `console.log` de debug de produção | 30min |

---

## 7. Critérios de Aceitação

Cada item deve satisfazer:

- [ ] Testes unitários cobrindo o cenário corrigido
- [ ] Nenhum novo erro de TypeScript (`tsc --noEmit`)
- [ ] Nenhum novo aviso de ESLint
- [ ] Review manual do comportamento no ambiente de staging
- [ ] Para itens de segurança: revisão por segundo desenvolvedor

---

## 8. Métricas de Sucesso

| Métrica | Hoje | Meta |
|---------|------|------|
| Erros críticos em produção | 4 | 0 |
| Vulnerabilidades de segurança | 3 | 0 |
| Conexões Postgres desperdiçadas | Indefinido | Máx. 10 simultâneas |
| Rows em `idempotency_keys` | Crescendo | Limpeza automática semanal |
| Conformidade LGPD (export) | 0% | 100% |

---

*Análise realizada por Atlas (Decoder Agent) em 13/04/2026. Baseada em leitura estática do código-fonte — não substitui testes de penetração ou auditoria de segurança profissional.*
