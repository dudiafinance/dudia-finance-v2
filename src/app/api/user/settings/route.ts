import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/utils/encryption";

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    const {
      currency,
      locale,
      timezone,
      notificationPreferences,
      openRouterApiKey,
    } = data;

    // Filter undefined values so we only update what was sent
    const updateData: Record<string, unknown> = {};
    if (currency !== undefined) updateData.currency = currency;
    if (locale !== undefined) updateData.locale = locale;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (notificationPreferences !== undefined) updateData.notificationPreferences = notificationPreferences;
    
    // Encrypt API key before saving
    if (openRouterApiKey !== undefined) {
      updateData.openRouterApiKey = openRouterApiKey ? encrypt(openRouterApiKey) : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum dado para atualizar" }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "Configurações atualizadas com sucesso" });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações", details: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [user] = await db
      .select({
        currency: users.currency,
        locale: users.locale,
        timezone: users.timezone,
        notificationPreferences: users.notificationPreferences,
        openRouterApiKey: users.openRouterApiKey,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Decrypt API key before sending to frontend
    if (user.openRouterApiKey) {
      user.openRouterApiKey = decrypt(user.openRouterApiKey);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
