import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, avatar } = await req.json();

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e Email são obrigatórios" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        name,
        email,
        avatar,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, message: "Perfil atualizado com sucesso" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil", details: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    );
  }
}
