# 02 · M-Pesa STK Push — lifecycle, failure modes, and the nominal-payment question

Research phases 2 and 3. Evidence-cited.

---

## 1. The lifecycle

```
Buyer submits checkout
   ↓
Backend requests OAuth token (Daraja)
   ↓
Backend POSTs /mpesa/stkpush/v1/processrequest
   ↓  ← SYNCHRONOUS response: CheckoutRequestID, MerchantRequestID, CustomerMessage
       (this only means "the prompt was accepted for dispatch" — NOT that it was paid)
   ↓
Safaricom pushes the SIM-toolkit prompt to the handset  (~30s to live)
   ↓
Buyer enters M-Pesa PIN
   ↓
Safaricom debits, credits the Paybill/Till
   ↓  ← ASYNCHRONOUS callback POSTed to CallBackURL (HTTPS only)
   ↓
Backend verifies, transitions the order, notifies both parties
```

**Three legs, not two.** Initiate, callback, and — critically — **query**. The
`/mpesa/stkpushquery/v1/query` endpoint exists precisely because the callback is unreliable. A
production integration that implements only initiate + callback is incomplete.

### The synchronous response is not a payment

The most common integration error is treating the 200 from `processrequest` as success. It means
only that Safaricom accepted the request for processing. UmojaHub's `PaymentInitiationResult`
correctly models this (`checkoutRequestId` + `customerMessage`, no outcome).

---

## 2. Every outcome, and how production should respond

| ResultCode | Meaning | Correct response |
|---|---|---|
| `0` | Success | Credit the order, hold funds, notify both parties, write the receipt |
| `1` | Insufficient funds | Fail the payment, release inventory, offer retry, say *why* |
| `1032` | Request cancelled by user | Fail quietly and offer retry — this is a normal user action, not an error |
| `1037` | DS timeout, MSISDN unreachable — the user never saw or never answered the prompt | Fail after the window, offer retry. Common on eSIM/iOS |
| `2001` | Wrong PIN / invalid initiator | Fail, offer retry (Safaricom allows 3 PIN attempts) |
| `1001` | Unable to lock subscriber — a transaction is already in progress | Ask the buyer to wait 1–2 minutes; do **not** immediately re-push |
| `1025` / `9999` | Unable to send the prompt (often `TransactionDesc` > 182 chars) | Treat as a system fault, log, retry after a pause |
| `17` | Party B unable to process | Retry after 30–45s |
| *(no callback)* | **Lost** | The dangerous one — see below |

### The timeout / lost-callback problem

The prompt lives roughly **30 seconds**, varying with handset, network load and Safaricom backend
state. The callback can then fail to arrive for reasons entirely outside the integration: server
briefly unreachable, Safaricom under load (month-end, Fridays, holidays), network congestion.

> "The customer may have been debited by Safaricom, but your application remains unaware. This
> creates 'limbo' payments — money withdrawn from the customer's wallet that your system cannot
> reconcile."

**This is the defining production hazard of M-Pesa integration.** A timed-out payment is *not*
known to have failed. It is unknown.

The recommended production strategy is two layers:

1. **Sweeper** — poll pending transactions older than the timeout window against
   `/mpesa/stkpushquery/v1/query`, roughly every 2–5 minutes, for about 5 minutes. Process anything
   found exactly as a callback would be.
2. **Daily reconciliation** — compare internal records against the provider's statement, in both
   directions, and on amount as well as existence.

Safaricom also requires the callback endpoint to answer **HTTP 200 within 30 seconds**, or it
retries and eventually gives up — so callback handling must be fast and idempotent.

### Callback authenticity

Daraja callbacks are unauthenticated HTTPS POSTs. Production hardening is:
- **IP allow-listing** of Safaricom's ranges, to prevent spoofed "you've been paid" signals;
- **HTTPS only** (Daraja refuses plain HTTP callback URLs);
- a **secret path segment** in the callback URL as a shared-secret substitute;
- **`MpesaReceiptNumber` as a uniqueness constraint** so a replayed callback cannot double-credit.

A marketplace that credits an order from an unauthenticated POST without these is trivially
defraudable. This is a legitimate, high-value hardening item.

---

## 3. Would a real KES 1 STK Push work? — **No. The route is closed.**

The brief asks whether a nominal real charge (e.g. KES 1) with the rest simulated would be more
credible. It was investigated properly and the answer is negative, for a reason that is itself
a good defence point.

**Finding 1 — sandbox STK Push cannot reach a real handset.** The sandbox uses Safaricom's test
MSISDN (`254708374149`) and test credentials. A panel member's real phone will not ring. Sandbox
callbacks also differ from production in timing and edge-case behaviour.

**Finding 2 — reaching a real handset requires production credentials**, and production Daraja
access requires, at minimum:
- a **registered business entity** (Registrar of Companies / eCitizen) — Safaricom does not issue
  production credentials to individuals;
- a **business KRA PIN certificate**;
- an **active M-Pesa Paybill or Till**, itself a separate prior application;
- ID of an authorised signatory, plus a letter of authorisation where applicable;
- live, reachable **HTTPS production callback URLs** at review time.

**Conclusion.** A nominal real STK Push requires exactly the production access that was refused. It
is not a lesser or partial alternative to full production — it *is* full production, for one
shilling. The proposal is therefore not viable, and it is not merely inconvenient: it is blocked by
the same gate that produced the simulation in the first place.

**Secondary reason to reject it even if it were available.** A hybrid where one shilling is real
and the remaining balance is imaginary is *less* honest than a clearly-labelled simulation, not
more. It would produce a real M-Pesa receipt for an amount that does not correspond to the order,
and a real debit that the escrow ledger does not account for. It trades a defensible position
("this leg is simulated, everything else is real") for an indefensible one ("some of the money is
real and some is not"). The correct answer to a panel is the honest architecture, not a token
charge that muddies it.

---

## Sources

- [Tuma — Common M-Pesa Daraja API error codes, explanation and mitigation](https://tuma.co.ke/common-mpesa-daraja-api-error-codes-explanation-and-mitigation/)
- [mctaba — STK Push timeout handling compared across providers](https://www.mctaba.com/learn/paystack/m-pesa-stk-push-timeout-handling-compared-across-providers)
- [mctaba — Daraja production checklist / go-live guide](https://www.mctaba.com/learn/mpesa/daraja-production-checklist)
- [KenZobe — M-Pesa callback URLs setup guide](https://www.kenzobe.com/blog/mpesa-callback-urls)
- [KenZobe — M-Pesa Daraja API common errors and fixes](https://www.kenzobe.com/blog/mpesa-daraja-api-errors)
- [django-daraja — STK Push API documentation](https://django-daraja.readthedocs.io/en/latest/pages/apis/stk_push.html)
- [DevLink — M-Pesa STK Push integration: the complete developer guide](https://www.devlinktechnologies.co.ke/blog/mpesa-stk-push-integration-guide)
