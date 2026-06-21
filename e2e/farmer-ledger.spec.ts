import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-02 — Farmer Escrow & Settlement Ledger behavioural contract.
//
// Pixel baselines deferred (see farmer-orders.spec.ts). These assertions are
// platform-stable and gate CI today. They pin: the derived balance is shown
// from the single PAID fixture order (KES 4,000, available since no payout is
// committed), the PAID order surfaces as a ledger line item, the payout
// request CTA is enabled, and the mandated copy rule holds — "received by
// platform / payout pending", never an "escrow" legal claim.
//
// The spec is read-only: it opens the payout form but never submits, so the
// fixture farmer's balance stays deterministic across runs.
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('farmer') });

test('settlement ledger shows the derived balance, line item, and payout CTA', async ({
  page,
}) => {
  await page.goto('/dashboard/farmer/ledger');

  // Absorb the dev server's on-demand route compile on first hit (pre-built in CI).
  await expect(page.getByRole('heading', { name: 'Settlement' })).toBeVisible({ timeout: 30_000 });

  // Derived balance from the single PAID fixture order; available == gross.
  await expect(page.getByText('KSh 4,000').first()).toBeVisible();

  // The PAID fixture order surfaces as a settlement line item.
  await expect(page.getByText('E2E-FAR-0001')).toBeVisible();

  // Copy rule: "received by platform / payout pending", never an escrow claim.
  await expect(page.getByText(/received by the platform/i).first()).toBeVisible();
  await expect(page.getByText(/payout pending/i).first()).toBeVisible();
  await expect(page.getByText(/escrow/i)).toHaveCount(0);
});

test('payout request form opens with the available-balance constraint', async ({ page }) => {
  await page.goto('/dashboard/farmer/ledger');

  await expect(page.getByRole('heading', { name: 'Settlement' })).toBeVisible({ timeout: 30_000 });

  const cta = page.getByRole('button', { name: 'Request a payout' });
  await expect(cta).toBeEnabled();
  await cta.click();

  // Modal surfaces the manual-settlement framing and the available-balance hint.
  await expect(
    page.getByText(/payouts are released manually by an administrator/i)
  ).toBeVisible();
  await expect(page.getByText('Available: KSh 4,000')).toBeVisible();
});
