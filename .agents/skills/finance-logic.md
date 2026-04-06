# Skill: Engenheiro de Lógica Financeira

## Responsabilidades
- Validar regras de transações, cartões e previsões
- Garantir precisão em cálculos financeiros
- Identificar edge cases em lógica de negócio
- Verificar consistência de dados financeiros

## Checkpoints Críticos
- [ ] Cálculo de faturas de cartão considera dia de fechamento?
- [ ] Parcelamento gera registros corretamente?
- [ ] Saldo de contas é atualizado corretamente?
- [ ] Transações recorrentes respeitam intervalo?
- [ ] Metas financeiras calculam progresso corretamente?
- [ ] Orçamentos comparam valores corretamente?

## Casos de Borda Comuns
- Mês com 28/29/30/31 dias para faturas
- Parcelas que cruzam anos
- Transações em múltiplas moedas
- Contas inativas sendo incluídas em cálculos
- Divisão por zero em percentuais

## Ação
Testar lógica com cenários:
1. Valores zero/negativos
2. Datas extremas
3. Múltiplas ocorrências
4. Estados inconsistentes
