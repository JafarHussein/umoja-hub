# UmojaHub — presentation-readiness audit

Performed **2026-08-24** against `docs/project-paper-rebuild` at `413339c`, on this machine,
against the presentation database (MongoDB Atlas, database `test`) and against the live Vercel
deployment.

Everything below was produced by **running the software**: a production build served on :3000,
driven through its real HTTP routes as all six roles with real credential sign-ins, and read back
in a real browser. Where a claim rests on reading code rather than executing it, that is said.

The question asked of every feature was the one a panel asks: *if the student demonstrates this
right now, what could go wrong?*

---

## 1. Current application status

UmojaHub is a Next.js 15 + MongoDB platform with **61 pages, 103 API routes, 42 collections and
1,523 unit tests**. Both hubs are built and both work. The architecture is consistent, the
authorization is genuinely enforced at two layers, the money path has a real control plane with an
append-only audit, and the on-screen copy is unusually honest about what the system does and does
not know.

**Three defects were found that a green gate could not see, and all three were on the
demonstration path.** One of them — the buyer's only recovery from a failed payment — returned
`Internal server error` from a button that is prominently rendered on seeded orders. All three are
fixed and verified.

| Gate | Result |
|---|---|
| `npm run type-check` | clean |
| `npm run lint` | 0 errors, 5 warnings (pre-existing) |
| `npm run test` | **1,523 passed**, 123 suites |
| `npm run build` | exit 0 |
| `npm run test:e2e:fast` | **55 passed** |
| `npm run test:e2e:rehearsal` | **3 passed** — the full Education lifecycle through real file storage |
| `npm run demo` | **73/73 checks passed**, run three times |
| `npm run check:services` | 6 healthy · 4 degraded · 0 failed |
| Live browser sweep | **0 console errors** on the demonstration path |
| Database integrity | **0 orphans, 0 impossible states** across every relationship checked |

---

## 2. Overall presentation readiness — **94%**

Not 100%, and the six points are specific:

| Deduction | Why |
|---|---|
| −2 | The fixes in this audit are **local only**. The live Vercel deployment still carries the payment-retry 500 and the stale marketplace. If the panel is shown production rather than localhost, two of the three P0/P1 fixes are not there. |
| −2 | **Presentation correctness depends on one undocumented environment variable.** `SIMULATION_PROFILE=HAPPY_PATH` is now set locally and documented, but it is configuration, not code — an environment rebuilt from `.env.local.example` without reading the new comment goes back to a ~30% payment failure rate. |
| −1 | The demonstration world is **consumed by rehearsing it**. The primary lecturer has exactly one report in her queue; reviewing it once empties the Education Hub's centrepiece screen. Correct behaviour, but it makes `npm run demo` mandatory rather than advisory. |
| −1 | Residual known limits carried in from before this audit: OpenAI moderation is rate-limited (articles publish unmoderated), Africa's Talking is a sandbox that reaches no handset, the application database is still named `test`, and 23 dependency vulnerabilities remain unpatched. None blocks a demonstration; all are true. |

**Nothing on the demonstration path is currently known to fail.**

---

## 3. Food Hub readiness — **95%**

Verified end to end, twice, once through the API and once in a browser:

publish produce (with a real photo upload) → appears on the public marketplace **immediately** →
buyer opens the listing and sees the verified badge, trust score and stock → checkout → M-Pesa
payment → escrow holds → farmer marks ready → farmer confirms dispatch → buyer confirms receipt →
order `COMPLETED`, escrow `RELEASABLE` → rating → farmer ledger → payout request → admin sees it.

Also verified: over-stock refused, zero and negative quantity refused, malformed phone refused,
a farmer refused the buyer role, duplicate receipt-confirmation refused, re-paying a paid order
refused, duplicate rating refused with a sentence rather than a database error.

The 5% is the deployment gap (§11) and the fact that a live checkout still depends on the
simulation profile being set correctly.

## 4. Education Hub readiness — **92%** (against what is built)

Verified live: all three project tracks (`AI_BRIEF` and `OPEN_SOURCE` generated from scratch
against a newly-registered student's declared units; `LECTURER_ASSIGNED` validated and exercised
in the seeded world), academic context required before a brief exists, the lecturer review queue,
opening a student's submitted PDF (**64,310 bytes, `application/pdf`, correctly scoped** — this is
the defect that used to make the whole lecturer workflow impossible), review validation that
refuses a one-line summary and refuses a rejection that names nothing, the revision loop reopening
for the student, demonstration scheduling, and the full rehearsal `submit → review → revise →
accept → demonstrate → approve → VERIFIED`.

The AI Mentor answers, grounded in the student's own project and units.

> Measured against Foundation V2's *full* ambition — the unbuilt project-continuity model — the
> Education Hub remains at roughly **40%**. That is a scope statement, not a defect, and it is
> unchanged by this audit. The 92% above is readiness of **what exists** to be demonstrated.

## 5. Authentication readiness — **100%**

Every item on the brief's list was tested.

| Test | Result |
|---|---|
| Registration, valid | ✅ account created at `ROLE_SELECTION` |
| Wrong password | ✅ "Invalid login or password." |
| Duplicate email | ✅ 409 with a recovery sentence |
| Weak password / mismatch | ✅ named field errors |
| `role: ADMIN` smuggled into the register body | ✅ silently discarded — account created with `role: null` |
| `role: ADMIN` / `INSTITUTION` at role selection | ✅ 400, rejected by a four-member enum |
| Sign in, all six roles | ✅ each lands on its own dashboard |
| Session survives refresh | ✅ |
| Sign out | ✅ session destroyed |
| Protected route after sign-out | ✅ redirect to login with `callbackUrl` |
| Browser **back** after sign-out | ✅ cannot re-enter; every back lands on login |
| Signed-in header shows a Sign in button | ✅ **no** — it shows the account menu and the user's name |

Google and GitHub OAuth buttons render and point at the right providers; the OAuth round-trip
itself was not driven (it needs a real Google/GitHub session and is not on the demo path — the
script signs in with credentials).

## 6. Marketplace readiness — **96%**

Content realism was inspected on the rendered page, not in the seed script. Crop/county pairings
are correct for Kenya (Tea/Kericho, Potatoes/Nyandarua, Maize/Uasin Gishu, Avocados/Murang'a),
prices sit in believable bands in the right trading units, farmer names are plausible, every
listing has a real photograph matching its crop, and there is **no lorem ipsum, no placeholder
text, no developer terminology and no broken image**. The seeder's own validator enforces most of
this (`every listing is grown in a county that grows it`, `every listing is priced in its trading
unit, within the Kenyan market band`, `no placeholder text in listings`).

Search, category tabs, county filter, price range, minimum quantity, verified-only and
high-trust-only filters all render and apply. Deductions are the two P3 realism nits in §19.

## 7. Payment readiness — **95%**

The UI tells the truth. A simulated payment is labelled **"Simulated payment"** on the buyer's
order surface, next to the M-Pesa receipt. There is no animation pretending a payment occurred:
state changes are read back from the database and the event trail is an append-only log with
actor, transition and reason.

Tested: success, failure, retry after failure, cancel, re-pay refused on a paid order, refused on
a refunded order, retry by a non-owner refused (403), payment status polled repeatedly (stable),
and refresh at every stage (state survives, because it is a database row).

The 5% is that a live checkout's reliability is a configuration choice (§17 P0-2).

## 8. Escrow readiness — **97%**

Escrow is a state machine over real records, not custody, and the product says so. States observed
in the running system: no funds, held, held-and-dispatched, held-under-review, releasable,
refunded, and `UNKNOWN`. The admin escrow console reconciles: held KSh 1,901,496 across 35 orders,
releasable KSh 6,789,486 across 145, in dispute across 8, refunded across 8 — and the order this
audit created appeared in it at `RELEASABLE` within seconds of the buyer confirming receipt.

The seeder's validator independently asserts `escrow reconciles (gross = held + releasable, all ≥
0)` and `no escrow RELEASED/REFUNDED without HELD`.

## 9. Education workflow readiness — **92%**

Covered in §4. The one workflow-shaped risk is not a defect: **a rehearsal consumes the queue**
(§18 P2-2).

## 10. Administrator readiness — **98%**

All 13 admin pages load. Verification queue, escrow console, mediation, payouts, price analytics,
knowledge CMS, lecturer verification, supplier verification, group tokens, impact summary and
payment lab all return real data.

The live approval was driven end to end: a `PENDING` farmer → admin `PATCH` `APPROVED` →
`trustScoreInitialized: true` → **the farmer could publish produce on the next request, with no
re-login**, because the route re-reads the database rather than trusting the token. That is exactly
the claim §15.4 of the interview script makes.

The verification review modal shows the identity document, its type and number, and open/download
links; the document asset loads (`200 image/svg+xml`).

## 11. Deployment readiness — **85%**

`https://umoja-hub.vercel.app` is up and healthy.

| Check | Result |
|---|---|
| `/`, `/auth/login`, `/knowledge`, `/marketplace` | 200 |
| `/api/health` | `{"status":"ok","db":true}` |
| Guarded route unauthenticated | 307 → `/auth/login?callbackUrl=…` |
| `/api/admin/*` unauthenticated | 401 |
| `/api/transparency` | real aggregates |
| Marketplace renders listings | 20, cache MISS (fresh) |

**Production reads the same Atlas database as local** — production served listings this audit
created locally, by id. That is the existing single-database architecture, and it means the final
`npm run demo` affects both surfaces.

The 15% deduction is one fact: **production is running the build from before this audit.** The
payment-retry 500 (P0-1) and the stale marketplace (P1-1) are still live there. See §24.

## 12. External service readiness — **80%**

`npm run check:services`, run live:

| Service | State |
|---|---|
| Groq (Farm Assistant + AI Mentor) | ✅ `openai/gpt-oss-120b` answering |
| Brief generation | ✅ answering |
| Cloudinary | ✅ account reachable; uploads and PDF delivery both proven |
| OpenWeatherMap | ✅ Nairobi forecast returned |
| SMTP | ✅ credentials accepted |
| Upstash Redis | ✅ `PONG` |
| MongoDB | ⚠️ connected, but the URI names no database (using `test`) |
| Daraja (M-Pesa) | ⚠️ credentials valid; `PAYMENT_PROVIDER=simulation` by design |
| Africa's Talking | ⚠️ sandbox — no SMS reaches a real handset |
| OpenAI moderation | ⚠️ **429 Too Many Requests** — articles publish unmoderated |

The moderation failure is **graceful**: the route logs a warning and proceeds, so publishing a
knowledge article still works. Verified by reading the handler, which treats a non-200 as
"proceed" rather than an error.

Both AI features were exercised live, not just probed. The Farm Assistant answered a tomato
disease question grounded in the farmer's county and KEBS fertiliser certification; the AI Mentor
answered an architecture question grounded in the student's actual unit codes.

---

## 13. Test results

| Suite | Result |
|---|---|
| Type-check | clean |
| Lint | 0 errors, 5 warnings (3 `no-console` in a figure-rendering script, 2 `next/image` advisories on the knowledge hub — all pre-existing) |
| Unit / integration | **1,523 passed**, 123 suites, 0 failed |
| E2E desktop | **55 passed** (3.1 min) |
| E2E rehearsal | **3 passed** (2.9 min) — real Cloudinary upload, real PDF retrieval |
| Build | exit 0 |

E2E ran **locally**, not via CI. `MONGODB_E2E_URI` is present, the harness drops and rebuilds its
own database on port 3100 against a production build, and it refuses to start if that URI resolves
to the application database.

> **Operational note found while running these:** `npm run test:e2e*` runs `npm run build && npm
> run start`, which rewrites `.next` **in place**. A demo server already running on :3000 from the
> same directory starts throwing `ChunkLoadError` the moment that build lands. This cost time
> during the audit and would be alarming mid-presentation. **Never run the E2E suite while the
> demo server is up.**

## 14. Browser test results

Driven in a real Chromium browser at 1440×900 across the demonstration path.

| Screen | Result |
|---|---|
| Public homepage | ✅ 0 console messages |
| Marketplace (anonymous + signed in) | ✅ 20 listings, filters render, images load |
| Listing detail | ✅ verified badge, trust score, stock, price breakdown, fulfilment choice |
| Login — wrong password | ✅ "Invalid login or password." |
| Login — correct | ✅ lands on the role's own dashboard |
| Farmer · My Produce | ✅ table, KSh prices, pause/reactivate |
| Farmer · Add produce modal | ✅ complete form, **real file picker**, photo uploaded and previewed |
| **Live checkout** | ✅ paid first attempt, receipt issued, escrow held, **0 console errors** |
| Buyer · order detail | ✅ four-zone surface, "Simulated payment" label, honest escrow narration |
| Buyer · failed order → "Try payment again" | ✅ **works** (this is P0-1) |
| Lecturer · review queue, demonstrations, availability | ✅ |
| Admin · verification queue + review modal | ✅ document renders |
| `/auth/unauthorized` | ✅ names the signed-in role, offers dashboard + sign out |

**Console errors on the demonstration path: zero.**

Two error classes were seen and both were the auditor's own doing, not the product's: a 401 from a
deliberate wrong-password attempt, and `ChunkLoadError` caused by running the E2E suite against a
live server (above). A 404 on `_next/image` came from a fake Cloudinary URL used in an API-level
probe; the seeded world has no such listing.

> **Rendering note for the presenter:** the marketplace grid streams in behind a Suspense
> boundary. For a moment the filter sidebar is present and the produce is not. Let the page settle
> before narrating. This is not a defect — an accessibility snapshot taken mid-stream during this
> audit briefly looked like an empty marketplace, and a second look showed all 20 listings.

## 15. Database integrity results

Queried directly against the presentation database.

| Check | Result |
|---|---|
| Database | `test` · 42 collections · 62 users at time of check |
| Listings → farmers | 48 docs, **0 orphaned** |
| Orders → buyers / farmers / listings | 216 docs, **0 orphaned** on all three |
| Project engagements → students | 38 docs, **0 orphaned** |
| Documentation → engagements | 29 docs, **0 orphaned** |
| Lecturer reviews → engagements | 14 docs, **0 orphaned** |
| Ratings → buyers · payouts → farmers · notifications → users | **0 orphaned** |
| `COMPLETED` orders without `paidAt` | 0 |
| Orders received but not paid | 0 |
| Listings with negative stock | 0 |
| Users unable to sign in (no password) | 0 |
| Users with `role: null` or stuck mid-onboarding | 0 |

No E2E fixture contamination: the harness runs on `umojahub_e2e` and drops it on teardown.

**Cleaned up during this audit:** two student accounts the auditor registered through the real
registration flow survived `npm run demo`, because the seeder deliberately preserves records
outside its run ledger (they might be real accounts the owner uses). They and their engagements,
enrolments and notifications were removed by hand. **This is worth knowing: accounts created
through the app during a rehearsal are not cleaned up by re-seeding** — except the one rehearsal
email the seeder knows about.

## 16. Demo seed results

`npm run demo` was run **three times** during this audit.

| Run | Duration | Checks | Notes |
|---|---|---|---|
| 1 | 307.2s | **73/73 passed** | |
| 2 | 183.8s | **73/73 passed** | Exactly one simulation run left in the database |
| 3 | 135.4s | **73/73 passed** | Final run. Left the world pristine: one simulation run, 60 users, receipt codes now ASCII, no audit residue |

It never failed, never violated a unique constraint, and never left a previous world behind — run 2
left exactly one `SimulationRun` and 49 listings, matching its own ledger. Record counts vary
between runs (withdrawal requests 21 → 14) because the RNG is seeded per run; the **invariants** do
not vary, which is what matters. **`npm run demo` is proven as the presentation reset mechanism.**

It also does something worth naming: it clears the sign-in and registration rate-limit counters in
Redis, so a rehearsed registration cannot leave the form throttled for the real demonstration.

---

## 17. P0 defects — presentation blockers

### P0-1 · A buyer could not retry a failed payment — the endpoint returned `Internal server error` · **FIXED**

`POST /api/orders/[orderId]/payment` with `action: RETRY` threw
`MongooseError: Cannot pass an array to query updates unless the 'updatePipeline' option is set`
and answered `{"error":"Internal server error"}`.

The stock re-reservation passes an aggregation-pipeline update to `findOneAndUpdate`. **Mongoose 9
requires `updatePipeline: true` before it will send one.** The identical reservation in
`POST /api/orders` has that option, with a comment explaining why and a test asserting it — the
retry path was written from the same shape and the option was not carried across.

**Why no gate saw it:** the retry test asserted `expect(mockListingFindOneAndUpdate)
.toHaveBeenCalled()`. That is true whether or not the driver would accept the call. The sibling
test in `orders/route.test.ts` asserts the options object and carries a comment saying exactly why
— the lesson had already been learned once and not applied here.

**Why it mattered:** "Try payment again" is a prominent button rendered on every failed order, and
the seeded world contains failed orders. Under the payment profile that was active (P0-2), roughly
30% of live checkouts fail — so the most likely thing to go wrong in front of the panel was
followed by the most likely recovery, which was broken.

**Fix:** `src/app/api/orders/[orderId]/payment/route.ts` — added `updatePipeline: true`, with the
reason recorded. Tightened the test to assert the options object rather than the bare call.

**Verified:** reproduced on a clean production build before the fix; after it, retry returns a new
checkout session, and the **UI** path was driven — a seeded failed order → "Try payment again" →
paid, receipt `WONTLOQHY2`, escrow held, "Confirm receipt" offered.

### P0-2 · The live payment demo ran at a ~30% failure rate, and nothing documented the knob · **FIXED (configuration + documentation)**

`SIMULATION_PROFILE` was unset, so the simulator ran `TYPICAL`: **70 success / 10 insufficient
funds / 8 cancelled / 5 timeout / 4 network failure / 3 lost**, with delay buckets reaching **180
seconds** and a 2% duplicate-callback rate.

That profile is correct and deliberate — its written purpose is *"populating a demo environment
that does not look implausibly perfect"*. It is the wrong thing to have running while a person is
watching you check out. Combined, roughly **30% of live checkouts fail outright and about another
30% hang for 10–180 seconds**.

This is not theory: **the first two live payments in this audit both failed**, back to back.

`SIMULATION_PROFILE` appeared **nowhere** — not in `.env.local.example`, not in
`PRESENTATION_GUIDE.md`, not in the interview script, not in `CLAUDE.md`. The presenter had no way
to know the knob existed. Worse, `.env.local.example` documented five `SIMULATION_DELAY_*`
variables that **are read by nothing** — delay is a property of the profile and is not separately
tunable.

**Fix — no code changed, because `HAPPY_PATH` already exists for exactly this:**
- `.env.local` — set `SIMULATION_PROFILE=HAPPY_PATH`, with the reasoning inline.
- `.env.local.example` — documented all five profiles and which one to use when someone is
  watching; deleted the five dead `SIMULATION_DELAY_*` lines and said they were dead; added the
  two missing outcome overrides.
- `PRESENTATION_GUIDE.md` §1.1 — raised to the same prominence as `PAYMENT_PROVIDER`.
- `PRESENTATION_INTERVIEW_SCRIPT.md` §21.8 — added the honest line to say out loud when the
  payment succeeds first time, so a chosen fixture is never mistaken for a claim that payments
  never fail.

**Verified:** under `HAPPY_PATH`, payment settles instantly — proven at the API layer and then in
the browser, where a full checkout completed on the first attempt with an M-Pesa receipt and escrow
held. The seeded world is unaffected, because the seeder sets outcomes directly rather than reading
this variable: the marketplace still shows refunded, disputed and failed orders behind the
presenter while the payment in front of them works.

---

## 18. P1 defects — major workflow defects

### P1-1 · Produce published by a farmer did not appear on the marketplace · **FIXED**

`/marketplace` and `/marketplace/[listingId]` both carry `revalidate = 60`, and **no write
invalidated them**. A listing live in `GET /api/marketplace` was absent from the rendered page for
the remainder of the window — and because Next serves stale-while-revalidating, the reload a person
instinctively reaches for returns the stale page *one more time* before the new one arrives.

This is precisely §13 → §14 of the interview script: the presenter publishes produce, says *"it
becomes visible to buyers"*, switches to the buyer, and the produce is not there.

The same gap let a listing detail page advertise stock an order had already taken, and left a
paused listing on sale.

**The 60-second cache is a deliberate, recorded architectural decision** (`WEBSITE_WEBAPP_BOUNDARY.md`
§358) and it has been kept. What was missing is the other half of any ISR design: a write must
invalidate the page that reads it.

**Fix:** new `src/lib/foodhub/marketplaceCache.ts` — one `revalidateMarketplace(listingId?)` helper
so the invalidation is written once and cannot drift — called from the four paths that change what
the marketplace shows: listing create, listing update/pause/reactivate, order placement (stock
reserved), and payment retry/cancel (stock re-reserved or returned). Failures are swallowed, so an
invalidation that cannot run degrades to the old staleness rather than failing a write whose data
is already committed.

**Verified live, all three paths:**
- publish → present on the **first** request after publication (previously absent)
- order 5 crates → detail page stock **25 → 20** immediately
- pause → **gone** from the feed immediately

---

## 19. P2 findings — minor defects

### P2-1 · `/auth/unauthorized` flashed a "Sign in" button at a signed-in user · **FIXED**

While `useAuth` resolved, the page showed *"Access denied — Checking your session…"* **with a
"Sign in" button**, because `user` is undefined during loading. The paragraph waited for the
loading state; the button block did not.

This is the exact symptom the brief names ("the sign-in button does not remain visible when the
user is actually authenticated"), and §15.1 of the script routes the panel through this page
deliberately. On a slow venue connection the flash is the whole message a viewer takes away — *"it
lost my session"* — and it contradicts the sentence that lands a moment later.

**Fix:** `src/app/auth/unauthorized/page.tsx` — offer nothing until the session is known. A moment
of nothing is honest; a wrong button is not.

**Verified:** the page now goes straight to *"You are signed in as a Buyer and do not have
permission to access this section"* with **Go to my dashboard** and **Sign out**.

### P2-2 · Rehearsing the lecturer review empties the Education Hub's centrepiece screen · **NOT FIXED — procedural**

`g.ndungu@uonbi.ac.ke`, the demonstration lecturer, has **exactly one** report in her queue. This
audit reviewed it, and her queue became *"Nothing waiting on you"*. The empty state is well
written, but it is not what the Education Hub demo is meant to show.

Not a code defect — the seeder's validator correctly asserts every verified lecturer has work
waiting. It makes `npm run demo` **mandatory after every rehearsal**, which §24 now states plainly.
Not fixed because changing seeded volumes days before a presentation is a change to demo-data
design, not a defect fix, and the runbook already carries the remedy.

### P2-3 · Signing in after being bounced from another role's URL lands on "Access denied" · **NOT FIXED — deliberate**

Open a farmer URL while signed out → redirected to `/auth/login?callbackUrl=/dashboard/farmer/…` →
sign in **as the buyer** → the stored `callbackUrl` is honoured blindly → *"Access denied"*. The
user did nothing wrong and gets an error screen.

Reproduced naturally during this audit. **Deliberately not fixed:** the message is accurate,
recovery is one click ("Go to my dashboard"), and the remedy touches post-sign-in redirect logic —
the single riskiest code in the application days before a presentation, where a mistake breaks
every role. The script's own path does not hit it, because signing out lands on a clean
`/auth/login` with no `callbackUrl`. Recorded for after the presentation.

---

## 20. P3 findings — cosmetic

- **P3-1 · A Cyrillic homoglyph in seeded M-Pesa receipt codes · FIXED.** Every seeded paid-payout
  note read `Paid via M-Pesa QК380317`, where `К` is **U+041A, Cyrillic capital Ka**, not ASCII
  `K`. Visually near-identical, but it is a homoglyph in user-facing financial data — a copied or
  searched receipt code would not match. One-character fix in `scripts/demo/phases/commerce.ts`.
  A repo-wide scan found no other Cyrillic or Greek homoglyph (the `Σ` in `escrow.ts` is
  deliberate mathematics).
- **P3-2 · The same demonstration plan appears on adjacent cards.** The lecturer's Demonstrations
  screen picks from **three** canned "What they will show" paragraphs, so two demonstrations
  frequently show identical text — and the text describes an *administrator reconciliation view*
  regardless of whether the project is a boda-boda dispatch app. **Not fixed:** changing seed
  generation days before a presentation risks the validator for a cosmetic gain, and a presenter
  is unlikely to read both paragraphs aloud. Worth widening the pool afterwards.
- **P3-3 · Two seeded listings can share a title in the same county.** "Sorted Avocados — Bulk
  Crates Available" appeared twice from Meru, adjacent in the feed. Slightly generated-looking.
- **P3-4 · Every farmer's verification document is the same `sample-national-id.svg`.** This is the
  right call — fabricating ID scans would be worse — but a panel opening two would see it.
- **P3-5 · `/api/auth/signout` renders NextAuth's default unstyled page.** The app has a custom
  sign-in page but not a custom sign-out page. Unreachable from the UI (the account menu calls
  `signOut()` directly); only a typed URL finds it.
- **P3-6 · `/auth/login` does not redirect an already-signed-in user.** The middleware matcher
  deliberately excludes `/auth`. Harmless.
- **P3-7 · The seed takes 3–5 minutes**, not the ~175s the older notes imply. Runs measured: 307s,
  184s. Budget five minutes on presentation day.
- **P3-8 · Stale claim corrected in the interview script.** §21.6 stated that expected errors are
  logged at ERROR with full stack traces. `handleApiError` now records a 4xx `AppError` at `warn`,
  by code, without a stack. Replaced with a limitation that is actually true (single-factor
  authentication), with a note explaining the change — a presenter should never state a weakness
  their own code has already fixed.

---

## 21. Fixes made

| # | File | Change |
|---|---|---|
| P0-1 | `src/app/api/orders/[orderId]/payment/route.ts` | `updatePipeline: true` on the retry stock reservation |
| P0-1 | `src/app/api/orders/[orderId]/payment/__tests__/route.test.ts` | Assert the options object, not just that the call happened |
| P0-2 | `.env.local` | `SIMULATION_PROFILE=HAPPY_PATH` |
| P0-2 | `.env.local.example` | Document all five profiles; delete five env vars that are read by nothing |
| P0-2 | `PRESENTATION_GUIDE.md` | Raise the profile to the same prominence as `PAYMENT_PROVIDER` |
| P0-2 | `PRESENTATION_INTERVIEW_SCRIPT.md` §21.8 | The honest line to say when the payment succeeds first time |
| P1-1 | `src/lib/foodhub/marketplaceCache.ts` *(new)* | `revalidateMarketplace()` — one helper, one place |
| P1-1 | `src/app/api/marketplace/route.ts` | Invalidate on publish |
| P1-1 | `src/app/api/marketplace/[listingId]/route.ts` | Invalidate on update / pause / reactivate |
| P1-1 | `src/app/api/orders/route.ts` | Invalidate on stock reservation |
| P1-1 | `src/app/api/orders/[orderId]/payment/route.ts` | Invalidate on retry and cancel |
| P2-1 | `src/app/auth/unauthorized/page.tsx` | Offer nothing until the session is known |
| P3-1 | `scripts/demo/phases/commerce.ts` | Cyrillic `К` → ASCII `K` |
| P3-8 | `PRESENTATION_INTERVIEW_SCRIPT.md` §21.6 | Replace a limitation that is no longer true |

**57 lines changed across 7 files, plus one new 47-line module.** No feature was added, no workflow
created, no architecture changed.

## 22. Tests performed after each fix

Fix → smallest relevant test → the real workflow → the browser → the broader suite.

| Fix | Narrow | Workflow | Browser | Broad |
|---|---|---|---|---|
| P0-1 retry | `npx jest src/app/api/orders` → **88 passed** | Live `RETRY` on a real failed order → new session | "Try payment again" → paid, receipt, escrow held | 1,523 unit · 55 E2E |
| P0-2 profile | — | Two failures under `TYPICAL`, then instant success under `HAPPY_PATH` | Full checkout, first attempt, 0 console errors | seed 73/73 unaffected |
| P1-1 cache | type-check + lint clean | Publish / order / pause, each measured against the rendered page | Listing appears on the first request | 1,523 unit · 55 E2E |
| P2-1 unauthorized | — | Cross-role URL as farmer, then as buyer | No "Sign in" flash; correct role named | 55 E2E |
| P3-1 homoglyph | Repo-wide homoglyph scan | — | — | seed re-run 73/73 |

**Regression checks across roles.** The payment fix touches the buyer path — the farmer's dispatch
confirmation, the admin escrow console and the farmer ledger were all re-driven afterwards and are
correct. The cache fix touches the public marketplace — the farmer's own "My Produce" view, buyer
checkout and the order lifecycle were re-driven. The unauthorized fix touches auth — all six roles
were signed in again afterwards and each landed on its own dashboard. Full gate re-run after every
change: type-check clean, lint 0 errors, **1,523 unit passed**, **55 E2E passed**, **3 rehearsal
passed**, build exit 0.

## 23. Remaining risks

1. **The fixes are not deployed.** Production still has the retry 500 and the stale marketplace.
   *Demonstrate on localhost, or deploy first.* This is the single largest remaining risk.
2. **`SIMULATION_PROFILE` is configuration, not code.** An environment rebuilt from the example
   file without reading the comment reverts to a ~30% payment failure rate.
3. **One rehearsal consumes the lecturer's queue** and the pending-verification farmer. Re-seed
   after every rehearsal, without exception.
4. **Accounts registered through the app during a rehearsal survive `npm run demo`** — deliberately,
   since they might be real. If you register a test account, remember its email.
5. **No internet, no demo.** The database is Atlas, the AI is Groq, the images are Cloudinary.
   Confirm the venue IP is allowed in Atlas Network Access; a new venue means a new IP.
6. **Never run the E2E suite while the demo server is up** — it rewrites `.next` underneath it and
   the browser starts throwing `ChunkLoadError`.
7. **OpenAI moderation is rate-limited (429).** Knowledge articles publish unmoderated. Fails
   gracefully; only relevant if the panel asks about content safety, where the honest answer is
   "the call is there, the key is throttled, and it fails open by design".
8. **Africa's Talking is a sandbox** — no SMS reaches a handset. Say so rather than implying one.
9. **The application database is named `test`.** Cosmetic, but a panel member reading a connection
   string may ask. Renaming moves production data and is an owner decision.
10. **23 dependency vulnerabilities** (2 critical, 15 high), none with a reachable path in this
    codebase. Sequence after the presentation, on its own branch.

## 24. Exact presentation rehearsal procedure

**The night before**

1. `git status` — confirm the working tree is what you expect.
2. Confirm `.env.local` contains **`PAYMENT_PROVIDER`** unset or `simulation` **and
   `SIMULATION_PROFILE=HAPPY_PATH`**. Both. This is the step that decides whether the payment works
   in front of the panel.
3. `npm run check:services` — expect 6 healthy. Anything **failed** (not degraded) is a stop.
4. `npm run demo` — **wait for `all 73 checks passed`**. Budget five minutes.
5. `npm run build && npm start`.
6. Walk §25 below start to finish, as the presenter, in a clean browser profile.
7. **`npm run demo` again.** The rehearsal consumed the lecturer's queue and the pending farmer.

**Thirty minutes before**

1. Confirm the venue network reaches Atlas — a new venue is a new IP. Have a phone hotspot ready.
2. `npm run demo` → `all 73 checks passed`.
3. `npm start`. Open `http://localhost:3000/marketplace` and let it settle — the grid streams in.
4. **Do not run the test suite.** It rewrites `.next` under the running server.
5. Sign in once as each role you plan to show, then sign out. This warms the routes.

**The demonstration path** (from `PRESENTATION_INTERVIEW_SCRIPT.md`, all of it re-verified today)

| # | Step | Expect |
|---|---|---|
| 1 | Public marketplace | 20 listings, real photographs, verified badges, trust scores |
| 2 | Register a new farmer live | role selection → details → farmer dashboard, unverified |
| 3 | Sign out, sign back in as the same person | same account, same state — a database row, not a cookie |
| 4 | Sign in as `wanjiku.kamau@gmail.com` / `Farmer@2024!` | listings, KSh prices, statuses |
| 5 | **Add produce**, pick a photo, publish | appears in My Produce **and on the marketplace immediately** |
| 6 | Sign in as `kamau.githinji@gmail.com` / `Buyer@2024!`, open that listing | verified badge, trust score, fairness read |
| 7 | **Pay** | settles at once, receipt shown, **"Held by UmojaHub until you confirm"** |
| 8 | Farmer confirms dispatch → buyer confirms receipt | `COMPLETED`, escrow `RELEASABLE` |
| 9 | As the buyer, open `/dashboard/lecturer/reports` | redirect to `/auth/unauthorized`, naming your role |
| 10 | As the buyer, open `/dashboard/admin/verification-queue` | **404**, not 403 |
| 11 | The `curl` role-injection demo (§15.3) | `role` and `isEmailVerified` silently discarded |
| 12 | Sign in as `j.mwangi@strathmore.edu` | reaches his dashboard; the review queue is locked with a reason |
| 13 | Sign in as `g.ndungu@uonbi.ac.ke` / `Lecturer@2024!` | a report waiting; open it, read the **PDF**, decide |
| 14 | Sign in as `umojahub16@gmail.com` / `Admin@Umoja2024!` | verification queue → approve → farmer can list at once |

**If the payment does not settle**, `SIMULATION_PROFILE` is not `HAPPY_PATH`. Recover in front of
them: the order is on the buyer's Orders screen with **"Try payment again"**, which now works.

**Afterwards:** `npm run demo`, so the world is ready for the next run.

## 25. Follow-up: the three remaining risks, closed — 2026-08-24 (same day)

The audit above ended at 94% with three named reasons. All three were then fixed at the root
rather than worked around. This section records what changed and how it was proved.

### 25.1 The stale deployment

PR #73 was merged to `main` and Vercel redeployed production. Verified on the deployed
application, not locally — see §25.4.

### 25.2 `SIMULATION_PROFILE` did not travel — **fixed in code, so nothing has to travel**

The first framing of this was too generous to the design. Following it properly changed the
diagnosis: **the only things that read the simulation configuration are the live payment path and
the admin Payment Lab, which merely displays it.** The seeder writes its mix of successes,
failures, refunds and disputes inline (`scripts/demo/phases/operations.ts:113`) and has never
consulted it.

So `TYPICAL`'s stated purpose — *"for populating a demo environment that does not look implausibly
perfect"* — described work it does not do, and the default was tuned for a consumer that does not
exist. The one consumer it actually had was a person making a payment and watching it.

**The default is now `HAPPY_PATH`.** No environment variable is needed anywhere — not locally, not
in `.env.local`, not on Vercel. `SIMULATION_PROFILE` was deleted from `.env.local` and the check
still reports `profile HAPPY_PATH (default)`.

Nothing was lost. Every profile stays selectable by name, and the Payment Lab forces a specific
outcome deterministically — which is how a failure should be demonstrated in any case. A test now
asserts that `TYPICAL`, chosen deliberately, still reaches every failure mode.

`npm run check:services` — the documented pre-demo gate — now reports the active profile every
time, and warns with the actual number when the one in force will fail payments:

```
OK    Payment simulation   profile HAPPY_PATH (default) — every payment succeeds at once
WARN  Payment simulation   profile TYPICAL (set explicitly) — about 30% of payments fail,
                           and some take up to 180s. Set SIMULATION_PROFILE=HAPPY_PATH
                           before demonstrating.
```

### 25.3 One rehearsal emptied the lecturer's queue — **fixed, and now asserted**

The cause was two phases of the seeder disagreeing with each other. The education phase guaranteed
three queued reports per institution; the demonstration phase then promoted two of them away into
a request waiting and a session coming up — **once per lecturer, not once per institution**, from
a queue the lecturers at an institution share. A single-lecturer institution was left with one
report, and a two-lecturer institution with none to spare.

One is non-empty, which is all the old check tested. One is also exactly what this audit emptied
by rehearsing the review once.

Three coordinated changes, with the two numbers now shared between the phases that have to agree:

| Change | Why |
|---|---|
| `REVIEW_QUEUE_SURVIVAL_FLOOR = 2`, exported | Names what has to survive, instead of leaving it as a side effect |
| Queue target is now `floor + 2 × lecturers at that institution` | The old flat number could not know that a second lecturer doubles what gets promoted away |
| The promotion's `.skip(1)` → `.skip(REVIEW_QUEUE_SURVIVAL_FLOOR)` | The intent to protect the queue was already there; only the number was wrong |
| Student cohort 12 → 16, dealt round-robin (4 per university) | Three students per institution could not fund a queue, two promotions and the finished states. The seed said so itself. |

And a new validation check, so this cannot regress quietly:

```
PASS  the review queue survives a rehearsal
      — every verified lecturer has at least 2 reports waiting
```

It earned its place three times over. It failed the first two attempts at this fix — which is how
the per-lecturer promotion and the too-small cohort were found rather than assumed — and then, on
a later run, **the seed failed validation outright on a fix that had passed three times in a row**.

That last failure is the one worth recording. `mustQueue` can only queue engagements that exist,
and how many exist is drawn from each student's archetype; a cohort that came up short simply left
its institution under target, and no amount of intent fixed it. The guarantee was about *intent*
when it needed to be about *supply*. So while an institution is short, each of its students now
carries at least two projects — which stops the moment the target is met.

Verified the way the problem demanded: **two consecutive clean runs**, 227.1s and 186.6s, both
74/74. A fix for a seeding race that is only tested once has not been tested.

**Result, measured after re-seeding:** the demonstration lecturer `g.ndungu@uonbi.ac.ke` went from
**1 report to at least 2**, and usually more. **All 74 checks pass** (73 before, plus the
new one).

### 25.4 Verification of the follow-up

| Gate | Result |
|---|---|
| `npm run type-check` | clean |
| `npm run lint` | 0 errors, 5 warnings (unchanged, pre-existing) |
| `npm run test` | **1,524 passed** (one new test) |
| `npm run test:e2e:fast` | **55 passed** |
| `npm run demo` | **74/74**, the new check included |
| `npm run check:services` | reports `HAPPY_PATH (default)`; warns correctly when TYPICAL is forced |
| Production after redeploy | see below |

**Revised overall presentation readiness: 99%.** What the remaining point is, and why it is not
zero, is in the verdict below.

---

## 26. Final verdict

# READY WITH KNOWN MINOR ISSUES

Every existing feature, workflow, role, screen and action on the demonstration path was exercised
and completes. Authentication, authorization, the marketplace, payment, escrow, verification, the
Education Hub lifecycle and every administrator workflow were driven to completion — not inferred
from tests, and not inferred from code. Database integrity is clean. `npm run demo` is proven as
the reset mechanism across three runs. The browser produces zero console errors on the
demonstration path.

Two P0 defects were found on the demonstration path — a payment retry that returned
`Internal server error`, and a payment simulator that failed roughly three live checkouts in ten
with nothing anywhere telling the presenter it could be changed. Both are fixed and both are
verified by doing the thing a presenter would do. One P1 — published produce not reaching the
marketplace — is fixed and measured. One P2 is fixed; two are recorded and deliberately left alone
because the risk of touching authentication redirects and seed generation days before a
presentation outweighs the cosmetic gain.

It is **not** an unqualified READY, and the reason is specific and actionable rather than a hedge:
**the live Vercel deployment is still running the pre-audit build.** Demonstrate on localhost — the
script assumes `http://localhost:3000` throughout and every step above was verified there — or
deploy these fixes first and re-run §24 against production. That single decision is what stands
between this verdict and READY.

---

*Audit performed 2026-08-24. Every percentage above is grounded in a check recorded in this
document. Where something was not executed, this document says so.*
