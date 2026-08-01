# 12 — Testing Strategy

**Status:** Draft for approval · **Date:** 2026-08-01 · **Depends on:** `04`, `05`, `07`, `09`

The last document. It answers two questions that the previous eleven assume rather than establish: how we know the engine is correct, and how we know it is *useful* — which are not the same question and do not have the same instrument.

`01` §8 set the measurable version of success: *forecast accuracy against a seasonal-naïve baseline, recommendation coverage, and the share of displayed figures backed by a completed sale or an external observation rather than an asking price.* None of the three is measured today.

---

## 1. What the suite actually is

Measured, not estimated: **75 suites, 822 tests** over **344 non-test source files**. Coverage thresholds are enforced on `src/lib/validation/` (95% lines) and `src/lib/trust/` (90%); the global threshold is `{}` and `src/lib/intelligence/` has none.

Coverage for the engine, measured directly:

| Module | Stmts | Uncovered region |
|---|---|---|
| `demand.ts` · `regions.ts` · `seasonality.ts` | **100** | — |
| `weighting.ts` | 98.41 | 120–121 |
| `trend.ts` | 97.18 | 59–60 |
| `insight.ts` | 96.34 | 44–45, 56 |
| `priceAnalytics.ts` | 84.75 | 288–341 |
| `assistantPriceContext.ts` | 80.51 | 125–154 |
| `buyerFairness.ts` | 80.16 | 98–121 |
| `ngoMarketHealth.ts` | 79.58 | 193–240 |
| `cooperativeInsights.ts` | 62.42 | 109–173 |
| `priceIntelligence.ts` | **61.89** | 298–458, 472–496 |
| **All files** | **79.44** | |

**Every uncovered region is an async database wrapper, and every well-covered module is pure.** `assembleRecommendation` is exhaustively tested; `computeRecommendation` (298–458) and `composeRecommendation` (472–496) are not executed by any test. The same split holds for `getListingFairness` (98–121), `aggregateMemberCrops`'s DB half, and the rest.

This is the direct consequence of the architecture `04` §1 chose, and that choice was correct — the purity of the core is what lets `09`'s behaviour be asserted deterministically instead of through fixtures and mocks. But it has a shadow, and the shadow is the subject of §2.

---

## 2. The finding: the defects lived in the untested half

Three live defects were found by code review during this programme. Not one was found by the test suite. Their distribution is not random.

**D1 — the mixed-unit defect — lived at `priceIntelligence.ts:331–336`**, inside the 298–458 range that no test executes. `PriceHistory` was queried on `cropName` and `recordedAt` only, and `.select()` omitted the `unit` column, so the pure layer was *structurally incapable* of filtering — it never received the field. A weighted median over maize at KES 40/KG and KES 3,600/BAG returned 3,500 for a KG request. The pure layer had 100%-covered weighting primitives computing a correct weighted median over a corrupt point set.

> **A pure function cannot be tested into correctness if the impure layer feeds it the wrong data.** Coverage of the core measured the quality of the arithmetic, not the quality of the answer.

**D6 — POST-only crons — escaped a test suite that existed and passed.** `src/app/api/cron/price-alert-check/__tests__/route.test.ts` imports `POST` (line 74) and describes `POST /api/cron/price-alert-check` (line 100), with genuinely thorough assertions. Meanwhile `vercel.json` declares the schedule and Vercel invokes it with **GET**. The route exported no `GET`, so the job never ran in production. Every test passed the whole time.

> **The tests asserted the behaviour of a handler. Nothing asserted that the module's exported surface matched the contract the deployment platform would call it under.**

**D14 — the buyer fairness signal — had no test at all**, and its failure mode was a mismatch between a *public page* and a *role-gated endpoint*. That is not a unit-level property; it exists only in the relationship between `middleware.ts`'s exemption list, a component's fetch, and a route's `requireRole`. No unit test of any of the three could have caught it, and all three were individually reasonable.

The common shape: **all three were contract failures at a boundary, and the suite tests units and handlers, not boundaries.** More unit tests would not have found any of them.

---

## 3. Three classes of test the suite lacks

### 3.1 Contract tests

Cheap, fast, no database, and they would have caught D6 and D14 outright. These assert relationships that no single unit owns.

| Invariant | Catches |
|---|---|
| Every path in `vercel.json` `crons` resolves to a route module exporting **`GET`** | D6 |
| Every route under `src/app/api/cron/` is either scheduled in `vercel.json` or invoked by one that is | Drift — three of five cron routes are currently unscheduled, their work inlined into `weekly-jobs` (`route.ts:21–23`). Two implementations of one job is a divergence waiting to happen |
| Every endpoint fetched from a page under a `middleware.ts` `EXEMPT_PREFIXES` route is reachable **without a session** | D14 |
| Every API route calls `requireRole` or is deliberately listed as public | Silent authorization drift |

The third is the important one and it is the only one that is awkward to automate, because "which endpoints does this page fetch" is not statically obvious. The tractable version is an explicit registry: **public surfaces declare the endpoints they depend on**, and the test asserts each is public. A declared list that drifts is caught; an undeclared fetch is a review question. Partial enforcement of a real invariant beats total enforcement of a trivial one.

### 3.2 Integration tests over the database wrappers

The 298–458 gap needs a database, and the repo has no infrastructure for one — no `mongodb-memory-server`, no test database, no fixtures. The only DB-touching tests mock `@/lib/db` outright (`jest.mock('@/lib/db', …)`, the established pattern).

**Do not close this gap by raising a coverage threshold.** A line-coverage target on `priceIntelligence.ts` would be satisfied by mocking Mongoose query builders, which asserts that the code calls the methods it calls — a tautology that passes while D1 is live, since a mocked `.select()` returns whatever the test says it returns. That is worse than no test, because it manufactures confidence.

The gap should be closed with **a small number of real integration tests against an in-memory MongoDB**, asserting the properties that only exist when a real query runs:

- A `PriceHistory` collection containing both KG and BAG rows for one crop yields a KG recommendation drawn **only** from KG rows (D1, at the layer where it actually lived).
- The 3,000-row cap does not starve the requested unit.
- `resolveCrop`'s pattern matches the same rows the alert cron matches (D3).
- The cache returns a stored result on the second call and does not store a zero-confidence one (`shouldCache`).
- `excludeFarmerId` removes the requesting farmer's own `LISTING_CREATED` points (D12, when built).

That is five tests, not a coverage percentage. One new dependency, with two constraints on how it is taken:

- **`mongodb-memory-server-core`, not `mongodb-memory-server`.** The latter runs a `postinstall` that downloads a ~400 MB MongoDB binary during `npm install`, which every developer and every CI job would pay for whether or not they run these tests. The `-core` package is the same library without that hook; the binary is fetched lazily on first use and cached.
- **Gated behind `npm run test:integration`** (`jest.integration.config.ts`), excluded from `npm test` by a `testPathIgnorePatterns` entry on `*.integration.test.ts`. The ordinary gate stays fast and binary-free; CI opts in deliberately or not at all. A separate config rather than an env-var switch, because npm scripts that set env vars inline are not portable to Windows.

The cost is that these tests do not run by default, so they can rot unnoticed. That is the accepted trade, and it is the reason the *contract* tests of §3.1 — which need nothing — carry the invariants that must never regress.

### 3.3 The backtest harness

Everything above establishes correctness. None of it establishes **usefulness** — whether the number is any good. That is §4.

---

## 4. Measuring usefulness

### 4.1 Forecast accuracy

`05` §5 already fixed the gate and this document does not reopen it: **MAE on log prices plus a skill score against seasonal naïve; ≥10% pooled MAE improvement required, with no crop-level cell materially worse; interval calibration checked separately, an 80% interval containing the actual ~80% of the time.** If the gate fails, seasonal naïve ships, labelled honestly. `05` §131 is right that committing to shipping the baseline is what makes the gate real.

The harness this requires is enabled by the property `04` §1.1 protects: `assembleRecommendation` is a total function of `(points, demandInputs, now)`. **Backtesting is therefore just calling it with a truncated point set and a historical `now`** — no time-travel mocking, no database, no fixtures beyond the points themselves.

The discipline that matters more than the metric:

- **Truncate on `recordedAt`, never on `ingestedAt`.** An observation imported on the 20th describing the 5th was not available on the 6th. `07` §3.1 stores both timestamps and this is what the second one is for. Getting this wrong produces a model that looks excellent and fails in production, which is the single most common way a backtest lies.
- **Rolling origin, not a single split.** One holdout on thin seasonal data measures the holdout.
- **Report the cells the model could not serve**, not just the error on the ones it could. A model with a wonderful MAE over the 12% of cells that clear `MIN_POINTS` is not a good model; it is a narrow one. This is why §4.2 is reported *beside* accuracy and never separately.

### 4.2 Coverage — the share of the market the engine can actually serve

Per `01` §8: **the share of crop/county/unit cells that clear `MIN_POINTS` at county scope**, with the fallback distribution beside it (COUNTY / REGION / NATIONAL).

This is the metric this programme is most likely to damage, and that must be visible rather than discovered. `01` §6 was explicit: filtering by unit rather than converting shrinks every cell, so **more cells fall to region and national fallback and report lower confidence — the truthful picture of thin pilot data, not a regression.** If coverage is not measured, that predicted effect is indistinguishable from a bug, and someone will eventually "fix" it by reintroducing the conversion table.

Report as a distribution, never as a single number. "61% of cells clear county scope" hides that maize clears everywhere and the seven crops without a seasonal calendar clear nowhere.

### 4.3 Evidence quality

Per `01` §8: **the share of displayed figures backed by a completed sale or an external observation rather than an asking price.**

`completedSaleShare` is already computed and returned in `basis` on every recommendation — the metric exists and nothing aggregates it. This is the cheapest of the three to implement and arguably the most diagnostic, because a platform whose prices are mostly derived from asking prices is reporting what farmers *hope* to get, and `03` §2.2's whole external-data programme exists to change that ratio.

### 4.4 Calibrating the 0.7 external weight

`07` §190 flagged it: the `EXTERNAL_INGESTION` weight of 0.7 *"was set before any external data existed"* and must be calibrated *"against whether external observations actually predict realised platform sale prices better or worse than platform listings do — and revised on evidence rather than left as a guess that hardened into a constant."*

Once the harness of §4.1 exists this is a direct measurement: hold out completed sales, score recommendations computed with the external weight swept across a range, and read off the value that minimises error. **Until it is measured, 0.7 must stay labelled as provisional in `weighting.ts`.** A guess with a comment explaining it is a guess is honest; the same number six months later with the comment deleted is a fabricated constant, and this is exactly how D2's five drifting crop lists came to exist.

---

## 5. The regression corpus

Sixteen defects have been registered across `01`, `09` and `10`. **Each fixed defect gets one test named for it**, asserting the specific wrong behaviour cannot return.

Already in place: D1 (mixed-unit regression, pure layer), D2/D3 (`taxonomy.test.ts`, 190 lines), D9 (weighted national average), D14/D15/D16 (`buyerFairness.test.ts`, 9 tests).

Missing and owed: **D1 at the query layer** (§3.2 — the fix touched both layers, only one is tested), **D5** (cache hit and the `shouldCache` zero-confidence rule), **D6** (§3.1's `vercel.json` contract test), **D8** (seeded data lands inside the 90-day window — a seed regression is invisible until a demo).

D4, D7, D11, D12 and D13 are open, settled by `09` and `06`, and their tests ship with their fixes.

**Name the test after the defect.** `'D1 — a KG request never draws on BAG rows'` survives refactoring in a way that `'filters units correctly'` does not, because six months from now the second one looks like a redundant test of an obvious property and gets deleted.

---

## 6. Thresholds

| Path | Threshold | Rationale |
|---|---|---|
| `src/lib/validation/` | 95% (existing) | Unchanged |
| `src/lib/trust/` | 90% (existing) | Unchanged |
| **`src/lib/intelligence/` pure modules** | **90% lines** | `weighting` `demand` `trend` `seasonality` `regions` `insight` already exceed it (96–100). A ratchet against regression, not a target to reach |
| `src/lib/intelligence/` wrappers | **None, deliberately** | §3.2 — a threshold here buys mock-heavy tautologies. Covered by a named integration list instead |

Global thresholds stay empty. A global number over 344 files drives coverage-chasing on the files easiest to cover, which are never the risky ones — a claim this document can now make from evidence rather than principle, since the two files that held live defects were the ones a global threshold would have pushed hardest toward mocked tests.

---

## 7. What this document does not ask for

- **No snapshot tests of rendered price components.** `08`'s surfaces are pre-Figma; snapshots would freeze a design that is explicitly scheduled to be replaced.
- **No E2E test of the recommendation number.** The 18 Playwright specs cover flows; asserting a computed price E2E duplicates the pure tests against a slower, flakier instrument.
- **No test that the insight sentence reads well.** It is deterministic and asserted structurally. Prose quality is a review question.
- **No mocking of Mongoose in new tests.** Either the test needs a database (§3.2) or it belongs at the pure layer.

---

## 8. Sequencing

1. **Contract tests (§3.1)** — no new dependency, catches the two defect classes that already shipped. Do first.
2. **Regression corpus gaps (§5)** — D5, D6, D8, D1-at-query-layer.
3. **Integration harness (§3.2)** — adds `mongodb-memory-server-core` behind `npm run test:integration`; unblocks honest wrapper testing without slowing the default gate.
4. **Measurement (§4.2, §4.3)** — coverage and evidence-quality metrics are pure aggregations over data that exists today. **These can and should ship before any V2 feature**, because they are the instruments that will tell us whether V2 helped.
5. **Backtest harness + weight calibration (§4.1, §4.4)** — needs external data, so it follows `11` §7.

Steps 1, 2 and 4 depend on nothing this programme has not already built.

---

## 9. Risks registered

| # | Item | Note |
|---|---|---|
| **R4** | **The suite tests units, not boundaries.** All three defects found by review were boundary contract failures, and the suite passed throughout. §3.1 is the smallest correction. | Fix first — no new dependency |
| **R5** | **Every DB wrapper in the engine is unexecuted by any test**, including the function that held D1. No infrastructure exists to change this. | §3.2; needs one dependency |
| **R6** | **None of the three success metrics in `01` §8 is measured**, so the programme currently has no way to tell whether V2 improved anything. Coverage is the one most at risk of being misread as a regression. | §4.2–4.3 ship before V2 |

---

**End of the document set.** Documents `01`–`12` are complete. `01` §5 records Phase 0 as the approved exception already taken; every remaining defect and feature is gated on approval of this set.
