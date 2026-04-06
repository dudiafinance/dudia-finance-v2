import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { accountSchema } from "@/lib/validations";


export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(asc(accounts.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Erro ao buscar contas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const [row] = await db
    .insert(accounts)
    .values({ ...parsed.data, userId, balance: String(parsed.data.balance) })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
