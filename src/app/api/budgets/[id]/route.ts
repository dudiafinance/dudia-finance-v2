import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { budgets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { budgetSchema } from "@/lib/validations";


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = budgetSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (d.name) updateData.name = d.name;
  if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
  if (d.amount !== undefined) updateData.amount = String(d.amount);
  if (d.period) updateData.period = d.period;
  if (d.startDate) updateData.startDate = d.startDate;
  if (d.endDate !== undefined) updateData.endDate = d.endDate;
  if (d.alertsEnabled !== undefined) updateData.alertsEnabled = d.alertsEnabled;
  if (d.alertThreshold !== undefined) updateData.alertThreshold = String(d.alertThreshold);

  const [row] = await db
    .update(budgets)
    .set(updateData)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));

  return NextResponse.json({ success: true });
}
