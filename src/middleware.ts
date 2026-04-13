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

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { windowMs: 60_000, maxRequests: 10 },
  write: { windowMs: 60_000, maxRequests: 100 },
  read: { windowMs: 60_000, maxRequests: 100 },
};

const rateLimitStore = new Map<string, RateLimitEntry>();

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

function checkRateLimit(ip: string, limitType: string): boolean {
  const config = RATE_LIMITS[limitType] ?? RATE_LIMITS.read;
  const now = Date.now();
  const key = `${ip}:${limitType}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return false;
  }
  return true;
}

function getRateLimitType(pathname: string, method: string): string {
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
    if (!checkRateLimit(ip, limitType)) {
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
