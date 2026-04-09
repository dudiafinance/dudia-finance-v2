import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/services/email";
import { randomBytes } from "crypto";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`forgot-password:${ip}`, 3, 15 * 60 * 1000); // 3 per 15 min
  if (!rl.success) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this user
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email));

    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires,
    });

    await sendPasswordResetEmail(user.email, user.name, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
