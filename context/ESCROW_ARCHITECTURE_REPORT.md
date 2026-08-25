# Escrow Architecture Report — Discovered, Not Invented

**Date**: 2026-06-21
**Status**: **IMPLEMENTED.** The investigation below was approved and built (P0–P5, merged 2026-06-21). Deliverable 4 — the escrow state machine — is the specification `src/lib/foodhub/orderEscrowState.ts` implements, with one state added since: `UNKNOWN`, for a payment M-Pesa could not be asked about. Deliverables 5–10 are a historical build plan and are complete. The current payment and escrow posture, and the honest boundary around it, are stated in `context/payments-research/09_PAYMENT_ARCHITECTURE_AND_PANEL_DEFENCE.md`.
**Scope**: Food Hub marketplace payments / order lifecycle / settlement
**Method**: Derived entirely from existing code, models, and architecture docs. No invented behavior. Every claim is cited.

> **Thesis**: UmojaHub already contains ~80% of an escrow system. The pieces — a platform-held balance, a per-order paid state, a farmer payout queue, a buyer dispute queue, an admin settlement authority, and *two reserved-but-unwired states* (`OrderPaymentStatus.REFUNDED`, `OrderFulfillmentStatus.DISPUTED`) — were all built. What was never closed is the **one condition that makes it escrow**: releasing the farmer's funds should depend on *fulfillment*, not merely on *payment*. The Daraja-completion work that would have closed it was abandoned. This report reconstructs that intended design and maps it onto the simulation infrastructure that replaced Daraja.

---

## DELIVERABLE 1 — Escrow Investigation Report

### 1.1 What the platform's own documentation says escrow is *for*

The Food Hub ecosystem map names the exact risk escrow exists to solve, twice:

- Farmers risk *"orders that go unfulfilled by buyers (**mitigated by the payment-before-dispatch model**)"* — `context/FOOD_HUB_ECOSYSTEM_MAP.md:19`
- Buyers risk *"a farmer who fails to dispatch after payment is confirmed"* — `FOOD_HUB_ECOSYSTEM_MAP.md:33`
- The single most important failure mode: *"**Farmer non-dispatch after payment** … Payment is confirmed (PAID status) but the farmer does not dispatch. **This is the most significant trust failure in the system.**"* — `FOOD_HUB_ECOSYSTEM_MAP.md:138-139`

The architecture's stated mitigation today is **reputational only** — trust score reliability + admin review (`FOOD_HUB_ECOSYSTEM_MAP.md:139`). Escrow is the *financial* mitigation the same architecture implies but never wired: hold the buyer's money until dispatch/receipt is real.

### 1.2 The platform is already the holder of funds

In production, M-Pesa settlement does not pay the farmer. It pays **the platform's paybill shortcode**, and the farmer is paid out later by an explicit admin decision:

- *"live M-Pesa would pay the platform's shortcode, and farmer payout is not part of the pilot"* — `src/components/website/topics/TopicPayments.tsx:43-47`
- `WithdrawalRequest` doc comment: *"funds the platform has received on their behalf via M-Pesa (paybill shortcode). **There is no automated B2C disbursement; every payout is an explicit administrative decision.**"* — `src/lib/models/WithdrawalRequest.model.ts:5-9`

So a custodial holding account already exists conceptually. The platform receives, holds, and disburses. That is the structural precondition of escrow, and it is already true.

### 1.3 The gap — funds are released on payment, not on fulfillment

The farmer's withdrawable balance is computed here:

```
gross     = Σ totalAmountKES of orders with paymentStatus PAID
committed = Σ amountKES of withdrawal requests REQUESTED|APPROVED|PAID
available = max(0, gross − committed)
```
— `src/lib/foodhub/escrow.ts:6-12`, `:27-54`

**`gross` counts every PAID order regardless of fulfillment.** A farmer can request payout the instant the buyer's payment confirms — *before dispatch, before receipt, before the dispute window opens*. The platform holds the cash operationally but imposes **no fulfillment condition** on release. The public docs admit this in plain language:

> *"There is no escrow: the platform does not hold funds pending delivery."* — `TopicPayments.tsx:25-30`

That sentence is the whole problem statement. The holding exists; the *condition* does not.

### 1.4 Reserved-but-unwired states — the fingerprints of the abandoned design

Two enum/schema slots were defined and then never written by any route — the unmistakable trace of a release/refund path that was designed and then dropped when Daraja was abandoned:

| Reserved slot | Defined at | Writers in `src/` |
|---|---|---|
| `OrderPaymentStatus.REFUNDED` | `src/types/index.ts:47` | **none** (grep: only the declaration) |
| `OrderFulfillmentStatus.DISPUTED` | `src/types/index.ts:55` | **none** in the order/mediation routes |
| `Order.disputeFlaggedAt` / `disputeReason` | `src/lib/models/Order.model.ts:32-33` | **never set** |

Mediation today is explicitly *decoupled* from the order — *"filing one never mutates the order's fulfillment status"* (`MediationRequest.model.ts:5-11`; `orders/[orderId]/mediation/route.ts:18-19`). The `DISPUTED`/`REFUNDED` states are the holes where the original escrow release/refund logic was meant to plug in.

### 1.5 Conclusion of the investigation

Escrow at UmojaHub is not a new subsystem to bolt on. It is **one missing condition plus the surfacing of facts the system already tracks**: make the farmer's *releasable* balance derive from `COMPLETED` (buyer-confirmed receipt) instead of `PAID`, let an open dispute block release, give the admin an explicit *release vs refund* decision on the funds the platform already holds, and show all three parties the held/released state the database already records.

---

## DELIVERABLE 2 — Original Intended Escrow Architecture

Reconstructed from §1 evidence. Each answer is grounded, not assumed.

| Question | Answer | Evidence |
|---|---|---|
| **When does money enter escrow?** | At payment confirmation — order → `PAID`. In production this is the moment M-Pesa credits the platform shortcode. | `processCallback.ts:174-179`; `TopicPayments.tsx:43` |
| **What event creates escrow?** | The STK callback success path, the *only* writer of `PAID`. | `processCallback.ts:137-179`; `escrow.ts:7-8` |
| **Who controls escrow?** | The platform, as custodian of the shortcode. Release is *"an explicit administrative decision."* | `WithdrawalRequest.model.ts:5-9` |
| **Who can release funds?** | Only an ADMIN, via the payout queue (`REQUESTED→APPROVED→PAID`). | `api/admin/payout-requests/route.ts:13-20` |
| **Who cannot release funds?** | Farmer and buyer. The farmer *requests*; only admin approves/pays. No automated B2C. | `api/farmers/payout-requests/route.ts:10-16`; `WithdrawalRequest.model.ts:7-8` |
| **What condition *should* trigger release-eligibility?** | Order `COMPLETED` = buyer confirmed receipt. This is the intended escrow condition that `escrow.ts` omits (it uses `PAID`). | `orders/[orderId]/status/route.ts:122-127`; gap at `escrow.ts:37` |
| **What blocks release?** | An open dispute. Mediation opens 48h after payment for a paid, still-in-fulfillment order. | `orders/[orderId]/mediation/route.ts:20-22, 87-95` |
| **How were disputes meant to resolve?** | Admin review `OPEN→IN_REVIEW→RESOLVED`. Intended (but unwired) terminal effects on the order: `DISPUTED`/`REFUNDED`. | `api/admin/mediation-requests/route.ts:15-18`; reserved states §1.4 |
| **How would Daraja interact with escrow?** | Daraja's webhook is the sole writer of `PAID`; the simulator emits *identical* callbacks through the *same* processor. Escrow logic sits downstream and is provider-agnostic. | `processCallback.ts:16-25`; `payments/types.ts:3-9` |
| **What admin responsibilities were implied?** | Custody, release (payout), and dispute adjudication over held funds — a visible trust steward, not a hidden DB operator. | `FOOD_HUB_ECOSYSTEM_MAP.md:51-59`; payout + mediation routes |
| **What marketplace risk does escrow solve?** | Farmer non-dispatch after payment — *"the most significant trust failure."* | `FOOD_HUB_ECOSYSTEM_MAP.md:138-139` |
| **What trust problem does escrow solve?** | Buyers committing money to a stranger before delivery; escrow converts "trust the farmer" into "trust the platform's custody." | `FOOD_HUB_ECOSYSTEM_MAP.md:27-33` |

---

## DELIVERABLE 3 — Daraja-to-Simulation Mapping

The escrow design is **provider-agnostic by construction** — this is the project's central payment invariant, and it is why escrow can be demonstrated fully on the simulator with zero fidelity loss.

| Concern | Real Daraja path | Simulation path | Why escrow doesn't care |
|---|---|---|---|
| Funds enter escrow | Safaricom credits shortcode → webhook `/api/webhooks/daraja` | `SimulationProvider` schedules a `SimulatedPayment`; dispatcher emits a Daraja-shaped callback | Both call `processStkCallback`, the *single* writer of `PAID` — `processCallback.ts:16-25` |
| Receipt identity | `MpesaReceiptNumber` from callback | Synthetic receipt on the simulated SUCCESS outcome | Same field `mpesaTransactionId`, same idempotency guard — `processCallback.ts:138-179` |
| Audit | `PaymentEventLog` (provider tagged) | identical `PaymentEventLog` rows | *"real Daraja and the simulator produce identical audit records"* — `PaymentEventLog.model.ts:6-11` |
| Stuck funds | Webhook never arrives → reconcile cron | `SimulatedOutcome.LOST` → same reconcile cron | `SimulatedOutcome.LOST` comment, `types/index.ts:228-230`; cron `api/cron/price-alert-check` |
| Payout (release) | Manual M-Pesa B2C, admin records ref | Admin marks `PAID` with a note (simulated ref) | `WithdrawalRequest` is already provider-neutral — `payout-requests/route.ts:18` |

**Implication:** escrow is implemented entirely *downstream* of the provider boundary. The simulator already drives orders to `PAID` exactly as Daraja would, so "funds held in escrow" and "funds released" are demonstrable today with no Daraja credentials.

---

## DELIVERABLE 4 — Escrow State Machine (derived from UmojaHub, not the prompt's example)

Escrow is **a derived view over `Order` + `MediationRequest` + `WithdrawalRequest`** — *not* a new wallet/balance store. This matches the existing invariant: *"There is no stored wallet; the balance is always recomputed."* (`escrow.ts:5-6`, `farmers/ledger/route.ts:13-16`).

Per-order escrow state (a projection, no new money field):

```
            order.paymentStatus / fulfillmentStatus / mediation / withdrawal
            ─────────────────────────────────────────────────────────────────
NO_FUNDS         PENDING_PAYMENT · AWAITING_PAYMENT
   │  STK success callback (processCallback.ts:174-179)
   ▼
HELD             PAID · IN_FULFILLMENT            ← "buyer paid, funds protected"
   │  farmer confirms dispatch (status route :115-119, sets confirmedByFarmerAt)
   ▼
HELD_DISPATCHED  PAID · IN_FULFILLMENT · confirmedByFarmerAt   ← "awaiting buyer confirmation"
   │
   ├─ buyer opens dispute ≥48h (mediation route :87-95)
   │     ▼
   │  HELD_UNDER_REVIEW   mediation OPEN|IN_REVIEW   ← RELEASE BLOCKED
   │     │  admin resolves (mediation route :170-183)
   │     ├─ in farmer's favour → back to releasable path
   │     └─ in buyer's favour  → REFUNDED  (writes reserved OrderPaymentStatus.REFUNDED)
   │
   └─ buyer confirms receipt (status route :122-127 → COMPLETED)
         ▼
RELEASABLE       COMPLETED · no blocking mediation   ← counts toward farmer available balance
         │  farmer requests payout, admin approves+pays (payout route)
         ▼
SETTLED          covered by APPROVED|PAID WithdrawalRequest
```

Terminal/auxiliary:
- `REFUNDED` — escrow returned to buyer on a buyer-favour dispute resolution. **Activates the reserved `OrderPaymentStatus.REFUNDED`** (`types/index.ts:47`). Inventory handling mirrors the existing FAILED restore (`processCallback.ts:96-104`).
- Failed payment never enters escrow (`processCallback.ts:96-135`) — unchanged.

**The single behavioural change vs today:** `gross` (releasable) moves from `PAID` → `COMPLETED`, and an open dispute subtracts from releasable. Everything else is surfacing + governance.

---

## DELIVERABLE 5 — Required Code Changes

Ordered by dependency. **No file outside this list is touched.** This is platform logic — it proceeds only on approval.

**Core derivation (the heart — one function):**
1. `src/lib/foodhub/escrow.ts` — extend `computeEscrowBalance` to return a richer breakdown without breaking callers:
   - `heldKES` = Σ `totalAmountKES` of orders `PAID` && `fulfillmentStatus ∈ {IN_FULFILLMENT}` (in escrow, not yet releasable)
   - `releasableKES` (the new `gross`) = Σ `totalAmountKES` of orders `COMPLETED`
   - `inDisputeKES` = Σ for orders with an OPEN/IN_REVIEW mediation (carved out of held)
   - `committedPayoutsKES` unchanged; `availableKES = max(0, releasableKES − committed)`
   - Keep existing field names as aliases so `payout-requests` and `ledger` keep compiling.

**Order/escrow projection helper (new, small, pure):**
2. `src/lib/foodhub/orderEscrowState.ts` (new) — pure function mapping an order (+ optional mediation flag) to the escrow state enum in Deliverable 4. Used by all three dashboards and the admin view. No DB writes.

**Admin release/refund on dispute (closes the reserved states):**
3. `src/app/api/admin/mediation-requests/route.ts` — on `RESOLVED`, accept an `outcome: RELEASE | REFUND | NONE`. `REFUND` writes `OrderPaymentStatus.REFUNDED` + `OrderFulfillmentStatus.DISPUTED` + restores inventory (reuse the FAILED-path restore). `RELEASE`/`NONE` leave the order on its normal track. Every outcome stays audit-logged (already wired, `:204-210`).

**Types:**
4. `src/types/index.ts` — add `EscrowState` enum (presentation projection) + `MediationOutcome` enum. No change to existing enums (REFUNDED/DISPUTED already exist).

**Validation:**
5. `src/lib/validation/mediationSchema.ts` — add optional `outcome` to the admin decision schema (Zod, `safeParse`, ≥95% coverage rule applies).

**Reporting/admin escrow read model (new route):**
6. `src/app/api/admin/escrow/route.ts` (new) — ADMIN-only GET: platform totals (held / releasable / in-dispute / settled), and a paginated per-order ledger. Pure aggregation over `Order` + `WithdrawalRequest` + `MediationRequest`. Follows the standard route recipe (`connectDB → session → requireRole → Zod → aggregate`).

**Notifications:**
7. `src/lib/integrations/smsService` usage — add escrow-milestone SMS at: funds held (farmer), receipt-confirmed/released (both), refund issued (buyer). Reuse the existing non-blocking pattern in `processCallback.ts:202-230` and the payout route.

**Tests** (adjacent `__tests__/`, per CLAUDE.md): escrow derivation, projection helper, mediation release/refund transitions, admin escrow route, payout gating now keyed on `COMPLETED`.

---

## DELIVERABLE 6 — Required Database Changes

**Design principle preserved: no stored wallet — balances stay derived (`escrow.ts:5-6`).**

- **No new money/balance collection.** Escrow remains computed.
- **No new fields strictly required** — `Order` already has `paymentStatus`, `fulfillmentStatus`, `paidAt`, `confirmedByFarmerAt`, `receivedByBuyerAt`, `disputeFlaggedAt`, `disputeReason` (`Order.model.ts:16-33`). The refund path *activates* `disputeFlaggedAt`/`disputeReason` and `REFUNDED`/`DISPUTED` for the first time.
- **Optional (recommended) — an append-only `EscrowEventLog`** mirroring `PaymentEventLog`'s pattern (`PaymentEventLog.model.ts`) to record HELD / RELEASED / REFUND_ISSUED with actor + order ref, for the admin audit trail and demo reporting. New model, lazy-imported, indexed — consistent with all existing models. *(If we prefer zero new collections, `AdminAuditLog` already captures admin release/refund actions; the `EscrowEventLog` is the richer, demo-friendly option.)*
- **Indexes:** none new required for the core; if `EscrowEventLog` is added, index `{ orderId: 1 }` and `{ occurredAt: -1 }` like `PaymentEventLog.model.ts:31-33`.

---

## DELIVERABLE 7 — Required UI Changes

All within the migrated `.theme-app` component layer (web-app scope; website out of scope). Existing surfaces are *extended*, not replaced.

| Surface | File | Change |
|---|---|---|
| Farmer ledger | `src/app/dashboard/farmer/ledger/page.tsx` | Split balance into **Held in escrow / Releasable / Available**; per-line escrow state badge; "buyer paid — funds protected pending receipt" messaging |
| Farmer orders | `src/app/dashboard/farmer/orders/page.tsx` | Escrow status pill per order; release requirements ("buyer must confirm receipt") |
| Buyer orders | `src/app/dashboard/buyer/orders/page.tsx` + `[orderId]/page.tsx` | "Your payment is protected in escrow" indicator; confirm-receipt = release CTA; dispute = hold CTA (already partially present) |
| Admin escrow (new) | `src/app/dashboard/admin/escrow/page.tsx` | Held funds, pending releases, completed releases, in-dispute, transaction history, release/refund actions |
| Admin mediation | `src/app/dashboard/admin/mediation/page.tsx` | Add **Release to farmer / Refund to buyer** outcome on resolution |
| Admin nav | admin shell | Add "Escrow" entry alongside Payouts/Mediation |

No new design primitives — reuse the existing `app-*` ramp, status pills, trust bars, mono `KSh` treatment already shipped.

---

## DELIVERABLE 8 — Presentation Flow (the demonstrable journey)

1. Buyer places order → STK simulated → **funds HELD in escrow** (order PAID/IN_FULFILLMENT). Buyer sees "payment protected"; farmer sees "buyer has paid — prepare fulfilment."
2. Farmer confirms carrier handover (24h countdown, reliability-scored) → **HELD · awaiting buyer confirmation.**
3. Buyer confirms receipt → order COMPLETED → **funds RELEASABLE** → farmer's available balance rises.
4. Farmer files payout request (≤ available) → admin **escrow dashboard** shows a pending release → admin approves → marks PAID → **SETTLED.**
5. *Dispute branch:* buyer escalates at ≥48h → **HELD · UNDER_REVIEW**, release blocked → admin resolves **Release** (farmer) or **Refund** (buyer, writes `REFUNDED`/`DISPUTED`).

Every transition is real DB state, SMS-notified, and audit-logged.

---

## DELIVERABLE 9 — Demo Script

Using seeded users (`npm run db:seed`; farmer wanjiku.kamau@gmail.com, buyer kamau.githinji@gmail.com, admin umojahub16@gmail.com) and `PAYMENT_PROVIDER=simulation`, driven via the admin **Payment Lab** (`api/admin/payment-lab`):

1. **Buyer** orders a listing → Payment Lab delivers a SUCCESS callback → buyer dashboard: *"Funds held in escrow."*
2. **Farmer** dashboard: *"Buyer has paid; funds are waiting for successful fulfilment."* Farmer confirms handover.
3. **Admin** opens **Escrow** dashboard → order appears under **Held**, not yet releasable.
4. **Buyer** confirms receipt → order COMPLETED → Escrow dashboard moves it to **Releasable / Pending release.**
5. **Farmer** requests payout → **Admin** approves → marks paid → **Completed releases.**
6. **Dispute demo:** second order, buyer escalates after the 48h gate (or Payment Lab time-shift) → Escrow shows **In dispute, release blocked** → admin **Refunds** → buyer sees refund, order `REFUNDED`.

Talking point: *"No code changed between Daraja and this demo — the simulator emits the same callback through the same processor; escrow lives downstream of the provider."*

---

## DELIVERABLE 10 — Implementation Plan (gated)

**Governance:** This is platform logic (payments/orders/trust/admin) — CLAUDE.md forbids touching it outside the approved gated process, and the request itself gates implementation on approval of these ten deliverables. **No code until this report is approved.**

Phased, each phase ending on the full green gate (`type-check && lint && test`, per CLAUDE.md):

- **P0 — Derivation:** extend `computeEscrowBalance` (held/releasable/in-dispute), add `orderEscrowState` helper + `EscrowState`/`MediationOutcome` types. Update payout gating to `COMPLETED`. Tests. *(Behavioural core.)*
- **P1 — Admin release/refund:** mediation `outcome` (Zod + route), activate `REFUNDED`/`DISPUTED` + inventory restore, audit. Optional `EscrowEventLog`. Tests.
- **P2 — Admin escrow read model + dashboard:** new GET route + `dashboard/admin/escrow` page + nav. Tests.
- **P3 — Party surfaces:** farmer ledger/orders + buyer orders escrow indicators.
- **P4 — Notifications:** held/released/refunded SMS via existing non-blocking pattern.
- **P5 — Docs truth-up:** update `TopicPayments.tsx` "There is no escrow" copy to reflect the held-pending-receipt model (website build must stay green).

**Open decisions for owner sign-off** (do not guess):
- D1: Release condition = `COMPLETED` (buyer-confirmed) vs. also auto-release after a no-dispute window. *Recommend `COMPLETED` — it's what the order machine already produces.*
- D2: Add `EscrowEventLog` collection vs. rely on `AdminAuditLog`. *Recommend the dedicated log for demo clarity.*
- D3: Does a buyer-favour refund feed the trust score's dispute penalty? Current design keeps mediation *decoupled* from trust (`MediationRequest.model.ts:5-11`, Q7). *Recommend keeping decoupled unless owner wants otherwise.*
