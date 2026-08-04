# UmojaHub — Production Readiness Roadmap

> ⚠️ **RE-BASELINED 2026-06-20 — read the re-baseline section first.** The 31-task
> build order below was authored 2026-05-31 and is now **almost entirely
> implemented**. The original analysis is preserved verbatim as the design record;
> the current truth lives in **"## RE-BASELINE (2026-06-20)"** immediately below.

**Target**: First 100 real users  
**Originally assessed**: 2026-05-31 (Staff Engineering review)  
**Original starting point**: ~78% functional / ~45% operational readiness  
**Current status (2026-06-20)**: ~95% code-complete · ~60% launch-ready (remainder is external ops + Safaricom go-live)  
**Estimated effort to launch**: launch-ops checklist + Safaricom go-live wait (1–2 weeks); feature build is effectively done

> **Scope constraint**: This roadmap optimizes exclusively for safely serving the first 100 real users with real money transacting. It does not optimize for 10,000 users, venture scale, or speculative future requirements. Every item that does not meaningfully improve launch readiness is explicitly excluded.

> **Budget constraint**: Until UmojaHub generates revenue, receives grants, secures partnerships, or obtains investor funding, no paid infrastructure is required. This roadmap targets $0/month in recurring infrastructure costs, with the sole exception of Africa's Talking SMS (pay-per-message, unavoidable for M-Pesa workflows — estimated $1–5/month at 100 users). Every recommendation has been evaluated against free-tier limits, and migration paths to paid infrastructure are documented for when revenue arrives.

---

## RE-BASELINE (2026-06-20)

This section supersedes the headline numbers above. Everything below the next
horizontal rule (PART 1 onward) is the **original 2026-05-31 design record**,
preserved unedited.

### What changed since 2026-05-31

Four programs landed between the original assessment and this re-baseline:

1. **Corrective Actions program** — `context/CORRECTIVE_ACTIONS_CHECKLIST.md` reads **51/51 complete** (DOC-01…07, FIX-01…08, BE-01…09, AUTH-01…07, QA-01…04, UI-01…15). Closed most functional + backend gaps.
2. **Payment simulation layer** (PR #25) — `PaymentProvider` abstraction; `PAYMENT_PROVIDER=simulation` default with a production-grade simulator; Daraja swap-in preserved (`src/lib/payments/`).
3. **Webapp nuclear reset + Auth & Onboarding V2** — full app design-system implementation, all five role dashboards migrated, and the dual credentials/OAuth onboarding with password reset + brute-force lockout. Merged to `main` via **PR #33**.
4. **Escrow (Food Hub)** — ✅ **DONE, merged to `main` 2026-06-21 (PR #34**, merge commit `c83cb5d`). Farmer payout now derives from order `COMPLETED` (buyer-confirmed receipt) rather than `PAID`, closing the non-dispatch trust gap the architecture always implied. Admin RELEASE/REFUND on mediation (activates the reserved `REFUNDED`/`DISPUTED` states), append-only `EscrowEventLog`, admin escrow read-model + dashboard, farmer/buyer escrow surfaces, lifecycle SMS, and public-copy truth-up. Provider-agnostic (downstream of `processStkCallback`); no stored wallet — balances stay derived. Investigation in `context/ESCROW_ARCHITECTURE_REPORT.md`; P0–P5 checklist in `context/ESCROW_IMPLEMENTATION_CHECKLIST.md`.

> **Branch caveat:** PRs #33 and #34 are now **merged to `main`**. The app implementation (design system, five role dashboards, Auth V2) and the escrow feature are in `main`/production-track. "DONE" below means built + tested + merged.

### 31-task build order — current status

| # | Task | Status | Evidence |
|---|------|--------|----------|
| 1 | DB backup (GitHub Actions) | ✅ DONE | `.github/workflows/backup.yml` |
| 2 | `vercel.json` 2-cron config | ✅ DONE | `vercel.json` + `api/cron/weekly-jobs` |
| 3 | Health endpoint | ✅ DONE | `api/health` |
| 4 | Axiom log drain | ⏳ EXTERNAL | code emits structured logs; needs account + Vercel integration |
| 5 | Uptime monitoring | ⏳ EXTERNAL | needs UptimeRobot account on `/api/health` |
| 6 | Upstash Redis setup | ◐ CODE DONE | `rateLimit.ts` uses `@upstash/redis`; needs prod env vars |
| 7 | Distribute rate limiter | ✅ DONE | `src/lib/rateLimit.ts` |
| 8 | Rate-limit AI/order endpoints | ✅ DONE | assistant, mentor/chat, orders |
| 9 | Cloudinary 4MB limit | ✅ DONE | `cloudinaryService.ts` (`MAX_FILE_SIZE_BYTES = 4MB`) |
| 10 | Email service | ✅ DONE (by design) | `emailService.ts` — **nodemailer/SMTP** (accepted owner decision; not Resend) |
| 11 | Email verification at registration | ⊘ SUPERSEDED | Auth V2 uses OAuth provider-verified email + onboarding draft |
| 12 | Password reset flow | ✅ DONE | `api/auth/password-reset/{request,confirm}` + UI pages |
| 13 | Webhook IP allowlist + drop query secret | ✅ DONE | `middleware.ts` `DARAJA_ALLOWED_IPS`; signature verify |
| 14 | Stuck-payment reconciliation | ✅ DONE | `api/cron/price-alert-check` reconciliation pass |
| 15 | `AdminAuditLog` model | ✅ DONE | `AdminAuditLog.model.ts` |
| 16 | Wire audit log into admin routes | ✅ DONE | admin verify/payout/mediation routes |
| 17 | Suspended-user write enforcement | ✅ DONE | orders + marketplace status checks |
| 18 | Request-ID logging | ◐ PARTIAL | present in several routes (e.g. cron, admin); not universal |
| 19 | Admin verification UI | ✅ DONE | full `/dashboard/admin/*` (13 pages) |
| 20 | TrustScoreDisplay on listings | ✅ DONE | `marketplace/[listingId]/page.tsx` |
| 21 | Marketplace text search | ✅ DONE | `$text` + `?q=` in `api/marketplace` |
| 22 | Payment-failure admin alerting | ✅ DONE | `payments/processCallback.ts` (admin SMS on `ResultCode!==0`) |
| 23 | Webhook test coverage | ✅ DONE | `api/webhooks/daraja/__tests__/route.test.ts` |
| 24 | Cloudinary signed uploads | ✅ DONE | `api/upload/sign` |
| 25 | `Permissions-Policy` header | ✅ DONE | `next.config` |
| 26 | Password complexity | ✅ DONE | `passwordSchema` = min8 + uppercase + lowercase + number |
| 27 | Seed production admin | ◐ CODE DONE | `scripts/seed.ts` seeds an admin; prod execution pending |
| 28 | Production domain + HTTPS | ⏳ EXTERNAL | purchase + Vercel domain config |
| 29 | Daraja production credentials | ⏳ EXTERNAL | Safaricom go-live (1–2 wk) — critical path |
| 30 | Runbook | ✅ DONE | `context/RUNBOOK.md` (148 lines) |
| 31 | Launch-readiness E2E on prod | ◐ PARTIAL | 18 Playwright specs exist; final prod walkthrough pending |

### Security items — current status

`C1` IP allowlist ✅ · `C2` query-secret removed ✅ · `C3` email-verify ⊘ superseded (OAuth) · `C4` email service ✅ · `C5` upload payload ✅ · `H1` distributed RL ✅ · `H2` AI RL ✅ · `H3` payment RL ✅ · `H4` suspended-user writes ✅ · `H5` admin audit ✅ · `M1` password complexity ✅ (uppercase + lowercase + number) · `M2` request-ID ◐ partial · **`M3` CSP `unsafe-eval`/`unsafe-inline` ✗ STILL PRESENT** · `M4` signed uploads ✅ · `L1` Permissions-Policy ✅ · `L2` user data-deletion endpoint ✗ deferred (manual process).

### Revised scorecard (supersedes PART 9)

| Category | 2026-05-31 | 2026-06-20 | Notes |
|----------|-----------|-----------|-------|
| Security | 55% | ~88% | M3 (CSP) + universal request-ID remain |
| Operations | 40% | ~85% | Axiom/UptimeRobot are external setup |
| Payments | 70% | ~92% | code done; Daraja go-live external |
| Trust | 80% | ~95% | admin UI + display + audit all shipped |
| Reliability | 45% | ~85% | backup/reconciliation done; needs prod wiring |
| Monitoring | 15% | ~80% | health/alerting/logs done; Axiom external |
| Testing | 35% | ~85% | 697 unit + 18 E2E + webhook tests |
| Deployment | 70% | ~85% | CI/CD done; domain + Daraja external |
| Documentation | 30% | ~70% | runbook complete |
| Feature completeness | 78% | ~97% | every role workflow built + tested |

### The TRUE remaining work

**External / launch-ops (the dominant remainder):**
1. ✅ **DONE** — PR #33 (app/Auth V2) and PR #34 (escrow) both merged to `main` (2026-06-21).
2. Safaricom **Daraja production go-live** (Task 29) — the critical path; flip `PAYMENT_PROVIDER` to a Daraja provider with prod credentials.
3. **Production domain + HTTPS** + set `NEXTAUTH_URL` / `MPESA_CALLBACK_URL` (Task 28).
4. **Monitoring accounts**: Axiom log drain (Task 4) + UptimeRobot (Task 5).
5. **Prod env vars** (Upstash, SMTP, etc.) and **seed the production admin** (Task 27).
6. Final **production E2E walkthrough** (Task 31).

**Minor code items still open (low effort, optional pre-launch):**
- `M3` — remove CSP `unsafe-eval`; move to nonce-based `unsafe-inline`.
- `M2`/Task 18 — make request-ID correlation universal across all routes.
- **Resolved 2026-06-20:** email provider is nodemailer/SMTP **by design** (accepted owner decision — supersedes the roadmap's Resend recommendation in Tasks 10/12); password complexity now requires **uppercase + lowercase + number** (`passwordSchema`, Task 26 / M1 satisfied).
- `L2` — self-service data-deletion endpoint (deferred; manual admin process documented).

**Known follow-up from the auth work:** the old onboarding funnel pages/routes (`onboarding/{identity-input,role-selection,verification-upload}` + their APIs) are orphaned by Auth V2 and await a cleanup decision.

---

## FREE-TIER PRODUCTION STRATEGY (0–100 USERS)

This section is the authoritative infrastructure decision record. Every service used by UmojaHub is assessed against free-tier viability for a 100-user pilot. Sequence, architecture, and implementation priorities from the rest of this document remain unchanged.

---

### MongoDB Atlas M0 (Free)

**Free tier limits**: 512MB storage, shared cluster (no dedicated resources), no automated backups, no point-in-time recovery, maximum ~500 shared connections.

**Can it support 100 users?** Yes.  
At 100 users with typical usage (farmers, buyers, students), the total dataset will be approximately 50–100MB — well within the 512MB ceiling. A Mongoose singleton connection pattern means each Vercel serverless instance holds one connection; with 100 concurrent users this rarely exceeds 10–20 active connections.

**Functionality disabled until paid plan**:
- Automated daily backups → replaced by GitHub Actions weekly backup (see Task 1)
- Point-in-time recovery → not available; weekly backup provides coarse recovery
- Performance Advisor → not available; acceptable at this scale
- Dedicated compute → shared cluster is acceptable for a pilot

**Functionality that must still be implemented**:
- Connection pooling via Mongoose singleton (already implemented at `src/lib/db.ts`)
- All existing indexes (already defined in all model schemas)
- Proper `connectDB()` calls at the top of every API route (already enforced by CLAUDE.md)

**The backup problem**: M0 has no automated backups. This is the primary risk of staying on free tier. It is solved without paying for M10 by implementing a GitHub Actions scheduled workflow that runs `mongodump` weekly, compresses the output, and commits it to a private backup repository. This is a legitimate production backup strategy for a zero-budget project.

```yaml
# .github/workflows/backup.yml
name: Weekly Database Backup
on:
  schedule:
    - cron: '0 2 * * 0'  # Sunday 2am UTC
  workflow_dispatch:
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          repository: your-org/umojahub-backups
          token: ${{ secrets.BACKUP_REPO_TOKEN }}
      - name: Install mongodump
        run: |
          wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
          echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
          sudo apt-get update && sudo apt-get install -y mongodb-database-tools
      - name: Run backup
        run: |
          mongodump --uri="${{ secrets.MONGODB_URI }}" --gzip --archive=backup-$(date +%Y%m%d).gz
      - name: Commit and push
        run: |
          git config user.email "backup@umojahub.com"
          git config user.name "Backup Bot"
          git add backup-*.gz
          git commit -m "Weekly backup $(date +%Y-%m-%d)"
          # Keep only last 4 backups
          ls -t backup-*.gz | tail -n +5 | xargs -r git rm
          git push
```

**Trade-offs vs M10**:
- M10 ($57/month): Daily automated backups, point-in-time recovery to any minute, dedicated cluster, Performance Advisor
- M0 + GitHub Actions: Weekly backups only, recovery to last Sunday 2am, shared cluster, manual performance analysis
- For a 100-user pilot, weekly recovery granularity is acceptable. In the worst case (database corruption between backups), up to 7 days of data is at risk. This is a known and documented risk.

**Migration trigger**: Upgrade to M10 when monthly revenue exceeds $200, OR when storage exceeds 360MB (70% of 512MB), OR when connection errors appear in logs (indicating shared cluster saturation).

---

### Vercel Hobby (Free)

**Free tier limits**: 100GB bandwidth/month, 100GB-hours serverless compute/month, 6,000 minutes build time/month, **2 cron jobs per project**, 1 custom domain, 1-hour function log retention.

**Can it support 100 users?** Yes, with one architectural adjustment.

For a Next.js 15 app serving 100 users, typical monthly usage is 2–5GB bandwidth and 1–5GB-hours compute — well within Hobby limits.

**Critical constraint — Cron job limit**: Vercel Hobby allows exactly 2 cron jobs. The plan originally specified 4 crons. This requires consolidation:

**Solution**: Combine `cleanup-sessions`, `market-insight`, and `impact-summary` into a single `/api/cron/weekly-jobs` route that runs all three on Monday 3am UTC. The individual route files are preserved for manual invocation and testing. The cleanup-sessions cron is already belt-and-suspenders — MongoDB TTL indexes on `ChatSession` and `MentorSession` are the primary cleanup mechanism. The cron was only a backup. Dropping it from the schedule is safe.

**Second constraint — cron frequency**: Hobby also caps cron *invocations at once per day*. The `*/15 * * * *` schedule this section originally specified is not achievable on Hobby, and the shipped `vercel.json` correctly uses a daily schedule.

**Actual `vercel.json` cron configuration** (2 crons, daily-or-less, within Hobby limits):
```json
{
  "crons": [
    { "path": "/api/cron/price-alert-check", "schedule": "0 0 * * *" },
    { "path": "/api/cron/weekly-jobs", "schedule": "0 3 * * 1" }
  ]
}
```

**Consequence for payments**: stuck-payment reconciliation and simulated-callback delivery cannot depend on cron frequency, or stock would stay reserved for up to 24 hours. Both are therefore triggered lazily on the request path — the buyer's `payment-status` poll reconciles and delivers for their own order within seconds — with the daily cron acting only as the unscoped backstop for orders nobody is watching. See `src/lib/payments/reconcile.ts` and `dispatcher.ts`.

**New `/api/cron/weekly-jobs` route** runs sequentially: cleanup-sessions logic → market-insight aggregation → impact-summary computation. Same CRON_SECRET auth. Each sub-task logs independently with service labels for traceability.

**Log retention (1 hour)**: The 1-hour log retention on Hobby is an operational risk. Debugging a payment failure 2 hours later is impossible with Vercel Logs alone. Mitigated by adding Axiom as a free log drain (500MB/day ingestion, 30-day retention, native Vercel integration via Log Drains). Axiom free tier is more than sufficient for 100 users.

**Functionality disabled until Pro plan**:
- More than 2 cron jobs → solved by consolidation
- Extended log retention beyond 1 hour → solved by Axiom free tier
- Advanced analytics → acceptable; UptimeRobot covers uptime visibility

**Migration trigger**: Upgrade to Vercel Pro ($20/month) when: more than 2 independent cron schedules are required, OR monthly bandwidth exceeds 80GB, OR when 24-hour log retention becomes operationally required and Axiom free tier is insufficient.

---

### Upstash Redis (Free)

**Free tier limits**: 10,000 commands/day, 256MB storage, 1 database, REST API only (no persistent connections — irrelevant for serverless).

**Can it support 100 users?** Yes, with significant headroom.

Rate limiting command budget at 100 users:
- Login attempts: ~200/day × 2 commands (INCR + GET) = 400 commands/day
- Registration: ~10/day × 2 = 20
- AI assistant (20 calls/user/hour limit): ~100 active calls/day × 2 = 200
- Order creation (5/user/hour limit): ~50 orders/day × 2 = 100
- **Total**: ~720 commands/day — 7.2% of the 10,000 daily limit

**Trade-offs**: REST-based client (@upstash/redis) adds ~20ms per rate limit check versus a persistent Redis connection. For 100 users on serverless, this is acceptable and matches the expected Vercel cold-start latency anyway.

**Migration trigger**: Upgrade to Upstash Pay-as-you-go ($0.20 per 100K commands beyond free) when daily commands consistently exceed 8,000.

---

### Cloudinary (Free)

**Free tier limits**: 25GB storage, 25GB bandwidth/month, 25,000 transformations/month.

**Can it support 100 users?** Yes, with very large safety margin.

Worst case: 100 farmers × 5 listings × 5 images × 4MB = 10GB storage. Even at full capacity this stays within the 25GB limit. Monthly bandwidth for image delivery to buyers: 100 users × 100 page views × 3 images × 200KB average (Cloudinary auto-optimizes) = 6GB/month — well within limits.

**Functionality disabled until paid plan**: None. All required features (upload, deliver, basic transformation) are within the free tier.

**Migration trigger**: Storage >20GB OR bandwidth >20GB/month.

---

### Groq (Free)

**Free tier limits**: Rate-limited but free. Approximately 14,400 requests/day at current limits. The farm assistant uses `llama3-8b-8192` which has generous free allowances.

**Can it support 100 users?** Yes. Even if every registered farmer uses the assistant 10 times daily, that is 1,000 requests/day — 7% of the daily limit.

**Functionality that must still be implemented**: Rate limiting on `/api/assistant` (per-user 20 requests/hour) protects against a single user consuming the shared quota. This is already planned in Task 7.

**Migration trigger**: API errors from Groq rate limiting appearing in logs more than 3 times in a week.

---

### OpenWeatherMap (Free)

**Free tier limits**: 1,000 API calls/day, current weather data included.

**Can it support 100 users?** Yes. Weather context is fetched once per farm assistant session. With 100 farmers, estimate 20–50 weather API calls/day — 5% of the daily limit.

**Migration trigger**: >800 calls/day.

---

### Africa's Talking (Pay-per-Message — Unavoidable)

**Cost**: ~KES 1–2 ($0.007–0.015) per SMS in Kenya. There is no free tier for SMS delivery.

**Why it cannot be eliminated**: M-Pesa payment confirmation SMS is the primary real-time trust signal in the transaction flow. Removing it degrades the user experience in ways that damage platform trust with farmers who rely on SMS confirmation to prepare orders.

**Minimisation strategy**: Only send SMS for events that directly require user action or confirmation:
1. Payment confirmed (buyer and farmer) — 2 SMS/order
2. Price alert triggered — 1 SMS/alert
3. Order fulfillment confirmed — 1 SMS/order

Do not send SMS for: registration, verification status, education events (email is sufficient for those).

**Estimated cost at 100 users**:
- 20 orders/month × 3 SMS/order = 60 SMS = ~$0.45–0.90
- 50 price alerts/month = ~$0.35–0.75
- **Total: $1–2/month**

This is the only unavoidable infrastructure cost at pilot scale.

**Migration trigger**: Not a migration — SMS costs scale linearly with usage. Budget accordingly.

---

### Email: Resend (Free) — Replaces SendGrid

**Reason for change**: SendGrid no longer offers a meaningful free plan suitable for production use. Resend provides a genuine production-ready free tier with better developer experience.

**Free tier limits**: 3,000 emails/month, 100 emails/day, 1 custom domain.

**Can it support 100 users?** Yes. Email verification (100 emails during onboarding) + password resets (~5–10/month) + verification decision notifications (~20/month) = ~130 emails/month total — well within daily and monthly limits.

**Implementation**: The `emailService.ts` implementation is identical in interface to the SendGrid version. Only the underlying API client changes. The `SENDGRID_API_KEY` env var is renamed to `RESEND_API_KEY`. The `env.ts` required vars list is updated to reflect this.

**Migration trigger**: >2,500 emails/month (approaching daily limit consistently), OR when sending transactional emails to users beyond the platform (partner notifications, invoices).

---

### Observability: Axiom (Free) — Replaces Sentry / Paid Logging

**Why**: Vercel Hobby provides only 1-hour log retention. Production operations require the ability to investigate payment failures, webhook issues, and auth anomalies after the fact.

**Free tier limits**: 500MB/day ingest, 30-day retention, 1 organization, native Vercel Log Drain integration.

**Can it support 100 users?** Yes. Structured JSON logs from 100 users generating ~1,000 requests/day at ~2KB/log entry = 2MB/day — 0.4% of the daily ingest limit.

**Setup**: Vercel Marketplace → Add Axiom integration → Enable Log Drain for production deployment. No code changes required. All existing `logger.*` output (which already goes to `console.*`) is captured automatically.

**Functionality**: 30-day searchable logs. Full-text search over structured JSON. Free forever for this usage level.

**Migration trigger**: Log ingest consistently exceeds 400MB/day (extremely unlikely at 100 users).

---

### Monitoring: UptimeRobot (Free)

**Free tier limits**: 50 monitors, 5-minute check intervals, email and SMS alerts.

**Assessment**: Already recommended in the original plan. No changes. Fully sufficient for 100 users.

---

### Backups: GitHub Actions (Free)

Covered in the MongoDB Atlas M0 section above. GitHub Actions free tier: unlimited minutes for public repos, 2,000 minutes/month for private repos. A weekly backup job takes ~5 minutes. 4 runs/month = 20 minutes — 1% of the 2,000 minute allowance.

---

### CI/CD: GitHub Actions (Free)

**Assessment**: Already in place (`ci.yml`, `e2e.yml`). No changes. The current CI pipeline (type-check → lint → test → integration → build, plus Playwright) runs within GitHub Actions free tier with significant headroom. Deployment itself is handled by Vercel's Git integration, not by Actions.

---

### What remains paid (unavoidably)

| Service | Why unavoidable | Estimated cost at 100 users |
|---------|----------------|----------------------------|
| Africa's Talking | M-Pesa SMS confirmation (core to transaction trust) | $1–5/month |
| Domain name | Required for production HTTPS and Daraja callback URL | ~$10–15/year |
| **Total recurring** | | **$1–5/month** |

---

## PART 1 — REASSESSMENT OF THE MISSING 38%

The prior 62% completion estimate was conservative. Functional core is closer to 78%. The real gap is operational, not feature-based.

### Group Cooperative Ordering
**Previous**: Missing. **Actual**: Complete.  
`FarmerGroup` and `GroupOrder` models are fully implemented. API at `GET|POST /api/groups`, `POST /api/groups/[groupId]/orders`, `PATCH /api/groups/[groupId]/orders/[orderId]`. Status transitions (OPEN → MINIMUM_MET → CLOSED → FULFILLED) and per-member M-Pesa payment tracking in `participatingMembers[]` are implemented.  
**Action**: None.

### Notification Infrastructure
**Previous**: Missing. **Actual**: Partially complete.  
Africa's Talking SMS is integrated at `src/lib/integrations/smsService.ts`. Price alerts, order payment confirmation, and fulfillment events send SMS. Non-blocking failure pattern is correct.  
**What is actually missing**: Email. `SENDGRID_API_KEY` is required at boot but no `emailService.ts` exists. Password reset is non-functional. The env var is renamed to `RESEND_API_KEY` — the email provider is Resend (free tier: 3,000 emails/month), not SendGrid.  
**Category**: Critical Before Launch.

### Public Credential Verification
**Previous**: Missing. **Actual**: Does not exist as public-facing feature.  
Farmer and supplier verification exist as admin workflows. No public endpoint for buyer-side independent verification.  
**Category**: Can Wait Until After Launch — for first 100 users, trust score on listings is sufficient.

### Search
**Previous**: Missing. **Actual**: MongoDB find-based filtering only.  
No text indexes. No `?q=` search parameter on marketplace API.  
**Category**: Important Before Launch — not critical, but buyers need to find produce without browsing all listings.

### Real-Time Capabilities
**Previous**: Missing. **Actual**: Not implemented, not needed.  
No WebSocket, SSE, or polling. SMS covers the critical real-time use case (payment confirmation).  
**Category**: Unnecessary For First 100 Users.

### Distributed Rate Limiting
**Previous**: Gap. **Actual**: In-memory implementation exists, documented as non-distributed.  
`src/lib/rateLimit.ts` uses a Map scoped to each serverless instance. Cold starts reset it. Multiple concurrent Vercel instances do not share state.  
**Category**: Important Before Launch — login brute force is bypassable. Upstash Redis free tier is the fix.

### Webhook IP Allowlisting
**Previous**: Gap. **Actual**: Deferred — `verifyDarajaSignature()` always returns `true`.  
Current security: HTTPS callback URL + `WEBHOOK_SECRET` query param. Safaricom publishes IP ranges. Allowlisting takes 30 minutes.  
**Category**: Critical Before Launch — forged payment confirmations are possible without this.

### Email Integration
**Previous**: Not assessed. **Actual**: Missing entirely.  
`SENDGRID_API_KEY` validated at boot but never used. No `emailService.ts`. Password reset routes do not exist. Provider: Resend (free, 3,000 emails/month — replaces SendGrid).  
**Category**: Critical Before Launch.

### Admin Dashboard UI
**Previous**: Minimal. **Actual**: API-complete, UI-missing.  
Verification queue, verify farmer, verify supplier, impact summary routes all exist. No admin UI.  
**Category**: Critical Before Launch — platform cannot onboard farmers without a functional verification UI.

### Test Coverage
**Previous**: Partial. **Actual**: 9 test files, no E2E.  
Validation schemas, trust calculator, auth register, and ratings have tests. Payment webhook, order flow, and group ordering have no coverage.  
**Category**: Important Before Launch — payment webhook idempotency is the highest-risk untested code path.

### Revised Gap Classification

| Item | Corrected Classification | Action |
|------|--------------------------|--------|
| Group Ordering | Already Complete | None |
| Email Service | Critical Before Launch | Build (Resend free tier) |
| Admin UI | Critical Before Launch | Build minimal |
| Webhook IP Allowlisting | Critical Before Launch | Configure |
| Distributed Rate Limiting | Important Before Launch | Upstash Redis free tier |
| Marketplace Search | Important Before Launch | MongoDB text index |
| Public Credential Verification | Can Wait | Skip |
| Real-Time Capabilities | Unnecessary | Skip |
| Redis Caching (general) | Unnecessary at this scale | Skip |
| Mobile App | Unnecessary | Skip |

---

## PART 2 — DEFINITION OF 100% READY FOR FIRST 100 USERS

### Functional Completeness
- Every user can register, verify email, and log in
- Farmers can list produce, upload images, and complete verification
- Buyers can browse listings, search by crop, place orders, and pay via M-Pesa
- Payment confirmation is received by both parties via SMS within 60 seconds
- Farmers can confirm and mark orders fulfilled
- Students can complete the full project workflow (brief → submit → peer review → lecturer review → verified)
- Lecturers can review queued submissions
- Admins can approve/reject farmer and lecturer verifications through a UI — not raw API calls
- Password reset works end-to-end via email
- Price alerts trigger correctly and deliver via SMS

### Trust Completeness
- Farmer trust scores are calculated and displayed on listings
- Verified badge appears on listings from approved farmers
- Supplier verification workflow is operational
- Lecturer verification is enforced before they can review submissions
- Rating system updates trust scores atomically after order completion
- No user can spoof a verification status

### Operational Completeness
- Two cron jobs are configured in `vercel.json` (Hobby limit): price-alert-check and weekly-jobs
- Failed payments restore inventory atomically
- Daraja webhook is protected from forged callbacks (IP allowlist)
- Sessions expire correctly (7-day JWT, 90-day chat TTL)
- Rate limiting on login cannot be bypassed across serverless instances
- All errors produce structured JSON logs visible in Axiom (30-day retention)
- Environment variables are validated at boot; missing vars fail fast
- Health check endpoint is live and monitored via UptimeRobot

### Security Completeness
- No API endpoint is accessible without appropriate authentication
- No role can access another role's data
- All user input is validated with Zod before reaching the database
- File uploads are restricted to image types under 4MB
- No secrets are in version control
- Daraja webhook URL is protected by IP allowlist
- Password storage uses bcrypt with 12 rounds
- Injection is not possible (Mongoose ODM, no raw query strings)
- XSS is mitigated by CSP headers

### Deployment Completeness
- CI passes on every push: type-check → lint → test → build
- Production deploys only from `main` via GitHub Actions
- Environment variables are managed in Vercel project settings
- Database is Atlas M0 with automated weekly backup via GitHub Actions to a private repository
- Production domain is configured and HTTPS is enforced
- First admin user is seeded in production database
- Daraja production credentials are active

---

## PART 3 — OPERATIONAL INFRASTRUCTURE AUDIT

### Authentication
**Current state**: Credentials (email + password), NextAuth v4, JWT 7-day max age, bcrypt 12 rounds, constant-time comparison on missing users, 10 login attempts per 15 minutes.  
**Risk**: Medium  
**Gaps**: No email verification at registration. No persistent account lockout across serverless instances.  
**Fix**: Email verification token flow. Distribute rate limiter to Upstash Redis free tier.  
**Effort**: 3 days

### Authorization
**Current state**: `requireRole()` on all API routes. Middleware guards `/dashboard/*` and `/api/admin/*`. Role stored in JWT.  
**Risk**: Low  
**Gap**: Role inflated once at sign-in. Suspended users retain access for up to 7 days.  
**Fix**: On sensitive write operations, verify `user.status === ACTIVE` against DB after `getServerSession()`.  
**Effort**: 4 hours

### Session Management
**Current state**: JWT strategy, 7-day max age, `sameSite: 'lax'`, HTTPS on Vercel.  
**Risk**: Low  
**Gap**: No session revocation. A compromised token is valid for 7 days.  
**Fix**: Reduce JWT max age to 24 hours. Sufficient for first 100 users.  
**Effort**: 15 minutes

### Rate Limiting
**Current state**: In-memory Map in `src/lib/rateLimit.ts`. Applied only to login.  
**Risk**: High  
**Gaps**:
1. Login rate limiter is per-instance — bypassable via concurrent serverless instances
2. No rate limiting on registration (spam account creation)
3. No rate limiting on AI assistant endpoints (Groq quota exposure)
4. No rate limiting on payment initiation (STK Push spam)  
**Fix**: Upstash Redis free tier (10,000 commands/day — well within budget for 100 users) for distributed atomic increment. Apply to login, register, `/api/assistant`, `/api/mentor/chat`, `POST /api/orders`.  
**Effort**: 1 day

### Logging
**Current state**: Structured JSON logger in `src/lib/utils.ts`. Vercel captures all console output.  
**Risk**: Medium (elevated by Vercel Hobby 1-hour log retention)  
**Gap 1**: No request ID correlation. Cannot trace a request chain (order create → STK Push → webhook) across log entries.  
**Gap 2**: Vercel Hobby retains logs for only 1 hour. Debugging a payment failure discovered 2 hours later is impossible without a log drain.  
**Fix**: Generate `requestId` (crypto.randomUUID()) at API route entry. Thread through logger calls. Add Axiom free Log Drain (500MB/day, 30-day retention) via Vercel Marketplace — zero code changes required.  
**Effort**: 1 day for request IDs; 30 minutes for Axiom setup

### Audit Trails
**Current state**: `VerificationAuditLog` covers education verification. Payment events tracked on `Order` document. No admin action audit trail.  
**Risk**: Medium  
**Gap**: Admin verification approvals and rejections leave no permanent record.  
**Fix**: Append-only `AdminAuditLog` model. Log all verification decisions with adminId, action, targetId, decision, reason, timestamp.  
**Effort**: 1 day

### Error Handling
**Current state**: `AppError` + `handleApiError` on all routes. Machine-readable error codes. Non-blocking side effects catch and log.  
**Risk**: Low  
**Gap**: No visibility into how often side effects (SMS, trust calc) fail silently.  
**Fix**: Acceptable for first 100 users. Monitor via Axiom (30-day log retention).  
**Effort**: None required now

### Background Jobs (Cron)
**Current state**: 4 cron route handlers exist with correct logic and CRON_SECRET auth.  
**Risk**: Medium  
**Gap 1**: Cron jobs are not configured in `vercel.json`. They will not run automatically.  
**Gap 2**: Vercel Hobby allows only 2 cron jobs. The original plan specified 4.  

**Fix**: Consolidate to 2 crons within the Hobby limit. Create a new `/api/cron/weekly-jobs` route that runs cleanup-sessions, market-insight, and impact-summary logic sequentially. Individual route files are preserved for manual invocation. Cleanup-sessions is safe to fold into weekly-jobs because MongoDB TTL indexes on `ChatSession` and `MentorSession` are the primary mechanism — the cron was belt-and-suspenders.

**Revised `vercel.json`** (2 cron entries, within Hobby limit):
```json
{
  "crons": [
    { "path": "/api/cron/price-alert-check", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/weekly-jobs", "schedule": "0 3 * * 1" }
  ]
}
```

**`/api/cron/weekly-jobs` execution order**:
1. Delete expired ChatSessions and MentorSessions (cleanup-sessions logic)
2. Aggregate weekly price data into MarketInsight (market-insight logic)
3. Compute platform-wide impact metrics (impact-summary logic)

**Migration trigger**: Upgrade to Vercel Pro ($20/month) if independent scheduling becomes necessary for each job (e.g., cleanup needs to run nightly while insights run weekly).  
**Effort**: 1 hour to create the consolidated route + 30 minutes for `vercel.json`

### Webhook Security
**Current state**: HTTPS callback URL + `WEBHOOK_SECRET` query param. IP verification always returns `true`.  
**Risk**: High  
**Gap**: Forged Daraja callback can mark an order PAID without actual payment.  
**Fix**: IP allowlisting via Vercel middleware against Safaricom's published Daraja IP ranges. Free — Vercel middleware runs on Hobby.  
**Effort**: 2 hours

### Secrets Management
**Current state**: `env()` validates 23 required vars at boot. `.env.local` is gitignored. Vercel project settings store production secrets.  
**Risk**: Low (one gap)  
**Gap**: `WEBHOOK_SECRET` passed as query param appears in Vercel access logs.  
**Fix**: Move to middleware-level IP check. Eliminate the query param entirely once IP allowlisting is in place.  
**Effort**: 1 hour

### Database Backups
**Current state**: MongoDB Atlas M0 (free tier). No automated backups. No point-in-time recovery.  
**Risk**: High — but mitigated without upgrading to M10.  
**Gap**: Data loss with no recovery path.  

**Free-tier fix**: Automated weekly backup via GitHub Actions. A scheduled workflow runs `mongodump` against the Atlas M0 connection string, compresses the archive with gzip, and commits it to a private GitHub repository. Four weekly backups are retained (rolling deletion of older archives). This runs within the GitHub Actions free tier (2,000 minutes/month for private repos; a backup job takes ~5 minutes).

**Why not M10 ($57/month)**: Unnecessary for 100 users on a zero-budget launch. Weekly granularity means maximum 7 days of data loss in a worst-case scenario. This is a known, documented, accepted risk at pilot scale. M10 is the correct upgrade when the platform generates revenue.

**Recovery procedure**: Download the most recent backup archive from the private backup repository. Run `mongorestore --uri=$MONGODB_URI --gzip --archive=backup-YYYYMMDD.gz`. Estimated restoration time for a 100-user dataset: under 5 minutes.  
**Effort**: 2 hours to implement the GitHub Actions workflow + private backup repo

### Monitoring
**Current state**: Vercel Logs only. No uptime monitoring. No error rate visibility.  
**Risk**: High  
**Gap**: Platform outages are invisible until a user reports them.  
**Fix**: `GET /api/health` endpoint returning DB connection state. UptimeRobot free tier (50 monitors, 5-minute intervals) pinging the health endpoint. Both are free.  
**Effort**: 2 hours

### Alerting
**Current state**: None.  
**Risk**: High  
**Fix**: Payment failure alerting — when Daraja webhook receives `ResultCode !== 0`, send SMS to admin phone number via Africa's Talking. Non-blocking. Cost: ~$0.01 per alert — negligible.  
**Effort**: 2 hours

### Search
**Current state**: MongoDB `find()` with filter objects. No text search.  
**Risk**: Low for first 100 users  
**Fix**: MongoDB text index on `MarketplaceListing` (`title`, `cropName`, `description`). Expose `?q=` on `GET /api/marketplace`. Text indexes are available on Atlas M0 at no additional cost.  
**Effort**: 3 hours

### File Uploads
**Current state**: Direct API upload to Cloudinary from Next.js route. 5MB limit stated in validation.  
**Risk**: Medium  
**Gap**: Vercel API route payload limit is 4.5MB. 5MB uploads fail with unhelpful 413 before validation runs. Server receives full binary before forwarding.  
**Fix**: Lower validation limit to 4MB immediately. Switch to Cloudinary signed upload URLs (client uploads directly to Cloudinary; server only verifies result) for correct long-term pattern. Cloudinary signed uploads are available on the free plan.  
**Effort**: 30 minutes for limit fix; 1 day for signed URLs

### CI/CD
**Current state**: `ci.yml` runs type-check → lint → test → build on push and PRs, plus an `integration` job against a MongoDB service container. Production deploys are made by **Vercel's Git integration** on push to `main`; Vercel preview deployments on PRs act as staging. A second, redundant `deploy.yml` that re-built via `vercel pull` + `vercel build` was removed 2026-08-01 — it duplicated the integration and could not reproduce the production environment faithfully.  
**Risk**: Low  
**Gap**: None blocking for first 100 users. GitHub Actions free tier provides ample minutes.  
**Effort**: None required

### Infrastructure Cost (Monthly — Free-Tier Target)
| Service | Tier | Monthly Cost |
|---------|------|-------------|
| MongoDB Atlas | M0 (Free) | $0 |
| Vercel | Hobby (Free) | $0 |
| Upstash Redis | Free (10K cmds/day) | $0 |
| Cloudinary | Free (25GB storage) | $0 |
| Groq | Free tier | $0 |
| OpenWeatherMap | Free (1K calls/day) | $0 |
| Resend | Free (3K emails/month) | $0 |
| Axiom | Free (500MB/day logs) | $0 |
| UptimeRobot | Free (50 monitors) | $0 |
| GitHub Actions | Free (2K min/month) | $0 |
| Africa's Talking | Pay-per-SMS (unavoidable) | ~$1–5 |
| Domain name | Annual (~$10–15/year) | ~$1–2 |
| **Total** | | **~$2–7/month** |

---

## PART 4 — SECURITY HARDENING ROADMAP

### Critical

**C1 — Webhook Forgery (Daraja callback)**  
A forged callback can mark an order PAID without actual payment.  
Fix: IP allowlisting in Vercel middleware for `/api/webhooks/daraja`. Check `x-real-ip` / `x-forwarded-for` against Safaricom's published Daraja IP ranges before the request reaches the route handler. Free — Vercel middleware runs on Hobby.  
Effort: 2 hours

**C2 — WEBHOOK_SECRET in query param**  
Query params appear in Vercel access logs. Log exposure = secret exposure.  
Fix: Eliminate query param entirely once IP allowlisting is in place. IP-based auth at the middleware layer is stronger than a query secret.  
Effort: 1 hour (combined with C1)

**C3 — No email verification at registration**  
Anyone can register with someone else's email. Password reset is impossible without a verified delivery path.  
Fix: Generate `verificationToken` (crypto.randomUUID()) on registration, store with 24h expiry, send via Resend (free tier), block login until verified. Add `isEmailVerified`, `emailVerificationToken`, `emailVerificationExpiry` to User model. Rename `SENDGRID_API_KEY` to `RESEND_API_KEY` in `env.ts`.  
Effort: 2 days

**C4 — Missing email service (password reset blocked)**  
`SENDGRID_API_KEY` is required at boot but unused. No `emailService.ts` exists.  
Fix: Implement `src/lib/integrations/emailService.ts` using the Resend SDK (`resend` npm package). Implement forgot-password and reset-password routes. Resend free tier (3,000 emails/month) is sufficient. Update `SENDGRID_API_KEY` → `RESEND_API_KEY` in `env.ts` required vars and in `env.local.example`.  
Effort: 1 day

**C5 — File upload exceeds Vercel payload limit**  
5MB stated limit exceeds Vercel's 4.5MB API payload limit. Validation never runs on large files — Vercel rejects them first.  
Fix: Reduce to 4MB immediately. Implement Cloudinary signed upload URLs to eliminate server-side binary handling entirely. Both available on Cloudinary free tier.  
Effort: 30 minutes + 1 day for signed URLs

### High

**H1 — Login rate limiter bypass across serverless instances**  
Each Vercel function instance has its own in-memory Map. Concurrent instances each allow 10 attempts.  
Fix: Upstash Redis free tier atomic increment with TTL in `src/lib/rateLimit.ts`. Same interface, no call-site changes.  
Effort: 4 hours

**H2 — No rate limiting on AI endpoints**  
`/api/assistant` and `/api/mentor/chat` are unbounded. A single user can exhaust the shared Groq free-tier quota.  
Fix: Per-user rate limit (20 requests/hour) using Upstash Redis. Protects the shared Groq quota.  
Effort: 2 hours (after Redis setup)

**H3 — No rate limiting on payment initiation**  
`POST /api/orders` triggers a Daraja STK Push. Spam order creation generates Daraja API noise.  
Fix: Per-user rate limit (5 orders/hour).  
Effort: 1 hour (after Redis setup)

**H4 — Suspended user JWT remains valid for 7 days**  
Admin suspension has no immediate effect. Suspended users can continue transacting.  
Fix: On sensitive write operations (create listing, create order, submit review), verify `user.status === ACTIVE` against DB.  
Effort: 4 hours

**H5 — Admin actions produce no audit trail**  
Verification approvals and rejections are only captured in Vercel logs (1-hour retention on Hobby). Axiom extends this to 30 days, but a permanent DB record is the correct solution.  
Fix: Append-only `AdminAuditLog` model. Log all admin decisions.  
Effort: 1 day

### Medium

**M1 — No password complexity enforcement**  
`registerSchema` requires 8-100 chars but no complexity. "password" is valid.  
Fix: Zod `.refine()` requiring at least one uppercase, lowercase, and digit.  
Effort: 1 hour

**M2 — No request ID for log correlation**  
Cannot trace a request chain across log entries without manual timestamp matching.  
Fix: `crypto.randomUUID()` at API route entry, threaded through logger calls.  
Effort: 1 day

**M3 — CSP includes unsafe-eval**  
`next.config.ts` sets `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. Weakens XSS defense.  
Fix: Remove `'unsafe-eval'`. Replace `'unsafe-inline'` with nonce-based CSP via middleware.  
Effort: 4 hours

**M4 — Direct Cloudinary API upload**  
Server handles full binary. API key+secret exposure risk if environment is compromised.  
Fix: Signed upload URLs — server generates signed URL, client uploads directly, server verifies public_id. Available on Cloudinary free tier.  
Effort: 1 day

### Low

**L1 — Missing `Permissions-Policy` header**  
Camera, microphone, geolocation access not explicitly disabled.  
Fix: Add `Permissions-Policy: camera=(), microphone=(), geolocation=()` to `next.config.ts`.  
Effort: 30 minutes

**L2 — No user data deletion endpoint**  
Kenya Data Protection Act 2019 requires data subject rights. No deletion or export endpoint.  
Fix: Document a manual admin process for now. Build self-service deletion post-launch.  
Effort: 2 hours to document

---

## PART 5 — PAYMENT ARCHITECTURE REVIEW

### What Is Working Correctly
- STK Push amount set server-side from Order document — buyers cannot manipulate amounts
- Phone number normalization handles multiple Kenyan formats
- `mpesaTransactionId` unique sparse index prevents duplicate payment processing
- Webhook always returns HTTP 200 — prevents infinite Daraja retries
- Inventory restoration on `ResultCode !== 0` (payment failure)
- Non-blocking SMS notification to both parties

### Gaps

**Gap 1 — Stuck payment reconciliation**  
An order that never receives a webhook (Daraja timeout, network partition) stays in `AWAITING_PAYMENT` forever, permanently locking inventory.  
Fix: Add reconcile-stuck-orders logic to the weekly-jobs cron (runs Monday 3am). For a more responsive fix, also check within the price-alert-check cron (every 15 minutes): find orders in AWAITING_PAYMENT older than 30 minutes and cancel them. Both routes are within the 2-cron Hobby budget since reconciliation is added to existing routes.  
Effort: 4 hours

**Gap 2 — Webhook forgery**  
Covered in security section (C1). Fix: IP allowlisting.

**Gap 3 — Webhook duplicate handling**  
Verify: when a duplicate webhook arrives (Daraja retry), the handler hits the unique index constraint and generates a 409 internally. Confirm this 409 is caught and still returns HTTP 200 to Daraja, not propagated as a 500.  
Effort: 2 hours to verify + test

**Gap 4 — No payment failure alerting**  
Repeated `ResultCode !== 0` events indicate a Daraja configuration issue. Silent.  
Fix: SMS to admin on payment failure in the webhook handler. Non-blocking. Cost: ~$0.01/alert.  
Effort: 2 hours

**Gap 5 — No reconciliation process**  
No automated comparison between MongoDB orders and Daraja transaction reports.  
Fix: For first 100 users, this is a manual weekly process. Export Daraja reports from Business Manager, cross-reference against `Order` collection where `paymentStatus: PAID`. Document this as a weekly ops task.  
Effort: 2 hours to document

**Gap 6 — Daraja production go-live**  
Sandbox shortcode 174379 must be replaced with production credentials. Safaricom go-live process takes 1-2 weeks.  
Fix: Submit go-live application at the start of development work. Run in parallel with other tasks.  
Effort: Application submission: 1 hour. Approval: 1–2 weeks (Safaricom, not developer).

### Safety Assessment

| Scale | Safe? | Conditions |
|-------|-------|------------|
| 10 users | Yes | Current state |
| 50 users | Yes | After IP allowlisting + stuck-payment reconciliation |
| 100 users | Yes | After IP allowlisting, stuck-payment reconciliation, GitHub Actions backup, webhook test coverage |

---

## PART 6 — TRUST SYSTEM COMPLETENESS

### What Exists (Complete)
- **Farmer trust score**: 4-component formula (verification 40 + transaction 25 + rating 20 + reliability 15). Tier assignment (NEW/ESTABLISHED/TRUSTED/PREMIUM). Atomic recalculation after order completion and rating. Tests exist.
- **Farmer verification**: Document submission (National ID, Cooperative Card, Passport). Admin review queue. Approve/reject with reason. Score reflects verification status.
- **Supplier verification**: `VerifiedSupplier` model with KEBS/PCPB/KEPHIS numbers. County and input category filtering. Admin workflow.
- **Rating system**: Requires completed order (RECEIVED status). One rating per order (unique index). 1-5 scale. Trust score recalculates on submission.
- **Education verification**: Full multi-stage workflow. Append-only audit log with document hashes and GitHub snapshots. (Portfolio status was removed in the 2026-08-04 Education Hub vision reset.)
- **Lecturer verification**: Enforced before reviewer can submit reviews.

### What Is Missing

**Trust score display in UI**  
Score is calculated and stored. Design system includes `TrustScoreDisplay` component. Whether it renders on listing pages needs verification. Without it, trust data is invisible to buyers.  
**Classification**: Required before launch.

**Admin verification UI**  
API is complete. No UI exists. Admins cannot verify farmers without making raw API calls.  
**Classification**: Required before launch.

**Admin audit trail**  
Verification decisions leave no permanent record.  
**Classification**: Required before launch.

**Buyer reputation**  
No buyer history or dispute tracking visible to farmers.  
**Classification**: Future — manageable manually at first 100 users.

### Required vs Recommended vs Future

| Item | Status | Classification |
|------|--------|----------------|
| Farmer trust score calculation | Complete | Required |
| Farmer trust score display on listings | Verify UI | Required |
| Farmer verification workflow | Complete | Required |
| Admin verification UI | API only | Required |
| Admin verification audit trail | Missing | Required |
| Supplier verification | Complete | Required |
| Rating system | Complete | Required |
| Lecturer verification enforcement | Complete | Required |
| Education audit log | Complete | Required |
| Buyer reputation system | Missing | Future |
| Public credential lookup | Missing | Future |
| Group order trust signals | Missing | Future |

---

## PART 7 — ROADMAP PHASES

### Phase 0 — Critical Infrastructure (Blocks Everything Else)

**P0-1: Database backup automation (GitHub Actions)**  
Why: Atlas M0 has no automated backups. Real user data requires a documented recovery path. GitHub Actions free tier provides this at $0.  
Dependencies: Private GitHub backup repository, `BACKUP_REPO_TOKEN` secret  
Complexity: Low  
Risk if skipped: Complete data loss with no recovery path on M0 free tier

**P0-2: Upstash Redis (free tier)**  
Why: Distributed rate limiting, Daraja OAuth token caching. Free tier (10,000 commands/day) is sufficient for 100 users.  
Dependencies: Upstash account  
Complexity: Low  
Risk if skipped: Brute force vulnerability, Groq quota exposure

**P0-3: Email service (Resend free tier)**  
Why: Password reset non-functional. Email verification blocked. `SENDGRID_API_KEY` is replaced by `RESEND_API_KEY`. Resend free tier: 3,000 emails/month — sufficient for 100 users.  
Dependencies: Resend account (free)  
Complexity: Medium  
Risk if skipped: Users who forget passwords cannot recover. Platform is permanently locked for them.

**P0-4: Consolidated cron configuration (`vercel.json`)**  
Why: Four cron route handlers exist but will not execute. Vercel Hobby allows 2 crons. Consolidate into 2: price-alert-check and weekly-jobs.  
Dependencies: Create `/api/cron/weekly-jobs` route  
Complexity: Low  
Risk if skipped: Price alerts never fire. Market insights never compute.

**P0-5: Health check endpoint**  
Why: Uptime monitoring requires a ping target.  
Dependencies: None  
Complexity: Trivial  
Risk if skipped: Blind to outages

**P0-6: Axiom log drain**  
Why: Vercel Hobby retains logs for only 1 hour. Production operations require the ability to investigate payment issues after the fact. Axiom free tier: 500MB/day, 30-day retention, native Vercel integration.  
Dependencies: Axiom account (free), Vercel Log Drain  
Complexity: Trivial (no code changes — enabled via Vercel Marketplace)  
Risk if skipped: Cannot investigate payment failures or security events discovered after 1 hour

---

### Phase 1 — Security

**P1-1: Daraja webhook IP allowlisting**  
Why: Forged payment confirmations possible without this.  
Dependencies: Vercel middleware (runs on Hobby, free)  
Complexity: Low  
Risk if skipped: Payment fraud vector

**P1-2: Email verification at registration**  
Why: Anyone can register with any email. Password reset non-functional.  
Dependencies: P0-3  
Complexity: Medium  
Risk if skipped: Account integrity failure, no recovery path

**P1-3: Distribute rate limiter to Redis**  
Why: Per-instance limiter is bypassable.  
Dependencies: P0-2  
Complexity: Low  
Risk if skipped: Brute force exposure

**P1-4: Rate limit AI and payment endpoints**  
Why: Unbounded AI calls exhaust Groq free quota. Unbounded orders = STK Push spam.  
Dependencies: P0-2  
Complexity: Low  
Risk if skipped: Groq quota exhaustion, API noise

**P1-5: Password complexity validation**  
Why: "password" is a valid password today.  
Dependencies: None  
Complexity: Trivial  
Risk if skipped: Weak credentials

**P1-6: Reduce Cloudinary limit to 4MB**  
Why: 5MB exceeds Vercel's 4.5MB payload ceiling. Validation never runs on large uploads.  
Dependencies: None  
Complexity: Trivial  
Risk if skipped: Unhelpful 413 errors on valid uploads

**P1-7: Remove WEBHOOK_SECRET query param**  
Why: Appears in Vercel access logs.  
Dependencies: P1-1 (IP allowlisting replaces it)  
Complexity: Low  
Risk if skipped: Log leak exposes secret (mitigated by IP allowlisting)

---

### Phase 2 — Trust Systems

**P2-1: Admin verification UI**  
Why: Farmers cannot be approved without raw API calls. Platform cannot onboard.  
Dependencies: None (API complete)  
Complexity: Medium  
Risk if skipped: Platform is inoperable at launch

**P2-2: Verify TrustScoreDisplay renders on listings**  
Why: Trust score calculated but may be invisible to buyers.  
Dependencies: None  
Complexity: Low  
Risk if skipped: Trust system has no effect on buyer decisions

**P2-3: Admin audit log**  
Why: No permanent DB record of verification decisions. Axiom covers 30 days but DB is permanent.  
Dependencies: None  
Complexity: Low  
Risk if skipped: Dispute resolution is impossible if an admin decision is challenged after 30 days

---

### Phase 3 — Operational Readiness

**P3-1: Stuck payment reconciliation**  
Why: Orders stuck in `AWAITING_PAYMENT` lock inventory permanently.  
Dependencies: None  
Complexity: Low  
Risk if skipped: Inventory deadlock as orders accumulate

**P3-2: Uptime monitoring**  
Why: Blind to outages without a ping check.  
Dependencies: P0-5  
Complexity: Trivial (UptimeRobot free)  
Risk if skipped: Unknown downtime duration

**P3-3: Request ID logging**  
Why: Cannot trace a request chain through logs without correlation.  
Dependencies: None  
Complexity: Low  
Risk if skipped: Debugging production issues is slow and manual

**P3-4: Marketplace text search**  
Why: Buyers cannot find produce without browsing all listings. MongoDB text indexes are free on M0.  
Dependencies: None  
Complexity: Low  
Risk if skipped: Poor buyer experience

**P3-5: Payment failure alerting**  
Why: Repeated failures indicate a Daraja configuration issue. Silent without this.  
Dependencies: None  
Complexity: Low (1 SMS via Africa's Talking at ~$0.01/alert)  
Risk if skipped: Daraja misconfiguration goes unnoticed

---

### Phase 4 — Feature Completion

**P4-1: Password reset flow**  
Why: Users will forget passwords.  
Dependencies: P0-3, P1-2  
Complexity: Medium  
Risk if skipped: Permanent account lockout with no self-service recovery

**P4-2: Cloudinary signed upload URLs**  
Why: Direct upload leaks API secret if server is compromised. Eliminates payload ceiling issue. Available on Cloudinary free tier.  
Dependencies: None  
Complexity: Medium  
Risk if skipped: Upload reliability issues, API secret exposure

**P4-3: Suspended user enforcement on writes**  
Why: Suspended users can create listings and orders for up to 7 days.  
Dependencies: None  
Complexity: Low  
Risk if skipped: Suspended users continue transacting

---

### Phase 5 — Launch Readiness

**P5-1: Production domain + HTTPS**  
Why: Required for launch. Vercel provides HTTPS automatically on custom domains.  
Dependencies: Domain purchase (~$10–15/year)  
Complexity: Trivial  
Risk if skipped: Cannot launch

**P5-2: Daraja production credentials**  
Why: Sandbox shortcode 174379 cannot accept real payments.  
Dependencies: Safaricom go-live approval  
Complexity: Configuration only  
Risk if skipped: Cannot accept real payments

**P5-3: Payment webhook test coverage**  
Why: Idempotency logic and inventory restoration are highest-risk untested code paths.  
Dependencies: None  
Complexity: Medium  
Risk if skipped: Bugs discovered in production under real money

**P5-4: Seed first admin user**  
Why: Admin role is not self-assignable. Someone must be able to verify first farmers.  
Dependencies: Production database  
Complexity: Trivial  
Risk if skipped: No one can verify farmers

**P5-5: Launch readiness end-to-end verification**  
Why: CI tests code correctness, not feature correctness.  
Dependencies: All previous phases  
Complexity: Manual testing  
Risk if skipped: Undiscovered integration failures

---

## PART 8 — EXACT BUILD ORDER

Single developer. Tasks ordered to minimize rework. Each task assumes the previous is merged to develop.

> **Parallel track**: Submit Safaricom Daraja go-live application before starting Task 1. Approval takes 1–2 weeks and is the critical path. Everything else fits within that window.

---

**Task 1 — Database backup automation (GitHub Actions)**  
Create a private GitHub repository `umojahub-backups`. Create `.github/workflows/backup.yml` in the main repo. Weekly schedule (Sunday 2am UTC): install mongodump, run against `$MONGODB_URI`, commit compressed archive to backup repo. Keep last 4 weekly archives (rolling delete). Add `BACKUP_REPO_TOKEN` (GitHub PAT with `repo` scope) to GitHub Actions secrets and Vercel env vars. Document restore procedure in `context/RUNBOOK.md`.  
Time: 2 hours  
Cost: $0

**Task 2 — `vercel.json` cron configuration (2 crons, Hobby limit)**  
Create `/api/cron/weekly-jobs/route.ts`. This route runs sequentially: (1) delete expired ChatSessions and MentorSessions, (2) run market-insight aggregation, (3) run impact-summary computation. Same CRON_SECRET auth as existing cron routes. Each sub-task logs with its own service label. Add `vercel.json` with 2 cron entries: price-alert-check (*/15) and weekly-jobs (Monday 3am UTC).  
Time: 1.5 hours  
Cost: $0

**Task 3 — Health check endpoint**  
`GET /api/health` → 200 `{status: 'ok', db: boolean, timestamp: string}`. Call `connectDB()`, check `mongoose.connection.readyState === 1`. No auth required. Return 503 if DB is not connected.  
Time: 1 hour  
Cost: $0

**Task 4 — Axiom log drain setup**  
Create a free Axiom account. In Vercel project settings → Integrations → add Axiom. Enable Log Drain for the production deployment. Verify logs appear in Axiom dashboard. No code changes required — all existing `logger.*` output flows through automatically.  
Time: 30 minutes  
Cost: $0

**Task 5 — Uptime monitoring**  
Configure UptimeRobot free tier on the production health endpoint. 5-minute interval. SMS alert to admin phone number. Register at uptimerobot.com, add HTTP monitor, configure alert contact.  
Time: 30 minutes  
Cost: $0

**Task 6 — Upstash Redis setup**  
Create a free Upstash account. Create one Redis database (free tier: 10,000 commands/day). Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel env vars and `.env.local`. Add to `env.ts` required vars. Install `@upstash/redis`.  
Time: 1 hour  
Cost: $0

**Task 7 — Distribute rate limiter to Redis**  
Replace in-memory Map in `src/lib/rateLimit.ts` with Upstash Redis atomic INCR + EXPIRE using the REST client. Same `checkRateLimit(key, max, windowMs)` interface — no call-site changes required. For each check: INCR the key (returns new count), set TTL on first increment (count === 1), compare count against max.  
Time: 3 hours  
Cost: $0

**Task 8 — Rate limiting on AI and payment endpoints**  
Apply `checkRateLimit` in `/api/assistant`, `/api/mentor/chat`, `POST /api/orders`. Key: `ratelimit:{userId}:{endpoint}`. Limits: 20 requests/hour for AI endpoints, 5 requests/hour for order creation. Return 429 with `Retry-After` header if exceeded.  
Time: 2 hours  
Cost: $0

**Task 9 — Payload limit fix for Cloudinary**  
Change max size in `cloudinaryService.ts` validation from 5MB to 4MB. Update user-facing error message to "Images must be under 4MB".  
Time: 30 minutes  
Cost: $0

**Task 10 — Email service (Resend)**  
Update `env.ts`: rename `SENDGRID_API_KEY` to `RESEND_API_KEY` in the required vars array. Update `.env.local.example` to reflect the new key name. Create `src/lib/integrations/emailService.ts` using the `resend` npm package (`npm install resend`). Two email types: `sendVerificationEmail(to, token)` and `sendPasswordResetEmail(to, token)`. Same non-blocking failure pattern as `smsService.ts`. Create a Resend account, verify domain, add `RESEND_API_KEY` to Vercel env vars.  
Time: 4 hours  
Cost: $0

**Task 11 — Email verification at registration**  
Add to User model: `isEmailVerified: boolean` (default false), `emailVerificationToken: string` (select: false), `emailVerificationExpiry: Date`. Update `POST /api/auth/register`: generate `crypto.randomUUID()` as token, set expiry 24 hours, call `sendVerificationEmail()` non-blocking. Add `GET /api/auth/verify-email?token=xxx` route: find user by token where expiry > now, set `isEmailVerified: true`, clear token fields. Update NextAuth `authorize()`: reject login with `AppError('Please verify your email', 401, 'AUTH_EMAIL_UNVERIFIED')` if `!user.isEmailVerified`.  
Time: 6 hours  
Cost: $0

**Task 12 — Password reset flow**  
Add to User model: `passwordResetToken: string` (select: false), `passwordResetExpiry: Date`. Create `POST /api/auth/forgot-password`: find user by email, generate token, set expiry 1 hour, call `sendPasswordResetEmail()`. Create `POST /api/auth/reset-password`: validate token and expiry, hash new password with bcrypt, update `hashedPassword`, clear token fields. Add `/auth/forgot-password` and `/auth/reset-password` UI pages using existing design system components.  
Time: 6 hours  
Cost: $0

**Task 13 — Daraja webhook IP allowlisting + remove query secret**  
In `src/middleware.ts`, add a matcher for `/api/webhooks/daraja`. Extract `x-forwarded-for` header (Vercel sets this). Check against Safaricom's published Daraja production IP ranges. Return `NextResponse.json({error:'Forbidden'},{status:403})` for non-matching IPs. Remove `?secret=WEBHOOK_SECRET` from the Daraja STK Push callback URL in `darajaService.ts`. Remove the query param check from the webhook route handler. Update `env.ts` to remove `WEBHOOK_SECRET` from required vars (or keep for fallback validation during transition).  
Time: 3 hours  
Cost: $0

**Task 14 — Stuck payment reconciliation**  
Add reconciliation logic to `/api/cron/price-alert-check` (runs every 15 minutes): query orders where `paymentStatus: PENDING_PAYMENT` AND `createdAt < now - 30 minutes`. For each: atomically restore `quantityAvailable` on the listing (`findOneAndUpdate` with `$inc`). Set order `paymentStatus: FAILED`, `fulfillmentStatus: AWAITING_PAYMENT` → stay as-is, log the cancellation. Limit batch to 10 orders per cron run to keep execution time under 10 seconds.  
Time: 4 hours  
Cost: $0

**Task 15 — Admin audit log model**  
Create `src/lib/models/AdminAuditLog.model.ts`. Fields: `adminId` (ref User), `action` (enum: VERIFY_FARMER, REJECT_FARMER, VERIFY_SUPPLIER, REJECT_SUPPLIER, VERIFY_LECTURER, SUSPEND_USER), `targetId` (ObjectId), `targetType` (enum: USER, SUPPLIER), `decision`, `reason`, `recordedAt` (immutable, default: Date.now). No `timestamps: true` — append-only. Index: adminId, targetId, recordedAt (-1). Atlas M0 supports this without restriction.  
Time: 2 hours  
Cost: $0

**Task 16 — Wire audit log into admin verification routes**  
In `POST /api/admin/verify-farmer`, `POST /api/admin/verify-supplier`: after successful verification decision, append to `AdminAuditLog`. Non-blocking (fire-and-forget with error logging). Same pattern as trust score recalculation.  
Time: 2 hours  
Cost: $0

**Task 17 — Suspended user enforcement on writes**  
In `POST /api/marketplace`, `POST /api/orders`, `POST /api/education/engagements`: after `getServerSession()`, query `User.findById(id).select('status').lean()`. If `status !== UserStatus.ACTIVE`, throw `AppError('Account suspended', 403, 'AUTH_SUSPENDED')`.  
Time: 2 hours  
Cost: $0

**Task 18 — Request ID logging**  
In each API route handler entry point, add `const requestId = crypto.randomUUID()` as the first line. Pass `{ requestId }` as metadata in all subsequent `logger.*` calls within that request scope. This makes payment failure chains traceable in Axiom.  
Time: 4 hours  
Cost: $0

**Task 19 — Admin verification UI**  
Three pages under `/dashboard/admin/`:
- `verification-queue/page.tsx` — Table of pending farmers and suppliers with approve/reject actions
- `farmer/[farmerId]/page.tsx` — Farmer profile, document image URLs (Cloudinary), approve/reject form
- `supplier/[supplierId]/page.tsx` — Supplier detail, registration numbers, approve/reject form  
Uses existing design system components from `context/FRONTEND.md`. Functional — not polished.  
Time: 2 days  
Cost: $0

**Task 20 — Verify TrustScoreDisplay on listings**  
Audit marketplace listing detail page and listing card. Confirm `TrustScoreDisplay` renders with the farmer's actual `compositeScore` and `tier`. If absent, implement using the component pattern in `context/FRONTEND.md`.  
Time: 2 hours to audit; up to 4 hours to implement if absent  
Cost: $0

**Task 21 — MongoDB text index for marketplace search**  
Add text index to `MarketplaceListing` schema: `{ title: 'text', cropName: 'text', description: 'text' }`. Atlas M0 supports text indexes. Update `GET /api/marketplace` to accept `?q=` parameter. When present, use `$text: { $search: q }` and include `{ score: { $meta: 'textScore' } }` in projection, sorted by score descending. When absent, use existing filter logic.  
Time: 3 hours  
Cost: $0

**Task 22 — Payment failure alerting**  
In `POST /api/webhooks/daraja`, when `ResultCode !== 0`, after logging: call `sendSMS(process.env.ADMIN_PHONE_NUMBER, message)` with order reference and failure code. Non-blocking. Add `ADMIN_PHONE_NUMBER` to `env.ts` required vars. Cost: ~$0.01 per alert.  
Time: 2 hours  
Cost: ~$0.01/alert

**Task 23 — Payment webhook test coverage**  
Write tests at `src/app/api/webhooks/daraja/__tests__/route.test.ts`:
- Successful payment: order marked PAID, mpesaTransactionId stored, SMS called
- Failed payment: inventory `quantityAvailable` incremented, order marked FAILED
- Duplicate webhook: MongoDB duplicate key is caught, route still returns 200
- Invalid IP (middleware test): returns 403
- Unknown CheckoutRequestID: returns 200 with logged warning (must not return 4xx or Daraja retries forever)  
Time: 4 hours  
Cost: $0

**Task 24 — Cloudinary signed upload URLs**  
Create `POST /api/upload/sign` route. Server generates signed Cloudinary upload parameters: `api_key`, `timestamp`, `signature` (HMAC-SHA1 of sorted params + api_secret), `folder`. Client uploads the file binary directly to `https://api.cloudinary.com/v1_1/{cloud}/image/upload` using the signed params. Client sends the resulting `secure_url` and `public_id` to the original resource route (listing creation, etc.) for validation. Remove direct binary handling from the current Cloudinary upload function. Available on Cloudinary free tier.  
Time: 6 hours  
Cost: $0

**Task 25 — `Permissions-Policy` header**  
Add to `next.config.ts` headers: `Permissions-Policy: camera=(), microphone=(), geolocation=()`.  
Time: 30 minutes  
Cost: $0

**Task 26 — Password complexity validation**  
Add `.refine()` to `registerSchema` in `src/lib/validation/authSchema.ts`. Require at least one uppercase letter, one lowercase letter, one digit. Return actionable error message.  
Time: 1 hour  
Cost: $0

**Task 27 — Seed production admin user**  
Write `scripts/seed-admin.ts`. Creates admin user with known email, strong password, `role: Role.ADMIN`, `status: UserStatus.ACTIVE`, `isEmailVerified: true`. Run once against production Atlas M0 via `npx tsx scripts/seed-admin.ts`. Gate behind `NODE_ENV=seed` env flag to prevent accidental re-runs.  
Time: 1 hour  
Cost: $0

**Task 28 — Production domain configuration**  
Purchase domain (~$10–15/year). Configure custom domain in Vercel project settings. Update `NEXTAUTH_URL` env var to production domain. Update `MPESA_CALLBACK_URL` to use production domain. HTTPS is provisioned automatically by Vercel.  
Time: 1 hour + DNS propagation  
Cost: ~$10–15/year

**Task 29 — Daraja production credentials**  
After Safaricom go-live approval: update `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL` in Vercel production environment. Do not update sandbox env vars in development. Test one end-to-end STK Push with a real device and KES 1 amount.  
Time: 30 minutes  
Cost: $0 (Daraja go-live application is free)

**Task 30 — Runbook documentation**  
Document in `context/RUNBOOK.md`:
- How to restore from the most recent GitHub Actions weekly backup
- How to manually cancel stuck payment orders via MongoDB Atlas Data Explorer
- How to rotate Daraja credentials without downtime
- How to manually verify a farmer via API if admin UI fails
- Weekly manual payment reconciliation procedure (Daraja Business Manager vs MongoDB)
- How to respond to Vercel downtime
- Upgrade trigger checklist (when to move from free to paid for each service)  
Time: 2 hours  
Cost: $0

**Task 31 — Launch readiness end-to-end test**  
On production environment, manually walk through every critical path:
1. Register as farmer → verify email → submit verification documents
2. Admin approves farmer via admin UI
3. Farmer creates listing with images (test Cloudinary signed upload)
4. Register as buyer → verify email
5. Buyer searches for crop → finds listing → places order → completes STK Push on real device
6. Wait for Daraja webhook → confirm order marked PAID
7. Confirm SMS received by farmer and buyer
8. Farmer confirms order → buyer marks received
9. Confirm trust score recalculates
10. Register as student → complete full project engagement
11. Set and trigger a price alert via cron or manual invocation
12. Confirm weekly-jobs cron executes without error (invoke manually via `curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/weekly-jobs`)
13. Confirm backup GitHub workflow runs successfully  
Time: 4 hours  
Cost: $0

---

## PART 9 — LAUNCH READINESS SCORECARD

### Current vs Target

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| Security | 55% | 90% | +35% |
| Operations | 40% | 85% | +45% |
| Payments | 70% | 95% | +25% |
| Trust | 80% | 90% | +10% |
| Reliability | 45% | 85% | +40% |
| Monitoring | 15% | 80% | +65% |
| Testing | 35% | 70% | +35% |
| Deployment | 70% | 90% | +20% |
| Documentation | 30% | 60% | +30% |
| Feature Completeness | 78% | 95% | +17% |

---

### Security — 55% → 90%
**Current**: Auth, RBAC, Zod validation, bcrypt, CSP headers, webhook secret.  
**Missing**: Email verification, distributed rate limiting, webhook IP allowlisting, payload limit fix, password complexity, admin audit log.  
**Tasks**: 7, 8, 9, 10, 11, 13, 15, 16, 25, 26.

### Operations — 40% → 85%
**Current**: Cron routes exist, structured logging, AppError pattern, non-blocking side effects.  
**Missing**: Cron not in `vercel.json` (Hobby 2-cron limit requires consolidation), no health endpoint, no uptime monitoring, no log drain, no request ID correlation, no stuck-payment reconciliation, no admin action audit trail.  
**Tasks**: 2, 3, 4, 5, 14, 15, 16, 18, 22.

### Payments — 70% → 95%
**Current**: STK Push, idempotency index, always-200 webhook, inventory restoration, SMS confirmation.  
**Missing**: Stuck payment reconciliation, webhook IP allowlisting, webhook test coverage, production credentials.  
**Tasks**: 13, 14, 23, 29.

### Trust — 80% → 90%
**Current**: Full trust score calculation, farmer/supplier/lecturer verification, rating system, education audit log.  
**Missing**: Admin UI to execute verifications, TrustScoreDisplay verification on listing pages, admin audit trail.  
**Tasks**: 15, 16, 19, 20.

### Reliability — 45% → 85%
**Current**: Mongoose singleton, atomic operations, TTL indexes, error handling.  
**Missing**: Database backup strategy (GitHub Actions replaces M10), stuck payment reconciliation, uptime monitoring, health endpoint, log retention beyond 1 hour (Axiom).  
**Tasks**: 1, 3, 4, 5, 14.

### Monitoring — 15% → 80%
**Current**: Structured JSON logs in Vercel Logs (1-hour retention on Hobby).  
**Missing**: Health endpoint, uptime monitoring, 30-day log retention (Axiom), payment failure alerting, request ID correlation.  
**Tasks**: 3, 4, 5, 18, 22.

### Testing — 35% → 70%
**Current**: Validation schema tests, trust calculator tests, auth register test, ratings test.  
**Missing**: Payment webhook tests (highest risk), order flow integration tests.  
**Tasks**: 23.  
Note: 70% is the correct target for first 100 users. 100% test coverage is a post-launch investment.

### Deployment — 70% → 90%
**Current**: GitHub Actions CI/CD, Vercel deploy on `main`, env var validation at boot.  
**Missing**: Cron configuration in `vercel.json` (consolidated to 2 for Hobby), production domain, production Daraja credentials.  
**Tasks**: 2, 28, 29.

### Documentation — 30% → 60%
**Current**: CLAUDE.md, FRONTEND.md, env.local.example.  
**Missing**: Runbook (incident response, recovery procedures, upgrade triggers).  
**Tasks**: 30.  
Note: API documentation for external partners is not required for first 100 users.

### Feature Completeness — 78% → 95%
**Current**: Marketplace, orders, payments, trust, education, groups, knowledge hub, AI assistant.  
**Missing**: Password reset flow, email verification, admin UI, marketplace search, signed Cloudinary uploads.  
**Tasks**: 10, 11, 12, 19, 21, 24.

---

## EFFORT SUMMARY

| Phase | Tasks | Developer Days |
|-------|-------|----------------|
| Phase 0 — Infrastructure | 1–6 | 1.5 days |
| Phase 1 — Security | 7–13 | 4 days |
| Phase 2 — Trust | 14–20 | 4 days |
| Phase 3 — Operations | 18, 21–22 | 2 days |
| Phase 4 — Feature | 23–24 | 3 days |
| Phase 5 — Launch | 25–31 | 4.5 days |
| **Total** | **31 tasks** | **~19 developer days** |

**Critical path**: Safaricom Daraja go-live application (submit day 1, expect 1–2 weeks for approval). All other tasks fit within the approval window.

---

## WHAT IS NOT ON THIS ROADMAP

The following were considered and explicitly excluded as unnecessary for the first 100 users:

- Real-time capabilities (WebSocket, SSE) — SMS covers the critical notification path
- Elasticsearch or Atlas Search — MongoDB text indexes are sufficient and free at this scale
- General-purpose Redis caching — Upstash free tier is used only for rate limiting
- Mobile app — Next.js on a mobile browser is sufficient
- Public credential verification page — trust score on listings is sufficient
- Buyer reputation system — manually manageable at this scale
- Full E2E test suite — critical path manual testing in Task 31 covers launch risk
- Analytics dashboard — PlatformImpactSummary data exists; UI is a post-launch investment
- Multi-region deployment — single Vercel region is sufficient for Kenya-focused launch
- GDPR/DPA automation — manual admin process documented in runbook is sufficient
- Sentry error tracking — Axiom log drain provides equivalent observability at $0

---

## INFRASTRUCTURE COST TABLE

### Development Phase (pre-launch)
| Service | Tier | Cost |
|---------|------|------|
| All infrastructure | Free tiers | $0/month |
| Africa's Talking | Dev/sandbox | $0 (sandbox) |
| Daraja API | Sandbox | $0 |
| **Total** | | **$0/month** |

### Pilot Launch Phase (0–100 users)
| Service | Tier | Monthly Cost |
|---------|------|-------------|
| MongoDB Atlas | M0 (Free) | $0 |
| Vercel | Hobby (Free) | $0 |
| Upstash Redis | Free (10K cmds/day) | $0 |
| Cloudinary | Free (25GB) | $0 |
| Resend | Free (3K emails/month) | $0 |
| Groq | Free tier | $0 |
| OpenWeatherMap | Free (1K calls/day) | $0 |
| Axiom | Free (500MB/day) | $0 |
| UptimeRobot | Free (50 monitors) | $0 |
| GitHub Actions | Free (2K min/month) | $0 |
| Africa's Talking | Pay-per-SMS | ~$1–5 |
| Domain name | Annual | ~$1–2 |
| **Total** | | **~$2–7/month** |

### Revenue Generation Phase (100+ users)
| Service | Trigger | Upgrade cost |
|---------|---------|-------------|
| MongoDB Atlas M0 → M10 | Storage >360MB or revenue >$200/month | +$57/month |
| Vercel Hobby → Pro | >2 independent cron schedules needed | +$20/month |
| Resend Free → Starter | >2,500 emails/month | +$20/month |
| Upstash Redis → Pay-as-you-go | >8,000 commands/day | +$0.20/100K cmds |
| Axiom Free → Team | >400MB/day ingest | +$25/month |
| Africa's Talking | Scales linearly with SMS volume | ~$0.01/SMS |

---

## MONTHLY COST ESTIMATES

| User Count | Infrastructure | SMS | Domain | Total |
|------------|---------------|-----|--------|-------|
| Development | $0 | $0 | $0 | **$0** |
| 10 users | $0 | ~$0.50 | ~$1.25 | **~$2** |
| 50 users | $0 | ~$2 | ~$1.25 | **~$3** |
| 100 users | $0 | ~$5 | ~$1.25 | **~$6** |
| 200 users (post-revenue) | $0–57 | ~$10 | ~$1.25 | **~$11–68** |
| 500 users (growth phase) | $77 | ~$25 | ~$1.25 | **~$103** |

SMS cost assumes average of 3 SMS per active user per month (payment confirmation + 1 price alert + 1 fulfillment confirmation).

---

## UPGRADE TRIGGERS TABLE

This table documents the exact conditions that should trigger migration from free to paid tiers. Review monthly.

| Service | Current Tier | Upgrade To | Trigger Condition |
|---------|-------------|------------|-------------------|
| MongoDB Atlas | M0 (Free) | M10 ($57/month) | Storage >360MB (70% of 512MB cap), OR connection errors in logs, OR monthly revenue >$200 |
| Vercel | Hobby (Free) | Pro ($20/month) | Need >2 independent cron schedules, OR bandwidth >80GB/month, OR build minutes >5,000/month |
| Upstash Redis | Free | Pay-as-you-go | Daily commands consistently >8,000 (80% of 10K limit) |
| Cloudinary | Free | Plus ($89/month) | Storage >20GB OR monthly bandwidth >20GB |
| Resend | Free | Starter ($20/month) | Monthly emails consistently >2,500 OR daily emails consistently >80 |
| Axiom | Free | Team ($25/month) | Daily log ingest consistently >400MB |
| Africa's Talking | Pay-per-SMS | Volume pricing | When monthly SMS bill exceeds $30 (check bulk pricing discounts) |
| Groq | Free | Developer ($0 but rate limited) | API rate limit errors appearing in logs >3 times/week |

---

## REVISED RISK ASSESSMENT — FREE-TIER SPECIFIC RISKS

The following risks exist specifically because the platform operates on free tiers. Each is documented with its probability, impact, and mitigation.

---

**Risk 1 — Atlas M0: Data loss between weekly backups**  
Probability: Low (Atlas M0 is stable; the risk is human error, not Atlas failure)  
Impact: High — up to 7 days of data could be lost  
Free-tier mitigation: Weekly GitHub Actions backup. For critical events (successful payment, farmer verification), log the event to Axiom immediately. Payment events are also recorded in Daraja Business Manager as an independent source of truth for reconciliation.  
Residual risk: Acceptable for pilot phase. Document in runbook and inform early users that the platform is in pilot.  
Upgrade trigger: First month of consistent revenue

**Risk 2 — Vercel Hobby: 1-hour log retention**  
Probability: High (logs rotate hourly by design)  
Impact: Medium — debugging issues discovered after 1 hour requires guessing  
Free-tier mitigation: Axiom Log Drain (Task 4) provides 30-day searchable retention at $0. Axiom is the primary log store; Vercel Logs are real-time only.  
Residual risk: None after Axiom is configured

**Risk 3 — Vercel Hobby: 2 cron job limit**  
Probability: Certain (hard platform limit)  
Impact: Low — solved by consolidating 4 crons into 2 in Task 2  
Free-tier mitigation: `/api/cron/weekly-jobs` consolidated route. MongoDB TTL indexes handle session cleanup as primary mechanism.  
Residual risk: If the weekly-jobs route times out (Vercel Hobby function timeout: 10 seconds), some sub-tasks may not complete. Mitigate by making each sub-task independently resumable (cursor-based pagination, batch limits). Monitor via Axiom.  
Upgrade trigger: If independent scheduling is required for operational reasons

**Risk 4 — Upstash Redis: 10,000 commands/day limit**  
Probability: Very low at 100 users (estimated 720 commands/day)  
Impact: Medium — if limit is reached, rate limiting fails open (allows all requests) rather than rejecting  
Free-tier mitigation: Rate limiter should fail open (allow the request) rather than fail closed (block all traffic) when Redis is unavailable or quota is exceeded. Implement this explicitly in `rateLimit.ts`: if Redis throws, `return { allowed: true }` and log a warning.  
Residual risk: Temporary brute force exposure if quota is exhausted. At 100 users this requires deliberate abuse.  
Upgrade trigger: Daily commands consistently >8,000

**Risk 5 — Resend: 100 emails/day limit**  
Probability: Very low at 100 users (estimated 5–10 emails/day)  
Impact: Medium — if limit is reached, new users cannot register and existing users cannot reset passwords  
Free-tier mitigation: Email is sent non-blocking. If Resend returns a rate limit error, the registration still completes (user is created but unverified). Log the failure. Include a "resend verification email" button on the login page so users can trigger a retry the next day.  
Residual risk: During a burst signup period (e.g., demo day with 50 signups), daily limit could be reached. At 100 emails/day limit, this only fails if more than 100 users sign up in one day.  
Upgrade trigger: Daily email volume consistently >80

**Risk 6 — Groq: Free tier rate limits**  
Probability: Low at 100 users (estimated 20–50 AI requests/day)  
Impact: Low — farm assistant becomes temporarily unavailable; not a payment-critical path  
Free-tier mitigation: Rate limiting on `/api/assistant` (20 requests/hour per user) protects the shared quota. If Groq returns a 429, the API returns a user-friendly message: "Farm assistant is busy, please try again in a minute."  
Residual risk: None significant at 100 users

**Risk 7 — Shared Atlas M0 cluster performance**  
Probability: Low (Atlas M0 is generally reliable; shared resources can cause latency spikes)  
Impact: Low — occasional slow queries (100-500ms extra latency) are acceptable for a pilot  
Free-tier mitigation: All database queries use `.lean()` for reads (already in the architecture). All indexes are defined in model schemas (already implemented). No N+1 queries in the API layer.  
Residual risk: If a co-tenant on the shared cluster runs heavy aggregations, response times may spike. This is observable in Axiom (request latency in logs) and is a known risk at M0.  
Upgrade trigger: P95 response time consistently >2000ms for simple queries

**Risk 8 — GitHub Actions backup failure**  
Probability: Low  
Impact: High if unnoticed — backup job silently fails and data loss window grows  
Free-tier mitigation: GitHub Actions sends email notification on workflow failure to the repository owner. Configure email alerts in GitHub repository settings → Notifications. Check Axiom weekly for backup confirmation log entries.  
Residual risk: If backup fails and goes unnoticed for multiple weeks, recovery point is older than expected.  
Upgrade trigger: N/A — this risk is mitigated by GitHub's own failure notification system

---

## WHAT IS NOT ON THIS ROADMAP

The following were considered and explicitly excluded as unnecessary for the first 100 users:

- Real-time capabilities (WebSocket, SSE) — SMS covers the critical notification path
- Elasticsearch or Atlas Search — MongoDB text indexes are sufficient and free at this scale
- General-purpose Redis caching — Upstash free tier is used only for rate limiting
- Mobile app — Next.js on a mobile browser is sufficient
- Public credential verification page — trust score on listings is sufficient
- Buyer reputation system — manually manageable at this scale
- Full E2E test suite — critical path manual testing in Task 31 covers launch risk
- Analytics dashboard — PlatformImpactSummary data exists; UI is a post-launch investment
- Multi-region deployment — single Vercel region is sufficient for Kenya-focused launch
- GDPR/DPA automation — manual admin process documented in runbook is sufficient
- Sentry error tracking — Axiom log drain provides equivalent observability at $0
- Atlas M10 ($57/month) — replaced by GitHub Actions weekly backup at $0
- SendGrid — replaced by Resend free tier (3,000 emails/month at $0)
