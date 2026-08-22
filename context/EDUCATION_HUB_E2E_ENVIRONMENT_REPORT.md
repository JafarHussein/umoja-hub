# Education Hub — E2E environment report

Written 2026-08-22, after three CI rounds spent diagnosing Playwright failures by inference.
Practical guide: `context/EDUCATION_HUB_E2E_SETUP.md`.

---

## 1. Why local E2E execution was not working

**It was working. I never tried it.**

That is the honest finding, and everything else in this document follows from it. There was no
missing service, no absent database, no broken configuration and no infrastructure gap. The harness
was already correct:

- `MONGODB_E2E_URI` was already present in `.env.local`.
- `e2e/support/database.ts` already required it, already refused to fall back to `MONGODB_URI`, and
  already carried two independent guards against dropping a real database.
- `playwright.config.ts` already started its own production build on its own port, against that
  database, and already refused to reuse a server it could not verify.

What actually happened is that a memory note recorded `MONGODB_E2E_URI` as **required** for
`npm run test:e2e`. I read "required" as "unavailable", concluded the suite could not run here, and
pushed to CI to find out instead — three times, at roughly eighteen minutes a round. A single
`npx playwright test e2e/developer-log.spec.ts --project=desktop` would have reproduced the failure
in four minutes on the first attempt.

The lesson is not about tooling. **Check whether the thing is actually blocked before building
around the block.** No infrastructure was needed; what was needed was one command.

Because the environment was already sound, this work became: prove it runs, fix the real failures
with it, and remove the two ways it had been silently lying.

---

## 2. What I changed

Nothing structural in the harness. It did not need it.

**Test infrastructure**
- `package.json` — added `test:e2e:fast` (desktop only, the tight loop) and `test:e2e:education`
  (the Hub's own specs). `test:e2e` and `npm run test:e2e -- <spec>` already worked.
- `e2e/support/global-setup.ts` — a dedicated report-author student fixture, an institution shared
  by lecturer and students, and `assertOneActiveEngagementPerStudent()`, which fails the run when
  fixtures collide (§4).
- `e2e/smoke.spec.ts` — asserts `response.ok()`. It previously asserted only "no redirect", which is
  true of a 404 page (§7, defect 1).
- `e2e/support/auth.ts`, `verification-lockout.spec.ts` — off the deleted `/dashboard/lecturer/queue`.
- `e2e/developer-log.spec.ts` — three locator corrections (§8).

**Application code** — two real defects the suite found once it was actually run:
- `src/types/index.ts` — new `ACTIVE_PROJECT_STATUSES`, the single definition of "this project is
  still the student's current work".
- `src/app/api/education/engagements/me/route.ts`, `…/engagements/route.ts`,
  `src/app/api/mentor/chat/route.ts` — all three now read it instead of keeping private copies.
- `src/lib/auth/dashboards.ts`, `src/app/dashboard/lecturer/page.tsx`,
  `src/lib/notifications/notify.ts`, `src/components/shared/Sidebar.tsx`,
  `scripts/capture-screenshots.ts` — off the deleted route.

**Documentation** — this file and `EDUCATION_HUB_E2E_SETUP.md`.

No Food Hub product code, seed data, presentation data or workflow was touched. The shared changes
are the smoke assertion and the route-map correction; the Food Hub specs cover farmer, buyer, admin,
checkout, mediation, payouts, supplier directory and marketplace search, and all of them pass on
every run below.

---

## 3. Database isolation strategy

Unchanged, because it was already right. Recorded here because it is the part most worth not
breaking:

- `MONGODB_E2E_URI` is required, with **no fallback** to `MONGODB_URI`. A missing value stops the
  run with an explanation.
- **Guard 1**, in `playwright.config.ts`: the two URIs may not name the same host and database.
  Checked while both are still their original values, before the config redirects `MONGODB_URI` onto
  the harness database for the run.
- **Guard 2**, in `e2e/support/database.ts`: the harness only drops a database that is empty or
  carries its own `__e2e_harness` marker. A URI pointing at anything real fails here, before a
  single write.
- Both the harness process and the app under test are redirected onto the harness database, so
  fixtures and the application can never end up on different ones.

Worst case of a misconfiguration is a refusal to run.

---

## 4. Fixture isolation strategy

The failures that cost the most were not assertion failures. They were **fixtures interfering with
each other**, surfacing as a confusing error in an unrelated spec.

The rule that caused it: **one student may own at most one active project.**
`/api/education/engagements/me` returns a student's most recent active engagement, and the entire
student workspace resolves through it. Giving the seeded `student` the lecturer's report — my own
fix for an unrelated problem — gave that student a second active engagement, which silently
redirected the developer-log workspace to a different project.

Three constraints meet on that one fixture, and none is negotiable:

1. the report's author must be a **real user in the lecturer's institution**, or the
   institution-scoped queue cannot see it;
2. it must **not** be the `student` fixture, whose workspace another spec resolves through `/me`;
3. it must **not** be the dangling peer author, who is deliberately never created as a user so the
   peer-review pane shows no identity.

A dedicated report-author student satisfies all three. That is a legitimate Education Hub state, not
a fixture contrived to make a test pass: a real student, enrolled at the lecturer's institution, who
submitted one report.

**The rule is now enforced, not documented.** `assertOneActiveEngagementPerStudent()` runs at the end
of global setup and refuses the run, naming the student and both engagement ids. Verified by
reintroducing the collision deliberately:

```
E2E fixtures give a student more than one active project.

  student 6a89a8178574f72310aad192 owns 2: 000000000000000000000020, 000000000000000000000024
```

That is the diagnosis two CI rounds produced, delivered by setup in the run that caused it.

**Determinism**: fixtures are written at fixed ObjectIds with fixed content. The only
non-deterministic values are the harness run id and session expiry, and no assertion reads either.
There is no randomness to seed.

---

## 5. Local test command

```bash
npm run test:e2e                              # all specs, three viewports — what CI runs
npm run test:e2e:fast                         # all specs, desktop only
npm run test:e2e:education                    # Education Hub specs only
npm run test:e2e -- e2e/developer-log.spec.ts --project=desktop   # one spec, one viewport
```

Full suite ≈ 3.5 minutes warm; one spec ≈ 1.5. On failure, read
`test-results/<test>/error-context.md` — it holds an accessibility snapshot of the page at the
moment the assertion failed, which answered every spec failure below without a second run.

---

## 6. CI and local parity

Identical: specs, fixtures, global setup and teardown, the application build, and the isolation
guards.

Different, deliberately:

| | Local | CI |
|---|---|---|
| Database | Atlas database `umojahub_e2e` | `mongo:7` service container on `localhost` |
| Build | inside the webServer command | its own step |
| Workers | all cores | 1 |
| Retries | 0 | 1 |

CI serialises and retries because visual snapshots on shared runners are otherwise flaky. Locally
you want the whole suite in three minutes and a failure that reproduces first time. The only
substantive gap is that the local database is on Atlas and therefore needs a network; both are
dedicated databases behind the same two guards.

---

## 7. Defects found — application, not tests

Both were introduced by the demonstration/report work and passed every gate before this.

**Defect 1 — every lecturer's post-login destination was a dead route.**
`/dashboard/lecturer/queue` was deleted with the review-queue rebuild, but five places still pointed
at it: the role→home map used for post-authentication redirects, access-denied recovery and the
account menu; the `/dashboard/lecturer` index redirect; notification deep links; the legacy shell
nav; and the screenshot tool. A lecturer logging in landed on a 404.

*Root cause:* `src/lib/auth/dashboards.ts` exists precisely to stop this and says so in its own
docstring — "Every landing page below is a real route. Keep it that way" — and the route rename did
not update it. It survived because `smoke.spec.ts` asserted only that the URL had not been
redirected, which is equally true of a 404 page.

*Fix:* all five references corrected, and the smoke test now asserts `response.ok()`, so a dead
landing fails the suite.

**Defect 2 — an accepted report removed the project from the student's workspace.**
`ACTIVE_STATUSES` was defined privately in three routes. The demonstration stage added
`READY_FOR_DEMONSTRATION` and `DEMONSTRATION_SCHEDULED`; none of the three lists were updated. So
`/api/education/engagements/me` stopped returning the project the moment a lecturer accepted the
report — the student's workspace lost their project at exactly the point the assessment moved to the
demonstration. The same omission let a student start a second project mid-assessment, and dropped
the AI mentor's project context while they prepared to defend it.

*Root cause:* one question with three copies of the answer.

*Fix:* one exported `ACTIVE_PROJECT_STATUSES` beside the enum it is made of, read by all three
routes and by the fixture guard.

---

## 8. Spec failures — root causes and fixes

The six CI failures were, in the end, three locator mistakes of mine and one fixture collision.

| Spec | Root cause | Fix |
|---|---|---|
| `developer-log` ×2 | `getByText('Building')` matched both the progress card and the stepper's *"Building and writing up"* — strict-mode violation | `{ exact: true }` |
| `developer-log` | `getByRole('button', { name: 'Project report' })` — the workspace switcher is a real `tablist`, so it is a `tab` | `getByRole('tab', …)` |
| `developer-log` | `getByText('The engineering')` matched the part heading *and* a guidance line containing the phrase | `getByRole('heading', …)` |
| `developer-log` | fixture collision — two active engagements on one student | dedicated report author (§4) |
| `lecturer-review` | review queue empty: neither fixture had an institution, and the route correctly shows an unscopeable lecturer nothing | shared institution + real author |
| `verification-lockout` ×2 | visited the deleted `/dashboard/lecturer/queue`; the new pages had also replaced the shared `VerificationLockout` with a bespoke alert, dropping both the test id and the way forward | route corrected, lockout component restored on all three lecturer pages |

Note the pattern: **the application was right in every case except the two defects in §7.** Every
remaining failure was the test describing the page incorrectly. The page snapshots in
`error-context.md` said so immediately.

---

## 9. Final results

All local, on this machine, against the dedicated E2E database.

| Gate | Result |
|---|---|
| `npm run type-check` | clean |
| `npm run lint` | 0 errors (5 pre-existing warnings) |
| `npm run test` | **1459 passed**, 121 suites |
| `npm run build` | exit 0 |

**Three consecutive full E2E runs, each from a clean database:**

| Run | Result | Time |
|---|---|---|
| 1 | **121 passed**, 2 skipped | 4.7m |
| 2 | **121 passed**, 2 skipped | 4.4m |
| 3 | **121 passed**, 2 skipped | 3.3m |

Five earlier full runs during the work were also green (3.1m, 3.6m, 3.7m, 3.8m), plus one aborted by
an orphaned port (§10) — that abort never ran a test. **Eight green full runs, no flaky test
observed.**

All three viewports (desktop, tablet, mobile), fully parallel, 123 tests of which 2 are skipped by
their own guards.

**Education Hub** — `developer-log` (6), `lecturer-review` (3), `peer-review` (3), the lecturer half
of `verification-lockout` (6), plus the student and lecturer sessions in `smoke` and
`identity-records`: green on every run.

**Food Hub regression** — `checkout` (12), `buyer-mediation` (9), `farmer-orders` (6),
`farmer-ledger` (6), `marketplace-search` (6), `payment-simulation` (6), `supplier-directory` (6),
`admin-mediation` (3), `admin-payouts` (3), `admin-group-tokens` (3), `group-hub` (3),
`link-group-token` (3), and the farmer half of `verification-lockout` (9): green on every run. No
Food Hub product code, seed data or presentation data was modified.

**Remaining failures: none.**

---

## 10. Known limitations

- **The local E2E database is on Atlas**, so the suite needs a network. CI uses a container. Moving
  local onto `mongodb-memory-server-core` (already a devDependency, used by the integration tests)
  would remove that, but the app under test is a separate process and would have to be handed the
  in-memory URI at config-evaluation time. Not attempted: the suite runs in 3.5 minutes as it is,
  and speculative infrastructure was the mistake this whole exercise came from.
- **Killing a run orphans its server.** The harness deliberately refuses to reuse a server it cannot
  verify, so the next run fails with `port already used`. Clearing the port is in the setup guide.
  Weakening `reuseExistingServer` would trade a clear error for the risk of testing against an
  unknown database.
- **The submitted-report fixtures name a `publicId` that stores no file.** The specs assert the
  document is offered and never fetch it; uploading to real storage from the harness would add an
  external dependency to prove nothing.
- **Visual snapshots are deferred**, as they were before this work. The suite asserts behaviour and
  structure, not pixels.

---

## 11. How to reproduce the complete run

```bash
npm run type-check
npm run lint
npm run test
npm run build
npm run test:e2e        # ×3, from a clean database each time — setup drops before it seeds
```

The E2E suite needs `MONGODB_E2E_URI` in `.env.local`; everything else comes from the existing
environment. No step requires an external service beyond the database.
