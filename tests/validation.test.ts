
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const createBookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
})

describe('Input Validation', () => {
  it('should pass with a valid URL', () => {
    const result = createBookmarkSchema.safeParse({
      url: 'https://example.com',
    })
    expect(result.success).toBe(true)
  })

  it('should fail with an invalid URL', () => {
    const result = createBookmarkSchema.safeParse({
      url: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})
