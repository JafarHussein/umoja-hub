/* eslint-disable no-console -- the rehearsal reports its progress on stdout: that narration
   is the artefact, and it is what makes a failure legible without opening a trace. */
import { test, expect, request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { authFile } from './support/auth';
import { buildReportPdf } from '../scripts/demo/content/reportPdf';

// The Education Hub, end to end, against the real stack.
//
// Not part of `npm run test:e2e`: it uploads to real storage, and CI has only
// placeholder Cloudinary credentials, so there it would fail for a reason that
// says nothing about the product. Run it deliberately:
//
//   npm run test:e2e:rehearsal
//
// It walks the whole workflow — three report versions, two revision cycles, two
// demonstrations, approval — and then reads the resulting screens in a browser.
// Everything it uploads is deleted again at the end.

const ENGAGEMENT = '000000000000000000000020';

function pdf(title: string): Buffer {
  return buildReportPdf(title, 'E2E Student — BSc Computer Science, Year 3 Semester 1', [
    { heading: '1. Title', body: title },
    {
      heading: '11. System architecture',
      body: 'Three services: a Next.js front end, a Node API and a MongoDB store. They are separate because the collection points are offline for hours at a time and the sync queue has to survive a restart. '.repeat(
        6
      ),
    },
    {
      heading: '17. Testing',
      body: 'Unit tests cover the reconciliation pipeline; an integration suite runs against a real MongoDB. 41 of 44 pass; the three failures are documented in the limitations. '.repeat(
        6
      ),
    },
  ]);
}


const ACCEPT_SUMMARY =
  'The revisions did the work that was asked of them. The architecture section now describes your own system rather than a pattern, and it says plainly what you rejected and why, which is the part most reports never manage. The test results are present and you have been honest about the three that still fail. Bring the synchronisation flow to the demonstration and be ready to say what happens when two devices disagree about the same record.';

const CRITERIA = [
  'problemUnderstanding',
  'systemFunctionality',
  'technicalDepth',
  'designJustification',
  'responseToQuestioning',
  'engineeringPractice',
];

function evaluation(outcome: string, score: number): Record<string, unknown> {
  const scores: Record<string, number> = {};
  const comments: Record<string, string> = {};
  for (const c of CRITERIA) {
    scores[c] = score;
    comments[c] =
      'They answered this directly and could point at the code that does it, rather than describing the idea in general terms.';
  }
  return { scores, comments, outcome, questioningNotes: 'Pushed hardest on the conflict resolution.' };
}

/** The state of the project and the report, as the student sees them. */
async function stateOf(student: APIRequestContext): Promise<{ status: string; stage: string }> {
  // By id — 'me' goes quiet once a project is finished, which is the defect
  // this rehearsal found.
  const one = await (await student.get(`/api/education/engagements/${ENGAGEMENT}`)).json();
  const rep = await (await student.get(`/api/education/engagements/${ENGAGEMENT}/report`)).json();
  return { status: one.data?.status ?? '(none)', stage: rep.data?.stage ?? '(none)' };
}

/**
 * Remove everything this rehearsal uploaded.
 *
 * The upload route stores into the real reports folder, as it should — the
 * rehearsal is exercising the real path. What it must not do is leave its
 * practice documents there afterwards, so the stored ids are read back out of
 * the database and deleted.
 */
async function cleanUpUploadedReports(): Promise<number> {
  const mongoose = (await import('mongoose')).default;
  const uri = process.env.MONGODB_E2E_URI;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!uri || !cloud || !key || !secret) return 0;

  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  let removed = 0;
  try {
    const docs = await conn
      .db!.collection('projectdocumentations')
      .find({}, { projection: { versions: 1 } })
      .toArray();
    const ids = docs.flatMap((d) =>
      ((d['versions'] ?? []) as Array<{ publicId?: string }>).map((v) => v.publicId)
    ).filter((v): v is string => typeof v === 'string' && v.length > 0);

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    for (const id of ids) {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/resources/raw/private?public_ids[]=${encodeURIComponent(id)}`,
        { method: 'DELETE', headers: { Authorization: `Basic ${auth}` } }
      );
      if (res.ok) removed += 1;
    }
  } finally {
    await conn.close();
  }
  return removed;
}

/**
 * Move a booked demonstration into the past.
 *
 * The application refuses to publish a slot in the past and refuses to complete
 * a demonstration before it was due, both correctly. Waiting three days is not
 * available to a test, so the clock is moved instead of the rule bent.
 */
async function shiftDemonstrationIntoThePast(demonstrationId: string): Promise<void> {
  const mongoose = (await import('mongoose')).default;
  const uri = process.env.MONGODB_E2E_URI;
  if (!uri) throw new Error('MONGODB_E2E_URI is required');
  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  try {
    const when = new Date(Date.now() - 60 * 60 * 1000);
    await conn.db!.collection('demonstrations').updateOne(
      { _id: new mongoose.Types.ObjectId(demonstrationId) },
      { $set: { scheduledFor: when } }
    );
  } finally {
    await conn.close();
  }
}

async function ctx(role: string): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL: 'http://localhost:3100',
    storageState: authFile(role),
  });
}

// Twelve lifecycle steps with four real uploads: the default 30s is a budget
// for one assertion, not for a whole workflow.
test.describe.configure({ timeout: 240_000, mode: "serial" });

test('FULL REHEARSAL: submit → review → revise → accept → demonstrate → approve', async () => {
  const student = await ctx('student');
  const lecturer = await ctx('lecturer');

  // ---- 1. Student uploads version 1 ------------------------------------
  const v1 = await student.post(`/api/education/engagements/${ENGAGEMENT}/report`, {
    multipart: {
      file: { name: 'report-v1.pdf', mimeType: 'application/pdf', buffer: pdf('Dairy Reconciliation') },
    },
  });
  console.log('[1] upload v1 →', v1.status());
  expect(v1.status(), await v1.text()).toBe(201);
  const doc1 = (await v1.json()).data;
  expect(doc1.versions).toHaveLength(1);
  expect(doc1.versions[0].versionNumber).toBe(1);
  expect(doc1.stage).toBe('WITH_LECTURER');
  console.log('[1] pageCount read from the PDF →', doc1.versions[0].pageCount);

  // A second upload while it is with the lecturer must be refused.
  const dup = await student.post(`/api/education/engagements/${ENGAGEMENT}/report`, {
    multipart: {
      file: { name: 'dup.pdf', mimeType: 'application/pdf', buffer: pdf('Duplicate') },
    },
  });
  console.log('[1] duplicate upload →', dup.status(), (await dup.json()).error);
  expect(dup.status()).toBe(409);

  // ---- 2. Lecturer sees it in the queue --------------------------------
  const queue = await lecturer.get('/api/lecturer/reports');
  expect(queue.status()).toBe(200);
  const rows = (await queue.json()).data;
  const row = rows.find((r: { engagementId: string }) => r.engagementId === ENGAGEMENT);
  console.log('[2] queue rows →', rows.length, '· ours →', row?.projectTitle, 'v' + row?.versionNumber);
  expect(row).toBeTruthy();
  const reportId = row._id;

  // ---- 3. The PDF streams back through the authorised route ------------
  const file = await lecturer.get(
    `/api/education/engagements/${ENGAGEMENT}/report/file/${doc1.versions[0]._id}`
  );
  console.log('[3] lecturer reads the PDF →', file.status(), file.headers()['content-type']);
  expect(file.status()).toBe(200);
  expect(file.headers()['content-type']).toBe('application/pdf');
  const bytes = await file.body();
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');

  // ---- 4. Lecturer sends it back --------------------------------------
  const summary =
    'You have clearly built something, but the report does not yet show me why you built it the way you did. The architecture section describes a pattern rather than your system, and the testing section sets out a strategy with no results in it. Both have to change before this is worth demonstrating against, and I want to see the figures you refer to.';
  const sendBack = await lecturer.post(`/api/lecturer/reports/${reportId}`, {
    data: {
      outcome: 'REVISION_REQUESTED',
      scores: { problemUnderstanding: 3, solutionQuality: 2, processQuality: 3, aiUsage: 3 },
      summary,
      requiredChanges: 'Rewrite the architecture section around what you actually built.',
      pageNotes: [{ page: 2, comment: 'This is the textbook definition. What is your architecture?' }],
      checklist: [
        { item: 'problemDefined', met: true },
        { item: 'architectureDocumented', met: false },
        { item: 'testingDocumented', met: false },
      ],
    },
  });
  console.log('[4] send back →', sendBack.status());
  expect(sendBack.status(), await sendBack.text()).toBe(200);

  // A rejection naming nothing must be refused.
  const naked = await lecturer.post(`/api/lecturer/reports/${reportId}`, {
    data: {
      outcome: 'REVISION_REQUESTED',
      scores: { problemUnderstanding: 3, solutionQuality: 3, processQuality: 3, aiUsage: 3 },
      summary,
    },
  });
  console.log('[4] rejection naming nothing →', naked.status());
  expect([400, 409]).toContain(naked.status());

  // ---- 5. Student sees the feedback and uploads version 2 --------------
  const afterFeedback = await student.get(`/api/education/engagements/${ENGAGEMENT}/report`);
  const doc1b = (await afterFeedback.json()).data;
  console.log('[5] stage after feedback →', doc1b.stage, '· canSubmit →', doc1b.canSubmit);
  expect(doc1b.stage).toBe('CHANGES_REQUESTED');
  expect(doc1b.versions[0].review.pageNotes[0].page).toBe(2);

  // A revision with no word about what changed must be refused.
  const noNote = await student.post(`/api/education/engagements/${ENGAGEMENT}/report`, {
    multipart: {
      file: { name: 'v2.pdf', mimeType: 'application/pdf', buffer: pdf('V2') },
    },
  });
  console.log('[5] revision with no note →', noNote.status());
  expect(noNote.status()).toBe(400);

  const v2 = await student.post(`/api/education/engagements/${ENGAGEMENT}/report`, {
    multipart: {
      file: { name: 'report-v2.pdf', mimeType: 'application/pdf', buffer: pdf('Dairy Reconciliation v2') },
      studentNote: 'Rewrote the architecture section around the services I actually built and added the test results table.',
    },
  });
  console.log('[5] upload v2 →', v2.status());
  expect(v2.status(), await v2.text()).toBe(201);
  const doc2 = (await v2.json()).data;
  expect(doc2.versions).toHaveLength(2);

  // Append-only: v1 keeps its file and its feedback.
  // Read it back fresh: the POST response and the stored document must agree.
  const fresh = await (await student.get(`/api/education/engagements/${ENGAGEMENT}/report`)).json();
  const v1inResponse = doc2.versions.find((v: { versionNumber: number }) => v.versionNumber === 1);
  const v1after = fresh.data.versions.find((v: { versionNumber: number }) => v.versionNumber === 1);
  console.log('[5] v1 status in POST response →', v1inResponse.status);
  console.log('[5] v1 status re-read from DB  →', v1after.status);
  console.log('[5] v1 status now →', v1after.status, '· still has review →', Boolean(v1after.review));
  expect(v1after.status).toBe('SUPERSEDED');
  expect(v1after.review.summary).toBe(summary);
  const v1file = await student.get(
    `/api/education/engagements/${ENGAGEMENT}/report/file/${v1after._id}`
  );
  console.log('[5] v1 file still readable →', v1file.status());
  expect(v1file.status()).toBe(200);

  // ---- 6. Lecturer accepts version 2 ----------------------------------
  const accept = await lecturer.post(`/api/lecturer/reports/${reportId}`, {
    data: {
      outcome: 'READY_FOR_DEMONSTRATION',
      scores: { problemUnderstanding: 4, solutionQuality: 4, processQuality: 4, aiUsage: 4 },
      summary:
        'The revisions did the work that was asked of them. The architecture section now describes your own system rather than a pattern, and it says plainly what you rejected and why, which is the part most reports never manage. The test results are present and you have been honest about the three that still fail. Bring the synchronisation flow to the demonstration and be ready to say what happens when two devices disagree about the same record.',
      questionsForDemonstration: 'What happens when two devices disagree about the same record?',
      checklist: [{ item: 'architectureDocumented', met: true }],
    },
  });
  console.log('[6] accept v2 →', accept.status());
  expect(accept.status(), await accept.text()).toBe(200);

  // ---- 7. Lecturer publishes a slot; student books it ------------------
  const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  startsAt.setHours(10, 0, 0, 0);
  const slot = await lecturer.post('/api/lecturer/availability', {
    data: { startsAt: startsAt.toISOString(), durationMinutes: 45, format: 'IN_PERSON', location: 'Lab 3' },
  });
  console.log('[7] publish slot →', slot.status());
  expect(slot.status(), await slot.text()).toBe(201);
  const slotId = (await slot.json()).data._id;

  const slots = await student.get('/api/education/demonstration-slots');
  const visible = (await slots.json()).data;
  console.log('[7] slots visible to student →', visible.length);
  expect(visible.length).toBeGreaterThan(0);

  const booking = await student.post('/api/education/demonstrations', {
    data: {
      engagementId: ENGAGEMENT,
      slotId,
      studentNotes: 'I will show the offline sync queue and the reconciliation report. The conflict UI is incomplete.',
    },
  });
  console.log('[8] book →', booking.status());
  expect(booking.status(), await booking.text()).toBe(201);
  const demoId = (await booking.json()).data._id;

  // Double-booking the same slot must fail.
  const doubleBook = await student.post('/api/education/demonstrations', {
    data: { engagementId: ENGAGEMENT, slotId, studentNotes: 'Trying the same slot twice over again.' },
  });
  console.log('[8] double booking →', doubleBook.status());
  expect(doubleBook.status()).toBeGreaterThanOrEqual(400);

  // ---- 9. Lecturer accepts, completes, evaluates -----------------------
  const acceptDemo = await lecturer.patch(`/api/lecturer/demonstrations/${demoId}`, {
    data: { action: 'ACCEPT' },
  });
  console.log('[9] accept demonstration →', acceptDemo.status(), (await acceptDemo.text()).slice(0, 120));
  expect(acceptDemo.status()).toBe(200);

  const early = await lecturer.patch(`/api/lecturer/demonstrations/${demoId}`, {
    data: { action: 'COMPLETE' },
  });
  console.log('[9] complete before the scheduled time →', early.status(), '(must refuse)');
  expect(early.status()).toBe(409);

  // A demonstration whose time has passed is a state the application reaches by
  // waiting. The clock is moved rather than the rule bent.
  await shiftDemonstrationIntoThePast(demoId);

  const completed = await lecturer.patch(`/api/lecturer/demonstrations/${demoId}`, {
    data: { action: 'COMPLETE' },
  });
  console.log('[9] complete after it was due →', completed.status());
  expect(completed.status(), await completed.text()).toBe(200);

  // ---- 10. First outcome: revision required --------------------------
  const failed = await lecturer.patch(`/api/lecturer/demonstrations/${demoId}`, {
    data: { action: 'EVALUATE', evaluation: evaluation('REVISION_REQUIRED', 2) },
  });
  console.log('[10] evaluate → revision required →', failed.status(), (await failed.text()).slice(0, 90));
  expect(failed.status()).toBe(200);

  const afterFail = await stateOf(student);
  console.log('[10] project status →', afterFail.status, '· report stage →', afterFail.stage);
  expect(afterFail.status).toBe('REVISION_REQUIRED');

  // ---- 11. The student must not be stuck -----------------------------
  const resume = await student.patch(`/api/education/engagements/${ENGAGEMENT}/status`, {
    data: { status: 'IN_PROGRESS' },
  });
  console.log('[11] resume after a failed demonstration →', resume.status());
  expect(resume.status()).toBe(200);

  const v3 = await student.post(`/api/education/engagements/${ENGAGEMENT}/report`, {
    multipart: {
      file: { name: 'report-v3.pdf', mimeType: 'application/pdf', buffer: pdf('Dairy Reconciliation v3') },
      studentNote: 'Fixed the conflict resolution the demonstration exposed, and added the failing case to the tests.',
    },
  });
  console.log('[11] upload v3 →', v3.status());
  expect(v3.status(), await v3.text()).toBe(201);
  expect((await v3.json()).data.versions).toHaveLength(3);

  const accept3 = await lecturer.post(`/api/lecturer/reports/${reportId}`, {
    data: {
      outcome: 'READY_FOR_DEMONSTRATION',
      scores: { problemUnderstanding: 5, solutionQuality: 4, processQuality: 4, aiUsage: 4 },
      summary: ACCEPT_SUMMARY,
    },
  });
  console.log('[11] accept v3 →', accept3.status());
  expect(accept3.status(), await accept3.text()).toBe(200);

  // ---- 12. Second demonstration, approved ----------------------------
  const startsAt2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  startsAt2.setHours(14, 0, 0, 0);
  const slot2 = await lecturer.post('/api/lecturer/availability', {
    data: { startsAt: startsAt2.toISOString(), durationMinutes: 45, format: 'IN_PERSON', location: 'Lab 3' },
  });
  expect(slot2.status()).toBe(201);
  const booking2 = await student.post('/api/education/demonstrations', {
    data: {
      engagementId: ENGAGEMENT,
      slotId: (await slot2.json()).data._id,
      studentNotes: 'Second attempt. The conflict resolution now works and I can show the failing case passing.',
    },
  });
  console.log('[12] book a second demonstration →', booking2.status());
  expect(booking2.status(), await booking2.text()).toBe(201);
  const demo2 = (await booking2.json()).data._id;

  await lecturer.patch(`/api/lecturer/demonstrations/${demo2}`, { data: { action: 'ACCEPT' } });
  await shiftDemonstrationIntoThePast(demo2);
  await lecturer.patch(`/api/lecturer/demonstrations/${demo2}`, { data: { action: 'COMPLETE' } });

  const approved = await lecturer.patch(`/api/lecturer/demonstrations/${demo2}`, {
    data: { action: 'EVALUATE', evaluation: evaluation('APPROVED', 5) },
  });
  console.log('[12] evaluate → approved →', approved.status());
  expect(approved.status(), await approved.text()).toBe(200);

  const final = await stateOf(student);
  console.log('[12] FINAL project status →', final.status);
  expect(final.status).toBe('VERIFIED');

  await student.dispose();
  await lecturer.dispose();
});

// ---------------------------------------------------------------------------
// The same world, through the browser. Runs after the rehearsal has built the
// state, so these are real screens with real data rather than empty ones.
// ---------------------------------------------------------------------------

test('BROWSER: the screens that carry the workflow', async ({ browser }) => {
  const errors: string[] = [];

  const studentPage = await (await browser.newContext({ storageState: authFile('student') })).newPage();
  studentPage.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[student] ${m.text().slice(0, 160)}`);
  });
  studentPage.on('pageerror', (e) => errors.push(`[student] pageerror: ${e.message.slice(0, 160)}`));

  await studentPage.goto(`/dashboard/student/projects/${ENGAGEMENT}`);
  await expect(studentPage.getByRole('heading', { name: 'E2E Developer Log', level: 1 })).toBeVisible({
    timeout: 30_000,
  });
  console.log('[b1] completed project still opens for the student');

  // The outcome must be legible on the screen, not only in the database.
  await expect(studentPage.getByText('Complete', { exact: true }).first()).toBeVisible();
  await expect(studentPage.getByText(/Approved by your lecturer/i)).toBeVisible();
  console.log('[b2] the student can read the final outcome');

  await studentPage.getByRole('tab', { name: 'Project report' }).click();
  await expect(studentPage.getByText('Version 3')).toBeVisible();
  await expect(studentPage.getByText('Version 1')).toBeVisible();
  console.log('[b3] all three versions are listed, oldest kept');

  // The lecturer's feedback on the superseded version is still readable.
  await expect(studentPage.getByText(/textbook definition/i).first()).toBeVisible();
  console.log('[b4] feedback stays attached to the version it was written about');

  const lecturerPage = await (await browser.newContext({ storageState: authFile('lecturer') })).newPage();
  lecturerPage.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[lecturer] ${m.text().slice(0, 160)}`);
  });
  lecturerPage.on('pageerror', (e) => errors.push(`[lecturer] pageerror: ${e.message.slice(0, 160)}`));

  await lecturerPage.goto('/dashboard/lecturer/reports');
  await expect(lecturerPage.getByRole('heading', { name: 'Reports to review' })).toBeVisible({
    timeout: 30_000,
  });
  console.log('[b5] lecturer queue renders');

  await lecturerPage.goto('/dashboard/lecturer/demonstrations');
  await expect(lecturerPage.getByRole('heading', { name: /Demonstrations/i })).toBeVisible({
    timeout: 30_000,
  });
  console.log('[b6] lecturer demonstrations screen renders');

  await lecturerPage.goto('/dashboard/lecturer/availability');
  await expect(lecturerPage.getByRole('heading', { name: /availability/i })).toBeVisible({
    timeout: 30_000,
  });
  console.log('[b7] lecturer availability screen renders');

  console.log('[b8] console errors →', errors.length === 0 ? 'none' : errors.join(' | '));
  expect(errors, errors.join('\n')).toHaveLength(0);

  const removed = await cleanUpUploadedReports();
  console.log('[b9] stored documents removed →', removed);
});

test('AUTHORIZATION: another student cannot reach the work', async () => {
  const other = await ctx('buyer'); // wrong role entirely
  const probes = [
    `/api/education/engagements/${ENGAGEMENT}/report`,
    `/api/lecturer/reports`,
  ];
  for (const p of probes) {
    const res = await other.get(p);
    console.log('[auth] buyer →', p, '→', res.status());
    expect(res.status()).toBeGreaterThanOrEqual(400);
  }
  await other.dispose();

  const unverified = await ctx('lecturer-unverified');
  const q = await unverified.get('/api/lecturer/reports');
  console.log('[auth] unverified lecturer → queue →', q.status());
  expect(q.status()).toBe(403);
  await unverified.dispose();
});
