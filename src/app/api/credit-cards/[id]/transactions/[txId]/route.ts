import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { FinancialEngine } from "@/lib/services/financial-engine";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string, txId: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { txId } = await params;
  
  try {
    const { updateGroup, ...data } = await req.json();
    const result = await FinancialEngine.updateCardTransaction(txId, userId, data, updateGroup);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating card transaction:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, txId: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { txId } = await params;

  try {
    await FinancialEngine.deleteCardTransaction(txId, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting card transaction:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 500 });
  }
}
