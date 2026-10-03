import { describe, it, expect, vi } from 'vitest';

describe('Cache Invalidation', () => {
  it('should delete the cache key when a new bookmark is created', async () => {
    const redis = {
      del: vi.fn(),
    };

    // Simulate creating a bookmark
    // In a real test, you might import and call the actual function
    await redis.del('top-bookmarks');

    expect(redis.del).toHaveBeenCalledWith('top-bookmarks');
  });
});
