# Food Hub — remaining work

Execution plan derived from `context/UMOJAHUB_CURRENT_STATE_AUDIT.md` (2026-08-23).
Food Hub completion at time of writing: **80%**.

Priority: **P0** blocks the core workflow or the presentation · **P1** needed for a complete
product workflow · **P2** quality · **P3** future.

Do not start P2 work while P0/P1 remains.

---

## Execution record — 2026-08-23

Everything P0, P1 and P2 in this plan that was mine to decide has been **done and verified by
running it**, not by a green gate. Two items remain open and both are the owner's call.

| ID | | Verified how |
|---|---|---|
| **F-P0-1** | ☑ done | A seeded farmer picked a `.jpg`, it uploaded, the listing published and its photograph renders on the public marketplace — at 1280×900 and 390×844, zero console errors, stored URL answers 200 |
| **F-P0-2** | ☑ done | A live agronomy question returned a substantive grounded answer; the mentor answered an architecture question about the student's own project |
| **F-P1-3** | ☑ done | Modal title visible at `y=77` (was clipped above the viewport); body scrolls inside a pinned frame at both viewports |
| **F-P2-4** | ☑ done | 409 `RATING_ALREADY_SUBMITTED` with a sentence; the test asserts the wording and that "Duplicate" is absent |
| **F-P2-5** | ☑ done | 4xx `AppError` logs at `warn` without a stack; four new tests cover both levels |
| **F-P2-8** | ☑ done | Three listings with dead image URLs: **0** failed images left in the DOM, **3** placeholders drawn |
| **S-P2-2** | ☑ done | `npm run check:services` — 6 healthy · 4 degraded · 0 failed |
| **F-P2-6** | ☐ open | Renaming the application database moves production data. Owner's call. `check:services` now reports it on every run. |
| **S-P2-1** | ☐ open | The orphaned buyer record may be an account the owner uses. Owner's call. |
| **S-P1-1** | ☐ open | Adding `BACKUP_REPO_TOKEN` is a repository-secret change only the owner can make. |
| **F-P3-7** | ☐ open | Duplicate indexes — P3, deliberately not started while anything above it was open. |

Gates after the work: type-check clean · lint 0 errors · **1,523 tests** (up from 1,513) ·
build exit 0 · **55 E2E passed** · **3 rehearsal passed** · demo world rebuilt and re-validated.

---

## F-P0-1 · A farmer cannot attach a photo to a listing

**Why it matters.** Publishing produce is the first thing the platform's primary user must do,
and it is the only step in the entire Food Hub that a real farmer cannot perform. Everything
downstream — the marketplace, orders, escrow, the ledger — is unreachable without it. The
Definition of Done says "a real farmer can use it"; today they cannot.

**Current state.** `src/components/foodhub/CreateListingForm.tsx:337-346` renders a single text
input labelled **"Crop image URL (Cloudinary)"** with the hint *"Upload your image to Cloudinary
and paste the URL here"*. There is no file input anywhere in the form.
`cropListingSchema.imageUrls` requires at least one URL matching `cloudinaryUrlRegex`, so the
form cannot be submitted without one. `POST /api/upload` already exists, is authorised for
`FARMER`, already allow-lists the `umojahub/listings` folder, validates MIME and size inside
`cloudinaryService.uploadImage`, and was proved working during the audit (a real file uploaded
and returned a `res.cloudinary.com` URL).

**Expected outcome.** The farmer picks a photo from their phone or computer. It uploads, they see
a thumbnail and can remove it or add another (up to the schema's 5). The URL field disappears
entirely. Submitting works with no knowledge of Cloudinary. Upload failures say what went wrong
in a sentence, and the form does not submit an image that did not store.

**Files likely affected**
- `src/components/foodhub/CreateListingForm.tsx` (primary)
- possibly a small shared `ImageUpload` field in `src/components/app/` if one does not exist —
  **search first**; `src/app/onboarding/identity-input/page.tsx` and the verification screen
  already upload files and may already hold the pattern to reuse

**Database implications.** None. `imageUrls: string[]` is unchanged.

**API implications.** None — `/api/upload` and `POST /api/marketplace` are both unchanged. The
form calls an endpoint it should already have been calling.

**UI implications.** Replace one text input with a file picker plus thumbnail list. Keep the
existing multi-image cap. Show upload progress and a per-file error.

**Testing requirements.** Unit test for the upload handler's error path. An E2E test that
actually **completes** the form and publishes — `e2e/verification-lockout.spec.ts` currently stops
at "can reach the create-listing affordance", which is one click short of this defect.

**Dependencies.** None.

**Acceptance criteria.** A verified farmer, given only a `.jpg` on disk, publishes a listing that
appears in the marketplace with its image rendering — with no Cloudinary account and no URL typed.

- [ ] Search for an existing upload field component before writing one
- [ ] Replace the URL input with a file picker wired to `POST /api/upload`
- [ ] Render thumbnails, allow removal, respect the 5-image cap
- [ ] Handle and surface upload failure without losing the rest of the form
- [ ] Never submit an image URL for a file that did not store
- [ ] Verify a listing published this way renders its image on `/marketplace`
- [ ] Extend the E2E spec past the affordance to an actual publish
- [ ] Test unauthorized upload (wrong role, disallowed folder)
- [ ] Run the regression gate

**Status:** ☐ not started

---

## F-P0-2 · The Farm Assistant answers nothing

**Why it matters.** The Farm Assistant is a headline feature on the farmer dashboard and in every
presentation script. It currently returns the same canned failure sentence to every question, and
it does so *gracefully* — no crash, no alert, no test failure — so nothing has flagged it.

**Current state.** `src/lib/integrations/groqService.ts:20` pins
`GROQ_MODEL = 'llama-3.3-70b-versatile'`. The live API returns:

```
404 {"error":{"message":"The model `llama-3.3-70b-versatile` does not exist
     or you do not have access to it.","type":"invalid_request_error",
     "code":"model_not_found"}}
```

The key is valid (`/v1/models` returns 200). The model is simply no longer served to this
account. Models the account *does* offer, with usable context windows:
`openai/gpt-oss-120b` (131k), `openai/gpt-oss-20b` (131k), `qwen/qwen3.6-27b` (131k),
`groq/compound` (131k). The identical constant is duplicated at
`src/app/api/mentor/chat/route.ts:15` — see E-P0-2.

**Expected outcome.** The Assistant answers real questions again, grounded as before in the
farmer's crops, county, weather and the Price Intelligence context. **And the model becomes
configuration, not code**, so the next provider deprecation is an environment change rather than a
code change and a redeploy.

**Files likely affected**
- `src/lib/integrations/groqService.ts`
- `src/app/api/mentor/chat/route.ts` (same constant — fix together, see E-P0-2)
- `src/lib/env.ts` and `.env.local.example` if a `GROQ_MODEL` variable is introduced
- `CLAUDE.md` environment section if a variable is added

**Database implications.** None.

**API implications.** None to the contract. `ChatSession` persistence, the fallback string and the
weather/price context all stay exactly as they are — the fallback is correct behaviour and must
survive.

**UI implications.** None.

**Testing requirements.** The existing unit tests mock the provider and must keep passing. Add a
**live** smoke check (see S-P2-2) that calls the configured model once and fails loudly — run on
demand, not in CI.

**Dependencies.** None. Fix alongside E-P0-2 since it is one constant in two places.

**Acceptance criteria.** A farmer asks a real agronomy question through
`/dashboard/farmer/assistant` and receives a substantive, grounded answer. The model name is
readable from configuration. The graceful-degradation path is unchanged and still tested.

- [ ] Choose a model the account actually serves and verify it live before committing
- [ ] Make the model configurable with a sane default
- [ ] Apply the same change to the mentor route (single source of truth if practical)
- [ ] Confirm the system prompt, weather context and price context still behave on the new model
- [ ] Confirm the fallback path still works when the provider is down
- [ ] Ask a real question through the browser and read the answer
- [ ] Run the regression gate

**Status:** ☐ not started

---

## F-P1-3 · The create-listing modal is off the design system and clipped

**Why it matters.** It is the last unmigrated screen in the product and it sits on the farmer's
primary workflow. Captured at 1280×1000, the modal is taller than the viewport, is not internally
scrollable, and its title row is cut off above the top edge — a farmer opening it sees a form that
begins mid-sentence.

**Current state.** `CreateListingForm.tsx` uses the retired token set (`text-t6`, `font-body`,
`bg-surface-raised`, `border-white/10`, `text-red-400`, `rounded-sm`) rather than the `app-*` ramp
and `.theme-app` tokens every other screen was migrated to. It also uses the legacy `Input`,
`Button` and `Modal` from `src/components/ui/` rather than `src/components/app/`.

**Expected outcome.** The modal matches the rest of the product, fits the viewport at 1280×900 and
390×844, and scrolls internally when its content is taller than the frame.

**Files likely affected**
- `src/components/foodhub/CreateListingForm.tsx`
- `src/components/app/Modal.tsx` (only if it lacks a max-height/scroll behaviour — check, do not
  assume)

**Database implications.** None. **API implications.** None.

**UI implications.** Token and primitive swap; add `max-height` and internal scroll; keep every
field, label, hint and validation message unless F-P0-1 changed it.

**Testing requirements.** Visual check at both viewports. Confirm no `src/components/ui/*` import
that is still needed by the out-of-scope website or marketplace is removed.

**Dependencies.** Do **after** F-P0-1 so the file is touched once.

**Acceptance criteria.** The modal's title is visible on open at both viewports; the form scrolls
inside its own frame; no horizontal overflow; visually indistinguishable in system from the rest
of the farmer surface.

- [ ] Swap tokens to the `app-*` ramp
- [ ] Swap `ui/*` primitives for `app/*` primitives
- [ ] Constrain height and scroll internally
- [ ] Verify at 1280×900 and 390×844
- [ ] Confirm no still-referenced `ui/*` component was orphaned
- [ ] Run the regression gate

**Status:** ☐ not started

---

## F-P2-4 · A duplicate rating shows the buyer the words "Duplicate entry"

**Why it matters.** "Duplicate entry" is a database message, not a sentence. It reads as a crash
to a buyer and it is exactly the kind of thing that looks bad on a screen during a demonstration.

**Current state.** `src/app/api/ratings/route.ts` relies on the unique index on `Rating.orderId`
and does not translate Mongo's `11000`. `handleApiError` therefore returns the generic
`{ error: 'Duplicate entry', code: 'DB_DUPLICATE' }` (409, verified live), and
`src/app/dashboard/buyer/orders/[orderId]/page.tsx:305` renders `body.error` verbatim.
`src/app/api/farmers/payout-requests/route.ts` already solves the same class of problem by
translating the duplicate-key error back into a domain message.

**Expected outcome.** A second rating on the same order tells the buyer they have already rated
this order, in a sentence.

**Files likely affected** `src/app/api/ratings/route.ts`.

**Database implications.** None — the index stays; it is the real guarantee.
**API implications.** Same status (409), a different `code` and message.
**UI implications.** None — the page already renders whatever the route says.

**Testing requirements.** Unit test asserting the translated message, mirroring the payout route's
existing test.

**Dependencies.** None.

**Acceptance criteria.** A duplicate rating returns 409 with a human sentence and a domain code;
the index still refuses the write.

- [ ] Translate 11000 into a domain error in the ratings route
- [ ] Assert the wording, not just the status
- [ ] Verify in the browser with two submissions
- [ ] Run the regression gate

**Status:** ☐ not started

---

## F-P2-5 · Expected refusals are logged as errors with stack traces

**Why it matters.** Every ordinary 401, 403, 404 and 409 produces an `ERROR`-level log line with a
full stack trace. During this audit, correct operation generated dozens of them. In production
this makes the log useless: a genuine unhandled error is indistinguishable from a farmer visiting
a page before they are verified.

**Current state.** `handleApiError` in `src/lib/utils.ts` logs every `AppError` at `ERROR` with
`message: 'Unhandled error in API route'` and the stack, regardless of status.

**Expected outcome.** An `AppError` with a 4xx status — a decision the application deliberately
made — logs at `warn` or `info` with its code and no stack. Anything 5xx, and anything that is not
an `AppError`, keeps `ERROR` and the stack.

**Files likely affected** `src/lib/utils.ts`.

**Database implications.** None. **API implications.** None — responses are unchanged.
**UI implications.** None.

**Testing requirements.** Unit tests asserting the level chosen for a 403 and for a genuine 500.
Check `src/lib/__tests__/` for existing `handleApiError` tests first.

**Dependencies.** None.

**Acceptance criteria.** Running the E2E suite produces no `ERROR` lines for expected refusals, and
still produces one for a real failure.

- [ ] Branch the log level on status class
- [ ] Keep the stack for 5xx and non-`AppError`
- [ ] Assert both levels in tests
- [ ] Re-run the E2E suite and confirm the log is quiet
- [ ] Run the regression gate

**Status:** ☐ not started

---

## F-P2-6 · `MONGODB_URI` names no database

**Why it matters.** All application data lives in a database literally called `test` — confirmed
by `listDatabases`. It works, but the name invites an accident, and it means a second environment
sharing the cluster would collide by default.

**Current state.** The URI carries no path segment and `connectDB` passes no `dbName`, so Mongoose
uses its default. `MONGODB_E2E_URI` *does* name its database (`umojahub_e2e`), which is why the
harness isolation works.

**Expected outcome.** The application database is named deliberately.

**Careful:** this is a **data migration**, not a config edit. Changing the name without moving the
data points the app at an empty database.

**Files likely affected** `.env.local`, `.env.local.example`, `CLAUDE.md` gotchas section, Vercel
environment variables. Possibly `src/lib/db.ts` if a default `dbName` is preferred over changing
the URI.

**Database implications.** Either copy `test` → the new name and cut over, or accept the name and
document it. **Recommendation: decide with the owner** — a rename touches production data and the
current state is working.

**API implications.** None. **UI implications.** None.

**Testing requirements.** Verify the E2E isolation guards still hold after any change — they
compare host+database.

**Dependencies.** Owner decision. Do not perform silently.

**Acceptance criteria.** Either the database is named and every environment points at it with no
data loss, or the decision to leave it is written down with its reason.

- [ ] Raise the decision with the owner before touching anything
- [ ] If renaming: copy, verify counts match, cut over, verify the app, then drop the old
- [ ] Update `.env.local.example`, `CLAUDE.md` and Vercel
- [ ] Re-verify E2E isolation guards
- [ ] Run the regression gate

**Status:** ☐ blocked on an owner decision

---

## F-P2-8 · No image-load fallback on listing cards

**Why it matters.** A listing whose image URL fails renders a broken image on the public
marketplace — observed during this audit at 390px (`404 /_next/image`). Cloudinary assets can be
deleted, and a farmer can mistype.

**Current state.** No `onError` handler on any listing image. `next/image` returns 404 and the
browser shows its own broken-image glyph.

**Expected outcome.** A failed image falls back to a neutral placeholder that still shows the crop
name — never a broken glyph.

**Files likely affected** `src/app/marketplace/page.tsx`, `src/app/marketplace/[listingId]/page.tsx`,
the farmer listings table, and any shared listing card. **Search for the shared component first.**

**Database implications.** None. **API implications.** None.

**Testing requirements.** Render a listing with a deliberately bad URL and confirm the fallback.

**Dependencies.** None.

**Acceptance criteria.** A listing with an unreachable image renders a placeholder and remains
legible and orderable.

- [ ] Find every place a listing image renders
- [ ] Add a shared fallback rather than four copies
- [ ] Verify with a deliberately bad URL at both viewports
- [ ] Run the regression gate

**Status:** ☐ not started

---

## F-P3-7 · Duplicate schema index declarations on eight models

**Why it matters.** Hygiene. Mongoose emits a warning per model on every boot — build, test, seed,
server — and the noise trains everyone to ignore Mongoose warnings, including a real one.

**Current state.** `User.email`, `Order.mpesaTransactionId`, `Order.orderReferenceId`,
`FarmerTrustScore.farmerId`, `Rating.orderId`, `LecturerEffectiveness.lecturerId`,
`SimulationRun.runId` and `KnowledgeArticle.slug` each declare the same index twice — once as
`index: true` / `unique: true` on the path and once via `schema.index()`.

**Expected outcome.** One declaration each; zero duplicate-index warnings at boot.

**Files likely affected** the eight files under `src/lib/models/`.

**Database implications.** None — the index itself is identical; only the declaration is doubled.
Verify no index is accidentally *dropped* (keep whichever declaration carries `unique` and any
partial filter).

**API implications.** None. **UI implications.** None.

**Testing requirements.** Boot the app and the seeder and confirm the warnings are gone and the
indexes still exist.

**Dependencies.** None.

**Acceptance criteria.** `npm run demo:validate` and `npm run build` produce no duplicate-index
warnings, and every unique constraint still refuses a duplicate.

- [ ] Remove the redundant declaration on each of the eight models
- [ ] Preserve `unique` and any partial filter expression
- [ ] Confirm indexes still exist in the database
- [ ] Confirm the boot log is clean
- [ ] Run the regression gate

**Status:** ☐ not started

---

## Shared items that land on the Food Hub

These are tracked in the audit under `S-*` but are executed here because they touch Food Hub data.

### S-P2-1 · Clear the orphaned buyer record
`jafarhussein251@gmail.com` (BUYER, created 2026-08-03, outside any demo run) sits `PENDING` at
the top of the **admin buyer verification queue** with `organizationName: "NOT APPLICABLE"` and
`businessRegistrationNumber: "NOT APPLICABLE"`. It is residue from the closed-onboarding-corridor
defect, which has since been fixed. Either delete it or complete it as a genuine `INDIVIDUAL`
record. **Owner decision** — it may be a real account the owner uses.

- [ ] Confirm with the owner whether the account is still wanted
- [ ] Remove it, or migrate it to `buyerType: INDIVIDUAL` with honest values
- [ ] Confirm the buyer verification queue reads cleanly afterwards

**Status:** ☐ blocked on an owner decision

### S-P1-1 · The weekly database backup has never succeeded
Eight consecutive failures since at least 2026-07-05:
`##[error]Input required and not supplied: token`. The `BACKUP_REPO_TOKEN` secret is absent from
the repository. **A platform holding escrow state and academic records has no restore point.**
Owner action — a secret cannot be added from here.

- [ ] Owner adds `BACKUP_REPO_TOKEN` (and confirms `BACKUP_REPO_NAME`) as repository secrets
- [ ] Trigger the workflow manually and confirm it completes
- [ ] Confirm a dump lands in the backup repository
- [ ] Consider pinning `actions/checkout` past the Node 20 deprecation warning

**Status:** ☐ blocked on owner action

### S-P2-2 · Live-provider smoke tests
Every gate stayed green while two providers were unusable. A short script that calls each
configured external service once — Groq, OpenAI, Cloudinary, SMTP, Redis, OpenWeather, Africa's
Talking, Daraja OAuth — and reports pass/fail would have caught both P0s in seconds. Run on
demand, never in CI (CI has placeholder credentials by design).

- [ ] Add the script under `scripts/`
- [ ] One call per provider, no side effects (no SMS sent, no email sent)
- [ ] Exit non-zero on any failure, print a table
- [ ] Document it in `CLAUDE.md` commands and `context/RUNBOOK.md`

**Status:** ☐ not started

### S-P3-1 · Drop retired collections
`verificationauditlogs` (15 documents, subsystem retired by Foundation V2 §14.3),
`portfolioviews` (0), `studentportfoliostatuses` (0), `ngoorganizations` (0). All belong to
deleted visions.

- [ ] Confirm no code references any of them
- [ ] Drop them
- [ ] Confirm `npm run demo` and the app still boot clean

**Status:** ☐ not started

### S-P3-2 · Remove the unused `resend` dependency
`resend@6.12.4` is installed and `RESEND_API_KEY` / `RESEND_FROM_EMAIL` sit in `.env.local`, but
nothing imports it. Email goes through Nodemailer/SMTP.

- [ ] Confirm no import anywhere
- [ ] Remove the dependency and the environment variables
- [ ] Run the regression gate

**Status:** ☐ not started

---

## Regression gate for every task above

```
npm run type-check && npm run lint && npm run test && npm run build
npm run test:e2e:fast
npm run demo:validate
```

Plus, for anything touching a screen: open it in a browser at 1280×900 and 390×844 and read it.
A green gate did not see any of the P0s in this plan.

**Before any presentation:** `npm run demo` — the audit left artefacts in the world
(two `AUDIT — …` listings, two orders, one newly verified farmer, one resolved mediation, one
knowledge article).
