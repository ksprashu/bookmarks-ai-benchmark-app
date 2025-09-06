import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/bookmarks/route';

describe('input validation', () => {
  it('should return a 400 error if the URL is missing', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ title: 'Example' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return a 400 error if the URL is invalid', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ url: 'invalid-url', title: 'Example' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
