# UmojaHub Platform Capabilities Reference

**The authoritative encyclopedia of everything UmojaHub can currently do.**

- **Derived from:** the actual repository source code only — every claim cites the file(s) that prove it.
- **Branch audited:** `chore/website-design-pipeline` (HEAD `dfc5d8c`), audited 2026-06-10.
- **Method:** every API route, Mongoose model, validation schema, integration service, cron job, middleware rule, dashboard page, and website page in `src/` was read. Where the UI and the backend disagree, both sides are documented and the discrepancy is flagged.
- **Honesty rule:** capabilities that are partially implemented, backend-only, UI-only, schema-only, or broken are explicitly labelled as such. Nothing is assumed from roadmap documents, comments, or TODOs.

---

## Table of Contents

1. [Part 1 — Platform Overview](#part-1--platform-overview)
2. [Part 2 — The Website](#part-2--the-website)
3. [Part 3 — Authentication System](#part-3--authentication-system)
4. [Part 4 — Food Security Hub](#part-4--food-security-hub)
5. [Part 5 — Education Hub](#part-5--education-hub)
6. [Part 6 — Administrative Infrastructure](#part-6--administrative-infrastructure)
7. [Part 7 — Data Model](#part-7--data-model)
8. [Part 8 — API Surface](#part-8--api-surface)
9. [Part 9 — Platform Workflows](#part-9--platform-workflows)
10. [Part 10 — Capability Matrix](#part-10--capability-matrix)
11. [Part 11 — Implementation Status](#part-11--implementation-status)

---

# PART 1 — PLATFORM OVERVIEW

## What UmojaHub is

UmojaHub is a **Next.js 15 (App Router) + MongoDB monolith** positioned as "East Africa's Verification Infrastructure" (`src/app/(website)/page.tsx:13`). It is a single deployed application containing two product hubs joined by one shared verification-and-trust spine:

1. **Food Security Hub** — an agricultural marketplace where identity-verified Kenyan smallholder farmers list produce, buyers pay via M-Pesa STK Push before dispatch, and every completed transaction feeds a public, formula-driven Farmer Trust Score.
2. **Education Hub** — a project-verification system where Kenyan CS students complete AI-generated or open-source project briefs, document their process (problem breakdown, approach plan, blocker log, AI-usage log, final reflection), pass anonymous peer review, and receive a final VERIFIED / REVISION_REQUIRED / DENIED decision from a credential-verified lecturer. Process documents are SHA-256 hashed at submission for tamper evidence.

## Why it exists (as stated in the codebase itself)

The public homepage frames two structural failures (`src/app/(website)/page.tsx:149–210`):

- **The Farmer Problem** — farmers sell through brokers who know the end-market price; the farmer does not. No mechanism exists to compare offers, signal reliability to strangers, or receive payment without physical presence.
- **The Student Problem** — CS graduates hold degrees that certify attendance and self-reported GitHub portfolios that no one can verify; employers have seen AI-generated portfolios and inflated credentials.

Both reduce to the same root: *no mechanism to establish trust between strangers before a consequential transaction*. UmojaHub's answer is human verification with named administrators, recorded evidence, and auditable decisions — the "three principles" hard-coded on the homepage: **Human Decision, Evidence on Record, Correctable** (`page.tsx:88–101`).

## The five structural layers and how they connect

| Layer | What it is | Where it lives |
|---|---|---|
| **1. Website** | Public, anonymous-accessible marketing/explanation/trust-building layer with two 3D narrative experiences | `src/app/(website)/*` route group, wrapped by `Nav`/`Footer` (`src/app/(website)/layout.tsx`) |
| **2. Web Application** | Authenticated, role-gated dashboards plus the public marketplace and knowledge hub | `src/app/dashboard/*`, `src/app/marketplace/*`, `src/app/knowledge/*`, `src/app/auth/*` |
| **3. Food Security Hub** | Marketplace, orders, M-Pesa, trust scores, price intelligence, cooperative groups, suppliers, farm assistant, knowledge articles | `src/app/api/{marketplace,orders,ratings,prices,groups,suppliers,farmers,assistant,knowledge}` + `src/lib/{trust,foodhub}` |
| **4. Education Hub** | Engagements, briefs, process documents, peer review, lecturer review, portfolio, AI mentor | `src/app/api/{education,peer-reviews,lecturer,students,mentor}` |
| **5. Administrative Infrastructure** | Verification queues (farmer/lecturer/supplier), knowledge CMS, brief-context library, impact analytics, audit logs, cron jobs | `src/app/api/admin/*`, `src/app/api/cron/*`, `src/app/dashboard/admin/*` |

**How users move between them:** Anonymous visitors land on the website, which routes them via role pages (`/for/farmers`, `/for/students`, …) to `/auth/register`. Registration assigns one of five roles. After login, `src/middleware.ts` and `src/app/dashboard/layout.tsx` route each role to its own dashboard subtree; buyers are additionally routed to the public `/marketplace`. The two hubs share one `User` model, one auth system, one upload pipeline (Cloudinary), one notification stack (SMS + email), and one analytics singleton (`PlatformImpactSummary`) that powers both the admin impact dashboard and the public Transparency page.

**How they differ:** the Food Hub's trust object is the *farmer* (continuous numeric Trust Score recalculated after every transaction); the Education Hub's trust object is the *project* (one-time, permanent VERIFIED decision with hashed evidence). The Food Hub moves money (M-Pesa); the Education Hub moves credentials (review decisions and hashes).

## Tech stack (from `package.json`)

Next.js 15.5.12, React 19.1.0, TypeScript 5 strict, Mongoose 9.2, NextAuth 4 (JWT credentials), Zod 4.3, Tailwind CSS 3.4, GSAP 3.15 + @gsap/react, three.js 0.184 + @react-three/fiber 9 + drei, zustand 5, recharts 3, react-markdown, bcryptjs, nodemailer, @upstash/redis (optional rate limiting), Jest 30 + Testing Library. The `resend` package is installed but **never imported anywhere** (dead dependency).

---

# PART 2 — THE WEBSITE

The website is a Next.js route group `src/app/(website)/` whose layout (`layout.tsx`, 12 lines) wraps every page in `<Nav/>` and `<Footer/>`. It is entirely public — no page in this group reads the session.

## 2.1 Navigation structure

**Top nav** (`src/components/website/Nav.tsx`): fixed header, GSAP fade-in, wordmark → `/`, four links — *Food Security Hub* → `/for/farmers`, *Education Hub* → `/education`, *How It Works* → `/how-it-works`, *Transparency* → `/transparency` — plus a copper **"Get started"** CTA → `/auth/register`. A hamburger menu mirrors all links on mobile.

**Footer** (`src/components/website/Footer.tsx`): four columns —
- *Platform:* About, Team, Transparency, Trust & Verification, How It Works
- *Hubs:* Food Security Hub, Education Hub, **Marketplace** (`/marketplace`), **Knowledge Hub** (`/knowledge`) — the two public application surfaces
- *Participants:* Farmers, Students, Buyers, Lecturers, Employers
- *Governance:* Appeals & Disputes (`/transparency#appeals`), Platform Status (`/transparency#status`)
plus a `hello@umojahub.org` mailto and the line "Verification methodology published at /trust".

## 2.2 Page hierarchy (15 pages, all server-rendered with GSAP `AnimateIn` reveals)

```
/                      Homepage (395 lines)
/about                 Why UmojaHub exists; 3 structural failures; scope & status; 5 things out of scope
/how-it-works          End-to-end walkthroughs: farmer→first transaction, student→VERIFIED entry, group→input fulfillment
/education             Education Hub landing: what it IS / IS NOT, role routing, process overview
/team                  Governance: who decides, role-based admin profiles, decision criteria, decision attribution examples, appeals process
/transparency          Live platform statistics, "what we do not track", infrastructure disclosure (third-party services incl. Africa's Talking), service status
/trust                 Full published methodology: trust tiers, what the Trust Score cannot do, farmer verification methodology (approved/rejected criteria + what approval does NOT guarantee), Education Hub methodology, SHA-256 document hashing, peer-score locking, appeals & recourse
/for/farmers           (358 ln) What you get / what is NOT guaranteed, verification process, Trust Score, M-Pesa payment, failure modes
/for/students          (495 ln) Portfolio Verified explained, 3 required documents, SHA-256 hashing, review process, what an employer sees, conflict-of-interest protections, realistic timeline, what it does NOT cover
/for/buyers            Verified procurement, how to read Trust Scores, payment mechanics, buyer risk + recourse, "browse before you commit"
/for/lecturers         Time commitment, what you decide, verification of lecturers, constraints, why participation matters; CTA "Register as a Lecturer"
/for/employers         4 steps from submission to your desk, independently verifiable elements, institutional partnerships note (bulk access / API integration is an invitation to contact — NOT an implemented feature)
/for/ngos              Six aggregate indicators available without registration, what we can/cannot provide, outside-scope list
/for/cooperatives      What groups are, what groups unlock, how groups work, who can join (verified farmers only), CTA "Register as a Farmer"
```

These pages are the only place where **Employers, NGOs, Institutions, and Cooperatives exist as audiences** — none of them are account roles (see Part 3).

## 2.3 Three.js experiences

**D01 Verification Spine Diagram** (`src/components/website/D01Diagram.tsx`, lazy-loaded via `D01DiagramLazy.tsx`): a react-three-fiber canvas on the homepage — a central glowing "verification spine" column with pulsing decision rings, copper (Food Hub) and teal (Education Hub) accents, slow auto-orbiting camera, drei `Float` elements.

**StoryWorld V1 — "Witness"** (`src/components/website/StoryWorld/`, config in `src/lib/storyworld/config.ts`): the default homepage S5 section. A 500vh GSAP-ScrollTrigger-pinned 3D scene (`scrub: 1.5`) where six characters (Farmer, Buyer, Student, Lecturer, Employer, Cooperative — `CHARACTERS` map) arrive one per scroll-driven episode, hold a scripted skeptical Q&A with "The Guide" (e.g. the farmer: *"A broker pays me when he is ready. Sometimes I wait weeks."* → Guide: *"Payment is held through M-Pesa before you confirm dispatch."*), watch a demo particle effect (`demoType: 'payment-flow'` etc.), cross an Arch into a Council Ring, and settle. Components: `StoryWorldScene`, `CameraRig`, `EpisodeManager`, `CharacterBase/Prop`, `ConversationBubble`, `DemoParticles`, `TheArch`, `TheGuide`, `ThePlaza`, `SceneLighting`. Scroll progress flows through a zustand store (`src/lib/storyworld/store.ts`); `prefers-reduced-motion` is honored.

**StoryWorld V2 — "The Commons"** (`src/components/website/StoryWorld/v2/`, libs in `src/lib/storyworld/v2/`): a richer replacement rendered **only when `NEXT_PUBLIC_STORYWORLD_V2=true`** (`src/app/(website)/page.tsx:10,326`). Capabilities proven in code:
- **760vh scroll** over 9 chapters: Prologue (6%), seven 12% episodes (Farmer, Buyer, Student, Lecturer, Employer, Cooperative, **NGO**), Finale at the Ledger (`config.ts:125–141`); chapter names listed in `StoryWorldV2Section.tsx`.
- **A spiral world of 8 districts** (fields, depot, studio, review-chamber, bureau, circle, field-station, ledger) with computed camera keyframes walking "the Path" (`config.ts:42–189`). The eighth role is **The Administrator** (`ROLES.admin`).
- **Monotonic world simulation** (`simulation.ts`): pure-function reducer where settled characters never un-settle on scroll-back; every settlement, consequence, hidden-record discovery, and first interaction appends a sequenced `LedgerRecord`.
- **Authored narrative data** (`data.ts`, 658 lines): episode dialogue spines (every Administrator answer carries a consequence — enforced by `__tests__/data.test.ts`), finale dialogue about record permanence, **branches** capped at ≤10 s (`BRANCH_CAP_MS = 10_000`), **fact cards** ("every sentence is platform-true"), **hidden records** in each district with a constellation reward when all 8 are found (`constellationEarned`), and micro-lines (2 asides + 1 lifted line per character).
- **Interaction**: visitor-presence awareness radius (1.6 units, 300 ms dwell), resident "lift" clamped to 2.0 units around home, drag-orbit limited to ±18°.
- **Performance tiers**: tier 3 below 768 px width, tier 2 at ≤4 hardware threads, canvas mounts only when the section approaches via IntersectionObserver; reduced-motion supported (`StoryWorldV2Section.tsx:52–75`).

## 2.4 Trust-building and transparency systems

- `/trust` publishes the full Trust Score formula, tier table, farmer-verification criteria including explicit *"Does Not Guarantee"* lists, SHA-256 hashing explanation, and **peer-score locking** ("Lecturers make their assessment independently before seeing the peer score" — note Part 5.4 for the implementation reality).
- `/transparency` renders **live numbers** from `GET /api/transparency` (`src/app/api/transparency/route.ts`, public, ISR 300 s) backed by `getTransparencyData()` (`src/lib/transparency.ts`): verified farmers, counties, completed orders, total KES volume, verified projects, verified lecturers, published articles, **pending verification count** (the queue is publicly disclosed), and a last-updated timestamp.
- `/team` publishes role-based administrator profiles, what each administrator decides / does not assess, anonymized decision-attribution examples, and the appeals process for farmers/suppliers and students.

## 2.5 Calls to action and auth entry points

Every role page funnels to `/auth/register`; `/for/buyers` additionally links to `/marketplace` ("Buyers can browse the full marketplace without registering"); homepage hero CTAs go to `/for/farmers` and `/education`. The nav CTA "Get started" → `/auth/register`.

## 2.6 Everything else an anonymous visitor can reach

- `GET /marketplace` and `/marketplace/[listingId]` — public produce browsing (see Part 4.1; currently has a response-shape defect).
- `GET /knowledge` and `/knowledge/[slug]` — published agricultural articles (working, ISR 60 s page / 3600 s API).
- `GET /api/suppliers` — public verified-supplier directory JSON (no UI page consumes it; API-only).
- `GET /api/transparency` — public stats JSON.
- `GET /api/health` — uptime endpoint for UptimeRobot (`status`, `db`, `timestamp`).

---

# PART 3 — AUTHENTICATION SYSTEM

## 3.1 Roles

Exactly **five account roles** exist (`src/types/index.ts:4–10`): `FARMER`, `BUYER`, `STUDENT`, `LECTURER`, `ADMIN`.

> **Explicitly NOT roles:** Employer, NGO, Institution, Cooperative. They are website audiences only. "Cooperative" functionality exists as the FarmerGroup feature available to FARMER accounts. There is no employer portal, no NGO account, no institution account anywhere in the codebase.

## 3.2 Registration — `POST /api/auth/register` (`src/app/api/auth/register/route.ts`)

- Public. Rate-limited 10 requests / 15 min / IP (`checkRateLimit`, `src/lib/rateLimit.ts` — Upstash Redis when configured, in-memory fallback, fail-open).
- Validated by `registerSchema` (`src/lib/validation/authSchema.ts`): email, password (≥8 chars with upper+lower+digit+special), first/last name (≤50), Kenyan phone (`/^(?:\+254|0)[17]\d{8}$/`), role restricted to **FARMER | BUYER | STUDENT | LECTURER** (ADMIN cannot self-register), county from the hard-coded list of all 47 `KENYAN_COUNTIES`.
- Duplicate email → 409 `DB_DUPLICATE_EMAIL`.
- Password bcrypt-hashed with 12 salt rounds (`BCRYPT_SALT_ROUNDS`, `hashPassword` in `src/lib/utils.ts`).
- Role-specific sub-document initialized (`buildRoleDefaults`): farmers get `farmerData` (UNSUBMITTED, unverified, empty crops/livestock), students get `studentData` (BEGINNER tier, 0 completed projects), lecturers get `lecturerData` (`isVerified: false`). Buyers get no sub-document.
- A 32-byte email-verification token (24 h expiry) is stored and a verification email is sent fire-and-forget via **nodemailer/SMTP** (`src/lib/integrations/emailService.ts` — uses `SMTP_HOST/PORT/USER/PASS`; note the project `CLAUDE.md` mentions SendGrid env vars, but the code uses generic SMTP).
- **UI** (`src/app/auth/register/page.tsx`): 4-role picker with descriptions, county dropdown, auto-`signIn()` after success, then redirect per role: FARMER→`/dashboard/farmer/listings`, BUYER→`/marketplace`, STUDENT→`/dashboard/student/projects/new`, LECTURER→`/dashboard/lecturer/reviews/pending` ⚠️ **that lecturer route does not exist** (the real page is `/dashboard/lecturer/queue`; `/dashboard/lecturer/reviews/pending` resolves to the dynamic `[engagementId]` page with an invalid id).

## 3.3 Email verification — `GET /api/auth/verify-email?token=…`

Looks up an unexpired token, sets `isEmailVerified: true`, unsets token fields, redirects to `/auth/login?verified=1` (or `?error=invalid_token`). **Login is impossible until the email is verified** (next section). There is no "resend verification email" endpoint — a user whose token expires has no in-product recovery path.

## 3.4 Login & sessions — NextAuth credentials (`src/lib/auth/options.ts`)

- Single `CredentialsProvider`. The `authorize` callback: rate-limits 10 attempts / 15 min / IP; loads the user with `.select('+hashedPassword')`; performs a **constant-time dummy bcrypt compare when the user does not exist** (timing-attack defense, line 79); rejects wrong passwords, any `status !== ACTIVE` (suspended/deleted), and unverified emails — all with the same generic failure.
- **JWT strategy, 24-hour maxAge.** The JWT and session carry `id`, `role`, `firstName`. Custom sign-in/error page `/auth/login`.
- Because role lives in the JWT, **a role or suspension change only takes effect at next login** — except where routes re-check the DB (order creation, listing creation, engagement creation all re-load `status` and return 403 `ACCOUNT_SUSPENDED`).
- Client helper `useAuth()` (`src/hooks/useAuth.ts`) wraps `useSession`.

## 3.5 Password reset

- `POST /api/auth/forgot-password` — always returns `{sent:true}` (no account enumeration), 5/15 min/IP, stores a 1-hour token, emails `/auth/reset-password?token=…`.
- `POST /api/auth/reset-password` — validates token + new password policy, re-hashes, unsets token. UI pages exist for both flows (`src/app/auth/forgot-password/page.tsx`, `reset-password/page.tsx`).

## 3.6 Route protection — `src/middleware.ts`

- Matcher: `/dashboard/:path*`, `/api/admin/:path*`, `/api/webhooks/daraja`.
- The Daraja webhook is protected by an **IP allowlist of 16 Safaricom addresses** (196.201.214.200–215), production-only; dev bypasses it for ngrok testing.
- All other matched paths require a valid NextAuth JWT (redirect to sign-in otherwise), then a prefix→role map enforces: `/dashboard/farmer`→FARMER, `/dashboard/buyer`→BUYER, `/dashboard/student`→STUDENT, `/dashboard/lecturer`→LECTURER, `/dashboard/admin` and `/api/admin`→ADMIN; mismatches redirect to `/auth/unauthorized` (a real page, 120 lines).
- Every individual API route *also* re-checks with `getServerSession` + `requireRole()` (`src/lib/utils.ts:71–81`, variadic roles, throws 401/403 `AppError`) — defense in depth.

## 3.7 Account lifecycle & profile management

- `UserStatus`: ACTIVE / SUSPENDED / DELETED (`src/types/index.ts:12–16`). ⚠️ **No API route or admin UI ever sets SUSPENDED or DELETED.** Suspension is enforced (login, orders, listings, engagements) but cannot be triggered from within the product — backend-only concept.
- Admin accounts are created exclusively by `scripts/seed-admin.ts` (requires `NODE_ENV=seed`, `ADMIN_PASSWORD`; idempotent).
- Profile management exists only for farmers (`GET/POST /api/farmers` — crops, livestock, farm size, language, plus verification submission; see Part 4.2). Students/buyers/lecturers have **no profile-edit endpoint**; `studentData.githubUsername`, `primaryInterest`, `techStackPreferences`, `universityAffiliation` and `lecturerData.universityAffiliation` are schema fields that nothing ever writes after registration.
- No account deletion, no email change, no password change while logged in, no 2FA, no OAuth providers.

## 3.8 Identity verification requirements by role

| Role | Verification gate | Enforced where |
|---|---|---|
| FARMER | Document review by admin → `farmerData.isVerified` | Listing creation 403 `FARMER_NOT_VERIFIED` (`api/marketplace/route.ts:157`); website states groups also require it (not enforced in group routes — see 4.4) |
| LECTURER | Admin grant → `lecturerData.isVerified` | Queue access and review submission 403 `LECTURER_NOT_VERIFIED` |
| STUDENT | None (email only) | — |
| BUYER | None (email only) | — |
| ADMIN | Seeded | — |

---

# PART 4 — FOOD SECURITY HUB

## 4.0 Architecture

All Food Hub routes follow the mandated pipeline `connectDB() → getServerSession → requireRole → Zod safeParse → DB op` with `AppError`/`handleApiError` for errors (409 on duplicate key, 422 on Mongoose validation). Money flows: Buyer → M-Pesa (Daraja STK Push) → webhook confirms → farmer fulfills → buyer confirms receipt → trigger chain (price history, trust recalc, alerts, SMS). The hub's collections: `MarketplaceListing`, `Order`, `Rating`, `FarmerTrustScore`, `PriceHistory`, `PriceAlert`, `MarketInsight`, `FarmerGroup`, `GroupOrder`, `VerifiedSupplier`, `KnowledgeArticle`, `ChatSession`, `Counter`.

## 4.1 Marketplace browsing (public)

`GET /api/marketplace` (`src/app/api/marketplace/route.ts:19–123`) — no auth.
- Filters: free-text `q` (Mongo text index over title/cropName/description with text-score sort; disables cursor pagination), `cropName` regex, `county` exact, `minPrice`/`maxPrice`, `verifiedOnly`, cursor pagination (`_id < cursor`, limit ≤100, default 20).
- Only `AVAILABLE` listings are returned; default sort `isVerifiedListing desc, createdAt desc` (verified farmers float to the top).
- Each card is enriched with farmer name, `isVerified`, and live trust data (`compositeScore`, `tier`) via batched `User` + `FarmerTrustScore` lookups.

`GET /api/marketplace/[listingId]` — public single listing + farmer (name, county, **phone number**) + trust score.

**UI status ⚠️:** the public pages have response-shape defects against this API:
- `/marketplace/page.tsx:26–51` destructures `{ listings, total }` but the API returns `{ data, nextCursor, total }` → `listings` is `undefined` and `listings.length` throws in the server component.
- `/marketplace/[listingId]/page.tsx:50–52` reads `data.listing` but the API returns `data.data` → every detail page resolves to `notFound()`.
These pages are wireframe-era code that predates the current API contract (consistent with the project's "UI deprioritized — wireframe skeletons" phase) and must be reconciled. The **APIs themselves are fully functional**.

## 4.2 FARMER CAPABILITIES

Farmer dashboard navigation (`src/components/shared/Sidebar.tsx:35–42`): Listings, Orders, Farm Assistant, Price Intelligence, Group Tools, Profile.

### 4.2.1 Profile creation & onboarding
- `GET /api/farmers` — own profile + trust score breakdown + `onboarded` flag (true once ≥1 crop recorded; frontend uses this to drive onboarding).
- `POST /api/farmers` — set `cropsGrown` (≥1 required), `livestockKept`, `farmSizeAcres`, `primaryLanguage` (`farmerProfileSchema`).
- UI: `/dashboard/farmer/profile` (468 lines) — profile form, direct-to-Cloudinary document image upload, verification submission.

### 4.2.2 Verification submission
- `POST /api/farmers/verify` — body `{documentType: NATIONAL_ID|COOPERATIVE_CARD|PASSPORT, documentNumber, documentImageUrl}` (must be a `res.cloudinary.com` URL — `verificationDocSchema`). Sets status PENDING. Re-submission blocked while PENDING (403 `FARMER_VERIFICATION_PENDING`) or after APPROVED (409). REJECTED farmers may resubmit.
- Outcome is decided by an admin (Part 6.1). On approval the farmer receives an SMS and an initial Trust Score of 40 (tier ESTABLISHED).

### 4.2.3 Listing management
- `POST /api/marketplace` — verified + ACTIVE farmers only. Fields: title (5–100), cropName (≤50), description (20–1000), quantity ≥0, unit (KG/BAG/CRATE/LITRE/PIECE), price ≥0, pickupCounty (47-county enum), pickupDescription (≥10), 1–5 Cloudinary image URLs, ≥1 buyer-contact preference (PHONE / PLATFORM_MESSAGE). Listings from verified farmers are auto-stamped `isVerifiedListing: true`. Side effect: a `PriceHistory` row with source `LISTING_CREATED` (non-fatal on failure; response includes `priceHistoryRecorded`).
- `PATCH /api/marketplace/[listingId]` — partial update, **own listings only** (403 otherwise), validated by `cropListingSchema.partial()`.
- ⚠️ **Listing UI gaps** (`/dashboard/farmer/listings/page.tsx`): it requests `/api/marketplace?own=true`, but the API implements no `own` parameter and the page reads a non-existent `data.listings` key → the "My Listings" table is always empty. Its activate/deactivate toggle PATCHes `{listingStatus}` — a field **not present in `cropListingSchema`**, so Zod strips it and the toggle is a server-side no-op. There is **no API path for a farmer to set a listing INACTIVE** (the enum exists; only auto-SOLD_OUT is reachable, set atomically when stock hits 0 during order reservation). No listing delete exists.
- `viewCount` exists on the model but **nothing increments or displays it**.

### 4.2.4 Order management (selling)
- `GET /api/orders` (FARMER view) — own orders, cursor-paginated, with buyer names and a `canConfirmDispatch` flag (`paymentStatus===PAID && fulfillmentStatus===AWAITING_PAYMENT`).
- `PATCH /api/orders/[orderId]/status` with `{fulfillmentStatus:'IN_FULFILLMENT'}` — farmer-only, own order, requires `paymentStatus===PAID`; stamps `confirmedByFarmerAt` (feeds the on-time-confirmation reliability metric).
- ⚠️ **Workflow inconsistency:** the Daraja webhook *already* sets `fulfillmentStatus: IN_FULFILLMENT` at the moment of payment (`webhooks/daraja/route.ts:107–112`), so no order ever sits in `PAID + AWAITING_PAYMENT`; `canConfirmDispatch` is therefore never true and the farmer-orders UI (380 lines) never shows its confirm button. The API transition still works if called directly (it checks only `paymentStatus`), but in practice `confirmedByFarmerAt` is rarely stamped — which drags every farmer's reliability score toward 0 once they have paid orders (see 4.6 limitations).
- Farmers receive an SMS on each confirmed payment ("New order confirmed! … Please prepare for fulfillment").

### 4.2.5 Price intelligence access
- `GET /api/prices?cropName=&county=&period=7d|30d|90d` (FARMER or ADMIN): raw `PriceHistory` points, stats (count, average, low, high), the latest weekly `MarketInsight`, hard-coded middleman benchmark, and computed **platform premium** (% above middleman price). UI: `/dashboard/farmer/prices` → `PriceIntelligenceDashboard` + `PriceTrendChart` (recharts).
- Price alerts: `POST /api/prices/alerts` (crop, county, target price, unit, method SMS/EMAIL/BOTH), `GET` (active list), `DELETE /api/prices/alerts/[alertId]` (own only, 204). Alerts fire via two channels: inline when an order completes at/above target (24 h cooldown), and the cron sweep (4.10). **Only the SMS channel is implemented** — `EMAIL`/`BOTH` selections store but never email.

### 4.2.6 Trust score visibility
`GET /api/farmers` returns the farmer's own composite score, tier, and all four component contributions. Buyers see score+tier on every listing card and detail (`TrustScoreDisplay` component).

### 4.2.7 AI Farm Assistant
- `POST /api/assistant` (FARMER only): message ≤1000 chars + optional `sessionId`. Double rate limit: 20/hour (Redis) **and** 10 user messages / 10 min (Mongo aggregation over `ChatSession`).
- `farmAssistantChat` (`src/lib/integrations/groqService.ts`): loads farmer profile, fetches a 7-day county weather forecast (OpenWeatherMap geocoding + One Call 3.0, hard-coded coordinates for 10 common counties, null-on-failure), builds a system prompt grounded in **KEBS / PCPB / KEPHIS / Kenya Veterinary Board** standards with the farmer's crops/livestock/language and weather (`src/lib/foodhub/assistantPrompt.ts`), calls Groq `llama3-8b-8192` (max 400 tokens, temp 0.7) with the last 20 session messages, persists the exchange in a `ChatSession` (90-day TTL, both a Mongo TTL index and a cron sweep). Graceful fallback message on any failure — the route never 500s for AI errors.
- UI: `/dashboard/farmer/assistant` → `FarmAssistantChat`.

### 4.2.8 Cooperative groups (see 4.4) and Knowledge Hub (see 4.9) round out farmer capabilities.

### What farmers CANNOT do (verified absences)
No messaging system, no notification center (SMS only, outbound), no dispute filing, no payout/settlement view (M-Pesa pays the platform shortcode; **no disbursement-to-farmer mechanism exists in code**), no analytics dashboard, no export, no listing deletion, no order cancellation.

## 4.3 BUYER CAPABILITIES

- **Browse** marketplace and listing details without or with auth (4.1).
- **Order + pay:** `POST /api/orders` (BUYER, ACTIVE, ≤5 orders/hour). Validates listing availability and quantity, then performs an **atomic compare-and-swap reservation** (`findOneAndUpdate` with `$gte` quantity filter and pipeline `$subtract`, auto-flipping to SOLD_OUT at zero — prevents overselling under concurrency, `orders/route.ts:256–287`). Creates the order (`UMJ-YYYY-XXXXXX` reference from an atomic `Counter`), fires the **M-Pesa STK Push**; on STK failure the order is deleted and inventory restored atomically. Response tells the buyer to enter their M-Pesa PIN.
- **Payment polling:** `GET /api/orders/[orderId]/payment-status` (owner-only) — the `CheckoutForm` polls for up to 90 s and reacts to PAID/FAILED.
- **Order history:** `GET /api/orders` (BUYER view) — paginated, with farmer names, full timestamp trail (`paidAt`, `confirmedByFarmerAt`, `receivedByBuyerAt`) and a `hasRated` flag. UI: `/dashboard/buyer/orders` list + `/dashboard/buyer/orders/[orderId]` detail (509 lines) with `OrderTimeline`.
- **Confirm receipt:** `PATCH /api/orders/[orderId]/status` `{fulfillmentStatus:'RECEIVED'}` — buyer-only, own order, requires IN_FULFILLMENT → sets COMPLETED + `receivedByBuyerAt` and launches the **completion trigger chain** (non-blocking): ① `PriceHistory` row (source ORDER_COMPLETED) ② farmer trust recalculation ③ matching price-alert scan ④ alert SMSes.
- **Rate the farmer:** `POST /api/ratings` — 1–5 integer + optional ≤500-char comment; only own COMPLETED orders; **one rating per order** (unique index on `orderId`); triggers trust recalc; returns the updated average.
- Buyers also get Knowledge Hub in their sidebar.
- **SMS notifications:** payment confirmation SMS to the buyer's registered phone.
- ⚠️ **Dispute system status:** `updateOrderStatusSchema` accepts `'DISPUTED'` + `disputeReason`, the `Order` model has `disputeFlaggedAt`/`disputeReason`, the trust calculator penalizes disputes, and `OrderTimeline` renders a "This order has an active dispute" state — **but the status route's transition logic rejects DISPUTED** (`orders/[orderId]/status/route.ts:94–100` falls through to 409) and no UI offers a dispute button. Disputes are therefore display-and-formula-ready but **unreachable by users**. The buyer's only recourse, as the website itself says, is a low rating with comment.

## 4.4 COOPERATIVE (FARMER GROUP) CAPABILITIES

There is no "Cooperative" account; these are FARMER-role features (`/dashboard/farmer/group`, `src/app/api/groups/*`).

- **Create group:** `POST /api/groups` — name + county (`groupCreationSchema`); creator becomes first member; max-50 active-group safeguard.
- **List my groups:** `GET /api/groups`.
- **Group detail:** `GET /api/groups/[groupId]` — members or admin only.
- **Member management:** `PATCH /api/groups/[groupId]` `{action: ADD|REMOVE, userId}` — **creator or admin only**; ADD validates target is a FARMER and cap of `MAX_GROUP_MEMBERS = 50`; cannot remove the creator. There is **no self-service join/leave** — membership is creator-managed. (The website's claim that "verification is required before participation" is **not enforced** in these routes — any farmer can be added.)
- **Propose a group input order:** `POST /api/groups/[groupId]/orders` — member-only; group needs ≥5 members (`MIN_GROUP_ORDER_MEMBERS`); supplier must exist and be VERIFIED; fields: inputType, quantityPerMember, pricePerMember, joiningDeadline, minimumMembers; proposer auto-joins with `paymentStatus: PENDING`.
- **Group order state machine** (`PATCH /api/groups/[groupId]/orders/[orderId]`):
  - `JOIN` (farmers only; admins explicitly barred): allowed in OPEN or MINIMUM_MET, before the deadline, once per member; auto-advances OPEN→MINIMUM_MET at threshold.
  - `CLOSE` (admin only): MINIMUM_MET→CLOSED.
  - `FULFILL` (admin only): CLOSED→FULFILLED.
  - `CANCEL` (admin only): any non-FULFILLED state→CANCELLED.
- **Read group orders:** list + detail, populated with supplier business name/county and participant names.
- ⚠️ **UI coverage is partial:** `/dashboard/farmer/group/page.tsx` (281 lines) only creates groups and lists groups/orders via `GroupOrderCard`; **no UI exists for adding members, proposing orders, or joining orders** — those capabilities are API-only today.
- ⚠️ **No payment integration:** `participatingMembers[].paymentStatus/mpesaTransactionId/paidAt` are modeled, but no code ever initiates or records a group-order M-Pesa payment. FULFILL is an admin attestation, not a settlement.

## 4.5 NGO CAPABILITIES

**There are no NGO accounts or NGO-only features.** What the codebase actually offers NGOs (exactly as `/for/ngos/page.tsx` states): the public Transparency page / `GET /api/transparency` with six aggregate indicators, available without registration. Everything else on the NGO page is explicitly listed as "outside our scope."

## 4.6 PRICE INTELLIGENCE SYSTEM (complete)

**Data sources** (`PriceHistory.source` enum): `LISTING_CREATED` (every new listing writes its asking price), `ORDER_COMPLETED` (every completed order writes its transaction price), `EXTERNAL_INGESTION` (**enum value defined; no ingestion code exists anywhere — unused**). A static `MIDDLEMAN_BENCHMARKS` table of 10 crops (maize 35 … coffee 380 KES/kg) lives in `src/lib/integrations/priceDataService.ts:94–105`, sourced per comment from Wakulima/Kongowea/City Market averages.

**Data flow:** listings/orders → `PriceHistory` (indexed `{cropName, county, recordedAt}`) → weekly cron aggregates 7-day windows per crop+county (only pairs with ≥3 data points, batch 50) into `MarketInsight` upserts: average listing price, average transaction price, low, high, count, middleman benchmark, **platform premium** = `round(((umojaAvg − benchmark)/benchmark)·100, 1dp)` (null when no benchmark).

**Display logic:** `GET /api/prices` recomputes the premium live from the selected period's history average vs the stored benchmark and returns both the raw series and the latest insight. `PriceTrendChart` renders the series; the dashboard offers crop/county/period selectors and alert management.

**Access:** FARMER and ADMIN only (buyers and the public have no price API access). **Administrative controls:** none — benchmarks are code constants; changing them requires a deploy.

**Limitations:** benchmark coverage is 10 crops; premium is null otherwise; no external market feed; insights only materialize weekly and only with ≥3 data points; alert e-mail channel unimplemented.

## 4.7 TRUST SCORE SYSTEM (complete)

Implementation: `src/lib/trust/farmerTrustCalculator.ts` (unit-tested; coverage threshold 90% per jest config). Persisted in `FarmerTrustScore` (one per farmer, unique index).

**Inputs & weights (max 100):**

| Component | Max | Formula |
|---|---|---|
| Verification | 40 | 40 if `verificationStatus === 'APPROVED'`, else 0 |
| Transaction | 25 | `min(completedOrders × 0.5, 12) + min(totalVolumeKES / 50000, 13)`, capped 25 |
| Rating | 20 | 0 until ≥3 ratings; then `round(((avg − 1)/4) × 20)` |
| Reliability | 15 | `clamp(onTimeRate × 12 − disputes × 2 − disputesRuledAgainst × 5, 0, 15)` |

`onTimeRate` = share of PAID orders confirmed by the farmer within 24 h of `paidAt`; defaults to 1.0 for farmers with no paid orders ("benefit of the doubt"). **MVP shortcut:** every DISPUTED order counts as ruled-against (no admin dispute resolution exists — `farmerTrustCalculator.ts:233–235`).

**Tiers** (`assignTier`): ≥80 PREMIUM, ≥60 TRUSTED, ≥40 ESTABLISHED, else NEW.

**Update process:** recalculation runs only after (a) order completion and (b) rating submission — never on reads. Admin approval seeds the record directly at 40/ESTABLISHED. Recalculation failures are logged and swallowed (never block the user's request).

**Visibility:** farmer (full breakdown via `/api/farmers`), public (composite + tier on every marketplace card/detail), admin (avg trust score in impact summary).

**Edge cases & limitations:** because the webhook auto-advances fulfillment (4.2.4 ⚠️), `confirmedByFarmerAt` is rarely set, so active farmers' on-time rate decays toward 0 — a systematic reliability under-count. Disputes are unreachable (4.3 ⚠️) so the dispute penalties are currently dead weight. No admin override/manual adjustment exists. No score history is kept (single upserted document).

## 4.8 M-PESA SYSTEM (complete)

Service: `src/lib/integrations/darajaService.ts`. Sandbox vs production URLs switch on `NODE_ENV`.

- **OAuth:** client-credentials token, cached in-instance for 55 min.
- **STK Push** (`initiateSTKPush`): normalizes phone to `2547…`, builds the base64 `shortcode+passkey+timestamp` password, `CustomerPayBillOnline`, amount rounded, `AccountReference` = order reference, description truncated to Daraja's 13-char limit, `CallBackURL` from `MPESA_CALLBACK_URL`. All failures → `AppError 502 PAYMENT_STK_FAILED`, which triggers full order rollback + inventory restore in the order route.
- **Callback** `POST /api/webhooks/daraja`: **always returns HTTP 200** (Daraja retries forever on non-200). Pipeline: signature check → schema validation (`darajaCallbackSchema`) → order lookup by `CheckoutRequestID` → failure path (`ResultCode !== 0`): mark FAILED, **restore listing inventory**, SMS the configured `ADMIN_PHONE_NUMBER` → success path: extract `MpesaReceiptNumber`, **idempotency check** (unique sparse index on `mpesaTransactionId` + explicit duplicate lookup), single write setting PAID + IN_FULFILLMENT + `paidAt`, then non-blocking SMSes to farmer and buyer.
- ⚠️ **Signature verification is a stub:** `verifyDarajaSignature()` returns `true` unconditionally (`darajaService.ts:206–211`). The comment block describes a URL-secret scheme (`WEBHOOK_SECRET` query param) that **is not actually implemented** in either the push or the webhook. Real protection = production IP allowlist in middleware + idempotency. Flagged as a hardening gap.
- **Stuck-payment reconciliation:** orders PENDING_PAYMENT for >15 min are marked FAILED and inventory restored, batch 20 per cron run (`cron/price-alert-check/route.ts:110–148`).
- **Settlement:** none. Funds land on the paybill shortcode; there is **no B2C/disbursement code, no wallet, no payout ledger**. `OrderPaymentStatus.REFUNDED` exists in the enum but nothing sets it.
- Sandbox shortcode `174379` per project docs; production go-live is gated on Safaricom approval (outside the code).

## 4.9 Verified suppliers & Knowledge Hub

**Suppliers:** `VerifiedSupplier` model (business name, phone/email, county, address, input categories FERTILIZER/SEED/PESTICIDE/VETERINARY/EQUIPMENT, KEBS/PCPB/KEPHIS registration numbers, status PENDING/VERIFIED/SUSPENDED). Public directory `GET /api/suppliers` (VERIFIED only; county/category filters; cursor pagination). ⚠️ **No supplier self-registration or admin-create endpoint exists** — supplier rows enter the DB only via `scripts/seed.ts`; admins can then verify/suspend them (Part 6). A `SupplierCard` component exists but no public page renders the directory.

**Knowledge Hub:** `KnowledgeArticle` model (slug unique, 8 categories from FERTILIZER_VERIFICATION to NEW_METHODS, source institution/URL/author, crop tags, summary, markdown content, publish flag). Public: `GET /api/knowledge/articles` (published only; category/cropTag/search filters; ISR 3600 s) and `GET /api/knowledge/articles/[slug]` (404 unless published). Pages `/knowledge` (category tabs via `KnowledgeHubClient`) and `/knowledge/[slug]` (react-markdown, `ArticleSourceBadge`) **work correctly** (they read the right `data` key). Authoring is admin-only (Part 6.4) with OpenAI moderation.

## 4.10 Food Hub background jobs

`vercel.json` registers exactly **two crons** (Hobby-plan 2-cron limit, per `weekly-jobs` header comment):

| Schedule | Route | What it does |
|---|---|---|
| `0 0 * * *` (daily 00:00 UTC) | `POST /api/cron/price-alert-check` | Sweeps ≤50 active alerts: 7-day average price per alert's crop+county; if ≥ target and outside the 24 h cooldown → SMS + `lastTriggeredAt`. Then reconciles ≤20 stuck PENDING_PAYMENT orders. ⚠️ The route's comment says "every 15 min" — the deployed schedule is daily. |
| `0 3 * * 1` (Mon 03:00 UTC) | `POST /api/cron/weekly-jobs` | Sequentially: ① TTL-backstop deletion of expired chat/mentor sessions ② weekly `MarketInsight` aggregation ③ `PlatformImpactSummary` singleton recompute (food + education metrics). |

All cron routes require `Authorization: Bearer ${CRON_SECRET}`. Standalone routes `/api/cron/{cleanup-sessions, market-insight, impact-summary}` duplicate the sub-tasks for manual invocation/testing and are **not scheduled**.

---

# PART 5 — EDUCATION HUB

## 5.1 Purpose, architecture, verification philosophy

The Education Hub converts project work into a **review-backed, hash-anchored credential**. Its trust model has four pillars, all implemented:

1. **Process over artifact** — students must produce three written process documents plus running blocker and AI-usage logs; the deliverable is evidence of *how* they worked.
2. **Tamper evidence** — every process document is SHA-256-hashed server-side at submission (`createHash('sha256')`, `engagements/[id]/documents/route.ts:76`), and the hashes are frozen again into an append-only `VerificationAuditLog` at decision time.
3. **Layered human review** — anonymous student peer review first, then a final decision by a lecturer whose account an admin has credential-verified, with mandatory written justification (≥50 words per rubric dimension).
4. **Accountability symmetry** — every lecturer decision also updates a `LecturerEffectiveness` record, so reviewers are themselves measured.

Collections: `ProjectEngagement`, `PeerReview`, `LecturerReview`, `VerificationAuditLog`, `StudentPortfolioStatus`, `LecturerEffectiveness`, `BriefContextLibrary`, `MentorSession`.

## 5.2 Project lifecycle (every state and transition)

`ProjectStatus` (`src/types/index.ts:85–94`):

```
BRIEF_GENERATED ──(student starts)──▶ IN_PROGRESS ──(student submits; all 3 docs required)──▶ UNDER_PEER_REVIEW
UNDER_PEER_REVIEW ──(peer submits scores)──▶ UNDER_LECTURER_REVIEW
UNDER_LECTURER_REVIEW ──(lecturer decides)──▶ VERIFIED | REVISION_REQUIRED | DENIED
```

- **Creation** (`POST /api/education/engagements`): STUDENT, ACTIVE account, **one active engagement at a time** (any non-terminal status blocks a new one — 409 `ENGAGEMENT_ALREADY_ACTIVE`). Student chooses `track` (AI_BRIEF | OPEN_SOURCE) and self-selects `tier` (BEGINNER | INTERMEDIATE | ADVANCED).
  - *AI_BRIEF:* picks a random tier-matching industry context from the latest `BriefContextLibrary` version (best-effort) and calls OpenAI `gpt-4o-mini` (JSON mode, temp 0.7, max 1000 tokens) to generate a structured Kenyan-context client brief: title, client persona (business type, real county, situation), problem statement, 5–7 core requirements, technical constraints, Kenya-specific constraints, deliverables, suggested stack, complexity (`generateAIBrief`, `src/lib/integrations/openaiService.ts:126–186`). Hard failure → 503 `AI_SERVICE_ERROR` (no engagement created).
  - *OPEN_SOURCE:* requires a `https://github.com/owner/repo` URL; OpenAI drafts a contribution goal + approach, **with a non-throwing static fallback plan** if OpenAI fails (`generateOpenSourceBrief:193–231`).
- **Start** (`PATCH …/[id]/status`, body locked to `{status:'IN_PROGRESS'}`): only from BRIEF_GENERATED.
- **Work — only while IN_PROGRESS** (each route enforces this with 409):
  - `PATCH …/[id]/documents` — upsert one of `problemBreakdown | approachPlan | finalReflection` (≥50 chars); server hashes and timestamps it; re-submission overwrites (hash changes accordingly).
  - `POST …/[id]/blockers` — append `{stuckOn ≥10, resolution ≥10, durationHours > 0}`.
  - `POST …/[id]/ai-usage` — append `{toolUsed, prompt ≥10, outputReceived ≥10, studentAction ≥10}`; `source` is **forced to 'MANUAL' server-side** (clients cannot claim auto-logging).
- **Submit** (`POST …/[id]/submit`): requires all three documents (422 `DOCUMENTS_INCOMPLETE` otherwise); assigns a peer reviewer; transitions atomically with a status-guard `findOneAndUpdate` (double-submit race → peer review rolled back, 409).
- **Terminal handling:** VERIFIED and DENIED free the student to start a new engagement. ⚠️ **REVISION_REQUIRED is a dead end:** it counts as *active* (blocks new engagements) but no route returns it to IN_PROGRESS and document submission requires IN_PROGRESS — so a student told to revise **cannot revise or move on**. This is the single largest workflow gap in the Education Hub.

## 5.3 STUDENT CAPABILITIES

Dashboard nav: My Project, Peer Review, AI Mentor, Portfolio (`Sidebar.tsx:48–53`).

1. **Generate a brief / start an engagement** — `/dashboard/student/projects/new` (track picker, tier picker, GitHub URL field with live regex validation).
2. **Read current engagement** — `GET /api/education/engagements/me` (returns `null`, never 404); `/dashboard/student` redirect-hub; `/dashboard/student/projects/[id]` (702 lines) — the project workspace: brief panel, `ProjectStatusStepper`, and four tabs (Overview / Documents / Blockers / AI Usage) that unlock once the project leaves BRIEF_GENERATED; Start and Submit buttons wired to the APIs.
3. **Author process documents, blockers, AI-usage entries** (components `DocumentsTab`, `BlockersTab`, `AIUsageTab`).
4. **Submit for review** (5.2).
5. **Serve as a peer reviewer** — `GET /api/peer-reviews/assigned` (current ASSIGNED review or null); `GET /api/peer-reviews/[id]` returns the assignment **plus a redacted engagement view** — brief, tier, track, and the three documents, with **no student identity field selected** (`peer-reviews/[id]/route.ts:54–56`) → reviews are effectively anonymous; `POST /api/peer-reviews/[id]` submits `{scores: codeQuality 1–5, documentationClarity 1–5, comments: both required}`, atomically (status-guarded), and advances the engagement to UNDER_LECTURER_REVIEW. UI: `/dashboard/student/peer-review` + `/dashboard/student/peer-review/[id]` (478 lines).
6. **Chat with the AI Mentor** — `POST /api/mentor/chat` `{message ≤1000, engagementId}`; must own an *active* engagement; rate-limited 20/h + 10 per 10 min per session; Groq `llama3-8b-8192` (max 500 tokens) with a Socratic system prompt that names the student's tier and brief title and **forbids writing code for the student**; conversation persisted per engagement in `MentorSession` (30-day TTL, every message `autoLogged: true`); graceful fallback string on Groq failure. UI: `/dashboard/student/mentor` + `MentorChat`.
7. **View portfolio** — `GET /api/students/me/portfolio`: the `StudentPortfolioStatus` document or a zero-state scaffold (BEGINNER / BUILDING / empty arrays) so the UI never errors. UI: `/dashboard/student/portfolio` (231 lines).
8. **Upload images** — `POST /api/upload/sign` (STUDENT is an allowed role) for the three whitelisted Cloudinary folders.

**Student limitations (verified):** cannot pick or decline peer-review assignments; cannot see who reviews them; cannot appeal in-product (appeals are an email process per the website); cannot edit profile/tier; tier never advances automatically (see 5.7); cannot abandon/cancel an engagement (no delete route) — a stuck engagement blocks them forever short of DB intervention; REVISION_REQUIRED trap (5.2).

## 5.4 LECTURER CAPABILITIES

1. **Get verified** — admin action (Part 6.2); unverified lecturers receive 403 `LECTURER_NOT_VERIFIED` on every lecturer endpoint.
2. **Review queue** — `GET /api/lecturer/queue`: **all** engagements in UNDER_LECTURER_REVIEW (global pool — no assignment, routing, or claim mechanism; any verified lecturer may take any submission), with student names populated. UI: `/dashboard/lecturer/queue` (201 lines); `/dashboard/lecturer` redirects there.
3. **Review detail** — `GET /api/lecturer/reviews/[engagementId]`: the engagement with student name **and the populated peer review (scores + comments)**. ⚠️ The `/trust` page promises lecturers assess "independently before seeing the peer score"; in implementation the peer scores are *locked* (immutable once submitted) but **are shown to the lecturer on the review page** — the independence claim is aspirational, not enforced.
4. **Submit a decision** — `POST /api/lecturer/reviews`: `{engagementId, decision, scores: problemUnderstanding/solutionQuality/processQuality/aiUsage each 1–5, comments: ≥50 words each (enforced by Zod word count), overallFeedback?, rejectionReason (required when DENIED)}`. One review per engagement (409 `DB_DUPLICATE`). Atomic five-step side-effect chain (`lecturer/reviews/route.ts:125–205`): create `LecturerReview` → status-guarded engagement transition (+`verifiedAt` when VERIFIED; orphan-review cleanup on race) → append `VerificationAuditLog` (document hashes, GitHub snapshot, scores) → `$inc` portfolio `stats.verifiedProjectCount` (upsert, VERIFIED only) → `$inc` `LecturerEffectiveness` counters + `lastReviewAt`. UI: `/dashboard/lecturer/reviews/[engagementId]` (417 lines) + `ReviewScoreForm`.

**Lecturer limitations:** no dashboard of their own effectiveness stats (model is written, never read by any route); no history of own past reviews; cannot edit/withdraw a submitted decision; track/subject restrictions described on `/for/lecturers` ("only submissions on tracks where you are verified") are **not implemented** — verification is a single boolean.

## 5.5 EMPLOYER CAPABILITIES

**None in-product.** No employer role, no portfolio-browsing route, no public portfolio page, no verification-lookup endpoint. `ProjectEngagement.verificationUrl` is indexed (`ProjectEngagement.model.ts:78`) and typed, but **no code ever writes or serves it** — the "employer verifies a portfolio entry via URL" flow described on `/for/students` ("What an Employer Sees") and `/for/employers` is **planned, not implemented**. The only employer-usable artifact today is the public Transparency stats.

## 5.6 INSTITUTION CAPABILITIES

**None.** Universities appear only as free-text strings (`studentData.universityAffiliation`, `lecturerData.universityAffiliation` — neither is ever written by any route post-registration) and as a distinct-count in the impact summary. The `/for/employers` page's "institutional partnerships / bulk access / API integration" is a contact invitation, not a feature.

## 5.7 Portfolio system (full status)

`StudentPortfolioStatus` models a rich portfolio: current tier, portfolio strength (BUILDING→EXCEPTIONAL), `verifiedProjects[]` (title, tier, tech stack, score, lecturer institution), `verifiedSkills[]`, `tierProgressionTimeline[]`, stats. **Implemented today:** only `stats.verifiedProjectCount` is ever incremented (on VERIFIED decisions). ⚠️ Everything else — project/skill array population, tier progression, portfolio-strength recalculation, `lastRecalculatedAt`, `studentData.completedProjectCount` — has **no writer anywhere in the codebase**. The portfolio page therefore renders real verified counts but permanently empty project/skill lists. `PortfolioStrength` and tier advancement are schema-only.

## 5.8 Hashing & authenticity system (full status)

- **Implemented:** per-document SHA-256 at submission time (hash + content + timestamp stored on the engagement); hashes re-frozen in `VerificationAuditLog` at decision time; audit log is append-only with indexes on engagement/student/recordedAt; `hashContent()` helper in `src/lib/utils.ts:137–139`.
- **Not implemented:** GitHub evidence. `IGithubSnapshot` (commitCount, lastCommitHash, commitTimelineHash) exists on the engagement and is copied into the audit log, but **no GitHub service exists** (no Octokit, no GitHub App client, despite `GITHUB_APP_*` vars listed in CLAUDE.md — note `src/lib/env.ts` does **not** require them), so snapshots are always empty and audit logs store `''` hashes for GitHub fields. `GITHUB_CACHE_TTL_MINUTES` is an unused constant. **No public hash-verification endpoint exists** — hashes are recorded but nothing lets an outsider check one.
- `PeerReviewStatus.WAIVED` is defined but never assigned (no waiver path).
- **Peer-reviewer assignment is naive:** `User.findOne({role: STUDENT, status: ACTIVE, _id: {$ne: author}})` — the *first* other active student in natural order gets every assignment; no load balancing, no tier matching, no conflict-of-interest logic beyond "not the author", and 503 `NO_REVIEWER_AVAILABLE` when the platform has a single student.

---

# PART 6 — ADMINISTRATIVE INFRASTRUCTURE

Admin sidebar (`Sidebar.tsx:57–64`): Farmer Verification, Supplier Verification, Knowledge Hub CMS, Impact Summary, Lecturer Verify, Brief Contexts. All `/api/admin/*` routes are double-gated (middleware + `requireRole(ADMIN)`).

## 6.1 Farmer verification queue
- `GET /api/admin/verification-queue` — cursor-paginated PENDING farmers with name, phone, county, document type/number/image URL, submission date, total count.
- `GET /api/admin/farmers/[farmerId]` — full farmer record for review.
- `PATCH /api/admin/verify-farmer` — `{farmerId, decision: APPROVED|REJECTED, rejectionReason}` (reason **required** for rejection). Must be PENDING (409 otherwise). APPROVED → `isVerified: true`, **seeds FarmerTrustScore at 40/ESTABLISHED**, SMS "your farmer account has been verified", audit-log `FARMER_APPROVED`. REJECTED → SMS with the reason + resubmission hint, audit-log `FARMER_REJECTED` with the reason in `details`.
- UI: `/dashboard/admin/verification-queue` (514 lines) and `/dashboard/admin/farmer/[farmerId]` (453 lines).

## 6.2 Lecturer verification
- `GET /api/admin/lecturers` — all lecturer accounts with verification state and university string.
- `POST /api/admin/verify-lecturer` — `{lecturerId}` → `isVerified: true`; 409 if already verified; audit-log `LECTURER_VERIFIED`. ⚠️ **One-way:** no un-verify/revoke endpoint exists. No rejection state for lecturers either (binary boolean).
- UI: `/dashboard/admin/lecturer-verification` (231 lines).

## 6.3 Supplier verification
- `GET /api/admin/supplier-verification` — PENDING queue with `queueSize` meta; `GET /api/admin/suppliers/[supplierId]` detail.
- `PATCH /api/admin/verify-supplier` — `{supplierId, decision: VERIFIED|SUSPENDED}`; stamps `verifiedBy`/`verifiedAt` on VERIFIED; audit-logs `SUPPLIER_VERIFIED`/`SUPPLIER_SUSPENDED`. SUSPENDED suppliers drop out of the public directory and group-order proposals.
- UI: `/dashboard/admin/supplier-verification` (283 lines), `/dashboard/admin/supplier/[supplierId]` (367 lines).

## 6.4 Knowledge Hub CMS
- `GET /api/admin/knowledge/articles` — all articles including drafts (uncached, unlike the public ISR route).
- `POST /api/knowledge/articles` (ADMIN) — create with **OpenAI Moderation API pre-screen** (flagged content → 422 `AI_CONTENT_FLAGGED`; moderation failures fail-open with a warning); slug auto-generated via `slugify` with timestamp suffix on collision; `publishedAt` stamped when published.
- `PATCH /api/knowledge/articles/[slug]` (ADMIN) — update title/content/cropTags/isPublished (publish & unpublish; republish refreshes `publishedAt`). **No moderation on edit** and **no delete endpoint**.
- UI: `/dashboard/admin/knowledge` (383 lines).

## 6.5 Brief Context Library
- `GET /api/admin/brief-contexts` — latest version; `PUT` — publishes a **new immutable version** (append-only versioning, `version = latest + 1`, `updatedBy` recorded). Contexts define industry name, client-persona templates (business types, counties, contexts), problem domains, Kenyan constraints, example projects, target tiers — consumed at random by AI-brief generation (5.2).
- UI: `/dashboard/admin/brief-contexts` (297 lines).

## 6.6 Analytics
- `GET /api/admin/impact-summary` — the cron-computed `PlatformImpactSummary` singleton (verified farmers, buyers, completed orders, KES volume, avg premium, crop count, counties, avg trust score; students, verified projects, active students, avg score, skills issued, lecturers, universities) augmented with two live counts (total farmers, total orders). UI: `/dashboard/admin/impact-summary` (121 lines).

## 6.7 Marketplace & group oversight
- Admin can read any group (`GET /api/groups/[groupId]`), manage any group's members, and drive the group-order state machine (CLOSE/FULFILL/CANCEL) — see 4.4.
- ⚠️ **Absent admin powers (verified):** no user search/list (beyond lecturers), no suspend/unsuspend user, no listing takedown, no order intervention/refund, no dispute resolution, no rating moderation, no audit-log *viewer* (logs are write-only), no configuration UI (rate limits, benchmarks, fees are code constants), no data export anywhere.

## 6.8 Audit & system controls
- `AdminAuditLog` (append-only; `adminId+createdAt` and `targetId` indexes) records exactly five action types: FARMER_APPROVED, FARMER_REJECTED, LECTURER_VERIFIED, SUPPLIER_VERIFIED, SUPPLIER_SUSPENDED — all written fire-and-forget (`.catch(() => {})`).
- `VerificationAuditLog` records every lecturer decision with frozen hashes.
- Structured JSON logging via `logger` (`src/lib/utils.ts:99–131`) for Vercel log capture; per-request `requestId` UUIDs throughout.
- Cron secret auth; health endpoint; Daraja IP allowlist; `validateEnv()` boot check over 24 required variables (`src/lib/env.ts`).

---

# PART 7 — DATA MODEL

24 Mongoose models in `src/lib/models/`. The DB connection is a cached singleton (`src/lib/db.ts`, `global.mongooseCache`); models are lazy-imported inside async handlers for serverless safety.

## 7.1 Identity & trust

| Model | Key fields | Lifecycle / notes |
|---|---|---|
| **User** | email (unique), hashedPassword (`select:false`), names, Kenyan phone, role, county, status, isEmailVerified, email/reset tokens (`select:false`), role sub-docs `farmerData`/`studentData`/`lecturerData` | Status ACTIVE→(SUSPENDED/DELETED — no writer). `toJSON` strips password. Indexes: email, role+status, county, farmerData.isVerified |
| **FarmerTrustScore** | farmerId (unique), 4 component breakdowns, compositeScore, tier, lastCalculatedAt | Created at approval (40/ESTABLISHED); upserted on every recalc. Index compositeScore+tier |
| **AdminAuditLog** | adminId, action, targetId, targetType, details, createdAt only | Append-only; 5 action types |

## 7.2 Marketplace & transactions

| Model | Key fields | Lifecycle |
|---|---|---|
| **MarketplaceListing** | farmerId, title, cropName, description, quantity, unit, price, pickupCounty/description, ≤5 imageUrls, listingStatus, isVerifiedListing, viewCount (never written), buyerContactPreference | AVAILABLE → SOLD_OUT (atomic, stock=0) → AVAILABLE (restock on payment failure/timeout). INACTIVE unreachable. Text index title/crop/description + 6 query indexes |
| **Order** | orderReferenceId `UMJ-YYYY-XXXXXX` (unique), listing/farmer/buyer ids, crop snapshot, qty, unit, pricePerUnit, totalAmountKES, fulfillmentType (PICKUP/DELIVERY), buyerPhone, paymentStatus, fulfillmentStatus, mpesaCheckoutRequestId, mpesaTransactionId (unique sparse — webhook idempotency), paidAt, confirmedByFarmerAt, receivedByBuyerAt, disputeFlaggedAt/Reason (no writer) | Payment: PENDING_PAYMENT→PAID/FAILED (REFUNDED unreachable). Fulfillment: AWAITING_PAYMENT→IN_FULFILLMENT (webhook)→COMPLETED (buyer). RECEIVED is an input alias for COMPLETED. DISPUTED unreachable |
| **Rating** | orderId (unique — one per order), farmerId, buyerId, rating 1–5, comment ≤500 | Immutable (no edit/delete routes) |
| **Counter** | _id string, seq | Atomic `$inc` for order references |

## 7.3 Pricing

| Model | Notes |
|---|---|
| **PriceHistory** | crop, county, price, unit, source (LISTING_CREATED / ORDER_COMPLETED / EXTERNAL_INGESTION-unused), farmerId?, orderId?, recordedAt. Insert-only |
| **PriceAlert** | farmerId, crop, county, targetPrice, unit, method SMS/EMAIL/BOTH (email dead), isActive, lastTriggeredAt (24 h cooldown) |
| **MarketInsight** | crop+county+weekOf upserts with pricing block incl. middlemanBenchmark + platformPremium |
| **PlatformImpactSummary** | Singleton snapshot, food + education metric blocks, computedAt |

## 7.4 Cooperative & suppliers

| Model | Notes |
|---|---|
| **FarmerGroup** | name, county, createdBy, members[], memberCount (≤50), status ACTIVE/DISSOLVED (DISSOLVED has no writer) |
| **GroupOrder** | groupId, proposedBy, supplierId, inputType, qty/price per member, joiningDeadline, minimumMembers, status OPEN→MINIMUM_MET→CLOSED→FULFILLED / →CANCELLED, participatingMembers[] with per-member paymentStatus (never advanced) |
| **VerifiedSupplier** | business identity, county, inputCategories, KEBS/PCPB/KEPHIS numbers, status PENDING/VERIFIED/SUSPENDED, verifiedBy/At. Seed-created only |

## 7.5 Education

| Model | Notes |
|---|---|
| **ProjectEngagement** | studentId, track, tier, status (8 states), brief (Mixed), briefContextId, githubRepoUrl/Name, issueUrl (never written), documents{3 hashed docs + blockerLog[] + aiUsageLog[]}, githubSnapshot (never populated), peerReviewId, lecturerReviewId, verificationUrl (indexed, never written), verifiedAt |
| **PeerReview** | engagementId, reviewerId, status ASSIGNED/SUBMITTED/(WAIVED-unused), scores{codeQuality, documentationClarity}, comments, submittedAt |
| **LecturerReview** | engagementId, lecturerId, decision, 4 scores, 4+1 comments, rejectionReason |
| **VerificationAuditLog** | Append-only: engagement/student/lecturer ids, decision, 3 document hashes, GitHub snapshot (empty in practice), scores, recordedAt |
| **StudentPortfolioStatus** | studentId unique, currentTier, portfolioStrength, verifiedProjects[], verifiedSkills[], tierProgressionTimeline[], stats — only `stats.verifiedProjectCount` ever written |
| **LecturerEffectiveness** | lecturerId unique, total/verified/denied/revision counts, averageScoresGiven (never computed), averageCommentWordCount (never computed), lastReviewAt |
| **BriefContextLibrary** | Versioned append-only context sets, updatedBy |

## 7.6 Conversational & content

| Model | Notes |
|---|---|
| **ChatSession** | farmerId, messages[], weatherContextUsed, lastActivityAt, **TTL index on expiresAt** (90 days, refreshed per message) + cron backstop |
| **MentorSession** | studentId+engagementId, messages[] (autoLogged flag), **TTL 30 days**, same backstop |
| **KnowledgeArticle** | slug unique, 8 categories, source attribution, crop tags, publish workflow, ISR-served |

## 7.7 Ownership & relationship summary

User 1—1 FarmerTrustScore / StudentPortfolioStatus / LecturerEffectiveness; User 1—N Listings, Orders (as farmer and as buyer), Ratings, PriceAlerts, ChatSessions, Engagements, PeerReviews (as reviewer), LecturerReviews (as lecturer), Groups (as creator/member). Listing 1—N Orders; Order 1—0..1 Rating; Engagement 1—0..1 PeerReview, 1—0..1 LecturerReview, 1—N VerificationAuditLog entries; Group 1—N GroupOrders; GroupOrder N—1 VerifiedSupplier.

---

# PART 8 — API SURFACE

49 route handlers. Conventions: success `{data: …}` (orders list returns `{orders, nextCursor}`), errors `{error, code, details?}`; cursor pagination via `_id` comparison; all writes Zod-validated.

## Auth (public)
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/[...nextauth]` | * | — | NextAuth (credentials login, session, signout) |
| `/api/auth/register` | POST | rate-limited | Create account (4 self-service roles) |
| `/api/auth/verify-email` | GET | token | Verify email, redirect |
| `/api/auth/forgot-password` | POST | rate-limited | Issue reset token (non-enumerating) |
| `/api/auth/reset-password` | POST | rate-limited | Consume token, set password |

## Food Hub
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/marketplace` | GET | public | Browse/search listings w/ trust enrichment |
| `/api/marketplace` | POST | FARMER (verified) | Create listing (+PriceHistory) |
| `/api/marketplace/[id]` | GET | public | Listing + farmer + trust detail |
| `/api/marketplace/[id]` | PATCH | FARMER (owner) | Edit listing |
| `/api/orders` | GET | BUYER/FARMER | Role-shaped order list |
| `/api/orders` | POST | BUYER | Atomic reserve + order + STK Push (5/h) |
| `/api/orders/[id]/status` | PATCH | FARMER/BUYER | IN_FULFILLMENT / RECEIVED transitions + trigger chain |
| `/api/orders/[id]/payment-status` | GET | owner | Payment polling |
| `/api/ratings` | POST | BUYER | Rate completed order (+trust recalc) |
| `/api/prices` | GET | FARMER/ADMIN | Price intelligence |
| `/api/prices/alerts` | GET/POST | FARMER | Alert list/create |
| `/api/prices/alerts/[id]` | DELETE | FARMER (owner) | Remove alert |
| `/api/farmers` | GET/POST | FARMER | Profile + trust read / profile write |
| `/api/farmers/verify` | POST | FARMER | Submit verification documents |
| `/api/groups` | GET/POST | FARMER | Group list/create |
| `/api/groups/[id]` | GET/PATCH | FARMER/ADMIN | Detail / member ADD-REMOVE |
| `/api/groups/[id]/orders` | GET/POST | FARMER | Group-order list/propose |
| `/api/groups/[id]/orders/[oid]` | GET/PATCH | FARMER/ADMIN | Detail / JOIN-CLOSE-FULFILL-CANCEL |
| `/api/suppliers` | GET | public | Verified supplier directory |
| `/api/knowledge/articles` | GET | public (ISR 1 h) | Published articles |
| `/api/knowledge/articles` | POST | ADMIN | Create (OpenAI-moderated) |
| `/api/knowledge/articles/[slug]` | GET | public (ISR 1 h) | Article detail |
| `/api/knowledge/articles/[slug]` | PATCH | ADMIN | Edit/publish/unpublish |
| `/api/assistant` | POST | FARMER | Groq farm assistant (weather-aware) |
| `/api/webhooks/daraja` | POST | Safaricom IPs | M-Pesa callback (always 200, idempotent) |

## Education Hub
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/education/engagements` | POST | STUDENT | Brief generation + engagement create |
| `/api/education/engagements/me` | GET | STUDENT | Active engagement or null |
| `…/[id]/status` | PATCH | STUDENT (owner) | BRIEF_GENERATED→IN_PROGRESS |
| `…/[id]/documents` | PATCH | STUDENT (owner) | Hashed process-doc upsert |
| `…/[id]/blockers` | POST | STUDENT (owner) | Append blocker entry |
| `…/[id]/ai-usage` | POST | STUDENT (owner) | Append AI-usage entry (source forced MANUAL) |
| `…/[id]/submit` | POST | STUDENT (owner) | Assign peer reviewer, →UNDER_PEER_REVIEW |
| `/api/peer-reviews/assigned` | GET | STUDENT | Current assignment |
| `/api/peer-reviews/[id]` | GET/POST | STUDENT (reviewer) | Anonymized read / score submit →UNDER_LECTURER_REVIEW |
| `/api/lecturer/queue` | GET | LECTURER (verified) | Global review queue |
| `/api/lecturer/reviews/[engagementId]` | GET | LECTURER (verified) | Review detail incl. peer scores |
| `/api/lecturer/reviews` | POST | LECTURER (verified) | Decision + audit + portfolio + effectiveness chain |
| `/api/students/me/portfolio` | GET | STUDENT | Portfolio or scaffold |
| `/api/mentor/chat` | POST | STUDENT | Engagement-scoped Groq mentor |

## Admin, platform, cron
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/verification-queue` | GET | ADMIN | Pending farmers |
| `/api/admin/farmers/[id]` | GET | ADMIN | Farmer detail |
| `/api/admin/verify-farmer` | PATCH | ADMIN | Approve/reject (+trust seed, SMS, audit) |
| `/api/admin/lecturers` | GET | ADMIN | Lecturer roster |
| `/api/admin/verify-lecturer` | POST | ADMIN | Grant lecturer verification |
| `/api/admin/supplier-verification` | GET | ADMIN | Pending suppliers |
| `/api/admin/suppliers/[id]` | GET | ADMIN | Supplier detail |
| `/api/admin/verify-supplier` | PATCH | ADMIN | Verify/suspend supplier |
| `/api/admin/knowledge/articles` | GET | ADMIN | All articles incl. drafts |
| `/api/admin/brief-contexts` | GET/PUT | ADMIN | Versioned brief-context library |
| `/api/admin/impact-summary` | GET | ADMIN | Platform metrics snapshot |
| `/api/upload/sign` | POST | F/S/L/ADMIN | Signed Cloudinary params (3 whitelisted folders, SHA-1 signature) |
| `/api/transparency` | GET | public (ISR 5 min) | Public stats |
| `/api/health` | GET | public | DB-aware health check |
| `/api/cron/price-alert-check` | POST | CRON_SECRET | Alert sweep + stuck-payment reconciliation (scheduled daily) |
| `/api/cron/weekly-jobs` | POST | CRON_SECRET | Cleanup + market insight + impact summary (scheduled Mon) |
| `/api/cron/{cleanup-sessions, market-insight, impact-summary}` | POST | CRON_SECRET | Manual/unscheduled sub-task routes |

---

# PART 9 — PLATFORM WORKFLOWS

## 9.1 Farmer Journey
1. Lands on `/for/farmers` → register as FARMER → verify email link → login → redirected to `/dashboard/farmer/listings`.
2. Completes profile at `/dashboard/farmer/profile` (crops required for `onboarded: true`), uploads ID image directly to Cloudinary, submits verification → status PENDING.
3. Admin approves → SMS arrives, Trust Score = 40 (ESTABLISHED), `isVerified: true`.
4. Creates a listing (POST works; the "My Listings" *table* is currently blank due to the `own=true` gap) → asking price recorded in PriceHistory.
5. Buyer orders → stock atomically reserved → buyer pays via STK → webhook flips order to PAID + IN_FULFILLMENT → farmer gets "prepare for fulfillment" SMS. (Decision point: the API allows the farmer to stamp dispatch confirmation; the UI button never appears — see 4.2.4.)
6. Buyer marks RECEIVED → order COMPLETED → transaction price logged, trust recalculated (transaction + rating + reliability components), any matching price alerts SMS other farmers.
7. Buyer rates → trust recalculated again; tier may climb ESTABLISHED→TRUSTED→PREMIUM.
8. Ongoing: Farm Assistant Q&A with live weather; price dashboards and alerts; create a cooperative group, have members added, propose group input orders against verified suppliers (API-level).

## 9.2 Buyer Journey
Browse `/marketplace` anonymously (API healthy; page currently faulted) → register as BUYER → checkout on a listing: choose quantity/pickup-or-delivery, enter `+254` phone, submit → "Check your phone and enter your M-Pesa PIN" → UI polls payment-status up to 90 s → on PAID, confirmation SMS → track in `/dashboard/buyer/orders` with the OrderTimeline → mark RECEIVED on arrival → rate 1–5 with comment. Failure paths: STK declined/cancelled → order FAILED, stock restored, admin SMSed; no callback in 15 min → cron reconciles identically. Recourse beyond rating: none in-product (disputes unreachable).

## 9.3 Student Journey
Register as STUDENT → `/dashboard/student/projects/new` → pick AI_BRIEF (tier-matched Kenyan client brief generated live) or OPEN_SOURCE (repo URL → contribution plan, with fallback) → workspace `/dashboard/student/projects/[id]` → Start (→IN_PROGRESS, unlocks tabs) → write the three documents (each SHA-256-hashed on save), log blockers and every AI interaction, consult the Socratic AI Mentor → Submit (all docs present) → a peer (assigned automatically, anonymous to each other) scores code quality + documentation clarity → lecturer reviews everything incl. peer scores → outcome:
- **VERIFIED**: `verifiedAt` stamped, audit-logged with hashes, portfolio verified-count +1; student may start a new project.
- **DENIED** (with mandatory reason): terminal; student may start fresh.
- **REVISION_REQUIRED**: ⚠️ currently a trap — no revise or restart path exists (5.2).
Throughout, the student also serves peer reviews assigned to them under `/dashboard/student/peer-review`.

## 9.4 Lecturer Journey
Register as LECTURER → wait for admin verification (no in-product application/evidence upload — the credential check happens off-platform) → `/dashboard/lecturer/queue` shows every submission awaiting review → open one → read brief, documents (with hashes), blocker/AI logs, peer scores → score 4 dimensions, write ≥50 words per dimension, decide → submission triggers the audit/portfolio/effectiveness chain. One decision per engagement, irreversible.

## 9.5 Employer Journey
Entirely off-platform today: read `/for/employers`, `/trust`, `/transparency`; request portfolios from candidates directly; email the platform for partnership. No login, no lookup tool (verificationUrl unimplemented).

## 9.6 NGO Journey
Visit `/transparency` (or pull `GET /api/transparency`) for the six live indicators + methodology; email for anything deeper. No account.

## 9.7 Cooperative Journey
A verified farmer creates a group → adds up to 49 fellow farmers (creator-managed, via API) → at ≥5 members proposes an input order against a VERIFIED supplier with per-member quantity/price and a deadline → members JOIN until the deadline → at `minimumMembers` the order auto-marks MINIMUM_MET → an admin CLOSEs it, coordinates with the supplier off-platform, then marks FULFILLED (or CANCELs). Payment between members and supplier happens outside the system.

## 9.8 Administrator Journey
Account seeded via `scripts/seed-admin.ts` → login → `/dashboard/admin/verification-queue`. Daily surface: review farmer documents (approve → trust seed + SMS; reject → reasoned SMS), verify lecturers, verify/suspend suppliers, author/publish knowledge articles (auto-moderated), curate the brief-context library (versioned), monitor the impact summary, drive group-order closure/fulfillment, and receive SMS pages on payment failures. All five verification action types are audit-logged automatically.

---

# PART 10 — CAPABILITY MATRIX

Legend: **V** view · **C** create · **E** edit · **A** approve · **R** reject · **X** verify · **Adm** administer · **—** no access · *(api)* reachable via API but no UI · *(bk)* backend/schema only, unreachable. Columns: Anonymous (Anon), Farmer (F), Buyer (B), Student (S), Lecturer (L), Admin. Employer / NGO / Institution / Cooperative have **no accounts**: Employer = Anon; NGO = Anon; Cooperative = F (group features); "Authenticated user" = union of role columns.

| Capability | Anon | F | B | S | L | Admin |
|---|---|---|---|---|---|---|
| Website pages, StoryWorld, methodology | V | V | V | V | V | V |
| Transparency stats | V | V | V | V | V | V |
| Register / login / password reset | C | — | — | — | — | (seed only) |
| Marketplace browse + listing detail (API) | V | V | V | V | V | V |
| Listing | — | C/E (own) | — | — | — | — |
| Listing deactivate / delete | — | *(bk)* | — | — | — | — |
| Order + M-Pesa STK payment | — | — | C | — | — | — |
| Order status: confirm dispatch | — | E *(api; UI button suppressed)* | — | — | — | — |
| Order status: mark received | — | — | E (own) | — | — | — |
| Dispute an order | — | *(bk)* | *(bk)* | — | — | *(bk — no resolution tooling)* |
| Rate farmer | — | — | C (1/order) | — | — | — |
| Trust score | V (per listing) | V (own breakdown) | V | — | — | V (aggregate) |
| Price intelligence | — | V | — | — | — | V |
| Price alerts | — | C/V/Delete | — | — | — | — |
| Farm Assistant (Groq+weather) | — | C | — | — | — | — |
| Farmer profile + verification submission | — | C/E | — | — | — | V |
| Farmer verification decision | — | — | — | — | — | A/R + audit |
| Cooperative group create/read | — | C/V | — | — | — | V |
| Group member add/remove | — | E (creator) *(api)* | — | — | — | E |
| Group order propose/join | — | C *(api)* | — | — | — | — |
| Group order close/fulfill/cancel | — | — | — | — | — | Adm |
| Supplier directory | V *(api)* | V *(api)* | V *(api)* | — | — | V |
| Supplier verify/suspend | — | — | — | — | — | A/Adm |
| Knowledge articles read | V | V | V | V | V | V |
| Knowledge articles author/publish | — | — | — | — | — | C/E/Adm |
| Engagement create (brief generation) | — | — | — | C | — | — |
| Process docs / blockers / AI log | — | — | — | C/E (own) | V (in review) | — |
| Submit project | — | — | — | C | — | — |
| Peer review | — | — | — | V/C (assigned) | V | — |
| Lecturer review decision | — | — | — | — | A/R/X (verified only) | — |
| Lecturer verification | — | — | — | — | — | X |
| Student portfolio | — | — | — | V (own) | — | — |
| Public portfolio / verification URL | *(bk)* | — | — | *(bk)* | — | — |
| AI Mentor | — | — | — | C | — | — |
| Brief-context library | — | — | — | (consumed) | — | V/C (versioned) |
| Impact summary dashboard | — | — | — | — | — | V |
| Image upload signing | — | C | — | C | C | C |
| Audit logs | — | — | — | — | — | C (auto) / *no viewer* |
| User suspension | — | — | — | — | — | *(bk)* |
| Export (any) | — | — | — | — | — | — |

---

# PART 11 — IMPLEMENTATION STATUS

## Fully implemented (verified end-to-end in code)
- **Auth stack**: registration, email verification, login hardening (rate limits, constant-time compare, suspension/verification gates), JWT sessions, password reset, middleware RBAC, unauthorized page. (`src/lib/auth/options.ts`, `src/middleware.ts`, `src/app/api/auth/*`)
- **Farmer verification pipeline** incl. trust-score seeding, SMS, audit logging. (`api/farmers/verify`, `api/admin/verify-farmer`)
- **Marketplace APIs**: search/filter/paginate/enrich; create; owner-guarded edit; atomic anti-oversell reservation. (`api/marketplace/*`, `api/orders/route.ts:256–287`)
- **M-Pesa order lifecycle**: STK push, rollback on failure, idempotent webhook, inventory restoration, SMS fan-out, stuck-payment reconciliation, payment polling. (`darajaService.ts`, `webhooks/daraja`, `cron/price-alert-check`)
- **Ratings + Trust Score engine** with exact published formulas and tiers. (`api/ratings`, `lib/trust/farmerTrustCalculator.ts`)
- **Price intelligence**: dual-source history, weekly insights, platform premium, alert CRUD + SMS triggers (two channels).
- **Farm Assistant** (Groq + OpenWeatherMap + Kenyan-standards prompt + TTL sessions) and **AI Mentor** (engagement-scoped, Socratic).
- **Education core loop**: brief generation (both tracks, with open-source fallback), status machine with atomic race-guarded transitions, hashed documents, blocker/AI logs, peer review (anonymized read, score lock), lecturer review with 50-word rubric enforcement, verification audit log, lecturer effectiveness counters.
- **Admin queues**: farmer, lecturer, supplier; Knowledge CMS with OpenAI moderation; versioned brief-context library; impact summary.
- **Knowledge Hub public pages** (the one public app surface whose UI matches its API).
- **Platform plumbing**: structured logging, AppError/handleApiError, env validation, health check, transparency API, Cloudinary signing, cron auth, seed scripts, TTL indexes + sweeps, Counter-based order refs.
- **Website**: all 15 pages, nav/footer, D01 diagram, StoryWorld V1; StoryWorld V2 complete behind `NEXT_PUBLIC_STORYWORLD_V2` (flag-gated by design, with visual tuning ongoing).

## Partially implemented
| Capability | What exists | What's missing | Evidence |
|---|---|---|---|
| **Public marketplace UI** | Pages + components built | Read wrong response keys (`listings`/`listing` vs `data`) → grid throws, detail 404s | `app/marketplace/page.tsx:26–71`, `[listingId]/page.tsx:50–52` |
| **Farmer "My Listings" UI** | Page + create modal + toggle | `?own=true` unimplemented server-side; wrong key; status toggle stripped by Zod | `dashboard/farmer/listings/page.tsx:44–80`, `validation/farmerSchema.ts:31–60` |
| **Farmer dispatch confirmation** | API transition + timestamps | Webhook pre-empts the state the UI flag requires → button never shows; reliability metric starves | `webhooks/daraja:107`, `api/orders/route.ts:173–175` |
| **Dispute system** | Enum, schema, model fields, trust penalties, timeline UI | No transition accepted by the status route; no filing UI; no admin resolution | `orders/[orderId]/status/route.ts:94–100` |
| **Cooperative groups UI** | Create group, list groups/orders | No member-management, propose, or join UI (API-only) | `dashboard/farmer/group/page.tsx` |
| **Group order payments** | Per-member payment fields | No payment initiation/recording code | `GroupOrder.model.ts` |
| **Student portfolio** | Verified-count increments, scaffold API, UI page | Project/skill/tier/strength population logic absent | `lecturer/reviews/route.ts:185–191` only writer |
| **Lecturer effectiveness** | Counters written | Averages never computed; no read API/UI | `LecturerEffectiveness.model.ts` |
| **Price alert channels** | SMS works | EMAIL/BOTH accepted but never emailed | `cron/price-alert-check:80–88` |
| **Peer-review "independence"** | Scores locked before lecturer review | Peer scores are displayed to lecturers, contradicting /trust copy | `api/lecturer/reviews/[engagementId]:50–53` |
| **REVISION_REQUIRED** | State + decision path | No revise/resubmit/abandon route — student deadlock | 5.2 |
| **Daraja webhook auth** | IP allowlist (prod) + idempotency | Signature/URL-secret check is a `return true` stub | `darajaService.ts:206–211` |
| **Lecturer post-registration redirect** | — | Points at non-existent `/dashboard/lecturer/reviews/pending` | `auth/register/page.tsx:43` |
| **Cron cadence** | Alert sweep wired | Scheduled daily while code comments assume 15-min cadence | `vercel.json` vs route comment |

## Backend-only (no user-reachable surface)
- **User suspension/deletion** — enforced everywhere, settable nowhere.
- **Supplier onboarding** — directory + admin decisions exist; creation is seed-script-only; public directory has API but no page.
- **Listing INACTIVE / order REFUNDED / group DISSOLVED / peer-review WAIVED / PriceHistory EXTERNAL_INGESTION** — enum states with no writers.
- **Audit logs** (`AdminAuditLog`, `VerificationAuditLog`) — written faithfully, no viewer.
- **`viewCount`, `issueUrl`, student/lecturer profile fields** — schema fields with no writers.

## UI-only (no backend)
- Farmer listings status toggle and the `own=true` filter expectation (above).
- Website promises with no implementation: employer verification-URL lookups, lecturer track restrictions, institutional/bulk API access, EMAIL alert delivery.

## Planned / schema-anticipated, not implemented
- **GitHub evidence pipeline** (`githubSnapshot`, `GITHUB_APP_*` in docs, unused cache constant) — audit logs currently freeze empty GitHub hashes.
- **Public verification URLs** for portfolios (`verificationUrl` indexed, never written).
- **Tier progression / portfolio strength engine.**
- **Settlement/disbursement to farmers** (no B2C code).
- **Dispute resolution tooling.**

## Deprecated / dead
- `resend` npm package (installed, never imported).
- StoryWorld V1 is scheduled to be replaced by V2 "at launch" (`page.tsx:8–10`) but remains the default render today.
- CLAUDE.md's `SENDGRID_*`/`GITHUB_APP_*` env listings do not match `src/lib/env.ts` (the code requires `SMTP_*` and no GitHub vars) — the code is authoritative.

## Blocked (external dependency)
- **Production M-Pesa** — code switches to production URLs on `NODE_ENV=production`, but go-live requires Safaricom production credentials and confirmation of the Daraja callback IP range (`middleware.ts:9–11` instructs re-verification before go-live).

---

*End of reference. Every statement above is traceable to the cited files at commit `dfc5d8c`. When the marketplace UI reconciliation, dispute flow, revision flow, GitHub snapshots, or portfolio engine land, the corresponding Part 11 rows should be the first sections updated.*
