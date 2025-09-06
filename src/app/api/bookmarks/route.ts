import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { getRedis } from "@/lib/redis";
import { withRequestLogging } from "@/lib/logger";

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  return withRequestLogging("bookmarks_list", user?.id ?? null, async () => {
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bookmarks, { status: 200 });
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  return withRequestLogging("bookmarks_create", user?.id ?? null, async () => {
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const title = typeof body.title === "string" && body.title.trim().length > 0 ? body.title.trim() : url;
    if (!isValidUrl(url)) {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }
    const rl = await checkRateLimit(user.id);
    if (!rl.ok) {
      const res = NextResponse.json({ error: "rate_limited" }, { status: 429 });
      res.headers.set("Retry-After", String(rl.retryAfterSec));
      return res;
    }
    const bookmark = await prisma.bookmark.create({
      data: { userId: user.id, url, title },
    });
    // Invalidate top cache
    if (process.env.CACHE_ENABLED === "true") {
      const redis = await getRedis();
      await redis?.del("top:bookmarks");
    }
    return NextResponse.json(bookmark, { status: 201 });
  });
}

export type BookmarkRecord = Awaited<ReturnType<typeof prisma.bookmark.create>>;
