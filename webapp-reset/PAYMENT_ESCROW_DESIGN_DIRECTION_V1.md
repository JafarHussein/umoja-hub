# PAYMENT & ESCROW — DESIGN DIRECTION V1

Owner directive, 2026-08-17: the payment and escrow surfaces work but read as generated. This
document is the audit and the direction. It governs the presentation layer only. The payment
architecture, state machine, models, reconciliation and audit trail are untouched except where the
audit found a genuine workflow defect, listed in §6.

Authority: `UMOJAHUB_WEBAPP_FOUNDATION_V1.md` (§2 restraint, §3.2 honesty is an interface law,
§3.5 status always visible, §10 progressive disclosure, §11 the decision comes first).
System: `DESIGN_SYSTEM_V1.md` / `src/components/app/*` on `.theme-app` tokens. No new visual
language, no new colour, no new type scale.

---

## 1. What is actually wrong

Not "it needs better styling". Five structural faults, each traced to a screen.

### F1 · Every fact is a card, so no fact is more important than another

`dashboard/buyer/orders/[orderId]` renders, top to bottom, **ten bordered containers**: header,
mediation alert, escrow explainer, refund alert, latest-from-farmer, timeline, order details,
receipt link, action zone, mediation panel, problem-with-order, rating. Each carries its own
`app-label` micro-heading. A card is elevation, and elevation means "this is a group". Twelve
groups on one screen means none of them is a group.

This is the specific thing that reads as generated: the page is a list of components rather than
one document about one transaction.

### F2 · The money is not the loudest thing on the money screen

On the buyer's order the H1 is the **crop name**. The amount appears once, as a row inside "Order
details", set in `app-data-m` (13px) — the same size as the quantity beside it. The type scale
already contains `app-data-xl` (30px tabular mono) and no payment surface uses it.

A person opening this screen is asking "where is my money". The screen answers with "Tomatoes".

### F3 · The same fact is stated two and three times

Real duplication, not stylistic repetition:

| Fact | Said by |
|---|---|
| Payment status | `paymentPill` **and** `orderStatusPill`, rendered side by side. On a FAILED or REFUNDED order `orderStatusPill` returns `paymentPill`, so the screen shows **two identical pills**. |
| The order was refunded | `EscrowExplainer` REFUNDED copy, **and** a separate `Alert tone="warning"` directly beneath it. |
| The farmer dispatched | The "Latest from {farmer}" card, **and** the timeline's `dispatched` stage. |
| What releases the money | `EscrowExplainer.releasedBy`, **and** the timeline's `released` stage explanation, **and** the checkout panel's three-step escrow list. |

### F4 · Technical vocabulary sits at the top level instead of behind disclosure

"Session", "STK push sent", `mpesaCheckoutRequestId`, provider name and result codes are surfaced
at the same level as the amount. Foundation §10 makes progressive disclosure the universal
mechanism, and the implemented component library has **no disclosure primitive at all** — which is
why everything ended up flat.

### F5 · Emoji standing in for iconography

`🔒` appears on the checkout panel, the escrow explainer and the farmer's ledger pill. It renders
differently on every platform, carries no semantic role, and is decoration on a money surface.

Distinct from the geometric glyphs (`✓ ◷ ⊘ ◑`) in `StatusPill`, which are **redundant encoding for
colour** and are required by Foundation §3.4. Those stay.

---

## 2. The organising idea

**One transaction surface, read top to bottom, in the order a person asks the questions.**

Not a dashboard of panels. A statement about one payment, of the kind a bank produces, with the
detail folded away until asked for.

Every money screen gets the same four zones, in this order, separated by whitespace and hairlines
rather than by cards:

```
1. THE STATEMENT      how much, where it is, what proves it
2. THE NEXT STEP      the single thing this person can do now, or nothing
3. THE JOURNEY        the whole lifecycle, current position marked
4. THE DETAIL         everything else, disclosed
```

Zone 1 is loud. Zone 2 is the only place a button may appear. Zone 3 is quiet and complete.
Zone 4 is closed by default.

A card is permitted only where elevation carries meaning — a genuine sub-document (the receipt
itself, a mediation case with two parties' accounts). Nowhere else.

---

## 3. Zone 1 — the statement

The amount in `app-data-xl`, tabular mono, ink. One sentence under it saying where that money is,
in the words the buyer would use. Under that, the evidence: the M-Pesa receipt code in mono, and
the simulation disclosure where it applies.

```
Amount paid
KSh 13,812
Held by UmojaHub until you confirm the produce arrived.
M-Pesa receipt QK4H7T2M9P · Simulated payment
```

**One status sentence, not a row of pills.** The `orderStatusPill` + `paymentPill` pair collapses
to a single sentence plus at most one pill. The sentence is the escrow explainer's headline, which
already exists, already handles both viewers and every state, and was previously buried in a card
halfway down the page.

The label above the amount changes with the reader and the state, because "Amount paid" is wrong
for a farmer and wrong for a refund: *Amount paid · Amount refunded · You will receive · Payment
not completed*.

---

## 4. Zone 2 — the next step

At most one action zone per screen, holding the single most consequential thing this person can do
now. Title, one sentence of consequence, one button.

If there is no action, the zone does not render. It is never a card with an empty state inside it.

The consequence sentence must say what the button does to the money: *"Confirming releases your
KSh 13,812 to Kavata. Check the produce first."*

---

## 5. Zone 3 — the journey

`OrderTimelineDetailed` already derives from one source (`lib/foodhub/orderJourney.ts`) and already
carries label, timestamp, explanation, actor and status per stage. It does not need redesigning; it
needs **promoting**. It comes out of its card and becomes the spine of the page.

The current stage is the only prominent one: ink text, brand marker. Completed stages are quiet.
Future stages are `text-app-faint`. That contrast is what makes a timeline readable at a glance,
and it is already implemented.

---

## 6. Zone 4 — the detail

A native `<details>` disclosure primitive (`Disclosure`) is added to the app library, because
Foundation §10 requires progressive disclosure and the library does not have it. Native `<details>`
gives keyboard operation, screen-reader semantics and no-JS operation for free.

Three standard disclosures on a money surface:

- **Order details** — crop, quantity, unit price, farmer, placed date
- **Payment details** — receipt number, escrow reference, method, provider, requested at,
  confirmed at, checkout session id
- **If something goes wrong** — the escrow explainer's `ifItGoesWrong`, plus the route to mediation

Contents use the existing `DataList variant="split"` primitive, which is exactly the card-less
hairline-divided label/value list all three screens currently hand-roll for themselves.

---

## 7. Defects the audit found (engineering, not presentation)

The directive permits engineering changes where the UI audit finds a genuine product defect. Four.

### D1 · Checkout tells the buyer nothing was charged, then invites a second payment · **serious**

`CheckoutPanel` polls for 90 seconds, then sets `state: 'timeout'` and renders:

> "No confirmation arrived from M-Pesa. Nothing has been charged - you can try again."

Neither half is safe. After 90 seconds the platform does not know whether the buyer was charged —
that is the entire reason `UNRESOLVED` and reconciliation exist. And "Retry" from this state calls
`handleRetry()`, which clears `orderResult` and returns to `idle`, so the next submit **creates a
second order and a second STK push**. A buyer who entered their PIN at second 89 pays twice.

Fix: the poll window ending is a fact about *our watching*, not about the payment. It now says so,
and the way forward is the order itself (where the poll continues and reconciliation runs), not a
fresh checkout.

### D2 · Two identical status pills

Covered in F3. `orderStatusPill` returns `paymentPill` for FAILED and REFUNDED, and the buyer's
order detail renders both.

### D3 · The 90-second bar implies the payment expires

A depleting progress bar next to "Waiting for confirmation" reads as a deadline on the payment. The
real STK prompt lives about 30 seconds and the payment session outlives our poll. The bar is
replaced by the recorded event list, which is a fact rather than an implication.

### D4 · The live session log cannot see the reason the log now records

`GET /api/orders/[orderId]/payment-status` narrates events by selecting only
`eventType, resultCode, occurredAt` and deriving detail from `RESULT_CODE_DETAIL`. The
`reason` field added to `PaymentEventLog` in the previous programme is never read, so the waiting
screen says less than the receipt does about the same event.

---

## 8. Copy law

Foundation §4.3 names "the em-dash crutch" as AI-design slop. New and rewritten copy on these
surfaces uses none. Existing copy elsewhere is not swept in this pass.

Vocabulary, fixed once:

| Never | Always |
|---|---|
| Escrow state HELD | Held by UmojaHub until you confirm |
| STK callback received | M-Pesa confirmed your payment |
| Payment session | (behind disclosure, as "Checkout session") |
| Funds released | Released to the farmer, it has cleared |
| Something went wrong | the specific failure, and what it means for the money |

Every failure state answers three questions in order: **what happened, what it means for my money,
what I do next.**

---

## 9. Admin is a different product

The buyer and farmer surfaces get calm. The admin escrow console does not: Foundation §9 calls for
"dense done well". Its problem is not density, it is that five equal summary cards give equal
weight to money in custody and money already paid out.

Direction: custody first and largest (what the platform owes), the rest as a quiet figure row.
Triage before ledger: what needs a decision today, above what merely exists.

---

## 10. What the build found that the audit did not

Three things only became visible once the screens were opened as each role. They are recorded
because the pattern is the point: **the gate stayed green throughout, and none of these would have
been caught by reading the diff.**

### The duplication fault came back in a new form

With the escrow narrative promoted into the statement, the rendered buyer order said
*"Held by UmojaHub until…"* **three times**: once in the statement, once on the timeline's payment
stage, once on its release stage. Fixed by dividing the labour properly rather than by deleting
copy: the **statement** says where the money is, the **timeline** says what happened and what is
next, the **next step** says what the button does. So the paid stage now carries only its timestamp,
and the release stage says *"Released to the farmer when you confirm receipt"* rather than restating
custody.

### Two instructions for one act

The timeline told the buyer *"Check the produce, then confirm receipt"* while the action zone beside
it said *"It is released to the farmer only when you confirm…"*. The timeline now names who is being
waited on; the instruction lives on the button, where it can be acted on.

### An e2e spec was asserting the D1 defect on purpose

`checkout.spec.ts` asserted `/nothing has been charged/` after the poll window, and its own comment
defended the copy as *"what a buyer needs to know before deciding to retry"*. The spec was rewritten
around the corrected behaviour, and a second test added for the case the old one was conflating: an
**established** failure, where "nothing was charged" is a fact and returning to the form is safe.

---

## 11. Verification

- **Gate**: `tsc` clean, 0 lint errors, **1255 unit tests / 108 suites**.
- **e2e**: 13 payment/escrow specs pass (checkout, farmer orders, farmer ledger, buyer mediation,
  payment lab). `admin-payouts` and `admin-mediation` fail, and were confirmed by `git stash` to
  fail identically on the pre-change tree: **pre-existing, unrelated**.
- **Read as each role** in a real browser: buyer order, farmer order modal, farmer ledger, admin
  escrow. Every sentence read, not just rendered.
- **Dark**: the theme's dark value-map is inert in the app today (applied by class, nothing sets it),
  so it was flipped on manually. The redesign uses only semantic tokens, and the amount resolves to
  `#F3F1EA` on `#15140F` (~15:1).
- **Mobile** at 375px: horizontal overflow measured at **0px**; hierarchy holds, 44px targets.

---

## 12. The listing page (swept 2026-08-17)

The marketplace listing page explained escrow **three times**: "Your protections" carried it in
full, the checkout panel opposite repeated it in its own words, and a line under the pay button read
*"Secure M-Pesa checkout · no platform fee"* — whose fee half was already a row in the order summary
directly above it.

One telling now, in **"Your protections"**, which is where the marketplace direction assigns it:
the Opportunity Review layer explains *"recourse mechanisms · payment protection"* because that is
where the buyer decides. It also carries two protections the checkout footnote never did (verified
identity, mediation). The panel opposite says nothing about escrow — the promise becomes concrete
after payment, and the confirmed state says it there.

The three items lost their per-row icons (including the padlock emoji, F5) and were rewritten into
the same vocabulary the buyer meets on the order afterwards, so one mechanism is described one way
from the marketplace through to release.

**Not swept:** `components/website/topics/*` also describe escrow. That is the public website, which
is out of scope and shipped.

### A defect the sweep turned up

The price-fairness block rendered as a plain white card on the warm canvas. It was not empty, it was
**loading**. `.skeleton` builds its shimmer from `--surface` and `--surface-raised`, and both resolve
to `--c-white` — a white-on-white gradient, so the animation runs and nothing moves. Every app screen
with a loading state was showing a flat rectangle instead of something arriving. Now bound to the
app's own surfaces.

---

## 13. What is deliberately not changing

- The payment state machine, provider abstraction, callback processor, reconciliation, event log.
- `orderJourney` derivation and `EscrowExplainer` copy logic. Both are recent, tested, and correct.
  They are re-placed, not rewritten.
- `SimulationNotice`. The disclosure stays exactly as prominent as it is: visible on every payment
  surface, never a full-width banner. Directive §Simulation transparency.
- Mediation, ratings, payouts. Adjacent, not in scope.
