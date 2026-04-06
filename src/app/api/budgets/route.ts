import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { budgets } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { budgetSchema } from "@/lib/validations";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId))
    .orderBy(asc(budgets.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  const [row] = await db
    .insert(budgets)
    .values({
      userId,
      name: d.name,
      categoryId: d.categoryId ?? null,
      amount: String(d.amount),
      period: d.period,
      startDate: d.startDate,
      endDate: d.endDate ?? null,
      alertsEnabled: d.alertsEnabled,
      alertThreshold: String(d.alertThreshold),
      isActive: true,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
