import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-06 — Buyer order detail: platform mediation (BE-05).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable,
// non-mutating assertions gate CI:
//   - the 48-h escalation gate (frozen clock) — eligible vs too-early — on the
//     mediation-free fixture order E2E-FAR-0001 (paidAt 2026-01-01);
//   - the UNDER_MEDIATION alert bar on E2E-FAR-0002, which is seeded with an
//     OPEN mediation.
// The escalation tests open the form but never submit, so order state stays
// deterministic across the three viewport projects (shared DB).
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('buyer') });

async function openOrderByRef(page: import('@playwright/test').Page, ref: string): Promise<void> {
  await page.goto('/dashboard/buyer/orders');
  await expect(page.getByRole('heading', { name: 'My Orders' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('link', { name: new RegExp(ref, 'i') }).click();
  await expect(page.getByText(ref)).toBeVisible();
}

test('escalation is available 48h after payment', async ({ page }) => {
  // paidAt 2026-01-01 → frozen 4 days later is well past the 48-h gate.
  await page.clock.setFixedTime(new Date('2026-01-05T00:00:00.000Z'));
  await openOrderByRef(page, 'E2E-FAR-0001');

  const escalateBtn = page.getByRole('button', { name: 'Escalate to Platform Mediation' });
  await expect(escalateBtn).toBeVisible();
  await escalateBtn.click();

  // The escalation form opens (category + description), still unsubmitted.
  await expect(page.getByLabel('What went wrong?')).toBeVisible();
  await expect(page.getByLabel(/describe the problem/i)).toBeVisible();
});

test('escalation is gated before the 48-h window', async ({ page }) => {
  // Frozen 24h after payment — inside the window, so escalation is not offered.
  await page.clock.setFixedTime(new Date('2026-01-02T00:00:00.000Z'));
  await openOrderByRef(page, 'E2E-FAR-0001');

  await expect(page.getByText(/escalate to platform mediation from/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Escalate to Platform Mediation' })
  ).toHaveCount(0);
});

test('UNDER_MEDIATION bar shows for an escalated order', async ({ page }) => {
  await openOrderByRef(page, 'E2E-FAR-0002');

  await expect(page.getByText('Under platform mediation')).toBeVisible();
  // While escalated, the escalate affordance is not offered.
  await expect(
    page.getByRole('button', { name: 'Escalate to Platform Mediation' })
  ).toHaveCount(0);
});
