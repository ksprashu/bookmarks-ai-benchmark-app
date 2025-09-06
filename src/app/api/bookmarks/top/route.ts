import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '@/lib/redis';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const logger = {
    info: (...args: any[]) => console.log(`[${requestId}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${requestId}]`, ...args),
    error: (...args: any[]) => console.error(`[${requestId}]`, ...args),
  };

  logger.info({ op: 'GET /api/bookmarks/top' }, 'Fetching top bookmarks');

  if (process.env.CACHE_ENABLED === 'true') {
    try {
      const redis = await getRedisClient();
      const cachedBookmarks = await redis.get('top-bookmarks');

      if (cachedBookmarks) {
        logger.info({ op: 'GET /api/bookmarks/top' }, 'Cache hit');
        return NextResponse.json(JSON.parse(cachedBookmarks));
      }
    } catch (error) {
      logger.error({ op: 'GET /api/bookmarks/top', error }, 'Redis error');
    }
  }

  logger.info({ op: 'GET /api/bookmarks/top' }, 'Cache miss');

  const startTime = Date.now();
  const bookmarks = await prisma.bookmark.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });
  const latency = Date.now() - startTime;

  logger.info({ op: 'GET /api/bookmarks/top', latency }, 'Top bookmarks fetched from DB');

  if (process.env.CACHE_ENABLED === 'true') {
    try {
      const redis = await getRedisClient();
      await redis.set('top-bookmarks', JSON.stringify(bookmarks), {
        EX: 60,
      });
      logger.info({ op: 'GET /api/bookmarks/top' }, 'Cache set');
    } catch (error) {
      logger.error({ op: 'GET /api/bookmarks/top', error }, 'Redis error');
    }
  }

  return NextResponse.json(bookmarks);
}
