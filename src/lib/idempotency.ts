/**
 * Idempotency Key Middleware
 * 
 * Prevents duplicate transactions by tracking idempotency keys.
 * When a client sends the same request multiple times (e.g., due to network
 * retries), the system returns the same response without creating duplicates.
 */

import { db } from "@/lib/db"
import { idempotencyKeys } from "@/lib/db/schema"
import { eq, and, gt, lt } from "drizzle-orm"

interface StoredResponse {
  status: number
  body: unknown
  headers?: Record<string, string>
}

/**
 * Check if an idempotency key has been used recently.
 * Returns the stored response if found, null otherwise.
 */
export async function checkIdempotencyKey(
  key: string,
  userId: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<StoredResponse | null> {
  const cutoff = new Date(Date.now() - maxAgeMs)

  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.key, key),
        eq(idempotencyKeys.userId, userId),
        gt(idempotencyKeys.createdAt, cutoff)
      )
    )
    .limit(1)

  if (existing && existing.response) {
    return existing.response as unknown as StoredResponse
  }

  return null
}

/**
 * Store a response for an idempotency key.
 */
export async function storeIdempotencyKey(
  key: string,
  userId: string,
  response: StoredResponse
): Promise<void> {
  await db.insert(idempotencyKeys).values({
    key,
    userId,
    response: response as unknown as Record<string, unknown>,
    createdAt: new Date(),
  });
}

/**
 * Generate a unique idempotency key from request data.
 * Use this for deterministic key generation.
 */
export function generateIdempotencyKey(
  prefix: string,
  data: Record<string, unknown>
): string {
  const hash = createSimpleHash(JSON.stringify(data))
  return `${prefix}:${hash}`
}

/**
 * Simple hash function (not cryptographically secure, but fast)
 */
function createSimpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Extract idempotency key from request headers.
 * Clients should send: Idempotency-Key: <unique-key>
 */
export function getIdempotencyKey(req: Request): string | null {
  return req.headers.get("Idempotency-Key")
}

/**
 * Clean up old idempotency keys (run periodically)
 */
export async function cleanupOldIdempotencyKeys(
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<number> {
  const cutoff = new Date(Date.now() - maxAgeMs)
  
  const result = await db
    .delete(idempotencyKeys)
    .where(lt(idempotencyKeys.createdAt, cutoff))
    .returning()

  return result.length
}