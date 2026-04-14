import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const tagSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50),
  color: z.string().length(7).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = tagSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    // If changing name, ensure it doesn't conflict
    if (parsed.data.name) {
      const tagName = parsed.data.name.trim().toLowerCase();
      const [existing] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.userId, userId), eq(tags.name, tagName), ne(tags.id, id)))
        .limit(1);

      if (existing) {
        return NextResponse.json({ error: "Tag com este nome já existe" }, { status: 400 });
      }
      parsed.data.name = tagName;
    }

    const [row] = await db
      .update(tags)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(and(eq(tags.id, id), eq(tags.userId, userId)))
      .returning();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    logger.error("Error updating tag:", error);
    return NextResponse.json({ error: "Erro ao atualizar tag" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    // We could potentially update transactions/categories that use this tag here,
    // but tags are stored as JsonB string arrays for performance on those tables,
    // so deleting the global tag just makes it not appear in the autocomplete catalog anymore.
    
    await db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Erro ao excluir tag" }, { status: 500 });
  }
}
