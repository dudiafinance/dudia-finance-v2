import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, budgets, goals, accounts, recurringTransactions } from "@/lib/db/schema";
import { eq, and, sum } from "drizzle-orm";

function monthName(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function weeksInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  return Math.ceil((firstDay + daysInMonth) / 7);
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const todayStr = now.toISOString().split("T")[0];

    // Escalabilidade: Buscamos todas as records, mas o ideal em DB gigantes seria filtrar DTE >= (HOJE - 30)
    const [allTransactions, allCardTx, allBudgets, allGoals, allRecurring, accountBalances] = await Promise.all([
      db.select().from(transactions).where(eq(transactions.userId, userId)),
      db.select().from(cardTransactions).where(eq(cardTransactions.userId, userId)),
      db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.isActive, true))),
      db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active"))),
      db.select().from(recurringTransactions).where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.isActive, true))),
      db.select({ balance: sum(accounts.balance) }).from(accounts).where(and(
        eq(accounts.userId, userId), 
        eq(accounts.includeInTotal, true),
        eq(accounts.isActive, true) // Filtro adicionado: apenas contas ativas
      )),
    ]);

    const initialBalance = Number(accountBalances[0]?.balance || 0);

    const fixedIncome = allTransactions.filter((t) => t.subtype === "fixed" && t.type === "income");
    const fixedExpense = allTransactions.filter((t) => t.subtype === "fixed" && t.type === "expense");

    // ==========================================
    // Pre-indexing / Lookup Tables for Fast Access
    // ==========================================
    const txByMonth = new Map<string, typeof allTransactions>();
    for (const t of allTransactions) {
      if (!t.date) continue;
      const key = t.date.substring(0, 7); // YYYY-MM
      if (!txByMonth.has(key)) txByMonth.set(key, []);
      txByMonth.get(key)!.push(t);
    }

    const cardTxByMonth = new Map<string, number>();
    for (const c of allCardTx) {
      const key = `${c.invoiceYear}-${String(c.invoiceMonth).padStart(2, '0')}`;
      cardTxByMonth.set(key, (cardTxByMonth.get(key) || 0) + Number(c.amount));
    }
    
    // ==========================================
    // Helper Functions
    // ==========================================
    function getBudgetMonthlyForMonth(year: number, month: number): number {
      const weeks = weeksInMonth(year, month);
      return allBudgets.reduce((sum, b) => {
        const amt = Number(b.amount);
        if (b.period === "weekly") return sum + (amt * weeks);
        if (b.period === "yearly") return sum + amt / 12;
        return sum + amt;
      }, 0);
    }

    function getGoalContributionsForMonth(year: number, month: number): number {
      return allGoals.reduce((sum, g) => {
        if (!g.monthlyContribution || !g.startDate) return sum;
        const startDate = new Date(g.startDate);
        const goalStartMonth = startDate.getMonth() + 1;
        const goalStartYear = startDate.getFullYear();
        const hasEnded = g.endDate && new Date(g.endDate) < new Date(year, month - 1, 1);
        const hasStarted = (goalStartYear < year) || (goalStartYear === year && goalStartMonth <= month);
        
        if (!hasStarted || hasEnded) return sum;
        return sum + Number(g.monthlyContribution);
      }, 0);
    }

    function getRecurringForMonth(year: number, month: number, type: "income" | "expense", onlyFutureInCurrentMonth = false): number {
      const monthStartDt = new Date(year, month - 1, 1);
      const monthEndDt = new Date(year, month, 0, 23, 59, 59);

      return allRecurring
        .filter((r) => r.type === type)
        .reduce((sum, r) => {
          let count = 0;
          const nextDate = new Date(r.nextDueDate);
          // Limit to max 3 years projection to avoid infinite loops if bad data
          const endDate = r.endDate ? new Date(r.endDate) : new Date(currentYear + 3, 0, 1); 

          let safeLoop = 0;
          while (nextDate <= monthEndDt && nextDate <= endDate && safeLoop < 100) {
            safeLoop++;
            
            let shouldCount = nextDate >= monthStartDt;
            if (onlyFutureInCurrentMonth) {
              const ndStr = nextDate.toISOString().split("T")[0];
              if (ndStr <= todayStr) {
                 shouldCount = false;
              }
            }
            
            if (shouldCount) {
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
      const monthKey = `${y}-${String(m).padStart(2, '0')}`;
      const monthGoalContributions = getGoalContributionsForMonth(y, m);
      const budgetMonthly = getBudgetMonthlyForMonth(y, m);
      const cardInvoice = cardTxByMonth.get(monthKey) || 0;

      if (isCurrent) {
        // Month 0 Logic: Avoid double counting!
        // Start from current real balance, add ONLY future transactions/recurring mapped for THIS month.
        const monthTx = txByMonth.get(monthKey) || [];
        
        // Pendentes apenas
        const pendingTx = monthTx.filter(t => t.date > todayStr);

        const pendingIncome = pendingTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const pendingExpenses = pendingTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        
        const projRecIncome = getRecurringForMonth(y, m, "income", true); // Only future part
        const projRecExpense = getRecurringForMonth(y, m, "expense", true); // Only future part

        // Future pending logic for the month
        const totalPendingIncome = pendingIncome + projRecIncome;
        const totalPendingExpense = pendingExpenses + projRecExpense;

        const netBalance = totalPendingIncome - totalPendingExpense - cardInvoice - budgetMonthly - monthGoalContributions;
        cumulativeBalance += netBalance;

        // Display numbers for UI breakdown: 
        // We show total projections (pending + what happened isn't strictly necessary since UI just asks for "what's the impact").
        // But to keep UI matching the actual cashflow "this month", let's sum everything for the UI card
        const fullIncome = monthTx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0) + getRecurringForMonth(y, m, "income", false);
        const fullExpenses = monthTx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0) + getRecurringForMonth(y, m, "expense", false);

        result.push({
          year: y,
          month: m,
          monthName: monthName(y, m),
          isCurrent: true,
          income: fullIncome,
          expenses: fullExpenses,
          cardInvoice,
          budgetAllocations: budgetMonthly,
          goalContributions: monthGoalContributions,
          netBalance,
          cumulativeBalance,
          startingBalance: initialBalance,
        });
      } else {
        // Projected data for Future Months
        const projIncome =
          fixedIncome.reduce((s, t) => s + Number(t.amount), 0) +
          getRecurringForMonth(y, m, "income");

        const projExpense =
          fixedExpense.reduce((s, t) => s + Number(t.amount), 0) +
          getRecurringForMonth(y, m, "expense");

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
