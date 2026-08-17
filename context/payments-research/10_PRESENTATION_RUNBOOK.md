# 10 · Payment demonstration — presentation runbook

One rehearsed path, run against the normal application. No separate demo screens, no hard-coded
transaction, no improvisation.

Read `09_PAYMENT_ARCHITECTURE_AND_PANEL_DEFENCE.md` for the answers; this is the sequence.

---

## Before the room

1. **Switch on the demonstration configuration** in `.env.local` (three lines, shipped commented):

   ```
   PAYMENT_PROVIDER=daraja-sandbox
   PAYMENT_MODE=REAL_STK_DEMO
   DEMO_AMOUNT=1
   ```

   Leave them commented for ordinary development, so the unit suite and the Playwright e2e run on
   the simulator and never touch Safaricom.

2. **Confirm the callback URL is a real public HTTPS endpoint.**
   `MPESA_CALLBACK_URL=https://umoja-hub.vercel.app/api/webhooks/daraja`. Safaricom validates it at
   request time and rejects the whole push with `400.002.02` if it is a placeholder or localhost.

3. **Seed the demonstration data**: `npm run demo`. It provisions the verified farmer, produce with
   stock, and the buyer. Nothing about the payment path depends on random seed values.

4. **Rehearse once.** The sandbox is an external service; if it is down, say so rather than
   improvising, and fall back to `PAYMENT_PROVIDER=simulation`, which demonstrates the identical
   downstream workflow through the same code.

---

## The sequence

| # | Do | Say | Where it is real |
|---|---|---|---|
| 1 | Sign in as the buyer, open the marketplace, pick produce | "This is the ordinary marketplace." | — |
| 2 | Checkout, enter the M-Pesa number | "The order is created and the stock reserved before any payment is attempted." | Order + reservation |
| 3 | Press Pay | "That request has just gone to Safaricom." | **Real HTTPS call, real OAuth** |
| 4 | Open **Payment details** | "This checkout reference was issued by Safaricom, not by us." | **Safaricom-issued IDs** |
| 5 | Point at the notice | "This is the Daraja sandbox. The integration is real; the money is not." | Honest label |
| 6 | Admin → Payment Lab → **Confirm for demonstration** | "The sandbox cannot complete a payment: its test handset has nobody to enter a PIN. Rather than fake a Safaricom response, UmojaHub records the confirmation itself, and the audit trail says so." | **Labelled bridge** |
| 7 | Back to the buyer's order | "Payment confirmed. The order has entered the escrow workflow." | Escrow HELD |
| 8 | Switch to the farmer | "The farmer is told the buyer has paid and that the money is *not* theirs yet." | Farmer view |
| 9 | Farmer confirms dispatch | "Dispatch starts the clock." | HELD_DISPATCHED |
| 10 | Back to the buyer, confirm receipt | "Only the buyer's confirmation makes the money releasable. There is no code path that releases on payment alone." | RELEASABLE |
| 11 | Farmer's Payments screen | "Cleared, and available to request as a payout." | Ledger |
| 12 | Admin → Escrow → the order | "The whole transaction, replayed from the append-only logs." | Audit trail |
| 13 | Point at the trail | "Two rows say `umojahub-demo-bridge`. Two say `daraja-sandbox`. The boundary is in the record, not in my description of it." | **The proof** |

---

## The failure demonstration

Worth more than the happy path, and it needs no bridge at all.

1. Place a second order and press Pay.
2. **Do nothing.** Wait about thirty seconds.
3. Safaricom's real callback arrives: `1037 · No response from user.`
4. The order is **not** marked paid. The produce goes back on sale. The buyer is told what happened
   and offered a retry.

Say: *"That is a real callback from Safaricom's IP range, carrying a real result code, and the
platform did the honest thing with it. A system that only demonstrates success has not been tested."*

If you want to show reconciliation instead, cancel nothing and let the poll window close: the order
goes to the reconciliation path, which asks Safaricom directly rather than assuming.

---

## Questions you will be asked mid-demo

**"Why did your phone not ring?"** The sandbox does not deliver to real handsets. We tested it: a
real number returns `E3008` and the transaction terminates; Safaricom's test handset returns `4999`
and stays live. A real prompt requires production Go-Live against a registered paybill.

**"So the payment is fake?"** The request, the authentication, the references and the callback are
real. The money is not, because it is a sandbox. The custody is not, because holding client funds is
licensed activity. Both are labelled on screen.

**"Could you switch to production?"** `PAYMENT_PROVIDER=daraja-production` plus credentials. No code
changes — the provider abstraction was built for it, and the bridge refuses to run there. What we
cannot switch on is a licence to hold other people's money.

---

## What not to say

- "The money is held by UmojaHub." It is not, in any environment.
- "This is a real M-Pesa payment." The integration is real; the payment is a sandbox transaction.
- "The receipt number is from M-Pesa" when it begins `DEMO-`. The screen already says otherwise;
  do not contradict it.
