import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-09 — Peer Review split-pane workbench (corrected).
//
// Pixel baselines deferred (see farmer-orders.spec.ts). Non-mutating,
// platform-stable assertions against the seeded ASSIGNED peer review: the
// anonymized left pane (doc content, no author identity), the structured rubric
// right pane (1–5 score inputs + preset criteria checkboxes that serialize to
// canonical comments), and the submit gate. The spec toggles a checkbox
// (client state only) but never submits, so the assignment stays ASSIGNED.
// ---------------------------------------------------------------------------

const PEER_REVIEW_ID = '000000000000000000000022';

test.use({ storageState: authFile('student') });

test('split-pane: anonymized content left, structured criteria rubric right', async ({ page }) => {
  await page.goto(`/dashboard/student/peer-review/${PEER_REVIEW_ID}`);

  await expect(
    page.getByRole('heading', { name: 'Peer Project — Market Stall Tracker', level: 1 })
  ).toBeVisible({ timeout: 30_000 });

  // Left pane is anonymized and shows the submission content.
  await expect(page.getByText(/Anonymous submission/i)).toBeVisible();
  await expect(page.getByText(/Market stall vendors in Nairobi/i)).toBeVisible();

  // Right pane: structured rubric — both dimensions with 1–5 inputs.
  await expect(page.getByText('Code quality', { exact: true })).toBeVisible();
  await expect(page.getByText('Documentation clarity', { exact: true })).toBeVisible();

  // Preset criteria checkboxes (no free-text) for both dimensions.
  const codeCriterion = page.getByRole('checkbox', { name: 'Readable structure and naming' });
  await expect(codeCriterion).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Problem clearly explained' })).toBeVisible();

  // Submit is gated until scores + criteria are chosen.
  const submit = page.getByRole('button', { name: 'Submit review' });
  await expect(submit).toBeDisabled();

  // Toggling a criterion is client-only (serializes into the canonical comment).
  // The checkbox input is visually hidden, so click its label.
  await page.getByText('Readable structure and naming').click();
  await expect(codeCriterion).toBeChecked();
});
