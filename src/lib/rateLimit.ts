import { getRedis } from "@/lib/redis";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export async function checkRateLimit(
  userId: string,
  limitPerMin = 5
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (!redis) return { ok: true };
  const key = `rl:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  if (count > limitPerMin) {
    const ttl = await redis.ttl(key);
    return { ok: false, retryAfterSec: Math.max(ttl, 1) };
  }
  return { ok: true };
}
