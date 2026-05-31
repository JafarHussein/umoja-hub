<p align="center">
  <img src="public/images/logo.png" alt="UmojaHub" width="160" />
</p>

<h1 align="center">UmojaHub</h1>

<p align="center">
  <strong>Agricultural marketplace and talent verification infrastructure for East Africa.</strong>
</p>

<p align="center">
  <a href="https://github.com/JafarHussein/umoja-hub/actions/workflows/ci.yml">
    <img src="https://github.com/JafarHussein/umoja-hub/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
  <a href="https://github.com/JafarHussein/umoja-hub/actions/workflows/deploy.yml">
    <img src="https://github.com/JafarHussein/umoja-hub/actions/workflows/deploy.yml/badge.svg" alt="Deploy" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/deployed-Vercel-000000?logo=vercel" alt="Vercel" />
</p>

---

UmojaHub is two products sharing one codebase and one conviction: **Kenyan farmers and Kenyan software developers are both underserved by the infrastructure available to them today.**

The Food Security Hub gives smallholder farmers a verified marketplace, real-time price intelligence, and an AI farming assistant — all accessible on 3G with M-Pesa checkout. The Education Hub gives software students a structured project verification pipeline that produces a tamper-evident, employer-queryable credential — reviewed and signed by a credentialed academic.

Neither product is a directory. Neither is a learning app. Both are **infrastructure**.

---

## What's inside

### Food Security Hub

Kenyan smallholder farmers lose margin to middlemen, get defrauded on inputs, and have no reliable price benchmarks. UmojaHub addresses this directly.

**Verified marketplace.** Farmers list produce, buyers purchase with M-Pesa STK Push, and the platform tracks the full order lifecycle from payment through collection. Each farmer has a composite trust score derived from verified identity, completed orders, and buyer ratings. Score drives ranking — no paid placement.

**Price intelligence.** Real-time crop prices benchmarked against Wakulima, Kongowea, and City Market Nairobi wholesale rates. A "Platform Premium" calculation shows farmers exactly what they gained versus the traditional channel.

**AI farm assistant.** A Groq-powered assistant contextualised with the farmer's county, crops, livestock, and a live 7-day weather forecast. Covers input verification, animal health, harvest timing. Available in plain language — no agriculture degree required.

**Knowledge hub.** Admin-curated articles on input verification, seasonal calendars, animal health, and storage. Every article carries a source attribution to a trusted institution (KALRO, FAO, KEBS). No anonymous advice.

**Group purchasing.** Farmers form buying groups. Verified suppliers post offers. Each member pays via their own M-Pesa — no single farmer handles group funds.

---

### Education Hub

East African software students do real project work. Very little of it is verifiable by employers. Degrees exist. GitHub profiles exist. Neither is a verified record of what a specific student built and understood.

UmojaHub issues that record. It is narrow, specific, and hard to fake.

**How it works:**
1. A student generates a project brief — either an AI-generated Kenyan industry scenario or an open-source repository contribution
2. They build the project, submit three required process documents (Problem Breakdown, Approach Plan, Final Reflection), and log blockers and AI usage
3. A peer student reviews the submission across two dimensions
4. An admin-verified lecturer reviews the full submission against a four-dimension rubric with enforced minimum comment depth
5. If approved, UmojaHub issues a permanent, cryptographically signed verification record — a public URL and a structured JSON endpoint that any employer can query without logging in

Every submitted document is hashed server-side on receipt. The hash is stored in an append-only audit log that rejects all writes except `insertOne`. The reviewer's name, title, and institution are on the public record. The platform does not certify the absence of AI tools — it certifies that the student understood what they built.

---

## Tech stack

| Layer | Choices |
|---|---|
| **Framework** | Next.js 15 (App Router), React 19, TypeScript strict |
| **Database** | MongoDB Atlas + Mongoose 9 — replica set required for atomic verification transactions |
| **Auth** | NextAuth v4, JWT sessions, 5-role RBAC (FARMER, BUYER, STUDENT, LECTURER, ADMIN) |
| **Payments** | Safaricom Daraja v2 — M-Pesa STK Push with atomic inventory reservation and rollback |
| **AI** | Groq (Llama 3) for Farm Assistant and AI Mentor · OpenAI GPT-4o for brief generation |
| **Validation** | Zod v4 across all API routes — zero `any` types enforced in CI |
| **Comms** | Resend (email) · Africa's Talking (SMS) · Cloudinary (images) |
| **Observability** | Structured logger, append-only audit log with nightly hash reconciliation |
| **CI/CD** | GitHub Actions → Vercel production on every merge to `main` |

---

## Getting started

### Prerequisites

- Node.js 22+
- MongoDB Atlas cluster with replica set enabled (M0 free tier works for development)

### Install

```bash
git clone https://github.com/JafarHussein/umoja-hub.git
cd umoja-hub
npm install
cp .env.local.example .env.local
```

Populate `.env.local`. Every required variable is listed in the example file — the app will throw at startup if any are missing.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed the database

```bash
npm run db:seed
```

Creates demo accounts for all five roles, marketplace listings, and a seeded brief context library.

### Commands

```bash
npm run dev           # dev server on :3000
npm run build         # production build
npm run type-check    # tsc --noEmit
npm run lint          # ESLint
npm run test          # Jest
npm run test:coverage # Jest with coverage thresholds
```

---

## Architecture notes

**API pattern.** Every route follows the same sequence: `connectDB()` → `getServerSession()` → `requireRole()` → `safeParse()` → DB operation. No exceptions. `AppError` + `handleApiError` handle all error responses.

**Verification integrity.** The `VerificationAuditLog` collection is protected at the MongoDB collection validator level — only `insertOne` is accepted. Application code enforces the same constraint independently. Every record is hashed on write; a nightly cron recomputes and alerts on any mismatch.

**Inventory safety.** Marketplace orders use a compare-and-swap `findOneAndUpdate` with a `$gte` quantity filter. Stock is atomically decremented. If the STK Push fails, the order and stock reservation are rolled back together.

**Serverless cold starts.** All Mongoose models are lazy-imported inside `async` functions. The DB connection is cached in a module-level singleton (`global.mongooseCache`).

---

## Contributing

Branch from `main` using `feature/*`, `fix/*`, `chore/*`, or `test/*`. PRs target `main`. CI must pass before merge.

Commit format: `type(scope): description` — max 72 chars, present tense.

```bash
npm run type-check && npm run lint && npm run test
```

All three must be green before opening a PR. Zero `any` types. All API inputs validated with Zod.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  Built in Kenya. Designed to scale across East Africa.
</p>
