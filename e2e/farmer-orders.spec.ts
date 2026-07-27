import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-01 — Farmer Fulfillment Pipeline behavioural contract.
//
// Pixel baselines are deferred (Windows dev / Linux CI, no Docker to generate
// Linux snapshots); these assertions are platform-stable and gate CI today.
// They pin the three corrections: the CTA is driven by the server
// `canConfirmDispatch` flag (FIX-01), it is labelled "Confirm dispatch",
// and the 24-h handover countdown renders against `paidAt`.
//
// The clock is frozen 8 h after the fixture order's paidAt
// (2026-01-01T00:00Z), so the countdown is deterministically "16h 0m".
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('farmer') });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-01-01T08:00:00.000Z'));
});

test('handover CTA is server-flag driven, relabelled, and shows the 24-h countdown', async ({
  page,
}) => {
  await page.goto('/dashboard/farmer/orders');

  // Absorb the dev server's on-demand route compile on first hit (in CI the app
  // is pre-built, so this resolves immediately).
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible({ timeout: 30_000 });

  // The CTA only renders because the seeded order is PAID + IN_FULFILLMENT +
  // unconfirmed, i.e. the API returned canConfirmDispatch: true.
  const cta = page.getByRole('button', { name: /confirm dispatch for order/i });
  await expect(cta).toBeVisible();

  // Live countdown anchored to paidAt: 24 h window, frozen 8 h in → 16 h left.
  await expect(page.getByText('16h 0m left to confirm').first()).toBeVisible();
});

test('order detail modal surfaces the handover window copy and CTA', async ({ page }) => {
  await page.goto('/dashboard/farmer/orders');

  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: /view details for order/i }).first().click();

  await expect(
    page.getByText(/confirm within 24 h of payment to keep your reliability score on-time/i)
  ).toBeVisible();
  // exact: true — the list CTA's aria-label ("Confirm dispatch for order …")
  // would otherwise match this substring query too.
  await expect(
    page.getByRole('button', { name: 'Confirm dispatch', exact: true })
  ).toBeVisible();
});
