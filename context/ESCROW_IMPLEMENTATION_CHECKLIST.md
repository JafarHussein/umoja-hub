# Escrow Implementation Checklist — P0 → P5

**Source of truth**: `context/ESCROW_ARCHITECTURE_REPORT.md` (Deliverables 4–10)
**Branch**: `chore/webapp-uiux-nuclear-reset` (current)
**Started**: 2026-06-21
**Decisions in force** (defaults, owner may veto):
- **D1 — Release trigger** = order `COMPLETED` (buyer-confirmed receipt). No auto-release window.
- **D2 — Audit store** = dedicated append-only `EscrowEventLog` (mirrors `PaymentEventLog`).
- **D3 — Trust coupling** = mediation/refunds stay **decoupled** from the trust score (preserves Q7).

**Invariants that must not break** (any phase):
- No stored wallet — escrow balances stay **derived** (`escrow.ts:5-6`).
- Provider-agnostic — escrow logic lives downstream of `processStkCallback`; no Daraja/simulation branching.
- Website build stays green; `theme-website` tokens + 3 fonts untouched.
- Existing callers of `computeEscrowBalance` keep compiling (field aliases).
- Gate per phase: `npm run type-check && npm run lint && npm run test` (+ `npm run build` at the end).

---

## P0 — Derivation core (behavioural heart) ✅ DONE 2026-06-21
- [x] Add `EscrowState` enum + `MediationOutcome` enum to `src/types/index.ts` (existing enums untouched; `REFUNDED`/`DISPUTED` reused)
- [x] Extend `computeEscrowBalance` in `src/lib/foodhub/escrow.ts`:
  - [x] `releasableKES` = Σ `totalAmountKES` of orders `fulfillmentStatus = COMPLETED`
  - [x] `heldKES` = Σ orders `PAID` && `IN_FULFILLMENT`
  - [x] `inDisputeKES` = Σ orders with an OPEN/IN_REVIEW mediation (via `MediationRequest.distinct`)
  - [x] `committedPayoutsKES` unchanged; `availableKES = max(0, releasableKES − committed)`
  - [x] `grossReceivedKES` kept = Σ all PAID (= held + releasable), preserving its "total received" meaning; only `availableKES` re-keyed to releasable
- [x] New pure helper `src/lib/foodhub/orderEscrowState.ts` — `(order, hasOpenMediation) → EscrowState` (no DB writes)
- [x] Payout gating now keyed on `COMPLETED` via `availableKES` (route unchanged — reads `balance.availableKES`)
- [x] Tests: `escrow.test.ts` (4) + `orderEscrowState.test.ts` (7) — 11 new, all green
- [x] GATE green — tsc clean, lint 0 errors, 711 tests pass

## P1 — Admin release / refund on dispute (activates reserved states)
- [ ] Add optional `outcome: RELEASE | REFUND | NONE` to admin mediation decision schema (`mediationSchema.ts`, Zod)
- [ ] `api/admin/mediation-requests` PATCH: on `RESOLVED` + `REFUND` → write `OrderPaymentStatus.REFUNDED` + `OrderFulfillmentStatus.DISPUTED` + set `disputeFlaggedAt`/`disputeReason` + restore inventory (reuse FAILED-path restore from `processCallback.ts:96-104`)
- [ ] `RELEASE`/`NONE` leave order on normal track; all outcomes stay `AdminAuditLog`-logged
- [ ] (D2) New `src/lib/models/EscrowEventLog.model.ts` — append-only HELD / RELEASED / REFUND_ISSUED; lazy-import; index `{orderId:1}`, `{occurredAt:-1}`
- [ ] Write `EscrowEventLog` rows at: payment held (in `processCallback` success), receipt-confirmed/released (status route COMPLETED), refund issued (mediation refund)
- [ ] Tests: refund transition writes REFUNDED+DISPUTED+restores stock; release/none leave order intact; event log rows
- [ ] GATE green

## P2 — Admin escrow read model + dashboard
- [ ] New `src/app/api/admin/escrow/route.ts` — ADMIN GET: platform totals (held/releasable/in-dispute/settled) + paginated per-order ledger (aggregate over Order + WithdrawalRequest + MediationRequest)
- [ ] New `src/app/dashboard/admin/escrow/page.tsx` — held funds, pending releases, completed releases, in-dispute, history, risk indicators
- [ ] Add "Escrow" entry to admin shell nav (alongside Payouts/Mediation)
- [ ] Tests: admin escrow route auth + aggregation
- [ ] GATE green

## P3 — Party-facing surfaces (presentation only, `.theme-app`)
- [ ] Farmer ledger `dashboard/farmer/ledger/page.tsx` — split Held / Releasable / Available; per-line escrow state badge
- [ ] Farmer orders `dashboard/farmer/orders/page.tsx` — escrow pill + release requirement ("buyer must confirm receipt")
- [ ] Buyer orders `dashboard/buyer/orders/page.tsx` + `[orderId]/page.tsx` — "payment protected in escrow"; confirm-receipt = release CTA
- [ ] GATE green

## P4 — Notifications
- [ ] Held (farmer), released (both), refund issued (buyer) SMS via existing non-blocking pattern (`processCallback.ts:202-230`)
- [ ] Tests where mockable
- [ ] GATE green

## P5 — Docs truth-up
- [ ] Update `src/components/website/topics/TopicPayments.tsx` — replace "There is no escrow" copy with held-pending-receipt model (website must keep building)
- [ ] Update `context/FOOD_HUB_ECOSYSTEM_MAP.md` failure-mode note (escrow now mitigates non-dispatch financially)
- [ ] Final full gate + `npm run build` green
- [ ] Commit per phase already done; final review pass

---

## Progress log
- 2026-06-21 — Checklist created; decisions defaulted D1=COMPLETED, D2=EscrowEventLog, D3=decoupled. Starting P0.
