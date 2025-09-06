import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/bookmarks/route';
import { Redis } from '@upstash/redis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: () => ({
      del: vi.fn(),
    }),
  },
}));

vi.mock('@/lib/rate-limiter', () => ({
  rateLimiter: () => null,
}));

describe('cache invalidation', () => {
  beforeEach(async () => {
    await prisma.user.create({
      data: {
        id: 'user_2jxs3bM5A5b2jxs3bM5A5b2jxs3',
        email: 'test@example.com',
      },
    });
  });

  afterEach(async () => {
    await prisma.bookmark.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should invalidate the cache when a new bookmark is created', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com', title: 'Example' }),
    });
    await POST(req);
    const redis = Redis.fromEnv();
    expect(redis.del).toHaveBeenCalledWith('top-bookmarks');
  });
});
