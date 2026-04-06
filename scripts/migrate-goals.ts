import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

async function migrateGoals() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('🔄 Iniciando migração de metas...');

  try {
    // 1. Make targetAmount nullable
    console.log('📝 Tornando targetAmount nullable...');
    await db.execute(sql`
      ALTER TABLE goals 
      ALTER COLUMN target_amount DROP NOT NULL
    `);

    // 2. Add goalType column
    console.log('📝 Adicionando coluna goal_type...');
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS goal_type varchar(20) DEFAULT 'target'
    `);

    // 3. Add startDate column
    console.log('📝 Adicionando coluna start_date...');
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS start_date date
    `);

    // 4. Add endDate column
    console.log('📝 Adicionando coluna end_date...');
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS end_date date
    `);

    // 5. Update existing goals
    console.log('📝 Atualizando metas existentes...');
    await db.execute(sql`
      UPDATE goals 
      SET goal_type = CASE 
        WHEN monthly_contribution IS NOT NULL AND target_amount IS NULL THEN 'monthly'
        ELSE 'target'
      END,
      start_date = COALESCE(start_date, created_at::date)
      WHERE start_date IS NULL
    `);

    // 6. Make startDate NOT NULL
    console.log('📝 Tornando start_date obrigatório...');
    await db.execute(sql`
      ALTER TABLE goals 
      ALTER COLUMN start_date SET NOT NULL
    `);

    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateGoals().catch(console.error);