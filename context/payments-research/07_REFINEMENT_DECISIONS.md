# 07 · Refinement decisions and status

Second programme over the payment and escrow system. The first built the architecture; this one
challenges it. Records what changed, what was already adequate, and what was deliberately left.

Gate at close of the second pass: **1232 tests / 106 suites**.
Gate at close of the **third pass** (below): **1259 tests / 108 suites**, `tsc` clean, 0 lint errors,
build green.

---

## I3 · Why polling — a choice, not a limitation

The waiting screen polls `GET /api/orders/[orderId]/payment-status` every few seconds. The panel
should hear this as a decision.

**Server-Sent Events and WebSockets are both available to us.** Vercel Functions support WebSockets
on Fluid Compute, and SSE works on the Node runtime with no configuration. So this is not a case of
reaching for the only thing that worked.

Polling was chosen because it fits the shape of the problem:

1. **The wait is short, bounded and terminal.** An STK prompt lives about 30 seconds and the whole
   session resolves within minutes into one of a few final states. A persistent connection is
   built for open-ended streams; this is a question with an answer coming shortly.
2. **The network is the constraint that matters here.** Buyers are on Kenyan mobile data, often on
   low-end handsets, and they background the app to read the M-Pesa SMS — which is a required step
   in the flow. A dropped poll self-heals on the next tick with no state to rebuild. A dropped
   socket needs reconnection, backoff and replay of anything missed while it was gone. Polling is
   more robust precisely where this product is used.
3. **A held connection is not free.** Fluid Compute bills active CPU and provisioned memory; an
   idle socket still occupies an instance for the length of a payment. A cheap indexed read every
   few seconds costs less than holding a connection per waiting buyer.
4. **The poll is load-bearing, and a push model would not remove that need.** It is the timely
   trigger for two lazy jobs — delivering due simulated callbacks, and reconciling this order if
   its payment has timed out — because Vercel Hobby permits only a daily cron. The buyer watching
   their own payment is exactly the right moment to check on it, and the work is scoped to their
   order. A push architecture would still need a separate scheduler to do this.

**What changes at scale:** nothing in the payment architecture. The provider abstraction, the
shared callback processor and the event log are all transport-agnostic. Moving the waiting screen
to SSE would replace one route's delivery mechanism and leave the state machine untouched. The
reconciliation trigger would move to a real cron, which is the actual prerequisite.

---

## What changed in this programme

### I1 · Outcome probabilities became demonstration profiles *(`78bd645`)*
The simulator carried a fixed 75/10/5/5/3/2 weighting. Asked "why 75%?", there was no honest
answer — UmojaHub has never observed a real M-Pesa population and Safaricom does not publish one,
so any figure lends false authority to a number nobody measured.

Replaced with five named profiles — `HAPPY_PATH`, `TYPICAL`, `NETWORK_TROUBLE`, `PAYMENT_FAILURE`,
`RECONCILIATION_DRILL` — each carrying a `purpose` naming the workflow it exists to exercise. A
test asserts every profile has one, so no weight can be added without a stated reason. The Payment
Lab shows the active profile and its purpose **directly above the outcome mix it produces**.

The framing that makes this defensible: a profile answers *"which workflow do I want to exercise?"*,
never *"how often does M-Pesa fail?"*. This is how providers ship their own sandboxes — Stripe and
Safaricom hand you instruments that force specific outcomes rather than a generator claiming to be
the real network.

### I12 · Unresolved payments got an admin surface *(`e0495c6`)*
The previous programme introduced `UNRESOLVED` and notified administrators to "settle it by hand"
with nowhere to go. They now have a queue at the top of the Payment Lab, above every other list,
carrying the **checkout reference** — the thing actually needed to search the M-Pesa statement.
Deliberately read-only: a button that moves real money needs a designed workflow and its own audit
trail, and a queue that cannot lie is worth more than an action that has not been thought through.

### I6 · The buyer stopped being texted what Safaricom already told them *(`f21a81e`)*
One successful payment fired six messages. The buyer's SMS was pure duplication — they entered
their PIN seconds earlier and Safaricom had already sent the authoritative receipt. It cost money
and taught people that our messages repeat what they know, which is how a channel stops being read.

The farmer's SMS stays and is the most valuable message in the system: they are not party to the
STK push, Safaricom tells them nothing, and theirs is the only immediate signal that money arrived
and the dispatch clock started. Asserted in a test, because the previous behaviour passed every
test in the suite.

### Regression found and fixed *(`090219c`)*
Found while writing I3, by re-reading a route the last programme had already changed. The buyer's
waiting screen answered a hardcoded `FAILED` whenever its poll triggered reconciliation. True while
reconciliation had one ending; false since it gained three. A recovered payment — real debit, lost
callback — was reported as failed **on the screen the buyer was watching**. It now re-reads the
order, as the delivery branch twenty lines below always did.

---

## Already adequate — challenged and left alone

| # | Improvement | Finding |
|---|---|---|
| I2 | Define LOST properly | Already models a real failure: callback lost after successful authorisation. Documented in `02`; the simulator answers `UNKNOWN` for it rather than `FAILED`, so the honest path is exercised in simulation. |
| I5 | Receipts | Real 10-character format, `SimulationNotice` on every payment surface, code surfaced beside the paid claim, one vocabulary across checkout and receipt. |
| I8 | Fraud and trust | Replay stopped by a unique sparse index on `mpesaTransactionId`; IP allow-list in middleware ahead of the handler; append-only `PaymentEventLog`, `EscrowEventLog`, `AdminAuditLog`. A fake signature check was found and removed (`63ddd87`) — worse than absent, because it stopped anyone looking for the real control. |
| I9 | Stock reservation | Reserved by compare-and-swap at checkout; restored on failure, on refund, and by reconciliation. Timeout now 5 minutes, justified against the ~30s prompt life. **Deliberately not restored on `UNRESOLVED`** — if the buyer was debited, the produce is theirs. |
| I10 | Reconciliation | Models pending → provider query → recovered / confirmed failed / still pending / unresolved → administrator escalation. Built in the previous programme. |
| I13 | Why we simulate | `06_ACADEMIC_DEFENCE_AND_ROADMAP.md` plus the decision record in the Food Hub register. Two independent grounds: no production credentials, and custody is licensed activity under the NPS Act 2011 regardless. |

---

## Not done, and honestly so — *closed in the third pass*

The four items below were left open at the close of the second pass. All four are now built. What
each one turned out to require, and what looking for it uncovered, is recorded in the next section.

- ~~**I4 · Escrow visible to the farmer.**~~ Done.
- ~~**I7 · Payment timeline as a single component.**~~ Done.
- ~~**I11 · Event log fields.**~~ Done.
- ~~**I12 (rest) · Escrow totals, payments awaiting callback, reservations nearing expiry.**~~ Done.

**The honest summary of the second pass:** four of the thirteen improvements produced real changes,
six were already adequate when challenged, and three remained. One regression was found in work
from the previous programme. Claiming all thirteen were "done" would be the kind of statement this
audit exists to prevent.

---

# Third pass — closing the four open items

## I4 · Escrow visible to the farmer *(`997b337`)*

`EscrowExplainer` already handled both viewers and every state; only the buyer's order used it. The
farmer had two hand-written blocks covering two of the six escrow states, so the screen fell silent
in exactly the two farmers chase us about — an order under review, and one whose money has cleared
but has not been paid out. Neither block said what would release the funds.

One component, both sides. Verified in the browser as a seeded farmer: an order the buyer has
confirmed now reads *"KSh 123,422 is yours. Naliaka confirmed the produce arrived"* and names the
payout request as the thing that moves it — where previously it said nothing at all.

## I7 · One journey, three renderings *(`e3dbe8a`)*

The compact row, the detailed spine and the narrated payment session each derived the stages of an
order for themselves, and had drifted: the same moment was *"Paid — held in escrow"* in one and
*"Payment confirmed"* in another, only one named the party being waited on, and where a payment had
actually got to appeared solely on the screen a buyer watches while paying. A farmer or an
administrator looking at a stalled order saw *"Awaiting M-Pesa confirmation"* whatever had really
happened.

`lib/foodhub/orderJourney.ts` is now the single derivation; the renderers only draw. Every stage
carries what it is, when, why it is where it is, who has to act, and how far along the order is —
the five things I7 asked for, uniformly, for all three viewers. Pure and tested directly, which the
duplicated branches never were.

The receipt's event trail is deliberately **not** folded in. It is a replay of the append-only logs,
not a projection of the order, and the two must be able to disagree — that disagreement is what
would expose a bug in the projection.

## I11 · The event log says who, from what, to what, and why *(`09b545a`)*

`PaymentEventLog` recorded what happened and when. It could not say who caused it, what the payment
moved from and to, or why — so replaying it told you a payment failed without telling you whether
the buyer cancelled, the prompt expired, or we closed it out ourselves.

Adds `actor`, `previousStatus`, `newStatus`, `reason`, `correlationId`, populated at every write
site, plus a sparse index on `(correlationId, occurredAt)` because replaying one payment session is
where an investigation starts. All five are optional **by design**: this is an append-only financial
log, and rows written before the fields existed are still true. They are not backfilled to look as
though they carried them, and readers treat absence as "not recorded", never as a default. Confirmed
on the admin feed, where historic rows render without the new columns rather than with invented ones.

Two things fell out of wiring it:

- A buyer cancelling an unpaid order moved it to `FAILED` and returned the produce **while writing
  nothing to the payment trail**. The log showed an order that had failed with no event that failed
  it — indistinguishable from one the network killed.
- The receipt attributed every payment event to M-Pesa. The act that moves money is a PIN entered on
  a handset, and reconciliation closes payments out on nobody's instruction; the trail was crediting
  the network with the buyer's decisions and ours.

`processStkCallback` — the single definition of what a payment does, fed by both providers — had no
direct test. It has one now.

## I12 (rest) · What is held, and what is running out of time *(`62acdd2`)*

The Lab counted events and never said how much of other people's money the platform was holding —
the first question an auditor asks and the number a float has to cover. It was derivable one farmer
at a time and so in practice unanswerable. `computePlatformEscrowPosition` uses the *same*
definitions as the farmer-facing balance, deliberately: a second reading of "held" that drifted from
the one farmers see would be worse than not having it. Live figures on the seeded environment:
KSh 1,347,081 held across 40 orders, KSh 57,416 of it blocked by a review, KSh 3,963,316 cleared and
awaiting payout.

The awaiting-payment queue now sorts **oldest first** — it sorted newest-first, which is the wrong
end, since the row that needs an operator is the one that has waited longest, and with a cap of 15
those were the rows falling off the list. Each row shows how long its session has been silent and
whether reconciliation is due. Those orders each have produce reserved behind them, so this is also
the reservations-nearing-release list, an inventory consequence previously derivable only from a
timeout constant in the source.

---

# Final validation — reading it as an examiner

The gate stayed green through all of this. Four defects were found anyway, three of them only by
opening the screens as each role. They are listed because the pattern matters more than the fixes:
**tests assert values; they do not read sentences.**

### 1. The platform contradicted itself about a buyer's money *(`11edf6d`)* — the serious one

`orderEscrowState` mapped `UNRESOLVED` to `NO_FUNDS`, whose buyer copy reads *"Nothing has been
taken from your account yet."* That was rendered on the buyer's own order page, on the one order
whose notification had just told them to *check their M-Pesa messages, because the money may well
have gone*.

This is the exact claim the whole reconciliation rebuild exists to avoid making, contradicted on the
screen the buyer actually looks at. **Not knowing is not the same as knowing nothing was taken.**

`EscrowState.UNKNOWN` makes the difference a state rather than a collapse. Because the maps that
switch on `EscrowState` are exhaustive, the receipt, the admin ledger and the explainer each had to
say what they mean by it — no surface can collapse it into a claim by accident again. The explainer's
copy is written to survive being wrong in either direction and names the one mistake available to a
buyer here: do not pay twice. An administrator cannot settle it either, deliberately — releasing or
refunding money the platform cannot confirm it received is not a decision to offer.

### 2. The journey told the reader to act on the screen telling them not to *(`11edf6d`)*

The payment stage named the buyer as the party to act on an `UNRESOLVED` payment, beside a sentence
asking them not to pay again. It is UmojaHub acting there — we are the ones checking the M-Pesa
record by hand.

### 3. Two sentences that claimed things they could not know *(`e732bdd`)*

Both caught by reading the rendered page:

- A completed order told the **farmer** *"they can now request a payout"* — about the farmer.
- The closing stage read *"Held by UmojaHub until you confirm receipt"* whatever the payment had
  done, so a failed order — and one whose payment we cannot confirm — both asserted custody of money
  we may never have received. Now conditional until the money genuinely is held.

### 4. A number that could not be true *(`e732bdd`)*

The Lab showed **72 cancelled against 39 failed**, when cancellations are a subset of failures.
Result code 1032 was counted on every event row and a cancellation writes two of them. Now 36 of 39,
which is coherent. This is the kind of figure a panel does arithmetic on in the room.

---

## Standing after three passes

Thirteen improvements: **eight produced real changes**, five were challenged and found already
adequate. Three programme regressions and four fresh defects were found in work this programme had
itself just approved — which is the argument for the passes, not against them.

**What is still not done, and should be said out loud:**

- **No administrator action on an unresolved payment.** The queue shows them and carries the
  checkout reference to search the M-Pesa statement with; settling one is still done by hand,
  outside the platform. A button that moves real money needs a designed workflow and its own audit
  trail, and a queue that cannot lie is worth more than an action that has not been thought through.
- **`UNRESOLVED` has no metric**, only a live queue. "How often does this happen?" currently has no
  number on the page.
- **Reconciliation still rides the buyer's poll plus a daily cron**, because Vercel Hobby permits one
  cron a day. This is documented in I3 as a deliberate trade, not an oversight, and a real scheduler
  is the prerequisite for moving the waiting screen to SSE.
