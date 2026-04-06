import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, accounts, goals, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const [allAccounts, monthTransactions, allGoals] = await Promise.all([
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
  ]);

  const totalBalance = allAccounts
    .filter((a) => a.includeInTotal && a.type !== "credit_card")
    .reduce((s, a) => s + Number(a.balance), 0);

  const totalIncome = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  // Recent activity: last 5 combining transactions + card transactions
  const [recentTx, recentCard] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(5),
    db
      .select()
      .from(cardTransactions)
      .where(eq(cardTransactions.userId, userId))
      .orderBy(desc(cardTransactions.date), desc(cardTransactions.createdAt))
      .limit(5),
  ]);

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

  // Top 5 expense categories this month
  const expenseTransactions = monthTransactions.filter((t) => t.type === "expense" && t.categoryId);
  const catTotals: Record<string, number> = {};
  for (const t of expenseTransactions) {
    if (t.categoryId) {
      catTotals[t.categoryId] = (catTotals[t.categoryId] ?? 0) + Number(t.amount);
    }
  }

  const topCatIds = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const allCategories = await db.select().from(categories).where(eq(categories.userId, userId));

  const topExpenses = topCatIds.map((catId) => {
    const cat = allCategories.find((c) => c.id === catId);
    return {
      categoryId: catId,
      categoryName: cat?.name ?? "Sem categoria",
      categoryColor: cat?.color ?? "#94a3b8",
      total: catTotals[catId],
    };
  });

  return NextResponse.json({
    totalBalance,
    totalIncome,
    totalExpense,
    monthlyVariation: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
    accounts: allAccounts,
    recentActivity,
    goals: allGoals,
    topExpenses,
  });
}
