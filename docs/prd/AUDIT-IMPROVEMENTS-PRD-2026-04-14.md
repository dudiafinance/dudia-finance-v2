# PRD: Auditoria Técnica & Plano de Melhorias — Dudia Finance v2
**Versão:** 1.0  
**Data:** 14/04/2026  
**Status:** EM EXECUÇÃO  
**Agentes Responsáveis:** @dev, @data-engineer, @qa, @devops, @architect

---

## 1. Contexto

Após limpeza organizacional e implementação de criptografia AES-256 (14/04/2026), foi conduzida uma auditoria completa do sistema Dudia Finance v2. O sistema está em fase de estabilização pós-implementação (v0.9.x). A auditoria identificou riscos de segurança remanescentes, débitos técnicos de performance e problemas de escalabilidade que precisam ser endereçados antes de um lançamento público.

### Escopo da Auditoria
- **Segurança:** Auth, criptografia, proteção de dados, rate limiting
- **Performance:** Queries ao banco, loops N+1, polling
- **Escalabilidade:** Estratégia multi-instância, connection pooling
- **Qualidade:** Cobertura de testes, build, console logs
- **Débitos Técnicos:** Legacy code, campos vestigiais, funcionalidades incompletas

---

## 2. Status Atual do Sistema

| Dimensão | Status | Nota |
|---|---|---|
| Segurança | Bom — mas com pontos de atenção | 7/10 |
| Performance | Médio — Forecast otimizado, mas engine com N+1 | 6/10 |
| Escalabilidade | Fraco — Rate limit em memória, polling HTTP | 5/10 |
| Qualidade de Código | Bom — Build passando, 106/107 testes | 7/10 |
| Observabilidade | Médio — Sentry existe, mas sem métricas customizadas | 6/10 |
| Testes | Frágil — 1 teste falha por dependência de DB real | 6/10 |

---

## 3. Problemas Identificados

### 3.1 Segurança

#### SEC-01: Rate Limiting em Memória (CRÍTICO)
- **Arquivo:** `src/middleware.ts:29-57`
- **Severidade:** ALTA
- **Problema:** O `rateLimitStore` é um `Map` em memória. Em ambiente serverless com múltiplas instâncias (Vercel), cada instância tem seu próprio Map — rate limiting é ineficaz. Um atacante pode girar requisições entre instâncias e burla-lo.
- **Impacto:** Exposição a ataques de força bruta e DDoS em escala.

#### SEC-02: Endpoint `/api/migrate` Exposto em Runtime
- **Arquivo:** `src/app/api/migrate/route.ts`
- **Severidade:** ALTA
- **Problema:** Mesmo bloqueado em produção (`NODE_ENV === "production"`), o código DDL ainda existe na codebase. Se a lógica de блокировка for removida ou burlada, o endpoint executa `ALTER TABLE` e `CREATE TABLE` diretamente no banco.
- **Impacto:** Potencial destruição de schema por acesso não autorizado.

#### SEC-03: Bypass de Debug em Non-Production
- **Arquivo:** `src/middleware.ts:96-99` | `src/lib/auth-utils.ts:15-17`
- **Severidade:** MÉDIA
- **Problema:** O token `AIOX_DEBUG_TOKEN` é aceito para bypass de autenticação em ambientes não-production. Se esse token vazar (ex: commit em repo público), qualquer um pode acessar APIs como se fosse um usuário real.
- **Mitigação atual:** Só funciona se `NODE_ENV !== "production"`.
- **Impacto:** Risco de acesso indevido em ambientes compartilhados.

#### SEC-04: Console.log com Dados Sensíveis
- **Arquivo:** Múltiplos em `src/app/api/`
- **Severidade:** BAIXA
- **Problema:** Múltiplas rotas logam `console.error` com `error` objects que podem conter stack traces com caminhos de arquivo, IDs de usuário, IDs de transação.

#### SEC-05: `passwordHash` Campo Vestigial
- **Arquivo:** `src/lib/db/schema/index.ts`
- **Severidade:** MÉDIA
- **Problema:** Campo legados do período pré-Clerk. Gravado como string hardcoded `'clerk_authenticated'`. Deve ser removido do schema e do banco.

---

### 3.2 Performance

#### PERF-01: N+1 em `updateCardTransaction` com `updateGroup=true`
- **Arquivo:** `src/lib/services/financial-engine.ts:344-430`
- **Severidade:** ALTA
- **Problema:**尽管代码中有注释说 "Batch update" (linha 375), o código ainda faz loop sequencial com `await tx.update()` para cada parcela (linhas 390-404). Para um parcelamento de 24x, são 24 queries UPDATE sequenciais dentro de uma transaction.
- **Impacto:** Latência elevada em operações de cartão com muitas parcelas.

#### PERF-02: Polling HTTP de Notificações
- **Arquivo:** `src/hooks/use-api.ts:650-658`
- **Severidade:** MÉDIA
- **Problema:** `useNotifications` faz polling HTTP a cada 2 minutos. Com 100 usuários simultâneos, são 50 requests/minuto só para notificações — a maioria sem retorno novo.
- **Solução sugerida:** Server-Sent Events (SSE) ou WebSockets.

#### PERF-03: Forecast Carrega Dados em Memória (Parcialmente Corrigido)
- **Arquivo:** `src/app/api/forecast/route.ts`
- **Severidade:** MÉDIA
- **Situação:** O código JÁ usa SQL aggregations (`SUM`, `GROUP BY`) nas queries principais. O problema residual é que `allRecurring` e `allBudgets` ainda são carregados em memória como arrays e processados em JS.
- **Impacto:** Para usuários com muitas recorrências, ainda há processamento desnecessário em JS.

---

### 3.3 Escalabilidade

#### ESC-01: Rate Limiting Não Compartilhado Entre Instâncias
- **Arquivo:** `src/middleware.ts`
- **Severidade:** ALTA
- **Problema:** Já coberto em SEC-01. Rate limit em memória é ineficaz em ambiente multi-instância serverless.
- **Solução:** Usar Redis/KV store (Upstash ou Vercel KV).

#### ESC-02: Conexões Postgres em Serverless
- **Arquivo:** `src/lib/db/index.ts`
- **Severidade:** MÉDIA
- **Situação:** O código JÁ tem `max: 1` configurado (linha 19). Isso é correto para serverless. Mas o Neon tem limite de 100 conexões simultâneas mesmo com `max: 1` por instância — com 100+ usuários simultâneos, pode haver esgotamento.
- **Solução:** Considerar connection pooler externo (PgBouncer ou Neon Pooler).

#### ESC-03: Sessões de Usuário em Memória
- **Arquivo:** `src/lib/auth-utils.ts`
- **Severidade:** BAIXA
- **Situação:** Clerk já gerencia sessões. Auth utils apenas busca UUID do banco. Não há problema direto de escalabilidade aqui.

---

### 3.4 Qualidade e Testes

#### QUAL-01: Teste de Budget Hierarchy Falha
- **Arquivo:** `src/test/budget-hierarchy.test.ts`
- **Severidade:** MÉDIA
- **Problema:** O teste depende de um usuário e conta já existentes no banco (`await db.select().from(users).limit(1)`). Se o banco de teste estiver vazio, o teste falha com `Cannot read properties of undefined (reading 'id')`.
- **Solução:** Criar fixtures de teste com dados isolados ou usar mock de banco.

#### QUAL-02: Build com Warnings de ESLint
- **Arquivo:** `next.config.ts`
- **Severidade:** BAIXA
- **Problema:** `eslint: { ignoreDuringBuilds: true }` e `typescript: { ignoreBuildErrors: true }` suprimem erros de lint/typecheck no build. O projeto compila mas pode ter tipos quebrados em produção.
- **Solução:** Corrigir erros e habilitar validação no build.

#### QUAL-03: Debug Routes em Produção
- **Arquivos:** `src/app/api/debug/transactions/route.ts` | `src/app/api/debug/recalculate-all/route.ts`
- **Severidade:** MÉDIA
- **Problema:** Ambas as rotas verificam `NODE_ENV === "production"` e retornam 403. Isso está correto, mas não devem existir em produção — devem ser removidas da build.

---

### 3.5 Débitos Técnicos

#### DEBT-01: Campo `openRouterApiKey` Sem Uso
- **Arquivo:** `src/lib/db/schema/index.ts:55`
- **Severidade:** BAIXA
- **Situação:** Campo existe no schema e foi protegido com criptografia (implementação nova). Mas a feature de IA não está implementada. Manter o campo PREPARADO é a decisão correta.

#### DEBT-02: Feature Chat/IA Incompleta
- **Arquivo:** Diretório `src/app/api/chat/` (vazio)
- **Severidade:** BAIXA
- **Situação:** promessa de feature sem entrega. Deve ser removida ou implementada.

#### DEBT-03: `any` Types no FinancialEngine
- **Arquivo:** `src/lib/services/financial-engine.ts:350-353`
- **Severidade:** MÉDIA
- **Problema:** Uso de `as any` em higienização de dados do `updateCardTransaction`. Pode mascarar erros de campo.

---

## 4. Plano de Execução — Agents em Paralelo

### Squad Composition
- **@dev:** Correções de código principal, N+1, console logs, debug routes
- **@data-engineer:** Otimização de queries, índices, migrations
- **@qa:** Correção de testes, fixtures, validação de cobertura
- **@devops:** Rate limiting Redis, infraestrutura, CI/CD
- **@architect:** Validação de estratégia de escala

### Tarefas por Agent

#### @dev
| ID | Tarefa | Arquivo(s) | Prioridade | Status |
|----|--------|-----------|------------|--------|
| DEV-01 | Corrigir N+1 em `updateCardTransaction` — batch real com SQL CASE | `financial-engine.ts:344-430` | CRÍTICA | ⏳ |
| DEV-02 | Remover `console.log`/`console.error` de produção (mover para logger estruturado) | `src/app/api/*` | ALTA | ⏳ |
| DEV-03 | Remover debug routes de produção (`/api/debug/*`) | `src/app/api/debug/*` | ALTA | ⏳ |
| DEV-04 | Implementar SSE para notificações (substituir polling) | `src/hooks/use-api.ts:650-658` | MÉDIA | ⏳ |
| DEV-05 | Corrigir `any` types em `financial-engine.ts` | `financial-engine.ts:350-353` | MÉDIA | ⏳ |
| DEV-06 | Remover diretório `/api/chat/` vazio ou documentar como backlog | `src/app/api/chat/` | BAIXA | ⏳ |

#### @data-engineer
| ID | Tarefa | Arquivo(s) | Prioridade | Status |
|----|--------|-----------|------------|--------|
| DE-01 | Analisar necessidade de índices adicionais nas queries de forecast | `forecast/route.ts` | ALTA | ⏳ |
| DE-02 | Verificar se `cardTransactions` precisa de índice composto `(userId, invoiceMonth, invoiceYear)` | `db/schema/index.ts` | ALTA | ⏳ |
| DE-03 | Documentar necessidade de pooler de conexões (PgBouncer/Neon) | `lib/db/index.ts` | MÉDIA | ⏳ |
| DE-04 | Avaliar necessidade de `passwordHash` migration para remoção | `db/schema/index.ts` | MÉDIA | ⏳ |

#### @qa
| ID | Tarefa | Arquivo(s) | Prioridade | Status |
|----|--------|-----------|------------|--------|
| QA-01 | Criar fixtures de banco para testes (dados mock isolados) | `src/test/*.test.ts` | ALTA | ⏳ |
| QA-02 | Corrigir `budget-hierarchy.test.ts` — não depender de DB real | `src/test/budget-hierarchy.test.ts` | ALTA | ⏳ |
| QA-03 | Adicionar testes para rota de criptografia `encrypt/decrypt` | `src/__tests__/` | MÉDIA | ⏳ |
| QA-04 | Validar que o build passa sem `ignoreBuildErrors` | `next.config.ts` | MÉDIA | ⏳ |

#### @devops
| ID | Tarefa | Arquivo(s) | Prioridade | Status |
|----|--------|-----------|------------|--------|
| OPS-01 | Implementar rate limiting com Upstash Redis ou Vercel KV | `src/middleware.ts` | CRÍTICA | ⏳ |
| OPS-02 | Configurar pipeline de testes no CI (GitHub Actions) | `.github/workflows/` | ALTA | ⏳ |
| OPS-03 | Remover endpoint `/api/migrate` de vez da codebase | `src/app/api/migrate/route.ts` | ALTA | ⏳ |
| OPS-04 | Configurar alerts de Sentry para erros 5xx e latência | `sentry.config.ts` | MÉDIA | ⏳ |

#### @architect
| ID | Tarefa | Prioridade | Status |
|----|--------|------------|--------|
| ARC-01 | Validar estratégia de escala multi-instância serverless | ALTA | ⏳ |
| ARC-02 | Definir métricas de sucesso (throughput, latency, error rate) | MÉDIA | ⏳ |
| ARC-03 | Avaliar necessidade de API Gateway vs middleware atual | MÉDIA | ⏳ |

---

## 5. Critérios de Aceitação

Para cada item concluído, deve satisfazer:
- [ ] Nenhum erro de TypeScript (`tsc --noEmit` passando)
- [ ] Nenhum warning de ESLint (exceto os explicitamente suprimidos)
- [ ] Build passando com `npm run build`
- [ ] Testes unitários passando (107/107)
- [ ] Testes E2E passando
- [ ] Review de código por pelo menos 1 agent

---

## 6. Métricas de Sucesso

Após implementação de todas as correções:

| Métrica | Antes | Meta |
|---------|-------|------|
| Segurança (rate limit) | Ineficaz em multi-instância | Eficaz com Redis |
| Performance (N+1 parcels) | 24 queries por grupo | 1 query por grupo |
| Testes passando | 106/107 | 107/107 |
| Debug routes em prod | 2 rotas expostas | 0 |
| Console logs prod | 68 ocorrências | <5 |
| Build warnings | Múltiplos | Zero |
| Escala simultânea | ~50 usuários | 500+ usuários |

---

## 7. Riscos e Dependências

| Risco | Probabilidade | Impacto | Mitigação |
|-------|-------------|---------|-----------|
| Breaking changes no rate limit Redis | Baixa | Alta | Testar em staging primeiro |
| Migração de banco ao remover `passwordHash` | Média | Alta | Criar migration separada e reversível |
| Testes quebrando ao corrigir fixtures | Média | Baixa | Rodar suíte completa após cada mudança |

---

## 8. PRD de Infraestrutura: VPS nos EUA

Um segundo PRD foi criado em: `docs/prd/VPS-HOSTING-PRD-2026-04-14.md`

Este documento avalia a contratação de uma VPS nos EUA para hospedar o banco de dados PostgreSQL e as implicações de performance, latência e custo.
