import { test, expect } from '@playwright/test';

const userId = `test-user-${Date.now()}`;
const testUrl = 'https://playwright.dev/';

test.describe('Bookmarks API', () => {
  test('should allow a user to create a bookmark', async ({ request }) => {
    const response = await request.post('/api/bookmarks', {
      headers: { 'x-user-id': userId },
      data: { url: testUrl, title: 'Playwright' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.url).toBe(testUrl);
  });

  test('should enforce rate limiting', async ({ request }) => {
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/bookmarks', {
        headers: { 'x-user-id': `${userId}-ratelimit` },
        data: { url: `${testUrl}${i}` },
      });
      expect(response.status()).toBe(201);
    }

    const response = await request.post('/api/bookmarks', {
      headers: { 'x-user-id': `${userId}-ratelimit` },
      data: { url: testUrl },
    });
    expect(response.status()).toBe(429);
    expect(response.headers()['retry-after']).toBeDefined();
  });

  test('should return a list of top bookmarks', async ({ request }) => {
    const response = await request.get('/api/bookmarks/top');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

test.describe('Bookmarks UI', () => {
    test('should allow a user to add a bookmark and see it listed', async ({ page }) => {
      await page.goto('/');
  
      await page.fill('input[id="url"]', 'https://example.com');
      await page.fill('input[id="title"]', 'Test Bookmark');
      await page.click('button[type="submit"]');
  
      await expect(page.locator('text=Test Bookmark')).toBeVisible();
      await expect(page.locator('text=https://example.com')).toBeVisible();
    });
  });
