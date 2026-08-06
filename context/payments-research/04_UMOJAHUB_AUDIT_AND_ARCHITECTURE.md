# 04 · Audit of the current implementation, options compared, recommended architecture

Deliverables 5, 6 and the administrator scope. Written after the research, against the code.

---

## 1. Headline finding, stated plainly

**The brief's premise is partly out of date.** The brief describes a payment simulation that "does
not accurately communicate how a real payment journey works" and an escrow experience that is
"fragmented". Measured against the research, the *engine* is already close to production-grade, and
several things the brief asks for already exist. Recommending a rebuild would be wrong and would
destroy working, well-reasoned code.

What is genuinely missing is narrower, deeper, and more interesting than a rebuild:

1. **The STK lifecycle's third leg — query/verify — does not exist**, and its absence causes the
   system to make a financial claim it cannot substantiate. *(Critical.)*
2. **The callback endpoint is unauthenticated**, so under real Daraja it would be spoofable.
3. **The regulatory position is undocumented**, which is the panel's hardest question.
4. Escrow is *stated* well but not *taught* — a user is told where the money is, not what governs it.

---

## 2. What is already correct — do not touch

| Component | Assessment |
|---|---|
| `PaymentProvider` abstraction (`types.ts`) | Correct. Provider-agnostic downstream; `initiatePayment` correctly returns a dispatch acknowledgement, not an outcome — the single most common integration error, avoided. |
| Simulated result codes (`types.ts`) | **Verified against Safaricom's real codes**: `0`, `1`, `1032`, `1037`, `1001`, `1025`, with matching `ResultDesc` wording. Research-accurate. |
| Callback payload construction (`callbackPayload.ts`) | Builds genuine Daraja-shaped payloads including `CallbackMetadata` items. Simulator and real webhook feed the *same* processor — so the order system cannot tell which produced the event. Excellent design. |
| Outcome distribution (`simulationConfig.ts`) | Models a healthy-but-imperfect population (75% success, insufficient funds, cancellation, timeout, network failure, **lost callbacks at 2%**) with realistic delay buckets and a duplicate rate. This is operational realism, not a happy-path mock. |
| `processStkCallback` | Single source of truth, idempotent, shared by both providers. Correct. |
| `reconcileStuckPayments` | Matches the researched two-layer pattern: lazy per-order poll + daily cron backstop, guarded compare-and-swap transition, idempotent, returns inventory, writes a `RECONCILED` event. Genuinely good — and see §3 for its one flaw. |
| Escrow projection (`orderEscrowState`) | Derived, never stored — matches the researched principle. Correctly separates `HELD_UNDER_REVIEW` from `REFUNDED`. |
| `settleEscrow` | Single implementation of moving held funds, compare-and-swap held guard, append-only `EscrowEventLog` naming the acting admin, returns inventory on refund. Correct. |
| Payout queue (`WithdrawalRequest`) | Correctly separates *released* from *paid out*, as the research requires. |
| Two-sided mediation | Both parties can escalate and both give an account — matches the researched adjudication principle. |
| `SimulationNotice` | Honest, prominent, precise about what is real and what is not. This is exactly right and is a trust asset. |
| Payment session narration (`payment-status`) | Already returns the real `PaymentEventLog` stream so checkout narrates recorded events rather than animating a guess. Much of the brief's "payment journey should feel alive" is **already built**. |

## 3. Defects and gaps

### P1 — CRITICAL · No query/verify leg; the system asserts an unverifiable financial fact

`PaymentProvider` exposes only `initiatePayment`. There is no `queryPaymentStatus`, and
`darajaProvider` wraps only `initiateSTKPush`. So when a callback never arrives,
`reconcileStuckPayments` **assumes failure** after 15 minutes, marks the order `FAILED`, returns
the stock, and tells the buyer:

> "No money left your account — you can try paying again from the order."

Under the simulator this is safe, because the simulator *is* the source of truth and a `LOST`
outcome genuinely means no debit. **Under `daraja-sandbox` or `daraja-production` it is a false
statement of fact.** The research is explicit that a lost callback may sit on top of a real debit —
"limbo payments". The platform would be telling a buyer their money is safe while it is gone, and
returning the produce to sale.

The fix is the researched one: extend the provider contract with a query capability, consult it
before declaring failure, and — where the answer is unknown — say *unknown* rather than *failed*.

### P2 — ~~HIGH~~ **CORRECTED TO LOW** · Webhook authenticity was already in place

**This finding was overstated when first written, and is corrected here rather than quietly
edited.** The audit initially recorded the webhook as unauthenticated. Checking the code before
acting showed otherwise:

- **IP allow-listing exists and is enforced** — `src/middleware.ts` holds Safaricom's published
  callback ranges and rejects anything else on `/api/webhooks/daraja` in production, *before* any
  other handling of the route.
- **Replay protection exists** — a unique sparse index on the order's `mpesaTransactionId`, checked
  first by `processStkCallback`, which no-ops cleanly on a repeated receipt number.
- **HTTPS is enforced by Daraja itself**, which refuses plain-HTTP callback URLs.

Two of the three controls proposed were therefore already built. What was genuinely wrong was
smaller and more insidious: `verifyDarajaSignature()` took a `Headers` and a body, ignored both,
and returned `true`, while the route called it as *"Step 1: Verify signature (always first)"*. Its
own comment described a `WEBHOOK_SECRET` shared secret that appears nowhere else in the repository.
A control that only appears to exist is worse than an absent one, because it stops anyone looking
for the real one. Removed, with the actual controls documented where the fake one used to be.

*Lesson recorded deliberately: the first audit pass asserted a vulnerability from the route file
alone. Reading the middleware first would have got it right.*

### P3 — HIGH · The regulatory position is nowhere in the repository

No document states that holding funds requires CBK authorisation, or why the simulation is the
*correct* posture rather than a compromise. This is the panel's hardest question and the answer is
strong — it should be written down. Addressed by `03_KENYAN_CONTEXT_AND_REGULATION.md`.

### P4 — MEDIUM · Escrow explains its state but not its rules

Buyers are told where the money is. They are not told what releases it, what happens on failure,
when an administrator becomes involved, or what happens after a dispute. The brief asks that a user
understand this **without explanation**; today they would have to infer it.

### P5 — MEDIUM · `STUCK_PAYMENT_TIMEOUT_MINUTES = 15` is unexplained and long

The prompt lives ~30 seconds; the researched sweeper window is ~5 minutes. Fifteen minutes holds a
buyer's stock and attention far longer than the network warrants. Defensible only if justified —
and it is not currently justified in the code.

### P6 — LOW · No terminal "unknown" payment state

`OrderPaymentStatus` is `PENDING_PAYMENT | PAID | FAILED | REFUNDED`. There is no way to express
"we could not determine the outcome", which is precisely the state P1 creates. Adding it is what
makes P1's honest answer representable.

---

## 4. Options compared

| Option | Credibility | Effort | Risk | Verdict |
|---|---|---|---|---|
| **A. Keep simulation, close P1–P6** | High — honest, complete control plane, verifiable | Moderate | Low | **RECOMMENDED** |
| B. Nominal real KES 1 STK Push | — | — | — | **Not viable.** Requires production credentials that were refused; sandbox cannot reach a real handset. See `02`. |
| C. Full production Daraja | Highest | Blocked | — | **Not available.** Requires registered entity, business KRA PIN, active Paybill. Also insufficient alone — custody still needs CBK authorisation. |
| D. Licensed PSP partner (IntaSend/Pesapal) | Highest attainable | High | Medium | **The production roadmap**, not this phase. Delegates custody lawfully. |
| E. Direct payment, no escrow | Low | Low | High | **Rejected.** Destroys buyer protection, which is the platform's thesis. |

**Recommendation: Option A now, Option D as the documented roadmap.**

---

## 5. Recommended architecture

Keep the existing structure. Make these changes.

### 5.1 Complete the provider contract

```ts
interface PaymentProvider {
  readonly name: string;
  initiatePayment(params): Promise<PaymentInitiationResult>;
  /** The third leg of the STK lifecycle. Consulted before declaring a timeout failed. */
  queryPaymentStatus(checkoutRequestId): Promise<PaymentQueryResult>;
}

type PaymentQueryResult =
  | { state: 'SUCCESS'; mpesaReceiptNumber?: string; resultCode: number }
  | { state: 'FAILED'; resultCode: number; resultDesc: string }
  | { state: 'PENDING' }          // still in flight, do not conclude
  | { state: 'UNKNOWN' };         // provider could not answer — must not be read as failure
```

The simulator answers from its `SimulatedPayment` row (returning `UNKNOWN` for a `LOST` outcome, so
the honest path is exercised in simulation too). Daraja answers from `/mpesa/stkpushquery/v1/query`.

### 5.2 Reconciliation must ask before it concludes

`reconcileStuckPayments` consults `queryPaymentStatus` first:
- `SUCCESS` → process as a callback would (the debit was real; credit the order)
- `FAILED` → current behaviour: fail, restore stock, notify, and *then* the "no money left your
  account" line is true
- `PENDING` → leave alone, try later
- `UNKNOWN` → **new terminal state `PAYMENT_UNRESOLVED`**: do not claim the money is safe, do not
  release stock silently, raise it to an administrator

### 5.3 A payment state that can say "we don't know"

Add `OrderPaymentStatus.UNRESOLVED`. Escrow treats it as `NO_FUNDS` for release purposes (never
releasable), and it surfaces to the admin as a queue requiring a decision. This is the single
change that lets the platform be honest under uncertainty.

### 5.4 Webhook authenticity

Secret path segment, optional IP allow-list, `MpesaReceiptNumber` unique index.

### 5.5 Escrow that teaches

One reusable explainer stating, in plain Kenyan English: where the money is, what releases it, what
happens if delivery fails, when an administrator steps in, and what follows a dispute. Placed on
the buyer's order, the farmer's order and the checkout screen — one component, one vocabulary.

---

## 6. Administrator capabilities — the minimum that genuinely improves trust

Already present: view escrow ledger, per-order escrow detail, release/refund with reason, mediation
queue with two-sided evidence, payout queue, `AdminAuditLog`, `EscrowEventLog`, `PaymentEventLog`,
Payment Lab.

Add only:
- **Unresolved payments queue** (from 5.3) — the one genuinely missing capability.
- **Nothing else.** Explicitly rejected: "freeze transaction" (no state it would add beyond
  `HELD_UNDER_REVIEW`), and manual balance adjustment (would break the derived-balance invariant
  that makes the ledger trustworthy).
