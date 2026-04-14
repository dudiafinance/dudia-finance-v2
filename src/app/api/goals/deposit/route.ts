import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { goalDepositSchema } from "@/lib/validations";
import { checkIdempotencyKey, storeIdempotencyKey, getIdempotencyKey } from "@/lib/idempotency";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // BUG-002: Idempotency check — prevent duplicate goal deposits on retries/double-submits
  const idempotencyKey = getIdempotencyKey(req);
  if (idempotencyKey) {
    const cached = await checkIdempotencyKey(idempotencyKey, userId);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  try {
    const body = await req.json();
    const parsed = goalDepositSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message ?? "Dados inválidos" 
      }, { status: 400 });
    }

    const { goalId, accountId, amount, date, description, categoryId } = parsed.data;

    const result = await FinancialEngine.depositToGoal({
      userId,
      goalId,
      accountId,
      amount: String(amount),
      date: date || new Date().toISOString().slice(0, 10),
      description: description || "Depósito em Meta",
      categoryId: categoryId ?? undefined
    });

    if (idempotencyKey) await storeIdempotencyKey(idempotencyKey, userId, { body: result, status: 200 });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error depositing to goal:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Error" }, { status: 500 });
  }
}
