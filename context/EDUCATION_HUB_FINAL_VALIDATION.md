# Education Hub — final validation

Performed 2026-08-22 against `chore/education-hub-final-validation`, branched from `main` at
`e23dd02`. Every finding below was produced by running the software, not by reading it: the workflow
was driven end to end through the real routes, the real database and real file storage, and then
read back through a browser.

Companion documents: `EDUCATION_HUB_AUDIT.md` (the original 40/100 audit),
`EDUCATION_HUB_E2E_SETUP.md` (how to run any of this yourself).

---

## 1. Executive result

**The workflow now runs end to end. It did not when this validation began.**

Four defects were found, three of them invisible to every existing gate — type-check, lint, 1459
unit tests, and a green production build all passed while the single most important lecturer
capability was completely broken.

| | |
|---|---|
| **BLOCKER** | A lecturer could not open *any* submitted report. Every upload succeeded and every read failed. |
| **HIGH** | A student whose project was approved could no longer open it — their finished work vanished from the workspace at the moment it was signed off. |
| **HIGH** | The upload response contradicted the database it had just written. |
| **MEDIUM** | The demonstration outcome "not ready" could not be recorded at all. |
| **MEDIUM** | The seeder produced project states no route in the application can produce. |

All five are fixed and verified by re-running the workflow. The rehearsal that proves it is now a
permanent, repeatable command: `npm run test:e2e:rehearsal`.

**Readiness: the workflow is demonstrable.** §25 sets out what that does and does not mean.

---

## 2. Complete workflow tested

Driven as the real actors, through the real stack, in one ordered run:

```
student uploads v1 → lecturer queue → lecturer opens the PDF → sends it back with a
page note → student reads the feedback → uploads v2 → v1 superseded, kept, still
readable → lecturer accepts v2 → lecturer publishes a slot → student books it →
lecturer accepts → demonstration completed → evaluated REVISION REQUIRED → project
reopens → student uploads v3 → lecturer accepts v3 → second slot → second
demonstration → evaluated APPROVED → project VERIFIED → student opens the finished
project and reads the outcome
```

Three report versions. Two revision cycles — one from the document review, one from a failed
demonstration. Two demonstrations. That is deliberately more than one of each: the directive asked
whether anything assumed a single revision, and nothing does.

Alongside it, the negative cases: duplicate upload, revision with no explanation, rejection naming
nothing, double booking, completing a demonstration before it was due, and four unauthorised
requests.

---

## 3. Student journey findings

**Academic context is genuinely the spine, not decoration.** The new-project screen refuses to
generate anything until the student has recorded what they are studying, and says why in its own
words: *"A project is written from what you are studying — the units you are taking decide what the
work has to make you practise."* The track choice is explicitly framed as *"This decides which of
several valid projects you get — never how demanding it is. Your units set the bar."* The brief
carries an `academicAnchor` — units, year, semester, and where the coursework record came from —
and the project page renders it. The question the vision forbids is not asked anywhere.

**Recommendations are not random.** The one `Math.floor(Math.random() …)` that used to pick the
problem domain is gone, replaced by a rule that excludes domains the student has already worked in
and only falls back when the library is exhausted. The remaining `Math.random` in the Hub is in
`peerReviewer.ts`, breaking ties between equally-loaded reviewers, and it is injected so it can be
tested. No randomness decides anything a student would be asked to justify.

**Defect (HIGH, fixed): a completed project became unreachable.** Every student screen — home, the
project workspace, the AI mentor — resolved the current project through
`/api/education/engagements/me`, which returns the most recent *active* engagement. `VERIFIED` is
terminal and therefore excluded, so the moment a lecturer approved a project the workspace reported
it as not found, and the dashboard offered to start a new one as though nothing had been built. The
student could never read the outcome they had been waiting for.

Fixed by addressing a project by its id rather than by "what am I working on now":
`GET /api/education/engagements/[id]` (ownership in the query) and `GET /api/education/engagements`
for the history. The workspace now loads by id; the dashboard lists finished work above the empty
state. Verified in the browser: the completed project opens, shows **Complete**, and shows
*"Approved by your lecturer."*

---

## 4. Lecturer journey findings

The review workspace answers the questions a lecturer actually arrives with: the student and their
year, the project title, the version number, what the student said changed, the document itself, the
blocker and AI-usage logs, the checklist, the rubric, page notes, and the two decisions — all on one
screen. The queue is ordered oldest-first and scoped to the lecturer's own institution.

Confirmed working in the browser: the queue, the review workspace, the demonstrations screen and the
availability screen all render with real data and **zero console errors**.

One rough edge left alone deliberately: the report review and the demonstration are reached from
different places in the navigation. Merging them would be a redesign, and the workflow does not
require it.

---

## 5. Documentation submission findings

The intentional model — the student writes the report elsewhere and uploads the finished PDF — is
intact and was not weakened.

Verified by execution:

| Case | Result |
|---|---|
| Valid PDF | 201, stored, page count read from the file itself |
| Second upload while with the lecturer | 409, refused |
| Revision with no note about what changed | 400, refused |
| Revision with a note | 201, version 2 |
| Third version after a failed demonstration | 201, version 3 |
| Wrong MIME type / not a PDF | refused before the upload is spent (`looksLikePdf` checks the magic number, not the extension) |
| Empty file | refused |
| Over 25 MB | refused with the actual size named |

Storage failure is honest: the upload happens **before** the database write, so a failed upload
leaves no version pointing at a file that was never stored. The reverse — a stored file with no
version — costs an unreferenced object and nothing else, and is logged.

---

## 6. Document viewer findings — the blocker

**Defect (BLOCKER, fixed): the lecturer could not read a single submitted report.**

Every upload returned 201. Every read returned 502. Cloudinary answered **401 deny or ACL failure** —
including to its own `secure_url`, with no auth header at all.

Root cause, established by probing the real service rather than reasoning about it:

1. The account does not permit delivery of PDFs. A `.txt` uploaded as `raw` delivers with 200; the
   same account refuses the PDF. (`.bin` is refused at upload — "resources with extension bin are
   not allowed" — so renaming was never an option either.)
2. The code sent HTTP Basic credentials to `res.cloudinary.com`, which does not read them. Its own
   comment described a signed URL that "lives for two minutes and never leaves the server" — an
   implementation that was not there.

Fixed by making the code do what its comment claimed. Reports are uploaded as `type: private`,
which gives them **no delivery URL at all**, and are read through a signed download URL generated
per request and valid for two minutes.

Verified against the live service:

```
original bytes : 7204
fetched bytes  : 7204
IDENTICAL      : true
public /upload : 404   (must not be 200)
public /private: 401   (must not be 200)
```

This is stronger than the alternative of enabling PDF delivery on the account, which would have made
every report readable by anyone holding the URL, for ever. "Every read is a decision the application
makes" is now a property of the storage rather than a promise about our own code.

**Viewer capabilities, stated honestly.** The lecturer opens the PDF inline in the review workspace
(`<object>`), with a named link to open it in a tab, and can switch versions. Page navigation,
zoom, search and page numbers are **the browser's built-in PDF viewer**, not something the platform
implements — which is why page-level feedback is entered as a page number the lecturer reads off
that viewer. A custom in-app viewer (pdf.js with a page index and search) is recorded in §24 as
deferred, not claimed as present.

---

## 7. Review system findings

Both instruments work and are distinct, which is the point:

- the **13-item checklist** asks whether the report contains what the standard asks for — the
  structural question the platform answered for itself when it held the prose, and cannot answer
  about a PDF it does not read;
- the **four-dimension rubric** asks how good what is there is.

Verified: scores persist against the correct version; the review is written onto the version being
judged by an `arrayFilters` update conditional on that version still being `SUBMITTED`, so two
lecturers opening the same report produce one decision and one 409; the student sees the feedback
but never lecturer-internal state; a rejection naming nothing is refused **by the schema**, not only
by the screen (verified with a direct API call that bypassed the UI entirely — 400).

The rubric does not decide the project. Approval comes only from the demonstration.

---

## 8. Revision workflow findings

Append-only, and proven so rather than asserted:

- v1 keeps its file *and* the review that prompted the change — its status becomes `SUPERSEDED`, its
  feedback stays attached to it, and its PDF is still readable afterwards (200).
- The lecturer's queue only ever offers the newest version; older submitted versions cannot be
  reviewed twice.
- Two full cycles ran, and a third version was accepted normally. Nothing assumes a single revision.

**Defect (HIGH, fixed): the upload response contradicted the database.** `findOneAndUpdate` captured
the record as it was when the new version was pushed — *before* the supersede that follows it — so
the response told the student their previous version was still "changes requested" while the stored
document already said superseded. The two agreed only after a reload. The route now re-reads and
returns the settled state.

This one is worth noting as a class: it was invisible to every test that asserted against the
database, and only appeared when the rehearsal compared the POST response with a subsequent GET.

---

## 9. Demonstration scheduling findings

Verified by execution: a lecturer publishes a slot (201); the student sees it; the student books it
(201); booking the same slot twice is refused (409); the lecturer accepts, and the project moves to
`DEMONSTRATION_SCHEDULED`.

Rules confirmed in force: a slot in the past is refused at publication; a booking must be at least
60 minutes ahead so the lecturer has time to read the report first; overlapping slots for one
lecturer are refused by an explicit overlap check, not merely by the unique index on start time; a
declined or cancelled demonstration returns the slot to the pool and the project to
`READY_FOR_DEMONSTRATION`.

**A lecturer cannot mark a demonstration as having happened before it was due** — 409,
`DEMONSTRATION_NOT_YET_DUE`. The rehearsal moves the clock rather than bending the rule.

The student can book and cancel. They cannot confirm their own demonstration and cannot record that
it happened: a record of a meeting written by the assessed party is not evidence of anything.

---

## 10. Demonstration outcome findings

`APPROVED` → `VERIFIED`, with `verifiedAt` set. Verified end to end.

`REVISION_REQUIRED` → the project returns to `REVISION_REQUIRED` **and the accepted report version
is reopened**, because an accepted version is one the upload rule otherwise refuses to replace.
Without that the student would be told to revise and then refused the means to. Verified: after a
failed demonstration the project reads `REVISION_REQUIRED`, the report reads `CHANGES_REQUESTED`,
the student resumes, uploads v3, and reaches a second demonstration.

**Defect (MEDIUM, fixed): `NOT_READY` could not be recorded.** The outcome existed in the types with
a considered rationale — *"one says the work needs specific changes, the other says it was not in a
state to be assessed at all"* — and the evaluation schema accepted only the other two. The one
outcome a lecturer most needs on a bad day was unreachable, so they would have had to call it a
revision, which says something different.

Now accepted, and routed to a different place: `NOT_READY` leaves the project at
`READY_FOR_DEMONSTRATION` and does **not** reopen the report. Nothing about the accepted document
changed — the student simply books another time. Sending them back to rewrite a report the lecturer
had already accepted would be the platform inventing work.

No outcome is a dead end.

---

## 11. Authorization and security findings

Probed at the **API layer**, bypassing the interface entirely:

| Probe | Result |
|---|---|
| Wrong role reading a student's report record | 403 |
| Wrong role reading the lecturer queue | 403 |
| Unverified lecturer reading the queue | 403 `LECTURER_NOT_VERIFIED` |
| A report belonging to another institution | 404 — indistinguishable from absent |
| A version id that is not this project's | 404 |
| Unauthenticated read of a stored document | 404 |

The file route authorises **per read**, and only three readers exist: the student who wrote it, a
verified lecturer at their institution, and the peer who was asked to read it. A peer is refused
superseded versions.

Refusals are 404 rather than 403 wherever the existence of the record is itself a disclosure. The
stored document has no public URL at all (§6), so authorisation cannot be bypassed by holding a link.

---

## 12. Notification findings

Complete against the workflow, with no spam — every notification corresponds to a state change
someone must act on.

Student: report submitted · report accepted · changes requested · demonstration confirmed ·
demonstration declined · demonstration cancelled · final outcome.
Lecturer: a report submitted (fanned out only to verified lecturers at that student's institution,
never platform-wide) · a demonstration requested · a demonstration cancelled.
Peer: asked to read a report.

---

## 13. AI mentor findings

Working and left alone: it responds, sessions persist and are scoped to their owner, and the rate
limit holds.

**Gap recorded, not fixed:** the mentor reads the engagement through the same "current active
project" query the rest of the student surface used, so once a project is approved it loses the
project context. The shared `ACTIVE_PROJECT_STATUSES` fix (§17) means it now keeps context through
`READY_FOR_DEMONSTRATION` and `DEMONSTRATION_SCHEDULED` — the run-up to the demonstration, which is
exactly when a student is preparing to defend the work. Past-project context remains out of scope.

---

## 14. Peer review findings

Still coherent under the upload model, and deliberately narrowed. A peer receives **only** the
version they were asked to read, through `toPeerDocumentationView` — which exists precisely because
the ordinary view carries the lecturer's summary and scores. A student reading a classmate's work
has no business knowing what their lecturer thought of it; peer review exists so somebody reads the
project, not so the cohort can compare marks. Author identity remains withheld.

Peer review gates nothing. A student whose cohort is slow is not held out of their own assessment.

---

## 15. GitHub findings

**Evaluated, and deliberately not built.**

GitHub is a URL the student supplies and nothing more. `githubSnapshot` remains empty because no
GitHub API integration exists, and the seeder does not fabricate commit counts or hashes — that
fabrication was removed earlier and has not returned. The report standard states the position
plainly: *"UmojaHub does not read repository contents and does not count commits… The lecturer may
open the repository themselves; the platform makes no claim about what is inside it."*

This is the correct answer for the current vision. The demonstration is where the work is verified —
by a human watching it run — so commit-history verification would add an integration, a failure
mode and a credential for evidence the demonstration already establishes better. Recorded as
future scope in §24.

---

## 16. Seed data findings

The seeder was **run**, not read — five times, against a scratch database. It produced **five
impossible states**, none of which any other gate would have caught. All five are fixed; the
validator went 5 failures → 3 → 2 → 0.

**S1 — states no route can produce.** `DENIED` and `UNDER_PEER_REVIEW` were written into seeded
projects and nothing in the application writes either: `DENIED` belonged to a lecturer verdict the
report-review cycle replaced, `UNDER_PEER_REVIEW` to a submission step that no longer gates
anything. `LecturerDecision.DENIED` was seeded for the same reason. A demonstration seeded into a
state the product cannot reach is a demonstration of something that does not exist, so the seeder
gave way.

**S2 — demonstrations evaluated before they took place.** Six of them. `verifiedAt` is computed
forward from when a project started, so a recently-started project carried one that had not arrived
yet, and the demonstration behind it inherited a future date while holding a completed evaluation.
Both the source and the derived date are now clamped to the past.

**S3 — projects ready to demonstrate with nothing submitted.** The phase promoted projects that were
still being built — which have no report at all — into `READY_FOR_DEMONSTRATION`, and then tried to
mark a submitted version accepted, matching nothing. It now promotes projects whose report is
already with the lecturer, skipping the oldest so the review queue guarantee still holds.

**S4 — the same project promoted twice.** Lecturers at one institution share a cohort, so two could
promote the same engagement; the second moved the project on while the report, already accepted by
the first, no longer matched the filter that accepts one. A run-level record of what has been
promoted fixes it.

**S5 — completed projects whose own report said "changes requested".** The sharpest of the five. A
project sent back could be promoted to `VERIFIED` by a *second* review pass rolled after the report
had already been written, leaving a finished project whose documentation still said it was being
revised. The ending is now decided before the report is written, so such a project is seeded with
the two versions it must really have — one sent back, one accepted.

**S6 — the demonstration story was under-supplied, and my first diagnosis of it was wrong.** Two
checks demanded that *every verified lecturer* have a demonstration request waiting and a session
coming up. I judged those over-strict — a world in which no member of staff ever has a quiet week is
not a university, and uniformity of that kind reads as fabricated — and rewrote them to assert the
same thing **per institution**.

Re-running showed institutions failing too, which proved the granularity was not the cause. The real
one was supply: the queue guarantee produced exactly **one** project per institution sitting in
front of a lecturer, and the demonstration phase needs two more on top of it to create a request and
a booking. The target is now three per institution.

Both halves stand, but only the second was the fix. Recording it that way because the first
correction alone would have looked like a passing check and been a quieter world. The per-lecturer
check that *is* achievable and does matter — every verified lecturer has bookable times on offer —
was left alone and passes.

Otherwise the seeded world holds up: every project past its brief has a report; every report is a
real PDF generated from real prose and uploaded through the application's own storage path; version
statuses and project statuses agree, checked using the application's own `documentationStage`; only
the newest version is live; every report sent back names what has to change; and no GitHub evidence
is fabricated anywhere.

---

## 17. State-machine findings

Mapped every writer of `ProjectStatus` across the codebase.

```
BRIEF_GENERATED ──start──▶ IN_PROGRESS ──upload──▶ UNDER_LECTURER_REVIEW
                                ▲                        │
                                │                 accept │ send back
                          resume│                        ▼
                    REVISION_REQUIRED ◀────────── READY_FOR_DEMONSTRATION
                                ▲                        │ book + accept
                     not approved│                       ▼
                                └────────────── DEMONSTRATION_SCHEDULED
                                                         │ complete + evaluate
                                              approved   ▼
                                                     VERIFIED
```

Every transition names its actor and its guard. No transition reaches `VERIFIED` without a completed
demonstration. No transition bypasses review. Every non-terminal state has an exit, and the two
"backwards" edges (revision, and a declined demonstration) both land somewhere the student can act.

**Defect (HIGH, fixed): three private copies of one question.** `ACTIVE_STATUSES` was declared
separately in three routes, and the demonstration stage added two statuses to the lifecycle without
updating any of them. Consequences: an accepted report removed the project from the student's own
workspace (§3); a student could start a *second* project while one was mid-assessment; and the AI
mentor lost its project context. Replaced by one exported `ACTIVE_PROJECT_STATUSES` beside the enum
it is made of, read by all three routes and by the fixture guard.

`SUBMITTED`, `UNDER_PEER_REVIEW` and `DENIED` remain in the enum but are now written by nothing —
kept only because records may carry them. Recorded in §24 for a future migration rather than removed
under a validation pass.

---

## 18. Failure-testing findings

Exercised, not imagined:

| Failure | Behaviour |
|---|---|
| Storage read fails | 502 with "That document could not be read from storage" — never a silent empty page. This is how the blocker was found. |
| Storage upload fails | 502, and no version row is written |
| Not a PDF despite the extension | refused on the magic number, before the upload is spent |
| Duplicate submission | 409 |
| Duplicate booking | 409 |
| Concurrent review of one version | conditional update; one decision, one 409 |
| Demonstration completed early | 409 |
| Invalid ObjectId in any URL | 404, never a 500 |
| Unauthenticated | 404 or redirect to login; never partial data |

Nothing observed reported success for an operation that failed.

---

## 19. Browser-testing findings

Real screens, real data, after the full workflow had run:

- the completed project opens for the student and shows **Complete** and *"Approved by your
  lecturer."*
- all three versions are listed, oldest kept, with the lecturer's page note still attached to the
  version it was written about
- the lecturer's queue, demonstrations and availability screens all render
- **zero console errors and zero page errors** across every screen visited

The wider suite — 121 tests across desktop, tablet and mobile — passes, including the Food Hub
regression.

---

## 20. Defect register

| # | Severity | Class | Defect | Where | Root cause | Fix | Blocks presentation? |
|---|---|---|---|---|---|---|---|
| D1 | **BLOCKER** | Bug / architecture | A lecturer could not open any submitted report; every read 502'd | `src/lib/integrations/documentStorage.ts` → the lecturer review workspace | The account does not deliver PDFs, and the code sent Basic credentials to a delivery host that ignores them — its own comment described a signed URL it never built | Upload as `type: private`; read through a per-request signed URL valid two minutes | **Yes — fixed** |
| D2 | **HIGH** | Workflow / UX | An approved project became unreachable; the student could never read the outcome | every student screen | The workspace resolved a project through "my *active* project" instead of by id | `GET /engagements/[id]` + `GET /engagements`; workspace loads by id; dashboard lists finished work | **Yes — fixed** |
| D3 | **HIGH** | Bug / data | The upload response contradicted the record it had just written | `POST …/report` | `findOneAndUpdate` captured state before the supersede that follows it | Re-read and return the settled document | No — fixed |
| D4 | **HIGH** | Architecture | Three private copies of "is this project still current"; two new statuses missing from all three | `engagements/me`, `engagements`, `mentor/chat` | One question, three answers | One exported `ACTIVE_PROJECT_STATUSES` | No — fixed |
| D5 | MEDIUM | Workflow | The demonstration outcome `NOT_READY` could not be recorded | `educationSchema.ts` | Defined in the types, omitted from the schema | Accepted, and routed so the project stays ready to demonstrate | No — fixed |
| D6 | MEDIUM | Data | The seeder produced `DENIED` / `UNDER_PEER_REVIEW`, which no route can produce | `scripts/demo/phases/education.ts` | Statuses retired by the report-review rebuild | Seeder produces only reachable states | No — fixed |
| D9 | MEDIUM | Data | Six demonstrations carried an evaluation for a meeting scheduled in the future | `scripts/demo/phases/demonstrations.ts` | `verifiedAt` computed forward from a recent start date could land in the future, and the demonstration date derived from it | Both clamped to the past | No — fixed |
| D10 | MEDIUM | Data | Projects ready to demonstrate with no report submitted | `scripts/demo/phases/demonstrations.ts` | Promotion drew from projects still being built, which have no documentation | Promote from projects whose report is with the lecturer, skipping the oldest | No — fixed |
| D11 | MEDIUM | Data | The same engagement promoted by two lecturers, leaving project and report disagreeing | `scripts/demo/phases/demonstrations.ts` | Lecturers at one institution share a cohort | Run-level record of what has been promoted | No — fixed |
| D12 | MEDIUM | Data | Completed projects whose own report still said "changes requested" | `scripts/demo/phases/education.ts` | A second review pass could verify a project *after* its report had been written | Decide the ending before writing the report; seed both versions | No — fixed |
| D13 | LOW | Testing gap | Two demo checks asserted an invariant that is not one — every lecturer always busy | `scripts/demo/validate.ts` | Guarantee written per lecturer rather than per institution | Asserted per institution; the achievable per-lecturer check kept | No — fixed |
| D7 | LOW | UX | Uploading while a report is with the lecturer is refused by the engagement guard, whose message is vaguer than the report rule's | `POST …/report` | Two guards, the coarser one first | Not changed — both refuse correctly; recorded | No |
| D8 | LOW | Testing gap | The rehearsal cannot run in CI | `.github/workflows/e2e.yml` | CI holds placeholder Cloudinary credentials | Run deliberately with `npm run test:e2e:rehearsal`; documented | No |

---

## 20a. Gates, as actually run

Every one of these was executed at the end of the pass, on this machine, after the final fix.

| Gate | Result |
|---|---|
| `npm run type-check` | clean |
| `npm run lint` | 0 errors, 5 warnings (all pre-existing) |
| `npm run test` | **1459 passed**, 121 suites |
| `npm run test:e2e` | **121 passed**, 2 skipped — desktop, tablet, mobile |
| `npm run test:e2e:rehearsal` | **3 passed** — the full lifecycle, then the screens, then cleanup |
| `npm run demo` | **all 73 checks passed** |
| `npm run build` | exit 0 |

The demo world took six runs to get there: 5 failing checks → 3 → 2 → 2 → 0. Each round was a real
diagnosis rather than a retry — the last one corrected an earlier wrong hypothesis of mine (see
§16, the note on supply versus granularity).

---

## 21. Presentation blockers

**None outstanding.** D1 and D2 were both presentation-fatal and are both fixed and verified.

One operational prerequisite, which is not a defect: **the demo world must be re-seeded** with
`npm run demo` before the panel. The seeded education data on any existing database predates the
report rebuild and the status corrections. This validation deliberately seeded into the E2E scratch
database rather than the presentation one, because rebuilding Food Hub presentation data is out of
bounds here.

---

## 22. Recommended fixes

All eight findings are dispositioned above; six are fixed in this branch. The two left open (D7, D8)
are recorded deliberately and neither affects a user.

Worth doing next, in order: a custom in-app PDF viewer if lecturers ask for search and page jumps
(§24); a migration retiring the three unwritten `ProjectStatus` members; and lecturer-facing
navigation that puts reports and demonstrations on one screen.

---

## 23. Features intentionally left unchanged

The report standard and its 25 sections · the upload-not-author model · the 13-item checklist · the
four-dimension rubric · the AI mentor · peer review · the institution/verification model · the brief
contract and `academicAnchor` · every notification · the Food Hub, entirely.

---

## 24. Features intentionally deferred

- **A custom PDF viewer** with in-app page navigation, zoom and search. Today the browser's viewer
  does this; page-level feedback is a page number the lecturer reads from it. Adequate, and honest
  about what it is.
- **GitHub verification** (§15) — no fabricated evidence in the meantime.
- **Retiring `SUBMITTED` / `UNDER_PEER_REVIEW` / `DENIED`** from `ProjectStatus`. Nothing writes
  them; existing records may carry them. A migration, not a validation-pass edit.
- **Teams**, which Foundation V2 places on `ProjectIncrement`.
- **Past-project context for the AI mentor.**

---

## 25. Final readiness assessment

The standard set for this pass was not "the tests pass" but "a realistic student and lecturer can
use it from beginning to end." That is now true, and it was not when this began.

**The student can** understand why they received a project, choose one, build it, submit finished
documentation, receive feedback that names what has to change, revise it, be accepted for
demonstration, see their booked demonstration, and read the final outcome on their own screen.

**The lecturer can** see the student's academic context, read the submitted PDF inside UmojaHub,
review it against the standard with a checklist and a rubric, leave page-referenced feedback, review
revised versions, accept it for demonstration, publish times, accept a booking, record what happened
and approve the project or send it back.

**The system enforces** ownership on every read, institution scoping on every queue, verification on
every lecturer action, one live version per report, one decision per version under concurrency, and
a lifecycle with no dead ends.

What this assessment does **not** claim: that the platform verifies a student's repository (it does
not, by design); that the PDF viewer is more than the browser's; that the demo world has been
rebuilt (it must be, §21); or that a panel-scale load has been tested — the largest run here was one
institution, a handful of students, and three report versions.

**Verdict: demonstrable, and honest about its edges.**
