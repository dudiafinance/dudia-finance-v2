import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { creditCards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  const allowed = ["name", "bank", "lastDigits", "limit", "dueDay", "closingDay", "color", "gradient", "network", "isActive", "usedAmount"];
  for (const key of allowed) {
    if (key in body) {
      if (key === "limit" || key === "usedAmount") {
        updateData[key] = String(body[key]);
      } else {
        updateData[key] = body[key];
      }
    }
  }
  updateData.updatedAt = new Date();

  const [row] = await db
    .update(creditCards)
    .set(updateData as any)
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [row] = await db
    .delete(creditCards)
    .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
