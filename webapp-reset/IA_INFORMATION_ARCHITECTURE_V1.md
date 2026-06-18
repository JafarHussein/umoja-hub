# Information Architecture — Web App V1

**Gate: Information Architecture.** Status: **DRAFT — awaiting approval.** Governed by [UMOJAHUB_WEBAPP_FOUNDATION_V1.md](UMOJAHUB_WEBAPP_FOUNDATION_V1.md) (approved). **This is structure, not visuals** — no layout, colour, or type decisions here. Grounded in the *actual current routes* (`src/app/**`), re-organized to the Foundation's principles.

## 1. The two zones

1. **Pre-auth / entry zone** — login, onboarding wizard, and the public-but-app-themed browse surfaces. Goal: get the right person to the right place with minimal friction.
2. **The authenticated app** — a **role-adaptive shell**. One shell, five furnishings. The shell is identical in mechanics (so it's learnable); its *contents* are tuned per role (Foundation §8).

## 2. Global navigation model (role-adaptive shell)

- **Primary nav** = the role's core surfaces (the few things they do often). Per Foundation §8/§9, this is tuned per role and kept small.
- **Secondary nav** = account/verification status, settings, sign-out, help.
- **Persistent trust context** — the user's own verification/trust status is always visible in the shell (it's their identity on the platform).
- **Status-first** — pending actions, payment/verification state surface in the shell, not buried (Foundation §5).
- Mechanically stable across roles; never novelty navigation (Foundation §8).

## 3. Per-role IA (grounded in real routes)

### FARMER — producer (calm, low-density, low-bandwidth)
- **Home** — "what needs my attention": pending orders, payment status, trust/verification status.
- **Listings** (`/farmer/listings`) — create & manage produce. *Primary task; must be dead-simple.*
- **Orders** (`/farmer/orders`) — incoming orders, fulfillment.
- **Money** — **Ledger** (`/farmer/ledger`) + payouts: the farmer's #1 anxiety (did I get paid?). Surfaced prominently.
- **Prices** (`/farmer/prices`) — price intelligence.
- **Group orders** (`/farmer/group`) — cooperative participation.
- **Suppliers** (`/farmer/suppliers`).
- **Farm Assistant** (`/farmer/assistant`) — AI help.
- **Profile & verification** (`/farmer/profile`).

### BUYER — market (signal-rich browse, then few decisions)
- **Home** — active orders + their status.
- **Browse** (`/marketplace`) — verified listings; trust signals above the fold (deliverable 05).
- **Listing detail** (`/marketplace/[id]`) — evaluate the farmer (Trust Score + verification), then buy. Recourse visible *before* purchase.
- **Orders** (`/buyer/orders`, `/buyer/orders/[id]`) — history + payment/fulfillment status.
- **Suppliers** (`/buyer/suppliers`).
- **Profile**.

### STUDENT — workspace (serious tool, evidence-rich)
- **Home** (`/student`) — active project / next step.
- **Projects** (`/student/projects`, `/projects/new`, `/projects/[id]`) — the workspace: documents, AI-usage log, blockers, submission.
- **Portfolio** (`/student/portfolio`) — the showable, verified artifact.
- **Peer Review** (`/student/peer-review`, `/peer-review/[id]`) — review queue + submission.
- **Mentor** (`/student/mentor`) — AI mentor.
- **Profile**.

### LECTURER — verifier (evidence-first, fast, dense)
- **Home** (`/lecturer`) — routes to the queue / active review.
- **Review Queue** (`/lecturer/queue`) — pending engagements; clear SLA/priority.
- **Review workspace** (`/lecturer/reviews/[id]`) — student evidence first, rubric + forced justification, decision.
- **Profile** (credential status).

### ADMIN — governance (high-quality density, audit-first)
- **Overview** — triage + platform health (`/admin/impact-summary`).
- **Verification queues** — farmer (`/admin/verification-queue`, `/admin/farmer/[id]`), supplier (`/admin/supplier-verification`, `/admin/supplier/[id]`), lecturer (`/admin/lecturer-verification`).
- **Disputes / mediation** (`/admin/mediation`).
- **Payouts** (`/admin/payouts`).
- **Content** — knowledge (`/admin/knowledge`), AI brief contexts (`/admin/brief-contexts`).
- **Operations** — group tokens (`/admin/group-tokens`), payment lab (`/admin/payment-lab`).
- *(Audit-trail viewer is a known gap — Foundation §5 wants it first-class; flag for the design-system/build phase.)*

## 4. Shared / cross-cutting surfaces

- **Auth** — login (`/auth/login`, OAuth, sign-in = sign-up), unauthorized (`/auth/unauthorized`).
- **Onboarding** — the 3-step wizard (`role-selection` → `identity-input` → `verification-upload`); role-aware; purpose-and-payoff per step.
- **Knowledge** (`/knowledge`, `/knowledge/[slug]`) — educational content (read-only).
- **Profile / settings** — present per role; verification status, account, preferences (incl. theme + accessibility prefs — Foundation §14/§15).
- **System states** — every surface defines its **empty / loading / error** state as first-class (Foundation §9).
- **Notifications / status** — surfaced in the shell; tied to the high-anxiety events (payment, verification, review outcome).

## 5. Key flows (structure)

1. **Entry:** Sign in (OAuth) → onboarding wizard (if new) → role home. (Middleware already routes onboarded users to their dashboard.)
2. **Farmer sell:** Home → Listings → create listing → receive order → fulfill → see payment in Ledger.
3. **Buyer buy:** Browse → evaluate listing (trust) → purchase → pay (M-Pesa) → track order.
4. **Student verify:** Home → create/continue project → produce evidence → submit → peer review → lecturer decision → outcome (VERIFIED / REVISION / DENIED) → portfolio.
5. **Lecturer review:** Home → queue → review workspace (evidence + rubric) → decision.
6. **Admin adjudicate:** Overview → queue → case (evidence) → decision (recorded, attributed).

## 6. Information hierarchy principles (per surface type)

- **Producer surfaces** (farmer/buyer home, listing) — *the decision/status first*, minimal choices, large targets, low density (Foundation §11).
- **Expert surfaces** (lecturer queue, admin queues, ledgers) — scannable **data-table** patterns, dense done well, fast triage (Foundation §9/§11; deliverable 18).
- **Trust surfaces** — layered: glanceable signal + on-demand honest breakdown (Foundation §5/§10).
- **Workspaces** (student project, review) — evidence-first, task-focused.

## 7. Trust vocabulary placement

The shared trust components (TrustScore, VerificationBadge, StatusPill, TierIndicator, DecisionAttribution) appear consistently: on listings & buyer evaluation, in the shell (own status), in verification queues, in review outcomes, and in any record an auditor/employer would inspect. Defined once, placed predictably (deliverable 07/17).

## 8. Open questions (IA-level — validate, don't assume)

- **Farmer primary-nav size** — how few items can the farmer shell carry and still cover core tasks? (Test.)
- **Buyer browse vs. order home** — which is the buyer's default landing?
- **Admin overview** — is `impact-summary` the right home, or a dedicated triage surface?
- **Audit-trail viewer** placement and audience (admin-only vs. institutional).
- Carries the Foundation §16 open questions (Trust-Score comprehension, language, etc.).

## 9. What approval unlocks

**Low-fidelity wireframes** (structure → layout, still no visual design), starting with the entry flow (auth + onboarding) and one producer + one expert surface to prove the role-adaptive shell. Then mid-fi, hi-fi, prototype, design system, implementation. Stop for approval at each.
