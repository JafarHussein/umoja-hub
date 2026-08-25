# Email link production fix — links a phone can open

**Date:** 2026-08-25
**Branch:** `fix/email-link-public-base-url`
**Symptom reported:** a link in a UmojaHub email, tapped from a phone, shows
"This site can't be reached".

---

## 1. Root cause

**Outbound email links were addressed with the origin the server answers on, not
the address the public can reach.**

Every absolute link the platform put in an email was built from `NEXTAUTH_URL`.
That variable answers a different question than the one an email link asks:

| Question | Answer | Variable |
| --- | --- | --- |
| Where does *this process* serve requests? | `http://localhost:3000` when running locally | `NEXTAUTH_URL` |
| Where can *anyone else* reach UmojaHub? | `https://umoja-hub.vercel.app` | *did not exist* |

`NEXTAUTH_URL` **has** to be `http://localhost:3000` on a development machine —
Google and GitHub must redirect the OAuth callback back to the process that
started it. So on that machine there was no correct value: whatever makes sign-in
work makes email links wrong.

The two facts had no separate names in the codebase, so email borrowed the only
one available.

## 2. Why the link failed

A local run does not send simulated email. `.env.local` holds the real Gmail SMTP
credentials (`smtp.gmail.com`, `umojahub16@gmail.com`), so every rehearsal, demo
and manual test sent **real mail to real inboxes** — carrying:

```
http://localhost:3000/dashboard/farmer                (welcome email, CTA button)
http://localhost:3000/auth/reset-password?token=…     (password reset)
```

Verified, not assumed — resolved through the application's own code with the
project's real environment loaded:

```
RAW NEXTAUTH_URL     : "http://localhost:3000"
welcome email CTA    : http://localhost:3000/dashboard/farmer
password reset link  : http://localhost:3000/auth/reset-password?token=<64-hex>
```

## 3. Why it failed *specifically* on a phone

`localhost` is not a name that travels. It resolves on **whatever device is
asking**, to that device itself. The link was never corrupted in transit, never
malformed in the template, never rewritten by Gmail, and never blocked by
middleware:

- On the sending laptop, with `npm run dev` running, the link opened perfectly.
  That is why it survived every check.
- On a phone, `localhost:3000` resolves to the phone, where nothing is listening
  on port 3000 → the browser reports **"This site can't be reached"**.

The link was correct for exactly one computer in the world, and it was never the
recipient's.

## 4. URL before the fix

| Email | Link before |
| --- | --- |
| Welcome (sent at role selection) | `http://localhost:3000/dashboard/{role}` |
| Password reset | `http://localhost:3000/auth/reset-password?token=<64 hex>` |
| Student verification code | *(no link — 6-digit PIN only)* |

Sent **from production** the same code produced correct links, because on Vercel
`NEXTAUTH_URL` *is* the public origin. The defect was invisible in production and
guaranteed in every local run.

## 5. URL strategy after the fix

One resolver, `siteUrl()` in `src/lib/env.ts`, is the single source of every
absolute URL the platform emits (page metadata, `robots.txt`, `sitemap.xml`, and
every link inside an email). First well-formed value wins:

1. **`PUBLIC_SITE_URL`** — the canonical public address, stated explicitly. New.
2. **`NEXTAUTH_URL`** — the deployment's own origin. Correct on Vercel, where the
   server *is* the public address.
3. **`VERCEL_PROJECT_PRODUCTION_URL`** — Vercel's production alias. A safety net
   so a preview deployment, or a production one whose `NEXTAUTH_URL` was never
   set, still links to the real application instead of a URL that dies with the
   deployment. Vercel supplies it without a scheme; `siteUrl()` upgrades it to
   `https`.
4. `http://localhost:3000` — last resort, so resolution can never throw.

Resolution stays total: a malformed candidate is skipped rather than thrown on. A
schemeless `NEXTAUTH_URL` once failed the entire production build from the root
layout's `metadataBase`, and a cosmetic URL must never be able to do that again.

After the fix, on the same local machine:

```
NEXTAUTH_URL (server origin) : http://localhost:3000
PUBLIC_SITE_URL              : https://umoja-hub.vercel.app
siteUrl() (public base)      : https://umoja-hub.vercel.app
loopback?                    : false
welcome email CTA            : https://umoja-hub.vercel.app/dashboard/farmer
password reset link          : https://umoja-hub.vercel.app/auth/reset-password?token=<64-hex>
```

### The failure can no longer ship silently

`emailService` — the one point where mail leaves the process — now checks the
link it is about to send and logs `EMAIL_LINK_UNREACHABLE` at ERROR level if it
points at a loopback address. It does **not** suppress the email: a reset link
that reaches the wrong address is still recoverable by the person who asked for
it, whereas an email that never arrives is not.

## 6. Environment variables involved

| Variable | Meaning | Local | Vercel production |
| --- | --- | --- | --- |
| `NEXTAUTH_URL` | The origin this server answers on. Required by NextAuth for OAuth callbacks. | `http://localhost:3000` (must stay) | `https://umoja-hub.vercel.app` |
| `PUBLIC_SITE_URL` | **New, optional.** The canonical public address every outbound link is built from. | `https://umoja-hub.vercel.app` (set in `.env.local`, which is gitignored) | may stay unset — `NEXTAUTH_URL` is already public there |
| `VERCEL_PROJECT_PRODUCTION_URL` | Supplied by Vercel. Backstop only. | absent | `umoja-hub.vercel.app` |
| `SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM` | Nodemailer transport. Unchanged. | Gmail | Gmail (confirmed working — see §11) |

There were **no competing URL variables** to reconcile: `NEXTAUTH_URL` was the
only one, and the fix does not displace it — it names the second fact that was
missing.

`PUBLIC_SITE_URL` is deliberately **not** added to the required list in
`validateEnv()`. It is optional, so no existing deployment breaks by omitting it.

Four server-side self-fetches (`marketplace`, `marketplace/[listingId]`,
`knowledge`, `knowledge/[slug]`) still read `NEXTAUTH_URL` directly, and
correctly so — they are the server calling *its own* API, which is precisely the
"where does this process answer" question. Pointing them at the public URL would
make a local dev server fetch production's data.

## 7. Vercel configuration involved

- Project `umoja-hub` (`prj_Dw9hhHW6AgK3CvMWd1FHiGfxABX2`), team
  `team_J5ZFqMNXOQg7s05fIbTlEW3t`.
- Production domain: **`https://umoja-hub.vercel.app`**. No custom domain.
  Aliases `umoja-hub-…-projects.vercel.app` and `…-git-main-…` redirect to it.
- Deploys run through the **Vercel Git integration**, not GitHub Actions —
  merging to `main` is what ships.
- `vercel.json` declares only the two cron entries; it does not affect routing,
  rewrites or redirects for any emailed route.
- Production's `NEXTAUTH_URL` was confirmed correct without reading the secret
  store, by two independent probes of the deployed app: `GET /robots.txt` →
  `Host: https://umoja-hub.vercel.app`, and `GET /api/auth/providers` → all three
  provider callbacks on `https://umoja-hub.vercel.app`. NextAuth v4 falls back to
  `localhost:3000` on a malformed value, so this also rules out a schemeless or
  trailing-slash value.

## 8. Routes involved

| Route | Kind | Status |
| --- | --- | --- |
| `POST /api/auth/register` | API | creates the account. Sends **no** email — `isEmailVerified: false`, nothing dispatched. |
| `POST /api/onboarding/role` | API | the account's **first email**: `sendWelcome` → `notify` → lifecycle email with the "Open UmojaHub" button. This is the "account-related link" in the report. |
| `/dashboard/{farmer,buyer,student,lecturer,admin}` | page | the welcome button's target. |
| `POST /api/auth/password-reset/request` | API | issues the reset link. |
| `/auth/reset-password?token=…` | page | consumes it; handles a missing token with its own message. |
| `POST /api/auth/password-reset/confirm` | API | validates and claims the token. |
| `POST /api/onboarding/institutional-email` | API | 6-digit PIN, **no link**. |

**There is no email-verification route.** Registration does not send a
verification email at all; account verification is the admin/document queue, not
an emailed token. Nothing points at `/verify/…`.

## 9. Middleware involved

`src/middleware.ts` — **no change was needed, and none was made.**

- Its `matcher` covers only `/dashboard/*`, `/onboarding/*`, `/api/admin/*` and
  the Daraja webhook. `/auth/reset-password` is not matched at all, so the reset
  link reaches the page untouched, query string intact.
- `/auth` is on the exemption list as well, so it is public twice over.
- The welcome button targets `/dashboard/{role}`, which *is* matched. Opening it
  on a phone with no session redirects to
  `/auth/login?callbackUrl=/dashboard/farmer` — deliberate, and the destination
  is preserved as a relative path specifically so a proxy's internal host cannot
  corrupt it. That is a login prompt, not a broken link.
- The classic failure mode (middleware eats the token by redirecting an
  unauthenticated verification request) does not apply: the token-bearing route
  is not behind middleware.

One stale detail, left alone deliberately: `EXEMPT_PREFIXES` still lists
`'/verify/'` for an "email-verification landing (DOC-01)" route that does not
exist in the app. It is inert — nothing links there — and removing it is a
cleanup outside this fix.

## 10. Changes made

| File | Change |
| --- | --- |
| `src/lib/env.ts` | `siteUrl()` becomes the canonical public-URL resolver with the four-step precedence above. New `isLoopbackUrl()`. |
| `src/lib/notifications/notify.ts` | Builds the lifecycle CTA from `siteUrl()` instead of raw `NEXTAUTH_URL`. The CTA is now always rendered — the old conditional quietly produced a buttonless email when the base was unset. |
| `src/app/api/auth/password-reset/request/route.ts` | Link built from `siteUrl()`. Send moved from fire-and-forget to `after()`. |
| `src/app/api/onboarding/institutional-email/route.ts` | PIN send moved to `after()`. |
| `src/lib/integrations/emailService.ts` | `warnIfUnreachable()` guard at the single point where mail leaves the process. |
| `.env.local.example` | Documents `PUBLIC_SITE_URL` and why it is not `NEXTAUTH_URL`. |
| `.env.local` *(gitignored, not committed)* | `PUBLIC_SITE_URL=https://umoja-hub.vercel.app`. |
| tests | `env.test.ts`: precedence + loopback cases. Two route tests: `after()` mock, and the reset link is now asserted to be an absolute `https://…` URL with a 64-hex token, not merely to contain a path. |

### A second defect found while tracing: emails that never left

`sendPasswordResetEmail` and `sendInstitutionalEmailPin` were called
fire-and-forget. On a serverless route that is not a background job — the
invocation returns and the pending promise is suspended with it.

Observed in production, not theorised. A reset requested at **08:22:40** produced
`Password reset link issued` and then nothing. The email did not leave until
**08:23:43** — 63 seconds later, logged under a *different, unrelated request's*
invocation that happened to wake the same instance. On a quiet deployment there
may be no such request, and the email is delayed indefinitely or lost.

Both now use Next 15's `after()`, which hands the callback to the platform and
keeps the invocation alive until it settles, while the response still returns
immediately — preserving the reset route's anti-enumeration property (an awaited
SMTP round-trip would have made "account exists" measurable by response time).

The welcome email was never affected: `notify()` awaits its send.

## 11. Tests performed

**Static trace, before any change** — every URL-producing site in the repo
enumerated. Only two constructed absolute links for email, and both bypassed the
existing `siteUrl()` helper.

**Production probes (deployed app, before the change):**

| Probe | Result |
| --- | --- |
| `GET /robots.txt` | `Host: https://umoja-hub.vercel.app` — production base URL is correct |
| `GET /api/auth/providers` | all callbacks on `https://umoja-hub.vercel.app` |
| `GET /api/health` | `{"status":"ok","db":true}` |
| `GET /marketplace` | 20 listings — production and local share one Atlas database, so an account created in either is visible in both |

**Live end-to-end registration against production** (`umojahub16+linktest1@`, a
plus-address delivering to the project's own inbox):

1. `POST /api/auth/register` → `201`, stage `ROLE_SELECTION`.
2. NextAuth credentials sign-in → session cookie issued.
3. `POST /api/onboarding/role` → `200`.
4. Vercel runtime log, same invocation: `emailService · Lifecycle email sent ·
   to: umojahub16+linktest1@gmail.com · subject: "UmojaHub — Welcome to
   UmojaHub"` with a Gmail message id.

This proves SMTP is configured and working **in production**, and that the
welcome email is the account's first email.

**Token handling** (read, not changed — it was already correct): 32 random bytes
as 64 hex characters, so nothing in the token needs URL-encoding; stored only as
a SHA-256 digest; claimed atomically on `usedAt: null` + unexpired, so a replay
cannot succeed even under a race; 30-minute TTL; an invalid, expired or
already-used token all produce the same clear "This reset link is invalid or has
expired." The reset page renders its own message when `?token=` is absent.

**Template** (read, not changed): a plain `<a href="…">` with the URL
HTML-escaped, table-based layout with inline styles, no JavaScript, no
client-side URL assembly, visible label and `href` in agreement.

**Gates after the change:**

| Gate | Result |
| --- | --- |
| `npm run type-check` | pass |
| `npm run lint` | pass — 0 errors (5 pre-existing warnings, all unrelated) |
| `npm run test` | **1531 passed, 123 suites, 0 failed** |
| `npm run build` | pass (exit 0) |

## 11b. Verification after the fix was deployed

Merged as PR #75 (`e8d452a`), deployed as `dpl_9jQ6RzzR7founBwU4yjjB15ZLy3d`,
aliased to `umoja-hub.vercel.app`. All five PR checks passed: Type Check · Lint ·
Test · Build, Integration (MongoDB), Playwright (build · visual), and the Vercel
preview build.

### The exact anchors the emails now carry

Rendered through the real template with the real environment:

```
welcome email anchor href : https://umoja-hub.vercel.app/dashboard/farmer
reset  email anchor href  : https://umoja-hub.vercel.app/auth/reset-password?token=<64-hex>
```

Absolute, `https`, public host, single query parameter, no encoding hazard.

### Real email sent from the local machine — the path that was broken

The failure was a *local* one, so the fix was proved there first: a full
registration through the local dev server, which sent genuine Gmail to a real
inbox.

```
emailService · Lifecycle email sent   · to: umojahub16+phonetest@gmail.com
                                        subject: "UmojaHub — Welcome to UmojaHub"
auth         · Password reset link issued
emailService · Password reset email sent · to: umojahub16+phonetest@gmail.com
```

No `EMAIL_LINK_UNREACHABLE` in the log — the new guard inspected both links and
found neither of them loopback. Under the previous code this identical path
produced `http://localhost:3000/dashboard/farmer`.

### Full end-to-end against the deployed production build

| Step | Result |
| --- | --- |
| `POST /api/auth/register` | `201` |
| credentials sign-in | `200`, session cookie |
| `POST /api/onboarding/role` | `200` → welcome email |
| `POST /api/auth/password-reset/request` | `200` → reset email |
| `GET /auth/reset-password?token=…` | `200` — public, no auth redirect, query intact |
| `GET /auth/reset-password` | `200` |
| `GET /dashboard/farmer` *(no session)* | `307` → `/auth/login?callbackUrl=%2Fdashboard%2Ffarmer` — destination preserved and encoded |
| `POST …/confirm` with an unknown 64-hex token | `400` "This reset link is invalid or has expired." |
| `POST …/confirm` with a malformed token | `400`, same message — no leak of which failed |

### The delayed-email defect, measured before and after

| Build | Reset requested | Email sent | Gap | Invocation |
| --- | --- | --- | --- | --- |
| before (`dpl_DyK2…`) | 08:22:40 | 08:23:43 | **+63 s** | a *different, unrelated* request |
| after (`dpl_9jQ6…`) | 08:53:30 | 08:53:32 | **+2 s** | its own |

Both production emails now leave inside the invocation that created them.

## 12. Desktop test result

**Pass.** Both emailed destinations were opened in a real browser against the
live production deployment and their rendered content read, not merely their
status codes:

- `/auth/reset-password?token=…` → **"Choose a new password"**, with New password
  and Confirm password fields and the Reset password button. The token was
  carried from the query string into the page.
- `/auth/reset-password` with no token → **"Invalid reset link — This link is
  missing its reset token. Request a new one to continue."** plus a "Request a
  new link" action.
- `/dashboard/farmer` with no session → **"Sign in to UmojaHub"**, at
  `/auth/login?callbackUrl=%2Fdashboard%2Ffarmer`.

Rendered at a 390 × 844 viewport — phone dimensions — so the mobile layout is
confirmed as well as the routing.

## 13. Android test result

**Pass — confirmed by the owner on 2026-08-25.** The email was opened on a phone,
the link was tapped, and UmojaHub loaded.

This is the result the whole fix was for, and it is the only one that could
settle it. Every other check in this document was performed on the machine that
generates the links, and that machine is precisely where the defect was
invisible: `http://localhost:3000` resolved there and nowhere else. A link is
only right or wrong relative to where it is read, so the test had to be read
somewhere else.

## 14. iPhone test result

*Not available — no iPhone in this environment.* The link is a plain HTTPS anchor
with no platform-specific behaviour, so nothing distinguishes iOS from Android
here.

## 15. Other email links checked

Every outbound email in the codebase was enumerated. There are exactly three
senders, and only two carry a link:

| Sender | Used by | Link | Status |
| --- | --- | --- | --- |
| `sendLifecycleEmail` | **all 30+ `notify()` / `notifyAdmins()` call sites** — welcome, order status, dispatch, escrow release/refund, disputes and mediation, payout requests and approvals, farmer/buyer/lecturer/supplier verification, education demonstrations, report submission and review, price alerts | one CTA button | **fixed at the shared mechanism** — one change in `notify.ts` corrects every one of them |
| `sendPasswordResetEmail` | password reset | the reset link | **fixed** |
| `sendInstitutionalEmailPin` | student institutional email | none — a 6-digit PIN | unaffected (delivery reliability fixed) |

SMS (`smsService`) sends no links at all. There is no separate template per
event: every lifecycle email is one template with one CTA, which is why the
underlying mechanism only had to be fixed once.

## 16. Final production URL verification

Canonical production URL: **`https://umoja-hub.vercel.app`**, confirmed against
the deployed application itself (§7), not inferred from configuration.

## 17. Remaining limitations

1. ~~The phone test is not done.~~ **Done — see §13.** The reported symptom is
   confirmed gone on the device it was reported from.
2. **The fix for the reported symptom is partly configuration.**
   `PUBLIC_SITE_URL` now lives in `.env.local`, which is gitignored — it cannot
   be committed. Anyone cloning this repo onto another machine must set it, or
   local email reverts to loopback links. The `EMAIL_LINK_UNREACHABLE` guard
   exists precisely because that is a configuration mistake nobody would
   otherwise see until a recipient reported it.
3. **`PUBLIC_SITE_URL` is not set in Vercel and does not need to be.** Production
   resolves correctly through `NEXTAUTH_URL`. If a custom domain is ever added,
   set `NEXTAUTH_URL` to it and email follows automatically.
4. **A welcome link opened on a phone lands on the login screen first.** That is
   correct behaviour — the phone has no session — and the destination is carried
   through `?callbackUrl=`. It is not the reported bug, but it is what a tester
   will see.
5. **`after()` depends on the host keeping the invocation alive.** Vercel does. A
   different host that kills the process at response time would reintroduce the
   delayed-email behaviour of §10.
6. **Not fixed, deliberately, as outside this bug:** the vestigial `'/verify/'`
   middleware exemption (§9); the absence of a plain-text alternative part on
   outbound email; and the duplicate-Mongoose-index warnings visible in the
   production logs.
7. **Test accounts created during this work** and left in the shared database,
   all FARMER at stage `IDENTITY_INPUT`: `umojahub16+linktest1@gmail.com`
   (production, pre-fix baseline), `umojahub16+phonetest@gmail.com` (local,
   post-fix), `umojahub16+prodtest@gmail.com` (production, post-fix). All three
   are plus-addresses of the project's own mailbox. The next `npm run demo` reset
   clears them.
