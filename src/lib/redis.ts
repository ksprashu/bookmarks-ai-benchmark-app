import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: '', // Upstash Redis does not require a token when using URLs
});
