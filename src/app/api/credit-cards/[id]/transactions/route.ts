import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cardTransactions, creditCards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { cardTransactionSchema } from "@/lib/validations";
import { FinancialEngine } from "@/lib/services/financial-engine";

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
  ) as any;

  if (month && year) {
    conditions = and(
      eq(cardTransactions.cardId, cardId),
      eq(cardTransactions.userId, userId),
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

  try {
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

    const results = [];

    if (launchType === "single") {
      const row = await FinancialEngine.addCardTransaction({
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
        isPending,
        tags: tags ?? null,
        notes: notes ?? null,
      });
      results.push(row);
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
        const row = await FinancialEngine.addCardTransaction({
          cardId,
          userId,
          categoryId: categoryId ?? null,
          description: `${description} (${i}/${n})`,
          amount: String(installmentAmount.toFixed(2)),
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
          notes: notes ?? null,
        });
        results.push(row);

        m++;
        if (m > 12) { m = 1; y++; }
      }
    } else if (launchType === "fixed") {
      const groupId = crypto.randomUUID();
      let m = invoiceMonth;
      let y = invoiceYear;

      // Gerar 12 meses conforme pedido pelo usuário
      for (let i = 0; i < 12; i++) {
        const row = await FinancialEngine.addCardTransaction({
          cardId,
          userId,
          categoryId: categoryId ?? null,
          description,
          amount: String(amount),
          totalAmount: String(amount),
          date,
          invoiceMonth: m,
          invoiceYear: y,
          launchType: "fixed",
          groupId,
          tags: tags ?? null,
          isPending,
          isFixed: true,
          notes: notes ?? null,
        });
        results.push(row);

        m++;
        if (m > 12) { m = 1; y++; }
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error: any) {
    console.error("Error saving card transactions:", error);
    return NextResponse.json({ error: error.message || "Erro ao salvar transações" }, { status: 500 });
  }
}
