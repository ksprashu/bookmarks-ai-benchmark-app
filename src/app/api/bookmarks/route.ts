import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
});

const CACHE_KEY = 'top-bookmarks';

const bookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const request_id = req.headers.get('X-Request-ID') || 'unknown';
  const log = logger.child({ request_id });

  const start = Date.now();
  log.info({ op: 'POST /api/bookmarks' }, 'start');

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    log.warn({ op: 'POST /api/bookmarks', latency: Date.now() - start }, 'unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user_id = session.user.id;
  log.info({ op: 'POST /api/bookmarks', user_id }, 'user identified');

  const { success, reset } = await ratelimit.limit(user_id);
  if (!success) {
    const now = Date.now();
    const retryAfter = Math.floor((reset - now) / 1000);
    log.warn({ op: 'POST /api/bookmarks', user_id, latency: Date.now() - start }, 'rate limited');
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Retry-After': `${retryAfter}`,
      },
    });
  }

  const body = await req.json();
  const parsed = bookmarkSchema.safeParse(body);

  if (!parsed.success) {
    log.warn({ op: 'POST /api/bookmarks', user_id, latency: Date.now() - start }, 'invalid input');
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { url, title } = parsed.data;

  const bookmark = await prisma.bookmark.create({
    data: {
      url,
      title,
      userId: user_id,
    },
  });

  if (process.env.CACHE_ENABLED === 'true') {
    await redis.del(CACHE_KEY);
    log.info({ op: 'POST /api/bookmarks', user_id }, 'cache invalidated');
  }

  log.info({ op: 'POST /api/bookmarks', user_id, latency: Date.now() - start }, 'success');
  return NextResponse.json(bookmark, { status: 201 });
}

export async function GET(req: NextRequest) {
  const request_id = req.headers.get('X-Request-ID') || 'unknown';
  const log = logger.child({ request_id });

  const start = Date.now();
  log.info({ op: 'GET /api/bookmarks' }, 'start');

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    log.warn({ op: 'GET /api/bookmarks', latency: Date.now() - start }, 'unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user_id = session.user.id;
  log.info({ op: 'GET /api/bookmarks', user_id }, 'user identified');

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: user_id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  log.info({ op: 'GET /api/bookmarks', user_id, latency: Date.now() - start }, 'success');
  return NextResponse.json(bookmarks);
}
