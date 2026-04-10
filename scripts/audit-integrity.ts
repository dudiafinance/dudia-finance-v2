import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { eq, and, isNull, sql, sum } from "drizzle-orm";

async function runAudit() {
  console.log("🔍 Iniciando Auditoria de Integridade de Dados...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
      console.error("DATABASE_URL não encontrado em .env.local");
      process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  // 1. Auditoria de Contas Bancárias
  console.log("\n--- Contas Bancárias ---");
  const allAccounts = await db.select().from(schema.accounts).where(isNull(schema.accounts.deletedAt));
  
  for (const acc of allAccounts) {
    const incomes = await db.select({ total: sum(schema.transactions.amount) })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.accountId, acc.id), eq(schema.transactions.type, 'income'), eq(schema.transactions.isPaid, true), isNull(schema.transactions.deletedAt)));
    
    const expenses = await db.select({ total: sum(schema.transactions.amount) })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.accountId, acc.id), eq(schema.transactions.type, 'expense'), eq(schema.transactions.isPaid, true), isNull(schema.transactions.deletedAt)));

    const calcBalance = Number(incomes[0]?.total || 0) - Number(expenses[0]?.total || 0);
    const dbBalance = Number(acc.balance);

    if (Math.abs(calcBalance - dbBalance) > 0.01) {
      console.error(`❌ DISCREPÂNCIA: Conta "${acc.name}" (ID: ${acc.id})`);
      console.error(`   Saldo no Banco: ${dbBalance} | Saldo Calculado: ${calcBalance}`);
    } else {
      console.log(`✅ Conta "${acc.name}": OK (R$ ${dbBalance})`);
    }
  }

  // 2. Auditoria de Cartões de Crédito
  console.log("\n--- Cartões de Crédito ---");
  const allCards = await db.select().from(schema.creditCards).where(isNull(schema.creditCards.deletedAt));

  for (const card of allCards) {
    const result = await db
      .select({ total: sum(schema.cardTransactions.amount) })
      .from(schema.cardTransactions)
      .leftJoin(
        schema.creditCardInvoices,
        and(
          eq(schema.creditCardInvoices.cardId, schema.cardTransactions.cardId),
          eq(schema.creditCardInvoices.month, schema.cardTransactions.invoiceMonth),
          eq(schema.creditCardInvoices.year, schema.cardTransactions.invoiceYear)
        )
      )
      .where(and(
        eq(schema.cardTransactions.cardId, card.id),
        isNull(schema.cardTransactions.deletedAt),
        sql`( ${schema.creditCardInvoices.status} IS NULL OR ${schema.creditCardInvoices.status} != 'PAGA' )`
      ));

    const calcUsed = Number(result[0]?.total || 0);
    const dbUsed = Number(card.usedAmount);

    if (Math.abs(calcUsed - dbUsed) > 0.01) {
      console.error(`❌ DISCREPÂNCIA: Cartão "${card.name}" (ID: ${card.id})`);
      console.error(`   Usado no Banco: ${dbUsed} | Usado Calculado: ${calcUsed}`);
    } else {
      console.log(`✅ Cartão "${card.name}": OK (R$ ${dbUsed})`);
    }
  }

  console.log("\n✅ Auditoria concluída.");
  await client.end();
  process.exit(0);
}

runAudit().catch(err => {
  console.error(err);
  process.exit(1);
});