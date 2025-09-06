import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => ({ id: "userB", email: "b@example.com" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bookmark: {
      create: vi.fn(),
    },
  },
}));

import { POST } from "@/app/api/bookmarks/route";

describe("input validation", () => {
  it("rejects invalid URLs", async () => {
    const req = new Request("http://localhost/api/bookmarks", {
      method: "POST",
      body: JSON.stringify({ url: "notaurl" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
