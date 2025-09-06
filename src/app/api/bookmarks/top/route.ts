import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redisClient from '@/lib/redis';
import { logRequest } from '@/lib/logger';

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';
const CACHE_KEY = 'top-bookmarks';
const CACHE_TTL = 60; // seconds

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const logger = logRequest(req, 'GET /api/bookmarks/top');

  logger.info('Request received');

  try {
    if (CACHE_ENABLED && redisClient) {
      try {
        const cachedBookmarks = await redisClient.get(CACHE_KEY);
        if (cachedBookmarks) {
          logger.info('Cache hit', { latency: Date.now() - startTime });
          return NextResponse.json(JSON.parse(cachedBookmarks));
        }
        logger.info('Cache miss');
      } catch (error) {
        logger.error('Redis GET error', { error });
      }
    }

    const topBookmarks = await prisma.bookmark.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (CACHE_ENABLED && redisClient) {
      try {
        await redisClient.set(CACHE_KEY, JSON.stringify(topBookmarks), {
          EX: CACHE_TTL,
        });
        logger.info('Cache set');
      } catch (error) {
        logger.error('Redis SET error', { error });
      }
    }

    logger.info('Top bookmarks fetched from DB', { latency: Date.now() - startTime, count: topBookmarks.length });
    return NextResponse.json(topBookmarks);
  } catch (error) {
    logger.error('An unexpected error occurred', { error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
