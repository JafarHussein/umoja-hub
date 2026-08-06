# 03 · Kenyan context, user behaviour, and the regulatory position

Research phase 5, plus the regulatory question the brief did not ask but a panel will.

---

## 1. The regulatory finding — read this first

**Holding customer funds in Kenya is a licensed activity.**

The National Payment System Act, 2011 and the National Payment System Regulations, 2014 establish
the licensing and oversight regime. Entities offering payment processing, e-money issuance, mobile
payments or payment gateway services must be authorised by the **Central Bank of Kenya** before
operating. Payment Service Providers must:

- **segregate client funds** — client accounts or escrow mechanisms, kept available;
- **establish a trust** to safeguard customer funds;
- meet **minimum capital / surety bond** thresholds;
- maintain records, exercise due diligence, and report material changes to CBK.

### What this means for UmojaHub, stated plainly

A student platform is not a licensed PSP and cannot lawfully take custody of third-party funds in
Kenya. **This is not a limitation of the simulation — it would be true with production Daraja
access as well.** Even with a live Paybill, money landing in an unlicensed operator's account and
being held pending delivery is regulated activity.

This reframes the entire project honestly and *strengthens* it:

> UmojaHub does not hold money. It implements, in full, the **control plane** of an escrow
> marketplace — the state machine, the release conditions, the adjudication, the audit trail and
> the settlement queue — while the **custody plane** is simulated, because custody is precisely the
> part that requires a licence UmojaHub does not and should not have.

Note that this is the same line Stripe draws. Stripe operates the control plane for millions of
marketplaces and still declines to call it escrow, because the custody question is regulated.
UmojaHub is in good company in separating the two.

### The production path is therefore not "get Daraja access"

It is one of:

1. **Partner with a licensed PSP** offering escrow/split settlement (IntaSend, Pesapal and similar
   already hold client funds under licence). The platform keeps its control plane and delegates
   custody. **This is the recommended route** — lowest cost, no licence, and it is how real Kenyan
   marketplaces do it.
2. **Obtain a PSP licence** — registered entity, capital, trust account, CBK authorisation. Correct
   at scale, disproportionate for a pilot.
3. **Direct settlement, no hold** — farmer's own Paybill, platform never touches the money. Honest
   and simple, but it **destroys the buyer protection that is UmojaHub's whole thesis**.

Option 3 is the answer to "why not just do direct payments?" — because direct payment means the
farmer is paid before delivery, which is the exact trust failure the platform exists to solve.

---

## 2. M-Pesa behaviour and buyer expectations

M-Pesa is not a card. The behavioural differences drive real design requirements.

- **The PIN prompt is the moment of truth.** Kenyan users expect a prompt on the handset within
  seconds and to be finished in under a minute. A checkout that spins with no prompt reads as
  broken.
- **The SMS confirmation is the receipt.** Users trust the Safaricom SMS with its receipt code more
  than any in-app screen. An app that shows a payment as complete *without* a matching M-Pesa code
  is distrusted. **Implication: the receipt code must be surfaced prominently**, and where it is
  simulated, that must be stated rather than implied.
- **Atomic debit.** There is no authorise-then-capture. Money leaves immediately and in full. A
  marketplace cannot "reserve" funds at the network — it must take them and hold them itself.
- **Payment is mobile-first and often on a low-end handset**, over intermittent data. Long-polling
  checkout screens must survive backgrounding and reconnection.
- **Costs are salient.** Users are acutely aware of transaction charges and expect to know who
  bears them.

## 3. Agricultural trade practice

- Traditional produce trade is **cash on collection**, often through a broker who is trusted
  personally rather than institutionally. The broker's function is exactly escrow — someone in the
  middle both sides accept.
- Farmers' principal fear is **delivering and not being paid**. Buyers' principal fear is
  **paying and receiving poor or no produce**. An escrow that addresses only one side does not
  change behaviour.
- **Pay-on-delivery is the incumbent**, and its weakness is that it does not scale beyond the range
  of personal trust. Escrow is the mechanism that lets a Nairobi buyer transact with a Kericho
  farmer neither of them knows.
- Farmers expect **payout to an M-Pesa number**, not a bank account.

## 4. Language

The workflow should speak the way M-Pesa does. Prefer the incumbent vocabulary:

| Use | Avoid | Why |
|---|---|---|
| "Enter your M-Pesa PIN" | "Authorise the transaction" | Matches what the handset says |
| "KSh 4,275" | "KES 4275.00" | Kenyan convention |
| "M-Pesa code" / "receipt code" | "Transaction reference" | What the SMS calls it |
| "Held by UmojaHub until you confirm" | "Funds in escrow" | "Escrow" is not everyday Kenyan English |
| "Paybill" | "Merchant account" | The familiar noun |
| "Money has not left your account" | "Payment was not captured" | Concrete, and what a user actually wants to know |

The word **escrow** is worth keeping in *administrative* and documentation surfaces where precision
matters, and worth translating into plain language on buyer and farmer surfaces. Existing copy on
the login page — *"A buyer's payment sits in escrow until they confirm what arrived"* — is a good
compromise: it uses the word and immediately defines it in the same sentence.

---

## Sources

- [Central Bank of Kenya — National Payment System Act, 2011 (No. 39 of 2011)](https://www.centralbank.go.ke/images/docs/legislation/NATIONAL%20PAYMENT%20SYSTEM%20ACT%20(No%2039%20of%202011)%20(2).pdf)
- [Central Bank of Kenya — Payment Service Providers authorization checklist](https://www.centralbank.go.ke/wp-content/uploads/2020/06/Payment-Service-Providers-Authorization-checklist.pdf)
- [KDS Advocates — Registration process for Payment Service Providers in Kenya](https://kdsadvocates.com/news-insights/psp-license-kenya/)
- [CM Advocates — How to get a PSP licence in Kenya](https://cmadvocates.com/blog/obtaining-a-psp-license-in-kenya-a-comprehensive-legal-and-regulatory-guide/)
- [PayAtlas — Central Bank of Kenya: licensing, oversight and scope](https://payatlas.com/regulator/cbk-4628)
- [IntaSend — Payment systems in Kenya, complete guide](https://intasend.com/payments/payment-systems-in-kenya-complete-guide-2026)
- [Safaricom — M-Pesa bulk payment (B2C) business payment portal](https://www.safaricom.co.ke/images/Downloads/M-PESA-bulk-payment-b2c.pdf)
