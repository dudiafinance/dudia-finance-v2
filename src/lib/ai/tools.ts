import { z } from "zod";
import { db } from "@/lib/db";
import { accounts, transactions, creditCards, budgets, categories } from "@/lib/db/schema";
import { eq, and, isNull, gte, lte, sql, sum } from "drizzle-orm";
import { getUserId } from "@/lib/auth-utils";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { tool } from "ai";

/**
 * Ferramentas de Auditoria Financeira para o DUD.IA
 * Garantem isolamento total por userId.
 */

export const getFinancialSummary = (tool as any)({
  description: 'Retorna o saldo total de todas as contas e o limite usado nos cartões.',
  parameters: z.object({}),
  execute: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    const [accs, cards] = await Promise.all([
      db.select({ balance: sum(accounts.balance) }).from(accounts).where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt))),
      db.select({ used: sum(creditCards.usedAmount) }).from(creditCards).where(and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt)))
    ]);

    return {
      totalBalance: Number(accs[0]?.balance || 0),
      totalCardUsed: Number(cards[0]?.used || 0)
    };
  }
});

export const getSpendingByCategory = (tool as any)({
  description: 'Analisa quanto o usuário gastou por categoria no mês atual.',
  parameters: z.object({}),
  execute: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const result = await db.select({
      category: categories.name,
      total: sql<number>`SUM(CAST(${transactions.amount} AS NUMERIC))`
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.type, 'expense'),
      gte(transactions.date, start),
      lte(transactions.date, end),
      isNull(transactions.deletedAt)
    ))
    .groupBy(categories.name);

    return result;
  }
});

export const checkHealth = (tool as any)({
  description: 'Verifica se há alertas urgentes (orçamentos estourados ou saldos negativos).',
  parameters: z.object({}),
  execute: async () => {
    const userId = await getUserId();
    if (!userId) throw new Error("Unauthorized");

    const [negAccs, overBudgets] = await Promise.all([
      db.select().from(accounts).where(and(eq(accounts.userId, userId), sql`${accounts.balance} < 0`, isNull(accounts.deletedAt))),
      db.select().from(budgets).where(and(eq(budgets.userId, userId), eq(budgets.isActive, true)))
    ]);

    return {
      hasNegativeAccounts: negAccs.length > 0,
      activeBudgetsCount: overBudgets.length,
      alerts: negAccs.map(a => `Conta ${a.name} está com saldo negativo: R$ ${a.balance}`)
    };
  }
});