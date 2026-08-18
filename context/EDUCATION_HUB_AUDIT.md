# Education Hub — complete audit and readiness assessment

Audit performed **2026-08-17** against `main` at `9f27f45`. Read-only: no code was changed, no
database write was made, no Food Hub file was touched. Evidence is `file:line` or a quoted response
from the running application, driven with real credentials against the seeded demo world.

Classifications used: **COMPLETE · WORKING BUT NEEDS POLISH · PARTIALLY COMPLETE · BROKEN ·
PLACEHOLDER · NOT IMPLEMENTED · CONFLICTS WITH NEW VISION · SHOULD BE REMOVED · FUTURE SCOPE ·
OUT OF SCOPE**.

---

## 1 · Executive assessment

**The Education Hub is a well-built implementation of a different product.**

What exists is a competent, honestly-engineered pipeline: *generate a project brief → write three
process documents → peer review → lecturer verdict against a rubric*. The backend is the best part
of it — every route follows the project's own architecture, ownership is enforced everywhere it
matters, transitions are atomic, and the AI mentor is real rather than decorative.

What it is not is the product described in the new vision. It never asks what unit a student is
studying, never asks what semester they are in, never reads their interests even though it stores
them, and instead asks the one question the vision explicitly rules out: *how hard do you want it to
be?* The connection between **what the student is learning** and **what the student is building** —
which the brief calls "the important part" — is absent at every layer: no field on the model, no
input on the form, no term in the prompt.

Three defects would stop a demonstration outright:

1. **The student project workspace crashes.** Every one of the 38 seeded engagements produces
   `Application error: a client-side exception has occurred`. This is the screen where all the work
   happens.
2. **The lecturer's queue is structurally always empty.** The seeder never generates the one status
   the queue reads, so the lecturer review — the centrepiece of the Hub — cannot be shown at all.
3. **"Revision required" is a dead end.** A student sent back for revision cannot revise, cannot
   resubmit, cannot edit their documents, and cannot start a new project. Eight seeded students are
   in this state.

The good news is that the retired vision has largely already been removed. There is no portfolio
generator, no employer surface, no recruitment marketplace, no certificate flow, and no money. The
AI knowledge base already states the new vision correctly in its own words. What remains is not a
cleanup problem — it is a *build the academic layer* problem.

**Score: 40/100.** Detail in §35.

## 2 · Education Hub mission (as audited against)

To help Kenyan Computer Science and IT students turn theoretical coursework into practical,
documented, demonstrable engineering experience, reviewed by a lecturer acting as an engineering
mentor — reducing the gap between university and industry before Industrial Attachment, without
replacing it. Students, lecturers and institutions are the users. There is no revenue objective and
no employer-facing surface.

## 3 · Current implementation summary

| Layer | What exists |
| --- | --- |
| **Pages** | 7 student (home, projects/new, projects/[id], peer-review, peer-review/[id], mentor, profile), 4 lecturer (home, queue, reviews/[engagementId], profile), 1 institution (overview), 2 admin (lecturer-verification, brief-contexts) |
| **API** | 7 `/api/education/engagements/*`, 3 `/api/lecturer/*`, 2 `/api/peer-reviews/*`, 1 `/api/mentor/chat`, 3 admin (lecturers, verify-lecturer, brief-contexts), 2 onboarding (institutional-email + verify) |
| **Models** | `ProjectEngagement`, `PeerReview`, `LecturerReview`, `LecturerEffectiveness`, `VerificationAuditLog`, `MentorSession`, `BriefContextLibrary`, `Institution`, plus `User.studentData` / `User.lecturerData` / `User.institutionData` |
| **Components** | `src/components/education/`: `DocumentsTab`, `BlockersTab`, `AIUsageTab`, `MentorChat`, `ProjectStatusStepper`, `ReviewScoreForm` |
| **AI** | OpenAI `gpt-4o-mini` for brief generation; Groq `llama-3.3-70b-versatile` for the mentor |
| **Tests** | 13 API unit-test files, 1 validation-schema suite, 4 Playwright specs |

**There is no `src/lib/education/` domain module.** Every other domain in this codebase has one
(`foodhub/`, `payments/`, `intelligence/`, `trust/`, `taxonomy/`). Education Hub logic lives
entirely inside route handlers. That is the clearest structural signal of where the maturity gap is.

## 4 · Actual roles discovered

| Role | Education Hub relevance | Status |
| --- | --- | --- |
| `STUDENT` | Primary. Owns engagements, documents, peer reviews, mentor sessions. | Implemented |
| `LECTURER` | Reviews engagements against a rubric. Gated on `lecturerData.isVerified`. | Implemented, narrow |
| `INSTITUTION` | Hosts students and lecturers. One read-only roster page. | **PARTIALLY COMPLETE** |
| `ADMIN` | Verifies lecturers, publishes the brief-context library. | Implemented |

`NGO` and `EMPLOYER` were already removed (`src/types/index.ts:15-18`) — the comment records that
neither had a path to existence and that the vision reset removed the recruitment surface `EMPLOYER`
was built for. **This has already been done correctly.**

## 5 · Role-by-role workflow results

Driven live with seeded credentials.

| Surface | Result |
| --- | --- |
| Student login → landing | Lands `/dashboard/student`, redirects to the active project |
| Student · profile | **Renders.** Read-only identity records |
| Student · peer-review | **Renders.** Correct empty state |
| Student · mentor | **Renders.** Live Groq session, scoped to the project title |
| Student · projects/new | **Renders.** Asks track + difficulty tier |
| Student · projects/[id] | **BROKEN** — client-side exception, no `<main>` |
| Lecturer login → queue | **Renders**, but permanently "Your queue is clear" |
| Lecturer · profile | **Renders.** Read-only identity records |
| Lecturer · review surface | **Unreachable** — no engagement ever enters the queue |
| Unverified lecturer | **Correctly gated**: "An administrator verifies your faculty role before you can review student work" |
| Institution overview | Renders a roster; nothing else |

## 6 · Student journey

| Step | Status | Evidence |
| --- | --- | --- |
| Registration / login / logout | **COMPLETE** | Shared auth; institutional-email verification with a 6-digit pin exists |
| Onboarding | **PARTIALLY COMPLETE** | Captures programme, graduation year, registration number, institutional email |
| Academic context — units | **NOT IMPLEMENTED** | No field exists on any model |
| Academic context — semester | **NOT IMPLEMENTED** | No field exists |
| Academic context — grades | **NOT IMPLEMENTED** | No field exists |
| Interests / tech stack | **PARTIALLY COMPLETE** | Stored (`studentData.primaryInterest`, `techStackPreferences`) — **never read by any route** |
| Career direction | **NOT IMPLEMENTED** | No field exists |
| Project recommendations | **NOT IMPLEMENTED** | See §11 — there is no recommender |
| Project selection | **CONFLICTS WITH NEW VISION** | Student picks track + self-selected difficulty |
| Project workspace | **BROKEN** | Crashes on all 38 seeded engagements |
| Documentation | **PARTIALLY COMPLETE** | Three documents + blocker log + AI-usage log; `PATCH /documents` |
| Progress | **NOT IMPLEMENTED** | No tasks, milestones or percent-complete |
| Submission | **COMPLETE** | Requires all three documents; atomic transition |
| Lecturer review | **PARTIALLY COMPLETE** | Works, but the queue never fills from seed |
| Feedback | **COMPLETE** | Rubric scores + per-dimension comments |
| **Revision** | **BROKEN** | No route can leave `REVISION_REQUIRED` |
| Resubmission | **NOT IMPLEMENTED** | Blocked by the above |
| Final demonstration | **NOT IMPLEMENTED** | No such concept anywhere |
| Completion | **COMPLETE** | `VERIFIED`, `completedProjectCount` incremented |
| Notifications | **COMPLETE** | `notify()` on submit and on decision |

### The revision dead end — the most serious workflow defect

- `PATCH /api/education/engagements/[id]/status` accepts only `z.literal('IN_PROGRESS')`
  (`status/route.ts:11`) **and requires the current status to be `BRIEF_GENERATED`**
  (`status/route.ts:64`).
- Documents, blockers and AI-usage all require `IN_PROGRESS`
  (`documents/route.ts:68`, `blockers/route.ts:63`, `ai-usage/route.ts:64`).
- `REVISION_REQUIRED` is in `ACTIVE_STATUSES` (`engagements/route.ts:23`), so a new project is
  refused with `ENGAGEMENT_ALREADY_ACTIVE`.
- `POST /api/lecturer/reviews` rejects a second review for the same engagement with 409
  (`lecturer/reviews/route.ts:119-122`), so even a manual re-review is impossible.

A grep for every write of `ProjectStatus.IN_PROGRESS` across `src/app/api` returns exactly one
occurrence — the guarded line above. **A student told to revise is permanently stuck.** Eight of the
38 seeded engagements are in this state.

## 7 · Lecturer journey

| Capability the vision asks for | Status |
| --- | --- |
| Review student work | **PARTIALLY COMPLETE** — documents only, no code |
| Review project documentation | **COMPLETE** |
| Review demonstrations | **NOT IMPLEMENTED** |
| Provide feedback | **COMPLETE** — 4 rubric dimensions with per-dimension comments |
| Evaluate project quality | **PARTIALLY COMPLETE** |
| Request changes | **BROKEN** — the decision can be issued but the student cannot act on it |
| Approve completed work | **COMPLETE** |
| Create custom project opportunities | **NOT IMPLEMENTED** |
| Define project requirements | **NOT IMPLEMENTED** |
| Select students for projects | **NOT IMPLEMENTED** |
| Organise students into groups | **NOT IMPLEMENTED** |
| Monitor progress | **NOT IMPLEMENTED** |

Two structural problems beyond the missing features:

- **The queue is global and unscoped.** `GET /api/lecturer/queue` returns
  `ProjectEngagement.find({ status: UNDER_LECTURER_REVIEW })` with no institution, department or
  assignment filter (`lecturer/queue/route.ts:36-40`). Any verified lecturer at any institution can
  read any student's full process documents and decide their outcome. Under a vision where the
  lecturer is *this student's* engineering mentor, that is both a product mismatch and a data
  exposure.
- **One review per engagement, forever** — the same 409 that blocks the revision loop.

`LecturerEffectiveness` (review counts, average scores given, comment word count) is implemented and
maintained. It is thoughtful, and it is the only lecturer-quality signal in the system.

## 8 · Institution journey

**PARTIALLY COMPLETE — read-only roster.**

`src/app/dashboard/institution/page.tsx` resolves `Institution.findOne({ adminUserId })` and lists
students and lecturers whose `institutionId` matches. That is the entire institution surface. There
is no cohort, no unit catalogue, no project creation, no lecturer assignment, no student approval,
no reporting.

Four institutions are seeded (Nairobi, Strathmore, JKUAT, Moi) with four `INSTITUTION` users who do
have passwords — but they are **absent from `npm run demo:accounts`**, so a presenter has no way to
know they can log in, and their emails are personal-looking `@gmail.com` addresses rather than
institutional ones.

The page calls `getServerSession` without a `requireRole` check; it is protected only by the
middleware prefix rule (`middleware.ts:47`). Not currently exploitable — a non-institution user
resolves no institution and sees an empty state — but the guard belongs in the page as well.

## 9 · Project workflow

Statuses: `BRIEF_GENERATED → IN_PROGRESS → SUBMITTED → UNDER_PEER_REVIEW → UNDER_LECTURER_REVIEW →
VERIFIED | REVISION_REQUIRED | DENIED`.

**What is genuinely good:** every transition is a guarded `findOneAndUpdate` with the expected
prior status in the filter, so double-submission races lose cleanly, and both the submit and review
routes roll back the record they created when the guard fails (`submit/route.ts:100-108`,
`lecturer/reviews/route.ts:164-172`). This is careful work.

**What is missing:** `SUBMITTED` is declared but never written by any route. There is no
demonstration state, no revision cycle, no team, no milestones, no tasks.

**Peer-reviewer assignment is naive.** `submit/route.ts:71-75` picks the reviewer with
`User.findOne({ role: STUDENT, status: ACTIVE, _id: { $ne: studentId } })` — no sort, no
randomisation, no workload balancing, no institution or cohort matching. In production this returns
whichever document MongoDB yields first, so **one student would receive effectively every peer
review on the platform**.

### Project types

| Type | Status |
| --- | --- |
| New project from scratch (`AI_BRIEF`) | **COMPLETE** as a mechanism |
| Existing / open-source (`OPEN_SOURCE`) | **PLACEHOLDER** — see §13 |
| Institution-created | **NOT IMPLEMENTED** |
| Lecturer-created | **NOT IMPLEMENTED** |
| External real-world problem | **NOT IMPLEMENTED** |
| Individual | **COMPLETE** (the only supported shape) |
| Team | **NOT IMPLEMENTED** |

## 10 · Academic-context workflow

**NOT IMPLEMENTED** in the sense the vision requires.

Stored on `User.studentData`: `currentTier`, `githubUsername`, `primaryInterest`,
`techStackPreferences`, `universityAffiliation`, `institutionId`, `completedProjectCount`,
`institutionalEmail` + verified flag, `academicRegistrationNumber`, `programme`, `graduationYear`.

Absent everywhere in the schema: **current semester · units being studied · previously studied
units · grades or academic performance · career direction · self-assessed skills · areas to improve
· prior project experience.**

Of the fields that *do* exist, `primaryInterest` and `techStackPreferences` are the ones the vision
would most obviously use — and **no route reads either of them.** They are captured and then never
consulted.

The seeded students populate 10 of 13 `studentData` fields but **not `programme` and not
`graduationYear`**, so even the thin academic context that exists is missing from the demo world.

**On the university-API question:** the absence of institutional APIs is not what blocks this. Every
piece of missing context is student-declarable or lecturer-verifiable — a unit list per semester, a
programme structure per institution, a self-reported performance band. The architecture already has
the right anchor: a first-class `Institution` with students and lecturers linked to it, and a
verified institutional email proving the affiliation. **What is missing is a unit/semester model,
not an integration.**

## 11 · Recommendation system assessment

**NOT IMPLEMENTED.** There is no recommendation engine of any kind — not AI, not rule-based, not
placeholder. Nothing recommends anything.

`POST /api/education/engagements` receives `{ track, tier, githubRepoUrl? }` — the student's own
choices — and for `AI_BRIEF` selects an industry context with
`pool[Math.floor(Math.random() * pool.length)]` (`engagements/route.ts:138`), filtered only by the
self-selected tier.

Against the specific questions asked:

| Question | Answer |
| --- | --- |
| What inputs does it use? | Track and tier (both student-chosen) + a random industry context |
| Does it analyse academic context? | **No** |
| Does it consider student interests? | **No** — `primaryInterest` is stored and never read |
| Career direction? | **No** — not modelled |
| Skills? | **No** — not modelled |
| Previous projects? | **No** — `completedProjectCount` is incremented but never consulted |
| Current units? | **No** — not modelled |
| Does it recommend projects? | **No** — it generates one brief for the choices given |
| Deterministic? | **No** — `Math.random()` context choice plus a non-zero-temperature LLM |
| Personalised? | **No.** Two students with identical inputs and utterly different degrees, interests and results get statistically identical briefs |

The UI states the model plainly: *"Two choices decide what you get: the kind of work you want to do,
and how hard it should be."* That is an accurate description of the code, and a direct contradiction
of the vision's "projects begin with academic context, never a self-selected difficulty".

## 12 · AI assessment

**Mentor — WORKING BUT NEEDS POLISH.** This is the strongest component in the Hub.

Real Groq calls (`llama-3.3-70b-versatile`), persisted `MentorSession` with a 30-day TTL, last-20-message
context window, two independent rate limits (20/hour via `checkRateLimit`, 10 per 10 minutes counted
from the session), engagement-scoped ownership, and a graceful fallback on provider failure. Driven
live it produced a genuine, project-specific opening turn. The system prompt correctly forbids
writing code for the student and injects `EDUCATION_PLATFORM_KNOWLEDGE` so platform questions are
answered from facts rather than guesses.

Two real weaknesses:

- **The mentor only knows the project's title.** Context passed is `engagement.tier` and
  `brief.title` (`mentor/chat/route.ts:130`) — not the problem statement, requirements, documents,
  blockers or code. It cannot mentor on the actual project.
- **The failure fallback is persisted into history.** On a Groq error the string *"I'm having
  trouble connecting right now"* is written into `mentorSession.messages` as an assistant turn
  (`mentor/chat/route.ts:171-176`), permanently polluting the conversation and the next context
  window.

**Brief generation — PARTIALLY COMPLETE.** Real OpenAI `gpt-4o-mini` in JSON mode with schema
validation and honest 503s on failure (`openaiService.ts:74-112`). It is not a fake. But its only
personalisation input is the self-selected tier, and it invents no academic information because it
is given none.

**No AI surface invents academic data**, and no sensitive information is exposed to a model
inappropriately — the mentor receives only the student's own project title and tier.

## 13 · GitHub assessment

**PLACEHOLDER — and the most misleading part of the system.**

- The **only** call to `api.github.com` in the entire codebase is in `auth/options.ts:134`, fetching
  e-mail addresses during OAuth. There is no repository API usage anywhere.
- `OPEN_SOURCE` track acceptance is a **regex on the URL string**
  (`engagements/route.ts:26`). The repository is never fetched. It need not exist.
- `generateOpenSourceBrief` passes only the URL to the LLM (`openaiService.ts:193-208`), so the
  "contribution plan" is necessarily invented — the model has never seen the repository. On any
  failure it returns a hardcoded generic paragraph about looking for *"good first issue"* labels
  (`openaiService.ts:223-229`).
- `githubSnapshot` (`commitCount`, `lastCommitHash`, `commitTimelineHash`) is **read** in
  `lecturer/reviews/route.ts:176` and written into `VerificationAuditLog` — but **no code anywhere
  populates it**. In production every audit log records `commitCount: 0` and empty hashes.
- No OAuth-to-repository identity binding, no ownership proof, no commit history, no pull requests,
  no activity.

**The seeder fabricates this evidence.** `scripts/demo/phases/education.ts:100` writes
`commitCount: rng.int(8, 60)` and synthetic SHA-256 hashes, and the probe confirms 33/33 seeded
audit logs carry non-empty GitHub evidence. **A demonstration would therefore display commit
evidence that the platform is incapable of producing.** That is the single most important honesty
risk in the Hub.

## 14 · Documentation workflow

**PARTIALLY COMPLETE — the pedagogy is good, the coverage is thin.**

Supported: `problemBreakdown`, `approachPlan`, `finalReflection` (each stored with a SHA-256 content
hash and timestamp), plus a `blockerLog` (what you were stuck on, how you resolved it, hours lost)
and an `aiUsageLog` (tool, prompt, output, what the student did with it). The blocker and AI-usage
logs are genuinely thoughtful instruments and have no equivalent in most student platforms.

Against the documentation checklist in the brief:

| Asked for | Supported |
| --- | --- |
| Problem | ✅ `problemBreakdown` |
| Requirements | ⚠️ only as part of the generated brief |
| Architecture | ⚠️ only if written into `approachPlan` free text |
| Technology choices | ⚠️ same |
| Database decisions | ❌ |
| API decisions | ❌ |
| Security decisions | ❌ |
| Development process | ✅ blocker log |
| Challenges / solutions | ✅ blocker log |
| Testing | ❌ |
| Deployment | ❌ |
| Trade-offs | ⚠️ only if written into `finalReflection` |
| What they would change / learned | ✅ `finalReflection` |

Revision tracking: **none.** Documents are overwritten by `PATCH`; there is no version history, and
the hash is not chained to a previous version, so "the student revised after feedback" cannot be
evidenced even in principle.

## 15 · Practical demonstration workflow

**NOT IMPLEMENTED.**

| Step | Status |
| --- | --- |
| Student builds project | Outside the platform entirely |
| Student documents project | ✅ (three documents) |
| Student submits project | ✅ (documents only — no code, no repo, no artefact) |
| Lecturer reviews documentation | ✅ |
| **Student demonstrates project** | ❌ no concept exists |
| **Lecturer evaluates implementation** | ❌ the lecturer never sees running software |
| Lecturer provides feedback | ✅ |
| Student revises | ❌ broken |
| Lecturer approves | ✅ |

The lecturer's verdict is therefore issued on **three pieces of prose**. Nothing in the system
requires that software was written at all. For a Hub whose purpose is demonstrable practical
experience, this is the largest single capability gap after academic context.

## 16 · UI/UX assessment

**WORKING BUT NEEDS POLISH — apart from one broken screen.**

Genuinely good, and worth preserving: every education page uses the `src/components/app` design
system, empty states are purposeful and specific (*"A project is assigned to you once another
student submits theirs. Nothing is required of you until then"*), read-only identity records explain
why they are read-only, and the mentor page discloses the model and the 30-day retention.

**No placeholders were found.** Searched for lorem ipsum, "coming soon", dummy statistics, fake
names, dead navigation and unnecessary badges: none present. The copy is written, not generated.

Defects:

| Issue | Severity |
| --- | --- |
| `/dashboard/student/projects/[id]` renders `Application error: a client-side exception has occurred` | **BROKEN** |
| Lecturer queue copy: *"Your verdict is what turns a student's work into something an employer can trust, so nothing publishes until you have read it"* | **CONFLICTS WITH NEW VISION** — employer trust and "publishes" are the retired portfolio framing, and it contradicts the AI knowledge base on the same platform |
| `projects/new` frames the whole product as track + difficulty | **CONFLICTS WITH NEW VISION** |
| No progress, tasks or milestones anywhere | Missing |

## 17 · Kenyan-context assessment

**Strong.** Institutional email verification against university domains
(`src/lib/auth/universityDomains.ts`), registration numbers in the real format (`SCT-221-2022`),
real institutions, `departmentAssignment` and `academicStaffId` for staff, and a free-text
`position` field with an explicit comment that title ladders differ between Kenyan institutions and
an enum would reject valid ones. The brief prompt embeds mobile-first, M-Pesa, intermittent
connectivity and bilingual constraints, and the brief-context library carries Kenyan counties and
business types.

Gaps: no semester or academic-year vocabulary, no "unit" concept despite it being the central term
in Kenyan CS coursework, and no notion of Industrial Attachment anywhere in the product. The word
"tier" is platform jargon with no Kenyan academic meaning.

## 18 · Security assessment

**Strong — one structural exposure.**

Verified by driving the API from a real authenticated session:

| Probe | Result |
| --- | --- |
| Student 2 → student 1's `PATCH /status` | `404 DB_NOT_FOUND` |
| Student 2 → student 1's `POST /submit` | `404 DB_NOT_FOUND` |
| Student 2 → student 1's `POST /blockers` | `404 DB_NOT_FOUND` |
| Student 2 → `POST /mentor/chat` with student 1's engagement | `404 DB_NOT_FOUND` |
| Student → `GET /api/lecturer/queue` | `403 AUTH_FORBIDDEN` |
| Student → `GET /api/admin/lecturers` | `404 NOT_FOUND` (existence hidden) |
| Student → `/dashboard/admin/lecturer-verification` | `404 Not Found` |
| Student → `/dashboard/lecturer/queue`, `/dashboard/institution` | `307` → `/auth/unauthorized` |

Every engagement route filters on `{ _id, studentId }` rather than checking ownership after the
fetch, so a wrong owner is indistinguishable from a missing record. `documents` uses the same filter
(`documents/route.ts:57-60`). Lecturer routes require `lecturerData.isVerified` before anything
else. Rate limits exist on the mentor. **No cross-student data access was achieved.**

**The one real exposure:** the lecturer queue is unscoped (§7). A verified lecturer at any
institution can read the complete process documents of every student on the platform who is awaiting
review, and issue the binding decision on their work.

## 19 · Database assessment

| Finding | Detail |
| --- | --- |
| Orphans | **None** — 0 across all education collections after the reset sweep |
| Invalid states | 8 engagements in `REVISION_REQUIRED`, which is unreachable-from |
| Missing constraints | No unique index preventing two active engagements per student — enforced only in application code (`engagements/route.ts:107-118`), unlike the Food Hub's payout rule which is enforced by a partial unique index |
| Unused fields | `ProjectEngagement.verificationUrl` / `verifiedAt` (verificationUrl: 0/38 rows), `issueUrl`, `githubSnapshot` (never written by the app) |
| Old-vision models | `studentportfoliostatuses` (0 docs), `portfolioviews` (0 docs) — collections survive, no model, no code |
| Type risk | `brief` is `Schema.Types.Mixed` with no validation, which is exactly how the crash in §23 became possible |
| Good | Indexes on `{studentId, status}`, `{status}`; `LecturerReview`, `PeerReview`, `VerificationAuditLog` all correctly shaped |

## 20 · Old Education Hub functionality discovered

Far less than expected — most of the retirement has already happened.

| Item | Evidence | Classification |
| --- | --- | --- |
| `ProjectEngagement.verificationUrl` + `verifiedAt` | Public verification page for a project — the credential/showcase concept | **REMOVE** (0 rows use it) |
| Lecturer queue copy: "something an employer can trust… nothing publishes" | `dashboard/lecturer/queue/page.tsx` | **REWORK** — copy only |
| `studentportfoliostatuses`, `portfolioviews` collections | Empty, no model, no route | **REMOVE** |
| `StudentTier` as the project-selection axis | `types/index.ts:242`, `projects/new` | **REWORK** — replace with academic context |
| Agricultural bias in brief contexts | Seeded personas lean agri; the library is admin-editable | **REWORK** — data, not code |
| `EMPLOYER` / `NGO` roles | Already deleted | **DONE** |
| Portfolio generator / recruitment marketplace / certificates | **Do not exist** | Nothing to remove |

No financial functionality exists anywhere in the Education Hub — no fees, commissions or
subscriptions. Correct.

## 21 · Seed / demo data assessment

**BROKEN — the seed cannot demonstrate the Hub.**

| Check | Result |
| --- | --- |
| Engagements | 38 |
| **Briefs matching the UI contract** | **0 of 38** |
| AI_BRIEF | 29 — all missing `estimatedComplexity` and `coreRequirements`; `clientPersona` is a **string** where the UI reads an object |
| OPEN_SOURCE | 9 — all missing `repoUrl`, `repoName`, `contributionGoal`, `proposedApproach` |
| Status distribution | `VERIFIED` 25, `REVISION_REQUIRED` 8, `IN_PROGRESS` 3, `BRIEF_GENERATED` 2 |
| `UNDER_LECTURER_REVIEW` | **0 — never generated** (`education.ts:91` omits it), so the lecturer queue is always empty |
| `UNDER_PEER_REVIEW` / `SUBMITTED` / `DENIED` | 0 |
| GitHub evidence | Fabricated on 38/38 (`education.ts:100`) |
| Student academic realism | `programme` and `graduationYear` never populated; no units, semesters or grades exist to populate |
| Institution accounts | 4 exist with passwords, but are absent from `demo:accounts` and use `@gmail.com` addresses |

The root cause of the workspace crash is here: `scripts/demo/text.ts:106-128` produces
`{ title, tier, clientPersona: <string>, problemStatement, constraints[], deliverables[] }` while
`GeneratedAIBrief` (`openaiService.ts:32-46`) and the UI require
`{ …, clientPersona: {businessType, county, context}, coreRequirements[], estimatedComplexity, … }`.
The seeder and the application have **never agreed on the shape of a brief**.

Realistic CS units, realistic academic performance and realistic project reviews cannot be assessed,
because the models to hold them do not exist.

## 22 · Automated test assessment

**Reasonable coverage of routes; none of the three critical defects was catchable.**

Present: 13 API route suites (`engagements`, `me`, `documents`, `blockers`, `ai-usage`, `submit`,
`lecturer/queue`, `lecturer/reviews`, `peer-reviews/[id]`, `mentor/chat`, `admin/brief-contexts`,
`admin/verify-lecturer`) plus `educationSchema.test.ts` (11.6 KB). Assertions are meaningful — the
lecturer-review suite checks the status transition, the rollback and the audit log. Four Playwright
specs cover the developer log, peer review, lecturer review and identity records.

Not covered:

- **No test renders `/dashboard/student/projects/[id]`** — which is why a crash on 100% of seeded
  data shipped unnoticed.
- **No test for `PATCH /status`** — the route whose narrowness creates the revision dead end.
- **No test asserts that a revision can be made** — the missing capability has no failing test.
- No test for `GET /api/peer-reviews/assigned`.
- No test asserts the seeder's brief matches the application's brief contract. The Playwright
  fixtures build their own correctly-shaped brief in `global-setup.ts`, so the harness proves the
  page works on *fixture* data while it is broken on *seeded* data.

## 23 · Broken workflows

| # | Defect | Evidence |
| --- | --- | --- |
| **B1** | **Student project workspace crashes on every seeded project.** `Application error: a client-side exception has occurred` / `Cannot read properties of undefined (reading 'toLowerCase')` | `projects/[id]/page.tsx:164` reads `brief.estimatedComplexity` which no seeded brief has |
| **B2** | **Revision is a dead end.** Cannot revise, resubmit, edit documents, or start a new project | §6 |
| **B3** | **Lecturer queue is structurally always empty in the demo** | `education.ts:91` never generates `UNDER_LECTURER_REVIEW` |
| **B4** | **Peer-reviewer assignment concentrates on one student** | `submit/route.ts:71-75`, unsorted `findOne` |
| **B5** | **`VerificationAuditLog` records GitHub evidence that is always empty in production** | `lecturer/reviews/route.ts:190-194`; nothing writes `githubSnapshot` |

## 24 · Partial workflows

Documentation (no architecture/testing/deployment sections, no revision history) · lecturer review
(no code, no demonstration, one review per engagement) · institution (roster only) · onboarding
(programme captured, units and semester absent) · open-source track (URL accepted, never verified) ·
mentor (real, but knows only the project title).

## 25 · Placeholder functionality

- `generateOpenSourceBrief` fallback paragraph (`openaiService.ts:223-229`) — a generic
  "look for good first issue" plan, returned on any failure and indistinguishable from a real one.
- `githubSnapshot` — a schema shaped for evidence that is never gathered.
- `ProjectEngagement.issueUrl` — declared, never written or read.
- `ProjectStatus.SUBMITTED` — declared, never written.

## 26 · Missing functionality

Academic context (units, semester, grades, career direction, skills) · project recommendation ·
lecturer-created projects · institution-created projects · external real-world problems · team
projects · student selection and grouping · progress tracking, tasks, milestones · **practical
demonstration** · revision cycle · repository verification and commit evidence · architecture,
testing and deployment documentation · a project that evolves across semesters · lecturer-student
assignment.

## 27 · Functionality that conflicts with the new vision

| Item | Why |
| --- | --- |
| `StudentTier` as the selection axis | The vision explicitly forbids self-selected difficulty as the starting point |
| `projects/new` copy ("how hard should it be?") | States the forbidden model as the product |
| Lecturer queue copy ("employer can trust… publishes") | Retired portfolio/recruitment framing, live on screen |
| `verificationUrl` / `verifiedAt` | A public, shareable verification artefact — the credential concept |
| Global unscoped lecturer queue | Contradicts the lecturer as *this student's* mentor |
| One engagement at a time, terminal on completion | The vision wants one project that *evolves across semesters* |

## 28 · Functionality that should be preserved

- The **process-document model** — problem breakdown, approach plan, final reflection, and
  especially the **blocker log** and **AI-usage log**. This is the most vision-aligned thing in the
  Hub and should survive any rebuild.
- The **lecturer rubric** — four dimensions with mandatory per-dimension comments.
- **`LecturerEffectiveness`** — review quality as a first-class signal.
- The **AI mentor** — architecture, session model, rate limits, Socratic prompt, disclosure.
- **Peer review** as a stage (the assignment algorithm needs replacing, the concept does not).
- **Institutional-email verification** and the `Institution` model — the correct anchor for academic
  context without university APIs.
- **The whole authorization posture** — ownership-by-query, hard-404 on admin, verified-lecturer
  gating.
- **The UI copy and the design-system usage.**
- `EDUCATION_PLATFORM_KNOWLEDGE` — already written to the new vision.

## 29 · Functionality that should be removed or deprecated

**REMOVE:** `verificationUrl` / `verifiedAt` · `issueUrl` · `studentportfoliostatuses` and
`portfolioviews` collections · the `generateOpenSourceBrief` fallback paragraph.

**DEPRECATE until it can be real:** `githubSnapshot` and its `VerificationAuditLog` mirror — either
implement the GitHub API or stop recording a field that is structurally always empty, and stop the
seeder fabricating it.

**REWORK:** `StudentTier` → academic context · lecturer queue copy · `projects/new` framing ·
`ProjectStatus.SUBMITTED` (implement or delete).

## 30 · Technical debt

- **No `src/lib/education/` domain layer** — all logic in route handlers, untestable in isolation.
- **`brief` is `Mixed`** with no runtime validation on read; the crash in B1 is the direct cost.
- **Seeder and application disagree on a data contract** with nothing asserting they must match.
- **Active-engagement uniqueness enforced in application code only**, unlike the Food Hub's
  equivalent rule which has a partial unique index.
- **Mentor fallback text persisted** into conversation history.
- Duplicate Mongoose schema-index warnings on boot (shared, pre-existing, Food Hub adjacent — **not
  touched**).

## 31 · Presentation risks

| Risk | Severity |
| --- | --- |
| Opening a student project shows a crash screen | **Fatal** |
| The lecturer review — the centrepiece — cannot be shown at all | **Fatal** |
| A panel asking "show me a student revising after feedback" hits a dead end | **High** |
| A panel asking "how did the platform choose this project?" — the honest answer is "the student picked a difficulty" | **High** |
| Displayed commit evidence the platform cannot produce | **High (honesty)** |
| "Something an employer can trust" contradicts the stated vision, on screen | **Medium** |
| Institution login credentials not published in `demo:accounts` | **Low** |

## 32 · Recommended architecture direction

1. **Make academic context a first-class model, not a profile field.** An `AcademicProfile` (or
   fields on `Institution`) holding programme structure, semester, and the units a student is
   currently taking. Student-declared, institution-approved, lecturer-verifiable — **no university
   API required**. The `Institution` + verified institutional email already in place is the correct
   trust anchor.
2. **Replace tier with unit + interest as the project origin.** The brief prompt should receive the
   unit's learning outcomes and the student's declared interest. That single change converts the
   generator from a difficulty dial into the thing the vision describes.
3. **Introduce a `Project` owned by a lecturer or institution**, separate from a student's
   `Engagement` with it. This is what unlocks lecturer-created projects, external problems, student
   selection and teams — none of which can exist while a project *is* a student's engagement.
4. **Make the review a cycle, not a verdict.** Revision must return the engagement to a workable
   state, reviews must be a collection per engagement, and each revision should be evidenced.
5. **Add a demonstration stage** — the point where the lecturer sees the software run.
6. **Either implement GitHub properly or stop claiming it.** Repository verification, ownership
   binding and commit history — or remove the fields and the fabricated seed data.
7. **Scope the lecturer to their students** — by institution at minimum, by assignment ideally.
8. **Give the Hub a `src/lib/education/` domain layer** and validate `brief` on read.

## 33 · Recommended implementation order

1. **Fix B1** — defensive rendering of `brief` plus a seeder that emits the real contract. One
   afternoon; unblocks every demonstration.
2. **Fix B3** — seed engagements in `UNDER_LECTURER_REVIEW`. Trivial; makes the lecturer flow
   demonstrable.
3. **Fix B2** — the revision cycle. Small, and it closes the pedagogical loop the whole Hub exists
   for.
4. **Fix B4** and scope the lecturer queue by institution.
5. **Academic context model** + onboarding capture (units, semester).
6. **Rewire brief generation** onto unit + interest; retire `StudentTier`.
7. **Lecturer-created projects** and student selection.
8. **Demonstration stage.**
9. **GitHub verification** — or explicit removal.

Steps 1–4 are repairs to what exists. Steps 5–9 are the actual product.

## 34 · What should NOT be built

- Any portfolio, CV, showcase or public profile surface.
- Any employer, recruiter or hiring feature.
- Any certificate or credential artefact, including the public `verificationUrl`.
- Any payment, commission, subscription or fee.
- Any faculty beyond Computer Science and IT (**FUTURE SCOPE** — record, do not build).
- Any university-API integration as a *precondition* (**FUTURE SCOPE** — design so it can be added).
- A replacement for Industrial Attachment, or any claim to be one.
- A general LMS: attendance, timetabling, exam records, fee statements.
- More AI surface area before the academic context exists to feed it.

## 35 · Final readiness score

| Dimension | Score | Reason |
| --- | --- | --- |
| Product vision alignment | **5**/15 | The spine (project → documented process → lecturer review) matches the intent, and the retired vision is largely gone already. But the defining idea — the link between what is studied and what is built — is absent at every layer, and the selection model is the one the vision forbids |
| Student experience | **3**/15 | The single most important screen crashes on all seeded data; revision is a dead end; no academic context. Mentor, peer-review and profile render well with good copy |
| Lecturer experience | **5**/15 | A real rubric, a real verification gate and effectiveness tracking — but an empty queue, no project creation, no student selection, no monitoring, and only ever one review per project |
| Project workflow | **5**/15 | Transitions are atomic and carefully guarded; the lifecycle is missing revision, demonstration, teams and progress |
| Academic context | **2**/10 | Institution, institutional email and registration number are right and are the correct anchor. Units, semester, grades and career direction do not exist, and the interests that do exist are never read |
| Practical learning capability | **4**/10 | The process documents, blocker log and AI-usage log are genuinely strong instruments. But nothing requires software to exist, and nobody ever sees it run |
| Technical implementation | **6**/10 | Backend quality is high — architecture followed, ownership enforced, races handled, rollbacks correct. Costs: no domain layer, an unvalidated `Mixed` field that crashes the UI, and a seeder that disagrees with the app |
| UI/UX | **3**/5 | Design-system consistent, no placeholders anywhere, unusually good copy — minus one crashed screen and one line of contradictory framing |
| Security | **4**/5 | Cross-student access refused on every probe; admin existence hidden; verification gates real. Minus the unscoped cross-institution lecturer queue |
| Testing / reliability | **3**/5 | Meaningful route-level coverage — but no test renders the workspace, none covers the status route, and the fixtures' brief shape hides the seeder mismatch |
| **Total** | **40/100** | |

---

## Final question

> *If I ignore the old vision entirely and judge only against helping Kenyan CS students turn
> theoretical coursework into practical, documented, demonstrable project experience — how much
> already exists?*

**About a third, and it is the middle third.** The Hub already knows how to take a project, make a
student document their reasoning honestly, have a peer read it, have a verified lecturer judge it
against a rubric, and record that judgement immutably. That is real, and it is the part most
platforms get wrong.

What is missing is the **beginning** and the **end**. The beginning — *this student, in this
semester, studying these units, should build this* — does not exist in any form. The end — *here is
the software running, and here is the lecturer watching it work* — does not exist either. The Hub
currently starts at "pick a difficulty" and ends at "three documents were read".

**What is already good:** the process-document model with its blocker and AI-usage logs; the
lecturer rubric; the AI mentor; the authorization posture; institutional-email verification and the
`Institution` anchor; the UI copy and design-system discipline; and the fact that the retired
portfolio/recruitment vision has already been deleted rather than merely hidden.

**What is salvageable:** almost all of it. The models are close to right; they are under-specified
rather than wrong. `ProjectEngagement` needs academic context and a revision history, not a rewrite.

**What is fundamentally wrong:** three things. Projects begin from a self-selected difficulty
instead of academic context. The review is a verdict rather than a cycle. And the lecturer belongs
to the platform rather than to their students.

**What should be removed:** `verificationUrl`/`verifiedAt`, `issueUrl`, the two empty portfolio
collections, the open-source fallback paragraph, and either the GitHub snapshot fields or their
absence of implementation.

**What should be rebuilt:** project origination (unit-driven, not difficulty-driven), the review
cycle, and the concept of a project as something a lecturer or institution can own.

**What should be left alone:** the documentation model, the rubric, the mentor, the security model,
and the copy.

**What we should build first:** the three repairs — the workspace crash, the empty lecturer queue,
the revision dead end. They are small, they are contained, and until they are done nothing about the
Hub can be shown or judged. Then the academic-context model, because every other decision depends on
it.

**What we should deliberately not build:** anything in §34 — and in particular, no further AI
surface until there is real academic context to feed it.

---

## Food Hub freeze — verified

No Food Hub file was modified. `git status` at the close of this audit shows **no source changes**;
`git diff HEAD` is empty. The audit was read-only: it created no database records (engagement count
38 before and after, mentor sessions 8 before and after), and all probe scripts and temporary specs
were removed.

**One shared dependency to flag, not to change:** the Education Hub seeder lives in
`scripts/demo/phases/education.ts` inside the same `npm run demo` pipeline the Food Hub presentation
depends on. Fixing the seeded brief contract (B1/B3) means editing that pipeline. It is Education-Hub
scoped and does not touch Food Hub phases — but it does mean re-running the seed the Food Hub demo
uses, so it needs a deliberate decision before it is done.
