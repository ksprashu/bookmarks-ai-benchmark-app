import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from '@/lib/redis';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const createBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

async function getRateLimiter() {
  const redis = await getRedisClient();
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
  });
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const logger = {
    info: (...args: any[]) => console.log(`[${requestId}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${requestId}]`, ...args),
    error: (...args: any[]) => console.error(`[${requestId}]`, ...args),
  };

  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info({ userId, op: 'POST /api/bookmarks' }, 'Attempting to create bookmark');

  const ratelimit = await getRateLimiter();
  const { success, limit, remaining, reset } = await ratelimit.limit(userId);

  if (!success) {
    logger.warn({ userId, op: 'POST /api/bookmarks' }, 'Rate limit exceeded');
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  const body = await request.json();
  const validation = createBookmarkSchema.safeParse(body);

  if (!validation.success) {
    logger.error({ userId, op: 'POST /api/bookmarks', error: validation.error.flatten() }, 'Invalid input');
    return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
  }

  const { url, title } = validation.data;

  const startTime = Date.now();
  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title,
      userId,
    },
  });
  const latency = Date.now() - startTime;

  logger.info({ userId, op: 'POST /api/bookmarks', latency }, 'Bookmark created');

  if (process.env.CACHE_ENABLED === 'true') {
    const redis = await getRedisClient();
    await redis.del('top-bookmarks');
    logger.info({ userId, op: 'POST /api/bookmarks' }, 'Cache invalidated');
  }

  return NextResponse.json(bookmark, { status: 201 });
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const logger = {
    info: (...args: any[]) => console.log(`[${requestId}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${requestId}]`, ...args),
    error: (...args: any[]) => console.error(`[${requestId}]`, ...args),
  };

  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info({ userId, op: 'GET /api/bookmarks' }, 'Fetching bookmarks');

  const startTime = Date.now();
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  const latency = Date.now() - startTime;

  logger.info({ userId, op: 'GET /api/bookmarks', latency }, 'Bookmarks fetched');

  return NextResponse.json(bookmarks);
}
