// DEPRECATED — to be removed after stabilization. Only available in development.
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { logger } from "@/lib/utils/logger";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const summary = await FinancialEngine.forceUserSync(userId);
    return NextResponse.json({
      message: "Sincronização concluída com sucesso.",
      summary
    });
  } catch (error) {
    logger.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
