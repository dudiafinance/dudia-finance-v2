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
import { eq } from "drizzle-orm";

const IGOR_USER_ID = "debfc4b5-45eb-45dc-90d3-30a83d4e1064";

async function resetUserData() {
  console.log("🧹 Resetando dados do usuário...\n");
  console.log(`User ID: ${IGOR_USER_ID}`);
  console.log(`Email: igorpminacio@hotmail.com\n`);

  try {
    console.log("1. Deletando audit_logs...");
    await db.delete(auditLogs).where(eq(auditLogs.userId, IGOR_USER_ID));
    console.log("   ✅ audit_logs deletados\n");

    console.log("2. Deletando goal_contributions...");
    await db.delete(goalContributions).where(eq(goalContributions.userId, IGOR_USER_ID));
    console.log("   ✅ goal_contributions deletados\n");

    console.log("3. Deletando notifications...");
    await db.delete(notifications).where(eq(notifications.userId, IGOR_USER_ID));
    console.log("   ✅ notifications deletadas\n");

    console.log("4. Deletando idempotency_keys...");
    await db.delete(idempotencyKeys).where(eq(idempotencyKeys.userId, IGOR_USER_ID));
    console.log("   ✅ idempotency_keys deletadas\n");

    console.log("5. Deletando recurring_transactions...");
    await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, IGOR_USER_ID));
    console.log("   ✅ recurring_transactions deletadas\n");

    console.log("6. Deletando card_transactions...");
    await db.delete(cardTransactions).where(eq(cardTransactions.userId, IGOR_USER_ID));
    console.log("   ✅ card_transactions deletadas\n");

    console.log("7. Deletando credit_cards...");
    await db.delete(creditCards).where(eq(creditCards.userId, IGOR_USER_ID));
    console.log("   ✅ credit_cards deletados\n");

    console.log("8. Deletando transactions...");
    await db.delete(transactions).where(eq(transactions.userId, IGOR_USER_ID));
    console.log("   ✅ transactions deletadas\n");

    console.log("9. Deletando budgets...");
    await db.delete(budgets).where(eq(budgets.userId, IGOR_USER_ID));
    console.log("   ✅ budgets deletados\n");

    console.log("10. Deletando goals...");
    await db.delete(goals).where(eq(goals.userId, IGOR_USER_ID));
    console.log("    ✅ goals deletados\n");

    console.log("11. Deletando accounts...");
    await db.delete(accounts).where(eq(accounts.userId, IGOR_USER_ID));
    console.log("    ✅ accounts deletadas\n");

    console.log("12. Deletando categories...");
    await db.delete(categories).where(eq(categories.userId, IGOR_USER_ID));
    console.log("    ✅ categories deletadas\n");

    console.log("13. Deletando tags...");
    await db.delete(tags).where(eq(tags.userId, IGOR_USER_ID));
    console.log("    ✅ tags deletadas\n");

    console.log("═══════════════════════════════════════");
    console.log("🎉 Conta resetada com sucesso!");
    console.log("═══════════════════════════════════════");
    console.log("\nConta igorpminacio@hotmail.com agora está:");
    console.log("  • Sem transações");
    console.log("  • Sem contas bancárias");
    console.log("  • Sem cartões de crédito");
    console.log("  • Sem orçamentos (budgets)");
    console.log("  • Sem metas financeiras");
    console.log("  • Sem categorias");
    console.log("  • Sem tags");
    console.log("  • Sem transações recorrentes");
    console.log("  • Sem notificações");
    console.log("  • Log de auditoria limpo");
    console.log("\nDados pessoais preservados:");
    console.log("  • Email: igorpminacio@hotmail.com");
    console.log("  • Nome: Igor Massaro");
    console.log("  • Moeda: BRL");
    console.log("  • Configurações de notificação mantidas");
    console.log("\nA conta está pronta para uso como nova!");

  } catch (error) {
    console.error("❌ Erro ao resetar conta:", error);
    throw error;
  }
}

resetUserData().catch(console.error);
