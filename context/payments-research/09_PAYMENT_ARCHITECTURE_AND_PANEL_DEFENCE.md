# 09 · Payment and escrow — final architecture, boundary, and panel defence

The authoritative description of what UmojaHub's payment and escrow system is, what part of it is
real, what part is not, and why the line falls where it does.

Companion to `08_REAL_STK_FEASIBILITY.md`, which records the live tests this is built on. Every
factual claim here was verified against Safaricom's API on 2026-08-17, not taken from documentation
or memory.

---

## 1. The one-sentence version

**A real, authenticated M-Pesa integration reaches Safaricom, and everything downstream of the
payment network — the order, the state machine, the escrow workflow, the audit trail — is genuine
production code. The two things that are not real are the ones a sandbox and an unlicensed platform
cannot make real: the money, and the custody of it. Both are labelled wherever they appear.**

---

## 2. The three layers

### Layer 1 · Safaricom Daraja — REAL

| What | Evidence |
|---|---|
| OAuth against Safaricom | `HTTP 200`, real bearer token, `expires_in=3599` |
| STK Push accepted | `HTTP 200`, `ResponseCode: "0"` |
| Safaricom-issued references | `CheckoutRequestID: ws_CO_170820261428262708374149`, `MerchantRequestID: 058f-42c6-8d43-0ee25d2aff7e73791` |
| **Callback delivered to our server** | `POST` from **196.201.212.138** (Safaricom), ~30s after the push |
| Callback payload | `{"Body":{"stkCallback":{...,"ResultCode":1037,"ResultDesc":"No response from user."}}}` |
| STK Query (third leg) | `HTTP 200`, `ResultCode 4999 · still under processing` |

Sandbox credentials only. Production OAuth returns `HTTP 400`: there is no production app.

### Layer 2 · UmojaHub payment processing — REAL

Order creation, stock reservation by compare-and-swap, the payment state machine, the shared
callback processor, idempotency, reconciliation via STK Query, the append-only `PaymentEventLog`,
notifications. None of this is demonstration code. It is what would run in production, unchanged.

The browser cannot declare a payment successful. It requests a payment and then polls; the provider
answers; the backend transitions the order. This is architectural, not a convention.

### Layer 3 · UmojaHub escrow — a state machine, explicitly

`EscrowState` is a **projection** over the order and any open mediation (`lib/foodhub/orderEscrowState.ts`).
There is no wallet, no client account, no ledger of held cash. "Release" and "refund" move a state
machine and write audit rows. **UmojaHub holds no money at any point, in any environment.**

This is not only a sandbox limitation. Holding customer funds in Kenya is licensed activity under
the National Payment Systems Act 2011. Even with production credentials, this layer would stay a
workflow until UmojaHub held a licence or partnered with someone who does.

---

## 3. What the sandbox can and cannot do

Established by test, with a control, not assumed:

| MSISDN | Outcome |
|---|---|
| `254708374149` (Safaricom's test handset) | `4999 · still under processing`, then callback `1037 · No response from user` |
| A real Kenyan number | `E3008 · Error, the user has a bad debt contract` — terminated immediately, nothing rings |

**The sandbox cannot ring a real handset and cannot complete a payment.** Its test handset has
nobody to enter a PIN, so an STK Push there always ends `1037`. A successful debit requires
production Go-Live against a registered paybill or till: an organisational gate, not a technical one.

### What follows for the demonstration

The real leg reliably produces a **failure**. That is genuinely useful — it is the controlled failure
scenario, and it exercises the honest path end to end. But the escrow workflow lives downstream of a
*confirmed* payment, and the sandbox cannot get there.

---

## 4. The demonstration bridge

`lib/payments/demoBridge.ts`. Available only when `PAYMENT_MODE=REAL_STK_DEMO` **and**
`PAYMENT_PROVIDER=daraja-sandbox`. It refuses to run under `daraja-production`, where a real payment
can succeed on its own and bridging would falsify a financial outcome.

An administrator invokes it deliberately on an order that has **already made a real STK Push** (it
refuses without a `CheckoutRequestID`). It then routes a confirmation through the ordinary
`processStkCallback`, so the order lands exactly as a real payment would.

**What keeps it honest:**

- Recorded against provider `umojahub-demo-bridge`, never `daraja-sandbox`. The audit trail cannot
  suggest Safaricom confirmed something it did not.
- The reference is `DEMO-2026-000123`, not a ten-character M-Pesa code. It cannot be mistaken for a
  receipt in the UI, the database, or a screenshot, and every surface that would say "M-Pesa
  receipt" says "Demonstration reference" instead.
- The `reason` on the audit row states why the bridge was needed.
- Guarded to orders still awaiting payment, so it can neither double-credit nor resurrect.

The real `1037` callback typically arrives *after* the bridge. It is correctly ignored by the
idempotency guard and recorded as such — which is itself a demonstration of the guard working
against real provider behaviour.

---

## 5. The state machine

```
ORDER_CREATED → PENDING_PAYMENT ─┬─→ PAID ──→ escrow HELD ──→ HELD_DISPATCHED
                                 │              │
                                 ├─→ FAILED     ├─→ HELD_UNDER_REVIEW ──→ REFUNDED
                                 └─→ UNRESOLVED └─→ RELEASABLE ──→ (payout requested)
```

Escrow is derived, never stored. Release requires `fulfillmentStatus === COMPLETED`, which requires
the buyer's confirmation. **Release cannot happen early**: there is no code path that releases on
payment alone.

`UNRESOLVED` is the state that matters most. It exists because "we did not hear" is not "it failed",
and a platform that collapses the two tells someone their money is safe when it is gone.

---

## 6. Failure handling, and how each is verified

| Scenario | Behaviour | Verified by |
|---|---|---|
| Buyer cancels (`1032`) | FAILED, stock restored, reason recorded | Unit test + simulator |
| No response (`1037`) | TIMEOUT event, FAILED, stock restored | **Real sandbox callback** |
| Insufficient funds (`1`) | FAILED with Safaricom's reason surfaced | Unit test |
| Callback never arrives | Reconciliation asks Safaricom | `reconcile.test.ts` |
| Query says still processing (`4999`) | **PENDING** — no conclusion drawn | `darajaService.test.ts` |
| Query cannot answer | `UNRESOLVED`, stock held, admin queue | `reconcile.test.ts` |
| Duplicate success callback | Ignored, recorded, no double credit | Unique index + `processCallback.test.ts` |
| Late failure after settlement | Ignored, recorded, order untouched | `processCallback.test.ts` |
| Buyer refreshes / leaves / returns | State is server-side; the page re-reads it | By construction |

---

## 7. Four defects this programme found

All in Daraja code that had never executed, because the provider defaults to `simulation`.

1. **The callback IP allow-list was wrong.** It listed `196.201.214.200-215`; the real callback came
   from `196.201.212.138`. Every real Daraja callback would have been refused `403` by our own
   middleware — buyer debited, order never confirmed. *This one would have broken production
   silently on day one.*
2. **`ResultCode 4999` read as FAILED.** Reconciliation would have failed a live payment and returned
   the produce while Safaricom was still processing it.
3. **Environment chosen by `NODE_ENV`.** `daraja-sandbox` on a production build would have posted
   sandbox credentials to the live endpoint.
4. **The failure path was unguarded.** A late or retried failure callback could demote a PAID order.

Plus `MPESA_CALLBACK_URL` still holding its unfilled placeholder, which Safaricom rejects with
`400.002.02`.

---

## 8. Panel questions, answered

**Why Daraja?** It is the only integration route to M-Pesa, which is how Kenyan agricultural
payments actually happen.

**Why KES 1?** `PAYMENT_MODE=REAL_STK_DEMO` with `DEMO_AMOUNT=1`. The order keeps its true total
everywhere — order, escrow, ledger, receipt; only the figure sent to Safaricom is nominal. Turn the
mode off and the same code path charges the real total. KES 1 is not hard-coded into the
architecture.

**Why did the phone not ring?** Because the sandbox does not deliver to real handsets. We proved it:
our number returned `E3008` and terminated; Safaricom's test handset returned `4999` and stayed
live. A real prompt needs production Go-Live against a registered paybill.

**What is actually real?** The authentication, the request, Safaricom's references, the callback from
Safaricom's IP, the query lifecycle, and every line of UmojaHub downstream.

**Where is the money held?** Nowhere. UmojaHub holds no funds. Escrow is a state machine over the
order.

**Is UmojaHub operating an escrow account?** No, and it says so on every screen. Custody is licensed
activity under the NPS Act 2011.

**What happens if the callback is lost?** Reconciliation queries Safaricom directly and takes one of
four paths: recovered, confirmed failed, still pending, or unresolved. It never assumes.

**What if the buyer paid but we never heard?** `UNRESOLVED`. The stock stays reserved (if they were
debited, the produce is theirs), the buyer is told we are checking and asked not to pay again, and an
administrator gets a queue entry with the checkout reference to search the M-Pesa statement.

**How do you prevent duplicate callbacks?** A unique sparse index on `mpesaTransactionId`, checked
before processing; plus guarded conditional updates so no transition can fire twice.

**How do you prevent double release?** Release requires `COMPLETED`, set once by the buyer's
confirmation; settlement is guarded on funds genuinely being held.

**How does the farmer know the buyer paid?** An SMS (the only immediate signal they get — they are
not party to the STK push) plus the order screen, which says the money is held and not yet theirs.

**What is simulated?** The money, the custody, and — where the bridge is used — the confirmation.
Each is labelled at the point it appears.

---

## 9. Acceptance run — the whole lifecycle, against the real sandbox

Executed 2026-08-17 with `PAYMENT_PROVIDER=daraja-sandbox`, `PAYMENT_MODE=REAL_STK_DEMO`,
`DEMO_AMOUNT=1`, through the application's own modules. Output, abridged:

```
[0] provider=daraja-sandbox  realStkDemo=true
[1] order UMJ-DEMO-420399 created, total KSh 50
[2] sending KSh 1 to the provider; the order keeps KSh 50
      SAFARICOM CheckoutRequestID = ws_CO_170820261507017708374149
      SAFARICOM MerchantRequestID = 3572-4b90-add9-3dbe7857c1b513268
[3] STK query -> {"state":"PENDING"}
[4] bridge confirmed          order=PAID/IN_FULFILLMENT   escrow=HELD
[5] farmer dispatched         escrow=HELD_DISPATCHED
[6] buyer confirmed           escrow=RELEASABLE
[7] late 1037 callback: processed=false, order still PAID/COMPLETED
[8] audit trail — 4 payment events
      CALLBACK_RECEIVED  umojahub-demo-bridge   PENDING_PAYMENT -> PENDING_PAYMENT
      SUCCESS            umojahub-demo-bridge   PENDING_PAYMENT -> PAID
      CALLBACK_RECEIVED  daraja-sandbox         PAID -> PAID
      DUPLICATE          daraja-sandbox         PAID -> PAID
```

Four things worth pointing a panel at in that output:

1. **KSh 1 went to Safaricom; the order kept KSh 50.** The nominal amount lives at the provider
   boundary only.
2. **Step 3 returned PENDING.** Before this programme that same response (`ResultCode 4999`) was
   read as FAILED and would have killed a live payment.
3. **Step 7 is the idempotency guard meeting real provider behaviour.** Safaricom's genuine `1037`
   arrived after the order had settled, and was recorded and ignored rather than demoting it.
4. **Step 8 is the boundary, in the audit trail itself.** Two rows say `umojahub-demo-bridge`, two
   say `daraja-sandbox`. Nothing has to be taken on trust; the record distinguishes them.

---

## 10. Configuration

```
PAYMENT_PROVIDER=daraja-sandbox    # simulation | daraja-sandbox | daraja-production
PAYMENT_MODE=REAL_STK_DEMO         # unset in production
DEMO_AMOUNT=1
MPESA_CALLBACK_URL=https://<deployed-host>/api/webhooks/daraja   # MUST be real public HTTPS
```

The callback URL must be a genuine public HTTPS endpoint. Safaricom validates it at request time.

**The repository ships with the simulator active** so the unit suite and the Playwright e2e run
without touching Safaricom. Uncomment the three lines in `.env.local` to run the panel demonstration.

---

## 11. What would change in production

| Now | Production |
|---|---|
| Sandbox credentials, shortcode 174379 | Own paybill/till, production credentials, Go-Live approval |
| No handset prompt | Real STK prompt on the buyer's phone |
| No money moves | Real debit |
| Demonstration bridge confirms | Safaricom's own success callback confirms; **the bridge refuses to run** |
| Escrow is a state machine | Still a state machine, until a licence or a licensed partner exists |

**No code changes are required for the first four.** They are `PAYMENT_PROVIDER=daraja-production`
plus credentials. That is what the provider abstraction was for, and it is now true — before this
programme, `NODE_ENV` decided the environment and the claim was false.
