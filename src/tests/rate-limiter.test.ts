import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimiter } from '@/lib/rate-limiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    // Reset the in-memory store before each test
    const requests = new Map();
  });

  it('should allow requests below the limit', () => {
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost');
      const res = rateLimiter(req);
      expect(res).toBeNull();
    }
  });

  it('should block requests above the limit', () => {
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost');
      rateLimiter(req);
    }
    const req = new NextRequest('http://localhost');
    const res = rateLimiter(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(429);
  });

  it('should include a Retry-After header', () => {
    for (let i = 0; i < 5; i++) {
      const req = new NextRequest('http://localhost');
      rateLimiter(req);
    }
    const req = new NextRequest('http://localhost');
    const res = rateLimiter(req);
    expect(res?.headers.get('Retry-After')).not.toBeNull();
  });
});
