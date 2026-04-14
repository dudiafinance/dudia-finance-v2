import { db } from '@/lib/db';
import { 
  users, accounts, categories, creditCards, cardTransactions, transactions,
  auditLogs, notifications, recurringTransactions, goalContributions, goals,
  budgets, creditCardInvoices, idempotencyKeys, tags
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function createTestUser(overrides = {}) {
  const [user] = await db.insert(users).values({
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    name: 'Test User',
    ...overrides,
  }).returning();
  return user;
}

export async function createTestAccount(userId: string, overrides = {}) {
  const [account] = await db.insert(accounts).values({
    userId,
    name: 'Test Account',
    type: 'checking',
    balance: '1000.00',
    ...overrides,
  }).returning();
  return account;
}

export async function createTestCategory(userId: string, overrides = {}) {
  const [category] = await db.insert(categories).values({
    userId,
    name: 'Test Category',
    type: 'expense',
    ...overrides,
  }).returning();
  return category;
}

export async function createTestCreditCard(userId: string, overrides = {}) {
  const [card] = await db.insert(creditCards).values({
    userId,
    name: 'Test Card',
    bank: 'TEST_BANK',
    limit: '5000.00',
    dueDay: 10,
    closingDay: 3,
    ...overrides,
  }).returning();
  return card;
}

export async function cleanupTestData(userId: string) {
  await db.delete(cardTransactions).where(eq(cardTransactions.userId, userId));
  await db.delete(creditCardInvoices).where(eq(creditCardInvoices.userId, userId));
  await db.delete(creditCards).where(eq(creditCards.userId, userId));
  await db.delete(transactions).where(eq(transactions.userId, userId));
  await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));
  await db.delete(goalContributions).where(eq(goalContributions.userId, userId));
  await db.delete(goals).where(eq(goals.userId, userId));
  await db.delete(budgets).where(eq(budgets.userId, userId));
  await db.delete(accounts).where(eq(accounts.userId, userId));
  await db.delete(categories).where(eq(categories.userId, userId));
  await db.delete(tags).where(eq(tags.userId, userId));
  await db.delete(notifications).where(eq(notifications.userId, userId));
  await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
  await db.delete(idempotencyKeys).where(eq(idempotencyKeys.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
