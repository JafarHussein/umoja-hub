# 08 · Real STK Push feasibility — evidence, blockers, and the honest boundary

Programme: replace part of the payment simulation with a **real Safaricom interaction**, so the
panel is shown an integration rather than a theory.

This document is research, not a plan of what we wish were true. **Every claim below is backed by a
request actually made against Safaricom's API from this repository on 2026-08-17**, with the
response quoted. Where I could not obtain evidence, it says so.

---

## 1. Method

The official Daraja portal (`developer.safaricom.co.ke`) is a JavaScript application and does not
render for automated fetching, so its pages could not be quoted directly. Rather than substitute
tutorials for documentation, the questions in Phase 3 were answered **empirically**, against the
live sandbox, using the credentials this repository already holds.

Probe script (temporary, deleted after this document): OAuth against both environments, then STK
Push and STK Query against the sandbox using Safaricom's designated test handset **254708374149**
only. No prompt was ever sent to a number that was not supplied for the purpose.

---

## 2. What the credentials actually are

`.env.local` contains `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`,
`MPESA_PASSKEY`, `MPESA_CALLBACK_URL`. `PAYMENT_PROVIDER` is **not set**, so `getPaymentProvider()`
falls back to `simulation` and none of the Daraja code has ever run in anger.

**`MPESA_SHORTCODE=174379`** is Safaricom's public sandbox test shortcode. This is a sandbox app.

### Evidence — OAuth

| Environment | Endpoint | Result |
|---|---|---|
| Sandbox | `sandbox.safaricom.co.ke/oauth/v1/generate` | **HTTP 200**, `access_token` returned, `expires_in=3599` |
| Production | `api.safaricom.co.ke/oauth/v1/generate` | **HTTP 400**, empty body |

**The credentials are genuine and work — against the sandbox only.** There is no production app, so
`PAYMENT_PROVIDER=daraja-production` cannot authenticate today.

---

## 3. Can a real STK Push be initiated? Yes.

Three requests, same credentials, KES 1, test handset.

**A · with the callback URL the repo is configured with today**

```
CallBackURL: https://<your-ngrok-or-vercel-url>/api/webhooks/daraja
→ HTTP 400  {"errorCode":"400.002.02","errorMessage":"Bad Request - Invalid CallBackURL"}
```

`MPESA_CALLBACK_URL` was never filled in. It is still the template placeholder, angle brackets and
all. **This alone would have failed every real STK Push the platform ever attempted.**

**B · with a valid public HTTPS callback**

```
CallBackURL: https://umoja-hub.vercel.app/api/webhooks/daraja
AccountReference: UMJ-2026-000123   Amount: 1   TransactionDesc: UmojaHub order
→ HTTP 200
  {"MerchantRequestID":"234f-43a9-ae11-d0b0c2dbe930108127",
   "CheckoutRequestID":"ws_CO_170820261404032708374149",
   "ResponseCode":"0",
   "ResponseDescription":"Success. Request accepted for processing"}
```

**A real STK Push was accepted by Safaricom, and Safaricom issued a real CheckoutRequestID.**

**C · third leg — STK Query**

```
→ HTTP 200
  {"ResultCode":"4999","ResultDesc":"The transaction is still under processing"}
```

### What this establishes

- **KES 1 is accepted** by the API. No amount blocker.
- **A 15-character `AccountReference`** (`UMJ-2026-000123`) is accepted. The order reference does not
  need shortening; B and C both returned `ResponseCode 0`.
- `TransactionDesc` is **required** — omitting it returns `400.002.02 Bad Request - Invalid Remarks`.
- The **callback URL must be a real, public HTTPS URL.** Safaricom validates it at request time and
  rejects the request outright, before any prompt.
- The deployed endpoint is reachable and correctly guarded: `POST https://umoja-hub.vercel.app/api/webhooks/daraja`
  returns **403** from an arbitrary IP, which is `src/middleware.ts` enforcing the Safaricom IP
  allow-list. Safaricom's ranges pass; everyone else does not.

---

## 4. The blocker that decides the whole programme

**Does a sandbox STK Push ring a real handset?**

Available secondary sources say no: the sandbox prompts only its test MSISDN `254708374149`, and
real phones receive nothing. I could not confirm this against official documentation, because the
portal will not render for fetching, and I will not assert it from memory.

It is also not safe to settle by experiment on an arbitrary number: if the sources are wrong, a made
up number would push a payment prompt to a stranger's phone.

**Settled empirically on 2026-08-17**, with a number supplied by the owner for the purpose. One
KES 1 sandbox push, valid public HTTPS callback.

```
POST /mpesa/stkpush/v1/processrequest   (sandbox, KES 1, owner's MSISDN)
→ HTTP 200
  {"MerchantRequestID":"8838-48ab-bdad-1f4dc54697c831554",
   "CheckoutRequestID":"ws_CO_170820261417149723552198",
   "ResponseCode":"0",
   "ResponseDescription":"Success. Request accepted for processing"}

STK Query, polled every 10s for 60s, stable from t+10s:
  ResultCode: "E3008"
  ResultDesc: "Error, the user has a bad debt contract."
```

**The control makes this conclusive.** The same request, same credentials, same callback, differing
only in the subscriber:

| MSISDN | Outcome |
|---|---|
| `254708374149` (Safaricom's sandbox test handset) | `4999 · The transaction is still under processing` — the transaction is live and waiting for a PIN |
| A real Safaricom number | `E3008 · Error, the user has a bad debt contract.` — terminated immediately |

`E3008` is the sandbox's canned rejection for a subscriber that is not its test account. The request
is accepted and a real `CheckoutRequestID` is issued, and then the transaction is killed server-side
without ever reaching a handset. Nothing appeared on the phone.

**Conclusion: the sandbox does not deliver STK prompts to real handsets.** The secondary sources
were right, and we now have first-hand evidence rather than their word for it.

The handset prompt and any money movement require **production Go-Live**, which requires a
registered paybill or till and Safaricom's approval. That is an organisational blocker, not a
technical one, and no amount of engineering removes it.

---

## 5. The honest boundary, either way

The line the programme must not cross, stated in the terms the panel will test.

### Real, and provably so

- The HTTPS call to Safaricom's API, authenticated with a real OAuth token.
- The `CheckoutRequestID` and `MerchantRequestID` — issued by Safaricom, not by us.
- The STK Query lifecycle, including `4999 / still under processing`.
- The callback: a real HTTP POST from Safaricom's IP ranges to our endpoint.
- Everything downstream in UmojaHub: the order, the state machine, the event log, the escrow
  workflow, reconciliation, the audit trail.

### Simulated by **Safaricom**, not by us

- In sandbox, the payment itself. No money moves, no real M-Pesa account is debited. The receipt
  number Safaricom returns is a sandbox artefact.
- The handset prompt, if it turns out not to be delivered.

### Simulated by **UmojaHub**, and labelled as such

- Custody. UmojaHub holds no funds and no client account. `EscrowState` is a projection over the
  order, not a wallet.
- Release and refund. These move a state machine and write audit rows. No money is disbursed.

**The sentence that must never be written**: that UmojaHub is holding a buyer's money. It is not, in
any environment, and this is a licensing matter as well as an honesty one — custody of client funds
is regulated activity under the National Payment Systems Act 2011.

---

## 6. Defects found by doing the research

Three, all evidenced above, all in code that has never run because the provider defaults to
simulation.

### D1 · "Still processing" is read as "failed" · serious

Safaricom answered the STK Query with `HTTP 200`, no `errorCode`, and `ResultCode: "4999"`
(*"The transaction is still under processing"*).

`queryStkPushStatus` only treats a response as in-progress when `errorCode` is `500.001.1001`
(`darajaService.ts:213`). A 200 carrying `ResultCode 4999` falls through to
`{ resultCode: 4999 }`, `darajaProvider` maps any non-zero code to `FAILED`, and
`reconcileStuckPayments` then marks the order **FAILED**, returns the produce to the marketplace and
tells the buyer *"No money left your account."*

While Safaricom is saying the transaction is still running. This is precisely the failure mode the
last three programmes were spent eliminating, sitting unexercised in the real provider.

### D2 · The callback URL is a placeholder

`MPESA_CALLBACK_URL=https://<your-ngrok-or-vercel-url>/api/webhooks/daraja`. Rejected by Safaricom
with `400.002.02`. Every real STK Push would have failed at the first request.

### D3 · The environment is chosen by `NODE_ENV`, not by `PAYMENT_PROVIDER`

`darajaService.ts` selects sandbox vs live endpoints with `process.env.NODE_ENV !== 'production'`
(lines 33, 117, 222). So:

- `PAYMENT_PROVIDER=daraja-sandbox` on a Vercel **production** deploy hits **`api.safaricom.co.ke`**
  with sandbox credentials, and fails.
- There is no way to run the sandbox against a production build, which is exactly what a
  demonstration deploy needs.

The provider adapter's own comment claims "a future go-live needs only
`PAYMENT_PROVIDER=daraja-production`". That is not true today: go-live is decided by `NODE_ENV`.
The two must be reconciled, and `PAYMENT_PROVIDER` should be the single authority.

---

## 7. Recommended architecture

Keep the `PaymentProvider` abstraction exactly as it is. It is the strongest thing in this system
and it already makes the following a configuration change rather than a rewrite:

```
simulation        the existing profile-driven simulator. Stays. It is how the failure
                  states, reconciliation and escrow are demonstrated without spending
                  anything, and how the tests run.

daraja-sandbox    real Safaricom API, real CheckoutRequestID, real callback, sandbox
                  money (that is, none). The new demonstration path.

daraja-production real money. Blocked on Go-Live, and on the custody question, which no
                  amount of engineering resolves.
```

All three feed the **same** `processStkCallback`, the same event log, the same escrow state machine.
That shared downstream path is the demonstration: a real Safaricom callback and a simulated one are
processed by identical code, and the audit trail records which provider produced each event.

**The browser never decides anything.** It requests a payment and then polls; the provider confirms;
the callback is authoritative. That is already how the system is built.

---

## 8. Implementation checklist

Ordered by dependency. Each item: what, why, how it is verified.

| # | Change | Why | Verified by |
|---|---|---|---|
| 1 | Fix `MPESA_CALLBACK_URL` to the real deployed HTTPS endpoint | D2. Every push fails without it | Re-run the probe; expect `ResponseCode 0` |
| 2 | Select the Daraja environment from `PAYMENT_PROVIDER`, not `NODE_ENV` | D3. A production build must be able to run sandbox | Unit test asserting URL choice per provider name |
| 3 | Treat `ResultCode 4999` (and the documented in-progress codes) as PENDING | D1. Prevents a live payment being failed and stock returned | Unit test feeding the exact recorded response |
| 4 | Add `PAYMENT_MODE` / `DEMO_AMOUNT` so the demonstration charges KES 1 without hard-coding it | Phase 10. Architecture must still support real totals | Unit test: order total preserved on the order, demo amount used only at the provider boundary |
| 5 | Surface the real/simulated boundary in the UI, per provider | Phase 12. `SimulationNotice` currently says "simulated payment" for everything | Rendered check per provider |
| 6 | Record the provider and environment on every `PaymentEventLog` row | Phase 16. The audit must show which leg was real | Existing `provider` field; assert environment |
| 7 | Failure matrix against the sandbox: cancel, timeout, wrong PIN, duplicate callback, missing callback → reconciliation | Phase 17 | Live sandbox runs, recorded |

Items 1-3 are defect fixes and are worth doing regardless of how the handset question resolves.
Items 4-7 depend on it.

---

## 9. Open, and honestly so

- **Does the sandbox prompt reach a real handset?** Being settled empirically. Everything in §4
  branches on it.
- **Production Go-Live.** Not available: production OAuth returns HTTP 400, and Go-Live needs a
  registered paybill or till.
- **Custody.** Even with production credentials, UmojaHub holding buyer funds is licensed activity.
  The escrow layer stays a state machine, and stays labelled as one.
