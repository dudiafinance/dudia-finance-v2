import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { creditCards } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { creditCardSchema } from "@/lib/validations";
import { logger } from "@/lib/utils/logger";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  try {
    const userId = await getUserId();
    if (!userId) {
      logger.error("Credit card creation failed: userId is null");
      return NextResponse.json({ error: "Unauthorized - user not found", userId }, { status: 401 });
    }

    const body = await req.json();
    const parsed = creditCardSchema.safeParse(body);
    if (!parsed.success) {
      logger.error("Credit card validation failed:", parsed.error.issues);
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const { name, bank, lastDigits, limit, dueDay, closingDay, color, gradient, network } = parsed.data;

    logger.info(`Creating credit card for userId: ${userId}, name: ${name}, bank: ${bank}`);

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

    logger.info(`Credit card created successfully: ${row.id}`);
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    logger.error("Error creating credit card:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const cause = error instanceof Error && error.cause ? String(error.cause) : undefined;
    return NextResponse.json({ error: "Erro ao criar cartão", details: message, cause }, { status: 500 });
  }
}
