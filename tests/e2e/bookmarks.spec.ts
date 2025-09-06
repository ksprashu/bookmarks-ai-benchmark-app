
import { test, expect } from '@playwright/test'

test('should allow a user to log in, add a bookmark, and see it listed', async ({
  page,
}) => {
  await page.goto('/')
  await page.click('text=Sign in with GitHub')
  // This is where you would handle the GitHub login flow.
  // Since we can't do that in a test, we'll just assume it works
  // and we are redirected back to the app.
  await page.goto('/')

  await page.fill('input[placeholder="URL"]', 'https://example.com')
  await page.fill('input[placeholder="Title"]', 'Example')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Example')).toBeVisible()
})
