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
    const data = await req.json();

    const {
      currency,
      locale,
      timezone,
      notificationPreferences,
      openRouterApiKey,
    } = data;

    // Filter undefined values so we only update what was sent
    const updateData: any = {};
    if (currency !== undefined) updateData.currency = currency;
    if (locale !== undefined) updateData.locale = locale;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (notificationPreferences !== undefined) updateData.notificationPreferences = notificationPreferences;
    if (openRouterApiKey !== undefined) updateData.openRouterApiKey = openRouterApiKey;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum dado para atualizar" }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id));

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
  const session = await auth();
  if (!session?.user?.id) {
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
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
