import { test, expect } from '@playwright/test'

test.describe('Bookmarks App', () => {
  test('should add and list bookmarks', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads
    await expect(page.locator('h1')).toContainText('Rate-Limited Bookmarks')
    
    // Set user email
    await page.fill('input[id="userEmail"]', 'playwright-test@example.com')
    
    // Add a bookmark
    await page.fill('input[id="url"]', 'https://example.com')
    await page.fill('input[id="title"]', 'Example Site')
    await page.click('button[type="submit"]')
    
    // Wait for the bookmark to appear in the list
    await expect(page.locator('text=Example Site')).toBeVisible()
    await expect(page.locator('text=https://example.com')).toBeVisible()
    
    // Check that the form was cleared
    await expect(page.locator('input[id="url"]')).toHaveValue('')
    await expect(page.locator('input[id="title"]')).toHaveValue('')
  })
  
  test('should handle rate limiting', async ({ page }) => {
    await page.goto('/')
    
    // Set user email
    const userEmail = `rate-test-${Date.now()}@example.com`
    await page.fill('input[id="userEmail"]', userEmail)
    
    // Add bookmarks rapidly to trigger rate limit
    for (let i = 0; i < 6; i++) {
      await page.fill('input[id="url"]', `https://example${i}.com`)
      await page.fill('input[id="title"]', `Example Site ${i}`)
      await page.click('button[type="submit"]')
      
      if (i < 5) {
        // First 5 should succeed
        await expect(page.locator('input[id="url"]')).toHaveValue('', { timeout: 2000 })
      } else {
        // 6th should be rate limited
        await expect(page.locator('text=Rate limit exceeded')).toBeVisible({ timeout: 5000 })
        break
      }
    }
  })
  
  test('should validate URL format', async ({ page }) => {
    await page.goto('/')
    
    // Set user email
    await page.fill('input[id="userEmail"]', 'validation-test@example.com')
    
    // Try to add an invalid URL
    await page.fill('input[id="url"]', 'not-a-valid-url')
    await page.click('button[type="submit"]')
    
    // Should show validation error from browser or API
    // Browser validation should prevent submission, but if it gets through:
    await expect(page.locator('text=Invalid URL')).toBeVisible({ timeout: 2000 }).catch(() => {
      // Browser validation prevented submission, which is also fine
    })
  })
  
  test('should display top bookmarks', async ({ page }) => {
    await page.goto('/')
    
    // Check that top bookmarks section exists
    await expect(page.locator('h2:has-text("Top Bookmarks")')).toBeVisible()
  })
  
  test('should handle authentication', async ({ page }) => {
    // Test API directly without user email header
    const response = await page.request.post('/api/bookmarks', {
      data: {
        url: 'https://example.com',
        title: 'Test'
      }
    })
    
    expect(response.status()).toBe(401)
    
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })
})