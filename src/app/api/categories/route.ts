import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { categorySchema } from "@/lib/validations";


export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(asc(categories.order), asc(categories.name));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const [{ count: itemsCount }] = await db
    .select({ count: count() })
    .from(categories)
    .where(eq(categories.userId, userId));

  const { budgetAmount, ...rest } = parsed.data;
  const [row] = await db
    .insert(categories)
    .values({
      ...rest,
      ...(budgetAmount != null ? { budgetAmount: String(budgetAmount) } : {}),
      userId,
      order: itemsCount,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
