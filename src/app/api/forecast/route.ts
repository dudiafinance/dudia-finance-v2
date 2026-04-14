import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, budgets, goals, accounts, recurringTransactions } from "@/lib/db/schema";
import { eq, and, sum, isNull, gte, sql } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

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

    // Janela de projeção: mês atual + 12 meses futuros
    const projectionMonths = 13;
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0];

    // ==========================================
    // PERF-01: SQL Aggregations ao invés de carregar todos os registros em memória
    // ==========================================
    const [
      // 1. Totais históricos por mês/tipo (apenas mês atual — para a lógica de current month)
      currentMonthTxAgg,
      // 2. Transações pendentes (futuras) do mês atual para projeção parcial
      currentMonthPendingAgg,
      // 3. Transações fixas (subtype='fixed') para projeção de meses futuros
      fixedTxAgg,
      // 4. Faturas de cartão agregadas por mês/ano
      cardTxAgg,
      // 5. Orçamentos ativos
      allBudgets,
      // 6. Metas ativas
      allGoals,
      // 7. Recorrências ativas (necessárias para cálculo projetado — pequeno conjunto)
      allRecurring,
      // 8. Saldo total das contas
      accountBalances,
    ] = await Promise.all([
      // 1. Soma de income/expense no mês atual (já pagos/registrados)
      db.select({
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`,
      })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
          sql`${transactions.date} >= ${startOfCurrentMonth}`,
          sql`${transactions.date} <= ${todayStr}`,
          sql`${transactions.type} IN ('income', 'expense')`,
        ))
        .groupBy(transactions.type),

      // 2. Transações pendentes futuras do mês atual (data > hoje, dentro do mês)
      db.select({
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`,
      })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
          sql`${transactions.date} > ${todayStr}`,
          sql`${transactions.date} <= ${new Date(currentYear, currentMonth, 0).toISOString().split("T")[0]}`,
          sql`${transactions.type} IN ('income', 'expense')`,
        ))
        .groupBy(transactions.type),

      // 3. Transações fixas (referência para meses futuros)
      db.select({
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`,
      })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          isNull(transactions.deletedAt),
          eq(transactions.subtype, "fixed"),
          sql`${transactions.type} IN ('income', 'expense')`,
          // Apenas transações do mês atual como referência (evita contar duplicatas de meses passados)
          sql`${transactions.date} >= ${startOfCurrentMonth}`,
          sql`${transactions.date} <= ${new Date(currentYear, currentMonth, 0).toISOString().split("T")[0]}`,
        ))
        .groupBy(transactions.type),

      // 4. Faturas de cartão agregadas por invoiceMonth/invoiceYear (apenas meses relevantes)
      db.select({
        invoiceMonth: cardTransactions.invoiceMonth,
        invoiceYear: cardTransactions.invoiceYear,
        total: sql<string>`COALESCE(SUM(CAST(${cardTransactions.amount} AS DECIMAL(15,2))), 0)`,
      })
        .from(cardTransactions)
        .where(and(
          eq(cardTransactions.userId, userId),
          isNull(cardTransactions.deletedAt),
          // Apenas meses da janela de projeção
          sql`(${cardTransactions.invoiceYear} * 12 + ${cardTransactions.invoiceMonth}) >= ${currentYear * 12 + currentMonth}`,
          sql`(${cardTransactions.invoiceYear} * 12 + ${cardTransactions.invoiceMonth}) <= ${currentYear * 12 + currentMonth + projectionMonths}`,
        ))
        .groupBy(cardTransactions.invoiceMonth, cardTransactions.invoiceYear),

      db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.isActive, true))),
      db.select().from(goals).where(and(eq(goals.userId, userId), eq(goals.status, "active"), isNull(goals.deletedAt))),
      db.select().from(recurringTransactions).where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.isActive, true))),
      db.select({ balance: sum(accounts.balance) }).from(accounts).where(and(
        eq(accounts.userId, userId),
        eq(accounts.includeInTotal, true),
        eq(accounts.isActive, true),
        isNull(accounts.deletedAt)
      )),
    ]);

    const initialBalance = Number(accountBalances[0]?.balance || 0);

    // ==========================================
    // Lookup maps a partir das aggregations
    // ==========================================
    const currentMonthIncome = Number(currentMonthTxAgg.find(r => r.type === "income")?.total || 0);
    const currentMonthExpense = Number(currentMonthTxAgg.find(r => r.type === "expense")?.total || 0);
    const pendingIncome = Number(currentMonthPendingAgg.find(r => r.type === "income")?.total || 0);
    const pendingExpense = Number(currentMonthPendingAgg.find(r => r.type === "expense")?.total || 0);
    const fixedIncome = Number(fixedTxAgg.find(r => r.type === "income")?.total || 0);
    const fixedExpense = Number(fixedTxAgg.find(r => r.type === "expense")?.total || 0);

    const cardTxByMonth = new Map<string, number>();
    for (const c of cardTxAgg) {
      const key = `${c.invoiceYear}-${String(c.invoiceMonth).padStart(2, '0')}`;
      cardTxByMonth.set(key, Number(c.total));
    }

    // ==========================================
    // Helper Functions
    // ==========================================
    function getBudgetMonthlyForMonth(year: number, month: number): number {
      const weeks = weeksInMonth(year, month);
      return allBudgets.reduce((s, b) => {
        const amt = Number(b.amount);
        if (b.period === "weekly") return s + (amt * weeks);
        if (b.period === "yearly") return s + amt / 12;
        return s + amt;
      }, 0);
    }

    function getGoalContributionsForMonth(year: number, month: number): number {
      return allGoals.reduce((s, g) => {
        if (!g.monthlyContribution || !g.startDate) return s;
        const startDate = new Date(g.startDate);
        const goalStartMonth = startDate.getMonth() + 1;
        const goalStartYear = startDate.getFullYear();
        const hasEnded = g.endDate && new Date(g.endDate) < new Date(year, month - 1, 1);
        const hasStarted = (goalStartYear < year) || (goalStartYear === year && goalStartMonth <= month);
        if (!hasStarted || hasEnded) return s;
        return s + Number(g.monthlyContribution);
      }, 0);
    }

    function getRecurringForMonth(year: number, month: number, type: "income" | "expense", onlyFutureInCurrentMonth = false): number {
      const monthStartDt = new Date(year, month - 1, 1);
      const monthEndDt = new Date(year, month, 0, 23, 59, 59);

      return allRecurring
        .filter((r) => r.type === type)
        .reduce((s, r) => {
          let count = 0;
          const nextDate = new Date(r.nextDueDate);
          const endDate = r.endDate ? new Date(r.endDate) : new Date(currentYear + 3, 0, 1);

          let safeLoop = 0;
          while (nextDate <= monthEndDt && nextDate <= endDate && safeLoop < 100) {
            safeLoop++;
            let shouldCount = nextDate >= monthStartDt;
            if (onlyFutureInCurrentMonth) {
              shouldCount = nextDate.toISOString().split("T")[0] > todayStr;
            }
            if (shouldCount) count++;
            if (r.frequency === "daily") nextDate.setDate(nextDate.getDate() + (r.interval || 1));
            else if (r.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7 * (r.interval || 1));
            else if (r.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + (r.interval || 1));
            else if (r.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + (r.interval || 1));
            else break;
          }
          return s + (count * Number(r.amount));
        }, 0);
    }

    // ==========================================
    // Projeção mês a mês
    // ==========================================
    const result = [];
    let cumulativeBalance = initialBalance;

    for (let i = 0; i < projectionMonths; i++) {
      let y = currentYear;
      let m = currentMonth + i;
      while (m > 12) { m -= 12; y++; }

      const isCurrent = i === 0;
      const monthKey = `${y}-${String(m).padStart(2, '0')}`;
      const monthGoalContributions = getGoalContributionsForMonth(y, m);
      const budgetMonthly = getBudgetMonthlyForMonth(y, m);
      const cardInvoice = cardTxByMonth.get(monthKey) || 0;

      if (isCurrent) {
        // Mês atual: usa aggregations já calculadas (income/expense passados + projetados futuros)
        const projRecIncome = getRecurringForMonth(y, m, "income", true);
        const projRecExpense = getRecurringForMonth(y, m, "expense", true);

        const totalPendingIncome = pendingIncome + projRecIncome;
        const totalPendingExpense = pendingExpense + projRecExpense;

        const netBalance = totalPendingIncome - totalPendingExpense - cardInvoice - budgetMonthly - monthGoalContributions;
        cumulativeBalance += netBalance;

        result.push({
          year: y,
          month: m,
          monthName: monthName(y, m),
          isCurrent: true,
          income: currentMonthIncome + pendingIncome + getRecurringForMonth(y, m, "income", false),
          expenses: currentMonthExpense + pendingExpense + getRecurringForMonth(y, m, "expense", false),
          cardInvoice,
          budgetAllocations: budgetMonthly,
          goalContributions: monthGoalContributions,
          netBalance,
          cumulativeBalance,
          startingBalance: initialBalance,
        });
      } else {
        const projIncome = fixedIncome + getRecurringForMonth(y, m, "income");
        const projExpense = fixedExpense + getRecurringForMonth(y, m, "expense");

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

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    logger.error("Error generating forecast:", error);
    return NextResponse.json({ error: "Erro ao gerar projeção" }, { status: 500 });
  }
}
