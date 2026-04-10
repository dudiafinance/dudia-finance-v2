import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
...
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.date, startOfMonth),
            lte(transactions.date, endOfMonth),
            isNull(transactions.deletedAt)
          )
        ),
      db
        .select({
          categoryId: cardTransactions.categoryId,
          amount: cardTransactions.amount,
        })
        .from(cardTransactions)
        .where(
          and(
            eq(cardTransactions.userId, userId),
            eq(cardTransactions.invoiceMonth, month),
            eq(cardTransactions.invoiceYear, year),
            isNull(cardTransactions.deletedAt)
          )
        ),
      db
        .select({
          categoryId: cardTransactions.categoryId,
          amount: cardTransactions.amount,
        })
        .from(cardTransactions)
        .where(
          and(
            eq(cardTransactions.userId, userId),
            eq(cardTransactions.invoiceMonth, month),
            eq(cardTransactions.invoiceYear, year)
          )
        ),
    ]);

    const userCategories = await db
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.userId, userId));

    const categoryMap = new Map(userCategories.map(c => [c.id, c.parentId]));

    const stats: Record<string, number> = {};

    // Helper para adicionar valor na categoria e em todos os seus pais
    const addAmountRecursive = (catId: string, amount: number) => {
      let currentId: string | null = catId;
      let depth = 0; // Anti-ciclo fallback

      while (currentId && depth < 10) {
        stats[currentId] = (stats[currentId] ?? 0) + amount;
        currentId = categoryMap.get(currentId) || null;
        depth++;
      }
    };

    // Regular transactions
    for (const t of monthTx) {
      if (t.type === "expense" && t.categoryId) {
        addAmountRecursive(t.categoryId, Number(t.amount));
      }
    }

    // Card transactions
    for (const t of monthCardTx) {
      if (t.categoryId) {
        addAmountRecursive(t.categoryId, Number(t.amount));
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
  }
}
