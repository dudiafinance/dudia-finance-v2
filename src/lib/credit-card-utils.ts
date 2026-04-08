import { db } from "@/lib/db";
import { creditCards, cardTransactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

import { FinancialEngine } from "@/lib/services/financial-engine";

/**
 * Recalculate the used amount of a credit card.
 * Sums all unpaid card transactions using the global engine.
 */
export async function recalculateUsedAmount(cardId: string): Promise<void> {
  await FinancialEngine.recalculateCardLimit(db, cardId);
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