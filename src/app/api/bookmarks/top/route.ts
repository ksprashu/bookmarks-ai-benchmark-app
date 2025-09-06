import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { withRequestLogging } from "@/lib/logger";

export async function GET() {
  return withRequestLogging("bookmarks_top", null, async () => {
    const useCache = process.env.CACHE_ENABLED === "true";
    const key = "top:bookmarks";
    if (useCache) {
      const redis = await getRedis();
      const cached = await redis?.get(key);
      if (cached) {
        return new NextResponse(cached, {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }
    const top = await prisma.bookmark.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, url: true, createdAt: true },
    });
    const payload = JSON.stringify(top);
    if (useCache) {
      const redis = await getRedis();
      await redis?.setEx(key, 60, payload);
    }
    return new NextResponse(payload, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });
}
