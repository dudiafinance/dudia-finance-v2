import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  auditLogs, idempotencyKeys, notifications, transactions,
  recurringTransactions, goalContributions, goals, budgets,
  cardTransactions, creditCardInvoices, creditCards, accounts,
  tags, categories
} from '../src/lib/db/schema/index';
import { eq, inArray } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const USER_ID = 'debfc4b5-45eb-45dc-90d3-30a83d4e1064';

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  console.log(`Resetando conta ${USER_ID}...`);

  const a1 = await db.delete(auditLogs).where(eq(auditLogs.userId, USER_ID)).returning({ id: auditLogs.id });
  console.log(`audit_logs: ${a1.length}`);

  const a2 = await db.delete(idempotencyKeys).where(eq(idempotencyKeys.userId, USER_ID)).returning({ id: idempotencyKeys.id });
  console.log(`idempotency_keys: ${a2.length}`);

  const a3 = await db.delete(notifications).where(eq(notifications.userId, USER_ID)).returning({ id: notifications.id });
  console.log(`notifications: ${a3.length}`);

  const a4 = await db.delete(transactions).where(eq(transactions.userId, USER_ID)).returning({ id: transactions.id });
  console.log(`transactions: ${a4.length}`);

  const a5 = await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, USER_ID)).returning({ id: recurringTransactions.id });
  console.log(`recurring_transactions: ${a5.length}`);

  const a6 = await db.delete(goalContributions).where(eq(goalContributions.userId, USER_ID)).returning({ id: goalContributions.id });
  console.log(`goal_contributions: ${a6.length}`);

  const a7 = await db.delete(goals).where(eq(goals.userId, USER_ID)).returning({ id: goals.id });
  console.log(`goals: ${a7.length}`);

  const a8 = await db.delete(budgets).where(eq(budgets.userId, USER_ID)).returning({ id: budgets.id });
  console.log(`budgets: ${a8.length}`);

  const a9 = await db.delete(cardTransactions).where(eq(cardTransactions.userId, USER_ID)).returning({ id: cardTransactions.id });
  console.log(`card_transactions: ${a9.length}`);

  const a10 = await db.delete(creditCardInvoices).where(eq(creditCardInvoices.userId, USER_ID)).returning({ id: creditCardInvoices.id });
  console.log(`credit_card_invoices: ${a10.length}`);

  const a11 = await db.delete(creditCards).where(eq(creditCards.userId, USER_ID)).returning({ id: creditCards.id });
  console.log(`credit_cards: ${a11.length}`);

  const a12 = await db.delete(accounts).where(eq(accounts.userId, USER_ID)).returning({ id: accounts.id });
  console.log(`accounts: ${a12.length}`);

  const a13 = await db.delete(tags).where(eq(tags.userId, USER_ID)).returning({ id: tags.id });
  console.log(`tags: ${a13.length}`);

  const allCats = await db.select({ id: categories.id, parentId: categories.parentId })
    .from(categories).where(eq(categories.userId, USER_ID));

  const subIds = allCats.filter(c => c.parentId !== null).map(c => c.id);
  if (subIds.length > 0) await db.delete(categories).where(inArray(categories.id, subIds));

  const parentIds = allCats.filter(c => c.parentId === null).map(c => c.id);
  if (parentIds.length > 0) await db.delete(categories).where(inArray(categories.id, parentIds));
  console.log(`categories: ${allCats.length}`);

  console.log('\nConta zerada com sucesso.');
  await client.end();
}

main().catch(err => { console.error('Erro:', err.message); process.exit(1); });
