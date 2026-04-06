import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

async function getUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as any)?.id ?? null;
}

// Ensure the tags column exists (idempotent, runs once per cold start effectively)
let columnEnsured = false;
async function ensureTagsColumn() {
  if (columnEnsured) return;
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb`);
  columnEnsured = true;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTagsColumn();

  const rows = await db.execute<{ tags: string[] | null }>(
    sql`SELECT tags FROM users WHERE id = ${userId} LIMIT 1`
  );
  const tags = (rows.rows?.[0] as any)?.tags ?? [];
  return NextResponse.json(Array.isArray(tags) ? tags : []);
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an array of strings" }, { status: 400 });
  }

  const tags: string[] = body
    .filter((t) => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim().toLowerCase());

  await ensureTagsColumn();

  await db.execute(
    sql`UPDATE users SET tags = ${JSON.stringify(tags)}::jsonb WHERE id = ${userId}`
  );
  return NextResponse.json(tags);
}
