# 06 · Academic defence notes and future evolution roadmap

Deliverables 9 and 10. Every answer below is supported by `01`–`04`.

---

## The questions, and the answers

### "Why is the payment simulated? Isn't that just a mock?"

Two separate reasons, and the second is the important one.

The immediate reason is that production Daraja access was refused. Safaricom does not issue
production credentials to individuals: it requires a registered business entity, a business KRA PIN
certificate, and an already-active Paybill or Till.

The deeper reason is that **it would still be simulated even with Daraja access**, because the part
being simulated is *custody*, and custody is a licensed activity under the National Payment System
Act, 2011. UmojaHub is not a Payment Service Provider and cannot lawfully hold third-party funds.

It is not a mock. A mock returns success. This simulator models the real outcome distribution —
insufficient funds, user cancellation, DS timeout, network failure, **lost callbacks**, duplicate
deliveries and variable latency — and emits genuine Daraja-shaped payloads carrying Safaricom's
actual `ResultCode` values (`0`, `1`, `1032`, `1037`, `1001`, `1025`). The simulator and the real
webhook feed the *same* processor, so the order system cannot tell which produced an event.

### "Why not just use direct payments to the farmer?"

Because direct payment pays the farmer before delivery, which is precisely the trust failure the
platform exists to solve. The buyer's fear is paying and receiving nothing; the farmer's is
delivering and not being paid. Direct payment solves only the farmer's. Escrow is the mechanism
that lets a Nairobi buyer transact with a Kericho farmer neither of them knows — the institutional
version of the broker Kenyan produce trade already relies on.

### "Are you allowed to hold people's money?"

**No, and we do not.** This is the strongest answer in the set, because it is a designed position
rather than an excuse.

UmojaHub implements the **control plane** of an escrow marketplace in full — the state machine,
release conditions, two-sided adjudication, append-only audit trail, settlement queue. The
**custody plane** is simulated, because custody requires CBK authorisation, segregated client
accounts and a trust arrangement.

This is the same line Stripe draws. Stripe runs the control plane for a large share of the world's
marketplaces and still **refuses to call it escrow**, offering "delayed payouts" instead, precisely
because custody is regulated. UmojaHub separating the two is standard practice, not a workaround.

### "Why involve an administrator? Isn't that unscalable?"

It is deliberately the exception path, not the normal one. The normal release is automatic on buyer
confirmation. The administrator exists for the case both parties disagree — and every escrow system
studied has an adjudicator, because a dispute is by definition something the state machine cannot
resolve. Every administrative action is recorded with actor, amount, reason and timestamp. It does
not scale to millions, and it does not need to: disputes are a small fraction of orders, and the
alternative — an automatic rule that decides contested facts — would be worse.

### "How does this protect the buyer?"

Money is not released on payment; it is released on *confirmed receipt*. The buyer can escalate.
Non-delivery refunds and returns the produce to sale. Every step has a timestamped record.

### "How does this protect the farmer?"

Funds are confirmed held before dispatch, so the farmer never ships on a promise. The farmer can
*also* escalate — including for a buyer who has received produce but will not confirm, which is the
seller's classic exposure in a buyer-confirmation model. Trust score rewards prompt dispatch.

### "What stops a buyer confirming receipt to release funds during a dispute?"

Nothing did, until this audit. The confirmation gate checked only the fulfilment status, and a
disputed order sits in exactly that status. It now refuses while a review is open — and the refusal
is enforced at the API, not only hidden in the interface.

### "What if the callback never arrives — how do you know the buyer wasn't charged?"

The honest answer before this programme was: *we did not know, and we told the buyer their money
was safe anyway.* That was the most serious defect found. The system now consults the provider's
query endpoint before concluding, and where the provider cannot answer, the payment is recorded as
**unresolved** and raised to an administrator rather than silently called a failure.

### "What changes when UmojaHub goes live?"

One environment variable selects the provider; the business logic does not change. But the honest
answer is that going live is **not** primarily a Daraja problem — it is a custody problem, solved
by partnering with a licensed PSP. See the roadmap below.

### "Isn't a KES 1 real payment more convincing?"

It was investigated and rejected on evidence. Sandbox STK Push cannot reach a real handset — only
Safaricom's test MSISDN. Reaching a real phone requires production credentials, which is the access
that was refused. It is not a partial alternative to production; it *is* production, for one
shilling. And it would be *less* honest: a real receipt for an amount unrelated to the order, and a
real debit the escrow ledger does not account for.

---

## Future evolution roadmap

### Stage 1 — Now: complete and honest control plane
Simulated custody, clearly disclosed. Query leg, unresolved state, authenticated webhook, escrow
explainer. *(This programme.)*

### Stage 2 — Licensed PSP partnership *(recommended production route)*
Integrate a CBK-licensed provider that holds client funds under its own licence (IntaSend, Pesapal
and similar). UmojaHub keeps its control plane and delegates custody. Requires: provider selection
and due diligence, a `PaymentProvider` implementation, a settlement/payout adapter replacing the
manual queue, reconciliation against provider statements. **No licence required by UmojaHub**, and
it is how comparable Kenyan marketplaces operate.

### Stage 3 — Direct Daraja for collection
Registered entity, business KRA PIN, Paybill, production go-live. Gives control of the collection
leg and lower fees. Note this **does not by itself solve custody** — funds landing in an unlicensed
operator's Paybill and being held pending delivery remains regulated activity.

### Stage 4 — Own PSP authorisation
Only at scale. Capital requirements, trust account, segregated client funds, CBK reporting.
Disproportionate before meaningful volume.

### Stage 5 — Automated payouts
Replace the manual payout queue with M-Pesa B2C bulk disbursement, keeping administrative approval
as the control. Sequenced last deliberately: automating settlement before the dispute and
reconciliation machinery is proven would remove the last point at which a bad payment can be stopped.

---

## The one-paragraph defence

> UmojaHub implements the complete control plane of a marketplace escrow system — a derived escrow
> state machine, release gated on confirmed receipt, two-sided adjudication, append-only audit of
> every custodial decision, and a settlement queue that separates *earned* from *paid*. The M-Pesa
> custody leg is simulated, and prominently disclosed as such, for two reasons: production Daraja
> credentials require a registered business entity we do not have, and holding third-party funds in
> Kenya requires Central Bank authorisation that a pilot should not hold. The simulation is not a
> happy-path mock — it reproduces Safaricom's real result codes and failure distribution, including
> lost callbacks, and feeds the identical processor the real webhook would. The production path is
> not "switch on Daraja"; it is to delegate custody to a licensed Payment Service Provider while
> keeping the control plane we have built.
