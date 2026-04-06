import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { goalSchema } from "@/lib/validations";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = goalSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const d = parsed.data;
  const updateData: any = { updatedAt: new Date() };
  if (d.name) updateData.name = d.name;
  if (d.targetAmount !== undefined) updateData.targetAmount = String(d.targetAmount);
  if (d.currentAmount !== undefined) updateData.currentAmount = String(d.currentAmount);
  if (d.deadline !== undefined) updateData.deadline = d.deadline;
  if (d.priority) updateData.priority = d.priority;
  if (d.status) updateData.status = d.status;
  if (d.notes !== undefined) updateData.notes = d.notes;

  const [row] = await db
    .update(goals)
    .set(updateData)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));

  return NextResponse.json({ success: true });
}
