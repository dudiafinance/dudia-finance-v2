import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { budgets, transactions, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const yearStartStr = format(startOfYear(now), 'yyyy-MM-dd');

    // 1. O(1) Queries: Fetches all budgets, categories, and aggregated transactions for the year
    const [userBudgets, allCategories, bankAgg, cardAgg] = await Promise.all([
      db.select().from(budgets).where(eq(budgets.userId, userId)),
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select({ 
          categoryId: transactions.categoryId, 
          date: transactions.date, 
          total: sql<number>`SUM(CAST(${transactions.amount} AS NUMERIC))` 
        })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, yearStartStr)
        ))
        .groupBy(transactions.categoryId, transactions.date),
      db.select({ 
          categoryId: cardTransactions.categoryId, 
          date: cardTransactions.date, 
          total: sql<number>`SUM(CAST(${cardTransactions.amount} AS NUMERIC))` 
        })
        .from(cardTransactions)
        .where(and(
          eq(cardTransactions.userId, userId),
          gte(cardTransactions.date, yearStartStr)
        ))
        .groupBy(cardTransactions.categoryId, cardTransactions.date)
    ]);

    // 2. Recursive function to get all descendants of a category
    const getDescendants = (parentId: string | null): string[] => {
      if (!parentId) return [];
      const children = allCategories.filter(c => c.parentId === parentId);
      let desc = children.map(c => c.id);
      for (const child of children) {
        desc = desc.concat(getDescendants(child.id));
      }
      return desc;
    };

    // 3. Process budgets in-memory
    const results = userBudgets.map(budget => {
      let start: Date;
      let end: Date;

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

      // Resolve valid categories (parent + all descendants)
      const validCategoryIds = new Set<string>();
      if (budget.categoryId) {
        validCategoryIds.add(budget.categoryId);
        getDescendants(budget.categoryId).forEach(id => validCategoryIds.add(id));
      }

      // Sum from aggregations
      let totalSpent = 0;

      const sumAggs = (aggList: any[]) => {
        for (const row of aggList) {
          if (row.categoryId && validCategoryIds.has(row.categoryId)) {
            if (row.date >= startDateStr && row.date <= endDateStr) {
              totalSpent += Number(row.total || 0);
            }
          }
        }
      };

      sumAggs(bankAgg);
      sumAggs(cardAgg);

      return {
        ...budget,
        spent: totalSpent,
        percentage: Number(budget.amount) > 0 ? (totalSpent / Number(budget.amount)) * 100 : 0,
        periodDates: { start: startDateStr, end: endDateStr }
      };
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Budget Stats Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
