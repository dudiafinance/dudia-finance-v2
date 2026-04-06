import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { goalContributions, goals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { goalContributionSchema } from "@/lib/validations";


export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let query = db
    .select()
    .from(goalContributions)
    .where(eq(goalContributions.userId, userId));

  if (goalId && month && year) {
    query = db
      .select()
      .from(goalContributions)
      .where(
        and(
          eq(goalContributions.userId, userId),
          eq(goalContributions.goalId, goalId),
          eq(goalContributions.month, parseInt(month)),
          eq(goalContributions.year, parseInt(year))
        )
      );
  } else if (goalId) {
    query = db
      .select()
      .from(goalContributions)
      .where(and(eq(goalContributions.userId, userId), eq(goalContributions.goalId, goalId)));
  } else if (month && year) {
    query = db
      .select()
      .from(goalContributions)
      .where(
        and(
          eq(goalContributions.userId, userId),
          eq(goalContributions.month, parseInt(month)),
          eq(goalContributions.year, parseInt(year))
        )
      );
  }

  const rows = await query;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = goalContributionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;

  // Verify the goal belongs to the authenticated user
  const [goal] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, d.goalId), eq(goals.userId, userId)))
    .limit(1);
  if (!goal) return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });

  const [row] = await db
    .insert(goalContributions)
    .values({
      goalId: d.goalId,
      userId,
      month: d.month,
      year: d.year,
      amount: String(d.amount),
      originalAmount: String(d.amount),
      status: d.status,
      notes: d.notes ?? null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}