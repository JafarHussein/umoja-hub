# Marketplace UX Research — Food Security Hub

**Reset deliverable 5** (Gate 2). Builds on [04 User Research](04_USER_RESEARCH_FINDINGS.md). Grounded in the actual marketplace behaviour + cited two-sided-marketplace evidence. Research input, not design decisions.

## The platform as it actually works (code-true)

- **Open browse, no account required** — anyone can view verified listings.
- **Two sides:** FARMER (list produce, receive & fulfill orders) and BUYER (browse, evaluate, purchase).
- **Payment: M-Pesa STK push *before dispatch*. No escrow. No commission.** The buyer commits money before the goods move.
- **Reputation = the Farmer Trust Score + verification status.** Buyers can rate after orders; there is **no dispute-resolution workflow or chargeback** today.

## The core UX problem

A buyer must **send money to a stranger before the goods are dispatched, with no escrow and no formal dispute path.** Therefore the **trust signals carry the entire weight of the decision.** This is the defining constraint of the whole surface: the UI's job is to let a buyer evaluate an unknown farmer well enough to part with money first — and to do it on a possibly modest device/connection.

## Evidence-based patterns that apply

- **Trust signals drive conversion more than aesthetics, and belong *above the fold* on the listing** (reviews, verification badges, transaction counts, response signals). *(Evidence.)*
- **Two-sided markets serve two different mental models** — *reduce friction for the seller, visualize trust for the buyer, and scale governance.* Neither side is secondary. *(Evidence.)*
- **Reputation is effectively one-sided here** (buyers rate farmers; the farmer's reputation *is* the Trust Score). That's legitimate (eBay/Amazon-style), but rating UIs should consider **simultaneous-reveal / non-retaliatory** design so farmers aren't punished for honest disputes. *(Evidence/Hypothesis.)*
- **Social proof reduces peer-to-peer uncertainty** when integrated into listings, search results, and profiles — not bolted on. *(Evidence.)*

## Platform-specific implications (inputs to the foundation)

1. **The listing is the decision surface.** Trust Score + verification badge + the signals a buyer needs must be **glanceable at the top** and **explorable in depth** (how the score is built, what it doesn't guarantee).
2. **Recourse must be visible *before* purchase, not discovered after failure** — and stated honestly (today: a rating, not a dispute workflow). Hiding the absence of escrow would manufacture false confidence and destroy trust on first failure.
3. **Payment status must be unambiguous and prominent** — the buyer's peak anxiety is "did my money go, and will the goods come?" Lean on the M-Pesa mental model buyers already trust (91% penetration).
4. **Farmer-side friction must be near-zero and low-bandwidth.** Listing produce and confirming fulfillment are the farmer's core tasks; per Gate 1, complexity here loses farmers. Simple forms, clear states, tolerant of slow connections.
5. **Density adapts by side:** buyer browse = scannable, signal-rich, image-light-enough for 2G; farmer management = a small number of high-clarity actions.

## Honesty / limitation pairing (mandatory)

No escrow, no chargeback, no dispute workflow, simulated payments in pilot. The UI must pair each capability with its limit *in the same view* — over-claiming protection is the fastest way to lose the trust the platform sells.

## Open questions to validate

- Do real buyers actually **comprehend the Trust Score** enough to act on it? (Comprehension test the real artifact.)
- Should ratings use **simultaneous reveal** to prevent retaliation, given there's no dispute path?
- What is the **minimum viable trust-signal set** above the fold for a low-bandwidth buyer?

## Sources

- [LogRocket — Trust-driven UX (Airbnb, PayPal)](https://blog.logrocket.com/ux-design/trust-driven-ux-examples/)
- [Tadelis — Reputation & feedback systems in online platform markets (Berkeley)](https://faculty.haas.berkeley.edu/stadelis/Annual_Review_Tadelis.pdf)
- [Designing online marketplaces: trust & reputation mechanisms (U. Chicago)](https://www.journals.uchicago.edu/doi/full/10.1086/688845)
