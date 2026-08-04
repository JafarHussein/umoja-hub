# UmojaHub Ecosystem Simulation — Platform Analysis (Deliverable 1)

Canonical map of the platform the simulation engine populates. Derived from a
full codebase audit. Pairs with the approved plan and the phased build.

## Roles (post-extension)
Original five: **FARMER, BUYER, STUDENT, LECTURER, ADMIN**, plus **INSTITUTION**
(hosts students/lecturers). Role-data lives in
`User.{farmer,student,lecturer,buyer,institution}Data`. `role` is
nullable only during onboarding. (NGO and EMPLOYER were added by the simulation
program and removed on 2026-08-04 — neither had a path to real existence.)

## Capability / workflow map
- **Marketplace**: verified FARMER creates `MarketplaceListing` (+`PriceHistory`
  LISTING_CREATED) → BUYER creates `Order` (atomic inventory decrement) →
  payment callback (`processStkCallback`) sets PAID + IN_FULFILLMENT + writes
  `EscrowEventLog HELD` → farmer confirms dispatch (`confirmedByFarmerAt`) →
  buyer confirms receipt → COMPLETED + `EscrowEventLog RELEASED` + `PriceHistory`
  ORDER_COMPLETED + trust `recalculate()`. Disputes via `MediationRequest`;
  admin RELEASE/REFUND. Payouts via `WithdrawalRequest`.
- **Education**: STUDENT `ProjectEngagement` walks BRIEF_GENERATED → IN_PROGRESS
  → (documents/blockers/ai-usage) → SUBMITTED → UNDER_PEER_REVIEW (`PeerReview`
  by a different student) → UNDER_LECTURER_REVIEW → VERIFIED/REVISION_REQUIRED/
  DENIED (`LecturerReview` by a **verified** lecturer) → `VerificationAuditLog` +
  `LecturerEffectiveness`.
- **Cooperatives**: `FarmerGroup` (+ `GroupOrder`, `GroupJoinToken`).
- **Verification**: admin routes write `User.*Data.verificationStatus/isVerified`
  + `AdminAuditLog`; farmer approval seeds `FarmerTrustScore`.

## Trust map (derived; `src/lib/trust/farmerTrustCalculator.ts`)
`compositeScore` (0–100) = verification 40 (APPROVED) + transaction 25
(0.5/order ≤12 + volume/50k ≤13) + rating 20 (needs ≥3 ratings) + reliability 15
(on-time confirmation − dispute penalties). Tiers: NEW <40, ESTABLISHED ≥40,
TRUSTED ≥60, PREMIUM ≥80. `recalculate(farmerId)` re-derives from Order/Rating/
Mediation aggregates and upserts `FarmerTrustScore`. **Simulator computes trust
only via `recalculate()` after creating real orders/ratings — never sets scores.**

## Escrow map (derived; `src/lib/foodhub/escrow.ts`, `orderEscrowState.ts`)
No stored wallet. `computeEscrowBalance(farmerId)`: grossReceived (Σ PAID), held
(PAID+IN_FULFILLMENT), inDispute (held with open mediation), releasable
(COMPLETED), committedPayouts (WithdrawalRequest REQUESTED/APPROVED/PAID),
available = max(0, releasable − committed). Per-order `EscrowState`:
NO_FUNDS/HELD/HELD_DISPATCHED/HELD_UNDER_REVIEW/RELEASABLE/REFUNDED. Append-only
`EscrowEventLog` (HELD/RELEASED/REFUND_ISSUED) is the audit trail.

## Notification map (built in this program)
Originally **transient only** (SMS via Africa's Talking, email via Resend; no
persistence). Now backed by a persisted **`Notification`** model + `notify()`
service (`src/lib/notifications/notify.ts`, non-blocking) with emit points at:
payment held, order released, order paid (buyer), farmer verification decision,
payout decision, lecturer review decision. Inbox API:
`GET /api/notifications` (+unread count), `PATCH /api/notifications/[id]`,
`PATCH /api/notifications/read-all`.

## Analytics map
Auto-aggregated by cron from existing data: `PlatformImpactSummary`
(`/api/cron/impact-summary`, hourly singleton) and `MarketInsight`
(`/api/cron/market-insight`, weekly; needs ≥3 PriceHistory points per
crop-county). Farmer ledger is computed live. **Simulator runs these aggregations
after seeding rather than fabricating analytics.**

## Search map
Marketplace listing full-text (`$text` on title/cropName/description, `?q=`).
No global profile search. (Employer portfolio discovery and the public portfolio
by slug were removed by the 2026-08-04 Education Hub vision reset.)

## Backdating constraints (drives the hybrid generation strategy)
Models use Mongoose `timestamps: true`; `createdAt`/`updatedAt` **can** be set on
insert. Activity timestamps (`paidAt`, `confirmedByFarmerAt`, `receivedByBuyerAt`,
`occurredAt`, `recordedAt`, blocker/ai-usage `loggedAt`) are stamped `new Date()`
by routes, so historical activity **must** be written directly with explicit
timestamps. The simulator mirrors each route's exact write shape with backdated
times, then calls the real derived-state functions (`recalculate`, effectiveness
upserts) and the analytics crons.

## Safety / tracking
No native seed-tagging exists; the existing `scripts/seed.ts` drops all
collections (unsafe once real users exist). The simulation engine instead uses a
side-ledger **`SimulationRun`** collection recording every created
`{collection, _id}` under a `runId`, so `seed:reset`/`seed:rebuild` delete exactly
those documents and genuine users are never touched. No `drop()`, no
`deleteMany({})`, production-guarded.
