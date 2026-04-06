import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { goalSchema } from "@/lib/validations";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  const [row] = await db
    .insert(goals)
    .values({
      userId,
      name: d.name,
      targetAmount: String(d.targetAmount),
      currentAmount: String(d.currentAmount),
      startDate: d.startDate,
      endDate: d.endDate ?? null,
      priority: d.priority,
      status: d.status,
      notes: d.notes ?? null,
      monthlyContribution: d.monthlyContribution ? String(d.monthlyContribution) : null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
