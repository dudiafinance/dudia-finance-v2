import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { transferSchema } from "@/lib/validations";
import { FinancialEngine } from "@/lib/services/financial-engine";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = transferSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: parsed.error.issues[0]?.message ?? "Dados inválidos" 
      }, { status: 400 });
    }

    const { fromAccountId, toAccountId, amount, description, date, categoryId } = parsed.data;

    const result = await FinancialEngine.transferFunds({
      userId,
      fromAccountId,
      toAccountId,
      amount: String(amount),
      description,
      date,
      categoryId: categoryId ?? undefined
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("Error creating transfer:", error);
    return NextResponse.json({ 
      error: error.message || "Erro ao processar transferência" 
    }, { status: 500 });
  }
}
