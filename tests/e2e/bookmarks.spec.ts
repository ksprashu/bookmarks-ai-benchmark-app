import { test, expect } from '@playwright/test';

test('login, add bookmark, see listed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  await page.getByPlaceholder('you@example.com').fill('e2e@example.com');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.locator('[data-testid="add-form"]')).toBeVisible();

  await page.getByPlaceholder('https://example.com').fill('https://playwright.dev');
  await page.getByPlaceholder('Title (optional)').fill('Playwright');
  await page.getByRole('button', { name: 'Add' }).click();
  const list = page.locator('[data-testid="bookmark-list"] li');
  await expect(list).toHaveCount(1);
  await expect(page.getByText('Playwright')).toBeVisible();
});

test('rate limit triggers 429 with Retry-After', async ({ page }) => {
  await page.goto('/');
  // ensure logged in
  if (await page.locator('[data-testid="login-form"]').isVisible()) {
    await page.getByPlaceholder('you@example.com').fill('limit@example.com');
    await page.getByRole('button', { name: 'Login' }).click();
  }
  // Do 6 posts via page.evaluate to capture status
  for (let i = 0; i < 5; i++) {
    const status = await page.evaluate(async () => {
      const r = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://a.com/' + Math.random(), title: 'A' }),
      });
      return r.status;
    });
    expect(status).toBe(201);
  }
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'https://b.com', title: 'B' }),
    });
    return { status: r.status, retryAfter: r.headers.get('Retry-After') };
  });
  expect(res.status).toBe(429);
  expect(Number(res.retryAfter)).toBeGreaterThan(0);
});

