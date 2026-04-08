import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { categorySchema } from "@/lib/validations";


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const { budgetAmount, ...rest } = parsed.data;

  // Anti-cycle validation (Self-Healing Hierarchy)
  if (rest.parentId) {
    if (rest.parentId === id) {
      return NextResponse.json({ error: "Categoria não pode ser pai de si mesma" }, { status: 400 });
    }

    let currentParentId: string | null = rest.parentId;
    let depth = 0;
    while (currentParentId && depth < 10) {
      const [parentCheck] = await db
        .select({ id: categories.id, parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, currentParentId))
        .limit(1);

      if (!parentCheck) break;
      if (parentCheck.parentId === id) {
        return NextResponse.json({ error: "Referência circular detectada. Categoria não pode ser filha de seu próprio descendente." }, { status: 400 });
      }
      currentParentId = parentCheck.parentId;
      depth++;
    }
  }
  const [row] = await db
    .update(categories)
    .set({
      ...rest,
      ...(budgetAmount !== undefined ? { budgetAmount: budgetAmount != null ? String(budgetAmount) : null } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [categoryExists] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .limit(1);
  
  if (!categoryExists) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });

  const hasTransactions = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.categoryId, id))
    .limit(1);

  if (hasTransactions.length > 0) {
    return NextResponse.json({ error: "Não é possível deletar categoria com transações existentes" }, { status: 400 });
  }

  const hasChildCategories = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.parentId, id))
    .limit(1);

  if (hasChildCategories.length > 0) {
    return NextResponse.json({ error: "Não é possível deletar categoria com subcategorias" }, { status: 400 });
  }

  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  return NextResponse.json({ success: true });
}
