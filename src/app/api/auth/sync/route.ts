import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return NextResponse.json({ success: true, message: "Usuário já sincronizado" });
    }

    const { data: { users: supabaseUsers }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Error fetching Supabase users:", error);
      return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 });
    }

    const supabaseUser = supabaseUsers.find(u => u.email === normalizedEmail);

    if (!supabaseUser) {
      return NextResponse.json({ error: "Usuário não encontrado no Supabase" }, { status: 404 });
    }

    if (!supabaseUser.email_confirmed_at) {
      return NextResponse.json({ error: "Email não confirmado" }, { status: 400 });
    }

    const name = supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0] || "Usuário";
    const passwordHash = await hashPassword(randomBytes(16).toString("hex"));

    await db.insert(users).values({
      supabaseId: supabaseUser.id,
      name,
      email: normalizedEmail,
      passwordHash,
      emailVerified: new Date(supabaseUser.email_confirmed_at),
    });

    return NextResponse.json({ success: true, message: "Usuário sincronizado com sucesso" });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}