import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cardTransactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { recalculateUsedAmount } from "@/lib/credit-card-utils";


export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: cardId, txId } = await params;

  const [row] = await db
    .delete(cardTransactions)
    .where(and(eq(cardTransactions.id, txId), eq(cardTransactions.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await recalculateUsedAmount(cardId);

  return NextResponse.json({ success: true });
}
