import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions, cardTransactions, categories } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

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
            lte(transactions.date, endOfMonth)
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

    const stats: Record<string, number> = {};

    // Regular transactions
    for (const t of monthTx) {
      if (t.type === "expense" && t.categoryId) {
        stats[t.categoryId] = (stats[t.categoryId] ?? 0) + Number(t.amount);
      }
    }

    // Card transactions
    for (const t of monthCardTx) {
      if (t.categoryId) {
        stats[t.categoryId] = (stats[t.categoryId] ?? 0) + Number(t.amount);
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
  }
}
