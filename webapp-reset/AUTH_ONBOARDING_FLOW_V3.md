# Auth & Onboarding Flow V3 — OAuth-first

**Status:** APPROVED by owner 2026-08-03 (chat directive). **Amends
[AUTH_ONBOARDING_FLOW_V2](AUTH_ONBOARDING_FLOW_V2.md)**, which stays on file as the
record of the pre-auth draft design it replaces.

This changes **platform logic** (auth, onboarding, RBAC) and the **data model**,
done under explicit owner direction, as V2 was before it.

---

## 1. What changed and why

V2 collected role + username + password **before** the account existed, held them
in an `OnboardingDraft` behind a signed cookie, and reconciled them at the OAuth
callback. It worked, but it front-loaded a form onto people who had not yet
committed to anything, and it made the sign-up path five screens long.

V3 inverts it. **OAuth comes first**, the account is created from the provider
identity, and the platform only asks for what the provider could not tell it.

| | V2 | V3 |
|---|---|---|
| First screen | Interstitial → details form | Provider picker |
| Account created | At the OAuth callback, from a draft | At the OAuth callback, from the provider identity |
| Name / avatar | Never collected | Taken from the provider |
| Username | Typed by the user | Derived from the provider, editable |
| Password | Before OAuth | After OAuth |
| Role | Before OAuth (role gates provider) | After OAuth (provider gates role) |
| Screens for a new user | 5 | 3 |

## 2. Resolved flow

```
/onboarding/welcome          Continue with Google  |  Continue with GitHub
        ↓  (OAuth consent)
   signIn callback           account created — PENDING: no role, no password
        ↓
/onboarding/password         username (pre-filled) + password + confirm
        ↓
/onboarding/role-selection   Farmer · Buyer · Student · Lecturer  (gated by provider)
        ↓
/onboarding/identity-input   role-specific fields only
        ↓
/onboarding/verification-*   role-specific, where the role requires it
        ↓  dashboardForRole(role)
```

Future logins: username-or-email + password, **or** the linked provider.
Admin is not in this funnel — provisioned with a username + password, or
bootstrapped from `ADMIN_EMAIL_ALLOWLIST` on a Google sign-in.

## 3. Security invariants

The V2 invariants carry over. One is **restated**, because V3 changes the
mechanism that used to enforce it.

1. **ADMIN is never self-selectable.** Unchanged, and now enforced structurally:
   the OAuth callback creates accounts with `role: null`, and the only route that
   can set a role (`POST /api/onboarding/role`) validates against
   `roleSelectionSchema`, whose enum is `{FARMER, BUYER, STUDENT, LECTURER}`.
   `NGO`, `EMPLOYER` and `INSTITUTION` are equally excluded — organisation
   accounts are provisioned, never self-claimed.
2. **~~No account creation without a draft.~~ SUPERSEDED.** V2 refused to create
   an account for an OAuth identity that had no draft cookie. V3 makes creation
   the normal path, so this rule is gone. The **anti-takeover protection it was
   guarding is unchanged** and rests where it always actually sat:
   - the email must be **provider-verified** (`resolveVerifiedEmail`), and
   - an email already bound to a **different** provider or to a credentials
     account is **refused, never auto-linked** (`?error=AccountExists`).

   What a new identity obtains is deliberately inert: no role, no password, no
   verification, and `middleware` will not route it to any dashboard until a role
   exists.
3. **Provider↔role, direction reversed.** V2 read the role from the draft and
   checked the provider against it. V3 has no role at sign-in time, so the check
   moves to role selection and runs the other way: a GitHub account may only
   become a STUDENT; a Google account may become anything except STUDENT.
   Enforced in `POST /api/onboarding/role` against the stored `oauthProvider`.
4. Passwords are **bcrypt-hashed**, `select:false`, never returned or logged.
5. `POST /api/onboarding/password` only ever moves an account **off**
   `PASSWORD_SETUP`. It is not a password-change endpoint; that is the reset flow.

## 4. Data model

**`OnboardingStage`** — new first value **`PASSWORD_SETUP`**, preceding
`ROLE_SELECTION`. Additive; existing users are unaffected.

**`User`** — no new fields. `lastName` and `profilePhotoUrl` already existed and
are now populated from the provider at creation instead of being left empty.

**`OnboardingDraft`** — **deleted**, along with the signed `onboarding_draft`
cookie helper. Nothing reads them under V3.

## 5. Removed

| Path | Reason |
|---|---|
| `src/app/onboarding/details/` | Its job (role + credentials) now happens after OAuth, split across two screens |
| `src/app/onboarding/connect/` | OAuth is the first screen, not the last |
| `src/app/api/onboarding/draft/` | No drafts |
| `src/app/api/onboarding/username-available/` | The username is derived and checked at submit |
| `src/lib/models/OnboardingDraft.model.ts` | No drafts |
| `src/lib/auth/onboardingDraftCookie.ts` | No draft cookie |
| npm scripts / registry entries for the above | Dead references |

## 6. Added

| Path | Purpose |
|---|---|
| `src/lib/auth/oauthIdentity.ts` | Normalises Google and GitHub profiles into name / avatar / username seed; unique-username resolution |
| `src/lib/auth/welcome.ts` | Role-specific welcome, extracted from `options.ts` because it now fires at role selection, not at account creation |
| `src/app/onboarding/password/` | The credentials step (`PASSWORD_SETUP`) |
| `src/app/api/onboarding/password/` | Sets username + password, advances to `ROLE_SELECTION` |
| `src/app/onboarding/_components/roleOptions.tsx` | The four self-selectable roles, defined once |
| `src/components/app/BrandIcons.tsx` | Official Google and GitHub marks |
| `src/components/app/ProviderButton.tsx` | The provider sign-in button |

## 7. Presentation changes

- **Role-card illustrations removed** — see the amendment note in
  [ILLUSTRATION_PLAN_AUTH_ONBOARDING_V1](ILLUSTRATION_PLAN_AUTH_ONBOARDING_V1.md).
  Lucide icons at icon weight replace them. Concept illustrations elsewhere in
  the funnel (sign-in, verification handoff) are **kept** — those do a job the
  role cards' did not.
- **Official provider marks** on every OAuth button, so the buttons are
  recognisable before the label is read.
- **`ChoiceCard` is now a real radio group** (`role="radiogroup"` /
  `role="radio"` / `aria-checked`, one tab stop, arrow-key traversal). It was
  four `aria-pressed` buttons, which announced four unrelated toggles.
- **Website "Get started" repointed** from `/auth/login` to
  `/onboarding/welcome`. It had been sending every new visitor to the
  returning-user screen.

## 8. Abandoned pending accounts — CLOSED 2026-08-03

An account that authenticates but abandons onboarding at `PASSWORD_SETUP` is a
real row holding a verified email and a derived username, and nothing else — no
password, no role, no data, no route it can reach. V2 had no equivalent because
it created nothing until the end: its `OnboardingDraft` was a side record with a
30-minute Mongo TTL.

A TTL index cannot be used here — it would sit on the `User` collection, and no
expiry field can safely be added to real accounts. The cleanup is explicit, in
`src/lib/auth/pendingAccounts.ts`, and has **two mechanisms** because the problem
has two halves:

**1. Reclaim on sign-in — the half a user can feel.** The original write-up
framed this as tidiness, which understated it. The real damage was a lockout:
someone who abandoned a Google attempt and returned on GitHub met
`?error=AccountExists` and could not sign up at all, because the linking policy
was defending an account that held nothing. The `signIn` callback now deletes a
stale pending row and creates a fresh one for whichever provider they came back
with. Immediate; no scheduler involved.

**2. The weekly sweep — hygiene.** `prunePendingAccounts()` clears the long tail
nobody returns to, so abandoned rows stop holding usernames. Weekly is
sufficient *because* mechanism 1 already covers the user-visible case. It runs as
a sub-task of `/api/cron/weekly-jobs` (Vercel Hobby allows two cron entries in
total), with `/api/cron/prune-pending-accounts` available for manual invocation,
matching how `cleanup-sessions`, `market-insight` and `impact-summary` are wired.

**TTL: 30 minutes** (`PENDING_ACCOUNT_TTL_MS`), matching V2's draft. Comfortably
longer than filling in a three-field form, so a live signup is never swept
mid-flow.

**Scope, and why deleting is safe.** The sweep is confined to `PASSWORD_SETUP`:
stage, age, `role: null`, no `hashedPassword`, and `status: ACTIVE` must all
hold. An account that reached `ROLE_SELECTION` has a password the user chose — a
real credential — so it is kept even without a role; they can sign in and finish.
Anyone whose pending account is removed re-authenticates with the same
provider-verified email and gets a fresh one, losing nothing they had entered.

Verified against real documents: of four rows differing only in stage, age and
whether a password was set, the sweep took the abandoned one and left the
in-progress signup, the password-bearing `ROLE_SELECTION` account, and the
completed account.

## 9. Remaining gap

An account that sets a password and then abandons at `ROLE_SELECTION` keeps its
username indefinitely with no role attached. It is deliberately not swept — the
password is a real credential and the user can sign in and finish at any time —
but nothing prompts them to. A reminder email after some days would close it.
Not urgent: the account is reachable and recoverable by its owner, which is the
opposite of the `PASSWORD_SETUP` case.
