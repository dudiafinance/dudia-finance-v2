import { db } from "@/lib/db";
import { creditCards, cardTransactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Recalculate the used amount of a credit card.
 * Only counts transactions for the CURRENT open invoice month,
 * since past invoices are already paid.
 */
export async function recalculateUsedAmount(cardId: string): Promise<void> {
  const [card] = await db
    .select()
    .from(creditCards)
    .where(eq(creditCards.id, cardId))
    .limit(1);

  if (!card) return;

  // Determine the current open invoice month based on closing day
  const now = new Date();
  let invoiceMonth = now.getMonth() + 1;
  let invoiceYear = now.getFullYear();

  // If today is past the closing day, the current spend goes to next month's invoice
  if (now.getDate() > card.closingDay) {
    invoiceMonth++;
    if (invoiceMonth > 12) {
      invoiceMonth = 1;
      invoiceYear++;
    }
  }

  const result = await db
    .select({
      total: sql<string>`COALESCE(SUM(CAST(${cardTransactions.amount} AS DECIMAL(15,2))), 0)`,
    })
    .from(cardTransactions)
    .where(
      and(
        eq(cardTransactions.cardId, cardId),
        eq(cardTransactions.invoiceMonth, invoiceMonth),
        eq(cardTransactions.invoiceYear, invoiceYear)
      )
    );

  const usedAmount = result[0]?.total ?? "0";

  await db
    .update(creditCards)
    .set({ usedAmount, updatedAt: new Date() })
    .where(eq(creditCards.id, cardId));
}

/**
 * Generate future records for a "fixed" card transaction.
 * Creates copies for the next `monthsAhead` months.
 * Skips months that already have a record with the same description and cardId marked as fixed.
 */
export async function generateFixedFutureTransactions(
  originalTx: typeof cardTransactions.$inferSelect,
  monthsAhead: number = 11
): Promise<void> {
  let m = originalTx.invoiceMonth;
  let y = originalTx.invoiceYear;

  for (let i = 0; i < monthsAhead; i++) {
    m++;
    if (m > 12) { m = 1; y++; }

    // Check if already exists for this month
    const existing = await db
      .select({ id: cardTransactions.id })
      .from(cardTransactions)
      .where(
        and(
          eq(cardTransactions.cardId, originalTx.cardId),
          eq(cardTransactions.userId, originalTx.userId),
          eq(cardTransactions.invoiceMonth, m),
          eq(cardTransactions.invoiceYear, y),
          eq(cardTransactions.isFixed, true),
          eq(cardTransactions.description, originalTx.description)
        )
      )
      .limit(1);

    if (existing.length > 0) continue;

    await db.insert(cardTransactions).values({
      cardId: originalTx.cardId,
      userId: originalTx.userId,
      categoryId: originalTx.categoryId,
      description: originalTx.description,
      amount: originalTx.amount,
      totalAmount: originalTx.totalAmount,
      date: originalTx.date,
      invoiceMonth: m,
      invoiceYear: y,
      launchType: "fixed",
      totalInstallments: null,
      currentInstallment: null,
      groupId: originalTx.groupId,
      tags: originalTx.tags,
      isPending: false,
      isFixed: true,
      notes: originalTx.notes,
    });
  }
}