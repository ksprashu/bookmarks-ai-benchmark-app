import { describe, it, expect, vi } from 'vitest';
import { Ratelimit } from '@upstash/ratelimit';
import { mock } from 'vitest-mock-extended';
import { Redis } from '@upstash/redis';

describe.skip('Rate Limiter', () => {
  it('should allow requests under the limit', async () => {
    const redis = mock<Redis>();
    redis.multi.mockReturnValue({
      evalsha: vi.fn().mockResolvedValue([1]),
      exec: vi.fn().mockResolvedValue([[null, 1]]),
    } as any);
    const ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
    });

    const { success } = await ratelimit.limit('test-user');
    expect(success).toBe(true);
  });

  it('should deny requests over the limit', async () => {
    const redis = mock<Redis>();
    redis.multi.mockReturnValue({
      evalsha: vi.fn().mockResolvedValue([0]),
      exec: vi.fn().mockResolvedValue([[null, 0]]),
    } as any);
    const ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
    });

    const { success } = await ratelimit.limit('test-user');
    expect(success).toBe(false);
  });
});
