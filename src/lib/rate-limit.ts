import { redis, cacheEnabled } from './redis'
import { db } from './db'

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds?: number
}

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds
const RATE_LIMIT_MAX = 5 // 5 requests per minute

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  
  if (cacheEnabled && redis) {
    // Redis-based rate limiting (sliding window)
    const key = `rate_limit:${userId}`
    
    // Remove expired entries
    await redis.zRemRangeByScore(key, 0, windowStart)
    
    // Count current requests in window
    const currentRequests = await redis.zCard(key)
    
    if (currentRequests >= RATE_LIMIT_MAX) {
      // Get the oldest request timestamp to calculate retry-after
      const oldestRequest = await redis.zRange(key, 0, 0, { withScores: true })
      const retryAfterMs = oldestRequest.length > 0 
        ? (oldestRequest[0].score as number) + RATE_LIMIT_WINDOW - now
        : RATE_LIMIT_WINDOW
      
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
      }
    }
    
    // Add current request
    await redis.zAdd(key, { score: now, value: `${now}` })
    await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW / 1000))
    
    return { allowed: true }
  } else {
    // Database-based rate limiting fallback
    // Note: This is less efficient but works without Redis
    const recentRequests = await db.bookmark.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(windowStart)
        }
      }
    })
    
    if (recentRequests >= RATE_LIMIT_MAX) {
      // For simplicity, return fixed retry-after when using DB
      return {
        allowed: false,
        retryAfterSeconds: 60
      }
    }
    
    return { allowed: true }
  }
}