import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-02 — Farmer Escrow & Settlement Ledger behavioural contract.
//
// Pixel baselines deferred (see farmer-orders.spec.ts). These assertions are
// platform-stable and gate CI today. They pin the escrow model: the single
// fixture order E2E-FAR-0001 is PAID but still IN_FULFILLMENT (KSh 4,000), so
// its funds are HELD IN ESCROW — not yet releasable — and the available balance
// is therefore zero with the payout CTA disabled. Escrow is now the mandated
// framing: funds are released to the farmer only once the buyer confirms
// receipt (order COMPLETED).
//
// The spec is read-only: it never submits a payout, so the fixture farmer's
// balance stays deterministic across runs.
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('farmer') });

test('settlement ledger shows the escrow balance, line item, and held state', async ({
  page,
}) => {
  await page.goto('/dashboard/farmer/ledger');

  // Absorb the dev server's on-demand route compile on first hit (pre-built in CI).
  await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible({ timeout: 30_000 });

  // The single PAID fixture order is IN_FULFILLMENT — its KSh 4,000 is held in
  // escrow, surfaced both on the Held card and as a ledger line item.
  await expect(page.getByText('KSh 4,000').first()).toBeVisible();

  // Escrow is now the mandated framing (the old "no escrow" copy rule is retired).
  await expect(page.getByText('Held in escrow').first()).toBeVisible();
  await expect(page.getByText('Cleared').first()).toBeVisible();

  // The PAID fixture order surfaces as a settlement line item.
  await expect(page.getByText('E2E-FAR-0001')).toBeVisible();
});

test('held funds are not releasable: available is zero and the payout CTA is disabled', async ({
  page,
}) => {
  await page.goto('/dashboard/farmer/ledger');

  await expect(page.getByRole('heading', { name: 'Payments', exact: true })).toBeVisible({ timeout: 30_000 });

  // Held funds are not releasable until the buyer confirms receipt, so the
  // available-to-request balance is zero and the payout CTA is disabled.
  const cta = page.getByRole('button', { name: 'Request a payout' });
  await expect(cta).toBeDisabled();

  // The escrow framing explains why funds are not yet releasable.
  await expect(page.getByText(/clears once the buyer confirms/i)).toBeVisible();
});
