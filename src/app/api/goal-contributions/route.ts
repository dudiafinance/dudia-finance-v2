import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { goalContributions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { goalContributionSchema } from "@/lib/validations";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

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