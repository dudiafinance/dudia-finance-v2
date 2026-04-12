import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { budgets, transactions, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, sql, isNull } from "drizzle-orm";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

export async function GET(_req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const yearStartStr = format(startOfYear(now), 'yyyy-MM-dd');

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
          gte(transactions.date, yearStartStr),
          isNull(transactions.deletedAt)
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
          gte(cardTransactions.date, yearStartStr),
          isNull(cardTransactions.deletedAt)
        ))
        .groupBy(cardTransactions.categoryId, cardTransactions.date)
    ]);

    // BUG-016: Build children map once (O(n)) instead of O(n²) linear scans
    const childrenMap = new Map<string, string[]>();
    for (const cat of allCategories) {
      if (cat.parentId) {
        if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
        childrenMap.get(cat.parentId)!.push(cat.id);
      }
    }

    const getDescendants = (parentId: string | null): string[] => {
      if (!parentId) return [];
      const children = childrenMap.get(parentId) ?? [];
      let descArr = [...children];
      for (const childId of children) {
        descArr = descArr.concat(getDescendants(childId));
      }
      return descArr;
    };

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

      const validCategoryIds = new Set<string>();
      if (budget.categoryId) {
        validCategoryIds.add(budget.categoryId);
        getDescendants(budget.categoryId).forEach(id => validCategoryIds.add(id));
      }

      let totalSpent = 0;

      const sumAggs = (aggList: any[]) => {
        for (const row of aggList) {
          if (row.categoryId && validCategoryIds.has(row.categoryId) && row.date) {
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
  } catch (error) {
    console.error("Budget Stats Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
