import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { creditCardInvoices } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getUserId } from "@/lib/auth-utils";
import { invoiceStatusSchema } from "@/lib/validations";
import { logger } from "@/lib/utils/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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
          eq(creditCardInvoices.cardId, id),
          eq(creditCardInvoices.userId, userId),
          eq(creditCardInvoices.month, month),
          eq(creditCardInvoices.year, year)
        )
      )
      .limit(1);

    return NextResponse.json(invoice || { status: "ABERTA" });
  } catch (error) {
    logger.error("Error fetching invoice status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { month, year, status } = body;

    const parsed = invoiceStatusSchema.safeParse({ status });
    if (!parsed.success) {
      return NextResponse.json({ 
        error: "Status inválido. Valores aceitos: ABERTA, FECHADA, PAGA" 
      }, { status: 400 });
    }

    if (isNaN(month) || isNaN(year)) {
      return NextResponse.json({ error: "Month e year são obrigatórios" }, { status: 400 });
    }

    // Check if exists
    const [existing] = await db
      .select()
      .from(creditCardInvoices)
      .where(
        and(
          eq(creditCardInvoices.cardId, id),
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
          cardId: id,
          userId,
          month,
          year,
          status,
        })
        .returning();
      return NextResponse.json(inserted);
    }
  } catch (error) {
    logger.error("Error updating invoice status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

