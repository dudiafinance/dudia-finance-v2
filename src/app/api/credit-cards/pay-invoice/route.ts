import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { FinancialEngine } from "@/lib/services/financial-engine";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const result = await FinancialEngine.payCardInvoice({
       ...data,
       userId,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error paying card invoice:", error);
    return NextResponse.json({ error: error.message || "Erro ao pagar fatura" }, { status: 500 });
  }
}
