import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from 'redis'
import { checkRateLimit } from '../src/lib/rate-limit'
import * as redisModule from '../src/lib/redis'

vi.mock('../src/lib/redis')
vi.mock('../src/lib/db')

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should allow requests within rate limit when using Redis', async () => {
    const mockRedis = {
      zRemRangeByScore: vi.fn().mockResolvedValue(undefined),
      zCard: vi.fn().mockResolvedValue(2),
      zAdd: vi.fn().mockResolvedValue(undefined),
      expire: vi.fn().mockResolvedValue(undefined),
    }
    
    vi.mocked(redisModule).redis = mockRedis as ReturnType<typeof createClient>
    vi.mocked(redisModule).cacheEnabled = true

    const result = await checkRateLimit('user123')
    
    expect(result.allowed).toBe(true)
    expect(mockRedis.zCard).toHaveBeenCalled()
    expect(mockRedis.zAdd).toHaveBeenCalled()
  })

  it('should deny requests when rate limit exceeded using Redis', async () => {
    const mockRedis = {
      zRemRangeByScore: vi.fn().mockResolvedValue(undefined),
      zCard: vi.fn().mockResolvedValue(5), // At limit
      zRange: vi.fn().mockResolvedValue([{ score: Date.now() - 30000 }]),
    }
    
    vi.mocked(redisModule).redis = mockRedis as ReturnType<typeof createClient>
    vi.mocked(redisModule).cacheEnabled = true

    const result = await checkRateLimit('user123')
    
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
    expect(mockRedis.zCard).toHaveBeenCalled()
  })

  it('should work with database fallback when Redis disabled', async () => {
    vi.mocked(redisModule).redis = null
    vi.mocked(redisModule).cacheEnabled = false

    // Mock the db module
    vi.doMock('../src/lib/db', () => ({
      db: {
        bookmark: {
          count: vi.fn().mockResolvedValue(2)
        }
      }
    }))

    const result = await checkRateLimit('user123')
    
    expect(result.allowed).toBe(true)
  })
})