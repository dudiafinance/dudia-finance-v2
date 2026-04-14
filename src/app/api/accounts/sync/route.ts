import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { logger } from "@/lib/utils/logger";

export async function POST(_req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const updatedBalances = [];

    // Faz o recálculo atômico para cada conta dentro de uma transação
    for (const acc of userAccounts) {
      if (acc.type === "credit_card") continue;
      
      const newBalance = await db.transaction(async (tx) => {
        return await FinancialEngine.recalculateAccountBalance(tx, acc.id);
      });
      
      updatedBalances.push({ accountId: acc.id, newBalance });
    }

    return NextResponse.json({ success: true, updatedBalances });
  } catch (error) {
    logger.error("Error syncing accounts:", error);
    return NextResponse.json({ error: "Erro ao sincronizar contas" }, { status: 500 });
  }
}
