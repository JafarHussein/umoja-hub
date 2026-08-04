# Post-Presentation Stabilization — Workflow Audit

**Date:** 2026-08-04
**Scope:** Authentication lifecycle, onboarding funnel, payment visibility, escrow visibility, email correctness, cross-role coverage.
**Status:** Audit only. No implementation has begun.

This document maps the workflows behind the five reported issues, identifies the
architectural cause of each, and proposes corrections. It deliberately reports
where the reported symptom is *worse* than assumed and where it is *better* than
assumed — both matter for deciding what to build.

---

## 0. Headline finding

**Three of the five reported issues (1, 4 and 5) are the same defect.** They are
not three bugs. They are one architectural decision observed from three angles:

> The onboarding funnel is a closed corridor. It is mandatory, all-or-nothing,
> and has no exit — not forward without a document upload, not sideways to the
> public product, and not backwards out of the session.

The three symptoms it produces:

| Symptom | Reported as |
|---|---|
| A user mid-funnel has no sign-out control on any screen they can reach | **Issue 1** — logout failed |
| A user mid-funnel cannot reach the marketplace, prices, or any dashboard | **Issue 5** — blocked after registration |
| A user who cannot leave and cannot skip **fabricates data to get through**, and the platform then reports the fabrication back to them as fact | **Issue 4** — incorrect email |

The third of those is confirmed by the database record of the account that
received the wrong email — see Issue 4. It is the strongest evidence in this
document that the corridor, not any individual screen, is the thing to fix.

Everything else here is secondary to that.

---

## ISSUE 1 — Logout failed

### Current behaviour

A signed-in user could not sign out.

### Why it happens

Sign-out is implemented, and correctly, in nine places:

| Surface | File |
|---|---|
| Farmer / Buyer / Student / Lecturer / Admin / NGO / Employer / Institution shells | `src/app/dashboard/*/_components/*Shell.tsx` (e.g. `FarmerShell.tsx:88`) |
| Access-denied screen | `src/app/auth/unauthorized/page.tsx:29` |
| Legacy null-role shell | `src/components/shared/LayoutWrapper.tsx:24` |

Every one of those lives **inside `/dashboard/*`** — a surface the affected user
could not reach.

The gate is `src/middleware.ts:170-173`:

```ts
if (role === null || !isOnboarded) {
  const target = onboardingPathForStage(stage);
  if (!onOnboarding) {
    return NextResponse.redirect(new URL(target, req.url));
  }
```

Any account that has not reached `OnboardingStage.COMPLETED` is redirected from
every dashboard route back into the funnel. And the funnel's shared chrome,
`src/app/onboarding/_components/OnboardingShell.tsx`, contains **no sign-out
control, no account menu, and no link to any other part of the product**. Its
only interactive elements are the current step's form fields.

The escape routes that appear to exist do not work:

- `/auth/login` is reachable (it is in `EXEMPT_PREFIXES`, `middleware.ts:55`) but
  it does not detect an existing session and offers no way to end one. Signing in
  again with the same provider returns the user to the same funnel position.
- The public marketplace is reachable by URL, but `AccountNav`
  (`src/components/app/AccountNav.tsx:64`) renders only the user's first name
  linking to `homeForRole(role)` — which for a null role points back at the
  funnel. No sign-out there either.

### Root cause

**Session termination is modelled as a dashboard feature rather than as a
property of the session.** The control was placed in the role shells because
that is where the design put the account menu; nobody asked what a user does
when they hold a session but have no role, and therefore no shell.

The middleware and the sign-out affordance have inverted preconditions: the
middleware activates precisely when `role === null || !isOnboarded`, and the
sign-out control exists precisely when that is false.

### Correct production behaviour

Sign-out must be available from **every authenticated surface**, without
exception, because it is the universal escape hatch from a broken state. A user
holding a session must always be able to end it in one click, from wherever they
are.

Specifically:
- Every onboarding step carries a visible way out.
- `/auth/login` recognises an existing session and offers "You are signed in as
  X — sign out and use a different account".
- Public headers offer sign-out to authenticated users, not just a dashboard link.

### Proposed solution

1. Add a single `SessionMenu` client component (account identity + sign out) to
   `src/components/app/`.
2. Mount it in `OnboardingShell` header, in `AccountNav` (authenticated branch),
   and reuse it in the role shells so there is one implementation.
3. Make `/auth/login` session-aware: if `useSession()` is authenticated, show
   the signed-in identity with "Sign out" and "Continue as X" instead of
   silently presenting a fresh login form.

This is additive. No middleware change is required for Issue 1 alone.

### Impact on other roles

Positive and uniform — all eight roles gain a consistent account control. The
existing per-shell `signOut` buttons are replaced by the shared component, which
removes eight copies of the same three lines.

### Risk of regression

**Low.** `signOut()` semantics are unchanged; only the mounting points expand.
The one thing to verify is that adding `useSession()` to `AccountNav`'s consumers
does not force any statically-cached public page to become dynamic — `AccountNav`
is already a client component for exactly this reason, so the pattern is proven.

---

## ISSUE 5 + ONBOARDING — Farmer is blocked immediately after registration

### Current behaviour

A newly registered farmer cannot explore anything. They are held in the funnel
until they produce an identity document.

### Why it happens

The V3 funnel is `PASSWORD_SETUP → ROLE_SELECTION → IDENTITY_INPUT →
VERIFICATION_UPLOAD → COMPLETED` (`src/types/index.ts:38-43`). Two properties
combine badly:

1. **`COMPLETED` is the middleware's only "you may use the product" signal.**
   `middleware.ts:170` gates on `!isOnboarded`, which is
   `onboardingStage === COMPLETED` (`src/lib/auth/options.ts:400`).

2. **`COMPLETED` cannot be reached without a document upload.**
   `src/app/onboarding/verification-upload/page.tsx:259`:
   ```ts
   const canSubmit = uploadState === 'done' && fileUrl !== '' && farmerReady && !isLoading;
   ```
   There is no skip and no defer. `POST /api/onboarding/verification`
   (`route.ts:86`) is the only writer of `onboardingStage: COMPLETED` for
   FARMER / BUYER / LECTURER, and it requires a validated Cloudinary URL.

So identity verification — a *restricted-action* prerequisite — has been welded
to *account activation*. A farmer without their ID to hand at signup is locked
out of the entire product, including the parts that need no verification at all.

Note the internal contradiction this creates: the funnel's own copy already
promises the opposite. `verification-upload/page.tsx:323` reads *"You can start
using UmojaHub right away, and an administrator reviews your documents
separately."* — displayed on the screen that prevents exactly that.

The platform already has the correct mechanism, unused for this purpose:
`VerificationLockout` (`src/components/shared/VerificationLockout.tsx`), already
wired into `src/app/dashboard/farmer/listings/page.tsx:194`, gates *publishing*
on `farmerData.verificationStatus`. That is the right gate in the right place.
The funnel duplicates it one layer too early and much more harshly.

### Root cause

**Two different questions are answered by one flag.** "Has this person told us
who they are?" (account setup) and "Has an administrator confirmed who they
are?" (trust) are collapsed into `onboardingStage`. Because the middleware reads
that single flag, an unfinished *trust* step presents as an unfinished *account*.

### Correct production behaviour

Account activation completes when the platform knows who the user is and what
they came to do — i.e. after `IDENTITY_INPUT`. From that moment the user has a
real dashboard and full read access to the public product: marketplace, search,
listings, prices, other farmers, knowledge base.

Verification is then demand-driven, triggered by the first restricted action:

```
Create Produce → profile incomplete for publishing → launch verification
→ collect documents → PENDING → admin approval → publishing unlocked
```

### Proposed solution

1. **Split the flag.** Make `IDENTITY_INPUT` completion set
   `onboardingStage: COMPLETED`. Verification state already lives on its own
   axis (`farmerData.verificationStatus`, `buyerData.verificationStatus`,
   `lecturerData.isVerified`) and already drives the lockout components — no new
   field is needed.
2. **Convert `/onboarding/verification-upload` from a funnel step into a
   destination.** Same screen, same API, reached from the lockout CTA rather
   than from a forced redirect. Keep it reachable from the profile page so a
   user can volunteer verification before hitting a wall.
3. **Extend `VerificationLockout` coverage** to every restricted action, not just
   the listings page, so the wall is consistent and always explains itself.
4. **Give the funnel a "Look around first" exit** on every step, pointing at
   `/marketplace`.

### Impact on other roles

- **FARMER / BUYER / LECTURER** — all three currently terminate the funnel at
  `VERIFICATION_UPLOAD` and all three are freed by this change.
- **STUDENT** — verifies by institutional email PIN, not document upload
  (`verification-upload/page.tsx:57`). Same treatment: the PIN step becomes
  demand-driven, gating portfolio publication rather than login.
- **ADMIN** — unaffected (bootstrapped straight to `COMPLETED`,
  `src/lib/auth/options.ts:331`).
- **NGO / EMPLOYER / INSTITUTION** — these roles have dashboards and shells but
  are **not selectable in `roleSelectionSchema`** and have no funnel branch.
  They are reachable only via direct seeding. See §6.
- **Admin verification queues** see *more* submissions arriving over time rather
  than all at signup. Queue logic is unchanged; volume distribution shifts.

### Risk of regression

**Medium — this is the highest-risk item in this document.** It changes an
authorization-adjacent invariant.

Specific risks and mitigations:
- Any code path assuming `isOnboarded === verified` would now be wrong. **Audit
  every read of `isOnboarded` and `session.user.isVerified` before changing the
  writer.**
- Existing accounts sitting at `VERIFICATION_UPLOAD` need a migration decision:
  advance them to `COMPLETED` (recommended — they have already given their
  details) or leave them.
- The middleware's redirect-loop history (`middleware.ts:176-187` documents a
  prior loop caused by JWT stage lagging the DB row) means any change here must
  be tested against a stale token, not just a fresh one.

---

## ISSUE 4 — Incorrect emails

> **CONFIRMED FROM THE DATABASE RECORD, 2026-08-04.** My first hypothesis
> (a `notifyAdmins` fan-out reaching an administrator) was **wrong** and is
> retracted. The account was `jafarhussein251@gmail.com`, role BUYER. The real
> cause is worse and more interesting: the email was *technically accurate and
> substantively false*, and it is the same root cause as Issues 1 and 5.

### The evidence

Read-only query against the account:

```
email:            jafarhussein251@gmail.com
role:             BUYER
oauthProvider:    google
createdAt:        2026-08-03T03:02:23Z
onboardingStage:  COMPLETED  (at 03:05:18Z — 2m55s after account creation)

buyerData.organizationName:           "NOT APPLICABLE"
buyerData.businessRegistrationNumber: "NOT APPLICABLE"
buyerData.taxComplianceCertificate:   ".../umojahub/verification/t0cyqlbisteptynuch3g.png"
buyerData.verificationStatus:         PENDING

notifications:
  03:03:09  WELCOME               "Your account is ready. Browse verified produce…"
  03:05:18  VERIFICATION_UPDATE   "We have received your tax compliance certificate…"
```

That record tells the whole story. A private individual signed up as a buyer.
The funnel required an organisation name, a business registration number, and a
KRA tax compliance certificate. They had none of the three. So they typed
**"NOT APPLICABLE" into two required fields** and uploaded **a PNG** to get past
the wall — because the wall has no other side. Ninety seconds later the platform
emailed them to say it had received their tax compliance certificate.

The user's report — *"I never uploaded anything [of the sort]"* — is correct.
They never had a tax compliance certificate. They were required to produce one
anyway.

### Why it happens

Two failures, one after the other.

**1. The funnel demands artifacts only some users possess, with no way to say
"this does not apply to me."**

`src/lib/validation/onboardingSchema.ts:125-126` makes both business fields
mandatory for *every* buyer:

```ts
organizationName: z.string().trim().min(2, 'Organisation name is required').max(120),
businessRegistrationNumber: z.string().trim().min(2, 'Registration number is required').max(60),
```

There is one buyer archetype in the model — a registered business — and the
product serves at least two. An individual household buyer has no lawful value
to enter, and the form accepts no answer except a fabricated one. `min(2)` is
satisfied by "NOT APPLICABLE" exactly as well as by a real company name.

**2. Validation checks the shape of an artifact, never its identity.**

`onboardingSchema.ts:179-182`:

```ts
export const buyerOnboardingVerificationSchema = z.object({
  taxComplianceCertificate: z.string().regex(/^https:\/\/res\.cloudinary\.com\//, ...),
});
```

The only question asked is *"is this a Cloudinary URL?"* Any image of anything
passes. The field name then travels downstream as though it were a fact, and
`src/app/api/onboarding/verification/route.ts:96-106` renders it into prose:

```ts
const credential = user.role === Role.BUYER ? 'tax compliance certificate' : …
body: `…We have received your ${credential} and an administrator will review them shortly.`
```

So the system asserts, in writing, that it holds a document it has never
inspected and the user never claimed to have.

### Root cause

**The platform states as fact what it merely coerced.**

The email is not mis-routed and the template is not cross-wired — I verified both
(and separately confirmed that demo seeding cannot reach an inbox: `scripts/demo/helpers.ts:99`
writes `Notification` documents through the batch inserter and never calls `notify()`).
The email faithfully reports the contents of a database field. The field is a lie,
and the funnel is what made it one.

This is the same defect as Issues 1 and 5, in its third disguise: **a mandatory
corridor with no exit produces false data, because a user who cannot leave and
cannot skip will fabricate whatever gets them through.** The absent affordance is
identical in all three cases — there is no way out, no way to defer, and no way
to answer "not applicable".

A secondary, genuine weakness remains, though it is not what bit here:
`notify()` is a generic prose pipe with no event registry — correctness lives in
strings hand-written at ~20 call sites, `nextStep` is keyed only on
`NotificationType` (`notify.ts:26-35`), and the footer *"You received this email
because of activity on your UmojaHub account"* (`emailTemplates.ts:119`) is false
for every `notifyAdmins` broadcast. Worth fixing; not the cause of the reported
email.

### Correct production behaviour

- A buyer declares whether they are an individual or a business, and is asked
  only for what that answer implies. Individuals are never asked for a
  registration number or a KRA certificate.
- Verification is demand-driven (see Issue 5). A buyer who never needs elevated
  limits is never asked for a certificate at all.
- Every document request states what it is for and offers "I don't have this
  yet" as a first-class answer that defers rather than blocks.
- The platform describes documents by what it actually knows: *"a document you
  uploaded"* until an administrator has confirmed what it is — never *"your tax
  compliance certificate."*
- Email prose is generated from an event registry, not written inline.

### Proposed solution

1. **Add a buyer-type branch** at `IDENTITY_INPUT` (individual | business) and
   make the business fields conditional on it — a discriminated union in
   `onboardingSchema.ts`, so the type system enforces that individuals are never
   asked.
2. **Reject placeholder answers.** A shared refinement rejecting `n/a`, `none`,
   `not applicable`, `nil`, `-`, `.` on identity-bearing text fields, with an
   error that points at the real fix ("Choose 'Individual buyer' if this doesn't
   apply").
3. **Stop asserting unverified document identity.** Acknowledgement copy says
   "your document is with our review team"; only after admin approval does any
   message name the document type.
4. **Introduce `src/lib/notifications/events.ts`** — a typed registry keyed by
   event, declaring audience (`SUBJECT` | `ADMIN`), template and variables.
   Convert the ~20 call sites; delete inline prose. Give `notifyAdmins` an
   operational template with a truthful footer.
5. **Add a table test** asserting event → recipient → subject/body, so copy can
   never again reach the wrong audience silently.

### Data already affected

One live record carries fabricated business details
(`jafarhussein251@gmail.com`). A migration should null the placeholder fields
rather than leave "NOT APPLICABLE" presented to an administrator as a company
name. Two seeded farmers sit at `VERIFICATION_UPLOAD` — those are demo fixtures
(`provider=undefined`, backdated, `createdAt === updatedAt`), not trapped users.

### Impact on other roles

The buyer-type branch touches BUYER onboarding only. The event registry touches
all roles' email wording. Admin verification queues begin receiving documents
whose stated type is trustworthy, which is the point.

### Risk of regression

**Low-to-medium.** `notify()` never throws by design (`notify.ts:129`), so a
registry miss degrades to a logged error rather than a broken operation; the
mechanical risk is a missed call site, which the table test closes. The schema
branch changes a validated contract — existing buyer records must keep parsing,
so the business fields become optional rather than removed.

---

## ISSUE 2 — Payment simulation does not feel real

### Current behaviour — more exists than the brief assumes

`src/components/marketplace/CheckoutPanel.tsx` already implements:

- STK-push-sent card with pulse indicator (`:192`)
- Payment detail rows — payee, amount, phone, reference (`:186`)
- A live 90-second countdown with a draining progress bar (`:214`)
- Polling every 3s against `/api/orders/[orderId]/payment-status` (`:104`)
- Distinct terminal states: `paid`, `failed`, `timeout`,
  `inventory_unavailable`, `error` — each with its own copy and a retry
- A confirmed-payment receipt card with an escrow explainer (`:236`)
- A three-step "how your payment is protected" panel on the form (`:482`)

### The actual gap

**Everything before the STK push is a single button label.** From submit to
"STK push sent", the entire sequence — order creation, escrow session
establishment, provider dispatch — is represented by `'Placing order…'`
(`CheckoutPanel.tsx:478`). The states the brief asks for (initialized, secure
session created, request sent) genuinely do not exist in the UI.

**The simulation's own richness is invisible.** `simulationProvider.ts` models
a scheduled outcome, a randomized delay, a realistic 10-character M-Pesa receipt
number, and duplicate-callback behaviour. None of it surfaces. The buyer sees a
spinner, then a result — the same as a mock would produce.

**The failure taxonomy is flattened.** `SimulatedOutcome` distinguishes real
Daraja failure modes; the UI collapses every non-success to
`'Payment was declined.'` (`:297`).

### Root cause

The checkout was built to a **request/response** model (submit → await → render
outcome) rather than a **payment-session** model (a session with observable
states that both parties can watch progress through). The backend already
produces a state stream — `PaymentEventLog` rows, `SimulatedPayment.status`
transitions — and the UI subscribes to none of it, polling only for a terminal
`paymentStatus`.

### Correct production behaviour

Checkout is a visible session. Each transition — initializing, session created,
request sent to M-Pesa, awaiting confirmation, processing, settled — is a state
the buyer can see, with elapsed time and an explanation of what is happening and
who is acting.

### Proposed solution

1. Model the client state machine on the real payment session rather than on the
   fetch lifecycle: `idle → initializing → session_created → request_sent →
   awaiting_confirmation → processing → paid | failed`.
2. Return the payment-session identifiers from `POST /api/orders` so
   `session_created` and `request_sent` are backed by real server facts, not
   cosmetic delays. **No fake progress.**
3. Extend `/payment-status` to return the `PaymentEventLog` tail so the panel
   narrates actual recorded events with timestamps.
4. Surface the M-Pesa receipt number on confirmation.
5. Map `SimulatedOutcome` variants to distinct, honest failure copy.

### Impact on other roles

Farmer sees the mirrored arrival on the order screen. Admin Payment Lab
(`/dashboard/admin/payment-lab`) becomes far more demonstrable — forced outcomes
become visible end-to-end.

### Risk of regression

**Low.** Checkout is covered by e2e tests (`e2e/`, most recently touched by
PR #58). Those tests query the visible form; state names and copy will change,
so the specs must be updated in the same change.

---

## ISSUE 3 — Escrow is invisible

### Current behaviour — again, more exists than assumed

- `OrderTimelineDetailed` (`src/components/foodhub/OrderTimeline.tsx:146`) — a
  five-step vertical timeline: Order placed → Payment confirmed → Farmer
  dispatched → Buyer received → Payment released, each with a timestamp
  (`:177, :185, :193`) and a per-step explanation.
- Rendered on **both** the buyer order detail
  (`src/app/dashboard/buyer/orders/[orderId]/page.tsx:520`) and the farmer
  orders screen (`src/app/dashboard/farmer/orders/page.tsx:546`).
- Escrow protection callouts on both sides; refund state handled.
- A dedicated admin escrow ledger (`/dashboard/admin/escrow`) with per-state
  pills over the full `EscrowState` projection.
- A transaction receipt (`src/components/foodhub/TransactionReceipt.tsx`) with
  escrow state labels.

### The actual gaps

1. **The custody trail is written but never shown.** `EscrowEventLog`
   (`HELD` / `RELEASED` / `REFUND_ISSUED`, written at
   `escrowSettlement.ts:110`) records amount, acting admin, note and timestamp —
   the append-only record of what happened to the money. **No buyer- or
   farmer-facing surface reads it.** This is the single largest miss: the
   authoritative money trail exists and is invisible to the people whose money
   it is.

2. **No responsible party per step.** The timeline says what happened, never who
   must act next. "Waiting for farmer confirmation" is the closest it gets.

3. **Admin intervention is not a stage.** `MediationRequest` and
   `HELD_UNDER_REVIEW` exist in the model, but a disputed order *replaces* the
   whole timeline with a single red banner (`OrderTimeline.tsx:208-219`) — the
   journey disappears exactly when it matters most.

4. **`FulfillmentStage` runs on a separate axis.** The four-stage delivery
   progress (`PREPARING → READY → IN_TRANSIT → DELIVERED`) is shown as a
   standalone line (buyer page `:502`) rather than nested inside the "Farmer
   dispatched" step it belongs to.

5. **No unified escrow explainer.** The three-step primer exists in checkout but
   there is no single screen that teaches the whole journey — the thing the
   brief asks a panel to understand without narration.

### Root cause

**Escrow is modelled as a derived projection, and the UI inherited that
framing.** `EscrowState` is computed from `Order` fields
(`src/lib/foodhub/orderEscrowState.ts`); the timeline likewise derives step
completeness from `paymentStatus` / `fulfillmentStatus` booleans. A derived
snapshot can render *where things stand* but cannot render *what happened, when,
and who did it* — that requires reading the event log, which nothing does.

The result: the order screens show a **status projection wearing a timeline's
clothes**, not a history.

### Correct production behaviour

One escrow journey component, shared by buyer / farmer / admin, rendering the
full custody lifecycle — including the branch stages — with per stage: status,
timestamp, plain-language explanation, responsible party, and current-position
indicator. Sourced from the event log where events exist, from the projection
where they do not.

### Proposed solution

1. Add `GET /api/orders/[orderId]/escrow-trail` returning merged
   `EscrowEventLog` + `PaymentEventLog` + order milestones, ordered, with actor
   role on each entry.
2. Build `EscrowJourney` in `src/components/foodhub/`, superseding
   `OrderTimelineDetailed`. Stages: Payment initiated → Funds received → Held in
   escrow → Farmer notified → Preparing / Ready / In transit (nested
   `FulfillmentStage`) → Delivered → Buyer confirmed → *[Under review — admin]* →
   Funds released / Refunded.
3. Render disputes as a **branch inside** the journey, never as a replacement.
4. Attribute every stage to Buyer / Farmer / UmojaHub / Administrator.
5. Add a standalone "How escrow works" explainer page reusing the same component
   with illustrative data.

### Impact on other roles

Buyer, farmer and admin all read the same trail — the three views stop being
able to disagree, which is the point of a custody record. NGO/institution
transparency surfaces (`/api/transparency`) can reuse the endpoint.

### Risk of regression

**Low.** Additive: a new read endpoint plus a new component. `settleEscrow`,
the held-guard and all money-moving logic are untouched. `OrderTimelineDetailed`
stays until both consumers are migrated.

---

## §5 — Form validation (cross-cutting)

### Current behaviour

Every onboarding form is `noValidate` with **no client-side validation at all**.
`src/app/onboarding/identity-input/page.tsx:134` and
`verification-upload/page.tsx:141, :274` all submit unconditionally and populate
`fieldErrors` from the server response (`identity-input/page.tsx:82`).

Consequences:
- Every mistake costs a network round-trip.
- No inline feedback while typing, no success states, no blur validation.
- File inputs accept any size or dimension; `accept="image/*,application/pdf"`
  (`verification-upload/page.tsx:306`) is a picker hint, not a check. Oversized
  files fail at the upload endpoint after the user has waited.
- The `Input` component supports an `error` prop, so the presentation layer is
  ready; nothing drives it client-side.

### Root cause

Zod schemas live in `src/lib/validation/` and are used **server-side only**. The
client duplicates none of it — so the schema is the single source of truth for
*rejection* but plays no part in *guidance*.

### Correct production behaviour

The same Zod schema validates on the client (on blur and on submit) and on the
server (authoritative). Inline errors, success ticks, disabled-until-valid
submits, and file constraints (size, type, dimensions) checked before upload
begins.

### Proposed solution

Import the existing schemas into the client forms and add a small
`useZodForm` hook in `src/hooks/`. No new schemas — the contract is already
written; it is simply not shared. Add explicit file constraints to the upload
validation and enforce them before the request.

### Risk of regression

**Low.** Server validation is unchanged and remains authoritative.

---

## §6 — Role coverage: what has *not* been exercised

The brief asks for every role to be audited. The structural finding:

| Role | Selectable at signup? | Funnel branch | Dashboard + shell |
|---|---|---|---|
| FARMER | Yes | Yes | Yes |
| BUYER | Yes | Yes | Yes |
| STUDENT | Yes (GitHub only) | Yes | Yes |
| LECTURER | Yes | Yes | Yes |
| ADMIN | No — allowlist bootstrap | Bypassed | Yes |
| **NGO** | **No** | **None** | Yes |
| **EMPLOYER** | **No** | **None** | Yes |
| **INSTITUTION** | **No** | **None** | Yes |

`roleSelectionSchema` excludes ADMIN by design (a security invariant, correctly
enforced — `src/lib/auth/options.ts:347`). But it also excludes NGO, EMPLOYER
and INSTITUTION, which is **not** a deliberate security decision: those three
have full dashboards, shells, API routes and models
(built during the Ecosystem Simulation work) and **no way for a real person to
become one.** They exist only via seeding.

The brief mentions "Cooperative" as a role; there is no `Role.COOPERATIVE` —
cooperatives are modelled as `FarmerGroup` with farmer membership
(`/dashboard/farmer/group`). That is a reasonable model, but it means "audit the
Cooperative role" resolves to "audit the group workflows", not a role.

**This needs a decision from you before I plan work on it**: are NGO / EMPLOYER /
INSTITUTION intended to be self-service registrations, invite-only, or
admin-provisioned? The answer changes whether they need funnel branches,
invitation flows, or nothing at all.

---

## Proposed sequence

Ordered by dependency and risk, not by issue number.

| # | Work | Risk | Addresses |
|---|---|---|---|
| 1 | Universal sign-out (`SessionMenu`, session-aware login) | Low | **Issue 1.** Also makes every later step testable — you can change accounts freely |
| 2 | Buyer-type branch + placeholder rejection + honest document copy | Low | **Issue 4** (the part that actually bit) |
| 3 | Client-side validation via shared Zod schemas | Low | §5 — and prevents the next "NOT APPLICABLE" |
| 4 | Escrow trail endpoint + `EscrowJourney` component | Low | **Issue 3** |
| 5 | Payment session state machine + event narration | Low | **Issue 2** |
| 6 | Email event registry + truthful operational template | Low-Med | **Issue 4** (the latent half) |
| 7 | **Decouple activation from verification** (funnel → demand-driven) | **Med** | **Issue 5** — deliberately last |
| 8 | Role coverage decision + per-role end-to-end pass | TBD | §6 |

Two notes on the ordering.

**Step 1 is first** because it is the cheapest change with the widest effect: it
ends the trap immediately, and it makes every subsequent step verifiable, since
testing any role workflow requires switching accounts freely.

**Step 7 is last** even though it is the most valuable, because it is the only
change here that can break access control. `middleware.ts:176-187` documents a
prior redirect loop caused by the JWT stage lagging the DB row; that history says
this change wants a stable, well-understood surrounding before it lands. Steps
2 and 3 relieve most of the *user-visible* pain of the corridor in the meantime.

---

## Open questions

1. ~~**Issue 4** — which account received the email?~~ **ANSWERED 2026-08-04:**
   `jafarhussein251@gmail.com`, role BUYER. Diagnosed from the database record;
   see Issue 4. My `notifyAdmins` hypothesis was wrong and has been retracted.
2. **§6 —** how should NGO / EMPLOYER / INSTITUTION accounts come into
   existence — self-service, invite-only, or admin-provisioned? They have full
   dashboards but no way for a real person to become one.
3. **Buyer archetypes —** confirm that "individual buyer" is a real, supported
   archetype and not an oversight. The whole Issue 4 fix rests on it. If every
   buyer genuinely must be a registered business, the correct fix is the
   opposite: say so on the role-selection screen, before the account is created.
4. **Selfie capture —** the brief asks for a selfie alongside the government ID.
   `User.model` `farmerData` stores `documentType`, `documentImageUrl`,
   `documentNumber` only. Adding a selfie is a schema change plus an
   admin-review change. Confirm it is wanted; the admin review surface itself is
   already good (inline viewer, full-resolution open, PDF handling —
   `verification-queue/page.tsx:83-130`).
