import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { creditCards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { creditCardBaseSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const parsed = creditCardBaseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const d = parsed.data;
    const updateData: any = { updatedAt: new Date() };
    if (d.name !== undefined) updateData.name = d.name;
    if (d.bank !== undefined) updateData.bank = d.bank;
    if (d.lastDigits !== undefined) updateData.lastDigits = d.lastDigits;
    if (d.limit !== undefined) updateData.limit = String(d.limit); // Garantir formato string para decimal
    if (d.dueDay !== undefined) updateData.dueDay = d.dueDay;
    if (d.closingDay !== undefined) updateData.closingDay = d.closingDay;
    if (d.color !== undefined) updateData.color = d.color;
    if (d.gradient !== undefined) updateData.gradient = d.gradient;
    if (d.network !== undefined) updateData.network = d.network;

    console.log(`[API] Tentando atualizar cartão ${id} para usuário ${userId}`);

    const [row] = await db
      .update(creditCards)
      .set(updateData)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("DEBUG - Error updating credit card:", error);
    return NextResponse.json({ 
      error: "Erro ao atualizar cartão", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const [row] = await db
      .delete(creditCards)
      .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting credit card:", error);
    return NextResponse.json({ error: "Erro ao excluir cartão" }, { status: 500 });
  }
}
