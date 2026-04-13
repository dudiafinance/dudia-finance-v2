import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  users,
  accounts,
  transactions,
  categories,
  budgets,
  goals,
  goalContributions,
  tags,
  creditCards,
  cardTransactions,
  recurringTransactions,
  notifications,
} from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * GET /api/user/export
 *
 * Exporta todos os dados pessoais do usuário em formato JSON.
 * Obrigatório pela LGPD (Lei 13.709/2018), Art. 18, inciso V — direito à portabilidade.
 *
 * Os dados retornados NÃO incluem campos de controle interno (passwordHash removido,
 * openRouterApiKey omitido por segurança).
 */
export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [
      userData,
      userAccounts,
      userTransactions,
      userCategories,
      userBudgets,
      userGoals,
      userGoalContributions,
      userTags,
      userCreditCards,
      userCardTransactions,
      userRecurring,
      userNotifications,
    ] = await Promise.all([
      // Dados do perfil — omite campos sensíveis
      db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        currency: users.currency,
        locale: users.locale,
        timezone: users.timezone,
        notificationPreferences: users.notificationPreferences,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.id, userId)).limit(1),

      db.select().from(accounts).where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt))),
      db.select().from(transactions).where(and(eq(transactions.userId, userId), isNull(transactions.deletedAt))),
      db.select().from(categories).where(eq(categories.userId, userId)),
      db.select().from(budgets).where(eq(budgets.userId, userId)),
      db.select().from(goals).where(and(eq(goals.userId, userId), isNull(goals.deletedAt))),
      db.select().from(goalContributions).where(eq(goalContributions.userId, userId)),
      db.select().from(tags).where(eq(tags.userId, userId)),
      db.select().from(creditCards).where(and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt))),
      db.select().from(cardTransactions).where(and(eq(cardTransactions.userId, userId), isNull(cardTransactions.deletedAt))),
      db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId)),
      db.select().from(notifications).where(eq(notifications.userId, userId)),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
      legalBasis: "LGPD Art. 18, inciso V — Direito à Portabilidade",
      profile: userData[0] ?? null,
      accounts: userAccounts,
      transactions: userTransactions,
      categories: userCategories,
      budgets: userBudgets,
      goals: userGoals,
      goalContributions: userGoalContributions,
      tags: userTags,
      creditCards: userCreditCards,
      cardTransactions: userCardTransactions,
      recurringTransactions: userRecurring,
      notifications: userNotifications,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="dudia-finance-export-${new Date().toISOString().split("T")[0]}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Erro ao exportar dados" }, { status: 500 });
  }
}
