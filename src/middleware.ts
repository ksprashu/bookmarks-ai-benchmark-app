import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function middleware(req: NextRequest) {
  const request_id = crypto.randomUUID();
  const start = Date.now();

  logger.info({
    req: {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers),
    },
    request_id,
  }, 'request received');

  const res = NextResponse.next();

  res.headers.set('X-Request-ID', request_id);

  const end = Date.now();
  logger.info({
    res: {
      status: res.status,
      headers: Object.fromEntries(res.headers),
    },
    request_id,
    latency: end - start,
  }, 'request completed');

  return res;
}

export const config = {
  matcher: '/api/:path*',
};
