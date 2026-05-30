<p align="center">
  <img src="public/images/logo.png" alt="UmojaHub Logo" width="180" />
</p>

<h1 align="center">UmojaHub</h1>

<p align="center">
  <strong>Infrastructure for Food Security and Technical Talent in Kenya</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#modules">Modules</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#project-structure">Project Structure</a> ·
  <a href="#api-integrations">API Integrations</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-38BDF8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel" alt="Vercel" />
</p>

---

## Overview

UmojaHub is a dual-module, production-grade web platform built to address two deeply connected challenges facing communities in Kenya and across East Africa: **food insecurity** and the **gap between student education and real-world technical experience**.

The platform is architected to feel like serious infrastructure — not a student project. Every design and engineering decision prioritises trust, reliability, and performance on low-bandwidth connections common among Kenyan farmers and students.

> **"Build infrastructure that communities can trust, not technology for technology's sake."**

---

## Modules

### Module 1 — Food Security Hub

A comprehensive farmer empowerment platform addressing five specific, documented harms experienced by Kenyan smallholder farmers: fertilizer fraud, veterinary scams, price exploitation, post-harvest loss, and lack of market intelligence.

| Area | Description |
|---|---|
| **Marketplace** | Verified, direct-to-buyer marketplace with M-Pesa STK Push checkout, order lifecycle tracking, and a trust-scored farmer directory. |
| **Knowledge Hub** | Admin-curated, source-attributed articles covering input verification, animal health, seasonal calendars, and post-harvest storage — all traceable to trusted institutions (KALRO, FAO, KEBS). |
| **Farm Assistant** | Personalised AI chatbot powered by Groq (Llama 3). Contextualised by the farmer's county, crops, livestock, and a live 7-day weather forecast. Covers input verification Q&A, animal health guidance, and harvest timing. |
| **Price Intelligence** | Real-time and historical crop price comparisons against wholesale market benchmarks (Wakulima, Kongowea, City Market Nairobi). Platform Premium calculation shows farmers exactly what UmojaHub achieves versus traditional channels. |
| **Group Tools** | Collective input purchasing through verified supplier connections. Group formation, member opt-in, and individual M-Pesa collection — no single farmer handles group funds. |

### Module 2 — Education Hub

A verification infrastructure layer for software project work by East African students. Not a learning management system, not a bootcamp, and not a grading system. Its function is narrow and specific: to produce an auditable, institutionally-reviewed record that a given student built a given project, understood what they built, and had that assessment confirmed by a credentialed academic reviewer.

The output is a permanent, publicly verifiable record that employers can query directly. Every design decision protects the integrity of that record.

| Area | Description |
|---|---|
| **Project Tracks** | Two tracks: **Build & Deploy** (student designs, builds, and deploys an original project addressing a Kenya-context brief) and **AI Brief** (AI-generated brief from a curated Kenyan industry scenario library). Both tracks enforce structured Git workflow, document submission, and a live deployment requirement at Intermediate and Advanced tiers. |
| **Kenya Context Brief Library** | Admin-maintained library of Kenyan industry scenarios — M-Pesa integrations, USSD tools, SACCO systems, agricultural platforms, community health, Huduma services. Every brief reflects real Kenyan operational constraints: mobile-first, low-bandwidth, MPESA-enabled, low digital literacy. |
| **Process Documentation** | Three required documents per project: Problem Breakdown, Approach Plan, and Final Reflection. Minimum word counts scale with tier (200 / 350 / 500 words). An optional Blocker Log records genuine development obstacles and resolutions — its presence is positively weighted in the review rubric but is never a submission gate. |
| **Skills Passport** | Verified, evidence-linked project records. Each entry shows the tier, track, verification date, reviewer name, and reviewer institution. No self-reporting — every entry requires a completed lecturer review cycle. |
| **Peer Review** | Structured two-dimension peer review (Code Quality + Documentation Clarity) assigned to an eligible peer student. Eligibility requires at least one verified project at the same or higher tier. Reviews are assigned automatically and expire after seven days — engagements proceed to lecturer review regardless of peer review outcome. |
| **AI Mentor** | Socratic AI mentor (Groq / Llama 3) scoped to the student's live project brief, constraints, and submitted documents. Does not generate code. Guides through questions, explanations, and documentation prompts. Session context is maintained for 90 days per engagement. |
| **Lecturer Verification** | Human judgment gate with a structured four-dimension rubric. Lecturers must be admin-approved before they can review — approval requires verified institutional affiliation. The rubric assesses Problem Understanding, Solution Quality, Process Discipline, and Problem Ownership. Minimum comment word counts are enforced server-side per tier. A maximum of two revision cycles is permitted before an engagement is locked for admin review. |
| **Employer Verification** | Every verified project receives a permanent public URL and a structured JSON endpoint. Both are login-free and display the reviewer's full name, title, and verified institution. |

---

## Tech Stack

### Frontend

| Technology | Role |
|---|---|
| **Next.js 15** (App Router) | Framework. SSR-first for performance on 3G/4G connections. Eliminates a separate backend server for the MVP. |
| **TypeScript** (strict mode) | Mandatory across the full codebase. Enforces type safety for complex multi-role schemas and analytical models. |
| **Tailwind CSS** | Mobile-first, utility-first styling with tightly controlled spacing and hierarchy. |
| **Inter** | Base typeface. Neutral, legible, and professional — avoids the "friendly NGO" aesthetic. |
| **JetBrains Mono** | Monospace font used for technical identifiers (M-Pesa references, GitHub IDs, project verification codes). |
| **Lucide React** | Clean, functional iconography consistent with a professional tool aesthetic. |
| **Recharts** | Lightweight charting for price trend visualisations. |

### Design System

- **Background:** Near-black (`#0D1117` / `#111827`)
- **Primary Accent:** Deep green (`#007F4E`), used sparingly
- **Typography Scale:** 12 / 14 / 16 / 20 / 24 / 32px (strict six-point scale)
- **Contrast:** WCAG AA minimum (4.5:1) across all surfaces
- **Touch Targets:** 44×44px minimum on all interactive elements

### Backend & Database

| Technology | Role |
|---|---|
| **Next.js API Routes** | All backend logic. One codebase, one deployment pipeline for MVP. |
| **MongoDB Atlas** (Mongoose ODM) | Primary database. Replica set required for multi-document transactions (verification issuance). M0 free tier for development, M10+ for production. |
| **NextAuth.js** | Credentials-based authentication with role-embedded JWT sessions. Five roles: Farmer, Buyer, Student, Lecturer, Admin. |
| **Redis** (Upstash) | Distributed locks for concurrent operation safety (reviewer claim, brief generation, verification issuance), rate limiting, and pre-computed queue depth counters. |
| **Zod** | Input validation schemas across all API routes. |

### Data Architecture

The database is structured across three layers:

1. **Event Layer** — Append-only records: `VerificationAuditLog`, `AdminActionLog`, `GitHubSnapshot`, `EngagementDocument` (all versions retained), `PriceHistory`, raw order and review submissions.
2. **Score Layer** — Trigger-based recalculation: `FarmerTrustScore`, `StudentPortfolioStatus`, `LecturerEffectiveness`.
3. **Insight Layer** — Scheduled pre-computed aggregations for instant dashboard rendering: `MarketInsight`, `PlatformImpactSummary`.

The `VerificationAuditLog` and `AdminActionLog` collections are protected by a MongoDB collection-level validator that rejects all write operations except `insertOne`. Application code enforces the same constraint independently. Per-record SHA-256 hashes enable tamper detection without requiring blockchain infrastructure.

---

## API Integrations

| Service | Purpose | Notes |
|---|---|---|
| **Safaricom Daraja v2** | M-Pesa STK Push checkout for all marketplace transactions and group order collections. | Sandbox for development. Idempotency check mandatory on webhook handler. |
| **Groq API (Llama 3)** | Powers both the Farm Assistant (Food Security Hub) and the AI Mentor (Education Hub) via the same client but entirely different system prompts. | Free tier. |
| **OpenAI GPT-4o** | AI brief generation for the AI Brief track (Education Hub) and content moderation for knowledge articles. | Enforced via `response_format` API parameter. |
| **GitHub OAuth** | Student identity binding for the Education Hub. Verifies repository ownership and commit authorship at brief generation and project submission. Each student's personal OAuth token is used for snapshot capture — not a shared application token. | Required before brief generation. Account age gate enforced. |
| **OpenWeatherMap** | 7-day county-level weather forecasts injected into Farm Assistant context and displayed on the farmer dashboard. | Free tier. |
| **Cloudinary** | All image upload, transformation (WebP), and CDN delivery. Non-negotiable for bandwidth performance. | |
| **Resend** | Transactional emails — verification status updates, order confirmations, lecturer SLA reminders, peer review notifications. | |
| **Africa's Talking** | SMS notifications to farmers — order confirmed, verification status, price alerts, group order deadlines. | Preferred over Twilio for Kenyan network routing and cost. |
| **Kenya Markets Trust / KNBS** | Weekly ingestion of public wholesale market price data for the Price Intelligence benchmark. | |
| **OpenStreetMap (Leaflet.js)** | Geocoding and map display for farmer pickup locations in the buyer discovery experience. | |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas account with a replica set cluster (M10 or higher for production; M0 with replica set enabled for development)
- An Upstash Redis account (free tier sufficient for development)
- API keys for the external services listed above

### Installation

```bash
git clone https://github.com/your-org/umoja-hub.git
cd umoja-hub
npm install
```

### Environment Configuration

Copy the example environment file and populate each value:

```bash
cp .env.local.example .env.local
```

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/umojahub

# Authentication
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Redis
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# AI Services
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key

# GitHub OAuth (Education Hub — student identity binding)
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Verification Signing
VERIFICATION_SIGNING_KEY=your_32_byte_random_hex_string

# M-Pesa (Daraja)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.vercel.app/api/webhooks/mpesa

# Communications
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@umojahub.co.ke
AFRICASTALKING_API_KEY=your_at_key
AFRICASTALKING_USERNAME=your_at_username

# Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Weather
OPEN_WEATHER_MAP_API_KEY=your_owm_key

# Cron
CRON_SECRET=your_cron_secret
```

> `VERIFICATION_SIGNING_KEY` must be a cryptographically random value of at least 32 bytes. Generate with `openssl rand -hex 32`. This key signs the HMAC on all public verification JSON responses. Never rotate without a migration plan — existing signatures must be recomputed on key change.

> `MPESA_SHORTCODE` must be `174379` in all non-production environments. Never use a production shortcode in development.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
/umoja-hub
├── public/
│   └── images/                  # Static brand assets (logo, favicon)
├── scripts/
│   └── seed.ts                  # Database seed script (tsx scripts/seed.ts)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # NextAuth.js route handler
│   │   │   ├── farmers/         # Farmer registration, listings, verification
│   │   │   ├── buyers/          # Buyer registration, order creation
│   │   │   ├── knowledge/       # Knowledge Hub article CRUD
│   │   │   ├── assistant/       # Farm Assistant (Groq) endpoint
│   │   │   ├── prices/          # Price Intelligence + alerts
│   │   │   ├── groups/          # Farmer groups + group buying orders
│   │   │   ├── suppliers/       # Verified supplier directory
│   │   │   ├── education/       # Briefs, engagements, documents, peer review, queue
│   │   │   ├── mentor/          # AI Mentor session management (Groq)
│   │   │   ├── portfolio/       # Public student portfolio pages (ISR)
│   │   │   ├── verify/          # Public verification JSON endpoint (live, no cache)
│   │   │   ├── webhooks/        # M-Pesa Daraja callback handler
│   │   │   ├── cron/            # Scheduled jobs (SLA monitoring, abandonment, TTL)
│   │   │   └── admin/           # Admin queues: farmer verification, lecturer approval,
│   │   │                        # escalation management, platform health
│   │   ├── dashboard/
│   │   │   ├── farmer/          # Listings, orders, assistant, prices, group
│   │   │   ├── student/         # Engagements, documents, mentor, portfolio, peer reviews
│   │   │   ├── lecturer/        # Review queue, claimed reviews, effectiveness metrics
│   │   │   └── admin/           # Verification queues, escalation queue, platform health
│   │   ├── knowledge/           # Public Knowledge Hub pages
│   │   ├── marketplace/         # Public marketplace browsing
│   │   ├── portfolio/           # Public student portfolio pages
│   │   └── experience/          # Public per-project verification pages
│   ├── components/
│   │   ├── ui/                  # Atomic components (Button, Card, Badge)
│   │   ├── shared/              # Header, Sidebar, LayoutWrapper
│   │   ├── foodhub/             # Food Security Hub components
│   │   └── educationhub/        # Education Hub components
│   ├── lib/
│   │   ├── db.ts                # MongoDB connection manager (pooled singleton)
│   │   ├── models/              # Mongoose model definitions (one per collection)
│   │   ├── validation/          # Zod validation schemas
│   │   ├── services/
│   │   │   ├── education/
│   │   │   │   ├── engagementTransitionService.ts  # All engagement state transitions
│   │   │   │   ├── verificationIssuanceService.ts  # Atomic 5-write verification transaction
│   │   │   │   ├── peerReviewAssignmentService.ts  # Eligibility check + assignment
│   │   │   │   ├── githubSnapshotService.ts        # Capture + authorship analysis
│   │   │   │   └── briefGenerationService.ts       # Brief selection + generation
│   │   │   └── signing/
│   │   │       └── verificationSigningService.ts   # HMAC, payload hash, doc hash
│   │   ├── audit/
│   │   │   └── auditLogService.ts   # Append-only write pathway for audit collections
│   │   ├── integrations/
│   │   │   ├── groqService.ts       # Farm Assistant + AI Mentor (shared client)
│   │   │   ├── openaiService.ts     # GPT-4o brief generation + moderation
│   │   │   ├── githubService.ts     # OAuth token retrieval, snapshot capture
│   │   │   ├── darajaService.ts     # M-Pesa STK Push + webhook verification
│   │   │   ├── redisService.ts      # Distributed locks, rate limiting, counters
│   │   │   ├── notificationService.ts  # Resend email + Africa's Talking SMS
│   │   │   ├── weatherService.ts
│   │   │   ├── cloudinaryService.ts
│   │   │   └── priceDataService.ts
│   │   ├── trust/
│   │   │   ├── farmerTrustCalculator.ts
│   │   │   └── portfolioTierer.ts
│   │   ├── auth/
│   │   │   └── options.ts       # NextAuth configuration
│   │   ├── env.ts               # Boot-time environment variable validation
│   │   └── utils.ts             # AppError, handleApiError, requireRole, logger
│   ├── hooks/
│   ├── styles/
│   └── types/
│       ├── index.ts             # Shared enums, constants, Kenyan counties
│       ├── education.ts         # Education Hub interfaces
│       └── foodhub.ts           # Food Security Hub interfaces
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Trust and Verification Architecture

UmojaHub's core value proposition is **verifiable trust** — for farmers, for employers, and for the platform itself.

### Food Security Hub — Farmer Trust Score

The `FarmerTrustScore` (0–100) is a composite metric derived from:
- Admin-reviewed identity verification (PENDING → APPROVED → REJECTED)
- Completed transaction volume
- Buyer ratings (1–5 scale with comments)
- Order responsiveness

This score directly governs marketplace search ranking. A Verified Farmer Badge is surface-level; the trust score is the operative signal.

### Education Hub — Verification Infrastructure

The Education Hub's integrity claim is narrow and specific:

> *"This UmojaHub verification record confirms that the named student submitted project documentation, deployed working software, and had their work assessed by a platform-verified academic reviewer using a defined rubric. The reviewer's identity and institutional affiliation are on record. All submitted documents have been cryptographically hashed and cannot be retroactively altered. This record is permanent."*

This claim rests on five mandatory pillars. If any pillar cannot be satisfied, the verification does not issue.

#### Pillar 1 — Student Identity
- Email address verified at registration
- GitHub OAuth account bound at brief generation time
- GitHub account age minimum: accounts under 7 days old are blocked; accounts under 30 days are flagged on the reviewer-facing submission view
- Repository ownership validated: the submitted repository must be owned by the OAuth-bound GitHub account
- Commit authorship validation: at least 60% of commits in the repository must be authored by the bound GitHub account's primary email. Below this threshold, a warning flag is visible to the reviewing lecturer.

#### Pillar 2 — Lecturer Legitimacy
- LECTURER accounts default to `PENDING_VERIFICATION` status at registration
- Activation requires admin approval of a `LecturerVerificationRequest` — a structured form capturing institutional affiliation, institutional email address, title, and supporting evidence (staff ID or faculty profile URL)
- Approved lecturers' names, titles, and institutions are displayed on all verification records and public portfolio pages
- A lecturer cannot review an engagement where their institutional affiliation matches the student's known institution (conflict of interest block)
- All approval and suspension actions are recorded in the append-only `AdminActionLog`

#### Pillar 3 — Proof of Authorship
- A `GitHubSnapshot` is captured server-side at submission time: commit count, last commit SHA, commit timeline hash, authorship percentage, account age at capture
- For Intermediate and Advanced tiers: a live deployment URL is required at submission. The platform performs an HTTP HEAD check before accepting the submission.
- Submitted document content is hashed (SHA-256) server-side immediately on receipt. These hashes are stored in the `VerificationAuditLog` and cannot be altered.
- Document content is never accepted pre-hashed from the client.

#### Pillar 4 — Review Governance
- Peer review is assigned from an eligible pool (reviewer must have at least one verified project at the same or higher tier). If no eligible reviewer is available after 7 days, the peer review is automatically waived and the waiver reason is recorded.
- Lecturer review uses a four-dimension rubric: **Problem Understanding**, **Solution Quality**, **Process Discipline**, and **Problem Ownership**. Minimum comment word counts are enforced server-side by tier (50 / 80 / 100 words per dimension).
- A maximum of two `REVISION_REQUIRED` decisions are permitted per engagement. A third revision attempt transitions the engagement to `LOCKED` and creates an admin escalation.
- Lecturers are capped at five concurrent active reviews to prevent overload and quality degradation.

#### Pillar 5 — Auditability
- Every verification decision writes an immutable record to `VerificationAuditLog`. This collection accepts only `insertOne` operations — enforced at both the application layer and the MongoDB collection validator.
- Every record is hashed on write. A nightly reconciliation job samples records and recomputes hashes, alerting on any mismatch.
- Every verified project has a permanent public verification URL and a structured JSON endpoint (`GET /api/verify/[code]`) signed with an HMAC for integrity.
- Withdrawn verifications remain permanently accessible — they return a `WITHDRAWN` status, not a 404. The original audit log entry is never modified.

#### What the Platform Does Not Claim
UmojaHub verification does not certify the absence of AI tools in the student's workflow. It does not constitute a formal academic qualification, degree, or professional certification. It does not guarantee job performance. It certifies a defined review process was conducted and that the process record is authentic and tamper-evident.

The four-dimension rubric's **Problem Ownership** dimension assesses whether the student demonstrates genuine intellectual investment in every aspect of the project — regardless of which tools they used. A student who used AI tools to assist with implementation but understands every decision they made, can explain every part of their code, and can articulate what failed and why, satisfies Problem Ownership. The rubric measures the outcome of understanding, not the method of construction.

---

## Deployment

UmojaHub is deployed on **Vercel** with **MongoDB Atlas** as the database.

- **Atlas Replica Set:** Required for multi-document transactions (verification issuance). A standalone Atlas instance is not sufficient for production.
- **Atlas Region:** Must match the Vercel deployment region to minimise round-trip latency. Vercel defaults to `eu-west-1` (Ireland) — Atlas cluster should be set to the same region.
- **Redis:** Upstash serverless Redis. Deploy in the same region as Vercel and Atlas.
- **Environment Variables:** All API keys and secrets are managed through Vercel environment variables only. Never committed to source control.
- **Image Delivery:** All user-uploaded assets route through Cloudinary immediately. No application-layer image storage.

### Infrastructure Requirements by Phase

| Phase | Application | Database | Notes |
|---|---|---|---|
| **Development** | Local / Vercel Preview | MongoDB Atlas M0 (replica set enabled) | Replica set required even in development for transaction support |
| **MVP / Pilot** | Vercel Hobby/Pro | MongoDB Atlas M10+, Upstash Redis free | M10 is the minimum Atlas tier with replica set and dedicated resources |
| **Early Growth** | Vercel Pro | MongoDB Atlas M10+, Upstash Redis paid | Upgrade Redis when daily commands exceed 50,000 |
| **Scale** | Vercel Pro | MongoDB Atlas M20+, Cloudflare CDN | Document content migration to object storage at this tier |

---

## Roadmap

### Completed — Food Security Hub

| Phase | Scope | Status |
|---|---|---|
| **Phase 1 — Core Infrastructure** | All 22 Mongoose models, TypeScript interfaces, Zod schemas | ✅ Complete |
| **Phase 2 — Authentication** | NextAuth v4, RBAC, 5-role JWT, seed script, integration tests | ✅ Complete |
| **Phase 3 — Food Hub Core** | Marketplace, M-Pesa STK Push, farmer trust score | ✅ Complete |
| **Phase 4 — Food Hub Extended** | Knowledge Hub, Farm Assistant, Price Intelligence, Groups, Suppliers | ✅ Complete |

---

### Education Hub — Implementation Sequence

#### Phase 0 — Prerequisites (Non-Technical)

These prerequisites must be completed before any Education Hub code is written. The Education Hub must not launch without them.

| Item | Owner | Hard Gate? |
|---|---|---|
| Recruit and confirm 20+ lecturers willing to review at launch | Business Development | Yes — no reviews without reviewers |
| Build controlled institution vocabulary (from CUE registered list) | Admin | Yes — lecturer approval gate depends on it |
| Enable MongoDB Atlas replica set on production cluster | Engineering | Yes — transactions required for verification issuance |
| Deploy Redis (Upstash) in same region as Vercel | Engineering | Yes — distributed locks required from day one |
| Register GitHub OAuth application | Engineering | Yes — GitHub binding is a trust pillar |
| Seed BriefContextLibrary with minimum 20 active contexts | Content / Admin | Yes — brief generation blocked below 20 active contexts |
| Generate and configure `VERIFICATION_SIGNING_KEY` | Engineering | Yes — HMAC signing required |
| Draft Terms of Service covering audit log permanence | Legal / Admin | Yes — students must consent before submitting |
| Begin CPD partnership conversation with Computer Society of Kenya | Business Development | No — but must start before launch |

#### Phase 1 — Foundation (Weeks 1–5)

| Week | Scope |
|---|---|
| **Week 1** | Prisma schema for all Education Hub models. MongoDB validators for `VerificationAuditLog` (collection-level, outside Prisma). TTL indexes for `MentorSession`. Seed `BriefContextLibrary`. Admin UI: `LecturerVerificationRequest` approval queue. Clerk/NextAuth webhook handler for user creation sync. |
| **Week 2** | GitHub OAuth binding flow. Account age gate enforcement. `POST /api/education/briefs` — brief generation with rate limiting and one-active-engagement constraint. Distributed lock for brief generation. |
| **Week 3** | `PATCH .../start` — repository URL binding and transition to `IN_PROGRESS`. `PUT .../documents/[type]` — document submission with server-side word count enforcement. Blocker log endpoints. Student dashboard: brief view, document submission UI. |
| **Week 4** | `GitHubSnapshotService` — capture, commit authorship computation, timeline analysis. Live demo URL validation (HTTP HEAD). `POST .../submit` — final submission endpoint. Peer review eligibility check. Peer review auto-assignment (async). `PEER_REVIEW_SKIPPED` waiver logic for Advanced tier. |
| **Week 5** | Peer review claim and submission endpoints. Peer review expiry cron (`UNDER_PEER_REVIEW → PEER_REVIEW_SKIPPED` on deadline). Automatic `UNDER_LECTURER_REVIEW` transition. SLA timestamp management. |

#### Phase 2 — Review Pipeline (Weeks 6–10)

| Week | Scope |
|---|---|
| **Week 6** | Lecturer queue endpoint with track and capacity filtering. Review claim with distributed lock and conflict of interest check. Reviewer load cap enforcement (Redis counter + DB count). Full engagement detail view for claimed reviewer. |
| **Week 7** | Lecturer review submission. Rubric version tracking. `REVISION_REQUIRED` pathway (revisionCount increment, notification). `DENIED` pathway. Revision limit enforcement → `LOCKED` transition. AdminEscalation creation for locked engagements. |
| **Week 8** | Verification issuance transaction (5-write atomic). `VerificationAuditLog` write with `entryHash` computation. `VerificationArtifact` creation with verification code generation and HMAC signature. `StudentPortfolioStatus` upsert. `LecturerEffectiveness` update. |
| **Week 9** | SLA monitoring cron (daily: detect `slaDeadlineAt` breaches, create `AdminEscalation`). Abandonment cron (daily: transition inactive engagements). Admin escalation queue and resolution endpoints. Engagement unlock pathway. |
| **Week 10** | AI Mentor — Groq session management and message endpoint. System prompt construction from engagement context. Message rate limiting. End-to-end test: brief → submit → peer review → lecturer review → `VERIFIED` → artifact issued. |

#### Phase 3 — Trust Surface (Weeks 11–14)

| Week | Scope |
|---|---|
| **Week 11** | Public verification page (`/experience/verify/[code]`) — SSR, no cache. JSON verification endpoint (`GET /api/verify/[code]`) — rate limited, HMAC-signed response. Withdrawn verification handling. |
| **Week 12** | Public portfolio page (`/portfolio/[studentId]`) — ISR, 5-minute revalidation. `PortfolioVisibility` model and student control endpoints. JSON-LD structured data. |
| **Week 13** | Admin platform health dashboard: queue depth, average time-to-verification, SLA breach rate, brief completion rate. Reviewer quality monitoring cron (fast submissions, duplicate comments, score outliers). `SUSPICIOUS_REVIEWER` escalation. |
| **Week 14** | Email notifications (all student and lecturer events). SLA reminder emails (24h, 48h before deadline). Final security review: rate limit testing, enumeration resistance, privilege escalation checks. Production deployment readiness. |

---

### Post-MVP — Phase 2 Features

These features are deferred until the MVP has demonstrated operational stability and reviewer pool growth.

| Feature | Trigger |
|---|---|
| Institution as first-class entity (Institution model, institution admin role) | 5+ universities actively using the platform |
| Digital certificate issuance (PDF + web, QR code) | 500+ verified projects |
| Cohort system (monthly intake windows, cohort peer matching) | 50+ active engagements per month |
| Intelligent reviewer routing (track matching, load balancing, institution diversity) | 30+ active lecturers in the pool |
| Cross-submission document similarity detection | 500+ submissions in the corpus |
| On-demand ISR revalidation for portfolio pages | Employer complaints about stale portfolios |
| Commit timeline visualisation on portfolio pages | Phase 2 general availability |
| LecturerEffectiveness calibration sessions | 10+ active lecturers, stable review volume |
| Grade export (CSV, KNQA-compatible format) | Formal institutional agreement in place |
| CPD credit integration (Computer Society of Kenya) | Partnership agreement signed |

---

## Success Metrics (MVP Pilot)

| Area | Target |
|---|---|
| Marketplace | 20 completed transactions recorded in PriceHistory |
| Knowledge Hub | 20 articles published across verified content categories |
| Farm Assistant | 100 completed conversations; repeat usage within 7 days |
| Price Intelligence | Data available for top 10 crops across 5 counties |
| Group Tools | 3 completed group buying orders from verified suppliers |
| Education Hub — Reviewer Pool | 20 admin-approved lecturers active at launch |
| Education Hub — Engagements | 30 student projects submitted for review in the first month |
| Education Hub — Verifications | 15 projects verified within the first two months |
| Education Hub — Review SLA | 80% of submitted projects reviewed within 7 days |
| Platform Trust | Zero documented verification fraud instances in MVP pilot cohort |
| Platform Adoption | 30 active farmers + 30 active students over a 3-month pilot |

---

## Contributing

Contributions are welcome. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide before opening a pull request.

- Branch from `develop`: use the format `feature/scope-description`, `fix/issue-description`, `chore/description`, or `test/description`.
- All commits must follow the format `type(scope): description` (max 72 chars, present tense). Types: `feat fix chore docs style refactor test perf`.
- TypeScript strict mode must be maintained — no `any` types.
- All API routes require Zod validation on inputs.
- New Mongoose models must define indexes on all frequently queried fields.
- Run `npm run type-check && npm run lint && npm run test` before opening a pull request.
- PRs target `develop`. CI must pass before merge. Do not open PRs directly to `main`.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built for Kenya. Designed to scale across East Africa.
</p>
