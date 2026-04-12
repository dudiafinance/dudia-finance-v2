import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, accounts, goals, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sum, sql, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const selectedMonth = Number(searchParams.get("month")) || now.getMonth() + 1;
  const selectedYear = Number(searchParams.get("year")) || now.getFullYear();

  try {
    // Selected date ranges
    const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split("T")[0];
    const endOfMonth = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

    // Previous month ranges for variation
    const prevDate = new Date(selectedYear, selectedMonth - 2, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1).toISOString().split("T")[0];
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0).toISOString().split("T")[0];

    const queries = await Promise.all([
      // 0. Total Balance (All accounts, current)
      db.select({ balance: sum(accounts.balance) })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userId), 
            eq(accounts.includeInTotal, true),
            isNull(accounts.deletedAt)
          )
        ),

      // 1. Current Month Totals
      db.select({
        income: sql<string>`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END)`,
        expense: sql<string>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END)`
      })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId), 
            gte(transactions.date, startOfMonth), 
            lte(transactions.date, endOfMonth),
            isNull(transactions.deletedAt)
          )
        ),

      // 2. Current Month Card
      db.select({ total: sum(cardTransactions.amount) })
        .from(cardTransactions)
        .where(
          and(
            eq(cardTransactions.userId, userId), 
            eq(cardTransactions.invoiceMonth, selectedMonth), 
            eq(cardTransactions.invoiceYear, selectedYear),
            isNull(cardTransactions.deletedAt)
          )
        ),

      // 3. Previous Month Totals (For Variation)
      db.select({
        income: sql<string>`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END)`,
        expense: sql<string>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END)`
      })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId), 
            gte(transactions.date, startOfPrevMonth), 
            lte(transactions.date, endOfPrevMonth),
            isNull(transactions.deletedAt)
          )
        ),

      // 4. Previous Month Card
      db.select({ total: sum(cardTransactions.amount) })
        .from(cardTransactions)
        .where(
          and(
            eq(cardTransactions.userId, userId), 
            eq(cardTransactions.invoiceMonth, prevMonth), 
            eq(cardTransactions.invoiceYear, prevYear),
            isNull(cardTransactions.deletedAt)
          )
        ),

      // 5. Recent Activity (Limited directly in SQL)
      db.select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), isNull(transactions.deletedAt)))
        .orderBy(desc(transactions.date), desc(transactions.createdAt))
        .limit(10),

      // 6. Recent Card Activity
      db.select()
        .from(cardTransactions)
        .where(and(eq(cardTransactions.userId, userId), isNull(cardTransactions.deletedAt)))
        .orderBy(desc(cardTransactions.date), desc(cardTransactions.createdAt))
        .limit(10),

      // 7. Top Expenses by Category (Transactions)
      db.select({
        categoryId: transactions.categoryId,
        total: sum(transactions.amount),
      })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId), 
            eq(transactions.type, 'expense'), 
            gte(transactions.date, startOfMonth), 
            lte(transactions.date, endOfMonth),
            isNull(transactions.deletedAt)
          )
        )
        .groupBy(transactions.categoryId),

      // 8. Top Expenses by Category (Card)
      db.select({
        categoryId: cardTransactions.categoryId,
        total: sum(cardTransactions.amount),
      })
        .from(cardTransactions)
        .where(
          and(
            eq(cardTransactions.userId, userId), 
            eq(cardTransactions.invoiceMonth, selectedMonth), 
            eq(cardTransactions.invoiceYear, selectedYear),
            isNull(cardTransactions.deletedAt)
          )
        )
        .groupBy(cardTransactions.categoryId),

      // 9. Categories Info
      db.select().from(categories).where(eq(categories.userId, userId)),

      // 10. Goals
      db.select().from(goals).where(
        and(
          eq(goals.userId, userId), 
          eq(goals.status, 'active'),
          isNull(goals.deletedAt)
        )
      ),
    ]);

    const totalBalance = Number(queries[0][0]?.balance || 0);
    const currentIncome = Number(queries[1][0]?.income || 0);
    const currentExpense = Number(queries[1][0]?.expense || 0);
    const currentCard = Number(queries[2][0]?.total || 0);

    const prevIncome = Number(queries[3][0]?.income || 0);
    const prevExpense = Number(queries[3][0]?.expense || 0);
    const prevCard = Number(queries[4][0]?.total || 0);

    const currentNet = currentIncome - (currentExpense + currentCard);
    const prevNet = prevIncome - (prevExpense + prevCard);
    // Returns null when there's no prior month data (new users), not 0
    const monthlyVariation = prevNet !== 0
      ? ((currentNet - prevNet) / Math.abs(prevNet)) * 100
      : null;

    const recentActivity = [
      ...queries[5].map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type as "income" | "expense" | "transfer",
        date: t.date,
        source: "transaction" as const,
        categoryId: t.categoryId,
        createdAt: t.createdAt
      })),
      ...queries[6].map(t => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: "expense" as const,
        date: t.date,
        source: "card" as const,
        categoryId: t.categoryId,
        createdAt: t.createdAt
      }))
    ].sort((a, b) => {
      const d = new Date(b.date).getTime() - new Date(a.date).getTime();
      return d !== 0 ? d : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 7);

    const catTotals: Record<string, number> = {};
    queries[7].forEach(e => {
      if (e.categoryId) catTotals[e.categoryId] = (catTotals[e.categoryId] || 0) + Number(e.total || 0);
    });
    queries[8].forEach(e => {
      if (e.categoryId) catTotals[e.categoryId] = (catTotals[e.categoryId] || 0) + Number(e.total || 0);
    });

    const catMap = new Map(queries[9].map(c => [c.id, c]));
    const topExpenses = Object.entries(catTotals).map(([catId, total]) => {
      const cat = catMap.get(catId);
      return {
        categoryId: catId,
        categoryName: cat?.name ?? "Sem categoria",
        categoryColor: cat?.color ?? "#94a3b8",
        total: total
      };
    }).sort((a, b) => b.total - a.total).slice(0, 5);

    return NextResponse.json({
      selectedMonth,
      selectedYear,
      totalBalance,
      totalIncome: currentIncome,
      totalExpense: currentExpense,
      totalCardInvoice: currentCard,
      monthlyVariation,
      recentActivity,
      goals: queries[10],
      topExpenses
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
