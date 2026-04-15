import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const RATE_LIMITS = {
  auth: { windowMs: 60_000, maxRequests: 10 },
  write: { windowMs: 60_000, maxRequests: 100 },
  read: { windowMs: 60_000, maxRequests: 100 },
} as const;

const AUTH_PATHS = /^\/api\/webhooks(.*)/;
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const PROTECTED_WRITE_PATHS = /^\/api\/(transactions|transfers|credit-cards|goals|accounts|budgets|categories|tags|signer)/;

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

type RateLimitType = keyof typeof RATE_LIMITS;

function getRateLimitType(pathname: string, method: string): RateLimitType {
  if (AUTH_PATHS.test(pathname) || pathname.startsWith("/api/auth")) {
    return "auth";
  }
  if (WRITE_METHODS.has(method) && PROTECTED_WRITE_PATHS.test(pathname)) {
    return "write";
  }
  return "read";
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const limitType = getRateLimitType(pathname, method);
  const config = RATE_LIMITS[limitType];

  if (limitType !== "read" || WRITE_METHODS.has(method)) {
    const ip = getClientIP(request);
    const allowed = await checkRateLimit(ip, limitType);
    if (!allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um momento e tente novamente." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(config.windowMs / 1000)),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Date.now() + config.windowMs),
          }
        }
      );
    }
  }

  const isDebugBypass =
    process.env.NODE_ENV !== "production" &&
    !!process.env.AIOX_DEBUG_TOKEN &&
    request.headers.get("x-debug-bypass") === process.env.AIOX_DEBUG_TOKEN;

  if (!isPublicRoute(request) && !isDebugBypass) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
