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

### O3 · S4 · E2E fixtures are present in the demo database
`E2E Sukuma Wiki — Grade A` from "E2E Farmer" (`…000010`) appears in the marketplace, and
`E2E-FAR-0002` carries an open mediation. Test-data hygiene in the dev database, not application
code; `npm run demo:reset` clears it. Worth clearing before any demo.

---

## Not yet audited

Listing creation and editing · farmer verification and the admin verification queue · checkout and
the M-Pesa simulation callback · admin escrow console and payout approval · ratings · trust score ·
price intelligence · suppliers · groups · knowledge · assistant · notifications and email ·
responsive behaviour · the farmer's and admin's own views of the workflows corrected above.
