// DEPRECATED — to be removed after stabilization. Only available in development.
import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { cardTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const recent = await db
      .select()
      .from(cardTransactions)
      .where(eq(cardTransactions.userId, userId))
      .orderBy(desc(cardTransactions.createdAt))
      .limit(10);

    return NextResponse.json({
      recentTransactions: recent,
      count: recent.length,
    });
  } catch (error) {
    logger.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
