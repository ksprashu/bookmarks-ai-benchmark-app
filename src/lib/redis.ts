import { createClient } from 'redis'

declare global {
  var redis: ReturnType<typeof createClient> | undefined
}

const redisUrl = process.env.REDIS_URL
const cacheEnabled = process.env.CACHE_ENABLED === 'true'

let redis: ReturnType<typeof createClient> | null = null

if (cacheEnabled && redisUrl) {
  redis = global.redis || createClient({ url: redisUrl })
  
  if (process.env.NODE_ENV !== 'production') {
    global.redis = redis
  }
  
  redis.on('error', (err) => console.error('Redis Client Error:', err))
  
  if (!redis.isOpen) {
    redis.connect()
  }
}

export { redis, cacheEnabled }