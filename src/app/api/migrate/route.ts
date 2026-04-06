import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedAuth = process.env.MIGRATION_SECRET || "migration-secret-2026";
  
  if (authHeader !== `Bearer ${expectedAuth}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Iniciando migração automática de metas...");

    // 1. Make targetAmount nullable
    console.log("📝 Tornando target_amount nullable...");
    await db.execute(sql`
      ALTER TABLE goals 
      ALTER COLUMN target_amount DROP NOT NULL
    `);

    // 2. Add goalType column
    console.log("📝 Adicionando coluna goal_type...");
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS goal_type varchar(20) DEFAULT 'target'
    `);

    // 3. Add startDate column
    console.log("📝 Adicionando coluna start_date...");
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS start_date date
    `);

    // 4. Add endDate column
    console.log("📝 Adicionando coluna end_date...");
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS end_date date
    `);

    // 5. Update existing goals with default values
    console.log("📝 Atualizando metas existentes...");
    await db.execute(sql`
      UPDATE goals 
      SET 
        goal_type = CASE 
          WHEN monthly_contribution IS NOT NULL AND target_amount IS NULL THEN 'monthly'
          ELSE 'target'
        END,
        start_date = COALESCE(start_date, created_at::date)
      WHERE goal_type IS NULL OR start_date IS NULL
    `);

    // 6. Make startDate NOT NULL
    console.log("📝 Tornando start_date obrigatório...");
    await db.execute(sql`
      ALTER TABLE goals 
      ALTER COLUMN start_date SET NOT NULL
    `);

    // 7. Create goal_contributions table
    console.log("📝 Criando tabela goal_contributions...");
    await db.execute(sql`
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
      )
    `);

    // 8. Create indexes
    console.log("📝 Criando índices...");
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS goal_contributions_goal_id_idx ON goal_contributions(goal_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS goal_contributions_user_id_idx ON goal_contributions(user_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS goal_contributions_month_year_idx ON goal_contributions(month, year)
    `);

    console.log("✅ Migração concluída com sucesso!");

    return NextResponse.json({
      success: true,
      message: "Migração executada com sucesso",
      migrations: [
        "target_amount agora é nullable",
        "goal_type adicionado",
        "start_date adicionado e tornado obrigatório",
        "end_date adicionado",
        "Tabela goal_contributions criada",
        "Índices criados"
      ]
    });

  } catch (error: any) {
    console.error("❌ Erro na migração:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}