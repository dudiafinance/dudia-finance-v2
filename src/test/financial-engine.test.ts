import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { describe, it, expect, beforeAll } from 'vitest';
import { FinancialEngine } from '@/lib/services/financial-engine';
import { db } from '@/lib/db';
import { accounts, transactions, creditCards, users } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

/**
 * Testes de Integração do Motor Financeiro (Real DB)
 */
describe('Financial Engine Integration Audit', () => {
  let userId: string;

  beforeAll(async () => {
    // Get a test user
    const [user] = await db.select().from(users).limit(1);
    userId = user.id;
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
    const remainderCents = amountInCents - baseCents * (n - 1);

    for (let i = 1; i <= n; i++) {
        const val = (i === n ? remainderCents : baseCents) / 100;
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

    // 3. Verify used amount (all 12 months should count if they are not paid)
    const [updatedCard] = await db.select().from(creditCards).where(eq(creditCards.id, card.id));
    expect(Number(updatedCard.usedAmount)).toBe(600.00); // 50 * 12

    // Cleanup
    await db.update(creditCards).set({ deletedAt: new Date() }).where(eq(creditCards.id, card.id));
  });
});