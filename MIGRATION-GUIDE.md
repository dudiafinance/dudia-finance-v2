# 🚀 Guia de Migração para Metas (Goals)

## ⚠️ Problema

O erro 500 ao criar metas ocorre porque **as migrações do banco de dados não foram aplicadas em produção**. O Vercel não executa automaticamente as migrações do Drizzle.

## ✅ Solução

Execute a migração manualmente no banco de dados PostgreSQL.

---

## 📋 Opção 1: Executar Script SQL (Recomendado)

### Passo a Passo:

1. **Acesse seu banco de dados PostgreSQL**:
   - **Neon**: https://neon.tech/app → Seu projeto → SQL Editor
   - **Railway**: https://railway.app → Seu projeto → PostgreSQL → Query
   - **Supabase**: https://supabase.com → Seu projeto → SQL Editor
   - **Outros**: Use sua ferramenta preferida (pgAdmin, DBeaver, etc.)

2. **Execute o script SQL**:
   - Abra o arquivo `scripts/manual-migration-goals.sql`
   - Copie todo o conteúdo
   - Cole no editor SQL do seu banco
   - Execute

3. **Verifique se funcionou**:
   - O script irá mostrar as colunas criadas
   - Deve aparecer: `goal_type`, `start_date`, `end_date`, `target_amount`

---

## 🖥️ Opção 2: Executar Script TypeScript

Se você tem acesso ao ambiente de produção:

```bash
# No servidor de produção ou localmente com DATABASE_URL de produção
npm run db:migrate-goals
```

---

## 📝 O Script SQL Faz:

1. **Torna `target_amount` opcional** (para metas mensais)
2. **Adiciona `goal_type`** ('target' ou 'monthly')
3. **Adiciona `start_date`** (obrigatório)
4. **Adiciona `end_date`** (opcional)
5. **Cria tabela `goal_contributions`** (para contribuições mensais)
6. **Atualiza metas existentes** com valores padrão

---

## 🧪 Testar Após Migração

Após executar a migração, teste criando uma meta:

### Meta com Valor Total:
```json
{
  "name": "Viagem Europa",
  "goalType": "target",
  "targetAmount": 10000,
  "currentAmount": 0,
  "startDate": "2026-05-01",
  "endDate": "2026-12-31"
}
```

### Meta Mensal:
```json
{
  "name": "Guardar todo mês",
  "goalType": "monthly",
  "monthlyContribution": 800,
  "currentAmount": 0,
  "startDate": "2026-05-01"
}
```

---

## 🆘 Precisa de Ajuda?

Se encontrar erros:

1. **Verifique os logs do Vercel**: Vercel Dashboard → Seu projeto → Logs
2. **Verifique a estrutura do banco**: Execute `SELECT * FROM goals LIMIT 1;`
3. **Contate o suporte**: Compartilhe o erro completo

---

## 📅 Após a Migração

- ✅ O sistema deve funcionar normalmente
- ✅ Todas as metas existentes continuarão funcionando
- ✅ Novas metas poderão ser criadas com ou sem valor total

---

## 🔐 Segurança

O script SQL é **seguro** para executar em produção:
- Usa `IF NOT EXISTS` para não criar colunas duplicadas
- Usa `DEFAULT` para valores padrão
- Mantém dados existentes intactos
- Não deleta nenhum dado