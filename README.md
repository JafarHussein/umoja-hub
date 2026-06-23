<p align="center">
  <img src="public/images/logo.png" alt="UmojaHub" width="150" />
</p>

<h1 align="center">UmojaHub</h1>

<p align="center">
  <strong>Verification infrastructure for Kenyan farmers and software students.</strong><br/>
  A trust-first marketplace and a tamper-evident talent credential — two products, one codebase, one conviction.
</p>

<p align="center">
  <a href="https://github.com/JafarHussein/umoja-hub/actions"><img src="https://img.shields.io/badge/CI-type--check%20·%20lint%20·%20test%20·%20build-success?logo=github" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-149ECA?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript" alt="TypeScript strict" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/tests-719%20passing-success?logo=jest" alt="719 tests" />
  <img src="https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel" alt="Vercel" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT" />
</p>

<p align="center">
  <a href="#-product-overview">Overview</a> ·
  <a href="#-screenshot-showcase">Screenshots</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-user-roles">Roles</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-the-trust-system">Trust</a> ·
  <a href="#-the-escrow-system">Escrow</a> ·
  <a href="#-demonstration-guide">Demo Guide</a> ·
  <a href="#-installation">Install</a>
</p>

---

## Executive summary

UmojaHub is **two products that share one codebase and one idea: Kenyan farmers and Kenyan software developers are both underserved by the infrastructure available to them.**

- The **Food Security Hub** gives smallholder farmers a verified marketplace, escrow-protected M-Pesa payments, real-time price intelligence, and an AI farming assistant — built to work on 3G.
- The **Education Hub** gives software students a structured project-verification pipeline that produces a **tamper-evident, employer-queryable credential**, signed by a credentialed academic.

Both are **infrastructure**, not a directory and not a learning app. What ties them together is the platform's signature primitive: **earned, inspectable trust** — a farmer's reputation and a student's credential are each derived from real, auditable activity, never self-asserted and never bought.

<div align="center">

| | |
|---|---|
| **8** user roles | **37** database models |
| **81** API route handlers | **58** application pages |
| **60** React components | **41** domain enums |
| **66** test suites · **719** tests | **~48,600** lines of TypeScript |

</div>

> **Note on this README.** It is written to be the single source of truth for the project — a lecturer, recruiter, judge, or future contributor should be able to understand the entire system without opening the code. Every statistic and behaviour described here is drawn from the actual codebase. The screenshot slots are populated by running `scripts/capture-screenshots.ts` (see the [Screenshot Showcase](#-screenshot-showcase) and [`docs/SCREENSHOT_PLAN.md`](docs/SCREENSHOT_PLAN.md)).

---

## 🌍 Product overview

### What is UmojaHub?

A production-grade web platform for East Africa with two connected halves:

```mermaid
flowchart LR
  subgraph FH["🌾 Food Security Hub"]
    A1[Verified Marketplace]
    A2[Escrow-protected Orders]
    A3[Farmer Trust Scores]
    A4[Price Intelligence]
    A5[AI Farm Assistant]
    A6[Group Purchasing]
  end
  subgraph EH["🎓 Education Hub"]
    B1[Project Briefs]
    B2[Peer + Lecturer Review]
    B3[Verified Portfolios]
    B4[Employer Discovery]
    B5[AI Mentor]
  end
  TRUST(("🛡️ Shared Trust &<br/>Verification Layer"))
  FH --- TRUST
  EH --- TRUST
  TRUST --- ADMIN["⚖️ Admin: verification ·<br/>escrow settlement · mediation"]
```

### Why it was built

| Problem | UmojaHub's answer |
|---|---|
| Farmers lose margin to middlemen and have **no trustworthy price benchmark**. | A direct marketplace with a **Platform Premium** calculation vs. wholesale market rates. |
| Buyers risk paying a farmer who **never dispatches**. | **Escrow**: funds are released on confirmed *fulfilment*, not on payment. |
| Farmers risk **counterfeit inputs** and bad advice. | A **verified supplier directory** + a sourced **knowledge hub** + an AI assistant grounded in the farmer's context. |
| Students do real work that is **not verifiable** by employers. | A signed, hashed, **public credential** reviewed by a real lecturer. |
| Reputation online is **self-asserted and gameable**. | Trust is **derived from auditable activity** — orders, ratings, reliability, verification — never set by hand. |

### Why the two hubs are connected

They are the same mechanism applied to two economies. A **verified identity → real activity → derived reputation → an inspectable, portable signal** loop powers both: a farmer's trust tier and a student's verified portfolio are each *provenance you can click into*. The Trust & Verification layer, the notification system, the admin tooling, the RBAC, and the design system are all shared.

---

## 📸 Screenshot showcase

> Images live in [`docs/screenshots/`](docs/screenshots) and are produced by
> `tsx scripts/capture-screenshots.ts` against a seeded dev server (see
> [`docs/SCREENSHOT_PLAN.md`](docs/SCREENSHOT_PLAN.md)). The narrative below is the
> intended product tour; each shot has a fixed filename so it renders once captured.

### Act I — The public surface

| Screen | What you're seeing | Why it matters |
|---|---|---|
| ![Home](docs/screenshots/website-hero.png) `website-hero.png` | The public marketing site (light "Documentation Stream" theme). | First impression: states the mission in one screen. |
| ![Login](docs/screenshots/auth-login.png) `auth-login.png` | Sign in with Google, GitHub, or username + password. | Three auth paths into one role-aware session. |
| ![Marketplace](docs/screenshots/marketplace-feed.png) `marketplace-feed.png` | Produce listings with farmer trust badges and full-text search. | Trust is surfaced *before* a buyer commits. |
| ![Listing](docs/screenshots/marketplace-listing-detail.png) `marketplace-listing-detail.png` | A single listing: price, pickup, farmer trust tier and history. | Confidence over speed — the buyer evaluates a person, not a SKU. |
| ![Knowledge](docs/screenshots/knowledge-hub.png) `knowledge-hub.png` | The knowledge library, every article attributed to KALRO/FAO/KEBS. | No anonymous advice. |
| ![Portfolio](docs/screenshots/portfolio-public.png) `portfolio-public.png` | A **public verified portfolio** — the student credential, no login required. | The credential is the product; it is queryable by anyone. |

### Act II — Onboarding & identity

| Screen | What you're seeing | Why it matters |
|---|---|---|
| ![Role](docs/screenshots/onboarding-role-selection.png) `onboarding-role-selection.png` | Progressive, pre-auth onboarding: pick a role first. | No registration wall — the wizard captures intent before credentials. |
| ![Identity](docs/screenshots/onboarding-identity.png) `onboarding-identity.png` | Identity capture step. | Identity is the root of every downstream trust signal. |
| ![Verify](docs/screenshots/onboarding-verification-upload.png) `onboarding-verification-upload.png` | Document upload for verification. | Verification is a gate, not a checkbox. |

### Act III — The farmer's world

| Screen | What you're seeing | Why it matters |
|---|---|---|
| ![Listings](docs/screenshots/farmer-listings.png) `farmer-listings.png` | The farmer's own listings, prices in KSh monospace. | The farmer's command surface. |
| ![Orders](docs/screenshots/farmer-orders.png) `farmer-orders.png` | Incoming orders moving through the fulfilment lifecycle. | Each row is an escrow story. |
| ![Ledger](docs/screenshots/farmer-ledger-escrow.png) `farmer-ledger-escrow.png` | Escrow balance: held vs. releasable vs. available, with payout requests. | The farmer sees exactly what is protected and what is theirs. |
| ![Trust](docs/screenshots/farmer-trust-profile.png) `farmer-trust-profile.png` | Trust score broken into its four components. | The score is *explained*, not just shown. |
| ![Prices](docs/screenshots/farmer-prices.png) `farmer-prices.png` | Crop price intelligence + Platform Premium. | Proof the platform pays better than the middleman. |
| ![Assistant](docs/screenshots/farmer-assistant.png) `farmer-assistant.png` | The Groq-powered AI farm assistant, grounded in county/crops/weather. | Expert guidance in plain language. |

### Act IV — Buyer & escrow

| Screen | What you're seeing | Why it matters |
|---|---|---|
| ![Buyer orders](docs/screenshots/buyer-orders.png) `buyer-orders.png` | Buyer's orders with live escrow + payment status pills. | The buyer's money is visibly protected until receipt. |
| ![Suppliers](docs/screenshots/buyer-suppliers.png) `buyer-suppliers.png` | Verified supplier directory. | Counterfeit-input protection. |
| ![Admin escrow](docs/screenshots/admin-escrow.png) `admin-escrow.png` | The platform escrow ledger from the admin's seat. | Escrow is operated, not assumed. |

### Act V — The student's credential

| Screen | What you're seeing | Why it matters |
|---|---|---|
| ![Student home](docs/screenshots/student-dashboard.png) `student-dashboard.png` | The student workspace. | Where work becomes a credential. |
| ![New project](docs/screenshots/student-project-new.png) `student-project-new.png` | Generating a project brief (AI scenario or open-source). | Real work, framed around a real Kenyan problem. |
| ![Portfolio](docs/screenshots/student-portfolio.png) `student-portfolio.png` | Verified projects + verified skills + reviewer institutions. | A portfolio that is hard to fake. |
| ![Peer review](docs/screenshots/student-peer-review.png) `student-peer-review.png` | The peer review queue. | Peers gate before lecturers do. |
| ![Mentor](docs/screenshots/student-mentor.png) `student-mentor.png` | The AI mentor. | Guidance without doing the work for the student. |

### Act VI — Reviewers, employers, partners

| Screen | What you're seeing | Why it matters |
|---|---|---|
| ![Queue](docs/screenshots/lecturer-queue.png) `lecturer-queue.png` | The lecturer's review queue. | Scarce, credentialed reviewers. |
| ![Review](docs/screenshots/lecturer-review.png) `lecturer-review.png` | The 4-dimension rubric with enforced comment depth. | Verification has a defensible standard. |
| ![Talent](docs/screenshots/employer-talent-search.png) `employer-talent-search.png` | Employer search across verified students by skill/tier. | The credential closes the loop into hiring. |
| ![NGO](docs/screenshots/ngo-dashboard.png) `ngo-dashboard.png` | NGO view of sponsored cooperatives. | Ecosystem partners, modelled as first-class roles. |

### Act VII — Administration & analytics

| Screen | What you're seeing | Why it matters |
|---|---|---|
| ![Admin](docs/screenshots/admin-dashboard.png) `admin-dashboard.png` | The admin command centre. | One operator runs verification, escrow, and disputes. |
| ![Verification](docs/screenshots/admin-verification-queue.png) `admin-verification-queue.png` | Farmer/buyer verification queue. | The human gate behind every trust signal. |
| ![Payouts](docs/screenshots/admin-payouts.png) `admin-payouts.png` | The payout queue (explicit administrative settlement). | No automated disbursement — settlement is a decision. |
| ![Mediation](docs/screenshots/admin-mediation.png) `admin-mediation.png` | Dispute mediation with refund/release authority. | Buyer protection has teeth. |
| ![Analytics](docs/screenshots/admin-impact-summary.png) `admin-impact-summary.png` | Platform impact analytics (cron-aggregated). | The whole ecosystem at a glance. |

### Responsive

`mobile-marketplace.png` (390 px) demonstrates the responsive layout. The app and website ship in **light** today; the token system is built to add dark/accessibility themes without re-authoring components (see [UI/UX Design](#-uiux-design)).

---

## ✨ Features

### 🌾 Food Security Hub

| Feature | What it does | Who uses it |
|---|---|---|
| **Verified marketplace** | Farmers list produce; buyers browse with full-text search; listings carry the farmer's trust tier. Ranking is by trust — **no paid placement**. | Farmers, Buyers |
| **Escrow-protected orders** | M-Pesa STK Push → funds **held** by the platform → released to the farmer only on confirmed receipt. Atomic inventory reservation with rollback on payment failure. | Farmers, Buyers, Admin |
| **Farmer trust scores** | A 0–100 composite (Verification 40 / Transaction 25 / Rating 20 / Reliability 15) → tier NEW → ESTABLISHED → TRUSTED → PREMIUM. 100% derived. | Farmers, Buyers |
| **Price intelligence** | Crop prices benchmarked vs. Nairobi wholesale; a **Platform Premium** shows the farmer's gain over the middleman; price alerts. | Farmers |
| **AI farm assistant** | Groq-powered, grounded in the farmer's county, crops, livestock, and a live 7-day weather forecast. | Farmers |
| **Knowledge hub** | Admin-curated, source-attributed articles (KALRO/FAO/KEBS) on inputs, calendars, animal health, storage. | All |
| **Group purchasing** | Farmers form buying groups; verified suppliers post offers; each member pays via their **own** M-Pesa (no one holds group funds). | Farmers, Suppliers |
| **Verified suppliers** | A directory of KEBS/PCPB-registered input suppliers, admin-verified. | Farmers, Buyers |

### 🎓 Education Hub

| Feature | What it does | Who uses it |
|---|---|---|
| **Project engagements** | A student generates a brief (AI Kenyan-industry scenario **or** an open-source contribution), builds it, and submits structured process docs. | Students |
| **Process documentation** | Required **Problem Breakdown**, **Approach Plan**, **Final Reflection**, plus a blocker log and an AI-usage log — each hashed on receipt. | Students |
| **Peer review** | A *different* student reviews across 2 dimensions (code quality, documentation clarity). | Students |
| **Lecturer review** | An **admin-verified** lecturer reviews against a 4-dimension rubric (problem understanding, solution quality, process quality, AI usage) with enforced minimum comment depth. | Lecturers |
| **Verified portfolios** | On approval, a permanent signed record: a **public URL** + structured data an employer can query without logging in. Verified projects, verified skills, reviewer institutions. | Students, Employers |
| **Employer discovery** | Search verified students by skill and tier; viewing a portfolio records a `PortfolioView` and notifies the student. | Employers |
| **AI mentor** | A Groq-powered mentor that guides without doing the work; disclosed and logged. | Students |
| **Lecturer effectiveness** | Aggregates of each lecturer's review volume, decisions, and scoring. | Admin, Institutions |

### 🛡️ Trust & verification infrastructure

| Feature | What it does |
|---|---|
| **Identity verification** | Document upload + admin review for farmers, buyers, lecturers, and suppliers. |
| **Composite trust score** | Recomputed from source records by `recalculate()` — never stored as a bare number a human can set. |
| **Append-only audit trail** | `VerificationAuditLog` accepts only inserts; every verification carries document hashes and the reviewer's identity. |
| **Tamper evidence** | Submitted documents are SHA-256 hashed server-side on receipt and recorded immutably. |

### ⚖️ Administration

| Feature | What it does |
|---|---|
| **Verification management** | Queues for farmer, buyer, lecturer, and supplier verification with full audit logging. |
| **Escrow & payout management** | A platform escrow ledger and an explicit payout-approval queue (no automated B2C disbursement). |
| **Dispute mediation** | Open/in-review/resolved mediations with refund or release authority. |
| **Knowledge & brief curation** | Manage knowledge articles and the AI brief context library. |
| **Payment lab** | A sandbox to drive the payment simulator through every outcome. |
| **Impact analytics** | Cron-aggregated platform metrics across both hubs. |

### 🔔 Cross-cutting

- **Persisted notifications** — a real notification center (8 types: order, escrow, verification, payout, review, portfolio-view, group, system) with read/unread state.
- **Semantic design-token system** — one `primitive → semantic → component` token vocabulary that themes are *value-maps* over; ships light today, architected for dark/high-contrast/large-text; reduced-motion aware; colour-blind-safe state colours.
- **Ecosystem simulation engine** — generate months of internally consistent, fully reversible demo activity (`seed:demo` / `seed:reset` / `seed:rebuild` / `seed:validate`).

---

## 👥 User roles

UmojaHub has **8 roles**, each with a role-data sub-document on `User`, RBAC-guarded dashboards, and distinct workflows.

| Role | Purpose | Key capabilities | Primary screens |
|---|---|---|---|
| **Farmer** | Sell produce, build reputation. | Create listings, fulfil orders, request payouts, view trust score & prices, use the AI assistant, join groups. | `/dashboard/farmer/*` |
| **Buyer** | Source produce safely. | Browse marketplace, pay via M-Pesa, confirm receipt, raise disputes, browse verified suppliers. | `/dashboard/buyer/*`, `/marketplace` |
| **Student** | Turn real work into a credential. | Generate briefs, submit process docs, peer-review, build a public portfolio, use the AI mentor. | `/dashboard/student/*` |
| **Lecturer** | Verify student work. | Review a queue against a 4-dimension rubric, issue VERIFIED/REVISION/DENIED decisions. | `/dashboard/lecturer/*` |
| **Employer** | Discover verified talent. | Search students by skill/tier, view portfolios (recorded + notified). | `/dashboard/employer/*` |
| **NGO** | Sponsor cooperatives. | View sponsored farmer groups and their counties/focus areas. | `/dashboard/ngo` |
| **Institution** | Host students & lecturers. | View affiliated members and outcomes. | `/dashboard/institution` |
| **Admin** | Operate the platform. | Verification, escrow settlement, payouts, mediation, knowledge, analytics. | `/dashboard/admin/*` |

> **Cooperatives** are modelled as `FarmerGroup`s (optionally `sponsoredByNgoId`), not a login role — a group is composed of farmer members with a founder.

Access control is enforced in `src/middleware.ts` (guards `/dashboard/*` and `/api/admin/*`) and at every API route via `requireRole(session, ...allowedRoles)`.

---

## 🗺️ User journeys

### Farmer — from signup to a growing reputation

```mermaid
flowchart LR
  R[Register] --> O[Onboard: role + identity]
  O --> V[Upload docs → Admin verifies]
  V --> L[Create listing]
  L --> ORD[Receive order + M-Pesa payment]
  ORD --> ESC[Funds HELD in escrow]
  ESC --> DISP[Confirm dispatch]
  DISP --> REC[Buyer confirms receipt]
  REC --> REL[Funds RELEASABLE]
  REL --> PAY[Request payout → Admin settles]
  REC --> RATE[Buyer rating]
  RATE --> TRUST[recalculate trust score ↑]
  TRUST --> L
```

### Buyer — confidence, then protection

```mermaid
flowchart LR
  B[Browse marketplace] --> EVAL[Evaluate farmer trust tier]
  EVAL --> BUY[Order + M-Pesa STK Push]
  BUY --> HELD[Money HELD in escrow]
  HELD --> WAIT[Farmer dispatches]
  WAIT --> CONF[Confirm receipt]
  CONF --> DONE[Order COMPLETED → funds release]
  HELD -. problem .-> DISPUTE[Raise mediation]
  DISPUTE --> ADMIN[Admin resolves: refund or release]
```

### Student — from a brief to a verified credential

```mermaid
flowchart LR
  REG[Register / GitHub auth] --> BR[Generate brief]
  BR --> BUILD[Build + submit 3 process docs]
  BUILD --> HASH[Docs hashed on receipt]
  HASH --> PEER[Peer review · 2 dimensions]
  PEER --> LEC[Lecturer review · 4 dimensions]
  LEC -->|approved| VER[VERIFIED → public portfolio + JSON]
  LEC -->|revision| BUILD
  LEC -->|denied| END[Recorded, not certified]
  VER --> EMP[Employer discovers + views]
```

---

## 🏗️ Architecture

UmojaHub is a single Next.js 15 App-Router application: server-rendered pages and API route handlers in one deployment, MongoDB Atlas for persistence, and a provider-abstracted payments layer.

```mermaid
flowchart TB
  subgraph Client["Client (React 19)"]
    WEB["Public website<br/>(light theme)"]
    APP["Role dashboards<br/>(multi-theme app)"]
  end

  subgraph Edge["Next.js 15 — App Router"]
    MW["middleware.ts<br/>RBAC route guard"]
    PAGES["Server components / pages"]
    API["81 API route handlers<br/>connectDB → session → requireRole → Zod → DB"]
  end

  subgraph Domain["Domain services (src/lib)"]
    TRUST["Trust engine<br/>recalculate()"]
    ESCROW["Escrow<br/>computeEscrowBalance()"]
    PAY["Payments dispatcher<br/>simulation | daraja"]
    NOTIFY["Notifications<br/>notify()"]
    EDU["Education pipeline"]
  end

  subgraph External["Integrations"]
    MPESA["Daraja / M-Pesa"]
    GROQ["Groq (assistant + mentor)"]
    OPENAI["OpenAI (briefs + moderation)"]
    CLOUD["Cloudinary"]
    COMMS["Email · SMS · Weather"]
  end

  DB[("MongoDB Atlas<br/>37 Mongoose models")]

  WEB & APP --> MW --> PAGES --> API
  API --> TRUST & ESCROW & PAY & NOTIFY & EDU
  TRUST & ESCROW & EDU --> DB
  PAY --> MPESA
  EDU --> OPENAI
  APP --> GROQ
  API --> CLOUD & COMMS
  NOTIFY --> DB

  subgraph Cron["Scheduled jobs (Bearer CRON_SECRET)"]
    C1["impact-summary · hourly"]
    C2["market-insight · weekly"]
    C3["price-alert-check"]
    C4["cleanup-sessions · weekly-jobs"]
  end
  Cron --> DB
```

### The non-negotiable API pattern

Every one of the 81 route handlers follows the same sequence — there are no exceptions:

```
connectDB() → getServerSession(authOptions) → requireRole(session, …) → schema.safeParse(input) → DB operation
```

Errors flow through `AppError` + `handleApiError`. Environment access goes through a type-safe `env()` that throws at startup if any required variable is missing. Mongoose models are **lazy-imported inside async functions** and the connection is cached in a module-level singleton to survive serverless cold starts.

### Design principles baked into the code

- **Derived, never stored** — trust and escrow balances are computed from source records on read, so a dashboard total always reconciles with the orders/ratings/events beneath it.
- **Single source of truth for money** — `processStkCallback()` is the only writer of the `PAID` transition and the only place an `EscrowEventLog HELD` is written.
- **Append-only where it matters** — the verification audit log rejects everything but inserts, at both the application and (intended) collection-validator level.
- **Additive evolution** — the NGO/Employer/Institution roles, notifications, and public portfolios were added without touching existing platform logic.

---

## 🗃️ Database design

37 Mongoose models, every one with its indexes declared in-schema. The core relationships:

```mermaid
erDiagram
  USER ||--o{ MARKETPLACE_LISTING : "lists (farmer)"
  USER ||--o{ ORDER : "places (buyer)"
  USER ||--|| FARMER_TRUST_SCORE : "derives"
  MARKETPLACE_LISTING ||--o{ ORDER : "fulfils"
  ORDER ||--o{ ESCROW_EVENT_LOG : "emits"
  ORDER ||--o{ RATING : "receives"
  ORDER ||--o{ MEDIATION_REQUEST : "may dispute"
  USER ||--o{ WITHDRAWAL_REQUEST : "requests payout"
  ORDER ||--o{ PRICE_HISTORY : "feeds"

  USER ||--o{ PROJECT_ENGAGEMENT : "owns (student)"
  PROJECT_ENGAGEMENT ||--|| PEER_REVIEW : "gets"
  PROJECT_ENGAGEMENT ||--|| LECTURER_REVIEW : "gets"
  PROJECT_ENGAGEMENT ||--o{ VERIFICATION_AUDIT_LOG : "records"
  USER ||--|| STUDENT_PORTFOLIO_STATUS : "builds"
  STUDENT_PORTFOLIO_STATUS ||--o{ PORTFOLIO_VIEW : "viewed by employer"
  USER ||--o{ LECTURER_EFFECTIVENESS : "aggregates"

  INSTITUTION ||--o{ USER : "hosts"
  NGO_ORGANIZATION ||--o{ FARMER_GROUP : "sponsors"
  FARMER_GROUP ||--o{ USER : "has members"
  USER ||--o{ NOTIFICATION : "receives"
  SIMULATION_RUN ||--o{ USER : "tracks (demo only)"
```

**Model groups**

- **Identity & access** — `User` (8 role sub-documents), `OnboardingDraft`, `PasswordResetToken`, `Counter`.
- **Marketplace & escrow** — `MarketplaceListing`, `Order`, `EscrowEventLog`, `Rating`, `WithdrawalRequest`, `MediationRequest`, `PriceHistory`, `PriceAlert`, `MarketInsight`, `VerifiedSupplier`, `FarmerGroup`, `GroupOrder`, `GroupJoinToken`.
- **Trust** — `FarmerTrustScore`, `VerificationAuditLog`, `AdminAuditLog`.
- **Education** — `ProjectEngagement`, `PeerReview`, `LecturerReview`, `LecturerEffectiveness`, `StudentPortfolioStatus`, `PortfolioView`, `BriefContextLibrary`.
- **Payments** — `SimulatedPayment`, `PaymentEventLog`.
- **Knowledge & AI** — `KnowledgeArticle`, `ChatSession`, `MentorSession`.
- **Ecosystem & ops** — `Institution`, `NgoOrganization`, `Notification`, `PlatformImpactSummary`, `SimulationRun`.

---

## 🛡️ The trust system

Trust is UmojaHub's signature feature. **A farmer's score is never set by a human** — it is recomputed from source records by `recalculate(farmerId)` in `src/lib/trust/farmerTrustCalculator.ts`.

### Composition (0–100)

```mermaid
flowchart LR
  V["Verification<br/>40 pts<br/>(verified identity)"] --> S(("Composite<br/>Score"))
  T["Transaction<br/>25 pts<br/>(orders ×0.5 ≤12 +<br/>volume/50k ≤13)"] --> S
  R["Rating<br/>20 pts<br/>(1★=4 … 5★=20)"] --> S
  REL["Reliability<br/>15 pts<br/>(on-time ≤24h −<br/>dispute penalties)"] --> S
  S --> TIER{Tier}
  TIER -->|≥80| P[PREMIUM]
  TIER -->|≥60| TR[TRUSTED]
  TIER -->|≥40| E[ESTABLISHED]
  TIER -->|<40| N[NEW]
```

| Component | Max | Source of truth |
|---|---:|---|
| **Verification** | 40 | `farmerData.verificationStatus === APPROVED` |
| **Transaction** | 25 | Completed orders (×0.5, cap 12) + total volume (÷50,000, cap 13) |
| **Rating** | 20 | Average buyer rating, linear (1.0★ → 4 pts, 5.0★ → 20 pts) |
| **Reliability** | 15 | On-time dispatch confirmation rate (≤24 h) minus dispute penalties |

Because every input is a real record, a lecturer or recruiter can **click from the score into the orders, ratings, and disputes that produced it**. New farmers are given the benefit of the doubt on reliability until they have paid orders.

### Verification & audit integrity

- Identity documents are uploaded and reviewed by an admin; the decision is recorded with **document hashes** and the reviewer's identity in an **append-only** `VerificationAuditLog`.
- For students, the same idea produces the credential: every submitted process document is **SHA-256 hashed on receipt**, and the verification record names the **reviewing lecturer, their title, and their institution**.

---

## ⚖️ The escrow system

### Why it exists

The most significant trust failure the architecture identifies is **farmer non-dispatch after payment**: the buyer has paid, but the produce never ships. The platform's answer is financial, not just reputational — **hold the buyer's money until fulfilment is real.**

In production, M-Pesa settles to the **platform's paybill shortcode**, not the farmer. The farmer is paid out later by an **explicit administrative decision** — there is no automated B2C disbursement. That makes the platform the custodian, which is exactly what makes escrow possible.

### Escrow is derived, not stored

There is no wallet field. `computeEscrowBalance(farmerId)` in `src/lib/foodhub/escrow.ts` derives a farmer's balance from the source collections on every read:

| Field | Meaning |
|---|---|
| `grossReceivedKES` | Σ of all `PAID` orders = held + releasable |
| `heldKES` | Paid but **not yet** confirmed received (in fulfilment) |
| `inDisputeKES` | Held funds blocked by an open mediation |
| `releasableKES` | Buyer-confirmed (COMPLETED) — eligible to settle |
| `committedPayoutsKES` | Σ of REQUESTED/APPROVED/PAID withdrawal requests |
| `availableKES` | `max(0, releasable − committed)` |

### Lifecycle

```mermaid
stateDiagram-v2
  [*] --> NO_FUNDS: order created
  NO_FUNDS --> HELD: M-Pesa PAID (processStkCallback → EscrowEventLog HELD)
  HELD --> HELD_DISPATCHED: farmer confirms dispatch
  HELD_DISPATCHED --> RELEASABLE: buyer confirms receipt (COMPLETED → RELEASED)
  HELD --> HELD_UNDER_REVIEW: buyer opens mediation
  HELD_DISPATCHED --> HELD_UNDER_REVIEW: buyer opens mediation
  HELD_UNDER_REVIEW --> RELEASABLE: admin resolves for farmer
  HELD_UNDER_REVIEW --> REFUNDED: admin refunds buyer (REFUND_ISSUED)
  RELEASABLE --> [*]: payout requested + admin settles
  REFUNDED --> [*]: funds returned, inventory restored
```

Every transition writes a backdated-safe `EscrowEventLog` row (`HELD` / `RELEASED` / `REFUND_ISSUED`) with an `occurredAt` timestamp. **The release gate is fulfilment (`COMPLETED`), never mere payment (`PAID`)** — that single condition is what makes it escrow rather than a payment log.

### Protections

- **Buyer**: money is held until they confirm receipt; an unhappy buyer opens a mediation that blocks release until an admin rules.
- **Farmer**: a confirmed-received order produces releasable funds they can request a payout against; reliability and disputes feed back into their trust score.
- **Platform**: every settlement is an explicit, audited admin action.

---

## 🔐 Authentication

NextAuth v4 with a JWT session strategy, configured in `src/lib/auth/options.ts`.

```mermaid
flowchart LR
  subgraph Entry
    G[Google OAuth]
    GH[GitHub OAuth]
    C[Username + password]
  end
  G & GH & C --> NA[NextAuth v4 JWT]
  PRE[Pre-auth onboarding<br/>draft] -. reconciles on .-> NA
  NA --> JWT[JWT claims:<br/>id · role · onboardingStage ·<br/>isOnboarded · isVerified]
  JWT --> MW[middleware RBAC]
  MW --> DASH[Role dashboard]
```

- **Three providers** — Google, GitHub (natural for students), and credentials (username + password).
- **Progressive, pre-auth onboarding** — users pick a role and provide details *before* authenticating; the draft reconciles onto the account on first OAuth sign-in.
- **Security** — password reset with tokenised links, and brute-force throttling/lockout on credential login.
- **RBAC everywhere** — middleware guards `/dashboard/*` and `/api/admin/*`; routes re-check with `requireRole`. Role and verification state ride in the JWT so guards are cheap.

---

## 🎨 UI/UX design

UmojaHub runs **two presentation layers in one build**, each scoped by a CSS class: the public **website** (`.theme-website`, light "Documentation Stream") and the role-dashboard **application** (`.theme-app`, a warm light canvas).

- **Token architecture** — three tiers (`primitive` → `semantic` → `component`). Components consume only the **semantic** tier (`bg`, `surface`, `fg`, `brand`, `state/*`, `border`), so a theme is a *re-mapping of values* applied via a single class scope — not a code fork. A subtree can flip themes cleanly.
- **Shipped today** — both surfaces are **light**. The token system is built so additional themes are *values, not forks*.
- **Designed-for (roadmap, specified in `webapp-reset/`)** — dark, **high-contrast** (AA→AAA), and **large-text** modes, with system-preference detection (`prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-motion`). The architecture exists; the additional value-maps are part of the gated redesign, not yet enabled in the UI.
- **Accessibility** — colour-blind safety is treated as a constraint on *every* theme: state colours (success/warning/danger/verified) stay distinguishable without hue, backed by redundant **icon + shape + text** encoding. No pure black/white; depth comes from surface steps and borders.
- **Motion & illustration** — a research-backed motion strategy (GSAP) and an illustration system; both respect reduced-motion.
- **Typography** — **Hanken Grotesk** for UI, **Spline Sans Mono** (tabular numerals) for figures and money (KSh) so amounts align and read as data.

> The application presentation layer is under a deliberate, research-first, **gated redesign** (Figma is the source of truth). The dashboards shipped today are coherent, inspectable surfaces on the app's design primitives; platform logic is untouched by that effort.

---

## 🧰 Tech stack

Technologies are chosen for a specific reason, not for novelty.

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router), React 19 | One deployment for SSR pages + API; server components keep the client lean on 3G. |
| **Language** | TypeScript 5 (strict, zero `any`) | Correctness is enforced in CI, not hoped for. |
| **Database** | MongoDB Atlas + Mongoose 9 | Flexible documents fit role sub-documents and evolving education records; replica set enables atomic operations. |
| **Auth** | NextAuth v4 (JWT) | Mature OAuth + credentials with stateless, serverless-friendly sessions. |
| **Validation** | Zod 4 (`safeParse` on every route) | One schema = runtime validation + static types; 95% coverage gate on validation. |
| **Payments** | Provider abstraction (`simulation` default · `daraja`/M-Pesa) | Swap real M-Pesa for a deterministic simulator with **no code changes**. |
| **AI** | Groq (farm assistant + mentor) · OpenAI (brief generation + moderation) | Groq for fast grounded chat; OpenAI for scenario generation. |
| **Styling** | Tailwind CSS 3 + semantic design tokens | Utility speed with a disciplined, themeable token layer. |
| **Data viz** | Recharts | Trust, price, and impact charts. |
| **Motion / 3D** | GSAP · React Three Fiber | Research-backed motion; 3D accents on the website. |
| **State** | Zustand | Minimal client state where server state isn't enough. |
| **Media / comms** | Cloudinary · Resend/Nodemailer · Africa's Talking · OpenWeatherMap | Images, email, SMS, and weather grounding for the assistant. |
| **Testing** | Jest + Testing Library · Playwright | 719 unit/integration tests + e2e capability. |
| **CI/CD** | GitHub Actions → Vercel | type-check · lint · test · build on every PR; deploy on merge to `main`. |

---

## 📊 Project statistics

All figures are measured from the repository, not estimated.

| Metric | Value |
|---|---:|
| User roles | **8** |
| Database models (Mongoose) | **37** |
| Domain enums | **41** |
| API route handlers | **81** |
| Application pages | **58** |
| React components | **60** |
| Domain library modules (`src/lib`) | **102** |
| Zod validation schema domains | **11** |
| Integration services | **8** |
| Scheduled cron jobs | **5** |
| Test suites / tests | **66 / 719** |
| Lines of TypeScript/TSX (`src`) | **~48,600** |

---

## 🎬 Demonstration guide

> Built for a lecturer or judge who clicks around and inspects deeply. The fastest way to a convincing demo is to populate a believable ecosystem first.

### One-time setup

```bash
npm run db:seed      # canonical accounts (farmer, buyer, student, lecturer, admin)
npm run seed:demo    # months of internally consistent activity (~1,150 records)
npm run dev          # http://localhost:3000
```

### Recommended path (~12–15 minutes)

| # | Show | Account | Why it lands |
|---|---|---|---|
| 1 | **Public marketplace + a listing** | (none) | Trust badges are visible before any login. |
| 2 | **A farmer's trust profile** | `wanjiku.kamau@gmail.com` | The score breaks into four explainable parts. |
| 3 | **The farmer's escrow ledger** | same | Held vs. releasable vs. available — money with a story. |
| 4 | **A buyer's orders** | `kamau.githinji@gmail.com` | Escrow + payment status, buyer's-eye view. |
| 5 | **Admin escrow + mediation + payouts** | `umojahub16@gmail.com` | The platform is *operated*, not assumed. |
| 6 | **A public verified portfolio** | (none) | The student credential, queryable by anyone. |
| 7 | **Lecturer review rubric** | `g.ndungu@uonbi.ac.ke` | Verification has a defensible standard. |
| 8 | **Employer talent search** | (seed:demo employer) | The credential closes the loop into hiring. |
| 9 | **Admin impact analytics** | `umojahub16@gmail.com` | The whole ecosystem, cron-aggregated. |

### Talking points

- *"No number here is hand-set."* Trust and escrow are **derived** — open any farmer and the score reconciles with the orders beneath it.
- *"The credential is tamper-evident."* Documents are hashed on receipt; the audit log is append-only; the reviewer is named.
- *"It's reversible."* `npm run seed:reset` removes exactly the demo records and nothing else — real users are never in the ledger.

When you're done: `npm run seed:reset` (clean up) or `npm run seed:rebuild` (a fresh, different ecosystem).

---

## ⚙️ Installation

### Prerequisites

- **Node.js 20+**
- **MongoDB Atlas** cluster (M0 free tier is fine for development)

### Setup

```bash
git clone https://github.com/JafarHussein/umoja-hub.git
cd umoja-hub
npm install
cp .env.local.example .env.local   # then populate it
npm run dev                        # http://localhost:3000
```

### Environment variables

Every required variable is validated at startup by `src/lib/env.ts` (the app **throws** if any is missing). Set: `MONGODB_URI`, `NEXTAUTH_SECRET`/`NEXTAUTH_URL`, `GROQ_API_KEY`, `OPENAI_API_KEY`, GitHub App keys, the `MPESA_*` set (sandbox shortcode `174379`), `SENDGRID_*`, `AFRICASTALKING_*`, `OPEN_WEATHER_MAP_API_KEY`, `CLOUDINARY_*`, and `CRON_SECRET`. Never commit `.env.local`.

### Data commands

```bash
npm run db:seed        # baseline accounts + listings + knowledge
npm run seed:demo      # generate a full simulated ecosystem (tracked + reversible)
npm run seed:validate  # assert the ecosystem is internally consistent (16 checks)
npm run seed:reset     # delete exactly the latest demo run's records
npm run seed:rebuild   # reset + regenerate a fresh, different ecosystem
```

### Troubleshooting

| Symptom | Fix |
|---|---|
| App throws on startup | A required env var is missing — check `src/lib/env.ts`. |
| `MONGODB_URI` not in example file | Add it manually (it's required but omitted from the example header). |
| Escrow/trust look empty | Run `npm run seed:demo`. |
| Demo data piling up | `npm run seed:reset` (or `seed:rebuild`). |
| Payments in dev | `PAYMENT_PROVIDER=simulation` (default) — never use production M-Pesa keys in dev. |

---

## 🧪 Testing

```bash
npm run type-check     # tsc --noEmit (strict, zero any)
npm run lint           # ESLint
npm run test           # Jest — 66 suites, 719 tests
npm run test:coverage  # coverage gates (validation 95%, trust 90%)
npm run test:e2e       # Playwright
npm run seed:validate  # runtime invariant checks on a seeded ecosystem
```

**Coverage focus.** Validation schemas (`src/lib/validation/`, 95%) and the trust engine (`src/lib/trust/`, 90%) carry the highest gates — the two places where a bug is most expensive. Critical workflows under test include order/escrow state transitions, payment simulation, trust calculation, all Zod schemas, RBAC middleware, and the education review pipeline. Beyond unit tests, `seed:validate` runs 16 cross-record invariant checks (no impossible states, escrow reconciliation, trust tier-vs-score bands) against a generated ecosystem.

---

## 🛣️ Future roadmap

Realistic next steps, in rough priority order:

- **Live M-Pesa go-live** — flip the payment provider from `simulation` to `daraja` (the abstraction already supports it) once the paybill and B2C payout path are provisioned.
- **Authed visual QA in CI** — automate the per-role dashboard screenshots (the capture script exists) as a visual-regression gate.
- **Hi-fi app design** — complete the gated, Figma-led redesign of the dashboard presentation layer.
- **Notification delivery channels** — extend the persisted notification center with email/SMS fan-out using the existing services.
- **Richer employer tooling** — saved searches and shortlists over verified portfolios.
- **Institution analytics** — cohort-level outcome dashboards for partner universities.

---

## 📚 Lessons learned

- **Derive, don't store.** Making trust and escrow computed-on-read (not stored balances) eliminated a whole class of drift bugs — a dashboard total can never disagree with the records beneath it.
- **One condition makes escrow escrow.** ~80% of the escrow system already existed; the missing 20% was gating release on *fulfilment* rather than *payment*. Naming the invariant precisely was most of the work.
- **A credential's value is its provenance.** The Education Hub is convincing because every claim links back to a hashed document and a named reviewer — verification is about *traceability*, not certifying the absence of AI.
- **Simulate the ecosystem, don't seed rows.** Generating months of internally consistent activity that passes the same invariants as production data is what makes a demo believable — and tracking every created record made it perfectly reversible.
- **Additive evolution scales.** New roles, notifications, and public portfolios were added without touching auth, payments, or trust — strict boundaries (lazy model imports, one API pattern, derived state) made large additions low-risk.
- **The build must stay green across two surfaces.** Shipping a public website and an app under redesign in one deployment forced disciplined token architecture and a non-negotiable CI gate.

---

## 🙏 Credits

**Author** — [Jafar Hussein](https://github.com/JafarHussein)

**Built with** — Next.js · React · TypeScript · MongoDB & Mongoose · NextAuth · Zod · Tailwind CSS · Recharts · GSAP · React Three Fiber · Groq · OpenAI · Safaricom Daraja (M-Pesa) · Cloudinary · Africa's Talking · OpenWeatherMap · Jest · Playwright · Vercel.

**Knowledge sources referenced in the Knowledge Hub** — KALRO, FAO Kenya, KEBS, Kenya Veterinary Board, Kenya Markets Trust.

**Engineering assistance** — built with [Claude Code](https://claude.com/claude-code).

---

<p align="center">
  <strong>Built in Kenya. Designed to scale across East Africa.</strong><br/>
  <em>Trust you can click into.</em>
</p>
