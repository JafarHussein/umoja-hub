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

## P1 — Admin release / refund on dispute (activates reserved states) ✅ DONE 2026-06-21
- [x] Added optional `outcome: RELEASE | REFUND | NONE` to `adminMediationDecisionSchema` (Zod; money outcome only valid with RESOLVED)
- [x] `api/admin/mediation-requests` PATCH `applyEscrowOutcome`: `REFUND` → atomic held-guard → `REFUNDED` + `DISPUTED` + `disputeFlaggedAt`/`disputeReason` + inventory restore (mirrors FAILED path)
- [x] `RELEASE` → completes the order (funds become farmer's); `NONE`/absent → order untouched; all outcomes audit-logged with outcome in details
- [x] (D2) `src/lib/models/EscrowEventLog.model.ts` — append-only HELD / RELEASED / REFUND_ISSUED; lazy-import; indexes on orderId/occurredAt/eventType/farmerId
- [x] `EscrowEventLog` rows written at: HELD (`processCallback` success), RELEASED (buyer confirms receipt in status route; admin RELEASE), REFUND_ISSUED (admin REFUND)
- [x] Tests: `escrowOutcome.test.ts` (5) — refund/release/no-op/plain-resolution/validation. Existing mediation tests unaffected (outcome defaults NONE)
- [x] GATE green — tsc clean, lint clean, 716 tests pass

## P2 — Admin escrow read model + dashboard ✅ DONE 2026-06-21
- [x] `src/app/api/admin/escrow/route.ts` — ADMIN GET: totals (held/releasable/in-dispute/refunded/settled) + paginated per-order ledger with derived `escrowState`; `state` filter (ALL/HELD/RELEASABLE/REFUNDED); pure aggregation over Order + MediationRequest + WithdrawalRequest
- [x] `src/app/dashboard/admin/escrow/page.tsx` — 5 totals cards + filterable ledger with escrow-state pills (read-only steward view; actions live on Mediation/Payouts)
- [x] "Escrow" nav entry added to `AdminShell` (after Payouts)
- [x] Tests: `escrow/__tests__/route.test.ts` (3) — guard, totals+ledger+derived state, cursor validation
- [x] GATE green — tsc clean, lint clean, 719 tests pass

## P3 — Party-facing surfaces (presentation only, `.theme-app`) ✅ DONE 2026-06-21
- [x] Farmer ledger — balance cards now Held in escrow / Releasable / Available (+ in-dispute note); per-payment EscrowPill (Held vs Releasable); escrow-framed copy
- [x] Farmer orders — detail modal shows "The buyer has paid; held in escrow, released on receipt" + a refunded note
- [x] Buyer orders list — "🔒 Payment protected in escrow" hint on held orders
- [x] Buyer order detail — escrow-protection card (held), refunded alert, confirm-receipt copy now states it releases funds
- [x] GATE green — tsc clean, lint clean, 719 tests pass (presentation-only)

## P4 — Notifications ✅ DONE 2026-06-21
- [x] HELD — payment-confirmation SMS in `processCallback` reframed for both parties ("held in escrow / protected, released on receipt")
- [x] RELEASED — new farmer SMS when the buyer confirms receipt (status route): funds released, available to request
- [x] REFUND_ISSUED — new buyer SMS on admin refund (mediation route): held funds refunded
- [x] RELEASE (admin) — new farmer SMS: funds released from escrow
- [x] All non-blocking via the existing `sendSMS` pattern (no test mocks, consistent with the payout route)
- [x] GATE green — tsc clean, lint clean, 719 tests pass

## P5 — Docs truth-up
- [ ] Update `src/components/website/topics/TopicPayments.tsx` — replace "There is no escrow" copy with held-pending-receipt model (website must keep building)
- [ ] Update `context/FOOD_HUB_ECOSYSTEM_MAP.md` failure-mode note (escrow now mitigates non-dispatch financially)
- [ ] Final full gate + `npm run build` green
- [ ] Commit per phase already done; final review pass

---

## Progress log
- 2026-06-21 — Checklist created; decisions defaulted D1=COMPLETED, D2=EscrowEventLog, D3=decoupled. Starting P0.
