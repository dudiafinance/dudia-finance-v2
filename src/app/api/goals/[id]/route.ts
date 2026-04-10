import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { goalBaseSchema } from "@/lib/validations";


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const parsed = goalBaseSchema.partial().safeParse(body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.issues);
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const d = parsed.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (d.name) updateData.name = d.name;
    if (d.targetAmount !== undefined) updateData.targetAmount = d.targetAmount ? String(d.targetAmount) : null;
    if (d.currentAmount !== undefined) updateData.currentAmount = String(d.currentAmount);
    if (d.startDate !== undefined) updateData.startDate = d.startDate;
    if (d.endDate !== undefined) updateData.endDate = d.endDate && d.endDate.trim() !== "" ? d.endDate : null;
    if (d.goalType) updateData.goalType = d.goalType;
    if (d.priority) updateData.priority = d.priority;
    if (d.status) updateData.status = d.status;
    if (d.notes !== undefined) updateData.notes = d.notes;
    if (d.monthlyContribution !== undefined) updateData.monthlyContribution = d.monthlyContribution ? String(d.monthlyContribution) : null;

    const [row] = await db
      .update(goals)
      .set(updateData)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json({ error: "Erro ao atualizar meta" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json({ error: "Erro ao excluir meta" }, { status: 500 });
  }
}
