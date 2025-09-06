
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { Redis } from '@upstash/redis'

const prisma = new PrismaClient()
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: '',
})

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true'

export async function GET(req: NextRequest) {
  if (CACHE_ENABLED) {
    const cached = await redis.get('top-bookmarks')
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string))
    }
  }

  const bookmarks = await prisma.bookmark.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  if (CACHE_ENABLED) {
    await redis.set('top-bookmarks', JSON.stringify(bookmarks), {
      ex: 60,
    })
  }

  return NextResponse.json(bookmarks)
}
