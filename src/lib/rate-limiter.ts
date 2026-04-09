/**
 * Hybrid Rate Limiter
 * 
 * Production: Uses Upstash KV (Redis) for distributed rate limiting
 * Development: Falls back to in-memory storage
 * 
 * This ensures rate limiting works correctly in serverless environments
 * like Vercel where multiple instances may be running.
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function getMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const existing = memoryStore.get(key)

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt }
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt <= now) {
      memoryStore.delete(key)
    }
  }
}, 60000)

// Upstash configuration
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

let ratelimit: Ratelimit | null = null

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "15 m"),
    analytics: true,
    prefix: "dudia-ratelimit",
  })
}

/**
 * Check if a request should be rate limited.
 * Uses Upstash KV in production, falls back to memory in development.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 15 * 60 * 1000
): Promise<RateLimitResult> {
  // Production: Use Upstash KV
  if (ratelimit) {
    const { success, remaining, reset } = await ratelimit.limit(identifier)
    return {
      success,
      remaining,
      resetAt: reset,
    }
  }

  // Development: Use in-memory fallback
  return getMemoryRateLimit(identifier, limit, windowMs)
}

/**
 * Extract the client IP from a request.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  auth: { limit: 10, windowMs: 15 * 60 * 1000 },// 10 per15 min
  login: { limit: 5, windowMs: 15 * 60 * 1000 },     // 5 per 15 min
  api: { limit: 100, windowMs: 60 * 1000 },            // 100 per min
  passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
} as const