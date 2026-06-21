# UmojaHub — Mermaid Diagram Pack

A presentation-ready set of diagrams. The README embeds the core ones inline; this file
is the full pack (plus extras) for slides, design docs, and onboarding. All render on
GitHub and in any Mermaid-aware viewer.

---

## 1. System context — the two hubs and the shared trust layer

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

## 2. Technical architecture

```mermaid
flowchart TB
  subgraph Client["Client (React 19)"]
    WEB["Public website (light)"]
    APP["Role dashboards (app theme)"]
  end
  subgraph Edge["Next.js 15 — App Router"]
    MW["middleware.ts — RBAC guard"]
    PAGES["Server components / pages"]
    API["81 API route handlers"]
  end
  subgraph Domain["Domain services (src/lib)"]
    TRUST["Trust — recalculate()"]
    ESCROW["Escrow — computeEscrowBalance()"]
    PAY["Payments dispatcher"]
    NOTIFY["Notifications — notify()"]
    EDU["Education pipeline"]
  end
  DB[("MongoDB Atlas — 37 models")]
  EXT["Integrations:<br/>M-Pesa · Groq · OpenAI ·<br/>Cloudinary · Email/SMS/Weather"]
  WEB & APP --> MW --> PAGES --> API
  API --> TRUST & ESCROW & PAY & NOTIFY & EDU
  TRUST & ESCROW & EDU & NOTIFY --> DB
  PAY --> EXT
  API --> EXT
```

## 3. Entity-relationship (core)

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
  USER ||--o{ PROJECT_ENGAGEMENT : "owns (student)"
  PROJECT_ENGAGEMENT ||--|| PEER_REVIEW : "gets"
  PROJECT_ENGAGEMENT ||--|| LECTURER_REVIEW : "gets"
  PROJECT_ENGAGEMENT ||--o{ VERIFICATION_AUDIT_LOG : "records"
  USER ||--|| STUDENT_PORTFOLIO_STATUS : "builds"
  STUDENT_PORTFOLIO_STATUS ||--o{ PORTFOLIO_VIEW : "viewed by employer"
  INSTITUTION ||--o{ USER : "hosts"
  NGO_ORGANIZATION ||--o{ FARMER_GROUP : "sponsors"
  USER ||--o{ NOTIFICATION : "receives"
```

## 4. Trust score composition

```mermaid
flowchart LR
  V["Verification — 40 pts"] --> S(("Composite 0–100"))
  T["Transaction — 25 pts"] --> S
  R["Rating — 20 pts"] --> S
  REL["Reliability — 15 pts"] --> S
  S --> TIER{Tier}
  TIER -->|≥80| P[PREMIUM]
  TIER -->|≥60| TR[TRUSTED]
  TIER -->|≥40| E[ESTABLISHED]
  TIER -->|<40| N[NEW]
```

## 5. Escrow lifecycle (state machine)

```mermaid
stateDiagram-v2
  [*] --> NO_FUNDS: order created
  NO_FUNDS --> HELD: M-Pesa PAID (EscrowEventLog HELD)
  HELD --> HELD_DISPATCHED: farmer confirms dispatch
  HELD_DISPATCHED --> RELEASABLE: buyer confirms receipt (RELEASED)
  HELD --> HELD_UNDER_REVIEW: buyer opens mediation
  HELD_DISPATCHED --> HELD_UNDER_REVIEW: buyer opens mediation
  HELD_UNDER_REVIEW --> RELEASABLE: admin resolves for farmer
  HELD_UNDER_REVIEW --> REFUNDED: admin refunds buyer (REFUND_ISSUED)
  RELEASABLE --> [*]: payout requested + admin settles
  REFUNDED --> [*]: funds returned, inventory restored
```

## 6. Project verification pipeline (sequence)

```mermaid
sequenceDiagram
  participant S as Student
  participant P as Platform
  participant PR as Peer (student)
  participant L as Lecturer (verified)
  participant E as Employer
  S->>P: Generate brief (AI scenario / open-source)
  S->>P: Submit Problem Breakdown · Approach Plan · Final Reflection
  P->>P: SHA-256 hash each document on receipt
  P->>PR: Assign peer review (2 dimensions)
  PR->>P: Submit peer scores + comments
  P->>L: Route to lecturer queue
  L->>P: 4-dimension rubric decision (enforced comment depth)
  alt VERIFIED
    P->>P: Write VerificationAuditLog (append-only) + publish portfolio
    E->>P: Discover + view portfolio (records PortfolioView + notifies S)
  else REVISION_REQUIRED
    P->>S: Return for revision
  else DENIED
    P->>P: Record decision (not certified)
  end
```

## 7. Order + escrow happy path (sequence)

```mermaid
sequenceDiagram
  participant B as Buyer
  participant P as Platform
  participant M as M-Pesa
  participant F as Farmer
  participant A as Admin
  B->>P: Place order (atomic stock reservation)
  P->>M: STK Push
  M-->>P: Callback → processStkCallback() = PAID
  P->>P: EscrowEventLog HELD
  F->>P: Confirm dispatch
  B->>P: Confirm receipt → order COMPLETED
  P->>P: EscrowEventLog RELEASED (funds releasable)
  F->>P: Request payout
  A->>P: Approve + settle (explicit decision)
  B->>F: Rating → recalculate() trust ↑
```

## 8. RBAC & request flow

```mermaid
flowchart LR
  REQ[Request] --> MW{middleware:<br/>/dashboard/* or<br/>/api/admin/*?}
  MW -->|session + role ok| ROUTE[API route handler]
  MW -->|no| REDIR[Redirect / 401]
  ROUTE --> CDB[connectDB]
  CDB --> SESS[getServerSession]
  SESS --> RR[requireRole — variadic allowed roles]
  RR --> ZOD[Zod safeParse]
  ZOD --> DBOP[DB operation]
  ZOD -->|invalid| ERR[AppError → handleApiError]
```

## 9. Roles overview

```mermaid
mindmap
  root((UmojaHub roles))
    Food Hub
      Farmer
      Buyer
      NGO
    Education Hub
      Student
      Lecturer
      Employer
      Institution
    Platform
      Admin
```
