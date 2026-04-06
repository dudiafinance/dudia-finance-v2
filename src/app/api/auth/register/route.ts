import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const { data, error } = await supabaseAdmin.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: name.trim(),
        },
        emailRedirectTo: `${process.env.NEXTAUTH_URL}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "Este email já está cadastrado" },
          { status: 409 }
        );
      }
      console.error("Supabase signup error:", error);
      return NextResponse.json(
        { error: error.message ?? "Erro ao criar conta" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Conta criada! Verifique seu email para ativar sua conta.",
        userId: data.user?.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}