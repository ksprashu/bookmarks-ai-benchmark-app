import { test, expect } from '@playwright/test';

test.describe('Bookmarks', () => {
  test('should allow a user to add a bookmark and see it listed', async ({ page }) => {
    await page.goto('/');
    await page.fill('input#url', 'https://example.com');
    await page.fill('input#title', 'Example');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Example');
    await expect(page.locator('text=Example')).toBeVisible();
  });

  test('should show a 429 error when the rate limit is exceeded', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 5; i++) {
      await page.fill('input#url', `https://example.com/${i}`);
      await page.fill('input#title', `Example ${i}`);
      await page.click('button[type="submit"]');
      await page.waitForSelector(`text=Example ${i}`);
    }
    await page.fill('input#url', 'https://example.com/6');
    await page.fill('input#title', 'Example 6');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Too many requests')).toBeVisible();
  });
});
