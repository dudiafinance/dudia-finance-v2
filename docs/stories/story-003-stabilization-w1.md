# Story: Estabilização — Semana 1 (Core & Segurança I)

**ID:** STORY-003  
**Status:** IN_PROGRESS  
**Agente:** @dev  
**PRD Ref:** PRD-STABILIZATION.md — Semana 1

## Resumo
Implementar as melhorias de segurança e UX da Semana 1 do PRD de estabilização, sem alterar a lógica de negócio existente.

## Critérios de Aceite
- [x] `[SEC]` Camada de criptografia AES-256-GCM aplicada a `openRouterApiKey` na tabela `users`
- [x] `[UX]` Componente `AlertDialog` criado para ações destrutivas
- [x] `[UX]` Modais de confirmação substituindo `window.confirm()` em Transactions e Credit Cards
- [x] `[FEAT]` Script de teste de recorrências (`scripts/test-recurring.ts`) criado

## Tarefas

### 1. [SEC] Verificar/Corrigir Criptografia de Sensitive Data
- [x] Verificar se `openRouterApiKey` está sendo criptografado antes de salvar no banco (NÃO está em uso ativamente - feature descontinuada)
- [x] Documentar `ENCRYPTION_KEY` no `.env.example`

### 2. [UX] Criar Componente AlertDialog
- [x] Criar `src/components/ui/alert-dialog.tsx` seguindo padrão Shadcn/Radix
- [x] Implementar props: `title`, `description`, `onConfirm`, `onCancel`, `variant` (danger/default)

### 3. [UX] Substituir window.confirm() por AlertDialog
- [x] Em `transactions/page.tsx`: modal de exclusão substituído por AlertDialog
- [x] Em `credit-cards/page.tsx`: exclusão de cartão e transação via AlertDialog no componente pai

### 4. [FEAT] Criar Script de Teste de Recorrências
- [x] Criar `scripts/test-recurring.ts`
- [x] Importar lógica do endpoint `/api/cron/process-recurring`
- [x] Permitir execução via `npx tsx scripts/test-recurring.ts`
- [x] Incluir logs claros de sucesso/falha

## Arquivos a Modificar
- `src/lib/db/schema/index.ts` (se necessário adicionar transformações)
- `src/components/ui/alert-dialog.tsx` (novo)
- `src/app/(app)/transactions/page.tsx`
- `src/app/(app)/credit-cards/page.tsx`
- `scripts/test-recurring.ts` (novo)

## Arquivos a Não Modificar (Lógica Intocada)
- `src/lib/services/financial-engine.ts`
- `src/lib/credit-card-utils.ts`
- Regras de cálculo de saldo, fechamento de fatura, recorrências
