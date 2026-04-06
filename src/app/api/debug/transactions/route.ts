import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cardTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";


export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  try {
    // Get recent transactions filtered by userId
    const recent = await db
      .select()
      .from(cardTransactions)
      .where(eq(cardTransactions.userId, userId))
      .orderBy(desc(cardTransactions.createdAt))
      .limit(10);

    return NextResponse.json({
      userId,
      email,
      recentTransactions: recent,
      count: recent.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}