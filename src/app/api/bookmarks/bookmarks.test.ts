import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { GET } from './route';
import { GET as GET_TOP } from './top/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getRedisClient } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';

vi.mock('@upstash/ratelimit', () => {
  const Ratelimit = vi.fn().mockImplementation(() => {
    return {
      limit: vi.fn(),
    };
  });
  Ratelimit.slidingWindow = vi.fn();
  return { Ratelimit };
});

const prismaMock = new PrismaClient();
const redisMock = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  on: vi.fn(),
  connect: vi.fn(),
  isOpen: true,
};

vi.mocked(getRedisClient).mockResolvedValue(redisMock as any);

describe('/api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 if user is not authenticated', async () => {
      const request = new NextRequest('http://localhost/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid input', async () => {
      const rateLimitMock = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };
      (Ratelimit as any).mockImplementation(() => rateLimitMock);

      const request = new NextRequest('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ url: 'invalid-url' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      const rateLimitMock = {
        limit: vi.fn().mockResolvedValue({
          success: false,
          limit: 5,
          remaining: 0,
          reset: Date.now() + 60000,
        }),
      };
      (Ratelimit as any).mockImplementation(() => rateLimitMock);

      const request = new NextRequest('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(429);
    });

    it('should create a bookmark and invalidate cache', async () => {
      const rateLimitMock = {
        limit: vi.fn().mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: Date.now() + 60000,
        }),
      };
      (Ratelimit as any).mockImplementation(() => rateLimitMock);

      const createdAt = new Date();
      const newBookmark = { id: '1', url: 'https://example.com', title: 'Example', userId: 'user-1', createdAt };
      vi.mocked(prismaMock.bookmark.create).mockResolvedValue(newBookmark);

      process.env.CACHE_ENABLED = 'true';

      const request = new NextRequest('http://localhost/api/bookmarks', {
        method: 'POST',
        headers: { 'x-user-id': 'user-1' },
        body: JSON.stringify({ url: 'https://example.com', title: 'Example' }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body).toEqual({ ...newBookmark, createdAt: createdAt.toISOString() });
      expect(prismaMock.bookmark.create).toHaveBeenCalledWith({
        data: {
          url: 'https://example.com',
          title: 'Example',
          userId: 'user-1',
        },
      });
      expect(redisMock.del).toHaveBeenCalledWith('top-bookmarks');
    });
  });

  describe('GET', () => {
    it('should return bookmarks for the user', async () => {
      const createdAt = new Date();
      const bookmarks = [{ id: '1', url: 'https://example.com', title: 'Example', userId: 'user-1', createdAt }];
      vi.mocked(prismaMock.bookmark.findMany).mockResolvedValue(bookmarks);

      const request = new NextRequest('http://localhost/api/bookmarks', {
        headers: { 'x-user-id': 'user-1' },
      });

      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual([{ ...bookmarks[0], createdAt: createdAt.toISOString() }]);
    });
  });

  describe('GET /top', () => {
    it('should return cached bookmarks if available', async () => {
      const createdAt = new Date();
      const bookmarks = [{ id: '1', url: 'https://example.com', title: 'Example', userId: 'user-1', createdAt }];
      redisMock.get.mockResolvedValue(JSON.stringify([{ ...bookmarks[0], createdAt: createdAt.toISOString() }]));
      process.env.CACHE_ENABLED = 'true';

      const request = new NextRequest('http://localhost/api/bookmarks/top');
      const response = await GET_TOP(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual([{ ...bookmarks[0], createdAt: createdAt.toISOString() }]);
      expect(prismaMock.bookmark.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from DB and set cache if not available', async () => {
      const createdAt = new Date();
      const bookmarks = [{ id: '1', url: 'https://example.com', title: 'Example', userId: 'user-1', createdAt }];
      redisMock.get.mockResolvedValue(null);
      vi.mocked(prismaMock.bookmark.findMany).mockResolvedValue(bookmarks);
      process.env.CACHE_ENABLED = 'true';

      const request = new NextRequest('http://localhost/api/bookmarks/top');
      const response = await GET_TOP(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual([{ ...bookmarks[0], createdAt: createdAt.toISOString() }]);
      expect(prismaMock.bookmark.findMany).toHaveBeenCalled();
      expect(redisMock.set).toHaveBeenCalledWith('top-bookmarks', JSON.stringify(bookmarks), { EX: 60 });
    });
  });
});
