# 07 · Refinement decisions and status

Second programme over the payment and escrow system. The first built the architecture; this one
challenges it. Records what changed, what was already adequate, and what was deliberately left.

Gate at close: **1232 tests / 106 suites**, `tsc` clean, 0 lint errors.

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

## Not done, and honestly so

- **I4 · Escrow visible to the farmer.** `EscrowExplainer` handles both viewers and every state, but
  is wired only into the buyer's order. The farmer's side still needs it. *Largest remaining gap.*
- **I7 · Payment timeline as a single component.** The pieces exist — `OrderTimeline`, the narrated
  payment session, the receipt's event trail — but they are three renderings rather than one, and
  actor/reason are not shown uniformly.
- **I11 · Event log fields.** `PaymentEventLog` records type, actor, amount, provider, result code
  and correlation id. It does **not** record previous state, new state, or a reason string. Adding
  those is a schema change to an append-only financial log and deserves its own pass.
- **I12 (rest).** Only the unresolved queue was built. Escrow-holding totals, payments awaiting
  callback and reservations nearing expiry are not surfaced.

**The honest summary:** four of the thirteen improvements produced real changes, six were already
adequate when challenged, and three remain. One regression was found in work from the previous
programme. Claiming all thirteen were "done" would be the kind of statement this audit exists to
prevent.
