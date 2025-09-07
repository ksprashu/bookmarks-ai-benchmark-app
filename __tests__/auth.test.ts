import { describe, it, expect } from 'vitest'
import { isValidUrl } from '../src/lib/auth'

describe('URL Validation', () => {
  it('should validate correct HTTP URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true)
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('https://example.com/path')).toBe(true)
    expect(isValidUrl('https://subdomain.example.com')).toBe(true)
  })

  it('should reject invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
    expect(isValidUrl('ftp://example.com')).toBe(false)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })

  it('should reject URLs with dangerous protocols', () => {
    expect(isValidUrl('javascript:void(0)')).toBe(false)
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isValidUrl('file:///etc/passwd')).toBe(false)
  })
})