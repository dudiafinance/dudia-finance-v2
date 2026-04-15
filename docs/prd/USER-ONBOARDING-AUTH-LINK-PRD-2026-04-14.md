# PRD: Estabilizacao de Cadastro, Vinculo de ID e Onboarding Inicial
**Versao:** 1.0  
**Data:** 14/04/2026  
**Status:** PROPOSTO  
**Responsaveis:** @dev, @data-engineer, @qa, @architect

---

## 1. Contexto

Foi identificado um conjunto de falhas no fluxo de novos usuarios: apos o cadastro/autenticacao, parte dos usuarios nao consegue criar dados (contas, cartoes, transacoes, categorias), recebendo erro de autorizacao ou falha indireta por ausencia de vinculo interno.

O sistema usa Clerk para identidade, mas todas as tabelas de dominio dependem de `users.id` interno (UUID local). Portanto, qualquer instabilidade no sincronismo `Clerk user -> users.id` bloqueia o produto.

---

## 2. Problema de Produto

### 2.1 Dor do usuario
- Usuario finaliza cadastro com sucesso no Clerk.
- Ao entrar no app e tentar primeira acao de criacao, recebe erro (`401 Unauthorized` ou falhas encadeadas).
- Experiencia de primeiro uso quebra em momento critico de ativacao.

### 2.2 Impacto de negocio
- Queda de conversao no onboarding.
- Aumento de suporte/manual intervention.
- Perda de confianca no cadastro e no app.

---

## 3. Diagnostico Tecnico (As-Is)

### 3.1 Fluxo atual
1. Usuario autentica no Clerk.
2. Webhook `user.created/user.updated` tenta criar/atualizar `users`.
3. APIs de dominio chamam `getUserId()` para resolver `users.id`.
4. Se `getUserId()` falhar, escrita falha para todas as features.

### 3.2 Evidencias no codigo
- `src/lib/auth-utils.ts`: resolucao de usuario por `clerkId` com fallback por email e criacao local.
- `src/app/api/webhooks/clerk/route.ts`: sincronizacao por email literal (sem normalizacao robusta).
- `drizzle/0017_dusty_senator_kelly.sql`: adiciona `clerk_id` com unique.
- `drizzle/0018_lovely_chat.sql`: remove unique de `clerk_id`.
- `src/lib/validations/index.ts`: `payInvoiceSchema` exige `userId` no payload mesmo quando sessao ja define ownership.
- `src/app/(app)/categories/page.tsx` + `src/app/api/categories/seed/route.ts`: bootstrap de categorias e manual, nao automatico no primeiro uso.

### 3.3 Causas-raiz provaveis
- Vinculo `clerkId -> users.id` nao garantido com invariante forte de unicidade.
- Dependencia de webhook assicrono para estado critico de login inicial.
- Fallback por email ainda vulneravel a variacoes de normalizacao/case.
- Contratos de API inconsistentes (campos de ownership vindos do cliente).
- Onboarding inicial depende de acao manual do usuario para dados minimos.

---

## 4. Objetivos

### 4.1 Objetivo principal
Garantir que todo usuario autenticado consiga criar dados imediatamente apos cadastro, sem erro de vinculo de ID.

### 4.2 Objetivos secundarios
- Tornar sincronizacao Clerk/local idempotente e deterministica.
- Eliminar dependencia de `userId` vindo do frontend quando sessao ja define o usuario.
- Reduzir friccao no primeiro uso com bootstrap automatico minimo.

---

## 5. Escopo

### 5.1 In-Scope
- Hardening do fluxo `getUserId()` (garantia de usuario local).
- Ajuste de webhook Clerk para normalizacao e upsert seguro.
- Reforco de invariante de banco para `users.clerk_id` (unicidade + indice).
- Revisao de schemas/rotas que aceitam `userId` do cliente.
- Onboarding tecnico minimo para usuario novo (dados base).
- Observabilidade para diagnosticar falhas de sync.

### 5.2 Out-of-Scope
- Redesign completo de UI de onboarding.
- Migracao de provedor de autenticacao.
- Refatoracao ampla de dominio fora dos fluxos de criacao inicial.

---

## 6. Requisitos Funcionais

### RF-01: Resolucao de usuario interno obrigatoria
Toda rota autenticada de escrita deve operar com `users.id` interno valido, resolvido por sessao e nunca por payload do cliente.

### RF-02: Criacao local idempotente
Se usuario existir no Clerk e ainda nao existir localmente, o sistema deve criar o registro local de forma idempotente no primeiro request autenticado.

### RF-03: Vinculo deterministico por `clerkId`
Ao existir `clerkId`, ele e a fonte primaria de resolucao de identidade local.

### RF-04: Fallback por email normalizado
Fallback por email deve usar normalizacao consistente (trim + lowercase) em todos os pontos de escrita/leitura de email.

### RF-05: Contrato seguro de ownership
Campos sensiveis de ownership (`userId`) nao devem ser aceitos do frontend em rotas autenticadas.

### RF-06: Bootstrap inicial
Usuario novo deve ter caminho garantido para primeiras operacoes, com dados minimos iniciais (ex.: categorias base opcionais/automatica por regra definida).

---

## 7. Requisitos Nao Funcionais

- **RNF-01 (Confiabilidade):** falhas transitorias de webhook nao podem bloquear primeiro uso.
- **RNF-02 (Idempotencia):** repeticao de eventos de webhook ou retries de request nao gera duplicidade.
- **RNF-03 (Seguranca):** ownership sempre derivado da sessao no backend.
- **RNF-04 (Observabilidade):** logs estruturados com motivo de falha de resolucao e identificadores de correlacao.

---

## 8. Proposta de Solucao (To-Be)

### 8.1 Camada de identidade (backend)
- Criar/fortalecer um servico unico de `ensureLocalUser()` usado por `getUserId()`.
- Ordem de resolucao:
  1) buscar por `clerkId`;  
  2) fallback por email normalizado;  
  3) criar usuario local idempotente.
- Em caso de disputa/concorrencia, tratar conflito de unique e reler registro.

### 8.2 Webhook Clerk
- Normalizar email (`trim().toLowerCase()`).
- Operacao de upsert segura por `clerkId`/email normalizado.
- Garantir que eventos repetidos nao criem duplicidade.

### 8.3 Banco de dados
- Reintroduzir constraint de unicidade para `users.clerk_id` (permitindo null quando aplicavel).
- Criar indice dedicado de lookup por `clerk_id` se necessario.
- Executar cleanup previo de eventuais duplicados antes de aplicar unique.

### 8.4 Contrato de APIs
- Remover `userId` de schemas publicos onde a sessao define usuario (ex.: pagamento de fatura).
- Bloquear qualquer tentativa de override de ownership no payload.

### 8.5 Onboarding minimo
- Definir politica clara para dados iniciais:
  - opcao A: seed automatico de categorias base ao primeiro login;
  - opcao B: wizard guiado com CTA unico e transacional.
- Recomendacao: opcao A com flag de controle e idempotencia.

---

## 9. Criterios de Aceite

- [ ] Usuario novo autenticado consegue criar conta sem erro.
- [ ] Usuario novo autenticado consegue criar categoria/tag/cartao sem erro.
- [ ] Fluxo de criar transacao funciona apos cadastro (com pre-condicoes validas de conta/categoria).
- [ ] Ausencia/atraso de webhook nao bloqueia primeiro uso.
- [ ] Nao existe duplicidade de `clerk_id` apos migracao.
- [ ] Nenhuma rota autenticada de dominio aceita `userId` do cliente como fonte de verdade.
- [ ] Logs permitem identificar claramente falha de sync (sem vazar dados sensiveis).

---

## 10. Plano de Implementacao

### Fase 1 - Correcao critica (P0)
1. Hardening de `getUserId()`/`ensureLocalUser()`.
2. Ajuste do webhook para normalizacao e idempotencia.
3. Migracao para restaurar unique de `clerk_id` (com script de deduplicacao).

### Fase 2 - Contratos e protecoes (P0/P1)
1. Remover `userId` de schemas publicos indevidos.
2. Revisar rotas para ownership estritamente por sessao.

### Fase 3 - Onboarding (P1)
1. Implementar bootstrap inicial automatico e idempotente.
2. Ajustar UX para estado inicial sem bloqueio.

### Fase 4 - Validacao (P1)
1. Testes de integracao para novo usuario end-to-end.
2. Testes de concorrencia/idempotencia para webhook e fallback.
3. Checklist de regressao nas rotas de escrita.

---

## 11. Plano de Testes

### Cenarios obrigatorios
- Signup novo usuario + primeira criacao de conta.
- Signup com webhook atrasado + primeira criacao de cartao/transacao.
- Reenvio de webhook `user.created` (idempotencia).
- Caso com email em maiusculo/minusculo misto.
- Tentativa de enviar `userId` divergente no payload (deve ser ignorado/rejeitado).

### Regressao
- Rotas: `accounts`, `categories`, `tags`, `transactions`, `credit-cards`, `goals`, `transfers`, `pay-invoice`.

---

## 12. Riscos e Mitigacoes

- **Risco:** dados legados com `clerk_id` duplicado.  
  **Mitigacao:** rotina de deduplicacao + auditoria antes da migration.

- **Risco:** regressao de auth em rotas existentes.  
  **Mitigacao:** suite de integracao focada em novos usuarios e smoke em producao.

- **Risco:** bootstrap automatico gerar dados indesejados.  
  **Mitigacao:** feature flag + idempotencia + telemetria de adesao/erro.

---

## 13. Metricas de Sucesso

- Taxa de erro em criacao para usuarios com <24h de conta < 1%.
- Zero ocorrencias de `Unauthorized` por falha de vinculo apos login valido.
- Tempo medio do primeiro sucesso de criacao < 60 segundos apos signup.
- Reducao de tickets relacionados a "cadastro criado mas nao consigo criar nada".

---

## 14. Dependencias

- Ambiente Clerk configurado (webhook secret valido).
- Permissao para migration no banco Neon/Postgres.
- Suite de testes de integracao com usuario novo.

---

## 15. Entregaveis

- Documento PRD aprovado.
- Migrations de banco para invariantes de identidade.
- Ajustes de backend (auth/webhook/rotas/schema).
- Testes automatizados cobrindo onboarding tecnico de novo usuario.
