# 04 — System Architecture

**Status:** Draft for approval · **Date:** 2026-07-29 · **Depends on:** `03_DATA_SOURCE_COMPARISON.md`

The brief's instruction is *"do not build everything inside one service"* and names nine layers. This document draws those boundaries in terms of the actual repository, states what each layer may and may not know, and is deliberately explicit about which boundaries are load-bearing versus merely tidy — because in a codebase this size, a boundary that exists only for symmetry becomes a place bugs hide.

---

## 1. The layers, and what each is allowed to know

| # | Layer | Location | Knows about | Must **not** know about |
|---|---|---|---|---|
| 1 | **Collection** | `src/lib/prices/sources/` | One external source's wire format | The engine, the UI, other sources |
| 2 | **Cleaning & validation** | `src/lib/prices/ingest/` | Canonical taxonomy, validation rules | Which source a row came from (beyond its declared metadata) |
| 3 | **Observation store** | `MarketPriceObservation` model | Nothing — it is data | Everything |
| 4 | **Feature assembly** | `src/lib/intelligence/features/` | Observations, platform collections, taxonomy | Models, presentation |
| 5 | **Training / calibration** | `scripts/prices/` (offline) | Historical features | The running application |
| 6 | **Evaluation** | `src/lib/intelligence/evaluation/` | Features + model outputs + actuals | The UI |
| 7 | **Inference** | `src/lib/intelligence/forecast/` | Features, calibrated parameters | Where features came from |
| 8 | **Recommendation** | `src/lib/intelligence/priceIntelligence.ts` | Statistic + forecast + demand + season | HTTP, React, formatting |
| 9 | **Explanation** | `src/lib/intelligence/insight.ts` | A finished recommendation | How any of it was computed |
| 10 | **Presentation** | `src/components/app/prices/` | The API response shape | The database, the engine internals |

Layer 3 is listed separately from 2 because the storage boundary is the one that makes the rest replaceable: a source adapter can be rewritten, a model can be swapped, and nothing else needs to change as long as the observation contract holds.

### 1.1 Which boundaries are load-bearing

Three of them genuinely earn their keep, and the rest are organisational:

- **1 → 2 (source adapter → canonical row).** This is the boundary that lets KAMIS switch from manual import to automated feed with no downstream change (`03_DATA_SOURCE_COMPARISON.md` §2.3). It is the most valuable boundary in the design.
- **7 → 8 (inference → recommendation).** The forecast must be swappable — `05_MODEL_SELECTION_REPORT.md` chooses a deliberately simple model *and* specifies the upgrade path, which only works if the recommendation layer consumes a forecast interface rather than a particular implementation.
- **8 → 9 (recommendation → explanation).** The explanation layer being unable to see the computation is what forces every displayed claim to be derivable from the published output. If `insight.ts` could reach into the point set, explanations would drift away from the numbers shown beside them. This constraint already holds today and must be preserved.

The others are ordinary module hygiene. Saying so is the point: they should not be defended past the point of usefulness.

---

## 2. Repository map

Existing paths are marked ✅, new ones ➕. Nothing outside `src/lib/prices/`, `src/lib/intelligence/`, `src/components/app/prices/`, the price API routes and the admin price routes is touched — the platform-logic prohibition in `CLAUDE.md` is absolute.

```
src/lib/taxonomy/                  ✅ crops.ts · units.ts · counties.ts
  adjacency.ts                     ➕ county neighbour graph (D7)

src/lib/prices/
  sources/                         ➕ one adapter per source
    types.ts                       ➕ SourceAdapter interface + RawObservation
    kamis.ts · wfp.ts · fews.ts    ➕
  ingest/                          ➕
    normalize.ts                   ➕ raw → canonical
    validate.ts                    ➕ rejection rules
    dedupe.ts                      ➕ idempotency key
    run.ts                         ➕ orchestrates one IngestionRun

src/lib/intelligence/
  priceIntelligence.ts             ✅ orchestrator (extended, not replaced)
  weighting.ts                     ✅ constants + weighted statistics
  demand.ts · trend.ts             ✅
  seasonality.ts                   ✅ (rebuilt with citations — doc 06)
  regions.ts                       ✅ (adjacency-aware — doc 06)
  insight.ts                       ✅ explanation (extended)
  priceAnalytics.ts                ✅ admin projection
  cooperativeInsights.ts           ✅ · ngoMarketHealth.ts ✅
  assistantPriceContext.ts         ✅ AI grounding
  features/assemble.ts             ➕ feature vector construction
  forecast/                        ➕ index.ts (interface) · seasonalNaive.ts · damped.ts
  evaluation/backtest.ts           ➕ rolling-origin harness
  evidence.ts                      ➕ the evidence ledger

src/lib/models/
  PriceHistory.model.ts            ✅ platform-generated points — unchanged
  MarketPriceObservation.model.ts  ➕ external observations
  PriceIngestionRun.model.ts       ➕ import history + source health
  PriceOverride.model.ts           ➕ admin overrides
  AdminAuditLog.model.ts           ✅ reused for override audit

src/app/api/prices/                ✅ route.ts · recommendation/route.ts · alerts/
src/app/api/admin/prices/          ➕ imports · overrides · health
scripts/prices/                    ➕ backfill + calibration (offline)
src/components/app/prices/         ➕ the rebuilt UI (doc 08)
```

### 2.1 Why external observations get their own collection

`PriceHistory` records **what happened on UmojaHub** — a farmer listed at this price, an order completed at that one. It carries `farmerId` and `orderId` foreign keys and is written by platform workflows.

An external observation is a different kind of fact: a market-level statistic published by a third party, with a source, a licence, a collection date, a market name, a grade, and possibly both wholesale and retail figures. Forcing it into `PriceHistory` would mean nullable foreign keys, a `source` enum doing double duty, no place for provenance, and — worst — the standing risk that a query written for platform data silently picks up external rows or vice versa.

`PriceHistorySource.EXTERNAL_INGESTION` exists in the enum and is unused (document 01 §4.1). **It stays unused and should be considered deprecated in place.** Two collections, joined at the feature layer, where the join is explicit and the weighting is deliberate.

---

## 3. Data flow

### 3.1 Ingestion (asynchronous, off the request path)

```
Source ──adapter──▶ RawObservation[]
                        │
                        ▼  normalize: crop id, county, unit basis, market
                    Candidate[]
                        │
                        ▼  validate: range, unit, vocabulary, spike
              accepted ─┴─ rejected ──▶ PriceIngestionRun.rejections
                        │
                        ▼  dedupe on (source, market, crop, unit, observedAt)
                        ▼  promotion gate: automatic | admin approval
              MarketPriceObservation
```

The promotion gate is where `03_DATA_SOURCE_COMPARISON.md` §3.2's trust distinction becomes code: scheduled-refresh sources promote automatically once validation passes; admin-import sources require a human. Same pipeline, different gate.

### 3.2 Recommendation (synchronous, must feel instant)

```
GET /api/prices/recommendation
  → composeRecommendation (cached, 600s)          ✅ exists
      → features/assemble
          ├── PriceHistory        (platform points)
          ├── MarketPriceObservation (external)   ➕
          ├── Order / MarketplaceListing (demand)
          ├── FarmerTrustScore    (weights)
          └── taxonomy + adjacency + season
      → assembleRecommendation (PURE)             ✅ exists, extended
          ├── weighted robust statistic           ✅
          ├── forecast/                           ➕
          ├── demand · trend · season             ✅
          ├── evidence ledger                     ➕
          └── insight                             ✅ extended
```

`assembleRecommendation` is pure and unit-tested today. **That property is non-negotiable and every extension preserves it** — the forecast is computed from points already fetched, not by reaching back into the database. This is what makes `12_TESTING_STRATEGY.md` able to assert behaviour deterministically instead of through fixtures and mocks.

---

## 4. Performance

The brief asks for predictions that feel instantaneous. The relevant facts: the listing form fires on every debounced keystroke (`PriceRecommendationPanel.tsx:59`, 400 ms), the recommendation path ran five queries including a 3,000-row `PriceHistory` read, and `cooperativeInsights.ts` calls the engine up to eight times in sequence.

The strategy has three levels and no inference-time model training at any of them.

| Level | Mechanism | Status |
|---|---|---|
| **L1 — Read-through cache** | `cached()` at 600 s TTL keyed on crop·county·unit, quantity applied afterwards, `shouldCache` refusing zero-confidence results | ✅ landed (D5) |
| **L2 — Precomputation** | `weekly-jobs` warms recommendations for the crop × county cells that actually have traffic, so the common case is a cache hit even when cold | ➕ |
| **L3 — Bounded queries** | Compound indexes on the observation collection; the existing `{cropName, unit, recordedAt}` index on `PriceHistory`; hard row caps retained | Partly ✅ |

**Inference cost is a design input, not an afterthought.** `05_MODEL_SELECTION_REPORT.md` rejects any model whose inference cannot complete inside a cached request on Vercel Hobby. A forecast that needs a 30-second warm-up is not a forecast this platform can ship, however accurate it is.

---

## 5. Failure behaviour

The engine sits in the listing-creation path. It must never block a farmer from listing produce.

| Failure | Behaviour |
|---|---|
| Database unreachable | Null price, zero confidence, empty state copy. Already implemented (`priceIntelligence.ts:442`). Not cached (`shouldCache`). |
| Redis unreachable | Fail open — recompute. Already implemented (`cache.ts:92`). |
| External source stale | Its observations stop contributing; confidence falls; explanation says so. |
| Forecast unavailable | Recommendation renders without the forward-looking block. The nowcast never depends on the forecast. |
| Thin evidence | Below `MIN_POINTS`, no price is shown at all — an honest empty state, never a fabricated number. |

The last row is the important one and is existing behaviour worth restating as policy: **the engine's failure mode is silence, not a guess.**

---

## 6. Designed-for extension

The brief lists weather, satellite imagery, disease outbreaks, exports, import prices, currency, fuel and market shocks as future additions and asks that the architecture accommodate them without implementing any. Each falls into one of three existing shapes:

| Future input | Shape it takes | Architectural requirement |
|---|---|---|
| Weather (KAOP/KMD), rainfall | A non-price observation series keyed on county + date | The feature layer must accept series that are not prices — so `features/assemble.ts` is specified around a *keyed series* abstraction, not around `MarketPriceObservation` |
| Satellite, disease outbreaks | Same | Same |
| Import prices, exports, FX, fuel | National-level covariates | The forecast interface accepts optional exogenous inputs and ignores them when absent |
| Market shocks | An annotation on a time window | The evidence ledger already carries per-observation provenance; a shock is an annotation over the same key space |

That is the whole accommodation. No speculative interfaces, no plugin registry, no abstraction built for a caller that does not exist — the three extension points above are all real requirements of the *current* design (external series, swappable forecast, provenance), and they happen to be sufficient. Anything more would be building for imagined futures, which is how the five drifting crop lists in document 01's D2 came to exist.

---

**Next:** `05_MODEL_SELECTION_REPORT.md` — what actually goes in the inference layer, and why it is not gradient boosting.
