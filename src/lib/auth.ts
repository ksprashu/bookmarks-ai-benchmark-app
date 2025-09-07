import { NextRequest } from 'next/server'
import { db } from './db'

export interface User {
  id: string
  email: string
  name?: string
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  // For this demo, we'll use a simple header-based auth
  // In production, you'd use proper JWT/session authentication
  const userEmail = request.headers.get('x-user-email')
  
  if (!userEmail) {
    return null
  }
  
  // Find or create user
  let user = await db.user.findUnique({
    where: { email: userEmail }
  })
  
  if (!user) {
    user = await db.user.create({
      data: {
        email: userEmail,
        name: request.headers.get('x-user-name') || undefined
      }
    })
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}