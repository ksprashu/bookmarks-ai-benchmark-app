import { NextRequest, NextResponse } from 'next/server';

const requests = new Map<string, { count: number; lastRequest: number }>();
const limit = 5;
const window = 60 * 1000; // 1 minute

export function rateLimiter(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const userRequests = requests.get(ip);
  const now = Date.now();

  if (userRequests && now - userRequests.lastRequest < window) {
    if (userRequests.count >= limit) {
      const retryAfter = Math.ceil((userRequests.lastRequest + window - now) / 1000);
      return new NextResponse('Too many requests', {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      });
    }
    requests.set(ip, { count: userRequests.count + 1, lastRequest: now });
  } else {
    requests.set(ip, { count: 1, lastRequest: now });
  }

  return null;
}
