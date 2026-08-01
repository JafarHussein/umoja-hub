# 09 — Recommendation Engine Specification

**Status:** Draft for approval · **Date:** 2026-07-29 · **Depends on:** `05`, `06`, `07`

The contract between the engine and everything that renders it. The brief's instruction is *"Do NOT return a single number. Return intelligence."* — so this document defines every field, how it is computed, and, most importantly, **when it is null**, because a field that is absent when the evidence is absent is the mechanism by which the UI cannot overstate what is known.

---

## 1. Principles

1. **Null over guess.** Every optional field is null when its evidence does not support it. No defaults, no zeros standing in for unknowns.
2. **Nothing is displayed that is not derivable from this object.** The explanation layer sees only this output (`04` §1.1). If a claim cannot be made from these fields, it cannot be shown.
3. **The pure core stays pure.** `assembleRecommendation` remains a total function of its inputs, with no I/O. Every extension below is computed from points already fetched.
4. **Additive, backward-compatible.** Existing consumers — the listing form, the prices page, `cooperativeInsights`, `ngoMarketHealth`, `assistantPriceContext`, buyer fairness — keep working. No field is removed or has its meaning changed.

---

## 2. The output contract

```ts
export interface PriceRecommendation {
  // ── identity ──────────────────────────────────────────────
  crop: string; county: string; unit: string;

  // ── the nowcast (LIVE) ────────────────────────────────────
  recommendedPricePerUnit: number | null;   // weighted median
  range: { low: number; high: number } | null;  // weighted p25–p75
  regionalAveragePerUnit: number | null;
  nationalAveragePerUnit: number | null;
  expectedEarningsKES: number | null;
  confidence: number;                        // 0–100
  confidenceBand: 'HIGH' | 'MEDIUM' | 'LOW';

  // ── market context (LIVE, extended) ───────────────────────
  demand: DemandResult;
  trend: TrendResult;                        // now weighted — D11
  season: { phase: SeasonPhase };

  // ── NEW: neighbours ───────────────────────────────────────
  neighbours: {
    counties: { county: string; medianPrice: number; pointCount: number }[];
    localVsNeighbourPct: number | null;
  } | null;

  // ── NEW: forward view ─────────────────────────────────────
  outlook: {
    direction: 'RISING' | 'STABLE' | 'FALLING';
    horizonDays: number;
    expectedChangePct: number | null;
    band: { lowPct: number; highPct: number } | null;
    basis: 'MODEL' | 'SEASONAL_NAIVE';
    reliability: 'GOOD' | 'FAIR' | 'POOR';
  } | null;

  // ── NEW: decision support ─────────────────────────────────
  guidance: {
    sellingSpeed: 'FAST' | 'MODERATE' | 'SLOW' | 'UNKNOWN';
    overpricingRisk: 'LOW' | 'MODERATE' | 'HIGH';
    underpricingRisk: 'LOW' | 'MODERATE' | 'HIGH';
    waitAdvice: 'SELL_NOW' | 'NO_STRONG_SIGNAL' | 'CONSIDER_WAITING';
    waitRationale: string | null;
  } | null;

  // ── NEW: price assessment (farmer's typed price / listing price) ──
  assessment: {
    price: number;
    band: 'WELL_BELOW' | 'BELOW' | 'IN_RANGE' | 'ABOVE' | 'WELL_ABOVE';
    deviationPct: number;
  } | null;

  // ── evidence (LIVE, extended) ─────────────────────────────
  basis: {
    dataPointCount: number;
    completedSaleShare: number;
    externalShare: number;          // NEW
    geoScope: 'COUNTY' | 'ADJACENT' | 'REGION' | 'NATIONAL';   // ADJACENT is new
    windowDays: number;
    observationSpan: { from: Date; to: Date } | null;          // NEW
    sources: { sourceId: string; label: string; pointCount: number;
               newestObservation: Date; isStale: boolean }[];  // NEW
  };

  insight: string;                  // LIVE — deterministic
  insightParts: string[];           // NEW — individually renderable claims
}
```

---

## 3. Field derivations

### 3.1 Nowcast — unchanged

`recommendedPricePerUnit`, `range`, the averages and `confidence` keep their current derivation (`priceIntelligence.ts:131`). Two adjustments only:

- `geoScope` gains the `ADJACENT` tier between `COUNTY` and `REGION` (`06` §2), with confidence factor **0.9** (between COUNTY 1.0 and REGION 0.8).
- Confidence gains an **external-grounding term**. Today `sourceFactor = 0.5 + 0.5 × completedSaleShare`. It becomes:

  ```
  sourceFactor = 0.5 + 0.5 × max(completedSaleShare, externalShare)
  ```

  Rationale: an observation published by a national market information system is evidence of comparable standing to a settled platform sale, and materially better than an asking price. `max` rather than a sum, because the two are alternative routes to the same quality claim and adding them would let a cell reach high confidence on volume alone.

### 3.2 `neighbours`

Weighted median per adjacent county, for counties clearing `MIN_POINTS` independently. `localVsNeighbourPct` = local median vs the median of neighbour medians. **Null when the adjacency graph is unavailable or no neighbour clears the threshold** — never padded with region-level figures, which would silently answer a different question than the one the label asks.

### 3.3 `outlook`

From the forecast layer (`05` §4). Rules:

- `basis: 'MODEL'` only when the model cleared the ≥10% skill gate; otherwise `'SEASONAL_NAIVE'`, and the UI says so in plain words.
- `horizonDays` is capped by crop perishability: **7 days** for leafy vegetables and dairy, **14** for tomatoes and other soft produce, **30** for storable grains, pulses and potatoes. A 30-day outlook on kale is not shown at all.
- `reliability` from backtest performance for that crop and the density of local evidence. `POOR` renders as direction only, with no percentage.
- **Null when** no forecast exists for the crop, or the crop has no seasonal grounding, or external history is unavailable. At pilot, before ingestion, this field is null for every crop — and the UI must be complete without it.

### 3.4 `guidance`

**`sellingSpeed`** — a transparent rule over observed sell-through, not a model (`05` §5):

| Condition | Value |
|---|---|
| Price ≤ median, demand HIGH/VERY_HIGH, competing listings low | `FAST` |
| Price within range, demand MODERATE+ | `MODERATE` |
| Price > range high, or demand LOW, or many competing listings | `SLOW` |
| Insufficient sell-through history | `UNKNOWN` |

`UNKNOWN` is a real and expected value at pilot scale, and the UI renders it as absence rather than as a neutral middle.

**`overpricingRisk` / `underpricingRisk`** — a function of the typed price's position and the dispersion of evidence (`priceDispersion`, `06` §5). Wide dispersion means the market itself disagrees, so both risks fall toward `LOW`: honest uncertainty must reduce the strength of the warning, not increase it. These are **null unless `assessment` is present** — with no price to assess, there is no risk to report.

**`waitAdvice`** — the direct answer to "should I wait?", and deliberately conservative:

| Signal | Advice |
|---|---|
| Outlook FALLING beyond band, or PEAK_SUPPLY approaching | `SELL_NOW` |
| Outlook RISING beyond band, reliability GOOD/FAIR, and horizon within perishability | `CONSIDER_WAITING` |
| Anything else, including all POOR-reliability cases | `NO_STRONG_SIGNAL` |

**`CONSIDER_WAITING` carries real risk to the farmer** — spoilage, a missed buyer, cash-flow pressure the engine cannot see. It requires a reliable forecast *and* a horizon shorter than the crop survives, and `waitRationale` must state the reason in plain words. When in doubt the answer is `NO_STRONG_SIGNAL`; "we don't know" is a safe answer here and "hold your tomatoes" is not.

### 3.5 `assessment`

Present only when the caller supplies a price. Bands per `08` §4: `IN_RANGE` inside p25–p75; `ABOVE`/`BELOW` within 15% outside; `WELL_ABOVE`/`WELL_BELOW` beyond. Purely positional and symmetric — the same computation serves the farmer surface and the buyer surface (`10`), which is what guarantees a farmer and a buyer looking at the same listing see consistent judgements.

### 3.6 `basis` — the evidence ledger

The ledger is what makes *"where did this number come from?"* answerable (`01` §8), and every element is already available at assembly time. `sources` lists real provenance with dates and staleness; `externalShare` is the weight fraction from `MarketPriceObservation`; `observationSpan` bounds the evidence in time.

### 3.7 `insight` and `insightParts`

`insight` stays a single deterministic sentence — no LLM (`05` §5). `insightParts` is the same content decomposed into individually-renderable claims so the UI can place them beside the figures they describe rather than concatenating them into a paragraph. Each part must be independently true; **no part may reference a field that is null.**

---

## 4. Display thresholds

The rules that keep the engine from overstating itself. All are enforced in the engine, not in the UI, so every consumer inherits them.

| Field | Shown when |
|---|---|
| `recommendedPricePerUnit`, `range` | `dataPointCount ≥ MIN_POINTS` (3) — **existing behaviour** |
| `outlook` with a percentage | `reliability ≠ POOR` |
| `outlook` direction only | `reliability = POOR` and a forecast exists |
| `guidance.waitAdvice = CONSIDER_WAITING` | Reliable forecast **and** horizon within perishability |
| `neighbours` | ≥1 adjacent county independently clears `MIN_POINTS` |
| `assessment` | A price was supplied **and** a recommendation exists |
| `sellingSpeed ≠ UNKNOWN` | Sufficient sell-through history for the crop |

---

## 5. D4 — resolving the two parallel price systems

Document 01 recorded D4 as open: two endpoints answer "what is this crop worth in this county" with different arithmetic. Verified against source:

| | `GET /api/prices` | `GET /api/prices/recommendation` |
|---|---|---|
| Statistic | **Unweighted arithmetic mean** (`route.ts:70`) | Weighted median |
| Unit filter | **None** | Anchored, case-insensitive |
| Crop matching | Taxonomy pattern for history; **exact string equality** for `MarketInsight` (`route.ts:62`) | Taxonomy throughout |
| Geo fallback | None | County → adjacent → region → national |
| Caching | None | 600 s |

### 5.1 A live defect this comparison surfaced

**D13 — `/api/prices` mixes units in its statistics.** `averagePrice`, `lowestPrice` and `highestPrice` (`route.ts:86–88`) are computed across all rows for the crop with **no unit filter**. This is defect D1 — the one that returned 3,500 for a KG request — still live on this endpoint. The engine was fixed; this route was not. `lowestPrice`/`highestPrice` are the worst affected, since min and max over a bimodal KG/BAG set are guaranteed to come from different units.

A second, smaller residual sits at `route.ts:62`: the `MarketInsight` lookup uses exact `cropName` equality while the price-history query on line 50 uses the taxonomy pattern, so a crop can match its history and miss its benchmark. That is D3 surviving in one line.

### 5.2 Resolution

**One statistic, one source of truth.** `/api/prices` stops computing its own.

- **Retained** as the *history and context* endpoint: the time series for charts, the middleman benchmark, `MarketInsight`, the platform premium. These are things the recommendation endpoint does not provide and should not.
- **Removed:** `stats.averagePrice`, `stats.lowestPrice`, `stats.highestPrice`. Any consumer needing a central figure calls the recommendation endpoint. This fixes D13 by deletion rather than by duplicating the unit logic in a second place — the same reasoning that produced one `resolveCrop` instead of three matchers.
- **Fixed:** the `MarketInsight` lookup uses `resolveCrop`.
- **Requires** a `unit` parameter for the returned series, since a chart mixing KG and BAG points is the same defect in visual form.

The general rule this establishes: **there is exactly one place in this codebase that decides what a crop is worth**, and it is `assembleRecommendation`. D4 closes.

### 5.3 The presentational half, closed separately

Shipping D13 closed the arithmetic split but not the defect as a farmer experiences it. `/api/prices` had stopped computing a rival figure, yet its remaining outputs — the middleman benchmark and the platform premium — were still rendered as a grid of stat cards directly beneath the recommendation panel, in the same card treatment and the same `app-data-l` numerals. Two blocks of large money figures at equal visual weight *is* two price systems, whatever the arithmetic underneath agrees on.

Worse, the grid's third card, `Observations`, counted the points in the chart series over the selected period — a different window and a different geographic scope from `basis.dataPointCount`, the evidence behind the recommendation. Presenting it as a headline statistic invited exactly the reading the defect describes: two evidence counts, quietly disagreeing, for what looks like one question.

**Resolution (2026-08-01).** One headline. The middleman benchmark is now attached beneath the recommendation panel on the sunken surface at body weight, phrased as a fact *about* the recommended price — *"That is 23% above the middleman benchmark of KSh 60/kg"* — so it cannot be read as a competing answer. The observation count moved into the chart header, captioning the series it actually describes. The stat-card grid is gone.

The general rule the presentation now follows, alongside the arithmetic one: **the page has one price, and everything else on it is visibly commentary on that price.**

---

## 6. API and caching

`GET /api/prices/recommendation` keeps its shape and gains optional `price` (drives `assessment`) and `excludeOwnListings` (D12, `06` §3).

Caching (`priceIntelligence.ts:471`) is unchanged in structure and needs two adjustments:

- **`price` must not enter the cache key.** Like `quantity`, it is applied to a cached market view afterwards — `assessment` is a pure function of the price and the already-computed range. Including it would mint a cache entry per keystroke and defeat the cache entirely, which is the exact reasoning already documented for `quantity`.
- **`excludeFarmerId` must enter the cache key**, since it changes the point set. Its cardinality is bounded by farmers actively editing a listing, which is small.

`shouldCache: confidence > 0` is retained — a degraded result must never be pinned for ten minutes.

---

## 7. Defects registered by this document

| # | Defect | Fix | Status |
|---|---|---|---|
| **D11** | `trend.ts` uses unweighted window means | Weighted means, geographic term neutral (`06` §6) | **Fixed** 2026-08-01 — `TrendPoint.weight`, `weightedMean` per window |
| **D12** | A farmer's own listing feeds their own recommendation | `excludeFarmerId` on `LISTING_CREATED` points | **Fixed** 2026-08-01 — id taken from the session, never the query string; in the cache key |
| **D13** | `/api/prices` computes mean/min/max across mixed units; `MarketInsight` lookup bypasses the taxonomy | Delete the stats block; use `resolveCrop`; require `unit` | **Fixed** 2026-08-01 — premium now measured against the engine's median |

---

**Next:** `10_BUYER_PROTECTION_STRATEGY.md` — the same engine, seen from the other side of the transaction.
