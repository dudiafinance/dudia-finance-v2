import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { transactionSchema } from "@/lib/validations";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let conditions = eq(transactions.userId, userId);

  if (month && year) {
    const startOfMonth = new Date(Number(year), Number(month) - 1, 1).toISOString().split("T")[0];
    const endOfMonth = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];
    
    conditions = and(
      conditions,
      gte(transactions.date, startOfMonth),
      lte(transactions.date, endOfMonth)
    ) as typeof conditions;
  }

  try {
    const rows = await db
      .select()
      .from(transactions)
      .where(conditions)
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
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

  // Handle fixed logic for standard transactions if needed, though they weren't explicitly requested. 
  // Normally fixed transactions are generated similarly to recurring but potentially indefinitely.
  // For now, fixed = single, just a subtype flag.

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
