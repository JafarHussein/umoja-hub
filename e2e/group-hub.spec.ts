import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-04 — Group Operations read-only hub (Decision Record 03/08-C).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI: the hub is read-only (no create/join/member controls),
// shows the roster + manager variant (createdBy match) + GroupOrder histories,
// carries the off-platform payment notice, and exposes no per-member payment
// badges. Driven by the seeded "E2E Cooperative" fixture (verified farmer is
// creator + member; unverified farmer is a second member).
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('farmer') });

test('read-only hub: roster, manager variant, off-platform notice, histories', async ({
  page,
}) => {
  await page.goto('/dashboard/farmer/group');

  await expect(page.getByRole('heading', { name: 'Farmer Groups' })).toBeVisible({
    timeout: 30_000,
  });

  // Read-only: no group-creation control.
  await expect(page.getByRole('button', { name: /create group/i })).toHaveCount(0);

  await page.getByRole('button', { name: /E2E Cooperative/i }).click();

  // Manager variant — the viewing farmer created the group (createdBy match).
  await expect(page.getByText('Manager', { exact: true })).toBeVisible();

  // Off-platform payment notice (plain text).
  await expect(page.getByText(/coordinated off-platform/i)).toBeVisible();

  // Roster with member identities + per-member verification (not payment).
  // "E2E Unverified Farmer" and "Creator" are roster-only (the verified farmer's
  // name also appears in the nav user menu, which is hidden on mobile).
  await expect(page.getByText('E2E Unverified Farmer')).toBeVisible();
  await expect(page.getByText('Creator')).toBeVisible();
  // The verification pill renders an aria-hidden glyph next to the label, so no
  // element has the exact text "Verified"; anchor on the glyph + label instead.
  await expect(page.getByText(/^.\s?Verified$/)).toBeVisible();
  await expect(page.getByText(/^.\s?Unverified$/)).toBeVisible();

  // GroupOrder state history.
  await expect(page.getByText('Fertilizer (DAP)')).toBeVisible();

  // No per-member payment badge and no interactive member controls.
  await expect(page.getByText('PENDING', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /add member|remove member|^remove$/i })).toHaveCount(
    0
  );
});
