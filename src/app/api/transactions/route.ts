import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { transactionSchema } from "@/lib/validations";
import { randomUUID } from "crypto";
import { FinancialEngine } from "@/lib/services/financial-engine";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let conditions = and(eq(transactions.userId, userId)) as any;

  if (month && year) {
    const startOfMonth = new Date(Number(year), Number(month) - 1, 1).toISOString().split("T")[0];
    const endOfMonth = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];
    
    conditions = and(
      eq(transactions.userId, userId),
      gte(transactions.date, startOfMonth),
      lte(transactions.date, endOfMonth)
    );
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

  try {
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const d = parsed.data;

    // Caso: Transação Recorrente (Gerar visão futura)
    if (d.subtype === 'recurring') {
      const n = d.totalOccurrences ?? 12; // Padrão 12 meses conforme solicitado
      const groupId = randomUUID();
      const startDate = d.date; // YYYY-MM-DD
      const results = [];

      for (let i = 0; i < n; i++) {
        const baseDate = new Date(startDate + 'T12:00:00');
        baseDate.setMonth(baseDate.getMonth() + i);
        const dateStr = baseDate.toISOString().split('T')[0];

        const newRow = await FinancialEngine.addTransaction({
          userId,
          accountId: d.accountId,
          categoryId: d.categoryId ?? null,
          amount: String(d.amount),
          type: d.type,
          date: dateStr,
          description: d.description,
          notes: d.notes ?? null,
          isPaid: i === 0 ? d.isPaid : false, // Apenas a primeira é marcada como paga (se solicitado)
          subtype: 'recurring',
          recurringGroupId: groupId,
          totalOccurrences: n,
          currentOccurrence: i + 1,
          dueDate: d.dueDate ?? null,
          receiveDate: d.receiveDate ?? null,
          tags: d.tags,
          location: d.location ?? null,
        });
        results.push(newRow);
      }
      return NextResponse.json(results, { status: 201 });
    }

    // Caso: Transação Única
    const row = await FinancialEngine.addTransaction({
      userId,
      accountId: d.accountId,
      categoryId: d.categoryId ?? null,
      amount: String(d.amount),
      type: d.type,
      date: d.date,
      description: d.description,
      notes: d.notes ?? null,
      isPaid: d.isPaid,
      subtype: d.subtype ?? 'single',
      dueDate: d.dueDate ?? null,
      receiveDate: d.receiveDate ?? null,
      tags: d.tags,
      location: d.location ?? null,
    });

    return NextResponse.json(row, { status: 201 });

  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar transação" }, { status: 500 });
  }
}
