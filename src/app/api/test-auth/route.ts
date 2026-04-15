import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CLERK_SECRET_KEY ?? ""}`;
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const listRes = await fetch(
      `https://api.clerk.com/v1/users?filter_query=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!listRes.ok) {
      return NextResponse.json({ error: "Clerk API error" }, { status: listRes.status });
    }

    const users = await listRes.json();
    if (!Array.isArray(users) || !users.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].id;

    const sessionRes = await fetch("https://api.clerk.com/v1/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      return NextResponse.json({ error: `Session creation failed: ${errText}` }, { status: sessionRes.status });
    }

    const session = await sessionRes.json();
    return NextResponse.json({ sessionId: session.id, userId }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}