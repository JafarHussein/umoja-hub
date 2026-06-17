# Marketplace Design Direction — V1

**Owner-directed (2026-06-17). This REWRITES [05 Marketplace UX Research](05_MARKETPLACE_UX_RESEARCH.md)** — the earlier doc assumed a traditional product-card grid; that assumption is retired. Status: **capture for confirmation.** Governed by the [Foundation](UMOJAHUB_WEBAPP_FOUNDATION_V1.md).

## Philosophy (the north star)

**UmojaHub is not a social platform. It is a trust-based *sourcing* platform.** The marketplace optimizes for **confidence, not speed**. Most marketplaces rush a buyer from scrolling to buying; UmojaHub helps a buyer become **confident enough to buy**.

> The buyer should feel like they are **evaluating a trusted opportunity**, not impulse-buying a produce listing.

A listing is reframed as an **"Opportunity."**

## Buyers arrive with different intentions — support all of them

The product is **not** "feed vs. search." Three first-class entry points, by intention:

| Entry point | Buyer intention | Answers | Weight |
|---|---|---|---|
| **Search** | "I know exactly what I need" (20kg tomatoes · Nakuru · this week · verified only) | *Can you help me find exactly what I need?* | ~45% |
| **Discovery** (feed) | "I'm exploring the market" (what's available, who's newly verified, which prices are changing) | *What opportunities exist?* | ~35% |
| **Post a Need** | "Can suppliers come to me?" | *Reverse marketplace — suppliers respond to me* | ~20% |

```
Marketplace
├── Search        → intent-driven buying
├── Discovery     → opportunity-driven buying
└── Post a Need   → reverse marketplace
```

Search never replaces the feed; the feed never replaces search. They solve different problems and coexist.

## The Opportunity card (the feed unit — NOT a product card)

Framed as an opportunity, trust-forward. Owner's reference:

```
OPPORTUNITY
Tomatoes · 2.4 Tons
Trust Score 92 · Verified Farmer
Market Avg 78/kg · Seller Price 85/kg
Delivery Confidence 96%
[Inspect Opportunity]
```

Signals on the card: produce + quantity, **Trust Score**, **Verified** status, **market context** (market avg vs. seller price), **Delivery Confidence**, and a single CTA — **Inspect Opportunity** (not "Buy").

## The buyer spine — confidence before commitment

```
Discover → Inspect → Build Confidence → Commit → Pay → Track → Review
```

- **No inline quick-buy** (it encourages payment before evaluation).
- **No "buying hidden elsewhere"** (needless friction).
- Between discovery and payment sits the **Opportunity Review layer** — a confidence-building surface, *not* a checkout page. It explains:
  - Who the farmer is · why they're trusted · their **delivery history**
  - **Cooperative membership** · **market context**
  - **Recourse mechanisms** · **payment protection**
- Only after that: **Commit to Purchase → M-Pesa Payment → Track → Review.**

## Procurement workflows (larger buyers)

Beyond single opportunities, support sourcing at scale:
- Build a **basket across multiple farmers**
- **Request terms**
- **Post sourcing requests** (ties to "Post a Need")
- **Compare trusted suppliers**

The experience reads like **making a well-informed sourcing decision**, not social commerce.

## Social signals (no likes)

- **No likes.**
- **Reviews → the farmer** (reputation; feeds the Trust Score). *(Confirm: review scope/rules.)*
- **Comments / Q&A → the opportunity** (freshness, pickup, terms). *(Confirm: keep comments, or reviews-only to limit moderation on a trust platform?)*

## Device-specific (explicit owner requirement)

**Distinct designs for desktop and mobile** — the sourcing/discovery experience is not a single responsive layout; desktop (procurement, comparison, dense evaluation) and mobile (discovery, on-the-go inspection) get purpose-built designs.

## Flags — design implies these (do NOT assume they exist; verify, never touch logic)

- **Delivery Confidence / delivery reliability %** — a new trust signal; confirm whether the backend can compute it (orders/fulfillment exist; a reliability metric may be new).
- **Market context** (market avg vs seller price) — price-history data exists; confirm coverage per crop/county.
- **"Newly verified" / "prices changing"** discovery surfaces — derive from existing verification + price-history data.
- **Post a Need / procurement** — likely new surfaces; confirm backend scope before designing flows that imply it.

## What this changes downstream

- Rewrites deliverable 05; updates the **IA marketplace section** (Search / Discovery / Post-a-Need, Opportunity Review layer).
- Adds to the **trust vocabulary**: `OpportunityCard`, `DeliveryConfidence`, `MarketContext`, `OpportunityReview`.
- The buyer journey in the forthcoming end-to-end map follows the confidence spine above.

## Amendment — Opportunity card refinement (owner-directed 2026-06-18)

The Opportunity card moves further toward an **operational-trust** (not retail) aesthetic. Changes, applied across Search results (B-03), Discovery desktop + mobile (B-04), Need responses (B-06), and the Opportunity Review hero (B-07):

- **Primary CTA: `View details`** (replaces `Inspect Opportunity`) — a soft gateway into the Opportunity Review *before* any transactional surface; lowers the psychological barrier to entry. (Intent unchanged: still evaluation-before-commitment, no inline quick-buy.)
- **Action micro-copy** under the CTA — operational context in produce terms: *"See farmer, delivery history & recourse."*
- **Requirement label** (`Requires: Verified buyer`) — a subtle metadata chip shown **only on high-value lots (≥ 1 ton)**, surfacing system requirements before interaction. Built to render **conditionally** (component variant), not on every card.
- **Clean-room layout** — minimal borders (single hairline above the CTA), disciplined label/value spec rows, visual weight on **utility signals** (market avg vs seller price, **Delivery Confidence** emphasized) rather than the photo.
- **Deferred to the Design System gate:** the high-contrast / dark "operational console" treatment — to be achieved **without** inheriting the visual language of Stripe / AWS / etc. (Foundation forbidden-influences rule still holds). Lo-fi stays grayscale.
- **Translation note:** the originating brief used software-catalog terms (modules, configuration specs, "Level: Standard", system requirements); these were mapped to the produce domain — UmojaHub trades agricultural produce, not software modules. No literal software framing was introduced.
