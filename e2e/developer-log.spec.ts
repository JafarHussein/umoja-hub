import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-08 — Student Developer Log Workbench (corrected VIEW-DET-01).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Non-mutating,
// platform-stable assertions against the seeded IN_PROGRESS engagement (all 3
// docs present): the 3/3 checklist, the per-document hash strings, and the
// two-step Finalize & Hash → Submit flow. Finalize is client-only; the spec
// never types or submits, so the engagement stays deterministic.
// ---------------------------------------------------------------------------

const ENGAGEMENT_ID = '000000000000000000000020';

test.use({ storageState: authFile('student') });

test('workbench shows the 3/3 checklist and finalize → hashes → submit', async ({ page }) => {
  await page.goto(`/dashboard/student/projects/${ENGAGEMENT_ID}`);

  await expect(page.getByRole('heading', { name: 'E2E Developer Log', level: 1 })).toBeVisible({
    timeout: 30_000,
  });

  // Inline 3/3 completion checklist.
  await expect(page.getByText('Submission checklist')).toBeVisible();
  await expect(page.getByText('3 of 3 documents')).toBeVisible();

  // Finalize is gated on the 3 docs (here all present) → reveals the hashes.
  const finalize = page.getByRole('button', { name: /Finalize & Hash for Review/i });
  await expect(finalize).toBeEnabled();
  await finalize.click();

  await expect(page.getByText('Document hashes')).toBeVisible();
  // A real SHA-256 hex string is rendered (64 hex chars), and submit is offered.
  await expect(page.getByText(/^[a-f0-9]{64}$/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit for Review' })).toBeVisible();
});

test('documents tab shows the three editors with per-document hashes', async ({ page }) => {
  await page.goto(`/dashboard/student/projects/${ENGAGEMENT_ID}`);
  await expect(page.getByRole('heading', { name: 'E2E Developer Log', level: 1 })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('button', { name: 'Documents' }).click();

  // The three document editors (textareas) carry their label as aria-label.
  await expect(page.getByLabel('Problem Breakdown')).toBeVisible();
  await expect(page.getByLabel('Approach Plan')).toBeVisible();
  await expect(page.getByLabel('Final Reflection')).toBeVisible();
  // Each saved document displays its SHA-256 hash.
  await expect(page.getByText('SHA-256').first()).toBeVisible();
  await expect(page.getByText('SHA-256')).toHaveCount(3);
});
