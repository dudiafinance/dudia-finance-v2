import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "@/lib/db";
import { 
  users, 
  accounts, 
  transactions, 
  categories, 
  budgets, 
  goals, 
  creditCards,
  cardTransactions,
  recurringTransactions,
  notifications,
  tags,
  goalContributions,
  idempotencyKeys,
  auditLogs,
} from "@/lib/db/schema";
import { eq, ne } from "drizzle-orm";

const TEST_USERS = [
  "6df5e07c-0670-41f7-9617-a760a5ffa886", // test com email temp
  "00000000-0000-0000-0000-000000000001", // usuário de teste antigo
];

const IGOR_USER_ID = "debfc4b5-45eb-45dc-90d3-30a83d4e1064";

async function cleanupTestData() {
  console.log("🧹 Iniciando limpeza de dados de teste...\n");

  for (const userId of TEST_USERS) {
    console.log(`\nProcessando usuário: ${userId}`);
    
    try {
      // Deletar em cascata (ordem correta por FK)
      console.log("  - Deletando audit_logs...");
      await db.delete(auditLogs).where(eq(auditLogs.userId, userId));

      console.log("  - Deletando goal_contributions...");
      await db.delete(goalContributions).where(eq(goalContributions.userId, userId));

      console.log("  - Deletando notifications...");
      await db.delete(notifications).where(eq(notifications.userId, userId));

      console.log("  - Deletando idempotency_keys...");
      await db.delete(idempotencyKeys).where(eq(idempotencyKeys.userId, userId));

      console.log("  - Deletando recurring_transactions...");
      await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));

      console.log("  - Deletando card_transactions...");
      await db.delete(cardTransactions).where(eq(cardTransactions.userId, userId));

      console.log("  - Deletando credit_cards...");
      await db.delete(creditCards).where(eq(creditCards.userId, userId));

      console.log("  - Deletando transactions...");
      await db.delete(transactions).where(eq(transactions.userId, userId));

      console.log("  - Deletando budgets...");
      await db.delete(budgets).where(eq(budgets.userId, userId));

      console.log("  - Deletando goals...");
      await db.delete(goals).where(eq(goals.userId, userId));

      console.log("  - Deletando accounts...");
      await db.delete(accounts).where(eq(accounts.userId, userId));

      console.log("  - Deletando categories...");
      await db.delete(categories).where(eq(categories.userId, userId));

      console.log("  - Deletando tags...");
      await db.delete(tags).where(eq(tags.userId, userId));

      console.log("  - Deletando usuário...");
      await db.delete(users).where(eq(users.id, userId));

      console.log(`  ✅ Usuário ${userId} e todos os dados removidos!`);
    } catch (error) {
      console.error(`  ❌ Erro ao processar usuário ${userId}:`, error);
    }
  }

  console.log("\n✅ Limpeza concluída!");
  console.log("\nUsuário principal preservado:");
  console.log(`  - Igor Massaro: ${IGOR_USER_ID}`);
}

cleanupTestData().catch(console.error);
