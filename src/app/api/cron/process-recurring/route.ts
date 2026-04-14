import { db } from "@/lib/db";
import { recurringTransactions, budgets, notifications, transactions } from "@/lib/db/schema";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { cleanupOldIdempotencyKeys } from "@/lib/idempotency";
import { and, eq, lte, gte, isNull, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * Endpoint acionado pelo Vercel Cron para processar transações recorrentes.
 * Agendamento sugerido: Todo dia às 03:00.
 */
export async function GET(req: Request) {
  // 1. Validação de Segurança
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // 2. Buscar recorrências ativas que venceram até hoje
    const pendingRecurrences = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.isActive, true),
          lte(recurringTransactions.nextDueDate, todayStr)
        )
      );

    // Max 3 missed periods per recurrence to prevent bulk inserts after long outages
    const MAX_CATCH_UP = 3;

    logger.info(`[CRON] Processando ${pendingRecurrences.length} recorrências.`);

    const results = [];

    for (const rec of pendingRecurrences) {
      let catchUpCount = 0;
      let currentDueDate = rec.nextDueDate;

      try {
        // Process up to MAX_CATCH_UP missed periods per recurrence
        while (currentDueDate <= todayStr && catchUpCount < MAX_CATCH_UP) {
          catchUpCount++;

          // 3. Gerar a transação real via FinancialEngine (Atômico)
          const newTx = await FinancialEngine.addTransaction({
            userId: rec.userId,
            accountId: rec.accountId,
            categoryId: rec.categoryId,
            amount: rec.amount,
            type: rec.type,
            description: `[Recorrente] ${rec.description}`,
            date: currentDueDate,
            isPaid: true,
            subtype: "recurring",
            recurringId: rec.id,
          });

          results.push({ id: rec.id, status: "success", txId: newTx.id, date: currentDueDate });

          // 4. Calcular próxima data de vencimento
          currentDueDate = calculateNextDueDate(currentDueDate, rec.frequency, rec.interval ?? 1);
        }

        if (catchUpCount >= MAX_CATCH_UP && currentDueDate <= todayStr) {
          logger.warn(`[CRON] Recorrência ${rec.id} atingiu o limite de catch-up (${MAX_CATCH_UP}). nextDue atualizado para ${currentDueDate}.`);
        }

        // 5. Verificar se a recorrência deve ser desativada (endDate)
        let isActive = true;
        if (rec.endDate && currentDueDate > rec.endDate) {
          isActive = false;
        }

        // 6. Atualizar a recorrência para o próximo ciclo
        await db
          .update(recurringTransactions)
          .set({
            nextDueDate: currentDueDate,
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(recurringTransactions.id, rec.id));

      } catch (error) {
        logger.error(`[CRON] Erro ao processar recorrência ${rec.id}:`, error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        results.push({ id: rec.id, status: "error", message });
      }
    }

    // ==========================================
    // Budget Alert Processing
    // ==========================================
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const activeBudgets = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.isActive, true), eq(budgets.alertsEnabled, true)));

    let alertsCreated = 0;

    for (const budget of activeBudgets) {
      try {
        const conditions = [
          eq(transactions.userId, budget.userId),
          eq(transactions.type, "expense"),
          isNull(transactions.deletedAt),
          gte(transactions.date, startOfMonth),
          lte(transactions.date, endOfMonth),
        ] as Parameters<typeof and>;

        if (budget.categoryId) {
          conditions.push(eq(transactions.categoryId, budget.categoryId));
        }

        const [spending] = await db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(and(...conditions));

        const totalSpent = Number(spending?.total || 0);
        const budgetAmount = Number(budget.amount);
        const threshold = Number(budget.alertThreshold ?? 80);
        const spentPercent = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

        if (spentPercent >= threshold) {
          const notifTitle = `Alerta de Budget: ${budget.name}`;

          // Avoid duplicate alerts for the same budget in the same month
          const [existing] = await db
            .select({ id: notifications.id })
            .from(notifications)
            .where(and(
              eq(notifications.userId, budget.userId),
              eq(notifications.title, notifTitle),
              gte(notifications.createdAt, new Date(startOfMonth + "T00:00:00Z")),
            ))
            .limit(1);

          if (!existing) {
            await db.insert(notifications).values({
              userId: budget.userId,
              title: notifTitle,
              message: `Você utilizou ${spentPercent.toFixed(0)}% do budget "${budget.name}" (R$ ${totalSpent.toFixed(2)} de R$ ${budgetAmount.toFixed(2)}).`,
              type: spentPercent >= 100 ? "error" : "warning",
              isRead: false,
            });
            alertsCreated++;
          }
        }
      } catch (err) {
        logger.error(`[CRON] Erro ao verificar budget ${budget.id}:`, err);
      }
    }

    logger.info(`[CRON] Budget alerts gerados: ${alertsCreated}`);

    // Limpeza periódica de idempotency keys antigas (> 7 dias)
    const deletedKeys = await cleanupOldIdempotencyKeys();
    logger.info(`[CRON] Limpeza de idempotency_keys: ${deletedKeys} registros removidos.`);

    return NextResponse.json({
      processed: pendingRecurrences.length,
      results,
      budgetAlertsCreated: alertsCreated,
      cleanedIdempotencyKeys: deletedKeys,
    });
  } catch (error) {
    logger.error("[CRON] Erro crítico no worker:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * Auxiliar para cálculo de datas (pode ser movido para lib/utils se crescer)
 */
function calculateNextDueDate(currentDate: string, frequency: string, interval: number): string {
  const date = new Date(currentDate + "T12:00:00Z"); // Offset para evitar problemas de timezone

  switch (frequency) {
    case "daily":
      date.setUTCDate(date.getUTCDate() + interval);
      break;
    case "weekly":
      date.setUTCDate(date.getUTCDate() + interval * 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + interval);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() + interval);
      break;
    default:
      date.setUTCMonth(date.getUTCMonth() + 1);
  }

  return date.toISOString().split("T")[0];
}
