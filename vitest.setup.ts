import { vi } from 'vitest';

vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn().mockResolvedValue({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
    connect: vi.fn(),
    isOpen: true,
  }),
}));

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    bookmark: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});
