import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, cardTransactions, budgets, goals, accounts } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

function monthName(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function monthStart(year: number, month: number): string {
  return new Date(year, month - 1, 1).toISOString().split("T")[0];
}

function monthEnd(year: number, month: number): string {
  return new Date(year, month, 0).toISOString().split("T")[0];
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Load all data
  const [allTransactions, allCardTx, allBudgets, allGoals] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, userId)),
    db.select().from(cardTransactions).where(eq(cardTransactions.userId, userId)),
    db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.isActive, true))),
    db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active"))),
  ]);

  const fixedIncome = allTransactions.filter((t) => t.subtype === "fixed" && t.type === "income");
  const fixedExpense = allTransactions.filter((t) => t.subtype === "fixed" && t.type === "expense");

  // Budget monthly amounts
  const budgetMonthly = allBudgets.reduce((sum, b) => {
    const amt = Number(b.amount);
    if (b.period === "weekly") return sum + amt * 4.33;
    if (b.period === "yearly") return sum + amt / 12;
    return sum + amt;
  }, 0);

  // Goal contributions
  const goalContributionsTotal = allGoals.reduce((sum, g) => {
    return sum + (g.monthlyContribution ? Number(g.monthlyContribution) : 0);
  }, 0);

  const result = [];
  let cumulativeBalance = 0;

  for (let i = 0; i <= 12; i++) {
    let y = currentYear;
    let m = currentMonth + i;
    while (m > 12) { m -= 12; y++; }

    const isCurrent = i === 0;
    const start = monthStart(y, m);
    const end = monthEnd(y, m);

    if (isCurrent) {
      // Actual data for current month
      const monthTx = allTransactions.filter((t) => t.date >= start && t.date <= end);
      const monthCard = allCardTx.filter((t) => t.invoiceMonth === m && t.invoiceYear === y);

      const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const cardInvoice = monthCard.reduce((s, t) => s + Number(t.amount), 0);
      const netBalance = income - expenses - cardInvoice - budgetMonthly - goalContributionsTotal;
      cumulativeBalance += netBalance;

      result.push({
        year: y,
        month: m,
        monthName: monthName(y, m),
        isCurrent: true,
        income,
        expenses,
        cardInvoice,
        budgetAllocations: budgetMonthly,
        goalContributions: goalContributionsTotal,
        netBalance,
        cumulativeBalance,
      });
    } else {
      // Projected data
      const projIncome =
        fixedIncome.reduce((s, t) => s + Number(t.amount), 0) +
        allTransactions
          .filter((t) => t.subtype === "recurring" && t.type === "income" && t.date >= start && t.date <= end)
          .reduce((s, t) => s + Number(t.amount), 0);

      const projExpense =
        fixedExpense.reduce((s, t) => s + Number(t.amount), 0) +
        allTransactions
          .filter((t) => t.subtype === "recurring" && t.type === "expense" && t.date >= start && t.date <= end)
          .reduce((s, t) => s + Number(t.amount), 0);

      const cardInvoice = allCardTx
        .filter((t) => t.invoiceMonth === m && t.invoiceYear === y)
        .reduce((s, t) => s + Number(t.amount), 0);

      const netBalance = projIncome - projExpense - cardInvoice - budgetMonthly - goalContributionsTotal;
      cumulativeBalance += netBalance;

      result.push({
        year: y,
        month: m,
        monthName: monthName(y, m),
        isCurrent: false,
        income: projIncome,
        expenses: projExpense,
        cardInvoice,
        budgetAllocations: budgetMonthly,
        goalContributions: goalContributionsTotal,
        netBalance,
        cumulativeBalance,
      });
    }
  }

  return NextResponse.json(result);
}
