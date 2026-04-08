import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Get the user to check the current password
    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Usuário não encontrado ou não tem senha configurada." }, { status: 404 });
    }

    // Compare string password with hash
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "A senha atual está incorreta" },
        { status: 400 }
      );
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Erro ao alterar senha", details: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    );
  }
}
