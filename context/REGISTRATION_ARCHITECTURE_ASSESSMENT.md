# Registration — architecture assessment (2026-08-22)

Written **before** any code was changed, from reading the repository. Every claim
below cites the file it was read from.

## 1. How authentication works today

| Question | Answer | File |
| --- | --- | --- |
| Where are users stored? | MongoDB, one `User` collection, Mongoose | `src/lib/models/User.model.ts` |
| How is a password stored? | `hashedPassword`, bcrypt, cost 12, `select: false` | `src/lib/models/User.model.ts`, `src/types/index.ts:1001` |
| Who hashes it? | `hashSecret()` / `verifySecret()` | `src/lib/utils.ts` |
| How does login work? | NextAuth v4 `CredentialsProvider.authorize()` — resolves by `username` **or** `email`, throttles per identifier, bcrypt-compares, DB-backed lockout after 5 failures for 15 min | `src/lib/auth/options.ts` |
| How is a session made? | JWT strategy, 24 h. `jwt` callback hydrates `id`, `role`, `firstName`, `onboardingStage`, `isOnboarded`, `isVerified` from the DB row | `src/lib/auth/options.ts` |
| How is the current user read? | Server: `getServerSession(authOptions)`. Client: `useSession()`. Edge: `getToken()` | everywhere |
| How is authorization done? | Two layers: `src/middleware.ts` (route prefix → role) and `requireRole(session, ...roles)` inside every API route | `src/middleware.ts`, `src/lib/utils.ts` |
| Which routes are public? | `EXEMPT_PREFIXES` in the middleware — includes `/auth`, `/api/auth`, `/marketplace`, `/knowledge` | `src/middleware.ts` |
| What is protected? | matcher: `/dashboard/*`, `/onboarding/*`, `/api/admin/*` | `src/middleware.ts` |

## 2. The gap

**There is no way to create an account without Google or GitHub.**

`/onboarding/welcome` renders two `ProviderButton`s and nothing else
(`src/app/onboarding/welcome/WelcomeClient.tsx`). The account row is created
inside the NextAuth `signIn` callback after a provider returns a verified email
(`src/lib/auth/options.ts`). `CredentialsProvider` exists **for sign-in only** —
the password it checks is set at `/onboarding/password`, one screen *after* OAuth
has already created the row.

Consequences:
- No account can be created offline, or without a Google/GitHub account.
- The provider gate (`providerAllowsRole`) makes GitHub the only route to
  `STUDENT` and Google the only route to everything else, so a demonstration
  needs two external accounts.
- A live demonstration of "a new user joins" depends on Google's consent screen,
  network reachability and OAuth redirect URIs.

## 3. Minimum valid user record

From `userSchema`: `email` (unique, lowercased) and `firstName` are the only
required fields. `role` is explicitly nullable, `onboardingStage` defaults to
`COMPLETED`, `status` defaults to `ACTIVE`. Everything else — `lastName`,
`phoneNumber`, `county`, the role sub-documents — is optional and filled by the
funnel.

**No related records are required.** Role sub-documents (`farmerData` etc.) are
embedded, not referenced, and are seeded by `buildRoleDefaults()`
(`src/lib/auth/roleDefaults.ts`) when the role is chosen. `Institution` is a real
collection but the link is optional. So: creating a user is a single insert.

## 4. Who may self-register

`roleSelectionSchema` already answers this and is the server-side authority:

```
z.enum([Role.FARMER, Role.BUYER, Role.STUDENT, Role.LECTURER])
```

`ADMIN` and `INSTITUTION` are absent **by construction**
(`src/lib/validation/onboardingSchema.ts`, `src/app/onboarding/_components/roleOptions.tsx`).
`ADMIN` is provisioned only by the `ADMIN_EMAIL_ALLOWLIST` bootstrap in the
`signIn` callback. Registration must preserve that model exactly.

## 5. Decisions

- **R1 — extend, do not replace.** Registration becomes a *second entry point*
  into the funnel that already exists. It reuses the User model, the
  `CredentialsProvider`, `hashSecret`, `resolveUniqueUsername`, the
  `OnboardingStage` machine, `buildRoleDefaults` and `sendWelcome`.
- **R2 — the account is created at stage `ROLE_SELECTION`.** `PASSWORD_SETUP`
  exists only because OAuth creates a row before a password exists; a
  registration already has one, so that stage is skipped rather than faked.
- **R3 — the registration endpoint takes no `role` field.** Role is chosen at
  the existing step 2, validated server-side against `roleSelectionSchema`.
  Nothing in the request body can influence privilege.
- **R4 — auto sign-in via `signIn('credentials')`**, i.e. the same code path a
  returning user takes. No bespoke session minting.
- **R5 — `isEmailVerified: false`** for a registered account. Nobody verified it.
  OAuth sets it true because the provider asserted it. Documented as a limitation.
- **R6 — email uniqueness** is the DB unique index. A pre-check gives a useful
  message; the `11000` duplicate-key error is the race-safe backstop and
  `handleApiError` already maps it to 409.

## 6. Defect found while reading (fixed as part of this work)

`POST /api/onboarding/role` computes:

```ts
const providerAllows =
  user.oauthProvider === OAuthProvider.GITHUB ? role === Role.STUDENT : role !== Role.STUDENT;
```

An account with **no** `oauthProvider` falls into the `else` branch and is
therefore barred from `STUDENT`. That is unreachable today (every account has a
provider) but is wrong the moment a credentials account exists. Fixed by making
the absence of a provider mean "no provider constraint" — the four
self-registerable roles all remain available, and the GitHub/Google rules are
untouched for OAuth accounts.
