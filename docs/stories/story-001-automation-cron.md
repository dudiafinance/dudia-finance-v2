# Story: Automação de Transações Recorrentes (Vercel Cron)

**ID:** STORY-001  
**Status:** IN_PROGRESS  
**Agente:** @dev / @sm  

## Resumo
Implementar um worker automatizado que processa transações recorrentes agendadas, garantindo que o saldo das contas seja atualizado sem intervenção manual.

## Critérios de Aceite
- [ ] Arquivo `vercel.json` configurado com agendamento diário.
- [ ] Endpoint `/api/cron/process-recurring` implementado.
- [ ] Validação de segurança via `CRON_SECRET`.
- [ ] Lógica de geração de transação e atualização de data de próximo vencimento.
- [ ] Logs de auditoria gerados para cada processamento.

## Tarefas
- [x] Criar arquivo de Story e inicializar MEMORY.md
- [x] Criar/Atualizar `vercel.json`
- [x] Implementar a rota do worker
- [x] Ativar testes de integração básicos
- [ ] Testar manualmente a lógica do worker (Simulação local)
