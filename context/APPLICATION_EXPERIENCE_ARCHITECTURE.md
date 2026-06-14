# UmojaHub — Application Experience Architecture (v1.1)

**Jurisdiction:** This document governs the **authenticated application shell** (`/dashboard/*`, `/onboarding/*`). The public marketing website is governed separately (see `context/FRONTEND.md` where present, and `context/WEBSITE_WEBAPP_BOUNDARY.md`).

**Status:** v1.1 — reconciled against the live API at the close of Phase 3 (auth migration). Every state, gate, and route named below is verified against code; file references are inline.

---

## 0. Why v1.1 exists — corrections applied

The original blueprint contradicted the shipped backend. The following are corrected here and are binding:

1. **Order states** — the blueprint used invented states (`DELIVERED`, `DISPATCHED`, `PAID_IN_FULFILLMENT`). These do not exist. Only the real enums below are used.
2. **Reliability gate** — re-specified as **composite trust score < 40 (the `NEW` tier)**. Flagged as a **new backend rule** (not yet enforced at the listing layer — see §3).
3. **Middleware whitelist** — extended to the real public surfaces (`/marketplace`, `/knowledge`, `/api/webhooks/daraja`, `/api/health`, `/api/transparency`, website routes, `/auth/*`, `/api/auth/*`, `/verify/*`, `_next`).
4. **SMS-delivery ticker** — struck. There is no SMS event log to drive a live ticker; do not show one until an SMS-event-log prerequisite ships.
5. **Daraja wait** — a bounded **90-second poll with an explicit timeout path**, never an unbounded navigation lock.

---

## 1. Order state model (authoritative)

Two independent dimensions live on `Order` (`src/lib/models/Order.model.ts`), defined in `src/types/index.ts`.

**Payment status** (`OrderPaymentStatus`): `PENDING_PAYMENT → PAID → (FAILED | REFUNDED)`. The Daraja webhook (`/api/webhooks/daraja`) is the only writer of `PAID`.

**Fulfillment status** (`OrderFulfillmentStatus`): `AWAITING_PAYMENT → IN_FULFILLMENT → RECEIVED → COMPLETED`, with `DISPUTED` as a branch. There is **no** `DELIVERED` or `DISPATCHED` state.

Canonical timeline of a healthy order:

| Step | paymentStatus | fulfillmentStatus | Trigger |
| --- | --- | --- | --- |
| Order placed | PENDING_PAYMENT | AWAITING_PAYMENT | Buyer checkout |
| Payment confirmed | PAID | IN_FULFILLMENT | Daraja callback |
| Farmer confirms handover | PAID | IN_FULFILLMENT | `confirmedByFarmerAt` set |
| Buyer confirms receipt | PAID | RECEIVED | `receivedByBuyerAt` set |
| Settled | PAID | COMPLETED | Completion → trust recalc |
| Escalated | PAID | IN_FULFILLMENT (unchanged) | Buyer files mediation (does **not** mutate order state) |

The farmer's "Confirm Carrier Handover" prompt is driven by the FIX-01 flag `canConfirmDispatch = paymentStatus === 'PAID' && !confirmedByFarmerAt` (`src/app/api/orders/route.ts`), against a **24-hour** countdown from `paidAt` (matches the trust calculator's on-time window).

---

## 2. Escrow & settlement experience

There is **no stored wallet**. A farmer's balance is always derived (`computeEscrowBalance`, `src/lib/foodhub/escrow.ts`):

- `grossReceivedKES` = Σ `totalAmountKES` of orders with `paymentStatus: PAID`
- `committedPayoutsKES` = Σ `amountKES` of withdrawal requests in `REQUESTED | APPROVED | PAID`
- `availableKES = max(0, gross − committed)`

The ledger view (`GET /api/farmers/ledger`) shows PAID-order line items + the derived balance. Settlement is a **manual admin payout** (`WithdrawalRequest` lifecycle `REQUESTED → APPROVED → PAID | REJECTED`); there is no automated B2C disbursement. **Copy rule:** say "Received by platform — payout pending", never make an "escrow" legal claim.

---

## 3. Reliability gate (NEW backend rule)

The published methodology implies trust gating. The concrete rule for the app shell is: a farmer with **composite trust score < 40** is in the **`NEW` tier** (`assignTier`, `src/lib/trust/farmerTrustCalculator.ts`). Verification alone contributes 40 points, so `NEW` ≈ unverified. Tiers: `NEW (<40) · ESTABLISHED (≥40) · TRUSTED (≥60) · PREMIUM (≥80)`.

This gate is **specified, not yet enforced** at the listing/marketplace layer — it is a new backend rule to implement, not an existing behaviour. Until enforced, do not present it to users as active.

---

## 4. Route protection & onboarding lock

`src/middleware.ts` (AUTH-04) runs JWT-claims-only (no DB reads) on `/dashboard/*`, `/onboarding/*`, `/api/admin/*`, and the Daraja webhook. Behaviour:

- Unauthenticated → page: redirect `/auth/login?callbackUrl=…`; API: `401` JSON.
- `role === null` or not onboarded → page request redirected to `/onboarding/<stage>`.
- A fully-onboarded user on `/onboarding/*` → bounced to their dashboard.
- Authenticated **non-admin** on `/dashboard/admin/*` or `/api/admin/*` → **hard 404** (hides the surface). Other role mismatches → `/auth/unauthorized`.

**Exemption whitelist** (never gated): `/marketplace`, `/knowledge`, `/api/webhooks/daraja`, `/api/health`, `/api/transparency`, `/auth/*`, `/api/auth/*`, `/verify/*`, `_next`, static assets, website routes.

---

## 5. Daraja payment wait

After STK push, the checkout waits with a **90-second poll** of payment status and an **explicit timeout/`INVENTORY_LOCK_FAILED` path** that releases the quantity lock and surfaces a retry. Never lock navigation indefinitely. (Implements the corrected D01 contract for UI-07.)

---

## 6. Notifications

SMS is dispatched via Africa's Talking (`src/lib/integrations/smsService.ts`) on payout decisions, verification decisions, and group-token mint. It is **fire-and-forget** — failures are logged, never surfaced as guaranteed delivery. **Do not** build a live SMS-delivery ticker; there is no event log backing it.
