import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// The student's project workspace.
//
// Replaces the old three-document checklist and hash panel. What matters now is
// that the student can tell, without hunting, where they are and what happens
// next — and that the report tab shows them the standard they are writing
// against before they upload anything.
//
// Non-mutating: the spec reads and navigates but never uploads a file.
// ---------------------------------------------------------------------------

// FIXTURE_ENGAGEMENT_ID from e2e/support/auth.ts. Not 0023 — that is the
// dangling peer author's *user* id, which addresses no engagement at all.
const ENGAGEMENT_ID = '000000000000000000000020';

test.use({ storageState: authFile('student') });

test('the workspace says where the project is and what happens next', async ({ page }) => {
  await page.goto(`/dashboard/student/projects/${ENGAGEMENT_ID}`);

  await expect(page.getByRole('heading', { name: 'E2E Developer Log', level: 1 })).toBeVisible({
    timeout: 30_000,
  });

  // One card, at the top, carrying the stage and the next step. A student
  // should not have to assemble their own status out of five pills.
  await expect(page.getByText('Building')).toBeVisible();
  await expect(page.getByText(/write your report against the standard/i)).toBeVisible();

  // The workflow's own stages, not the storage's.
  await expect(page.getByText('Report with your lecturer')).toBeVisible();
  await expect(page.getByText('Ready to demonstrate')).toBeVisible();
  await expect(page.getByText('Complete')).toBeVisible();
});

test('the report tab shows the standard and asks for a PDF', async ({ page }) => {
  await page.goto(`/dashboard/student/projects/${ENGAGEMENT_ID}`);
  await expect(page.getByRole('heading', { name: 'E2E Developer Log', level: 1 })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('button', { name: 'Project report' }).click();

  // The report is written elsewhere and handed in here. The upload is the
  // submission — there is no draft state, because the draft lives in whatever
  // the student writes in.
  await expect(page.getByText(/export it to PDF, and upload it here/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit your report' })).toBeVisible();

  // Nothing can be submitted until a file is chosen.
  await expect(page.getByRole('button', { name: 'Submit your report' })).toBeDisabled();

  // The standard itself, grouped as the standard groups it, with the guidance
  // that stops a student writing a paragraph about what three-tier
  // architecture is instead of describing what they built.
  await expect(page.getByText('What your report must contain')).toBeVisible();
  await expect(page.getByText('The engineering')).toBeVisible();
  await expect(page.getByText(/11\. System architecture/)).toBeVisible();
  await expect(page.getByText(/why this architecture/i)).toBeVisible();
});
