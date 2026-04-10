import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request): Promise<NextResponse> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: "Filename and body are required" }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    // Atualiza o db com a nova URL
    await db
      .update(users)
      .set({
        avatar: blob.url,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do avatar", details: error instanceof Error ? error.message : "Desconhecido" },
      { status: 500 }
    );
  }
}
