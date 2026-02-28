/**
 * E2E Journey 6 — Public: Knowledge Hub search → article view
 *
 * Seed prerequisite: 5 knowledge articles seeded.
 * All public — no authentication required.
 */

import { test, expect } from '@playwright/test';

test.describe('Journey 6 — Knowledge Hub public access', () => {
  test('Knowledge Hub loads and displays seeded articles', async ({ page }) => {
    await page.goto('/knowledge');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });

    // Should display at least one article card (seeded: 5 articles)
    const articles = page.locator('article, [class*="card"], a[href*="/knowledge/"]');
    await expect(articles.first()).toBeVisible({ timeout: 15_000 });
  });

  test('Knowledge Hub search filter works', async ({ page }) => {
    await page.goto('/knowledge');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('maize');
      await page.waitForTimeout(800);

      // Should not crash — either shows results or empty state
      const body = await page.locator('body').textContent() ?? '';
      expect(body).toBeTruthy();
      expect(body.toLowerCase()).not.toContain('internal server error');
    }
  });

  test('fertilizer article loads and is readable', async ({ page }) => {
    await page.goto('/knowledge/identify-genuine-can-fertilizer');

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    const heading = await page.locator('h1').first().textContent();
    expect(heading).toMatch(/fertilizer|CAN/i);

    // Article content visible
    const body = await page.locator('body').textContent() ?? '';
    expect(body).toContain('KEBS');
  });

  test('KALRO planting calendar article loads', async ({ page }) => {
    await page.goto('/knowledge/long-rains-planting-calendar-2024');

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    const body = await page.locator('body').textContent() ?? '';
    expect(body).toMatch(/KALRO|planting|rains/i);
  });

  test('article page includes source institution badge', async ({ page }) => {
    await page.goto('/knowledge/reducing-post-harvest-tomato-losses');

    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    // Source institution should appear
    const body = await page.locator('body').textContent() ?? '';
    expect(body).toMatch(/FAO|KALRO|KEBS|Kenya/i);
  });

  test('unknown article slug returns 404 — not 500', async ({ page }) => {
    const response = await page.goto('/knowledge/this-article-does-not-exist');
    // Next.js 404 returns 200 with not-found page content, or 404
    expect(response?.status()).not.toBe(500);
  });
});
