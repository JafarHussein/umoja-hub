# 05 · Implementation checklist and testing strategy

Ordered highest priority first. Each task is executable without further design work.

Baseline at start: 1196 tests / 104 suites green, `tsc` clean, 0 lint errors.

## Execution status

| Task | Status | Commit |
|---|---|---|
| T1 · Query capability on the provider contract | **Done** | `ad48261` |
| T2 · `OrderPaymentStatus.UNRESOLVED` | **Done** | `ad48261` |
| T3 · Reconciliation asks before concluding | **Done** | `ad48261` |
| T4 · Justify the stuck-payment window (15 → 5 min) | **Done** | `ad48261` |
| T5 · Webhook authenticity | **Done, reduced scope** — the IP allow-list and replay protection already existed; what was wrong was a no-op `verifyDarajaSignature` that always returned `true`. See the correction to P2 in `04`. | `63ddd87` |
| T6 · One escrow explainer | **Done** | `33fd660` |
| T7 · Surface the M-Pesa receipt code | **Not started** — verify first how much `TransactionReceipt` already covers, since several checklist assumptions proved out of date. |
| T8 · Defence notes | **Done** (written with the research) | `52fb075` |
| T9 · Record in the Food Hub register | **Not started** |

At 1222 tests / 106 suites green. Two checklist items shrank once the code was read rather than
assumed — the pattern is worth carrying into the remainder.

---

## Phase 1 — Honesty under uncertainty (the critical path)

### T1 · Add a query capability to the payment provider contract
**Objective** Extend `PaymentProvider` with `queryPaymentStatus(checkoutRequestId)` returning a
discriminated `PaymentQueryResult` (`SUCCESS | FAILED | PENDING | UNKNOWN`).
**Why** The STK lifecycle has three legs; only two are implemented. Without the third, the platform
cannot know whether a timed-out payment was actually debited.
**Dependencies** None.
**Files** `src/lib/payments/types.ts`, `simulationProvider.ts`, `darajaProvider.ts`,
`src/lib/integrations/darajaService.ts`.
**Risks** Low — additive. Both providers must implement it or the factory breaks the type.
**Testing** Unit tests per provider: simulator returns `SUCCESS`/`FAILED` from the `SimulatedPayment`
row, `PENDING` before `deliverAt`, and **`UNKNOWN` for a `LOST` outcome** so the honest path is
exercised in simulation.
**Outcome** The contract matches the real API surface.

### T2 · Add `OrderPaymentStatus.UNRESOLVED`
**Objective** A terminal payment state meaning "we could not determine the outcome".
**Why** Today the only way to close a timed-out payment is to call it `FAILED`, which asserts the
buyer was not debited. That is unverifiable and, under real Daraja, sometimes false.
**Dependencies** None (but T3 consumes it).
**Files** `src/types/index.ts` (enum + `ORDER_PAYMENT_LABEL`), `Order.model.ts`,
`src/components/foodhub/orderPill.ts` (exhaustive `Record` — **will fail to compile until handled**,
which is the safety property working as designed), `orderEscrowState.ts`.
**Risks** Medium — touches an enum read in many places. The exhaustive maps make the compiler list
every site.
**Testing** `orderEscrowState` must map `UNRESOLVED` to `NO_FUNDS` (never releasable). Pill must
read "Payment unresolved", never "failed" or "pending".
**Outcome** The system can represent uncertainty.

### T3 · Make reconciliation ask before it concludes
**Objective** `reconcileStuckPayments` consults `queryPaymentStatus` before transitioning.
Branch: `SUCCESS` → process as a callback; `FAILED` → current behaviour; `PENDING` → leave;
`UNKNOWN` → `UNRESOLVED`, keep stock reserved, notify admin, do **not** tell the buyer their money
is safe.
**Why** The system currently tells buyers "No money left your account" without checking. This is the
single most important defect found.
**Dependencies** T1, T2.
**Files** `src/lib/payments/reconcile.ts`, `PaymentEventLog` (new event type), notification copy.
**Risks** Medium-high — money path, and it changes the meaning of an existing sweep. Guarded CAS
transitions must be preserved.
**Testing** One test per branch, including the regression: an order whose provider reports `SUCCESS`
must be **credited, not failed** — the limbo-payment case.
**Outcome** No unverifiable financial claims.

### T4 · Justify or shorten the stuck-payment window
**Objective** Re-derive `STUCK_PAYMENT_TIMEOUT_MINUTES` from evidence and document it.
**Why** The prompt lives ~30s; the researched sweeper window is ~5 minutes. 15 is unexplained.
**Dependencies** T3 (safe to shorten only once query exists).
**Files** `reconcile.ts`.
**Risks** Low.
**Testing** Existing reconcile tests, with the boundary adjusted.
**Outcome** A defensible number with a comment explaining it.

---

## Phase 2 — Authenticity

### T5 · Authenticate the Daraja webhook
**Objective** Secret path segment (`/api/webhooks/daraja/[secret]`) validated against env, optional
Safaricom IP allow-list, and a **unique index on `MpesaReceiptNumber`**.
**Why** An unauthenticated endpoint that marks orders paid is trivially defraudable under real Daraja.
**Dependencies** None.
**Files** `src/app/api/webhooks/daraja/`, `PaymentEventLog.model.ts` / `Order.model.ts`, `env.ts`.
**Risks** Medium — changing the callback URL must be coordinated with the Daraja portal. Keep the
old route answering 200 while logging loudly, so a stale registration never silently drops payments.
**Testing** Reject a wrong/absent secret; accept the correct one; a replayed receipt number must not
double-credit.
**Outcome** Spoofing and replay closed.

---

## Phase 3 — Comprehension

### T6 · One escrow explainer, used everywhere
**Objective** A single component answering: where the money is, what releases it, what happens if
delivery fails, when an administrator intervenes, what follows a dispute. Plain Kenyan English per
`03` §4.
**Why** The brief requires a user to understand escrow without explanation. Today they must infer it.
**Dependencies** None.
**Files** new `src/components/foodhub/EscrowExplainer.tsx`; buyer order detail, farmer order detail,
checkout.
**Risks** Low.
**Testing** Rendering tests asserting the five questions are answered for each escrow state.
**Outcome** Escrow becomes legible.

### T7 · Surface the M-Pesa receipt code prominently
**Objective** Show the receipt code wherever a payment is shown as complete, with the simulation
badge beside it where simulated.
**Why** Kenyan users treat the M-Pesa code as the receipt. A completion claim without one is distrusted.
**Dependencies** None.
**Files** receipt component, buyer order detail.
**Risks** Low.
**Testing** Assert the code renders and that simulated codes are labelled.
**Outcome** Matches the incumbent trust signal.

---

## Phase 4 — Documentation

### T8 · Defence notes and roadmap — `06_ACADEMIC_DEFENCE_AND_ROADMAP.md`
### T9 · Record the decision in the Food Hub defect register

---

## Testing strategy

**Unit** — provider query results per branch; `orderEscrowState` including `UNRESOLVED`; pill
wording; payload construction.
**Integration** — reconcile against a mocked provider for all four query outcomes; webhook
authenticity; duplicate-callback idempotency.
**Regression** — the whole existing suite must stay green; the money paths corrected in the earlier
Food Hub batch (open-mediation guard, settlement refusal, payout uniqueness) must be re-run.
**Manual, in-browser** — drive a real checkout in the seeded environment through the Payment Lab for
each outcome, and read the sentences on screen. Per the standing lesson: a green gate is not
verification.
**Principle** — every test asserts the *wording*, not only the state. Every defect in this programme
was a true value carrying a false sentence.
