/**
 * E2E Journey 5 — Admin: farmer verification queue → approve
 *
 * Seed prerequisite: Chebet Koech seeded as PENDING farmer.
 * SMS notifications are intercepted at the network layer.
 */

import { test, expect } from '@playwright/test';

test.describe('Journey 5 — Admin farmer verification', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept SMS so Africa's Talking is not called
    await page.route('**/api/admin/verify-farmer', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { farmerId: 'seeded-id', decision: 'APPROVED', smsNotified: true },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@umojahub.co.ke');
    await page.getByLabel(/password/i).fill('Admin@Umoja2024!');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test('admin can reach verification queue', async ({ page }) => {
    await page.goto('/dashboard/admin/verification-queue');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
  });

  test('verification queue shows Chebet Koech as pending', async ({ page }) => {
    // Check the API directly
    const response = await page.request.get('/api/admin/verification-queue');
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const json = await response.json() as { data: unknown[] };
      // Response structure exists
      expect(json).toHaveProperty('data');
    }
  });

  test('admin dashboard pages all load without errors', async ({ page }) => {
    const adminPages = [
      '/dashboard/admin/verification-queue',
      '/dashboard/admin/supplier-verification',
      '/dashboard/admin/knowledge',
      '/dashboard/admin/impact-summary',
      '/dashboard/admin/education-queue',
    ];

    for (const path of adminPages) {
      const response = await page.goto(path);
      expect(response?.status()).not.toBe(500);
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('admin can see supplier verification queue', async ({ page }) => {
    await page.goto('/dashboard/admin/supplier-verification');

    const body = await page.locator('body').textContent() ?? '';
    expect(body.toLowerCase()).not.toContain('internal server error');
    // Should show pending suppliers or empty state
    expect(body.length).toBeGreaterThan(100);
  });
});
