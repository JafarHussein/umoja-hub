import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-05 — "Link Institutional Group Token" control in the farmer settings pane.
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI: the single-input redeem control renders in the profile
// pane and reports the server outcome. The test submits a bogus token — a
// non-mutating path (404 TOKEN_NOT_FOUND) — so the fixture state is untouched
// and the result is deterministic.
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('farmer') });

test('redeem control renders and surfaces an invalid-token error', async ({ page }) => {
  await page.goto('/dashboard/farmer/profile');

  const input = page.getByLabel('Group join token');
  await expect(input).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole('heading', { name: 'Link Institutional Group Token' })
  ).toBeVisible();

  await input.fill('NOSUCHTOKEN');
  await page.getByRole('button', { name: 'Link group' }).click();

  // Bogus token → server 404 TOKEN_NOT_FOUND, surfaced inline.
  await expect(page.getByText('Invalid join token.')).toBeVisible();
});
