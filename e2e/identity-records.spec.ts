import { test, expect, type Page } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-12 — Profile dashboard immutable identity records (Q14).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Platform-stable
// assertions gate CI: the student + lecturer profiles render their immutable
// identity records (OAuth-sourced + onboarding-captured) read-only, carry the
// administrator-correctable note, and expose NO edit/save affordance. Driven by
// the student/lecturer fixtures (githubUsername + institutional fields seeded in
// global-setup via roleData).
// ---------------------------------------------------------------------------

async function assertReadOnlyIdentity(page: Page, route: string): Promise<void> {
  await page.goto(route);

  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible({ timeout: 30_000 });

  // Read-only framing + administrator-correctable carve-out.
  await expect(page.getByText('Read-only', { exact: true })).toBeVisible();
  await expect(page.getByText(/administrator-correctable only/i)).toBeVisible();

  // No edit/save affordance anywhere — identity records are not self-editable.
  await expect(page.getByRole('button', { name: /edit|save|update/i })).toHaveCount(0);
  await expect(page.locator('input, textarea, select')).toHaveCount(0);
}

test.describe('student profile', () => {
  test.use({ storageState: authFile('student') });

  test('renders read-only student identity records', async ({ page }) => {
    await assertReadOnlyIdentity(page, '/dashboard/student/profile');

    // GitHub username (OAuth-sourced) + institutional fields.
    await expect(page.getByText('e2e-student')).toBeVisible();
    await expect(page.getByText('student@uni.e2e.test')).toBeVisible();
    // The verification pill renders an aria-hidden glyph next to the label, so
    // no element has the exact text "Verified"; anchor on the glyph + label.
    await expect(page.getByText(/^.\s?Verified$/)).toBeVisible();
    await expect(page.getByText('REG-E2E-001')).toBeVisible();
  });
});

test.describe('lecturer profile', () => {
  test.use({ storageState: authFile('lecturer') });

  test('renders read-only lecturer identity records', async ({ page }) => {
    await assertReadOnlyIdentity(page, '/dashboard/lecturer/profile');

    // Onboarding-captured institutional fields.
    await expect(page.getByText('Computer Science')).toBeVisible();
    await expect(page.getByText('STAFF-E2E-001')).toBeVisible();
  });
});
