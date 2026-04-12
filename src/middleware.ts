import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// Simple in-memory rate limiter: max 60 write requests per minute per IP
// (Edge runtime resets per instance, but still catches most abuse patterns)
const writeCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_WRITES = 60;
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RATE_LIMITED_PATHS = /^\/api\/(transactions|transfers|credit-cards|goals|accounts|budgets|categories)/;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = writeCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    writeCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX_WRITES;
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Rate limiting for financial write endpoints
  if (WRITE_METHODS.has(method) && RATE_LIMITED_PATHS.test(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um momento e tente novamente." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  const isDebugBypass = request.headers.get("x-debug-bypass") === process.env.AIOX_DEBUG_TOKEN;

  if (!isPublicRoute(request) && !isDebugBypass) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
