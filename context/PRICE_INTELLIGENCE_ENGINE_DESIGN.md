# UmojaHub Price Intelligence Engine — Design

**Status:** Design proposal (pre-code). **Date:** 2026-06-22.
**Scope:** A platform-wide economic intelligence layer that turns a farmer's blank "Enter your price" field into evidence-based guidance, and surfaces market context to buyers, admins, cooperatives, NGOs, and the AI assistant.

This document is the answer to one question: *when a farmer creates a listing, how does UmojaHub help them set a fair price?* Everything else (buyer fairness, admin analytics, AI grounding) is the same engine, read from a different seat.

> **Governing principle — reuse, don't duplicate.** UmojaHub already records every asking price and every completed-sale price in a single insert-only event log (`PriceHistory`). That log is the source of truth. The engine *reads and weights* it; it does not create a second pricing store. No platform logic (auth, escrow, orders, trust, payments, schema contracts) is modified — the engine is strictly additive and read-only over existing collections.

---

## Deliverable 1 — Price Intelligence Architecture

### 1.1 Where it lives
A dedicated, form-independent domain module, mirroring the existing `src/lib/trust/` (pure calculator) and `src/lib/integrations/priceDataService.ts` (aggregation helpers) patterns:

```
src/lib/intelligence/
  priceIntelligence.ts        # the engine: composeRecommendation() + sub-scorers (pure where possible)
  weighting.ts                # data-point weighting (recency × source × trust × geo)
  demand.ts                   # demand scoring from existing signals
  trend.ts                    # rising / stable / falling classification
  seasonality.ts              # static Kenya crop-season calendar (code constant)
  regions.ts                  # COUNTY → REGION map + fallback hierarchy (code constant)
  insight.ts                  # deterministic natural-language insight builder
  __tests__/                  # adjacent unit tests (engine is the new high-value logic to cover)
```

The engine is a **library**, not a route and not a React component. Routes and the AI assistant call it; it never imports them. This is the "engine should be independent, not embedded inside forms" requirement (Phase 2).

### 1.2 Layered design
```
                 ┌─────────────────────────────────────────────┐
   READ MODELS   │ PriceHistory · MarketInsight · Order ·       │  (existing, unchanged)
                 │ MarketplaceListing · FarmerTrustScore ·      │
                 │ FarmerGroup · NgoOrganization                │
                 └───────────────────────┬─────────────────────┘
                                         │  aggregation + .lean() reads
                 ┌───────────────────────▼─────────────────────┐
   ENGINE        │  src/lib/intelligence/priceIntelligence.ts   │
                 │  composeRecommendation(crop, county, qty?)   │
                 │   → weighting · demand · trend · seasonality  │
                 │   · regional fallback · confidence · insight  │
                 └───────────────────────┬─────────────────────┘
                                         │  one typed object: PriceRecommendation
        ┌────────────────┬───────────────┼───────────────┬────────────────┐
   API  │ /api/prices/   │ /api/prices/  │ /api/admin/   │ /api/groups/   │ assistant
        │ recommendation │ fairness      │ price-        │ [id]/price-    │ (context
        │ (farmer)       │ (buyer)       │ analytics     │ insights       │ injection)
        └────────────────┴───────────────┴───────────────┴────────────────┘
```

### 1.3 The core contract
```ts
// src/lib/intelligence/priceIntelligence.ts
export interface PriceRecommendation {
  crop: string;
  county: string;
  unit: string;
  recommendedPricePerUnit: number | null;     // weighted median, the headline number
  range: { low: number; high: number } | null; // weighted IQR band
  regionalAveragePerUnit: number | null;        // county (or fallback) weighted mean
  nationalAveragePerUnit: number | null;
  expectedEarningsKES: number | null;           // recommended × quantity (when qty supplied)
  demand: { level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'; score: number };
  trend: {
    direction: 'RISING' | 'STABLE' | 'FALLING';
    changePct7d: number | null;
    changePct30d: number | null;
    changePct90d: number | null;
  };
  season: { phase: 'IN_SEASON' | 'PEAK_SUPPLY' | 'LOW_SUPPLY' | 'OFF_SEASON' | 'UNKNOWN' };
  confidence: number;                           // 0–100
  insight: string;                              // deterministic, grounded sentence(s)
  basis: {
    dataPointCount: number;
    completedSaleShare: number;                 // 0–1, how much is real-transaction backed
    geoScope: 'COUNTY' | 'REGION' | 'NATIONAL'; // how wide we had to look
    windowDays: number;
  };
}

export async function composeRecommendation(input: {
  crop: string; county: string; unit: string; quantity?: number;
}): Promise<PriceRecommendation>;
```

A single async call returns everything every seat needs. Each consumer projects the subset it shows.

### 1.4 Degradation contract (non-negotiable)
The engine **never throws to its callers** and **never blocks listing creation**. With no data it returns `recommendedPricePerUnit: null`, `confidence: 0`, `geoScope: 'NATIONAL'`, and an honest insight ("Not enough verified activity yet to recommend a price for *kale* in *Lamu*."). This matches the existing graceful-degradation discipline in `priceDataService.ts` and `groqService.ts`.

---

## Deliverable 2 — Data Sources Audit

What pricing-relevant data **already exists** (verified against the codebase), and how the engine uses each. No new source of truth is introduced.

| Source | Shape (actual) | What the engine derives | Quality |
|---|---|---|---|
| `PriceHistory` (`models/PriceHistory.model.ts`) | `cropName, county, pricePerUnit, unit, source(LISTING_CREATED\|ORDER_COMPLETED\|EXTERNAL_INGESTION), farmerId?, orderId?, recordedAt`; indexed `{cropName,county,recordedAt:-1}` | **Primary signal.** Every asking price + every completed-sale price. Weighted by recency/source/trust/geo. | High — already written on listing create (`marketplace/route.ts:234`) and order completion (`orders/[orderId]/status/route.ts:184`). |
| `MarketInsight` (`models/MarketInsight.model.ts`) | weekly rollup per `cropName+county`: `averageListingPrice, averageTransactionPrice, low, high, middlemanBenchmark, platformPremium, dataPointCount` | Cached weekly baseline + middleman benchmark for the "vs middleman" framing. | Medium — only materializes weekly, only for pairs with ≥3 points. |
| `MIDDLEMAN_BENCHMARKS` (`integrations/priceDataService.ts:94`) | static map, 10 crops (maize 35 … coffee 380 KES/kg) | "Above/below the broker rate" framing; demand/season sanity floor. | Low coverage (10 crops) — engine treats as optional context, never as the recommendation. |
| `Order` (`models/Order.model.ts`) | `pricePerUnit, quantityOrdered, totalAmountKES, paymentStatus, fulfillmentStatus, paidAt, receivedByBuyerAt, disputeFlaggedAt` | **Demand velocity** (order count, sell-through), and the *completed/disputed* split that drives trust weighting. | High. |
| `MarketplaceListing` (`models/MarketplaceListing.model.ts`) | `cropName, currentPricePerUnit, quantityAvailable, pickupCounty, listingStatus, viewCount` | **Supply density** (active listing count) + `viewCount` as the only first-party interest signal. | Medium — `viewCount` is the sole "interest" signal; honest demand uses it sparingly (see Deliverable 5). |
| `FarmerTrustScore` (`models/FarmerTrustScore.model.ts`) | `compositeScore, tier(NEW\|ESTABLISHED\|TRUSTED\|PREMIUM)` per farmer | **Trust weighting** — a PREMIUM farmer's realized price counts more than an unverified newcomer's asking price. | High. |
| `FarmerGroup` (`models/FarmerGroup.model.ts`) | `members[], county, sponsoredByNgoId` | Cooperative-scoped averages (member price benchmarking). | High. |
| `NgoOrganization` + `GET /api/transparency` | aggregate indicators | NGO market-health view (regional availability/income proxies). | Medium. |
| Seeded ecosystem (`scripts/seed.ts`, `scripts/simulate/generators/commerce.ts`) | months of back-dated listings, orders (65% completed / 15% held / 8% dispute / 12% failed), `PriceHistory`, ratings, trust | **The realism backstop** (Phase 16). The engine looks credible on day one because the ecosystem already wrote believable `PriceHistory` series across counties and crops. | High for demo. |

**Honest gaps (stated, not papered over):**
- There is **no search log, no saved-listings/watchlist model, no purchase-attempt log.** Phase 5 of the brief lists those as demand inputs; they don't exist. The engine therefore derives demand only from signals that *do* exist (views, order velocity, sell-through, supply density) and clearly labels demand confidence lower than price confidence. Capturing richer demand signals is an **optional, additive** later phase (Deliverable 4), never a P0 fabrication.
- `EXTERNAL_INGESTION` is a defined-but-unused enum value. The engine is built to consume it the day a real external feed (e.g. KAMIS) is wired, but ships without inventing fake external numbers.
- Buyers/public currently have **no** price API access at all (`/api/prices` is FARMER/ADMIN only). Buyer fairness (Deliverable 7) is a deliberate, owner-gated scope addition.

---

## Deliverable 3 — Pricing Algorithm Design

The recommended price is a **weighted robust statistic** over `PriceHistory`, not a naive mean. Today `GET /api/prices` returns a flat average that mixes aspirational asking prices and real sales equally — the engine fixes exactly that.

### 3.1 Per-data-point weight
For each `PriceHistory` point `p` in the window:

```
weight(p) = w_recency · w_source · w_trust · w_geo

w_recency = 0.5 ^ (ageDays(p) / HALF_LIFE_DAYS)     // HALF_LIFE_DAYS = 21
w_source  = ORDER_COMPLETED → 1.0                    // a real, settled transaction
            LISTING_CREATED  → 0.6                    // an asking price (aspirational) — softened
                                                      //   from 0.5 (owner decision 2026-06-22) so
                                                      //   thin pilot markets have enough evidence;
                                                      //   recency + trust weights do the filtering
            EXTERNAL_INGESTION → 0.7                  // future external feed
w_trust   = tier of p.farmerId →  PREMIUM 1.30 · TRUSTED 1.15 · ESTABLISHED 1.00 · NEW 0.85
w_geo     = exact county 1.0 · same region 0.6 · national fallback 0.3
```

Disputed/refunded context: points whose `orderId` resolved to a `DISPUTED`/`REFUNDED` order are **down-weighted to 0.25** (Phase 8 — "disputed lower"); points from `FAILED`/cancelled orders never produced a `PriceHistory` row in the first place, so they're naturally ignored (verified in `commerce.ts` — failed orders write no completion row).

### 3.2 The headline number — weighted median
```
recommendedPricePerUnit = weightedMedian(points, weight)   // robust to outliers/typos
range = { low: weightedPercentile(25), high: weightedPercentile(75) }   // the "market range"
```
Median (not mean) so one fat-fingered KES 7,500 listing can't drag the recommendation. The IQR band is the "Market Range: KES 68–82" the brief shows. We also compute the weighted **mean** and surface it as `regionalAveragePerUnit` ("Regional Average: KES 74") — the brief explicitly wants both average and median.

### 3.3 Privacy / anti-gaming floor
A recommendation is only surfaced when `dataPointCount ≥ MIN_POINTS (=3)` **after** geo-fallback — same threshold the weekly cron already enforces (`market-insight/route.ts:52`). Below that, `recommendedPricePerUnit = null` and the UI shows the honest empty state. This prevents (a) leaking a single farmer's price and (b) a farmer gaming the recommendation by self-listing.

### 3.4 Confidence (0–100)
```
effectiveN   = Σ weight(p)                                   // weighted sample size
nFactor      = 1 − exp(−effectiveN / 6)                      // saturates as evidence grows
recencyFactor= share of weight from last 14 days  (0–1)
sourceFactor = 0.5 + 0.5 · completedSaleShare               // real sales raise confidence
geoFactor    = COUNTY 1.0 · REGION 0.8 · NATIONAL 0.55
confidence   = round(100 · nFactor · (0.4 + 0.6·recencyFactor) · sourceFactor · geoFactor)
```
The "92%" in the brief is earned: lots of recent, county-local, completed sales from trusted farmers. A thin, stale, national-fallback estimate honestly reads ~35%. Because `geoFactor` for NATIONAL is 0.55, a national-fallback estimate **cannot display above ~60%** — fallback-padded numbers can never look authoritative.

**Display (owner decision 2026-06-22):** show the number *and* a band — e.g. **"89% · High confidence"** (High ≥75 · Medium ≥50 · Low <50) — so the precise figure demos well without implying false precision on thin data.

### 3.6 Locked constants (2026-06-22)
| Constant | Value | Source |
|---|---|---|
| `HALF_LIFE_DAYS` | 21 | recommendation |
| `w_source` LISTING_CREATED | **0.6** | owner (softened from 0.5) |
| `w_source` ORDER_COMPLETED / EXTERNAL | 1.0 / 0.7 | recommendation |
| `w_trust` PREMIUM/TRUSTED/ESTABLISHED/NEW | 1.30 / 1.15 / 1.00 / 0.85 | recommendation |
| `w_geo` county/region/national | 1.0 / 0.6 / 0.3 | recommendation |
| disputed/refunded point weight | 0.25 | recommendation |
| headline statistic | weighted **median** (mean shown as Regional Average) | recommendation |
| `MIN_POINTS` floor | 3, **with aggressive region→national fallback to clear it** | owner |
| confidence display | percentage **+** High/Medium/Low band; national-fallback capped ~60% | owner |
| seasonal crop coverage | the 10 system crops (maize, beans, tomatoes, potatoes, kale, capsicum, tea, coffee, rice, dairy); else `UNKNOWN` | recommendation |

### 3.5 Worked example (matches the brief's mock)
Tomatoes / Kiambu, 200 kg, last 30 days, mostly completed sales from TRUSTED+ farmers →
`recommended 75`, `range 68–82`, `regionalAverage 74`, `demand HIGH`, `trend RISING (+12% 30d)`, `confidence 89`, `expectedEarnings 15,000` (75×200). These are computed, not hard-coded.

---

## Deliverable 4 — Database Changes

**P0 schema changes: none.** The engine reads existing collections. This is the safest possible footprint and respects "DO NOT TOUCH … DB schema."

New **code constants** (not DB):
- `regions.ts` — `COUNTY_TO_REGION` for all 47 counties → 8 regions (Central, Rift Valley, Nyanza, Western, Coast, Eastern, North Eastern, Nairobi) + `fallbackChain(county) = [county, region, national]`.
- `seasonality.ts` — `KENYA_CROP_SEASONS` static calendar (Deliverable bundled with Phase 7).

**Optional, additive, later (each independently shippable, none breaking):**
1. **Demand capture** (`DemandSignal` collection *or* a `savedAt`/view event) — only if owner wants demand precision beyond derived signals. Insert-only, mirrors `PriceHistory` discipline. Until then, demand is derived.
2. **Recommendation snapshot** (`PriceRecommendationLog`) — persist what the farmer was shown at listing time, for auditability and "did they follow guidance?" analytics. Insert-only.
3. **External feed activation** — a cron that writes `EXTERNAL_INGESTION` rows from KAMIS/market APIs into the *existing* `PriceHistory`. Zero schema change (the enum/field already exist).

A composite index `PriceHistory { cropName:1, county:1, source:1, recordedAt:-1 }` is recommended (additive, non-breaking) to keep the weighted window query and source-split fast.

---

## Deliverable 5 — Demand Intelligence (honest version)

Demand is a 0–100 composite of **signals that actually exist**, bucketed to Low / Moderate / High / Very High. No invented watchlists/searches.

```
orderVelocity   = completed+paid orders for crop+county in last 30d   (vs crop's national rate)
sellThrough     = Σ quantityOrdered / Σ quantityAvailable (active+recent listings)
viewIntensity   = mean viewCount of recent active listings (normalized per crop)
supplyScarcity  = inverse of active AVAILABLE listing count (fewer sellers ⇒ tighter market)

demandScore = 0.45·z(orderVelocity) + 0.25·z(sellThrough)
            + 0.15·z(viewIntensity) + 0.15·z(supplyScarcity)     // z = crop-normalized 0–1

level = VERY_HIGH ≥0.75 · HIGH ≥0.5 · MODERATE ≥0.25 · LOW <0.25
```
Order velocity dominates (a real purchase is worth far more than a view). `viewIntensity` is intentionally a minor term because `viewCount` is the only first-party interest signal and is easily inflated. Demand is reported with its own confidence and the UI never presents it as more certain than the price.

Future demand inputs (saved listings, searches, purchase attempts) slot in as additional terms once captured — the formula is built to extend.

---

## Deliverable 6 — Regional Intelligence

A Kisumu farmer must not get a Nakuru recommendation. The engine enforces locality via `w_geo` (Deliverable 3.1) and an explicit **fallback hierarchy**:

```
1. COUNTY   — points where county == farmer's county        (weight 1.0)
2. REGION   — widen to COUNTY_TO_REGION[county] peers        (weight 0.6)  if effectiveN < MIN
3. NATIONAL — all counties                                   (weight 0.3)  if still < MIN
```

**Owner decision (2026-06-22) — lean on the fallback.** The pilot prefers *always showing a credible number with honest confidence* over showing blanks. So the engine **widens aggressively**: it does not stop at COUNTY just because a couple of points exist — it keeps the more-local points at full weight **and** pulls in REGION (then NATIONAL) peers at their reduced weights until `effectiveN` clears `MIN_POINTS`. The local data still dominates the weighted median (county weight 1.0 vs region 0.6 vs national 0.3); the wider tiers only fill out the evidence base. Result: a farmer in a thin county gets a real recommendation grounded mostly in nearby counties, not a "no data" wall.

`basis.geoScope` reports the widest tier we had to touch, and `geoFactor` lowers confidence accordingly (so a region-padded estimate honestly reads lower). The recommendation always *prefers* the most local credible data and degrades transparently — never silently returns a national average dressed up as a county number. Cooperative membership and market density are second-order inputs (Deliverable 9) layered on top of county.

---

## Deliverable 7 — Seasonal Intelligence

No multi-year history exists, so seasonality is a **curated static calendar** (`KENYA_CROP_SEASONS`) keyed by crop → month → phase, built from Kenya's bimodal rains (long rains Mar–May, short rains Oct–Dec) and known harvest windows. Example (maize, Rift Valley): planting Mar–Apr, `LOW_SUPPLY` Jun–Aug, harvest/`PEAK_SUPPLY` Sep–Nov, `IN_SEASON` Dec–Feb.

Phases: `IN_SEASON · PEAK_SUPPLY · LOW_SUPPLY · OFF_SEASON · UNKNOWN`.

Seasonality is **interpretive, not a price multiplier** — it never overrides observed `PriceHistory`. It (a) colors the insight sentence ("Tomatoes are entering peak supply; prices typically soften in the next few weeks — listing at the upper end may slow your sale"), and (b) cross-checks demand (PEAK_SUPPLY + falling trend reinforces a "price competitively" nudge). When real multi-season `PriceHistory` accumulates, the static calendar can be replaced by a learned month-over-month index without changing the contract.

---

## Deliverable 8 — Trust Weighting

Already specified in Deliverable 3.1 (`w_source`, `w_trust`, dispute down-weighting). Summary of the requirement mapping:

| Brief rule | Implementation |
|---|---|
| Verified farmer sales → higher | `w_trust` from `FarmerTrustScore.tier` (PREMIUM/TRUSTED > NEW) |
| Completed escrow transactions → higher | `w_source` ORDER_COMPLETED 1.0 > LISTING_CREATED 0.5 (and only COMPLETED orders write the row) |
| Trusted cooperatives → higher | cooperative members inherit member trust; coop-sponsored points get a small `w_geo`-adjacent boost in coop views |
| Disputed transactions → lower | points tied to `DISPUTED`/`REFUNDED` orders down-weighted to 0.25 |
| Rejected/failed → ignored | `FAILED`/cancelled orders never write a `PriceHistory` completion row (verified) — naturally excluded |

This reuses the trust system as-is; no trust logic is modified.

---

## Deliverable 9 — Listing Creation Experience (Farmer)

The marquee moment. Today `CreateListingForm.tsx` has a bare `Price per unit (KES)` input (line 230) with placeholder `65`. We attach a live **Price Intelligence panel** that fires as soon as the farmer has picked `cropName` + `pickupCounty` (and optionally entered `quantityAvailable`), debounced ~400ms, calling `GET /api/prices/recommendation`.

```
┌──────────────────────────────────────────────┐
│  Price Intelligence                  ●  89%   │   ← confidence chip
├──────────────────────────────────────────────┤
│  Recommended            KES 75 / kg           │   ← big, tap-to-fill the price input
│  Market range           KES 68 – 82 / kg      │
│  Regional average       KES 74 / kg  (Kiambu) │
│  Demand                 ▲ High                 │
│  Trend                  +12% · last 30 days    │
│  Expected earnings      KES 15,000  (200 kg)   │   ← recommended × quantity
├──────────────────────────────────────────────┤
│  Tomato demand is rising in Kiambu. Listings  │   ← deterministic insight
│  priced KES 78–85 have the highest completion │
│  rates this month.                            │
└──────────────────────────────────────────────┘
       [ Use KES 75 ]   (one tap fills the field)
```
Behaviour: **guidance, never enforcement** (Phase 9). The price field stays freely editable; tapping "Use KES 75" just pre-fills it. Low-confidence / no-data states render the honest empty message instead of fake numbers. The panel is a new presentation component built on the existing `.app-*` token system (consistent with `PriceIntelligenceDashboard.tsx`), wired into the form without touching the POST contract — `marketplace/route.ts` is unchanged.

The standalone `/dashboard/farmer/prices` page (existing `PriceIntelligenceDashboard`) gains the same recommendation card above its current chart, so the farmer can explore any crop/county, not just while listing.

---

## Deliverable 10 — Buyer Experience (Market Fairness Indicator)

> **SCOPE DECISION (2026-06-22): DEFERRED — not in pilot scope.** Buyers have no price access today and the owner has chosen to keep it that way for the pilot. The engine stays **farmer + admin (+ coop/NGO) facing**. The design below is retained as the ready-to-build spec for when buyer exposure is revisited; **P3 is removed from the active plan.** Nothing about buyer fairness is implemented until explicitly re-approved.

Buyers gain a **fairness badge** on every listing card and detail view:

```
Listing price   KES 95/kg        Listing price   KES 78/kg
Market avg      KES 80/kg        Market avg      KES 80/kg
●  Above market (+19%)           ●  Fair market price
```
Bands: `BELOW` (≤ −8%) · `FAIR` (within ±8%) · `ABOVE` (≥ +8%) of the weighted regional average for that crop+county. This increases transparency and, crucially, *rewards fairly-priced farmers with buyer trust* — aligning incentives toward the recommendation.

**Scope note (owner gate):** this is the one place the engine *adds* a new audience — buyers currently have no price access. Two safe delivery options:
- **(Recommended)** enrich `GET /api/marketplace/[listingId]` with a `marketFairness` block (aggregate-only, no other farmer's identity), reusing the engine. No new public price-series endpoint.
- A dedicated `GET /api/prices/fairness?listingId=` if we want it independently cacheable.

Either way, only the **aggregate** average is exposed to buyers — never another farmer's individual price points (privacy floor from Deliverable 3.3 applies).

---

## Deliverable 11 — Admin Analytics

New `GET /api/admin/price-analytics` (ADMIN-only, follows the `connectDB → getServerSession → requireRole(ADMIN) → aggregate` route pattern; surfaced on an admin page alongside the existing impact summary). Reads `PriceHistory` + `MarketInsight`:

- **Commodity trends** — per-crop national weighted trend (rising/stable/falling) with sparkline.
- **Price volatility** — coefficient of variation per crop+county; flags unstable markets.
- **Demand hotspots** — county+crop cells with `VERY_HIGH` demand and tight supply.
- **Regional comparison** — same crop across regions (spot arbitrage / inequity).
- **Supply concentration** — share of a crop's listings held by the top N farmers/coops.
- **Market anomalies** — points > k·MAD from the weighted median (typos, manipulation, or genuine shocks) flagged for review. Reuses the engine's weighting so admin and farmer see one coherent reality.

---

## Deliverable 12 — Cooperative Insights

New `GET /api/groups/[groupId]/price-insights` (member/admin of the group). For a `FarmerGroup` (members[], county):
- **Member average prices** vs the county recommendation (who's underselling).
- **Top-performing crops** by completed-sale value among members.
- **Regional competitiveness** — the coop's realized average vs region average.
- **Demand shifts** — which member crops are rising/falling.
This gives cooperatives (and their `sponsoredByNgoId` NGOs) a collective bargaining lens, computed from the same engine scoped to `farmerId ∈ group.members`.

---

## Deliverable 13 — NGO Insights

NGOs today have only the public Transparency page. We extend it (not a new financial actor — NGOs stay non-transactional per `NgoOrganization` model comment): a `GET /api/ngo/market-health` (or additive fields on `/api/transparency`) surfacing:
- **Food availability trends** — supply (active listings/quantity) by crop & region over time.
- **Regional shortages** — crops with `LOW_SUPPLY` season + `HIGH` demand + thin listings.
- **Market health indicators** — volatility + completion rate by region.
- **Farmer income proxies** — realized completed-sale value per active farmer by region (aggregate, anonymized).
All aggregate, all read-only, all from the same engine.

---

## Deliverable 14 — AI Integration Plan

The Farm Assistant (`groqService.ts` → Llama 3.3 70B) must **answer pricing questions from the engine, not hallucinate.** It already injects live weather context into the system prompt (`assistantPrompt.ts`) — pricing follows the identical, proven pattern.

**Approach (pragmatic, grounded, no tool-calling rework):**
1. **Pre-fetch on send.** In `farmAssistantChat`, before calling Groq, detect price intent (cheap keyword/crop match against the farmer's `cropsGrown` + a crop dictionary) and, when matched, call `composeRecommendation` for the relevant crop(s) in the farmer's county.
2. **Inject a bounded PRICE INTELLIGENCE CONTEXT block** into the system prompt (like the existing `CURRENT WEATHER` block): recommended, range, regional avg, demand, trend, season, confidence — the exact engine numbers.
3. **Instruct grounding:** extend the prompt rule already present ("Never make up regulatory or platform information") with "When quoting UmojaHub prices, use only the PRICE INTELLIGENCE figures provided; if a crop/county isn't covered, say so and suggest the Price Intelligence page rather than guessing."

This answers "What should I charge for tomatoes?", "Why is maize demand rising?" (trend + season + supply narrative), and "Which crops perform best in Nakuru?" (top realized-value crops) with **real platform numbers**. It also keeps the assistant's graceful-degradation guarantee — if the engine returns nothing, the model is told it has no figure and says so.

(A future upgrade is a true function/tool call so the model can query arbitrary crop+county on demand; the engine contract is already tool-ready. Context injection ships first because it reuses the existing, tested prompt-assembly path.)

---

## Deliverable 15 — Presentation Value (for the demo/lecturers)

The "wow" is the *live* moment in listing creation: the farmer picks **Tomatoes / Kiambu**, and before they type a price the panel fills with a recommendation, range, demand, +12% trend, 89% confidence, and an expected-earnings projection — each number traceable to real seeded transactions. The lecturer's takeaway is immediate and exactly the success criterion: *UmojaHub doesn't just connect buyers and sellers — it actively helps farmers make smarter economic decisions.* The buyer-side fairness badge and the AI assistant answering "what should I charge?" with the same numbers reinforce that it's a coherent intelligence layer, not a gimmick.

---

## Deliverable 16 — Realism Requirement

Credibility comes from using **real platform data + the seeded ecosystem** (`scripts/seed.ts`, `scripts/simulate/`), which already wrote months of back-dated `PriceHistory` (listings + completed orders), realistic outcome mixes (65% completed / 8% disputed), trust scores, and ratings across counties and crops. The engine's weighting makes those numbers behave sensibly (recent completed sales from trusted farmers dominate). The `MIN_POINTS` floor guarantees we never show a fabricated number — thin cells honestly say "not enough data." No invented external prices, no fake watchlists.

---

## Implementation Plan (gated, each phase shippable, green build between)

| Phase | Deliverable | Touches | Risk |
|---|---|---|---|
| **P0 — Engine core** | `src/lib/intelligence/*` (weighting, trend, regions, seasonality, confidence, `composeRecommendation`) + adjacent unit tests. Pure/aggregation only. | new files only | none (no routes/UI) |
| **P1 — Farmer API** | `GET /api/prices/recommendation` (FARMER) calling the engine. Zod query schema in `validation/priceSchema.ts`. | 1 new route | low |
| **P2 — Listing experience** | Price Intelligence panel in `CreateListingForm.tsx` + recommendation card on `/dashboard/farmer/prices`. Tap-to-fill. | 1 form, 1 page, 1 new component | low (no POST contract change) |
| ~~P3 — Buyer fairness~~ | **DEFERRED (owner decision 2026-06-22): not in pilot scope.** Spec retained in Deliverable 10. | — | — |
| **P3 — AI grounding** | price-context injection in `groqService.ts` + prompt rule in `assistantPrompt.ts`. | 2 files | low (additive, degrades) |
| **P4 — Admin analytics** | `GET /api/admin/price-analytics` + admin page section. | 1 route, 1 page | low |
| **P5 — Coop + NGO** | `GET /api/groups/[id]/price-insights`, NGO market-health on transparency. | 2 routes, UI | low |
| **P7 (optional)** | External feed (`EXTERNAL_INGESTION` cron), demand-signal capture, recommendation snapshots, composite index. | additive | low |

Each phase ends with `npm run type-check && npm run lint && npm run test` green. Branch `feature/price-intelligence-engine` off `develop`; PR to `develop`. No commits to `main`/`develop` directly.

---

## Demo Scenario (uses seeded users)

1. **Farmer** signs in as `wanjiku.kamau@gmail.com` (Kiambu farmer), opens "New crop listing", selects **Tomatoes**, county **Kiambu**, quantity **200 kg** → panel fills: *Recommended KES 75/kg · Range 68–82 · Demand High · +12% (30d) · Confidence 89% · Expected KES 15,000* with the insight sentence. Taps **Use KES 75**, publishes.
2. **Assistant**: farmer asks *"What should I charge for tomatoes in Kiambu?"* → answer quotes the engine's KES 75 (68–82) with the demand/trend rationale — no hallucinated figure.
3. **Admin** signs in as `umojahub16@gmail.com` → price-analytics shows tomatoes as a Kiambu demand hotspot with low volatility; a seeded outlier flagged as an anomaly.

*(Buyer-side fairness badge deferred — see Deliverable 10.)*

---

## Production-Readiness Review

- **Performance:** all reads are windowed aggregations over already-indexed `PriceHistory` (`{cropName,county,recordedAt}`); add the optional `{cropName,county,source,recordedAt}` composite. `MarketInsight` weekly cache absorbs the heavy path. Engine calls on the listing form are debounced and cacheable (short TTL). No N+1 — trust tiers fetched in one `$in`.
- **Correctness/Privacy:** `MIN_POINTS=3` floor + aggregate-only exposure prevents leaking or gaming a single farmer's price. Buyers see averages, never individual points.
- **Resilience:** engine never throws to callers, never blocks listing creation, returns honest low-confidence/empty states — consistent with existing `priceDataService`/`groqService` discipline.
- **Honesty:** demand is derived from real signals only and labeled with its own (lower) confidence; no fabricated watchlists/searches/external prices. Gaps are documented, not hidden.
- **Platform safety:** strictly additive and read-only over existing collections. No change to auth, escrow, orders, trust, payments, or any schema contract. New routes follow the mandated `connectDB → session → requireRole → validate → read` shape. `logger` (not `console`), `env()`, `AppError`/`handleApiError`, Zod `safeParse` throughout. Zero `any`.
- **Owner decisions to confirm before P3+:** (a) exposing aggregate market averages to buyers; (b) whether NGO/coop insight routes are in pilot scope; (c) appetite for the optional external feed.

---

### Success criterion (restated)
The engine turns "enter your price" into "here's what the market says, and why" — for farmers at the moment of decision, for buyers as fairness, for admins/coops/NGOs as oversight, and for the AI as grounded truth. It demonstrably makes UmojaHub *do more than connect buyers and sellers — it helps farmers make smarter market decisions.*
