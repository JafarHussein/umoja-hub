/**
 * E2E Journey 7 — Public portfolio verification URL
 *
 * Critical: This page must work WITHOUT any authentication cookie.
 * It is the public-facing proof-of-work for students and employers.
 *
 * Seed prerequisite: Students Brian Otieno and Amina Waweru seeded.
 */

import { test, expect } from '@playwright/test';

test.describe('Journey 7 — Public portfolio verification (no auth)', () => {
  // Ensure no cookies / auth state bleeds into these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('portfolio page for Brian Otieno renders without login', async ({ page }) => {
    const response = await page.goto('/experience/portfolio/brianotieno-dev');

    // Must not redirect to login
    expect(page.url()).not.toContain('/auth/login');
    expect(response?.status()).not.toBe(500);

    await expect(page.locator('body')).toBeVisible();
  });

  test('portfolio page for Amina Waweru renders without login', async ({ page }) => {
    const response = await page.goto('/experience/portfolio/aminawaweru');

    expect(page.url()).not.toContain('/auth/login');
    expect(response?.status()).not.toBe(500);

    await expect(page.locator('body')).toBeVisible();
  });

  test('project verification URL renders without login', async ({ page }) => {
    // The verify page accepts any projectId and shows verification status
    const response = await page.goto('/experience/verify/any-project-id');

    // Should not 500 or redirect to login
    expect(response?.status()).not.toBe(500);
    expect(page.url()).not.toContain('/auth/login');

    await expect(page.locator('body')).toBeVisible();
  });

  test('unknown portfolio username shows not-found — not 500', async ({ page }) => {
    const response = await page.goto('/experience/portfolio/user-that-does-not-exist');

    expect(response?.status()).not.toBe(500);

    const body = await page.locator('body').textContent() ?? '';
    // Should show not found message or empty portfolio — not a crash
    expect(body.toLowerCase()).not.toContain('internal server error');
  });

  test('landing page renders without auth', async ({ page }) => {
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15_000 });

    const body = await page.locator('body').textContent() ?? '';
    // Landing page should mention UmojaHub and Kenya
    expect(body).toMatch(/Umoja|Kenya|food|farmer/i);
  });

  test('marketplace is publicly accessible without login', async ({ page }) => {
    const response = await page.goto('/marketplace');

    expect(response?.status()).toBe(200);
    expect(page.url()).not.toContain('/auth/login');

    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });
});
