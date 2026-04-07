import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "../src/lib/db";
import { 
  transactions, 
  cardTransactions, 
  goals, 
  goalContributions, 
  budgets, 
  accounts, 
  creditCards,
  auditLogs 
} from "../src/lib/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🧹 Iniciando limpeza total do banco de dados...");

  try {
    await db.transaction(async (tx) => {
      console.log("🗑️ Apagando transações...");
      await tx.delete(transactions);
      
      console.log("🗑️ Apagando transações de cartão...");
      await tx.delete(cardTransactions);
      
      console.log("🗑️ Apagando contribuições de metas...");
      await tx.delete(goalContributions);
      
      console.log("🗑️ Apagando metas...");
      await tx.delete(goals);
      
      console.log("🗑️ Apagando orçamentos...");
      await tx.delete(budgets);

      console.log("🗑️ Apagando logs de auditoria antigos...");
      await tx.delete(auditLogs);

      console.log("💰 Resetando saldos das contas...");
      await tx.update(accounts).set({ balance: "0", updatedAt: new Date() });

      console.log("💳 Resetando limite utilizado dos cartões...");
      await tx.update(creditCards).set({ usedAmount: "0", updatedAt: new Date() });
    });

    console.log("✅ Limpeza concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro durante a limpeza:", error);
    process.exit(1);
  }
}

main();
