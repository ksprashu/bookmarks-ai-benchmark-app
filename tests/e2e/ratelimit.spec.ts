
import { test, expect } from '@playwright/test'

test('should rate limit bookmark creation', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Sign in with GitHub')
  await page.goto('/')

  for (let i = 0; i < 5; i++) {
    await page.fill('input[placeholder="URL"]', `https://example.com/${i}`)
    await page.fill('input[placeholder="Title"]', `Example ${i}`)
    await page.click('button[type="submit"]')
    await expect(page.locator(`text=Example ${i}`)).toBeVisible()
  }

  await page.fill('input[placeholder="URL"]', 'https://example.com/6')
  await page.fill('input[placeholder="Title"]', 'Example 6')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Too many requests')).toBeVisible()
})
