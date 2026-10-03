import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const CACHE_KEY = 'top-bookmarks';

export async function GET(req: NextRequest) {
  const request_id = req.headers.get('X-Request-ID') || 'unknown';
  const log = logger.child({ request_id });

  const start = Date.now();
  log.info({ op: 'GET /api/bookmarks/top' }, 'start');

  if (process.env.CACHE_ENABLED === 'true') {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      log.info({ op: 'GET /api/bookmarks/top', latency: Date.now() - start, cache: 'hit' }, 'success');
      return NextResponse.json(JSON.parse(cached as string));
    }
    log.info({ op: 'GET /api/bookmarks/top', cache: 'miss' });
  }

  const topBookmarks = await prisma.bookmark.groupBy({
    by: ['url'],
    _count: {
      url: true,
    },
    orderBy: {
      _count: {
        url: 'desc',
      },
    },
    take: 10,
  });

  if (process.env.CACHE_ENABLED === 'true') {
    await redis.set(CACHE_KEY, JSON.stringify(topBookmarks), 'EX', 60);
    log.info({ op: 'GET /api/bookmarks/top' }, 'cache set');
  }

  log.info({ op: 'GET /api/bookmarks/top', latency: Date.now() - start }, 'success');
  return NextResponse.json(topBookmarks);
}
