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
import { eq, sql, and } from "drizzle-orm";

export type FinancialAction = "create" | "update" | "delete" | "transfer";

export class FinancialEngine {
  /**
   * Registra um log de auditoria para cada operação financeira
   */
  private static async logAudit(
    tx: any,
    userId: string,
    entityType: string,
    entityId: string,
    action: FinancialAction,
    oldValue: any = null,
    newValue: any = null
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
  static async recalculateAccountBalance(tx: any, accountId: string) {
    const incomes = await tx
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`
      })
      .from(transactions)
      .where(and(eq(transactions.accountId, accountId), eq(transactions.isPaid, true), eq(transactions.type, 'income')));

    const expenses = await tx
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`
      })
      .from(transactions)
      .where(and(eq(transactions.accountId, accountId), eq(transactions.isPaid, true), eq(transactions.type, 'expense')));

    const totalIncome = Number(incomes[0]?.total ?? 0);
    const totalExpense = Number(expenses[0]?.total ?? 0);
    const newBalance = totalIncome - totalExpense;

    await tx.update(accounts)
      .set({ 
        balance: String(newBalance),
        updatedAt: new Date()
      })
      .where(eq(accounts.id, accountId));

    return newBalance;
  }

  static async addTransaction(data: typeof transactions.$inferInsert) {
    return await db.transaction(async (tx) => {
      // 1. Inserir a transação
      const [newTx] = await tx.insert(transactions).values(data).returning();

      // 2. Recalcular o saldo da conta atômicamente (Self-Healing)
      await this.recalculateAccountBalance(tx, newTx.accountId);

      // 3. Registrar auditoria
      await this.logAudit(tx, newTx.userId, "transaction", newTx.id, "create", null, newTx);

      return newTx;
    });
  }

  /**
   * Atualiza uma transação e recalcula o saldo da conta (Reversão + Novo Valor)
   */
  static async updateTransaction(id: string, userId: string, data: Partial<typeof transactions.$inferInsert>) {
    return await db.transaction(async (tx) => {
      // 1. Obter a transação antiga
      const [oldTx] = await tx.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
      if (!oldTx) throw new Error("Transação não encontrada");

      // 2. Aplicar as atualizações
      const [newTx] = await tx.update(transactions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(transactions.id, id))
        .returning();

      // 3. Recalcular saldos (Self-Healing)
      await this.recalculateAccountBalance(tx, newTx.accountId);
      
      // Se a conta mudou, recalcula a antiga também
      if (oldTx.accountId !== newTx.accountId) {
        await this.recalculateAccountBalance(tx, oldTx.accountId);
      }

      // 4. Auditoria
      await this.logAudit(tx, userId, "transaction", id, "update", oldTx, newTx);

      return newTx;
    });
  }

  /**
   * Deleta uma transação e reverte o saldo
   */
  static async deleteTransaction(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))).limit(1);
      if (!oldTx) throw new Error("Transação não encontrada");

      // Se for parte de uma transferência, apagar a transação vinculada também
      if (oldTx.linkedTransactionId && oldTx.subtype === 'transfer') {
        const linkedTxs = await tx.select().from(transactions).where(eq(transactions.linkedTransactionId, oldTx.linkedTransactionId));
        
        await tx.delete(transactions).where(eq(transactions.linkedTransactionId, oldTx.linkedTransactionId));
        
        // Recalcular saldos para todas as contas envolvidas (Self-Healing)
        const accountIdsToRecalculate = [...new Set(linkedTxs.map(t => t.accountId))];
        for (const accId of accountIdsToRecalculate) {
          await this.recalculateAccountBalance(tx, accId);
        }

        // Auditoria
        await this.logAudit(tx, userId, "transfer", oldTx.linkedTransactionId, "delete", linkedTxs, null);
      } else {
        // 1. Deletar a transação
        await tx.delete(transactions).where(eq(transactions.id, id));

        // 2. Recalcular o saldo da conta (Self-Healing)
        await this.recalculateAccountBalance(tx, oldTx.accountId);

        // 2b. Reverter saldo da meta (se for um depósito de meta)
        if (oldTx.goalId) {
          await tx.update(goals)
            .set({ 
              currentAmount: sql`${goals.currentAmount} - ${oldTx.amount}`,
              updatedAt: new Date()
            })
            .where(eq(goals.id, oldTx.goalId));
        }

        // 3. Auditoria
        await this.logAudit(tx, userId, "transaction", id, "delete", oldTx, null);
      }
    });
  }

  /**
   * Realiza uma transferência entre contas (Atômica)
   */
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
        .where(and(eq(accounts.id, data.fromAccountId), eq(accounts.userId, data.userId)))
        .limit(1);

      if (!fromAccount) throw new Error("Conta de origem não encontrada");

      const balance = Number(fromAccount.balance);
      const amount = Number(data.amount);

      if (balance < amount) {
        throw new Error(`Saldo insuficiente. Disponível: ${balance.toFixed(2)}, Necessário: ${amount.toFixed(2)}`);
      }

      const linkedId = crypto.randomUUID();

      // 1. Saída (Expense) na conta de origem
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

      // 2. Entrada (Income) na conta de destino
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

      // 3. Recalcular saldos (Self-Healing)
      await this.recalculateAccountBalance(tx, data.fromAccountId);
      await this.recalculateAccountBalance(tx, data.toAccountId);

      // 4. Auditoria
      await this.logAudit(tx, data.userId, "transfer", linkedId, "transfer", null, { from: expense.id, to: income.id });

      return { expense, income };
    });
  }

  /**
   * Recalcula o limite utilizado do cartão somando todas as transações de faturas NÃO PAGAS.
   */
  static async recalculateCardLimit(tx: any, cardId: string) {
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
          sql`( ${creditCardInvoices.status} IS NULL OR ${creditCardInvoices.status} != 'PAGA' )`
        )
      );

    const usedAmount = result[0]?.total ?? "0";

    await tx
      .update(creditCards)
      .set({ usedAmount, updatedAt: new Date() })
      .where(eq(creditCards.id, cardId));
  }

  /**
   * Adiciona transação de cartão e recalcula o limite
   */
  static async addCardTransaction(data: typeof cardTransactions.$inferInsert, externalTx?: any) {
    const execute = async (tx: any) => {
      const [newTx] = await tx.insert(cardTransactions).values(data).returning();
      await this.recalculateCardLimit(tx, newTx.cardId);
      await this.logAudit(tx, newTx.userId, "card_transaction", newTx.id, "create", null, newTx);
      return newTx;
    };

    if (externalTx) return await execute(externalTx);
    return await db.transaction(execute);
  }

  /**
   * Remove uma transação de cartão e recalcula limite
   */
  static async deleteCardTransaction(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(cardTransactions).where(and(eq(cardTransactions.id, id), eq(cardTransactions.userId, userId))).limit(1);
      if (!oldTx) throw new Error("Lançamento não encontrado");

      await tx.delete(cardTransactions).where(eq(cardTransactions.id, id));
      
      await this.recalculateCardLimit(tx, oldTx.cardId);
      await this.logAudit(tx, userId, "card_transaction", id, "delete", oldTx, null);
    });
  }

  /**
   * Atualiza transação de cartão com suporte a edição em massa e deslocamento de faturas
   */
  static async updateCardTransaction(id: string, userId: string, data: any, updateGroup: boolean = false) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(cardTransactions).where(and(eq(cardTransactions.id, id), eq(cardTransactions.userId, userId))).limit(1);
      if (!oldTx) throw new Error("Lançamento não encontrado");

      // 1. Lógica de Atualização em Massa (Group) + Cascade Shift
      if (updateGroup && oldTx.groupId) {
        const monthDelta = (data.invoiceMonth && data.invoiceYear) 
          ? (data.invoiceYear * 12 + data.invoiceMonth) - (oldTx.invoiceYear * 12 + oldTx.invoiceMonth)
          : 0;

        const allGroup = await tx.select().from(cardTransactions)
          .where(and(eq(cardTransactions.groupId, oldTx.groupId), eq(cardTransactions.userId, userId)));

        for (const item of allGroup) {
          // Apenas parcelas iguais ou futuras em relação à editada
          if (item.currentInstallment && oldTx.currentInstallment && item.currentInstallment >= oldTx.currentInstallment) {
            let newM = item.invoiceMonth;
            let newY = item.invoiceYear;

            if (monthDelta !== 0) {
              const totalMonths = (item.invoiceYear * 12 + item.invoiceMonth - 1) + monthDelta;
              newM = (totalMonths % 12) + 1;
              newY = Math.floor(totalMonths / 12);
            }

            await tx.update(cardTransactions)
              .set({
                description: data.description ?? item.description,
                categoryId: data.categoryId ?? item.categoryId,
                amount: data.amount ?? item.amount,
                invoiceMonth: newM,
                invoiceYear: newY,
                updatedAt: new Date(),
              })
              .where(eq(cardTransactions.id, item.id));
          }
        }
      } else {
        // Atualização Única
        await tx.update(cardTransactions)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(cardTransactions.id, id));
      }

      // 2. Recalcular limite após updates
      await this.recalculateCardLimit(tx, oldTx.cardId);

      const [newTx] = await tx.select().from(cardTransactions).where(eq(cardTransactions.id, id)).limit(1);
      await this.logAudit(tx, userId, "card_transaction", id, "update", oldTx, newTx);
      return newTx;
    });
  }

  /**
   * Paga uma fatura de cartão usando saldo de uma conta bancária
   */
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
      const [account] = await tx
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, data.accountId), eq(accounts.userId, data.userId)))
        .limit(1);

      if (!account) throw new Error("Conta bancária não encontrada");

      const [card] = await tx
        .select()
        .from(creditCards)
        .where(and(eq(creditCards.id, data.cardId), eq(creditCards.userId, data.userId)))
        .limit(1);

      if (!card) throw new Error("Cartão de crédito não encontrado");

      const paymentAmount = Number(data.amount);
      const accountBalance = Number(account.balance);
      const usedAmount = Number(card.usedAmount);

      if (accountBalance < paymentAmount) {
        throw new Error(`Saldo insuficiente na conta. Disponível: ${accountBalance.toFixed(2)}, Necessário: ${paymentAmount.toFixed(2)}`);
      }

      if (usedAmount < paymentAmount) {
        throw new Error(`Valor do pagamento excede o limite utilizado. Limite usado: ${usedAmount.toFixed(2)}, Pagamento: ${paymentAmount.toFixed(2)}`);
      }

      // 1. Criar transação de saída na conta bancária
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

      // 2. Deduzir saldo da conta
      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} - ${data.amount}`, updatedAt: new Date() })
        .where(eq(accounts.id, data.accountId));

      // 4. Marcar fatura como PAGA se mês/ano fornecidos
      if (data.month && data.year) {
        const [existing] = await tx
          .select()
          .from(creditCardInvoices)
          .where(
            and(
              eq(creditCardInvoices.cardId, data.cardId),
              eq(creditCardInvoices.userId, data.userId),
              eq(creditCardInvoices.month, data.month),
              eq(creditCardInvoices.year, data.year)
            )
          )
          .limit(1);

        if (existing) {
          await tx.update(creditCardInvoices)
            .set({ status: "PAGA", updatedAt: new Date() })
            .where(eq(creditCardInvoices.id, existing.id));
        } else {
          await tx.insert(creditCardInvoices).values({
            cardId: data.cardId,
            userId: data.userId,
            month: data.month,
            year: data.year,
            status: "PAGA",
          });
        }
      }

      // 5. Recalcular limite usando a função global agregada (abate automático das faturas pagas)
      await this.recalculateCardLimit(tx, data.cardId);

      await this.logAudit(tx, data.userId, "credit_card", data.cardId, "update", null, { payment: data.amount, month: data.month, year: data.year });
      
      return bankTx;
    });
  }

  /**
   * Realiza um depósito em uma meta vindo de uma conta bancária (Atômico)
   */
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
      // 0. Validar targetAmount antes de depositar
      const [goal] = await tx.select().from(goals).where(and(eq(goals.id, data.goalId), eq(goals.userId, data.userId))).limit(1);
      if (!goal) throw new Error("Meta não encontrada");
      
      if (goal.targetAmount !== null && goal.targetAmount !== undefined) {
        const newAmount = Number(goal.currentAmount) + Number(data.amount);
        if (newAmount > Number(goal.targetAmount)) {
          throw new Error(`Depósito excede o valor alvo. Valor atual: ${goal.currentAmount}, Alvo: ${goal.targetAmount}, Depósito: ${data.amount}`);
        }
      }

      // 1. Criar transação de saída na conta
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
        goalId: data.goalId // Vínculo explícito para reversão se deletada
      }).returning();

      // 2. Reduzir saldo da conta
      await tx.update(accounts)
        .set({ 
          balance: sql`${accounts.balance} - ${data.amount}`,
          updatedAt: new Date()
        })
        .where(eq(accounts.id, data.accountId));

      // 3. Aumentar valor atual da meta
      const newCurrentAmount = Number(goal.currentAmount) + Number(data.amount);
      let newStatus = goal.status;
      if (goal.targetAmount !== null && goal.targetAmount !== undefined && newCurrentAmount >= Number(goal.targetAmount)) {
        newStatus = "completed";
      }

      const [updatedGoal] = await tx.update(goals)
        .set({ 
          currentAmount: String(newCurrentAmount),
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(goals.id, data.goalId))
        .returning();

      // 4. Registrar contribuição (opcional para histórico detalhado)
      const d = new Date(data.date);
      await tx.insert(goalContributions).values({
        userId: data.userId,
        goalId: data.goalId,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        amount: data.amount,
        originalAmount: data.amount,
        status: "paid",
        notes: `Depósito via ${data.description}`
      });

      // 5. Auditoria
      await this.logAudit(tx, data.userId, "goal", data.goalId, "update", null, { deposit: data.amount, accountId: data.accountId });

      return { expense, goal: updatedGoal };
    });
  }
}
