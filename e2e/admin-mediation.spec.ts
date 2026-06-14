import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-14 — Admin mediation tracking (BE-05).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI: the queue lists the seeded OPEN escalation (order ref +
// category + parties + complaint), exposes the status tabs and Start-review /
// Resolve actions, enforces the resolve-requires-note rule client-side, and
// submits a decision. The PATCH is intercepted (page.route) so the seeded
// mediation stays OPEN across the viewport projects AND so the shared UI-06
// alert-bar fixture is never mutated — deterministic, non-destructive.
//
// Reuses the UI-06 OPEN MediationRequest on order E2E-FAR-0002 (buyer fixture,
// dangling farmer → "Unknown farmer", category NOT_DELIVERED).
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('admin') });

test('mediation queue: render, resolve validation, intercepted decision', async ({ page }) => {
  await page.route('**/api/admin/mediation-requests', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { _id: 'x', status: 'RESOLVED' } }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/dashboard/admin/mediation');

  await expect(page.getByRole('heading', { name: 'Mediation' })).toBeVisible({ timeout: 30_000 });

  // Status tabs.
  await expect(page.getByRole('tab', { name: 'OPEN' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'RESOLVED' })).toBeVisible();

  // Seeded OPEN escalation — order ref + category + complaint + parties.
  await expect(page.getByText('E2E-FAR-0002')).toBeVisible();
  await expect(page.getByText('NOT DELIVERED')).toBeVisible();
  await expect(page.getByText(/has not arrived/i)).toBeVisible();
  await expect(page.getByText(/Unknown farmer/i)).toBeVisible();

  // Resolve requires a note — confirming empty is blocked client-side.
  await page.getByRole('button', { name: 'Resolve' }).click();
  await expect(page.getByRole('heading', { name: 'Resolve case' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText(/resolution note is required/i)).toBeVisible();

  // With a note, the decision submits (intercepted) and the case leaves view.
  await page.getByLabel(/resolution note/i).fill('Refund coordinated off-platform; both parties agreed.');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('E2E-FAR-0002')).toHaveCount(0);
});
