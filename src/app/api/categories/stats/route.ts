import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();

  const startOfMonth = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const endOfMonth = new Date(year, month, 0).toISOString().split("T")[0];

  try {
    const [monthTx, monthCardTx] = await Promise.all([
      db
        .select({
          categoryId: transactions.categoryId,
          amount: transactions.amount,
          type: transactions.type,
        })
        .from(transactions)
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
    ]);

    const userCategories = await db
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories)
      .where(eq(categories.userId, userId));

    const categoryMap = new Map(userCategories.map(c => [c.id, c.parentId]));

    const stats: Record<string, number> = {};

    const addAmountRecursive = (catId: string, amount: number) => {
      let currentId: string | null = catId;
      let depth = 0; 

      while (currentId && depth < 10) {
        stats[currentId] = (stats[currentId] ?? 0) + amount;
        currentId = categoryMap.get(currentId) || null;
        depth++;
      }
    };

    for (const t of monthTx) {
      if (t.type === "expense" && t.categoryId) {
        addAmountRecursive(t.categoryId, Number(t.amount));
      }
    }

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
