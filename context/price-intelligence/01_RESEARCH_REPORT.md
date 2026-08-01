# 01 — Research Report

**Status:** Draft for approval · **Date:** 2026-07-29 · **Supersedes:** `context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md` (2026-06-22)

This is the first of twelve documents. No V2 feature code is written until the set is approved. The one exception already taken is Phase 0 — a correctness branch described in §5, approved separately because the defects it fixes are live and because external data cannot be joined without it.

---

## 1. The problem

A smallholder in Kirinyaga deciding what to charge for a crate of tomatoes has, in practice, four sources of information: what a neighbour got last week, what they themselves got last season, what a broker at the farm gate offers this morning, and rumour. None of these is a market price. All of them are stale, local, or adversarial — the broker's quote is an opening bid, not information.

The consequences are asymmetric and well documented in agricultural economics: a farmer who underprices loses margin silently and never learns; a farmer who overprices watches produce spoil and blames the platform. Buyers, seeing both, learn that listed prices carry no signal and negotiate everything, which raises transaction cost for everyone and pushes volume back to the brokers the platform exists to disintermediate.

UmojaHub's opportunity is not to *set* prices. It is to make the market legible at the moment of decision — the instant before a farmer types a number into a listing form.

## 2. What already exists

A Price Intelligence Engine shipped in PR #39 and is live on `main`. This section records what it actually does, verified against the code rather than the design document.

**Module layout** — `src/lib/intelligence/`, eleven modules with five adjacent test files:

| Module | Role |
|---|---|
| `priceIntelligence.ts` | Orchestrator. `assembleRecommendation` (pure, tested) + `composeRecommendation` (DB wrapper). |
| `weighting.ts` | Per-point weight and the weighted median/percentile/mean primitives. |
| `demand.ts` · `trend.ts` · `seasonality.ts` · `regions.ts` | Sub-scorers and static calendars. |
| `insight.ts` | Deterministic natural-language explanation. No LLM. |
| `priceAnalytics.ts` · `cooperativeInsights.ts` · `ngoMarketHealth.ts` | Admin, cooperative and NGO projections. |
| `assistantPriceContext.ts` | Grounds the Farm Assistant in engine figures. |

**The algorithm.** The headline number is a weighted median over `PriceHistory` within a 90-day window, where

```
weight = recency(21-day half-life) × source × trust-tier × geo-scope × disputed
```

with `ORDER_COMPLETED` 1.0 / `LISTING_CREATED` 0.6 / `EXTERNAL_INGESTION` 0.7; trust tiers 1.30 → 0.85; geo scope 1.0 / 0.6 / 0.3; disputed points multiplied by 0.25. The engine picks the narrowest geographic tier that clears `MIN_POINTS = 3` (county → region → national) and reports a 0–100 confidence score whose geographic factor caps a national-fallback estimate at roughly 60.

**This is a sound design and it is not being discarded.** A weighted robust statistic is the right instrument for the data volumes involved, and §5 of `05_MODEL_SELECTION_REPORT.md` argues that at some length. What follows is about what it cannot do and what it got wrong.

## 3. The brief's ten questions, honestly assessed

The brief lists ten questions Price Intelligence should answer. This table is the spine of the whole V2 programme.

| Question | Today | With external data | Notes |
|---|---|---|---|
| What should I sell this for today? | **Yes** | Better | Works, but grounded only in UmojaHub's own activity. |
| What price gives the highest chance of selling? | **No** | Yes | Requires modelling time-to-sale against price, which needs a sell-through history the platform is only beginning to accumulate. |
| What are buyers currently paying? | **Partly** | **Yes** | Today this means "what UmojaHub buyers paid". KAMIS publishes wholesale *and* retail per market, which is what the question actually means. |
| Is my price too high / too low? | **Yes** | Better | Already expressed as a range and a fairness band. |
| How does my Trust Score influence pricing? | **Yes** | — | Trust is a weight on other farmers' data, not a premium on your own price. The UI must not imply otherwise. |
| What are neighbouring counties charging? | **No** | **Yes** | Blocked twice over: no county adjacency graph exists (only an 8-region proxy in which Nairobi is a singleton with no peers), and no cross-county data at market resolution. |
| Should I wait before selling? | **No** | **Yes** | Needs a forecast. Nothing in V1 looks forward. |
| Will prices increase / decrease? | **No** | **Yes** | Same. `trend.ts` classifies the *past*. |

Two of these — "highest chance of selling" and "should I wait" — are the ones that would make the feature feel like intelligence rather than arithmetic, and both are currently absent.

## 4. The four capability gaps

**4.1 No external market grounding.** `PriceHistorySource.EXTERNAL_INGESTION` is a defined-but-unused enum value. Every figure the engine produces derives from UmojaHub's own price points — roughly 130 rows across ~10 crops from the simulator, since the fixed seed contributed nothing usable. At pilot scale this is a closed loop: the platform tells farmers what other farmers on the platform asked for, and those asking prices then become the evidence for the next recommendation. It is self-referential in a way that is fine at national scale and misleading at pilot scale. This is the single most important gap.

**4.2 No forecasting.** `trend.ts` compares a window mean against the prior window and labels it rising, stable or falling beyond ±5%. That is a description of history. "Should I wait?" needs a projection with an honest uncertainty band.

**4.3 No decision support beyond a price.** The brief is explicit that the output should be intelligence, not a number. Missing: expected selling speed, risk of over- and under-pricing, wait-vs-sell guidance, and — underpinning all of them — an evidence ledger so every figure can be traced to the observations that produced it.

**4.4 No data operations.** There is no ingestion, no source-health monitoring, no import history, no model evaluation, no anomaly review queue, and no way for an administrator to override a recommendation with an audit trail. A data product without operational tooling degrades silently.

## 5. Defect register

Found during codebase review, all verified against source. Phase 0 (branch `fix/price-engine-foundations`, four commits) addressed them.

| # | Defect | Status |
|---|---|---|
| D1 | **Units were never filtered.** `composeRecommendation` queried `PriceHistory` by `cropName` + `recordedAt` only. `EnginePoint` carried no `unit` field and the `.select()` omitted the column, so the engine was *structurally* incapable of filtering. `PriceHistory` holds maize both per 90 kg BAG (~KES 3,600) and per KG (~KES 40); a KG request returned a weighted median over a bimodal set spanning two orders of magnitude, labelled "KG". A regression test reproduced it returning **3,500 for a KG request**. | **Fixed** — filtered at the database and in the pure layer. See §6. |
| D2 | **No canonical crop taxonomy** — five drifting lists; the simulator's twelve crops did not match the engine's ten, so most generated listings resolved to an UNKNOWN season and a null benchmark. | **Fixed** — `src/lib/taxonomy/crops.ts`. |
| D3 | **Inconsistent crop matching** — the engine used an anchored regex; `/api/prices` and the alert cron used exact equality, so an alert on "Milk" saw none of the engine's "dairy" data. | **Fixed** — one `resolveCrop`. |
| D4 | **Two parallel price systems** on the same dashboard: `/api/prices` (flat unweighted mean + `MarketInsight`) and `/api/prices/recommendation` (weighted median). | **Open** — settled by `09_RECOMMENDATION_ENGINE_SPEC.md`. |
| D5 | **No caching.** Every debounced keystroke ran five queries including a `PriceHistory` read capped at 3,000 rows; `cooperativeInsights.ts` called the engine up to eight times sequentially. | **Fixed** — 10-minute TTL inside `composeRecommendation`. |
| D6 | **Crons were POST-only while Vercel invokes GET**, so both `vercel.json` entries silently never ran in production. | **Fixed** — `GET` exported from all five routes. Confirm against deployment logs. |
| D7 | **No county adjacency.** `regions.ts` maps 47 counties to 8 former provinces; `Nairobi` is a singleton with no peers and falls straight to national. | **Open** — settled by `06_FEATURE_ENGINEERING_SPEC.md`. |
| D8 | **Seed price data hard-coded to Jan–Feb 2024**, outside the 90-day window, so a freshly seeded database rendered only empty states. | **Fixed** — series generated relative to run time. |
| D9 | `nationalAveragePerUnit` was the only unweighted figure shown. | **Fixed** — weighted, geographic term held neutral. |
| D10 | `price-analytics` reported as unlinked in the admin nav. | **No defect** — `AdminShell.tsx:109` links it. The unlinked copy is the legacy `Sidebar.tsx`, which serves only the null-role fallback. |

## 6. A finding that changed the design

The obvious fix for D1 was a KG-equivalent conversion table: normalise every price to a common basis and compare freely. Research contradicted it.

- **Maize** trades at 90 kg per bag — NCPB publishes its purchase price per 90 kg bag — while the **Crops (Food Crops) Regulations 2019** cap a package at 50 kg. Both figures are in live use, and NCPB has been challenged in parliament over the 90 kg bag.
- **Irish potatoes** are capped at 50 kg by the **Crops (Irish Potato) Regulations 2019**, yet "extended bags" of 110 kg persist in the trade, with periodic enforcement drives.

Converting a BAG price with the wrong constant produces a ~44% error — considerably worse than the defect being fixed. So the engine **filters rather than converts**: it compares like with like and accepts a smaller evidence base, which its confidence score already models honestly. The conversion table still exists in `src/lib/taxonomy/units.ts` for external ingestion, where a source states its own basis, but every constant records its ambiguity and `DISPUTED` ones require an explicit opt-in.

The general principle, which should govern the rest of this programme: **fewer points with an honest confidence score beat more points and a wrong number.**

A second-order effect follows and should be expected rather than treated as a regression. Filtering shrinks each crop/county cell's evidence pool, so more cells fall through `MIN_POINTS` into region or national fallback and report lower confidence. That is the truthful picture of how thin pilot data actually is.

## 7. Constraints that bound every later decision

These are not preferences; they are the operating envelope.

| Constraint | Consequence |
|---|---|
| **No Python runtime.** Next.js 15 on Vercel, single build and deploy shared with the public website. | No in-process scikit-learn / XGBoost / LightGBM / CatBoost. Any model must either be implemented in TypeScript or trained offline and exported as an artifact for TS inference. |
| **$0 budget** — Atlas M0, Vercel Hobby. | No managed ML service, no separate inference host, no large working set. Read volume matters. |
| **Vercel Hobby allows 2 cron jobs**, both already used (`vercel.json`). | Ingestion becomes a sub-task of `weekly-jobs`, which already consolidates three jobs for this exact reason, plus an admin-triggered manual import. |
| **~130 platform price points** across ~10 crops. | Nothing can be trained on UmojaHub's own data. Any learned model must learn from external Kenyan history. |
| **The app UI is under an approval-gated redesign**; Figma is the source of truth. | The UI specification is written first and designed in Figma against `DESIGN_SYSTEM_V1` before implementation. |
| **Platform logic is off-limits** — auth, orders, escrow, payments, trust, RBAC. | The engine stays additive and read-only over existing collections. External reference data goes in its own collection, not into `PriceHistory`. |

## 8. What success looks like

A farmer opening the listing form should stop asking "what price should I use?" — not because a number was handed to them, but because they can see what the market is paying, how confident that figure is, why it moved, and what happens if they wait. A buyer looking at a listing should be able to tell a fair price from an opportunistic one without negotiating. An administrator should be able to answer "where did this number come from?" for any recommendation the platform has ever shown.

The measurable version of that is in `12_TESTING_STRATEGY.md`: forecast accuracy against a seasonal-naïve baseline, recommendation coverage (share of crop/county cells that clear `MIN_POINTS` at county scope), and the share of displayed figures backed by a completed sale or an external observation rather than an asking price.

---

**Next:** `02_KENYAN_DATASET_REVIEW.md` — what data actually exists, what state it is in, and what may lawfully be used.
