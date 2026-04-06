import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, accounts, goals } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

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

  const recentTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(sql`${transactions.date} desc, ${transactions.createdAt} desc`)
    .limit(5);

  return NextResponse.json({
    totalBalance,
    totalIncome,
    totalExpense,
    monthlyVariation: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
    accounts: allAccounts,
    recentTransactions,
    goals: allGoals,
  });
}
