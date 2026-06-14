import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-13 — Admin payout-request queue (BE-03).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI: the queue lists the seeded REQUESTED withdrawal with the
// farmer identity + amount, exposes the status tabs and Approve/Reject actions,
// enforces the reject-requires-reason rule client-side, and submits a decision.
// The PATCH is intercepted (page.route) so the seeded request stays REQUESTED
// across the three viewport projects — deterministic, non-destructive.
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('admin') });

test('payout queue: render, reject validation, intercepted decision', async ({ page }) => {
  // Intercept the decision PATCH so no real mutation happens (keeps the seeded
  // REQUESTED row intact for the next viewport project).
  await page.route('**/api/admin/payout-requests', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { _id: 'x', status: 'REJECTED' } }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/dashboard/admin/payouts');

  await expect(page.getByRole('heading', { name: 'Payout Requests' })).toBeVisible({
    timeout: 30_000,
  });

  // Status tabs.
  await expect(page.getByRole('tab', { name: 'REQUESTED' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'PAID' })).toBeVisible();

  // Seeded REQUESTED row — farmer identity + amount + decision actions.
  await expect(page.getByText('E2E Unverified Farmer')).toBeVisible();
  await expect(page.getByText('KES 2,500')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve' })).toBeVisible();

  // Reject requires a reason — confirming with an empty note is blocked
  // client-side (no network call).
  await page.getByRole('button', { name: 'Reject' }).click();
  await expect(page.getByRole('heading', { name: 'Reject payout request' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(/reason is required/i)).toBeVisible();

  // With a reason, the decision submits (intercepted) and the row leaves view.
  await page.getByLabel(/reason for rejection/i).fill('Insufficient supporting detail.');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('E2E Unverified Farmer')).toHaveCount(0);
});
