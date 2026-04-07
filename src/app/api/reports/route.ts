import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, categories as categoriesTable } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "month"; // week, month, year

  const now = new Date();
  let startDate = new Date();
  let endDate = new Date();

  // Define date range
  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  try {
    // 1. Fetch Categories
    const categories = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.userId, userId));

    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

    // 2. Fetch Bank Transactions
    const bankTxs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate.toISOString().slice(0, 10)),
          lte(transactions.date, endDate.toISOString().slice(0, 10))
        )
      );

    // 3. Fetch Card Transactions
    // Special note: Card transactions use invoiceMonth/Year for 'actual' billing,
    // but for reports we usually want 'date' of expense.
    const cardTxs = await db
      .select({
        id: cardTransactions.id,
        amount: cardTransactions.amount,
        date: cardTransactions.date,
        categoryId: cardTransactions.categoryId,
        description: cardTransactions.description,
      })
      .from(cardTransactions)
      .where(
        and(
          eq(cardTransactions.userId, userId),
          gte(cardTransactions.date, startDate.toISOString().slice(0, 10)),
          lte(cardTransactions.date, endDate.toISOString().slice(0, 10))
        )
      );

    // 4. Consolidation Logic
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, { value: number; color: string }> = {};

    // Process Bank
    bankTxs.forEach(t => {
      const amt = Number(t.amount);
      const cat = catMap[t.categoryId as any];
      const catName = cat?.name ?? "Outros";
      const catColor = cat?.color ?? "#64748B";

      if (t.type === "income") {
        totalIncome += amt;
        incomeByCat[catName] = (incomeByCat[catName] ?? 0) + amt;
      } else {
        totalExpense += amt;
        if (!expenseByCat[catName]) expenseByCat[catName] = { value: 0, color: catColor };
        expenseByCat[catName].value += amt;
      }
    });

    // Process Card (all are expenses)
    cardTxs.forEach(t => {
      const amt = Number(t.amount);
      const cat = catMap[t.categoryId as any];
      const catName = cat?.name ?? "Cartão (Sem Categoria)";
      const catColor = cat?.color ?? "#94a3b8";

      totalExpense += amt;
      if (!expenseByCat[catName]) expenseByCat[catName] = { value: 0, color: catColor };
      expenseByCat[catName].value += amt;
    });

    // 5. Monthly Evolution (Last 6 months)
    const history = [];
    const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // We need to fetch data for the last 6 months specifically for the history chart
    const historyStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const [histBank, histCard] = await Promise.all([
      db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, historyStart.toISOString().slice(0, 10)))),
      db.select().from(cardTransactions).where(and(eq(cardTransactions.userId, userId), gte(cardTransactions.date, historyStart.toISOString().slice(0, 10)))),
    ]);

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
    
      const bankMonth = histBank.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      const cardMonth = histCard.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });

      const income = bankMonth.filter(t => t.type === "income").reduce((s,t) => s + Number(t.amount), 0);
      const expense = bankMonth.filter(t => t.type === "expense").reduce((s,t) => s + Number(t.amount), 0) +
                    cardMonth.reduce((s,t) => s + Number(t.amount), 0);

      history.push({ 
        month: MONTHS_PT[m], 
        income, 
        expense,
        net: income - expense 
      });
    }

    return NextResponse.json({
      summary: {
        income: totalIncome,
        expense: totalExpense,
        net: totalIncome - totalExpense,
      },
      categories: {
        income: Object.entries(incomeByCat).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
        expense: Object.entries(expenseByCat).map(([name, { value, color }]) => ({ name, value, color })).sort((a,b) => b.value - a.value),
      },
      history,
      period,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
