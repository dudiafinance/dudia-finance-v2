import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { accountSchema } from "@/lib/validations";


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = accountSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.balance !== undefined) updateData.balance = String(data.balance);

  // BUG-013: Prevent updating soft-deleted accounts
  const [row] = await db
    .update(accounts)
    .set(updateData)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
    .returning();

  if (!row) return NextResponse.json({ error: "Conta não encontrada ou já excluída" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [accountExists] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .limit(1);
  
  if (!accountExists) return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });

  const hasTransactions = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.accountId, id))
    .limit(1);

  if (hasTransactions.length > 0) {
    return NextResponse.json({ error: "Não é possível deletar conta com transações existentes" }, { status: 400 });
  }

  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

  return NextResponse.json({ success: true });
}
