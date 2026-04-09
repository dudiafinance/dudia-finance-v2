import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { FinancialEngine } from "@/lib/services/financial-engine";

/**
 * Rota de depuração para forçar a sincronização de todos os saldos.
 * TODO: Remover ou proteger com permissão de admin em produção.
 */
export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const summary = await FinancialEngine.forceUserSync(userId);
    return NextResponse.json({ 
      message: "Sincronização concluída com sucesso.",
      summary 
    });
  } catch (error) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
