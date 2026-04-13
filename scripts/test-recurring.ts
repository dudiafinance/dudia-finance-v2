import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { recurringTransactions } from "@/lib/db/schema";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { and, eq, lte } from "drizzle-orm";

const MAX_CATCH_UP = 3;

async function testRecurringTransactions() {
  console.log("\n=== TESTE DE TRANSAÇÕES RECORRENTES ===\n");

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  console.log(`Data de execução: ${now.toISOString()}`);
  console.log(`Today string: ${todayStr}\n`);

  try {
    const pendingRecurrences = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.isActive, true),
          lte(recurringTransactions.nextDueDate, todayStr)
        )
      );

    console.log(`Recorrências pendentes encontradas: ${pendingRecurrences.length}\n`);

    if (pendingRecurrences.length === 0) {
      console.log("Nenhuma recorrência pendente para processar.");
      console.log("\n=== TESTE CONCLUÍDO (SEM AÇÕES) ===\n");
      return;
    }

    const results = [];

    for (const rec of pendingRecurrences) {
      console.log(`\n--- Processando: ${rec.description} (ID: ${rec.id}) ---`);
      console.log(`   Usuário: ${rec.userId}`);
      console.log(`   Conta: ${rec.accountId}`);
      console.log(`   Valor: ${rec.amount}`);
      console.log(`   Próximo vencimento atual: ${rec.nextDueDate}`);
      console.log(`   Frequência: ${rec.frequency}, Intervalo: ${rec.interval ?? 1}`);

      let catchUpCount = 0;
      let currentDueDate = rec.nextDueDate;

      try {
        while (currentDueDate <= todayStr && catchUpCount < MAX_CATCH_UP) {
          catchUpCount++;

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

          console.log(`   [${catchUpCount}] Transação criada: ${newTx.id} em ${currentDueDate}`);

          currentDueDate = calculateNextDueDate(currentDueDate, rec.frequency, rec.interval ?? 1);
        }

        if (catchUpCount >= MAX_CATCH_UP && currentDueDate <= todayStr) {
          console.warn(`   AVISO: Atingiu limite de catch-up (${MAX_CATCH_UP}). Próximo vencimento: ${currentDueDate}`);
        }

        let isActive = true;
        if (rec.endDate && currentDueDate > rec.endDate) {
          isActive = false;
          console.log(`   Desativando recorrência (passou do endDate: ${rec.endDate})`);
        }

        await db
          .update(recurringTransactions)
          .set({
            nextDueDate: currentDueDate,
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(recurringTransactions.id, rec.id));

        console.log(`   Próximo vencimento atualizado para: ${currentDueDate}`);
        console.log(`   Status: ${isActive ? "ATIVA" : "DESATIVADA"}`);

        results.push({ id: rec.id, status: "success", createdTransactions: catchUpCount });

      } catch (error) {
        console.error(`   ERRO ao processar recorrência ${rec.id}:`, error);
        results.push({ id: rec.id, status: "error", message: error instanceof Error ? error.message : "Erro desconhecido" });
      }
    }

    console.log("\n=== RESULTADO DO PROCESSAMENTO ===\n");
    console.log(`Total processado: ${pendingRecurrences.length}`);
    console.log(`Com sucesso: ${results.filter(r => r.status === "success").length}`);
    console.log(`Com erro: ${results.filter(r => r.status === "error").length}`);

    console.log("\n=== TESTE CONCLUÍDO COM SUCESSO ===\n");

  } catch (error) {
    console.error("\n=== ERRO CRÍTICO NO TESTE ===");
    console.error(error);
    console.log("\n=== TESTE FALHOU ===\n");
    process.exit(1);
  }
}

function calculateNextDueDate(currentDate: string, frequency: string, interval: number): string {
  const date = new Date(currentDate + "T12:00:00Z");

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

testRecurringTransactions();
