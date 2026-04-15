import { db } from "@/lib/db";
import {
  transactions,
  accounts,
  categories,
  creditCards,
  cardTransactions,
  creditCardInvoices,
  auditLogs,
  goals,
  goalContributions
} from "@/lib/db/schema";
import { eq, sql, and, isNull, inArray, gte } from "drizzle-orm";
import { FinancialError } from "@/lib/errors";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type FinancialAction = "create" | "update" | "delete" | "delete_all" | "transfer";

type CardTransactionUpdate = {
  description?: string;
  categoryId?: string | null;
  amount?: string;
  invoiceMonth?: number;
  invoiceYear?: number;
  isPending?: boolean;
  notes?: string;
  date?: string;
};

export class FinancialEngine {
  private static async assertAccountOwnership(tx: DbTransaction, userId: string, accountId: string) {
    const [account] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.deletedAt)))
      .limit(1);

    if (!account) throw FinancialError.notFound("Conta");
  }

  private static async assertCategoryOwnership(tx: DbTransaction, userId: string, categoryId?: string | null) {
    if (!categoryId) return;

    const [category] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (!category) throw FinancialError.notFound("Categoria");
  }

  private static async assertCardOwnership(tx: DbTransaction, userId: string, cardId: string) {
    const [card] = await tx
      .select({ id: creditCards.id })
      .from(creditCards)
      .where(and(eq(creditCards.id, cardId), eq(creditCards.userId, userId), isNull(creditCards.deletedAt)))
      .limit(1);

    if (!card) throw FinancialError.notFound("Cartão de crédito");
  }

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
      await this.assertAccountOwnership(tx, data.userId, data.accountId);
      await this.assertCategoryOwnership(tx, data.userId, data.categoryId ?? null);

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

  static async deleteTransaction(id: string, userId: string, deleteMode: 'single' | 'all' = 'single') {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
      if (!oldTx) throw FinancialError.notFound("Transação");

      // Handle delete all for recurring/fixed transactions
      if (deleteMode === 'all' && oldTx.recurringGroupId) {
        const allGroupTxs = await tx.select().from(transactions)
          .where(and(eq(transactions.recurringGroupId, oldTx.recurringGroupId), eq(transactions.userId, userId)));

        await tx.update(transactions)
          .set({ deletedAt: new Date() })
          .where(and(eq(transactions.recurringGroupId, oldTx.recurringGroupId), eq(transactions.userId, userId)));

        const accountIds = [...new Set(allGroupTxs.map(t => t.accountId))];
        for (const accId of accountIds) {
          await this.recalculateAccountBalance(tx, accId);
        }

        await this.logAudit(tx, userId, "transaction", id, "delete_all", { transactions: allGroupTxs }, null);
        return;
      }

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
      await this.assertCardOwnership(tx, data.userId, data.cardId);
      await this.assertCategoryOwnership(tx, data.userId, data.categoryId ?? null);

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
      const forbiddenKeys = new Set(["id", "userId", "createdAt", "groupId"]);
      const rawUpdateData = data as Record<string, unknown>;

      // Filtra apenas campos válidos que não sejam undefined
      const updateData: Partial<CardTransactionUpdate> = {};
      Object.entries(rawUpdateData).forEach(([key, value]) => {
        if (!forbiddenKeys.has(key) && value !== undefined) {
          (updateData as Record<string, unknown>)[key] = value;
        }
      });

      if (updateGroup && oldTx.groupId) {
        // Cálculo seguro do monthDelta para evitar NaN
        const newMonth = Number(updateData.invoiceMonth || oldTx.invoiceMonth);
        const newYear = Number(updateData.invoiceYear || oldTx.invoiceYear);
        const monthDelta = (newYear * 12 + newMonth) - (oldTx.invoiceYear * 12 + oldTx.invoiceMonth);

        // Busca parcelas do grupo a partir da parcela atual (currentInstallment >= oldTx.currentInstallment)
        const allGroup = await tx.select().from(cardTransactions)
          .where(and(
            eq(cardTransactions.groupId, oldTx.groupId),
            eq(cardTransactions.userId, userId),
            ...(oldTx.currentInstallment ? [gte(cardTransactions.currentInstallment, oldTx.currentInstallment)] : [])
          ));

        if (allGroup.length > 0) {
          // Parallel update: execu��o paralela para cada parcela afetada quando h�� mudan��a de m��s
          const ids = allGroup.map(item => item.id);

          if (monthDelta !== 0 && !isNaN(monthDelta)) {
            // Quando h�� mudan��a de m��s, cada parcela precisa de c��lculo individual — atualiza��o paralela
            await Promise.all(allGroup.map(item => {
              const totalMonths = (item.invoiceYear * 12 + item.invoiceMonth - 1) + monthDelta;
              const newM = (totalMonths % 12) + 1;
              const newY = Math.floor(totalMonths / 12);
              return tx.update(cardTransactions)
                .set({
                  description: updateData.description !== undefined ? String(updateData.description) : item.description,
                  categoryId: updateData.categoryId !== undefined ? (updateData.categoryId as string | null) : item.categoryId,
                  amount: updateData.amount ? String(updateData.amount) : item.amount,
                  invoiceMonth: newM,
                  invoiceYear: newY,
                  updatedAt: new Date(),
                })
                .where(eq(cardTransactions.id, item.id));
            }));
          } else {
            // Sem mudança de mês: um único UPDATE em batch para todos os ids afetados
            await tx.update(cardTransactions)
              .set({
                description: updateData.description !== undefined ? String(updateData.description) : oldTx.description,
                categoryId: updateData.categoryId !== undefined ? (updateData.categoryId as string | null) : oldTx.categoryId,
                amount: updateData.amount ? String(updateData.amount) : oldTx.amount,
                updatedAt: new Date(),
              })
              .where(and(inArray(cardTransactions.id, ids), eq(cardTransactions.userId, userId)));
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
      const [account] = await tx.select().from(accounts).where(and(eq(accounts.id, data.accountId), eq(accounts.userId, data.userId), isNull(accounts.deletedAt))).limit(1);
      if (!account) throw new Error("Conta bancária não encontrada");

      const [card] = await tx.select().from(creditCards).where(and(eq(creditCards.id, data.cardId), eq(creditCards.userId, data.userId), isNull(creditCards.deletedAt))).limit(1);
      if (!card) throw new Error("Cartão de crédito não encontrado");

      await this.assertCategoryOwnership(tx, data.userId, data.categoryId ?? null);

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

      await this.assertAccountOwnership(tx, data.userId, data.accountId);
      await this.assertCategoryOwnership(tx, data.userId, data.categoryId ?? null);

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
