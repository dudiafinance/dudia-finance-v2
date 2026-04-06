-- ============================================================================
-- MIGRAÇÃO MANUAL PARA METAS (GOALS)
-- Execute este script SQL diretamente no seu banco de dados PostgreSQL
-- ============================================================================

-- 1. Tornar target_amount nullable (para metas sem valor total definido)
ALTER TABLE goals ALTER COLUMN target_amount DROP NOT NULL;

-- 2. Adicionar coluna goal_type (obrigatório para distinguir tipo de meta)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type varchar(20) DEFAULT 'target';

-- 3. Adicionar coluna start_date (obrigatória)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_date date;

-- 4. Adicionar coluna end_date (opcional)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_date date;

-- 5. Atualizar metas existentes
-- Define start_date como created_at caso não exista
UPDATE goals 
SET 
  start_date = COALESCE(start_date, created_at::date),
  goal_type = CASE 
    WHEN monthly_contribution IS NOT NULL AND target_amount IS NULL THEN 'monthly'
    ELSE 'target'
  END
WHERE start_date IS NULL OR goal_type IS NULL;

-- 6. Tornar start_date obrigatório
ALTER TABLE goals ALTER COLUMN start_date SET NOT NULL;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verifique se as colunas foram criadas corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'goals' 
  AND column_name IN ('goal_type', 'start_date', 'end_date', 'target_amount')
ORDER BY column_name;

-- ============================================================================
-- TABELA: goal_contributions
-- ============================================================================

-- Criar tabela para contribuições mensais de metas
CREATE TABLE IF NOT EXISTS goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  amount decimal(15,2) NOT NULL,
  original_amount decimal(15,2) NOT NULL,
  status varchar(20) DEFAULT 'pending',
  notes text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS goal_contributions_goal_id_idx ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS goal_contributions_user_id_idx ON goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS goal_contributions_month_year_idx ON goal_contributions(month, year);

-- ============================================================================
-- PRONTO! Migração concluída.
-- ============================================================================