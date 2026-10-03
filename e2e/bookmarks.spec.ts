import { test, expect } from '@playwright/test';

test('smoke test: page loads and shows sign-in button', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('button', { hasText: 'Sign in' })).toBeVisible();
});