import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { creditCards } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { creditCardSchema } from "@/lib/validations";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(creditCards)
      .where(eq(creditCards.userId, userId))
      .orderBy(asc(creditCards.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    logger.error("Error fetching credit cards:", error);
    return NextResponse.json({ error: "Erro ao buscar cartões" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = creditCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const { name, bank, lastDigits, limit, dueDay, closingDay, color, gradient, network } = parsed.data;

    const [row] = await db
      .insert(creditCards)
      .values({
        userId,
        name,
        bank,
        lastDigits: lastDigits ?? null,
        limit: String(limit),
        dueDay,
        closingDay,
        color: color ?? '#820AD1',
        gradient: gradient ?? 'from-[#820AD1] to-[#4B0082]',
        network: network ?? 'mastercard',
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    logger.error("Error creating credit card:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const cause = error instanceof Error && error.cause ? String(error.cause) : undefined;
    return NextResponse.json({ error: "Erro ao criar cartão", details: message, cause }, { status: 500 });
  }
}
