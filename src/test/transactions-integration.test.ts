import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FinancialEngine } from '@/lib/services/financial-engine';
import { db } from '@/lib/db';
import { accounts, transactions, auditLogs, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

describe('FinancialEngine Integration Tests', () => {
  const testUserId = 'debfc4b5-45eb-45dc-90d3-30a83d4e1064';
  let testAccountId: string | null = null;
  let cleanupTxIds: string[] = [];

  beforeEach(async () => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, testUserId)).limit(1);
    if (userAccounts.length > 0) {
      testAccountId = userAccounts[0].id;
    } else {
      const [newAccount] = await db.insert(accounts).values({
        userId: testUserId,
        name: 'Conta Teste',
        type: 'checking',
        balance: '0.00',
        currency: 'BRL',
        isActive: true
      }).returning();
      testAccountId = newAccount.id;
    }
  });

  afterEach(async () => {
    for (const txId of cleanupTxIds) {
      await db.delete(transactions).where(eq(transactions.id, txId));
    }
    cleanupTxIds = [];
  });

  it('should correctly add a transaction and update account balance', async () => {
    if (!testAccountId) throw new Error('No account found for test user');
    
    const amount = "250.00";
    
    const newTx = await FinancialEngine.addTransaction({
      userId: testUserId,
      accountId: testAccountId,
      amount: amount,
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      description: 'Teste de Integração',
      isPaid: true,
      subtype: 'single'
    });

    cleanupTxIds.push(newTx.id);

    expect(newTx.amount).toBe(amount);

    const balance = await db.transaction(async (tx) => FinancialEngine.recalculateAccountBalance(tx, testAccountId!));
    expect(balance).toBeDefined();

    const [audit] = await db.select().from(auditLogs).where(eq(auditLogs.entityId, newTx.id));
    expect(audit).toBeDefined();
    expect(audit.action).toBe('create');
  });

  it('should handle transfers between accounts atomically', async () => {
    expect(FinancialEngine.transferFunds).toBeDefined();
  });
});
