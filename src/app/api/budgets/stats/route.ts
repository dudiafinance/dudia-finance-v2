import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { budgets, transactions, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte, or, inArray, sql } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Buscar todos os orçamentos do usuário
    const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, userId));
    const allCategories = await db.select().from(categories).where(eq(categories.userId, userId));

    const now = new Date();
    
    const results = await Promise.all(userBudgets.map(async (budget) => {
      let start: Date;
      let end: Date;

      // 2. Definir o range de datas baseado no período
      switch (budget.period) {
        case 'weekly':
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'yearly':
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        case 'monthly':
        default:
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
      }

      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');

      // 3. Resolver subcategorias (recursion simples: 1 nível)
      const targetCategoryIds = [budget.categoryId];
      if (budget.categoryId) {
        const subCats = allCategories.filter(c => c.parentId === budget.categoryId).map(c => c.id);
        targetCategoryIds.push(...subCats);
      }

      // Filtrar IDs nulos
      const validCategoryIds = targetCategoryIds.filter((id): id is string => !!id);

      // 4. Somar transações bancárias
      const bankSpent = await db
        .select({ total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS NUMERIC)), 0)` })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          validCategoryIds.length > 0 ? inArray(transactions.categoryId, validCategoryIds) : undefined,
          gte(transactions.date, startDateStr),
          lte(transactions.date, endDateStr)
        ));

      // 5. Somar transações de cartão
      const cardSpent = await db
        .select({ total: sql<number>`COALESCE(SUM(CAST(${cardTransactions.amount} AS NUMERIC)), 0)` })
        .from(cardTransactions)
        .where(and(
          eq(cardTransactions.userId, userId),
          validCategoryIds.length > 0 ? inArray(cardTransactions.categoryId, validCategoryIds) : undefined,
          gte(cardTransactions.date, startDateStr),
          lte(cardTransactions.date, endDateStr)
        ));

      const totalSpent = Number(bankSpent[0]?.total || 0) + Number(cardSpent[0]?.total || 0);

      return {
        ...budget,
        spent: totalSpent,
        percentage: Number(budget.amount) > 0 ? (totalSpent / Number(budget.amount)) * 100 : 0,
        periodDates: { start: startDateStr, end: endDateStr }
      };
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Budget Stats Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
