# Auth & Onboarding Flow V2

**Status:** APPROVED by owner 2026-06-20 (chat directive). Supersedes the AUTH-07
"OAuth-only" model for the sign-up path. Reviewable spec for the slice-by-slice
implementation on `chore/webapp-uiux-nuclear-reset`.

This changes **platform logic** (auth, onboarding, RBAC), done under explicit
owner direction.

---

## 1. Goal

A first-time visitor completes onboarding **before** an account exists, links it
with OAuth, and lands on their dashboard. Every account also gets a
username + password so future logins can use **either** credentials **or** OAuth.

## 2. Resolved flow

| Role | First-time | Future logins |
|---|---|---|
| Farmer / Buyer / Lecturer | Welcome → details (username + password + role) → **Continue with Google** → account created → **dashboard** | username+password **or** Google |
| Student | Welcome → details (username + password, role auto = STUDENT) → **Continue with GitHub** → account created → **dashboard** | username+password **or** GitHub |
| Admin | **Not in the public funnel.** Provisioned with username + password. | username+password on `/auth/login` → admin dashboard |

- **No forced re-login.** Finishing OAuth establishes the session; first-timers go
  straight to `dashboardForRole(role)` (logic already in `middleware.ts`).
- Provider↔role policy preserved: STUDENT ⇔ GitHub; Farmer/Buyer/Lecturer ⇔ Google.

## 3. Security invariants (non-negotiable)

1. **ADMIN is never self-selectable.** The role picker offers Farmer / Buyer /
   Lecturer (+ Student via GitHub). There is **no public "create admin" path.**
2. The reconcile step **rejects any draft with `role === ADMIN`** (defence in depth)
   and admins are provisioned out-of-band (seed / `ADMIN_EMAIL_ALLOWLIST` + a set
   password).
3. Passwords are **bcrypt-hashed** (reuse `BCRYPT_SALT_ROUNDS`), `select:false`,
   never returned or logged. Raw passwords never persist — drafts store the hash.
4. OAuth still requires a **provider-verified email** (existing `resolveVerifiedEmail`).
5. Account-linking policy preserved: an email already tied to another provider /
   account is **not** auto-linked (anti-takeover).

## 4. Data model

**`User`** — add:
- `username: { type: String, unique: true, sparse: true, lowercase: true, trim: true }`
  (sparse: legacy/seed users may lack it until provisioned).
- `hashedPassword: { type: String, select: false }`.

**`OnboardingDraft`** (new) — the pre-auth holding record:
```
{ username, role, hashedPassword, createdAt }
index: { createdAt: 1 } expireAfterSeconds: 1800   // 30-min TTL self-clean
index: { username: 1 } unique
```
The draft is referenced by a random `draftId` (the Mongo `_id`) carried in a
signed httpOnly cookie `onboarding_draft`.

## 5. Validation (`src/lib/validation/`)

- `username`: 3–20 chars, `^[a-z0-9_]+$`, lowercased.
- `password`: min 8, at least one letter + one number (keep simple, documented).
- `onboardingDraftSchema`: `{ username, password, role ∈ {FARMER,BUYER,LECTURER,STUDENT} }`
  — **ADMIN excluded from the enum at the schema boundary.**
- `credentialsLoginSchema`: `{ username, password }`.

## 6. API (`connectDB → validate → op → handleApiError`)

- `POST /api/onboarding/draft` — Zod-validate; reject ADMIN; check username free
  against `User.username` **and** live drafts; bcrypt the password; upsert the
  draft; set signed httpOnly `onboarding_draft` cookie; return `{ ok, role }`.
- `GET /api/onboarding/username-available?u=` — cheap uniqueness probe for the
  details form (checks User + drafts).

## 7. Auth config (`src/lib/auth/options.ts`)

- Add **`CredentialsProvider`** (`username`, `password`): `connectDB`, find user by
  username `.select('+hashedPassword')`, `bcrypt.compare`, return the user or null.
- **Move account creation** out of the "create on first OAuth sign-in" branch into a
  **draft-reconcile** path in the `signIn` callback (OAuth providers only):
  1. read `onboarding_draft` cookie → load draft (missing/expired → bounce to
     `/onboarding/welcome`).
  2. resolve verified OAuth email; enforce provider↔role; **reject ADMIN**; reject
     if email already has an account.
  3. create `User` from draft + OAuth email: `username`, `role`, `hashedPassword`,
     `oauthProvider`, `onboardingStage: COMPLETED`, `isEmailVerified: true`,
     `firstName` (from OAuth profile).
  4. delete the draft + clear the cookie. Session established → dashboard.
- An OAuth sign-in **without** a draft cookie and **without** an existing account is
  rejected (no silent account creation) → redirect `/onboarding/welcome`.
- Admin allowlist path retained for bootstrap.

## 8. Routes & guards

```
/onboarding/welcome   public-ish (no draft required); entry CTA
/onboarding/details   requires nothing yet → creates the draft on submit
/onboarding/connect   requires a valid draft cookie (else → /welcome); provider gated by draft role
/auth/login           credentials form (username+password) + Google/GitHub
```
- Middleware: `/onboarding/*` already redirects fully-onboarded users to dashboard.
  Add: `/onboarding/connect` (and `details` post-submit) require the draft cookie.

## 9. Build slices

0. This spec.
1. Data model + validation (User fields, OnboardingDraft, Zod).
2. Draft API routes.
3. Auth config (credentials provider + reconcile-at-callback).
4. Onboarding pages (welcome / details / connect) on the app design system.
5. Login screen credentials form.
6. Admin provisioning (seed/allowlist set a username+password).
7. Tests + full gate (schemas, reconcile, provider↔role + ADMIN-rejection,
   credentials login, middleware).

## 10. Deferred / open

- Password reset + rate-limiting/lockout on the credentials path (note for a
  follow-up; not in the first cut).
- Backfilling `username` for existing seeded users (handled in slice 6 seed).
