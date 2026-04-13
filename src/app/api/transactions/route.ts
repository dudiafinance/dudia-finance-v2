import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, ilike, or, count, SQL, sql, isNull } from "drizzle-orm";
import { transactionSchema } from "@/lib/validations";
import { randomUUID } from "crypto";
import { FinancialEngine } from "@/lib/services/financial-engine";
import { sanitizeText, sanitizeOptionalText } from "@/lib/sanitize";
import { checkIdempotencyKey, storeIdempotencyKey, getIdempotencyKey } from "@/lib/idempotency";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 50)));
  const search = searchParams.get("search");
  const type = searchParams.get("type");
  const isPaid = searchParams.get("isPaid");
  const accountId = searchParams.get("accountId");
  const categoryId = searchParams.get("categoryId");
  const cursor = searchParams.get("cursor");

  let cursorDate: string | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");
      const [d, i] = decoded.split(":");
      cursorDate = d;
      cursorId = i;
    } catch {
      return NextResponse.json({ error: "Cursor inválido" }, { status: 400 });
    }
  }

  const where: SQL[] = [eq(transactions.userId, userId), isNull(transactions.deletedAt)];

  if (month && year) {
    const startOfMonth = new Date(Number(year), Number(month) - 1, 1).toISOString().split("T")[0];
    const endOfMonth = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];
    where.push(gte(transactions.date, startOfMonth));
    where.push(lte(transactions.date, endOfMonth));
  }

  if (search) {
    where.push(or(
      ilike(transactions.description, `%${search}%`),
      ilike(transactions.notes, `%${search}%`)
    ) as SQL);
  }

  if (type && type !== "all") {
    where.push(eq(transactions.type, type));
  }

  if (isPaid === "true" || isPaid === "false") {
    where.push(eq(transactions.isPaid, isPaid === "true"));
  }

  if (accountId) {
    where.push(eq(transactions.accountId, accountId));
  }

  if (categoryId) {
    where.push(eq(transactions.categoryId, categoryId));
  }

  if (cursorDate && cursorId) {
    where.push(
      or(
        sql`(${transactions.date}, ${transactions.id}) < (${cursorDate}, ${cursorId})`,
        and(
          eq(transactions.date, cursorDate),
          sql`${transactions.id} < ${cursorId}`
        )
      ) as SQL
    );
  }

  try {
    const [counts] = await db
      .select({ 
        total: count(),
        totalIncome: sql<string>`SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END)`,
        totalExpense: sql<string>`SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END)`
      })
      .from(transactions)
      .where(and(...where));

    const rows = await db
      .select()
      .from(transactions)
      .where(and(...where))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    
    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(`${lastItem.date}:${lastItem.id}`).toString("base64");
    }

    return NextResponse.json({
      items,
      nextCursor,
      metadata: {
        total: Number(counts?.total || 0),
        totalIncome: Number(counts?.totalIncome || 0),
        totalExpense: Number(counts?.totalExpense || 0),
        limit,
        hasMore
      }
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // BUG-002: Idempotency check — prevent duplicate transactions on retries/double-submits
  const idempotencyKey = getIdempotencyKey(req);
  if (idempotencyKey) {
    const cached = await checkIdempotencyKey(idempotencyKey, userId);
    if (cached) return NextResponse.json(cached.body, { status: cached.status });
  }

  try {
    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const d = parsed.data;

    const safeDescription = sanitizeText(d.description);
    const safeNotes = sanitizeOptionalText(d.notes);
    const safeLocation = sanitizeOptionalText(d.location);

    // Caso: Transação Recorrente (Lazy: gera apenas as primeiras 12 ocorrências)
    if (d.subtype === 'recurring') {
      const MAX_RECURRING = 60;
      const n = Math.min(d.totalOccurrences ?? 12, MAX_RECURRING);
      const groupId = randomUUID();
      const startDate = d.date; // YYYY-MM-DD
      const results = [];

      // Batch: create all occurrences in parallel (capped at MAX_RECURRING)
      const rows = await Promise.all(
        Array.from({ length: n }, (_, i) => {
          const baseDate = new Date(startDate + 'T12:00:00');
          baseDate.setMonth(baseDate.getMonth() + i);
          const dateStr = baseDate.toISOString().split('T')[0];

          return FinancialEngine.addTransaction({
            userId,
            accountId: d.accountId,
            categoryId: d.categoryId ?? null,
            amount: String(d.amount),
            type: d.type,
            date: dateStr,
            description: safeDescription,
            notes: safeNotes,
            isPaid: i === 0 ? d.isPaid : false,
            subtype: 'recurring',
            recurringGroupId: groupId,
            totalOccurrences: n,
            currentOccurrence: i + 1,
            dueDate: d.dueDate ?? null,
            receiveDate: d.receiveDate ?? null,
            tags: d.tags,
            location: safeLocation,
          });
        })
      );
      results.push(...rows);
      const recurringResponse = { body: results, status: 201 };
      if (idempotencyKey) await storeIdempotencyKey(idempotencyKey, userId, recurringResponse);
      return NextResponse.json(results, { status: 201 });
    }

    // Caso: Transação Única
    if (d.subtype !== 'fixed') {
      const row = await FinancialEngine.addTransaction({
        userId,
        accountId: d.accountId,
        categoryId: d.categoryId ?? null,
        amount: String(d.amount),
        type: d.type,
        date: d.date,
        description: safeDescription,
        notes: safeNotes,
        isPaid: d.isPaid,
        subtype: d.subtype ?? 'single',
        dueDate: d.dueDate ?? null,
        receiveDate: d.receiveDate ?? null,
        tags: d.tags,
        location: safeLocation,
      });
      if (idempotencyKey) await storeIdempotencyKey(idempotencyKey, userId, { body: row, status: 201 });
      return NextResponse.json(row, { status: 201 });
    }

    // Caso: Transação Fixa — groupId criado ANTES para que TODAS as ocorrências (incluindo a primeira) compartilhem o mesmo grupo
    const groupId = randomUUID();
    const baseDate = new Date(d.date + 'T12:00:00');
    const fixedRows = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const occurrenceDate = new Date(baseDate);
        occurrenceDate.setMonth(occurrenceDate.getMonth() + i);
        const dateStr = occurrenceDate.toISOString().split('T')[0];

        return FinancialEngine.addTransaction({
          userId,
          accountId: d.accountId,
          categoryId: d.categoryId ?? null,
          amount: String(d.amount),
          type: d.type,
          date: dateStr,
          description: safeDescription,
          notes: safeNotes,
          isPaid: i === 0 ? d.isPaid : false,
          subtype: 'fixed',
          recurringGroupId: groupId,
          totalOccurrences: 12,
          currentOccurrence: i + 1,
          dueDate: d.dueDate ?? null,
          receiveDate: d.receiveDate ?? null,
          tags: d.tags,
          location: safeLocation,
        });
      })
    );

    const firstRow = fixedRows[0];
    if (idempotencyKey) await storeIdempotencyKey(idempotencyKey, userId, { body: firstRow, status: 201 });
    return NextResponse.json(firstRow, { status: 201 });

  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao criar transação" }, { status: 500 });
  }
}
