# UmojaHub — Architecture

> Modular Monolith · Next.js 15 App Router · MongoDB Atlas · Vercel

---

## System Overview

```mermaid
graph TB
    subgraph Client["Browser / Mobile"]
        UI[Next.js Pages & Components]
    end

    subgraph Vercel["Vercel Edge + Serverless"]
        AR[App Router]
        MW[Middleware — RBAC + Rate Limit]
        API[API Routes Layer]
    end

    subgraph External["External APIs"]
        AT[Africa's Talking SMS]
        SG[SendGrid Email]
        CL[Cloudinary CDN]
        MP[Safaricom Daraja M-Pesa]
        GR[Groq — Llama 3]
        OAI[OpenAI — Moderation + Briefs]
        GH[GitHub App API]
        OW[OpenWeatherMap]
    end

    subgraph Atlas["MongoDB Atlas"]
        DB[(umojahub-cluster)]
    end

    UI --> AR
    AR --> MW
    MW --> API
    API --> DB
    API --> AT
    API --> SG
    API --> CL
    API --> MP
    API --> GR
    API --> OAI
    API --> GH
    API --> OW
    MP -->|Daraja Webhook| API
```

---

## Module Architecture

```mermaid
graph LR
    subgraph App["Next.js 15 App Router"]
        direction TB
        subgraph FoodHub["Food Security Hub"]
            FM[Farmer Module]
            BM[Buyer Module]
            KH[Knowledge Hub]
            FA[Farm Assistant]
            PI[Price Intelligence]
            GT[Group Tools]
        end
        subgraph EduHub["Education Hub"]
            SM[Student Module]
            LM[Lecturer Module]
            AM[Admin Module]
            BR[Brief Generator]
            MT[AI Mentor]
            PR[Peer Review]
        end
        subgraph Shared["Shared Infrastructure"]
            AU[Auth — NextAuth v4]
            US[User Model]
            RL[Rate Limiter]
            MD[Content Moderation]
        end
    end
```

---

## Database Layer Architecture

UmojaHub uses a three-layer database architecture that separates concerns by data mutability:

```mermaid
graph TD
    subgraph EventLayer["Event Layer — Append-Only"]
        EV1[Order]
        EV2[Rating]
        EV3[PriceHistory]
        EV4[LecturerReview]
        EV5[PeerReview]
        EV6[ProcessArtifact]
        EV7[VerificationAuditLog]
    end

    subgraph ScoreLayer["Score Layer — Trigger-Recalculated"]
        SC1[FarmerTrustScore]
        SC2[StudentPortfolioStatus]
        SC3[ProjectEngagementMetrics]
        SC4[LecturerEffectiveness]
    end

    subgraph InsightLayer["Insight Layer — Cron-Only"]
        IN1[MarketInsight]
        IN2[PlatformImpactSummary]
    end

    EV1 -->|order COMPLETED trigger| SC1
    EV2 -->|new rating trigger| SC1
    EV4 -->|review submitted trigger| SC4
    EV5 -->|peer review trigger| SC2
    SC1 -->|weekly cron| IN2
    SC2 -->|weekly cron| IN2
    EV3 -->|weekly aggregation cron| IN1
```

### Layer Rules

| Layer | Write rule | Read rule |
|---|---|---|
| Event | Insert only — never update or delete | Any route |
| Score | Recalculated by triggers only — never on GET | Any route |
| Insight | Written by cron jobs only | Any route |

---

## Farmer Trust Score Model

```mermaid
graph LR
    V[Verification 40pts] --> CS[compositeScore 0–100]
    T[Transaction History 25pts] --> CS
    R[Buyer Ratings 20pts] --> CS
    RE[Reliability 15pts] --> CS
    CS --> T1[NEW: 0–29]
    CS --> T2[EMERGING: 30–49]
    CS --> T3[ESTABLISHED: 50–69]
    CS --> T4[TRUSTED: 70–89]
    CS --> T5[PREMIUM: 90–100]
```

Verification score caps at 40. No farmer reaches PREMIUM on verification alone — transaction history is required.

---

## Order Flow and Trigger Chain

```mermaid
sequenceDiagram
    participant Buyer
    participant API as /api/orders
    participant Daraja as Daraja STK Push
    participant Webhook as /api/webhooks/daraja
    participant DB as MongoDB

    Buyer->>API: POST /api/orders (quantity, phone)
    API->>DB: Create Order (PENDING_PAYMENT)
    API->>Daraja: STK Push request
    Daraja-->>API: CheckoutRequestID
    API-->>Buyer: 201 {orderId, checkoutRequestId}

    Daraja->>Webhook: Payment callback
    Webhook->>Webhook: Verify HMAC signature
    Webhook->>DB: Update Order → CONFIRMED
    Webhook->>DB: Insert PriceHistory (ORDER_COMPLETED)
    Webhook->>DB: Recalculate FarmerTrustScore
    Webhook->>DB: Check PriceAlerts
    Webhook->>Farmer: SMS notification
    Webhook-->>Daraja: 200 OK
```

---

## Authentication and RBAC

```mermaid
graph TD
    REQ[Incoming Request] --> SESSION{Session exists?}
    SESSION -->|No| UNAUTH[401 AUTH_UNAUTHORIZED]
    SESSION -->|Yes| ROLE{Role check}
    ROLE -->|Wrong role| FORBIDDEN[403 AUTH_FORBIDDEN]
    ROLE -->|Correct role| LOGIC[Business Logic]
    LOGIC --> RESP[Response]
```

Five roles: `FARMER` · `BUYER` · `STUDENT` · `LECTURER` · `ADMIN`

Every protected API route uses `requireRole(session, Role.X)` before any database call.

---

## Security Controls

| Control | Implementation |
|---|---|
| Rate limiting | In-memory IP-based, 10 req/IP/min on auth routes |
| Content moderation | OpenAI Moderation API on marketplace descriptions |
| Input validation | Zod at every API boundary |
| Password storage | bcrypt, 12 rounds, `select: false` on all queries |
| CSP | No `unsafe-eval`, no external script sources |
| Daraja webhook | HMAC-SHA256 signature verification |
| File uploads | MIME type + size validation before Cloudinary |

---

## Cron Jobs

| Job | Schedule | Action |
|---|---|---|
| `price-alert-check` | Daily | Check PriceAlerts vs latest MarketInsight |
| `market-insight` | Weekly (Mon 06:00 EAT) | Aggregate PriceHistory into MarketInsight |
| `impact-summary` | Weekly (Mon 06:30 EAT) | Compute PlatformImpactSummary singleton |
| `cleanup-sessions` | Daily | Delete expired NextAuth sessions |

Cron routes are protected by `CRON_SECRET` header validation. Vercel Hobby plan restricts to daily minimum — `price-alert-check` runs daily.

---

## Deployment Architecture

```mermaid
graph LR
    GH[GitHub main branch] -->|push| CI[GitHub Actions CI]
    CI -->|tests pass| VD[Vercel Deploy]
    VD --> PROD[Production umojahub.co.ke]
    VD --> ATLAS[MongoDB Atlas umojahub-cluster]
    PROD -->|Cloudinary CDN| IMGS[Image Delivery]
```

- **Next.js functions**: Deploy as Vercel Edge Functions (middleware) and Serverless Functions (API routes)
- **Static pages**: Marketplace and Knowledge Hub pre-rendered with ISR (revalidate: 3600)
- **Database**: MongoDB Atlas M0 (free) → M10+ for production
- **Sessions**: JWT stored in secure httpOnly cookie

---

## 22 Mongoose Models

```
User                    — All 5 roles; polymorphic farmerData/studentData
MarketplaceListing      — Crop listings with trust-score-aware ranking
Order                   — M-Pesa payment lifecycle
FarmerTrustScore        — Composite trust metric (Event Layer trigger)
PriceHistory            — Append-only price event log
PriceAlert              — User-defined price threshold alerts
Rating                  — Buyer → Farmer transaction ratings
FarmerGroup             — Collective buying group
GroupOrder              — Group-level procurement order
VerifiedSupplier        — KEBS/PCPB/KEPHIS registered input suppliers
KnowledgeArticle        — Admin-published, source-attributed articles
ChatSession             — Farm Assistant conversation history
MarketInsight           — Weekly aggregated price intelligence (cron)
PlatformImpactSummary   — Platform metrics singleton (cron)
ProjectEngagement       — Student project lifecycle
PeerReview              — Student-to-student code review
LecturerReview          — Four-dimension rubric verification
StudentPortfolioStatus  — Tier and skills passport (trigger-recalculated)
VerificationAuditLog    — Immutable project state audit trail
BriefContextLibrary     — Admin-editable Kenyan industry contexts (singleton)
MentorSession           — AI Mentor conversation history
LecturerEffectiveness   — Reviewer quality metrics (trigger-recalculated)
```
