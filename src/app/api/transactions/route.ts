import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { transactionSchema } from "@/lib/validations";
import { randomUUID } from "crypto";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;

  if (d.subtype === 'recurring') {
    const n = d.totalOccurrences ?? 2;
    const groupId = randomUUID();
    const startDate = d.date; // YYYY-MM-DD
    const rows = [];
    for (let i = 0; i < n; i++) {
      const baseDate = new Date(startDate + 'T12:00:00');
      baseDate.setMonth(baseDate.getMonth() + i);
      const dateStr = baseDate.toISOString().split('T')[0];
      rows.push({
        userId,
        accountId: d.accountId,
        categoryId: d.categoryId ?? null,
        amount: String(d.amount),
        type: d.type,
        date: dateStr,
        description: d.description,
        notes: d.notes ?? null,
        isPaid: d.isPaid,
        subtype: 'recurring' as const,
        recurringGroupId: groupId,
        totalOccurrences: n,
        currentOccurrence: i + 1,
        dueDate: d.dueDate ?? null,
        receiveDate: d.receiveDate ?? null,
        tags: d.tags,
        location: d.location ?? null,
      });
    }
    const inserted = await db.insert(transactions).values(rows).returning();
    return NextResponse.json(inserted, { status: 201 });
  }

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      accountId: d.accountId,
      categoryId: d.categoryId ?? null,
      amount: String(d.amount),
      type: d.type,
      date: d.date,
      description: d.description,
      notes: d.notes ?? null,
      isPaid: d.isPaid,
      subtype: d.subtype,
      dueDate: d.dueDate ?? null,
      receiveDate: d.receiveDate ?? null,
      tags: d.tags,
      location: d.location ?? null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
