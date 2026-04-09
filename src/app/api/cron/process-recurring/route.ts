import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { and, eq, lte, sql } from "drizzle-orm";
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

    console.log(`[CRON] Processando ${pendingRecurrences.length} recorrências.`);

    const results = [];

    for (const rec of pendingRecurrences) {
      try {
        // 3. Gerar a transação real via FinancialEngine (Atômico)
        const newTx = await FinancialEngine.addTransaction({
          userId: rec.userId,
          accountId: rec.accountId,
          categoryId: rec.categoryId,
          amount: rec.amount,
          type: rec.type,
          description: `[Recorrente] ${rec.description}`,
          date: rec.nextDueDate, // Data do vencimento atual
          isPaid: true,
          subtype: "recurring",
          recurringId: rec.id,
        });

        // 4. Calcular próxima data de vencimento
        const nextDate = calculateNextDueDate(rec.nextDueDate, rec.frequency, rec.interval ?? 1);
        
        // 5. Verificar se a recorrência deve ser desativada (endDate)
        let isActive = true;
        if (rec.endDate && nextDate > rec.endDate) {
          isActive = false;
        }

        // 6. Atualizar a recorrência para o próximo ciclo
        await db
          .update(recurringTransactions)
          .set({
            nextDueDate: nextDate,
            isActive: isActive,
            updatedAt: new Date(),
          })
          .where(eq(recurringTransactions.id, rec.id));

        results.push({ id: rec.id, status: "success", txId: newTx.id });
      } catch (error: any) {
        console.error(`[CRON] Erro ao processar recorrência ${rec.id}:`, error);
        results.push({ id: rec.id, status: "error", message: error.message });
      }
    }

    return NextResponse.json({
      processed: pendingRecurrences.length,
      results,
    });
  } catch (error: any) {
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
