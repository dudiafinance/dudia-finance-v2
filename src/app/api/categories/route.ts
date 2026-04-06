import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { categorySchema } from "@/lib/validations";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.order), asc(categories.name));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const count = await db.select().from(categories).where(eq(categories.userId, userId));

  const { budgetAmount, ...rest } = parsed.data;
  const [row] = await db
    .insert(categories)
    .values({
      ...rest,
      ...(budgetAmount != null ? { budgetAmount: String(budgetAmount) } : {}),
      userId,
      order: count.length,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
