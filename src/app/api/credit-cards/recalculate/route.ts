import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { creditCards } from "@/lib/db/schema";
import { recalculateUsedAmount } from "@/lib/credit-card-utils";
import { eq } from "drizzle-orm";

export async function POST() {
  const userId = await getUserId();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
  } catch (error) {
    console.error("Error recalculating cards:", error);
    return NextResponse.json({ error: "Erro ao recalcular cartões" }, { status: 500 });
  }
}