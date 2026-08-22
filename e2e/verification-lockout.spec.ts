import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-03 — Farmer/Lecturer verification "System Lockout Layer".
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI today: an unverified account sees the lockout in place of
// the screen body (farmer fed by GET /api/farmers, lecturer fed by the
// isVerified JWT claim), and a verified account does not.
//
// Presence and absence are asserted against `data-testid="verification-lockout"`
// rather than the lockout's sentences. Quoting the copy made these specs break
// on a wording change with nothing actually wrong — and worse, the negative
// assertions would have gone on passing while showing a lockout, the moment its
// wording drifted. The tone attribute pins *which* lockout, which is the part
// that carries meaning.
// ---------------------------------------------------------------------------

const lockout = 'verification-lockout';

test.describe('farmer listings lockout', () => {
  test.describe('unverified farmer', () => {
    test.use({ storageState: authFile('farmer-unverified') });

    test('is locked out of listing creation', async ({ page }) => {
      await page.goto('/dashboard/farmer/listings');

      await expect(page.getByRole('heading', { name: 'My Produce' })).toBeVisible({
        timeout: 30_000,
      });
      // The PENDING lockout stands in place of the create surface.
      const wall = page.getByTestId(lockout);
      await expect(wall).toBeVisible();
      await expect(wall).toHaveAttribute('data-lockout-tone', 'pending');
      // The create affordance is gone — a PENDING farmer cannot list.
      await expect(page.getByRole('button', { name: 'Add produce' })).toHaveCount(0);
    });

    test('is given a way to finish verification, not just a refusal', async ({ page }) => {
      // A wall with no door is what trapped users in the funnel. Whatever the
      // lockout says, it must lead somewhere.
      await page.goto('/dashboard/verify');
      await expect(page.getByRole('heading', { name: /verify your identity/i })).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test.describe('verified farmer', () => {
    test.use({ storageState: authFile('farmer') });

    test('can reach the create-listing affordance', async ({ page }) => {
      await page.goto('/dashboard/farmer/listings');

      await expect(page.getByRole('heading', { name: 'My Produce' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole('button', { name: 'Add produce' })).toBeVisible();
      await expect(page.getByTestId(lockout)).toHaveCount(0);
    });
  });
});

test.describe('lecturer queue lockout', () => {
  test.describe('unverified lecturer', () => {
    test.use({ storageState: authFile('lecturer-unverified') });

    test('is locked out of the review queue via the isVerified claim', async ({ page }) => {
      await page.goto('/dashboard/lecturer/reports');

      await expect(page.getByTestId(lockout)).toBeVisible({ timeout: 30_000 });
    });
  });

  test.describe('verified lecturer', () => {
    test.use({ storageState: authFile('lecturer') });

    test('reaches the review queue', async ({ page }) => {
      await page.goto('/dashboard/lecturer/reports');

      await expect(page.getByRole('heading', { name: 'Reports to review' })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByTestId(lockout)).toHaveCount(0);
    });
  });
});
