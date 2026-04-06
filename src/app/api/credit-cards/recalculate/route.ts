import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { creditCards } from "@/lib/db/schema";
import { recalculateUsedAmount } from "@/lib/credit-card-utils";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cards = await db
    .select()
    .from(creditCards)
    .where(eq(creditCards.userId, userId));

  for (const card of cards) {
    await recalculateUsedAmount(card.id);
  }

  const updatedCards = await db
    .select()
    .from(creditCards)
    .where(eq(creditCards.userId, userId));

  return NextResponse.json({ 
    success: true, 
    cardsUpdated: cards.length,
    cards: updatedCards.map(c => ({ id: c.id, name: c.name, usedAmount: c.usedAmount }))
  });
}