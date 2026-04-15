import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();
  const version = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version ?? "unknown";

  try {
    await db.execute(sql`select 1`);

    return NextResponse.json(
      {
        status: "ok",
        timestamp: now,
        version,
        checks: {
          db: "ok",
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: now,
        version,
        checks: {
          db: "error",
        },
      },
      { status: 503 }
    );
  }
}
