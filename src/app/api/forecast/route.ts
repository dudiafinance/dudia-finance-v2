import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, budgets, goals, accounts, recurringTransactions } from "@/lib/db/schema";
import { eq, and, gte, lte, sum, sql } from "drizzle-orm";

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

  try {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Load all data
  const [allTransactions, allCardTx, allBudgets, allGoals, allRecurring, accountBalances] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, userId)),
    db.select().from(cardTransactions).where(eq(cardTransactions.userId, userId)),
    db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.isActive, true))),
    db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active"))),
    db.select().from(recurringTransactions).where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.isActive, true))),
    db.select({ balance: sum(accounts.balance) }).from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.includeInTotal, true))),
  ]);

  const initialBalance = Number(accountBalances[0]?.balance || 0);

  const fixedIncome = allTransactions.filter((t) => t.subtype === "fixed" && t.type === "income");
  const fixedExpense = allTransactions.filter((t) => t.subtype === "fixed" && t.type === "expense");

  // Budget monthly amounts
  const budgetMonthly = allBudgets.reduce((sum, b) => {
    const amt = Number(b.amount);
    if (b.period === "weekly") return sum + amt * 4.33;
    if (b.period === "yearly") return sum + amt / 12;
    return sum + amt;
  }, 0);

  // Goal contributions for a specific month
  function getGoalContributionsForMonth(year: number, month: number): number {
    return allGoals.reduce((sum, g) => {
      if (!g.monthlyContribution || !g.startDate) return sum;
      
      const startDate = new Date(g.startDate);
      const goalStartMonth = startDate.getMonth() + 1;
      const goalStartYear = startDate.getFullYear();
      
      const hasEnded = g.endDate && new Date(g.endDate) < new Date(year, month - 1, 1);
      
      const hasStarted = (goalStartYear < year) || 
                         (goalStartYear === year && goalStartMonth <= month);
      
      if (!hasStarted || hasEnded) return sum;
      
      return sum + Number(g.monthlyContribution);
    }, 0);
  }

  // Calculate occurrences of recurring transactions for a month
  function getRecurringForMonth(year: number, month: number, type: "income" | "expense"): number {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    return allRecurring
      .filter((r) => r.type === type)
      .reduce((sum, r) => {
        let count = 0;
        let nextDate = new Date(r.nextDueDate);
        const endDate = r.endDate ? new Date(r.endDate) : new Date(year + 2, 0, 1); // Limit projection

        // Simple projection: if nextDueDate is in month or before and frequency is monthly
        // Note: For a more robust engine, this should handle weekly/daily correctly.
        // Keeping it simple for now as requested.
        
        while (nextDate <= monthEnd && nextDate <= endDate) {
          if (nextDate >= monthStart) {
            count++;
          }
          
          if (r.frequency === "daily") nextDate.setDate(nextDate.getDate() + (r.interval || 1));
          else if (r.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7 * (r.interval || 1));
          else if (r.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + (r.interval || 1));
          else if (r.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + (r.interval || 1));
          else break;
        }

        return sum + (count * Number(r.amount));
      }, 0);
  }

  const result = [];
  let cumulativeBalance = initialBalance;

  for (let i = 0; i <= 12; i++) {
    let y = currentYear;
    let m = currentMonth + i;
    while (m > 12) { m -= 12; y++; }

    const isCurrent = i === 0;
    const start = monthStart(y, m);
    const end = monthEnd(y, m);
    
    const monthGoalContributions = getGoalContributionsForMonth(y, m);

    if (isCurrent) {
      // Actual data for current month
      const monthTx = allTransactions.filter((t) => t.date >= start && t.date <= end);
      const monthCard = allCardTx.filter((t) => t.invoiceMonth === m && t.invoiceYear === y);

      const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      const cardInvoice = monthCard.reduce((s, t) => s + Number(t.amount), 0);

      // Current budget logic: Avoid double counting
      // Only consider budget for what hasn't been spent yet in those categories
      // We'll simplify and subtract FULL budget allocations for simplicity for NOW, but a better approach would be to check category spending
      // For now, let's keep the focus on fixing the starting balance and recurring tx.
      
      // Calculate projected recurring that might not have happened yet
      const projRecIncome = getRecurringForMonth(y, m, "income");
      const projRecExpense = getRecurringForMonth(y, m, "expense");

      const netBalance = (income + projRecIncome) - (expenses + projRecExpense) - cardInvoice - budgetMonthly - monthGoalContributions;
      cumulativeBalance += netBalance;

      result.push({
        year: y,
        month: m,
        monthName: monthName(y, m),
        isCurrent: true,
        income: income + projRecIncome,
        expenses: expenses + projRecExpense,
        cardInvoice,
        budgetAllocations: budgetMonthly,
        goalContributions: monthGoalContributions,
        netBalance,
        cumulativeBalance,
        startingBalance: initialBalance,
      });
    } else {
      // Projected data
      const projIncome =
        fixedIncome.reduce((s, t) => s + Number(t.amount), 0) +
        getRecurringForMonth(y, m, "income");

      const projExpense =
        fixedExpense.reduce((s, t) => s + Number(t.amount), 0) +
        getRecurringForMonth(y, m, "expense");

      const cardInvoice = allCardTx
        .filter((t) => t.invoiceMonth === m && t.invoiceYear === y)
        .reduce((s, t) => s + Number(t.amount), 0);

      const monthStartingBalance = cumulativeBalance;
      const netBalance = projIncome - projExpense - cardInvoice - budgetMonthly - monthGoalContributions;
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
        goalContributions: monthGoalContributions,
        netBalance,
        cumulativeBalance,
        startingBalance: monthStartingBalance,
      });
    }
  }

  return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating forecast:", error);
    return NextResponse.json({ error: "Erro ao gerar projeção" }, { status: 500 });
  }
}
