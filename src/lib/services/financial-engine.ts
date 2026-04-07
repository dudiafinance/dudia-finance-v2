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
   * Determina se uma transação de cartão deve afetar o 'usedAmount' atual
   * Baseado no dia de fechamento do cartão.
   */
  private static isTransactionInCurrentInvoice(card: any, txMonth: number, txYear: number): boolean {
    const now = new Date();
    let currentInvoiceMonth = now.getMonth() + 1;
    let currentInvoiceYear = now.getFullYear();

    if (now.getDate() >= card.closingDay) {
      currentInvoiceMonth++;
      if (currentInvoiceMonth > 12) {
        currentInvoiceMonth = 1;
        currentInvoiceYear++;
      }
    }

    return txMonth === currentInvoiceMonth && txYear === currentInvoiceYear;
  }

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
   * Adiciona uma transação comum e atualiza o saldo da conta
   */
  static async addTransaction(data: typeof transactions.$inferInsert) {
    return await db.transaction(async (tx) => {
      // 1. Inserir a transação
      const [newTx] = await tx.insert(transactions).values(data).returning();

      // 2. Atualizar o saldo da conta se for uma transação paga
      if (newTx.isPaid) {
        const amountChange = newTx.type === "income" ? newTx.amount : (Number(newTx.amount) * -1).toString();
        
        await tx.update(accounts)
          .set({ 
            balance: sql`${accounts.balance} + ${amountChange}`,
            updatedAt: new Date()
          })
          .where(eq(accounts.id, newTx.accountId));
      }

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

      // 2. Reverter o efeito da transação antiga no saldo (se estava paga)
      if (oldTx.isPaid) {
        const oldAmountChange = oldTx.type === "income" ? (Number(oldTx.amount) * -1).toString() : oldTx.amount;
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${oldAmountChange}` })
          .where(eq(accounts.id, oldTx.accountId));
      }

      // 3. Aplicar as atualizações
      const [newTx] = await tx.update(transactions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(transactions.id, id))
        .returning();

      // 4. Aplicar o novo efeito no saldo (se a nova transação estiver paga)
      if (newTx.isPaid) {
        const newAmountChange = newTx.type === "income" ? newTx.amount : (Number(newTx.amount) * -1).toString();
        await tx.update(accounts)
          .set({ 
            balance: sql`${accounts.balance} + ${newAmountChange}`,
            updatedAt: new Date()
          })
          .where(eq(accounts.id, newTx.accountId));
      }

      // 5. Auditoria
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

      // 1. Reverter saldo
      if (oldTx.isPaid) {
        const oldAmountChange = oldTx.type === "income" ? (Number(oldTx.amount) * -1).toString() : oldTx.amount;
        await tx.update(accounts)
          .set({ balance: sql`${accounts.balance} + ${oldAmountChange}` })
          .where(eq(accounts.id, oldTx.accountId));
      }

      // 2. Deletar
      await tx.delete(transactions).where(eq(transactions.id, id));

      // 3. Auditoria
      await this.logAudit(tx, userId, "transaction", id, "delete", oldTx, null);
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

      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} - ${data.amount}` })
        .where(eq(accounts.id, data.fromAccountId));

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

      await tx.update(accounts)
        .set({ balance: sql`${accounts.balance} + ${data.amount}` })
        .where(eq(accounts.id, data.toAccountId));

      // 3. Auditoria
      await this.logAudit(tx, data.userId, "transfer", linkedId, "transfer", null, { from: expense.id, to: income.id });

      return { expense, income };
    });
  }

  /**
   * Adiciona transação de cartão e atualiza o limite utilizado se for da fatura atual
   */
  static async addCardTransaction(data: typeof cardTransactions.$inferInsert) {
    return await db.transaction(async (tx) => {
      const [newTx] = await tx.insert(cardTransactions).values(data).returning();

      const [card] = await tx
        .select()
        .from(creditCards)
        .where(eq(creditCards.id, newTx.cardId))
        .limit(1);

      if (card && this.isTransactionInCurrentInvoice(card, newTx.invoiceMonth, newTx.invoiceYear)) {
        await tx.update(creditCards)
          .set({ 
            usedAmount: sql`${creditCards.usedAmount} + ${newTx.amount}`,
            updatedAt: new Date()
          })
          .where(eq(creditCards.id, newTx.cardId));
      }

      await this.logAudit(tx, newTx.userId, "card_transaction", newTx.id, "create", null, newTx);

      return newTx;
    });
  }

  /**
   * Remove uma transação de cartão e devolve o limite utilizado
   */
  static async deleteCardTransaction(id: string, userId: string) {
    return await db.transaction(async (tx) => {
      const [oldTx] = await tx.select().from(cardTransactions).where(and(eq(cardTransactions.id, id), eq(cardTransactions.userId, userId))).limit(1);
      if (!oldTx) throw new Error("Lançamento não encontrado");

      const [card] = await tx.select().from(creditCards).where(eq(creditCards.id, oldTx.cardId)).limit(1);

      // Reverter limite se for da fatura atual
      if (card && this.isTransactionInCurrentInvoice(card, oldTx.invoiceMonth, oldTx.invoiceYear)) {
        await tx.update(creditCards)
          .set({ usedAmount: sql`${creditCards.usedAmount} - ${oldTx.amount}` })
          .where(eq(creditCards.id, oldTx.cardId));
      }

      await tx.delete(cardTransactions).where(eq(cardTransactions.id, id));
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

      const [card] = await tx.select().from(creditCards).where(eq(creditCards.id, oldTx.cardId)).limit(1);

      // 1. Reverter limite antigo
      if (card && this.isTransactionInCurrentInvoice(card, oldTx.invoiceMonth, oldTx.invoiceYear)) {
        await tx.update(creditCards)
          .set({ usedAmount: sql`${creditCards.usedAmount} - ${oldTx.amount}` })
          .where(eq(creditCards.id, oldTx.cardId));
      }

      // 2. Lógica de Atualização em Massa (Group) + Cascade Shift
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

      // 3. Aplicar novo limite (após update)
      const [newTx] = await tx.select().from(cardTransactions).where(eq(cardTransactions.id, id)).limit(1);
      if (card && this.isTransactionInCurrentInvoice(card, newTx.invoiceMonth, newTx.invoiceYear)) {
        await tx.update(creditCards)
          .set({ usedAmount: sql`${creditCards.usedAmount} + ${newTx.amount}` })
          .where(eq(creditCards.id, newTx.cardId));
      }

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

      // 3. Reduzir limite utilizado do cartão (Abatimento)
      await tx.update(creditCards)
        .set({ usedAmount: sql`${creditCards.usedAmount} - ${data.amount}`, updatedAt: new Date() })
        .where(eq(creditCards.id, data.cardId));

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
        isPaid: true
      }).returning();

      // 2. Reduzir saldo da conta
      await tx.update(accounts)
        .set({ 
          balance: sql`${accounts.balance} - ${data.amount}`,
          updatedAt: new Date()
        })
        .where(eq(accounts.id, data.accountId));

      // 3. Aumentar valor atual da meta
      const [updatedGoal] = await tx.update(goals)
        .set({ 
          currentAmount: sql`${goals.currentAmount} + ${data.amount}`,
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
