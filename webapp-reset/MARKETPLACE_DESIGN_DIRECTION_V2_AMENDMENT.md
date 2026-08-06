# Marketplace Design Direction — Amendment: discovery is not evaluation

**Owner-directed (2026-08-06).** Amends [MARKETPLACE_DESIGN_DIRECTION_V1](MARKETPLACE_DESIGN_DIRECTION_V1.md).
Status: **capture for confirmation.** Governed by the [Foundation](UMOJAHUB_WEBAPP_FOUNDATION_V1.md).

> Written as an artifact to react to, not a question to answer. It records a **conflict with V1 and
> with the IA gate** that the owner should resolve deliberately rather than by accident.

---

## 1. The correction

The feed is for **discovery**, not evaluation. Its only job is to help a buyer decide *whether to
open a listing*. Everything else belongs deeper in the journey, where the decision it serves is
actually being made.

Card content is therefore reduced to five questions: **what is being sold, how much, where, who is
selling it, is it worth opening?**

## 2. What changed on the Opportunity/listing card

| Element | Before | Now | Why |
|---|---|---|---|
| Category chip | On every card | **Removed** | The buyer reached the card *by* category — search, filter, or the category nav. "Vegetables" under a photo of spinach restates the query they just made. 28 of 49 seeded listings are `VEGETABLES`, so it barely partitions the feed either. |
| Verified ribbon | On every card | **Removed from the card**; kept on listing detail, farmer, checkout | See §3 — this is the contested one. |
| "New" ribbon | On recent cards | **Removed** | It repeated the body text three lines below, which already reads "Kericho · Today". |
| "Almost gone" | On low-stock cards | **Kept** | Scarcity appears nowhere else on the card, changes whether to open *now* rather than later, and is true of few listings. It still discriminates. |
| Trust Score | Brand-coloured | **Kept**, de-emphasised to muted, moved to the card foot | It survives the cut the Verified badge did not, because it is **earned and it varies** — a 51 and an 82 are different propositions, where "Verified" and "Verified" are not. |
| Spacing | `p-3`, hairline divider | `p-4`, divider removed, price given room | The space the chips gave back is spent on breathing room, not refilled. |

Four photo overlays became one.

## 3. The Verified badge — and where this conflicts with V1

**V1 explicitly specifies `Verified Farmer` on the card** and calls the card "trust-forward".
**`IA_INFORMATION_ARCHITECTURE_V1.md` §Browse** specifies "trust signals above the fold".
**This amendment contradicts both.** That is the decision to confirm.

### The argument for removing it

Verification is a **precondition of publishing** — `POST /api/marketplace` refuses a listing unless
`farmerData.isVerified`, and stamps `isVerifiedListing: true` at creation. So in the production
contract the badge marks **100% of listings**. A signal carried by everything carries nothing, and
a badge that means nothing teaches people to skip badges that do. Verification is a property *of
the marketplace*, not of any listing within it, and belongs stated once — not stamped 35 times on
one screen.

This matches the researched pattern: *"When every card has a badge, none of them mean anything"*;
*"badges that don't mean anything train users to ignore signals"*; and most directly — **"a good
trust signal isn't a claim, it's proof placed at the moment of doubt."** One documented case saw a
**12% conversion drop** from adding prominent trust badges. Trust belongs where trust decisions are
made: listing detail, farmer profile, checkout, order review.

### The complication the owner should see

**The seeded data disagrees with the production contract.** 18 of 49 listings carry
`isVerifiedListing: false`, because the demo seeder writes to the database directly and bypasses
the API rule. Every card looked verified only because the default sort is `isVerifiedListing: -1`.

So one of these is true, and it is not a design question:

- **(a) The seed is unrealistic.** Production cannot create an unverified listing, the badge really
  is 100%, removing it is right, and the seeder should be corrected to match.
- **(b) The platform intends to allow unverified listings** (e.g. verification can lapse, or a
  grandfathered route exists). Then the badge *does* discriminate, and removing it hides a real
  signal — in which case the right move is to **badge the exception, not the norm**: show nothing
  for the verified majority and mark the unverified minority, which is also the stronger pattern.

**This amendment implements (a)**, because it is what the code enforces. If (b) is intended, the
card changes back to an inverted, exception-only marker rather than to a badge on every card.

### A consequence worth noting

The **"Verified farmers only" filter** is a no-op under (a) — it can never exclude anything a real
user created. It is currently meaningful only against seeded data. Under (a) it should be removed;
under (b) it stays and the card marks the exception.

## 4. Progressive disclosure — where information now lives

```
Feed          price · title · county · freshness · farmer · Trust Score · (scarcity)
   ↓
Listing       + verification · trust tier · protections · availability · pickup · market context
   ↓
Checkout      + escrow terms · payment · what releases the money
   ↓
Order         + receipt code · escrow state · recourse · mediation
```

Nothing was deleted from the product. It was **relocated to the screen whose decision it serves.**

## 5. What is NOT changed

- The V1 confidence spine — Discover → Inspect → Build Confidence → Commit → Pay → Track → Review.
- No inline quick-buy; the listing remains a gateway to evaluation.
- Trust Score, Delivery Confidence staging, structured reviews — all V1 decisions stand.
- No platform logic touched. This is presentation only.

## 6. Open for the owner

1. **(a) or (b)** in §3 — the only genuinely blocking question, because it inverts the card.
2. Whether "Verified farmers only" survives as a filter (§3).
3. Whether the IA line "trust signals above the fold" should be amended to read *trust signals at
   the point of evaluation*, so IA and this direction stop disagreeing.

---

## Sources

- [Setproduct — Badge UI design: notification, count and status patterns](https://www.setproduct.com/blog/badge-ui-design)
- [Mavik Labs — Design for trust: UI patterns that build credibility](https://www.maviklabs.com/blog/design-for-trust-2026/)
- [Eleken — Badge UI: design principles, types and real examples](https://www.eleken.co/blog-posts/badge-ui-design)
- [LogRocket — Trust-driven UX: what I learned from Airbnb, PayPal and more](https://blog.logrocket.com/ux-design/trust-driven-ux-examples/)
- [Gapsy — The ultimate guide to marketplace design](https://gapsystudio.com/blog/marketplace-ui-ux-design/)
