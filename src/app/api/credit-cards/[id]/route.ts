import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { creditCards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { creditCardSchema } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const parsed = creditCardSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (d.name !== undefined) updateData.name = d.name;
  if (d.bank !== undefined) updateData.bank = d.bank;
  if (d.lastDigits !== undefined) updateData.lastDigits = d.lastDigits;
  if (d.limit !== undefined) updateData.limit = String(d.limit);
  if (d.dueDay !== undefined) updateData.dueDay = d.dueDay;
  if (d.closingDay !== undefined) updateData.closingDay = d.closingDay;
  if (d.color !== undefined) updateData.color = d.color;
  if (d.gradient !== undefined) updateData.gradient = d.gradient;
  if (d.network !== undefined) updateData.network = d.network;

  const [row] = await db
    .update(creditCards)
    .set(updateData)
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [row] = await db
    .delete(creditCards)
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
