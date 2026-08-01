# 06 — Feature Engineering Specification

**Status:** Draft for approval · **Date:** 2026-07-29 · **Depends on:** `04`, `05`

The brief lists twenty-odd candidate predictors. Several of them do not exist in this platform or in any Kenyan dataset reviewed, and the most useful thing this document can do is say which — because a feature specification that quietly includes rainfall and transport costs will be implemented as a stub, and a stub that returns a plausible default is indistinguishable from data until it is wrong in production.

Every feature below carries a status:

| Status | Meaning |
|---|---|
| **LIVE** | Implemented and in use today |
| **BUILD** | Specified here, buildable from data that exists |
| **BLOCKED** | Needs an external dependency resolved first |
| **ABSENT** | The data does not exist. Not implemented, not stubbed. |
| **REJECTED** | Available but deliberately excluded, with a reason |

---

## 1. Feature inventory

### 1.1 Identity and geography

| Feature | Status | Source | Notes |
|---|---|---|---|
| Crop (canonical id) | **LIVE** | `taxonomy/crops.ts` | 17 crops, alias resolution via `resolveCrop` |
| County | **LIVE** | `taxonomy/counties.ts` | 47 counties, spelling-tolerant resolution |
| Region (8 former provinces) | **LIVE** | `intelligence/regions.ts` | Fallback tier |
| **County adjacency** | **LIVE** | `taxonomy/adjacency.ts` — see §2 | Hand-assembled, so L4 (ODbL) never applied. `ADJACENT` tier live in the engine (D7); the `neighbours` output field of `09` §3.2 remains to be built on top of it |
| Unit | **LIVE** | `taxonomy/units.ts` | Filtered, never converted |
| Market | **BUILD** | KAMIS `Market` column | Finer than county; the resolution external data actually arrives at |
| Sub-county | **ABSENT** | — | Not on `MarketplaceListing`, not in any price source. The brief names it; it does not exist. |

### 1.2 Price observation attributes

| Feature | Status | Source | Notes |
|---|---|---|---|
| Price per unit | **LIVE** | `PriceHistory.pricePerUnit` | |
| Observation age | **LIVE** | 21-day half-life | |
| Source type | **LIVE** | 1.0 sale / 0.6 listing / 0.7 external | |
| Dispute flag | **LIVE** | Joined from `Order` | ×0.25 |
| **Wholesale vs retail** | **BUILD** | KAMIS publishes both | The spread *is* the middleman margin — the thing the platform exists to expose. See §4. |
| **Supply volume** | **BUILD** | KAMIS `Supply Volume` | A genuine supply signal available nowhere else |
| Grade | **BUILD** | KAMIS `Grade`; `MarketplaceListing` has no grade field | External only. Do not invent a platform grade field — that is marketplace schema, which is off-limits. |
| Variety | **BUILD (partial)** | KAMIS `Classification` (e.g. "White Maize") | Absorb into crop identity via aliases where it changes the price materially; otherwise ignore. |

### 1.3 Market activity

| Feature | Status | Source | Notes |
|---|---|---|---|
| Completed orders (30d) | **LIVE** | `demand.ts`, weight 0.45 | |
| Sell-through ratio | **LIVE** | weight 0.25 | |
| Active listing count | **LIVE** | weight 0.15 (scarcity) | |
| Mean view count | **LIVE** | weight 0.15 | Weakest and most gameable term — correctly weighted lowest |
| **Time-to-sale** | **BUILD** | `MarketplaceListing.createdAt` → `Order.createdAt` | Feeds expected selling speed (§5) |
| Search / watchlist demand | **ABSENT** | — | No search or watchlist log exists. `demand.ts` already refuses to model it; that refusal stands. |

### 1.4 Farmer attributes

| Feature | Status | Notes |
|---|---|---|
| Trust tier | **LIVE** | 1.30 → 0.85. **A weight on evidence, never a premium on price.** See §3. |
| Verified status | **REJECTED as a separate feature** | Already inside the trust tier. Adding it again would double-count. |
| Cooperative membership | **REJECTED as a price feature** | It changes *bargaining power and logistics*, not what the crop is worth. It belongs in `cooperativeInsights.ts`, where it already is. |

### 1.5 Temporal

| Feature | Status | Notes |
|---|---|---|
| Trend (7/30/90d) | **LIVE** | `trend.ts` — but see D11 in §6 |
| Season phase | **LIVE (10 of 17 crops)** | `seasonality.ts`. Seven crops return `UNKNOWN`. See §4.2 |
| **Seasonal index (continuous)** | **BLOCKED** | Needs WFP history. Replaces the hand-authored phase for forecasting |
| **CPI deflator** | **BUILD** | KNBS food index — comparability across years |
| Holiday effects | **REJECTED for now** | Real (Christmas, Ramadan, school terms) but unmeasurable on 130 points. Revisit after ≥2 years of external history. |

### 1.6 Named in the brief, and genuinely absent

Stated plainly so nobody re-specifies them:

| Feature | Why absent |
|---|---|
| **Rainfall** | No weather data in the platform. `OPEN_WEATHER_MAP_API_KEY` exists but serves current conditions, not the historical county-level rainfall a price model would need. KAOP/KMD (`02` §2.9) is the eventual route. |
| **Transport costs** | No dataset found. Would need county-pair distance × a fuel-linked rate — an invention, not a measurement. |
| **Regional export demand** | Not in any Tier A/B source. RATIN carries cross-border flows for grains only and is membership-gated. |
| **Market volatility** | *Derivable* (residual dispersion) but meaningless at 3–15 points per cell. Becomes real with external history; specified as **BLOCKED**, not absent. |

---

## 2. County adjacency (D7)

`regions.ts` maps 47 counties to 8 former provinces. Nairobi is a singleton, so a Nairobi farmer has no regional peers and falls straight to national. More generally, provincial grouping is a poor proxy for market adjacency: Kajiado borders Nairobi and sits in Rift Valley; Machakos borders Nairobi and sits in Eastern.

**Design.** A static `Record<KenyanCounty, readonly KenyanCounty[]>` in `src/lib/taxonomy/adjacency.ts`, derived once from county polygons and committed as a constant — no runtime geometry, no GIS dependency, no per-request cost.

**Properties asserted in tests:** symmetry (if A neighbours B then B neighbours A); every county present; no self-reference; every name resolves through `resolveCounty`; Mombasa and the island counties have the small neighbour sets geography implies.

**How it enters the engine.** As a **new tier between COUNTY and REGION**, not as a replacement:

```
COUNTY → ADJACENT → REGION → NATIONAL
```

with a geographic weight between `COUNTY` (1.0) and `REGION` (0.6) — proposed **0.8**, to be calibrated against backtest once external data lands, and explicitly flagged as a provisional constant rather than a derived one.

This is what makes *"what are neighbouring counties charging"* answerable, and it improves the fallback ladder for every county, not only Nairobi.

**Blocked on L4** — the ODbL share-alike review from `03_DATA_SOURCE_COMPARISON.md` §2.2. If the review is unclear, hand-assembling 47 adjacency lists from public maps is a few hours of work and sidesteps the licence question entirely. That fallback should be taken rather than delaying the feature.

> **Built 2026-08-01.** The hand-assembly fallback was taken, so L4 never applied and no share-alike obligation attaches. `src/lib/taxonomy/adjacency.ts` holds the 47 lists, derived from the Constitution of Kenya (2010) First Schedule boundaries as rendered on public administrative maps; the asserted properties above are all covered by tests. `ADJACENT` sits between `COUNTY` and `REGION` in the ladder at geographic weight **0.8** and confidence factor **0.9**, both flagged in code as provisional pending backtest. Two judgement calls worth recording: land borders only — a shared lake shoreline is not adjacency, so Homa Bay does not neighbour Siaya across the Winam Gulf — and where a contact is disputed or vanishingly short the pair is omitted, on the reasoning that a missing far-flung edge costs a little evidence while a wrong edge imports a market that is not really next door. The `neighbours` output field (`09` §3.2) is now unblocked but **not** built: it is a farmer-facing surface and belongs to the UI gates, not to this defect.

---

## 3. The Trust Score, stated precisely

The brief asks *"How will my Trust Score influence recommended pricing?"* The answer is counterintuitive and the UI must not soften it.

**Trust weights whose observations count, not what you may charge.** A `PREMIUM`-tier farmer's completed sale carries 1.30× the weight of an `ESTABLISHED` one when estimating what the market is paying. It does **not** add a premium to the price recommended *to* that farmer.

The temptation to do otherwise is obvious and must be resisted. A trust-based price premium would be: unjustified (the market pays for produce, not for reputation — any genuine premium already appears in the trusted farmer's realised prices, which the weighting picks up); self-reinforcing (high trust → higher recommended price → higher realised price → higher trust); and an invitation to game the trust system for money, which corrupts the platform's central mechanism.

**UI requirement:** the panel must not display trust as a factor that raised or lowered *your* number. Where trust is mentioned, the honest phrasing is about evidence quality — *"this estimate leans on sales from established sellers in your county."* `10_BUYER_PROTECTION_STRATEGY.md` inherits the same rule.

**Anti-feedback rule.** A farmer's own active listing must not be evidence for the recommendation shown to that same farmer. Otherwise typing a price, saving, and reopening the form nudges the recommendation toward whatever they typed. Filter the requesting farmer's own `LISTING_CREATED` points out of their own recommendation; their *completed sales* stay, because those are settled facts. This is a real defect risk in the current implementation — `computeRecommendation` has no such filter — and is registered as **D12**.

---

## 4. External features

### 4.1 The wholesale–retail spread

KAMIS publishes both per market per day **[LIVE]**. Their ratio is the clearest quantitative statement of the intermediation margin the platform exists to compress, and it is directly explainable: *"in Taveta today, wholesale is KES 30/kg and retail KES 40/kg — a 33% margin between what a farmer is offered and what a shopper pays."*

**Rule:** farmer-facing recommendations anchor on **wholesale**, which is the price basis a farmer selling volume actually faces. Retail is shown as context only and never enters the statistic. Mixing them would be a repeat of the unit defect (D1) in a different variable — one that would inflate recommendations by tens of percent.

### 4.2 Seasonality, rebuilt

The current calendar (`seasonality.ts:35`) is hand-authored, carries no citations, and covers 10 of the 17 registry crops — the registry's `hasSeasonCalendar` flag records exactly which, so the gap is measurable rather than silent. Seven crops (onions, cabbages, french-beans, avocados, bananas, carrots, green-grams) return `UNKNOWN`.

Two changes:

1. **Cite it.** Rebuild each calendar against FEWS NET seasonal calendars and FAO/GIEWS country briefs, with a per-crop source reference in the module. Confirmed anchors: bimodal rainfall; long rains March–May at roughly 80% of annual food production; short rains October–November; maize harvest October–December in the highlands, around July in short-season areas **[ATTESTED]**.
2. **Derive it where possible.** Once WFP history is ingested, the seasonal index from `05_MODEL_SELECTION_REPORT.md` §4.3 is *estimated from data* per crop. The hand calendar then becomes the fallback for crops with insufficient history, rather than the primary source.

Until then, seasonality stays **interpretive only** — it colours the explanation and cross-checks demand, and never moves a price. That is the current contract and it is correct.

### 4.3 Source vocabulary mapping

Each source names crops its own way ("Dry Maize (White Maize)"). Mapping must be built by **inspecting each source's actual vocabulary**, never guessed.

`CropDefinition` gains one field:

```ts
/** Exact crop strings as published by each external source, verbatim. */
sourceAliases?: Readonly<Partial<Record<PriceSourceId, readonly string[]>>>;
```

> **Correction to `02_KENYAN_DATASET_REVIEW.md` §4.5:** that document refers to `CROP_REGISTRY.sourceAliases` as though it exists and is unpopulated. It does not exist — this section introduces it. The substance of the point was right; the field was forward-referenced.

Deliberately kept separate from `synonyms`, which are *human* variants used for free-text resolution. Source aliases are exact machine strings and must match verbatim or fail loudly. An unmapped source crop is **rejected at ingest and reported**, never fuzzy-matched — silent fuzzy matching across vocabularies is how "French Beans" ends up counted as "beans".

---

## 5. Derived features for the new capabilities

| Derived feature | Definition | Feeds |
|---|---|---|
| `externalShare` | Weight fraction from external observations | Confidence; the "grounded in real market data" claim |
| `completedSaleShare` | **LIVE** — fraction from settled sales | Confidence |
| `evidenceAge` | Weighted median age of contributing points | Confidence; explanation |
| `priceDispersion` | Weighted IQR ÷ median | Over/underpricing risk; range width |
| `sellThroughAtPrice` | Historical share sold within 14 days, bucketed by price-vs-median | Expected selling speed |
| `seasonalPosition` | Where today sits in the crop's seasonal cycle | Wait-vs-sell guidance |
| `adjacentSpread` | Median price in neighbouring counties vs local | "What are neighbours charging" |

`sellThroughAtPrice` is the one that turns *"what price gives the highest chance of selling"* from an unanswerable question into a coarse but honest one. It needs a real corpus of completed listings; with ~130 points it will be thin at first and must be presented with that caveat, per `05_MODEL_SELECTION_REPORT.md` §5.

---

## 6. Two defects this analysis surfaced

Registered against document 01's defect table.

**D11 — the trend classifier uses unweighted means.** `trend.ts:41` averages raw prices in each window while every other statistic in the engine is weighted. D9 fixed exactly this for the national average but the trend windows were not revisited. Consequence: a stale asking price from an untrusted farmer counts as much as yesterday's settled sale when deciding whether prices are rising — and the resulting ±5% classification drives the trend badge the farmer sees. **Fix:** pass weights through to `classifyTrend` and use `weightedMean` per window, with the geographic term held neutral exactly as the national average does.

**D12 — a farmer's own listing feeds their own recommendation.** Described in §3. **Fix:** an optional `excludeFarmerId` on the compose path, applied to `LISTING_CREATED` points only.

Both are small, both are in the pure layer, and both are testable without a database.

---

**Next:** `07_DATA_PIPELINE_DESIGN.md` — how external observations reach these features safely.
