# Food Hub — production-readiness audit

Running defect register for the Food Hub completion phase. Branch `audit/dispute-path`.
Opened 2026-08-06. Baseline at open: 1181 tests / 102 suites green.

Severity: **S1** money moves wrongly or silently · **S2** a user is told something untrue
· **S3** a workflow is awkward or incomplete · **S4** hygiene.

---

## Closed

### D1 · S2 · A concluded refund was reported as an open dispute
**Workflow** Buyer order list + detail; farmer order list + detail.
**Root cause** `OrderFulfillmentStatus.DISPUTED` is written in exactly one place —
`escrowSettlement`, when an administrator resolves a mediation *with a refund*. It records an
outcome. Four surfaces read it as "a dispute is under way".
**Effect** Wrong in both directions. The buyer who had won a dispute and already been refunded saw
a red "Disputed" pill and a timeline saying an administrator was still reviewing. An order
genuinely under review stayed `IN_FULFILLMENT` — filing a mediation deliberately does not touch the
order state machine — so it rendered an untroubled timeline and "Being prepared".
**Fix** Whether a review is live is a fact on `MediationRequest`, so `GET /api/orders` projects it
per row (one query per page, by party, which is the indexed side) and the timeline takes it the way
`orderEscrowState` always has.
**Measured impact** 13 refunded orders and 4 live escalations in the demo dataset were mislabelled.
**Regression risk** Low — projection is additive; verified live on both list and detail.
**Commit** `73dd71d`

### D2 · S2 · A failed payment read as "Awaiting payment"
**Workflow** Buyer order list.
**Root cause** Each pill was an if-chain over ONE status field ending in a catch-all
`return 'pending'`. `processCallback` sets only `paymentStatus` on failure and leaves fulfilment at
`AWAITING_PAYMENT`, so a fulfilment-only pill described a dead order as progressing. `REFUNDED`
likewise matched no branch and showed a concluded refund as amber "pending".
**Fix** The three copies became one module (`components/foodhub/orderPill.ts`) resolving state
through exhaustive `Record<Enum, …>` maps — a new status is now a compile error, not a silent
fall-through. This shape, not the individual branches, was the actual defect.
**Measured impact** 37 failed-payment orders in the demo dataset.
**Regression risk** Low — 12 new unit tests assert wording, not just state.
**Commit** `73dd71d`

### D3 · S1 · A buyer could release the escrow in the middle of their own dispute
**Workflow** Buyer confirms receipt.
**Root cause** `PATCH /api/orders/[orderId]/status` gated `RECEIVED` on
`fulfillmentStatus === IN_FULFILLMENT` alone. A contested order sits in exactly that state, so the
gate could not tell a disputed order from a quiet one.
**Effect** The buyer could pay the farmer out mid-dispute — the very thing under review — and
strand the case, because `settleEscrow` only settles funds still `PAID + IN_FULFILLMENT`.
**Fix** Open-mediation guard on the transition (409 `ORDER_UNDER_MEDIATION`); the buyer's screen no
longer offers a button the API will refuse and explains why instead.
**Regression risk** Medium — touches the happy path. Verified live: button present and working on an
ordinary in-flight order, withheld with an explanation on a contested one.
**Commit** `a6ba2fc`

### D4 · S1 · A refund that never happened was reported as done
**Workflow** Admin resolves a mediation.
**Root cause** `settleEscrow` reports refusal by **returning** `{ applied: false, reason:
'NOT_HELD' }` — it does not throw. The mediation route discarded the result and wrapped the call in
a try/catch that therefore caught nothing, having already written the `MEDIATION_RESOLVED` audit
row.
**Effect** An administrator choosing "refund the buyer" on funds no longer held got a success
screen, an audit trail recording a refund, and a closed case, while no money moved and neither
party was told. D3 was a live route to reaching that state. The escrow console has always checked
`result.applied` and answered 409 — the two call sites had drifted.
**Fix** Settle first, record the decision only if the funds moved. A refusal now answers 409 and
leaves the case open. `settleEscrow`'s held guard is compare-and-swap, so concurrent resolutions
still move funds once.
**Note** A test named *"is a clean no-op when the order is no longer in a held state"* had encoded
the silence as intended. Its no-side-effects half was correct and is kept; it now also asserts the
administrator is told and the case stays open.
**Regression risk** Medium — reordered a money path. 16 mediation tests green.
**Commit** `a6ba2fc`

### D5 · S1 · Two payout requests could be opened against one balance
**Workflow** Farmer requests a payout.
**Root cause** The one-open-request rule rested on a `findOne` followed by a `create`. Between the
read and the write there is a gap: two concurrent requests both saw no open request and both
measured themselves against the same unspent balance.
**Effect** A farmer could hold two open requests each for their full available balance; an
administrator approving both would pay out twice what was owed.
**Fix** Partial unique index on `farmerId` for `REQUESTED` rows — the same backstop
`MediationRequest` already uses. The route's read stays because it produces the clear message; the
index makes the rule true. Duplicate-key is translated back to `PAYOUT_REQUEST_PENDING` so the
farmer never sees "Duplicate entry".
**Verified before shipping** No farmer currently holds more than one `REQUESTED` row, so the index
builds cleanly on existing data.
**Regression risk** Low, but see O1 — the index must exist in production.
**Commit** `1cd8f00`

### D6 · S1 · A timed-out payment was assumed failed, and the buyer told their money was safe
**Workflow** Checkout, stuck-payment reconciliation.
**Root cause** The STK Push lifecycle has three legs — initiate, callback, **query**. Only two were
implemented. With no way to ask the provider what happened, `reconcileStuckPayments` treated a
missing callback as a failure.
**Effect** The order was marked `FAILED`, the produce returned to the marketplace, and the buyer
told *"No money left your account"* — none of it verified. A lost callback can sit on top of a real
debit, so under `daraja-*` this could take a buyer's money, tell them it was safe, and resell the
produce they had paid for.
**Fix** `PaymentProvider.queryPaymentStatus` returning `SUCCESS | FAILED | PENDING | UNKNOWN`.
Reconciliation asks first: a confirmed success is credited through the ordinary callback path, a
confirmed failure closes out as before, in-flight is left alone, and an unanswerable one becomes the
new `OrderPaymentStatus.UNRESOLVED` — produce stays reserved, buyer told the truth, admin asked to
settle by hand. Window cut 15 → 5 minutes, since the wide margin only existed to cover the guess.
**Regression risk** Medium-high — money path. 11 new tests; existing reconcile tests had never
reached the provider because their fixture had no checkout request id.
**Commit** `ad48261` · full reasoning in `context/payments-research/`

### D7 · S2 · A security control that only appeared to exist
**Workflow** Daraja callback.
**Root cause** `verifyDarajaSignature()` took a `Headers` and a body, ignored both, returned `true`.
The webhook called it as *"Step 1: Verify signature (always first)"*, and its comment described a
`WEBHOOK_SECRET` found nowhere else in the repository.
**Effect** No exploit — the real controls (IP allow-list in middleware, unique index on
`mpesaTransactionId`) were already in place. The harm was to review: anyone auditing this route
would believe it authenticated its caller and stop looking.
**Fix** Removed, with the actual controls documented in its place. Its test mocked it to return
`false`, so it only ever exercised its own mock.
**Commit** `63ddd87`

### D8 · S3 · Escrow reported itself but never explained itself
**Workflow** Buyer order detail.
**Root cause** The escrow block stated where the money was and rendered only while
`PAID + IN_FULFILLMENT`.
**Effect** No answer to what releases the money, what happens if produce never arrives, or when an
administrator steps in — and total silence in the two states most needing explanation: under review,
and just refunded.
**Fix** `EscrowExplainer`, keyed on `EscrowState`, both viewers, every state.
**Commit** `33fd660`

### D9 · S3 · A payment claimed to be paid, with nothing to check it against
**Workflow** Buyer order detail; receipt.
**Root cause** The M-Pesa receipt code was stored on every paid order but rendered only on the
receipt page. Separately, checkout called it *"M-Pesa receipt"* while the receipt page called it
*"Transaction reference"* — one value, two names, across two screens.
**Effect** Kenyan buyers verify a payment against the Safaricom SMS on their handset; that code is
the receipt they actually trust. An order screen reading "Paid" with nothing to match against asks
to be taken on trust, which is the opposite of what this platform is for.
**Fix** The code now sits under the payment pill on the order, with the simulation badge beside it
— a receipt code shown without saying where it came from is the exact implication `SimulationNotice`
exists to prevent. Both surfaces now use the handset's word.
**Regression risk** Low — additive projection plus a label change.
**Commit** `e6a2e78`

---

## Decision record · The payment and escrow posture

Recorded here because it is the question most likely to be asked and the answer is a designed
position, not a fallback. Full reasoning and sources: `context/payments-research/`.

**UmojaHub implements the control plane of a marketplace escrow system and simulates the custody
plane.** The control plane — derived escrow state machine, release gated on confirmed receipt,
two-sided adjudication, append-only audit of every custodial decision, settlement queue separating
*earned* from *paid* — is real and complete. The M-Pesa custody leg is simulated and disclosed.

**Why simulated, on two independent grounds:**
1. Production Daraja credentials require a registered business entity, a business KRA PIN and an
   active Paybill. Safaricom does not issue them to individuals.
2. **It would still be simulated with those credentials.** Holding third-party funds in Kenya is
   licensed activity under the National Payment System Act 2011, requiring CBK authorisation,
   segregated client accounts and a trust arrangement. Stripe draws the same line — it runs this
   control plane for much of the world's marketplace volume and still refuses to call it escrow.

**Rejected alternatives, with reasons:**
- *Nominal real KES 1 STK Push* — **not viable.** Sandbox cannot reach a real handset; reaching one
  needs the production access that was refused. It is not a partial alternative to production, it
  *is* production for one shilling. It would also be less honest: a real receipt for an amount
  unrelated to the order, and a real debit the escrow ledger does not account for.
- *Direct payment to the farmer, no hold* — rejected. It pays the farmer before delivery, which is
  the exact trust failure the platform exists to solve.

**The production path is not "switch on Daraja"** — it is to delegate custody to a CBK-licensed PSP
while keeping the control plane already built. Roadmap in `06_ACADEMIC_DEFENCE_AND_ROADMAP.md`.

**Standing constraint:** `PAYMENT_PROVIDER` defaults to `simulation`, so the Daraja query path
introduced in D6 is correct-by-construction and unit-tested but has never met the live API. Say so
plainly rather than implying otherwise.

---

## Open observations — not defects today

### O1 · Deployment · The new partial unique index must be built in production
Mongoose `autoIndex` builds it in development. Confirm it exists in the production database before
relying on D5's fix there; the route's read still catches the ordinary sequential case regardless.

### O2 · S4 · `releasable` is the only escrow aggregate not filtered on `paymentStatus: PAID`
`computeEscrowBalance` matches `grossReceived` and `held` on `PAID`, but `releasable`
(`escrow.ts:83`) matches on `fulfillmentStatus: COMPLETED` alone. **Unreachable today** — a refund
sets `DISPUTED`, and no path produces `COMPLETED` without `PAID`, confirmed against the live data
(only four state combinations exist). Left unchanged deliberately: churning a money aggregate for an
unreachable state carries more risk than it removes. Revisit if any new path can complete an order
that was not paid, because the documented invariant `grossReceived = held + releasable` depends on it.

**Re-checked when `UNRESOLVED` was added (D6).** That status was the first new member of
`OrderPaymentStatus` since this observation was written, so it was the obvious way to reach
`COMPLETED` without `PAID`. It cannot: an unresolved order stays at `AWAITING_PAYMENT`, and the
`RECEIVED` transition requires `IN_FULFILLMENT`. Still unreachable, still deliberately unchanged.

### O3 · S4 · E2E fixtures are present in the demo database
`E2E Sukuma Wiki — Grade A` from "E2E Farmer" (`…000010`) appears in the marketplace, and
`E2E-FAR-0002` carries an open mediation. Test-data hygiene in the dev database, not application
code; `npm run demo:reset` clears it. Worth clearing before any demo.

### O4 · Deployment · The Daraja query path has never met the live API
`queryPaymentStatus` is implemented against `/mpesa/stkpushquery/v1/query` and unit-tested, but
`PAYMENT_PROVIDER` defaults to `simulation`, so only the simulator's implementation has ever
executed. Correct-by-construction is not the same as exercised. If Daraja sandbox credentials ever
become available, running one real timed-out payment through it is the single highest-value
verification remaining on the payment path.

---

## Audited and closed

**Payment simulation · checkout · the STK callback · escrow · settlement · mediation · payouts ·
order state and status honesty.** Researched against production practice before changing anything
(`context/payments-research/`), then corrected: D1–D9 above. The engine was found to be closer to
production-grade than expected — real Safaricom result codes, a realistic failure distribution
including lost callbacks, one shared processor for both providers, a two-layer reconciliation sweep
— so it was corrected rather than rebuilt.

## Not yet audited

Listing creation and editing · farmer verification and the admin verification queue · ratings ·
trust score · price intelligence · suppliers · groups · knowledge · assistant · notifications and
email · responsive behaviour · **the farmer's and admin's own views of the workflows corrected
above** (the buyer's side has been driven in a browser; the farmer's and admin's have been read and
tested but not clicked through).
