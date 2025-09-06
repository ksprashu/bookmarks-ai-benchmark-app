import { vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      upsert: vi.fn(),
    },
    bookmark: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
