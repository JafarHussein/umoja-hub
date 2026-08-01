# 05 — Model Selection Report

**Status:** Draft for approval · **Date:** 2026-07-29 · **Depends on:** `03`, `04`

The brief says: *"Do not immediately jump to deep learning… Simplicity and reliability are preferred over unnecessary complexity."* Agreed, and this document tries to earn that conclusion rather than assert it — including by naming the conditions under which the answer would change.

---

## 1. There are two problems, not one

Nearly every mistake available here comes from treating price intelligence as a single prediction task. It is two, with different data, different error tolerances and different right answers.

| | **Nowcast** | **Forecast** |
|---|---|---|
| Question | "What is this worth *here, today*?" | "Where is it heading?" |
| Output | A price and a range | A direction, a magnitude, an uncertainty band |
| Data | Sparse, local, mixed-provenance, recent | Dense, national/market-level, monthly, long |
| Failure cost | **High** — a wrong number is acted on immediately | Moderate — expressed as a tendency, hedged by construction |
| Right instrument | A robust weighted estimator | A time-series model |

The live V1 engine solves the first and does not attempt the second (document 01 §4.2). The two capability gaps that would make the feature feel intelligent — *"what price gives the highest chance of selling"* and *"should I wait"* — sit across both.

---

## 2. Constraints, restated as a filter

From `01_RESEARCH_REPORT.md` §7, and every one of these has already eliminated a candidate before accuracy was considered:

1. **No Python runtime.** Next.js on Vercel, one build shared with the live public website. No in-process scikit-learn, XGBoost, LightGBM or CatBoost.
2. **$0 budget.** Atlas M0, Vercel Hobby. No managed inference, no second host.
3. **~130 platform price points** across ~10 crops. Nothing can be trained on UmojaHub's own data.
4. **Explanation is a product requirement**, not a nicety — *"never present black-box AI"*. A model whose output cannot be decomposed into stated reasons cannot ship on the farmer surface regardless of its accuracy.
5. **Inference must fit inside a cached web request** on Hobby.

Constraint 4 deserves emphasis because it is the one most often waved away. The brief requires the farmer to understand *why*. An explanation generated post-hoc to rationalise an opaque prediction is not an explanation; it is a plausible story about a number that was produced some other way. On a surface where a smallholder is deciding what to charge for their harvest, that is a worse product than a simpler model whose reasoning is genuinely the reasoning.

---

## 3. The nowcast

### 3.1 Candidates

| Approach | Verdict |
|---|---|
| **Weighted robust statistic** (weighted median + IQR band) | **Selected.** |
| Linear regression on county/crop/season | Rejected — with 3–15 points per cell, coefficient estimates are noise. Assumes a functional form the data cannot support. |
| Random Forest / GBM / XGBoost / LightGBM / CatBoost | Rejected — see §3.3. |
| Hierarchical / partial-pooling Bayesian model | **Genuinely attractive, deferred.** See §3.4. |

### 3.2 Why the existing estimator is right

The nowcast problem is: given a handful of observations of varying age, provenance, trustworthiness and geographic distance, estimate a central price and a plausible range. The weighted median already implemented in `weighting.ts` is close to the textbook answer.

- **Robustness is the dominant requirement.** Enumerator-collected market data carries order-of-magnitude keying errors (`02_KENYAN_DATASET_REVIEW.md` §2.1), and a single mistyped row would wreck a mean. A median with 3–15 points is unmoved by it.
- **Weighting is where the domain knowledge lives.** `weight = recency × source × trust × geo × disputed` encodes four substantive claims: fresher is better, a completed sale beats an asking price, a trusted farmer's realised price is better evidence, and local beats distant. Each is separately arguable, separately testable, and separately explainable to a farmer. A learned model would fold all four into weights nobody can talk about.
- **Sample size forbids anything else.** With `MIN_POINTS = 3`, there is no model to fit.
- **It degrades honestly.** The geo-fallback ladder (county → region → national) with a confidence score that caps national fallback near 60 is the correct behaviour for sparse data, and it is already built.

**This is not a compromise made under constraint.** Given a Python runtime and unlimited budget, the right nowcast estimator for 3–15 heterogeneous observations would still be a weighted robust statistic. The constraints did not cost anything here.

### 3.3 Why not tree ensembles

Random Forest, XGBoost, LightGBM and CatBoost are the standard answer to tabular regression, and they are the wrong answer here for reasons that go beyond the missing runtime:

- **No training data.** ~130 platform points, and even after external ingestion, KAMIS is *market-level* data — it tells you what a market paid, not what a farmer with trust tier X and quantity Y achieved. The features that make a tree ensemble worth having (trust, quantity, listing quality) exist only in the platform's own thin data.
- **Trees interpolate; they do not extrapolate.** Kenyan food prices move on shocks — drought, export bans, fuel. A tree ensemble trained through 2026 predicts within its observed range and is confidently wrong exactly when a farmer most needs the truth. The weighted median has no such pretension.
- **Opacity conflicts with constraint 4.** SHAP values are not an answer to "explain this in simple language to a smallholder".
- **Marginal gain is unmeasured and probably small.** Nobody has demonstrated a tree ensemble beating a weighted local median at 3–15 points. It would need to be shown before being adopted, not assumed.

**The honest upgrade path.** If, at scale, tree ensembles do beat the estimator, the constraint is not fatal: a fitted tree ensemble is a static structure that can be trained offline in Python, exported to JSON, and evaluated in TypeScript by tree traversal — inference is a few hundred comparisons, well inside the request budget. The architecture in `04_SYSTEM_ARCHITECTURE.md` places training in `scripts/prices/` (offline) precisely so this remains available. **The blocker is data, not runtime, and it should be described that way in every future discussion.**

### 3.4 The deferred candidate

Partial pooling is the technically correct treatment of "Kirinyaga has 4 tomato observations, the Central region has 30, the country has 400": estimate a county effect shrunk toward the regional mean by the strength of local evidence. That is exactly what the geo-fallback ladder approximates with a step function — the ladder picks *one* tier and discards the rest; partial pooling would blend them continuously and yield better-calibrated intervals.

It is deferred because the step function is explainable in one sentence (*"there wasn't enough data in your county, so this uses the wider region"*) and a shrinkage estimator is not. When external data makes county cells routinely dense, the ladder's discontinuities will start to show, and that is the moment to revisit. Recorded here so the eventual decision is a revisit and not a rediscovery.

---

## 4. The forecast

This is the genuinely new capability, and where model choice actually matters.

### 4.1 What the data supports

WFP provides monthly observations from 2006 **[ATTESTED]** — roughly 230 points per market-commodity series. That is a **short series with strong annual seasonality**, which narrows the field sharply:

- 230 points cannot support a model with many parameters. Every additional free parameter is a meaningful fraction of the data.
- Two harvests a year (long rains March–May, ~80% of annual food production; short rains October–November **[ATTESTED]**) means seasonality is the single largest signal and any model that misses it is beaten by one that does nothing else.
- Monthly cadence means the forecast horizon is weeks-to-months. **"Should I wait?" over a 1–2 week horizon is largely a seasonal-position question**, not a fine-grained prediction — which is fortunate, because fine-grained prediction is not available.

### 4.2 Candidates

| Approach | Verdict |
|---|---|
| **Seasonal naïve** (value from the same month last year, or a robust average of the same month across years) | **The baseline. Must be beaten to justify anything else.** |
| **Seasonal decomposition + damped trend** | **Selected**, conditional on beating the baseline. |
| Holt-Winters / ETS | Close relative of the above; evaluate as a variant. Rejected only if it does not win. |
| ARIMA / SARIMA | Rejected — order selection on 230 points is unstable, no TS implementation the team can maintain, and it cannot be explained to a farmer. |
| Prophet | Rejected — Python, and a heavier tool than a bimodal seasonal series needs. |
| Tree ensembles with lag features | Rejected — cannot extrapolate trend, which is the entire question. |
| LSTM / deep learning | Rejected — 230 points. Not a close call. |
| Ensemble of the above | Deferred — only meaningful once ≥2 candidates have each beaten the baseline. |

### 4.3 The selected model

Additive decomposition on log prices, per crop × market series:

```
log(price) = level + seasonal(month) + residual
forecast(h) = level + φ^h · trend + seasonal(month + h)
```

- **Log scale** because price movements are proportional — a KES 10 move means something different at KES 40 than at KES 400.
- **Seasonal index per calendar month**, estimated as a robust average of detrended values across years, with per-crop shrinkage toward zero when a series is short. Grounded in the FEWS/GIEWS calendars, not invented (`06_FEATURE_ENGINEERING_SPEC.md`).
- **Damped trend** (`φ < 1`) because undamped linear extrapolation of agricultural prices is how a forecaster tells a farmer to hold a perishable crop for three weeks on the strength of noise. Damping is the mechanism by which the model admits it does not know.
- **Deflate by CPI** before fitting, using the KNBS food index (`02_KENYAN_DATASET_REVIEW.md` §2.7), so a 2010 price is comparable with a 2026 one; reinflate to present nominal terms for display.
- **Uncertainty from empirical residual quantiles** at each horizon, not from a Gaussian assumption. Food price residuals are fat-tailed and right-skewed; assuming normality would produce intervals that are too narrow exactly during the shocks that matter.

All of it is a few hundred lines of TypeScript with no dependencies, runs in microseconds, and — decisively — **decomposes into precisely the sentence the farmer needs**: *"prices usually rise into November as the short-rains harvest ends; this year's level is about 8% above the same point last year."* That sentence is the model's actual structure, not a story told about it.

### 4.4 The gate

The forecast **does not ship** unless it beats seasonal naïve out of sample.

- **Protocol:** rolling-origin backtest on WFP history, expanding window, horizons of 1, 2 and 3 months, evaluated per crop × market and pooled.
- **Metric:** MAE on log prices (equivalently, median absolute percentage error), plus a skill score against the baseline. Interval calibration checked separately — an 80% interval must contain the actual ~80% of the time.
- **Threshold:** ≥10% MAE improvement over seasonal naïve, pooled, *and* no crop-level cell materially worse. A model that wins on average by wrecking maize is not a model this platform ships.
- **If the gate fails:** ship seasonal naïve, labelled honestly as *"based on the usual pattern for this time of year"*. That is still a genuine and useful answer to "should I wait?", and it is more than the platform has today.

Committing to the possibility of shipping the baseline is what makes the gate real.

### 4.5 Where the forecast may and may not be shown

The forecast is derived from **market-level monthly** data. It therefore describes a *market-and-crop tendency*, not a specific farmer's likely price. Consequently:

- It may drive the direction and magnitude language, and the wait-versus-sell guidance.
- It may **not** be added to the nowcast to produce a "predicted price for your listing". Combining a local sparse estimate with a national monthly tendency into one number would produce a figure with no honest interpretation.
- Its horizon must never exceed what the crop's perishability makes actionable. A three-month outlook on kale is noise dressed as advice.

---

## 5. Two things that are not models

Named because they will otherwise be argued about as if they were.

**Expected selling speed** is not a price prediction. It is a survival-analysis question — how long until this listing sells, given price relative to market and current demand — and the platform does not yet have enough completed listings to fit anything. `09_RECOMMENDATION_ENGINE_SPEC.md` specifies it as a **transparent rule over observed sell-through**, clearly presented as a rough expectation, with the honest note that it becomes a real model once sell-through history accumulates. Presenting a fitted curve over ~130 points would be false precision.

**The explanation layer uses no LLM.** `insight.ts` is deterministic today and stays that way. An LLM cannot be permitted to author a claim about a price — it will produce fluent sentences unmoored from the computation, which is the specific failure mode constraint 4 exists to prevent. The existing `assistantPriceContext.ts` has the relationship the right way round: the LLM is *grounded in* engine figures for conversational answers; it never generates them.

---

## 6. Decision summary

| Component | Choice | Rationale |
|---|---|---|
| Nowcast | Weighted median + weighted IQR band (existing) | Correct estimator for sparse heterogeneous data; robust; explainable; already built and tested |
| Geo pooling | Fallback ladder (existing); partial pooling deferred | Explainability now, better calibration later |
| Forecast | Log-scale seasonal decomposition + damped trend | Matches the data's structure; decomposes into the explanation; trivial to run |
| Forecast baseline | Seasonal naïve | Ships if the model fails to beat it by 10% |
| Uncertainty | Empirical residual quantiles | Food prices are not Gaussian |
| Selling speed | Transparent rule, not a model | No sell-through history yet |
| Explanation | Deterministic templates | No LLM authors a price claim |
| Tree ensembles | Rejected now, path documented | Blocked by data, not runtime |
| Deep learning | Rejected | 230 points |

---

**Next:** `06_FEATURE_ENGINEERING_SPEC.md` — the inputs these estimators consume, and which of them do not exist yet.
