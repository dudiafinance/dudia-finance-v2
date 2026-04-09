import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, categories as categoriesTable } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, isNull } from "drizzle-orm";

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
  
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  try {
    // 1. Fetch Categories (Lightweight Map)
    const categories = await db
      .select({ id: categoriesTable.id, name: categoriesTable.name, color: categoriesTable.color })
      .from(categoriesTable)
      .where(eq(categoriesTable.userId, userId));

    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

    // 2. Fetch Bank Transactions Aggregated via SQL (O(1) memory instead of O(N))
    const bankAgg = await db
      .select({
        type: transactions.type,
        categoryId: transactions.categoryId,
        total: sql<string>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startStr),
          lte(transactions.date, endStr),
          isNull(transactions.deletedAt)
        )
      )
      .groupBy(transactions.type, transactions.categoryId);

    // 3. Fetch Card Transactions Aggregated via SQL
    const cardAgg = await db
      .select({
        categoryId: cardTransactions.categoryId,
        total: sql<string>`sum(${cardTransactions.amount})`,
      })
      .from(cardTransactions)
      .where(
        and(
          eq(cardTransactions.userId, userId),
          gte(cardTransactions.date, startStr),
          lte(cardTransactions.date, endStr), // Note: using actual date, not invoice.
          isNull(cardTransactions.deletedAt)
        )
      )
      .groupBy(cardTransactions.categoryId);

    // 4. Consolidation Logic
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, { value: number; color: string }> = {};

    // Process Bank
    bankAgg.forEach(t => {
      const amt = Number(t.total || 0);
      const cat = catMap[t.categoryId as string];
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
    cardAgg.forEach(t => {
      const amt = Number(t.total || 0);
      const cat = catMap[t.categoryId as string];
      const catName = cat?.name ?? "Cartão (Sem Categoria)";
      const catColor = cat?.color ?? "#94a3b8";

      totalExpense += amt;
      if (!expenseByCat[catName]) expenseByCat[catName] = { value: 0, color: catColor };
      expenseByCat[catName].value += amt;
    });

    // 5. Monthly Evolution (Last 6 months) grouped by Month natively in SQL
    const history = [];
    const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const historyStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const histStartStr = historyStart.toISOString().slice(0, 10);
    
    const [histBankAgg, histCardAgg] = await Promise.all([
      db.select({
        monthGroup: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
        type: transactions.type,
        total: sql<string>`sum(${transactions.amount})`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId), 
          gte(transactions.date, histStartStr),
          isNull(transactions.deletedAt)
        )
      )
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`, transactions.type),

      db.select({
        monthGroup: sql<string>`to_char(${cardTransactions.date}, 'YYYY-MM')`,
        total: sql<string>`sum(${cardTransactions.amount})`
      })
      .from(cardTransactions)
      .where(
        and(
          eq(cardTransactions.userId, userId), 
          gte(cardTransactions.date, histStartStr),
          isNull(cardTransactions.deletedAt)
        )
      )
      .groupBy(sql`to_char(${cardTransactions.date}, 'YYYY-MM')`)
    ]);

    // Map the grouped data to the last 6 months loop
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const targetGroup = `${y}-${String(m + 1).padStart(2, '0')}`;
    
      const bankIncome = histBankAgg.find(h => h.monthGroup === targetGroup && h.type === 'income')?.total || 0;
      const bankExpense = histBankAgg.find(h => h.monthGroup === targetGroup && h.type === 'expense')?.total || 0;
      const cardExpense = histCardAgg.find(h => h.monthGroup === targetGroup)?.total || 0;

      const income = Number(bankIncome);
      const expense = Number(bankExpense) + Number(cardExpense);

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
