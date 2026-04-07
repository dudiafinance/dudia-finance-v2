import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creditCardInvoices } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "");
  const year = parseInt(searchParams.get("year") || "");

  if (isNaN(month) || isNaN(year)) {
    return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
  }

  try {
    const [invoice] = await db
      .select()
      .from(creditCardInvoices)
      .where(
        and(
          eq(creditCardInvoices.cardId, params.id),
          eq(creditCardInvoices.userId, userId),
          eq(creditCardInvoices.month, month),
          eq(creditCardInvoices.year, year)
        )
      )
      .limit(1);

    return NextResponse.json(invoice || { status: "ABERTA" });
  } catch (error) {
    console.error("Error fetching invoice status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { month, year, status } = await req.json();

    if (isNaN(month) || isNaN(year) || !status) {
      return NextResponse.json({ error: "Month, year and status are required" }, { status: 400 });
    }

    // Check if exists
    const [existing] = await db
      .select()
      .from(creditCardInvoices)
      .where(
        and(
          eq(creditCardInvoices.cardId, params.id),
          eq(creditCardInvoices.userId, userId),
          eq(creditCardInvoices.month, month),
          eq(creditCardInvoices.year, year)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(creditCardInvoices)
        .set({ status, updatedAt: new Date() })
        .where(eq(creditCardInvoices.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    } else {
      const [inserted] = await db
        .insert(creditCardInvoices)
        .values({
          cardId: params.id,
          userId,
          month,
          year,
          status,
        })
        .returning();
      return NextResponse.json(inserted);
    }
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
