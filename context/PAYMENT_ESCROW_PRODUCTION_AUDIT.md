# Payment & Escrow — Production Simulation Audit

**Date**: 2026-08-02
**Status**: AUDIT COMPLETE — no code written; awaiting scope approval
**Baseline gate**: `type-check` clean · **944 tests / 84 suites green** on `main` (2391703)
**Method**: read every payment/escrow service, model, route, cron and surface on `main`. Every claim below is cited to `file:line`. Nothing inferred from documentation alone.

---

## HEADLINE FINDING

**The premise of the brief is out of date.** The brief anticipates a mock payment page with a fake spinner and hardcoded success. That is not what is on `main`.

What exists is a genuine, provider-agnostic payment simulation and a working escrow system, built in two prior gated efforts (`context/ESCROW_ARCHITECTURE_REPORT.md`, `ESCROW_IMPLEMENTATION_CHECKLIST.md` P0–P5, all merged). It already has: real Safaricom result codes, a weighted failure distribution, delayed and dropped callbacks, duplicate-delivery idempotency, an append-only payment audit log, a derived (never stored) escrow balance, a six-state escrow projection, admin release/refund, and reconciliation.

**"Rebuild it from zero" is the wrong instruction here and I am not going to follow it.** Doing so would delete a correct, tested, provider-swappable architecture — the single most defensible thing about this feature in front of a panel — and would violate CLAUDE.md's prohibition on touching platform logic outside a gated process.

The real work is **not** rebuilding. It is closing **ten specific gaps**, of which the largest is this:

> The system generates a realistic M-Pesa receipt number, stores it, and uses it as the idempotency key — **and then never shows it to anyone.** No API route returns it; no screen displays it. There is no receipt.

---

## DELIVERABLE 1 — Payment Simulation Audit

### What is genuinely production-shaped

| Capability | Where | Assessment |
|---|---|---|
| Provider abstraction | `src/lib/payments/index.ts:16-20`, `active.ts:8-17` | **Strong.** `PAYMENT_PROVIDER` env selects simulation / daraja-sandbox / daraja-production. Nothing downstream branches on provider. |
| Real Safaricom result codes | `types.ts:48-72` | **Strong.** `0` success, `1032` user cancelled, `1037` DS timeout, `1001` subscriber lock, `1025` unable to process. Not invented codes. |
| Realistic receipt numbers | `simulationProvider.ts:30-34` | **Strong.** 10-char uppercase alphanumeric (`QGR1ABCD23`) — matches M-Pesa format. |
| Weighted outcome distribution | `simulationConfig.ts:28-50` | **Strong.** Defaults 75% success / 10% insufficient funds / 5% cancelled / 5% timeout / 3% network / 2% lost. Every weight env-overridable. Models a healthy-but-imperfect population, not "always success". |
| Realistic delay distribution | `simulationConfig.ts:41-47` | **Strong.** 70% instant, then 10s/30s/60s/180s buckets. |
| Single shared callback processor | `processCallback.ts:64-266` | **Excellent.** The *only* writer of `PAID`. Both the real Daraja webhook and the simulator feed identical Daraja-shaped payloads through it, so the order system cannot tell which provider fired. This is the architectural centrepiece. |
| Idempotency / duplicate guard | `processCallback.ts:152-174` | **Strong.** Unique sparse index on `mpesaTransactionId` is the hard guard; the explicit check makes a duplicate a clean logged no-op. The simulator deliberately double-delivers to exercise it (`dispatcher.ts:66-69`). |
| Failure path + inventory restore | `processCallback.ts:97-137` | **Strong.** Restores `quantityAvailable`, reopens the listing, alerts admin by SMS, logs `TIMEOUT` vs `FAILED` by result code. |
| Dropped-callback (LOST) modelling | `dispatcher.ts:28-54` | **Strong.** Never delivered; order stays `PENDING_PAYMENT` for reconciliation — exactly like a real dropped webhook. |
| Serverless-native delivery | `dispatcher.ts:79-113` | **Good.** No background worker. Three triggers: buyer poll (`payment-status/route.ts:62-82`), cron sweep, Payment Lab. |
| Append-only payment audit | `PaymentEventLog.model.ts`, written at `orders/route.ts:369-380` + `processCallback.ts:43-62` | **Good** as a store. See gap G3 for its exposure. |
| Admin Payment Lab | `admin/payment-lab/route.ts:21-39` | **Strong.** 11 forceable scenarios: success, insufficient funds, cancelled, unreachable, timeout, network failure, unknown error, delayed, duplicate, lost. |
| Atomic stock reservation | `orders/route.ts:277-308` | **Strong.** Compare-and-swap prevents overselling under concurrency. |
| Order rate limit | `orders/route.ts:218-223` | Present — 5 orders/hour/buyer. |

### Verdict

The simulation layer is **production-grade and needs no rebuild.** Its weaknesses are all at the *edges* — exposure, honesty, and recovery — not in the engine.

---

## DELIVERABLE 2 — Escrow Audit

| Capability | Where | Assessment |
|---|---|---|
| No stored wallet — balance always derived | `escrow.ts:49-124` | **Excellent.** Recomputed from `Order` + `WithdrawalRequest` + `MediationRequest` every call. No balance field can drift. |
| Correct release condition | `escrow.ts:83-91` | **Correct.** `releasable` = orders `COMPLETED` (buyer-confirmed receipt) — *not* merely `PAID`. This is the condition that makes it escrow rather than a payment log. |
| Held vs releasable vs in-dispute split | `escrow.ts:110-123` | **Strong.** `held` = PAID + IN_FULFILLMENT; `inDispute` = PAID with OPEN/IN_REVIEW mediation; `available` = max(0, releasable − committed payouts). |
| Six-state per-order projection | `orderEscrowState.ts:23-48` | **Strong, pure, no DB.** `NO_FUNDS → HELD → HELD_DISPATCHED → HELD_UNDER_REVIEW → RELEASABLE / REFUNDED`. Refund is terminal and takes precedence. |
| Dispute blocks release | `escrow.ts:59-63`, `orderEscrowState.ts:43-45` | **Correct.** |
| Admin release/refund | `admin/mediation-requests/route.ts` (`applyEscrowOutcome`) | **Present** — but only reachable by resolving a dispute. See gap G4. |
| Escrow milestone log | `EscrowEventLog.model.ts`; written at `processCallback.ts:204-219`, `status/route.ts:156-188`, mediation route | **Written correctly — never read.** See gap G2. |
| Admin escrow ledger | `admin/escrow/route.ts:53-173` | **Good read model.** Platform totals (held / releasable / in-dispute / refunded / settled) + paginated per-order ledger with derived state. Read-only. |
| Payout settlement | `admin/payout-requests`, `farmers/payout-requests` | **Present.** `REQUESTED → APPROVED → PAID`, admin-only, no automated B2C — matches the custodial model. |
| Party-facing escrow copy | buyer detail `:430-460`, `:516-532`; farmer ledger | **Good.** "Your payment is protected in escrow", confirm-receipt framed as releasing funds. |

### Verdict

Escrow is **real, correctly conditioned, and honestly derived.** Its weakness is that it is **under-exposed and under-controlled**: the audit trail is invisible and the admin cannot act on funds except through a dispute.

---

## DELIVERABLE 3 — Gap Analysis Against the Original Daraja Design

The provider boundary is clean. Escrow sits entirely downstream of `processStkCallback`, so **no business rule was lost when Daraja was abandoned.** Verified mapping:

| Concern | Daraja path | Simulation path | Fidelity |
|---|---|---|---|
| Funds enter custody | Safaricom credits shortcode → webhook | Scheduled `SimulatedPayment` → dispatcher | **Identical** — both call `processStkCallback` |
| Receipt identity | `MpesaReceiptNumber` | Synthetic 10-char receipt | Same field, same idempotency guard |
| Audit | `PaymentEventLog` | Identical rows, provider-tagged | **Identical** |
| Stuck funds | Webhook never arrives | `LOST` outcome | Same reconciliation path |
| Payout | Manual B2C, admin records ref | Admin marks PAID | Already provider-neutral |

**Nothing in the escrow design depends on Daraja.** The honest talking point stands: *no code changes between Daraja and this demo.*

---

## DELIVERABLE 4 — Payment State Machine (as built)

```
        POST /api/orders — stock atomically reserved (orders/route.ts:277)
                    │
                    ▼
            PENDING_PAYMENT ──────────────────────────────┐
                    │  STK push dispatched                │
                    │  PaymentEventLog: INITIATED         │ no callback
                    ▼                                      │ (LOST, or real drop)
        ┌── callback delivered ──┐                         ▼
        │  CALLBACK_RECEIVED     │              stuck >15 min → cron sweep
        ▼                        ▼                         │
  ResultCode 0            ResultCode ≠ 0                    ▼
        │                        │                        FAILED
        │                        │  1032 cancelled     + inventory restored
        │                        │  1037 timeout
        │                        │  1/1001/1025 other
        ▼                        ▼
  receipt present?          FAILED + inventory restored + admin SMS
   │        │               PaymentEventLog: FAILED | TIMEOUT
   no      yes
   │        │
   │   duplicate receipt? ── yes → no-op, PaymentEventLog: DUPLICATE
   │        │ no
   │        ▼
   │      PAID + IN_FULFILLMENT + mpesaTransactionId + paidAt
   │      PaymentEventLog: SUCCESS · EscrowEventLog: HELD
   │      SMS + in-app notification to BOTH parties
   ▼
 no-op (logged error — receipt missing from success callback)
```

Terminal: `PAID`, `FAILED`, `REFUNDED` (admin dispute resolution only).

---

## DELIVERABLE 5 — Escrow State Machine (as built)

```
NO_FUNDS            PENDING_PAYMENT / FAILED — nothing held
   │ payment confirmed (processCallback.ts:176-181)
   ▼
HELD                PAID · IN_FULFILLMENT              "buyer paid, funds protected"
   │ farmer confirms handover (status/route.ts:122-139 → confirmedByFarmerAt)
   ▼
HELD_DISPATCHED     PAID · IN_FULFILLMENT · confirmedByFarmerAt
   │
   ├─ buyer escalates ≥48h ──► HELD_UNDER_REVIEW      RELEASE BLOCKED
   │                              │ admin resolves
   │                              ├─ RELEASE → order COMPLETED
   │                              └─ REFUND  → REFUNDED + DISPUTED + stock restored
   │
   └─ buyer confirms receipt (status/route.ts:140-145) ──► RELEASABLE
                                                              │ payout REQUESTED→APPROVED→PAID
                                                              ▼
                                                           SETTLED
```

Derivation is `orderEscrowState.ts:23-48`; balances are `escrow.ts:49-124`. **No stored escrow record exists** — this is a projection, by design.

---

## THE TEN GAPS

Ranked by impact on a panel demonstration.

### G1 — There is no receipt. *(Critical)*
`mpesaTransactionId` is generated (`simulationProvider.ts:30`), stored (`processCallback.ts:179`), and used as the idempotency key (`:155`). **Verified: zero references in any non-test API route and zero in any dashboard screen.** No receipt view, no download, nothing. The brief's Deliverable 11 is entirely unbuilt.

### G2 — The escrow audit trail is write-only. *(Critical)*
`EscrowEventLog` rows are written at HELD, RELEASED and REFUND_ISSUED. **No route or screen ever reads the collection.** The audit trail the brief asks for exists in MongoDB and is invisible to every user including the admin.

### G3 — No per-order payment history. *(High)*
`PaymentEventLog`'s only reader is the Payment Lab (`payment-lab/route.ts:48-114`) — global aggregate counts plus the 15 most recent rows platform-wide. There is **no way to view the event chain for one order**, for any role.

### G4 — Admin escrow console is read-only. *(High)*
`dashboard/admin/escrow` renders totals and a ledger. Every money action lives on the *mediation* page and only as an outcome of resolving a dispute. An admin **cannot** release, refund, force-close, or freeze an escrow that has no dispute attached. The brief asks for all of these.

### G5 — `OrderFulfillmentStatus.RECEIVED` is reserved but never written. *(Medium)*
The buyer's `RECEIVED` request writes `COMPLETED` directly (`status/route.ts:142-145`). `RECEIVED` is a dead enum member — the same "reserved-but-unwired" fingerprint the earlier escrow report found in `REFUNDED`/`DISPUTED`. Fulfilment granularity is two real steps plus a `confirmedByFarmerAt` timestamp; there is no accepted / preparing / ready / collected chain.

### G6 — The simulation is not disclosed to users. *(Medium — honesty)*
**Verified: zero occurrences of "simulation" in any buyer or farmer surface.** Worse, the buyer is told *"Check your phone and enter your M-Pesa PIN"* (`buyer/orders/[orderId]/page.tsx:509-511`) — in simulation mode no phone will ever ring. The brief explicitly requires being *transparent that this is a payment simulation*. Today it is silently untransparent in the wrong direction.

### G7 — No retry-payment path. *(Medium)*
After a failed payment the buyer must place a brand-new order. The two "Retry" buttons (`orders/page.tsx:97`, `[orderId]/page.tsx:332`) are **page-load retries, not payment retries** — verified by reading both. No cancel-payment path either.

### G8 — Reconciliation cadence contradicts itself. *(Medium)*
`dispatcher.ts:15` documents a *"15-min reconciliation cron"*. The stuck cutoff is 15 minutes (`price-alert-check/route.ts:149`). But `vercel.json` schedules that route **daily** (`0 0 * * *`). A LOST payment can sit `PENDING_PAYMENT` for up to 24 hours. Separately, payment reconciliation living inside a route named `price-alert-check` is an architecture-review liability.

### G9 — Dispute workflow is one-sided. *(Medium)*
Buyer files category + description (`MediationRequest.model.ts:27-46`). There is **no farmer response field, no evidence upload, no threaded communication** — the model has none. Admin resolves with a note + outcome. The brief's dispute spec (farmer responds, evidence uploaded) is unbuilt.

### G10 — No stated release timeline. *(Low)*
Neither party is told *when* funds release. There is no auto-release window and no countdown; release depends entirely on the buyer acting. A buyer who never confirms strands the farmer's funds indefinitely, with only the 48h mediation gate as recourse — and mediation can only be opened by the **buyer**, not the farmer. The farmer has no escalation path at all.

---

## RECOMMENDED SCOPE

Ordered by demonstration value per unit of risk. All of this is **platform logic** and therefore gated under CLAUDE.md.

**Phase R1 — Make the money visible** *(closes G1, G2, G3 — highest value)*
- Receipt read model + receipt view for buyer/farmer/admin, with print/download. Transaction ref, order ref, both parties, produce, quantity, amount, method, date, escrow ref, status.
- Per-order escrow + payment event history, reading `EscrowEventLog` and `PaymentEventLog` — the audit trail the DB already holds.
- Enrich the existing `OrderTimeline` with real actor + timestamp per step, sourced from the logs rather than inferred from status.

**Phase R2 — Admin escrow console** *(closes G4)*
- Direct release / refund / force-close on the escrow ledger, independent of mediation, with confirmation + mandatory reason, `AdminAuditLog` + `EscrowEventLog` on every action.

**Phase R3 — Honesty + recovery** *(closes G6, G7)*
- A persistent, dignified "Payment simulation" disclosure on payment surfaces; correct the "check your phone" copy.
- Retry-payment and cancel-payment on an unpaid/failed order, reusing the existing reservation and callback machinery.

**Phase R4 — Lifecycle depth** *(closes G5, G9, G10)*
- Decide whether to activate `RECEIVED` and add fulfilment granularity — **this changes the order state machine and needs an explicit owner decision.**
- Farmer response on a dispute; farmer-initiated escalation.
- Stated release expectations for both parties.

**Phase R5 — Operational correctness** *(closes G8)*
- Reconcile the cron cadence with the documented 15-minute contract, or correct the documentation to match Vercel's scheduling constraints. Consider extracting payment reconciliation into its own route.

---

## DELIVERABLE 13 — Testing Report (baseline)

`main` @ 2391703: **type-check clean, 944 tests / 84 suites green.** Payment/escrow coverage present at: `payments.test.ts`, `simulationConfig.test.ts`, `orderEscrowState.test.ts`, `escrow.test.ts`, `escrowOutcome.test.ts`, `admin/escrow/route.test.ts`, `webhooks/daraja/route.test.ts`, plus order and mediation suites.

**Untested by role:** no test drives a full buyer→farmer→admin lifecycle end to end. Every suite is unit- or route-scoped.

---

## DELIVERABLE 14 — Production Readiness (current)

| Dimension | State |
|---|---|
| Payment engine | **Ready.** Provider-agnostic, real codes, realistic failure distribution. |
| Escrow correctness | **Ready.** Derived, correctly conditioned on fulfilment. |
| Idempotency / concurrency | **Ready.** Duplicate guard + atomic stock reservation. |
| Audit *storage* | **Ready.** Two append-only logs. |
| Audit *visibility* | **Not ready.** Both logs effectively invisible (G2, G3). |
| Receipts | **Absent.** (G1) |
| Admin control | **Partial.** Read-only console; actions gated behind disputes (G4). |
| Recovery flows | **Partial.** No retry/cancel (G7). |
| Disclosure honesty | **Not ready.** Misleading copy in simulation mode (G6). |
| Dispute completeness | **Partial.** One-sided (G9). |

---

---

## BUILD OUTCOME — R1–R3 (approved 2026-08-02, commit `16a5450`)

Scope approved by the owner: **R1–R3, engine preserved.** Gate after: type-check clean, lint 0 errors, **996 tests / 90 suites** (from 944 / 84), build green.

| Gap | Status | What landed |
|---|---|---|
| G1 receipts | **Closed** | `GET /api/orders/[orderId]/receipt` + `TransactionReceipt` shared by buyer / farmer / admin. Derived, never stored. Print-to-PDF via print styles. The M-Pesa receipt number is now visible for the first time. |
| G2 escrow trail invisible | **Closed** | `EscrowEventLog` now has a reader — merged into the receipt's transaction history with actor and timestamp. |
| G3 no per-order payment history | **Closed** | `PaymentEventLog` merged into the same trail, with Safaricom result codes rendered as plain-language causes. |
| G4 read-only admin console | **Closed** | `POST /api/admin/escrow/[orderId]` settles held funds directly, independent of mediation. Mandatory ≥10-char reason → `AdminAuditLog` + `EscrowEventLog`. Money movement extracted to `lib/foodhub/escrowSettlement.ts`, now shared with the mediation path. |
| G6 simulation not disclosed | **Closed** | `SimulationNotice` component; the false "enter your M-Pesa PIN" instruction corrected; `payment-status` now reports `isSimulated`. |
| G7 no retry / cancel | **Closed** | `POST /api/orders/[orderId]/payment` — RETRY re-reserves stock and rejoins the same order's trail; CANCEL releases stock immediately. Both refuse a paid or refunded order (`ORDER_ALREADY_PAID`). |

### Deliberately not built, and why

- **Escrow "freeze"** (part of the brief's admin list) — a freeze is a *persisted* release block, which needs a new field on `Order` and a new input to the escrow derivation. That is a change to platform state, i.e. R4 territory. Release and refund are the only two places held money can actually go, and both are now reachable; a freeze adds a third *status* but no new destination. Deferred rather than faked.
- **`OrderTimeline` left as-is** (G5) — the log-sourced timeline with actor + timestamp per event now exists as the receipt's transaction history. `OrderTimeline` remains a progress indicator derived from order status. Merging the two means changing the order state machine (G5/R4).
- **G5, G9, G10** — closed subsequently in R4; see below.

### R4 — G5, G9, G10 closed (commit `c3ce803`)

**G5 fulfilment granularity — built as a separate axis, not new order states.** `fulfillmentStatus === IN_FULFILLMENT` proved load-bearing in ~15 non-test places (escrow held-guard, balance aggregation, `settleEscrow`, mediation gate, admin ledger filter, UI). Promoting PREPARING/READY/COLLECTED to real fulfilment statuses would have made every one of those wrong, each a potential escrow defect. Instead: a descriptive `Order.fulfillmentStage` (`PREPARING → READY → IN_TRANSIT → DELIVERED`) plus a bounded `stageHistory`, forward-only, feeding the receipt's transaction timeline. Every escrow invariant is untouched — pinned by a test asserting the stage route never writes `paymentStatus` or `fulfillmentStatus`.

*Correction to the audit as originally written:* `OrderFulfillmentStatus.RECEIVED` is **not** entirely dead — `updateOrderStatusSchema` accepts it as the buyer's *request* token, which the route translates to `COMPLETED`. It is never **persisted**, which is what was actually verified. Left as-is; it is a working request contract, not a defect.

**G9 two-sided disputes.** Adds a respondent statement (one each — an adjudication record, not a moderated thread) and photo evidence from either party through the existing Cloudinary upload route (`umojahub/disputes`). The admin queue shows both accounts side by side and explicitly flags when the other side has not answered, since that decision moves real money.

**G10 farmer escalation + stated release timeline.** These turned out to be one feature. A farmer whose buyer went quiet had no recourse at all — funds held indefinitely behind someone else's inaction. Either party can now file, on different clocks and different grounds: buyers at `MEDIATION_ESCALATION_HOURS` (48h) from payment, farmers at `FARMER_ESCALATION_HOURS` (7 days) from their own dispatch confirmation. That gate *is* the answer to "when do I get paid?", now stated on the order.

Gate: type-check clean, lint 0 errors, **1045 tests / 94 suites**, build green.

### G8 cron cadence — closed separately (commit `8aa5029`)

The cadence contract was **unmeetable, not merely unmet**: Vercel Hobby permits only *daily* cron invocations and only two crons per project (`PRODUCTION_ROADMAP.md` §Vercel Hobby). The roadmap's `*/15 * * * *` was never achievable; `vercel.json` had been daily all along, and the 15-minute claims in `dispatcher.ts` and the cron route header were simply wrong.

Raising the cadence being unavailable, the fix removes the dependency on cron frequency — reusing the lazy-trigger model already proven for simulated callback delivery:

- Reconciliation extracted to `src/lib/payments/reconcile.ts` (out of a route named `price-alert-check`).
- The buyer's `payment-status` poll reconciles their own order the moment it times out; the daily cron is the unscoped backstop.
- All 15-minute claims corrected to state the real daily cadence and the Hobby constraint behind it.

**Two further defects surfaced while fixing it:**

1. **Reconciliation wrote no audit event whatsoever.** `PaymentEventType.RECONCILED` was a third reserved-but-never-written enum member — a payment could be marked FAILED and stock returned with nothing recording that the platform did it. Now written, and the buyer is notified so the retry path is reachable.
2. **A regression introduced by R3's retry feature.** Staleness was measured from `Order.createdAt`, but retry resets an old order to `PENDING_PAYMENT` — so the next sweep would have re-failed essentially every retry. Adds `Order.paymentRequestedAt`, set at creation and on each retry, with a `createdAt` fallback for existing orders.

Gate: type-check clean, lint 0 errors, **1008 tests / 92 suites**, build green.

### Notable design decisions

- The escrow reference (`ESC-2026-000123`) is derived from the order reference, not stored — no counter, no schema field, cannot drift.
- Admin and parties read the **same route and the same component**. There is no privileged rendering of the facts, which is what makes the trail worth anything.
- `settleEscrow` applies the held guard (`PAID` + `IN_FULFILLMENT`) as the *filter of the update*, making settlement compare-and-swap: two concurrent decisions cannot both move the money.
- Cancel deliberately does **not** return stock when it loses the race to a landing payment — covered by a test.

---

## GOVERNANCE NOTE

Payments, orders, escrow, trust and admin are **platform logic**. CLAUDE.md forbids modifying them outside an approved gated process, and the two prior escrow efforts both ran through explicit approval gates with recorded decisions. This audit is the gate. **No code has been written.** Phases R1–R5 proceed only on approval, and R4 in particular carries an owner decision (order state machine change) that I will not make unilaterally.
