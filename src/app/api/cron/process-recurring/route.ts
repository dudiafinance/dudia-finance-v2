import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { and, eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";

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

    console.log(`[CRON] Processando ${pendingRecurrences.length} recorrências.`);

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
          console.warn(`[CRON] Recorrência ${rec.id} atingiu o limite de catch-up (${MAX_CATCH_UP}). nextDue atualizado para ${currentDueDate}.`);
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
        console.error(`[CRON] Erro ao processar recorrência ${rec.id}:`, error);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        results.push({ id: rec.id, status: "error", message });
      }
    }

    return NextResponse.json({
      processed: pendingRecurrences.length,
      results,
    });
  } catch (error) {
    console.error("[CRON] Erro crítico no worker:", error);
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
