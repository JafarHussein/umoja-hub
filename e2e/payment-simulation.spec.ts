import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// Payment simulation layer — admin Payment Lab.
//
// Two layers of assertion:
//  1. Render (all 3 viewports): the lab loads in simulation mode with metrics +
//     the trigger/feed sections. Non-mutating, deterministic.
//  2. Real force-success (desktop only — it mutates): forces a genuine simulated
//     SUCCESS on the seeded PENDING order through the real provider + shared
//     callback processor, and asserts the order is paid (leaves the awaiting
//     list). Desktop-only so the mutation never affects the other viewports;
//     global-setup resets the fixture to pending each run.
// ---------------------------------------------------------------------------

test.use({ storageState: authFile('admin') });

test('Payment Lab renders in simulation mode', async ({ page }) => {
  await page.goto('/dashboard/admin/payment-lab');

  await expect(page.getByRole('heading', { name: 'Payment Lab' })).toBeVisible({
    timeout: 30_000,
  });
  // Provider badge.
  await expect(page.getByText('simulation', { exact: true })).toBeVisible();
  // Metrics + sections.
  await expect(page.getByText('Initiated', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Awaiting payment' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent events' })).toBeVisible();
});

test('forces a real simulated success on a pending order', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutating — runs once on desktop');

  await page.goto('/dashboard/admin/payment-lab');
  await expect(page.getByRole('heading', { name: 'Payment Lab' })).toBeVisible({
    timeout: 30_000,
  });

  // The seeded PENDING order is actionable in the awaiting list.
  const scenario = page.getByLabel('Scenario for E2E-SIM-0001');
  await expect(scenario).toBeVisible();
  await scenario.selectOption('success');

  // Trigger the real simulated callback for this row.
  const row = page.locator('div').filter({ has: scenario }).last();
  await row.getByRole('button', { name: 'Trigger' }).click();

  // The success is delivered and the order leaves the awaiting list (now PAID),
  // proving the simulator drove the real order state machine.
  await expect(page.getByText(/delivered .*success.* callback/i)).toBeVisible();
  await expect(page.getByText('E2E-SIM-0001')).toHaveCount(0);
});
