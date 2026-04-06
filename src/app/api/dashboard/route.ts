import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, accounts, goals, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Accept month/year from query params, default to current month
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const selectedMonth = Number(searchParams.get("month")) || now.getMonth() + 1;
  const selectedYear = Number(searchParams.get("year")) || now.getFullYear();

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split("T")[0];
  const endOfMonth = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

  const [allAccounts, monthTransactions, allGoals, monthCardTx, allCategories] = await Promise.all([
    db.select().from(accounts).where(eq(accounts.userId, userId)),
    db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startOfMonth),
          lte(transactions.date, endOfMonth)
        )
      ),
    db.select().from(goals).where(eq(goals.userId, userId)),
    db
      .select()
      .from(cardTransactions)
      .where(
        and(
          eq(cardTransactions.userId, userId),
          eq(cardTransactions.invoiceMonth, selectedMonth),
          eq(cardTransactions.invoiceYear, selectedYear)
        )
      ),
    db.select().from(categories).where(eq(categories.userId, userId)),
  ]);

  // Balance: sum of all active bank accounts (always current, not filtered by month)
  const totalBalance = allAccounts
    .filter((a) => a.includeInTotal && a.type !== "credit_card")
    .reduce((s, a) => s + Number(a.balance), 0);

  // Income / Expense from regular transactions
  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  // Card invoice total for the month
  const totalCardInvoice = monthCardTx.reduce((s, t) => s + Number(t.amount), 0);

  // Recent activity: last 5 combining transactions + card transactions for the selected month
  const recentTx = monthTransactions
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const recentCard = monthCardTx
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  const recentActivity = [
    ...recentTx.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type as "income" | "expense",
      date: t.date,
      source: "transaction" as const,
      categoryId: t.categoryId,
      createdAt: t.createdAt,
    })),
    ...recentCard.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: "expense" as const,
      date: t.date,
      source: "card" as const,
      categoryId: t.categoryId,
      createdAt: t.createdAt,
    })),
  ]
    .sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);

  // Top 5 expense categories this month (includes card expenses)
  const catTotals: Record<string, number> = {};

  for (const t of monthTransactions) {
    if (t.type === "expense" && t.categoryId) {
      catTotals[t.categoryId] = (catTotals[t.categoryId] ?? 0) + Number(t.amount);
    }
  }
  for (const t of monthCardTx) {
    if (t.categoryId) {
      catTotals[t.categoryId] = (catTotals[t.categoryId] ?? 0) + Number(t.amount);
    }
  }

  const topCatIds = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  const topExpenses = topCatIds.map((catId) => {
    const cat = categoryMap.get(catId);
    return {
      categoryId: catId,
      categoryName: cat?.name ?? "Sem categoria",
      categoryColor: cat?.color ?? "#94a3b8",
      total: catTotals[catId],
    };
  });

  return NextResponse.json({
    selectedMonth,
    selectedYear,
    totalBalance,
    totalIncome,
    totalExpense,
    totalCardInvoice,
    monthlyVariation: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
    accounts: allAccounts,
    recentActivity,
    goals: allGoals,
    topExpenses,
  });
}
