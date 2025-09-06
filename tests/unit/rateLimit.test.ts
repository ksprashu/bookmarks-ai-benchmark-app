import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/src/lib/redis", () => {
  const counts = new Map<string, number>();
  return {
    getRedis: async () => ({
      incr: async (k: string) => {
        const v = (counts.get(k) || 0) + 1;
        counts.set(k, v);
        return v;
      },
      expire: async () => {},
      ttl: async () => 42,
    }),
  };
});

import { checkRateLimit } from "@/lib/rateLimit";

describe("rate limit", () => {
  beforeEach(() => {
    process.env.CACHE_ENABLED = "true"; // enable redis path
  });

  it("allows up to 5 requests per minute", async () => {
    const uid = "u1";
    for (let i = 0; i < 5; i++) {
      const r = await checkRateLimit(uid, 5);
      expect(r.ok).toBe(true);
    }
  });

  it("limits on 6th request with retry-after", async () => {
    const uid = "u2";
    for (let i = 0; i < 5; i++) await checkRateLimit(uid, 5);
    const r = await checkRateLimit(uid, 5);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSec).toBeGreaterThan(0);
  });
});
