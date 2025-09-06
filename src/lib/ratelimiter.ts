import { Ratelimit } from '@upstash/ratelimit';
import redis from './redis';

if (!redis) {
  throw new Error("Redis client not initialized");
}

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
});
