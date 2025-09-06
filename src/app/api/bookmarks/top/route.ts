import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';

const prisma = new PrismaClient();
const redis = Redis.fromEnv();

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

export async function GET(req: NextRequest) {
  if (!CACHE_ENABLED) {
    const bookmarks = await prisma.bookmark.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return NextResponse.json(bookmarks);
  }

  const cachedBookmarks = await redis.get('top-bookmarks');

  if (cachedBookmarks) {
    return NextResponse.json(JSON.parse(cachedBookmarks as string));
  }

  const bookmarks = await prisma.bookmark.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  await redis.set('top-bookmarks', JSON.stringify(bookmarks), { ex: 60 });

  return NextResponse.json(bookmarks);
}
