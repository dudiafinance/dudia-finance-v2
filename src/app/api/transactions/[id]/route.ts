import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { transactionSchema } from "@/lib/validations";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = transactionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  const updateData: any = { updatedAt: new Date() };
  if (d.accountId !== undefined) updateData.accountId = d.accountId;
  if (d.categoryId !== undefined) updateData.categoryId = d.categoryId;
  if (d.amount !== undefined) updateData.amount = String(d.amount);
  if (d.type !== undefined) updateData.type = d.type;
  if (d.date !== undefined) updateData.date = d.date;
  if (d.description !== undefined) updateData.description = d.description;
  if (d.notes !== undefined) updateData.notes = d.notes;
  if (d.isPaid !== undefined) updateData.isPaid = d.isPaid;
  if (d.subtype !== undefined) updateData.subtype = d.subtype;
  if (d.dueDate !== undefined) updateData.dueDate = d.dueDate;
  if (d.receiveDate !== undefined) updateData.receiveDate = d.receiveDate;
  if (d.tags !== undefined) updateData.tags = d.tags;
  if (d.location !== undefined) updateData.location = d.location;

  const [row] = await db
    .update(transactions)
    .set(updateData)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

  return NextResponse.json({ success: true });
}
