import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, avatar } = await req.json();

    // Basic validation
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 2 caracteres" }, { status: 400 });
    }
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Check if email belongs to another user
    const existingUser = await db.query.users.findFirst({
      where: (users, { and, eq, not }) => and(eq(users.email, email.toLowerCase().trim()), not(eq(users.id, userId)))
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este email já está sendo usado por outra conta" }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        name,
        email,
        avatar,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "Perfil atualizado com sucesso" });
  } catch (error) {
    logger.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil", details: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    );
  }
}
