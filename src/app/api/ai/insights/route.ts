import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, accounts, goals, cardTransactions, budgets } from "@/lib/db/schema";
import { eq, and, gte, lte, sum, sql, isNull } from "drizzle-orm";
import { generatePills } from "@/lib/ai/router";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0];
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

    // Aggregating context data
    const [balanceData, statsData, cardData, goalsData, budgetData] = await Promise.all([
      db.select({ balance: sum(accounts.balance) }).from(accounts).where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt))),
      db.select({
        income: sql<string>`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END)`,
        expense: sql<string>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END)`
      }).from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, startOfMonth), lte(transactions.date, endOfMonth), isNull(transactions.deletedAt))),
      db.select({ total: sum(cardTransactions.amount) }).from(cardTransactions).where(and(eq(cardTransactions.userId, userId), eq(cardTransactions.invoiceMonth, currentMonth), eq(cardTransactions.invoiceYear, currentYear), isNull(cardTransactions.deletedAt))),
      db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, 'active'), isNull(goals.deletedAt))),
      db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.isActive, true)))
    ]);

    const context = {
      totalBalance: Number(balanceData[0]?.balance || 0),
      monthlyIncome: Number(statsData[0]?.income || 0),
      monthlyExpense: Number(statsData[0]?.expense || 0),
      cardInvoice: Number(cardData[0]?.total || 0),
      activeGoals: goalsData.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
      activeBudgets: budgetData.map(b => ({ name: b.name, limit: b.amount }))
    };

    const pills = await generatePills(JSON.stringify(context));
    return NextResponse.json(pills);
  } catch (error) {
    console.error("AI Insights error:", error);
    return NextResponse.json({ error: "Falha ao gerar insights" }, { status: 500 });
  }
}