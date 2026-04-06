import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { goalContributions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { goalContributionSchema } from "@/lib/validations";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = goalContributionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  const updateData: any = { updatedAt: new Date() };
  if (d.amount !== undefined) updateData.amount = String(d.amount);
  if (d.status) updateData.status = d.status;
  if (d.notes !== undefined) updateData.notes = d.notes;

  const [row] = await db
    .update(goalContributions)
    .set(updateData)
    .where(and(eq(goalContributions.id, id), eq(goalContributions.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .delete(goalContributions)
    .where(and(eq(goalContributions.id, id), eq(goalContributions.userId, userId)));

  return NextResponse.json({ success: true });
}