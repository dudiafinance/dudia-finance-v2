import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { FinancialEngine } from "@/lib/services/financial-engine";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { goalId, accountId, amount, date, description, categoryId } = await req.json();

    if (!goalId || !accountId || !amount) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const result = await FinancialEngine.depositToGoal({
      userId,
      goalId,
      accountId,
      amount: String(amount),
      date: date || new Date().toISOString().slice(0, 10),
      description: description || "Depósito em Meta",
      categoryId
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
