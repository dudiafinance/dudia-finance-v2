import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cardTransactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  try {
    // Get recent transactions
    const recent = await db
      .select()
      .from(cardTransactions)
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
    return NextResponse.json({ 
      error: "Failed to fetch transactions",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}