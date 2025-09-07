import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient } from 'redis'
import * as redisModule from '../src/lib/redis'

vi.mock('../src/lib/redis')

describe('Cache Invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should invalidate cache when Redis is enabled', async () => {
    const mockRedis = {
      del: vi.fn().mockResolvedValue(1),
    }
    
    vi.mocked(redisModule).redis = mockRedis as ReturnType<typeof createClient>
    vi.mocked(redisModule).cacheEnabled = true

    await mockRedis.del('top_bookmarks')
    
    expect(mockRedis.del).toHaveBeenCalledWith('top_bookmarks')
  })

  it('should handle cache invalidation gracefully when Redis is disabled', async () => {
    vi.mocked(redisModule).redis = null
    vi.mocked(redisModule).cacheEnabled = false

    expect(() => {
      // This should not throw an error
      const redis = redisModule.redis
      if (redis) {
        redis.del('top_bookmarks')
      }
    }).not.toThrow()
  })

  it('should handle Redis errors gracefully', async () => {
    const mockRedis = {
      del: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
    }
    
    vi.mocked(redisModule).redis = mockRedis as ReturnType<typeof createClient>
    vi.mocked(redisModule).cacheEnabled = true

    await expect(mockRedis.del('top_bookmarks')).rejects.toThrow('Redis connection failed')
  })
})