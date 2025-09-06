import { ratelimit } from '@/lib/ratelimiter';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import redisClient from '@/lib/redis';
import { logRequest } from '@/lib/logger';

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';
const CACHE_KEY = 'top-bookmarks';

const createBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const userId = req.headers.get('x-user-id');
  const logger = logRequest(req, 'POST /api/bookmarks', userId);

  logger.info('Request received');

  if (!userId) {
    logger.error('Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(userId);

    if (!success) {
      logger.error('Rate limit exceeded');
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      });
    }

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: `${userId}@example.com`,
      },
    });

    const result = createBookmarkSchema.safeParse(await req.json());

    if (!result.success) {
      logger.error('Invalid request body', { error: result.error });
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { url, title } = result.data;

    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title,
        userId,
      },
    });

    if (CACHE_ENABLED && redisClient) {
      try {
        await redisClient.del(CACHE_KEY);
        logger.info('Cache invalidated');
      } catch (error) {
        logger.error('Redis DEL error', { error });
      }
    }

    logger.info('Bookmark created', { latency: Date.now() - startTime });
    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    logger.error('An unexpected error occurred', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const userId = req.headers.get('x-user-id');
  const logger = logRequest(req, 'GET /api/bookmarks', userId);

  logger.info('Request received');

  if (!userId) {
    logger.error('Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Bookmarks fetched', { latency: Date.now() - startTime, count: bookmarks.length });
    return NextResponse.json(bookmarks);
  } catch (error) {
    logger.error('An unexpected error occurred', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
