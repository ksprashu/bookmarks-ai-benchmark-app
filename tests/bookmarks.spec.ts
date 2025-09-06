import { test, expect } from '@playwright/test';

test.describe('Bookmarks', () => {
  test('should allow a user to create and see a bookmark', async ({ page }) => {
    await page.goto('/');

    const url = `https://example.com/${Math.random()}`;
    const title = 'Test Bookmark';

    await page.getByPlaceholder('URL').fill(url);
    await page.getByPlaceholder('Title (optional)').fill(title);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText(title)).toBeVisible();
  });

  test('should rate limit bookmark creation', async ({ page }) => {
    await page.goto('/');

    for (let i = 0; i < 5; i++) {
      await page.getByPlaceholder('URL').fill(`https://example.com/${Math.random()}`);
      await page.getByRole('button', { name: 'Create' }).click();
      await page.waitForResponse('/api/bookmarks');
    }

    await page.getByPlaceholder('URL').fill(`https://example.com/${Math.random()}`);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Too many requests')).toBeVisible();
  });
});
