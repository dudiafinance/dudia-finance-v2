import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cardTransactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: cardId } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  let conditions = and(
    eq(cardTransactions.cardId, cardId),
    eq(cardTransactions.userId, userId)
  );

  if (month && year) {
    conditions = and(
      conditions,
      eq(cardTransactions.invoiceMonth, Number(month)),
      eq(cardTransactions.invoiceYear, Number(year))
    );
  }

  const rows = await db
    .select()
    .from(cardTransactions)
    .where(conditions)
    .orderBy(cardTransactions.date);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: cardId } = await params;
  const body = await req.json();

  const {
    description,
    amount,
    date,
    categoryId,
    tags,
    notes,
    launchType,
    invoiceMonth,
    invoiceYear,
    totalInstallments,
    startInstallment = 1,
    isPending = false,
  } = body;

  if (!description || !amount || !date || !launchType || !invoiceMonth || !invoiceYear) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const records: typeof cardTransactions.$inferInsert[] = [];

  if (launchType === "single") {
    records.push({
      cardId,
      userId,
      categoryId: categoryId ?? null,
      description,
      amount: String(amount),
      totalAmount: String(amount),
      date,
      invoiceMonth: Number(invoiceMonth),
      invoiceYear: Number(invoiceYear),
      launchType: "single",
      totalInstallments: null,
      currentInstallment: null,
      groupId: null,
      tags: tags ?? null,
      isPending,
      isFixed: false,
      notes: notes ?? null,
    });
  } else if (launchType === "installment") {
    const n = Number(totalInstallments) || 1;
    const start = Number(startInstallment) || 1;
    const perInstallment = Number(amount) / n;
    const groupId = crypto.randomUUID();

    let m = Number(invoiceMonth);
    let y = Number(invoiceYear);

    // advance to the correct starting month based on startInstallment
    for (let i = 1; i < start; i++) {
      m++;
      if (m > 12) { m = 1; y++; }
    }

    for (let i = start; i <= n; i++) {
      records.push({
        cardId,
        userId,
        categoryId: categoryId ?? null,
        description: `${description} (${i}/${n})`,
        amount: String(perInstallment.toFixed(2)),
        totalAmount: String(amount),
        date,
        invoiceMonth: m,
        invoiceYear: y,
        launchType: "installment",
        totalInstallments: n,
        currentInstallment: i,
        groupId,
        tags: tags ?? null,
        isPending,
        isFixed: false,
        notes: notes ?? null,
      });

      m++;
      if (m > 12) { m = 1; y++; }
    }
  } else if (launchType === "fixed") {
    records.push({
      cardId,
      userId,
      categoryId: categoryId ?? null,
      description,
      amount: String(amount),
      totalAmount: String(amount),
      date,
      invoiceMonth: Number(invoiceMonth),
      invoiceYear: Number(invoiceYear),
      launchType: "fixed",
      totalInstallments: null,
      currentInstallment: null,
      groupId: null,
      tags: tags ?? null,
      isPending,
      isFixed: true,
      notes: notes ?? null,
    });
  } else {
    return NextResponse.json({ error: "launchType inválido" }, { status: 400 });
  }

  const inserted = await db.insert(cardTransactions).values(records).returning();
  return NextResponse.json(inserted, { status: 201 });
}
