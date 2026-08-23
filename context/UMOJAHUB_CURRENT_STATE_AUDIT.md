# UmojaHub — current-state audit

Performed **2026-08-23** against `feat/registration-and-onboarding-entry` (4 commits ahead of
`main` at `7f615fe`, unpushed, no open PR).

Every finding below was produced by **running the software** — a production build served on
:3000 against the presentation database, driven through its real HTTP routes as each role with
minted sessions, then read back in a browser at 1280px and 390px. Where a claim rests on reading
code rather than executing it, that is said.

Gates run during this audit, on this machine, in this order:

| Gate | Result |
|---|---|
| `npm run type-check` | clean |
| `npm run lint` | 0 errors, 5 warnings (pre-existing) |
| `npm run test` | **1513 passed**, 122 suites |
| `npm run build` | exit 0 |
| `npm run test:e2e:fast` | **55 passed** |
| `npm run test:e2e:rehearsal` | **3 passed** — the full Education lifecycle |
| `npm run demo:validate` | **all 73 checks passed** |
| Live external-service probe | 6 of 9 healthy — see §14 |

**Every gate is green, and the audit still found three dead features and one workflow a real
user cannot complete.** That gap is the point of this document.

---

## 0. Status after execution — 2026-08-23

**The audit below describes the state on the morning of 2026-08-23. The P0/P1 work it identified
was then executed the same day.** Every finding is left exactly as written, because an audit that
edits itself once the problems are fixed is no longer evidence of anything. What changed:

| | Then | Now |
|---|---|---|
| A real farmer can list produce | ❌ had to paste a Cloudinary URL | ✅ picks a photo; published and rendering, verified in a browser |
| Farm Assistant | ❌ canned failure to every question | ✅ answers, grounded in crops, county and prices |
| AI Mentor | ❌ same | ✅ answers about the student's own project |
| A student can start a project | ❌ 2 of 3 tracks returned 503 | ✅ all three generate |
| `/dashboard/admin/brief-contexts` | ❌ threw on load | ✅ renders eight domains, zero errors |
| Create-listing modal | ❌ off-system, title clipped off-screen | ✅ on the app design system, contained and scrolling |
| A duplicate rating | ❌ showed the buyer "Duplicate entry" | ✅ a sentence |
| Expected 4xx refusals | ❌ ERROR with a stack trace | ✅ `warn`, no stack |
| A listing image that fails | ❌ browser broken-image glyph | ✅ produce placeholder |
| Knowing a provider has died | ❌ nothing would tell you | ✅ `npm run check:services` |

Gates after the work: type-check clean · lint 0 errors · **1,523 tests** · build exit 0 ·
**55 E2E passed** · **3 rehearsal passed** · demo world rebuilt, **73/73 checks passed** ·
full browser sweep at 1280×900 and 390×844 → **zero page errors, zero console errors, zero failed
requests**.

**Revised completion: Food Hub ≈ 87% · Education Hub ≈ 82% · UmojaHub ≈ 85%.** The methodology in
§20 is unchanged; what moved is core workflow, features, integrations and presentation readiness,
because the four things that were dead are the four the score was docked for. Foundation V2's
unbuilt project-continuity model (§11) is untouched by any of this, so the Education Hub's score
against the *full* ambition still stands at ≈40%.

### ✅ Closed since: the database backup

**UmojaHub now has a database backup — the first that has ever existed.** This was the
highest-severity item on the project and it is done.

It nearly went badly. The obvious remedy — supply the missing `BACKUP_REPO_TOKEN` — would have
pushed a complete dump (names, emails, phone numbers, national ID document numbers, bcrypt
hashes, verification-document URLs) into `JafarHussein/umojahub-backups`, which was **public**.
The missing secret had been accidentally preventing a data breach for eight weeks. `MONGODB_URI`
was missing as a repository secret too, so the workflow would have failed at `mongodump`
regardless — it only ever failed at step 1 because checkout aborted first.

Three merged PRs (#68, #69, #70), because each run found the next problem: `main` still held the
plaintext workflow; `actions/checkout` cannot clone a repository with no commits; and **the
verification step was itself wrong** — `mongorestore --dryRun` means "do not write", not "do not
connect", so it dialled `localhost`, timed out, and declared a good archive unusable.

Final run, verified by pulling the file back down rather than trusting the green check:
`185,466 bytes` in the repository, `AES256.CFB encrypted data` per gpg, first bytes `8c 0d 04 09`
(OpenPGP, not gzip), no readable emails or field names in the ciphertext, and
**3,338 documents restored with 0 failures** into a throwaway mongod. Atlas `0.0.0.0/0` is proven,
because a GitHub runner connected.

Full record: `FOOD_HUB_REMAINING_WORK.md` § S-P1-1. One thing still owed by a human: **do the
restore yourself once**, to prove the passphrase is reachable and correct.

**Three things remain open:**

1. **The application database is named `test`** — renaming it moves production data. *(Owner.)*
2. **The orphaned buyer record** (`jafarhussein251@gmail.com`, "NOT APPLICABLE") survived the
   re-seed, as a record outside the run ledger must. It may be an account the owner uses. *(Owner.)*
3. **23 dependency vulnerabilities** (2 critical, 15 high), none with a reachable path in this
   codebase — checked individually, §16. Deliberately not patched during a pass whose purpose was
   to fix four dead features days before a presentation. Sequence it afterwards, on its own branch.

Plus one deliberate non-build: **E-P1-4, a writer for published curricula**, which is a new
Education Hub screen and therefore gated behind Foundation V2 §19. Reasoning in
`EDUCATION_HUB_REMAINING_WORK.md`.

---

## 1. Executive summary

UmojaHub is a substantial, well-built platform. 103 API routes, 61 pages, 39 models, 83,658
lines of TypeScript, 1,513 unit tests and a rehearsal harness that drives the Education Hub end
to end through real file storage. The architecture is consistent, the authorization is genuinely
enforced (probed at the API layer, not assumed), the money path has a real control plane with an
append-only audit, and the copy on screen is unusually honest about what the system does and does
not know.

It is also **not finished**, and three of the four things standing between it and finished are
invisible to every gate the project runs:

1. **A real farmer cannot list produce.** The only "Add produce" form asks them to *"Upload your
   image to Cloudinary and paste the URL here."* There is no file picker. `/api/upload` exists,
   is authorised for `umojahub/listings`, and was proved working during this audit — the form
   simply does not use it. This is the first action the platform's primary user must take.
2. **Both AI features are dead.** Groq answers `404 model_not_found` for
   `llama-3.3-70b-versatile`; the model is no longer on the account. The Farm Assistant and the
   AI Mentor therefore both return the same canned sentence — *"I'm having trouble connecting
   right now"* — on every message.
3. **Two of the three ways to start an Education Hub project are dead.** The OpenAI key returns
   `credit_balance_exhausted`, so `AI_BRIEF` and `OPEN_SOURCE` both answer 503. Only
   `LECTURER_ASSIGNED` works. A student whose lecturer has not published a project cannot begin.
4. **The admin Brief Contexts screen throws on load** — it renders `ctx.targetTiers.map(...)` on
   a field the model no longer has, left behind by the `StudentTier` retirement.

Everything else that was tested works, including the parts most likely to be broken: farmer
verification through the admin queue, checkout, simulated STK payment, escrow hold and release,
mediation resolution with a refund, payouts, ratings and trust recalculation, PDF report upload
and private signed-URL retrieval, lecturer review with a concurrency guard, the revision cycle,
demonstration scheduling and outcome recording.

**Food Hub ≈ 80% · Education Hub ≈ 74% · UmojaHub ≈ 79%.** Methodology in §20.

---

## 2. Current product vision, reconstructed from the codebase

### UmojaHub

One Next.js 15 application, one deployment (`https://umoja-hub.vercel.app`, live and
DB-connected as of this audit), serving two products and one public website behind a shared
spine: NextAuth JWT sessions, five working roles plus `INSTITUTION`, RBAC in `src/middleware.ts`
and `requireRole()` per route, Zod validation, Mongoose models, Cloudinary storage, SMTP
lifecycle email, in-app notifications, and one design system (`.theme-app` / `app-*` tokens for
the product, `.theme-website` for the marketing site).

### Food Hub

A trust-based produce marketplace for Kenyan smallholders. A farmer is verified by an
administrator against an identity document before they may publish. A buyer browses, orders, and
pays by M-Pesa. **The money is held in escrow and released only when the buyer confirms
receipt** — that hold is the product. Disputes go to two-sided mediation with an administrator
who can release or refund. Farmers draw settled earnings through a payout queue. A price
intelligence engine gives evidence-based recommendations from real transaction history.

The payment posture is a designed position, recorded in `context/FOOD_HUB_PRODUCTION_AUDIT.md`:
**the control plane is real and the custody plane is simulated and disclosed.** Holding third-
party funds in Kenya is licensed activity under the National Payment System Act 2011. The
`PaymentProvider` abstraction swaps to `daraja-sandbox` / `daraja-production` with no
business-logic change; the default is `simulation`.

### Education Hub

Governed by `webapp-reset/EDUCATION_HUB_FOUNDATION_V2.md`. **The practical execution layer
beside a Kenyan CS or IT degree** — it turns theoretical coursework into real engineering
experience. Explicitly *not* a portfolio platform, not a recruitment platform, not an LMS, not a
credential issuer.

The workflow actually implemented today is the one this audit was briefed with:

```
academic context (units + knowledge areas)
   → a brief written against that coursework
   → the student builds, logging blockers and AI use
   → the student writes the report elsewhere and uploads the finished PDF
   → the lecturer reads it inside UmojaHub, against a checklist and a rubric,
     with page-referenced notes
   → accept for demonstration, or send back with what must change  (a cycle, not a dead end)
   → the lecturer publishes slots; the student books one; the lecturer accepts
   → the demonstration happens
   → the lecturer records the outcome: approved · revision required · not ready
```

That is a coherent, complete product. It is **also a subset of Foundation V2**, which additionally
specifies `SystemProject` / `ProjectIncrement` continuity across the degree (§P2, §10), a
six-milestone assessment state machine (§14.1), teams (§13), and tiers T2/T3 of the academic
capability ladder (§8.3). None of those are built. §11 of this document quantifies the distance.

---

## 3. Food Hub — completion percentage

| Dimension | Score | Why |
|---|---:|---|
| Core workflow | **85%** | Every link verified live today. One step — attaching a photo to a listing — demands something the intended user cannot do. |
| Feature completion | **88%** | Marketplace, orders, payments, escrow, mediation, payouts, ratings, trust, price intelligence, suppliers, groups, knowledge, notifications, admin console all present and exercised. Farm Assistant dead. |
| Integration completion | **65%** | 6 of 9 external services healthy; Groq dead, Africa's Talking sandbox-only, Daraja deliberately not the active provider. |
| Testing completion | **75%** | 1,513 unit + 55 E2E + 73 demo checks. None of them saw any of the live failures — they mock the providers. No load testing. |
| UX completion | **85%** | Every screen on the app design system except one unmigrated modal; mobile clean at 390px; empty/loading/failure states present. |
| Security completion | **90%** | Authorization probed at the API layer and held everywhere. Gaps are observability and backup, not exposure. |
| Presentation readiness | **70%** | The demo world validates 73/73 and every screen renders — but the Assistant answers nothing and "Add produce" is unusable. |

**Weighted total: 80%** (weights in §20).

---

## 4. Food Hub — genuinely complete

Each of these was exercised through its real route during this audit unless marked *(read)*.

**Identity and access**
- OAuth (Google, GitHub) *and* email/password registration — the second entry was added on this
  branch and its 8 E2E tests pass.
- Onboarding funnel: provider picker → password setup → role → identity → verification, with a
  middleware onboarding lock that deliberately does not police every funnel path (the redirect
  loop that would cause is documented in `src/middleware.ts`).
- Password reset with hashed tokens; brute-force throttle backed by Upstash Redis (probed live,
  `PONG`).
- RBAC: role-prefix enforcement; **an authenticated non-admin gets a hard 404 on admin routes**,
  not a 403 — verified (`farmer → /api/admin/escrow → 404`).

**Farmer verification — the full decision path**
- Document upload through `/api/upload` → Cloudinary (proved live: a real file uploaded and
  returned a `res.cloudinary.com` URL).
- `POST /api/verification` puts the account in the queue and notifies both the user and every
  admin, and deliberately **never names the document** because nothing has inspected it.
- Admin queue → `PATCH /api/admin/verify-farmer` → `APPROVED`, trust score initialised, SMS +
  notification dispatched. Verified today: a `PENDING` farmer was approved and immediately
  published a listing that had been refused 403 `FARMER_NOT_VERIFIED` minutes earlier.

**Marketplace**
- Public browse, full-text search (verified: a listing created during this audit was found by
  search seconds later), category and county filters, listing detail.
- `POST /api/marketplace` — verified farmer only, records a `PriceHistory` LISTING_CREATED point,
  congratulates on first listing.
- `PATCH /api/marketplace/[listingId]` — owner-only (a different farmer got 403), price edit,
  pause/reactivate. `SOLD_OUT` is system-managed and cannot be set by a client.
- Atomic stock reservation on order creation.

**Orders, payment, escrow — the money path**
- Checkout with a rate limit (5 orders/hour, 30 attempts).
- Simulated STK Push → callback delivered through the *same* processor the real Daraja webhook
  uses → `PAID` with a real-shaped M-Pesa receipt code. Verified: `PENDING_PAYMENT` → `PAID`
  within one poll.
- `OrderFulfillmentStatus` transitions guarded by role: farmer → `IN_FULFILLMENT`, buyer →
  `RECEIVED`. A buyer attempting a farmer-only stage transition got 403.
- **Escrow released on buyer confirmation, not on payment** — `RECEIVED` produced `COMPLETED` and
  moved the funds to releasable. `EscrowEventLog` is append-only.
- Receipt: refused with `RECEIPT_NOT_AVAILABLE` before payment (and the page says so in a
  sentence, not an error), issued afterwards with the full `PaymentEventLog` /
  `EscrowEventLog` trail.
- Reconciliation queries the provider before deciding a timed-out payment failed; an unanswerable
  one becomes `UNRESOLVED` rather than a guess. *(read + unit-tested)*
- Mediation: file → respond → admin `OPEN → IN_REVIEW → RESOLVED`. Verified today with
  `outcome: REFUND`; the settle-then-record ordering means a refusal leaves the case open.
- Payouts: partial unique index enforces one open request per farmer (verified — a second was
  refused `PAYOUT_REQUEST_PENDING`); admin approve/decline; farmer ledger.

**Trust and intelligence**
- Rating on a completed order → trust recalculation (verified: `averageUpdated: 4.5`). A duplicate
  is refused.
- Price Intelligence: weighted median over `PriceHistory` with recency, trust-tier and
  source weighting; a geographic ladder (county → adjacent → region → national) that discounts
  confidence as it widens; trend classification; demand scoring; seasonality; a confidence band;
  and an anti-feedback rule that suppresses a farmer's own asking prices from their own advice.
  Verified live returning 200 with a real recommendation. Buyer fairness projection verified
  (`IN_RANGE`, `confidenceBand: LOW`, `basis: COUNTY`).
- Market insights and impact summaries generated by cron (338 crop-county insights in the world).

**Operations**
- Supplier directory, farmer groups + join tokens, knowledge hub (public read + admin CMS —
  article creation verified), notifications list + mark-all-read, admin escrow console, payout
  queue, price analytics, impact summary, payment lab.
- All six cron routes correctly refuse without `Authorization: Bearer ${CRON_SECRET}` (401) and
  succeed with it (200) — all six probed.
- SMTP verified live against `smtp.gmail.com` (`transporter.verify()` passed).

---

## 5. Food Hub — partially complete

| Area | What is there | What is missing |
|---|---|---|
| **M-Pesa custody** | Full control plane: derived escrow state machine, release gated on confirmed receipt, two-sided adjudication, append-only custodial audit, settlement queue. Daraja sandbox OAuth credentials are valid (probed: 200, access token issued). | Custody is simulated and disclosed. `PAYMENT_PROVIDER` is unset → `simulation`. The Daraja `queryPaymentStatus` path is unit-tested but **has never met the live API**. This is a designed position, not an oversight (§6 of `FOOD_HUB_PRODUCTION_AUDIT.md`). |
| **SMS** | Africa's Talking integration works — the **sandbox** endpoint answered 200 with a balance. `isSandbox` is true whenever the username is `sandbox`, so production would also route to sandbox. | No message ever reaches a real handset. Every SMS in the platform (verification decisions, payout decisions, price alerts, order updates, group tokens) is a sandbox no-op. |
| **Buyer verification** | Full `INDIVIDUAL` / `BUSINESS` branch with distinct artefacts, admin queue, decision route. | Records predating the branch carry no `buyerType` and are not migrated — one such record is live in the presentation database (§18). |
| **Listing images** | `/api/upload` accepts `umojahub/listings` and works. | The create form does not use it (§6, F-P0-1). No `onError` fallback anywhere, so a listing whose image 404s renders a broken image — observed on `/marketplace` during this audit. |
| **Observability** | Structured JSON logger with service tags. | Every ordinary 401/403/404 is logged at **ERROR** with a full stack trace. A production log is therefore ~all noise, and a real error is invisible in it. |

---

## 6. Food Hub — broken

### F-P0-1 · A real farmer cannot list produce
`src/components/foodhub/CreateListingForm.tsx:337-346` — the image field is:

> **Crop image URL (Cloudinary)** · placeholder `https://res.cloudinary.com/…`
> hint: *"Upload your image to Cloudinary and paste the URL here"*

There is no file input. The schema (`cropListingSchema.imageUrls`) requires at least one
Cloudinary URL. A smallholder farmer on a phone cannot create a Cloudinary account, upload an
image and copy its delivery URL. `POST /api/upload` — server-side, credentialled, MIME- and
size-checked — already exists and already allows the `umojahub/listings` folder; it was proved
working during this audit. The capability is built and the form does not reach for it.

This is the single largest gap between the platform and its stated Definition of Done ("a real
farmer can use it").

### F-P0-2 · The Farm Assistant answers nothing
`src/lib/integrations/groqService.ts:20` pins `GROQ_MODEL = 'llama-3.3-70b-versatile'`. Live
response from the account's own key:

```
404 {"error":{"message":"The model `llama-3.3-70b-versatile` does not exist
     or you do not have access to it.","code":"model_not_found"}}
```

The model is not in the account's model list. Available and comparable: `openai/gpt-oss-120b`,
`openai/gpt-oss-20b`, `qwen/qwen3.6-27b`, `groq/compound` (all 131k context). The service degrades
gracefully — no crash — so every question returns the same sentence: *"I'm having trouble
connecting right now."* The same constant is duplicated in `src/app/api/mentor/chat/route.ts:15`,
so the Education Hub's AI Mentor is dead for the same reason (E-P0-2).

### F-P1-3 · The create-listing modal is off the design system and clips out of the viewport
The same component uses the retired token set (`text-t6`, `font-body`, `bg-surface-raised`,
`border-white/10`, `text-red-400`) rather than the `app-*` ramp every other screen was migrated
to. Captured at 1280×1000: the modal is taller than the viewport, is not internally scrollable,
and **its title row is clipped above the top edge**. It is the last unmigrated screen in the
product surface.

### F-P2-4 · A duplicate rating shows the buyer the words "Duplicate entry"
`src/app/api/ratings/route.ts` relies on the unique index and does not translate Mongo's `11000`,
so `handleApiError` returns the generic `{ error: 'Duplicate entry', code: 'DB_DUPLICATE' }`
(verified: 409). `src/app/dashboard/buyer/orders/[orderId]/page.tsx:305` renders `body.error`
verbatim. The payout route translates the same class of error into a sentence; this one does not.

### F-P2-5 · Expected refusals are logged as errors with stack traces
Every `AppError` reaches `handleApiError`, which logs at `ERROR` with a full stack — including
401 `AUTH_REQUIRED`, 403 `AUTH_FORBIDDEN`, 403 `FARMER_NOT_VERIFIED`, 404 `NOT_FOUND` and 409
`RECEIPT_NOT_AVAILABLE`. Observed dozens of times in the server log during ordinary, correct
operation. Not an exposure; it makes production logs unusable.

### F-P2-6 · `MONGODB_URI` names no database
The URI carries no path segment and `connectDB` passes no `dbName`, so Mongoose falls back to
its default and **all application data lives in a database literally called `test`** (confirmed:
`listDatabases` returns `test`, `admin`, `local`; every collection is in `test`). It works, and
it is one accidental `mongosh` away from a bad afternoon.

### F-P3-7 · Duplicate schema indexes on eight models
`User.email`, `Order.mpesaTransactionId`, `Order.orderReferenceId`, `FarmerTrustScore.farmerId`,
`Rating.orderId`, `LecturerEffectiveness.lecturerId`, `SimulationRun.runId`,
`KnowledgeArticle.slug` each declare an index twice (`index: true` **and** `schema.index()`).
Mongoose warns on every boot, in every process — build, test, seed, server.

---

## 7. Food Hub — remaining work

Full task breakdown with acceptance criteria: **`context/FOOD_HUB_REMAINING_WORK.md`**.

- **P0** — F-P0-1 file upload in the create-listing form · F-P0-2 a working Groq model
- **P1** — F-P1-3 migrate the create-listing modal to the app design system and contain it
- **P2** — F-P2-4 duplicate-rating message · F-P2-5 log level for expected refusals ·
  F-P2-6 name the database · F-P2-8 image fallback · clear the orphan buyer record
- **P3** — F-P3-7 duplicate indexes · drop retired collections · remove the unused `resend`
  dependency

---

## 8. Education Hub — completion percentage

Measured against **the workflow that is implemented** — academic context → brief → build →
upload PDF → review → revise → schedule → demonstrate → outcome.

| Dimension | Score | Why |
|---|---:|---|
| Core workflow | **75%** | Every link from upload to outcome verified end to end by the rehearsal today. The *entry* is broken: two of three project-start tracks return 503. |
| Feature completion | **78%** | Academic context, workspace, logs, report versioning, both review instruments, revision cycle, scheduling, outcomes, peer review all present. AI mentor dead; Brief Contexts admin screen crashes. |
| Integration completion | **50%** | The hard one (private Cloudinary + per-request signed URL) works. OpenAI has no credits; Groq's model is gone; T1 curriculum has no writer at all. |
| Testing completion | **80%** | `rehearsal.spec.ts` drives the whole lifecycle through real storage and a real database — genuinely end-to-end, not mocked. No test covers the AI paths against a live provider. |
| UX completion | **82%** | Student and lecturer surfaces are careful, vision-aligned and clean at both viewports. One admin screen throws. |
| Security completion | **92%** | The strongest area in the product. Authorisation per read, no public URL for any document, institution scoping, verified-lecturer gating, 404 where existence discloses, a concurrency guard on review. |
| Presentation readiness | **70%** | The seeded world demonstrates the entire cycle. "Watch a student receive a project" cannot be shown live, and the mentor answers nothing. |

**Weighted total: 74%.**

Against the **full ambition of Foundation V2**, the number is **≈ 40%** — see §11.

---

## 9. Education Hub — genuinely complete

**Academic context — the spine, and it really is the spine.**
`StudentEnrolment` records programme, year, semester and current units as *snapshots*, each unit
mapped onto a closed `KnowledgeArea` taxonomy so the rest of the hub never sees an institutional
unit code. **`provenance` is load-bearing and is shown on screen** — the new-project page reads
*"You told us this. Change what you are studying"* under a self-declared record, and cites the
published curriculum when there is one. The world holds both kinds (8 published, 7 self-declared)
and every one resolves to knowledge areas.

**The brief carries its academic anchor.** Every one of the 40 engagements in the world records
the programme, year, semester, units, knowledge areas and provenance it was written against, and
the workspace renders it. The retired self-selected difficulty (`StudentTier`) is gone; the
new-project page states outright that the track *"decides which of several valid projects you
get — never how demanding it is. Your units set the bar."*

**Lecturer-set projects.** A verified lecturer writes a brief for their own cohort or a named
student, scoped to their institution; a student takes it up; the lecturer can withdraw an offer
without disturbing work already under way. Verified live today end to end.

**Report submission — upload, not authoring.** The student writes the report wherever they write,
and hands in the finished PDF. Magic-number check (not the extension), size cap, page count read
from the file, storage **before** the database write so a failed upload leaves no dangling
version. Versions are append-only: a revision supersedes but never overwrites, and the superseded
version keeps both its file and the feedback that prompted the change.

**Private storage that is actually private.** Reports are uploaded as Cloudinary `type: private`,
which gives them **no delivery URL at all**, and are read through a signed download URL minted per
request and valid two minutes. Authorisation cannot be bypassed by holding a link. Three readers
exist and no more: the author, a verified lecturer at their institution, and the peer who was
asked to read it.

**Lecturer review.** An institution-scoped, verified-only, oldest-first queue (verified: a
lecturer's queue returned exactly their own institution's work). The workspace shows the student
and their year, the academic units, the version, what the student said changed, the PDF inline,
the blocker and AI-usage logs, a 13-item structural checklist, a four-dimension rubric,
page-referenced notes, and two decisions. Two lecturers opening the same version produce one
decision and one 409 (`arrayFilters` update conditional on the version still being `SUBMITTED`).

**Revision is a cycle.** `CHANGES_REQUESTED` returns the student to work; a rejection naming
nothing is refused by the schema, not merely by the form. Verified over two full cycles and three
report versions by the rehearsal.

**Demonstration.** Lecturer publishes slots (past times refused, overlaps refused by an explicit
check as well as by the unique index); student books (≥60 minutes ahead so the lecturer can read
the report first); lecturer accepts. A lecturer **cannot** mark a demonstration as having happened
before it was due (409 `DEMONSTRATION_NOT_YET_DUE`). Outcomes: `APPROVED` → `VERIFIED`;
`REVISION_REQUIRED` reopens the accepted report so the student can actually act on it;
`NOT_READY` leaves the project ready to demonstrate and does *not* invent work by reopening a
report the lecturer had already accepted. Both `VIDEO_CALL` and `IN_PERSON` are supported.

**Authorisation, probed at the API layer.** Wrong role → 403. Unverified lecturer → 403
`LECTURER_NOT_VERIFIED`. Another institution's report → 404, indistinguishable from absent. A
version id that is not this project's → 404. Unauthenticated read of a stored document → 404.

**Notifications** cover every state change a person must act on, fanned out only to verified
lecturers at that student's own institution.

**One active project per student**, enforced server-side (verified: a second attempt returned
`ENGAGEMENT_ALREADY_ACTIVE`).

---

## 10. Education Hub — partially complete

| Area | What is there | What is missing |
|---|---|---|
| **Academic capability ladder** | T0 (self-declared) fully working, read and write. T1 (institution-published) fully working **on read** — programmes and units are resolved, cited, and shown as verified provenance. | **T1 has no writer.** `AcademicProgramme` and `CurriculumUnit` are created by `scripts/demo/phases/foundation.ts` and by nothing else — no route, no admin screen, no institution screen. In production every student on the platform would be T0 forever. T2 (lecturer attestation) and T3 (feed adapters) are not built and the `AcademicSource` interface of §16.3 does not exist. |
| **PDF viewer** | The lecturer opens the report inline in an `<object>`, can open it in a tab, and can switch versions. Page navigation, zoom and search are the browser's. Page feedback is a page number the lecturer reads off that viewer. | A custom in-app viewer (pdf.js with a page index and search). Deliberately deferred and honestly described — not claimed as present. |
| **Institution surface** | One page: a member roster with student/lecturer counts and verification status, scoped to the institution. Renders correctly with real data. | Everything in Foundation V2 §17 Stage 7 — cohort insight, and the curriculum publishing that would make T1 reachable. |
| **Project status enum** | The live state machine has no dead ends and every transition names its actor and guard. | `SUBMITTED`, `UNDER_PEER_REVIEW` and `DENIED` remain in `ProjectStatus`, written by nothing. Kept because existing records may carry them; a migration, not an edit. |
| **AI mentor** | Session persistence, ownership scoping, rate limit (10 per 10 min), engagement-scoped context that now survives through `READY_FOR_DEMONSTRATION` and `DEMONSTRATION_SCHEDULED`. | The model is gone (E-P0-2). Past-project context deliberately out of scope. |
| **GitHub** | A URL the student supplies. `githubSnapshot` is empty and the seeder fabricates nothing. | Repository verification — evaluated and deliberately not built, because the demonstration establishes the same thing better. Correct call; recorded as deferred, not missing. |

---

## 11. Education Hub — broken

### E-P0-1 · A student cannot start a project unless a lecturer set one
Live, against the real key:

```
POST /api/education/engagements {"track":"AI_BRIEF"}      → 503 AI_SERVICE_ERROR
POST /api/education/engagements {"track":"OPEN_SOURCE"}   → 503 AI_SERVICE_ERROR
POST /api/education/engagements {"track":"LECTURER_ASSIGNED"} → 200
```

Root cause: `OPENAI_API_KEY` returns
`429 credit_balance_exhausted — "You have no credits remaining."` for `gpt-4o-mini`.
`openaiService` correctly refuses to invent a brief and throws 503 rather than fabricating one —
that behaviour is right. But it means **the entry point to the entire hub is dead for two of its
three tracks**, and the seeded world hides it completely: every student in the demo already has a
project.

This is the clearest instance in the project of "works with seeded data, fails for a real user."

### E-P0-2 · The AI Mentor answers nothing
Same cause as F-P0-2 — `src/app/api/mentor/chat/route.ts:15` pins the same decommissioned Groq
model. Verified live: a valid engagement-scoped message returned
*"I'm having trouble connecting right now. Please try again in a moment."*

### E-P1-3 · `/dashboard/admin/brief-contexts` throws on load
Browser page error, both viewports:

```
TypeError: Cannot read properties of undefined (reading 'map')
```

`src/app/dashboard/admin/brief-contexts/page.tsx:252` renders `ctx.targetTiers.map(...)`, and
`BriefContextLibrary.model.ts` has no `targetTiers` field — it was removed with `StudentTier`.
The page's local interface (`:14`), its placeholder JSON (`:50`) and its publishing instructions
(`:209`) all still describe the retired field, so an administrator following the on-screen
instructions would publish a library shaped for a vision that no longer exists. This is the only
surviving reference to `targetTiers` in the codebase — the retirement pass missed the admin UI.

### The distance to Foundation V2

Not defects — unbuilt scope. Recorded because the vision document is the constitution and the
gap should be stated, not implied.

| Foundation V2 | Status |
|---|---|
| §7 Academic layer (`KnowledgeArea`, `AcademicProgramme`, `CurriculumUnit`, `StudentEnrolment`) | **Built** (V2 §7.3's "none of this is built" is stale) |
| §8.3 T0 · T1 | T0 built · T1 readable but **not writable** |
| §8.3 T2 lecturer attestation · T3 feed adapters · §16.3 `AcademicSource` | **Not built** |
| §10 `SystemProject` / `ProjectIncrement`, the continuity rule, fork/retire/pivot | **Not built** — this is §P2, the strongest claim in the vision |
| §14.1 Six-milestone state machine (requirements → architecture → implementation → testing → deployment → demonstration) | **Not built** — assessment is one report plus one demonstration |
| §14.2 Six engineering assessment dimensions | **Partial** — four prose dimensions plus the demonstration outcome |
| §P7 Revision as a cycle | **Built and verified** |
| §15 Demonstration workflow | **Built and verified** |
| §13 Teams, per-increment | **Not built** |
| §17 Stage 7 institutional insight | **Not built** |
| §14.3 Retire document hashing + `VerificationAuditLog` | **Done in code**; 15 orphan documents remain in the database |

Roughly: Stage 1 ~70%, Stage 2 0%, Stage 3 ~35%, Stage 4 ~95%, Stage 5 0%, Stage 6 0%,
Stage 7 ~15% → **≈ 40% of Foundation V2**.

---

## 12. Education Hub — remaining work

Full task breakdown: **`context/EDUCATION_HUB_REMAINING_WORK.md`**.

- **P0** — E-P0-1 restore brief generation · E-P0-2 a working Groq model for the mentor
- **P1** — E-P1-3 fix the Brief Contexts admin screen · give T1 a writer
- **P2** — retire the three unwritten `ProjectStatus` members · drop the orphaned
  `verificationauditlogs` collection · raise `IN_PERSON` in the seeded demonstration mix
- **P3** — `SystemProject` / `ProjectIncrement` · milestones · teams · T2/T3 · custom PDF viewer

---

## 13. Shared systems assessment

| System | State | Evidence |
|---|---|---|
| **Authentication** | Complete | OAuth + credentials + reset + throttle; 8 registration E2E tests pass; the register route carries **no role field at all**, so there is no privilege-bearing input to tamper with. |
| **Authorization** | Complete | Middleware + `requireRole` + per-record ownership. Probed as five roles across both hubs; every negative case refused correctly, including 404-where-existence-discloses. |
| **Session management** | Complete | JWT strategy; the middleware reads claims only, no DB read on page loads; the stage claim is re-derived rather than trusted, so a stale token is re-judged. |
| **Notifications** | Complete | 259 in the world; every Education state change and every Food Hub money event covered; admin broadcasts carry their own wording and their own destination. |
| **Email** | Working | SMTP verified live. Best-effort, never throws, silent no-op when unconfigured. |
| **AI** | **Broken** | Both providers unusable — see F-P0-2, E-P0-1. |
| **Error handling** | Good, mislevelled | `AppError` + `handleApiError` used consistently; every route follows the `connectDB → session → requireRole → Zod → DB` order. Logging level is wrong for expected refusals (F-P2-5). |
| **File storage** | Complete | Server-side upload with allow-listed folders; private + signed for reports; verified live for both. |
| **Database** | Working, unnamed | Atlas M0, connection singleton, indexes in schema, `.lean()` on reads. Lives in the default `test` database (F-P2-6). Duplicate index declarations on 8 models. |
| **Design system** | Complete, one holdout | `.theme-app` / `app-*` across every product screen; `.theme-website` for the marketing site. `CreateListingForm` is the exception. |
| **Deployment** | Working | `https://umoja-hub.vercel.app` returns 200 and `{"status":"ok","db":true}`. Git-integration deploys; no `deploy.yml`. |
| **CI** | Working | `CI` and `E2E` both green on the last 6 runs on `main`. |
| **Backup** | **Broken** | See §14. |

---

## 14. External services assessment

Probed live during this audit, not inferred from the presence of an environment variable.

| Service | Configured | Working | Verdict |
|---|---|---|---|
| **MongoDB Atlas** | ✅ | ✅ | Working. Unnamed database (F-P2-6). |
| **Cloudinary** | ✅ | ✅ 200 | Working — images *and* private PDFs with signed delivery. Both proved by real round-trips. |
| **SMTP (Gmail/Nodemailer)** | ✅ | ✅ verify passed | Working. |
| **Upstash Redis** | ✅ | ✅ `PONG` | Working — rate limits and throttles are durable and shared. |
| **OpenWeatherMap** | ✅ | ✅ 200 | Working. |
| **Vercel** | ✅ | ✅ 200 | Production live and DB-connected. |
| **Daraja (M-Pesa)** | ✅ sandbox | ⚠️ credentials valid (OAuth 200, token issued), **provider not active** | Deliberate: `PAYMENT_PROVIDER` unset → `simulation`. The query path has never met the live API. |
| **Africa's Talking** | ⚠️ `username=sandbox` | ⚠️ sandbox 200 / production 401 | **Sandbox only.** No SMS reaches a real handset, in any environment, because `isSandbox` is true whenever the username is `sandbox`. |
| **Groq** | ✅ key valid | ❌ **404 model_not_found** | **Broken.** `llama-3.3-70b-versatile` is not on the account. Both AI features dead. |
| **OpenAI** | ✅ key valid | ❌ **429 credit_balance_exhausted** | **Broken.** Brief generation dead; two of three project tracks unreachable. |
| **GitHub (OAuth)** | ✅ | not probed | Login provider only. No GitHub App, no repository reading — by design. |
| **GitHub Actions — backup** | ⚠️ | ❌ **failing every run since at least 2026-07-05** | `##[error]Input required and not supplied: token` — the `BACKUP_REPO_TOKEN` secret is absent. **There is no working database backup.** 8 consecutive weekly failures. |

`resend@6.12.4` is a dependency and `RESEND_API_KEY` / `RESEND_FROM_EMAIL` are in `.env.local`,
but **no code imports resend**. Dead dependency and dead configuration.

---

## 15. Testing assessment

**What is genuinely strong**

- 1,513 unit tests across 122 suites, all passing in 41s.
- `e2e/rehearsal.spec.ts` is the best test in the repository: it drives the entire Education
  lifecycle — three report versions, two revision cycles, two demonstrations — through the real
  routes, the real database and **real Cloudinary storage**, then re-reads it in a browser, then
  cleans up after itself. It is why the Education Hub's core is trustworthy.
- Database isolation is real and enforced: `MONGODB_E2E_URI` is required with **no fallback**, is
  checked to differ from `MONGODB_URI` at config time, and the harness only drops a database it
  can prove it owns. It dropped `umojahub_e2e` cleanly on every run today.
- `npm run demo:validate` runs 73 semantic checks over the seeded world — not "does a row exist"
  but "does every completed project have a demonstration", "does every report's standing agree
  with its project's", "was anything evaluated before it took place".

**Where the confidence is false**

- **Every external integration is mocked in unit tests.** Type-check, lint, 1,513 tests, 55 E2E
  tests, 73 demo checks and a green build all passed while Groq's model was gone and OpenAI had
  no credits. Nothing in the suite would ever notice.
- **No test opens the create-listing form.** `verification-lockout.spec.ts` asserts a verified
  farmer *"can reach the create-listing affordance"* — it checks that a button exists, and stops
  exactly one click before the defect.
- **No test loads `/dashboard/admin/brief-contexts`.** The page has thrown on every load for as
  long as `targetTiers` has been absent from the model, and no gate looked.
- Coverage thresholds apply only to `src/lib/validation/` (95%) and `src/lib/trust/` (90%).
  Global thresholds are empty.
- The rehearsal cannot run in CI (CI holds placeholder Cloudinary credentials). Documented and
  deliberate, but it means the strongest test is the one that runs least.
- No load testing at any scale. The largest run ever exercised is one institution and a handful
  of students.

**Recommendation:** add a small suite of *live* integration smoke tests — one call per external
provider, run on demand rather than in CI — because the failure mode this audit found is
precisely "the code is correct and the provider changed underneath it."

---

## 16. Security assessment

**Verified holding, by probe rather than by reading:**

- Role separation across all six roles; admin surfaces answer 404 to authenticated non-admins.
- Per-record ownership: another buyer reading someone's order got 404; another farmer editing
  someone's listing got 403; another institution's report got 404.
- Unverified-actor gates: farmer publishing → 403 `FARMER_NOT_VERIFIED`; lecturer queue → 403
  `LECTURER_NOT_VERIFIED`.
- Cron routes: all six 401 without the bearer token, 200 with it.
- Stored reports have **no public URL at all**; every read is authorised and signed for two
  minutes.
- Registration carries no role field; role is assigned server-side from an enum containing
  neither `ADMIN` nor `INSTITUTION`.
- Passwords bcrypt cost 12, `select: false`; institutional PINs hashed and excluded.
- Rate limits on registration (20/hr/IP), orders (5/hr), mentor (10/10min), backed by Redis.
- Daraja callbacks: IP allow-list on three Safaricom-owned /24s, schema validation, and a unique
  index on `mpesaTransactionId` as the replay guard. The comments correctly state that the IP list
  is defence in depth and **not** the integrity control, because Daraja does not sign callbacks.
- No credentials in code; `env()` throws at startup for anything missing.

**Gaps**

| Severity | Gap |
|---|---|
| **High (operational)** | **No working database backup.** 8 consecutive weekly failures; the secret is missing. A platform holding money state and academic records has no restore point. |
| Medium | Expected refusals logged at `ERROR` with stack traces — real incidents will be buried (F-P2-5). |
| Medium | Application data in a database named `test` (F-P2-6). |
| Low | 15 orphaned `verificationauditlogs` documents from a retired subsystem; three empty collections from the retired portfolio vision (`portfolioviews`, `studentportfoliostatuses`, `ngoorganizations`). |
| Low | `resend` dependency and its credentials present but unused — configuration nobody audits. |

No exposure of user data, no authorization bypass, and no injection surface was found **in the
application's own code**. That sentence originally stood alone, and it was an overclaim: the
audit had not looked at the dependency tree at all. It has now — see below.

### Dependency vulnerabilities

**This was a gap in the audit, found by re-reading it rather than by any tool.** `npm audit` had
never been run. It was run on 2026-08-23 after the fact:

| | critical | high | moderate | low | total |
|---|---:|---:|---:|---:|---:|
| All dependencies | 2 | 15 | 3 | 3 | **23** |
| Production only | 1 | 11 | 3 | 3 | **18** |

A count is not a finding, so each advisory touching a **direct** dependency was checked for
whether it is actually reachable in this codebase:

| Package | Sev | The advisory | Reachable here? |
|---|---|---|---|
| `next-auth` | **critical** | Email normalizer validates before Unicode normalization | **No** — the vector is the Email (magic-link) provider. `options.ts` configures Google, GitHub and Credentials only. |
| `nodemailer` | high | SMTP command injection via unsanitized `envelope` | **No** — `envelope` is never used anywhere in `src/`. Recipients come from `User.email`, which is `z.string().email()` at every write boundary and `lowercase`/`trim` on the model. |
| `next` | high | HTTP request smuggling in **rewrites** | **No** — `next.config.ts` declares no rewrites and no redirects. |
| `mongoose` | moderate | Prototype pollution in update casting | **No** — 66 update call sites; none passes an unparsed request body. Every one writes explicit fields after a Zod `safeParse`. |
| `svgo`, `postcss` | high | Script retention / CSS stringifier XSS | Build-time only; neither runs on user input at request time. |

The remaining ~17 are transitive and overwhelmingly build/dev toolchain — `handlebars`, `esbuild`,
`@babel/core`, `js-yaml`, `minimatch`, `picomatch`, `brace-expansion`, `flatted`, `hono`,
`ip-address`, `fast-uri`, `nanoid`, `ws`, `sharp`, `body-parser`, `uuid`.

**Assessment: no reachable exploit path was found, and that is a snapshot, not a guarantee.**
Reachability analysis is only true of the code as it stands today; the next feature that touches
an email envelope or a Next rewrite makes two of these live. The patches should be applied — but
deliberately, not reflexively:

- `next` 15.5.12 → 15.5.23 is a patch within the same minor. Low risk.
- **`nodemailer` 7 → 9 is a major bump** and touches the lifecycle-email path. Needs its own pass.
- `npm audit fix` without `--force` resolves most transitives.

**Explicitly not applied during this audit.** Shifting dependency versions days before a
presentation, on a branch whose whole purpose was to fix four dead features, would risk the demo
to close findings that are not reachable. Sequence it after the presentation, on its own branch,
with the full gate.

---

## 17. UX assessment

Swept every authenticated route as six identities at **1280×900** and **390×844**, recording
console errors, page errors, failed same-origin requests, thin pages, horizontal overflow and
suspicious copy.

**Result: 1 page error, 0 console errors, 0 overflow, 0 broken copy, 0 thin pages** across
roughly 45 route/viewport combinations. The single page error is E-P1-3.

**What is good**

- Redirects are intentional and correct — `/dashboard/student` → the student's own project,
  `/dashboard/lecturer` → the review queue, `/dashboard/admin` → the verification queue.
- Failure states say true things. A receipt that does not exist reads *"This order has no receipt
  yet. A receipt is issued once payment is confirmed."* — not an error.
- Empty states offer a next step rather than a refusal (`verification-lockout.spec.ts` asserts
  exactly that of the unverified farmer).
- Copy is unusually careful. The verification notice deliberately does not name the document
  because nothing inspected it. The new-project page states what the track does *and does not*
  decide. Provenance is written in plain language: *"You told us this."*
- Mobile is genuinely clean — no horizontal overflow anywhere at 390px.

**What is not**

1. **`CreateListingForm`** — off the design system, clipped out of the viewport, and demanding an
   impossible action (F-P0-1, F-P1-3). It is the worst screen in the product by a wide margin and
   it sits on the farmer's primary workflow.
2. **"Duplicate entry"** shown to a buyer (F-P2-4).
3. **No image fallback** — a listing whose image fails renders broken (F-P2-8).
4. `/dashboard/student/projects/new` renders the create form for a student who already has an
   active project; they only learn otherwise on submit (the server correctly refuses). Reachable
   only by deliberate navigation, since the dashboard redirects to the active project.

---

## 18. Data / seed assessment

`npm run demo:validate` — **all 73 checks passed** against the current world
(`demo-20260822182539-2n78ef`, 2,097 tracked documents).

**Does it look like a real Kenyan platform? Largely yes.**

- 60 users across 6 roles; Kenyan names, counties and phone formats throughout.
- 36 listings, every one with an audited photograph matching its crop, in a county that grows it,
  priced in its trading unit within the Kenyan market band, and a crop its farmer declares they
  grow. Zero placeholder strings.
- 144 orders spanning `AWAITING_PAYMENT(21)`, `IN_FULFILLMENT(21)`, `COMPLETED(99)`,
  `DISPUTED(3)`; 3 refunds; every settled order has an M-Pesa receipt and a payment event trail;
  nothing dated in the future; nothing paid before it was placed or received before it was paid.
- 40 engagements across every reachable status; every one anchored to real coursework; 39 with a
  submitted report; **every report is a real PDF uploaded through the application's own storage
  path**; 47 versions all pointing at stored files; every report sent back names what must change.
- 4 programmes, 160 curriculum units, 0 unmapped; both self-declared and institution-published
  enrolments present.
- 8 problem domains across the brief library — agriculture is one of them, not the default.
- **No fabricated GitHub evidence anywhere** — `githubSnapshot` is empty because the platform
  cannot gather it.

**Where it does not hold up**

1. **A real leftover account sits in the presentation database.** `jafarhussein251@gmail.com`
   (BUYER, created 2026-08-03, not part of any demo run) carries
   `organizationName: "NOT APPLICABLE"` and `businessRegistrationNumber: "NOT APPLICABLE"` with
   `verificationStatus: PENDING`. It therefore appears in the **admin buyer verification queue** —
   a screen a panel is likely to be shown — displaying fabricated-looking data. It is the exact
   artefact of the closed-onboarding-corridor defect recorded in
   `POST_PRESENTATION_STABILIZATION_AUDIT.md`: the corridor has since been fixed (the
   `INDIVIDUAL` / `BUSINESS` branch is built and working), but the residue was never cleared.
2. **The demonstration mix contradicts the vision's emphasis.** 29 of 35 slots and 23 of 26
   demonstrations are `VIDEO_CALL` with Jitsi links. The workflow this hub is built around
   centres on the student meeting the lecturer and showing the running system. `IN_PERSON` is
   supported and seeded (6 slots, 3 demonstrations) but is the exception rather than the norm.
3. **This audit added artefacts** — two `AUDIT — …` listings, two orders, one approved farmer,
   one resolved mediation, one knowledge article and one project for `wairimu.karanja`.
   `npm run demo` must be run before any presentation. This is recorded, not hidden.
4. Four empty/orphaned collections from retired visions remain (§16).

---

## 19. Presentation readiness

**Blockers a panel would actually see, in order:**

| # | What they would see | Severity |
|---|---|---|
| 1 | *"Show us a farmer listing produce."* → a form asking for a Cloudinary URL, in a modal whose title is cut off. | **Fatal** |
| 2 | *"Ask the Farm Assistant something."* → *"I'm having trouble connecting right now."* Every time. | **Fatal** |
| 3 | *"Show us a student getting a project."* → 503, unless a lecturer set one first. | **Fatal** |
| 4 | *"What's in Brief Contexts?"* → a blank screen. | High |
| 5 | The buyer verification queue's contents include a real record reading "NOT APPLICABLE". | Medium |
| 6 | Demo world must be re-seeded — it now holds this audit's artefacts. | Operational |

**What is presentation-ready right now, and impressively so:** the whole buyer→escrow→farmer
money story; farmer verification through the admin queue; the price intelligence dashboard; the
escrow console and the payment lab; the entire Education Hub cycle from a submitted PDF to a
recorded demonstration outcome; the institution roster; the marketplace and the public website.

---

## 20. Overall UmojaHub completion

### Methodology

A feature counts as **complete** only when all seven of these hold:

> UI · backend route · database model · authorization · error handling · tests ·
> **and a real user can complete the workflow today, without seeded data**

Any one missing makes it **partial**. A feature that works but contradicts the current vision is
**not complete** regardless of how well it is built. A feature that passes tests but fails in a
browser is **not complete**. A backend route with no working user path is **not complete**.

Each hub is scored on seven dimensions and weighted by what actually matters for this project:

```
core workflow 25% · features 15% · integrations 15% · testing 10%
· UX 15% · security 10% · presentation readiness 10%
```

The overall figure is **not** the average of the two hubs. UmojaHub is one product with a shared
spine — auth, RBAC, onboarding, notifications, email, storage, admin, deployment, design system,
test harness — that is more complete than either hub and is a prerequisite for both.

```
Shared spine  25%  × 85   = 21.25
Food Hub      40%  × 80   = 32.00
Education Hub 35%  × 74   = 25.90
                            ------
                             79.15
```

### The numbers

| | Score |
|---|---:|
| **Food Hub** | **80%** |
| **Education Hub** (against the implemented workflow) | **74%** |
| *Education Hub (against the full Foundation V2 ambition)* | *40%* |
| Shared systems | 85% |
| **UmojaHub overall** | **79%** |

### Why not higher

Because a farmer cannot list produce, a student cannot start a project, and the AI answers
nothing — and none of that is visible from a green gate. The remaining 21% is not evenly spread:
roughly 6 points are four concrete defects that can be closed in a day, and the other 15 are
Foundation V2's unbuilt project-continuity model, live-provider verification, load testing, and
the operational work (backup, real SMS, a licensed payment partner) that separates a demonstrable
platform from a production one.

### Why not lower

Because everything *else* was tested and works. The parts most likely to be quietly broken —
escrow settlement, mediation refunds, concurrent review, private document delivery, institution
scoping, payment reconciliation — were driven through their real routes and held.

---

## 21. Critical blockers (P0)

| ID | Defect | Hub |
|---|---|---|
| **F-P0-1** | A real farmer cannot list produce — the image field demands a pasted Cloudinary URL | Food |
| **F-P0-2** | Farm Assistant dead — Groq model decommissioned | Food |
| **E-P0-1** | Two of three project-start tracks return 503 — OpenAI credits exhausted | Education |
| **E-P0-2** | AI Mentor dead — same Groq model | Education |

## 22. High-priority (P1)

| ID | Issue | Hub | |
|---|---|---|---|
| **E-P1-3** | `/dashboard/admin/brief-contexts` throws on load (`targetTiers`) | Education | ☑ done |
| **F-P1-3** | Create-listing modal off the design system and clipped out of the viewport | Food | ☑ done |
| **S-P1-1** | Weekly database backup has failed 8 consecutive runs — no restore point exists | Shared | ☑ **done — backups now exist and are verified** |
| **E-P1-4** | T1 published curriculum has no writer — every real institution is stuck at T0 | Education | ☐ open — gated by Foundation V2 §19 |

## 23. Medium-priority (P2)

| ID | Issue | |
|---|---|---|
| F-P2-4 | A duplicate rating shows the buyer "Duplicate entry" | ☑ done |
| F-P2-5 | Expected 401/403/404 logged at ERROR with stack traces | ☑ done |
| F-P2-6 | `MONGODB_URI` names no database — data lives in `test` | ☐ owner |
| F-P2-8 | No image-load fallback on listing cards | ☑ done |
| S-P2-1 | Clear the orphaned `jafarhussein251@gmail.com` record from the verification queue | ☐ owner |
| S-P2-2 | Live-provider smoke tests, run on demand | ☑ done — `npm run check:services` |
| **S-P2-3** | **23 dependency vulnerabilities (2 critical, 15 high). None reachable in this codebase — each checked, §16. Patch after the presentation: `next` is a safe patch bump, `nodemailer` 7→9 is a major and needs its own pass.** | ☐ open |
| E-P2-1 | Retire `SUBMITTED` / `UNDER_PEER_REVIEW` / `DENIED` from `ProjectStatus` (migration) | ☐ open |
| E-P2-2 | Raise `IN_PERSON` in the seeded demonstration mix to match the vision | ☐ open |
| **S-P2-4** | **Two test gaps left open deliberately:** the E2E spec still stops at the create-listing *button* rather than completing a publish, and `/dashboard/admin/brief-contexts` is not in the smoke set — so an admin page that throws would not fail a run | ☐ open |

## 24. Low-priority (P3)

| ID | Issue |
|---|---|
| F-P3-7 | Duplicate schema index declarations on 8 models |
| S-P3-1 | Drop 4 orphaned/empty collections from retired visions |
| S-P3-2 | Remove the unused `resend` dependency and its credentials |
| E-P3-1 | `/dashboard/student/projects/new` offers a form the server will refuse |
| S-P3-3 | Refresh `webapp-reset/EDUCATION_HUB_FOUNDATION_V2.md` §7.3 and §16.3, now stale |

## 25. Intentionally deferred — do not "fix"

| Item | Why it stands |
|---|---|
| **M-Pesa custody simulated** | Holding third-party funds in Kenya is licensed activity (NPS Act 2011). The control plane is real; the custody leg is disclosed. The production path is a CBK-licensed PSP, not "switch on Daraja". |
| **No GitHub repository verification** | The demonstration establishes the same thing better, and the platform fabricates no commit evidence in the meantime. |
| **Browser PDF viewer, not a custom one** | Adequate, and honestly described. Page feedback is a page number the lecturer reads off it. |
| **Peer review gates nothing** | A student whose cohort is slow must not be held out of their own assessment. |
| **Buyer verification does not gate ordering** | Deliberate — the closed corridor is what made users fabricate data. |
| **`SUBMITTED` / `UNDER_PEER_REVIEW` / `DENIED` still in the enum** | Records may carry them. A migration, not a validation-pass edit. |
| **Rehearsal excluded from CI** | CI holds placeholder Cloudinary credentials. Run deliberately. |
| **`SystemProject` / increments / milestones / teams** | Foundation V2 Stages 2, 3 and 5. Gated design work, not a bug. |
| **No listing delete** | Pause/reactivate is the deliberate model — the page says so. |

## 26. Features that must NOT be changed

Working, verified, and load-bearing. Touch only with a specific reason:

- The escrow control plane — `escrow.ts`, `escrowSettlement.ts`, `orderEscrowState.ts`,
  `orderJourney.ts` and the two append-only event logs.
- `processCallback` and `reconcile` — one shared processor for both providers; the
  query-before-you-conclude rule and `UNRESOLVED`.
- The partial unique index on `WithdrawalRequest.farmerId`, and the settle-then-record ordering
  in mediation resolution.
- `documentStorage.ts` — private upload plus per-request signed URL. This was the blocker fixed
  on 2026-08-22 and it is verified working.
- `reportAccess.ts` / `toPeerDocumentationView` — the three-reader rule and the peer projection.
- The `arrayFilters` conditional update in lecturer review (one decision under concurrency).
- `ACTIVE_PROJECT_STATUSES` as the single exported answer to "is this project current".
- `src/middleware.ts` — particularly the deliberate decision *not* to police every onboarding
  path against the JWT stage claim.
- The E2E database isolation guards in `e2e/support/database.ts`.
- `scripts/demo/` and its 73 validation checks.
- The whole `.theme-app` / `app-*` design system and the website's `.theme-website` slice.
- Every honest failure message — the receipt notice, the verification notice, the provenance
  labels, the "no fabricated evidence" position.

## 27. Recommended execution order

Hub isolation is respected: Food Hub first, verified and frozen, then Education Hub, then a
shared regression.

**Phase A — Food Hub P0/P1**
1. F-P0-1 — file upload in the create-listing form (uses the existing `/api/upload`).
2. F-P1-3 — migrate the modal to the app design system; contain and scroll it.
3. F-P0-2 — move the Groq model to one the account actually serves; make the model configurable
   so this failure is a config change next time, not a code change.
4. F-P2-4, F-P2-5, F-P2-6, F-P2-8 — small, contained, same pass.
5. Regression: `type-check · lint · test · build · test:e2e:fast · demo:validate` + a live browser
   pass of the farmer workflow.

**Phase B — freeze Food Hub.**

**Phase C — Education Hub P0/P1**
6. E-P1-3 — fix Brief Contexts (delete the `targetTiers` remnant from the page).
7. E-P0-1 — restore brief generation. Two parts: make the model/provider configurable, and decide
   whether generation falls back to a curated brief when the provider is down rather than 503-ing
   the entry point of the hub. (Foundation V2 §18 open question 5 anticipates exactly this.)
8. E-P0-2 — mentor model (falls out of the same change as F-P0-2).
9. E-P1-4 — a writer for T1 published curriculum.
10. Regression: `test:e2e:education` + `test:e2e:rehearsal` + `demo:validate`.

**Phase D — shared**
11. S-P1-1 — the backup workflow secret (owner action: add `BACKUP_REPO_TOKEN`).
12. S-P2-1 — clear the orphaned record.
13. S-P2-2 — live-provider smoke tests.

**Phase E — final**
14. `npm run demo` to rebuild the world (mandatory — this audit dirtied it).
15. Full gate + browser pass across both hubs.
16. Push the branch and open the PR — 4 commits currently sit unpushed with no PR.
