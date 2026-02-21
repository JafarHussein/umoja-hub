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

The platform is architected to feel like serious infrastructure — not a student project. Every design and engineering decision prioritizes trust, reliability, and performance on low-bandwidth connections common among Kenyan farmers and students.

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

### Module 2 — Education Hub (Experience Engine)

A hands-on experience platform for computer science students. Not a learning management system — a credential engine. Students are matched with real open-source projects or AI-generated Kenyan-context briefs, complete structured professional documentation, and earn a publicly verifiable portfolio that employers can trust.

| Area | Description |
|---|---|
| **Project Tracks** | Two tracks: GitHub open-source matching (via Octokit) and AI-generated Kenyan context project briefs (via GPT-4o). Both enforce structured Git workflow and five mandatory process documents. |
| **Kenya Context Brief Library** | Admin-editable library of Kenyan industry scenarios (M-Pesa integrations, USSD, SACCO tools, agricultural platforms, community health). Every AI-generated brief reflects a real Kenyan constraint — 2G, mobile-first, offline-capable, low digital literacy. |
| **Skills Passport** | Verified, evidence-linked skill records extracted from lecturer-approved projects. No self-reporting. Each skill entry shows the tier, date first verified, and the project that produced it. |
| **Peer Review** | Structured two-dimension peer review (Code Quality + Documentation Clarity) required from the second project onward. Automated routing ensures reviewers are at equal or higher tier. |
| **AI Mentor** | Socratic AI mentor (Groq / Llama 3) aware of the student's live project brief, constraints, and process documentation. Never writes code. Guides through questions, explanations, and documentation pointers. Every interaction is automatically appended to the student's AI Usage Log. |
| **Lecturer Verification** | Human judgment gate with a structured four-dimension rubric and mandatory minimum comment length per score. Generates a public, login-free verification URL — the student's primary employer credential. |

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
| **MongoDB Atlas** (Mongoose ODM) | Primary database from day one — M0 free tier for MVP, M10+ for production. No file-based database phase. |
| **NextAuth.js** | Credentials-based authentication with role-embedded JWT sessions. Five roles: Farmer, Buyer, Student, Lecturer, Admin. |
| **Zod** | Input validation schemas across all API routes. |

### Data Architecture

The database is structured across three layers:

1. **Event Layer** — Append-only records: `PriceHistory`, raw order and review submissions.
2. **Score Layer** — Trigger-based recalculation via Mongoose post-save middleware: `FarmerTrustScore`, `StudentPortfolioStatus`, `LecturerEffectiveness`.
3. **Insight Layer** — Scheduled pre-computed aggregations for instant dashboard rendering: `MarketInsight`, `PlatformImpactSummary`.

---

## API Integrations

| Service | Purpose | Notes |
|---|---|---|
| **Safaricom Daraja v2** | M-Pesa STK Push checkout for all marketplace transactions and group order collections. | Sandbox for MVP. Idempotency check mandatory on webhook handler. |
| **Groq API (Llama 3)** | Powers both the Farm Assistant (Food Security Hub) and the AI Mentor (Education Hub) via the same client but entirely different system prompts. | Free tier. |
| **OpenAI GPT-4o** | Structured JSON project brief generation (Education Hub) and content moderation. | Enforced via `response_format` API parameter. |
| **GitHub API (Octokit)** | Repository discovery and filtering for the open-source project matching track. | Authenticated GitHub App token. 5,000 req/hr limit. Results cached. |
| **OpenWeatherMap** | 7-day county-level weather forecasts injected into Farm Assistant context and displayed on the farmer dashboard. | Free tier. |
| **Cloudinary** | All image upload, transformation (WebP), and CDN delivery. Non-negotiable for bandwidth performance. | |
| **SendGrid** | Transactional emails — verification status, order confirmations, lecturer notifications. | Free tier for MVP. |
| **Africa's Talking** | SMS notifications to farmers — order confirmed, verification status, price alerts, group order deadlines. | Preferred over Twilio for Kenyan network routing and cost. |
| **Kenya Markets Trust / KNBS** | Weekly ingestion of public wholesale market price data for the Price Intelligence benchmark. | |
| **OpenStreetMap (Leaflet.js)** | Geocoding and map display for farmer pickup locations in the buyer discovery experience. | |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas account (M0 free tier is sufficient)
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

# AI Services
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key

# GitHub
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY=your_private_key

# M-Pesa (Daraja)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

# Communications
SENDGRID_API_KEY=your_sendgrid_key
AFRICASTALKING_API_KEY=your_at_key
AFRICASTALKING_USERNAME=your_at_username

# Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Weather
OPENWEATHERMAP_API_KEY=your_owm_key
```

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
│   │   │   ├── education/       # Briefs, mentor, projects, peer review, portfolio
│   │   │   ├── webhooks/        # M-Pesa Daraja callback handler
│   │   │   └── admin/           # Admin verification workflows
│   │   ├── dashboard/
│   │   │   ├── farmer/          # Listings, orders, assistant, prices, group
│   │   │   ├── student/         # Profile, projects, mentor, portfolio, peer reviews
│   │   │   ├── lecturer/        # Pending project reviews
│   │   │   └── admin/           # Verification queues, Knowledge Hub CMS
│   │   ├── knowledge/           # Public Knowledge Hub pages
│   │   ├── marketplace/         # Public marketplace browsing
│   │   └── experience/          # Public portfolio + per-project verification URLs
│   ├── components/
│   │   ├── ui/                  # Atomic components (Button, Card, Badge)
│   │   ├── shared/              # Header, Sidebar, LayoutWrapper
│   │   ├── foodhub/             # Food Security Hub components
│   │   └── educationhub/        # Education Hub components
│   ├── data/
│   │   ├── foodhub/             # Specialized data model definitions
│   │   ├── educationhub/        # Education Hub data model definitions
│   │   └── shared/              # User, Order, ProjectEngagement, AuditLog
│   ├── lib/
│   │   ├── db.ts                # MongoDB connection manager (pooled)
│   │   ├── models/              # Mongoose model definitions (one per collection)
│   │   ├── validation/          # Zod validation schemas
│   │   ├── integrations/        # External API adapters
│   │   │   ├── groqService.ts   # Farm Assistant + AI Mentor (shared client)
│   │   │   ├── openaiService.ts # GPT-4o brief generation + moderation
│   │   │   ├── githubService.ts # Octokit repository discovery
│   │   │   ├── darajaService.ts # M-Pesa STK Push + webhook verification
│   │   │   ├── weatherService.ts
│   │   │   ├── smsService.ts
│   │   │   ├── cloudinaryService.ts
│   │   │   └── priceDataService.ts
│   │   ├── trust/
│   │   │   ├── farmerTrustCalculator.ts
│   │   │   └── portfolioTierer.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── styles/
│   └── types/
├── .env.local
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

### Education Hub — Verification Integrity
Student portfolio verification rests on four pillars:

1. **Cryptographic Proof of Authorship** — GitHub OAuth identity binding with commit history verified against server-side document timestamps.
2. **Lecturer Sign-Off** — Human judgment gate with a four-dimension rubric. Minimum comment length per score dimension prevents rubber-stamping. Rejection is a valid and expected outcome.
3. **Immutable Audit Trail** — `VerificationAuditLog` records every state change including SHA-256 hashes of submitted documents and GitHub commit timelines.
4. **Public Verification URL** — `umojahub.co.ke/experience/verify/[projectId]` — accessible without login. The primary credential for employers.

The **Verified Project Badge** is intentionally rare. The lecturer review process is the mechanism for maintaining its value.

---

## Deployment

UmojaHub is deployed on **Vercel** with **MongoDB Atlas** as the database.

- **Atlas Region:** Must match the Vercel deployment region to minimise round-trip latency. Vercel defaults to `eu-west-1` (Ireland) — Atlas cluster should be set to the same region.
- **Environment Variables:** All API keys and secrets are managed through Vercel environment variables only. Never committed to source control.
- **Image Delivery:** All user-uploaded assets route through Cloudinary immediately. No application-layer image storage.

### Phase Progression

| Phase | Application | Database |
|---|---|---|
| **MVP / Pilot** | Vercel Free | MongoDB Atlas M0 (512MB) |
| **Early Growth** | Vercel Pro | MongoDB Atlas M10+ |
| **Scale** | Vercel Pro / Railway | MongoDB Atlas M10+, Cloudflare CDN |

---

## Roadmap

### MVP (Weeks 1–16)

| Milestone | Scope |
|---|---|
| **M1 — Foundation** (Weeks 1–3) | Next.js scaffolding, TypeScript strict mode, MongoDB Atlas + Mongoose, all collection schemas, NextAuth with 5 roles, design system. |
| **M2 — Food Hub Core** (Weeks 4–7) | Farmer verification, listing CRUD, buyer browsing and filtering, M-Pesa sandbox checkout, order lifecycle, buyer ratings, dispute flag. |
| **M3 — Food Hub Extended** (Weeks 8–10) | Knowledge Hub CMS, Farm Assistant (Groq + weather context), Price Intelligence dashboard. |
| **M4 — Education Hub** (Weeks 11–14) | Student profiling, GitHub matching, AI brief generation with Kenya context library, process documentation, AI Mentor (Socratic), peer review, Skills Passport, lecturer review. |
| **M5 — Integration & Polish** (Weeks 15–16) | Public employer portfolio page, admin dashboard, full visual polish, seed data, demonstration script. |

### Phase 2 (Post-MVP)
- Price alert SMS automation
- Group order M-Pesa split payment automation
- Dispute resolution automation and M-Pesa reversal
- LecturerEffectiveness scoring and anomaly flagging
- Multi-student team projects with role assignment
- Verification audit log cryptographic hashing
- Weekly automated external price data ingestion
- Farmer ratings of buyers
- Peer review quality scoring
- Institutional lecturer onboarding with invite links

---

## Success Metrics (MVP Pilot)

| Area | Target |
|---|---|
| Marketplace | 20 completed transactions recorded in PriceHistory |
| Knowledge Hub | 20 articles published across verified content categories |
| Farm Assistant | 100 completed conversations; repeat usage within 7 days |
| Price Intelligence | Data available for top 10 crops across 5 counties |
| Group Tools | 3 completed group buying orders from verified suppliers |
| Education Hub | 5 student projects reviewed and verified by a lecturer |
| Platform Trust | Zero documented fraud instances in MVP pilot cohort |
| Adoption | 30 active farmers + 30 active students over a 3-month pilot |

---

## Contributing

Contributions are welcome. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide before opening a pull request.

- Branch from `main`, using the format `feature/your-feature-name` or `fix/issue-description`.
- All commits must be atomic and descriptive.
- TypeScript strict mode must be maintained — no `any` types.
- All API routes require Zod validation on inputs.
- New Mongoose models must define indexes on all frequently queried fields.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built for Kenya. Designed to scale across East Africa.
</p>
