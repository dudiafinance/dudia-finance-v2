import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { budgets, transactions, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, sql, isNull } from "drizzle-orm";
...
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, yearStartStr),
          isNull(transactions.deletedAt)
        ))
...
        .where(and(
          eq(cardTransactions.userId, userId),
          gte(cardTransactions.date, yearStartStr),
          isNull(cardTransactions.deletedAt)
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

      const sumAggs = (aggList: { categoryId?: string | null; date?: string | null; total?: string | number | null }[]) => {
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
