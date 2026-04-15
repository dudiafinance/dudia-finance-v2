import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { payInvoiceSchema } from "@/lib/validations";
import { checkIdempotencyKey, storeIdempotencyKey, getIdempotencyKey } from "@/lib/idempotency";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // BUG-002: Idempotency check — prevent duplicate invoice payments on retries/double-submits
  const idempotencyKey = getIdempotencyKey(req);
  if (idempotencyKey) {
    const cached = await checkIdempotencyKey(idempotencyKey, userId);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  try {
    const body = await req.json();
    const parsed = payInvoiceSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message ?? "Dados inválidos" 
      }, { status: 400 });
    }

    const { cardId, accountId, amount, description, date, month, year, categoryId } = parsed.data;
    
    const result = await FinancialEngine.payCardInvoice({
      userId,
      cardId,
      accountId,
      amount: String(amount),
      description: description || "Pagamento de fatura",
      date,
      month,
      year,
      categoryId: categoryId ?? undefined
    });
    if (idempotencyKey) await storeIdempotencyKey(idempotencyKey, userId, { body: result, status: 200 });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error paying card invoice:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao pagar fatura" }, { status: 500 });
  }
}
