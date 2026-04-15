# Launch Readiness Plan — Dudia Finance v2
**Data:** 2026-04-15  
**Status:** Aprovado para execução  
**Objetivo:** sair de beta controlado para lançamento público com risco operacional baixo.

---

## 0) Regra de Execução (Obrigatória)

### Execução obrigatória com agentes em paralelo
- É **obrigatório** usar os agentes do projeto para esta frente.
- É **obrigatório** execução simultânea (paralela) das frentes compatíveis.
- Não executar modelo serial quando as tarefas forem independentes.
- Agentes mínimos obrigatórios por onda: `@dev`, `@qa`, `@devops`, `@architect`.

### Modo de trabalho obrigatório
- **Wave 1 (paralela):** P0-01, P0-04, P1-03
- **Wave 2 (paralela):** P0-02, P1-01, P1-02, P1-04
- **Wave 3 (sequencial curta):** P0-03 + Go/No-Go

### Definição de pronto por tarefa
- Código alterado + validação executada + evidência em log/CI + atualização de documentação.

---

## 1) Escopo e Resultado Esperado

### Escopo desta rodada
- Confiabilidade de build/deploy
- Qualidade de testes em CI
- Hardening de produção (rotas debug, healthcheck, observabilidade)
- Gate formal de Go/No-Go

### Resultado esperado
- Deploy reproduzível (commit/tag)
- CI bloqueando regressões críticas
- Sentry/Vercel com alertas de erro e disponibilidade
- Checklist de lançamento concluído e auditável

---

## 2) Backlog Priorizado com Ajustes Exatos

## P0 — Bloqueadores para lançamento público

### P0-01: Reativar validações de build
- **Responsável:** `@dev`
- **Arquivos:** `next.config.ts`
- **Ajuste exato:** remover `eslint.ignoreDuringBuilds` e `typescript.ignoreBuildErrors`.
- **Validação:** `npm run lint` e `npm run build` devem bloquear erro real.
- **Critério de aceite:** build sem bypass de validações.

### P0-02: CI com testes mínimos obrigatórios
- **Responsáveis:** `@qa` + `@devops` (paralelo)
- **Arquivos:** `.github/workflows/ci.yml`, `playwright.config.ts`
- **Ajuste exato:**
  - adicionar etapa de testes no CI (`npm test` ou subset estável)
  - adicionar smoke E2E crítico (login + criação de cartão)
  - manter lint/build como gates obrigatórios
- **Validação:** PR de teste deve falhar ao introduzir regressão proposital e passar ao corrigir.
- **Critério de aceite:** pipeline protegendo `main` com testes + build + lint.

### P0-03: Release rastreável no Git
- **Responsáveis:** `@devops` + `@architect`
- **Ajuste exato:**
  - commit de todos os hotfixes ativos
  - criação de tag de release
  - registro de release notes com hash, data e URL de produção
- **Validação:** documento de release aponta hash único para deploy.
- **Critério de aceite:** produção rastreável por commit/tag.

### P0-04: Variáveis de ambiente saneadas
- **Responsável:** `@devops`
- **Ajuste exato:**
  - revisar e regravar envs com risco de whitespace: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - validar `CRON_SECRET`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SENTRY_DSN`
  - revisar paridade de env entre produção e preview
- **Validação:** logs sem warning de whitespace por 24h.
- **Critério de aceite:** sem erro de inicialização por env inválida.

---

## P1 — Alta prioridade (imediatamente após P0)

### P1-01: Remover rotas debug da build de produção
- **Responsável:** `@dev`
- **Arquivos:** `src/app/api/debug/recalculate-all/route.ts`, `src/app/api/debug/transactions/route.ts`
- **Ajuste exato:** excluir rotas ou movê-las para caminho de desenvolvimento fora da build de produção.
- **Validação:** rota retorna 404 em produção (não 403 de runtime).
- **Critério de aceite:** endpoints ausentes no artefato de produção.

### P1-02: Healthcheck e readiness endpoint
- **Responsável:** `@dev`
- **Arquivo novo:** `src/app/api/health/route.ts`
- **Ajuste exato:** retornar JSON com `status`, `timestamp`, `version`, `checks.db`.
- **Validação:** endpoint responde 200 em estado saudável e 503 em degradação crítica.
- **Critério de aceite:** monitor externo detecta indisponibilidade em < 1 min.

### P1-03: Alertas operacionais obrigatórios
- **Responsável:** `@devops`
- **Arquivos:** `docs/MONITORING.md` + configuração Sentry/Vercel
- **Ajuste exato:** criar alertas para:
  - erro 5xx acima do limiar
  - falha do cron de recorrência
  - queda de disponibilidade
- **Validação:** disparo de evento de teste com recebimento em canal definido.
- **Critério de aceite:** alertas ativos e testados.

### P1-04: Migrar `middleware` para `proxy`
- **Responsável:** `@dev`
- **Arquivos:** `src/middleware.ts` e convenção equivalente em Next 16
- **Ajuste exato:** migrar convenção para eliminar warning de depreciação.
- **Validação:** `npm run build` sem warning da convenção de middleware.
- **Critério de aceite:** compatibilidade com padrão atual do framework.

---

## P2 — Melhoria contínua (não bloqueia lançamento)

### P2-01: E2E da jornada crítica completa
- Login -> criar conta -> criar cartão -> lançar transação -> pagar fatura.

### P2-02: SLOs com baseline real
- Definir e medir p50/p95/p99, error rate, availability, tempo de cron.

### P2-03: Limpeza técnica de tipos `any`
- Reduzir supressões para aumentar confiabilidade de evolução.

---

## 3) Plano de Execução (48h) com Paralelismo Obrigatório

### Wave 1 (D0-D1 manhã) — Paralela
- `@dev`: P0-01
- `@devops`: P0-04 + P1-03
- `@architect`: revisar riscos e critérios de aceite de P0/P1

### Wave 2 (D1 tarde-D2 manhã) — Paralela
- `@qa` + `@devops`: P0-02
- `@dev`: P1-01 + P1-02 + P1-04
- `@architect`: validação técnica cruzada

### Wave 3 (D2 tarde) — Sequencial curta
- `@devops`: P0-03
- `@architect`: decisão final de Go/No-Go

---

## 4) Critérios Go/No-Go

## Go (todos obrigatórios)
- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem ignorar type/lint
- [ ] CI verde com testes definidos
- [ ] Logs de produção 24h sem erros críticos repetidos
- [ ] Alertas operacionais ativos e validados
- [ ] Release tag + changelog publicados
- [ ] Evidência de execução paralela dos agentes registrada

## No-Go (qualquer item abaixo)
- [ ] Falha de autenticação intermitente para usuário novo
- [ ] 5xx acima do limiar acordado
- [ ] Healthcheck instável
- [ ] Deploy não rastreável para commit
- [ ] Execução sem paralelismo obrigatório entre agentes

---

## 5) Dono por frente (obrigatório)

- **@dev:** P0-01, P1-01, P1-02, P1-04
- **@qa:** P0-02, regressão e smoke E2E
- **@devops:** P0-02, P0-03, P0-04, P1-03
- **@architect:** revisão de risco, validação técnica e Go/No-Go

---

## 6) Estimativa de esforço

- **P0 total:** 8-12h
- **P1 total:** 6-10h
- **P2 total:** 8-16h (pós-lançamento)

**Janela recomendada para lançamento público:** após fechamento de P0 + P1 com execução paralela comprovada.
