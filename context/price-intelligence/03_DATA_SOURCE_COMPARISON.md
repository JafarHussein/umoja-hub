# 03 — Data Source Comparison

**Status:** Draft for approval · **Date:** 2026-07-29 · **Depends on:** `02_KENYAN_DATASET_REVIEW.md`

Document 02 described what exists. This one decides what the platform will actually depend on, on what legal footing, and how the data stays fresh. Three questions, in that order, because the legal answer can disqualify a source no matter how good its coverage is.

---

## 1. Tiering

Sources are placed in one of three tiers by the role they play, not by how good they are in the abstract. The distinction that matters is **does this source move a number a farmer sees?**

| Tier | Meaning | Sources |
|---|---|---|
| **A — Load-bearing** | Feeds observations that enter the recommendation statistic. A failure here degrades farmer-facing output. | KAMIS, WFP/HDX |
| **B — Corroboration & monitoring** | Never enters the headline number. Detects when Tier A has drifted, gone stale, or gone wrong. | FEWS NET, FAO GIEWS, NCPB |
| **C — Supporting & deferred** | Non-price reference data, or evaluated and not adopted now. | KNBS (deflator), geoBoundaries (adjacency), FEWS seasonal calendars, KilimoSTAT, KALRO, RATIN |

**Why only two sources in Tier A.** Every source admitted to Tier A must be validated, monitored, alias-mapped, unit-confirmed and covered by the anomaly detector. That is real recurring cost per source, and it is paid whether or not the source adds accuracy. KAMIS and WFP are complements covering the two axes nothing else does — KAMIS gives *today, this county, this market*; WFP gives *nineteen years of monthly history*. A third Tier A source would add corroboration, which is exactly what Tier B provides at a fraction of the cost.

**Why FEWS NET is Tier B despite being the best-engineered API in the review.** Its cadence is monthly, so it cannot answer "today", and WFP already occupies the monthly-history role with far deeper coverage. Its distinct value is being *independent* of both — a second opinion on the same market-month. That is a monitoring job, and Tier B is where monitoring jobs go. The classification is a judgement about role, and it should be revisited if KAMIS access is refused (§2.2), in which case FEWS is the natural promotion.

---

## 2. Legal and ethical posture

This section is the one most likely to be skimmed and is the one most likely to sink the programme. The engine is farmer-facing and the platform's whole proposition is trustworthiness; ingesting data on an unclear footing would be incoherent with that.

### 2.1 The governing principle

**Absence of a prohibition is not a grant of permission.** Document 02 records that KAMIS's `robots.txt` returns HTTP 404 and that no terms of use appear on the retrieved pages. Both facts are neutral. They mean the question is *unanswered*, not answered favourably, and the difference matters because a ministry's market data is a public good whose publisher has simply never been asked.

Two further principles follow:

- **Derived statistics, not redistribution.** UmojaHub shows a farmer *"the market here is paying around KES 118/kg"* with an attribution. It does not republish KAMIS as a downloadable dataset, does not proxy it, and does not offer it as an API. This is a materially weaker ask than redistribution and should be described as such in any permission request.
- **Attribution always.** Any figure derived from an external source carries a visible provenance line. This is required by `09_RECOMMENDATION_ENGINE_SPEC.md` for explanation reasons anyway; it is also the courtesy that keeps a permission relationship alive.

### 2.2 Per-source posture

| Source | Observed status | Posture | Blocking? |
|---|---|---|---|
| **KAMIS** | No licence, no terms, no `robots.txt` **[LIVE]** | Write to MoALD/KALRO (`datahub@kalro.org`) requesting permission for derived, attributed use. Until a reply: **admin-mediated import only** — a human uses the site's own `Export to Excel` and uploads the file. No automated crawler. | **Yes** for automated ingestion. **No** for manual import. |
| **WFP / HDX** | Automated fetch and CKAN API both returned **HTTP 403** **[LIVE]** | A 403 is an explicit signal, unlike KAMIS's silence, and gets treated as one. Read the resource licence string from the dataset metadata first; then use HDX's documented access route with a declared, identifying user agent. If neither works, manual download. **Never** rotate user agents or otherwise work around the block. | **Yes** until the licence string is read. |
| **FEWS NET** | Public, unauthenticated, no credentials required **[LIVE]** | Usable. Confirm published terms before promotion beyond monitoring. Rate-limit conservatively — the endpoint returns >10 MB for one country. | No |
| **KilimoSTAT** | **Expired TLS certificate** **[LIVE]** | Report to MoALD/KALRO in the same letter as the KAMIS request. Treat as unavailable. **Do not disable certificate verification** under any circumstance. | Unavailable |
| **NCPB** | HTTP 307 to automated fetch **[LIVE]**; PDF reports **[ATTESTED]** | Manual admin entry of the announced cereal price. Low volume, high value as a reference floor. | No |
| **FAO GIEWS** | Public dashboard + API **[ATTESTED]** | Usable under FAO terms; confirm before wiring. National aggregate only — monitoring signal, never a pricing input. | No |
| **KNBS** | Public statistical releases **[ATTESTED]** | Official statistics, ordinarily reusable with attribution. Confirm. Used only as a CPI deflator. | No |
| **geoBoundaries** | **ODbL** **[ATTESTED]** | Share-alike terms must be read before vendoring polygons. **Mitigation:** the polygons are needed *once*, offline, to derive an adjacency list. Review whether the derived adjacency constant is a "derivative database" under ODbL before committing it; if the answer is unclear, derive adjacency from an unambiguously-licensed source or assemble it manually — 47 counties is a tractable manual task. | Not blocking, but resolve before committing the constant. |

### 2.3 The scraping question, answered directly

The brief permits scrapers *"only if legally and ethically appropriate"*. The honest answer for KAMIS today is: **not yet**.

This is not squeamishness. It is that a scraper built against an HTML table with no licence has three independent failure modes — legal (permission never sought), technical (breaks on redesign, per §2.2 of document 02), and reputational (a farmer-trust platform caught scraping a ministry). The manual-import path costs an administrator a few minutes per week, unblocks everything immediately, and converts to an automated feed the day permission arrives with **no change to anything downstream of the adapter** (`07_DATA_PIPELINE_DESIGN.md` makes the adapter boundary carry exactly this).

If permission is granted, the automated KAMIS adapter is a small, well-understood piece of work. If it is refused, the design already functions without it.

---

## 3. Update strategy

### 3.1 The binding constraint

`vercel.json` declares two cron entries and Vercel Hobby permits two:

```json
{ "path": "/api/cron/price-alert-check", "schedule": "0 0 * * *" }
{ "path": "/api/cron/weekly-jobs",       "schedule": "0 3 * * 1" }
```

There is no third slot. `weekly-jobs` already exists as a consolidator for precisely this reason, so **ingestion becomes a sub-task of `weekly-jobs`**, not a new cron. Note also defect D6 from document 01: both entries were POST-only while Vercel invokes GET, so neither had ever run in production. That is fixed on this branch, but it means the weekly cadence is **unproven in deployment** and must be confirmed against Vercel logs before anything is built to depend on it.

### 3.2 The hybrid pipeline

Four ingestion paths, deliberately different in cadence and trust.

| Path | Trigger | Sources | Cadence | Review |
|---|---|---|---|---|
| **Bulk backfill** | `npm run` script, developer machine | WFP history, FEWS extract | Once, then rarely | Reviewed at import |
| **Scheduled refresh** | `weekly-jobs` sub-task | WFP (monthly file), FEWS (monitoring pull) | Weekly | Automatic, gated by validation |
| **Admin import** | Manual upload in the admin UI | KAMIS export, NCPB figures | Weekly or ad-hoc | **Human approval required** |
| **Manual correction** | Admin override | Any | Ad-hoc | Audit-logged |

Two design consequences are worth stating plainly.

**Bulk backfill runs off-platform.** The FEWS Kenya extract exceeded 10 MB with no working row limit **[LIVE]**; nineteen years of WFP monthly data is likewise not something to pull through a Vercel function on Hobby with an Atlas M0 behind it. Historical loading is a local script writing to Atlas directly, run by a developer, reviewed once. Only *incremental* refresh happens on the platform.

**The admin import path is not a fallback — it is the primary path for the most valuable source.** KAMIS is Tier A and, under §2.2, is human-mediated until permission arrives. The admin tooling in `11_ADMINISTRATOR_TOOLS.md` is therefore load-bearing from day one, not a phase-two nicety. This is the single most important scheduling consequence in this document.

### 3.3 Freshness, staleness and what happens when a source dies

Every source carries a declared expected cadence and a staleness threshold. When the newest observation from a source is older than its threshold, the source is marked stale and **its observations stop contributing to new recommendations** — they do not silently keep counting with decayed recency weight, because a source that has stopped publishing is a different failure from an old-but-still-published observation.

| Source | Expected cadence | Stale after | On staleness |
|---|---|---|---|
| KAMIS | Daily (imported weekly) | 21 days | Drop from statistic; raise admin alert; confidence falls naturally as external share drops |
| WFP | Monthly | 75 days | Drop from statistic; alert |
| FEWS | Monthly | 75 days | Monitoring only — disable divergence checks, alert |

**The engine must remain correct with zero external data.** This is not a graceful-degradation nicety; it is the state the platform is in today and will be in for the whole period before permissions land. External observations are *additive evidence*, and every path — statistic, confidence, explanation, buyer fairness — is specified to work when that evidence is absent, exactly as `composeRecommendation` already returns a null-price, zero-confidence result rather than throwing.

### 3.4 Cost check

Atlas M0 provides 512 MB. A rough order-of-magnitude estimate for the steady state: an observation document of a few hundred bytes, roughly 235 KAMIS markets **[ATTESTED]** × ~20 tracked commodities × weekly import, plus a one-time WFP backfill of monthly rows since 2006. This lands comfortably inside M0 for the pilot but is **not** unbounded — `07_DATA_PIPELINE_DESIGN.md` specifies a retention policy (full history at monthly resolution, daily resolution rolled up after a bounded window) rather than assuming the free tier absorbs indefinite growth. The estimate should be replaced with a measured figure after the first real import.

---

## 4. Decision summary

1. **Tier A = KAMIS + WFP.** Everything else corroborates, supports, or waits.
2. **No automated ingestion of KAMIS until MoALD/KALRO grants permission.** Manual admin import in the interim; the adapter boundary makes the switch a one-file change.
3. **Respect the WFP 403.** Read the licence string before anything else; never evade the block.
4. **Never disable TLS verification** for KilimoSTAT or anything else.
5. **No third cron.** Ingestion joins `weekly-jobs`; bulk history loads off-platform.
6. **The engine works with zero external data** at every stage, and says so honestly through its confidence score.

### Open items carried forward

| # | Item | Owner | Blocks |
|---|---|---|---|
| L1 | Permission letter to MoALD/KALRO covering KAMIS + KilimoSTAT certificate | Owner | Automated KAMIS ingestion |
| L2 | Read WFP/HDX resource licence string | Engineering | WFP ingestion |
| L3 | Confirm FEWS NET published terms | Engineering | FEWS promotion beyond monitoring |
| L4 | ODbL review for derived county adjacency | Owner | Committing the adjacency constant (D7) |
| L5 | Confirm `weekly-jobs` actually fires post-D6-fix | Engineering | Scheduled refresh path |

---

**Next:** `04_SYSTEM_ARCHITECTURE.md` — the layer boundaries these paths run through.
