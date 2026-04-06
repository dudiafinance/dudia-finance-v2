import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { goalSchema } from "@/lib/validations";

let migrationApplied = false;

async function ensureMigration() {
  if (migrationApplied) return;
  
  try {
    console.log("🔄 Verificando migração de metas...");
    
    await db.execute(sql`
      ALTER TABLE goals 
      ALTER COLUMN target_amount DROP NOT NULL
    `);
    console.log("✅ target_amount agora é nullable");
  } catch (e: any) {
    if (!e.message.includes('already')) console.log("⚠️ target_amount já é nullable");
  }

  try {
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS goal_type varchar(20) DEFAULT 'target'
    `);
    console.log("✅ goal_type adicionado");
  } catch (e: any) {
    if (!e.message.includes('already')) console.log("⚠️ goal_type já existe");
  }

  try {
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS start_date date
    `);
    console.log("✅ start_date adicionado");
  } catch (e: any) {
    if (!e.message.includes('already')) console.log("⚠️ start_date já existe");
  }

  try {
    await db.execute(sql`
      ALTER TABLE goals 
      ADD COLUMN IF NOT EXISTS end_date date
    `);
    console.log("✅ end_date adicionado");
  } catch (e: any) {
    if (!e.message.includes('already')) console.log("⚠️ end_date já existe");
  }

  try {
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
    console.log("✅ Metas existentes atualizadas");
  } catch (e: any) {
    console.log("⚠️ Erro ao atualizar metas:", e.message);
  }

  try {
    await db.execute(sql`
      ALTER TABLE goals 
      ALTER COLUMN start_date SET NOT NULL
    `);
    console.log("✅ start_date agora é obrigatório");
  } catch (e: any) {
    if (!e.message.includes('already')) console.log("⚠️ start_date já é obrigatório");
  }

  migrationApplied = true;
  console.log("✅ Migração aplicada com sucesso!");
}

await ensureMigration();

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.issues);
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const d = parsed.data;
    
    const goalType = d.goalType || (d.targetAmount ? 'target' : 'monthly');
    
    const [row] = await db
      .insert(goals)
      .values({
        userId,
        name: d.name,
        targetAmount: d.targetAmount ? String(d.targetAmount) : null,
        currentAmount: String(d.currentAmount),
        startDate: d.startDate,
        endDate: d.endDate ?? null,
        goalType: goalType,
        monthlyContribution: d.monthlyContribution ? String(d.monthlyContribution) : null,
        priority: d.priority,
        status: d.status,
        notes: d.notes ?? null,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json({ 
      error: "Erro ao criar meta",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}
