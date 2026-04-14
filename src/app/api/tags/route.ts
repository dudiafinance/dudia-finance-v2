import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/utils/logger";

const tagSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(50),
  color: z.string().length(7).optional(),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId))
      .orderBy(asc(tags.name));

    return NextResponse.json(userTags);
  } catch (error) {
    logger.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Erro ao buscar tags" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const tagName = parsed.data.name.trim().toLowerCase();

    // Prevent duplicates
    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, tagName)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Tag já existe" }, { status: 400 });
    }

    const [row] = await db
      .insert(tags)
      .values({
        userId,
        name: tagName,
        color: parsed.data.color ?? "#820AD1",
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    logger.error("Error creating tag:", error);
    return NextResponse.json({ error: "Erro ao criar tag" }, { status: 500 });
  }
}
