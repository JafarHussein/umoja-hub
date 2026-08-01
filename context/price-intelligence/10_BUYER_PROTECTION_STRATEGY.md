# 10 — Buyer Protection Strategy

**Status:** Draft for approval · **Date:** 2026-08-01 · **Depends on:** `06`, `08`, `09`

> **D14, D15 and D16 were fixed in Phase 0** (§5.1) rather than held for approval of this document, because the defect was live. The strategy below is what that fix implements; §4 remains the argument for it, and §1 remains open for approval.

The same engine, seen from the other side of the transaction. Documents `01`–`09` specify a farmer decision-support system. This one asks what the buyer is owed by it, and finds that the answer currently shipping is *nothing* — not by design, but by a silent authorization failure that has never been visible in any log or error state.

---

## 1. The asymmetry

The engine exists because a farmer facing a broker has no price information. That framing is correct, and it is also incomplete: it describes a two-sided information problem from one side only.

A buyer on UmojaHub — an institutional kitchen, a grocer, an aggregator — faces the mirror risk. They cannot tell an opportunistically priced crate of tomatoes from a fairly priced one, so they do what buyers without information always do: they negotiate everything, discount every listed price on principle, and treat the platform's numbers as an opening bid. `01` §1 already names the consequence — *"buyers, seeing both, learn that listed prices carry no signal and negotiate everything, which raises transaction cost for everyone and pushes volume back to the brokers the platform exists to disintermediate."*

This produces the governing constraint of this document:

> **An engine that serves only one side is not market infrastructure. It is an advocate.**

A platform whose price intelligence is structurally available to sellers and structurally unavailable to buyers has not made the market legible; it has moved the information asymmetry one seat over. Buyers who work that out stop trusting the listings, and the farmer-side benefit evaporates with them — a farmer's recommendation is only worth acting on if a buyer will transact at it.

**This does not mean symmetric features.** §4 is explicit that buyers receive a narrower object than farmers do, for reasons that are about manipulation rather than parity. It means symmetric *honesty*: the same statistic, the same uncertainty, no second number.

---

## 2. What already exists

Verified against source, in the manner of `01` §2.

**`src/components/marketplace/PriceFairness.tsx`** (78 lines) is mounted on the public listing detail page at `src/app/marketplace/[listingId]/page.tsx:161`, directly beneath the price and above the farmer trust panel. It takes the listing's `cropName`, `pickupCounty`, `unit` and `currentPricePerUnit`, calls `usePriceRecommendation`, and classifies the listing price against `data.range` into one of three verdicts:

| Verdict | Condition | Copy |
|---|---|---|
| `below` | `price < range.low` | "Below the typical market range — good value" |
| `within` | `low ≤ price ≤ high` | "Within the typical market range" |
| `above` | `price > range.high` | "Above the typical market range" |

It was built in the Marketplace Rebuild (Stage 7) and its header comment states the intent precisely: *"Honest by construction: when there isn't enough market data (no range), it renders nothing rather than a fake verdict. Guidance, never a gate."*

**That intent is right and this document preserves it.** Three of the four commitments in `08` §2 are already honoured here — it leads with a judgement, it is guidance rather than enforcement, and it declines to render rather than fabricate. The problems below are not problems of intent.

**Adjacent buyer signals on the same surface**, which this document does not touch and must not duplicate: `VerificationBadge` (listing verification), the farmer trust panel (composite score, tier, ratings), and `DeliveryConfidence`. Buyer protection in the wider sense — escrow release gating, `MediationRequest`, dispute states — is a separate programme with its own documents. **The scope here is price only.**

---

## 3. The finding: the buyer fairness signal has never rendered for a buyer

Four facts, each independently verified, compose into a defect that no error report could have surfaced.

1. **`/marketplace` is a public route.** It sits in the `EXEMPT_PREFIXES` whitelist at `src/middleware.ts:59`, alongside `/knowledge` and `/api/health`. Listing detail pages are reachable by anonymous visitors, and `revalidate = 60` on the page confirms they are meant to be.
2. **The recommendation endpoint is farmer-only.** `src/app/api/prices/recommendation/route.ts:21` calls `requireRole(session, Role.FARMER, Role.ADMIN)`. `requireRole` (`src/lib/utils.ts:68–78`) throws `401 AUTH_REQUIRED` with no session and `403 AUTH_FORBIDDEN` for any other role.
3. **The hook swallows the rejection.** `usePriceRecommendation` guards on `if (res.ok)` (`PriceRecommendationPanel.tsx:49`) and its `catch` block is empty by design — *"aborted or network error — leave previous data in place."* A 403 is neither thrown nor logged; `data` simply stays `null`.
4. **The component treats null data as thin data.** `PriceFairness.tsx:53` returns `null` when `!data`. The honest-by-construction fallback — render nothing rather than a fake verdict — is indistinguishable, at runtime, from being denied access.

Composed, the actual behaviour by audience:

| Viewer | Recommendation call | Fairness signal |
|---|---|---|
| Anonymous visitor | **401** | **Never renders** |
| **BUYER** | **403** | **Never renders** |
| STUDENT / LECTURER | **403** | **Never renders** |
| FARMER browsing the marketplace | 200 | Renders |
| ADMIN | 200 | Renders |

**D14. The buyer-facing price fairness signal renders for every audience except buyers.** It works for farmers looking at other farmers' listings — which is to say, it works for exactly the group that already has the full engine on their own listing form, and fails for the group it was named after and built for. Anonymous visitors, likely the largest share of traffic on a public marketplace, never see it either.

The failure mode deserves its own note, because it is the reason this survived review. There is no error, no empty state, no console warning, no log line, and no failing test. The component's most admirable property — refusing to render without evidence — is precisely what disguises the authorization denial as an honest absence of data. **A silent fallback that is correct for one cause and catastrophic for another is not a safe default**, and this pattern should be audited wherever else `if (res.ok)` guards a role-gated fetch from a public surface.

The whole `/api/prices/*` surface shares the posture: `/api/prices` is `FARMER, ADMIN` (`route.ts:22`) and all three alert routes are `FARMER`-only. Buyers have no price intelligence of any kind. D14 is the visible symptom; the access model is the cause.

### 3.1 Two further defects on the same component

**D15. The buyer verdict ignores confidence entirely.** `PriceFairness.tsx` reads only `data.range`. It never touches `data.confidence` or `confidenceBand`. A verdict computed from a national-fallback estimate over three points at confidence 20 is rendered in the same weight, colour and wording as one backed by forty completed county sales at confidence 85. This directly violates the third commitment of `08` §2 — *uncertainty is displayed, never hidden* — on the one surface where the reader has no other context to calibrate against. It also inverts the discipline of `01` §6: filtering deliberately shrinks the evidence pool and lets confidence carry the honesty, which only works if something actually renders confidence.

**D16. The verdict is computed client-side from a range, not from the engine.** The three-way comparison at `PriceFairness.tsx:58` is a second place in the codebase that decides whether a price is reasonable. `09` §5.2 established the rule that closes D4 — *there is exactly one place in this codebase that decides what a crop is worth* — and `09` §6 adds a server-computed `assessment` field driven by an optional `price` parameter. The buyer verdict must consume that field. Otherwise the farmer's listing form and the buyer's listing page can render contradictory judgements of the same price whenever their thresholds drift, and `08` §4's five-band farmer scale already differs from this component's three.

**A structural note, not a defect.** `PriceFairness.tsx:4` imports `usePriceRecommendation` from `@/components/foodhub/PriceRecommendationPanel` — the farmer panel that `08` §1 discards. The buyer surface has a build-time dependency on a component scheduled for replacement. The hook should move to a shared module before that work starts, or the reset will break the marketplace.

---

## 4. Resolution: a projection, not the engine

The obvious fix for D14 is to add `Role.BUYER` to the `requireRole` call and allow anonymous access. **That is the wrong fix**, for the same reason the KG-conversion table was the wrong fix for D1 in `01` §6: it solves the stated problem and creates a larger one.

The recommendation object specified in `09` §2 is a farmer decision-support instrument. It carries neighbouring-county medians, a forward outlook with a change band, weighted trend, demand, seasonality and point counts. Serving that object publicly would:

- **Hand the intermediation margin to intermediaries.** `06` §4.1 identifies the wholesale–retail spread as *"the clearest quantitative statement of the intermediation margin the platform exists to compress."* A public endpoint returning county-by-county medians and a forward outlook is an arbitrage map, and the brokers the platform exists to disintermediate are its most motivated consumers.
- **Arm one side of a negotiation.** A buyer holding the full range, the point count and a falling outlook is not informed; they are equipped to grind. The signal must tell a buyer whether *this* price is reasonable, not what the seller's floor is.
- **Expose the engine to unauthenticated scraping**, with a 10-minute cache that makes bulk extraction cheap.

**The platform already has the right pattern for this.** `cooperativeInsights.ts`, `ngoMarketHealth.ts` and `assistantPriceContext.ts` are each narrow projections of one `composeRecommendation` result, shaped for one audience. Buyer fairness becomes the fourth, and inherits the architectural guarantee of `04` §1.1 — the surface sees only what the projection hands it, so it cannot overstate what is known.

### 4.1 The buyer fairness contract

A projection computed from a recommendation the buyer never receives:

```ts
export interface BuyerFairness {
  assessment: 'WELL_BELOW' | 'BELOW' | 'IN_RANGE' | 'ABOVE' | 'WELL_ABOVE' | null;
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';
  basis: 'COUNTY' | 'REGION' | 'NATIONAL';
  windowDays: number;
}
```

| Field | Rationale |
|---|---|
| `assessment` | **Server-computed**, band names per `09` §3.5 — the same thresholds the farmer surface uses, so the two cannot contradict each other. Null when the engine has fewer than `MIN_POINTS` comparable observations. Closes D16. |
| `confidenceBand` | Band only, never the 0–100 score. Enough to calibrate, too coarse to reverse-engineer the point set. Closes D15. |
| `basis` | The geographic tier actually used, so "typical" is not read as local when it is national fallback. |
| `windowDays` | The evidence span. Staleness is a fairness question and a verdict drawn from a 90-day window must be legible as one. |

Provenance proper — named sources, observation dates, the newest point's age — belongs to the `basis` evidence ledger of `09` §3.6 and the administrator view of `11`. This contract deliberately does not pre-empt it.

**Deliberately excluded, and why:** `recommendedPricePerUnit` and `range` (the seller's number and floor — a negotiating position, not a fairness signal); `neighbours` (the arbitrage map); `outlook` (a buyer who knows prices will fall waits, which is a market-timing tool, not protection); `pointCount`, weights and trust inputs (`06` §3 — the panel must never present trust as having moved *this* price, and that rule is inherited here verbatim).

**Access.** The projection is served to any authenticated role and to anonymous visitors, because the marketplace is public and a fairness signal that requires an account is a fairness signal for people who already trust the platform. It is served from a **separate, listing-scoped route** — the buyer supplies a listing id, not a free crop/county/unit triple — so it cannot be swept across the taxonomy to reconstruct the engine. Rate limiting and the caching consequences of an anonymous surface are specified in `07`.

### 4.2 Rules the buyer surface inherits

1. **One statistic.** The buyer verdict and the farmer's assessment derive from the same `assembleRecommendation` output. Divergence is a defect (`08` §7).
2. **Guidance, never a gate.** No listing is blocked, flagged, badged as overpriced, or ranked down for being above the range. The current component's stance survives intact.
3. **Silence over guess.** Null `assessment` renders nothing — but the *cause* must now be distinguishable in logs, or D14 recurs in a new form.
4. **Trust never prices.** `06` §3 in full. Where evidence quality is mentioned, the phrasing is about evidence, not about the seller.
5. **No adversarial framing.** "Below the typical market range — good value" is defensible; anything that reads as *this farmer is overcharging you* turns a transparency feature into a bargaining weapon and will cost the platform its sellers.

---

## 5. Defects registered by this document

| # | Defect | Fix | Status |
|---|---|---|---|
| **D14** | The buyer fairness signal is mounted on a public page but calls a `FARMER`/`ADMIN`-only endpoint; the 401/403 is swallowed by an `if (res.ok)` guard and is indistinguishable from thin data. It has never rendered for a buyer or an anonymous visitor. | Listing-scoped `BuyerFairness` projection (§4.1), open to all roles and anonymous. Distinguish denial from absence. | **Fixed in Phase 0** |
| **D15** | The verdict ignores `confidence` — a three-point national fallback renders identically to a forty-point county median. | `confidenceBand` + `basis` in the contract; rendered, not merely returned. | **Fixed in Phase 0** |
| **D16** | The three-way verdict is computed client-side from `range`, a second place deciding whether a price is reasonable, with thresholds that already differ from `08` §4. | Server-computed five-band `assessment`, shared with the farmer surface. | **Fixed in Phase 0** for the buyer surface; unification with the `assessment` field on the recommendation object lands with `09`. |

**Carried, not a defect:** `PriceFairness.tsx` previously imported its hook from the farmer panel that `08` §1 discards. The Phase 0 fix removed that dependency as a side effect — the component no longer calls the recommendation endpoint at all — so the reset can proceed without breaking the marketplace.

### 5.1 What Phase 0 shipped

D14 was pulled into the Phase 0 correctness branch rather than held for approval of this document, because it is live.

| File | Change |
|---|---|
| `src/lib/intelligence/buyerFairness.ts` | New projection module. Pure `assessPrice` (five bands) + `projectBuyerFairness`, and the listing-scoped `getListingFairness`. |
| `src/app/api/marketplace/[listingId]/fairness/route.ts` | New public GET. `data: null` = no evidence; 404 = no listing; infrastructure failures propagate to a truthful 500 instead of a 404. |
| `src/components/marketplace/PriceFairness.tsx` | Consumes the projection. Renders confidence and geographic basis alongside the verdict. |
| `src/app/marketplace/[listingId]/page.tsx` | Passes `listingId`; the price and unit are now resolved server-side. |
| `src/lib/intelligence/__tests__/buyerFairness.test.ts` | Nine tests over the pure layer, including the band boundaries and the exclusion of seller-side fields. |

Two things worth recording from the implementation:

- **The 15% band boundary was a floating-point defect on first write.** `high * 1.15` evaluates to `229.99999999999997` for a high of 200, so a price exactly 15% above the range fell into `WELL_ABOVE`. The comparison is now proportional — `(price - high) / high > 0.15` — which puts the boundary where `08` §4 says it is. The same trap applies to the farmer surface when `09`'s `assessment` is implemented.
- **`getListingFairness` returns null for exactly one reason.** The original defect was caused by one null standing for several distinct causes. Collapsing "listing missing", "no evidence" and "database unreachable" into a single empty result is the pattern that hid D14, and the module is written so that it cannot recur.

---

**Next:** `11_ADMINISTRATOR_TOOLS.md` — the import path that `03` §2.2 makes load-bearing from day one, and the provenance record that answers "where did this number come from?"
