import { test, expect } from '@playwright/test';
import { E2E_USERS, authFile } from './support/auth';

// ---------------------------------------------------------------------------
// HARNESS-0 smoke: proves the synthetic-session auth bypass clears the
// OAuth -> onboarding-lock -> role middleware for every role, and that an
// unauthenticated visitor is still bounced to login. This is the foundation
// every Phase 4 visual spec builds on; per-screen baselines arrive with the
// UI-01+ items.
// ---------------------------------------------------------------------------

for (const fixture of E2E_USERS) {
  test.describe(`${fixture.role} session`, () => {
    test.use({ storageState: authFile(fixture.key) });

    test(`reaches ${fixture.landing} without an auth or onboarding redirect`, async ({ page }) => {
      await page.goto(fixture.landing);
      await page.waitForLoadState('networkidle');

      // The minted JWT must satisfy the middleware: no bounce to login, no
      // bounce into the onboarding funnel, no admin hard-404.
      await expect(page).not.toHaveURL(/\/auth\/login/);
      await expect(page).not.toHaveURL(/\/onboarding/);
      expect(new URL(page.url()).pathname).toBe(fixture.landing);
    });
  });
}

test.describe('unauthenticated visitor', () => {
  // Explicitly empty storage state — no session cookie.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('is redirected to login from a guarded route', async ({ page }) => {
    await page.goto('/dashboard/farmer/listings');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
