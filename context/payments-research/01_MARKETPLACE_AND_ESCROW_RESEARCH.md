# 01 · Marketplace payment flows and escrow systems

Research phases 1 and 4. Evidence-cited. Written before any implementation decision.

---

## 1. The three ways a marketplace can move money

Stripe Connect is the most thoroughly documented marketplace payment system in the world, and its
taxonomy is the clearest available frame. It defines exactly three charge types, and the choice
determines who holds the money, who is the merchant of record, and who eats a chargeback.

| Model | Who is charged | Who holds funds | Who bears disputes | Marketplace fit |
|---|---|---|---|---|
| **Direct charges** | The seller's own account | Seller | Seller's balance | SaaS storefronts (Shopify, Thinkific) — buyer often unaware the platform exists |
| **Destination charges** | The platform | Platform, then *immediately* transferred to seller | Platform's balance | Rideshare, service marketplaces |
| **Separate charges and transfers** | The platform | **Platform, held, transferred later by explicit API call** | Platform's balance | Multi-party splits, DoorDash — and any platform that must hold |

**UmojaHub is a "separate charges and transfers" marketplace.** The buyer pays the platform; the
platform holds; the platform later moves the money to the farmer as a distinct, authorised act.
This is the correct model and it is the one the current code already implements.

### The finding that matters most

> "Stripe doesn't provide escrow services or support escrow accounts. However, Stripe offers an
> identical functionality with a feature called delayed payout."

Stripe — the largest marketplace payment processor in existence — **deliberately avoids the word
escrow**. It offers delayed payouts (holdable up to 90 days) and manual transfers, which are
functionally escrow, and calls them something else. The reason is regulatory: true escrow is a
licensed fiduciary activity. Stripe positions itself as holding *its own* balance on behalf of a
platform, not as a custodian of third-party funds.

This is directly load-bearing for UmojaHub (see `03_KENYAN_CONTEXT_AND_REGULATION.md`) and is the
strongest available answer to a panel asking "are you allowed to hold people's money?"

---

## 2. The seven lifecycles

### Payment lifecycle
`initiated → authorised → captured → settled` — or `failed`. In card systems authorisation and
capture are separable, which is where "hold" language originates. In mobile money there is no
separable authorisation: an M-Pesa STK Push is atomic, so a marketplace cannot hold funds *at the
network*. It must take the money and hold it in its own account. This distinction is the single
biggest structural difference between a card marketplace and a Kenyan one.

### Checkout lifecycle
`cart → intent created → customer authenticates → outcome → order confirmed`. The universal
property is that the intent exists **before** the money does, so a failed payment leaves an order
record to reconcile against, not a void.

### Order lifecycle
`placed → paid → accepted by seller → dispatched → delivered → confirmed → closed`. Marketplaces
consistently keep this axis **separate** from the payment axis, because an order can be paid and
undelivered, or delivered and unpaid.

### Escrow lifecycle
`no funds → held → release-pending → released` with side branches to `refunded` and `disputed`.
Release is conditioned on an event on the *order* axis, not the payment axis.

### Settlement lifecycle
`releasable → payout requested → approved → paid`. Real platforms separate "the seller has earned
this" from "the seller has been paid this", because payout runs are batched, and because a payout
is the last point at which fraud can be stopped.

### Refund lifecycle
Refunds debit the party that holds the money. Under separate charges and transfers, Stripe debits
the *platform* balance, and the platform must separately reverse any transfer already made to the
seller. **Consequence: refunding after release is materially harder than refunding before it** —
which is why release must be gated carefully.

### Dispute lifecycle
`raised → evidence from both sides → adjudication → outcome applied to funds`. Two properties recur
across every serious implementation: **both sides are heard**, and **the adjudication outcome is
mechanically applied to the money**, not left as a note.

---

## 3. Answers to the questions the brief posed

**Who initiates payment?** The buyer, always. A marketplace never debits without a buyer-initiated,
buyer-authenticated act. In M-Pesa this is the PIN entry.

**Who receives payment?** The platform, in a hold model. The farmer receives a *later transfer*.

**Who temporarily owns the funds?** Legally, this is the hard question. In Stripe's model the
platform's balance holds them and the platform bears the liability. In a licensed escrow the funds
sit in a **trust account** and are owned by neither party until conditions are met.

**When are funds released?** On a defined, observable condition — almost universally *buyer
confirmation of receipt*, with a timeout fallback so a silent buyer cannot strand a seller forever.

**Who authorises release?** The buyer in the normal case; an administrator in the exception case.

**What happens if delivery fails?** Refund to the buyer, and the inventory returns to sale.

**Buyer protections:** money is not released on payment alone; a right to escalate; refund on
non-delivery; a verifiable receipt.

**Seller protections:** confirmed funds before dispatch; protection from an unresponsive buyer via
timeout or escalation; an auditable record.

---

## 4. Escrow implementations studied

**Escrow.com** — licensed and bonded, funds in trust accounts, statutory obligations. The
reference model for *real* escrow, and out of reach for a platform without a licence.

**Stripe Connect** — functional escrow via delayed payouts, explicitly not called escrow.
Now also has "funds segregation" (private preview) which *keeps payment funds in a protected
holding state before transfer*, preventing allocated funds being used for unrelated platform
operations. This is the industry converging on segregation as the correct primitive.

**Kenyan M-Pesa escrow services** — TrustPay (Paybill 542542), Vendo, eConfirm, KenyaEscrow. The
common pattern: buyer pays a platform Paybill by STK Push, funds are held, seller delivers, buyer
confirms, platform pays out by B2C. **Vendo is a direct comparator** — an agricultural marketplace
with 6,840+ listings across all 47 counties, National ID verification to unlock escrow, and payout
on buyer confirmation. UmojaHub's architecture is the same shape as a live Kenyan agricultural
escrow marketplace, which is a strong defensive point.

### Principles extracted

1. **Escrow is a state machine over an external condition.** It never derives from payment status.
2. **The held state must be a derived projection, not a stored balance** — a stored wallet drifts.
3. **Release requires an authoriser**, and both the buyer and an administrator are valid ones.
4. **Every custodial movement must be individually logged with an actor** — an append-only trail,
   because the trail is the only thing that survives a dispute about what happened.
5. **Refund must return inventory**, or the marketplace leaks stock.
6. **Settlement is separate from release.** Released ≠ paid out.

---

## Sources

- [Stripe — Understand how charges work in a Connect integration](https://docs.stripe.com/connect/charges)
- [Stripe — Using manual payouts](https://docs.stripe.com/connect/manual-payouts)
- [Stripe — Separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- [Sharetribe — Stripe Connect marketplace payments overview](https://www.sharetribe.com/academy/marketplace-payments/stripe-connect-overview/)
- [Vendo Kenya — agricultural marketplace with M-Pesa escrow](https://vendo.co.ke/)
- [TrustPay KE — M-Pesa escrow service](https://trustpay.co.ke/)
- [eConfirm — M-Pesa escrow](https://econfirm.co.ke/)
