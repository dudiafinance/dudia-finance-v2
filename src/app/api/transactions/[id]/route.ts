import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { transactionSchema } from "@/lib/validations";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { sanitizeText, sanitizeOptionalText } from "@/lib/sanitize";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = transactionSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const d = parsed.data;
    const updateData: Record<string, unknown> = {};
    if (d.accountId !== undefined) updateData.accountId = d.accountId;
    if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
    if (d.amount !== undefined) updateData.amount = String(d.amount);
    if (d.type !== undefined) updateData.type = d.type;
    if (d.date !== undefined) updateData.date = d.date;
    if (d.description !== undefined) updateData.description = sanitizeText(d.description);
    if (d.notes !== undefined) updateData.notes = sanitizeOptionalText(d.notes);
    if (d.isPaid !== undefined) updateData.isPaid = d.isPaid;
    if (d.subtype !== undefined) updateData.subtype = d.subtype;
    if (d.dueDate !== undefined) updateData.dueDate = d.dueDate;
    if (d.receiveDate !== undefined) updateData.receiveDate = d.receiveDate;
    if (d.tags !== undefined) updateData.tags = d.tags;
    if (d.location !== undefined) updateData.location = sanitizeOptionalText(d.location);

    const row = await FinancialEngine.updateTransaction(id, userId, updateData);

    return NextResponse.json(row);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao atualizar transação" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const deleteMode = searchParams.get("mode") === "all" ? "all" : "single";
    
    await FinancialEngine.deleteTransaction(id, userId, deleteMode);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao deletar transação" }, { status: 500 });
  }
}
