import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-03 — Farmer/Lecturer verification "System Lockout Layer".
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI today: an unverified account sees the lockout in place of
// the screen body (farmer fed by GET /api/farmers, lecturer fed by the
// isVerified JWT claim), and a verified account does not.
// ---------------------------------------------------------------------------

test.describe('farmer listings lockout', () => {
  test.describe('unverified farmer', () => {
    test.use({ storageState: authFile('farmer-unverified') });

    test('is locked out of listing creation', async ({ page }) => {
      await page.goto('/dashboard/farmer/listings');

      await expect(page.getByRole('heading', { name: 'My Listings' })).toBeVisible({
        timeout: 30_000,
      });
      // PENDING lockout copy is shown in place of the create surface.
      await expect(page.getByText('Verification under review')).toBeVisible();
      // The create affordance is gone — a PENDING farmer cannot list.
      await expect(page.getByRole('button', { name: 'New listing' })).toHaveCount(0);
    });
  });

  test.describe('verified farmer', () => {
    test.use({ storageState: authFile('farmer') });

    test('can reach the create-listing affordance', async ({ page }) => {
      await page.goto('/dashboard/farmer/listings');

      await expect(page.getByRole('heading', { name: 'My Listings' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole('button', { name: 'New listing' })).toBeVisible();
      await expect(page.getByText('Verification under review')).toHaveCount(0);
      await expect(page.getByText('Verification required')).toHaveCount(0);
    });
  });
});

test.describe('lecturer queue lockout', () => {
  test.describe('unverified lecturer', () => {
    test.use({ storageState: authFile('lecturer-unverified') });

    test('is locked out of the review queue via the isVerified claim', async ({ page }) => {
      await page.goto('/dashboard/lecturer/queue');

      await expect(page.getByText('Account not yet verified')).toBeVisible({ timeout: 30_000 });
    });
  });

  test.describe('verified lecturer', () => {
    test.use({ storageState: authFile('lecturer') });

    test('reaches the review queue', async ({ page }) => {
      await page.goto('/dashboard/lecturer/queue');

      await expect(page.getByRole('heading', { name: 'Pending Reviews' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText('Account not yet verified')).toHaveCount(0);
    });
  });
});
