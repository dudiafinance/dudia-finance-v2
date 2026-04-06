import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cardTransactions, creditCards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { recalculateUsedAmount, generateFixedFutureTransactions } from "@/lib/credit-card-utils";
import { cardTransactionSchema } from "@/lib/validations";

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

  // Verify card belongs to the authenticated user
  const [card] = await db
    .select({ id: creditCards.id })
    .from(creditCards)
    .where(and(eq(creditCards.id, cardId), eq(creditCards.userId, userId)))
    .limit(1);
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const parsed = cardTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

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
    startInstallment,
    isPending,
  } = parsed.data;

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
      invoiceMonth,
      invoiceYear,
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
    const n = totalInstallments ?? 1;
    const start = startInstallment;
    const base = Math.floor((amount / n) * 100) / 100;
    const remainder = Math.round((amount - base * n) * 100) / 100;
    const groupId = crypto.randomUUID();

    let m = invoiceMonth;
    let y = invoiceYear;

    for (let i = start; i <= n; i++) {
      const installmentAmount = i === n ? base + remainder : base;
      records.push({
        cardId,
        userId,
        categoryId: categoryId ?? null,
        description: `${description} (${i}/${n})`,
        amount: String(installmentAmount.toFixed(2)),
        totalAmount: String(amount),
        date,
        invoiceMonth: m,
        invoiceYear: y,
        launchType: "installment" as const,
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
    const groupId = crypto.randomUUID();
    records.push({
      cardId,
      userId,
      categoryId: categoryId ?? null,
      description,
      amount: String(amount),
      totalAmount: String(amount),
      date,
      invoiceMonth,
      invoiceYear,
      launchType: "fixed",
      totalInstallments: null,
      currentInstallment: null,
      groupId,
      tags: tags ?? null,
      isPending,
      isFixed: true,
      notes: notes ?? null,
    });
  } else {
    return NextResponse.json({ error: "launchType inválido" }, { status: 400 });
  }

  try {
    const inserted = await db.insert(cardTransactions).values(records).returning();

    // For fixed transactions, generate copies for 11 more months (total = 12 months)
    if (launchType === "fixed" && inserted.length > 0) {
      await generateFixedFutureTransactions(inserted[0], 11);
    }

    await recalculateUsedAmount(cardId);

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error("Error saving card transactions:", error);
    return NextResponse.json({ error: "Erro ao salvar transações" }, { status: 500 });
  }
}
