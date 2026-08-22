import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// The lecturer reading a submitted project report.
//
// Replaces the old three-document review workspace. Non-mutating: the spec
// asserts the queue reaches the report, that both instruments are on the screen
// — the checklist drawn from the standard and the four scored dimensions — and,
// the rule worth protecting most, that a lecturer cannot send a report back
// without naming something, because a student told only "needs work" cannot
// tell where to start. It never submits a decision.
//
// It does not assert on the document's contents: the report is a PDF the
// platform does not read, which is the whole point of the workflow.
// ---------------------------------------------------------------------------

const SUMMARY =
  'The report holds together and the architecture section does the work it needs to do, particularly where you set out the alternative you rejected and what it would have cost. The testing section is thinner than the rest and the results would carry more weight with the actual output beside them. Bring the synchronisation flow to your demonstration and be ready to explain what happens when two devices disagree about the same record.';

test.use({ storageState: authFile('lecturer') });

test('a submitted report is readable, and sending it back needs something named', async ({
  page,
}) => {
  await page.goto('/dashboard/lecturer/reports');

  await expect(page.getByRole('heading', { name: 'Reports to review', level: 1 })).toBeVisible({
    timeout: 30_000,
  });

  const row = page.getByText('Lecturer Review Project').first();
  await expect(row).toBeVisible();
  await row.click();

  await expect(
    page.getByRole('heading', { name: 'Lecturer Review Project', level: 1 })
  ).toBeVisible({ timeout: 30_000 });

  // The document is offered, by the name the student gave it.
  await expect(page.getByText(/lecturer-review-project-report\.pdf/i).first()).toBeVisible();

  // The checklist: the structural question the platform used to answer for
  // itself, and cannot answer about a document it does not read.
  await expect(page.getByText('Against the standard')).toBeVisible();
  await expect(page.getByText('Problem clearly defined')).toBeVisible();
  await expect(page.getByText('Testing documented')).toBeVisible();

  // The four scored dimensions — the Hub's existing rubric, preserved.
  await expect(page.getByText('Problem understanding').first()).toBeVisible();
  await expect(page.getByText('Solution quality').first()).toBeVisible();
  await expect(page.getByText('Process quality').first()).toBeVisible();
  await expect(page.getByText('AI use').first()).toBeVisible();

  // Both decisions are gated until the summary is long enough to act on.
  const accept = page.getByRole('button', { name: /Accept — open their demonstration/i });
  const sendBack = page.getByRole('button', { name: /Send back for changes/i });
  await expect(accept).toBeDisabled();
  await expect(sendBack).toBeDisabled();

  // A summary alone unlocks acceptance but not a rejection: sending a student
  // away requires naming something, and the screen says so.
  await page.getByLabel('What the student should take away').fill(SUMMARY);

  await expect(accept).toBeEnabled();
  await expect(sendBack).toBeDisabled();
  await expect(page.getByText(/say what has to change or leave a note on a page/i)).toBeVisible();

  // Naming what has to change is what unlocks it. Client state only — the spec
  // never presses either button.
  await page
    .getByLabel('What has to change')
    .fill('Rewrite the architecture section around the components you actually built.');

  await expect(sendBack).toBeEnabled();
});
