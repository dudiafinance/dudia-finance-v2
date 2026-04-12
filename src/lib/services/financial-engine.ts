import { db } from "@/lib/db";
import {
  transactions,
  accounts,
  creditCards,
  cardTransactions,
  creditCardInvoices,
  auditLogs,
  goals,
  goalContributions
} from "@/lib/db/schema";
import { eq, sql, and, isNull } from "drizzle-orm";
import { FinancialError } from "@/lib/errors";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type FinancialAction = "create" | "update" | "delete" | "transfer";

export class FinancialEngine {
  /**
   * Registra um log de auditoria para cada operação financeira
   */
  private static async logAudit(
    tx: DbTransaction,
    userId: string,
    entityType: string,
    entityId: string,
    action: FinancialAction,
    oldValue: Record<string, unknown> | null = null,
    newValue: Record<string, unknown> | null = null
  ) {
    await tx.insert(auditLogs).values({
      userId,
      entityType,
      entityId,
      action,
      oldValue,
      newValue,
    });
  }

  /**
   * Recalcula atômicamente o saldo de uma conta a partir de todo o histórico de transações pagas.
   * Self-Healing Mechanism.
   */
  static async recalculateAccountBalance(tx: DbTransaction, accountId: string) {
    const incomes = await tx
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId), 
          eq(transactions.isPaid, true), 
          eq(transactions.type, 'income'),
          isNull(transactions.deletedAt)
        )
      );

    const expenses = await tx
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId), 
          eq(transactions.isPaid, true), 
          eq(transactions.type, 'expense'),
          isNull(transactions.deletedAt)
        )
      );

    const totalIncome = Number(incomes[0]?.total ?? 0);
    const totalExpense = Number(expenses[0]?.total ?? 0);
    
    // Precisão matemática garantida via arredondamento de centavos
    const newBalance = Math.round((totalIncome - totalExpense) * 100) / 100;

    await tx.update(accounts)
      .set({ 
        balance: newBalance.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(accounts.id, accountId));

    return newBalance;
  }

  static async addTransaction(data: typeof transactions.$inferInsert) {
    return await db.transaction(async (tx) => {
      const [newTx] = await tx.insert(transactions).values(data).returning();
      await this.recalculateAccountBalance(tx, newTx.accountId);
      await this.logAudit(tx, newTx.userId, "transaction", newTx.id, "create", null, newTx);
      return newTx;
    });
  }

  static async updateTransaction(id: string, userId: string, data: Partial<typeof transactions.$inferInsert>) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
      if (!oldTx) throw FinancialError.notFound("Transação");

      const [newTx] = await tx.update(transactions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(transactions.id, id))
        .returning();

      await this.recalculateAccountBalance(tx, newTx.accountId);
      
      if (oldTx.accountId !== newTx.accountId) {
        await this.recalculateAccountBalance(tx, oldTx.accountId);
      }

      await this.logAudit(tx, userId, "transaction", id, "update", oldTx, newTx);
      return newTx;
    });
  }

  static async deleteTransaction(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
      if (!oldTx) throw FinancialError.notFound("Transação");

      if (oldTx.linkedTransactionId && oldTx.subtype === 'transfer') {
        const linkedTxs = await tx.select().from(transactions).where(eq(transactions.linkedTransactionId, oldTx.linkedTransactionId));

        // Soft delete both legs of the transfer to preserve audit trail
        await tx.update(transactions)
          .set({ deletedAt: new Date() })
          .where(eq(transactions.linkedTransactionId, oldTx.linkedTransactionId));

        const accountIdsToRecalculate = [...new Set(linkedTxs.map(t => t.accountId))];
        for (const accId of accountIdsToRecalculate) {
          await this.recalculateAccountBalance(tx, accId);
        }

        await this.logAudit(tx, userId, "transfer", oldTx.linkedTransactionId, "delete", { transactions: linkedTxs }, null);
      } else {
        await tx.update(transactions)
          .set({ deletedAt: new Date() })
          .where(eq(transactions.id, id));

        await this.recalculateAccountBalance(tx, oldTx.accountId);

        if (oldTx.goalId) {
          await tx.update(goals)
            .set({ 
              currentAmount: sql`${goals.currentAmount} - ${oldTx.amount}`,
              updatedAt: new Date()
            })
            .where(eq(goals.id, oldTx.goalId));
        }

        await this.logAudit(tx, userId, "transaction", id, "delete", oldTx, null);
      }
    });
  }

  static async transferFunds(data: {
    userId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: string,
    description: string,
    date: string,
    categoryId?: string
  }) {
    return await db.transaction(async (tx) => {
      const [fromAccount] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, data.fromAccountId), 
            eq(accounts.userId, data.userId),
            isNull(accounts.deletedAt)
          )
        )
        .limit(1);

      if (!fromAccount) throw FinancialError.notFound("Conta de origem");

      // BUG-003: Validate destination account belongs to the same user
      const [toAccount] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.id, data.toAccountId),
            eq(accounts.userId, data.userId),
            isNull(accounts.deletedAt)
          )
        )
        .limit(1);

      if (!toAccount) throw FinancialError.notFound("Conta de destino");

      const balance = Number(fromAccount.balance);
      const amount = Number(data.amount);

      if (balance < amount) {
        throw FinancialError.insufficientFunds(balance, amount);
      }

      const linkedId = crypto.randomUUID();

      const [expense] = await tx.insert(transactions).values({
        userId: data.userId,
        accountId: data.fromAccountId,
        categoryId: data.categoryId,
        amount: data.amount,
        type: "expense",
        subtype: "transfer",
        description: `Saída: ${data.description}`,
        date: data.date,
        isPaid: true,
        linkedTransactionId: linkedId
      }).returning();

      const [income] = await tx.insert(transactions).values({
        userId: data.userId,
        accountId: data.toAccountId,
        categoryId: data.categoryId,
        amount: data.amount,
        type: "income",
        subtype: "transfer",
        description: `Entrada: ${data.description}`,
        date: data.date,
        isPaid: true,
        linkedTransactionId: linkedId
      }).returning();

      await this.recalculateAccountBalance(tx, data.fromAccountId);
      await this.recalculateAccountBalance(tx, data.toAccountId);
      await this.logAudit(tx, data.userId, "transfer", linkedId, "transfer", null, { from: expense.id, to: income.id });

      return { expense, income };
    });
  }

  static async recalculateCardLimit(tx: DbTransaction, cardId: string) {
    // BUG-009: Only include current and past months to avoid inflating limit with future installments
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const result = await tx
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${cardTransactions.amount} AS DECIMAL(15,2))), 0)`,
      })
      .from(cardTransactions)
      .leftJoin(
        creditCardInvoices,
        and(
          eq(creditCardInvoices.cardId, cardTransactions.cardId),
          eq(creditCardInvoices.month, cardTransactions.invoiceMonth),
          eq(creditCardInvoices.year, cardTransactions.invoiceYear)
        )
      )
      .where(
        and(
          eq(cardTransactions.cardId, cardId),
          isNull(cardTransactions.deletedAt),
          sql`( ${creditCardInvoices.status} IS NULL OR ${creditCardInvoices.status} != 'PAGA' )`,
          // Only include transactions from current and past months
          sql`(
            ${cardTransactions.invoiceYear} < ${currentYear}
            OR (
              ${cardTransactions.invoiceYear} = ${currentYear}
              AND ${cardTransactions.invoiceMonth} <= ${currentMonth}
            )
          )`
        )
      );

    const usedAmount = result[0]?.total ?? "0";

    await tx
      .update(creditCards)
      .set({ usedAmount, updatedAt: new Date() })
      .where(eq(creditCards.id, cardId));
  }

  static async forceUserSync(userId: string) {
    return await db.transaction(async (tx) => {
      const userAccounts = await tx.select().from(accounts).where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt)));
      const userCards = await tx.select().from(creditCards).where(and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt)));

      for (const acc of userAccounts) {
        await this.recalculateAccountBalance(tx, acc.id);
      }

      for (const card of userCards) {
        await this.recalculateCardLimit(tx, card.id);
      }

      return { accounts: userAccounts.length, cards: userCards.length };
    });
  }

  static async addCardTransaction(data: typeof cardTransactions.$inferInsert, externalTx?: DbTransaction) {
    const execute = async (tx: DbTransaction) => {
      const [newTx] = await tx.insert(cardTransactions).values(data).returning();
      await this.recalculateCardLimit(tx, newTx.cardId);
      await this.logAudit(tx, newTx.userId, "card_transaction", newTx.id, "create", null, newTx);
      return newTx;
    };

    if (externalTx) return await execute(externalTx);
    return await db.transaction(execute);
  }

  static async deleteCardTransaction(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(cardTransactions).where(and(eq(cardTransactions.id, id), eq(cardTransactions.userId, userId))).limit(1);
      if (!oldTx) throw new Error("Lançamento não encontrado");

      await tx.update(cardTransactions).set({ deletedAt: new Date() }).where(eq(cardTransactions.id, id));
      await this.recalculateCardLimit(tx, oldTx.cardId);
      await this.logAudit(tx, userId, "card_transaction", id, "delete", oldTx, null);
    });
  }

  static async updateCardTransaction(id: string, userId: string, data: Record<string, unknown>, updateGroup: boolean = false) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(cardTransactions).where(and(eq(cardTransactions.id, id), eq(cardTransactions.userId, userId))).limit(1);
      if (!oldTx) throw new Error("Lançamento não encontrado");

      // Higienização rigorosa dos dados para evitar update de colunas restritas
      const { id: _, userId: __, createdAt: ___, groupId: ____, ...rawUpdateData } = data as any;
      
      // Filtra apenas campos que não sejam undefined
      const updateData: any = {};
      Object.keys(rawUpdateData).forEach(key => {
        if (rawUpdateData[key] !== undefined) {
          updateData[key] = rawUpdateData[key];
        }
      });

      if (updateGroup && oldTx.groupId) {
        // Cálculo seguro do monthDelta para evitar NaN
        const newMonth = Number(updateData.invoiceMonth || oldTx.invoiceMonth);
        const newYear = Number(updateData.invoiceYear || oldTx.invoiceYear);
        const monthDelta = (newYear * 12 + newMonth) - (oldTx.invoiceYear * 12 + oldTx.invoiceMonth);

        const allGroup = await tx.select().from(cardTransactions)
          .where(and(eq(cardTransactions.groupId, oldTx.groupId), eq(cardTransactions.userId, userId)));

        for (const item of allGroup) {
          if (item.currentInstallment && oldTx.currentInstallment && item.currentInstallment >= oldTx.currentInstallment) {
            let newM = item.invoiceMonth;
            let newY = item.invoiceYear;

            if (monthDelta !== 0 && !isNaN(monthDelta)) {
              const totalMonths = (item.invoiceYear * 12 + item.invoiceMonth - 1) + monthDelta;
              newM = (totalMonths % 12) + 1;
              newY = Math.floor(totalMonths / 12);
            }

            await tx.update(cardTransactions)
              .set({
                description: String(updateData.description ?? item.description),
                categoryId: updateData.categoryId !== undefined ? updateData.categoryId : item.categoryId,
                amount: updateData.amount ? String(updateData.amount) : item.amount,
                invoiceMonth: newM,
                invoiceYear: newY,
                updatedAt: new Date(),
              })
              .where(eq(cardTransactions.id, item.id));
          }
        }
      } else {
        // Update simples higienizado
        await tx.update(cardTransactions)
          .set({ ...updateData, updatedAt: new Date() })
          .where(and(eq(cardTransactions.id, id), eq(cardTransactions.userId, userId)));
      }

      await this.recalculateCardLimit(tx, oldTx.cardId);
      const [newTx] = await tx.select().from(cardTransactions).where(eq(cardTransactions.id, id)).limit(1);
      await this.logAudit(tx, userId, "card_transaction", id, "update", oldTx, newTx);
      return newTx;
    });
  }

  static async payCardInvoice(data: {
    userId: string,
    cardId: string,
    accountId: string,
    amount: string,
    description: string,
    date: string,
    month?: number,
    year?: number,
    categoryId?: string
  }) {
    return await db.transaction(async (tx) => {
      const [account] = await tx.select().from(accounts).where(and(eq(accounts.id, data.accountId), eq(accounts.userId, data.userId))).limit(1);
      if (!account) throw new Error("Conta bancária não encontrada");

      const [card] = await tx.select().from(creditCards).where(and(eq(creditCards.id, data.cardId), eq(creditCards.userId, data.userId))).limit(1);
      if (!card) throw new Error("Cartão de crédito não encontrado");

      const paymentAmount = Number(data.amount);
      if (Number(account.balance) < paymentAmount) throw new Error("Saldo insuficiente");

      const [bankTx] = await tx.insert(transactions).values({
        userId: data.userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        amount: data.amount,
        type: "expense",
        subtype: "card_payment",
        description: `Pagamento: ${data.description}`,
        date: data.date,
        isPaid: true
      }).returning();

      // Use self-healing recalculate instead of direct SQL mutation
      await this.recalculateAccountBalance(tx, data.accountId);

      if (data.month && data.year) {
        const [existing] = await tx.select().from(creditCardInvoices).where(and(eq(creditCardInvoices.cardId, data.cardId), eq(creditCardInvoices.month, data.month), eq(creditCardInvoices.year, data.year))).limit(1);
        if (existing) await tx.update(creditCardInvoices).set({ status: "PAGA", updatedAt: new Date() }).where(eq(creditCardInvoices.id, existing.id));
        else await tx.insert(creditCardInvoices).values({ cardId: data.cardId, userId: data.userId, month: data.month, year: data.year, status: "PAGA" });
      }

      await this.recalculateCardLimit(tx, data.cardId);
      await this.logAudit(tx, data.userId, "credit_card", data.cardId, "update", null, { payment: data.amount });
      return bankTx;
    });
  }

  static async depositToGoal(data: {
    userId: string,
    goalId: string,
    accountId: string,
    amount: string,
    description: string,
    date: string,
    categoryId?: string
  }) {
    return await db.transaction(async (tx) => {
      const [goal] = await tx.select().from(goals).where(and(eq(goals.id, data.goalId), eq(goals.userId, data.userId))).limit(1);
      if (!goal) throw new Error("Meta não encontrada");

      // BUG-004: Cap deposit at target amount
      if (goal.targetAmount) {
        const currentAmount = Number(goal.currentAmount);
        const depositAmount = Number(data.amount);
        const targetAmount = Number(goal.targetAmount);
        const remaining = targetAmount - currentAmount;
        if (depositAmount > remaining) {
          throw new Error(`Depósito ultrapassa a meta. Valor máximo permitido: R$ ${remaining.toFixed(2)}`);
        }
      }

      const [expense] = await tx.insert(transactions).values({
        userId: data.userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        amount: data.amount,
        type: "expense",
        subtype: "goal_deposit",
        description: `Objetivo: ${data.description}`,
        date: data.date,
        isPaid: true,
        goalId: data.goalId
      }).returning();

      // Use self-healing recalculate instead of direct SQL mutation
      await this.recalculateAccountBalance(tx, data.accountId);

      // BUG-005: Atomic SQL update to prevent race condition on concurrent deposits
      const [updatedGoal] = await tx.update(goals)
        .set({
          currentAmount: sql`CAST(${goals.currentAmount} AS DECIMAL(15,2)) + CAST(${data.amount} AS DECIMAL(15,2))`,
          updatedAt: new Date()
        })
        .where(eq(goals.id, data.goalId))
        .returning();

      const d = new Date(data.date);
      await tx.insert(goalContributions).values({ userId: data.userId, goalId: data.goalId, month: d.getMonth() + 1, year: d.getFullYear(), amount: data.amount, originalAmount: data.amount, status: "paid" });

      await this.logAudit(tx, data.userId, "goal", data.goalId, "update", null, { deposit: data.amount });
      return { expense, goal: updatedGoal };
    });
  }
}
