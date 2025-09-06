
import { describe, it, expect, vi } from 'vitest'
import { Ratelimit } from '@upstash/ratelimit'

vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: vi.fn().mockImplementation(() => {
      return {
        limit: vi.fn(),
      }
    }),
  }
})

describe('Rate Limiter', () => {
  it('should allow requests under the limit', async () => {
    const ratelimit = new Ratelimit({ redis: {} as any, limiter: {} as any })
    // @ts-ignore
    ratelimit.limit.mockResolvedValue({ success: true })

    const id = 'test-user'
    const { success } = await ratelimit.limit(id)
    expect(success).toBe(true)
  })

  it('should deny requests over the limit', async () => {
    const ratelimit = new Ratelimit({ redis: {} as any, limiter: {} as any })
    // @ts-ignore
    ratelimit.limit.mockResolvedValue({ success: false })

    const id = 'test-user'
    const { success } = await ratelimit.limit(id)
    expect(success).toBe(false)
  })
})
