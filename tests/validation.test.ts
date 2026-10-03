import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const bookmarkSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

describe('Input Validation', () => {
  it('should pass with a valid URL', () => {
    const result = bookmarkSchema.safeParse({ url: 'https://example.com' });
    expect(result.success).toBe(true);
  });

  it('should fail with an invalid URL', () => {
    const result = bookmarkSchema.safeParse({ url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('should pass with a valid URL and title', () => {
    const result = bookmarkSchema.safeParse({
      url: 'https://example.com',
      title: 'Example',
    });
    expect(result.success).toBe(true);
  });
});
