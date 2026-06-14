import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-10 — Lecturer Review Workspace (corrected: mask requirement void; peer
// scores withheld server-side until decision per FIX-08).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Non-mutating,
// platform-stable assertions against the seeded UNDER_LECTURER_REVIEW
// engagement: student work on the left, and the rubric on the right — 4 score
// dimensions, 4 comment fields with live ≥50-word counters, and the
// DENIED-reveals-required-reason logic. The spec toggles the Denied radio
// (client state only) but never submits.
// ---------------------------------------------------------------------------

const ENGAGEMENT_ID = '000000000000000000000024';

test.use({ storageState: authFile('lecturer') });

test('rubric: 4 dimensions, live word counters, DENIED reveals reason', async ({ page }) => {
  await page.goto(`/dashboard/lecturer/reviews/${ENGAGEMENT_ID}`);

  await expect(
    page.getByRole('heading', { name: 'Lecturer Review Project', level: 1 })
  ).toBeVisible({ timeout: 30_000 });

  // Left pane shows the submitted work.
  await expect(page.getByText(/shared ledger so member deliveries reconcile/i)).toBeVisible();

  // Right pane rubric: the 4 scored dimensions (labels appear for score + comment).
  await expect(page.getByText('Problem understanding').first()).toBeVisible();
  await expect(page.getByText('AI usage').first()).toBeVisible();

  // Live ≥50-word counters on the comment fields (all start at 0/50).
  await expect(page.getByText('0/50').first()).toBeVisible();
  await expect(page.getByText('0/50')).toHaveCount(4);

  // Submit is gated until scores + comments + decision are complete.
  const submit = page.getByRole('button', { name: 'Submit review' });
  await expect(submit).toBeDisabled();

  // DENIED reveals a required rejection-reason field (client-only).
  await expect(page.getByText('Rejection reason')).toHaveCount(0);
  await page.getByText('Denied', { exact: true }).click();
  await expect(page.getByText('Rejection reason')).toBeVisible();
});
