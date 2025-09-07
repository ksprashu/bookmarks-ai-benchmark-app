import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { redis, cacheEnabled } from '@/lib/redis'
import { log, createRequestId } from '@/lib/logger'

const CACHE_TTL = 60 // 60 seconds
const CACHE_KEY = 'top_bookmarks'

export async function GET(request: NextRequest) {
  const requestId = createRequestId()
  const startTime = Date.now()
  
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      log('info', 'Unauthorized GET /api/bookmarks/top', { 
        request_id: requestId, 
        op: 'top_bookmarks'
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    let topBookmarks
    let cacheHit = false
    
    // Try to get from cache if Redis is enabled
    if (cacheEnabled && redis) {
      const cached = await redis.get(CACHE_KEY)
      if (cached) {
        topBookmarks = JSON.parse(cached)
        cacheHit = true
      }
    }
    
    // If not in cache, fetch from database
    if (!topBookmarks) {
      // For this demo, "top" bookmarks are the most recently created across all users
      // In a real app, this might be based on views, likes, or other metrics
      topBookmarks = await db.bookmark.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          url: true,
          title: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      })
      
      // Cache the result if Redis is enabled
      if (cacheEnabled && redis) {
        await redis.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(topBookmarks))
      }
    }
    
    const latency = Date.now() - startTime
    log('info', 'Retrieved top bookmarks', {
      request_id: requestId,
      user_id: user.id,
      op: 'top_bookmarks',
      latency,
      cache_hit: cacheHit,
      count: topBookmarks.length
    })
    
    return NextResponse.json(topBookmarks)
  } catch (error) {
    const latency = Date.now() - startTime
    log('error', 'Error retrieving top bookmarks', {
      request_id: requestId,
      op: 'top_bookmarks',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}