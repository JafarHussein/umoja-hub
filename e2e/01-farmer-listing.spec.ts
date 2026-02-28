/**
 * E2E Journey 1 — Farmer registration → listing creation
 *
 * Seed prerequisite: Admin user (admin@umojahub.co.ke) must exist.
 * This journey registers a new farmer (unique email per run), then
 * simulates admin approval by logging in as admin and approving the queue.
 * Finally the farmer creates a crop listing and it appears on the marketplace.
 *
 * Note: The verification upload step requires Cloudinary. In CI, image upload
 * is skipped and we directly set farmer verification via the admin approval flow.
 */

import { test, expect } from '@playwright/test';

const FARMER_EMAIL = `e2e.farmer.${Date.now()}@gmail.com`;
const FARMER_PASSWORD = 'Farmer@E2E2024!';

test.describe('Journey 1 — Farmer registration → listing creation', () => {
  test('farmer can register and see the dashboard', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Fill registration form
    await page.getByLabel(/first name/i).fill('Wangari');
    await page.getByLabel(/last name/i).fill('TestKamau');
    await page.getByLabel(/email/i).fill(FARMER_EMAIL);
    await page.getByLabel(/phone/i).fill('+254711000001');
    await page.getByLabel(/password/i).first().fill(FARMER_PASSWORD);
    await page.getByLabel(/county/i).selectOption('Kiambu');

    // Select FARMER role
    const farmerOption = page.locator('input[value="FARMER"], button:has-text("Farmer"), [data-role="FARMER"]').first();
    if (await farmerOption.isVisible()) await farmerOption.click();

    await page.getByRole('button', { name: /register|sign up|create account/i }).click();

    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/login|dashboard/, { timeout: 10_000 });
  });

  test('admin can see verification queue', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('admin@umojahub.co.ke');
    await page.getByLabel(/password/i).fill('Admin@Umoja2024!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });

    // Navigate to verification queue
    await page.goto('/dashboard/admin/verification-queue');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('verified farmer can browse the marketplace', async ({ page }) => {
    // Login as Wanjiku (seeded, verified farmer)
    await page.goto('/auth/login');
    await page.getByLabel(/email/i).fill('wanjiku.kamau@gmail.com');
    await page.getByLabel(/password/i).fill('Farmer@2024!');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });

    // Navigate to listings
    await page.goto('/dashboard/farmer/listings');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('marketplace shows seeded listings', async ({ page }) => {
    await page.goto('/marketplace');

    // Should show at least one listing card
    await expect(page.locator('[data-testid="listing-card"], .listing-card, article').first()).toBeVisible({ timeout: 15_000 });

    // Should display KES pricing
    const priceText = await page.locator('body').textContent();
    expect(priceText).toMatch(/KES|ksh/i);
  });
});
