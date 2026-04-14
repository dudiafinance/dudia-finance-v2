interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS = {
  auth: { windowMs: 60_000, maxRequests: 10 },
  write: { windowMs: 60_000, maxRequests: 100 },
  read: { windowMs: 60_000, maxRequests: 100 },
};

type LimitType = keyof typeof RATE_LIMITS;

export async function checkRateLimit(ip: string, limitType: LimitType): Promise<boolean> {
  const config = RATE_LIMITS[limitType];
  const key = `ratelimit:${ip}:${limitType}`;
  const now = Date.now();
  
  const current = memoryStore.get(key);
  
  if (!current || now > current.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }
  
  if (current.count >= config.maxRequests) {
    return false;
  }
  
  memoryStore.set(key, { count: current.count + 1, resetAt: current.resetAt });
  return true;
}
