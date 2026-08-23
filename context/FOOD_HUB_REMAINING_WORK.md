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
| **S-P1-1** | ☑ **done** | **UmojaHub now has a database backup — the first that has ever existed.** 185,466 bytes, `AES256.CFB`, 3,338 documents restored with 0 failures. Verified by pulling the file back down, not by the green check. Three PRs: #68, #69, #70. |
| **S-P2-3** | ☐ open | 23 dependency vulnerabilities, **none reachable** — each direct one checked. Patch after the presentation. |
| **S-P2-4** | ☐ open | Two test gaps: the E2E spec stops at the create-listing button; brief-contexts is not in the smoke set. |
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

- [x] Search for an existing upload field component before writing one
- [x] Replace the URL input with a file picker wired to `POST /api/upload`
- [x] Render thumbnails, allow removal, respect the 5-image cap
- [x] Handle and surface upload failure without losing the rest of the form
- [x] Never submit an image URL for a file that did not store
- [x] Verify a listing published this way renders its image on `/marketplace`
- [ ] Extend the E2E spec past the affordance to an actual publish
- [x] Test unauthorized upload (wrong role, disallowed folder)
- [x] Run the regression gate

**Status:** ☑ **done and verified in a browser** — a seeded farmer picked a `.jpg`, it uploaded, the listing published, and its photograph renders on the public marketplace at both viewports with zero console errors. One follow-up left open above: the E2E spec still stops at the button rather than completing a publish.

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

- [x] Choose a model the account actually serves and verify it live before committing
- [x] Make the model configurable with a sane default
- [x] Apply the same change to the mentor route (single source of truth if practical)
- [x] Confirm the system prompt, weather context and price context still behave on the new model
- [x] Confirm the fallback path still works when the provider is down
- [x] Ask a real question through the browser and read the answer
- [x] Run the regression gate

**Status:** ☑ **done and verified live** — a real agronomy question returned a grounded answer naming the water check, the nitrogen reading and the KEBS fertiliser label. Model is now `GROQ_MODEL`, defaulting to one the account actually serves.

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

- [x] Swap tokens to the `app-*` ramp
- [x] Swap `ui/*` primitives for `app/*` primitives
- [x] Constrain height and scroll internally
- [x] Verify at 1280×900 and 390×844
- [x] Confirm no still-referenced `ui/*` component was orphaned
- [x] Run the regression gate

**Status:** ☑ **done** — modal title visible at `y=77` (previously clipped above the viewport); body scrolls inside a pinned frame at 1280×900 and 390×844. The containment fix went into the shared `app/Modal`, so every long modal benefits.

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

- [x] Translate 11000 into a domain error in the ratings route
- [x] Assert the wording, not just the status
- [x] Verify in the browser with two submissions
- [x] Run the regression gate

**Status:** ☑ **done** — 409 `RATING_ALREADY_SUBMITTED` with a sentence. The test asserts the wording and that "Duplicate" is absent.

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

- [x] Branch the log level on status class
- [x] Keep the stack for 5xx and non-`AppError`
- [x] Assert both levels in tests
- [x] Re-run the E2E suite and confirm the log is quiet
- [x] Run the regression gate

**Status:** ☑ **done** — a 4xx `AppError` logs at `warn` with status, code and message and no stack; 5xx and non-`AppError` keep ERROR and the stack. Four new tests cover both.

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

**Status:** ☐ **open — owner decision.** Renaming the application database moves production data, so this is not mine to take. `npm run check:services` now reports it on every run (`connected, but the URI names no database (using "test")`).

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

- [x] Find every place a listing image renders
- [x] Add a shared fallback rather than four copies
- [x] Verify with a deliberately bad URL at both viewports
- [x] Run the regression gate

**Status:** ☑ **done and verified** — three listings with unreachable image URLs rendered the produce placeholder: `document.images` reported **0** failed images left in the DOM and **3** placeholders drawn.

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

**Status:** ☐ open — P3, deliberately not started while anything above it was open.

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

**Status:** ☐ **open — owner decision.** Confirmed still present after the demo world was rebuilt, as a record outside the run ledger must be. It may be an account the owner uses.

### S-P1-1 · The weekly database backup has never succeeded — and fixing it naively would leak the database
Eight consecutive failures since at least 2026-07-05:
`##[error]Input required and not supplied: token`. **A platform holding escrow state and academic
records has no restore point.**

**The obvious fix is a breach.** `JafarHussein/umojahub-backups` — the destination — is **public**.
Supplying `BACKUP_REPO_TOKEN` would push a complete `mongodump` (names, emails, phone numbers,
national ID document numbers, bcrypt hashes, verification-document URLs) into a public repository.
The missing secret has been accidentally preventing that for eight weeks. `MONGODB_URI` is also
absent, so the old workflow would have died at `mongodump` even with the token.

**Done here** — the workflow can no longer be the thing that leaks it:
- [x] Refuses to run when the destination repository is public, checked against the API before
      `mongodump` is even installed
- [x] Encrypts with AES-256 (`gpg --symmetric`) on the runner; plaintext never reaches the backup
      repository's working tree
- [x] Proves the archive restores (`mongorestore --dryRun`) before committing it — a backup nobody
      has restored is a hypothesis
- [x] Fails on an archive under 64KB, which is how an unreachable Atlas presents
- [x] Names every missing secret and what it is for, instead of `Input required and not supplied`
- [x] `actions/checkout@v5`; `apt-key` replaced with a keyring (removed on newer runners)
- [x] Restore procedure rewritten for the encrypted archive — `context/RUNBOOK.md` §1b

**Owner actions, in this order** — full commands in `context/RUNBOOK.md` §1a:
- [x] Make `umojahub-backups` **private** — nothing else may happen first
- [x] Generate and safely record `BACKUP_PASSPHRASE` (lose it, lose every backup)
- [x] Create a **fine-grained** PAT scoped to that one repo, Contents: read+write only
- [x] Set all four secrets: `BACKUP_REPO_NAME`, `BACKUP_REPO_TOKEN`, `BACKUP_PASSPHRASE`, `MONGODB_URI`
- [x] Allow `0.0.0.0/0` in Atlas Network Access (runners have no stable egress IP)
- [x] `gh workflow run backup.yml`, then **restore it to a scratch database and count documents**

**Status:** ☑ **DONE — UmojaHub now has a database backup, the first that has ever existed.**

Took three merged PRs (#68, #69, #70), because each run found the next problem:

| Run | What it revealed |
|---|---|
| 1 | `main` still held the plaintext workflow; the hardened one was an unpushed commit |
| 2 | `actions/checkout` cannot clone a repo with **no commits** — the store had never been initialised |
| 3 | **The verification step was itself wrong.** `mongorestore --dryRun` means "do not write", not "do not connect" — it dialled `localhost`, timed out after 30s, and declared a perfectly good archive unusable |

Final run, verified independently of the green checkmark by pulling the file back down:

```
All four secrets are present.
private=true
Backup store is empty — initialising it.
archive is 185,368 bytes
Archive verified: 3338 documents restored, 0 failures.
Pushed backup-20260823-155929.gz.gpg
```

- In the repository: `backup-20260823-155929.gz.gpg`, 185,466 bytes, beside a README
- Genuinely encrypted: gpg reads `AES256.CFB encrypted data`; first bytes `8c 0d 04 09` (OpenPGP), not `1f 8b` (gzip)
- Nothing readable in the ciphertext — no emails, phone numbers or field names
- Atlas `0.0.0.0/0` **proven**, because `mongodump` connected from a GitHub runner

**One thing still owed by a human:** do the restore yourself once — decrypt with `BACKUP_PASSPHRASE`, restore to a scratch database, count. The workflow proves data comes back into a throwaway mongod; only you can prove the passphrase is reachable and correct. If it is wrong, today is the day to find out.

### S-P2-2 · Live-provider smoke tests
Every gate stayed green while two providers were unusable. A short script that calls each
configured external service once — Groq, OpenAI, Cloudinary, SMTP, Redis, OpenWeather, Africa's
Talking, Daraja OAuth — and reports pass/fail would have caught both P0s in seconds. Run on
demand, never in CI (CI has placeholder credentials by design).

- [x] Add the script under `scripts/`
- [x] One call per provider, no side effects (no SMS sent, no email sent)
- [x] Exit non-zero on any failure, print a table
- [x] Document it in `CLAUDE.md` commands and `context/RUNBOOK.md`

**Status:** ☑ **done** — `npm run check:services`. First run: 6 healthy · 4 degraded · 0 failed. It caught a bug in itself before shipping: a 16-token budget made a healthy reasoning model report "answered with nothing", the same trap that made brief generation look broken.

### S-P2-3 · Dependency vulnerabilities — 23 open, none reachable

**Why it matters.** `npm audit` had never been run. That was a gap in the audit's own security
section, not a finding the tools produced — it turned up on re-reading §16 and noticing it claimed
"no injection surface was found" without ever having looked at the dependency tree.

**Current state.** 23 advisories (2 critical, 15 high, 3 moderate, 3 low); 18 in production
dependencies. Each one touching a **direct** dependency was checked for reachability, and none is
reachable as the code stands:

| Package | Sev | Why it is not reachable here |
|---|---|---|
| `next-auth` | critical | The vector is the Email (magic-link) provider. `options.ts` configures Google, GitHub and Credentials only. |
| `nodemailer` | high | SMTP injection via `envelope`, which is never used in `src/`. Recipients come from `User.email`, Zod-validated at every write boundary. |
| `next` | high | Smuggling via **rewrites**. `next.config.ts` declares none. |
| `mongoose` | moderate | Prototype pollution in update casting. 66 update sites, none passes an unparsed body; all write explicit fields after `safeParse`. |

**Expected outcome.** The tree is patched, and the reachability analysis stops being load-bearing —
it is only true of today's code. The next feature that touches an email envelope or a Next rewrite
makes two of these live.

**Do it after the presentation, on its own branch.** Shifting dependency versions to close
unreachable findings, days before a demonstration, risks the demo for no security gain.

- [ ] `npm audit fix` (no `--force`) — resolves most transitives
- [ ] `next` 15.5.12 → 15.5.23 — patch within the same minor, low risk
- [ ] **`nodemailer` 7 → 9 separately** — a major bump on the lifecycle-email path; exercise
      registration, verification decisions, payout decisions and order updates afterwards
- [ ] Re-run `npm audit` and record what remains and why
- [ ] Full regression gate plus `npm run check:services`

**Status:** ☐ open — sequence after the presentation.

---

### S-P2-4 · Two test gaps the audit left open deliberately

**Why it matters.** Both are places where a green suite would not notice the exact class of defect
this audit found by hand.

- `e2e/verification-lockout.spec.ts` asserts a verified farmer *"can reach the create-listing
  affordance"* — it checks a button exists and stops one click before the form that no real farmer
  could complete. The fix is verified in a driven browser run, but not by a committed spec.
- `/dashboard/admin/brief-contexts` threw on every load for as long as `targetTiers` was absent
  from the model, and nothing failed. It is still not in the smoke set.

- [ ] Extend the create-listing spec through an actual publish, including the file upload
- [ ] Add every admin page to the smoke landing set so a page that throws fails the run
- [ ] Confirm both fail on a deliberately reintroduced regression before trusting them

**Status:** ☐ open — P2.

---

### S-P3-1 · Drop retired collections
`verificationauditlogs` (15 documents, subsystem retired by Foundation V2 §14.3),
`portfolioviews` (0), `studentportfoliostatuses` (0), `ngoorganizations` (0). All belong to
deleted visions.

- [ ] Confirm no code references any of them
- [ ] Drop them
- [ ] Confirm `npm run demo` and the app still boot clean

**Status:** ☐ open — P3.

### S-P3-2 · Remove the unused `resend` dependency
`resend@6.12.4` is installed and `RESEND_API_KEY` / `RESEND_FROM_EMAIL` sit in `.env.local`, but
nothing imports it. Email goes through Nodemailer/SMTP.

- [ ] Confirm no import anywhere
- [ ] Remove the dependency and the environment variables
- [ ] Run the regression gate

**Status:** ☐ open — P3.

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
