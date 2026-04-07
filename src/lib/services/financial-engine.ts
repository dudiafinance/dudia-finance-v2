import { db } from "@/lib/db";
import { 
  transactions, 
  accounts, 
  creditCards, 
  cardTransactions, 
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

    if (now.getDate() > card.closingDay) {
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
   * Registra uma contribuição em uma meta e atualiza o saldo atual da meta
   */
  static async addGoalContribution(data: {
    userId: string,
    goalId: string,
    month: number,
    year: number,
    amount: string,
    notes?: string
  }) {
    return await db.transaction(async (tx) => {
      const [newContribution] = await tx
        .insert(goalContributions)
        .values({
          ...data,
          originalAmount: data.amount,
          status: "paid",
        })
        .returning();

      await tx.update(goals)
        .set({ 
          currentAmount: sql`${goals.currentAmount} + ${data.amount}`,
          updatedAt: new Date()
        })
        .where(and(eq(goals.id, data.goalId), eq(goals.userId, data.userId)));

      await this.logAudit(tx, data.userId, "goal_contribution", newContribution.id, "create", null, newContribution);

      return newContribution;
    });
  }
}
