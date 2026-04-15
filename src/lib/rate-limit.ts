import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL;
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!rawUrl || !rawToken) {
    return null;
  }

  const url = rawUrl.trim();
  const token = rawToken.trim();
  if (!url || !token) {
    return null;
  }

  if (!redis) {
    try {
      redis = new Redis({ url, token });
    } catch {
      return null;
    }
  }
  return redis;
}

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
  const redisClient = getRedis();

  if (!redisClient) {
    return true;
  }

  try {
    const current = await redisClient.get<RateLimitEntry>(key);
    const now = Date.now();

    if (!current || now > current.resetAt) {
      await redisClient.set(key, { count: 1, resetAt: now + config.windowMs }, { ex: Math.ceil(config.windowMs / 1000) });
      return true;
    }

    if (current.count >= config.maxRequests) {
      return false;
    }

    await redisClient.set(key, { count: current.count + 1, resetAt: current.resetAt }, { ex: Math.ceil((current.resetAt - now) / 1000) });
    return true;
  } catch {
    return true;
  }
}
