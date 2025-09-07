import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isValidUrl } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { redis, cacheEnabled } from '@/lib/redis'
import { log, createRequestId } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestId = createRequestId()
  const startTime = Date.now()
  
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      log('info', 'Unauthorized GET /api/bookmarks', { 
        request_id: requestId, 
        op: 'list_bookmarks'
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const bookmarks = await db.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        title: true,
        createdAt: true
      }
    })
    
    const latency = Date.now() - startTime
    log('info', 'Listed bookmarks', {
      request_id: requestId,
      user_id: user.id,
      op: 'list_bookmarks',
      latency,
      count: bookmarks.length
    })
    
    return NextResponse.json(bookmarks)
  } catch (error) {
    const latency = Date.now() - startTime
    log('error', 'Error listing bookmarks', {
      request_id: requestId,
      op: 'list_bookmarks',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const requestId = createRequestId()
  const startTime = Date.now()
  
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      log('info', 'Unauthorized POST /api/bookmarks', { 
        request_id: requestId, 
        op: 'create_bookmark'
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(user.id)
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
      
      if (rateLimitResult.retryAfterSeconds) {
        response.headers.set('Retry-After', rateLimitResult.retryAfterSeconds.toString())
      }
      
      const latency = Date.now() - startTime
      log('info', 'Rate limit exceeded', {
        request_id: requestId,
        user_id: user.id,
        op: 'create_bookmark',
        latency,
        retry_after: rateLimitResult.retryAfterSeconds
      })
      
      return response
    }
    
    const body = await request.json()
    const { url, title } = body
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    const bookmark = await db.bookmark.create({
      data: {
        userId: user.id,
        url,
        title: title || null
      }
    })
    
    // Invalidate top bookmarks cache
    if (cacheEnabled && redis) {
      await redis.del('top_bookmarks')
    }
    
    const latency = Date.now() - startTime
    log('info', 'Created bookmark', {
      request_id: requestId,
      user_id: user.id,
      op: 'create_bookmark',
      latency,
      bookmark_id: bookmark.id
    })
    
    return NextResponse.json(bookmark, { status: 201 })
  } catch (error) {
    const latency = Date.now() - startTime
    log('error', 'Error creating bookmark', {
      request_id: requestId,
      op: 'create_bookmark',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}