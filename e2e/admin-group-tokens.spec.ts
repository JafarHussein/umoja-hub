import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-15 — Admin group-token mint console (BE-07).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI: the console renders the mint form, validates the required
// fields client-side, and on a successful mint surfaces the returned code +
// expiry for relay. The POST is intercepted (page.route) so no real token row /
// SMS is created — deterministic, non-destructive across the viewport projects.
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('admin') });

test('mint console: form, validation, minted code surfaced', async ({ page }) => {
  await page.route('**/api/admin/group-tokens', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'ABCD2345',
            groupId: '000000000000000000000099',
            expiresAt: '2026-07-01T00:00:00.000Z',
          },
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/dashboard/admin/group-tokens');

  await expect(page.getByRole('heading', { name: 'Group Tokens' })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByRole('heading', { name: 'Mint a join code' })).toBeVisible();

  // Required-field guard: minting with empty inputs is blocked client-side.
  await page.getByRole('button', { name: 'Mint token' }).click();
  await expect(page.getByText(/enter the group id/i)).toBeVisible();

  // Fill the form and mint — the intercepted response's code is surfaced.
  await page.getByLabel('Group ID').fill('000000000000000000000099');
  await page.getByLabel('Recipient phone').fill('+254712345678');
  await page.getByRole('button', { name: 'Mint token' }).click();

  await expect(page.getByText('Token minted')).toBeVisible();
  await expect(page.getByText('ABCD2345')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
});
