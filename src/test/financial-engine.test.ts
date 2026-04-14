import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FinancialEngine } from '@/lib/services/financial-engine';
import { db } from '@/lib/db';
import { accounts, transactions, creditCards, users } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { createTestUser, cleanupTestData } from './fixtures';

/**
 * Testes de Integração do Motor Financeiro (Real DB)
 */
describe('Financial Engine Integration Audit', () => {
  let userId: string;
  let cleanupUserId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    cleanupUserId = user.id;
  });

  afterAll(async () => {
    await cleanupTestData(cleanupUserId);
  });

  it('should maintain balance integrity across multiple operations', async () => {
    // 1. Create Account with 0 balance
    const [account] = await db.insert(accounts).values({
      userId,
      name: 'INTEGRATION_TEST_ACC',
      type: 'checking',
      balance: '0.00'
    }).returning();

    // 2. Add Initial Balance Transaction (R$ 1000)
    await FinancialEngine.addTransaction({
        userId,
        accountId: account.id,
        amount: '1000.00',
        type: 'income',
        date: '2026-04-10',
        description: 'Saldo Inicial',
        isPaid: true
    });

    // 3. Add Transactions via Engine
    await FinancialEngine.addTransaction({
      userId,
      accountId: account.id,
      amount: '50.15',
      type: 'expense',
      date: '2026-04-10',
      description: 'Audit Exp',
      isPaid: true
    });

    await FinancialEngine.addTransaction({
      userId,
      accountId: account.id,
      amount: '10.05',
      type: 'income',
      date: '2026-04-10',
      description: 'Audit Inc',
      isPaid: true
    });

    // 4. Recalculate and Verify (Expected: 1000 - 50.15 + 10.05 = 959.90)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalBalance = await FinancialEngine.recalculateAccountBalance(db as any, account.id);
    expect(finalBalance).toBe(959.90);

    // Cleanup
    await db.update(accounts).set({ deletedAt: new Date() }).where(eq(accounts.id, account.id));
  });

  it('should correctly recalculate card limit after installment purchase', async () => {
    // 1. Create Card
    const [card] = await db.insert(creditCards).values({
      userId,
      name: 'INTEGRATION_TEST_CARD',
      bank: 'TEST',
      limit: '2000.00',
      dueDay: 10,
      closingDay: 3
    }).returning();

    // 2. Add Installments via Direct DB (as the API does)
    const amount = 100.00;
    const n = 3;
    const amountInCents = Math.round(amount * 100);
    const baseCents = Math.floor(amountInCents / n);
    const remainder = amountInCents - n * baseCents; // Remainder goes to FIRST installment

    for (let i = 1; i <= n; i++) {
        const val = (i === 1 ? baseCents + remainder : baseCents) / 100;
        await FinancialEngine.addCardTransaction({
            cardId: card.id,
            userId,
            description: `Audit (${i}/${n})`,
            amount: String(val),
            totalAmount: String(amount),
            date: '2026-04-10',
            invoiceMonth: 4,
            invoiceYear: 2026,
            launchType: 'installment'
        });
    }

    // 3. Verify Card Used Amount
    const [updatedCard] = await db.select().from(creditCards).where(eq(creditCards.id, card.id));
    expect(Number(updatedCard.usedAmount)).toBe(100.00);

    // Cleanup
    await db.update(creditCards).set({ deletedAt: new Date() }).where(eq(creditCards.id, card.id));
  });

  it('should correctly handle fixed purchases generating 12 future months', async () => {
    // 1. Create Card
    const [card] = await db.insert(creditCards).values({
      userId,
      name: 'FIXED_AUDIT_CARD',
      bank: 'TEST',
      limit: '5000.00',
      dueDay: 10,
      closingDay: 3
    }).returning();

    // 2. Simulate Fixed Purchase (similar to API logic)
    const amount = '50.00';
    for (let i = 0; i < 12; i++) {
        await FinancialEngine.addCardTransaction({
            cardId: card.id,
            userId,
            description: 'Assinatura Audit',
            amount,
            totalAmount: amount,
            date: '2026-04-10',
            invoiceMonth: ((i + 3) % 12) + 1,
            invoiceYear: 2026,
            launchType: 'fixed',
            isFixed: true
        });
    }

    // 3. Verify used amount — BUG-009 fix: only current + past months count towards limit.
    // The loop creates months: Apr(current), May..Dec(future), Jan..Mar(past)
    // Past months (Jan, Feb, Mar 2026) + current (Apr 2026) = 4 months × R$50 = R$200
    const [updatedCard] = await db.select().from(creditCards).where(eq(creditCards.id, card.id));
    expect(Number(updatedCard.usedAmount)).toBe(200.00); // 4 months × 50 (excludes future months)

    // Cleanup
    await db.update(creditCards).set({ deletedAt: new Date() }).where(eq(creditCards.id, card.id));
  });
});