import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { rateLimiter } from '@/lib/rate-limiter';
import { Redis } from '@upstash/redis';

const prisma = new PrismaClient();
const redis = Redis.fromEnv();

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

export async function GET(req: NextRequest) {
  // In a real app, you'd get the user ID from the session
  const userId = 'user_2jxs3bM5A5b2jxs3bM5A5b2jxs3'; // Hardcoded for now

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(bookmarks);
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = rateLimiter(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // In a real app, you'd get the user ID from the session
  const userId = 'user_2jxs3bM5A5b2jxs3bM5A5b2jxs3'; // Hardcoded for now

  const { url, title } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      userId,
      url,
      title,
    },
  });

  if (CACHE_ENABLED) {
    await redis.del('top-bookmarks');
  }

  return NextResponse.json(bookmark, { status: 201 });
}
