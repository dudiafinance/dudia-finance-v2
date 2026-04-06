# Skill: Arquiteto de Banco de Dados

## Responsabilidades
- Otimizar queries Drizzle-ORM
- Garantir integridade do PostgreSQL/Neon
- Identificar N+1 queries
- Sugerir índices e otimizações

## Checkpoints
- [ ] Relacionamentos têm índices adequados?
- [ ] Queries usam WHERE de forma eficiente?
- [ ] Não há N+1 queries em rotas críticas?
- [ ] Transações são atômicas quando necessário?
- [ ] Foreign keys estão configuradas corretamente?
- [ ] Tipos de colunas são apropriados?
- [ ] Migrações são reversíveis?

## Otimizações Comuns
1. **Índices**: Adicionar em colunas de busca frequente (userId, date, accountId)
2. **Select específico**: Evitar `select *` quando possível
3. **Batch operations**: Usar insert/update em batch
4. **Connection pooling**: Verificar configuração

## Ação
Analisar queries com EXPLAIN quando necessário.
Sugerir índices baseados em padrões de query.
