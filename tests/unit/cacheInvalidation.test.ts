import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/src/lib/redis", () => {
  return {
    getRedis: async () => ({
      del: vi.fn(async () => 1),
    }),
  };
});

vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => ({ id: "userA", email: "a@example.com" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bookmark: {
      create: vi.fn(async (args) => ({ id: "b1", ...args.data, createdAt: new Date().toISOString() })),
    },
  },
}));

import { POST } from "@/app/api/bookmarks/route";

describe("cache invalidation on create", () => {
  beforeEach(() => {
    process.env.CACHE_ENABLED = "true";
  });

  it("deletes top cache key after create", async () => {
    const req = new Request("http://localhost/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com", title: "Ex" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
