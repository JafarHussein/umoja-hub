import { test, expect, type Page } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-11 — Supplier directory Read-Only Telemetry View (Q12).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI: the same read-only directory is reachable in BOTH the
// farmer and buyer hubs, lists the seeded VERIFIED supplier with its
// registrations, carries the administrator-curated copy, and exposes NO
// registration/creation affordances (suppliers are admin-added, never
// self-registered). Driven by the "E2E Agrovet Supplies" supplier fixture.
// ---------------------------------------------------------------------------

async function assertReadOnlyDirectory(page: Page, route: string): Promise<void> {
  await page.goto(route);

  await expect(page.getByRole('heading', { name: 'Verified Suppliers' })).toBeVisible({
    timeout: 30_000,
  });

  // Administrator-curated, read-only framing.
  await expect(page.getByText(/administrator-curated/i)).toBeVisible();
  await expect(page.getByText(/cannot self-register/i)).toBeVisible();

  // Seeded verified supplier card with its registration number.
  await expect(page.getByText('E2E Agrovet Supplies')).toBeVisible();
  await expect(page.getByText('KEBS-E2E-001')).toBeVisible();

  // No registration/creation affordances — the directory only reads.
  await expect(
    page.getByRole('button', { name: /add supplier|register|create|new supplier/i })
  ).toHaveCount(0);
  await expect(page.getByRole('link', { name: /add supplier|register supplier/i })).toHaveCount(0);
}

test.describe('farmer hub', () => {
  test.use({ storageState: authFile('farmer') });

  test('read-only supplier directory renders for the farmer', async ({ page }) => {
    await assertReadOnlyDirectory(page, '/dashboard/farmer/suppliers');
  });
});

test.describe('buyer hub', () => {
  test.use({ storageState: authFile('buyer') });

  test('read-only supplier directory renders for the buyer', async ({ page }) => {
    await assertReadOnlyDirectory(page, '/dashboard/buyer/suppliers');
  });
});
