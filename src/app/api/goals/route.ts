import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { goalSchema } from "@/lib/validations";



export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(asc(goals.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json({ error: "Erro ao buscar metas" }, { status: 500 });
  }
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
        endDate: d.endDate && d.endDate.trim() !== "" ? d.endDate : null,
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
    return NextResponse.json({ error: "Erro ao criar meta" }, { status: 500 });
  }
}
