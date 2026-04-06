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

  console.log("📝 Card transaction POST request:", {
    userId,
    cardId,
    body: JSON.stringify(body, null, 2)
  });

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
    console.error("❌ Missing required fields:", { description, amount, date, launchType, invoiceMonth, invoiceYear });
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const records: typeof cardTransactions.$inferInsert[] = [];

  if (launchType === "single") {
    console.log("✅ Creating single transaction");
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

    console.log("✅ Creating installment transaction:", {
      totalInstallments: n,
      startInstallment: start,
      totalAmount: amount,
      perInstallment: perInstallment,
      groupId
    });

    let m = Number(invoiceMonth);
    let y = Number(invoiceYear);

    for (let i = start; i <= n; i++) {
      const record = {
        cardId,
        userId,
        categoryId: categoryId ?? null,
        description: `${description} (${i}/${n})`,
        amount: String(perInstallment.toFixed(2)),
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
      };
      
      console.log(`  📦 Installment ${i}/${n}:`, {
        invoiceMonth: m,
        invoiceYear: y,
        amount: perInstallment.toFixed(2)
      });
      
      records.push(record);

      m++;
      if (m > 12) { m = 1; y++; }
    }
  } else if (launchType === "fixed") {
    console.log("✅ Creating fixed transaction");
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
    console.error("❌ Invalid launchType:", launchType);
    return NextResponse.json({ error: "launchType inválido" }, { status: 400 });
  }

  console.log(`💾 Inserting ${records.length} transaction(s)...`);
  
  try {
    const inserted = await db.insert(cardTransactions).values(records).returning();
    console.log(`✅ Successfully inserted ${inserted.length} transaction(s):`, {
      first: inserted[0] ? {
        id: inserted[0].id,
        cardId: inserted[0].cardId,
        description: inserted[0].description,
        invoiceMonth: inserted[0].invoiceMonth,
        invoiceYear: inserted[0].invoiceYear,
        amount: inserted[0].amount,
        totalAmount: inserted[0].totalAmount,
        launchType: inserted[0].launchType,
        currentInstallment: inserted[0].currentInstallment,
        totalInstallments: inserted[0].totalInstallments,
      } : null
    });
    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error("❌ Error inserting transactions:", error);
    return NextResponse.json({ 
      error: "Erro ao salvar transações",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
