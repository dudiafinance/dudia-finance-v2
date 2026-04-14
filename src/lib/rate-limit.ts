import { kv } from '@vercel/kv';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMITS = {
  auth: { windowMs: 60_000, maxRequests: 10 },
  write: { windowMs: 60_000, maxRequests: 100 },
  read: { windowMs: 60_000, maxRequests: 100 },
};

type LimitType = keyof typeof RATE_LIMITS;

export async function checkRateLimit(ip: string, limitType: LimitType): Promise<boolean> {
  const config = RATE_LIMITS[limitType];
  const key = `ratelimit:${ip}:${limitType}`;
  
  try {
    const current = await kv.get<RateLimitEntry>(key);
    const now = Date.now();
    
    if (!current || now > current.resetAt) {
      await kv.set(key, { count: 1, resetAt: now + config.windowMs }, { ex: Math.ceil(config.windowMs / 1000) });
      return true;
    }
    
    if (current.count >= config.maxRequests) {
      return false;
    }
    
    await kv.set(key, { count: current.count + 1, resetAt: current.resetAt }, { ex: Math.ceil((current.resetAt - now) / 1000) });
    return true;
  } catch {
    console.warn('[RateLimit] Redis unavailable, allowing request');
    return true;
  }
}
