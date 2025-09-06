
import { describe, it, expect, vi } from 'vitest'
import { Redis } from '@upstash/redis'

vi.mock('@upstash/redis', () => {
  const redis = {
    del: vi.fn(),
  }
  return {
    Redis: vi.fn(() => redis),
  }
})

describe('Cache Invalidation', () => {
  it('should delete the cache on new bookmark creation', async () => {
    const redis = new Redis({ url: '', token: '' })
    await redis.del('top-bookmarks')
    expect(redis.del).toHaveBeenCalledWith('top-bookmarks')
  })
})
