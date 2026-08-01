# 02 — Kenyan Dataset Review

**Status:** Draft for approval · **Date:** 2026-07-29 · **Research window:** 2026-07-29

---

## 0. Method, and how to read the confidence markers

The brief's instruction was *"do not hallucinate."* Dataset descriptions are exactly where a plausible-sounding invention does the most damage, because a wrong column name or an assumed licence survives review and only fails months later during ingestion. Every claim below therefore carries one of three markers:

| Marker | Meaning |
|---|---|
| **[LIVE]** | Retrieved from the source during this research window. The behaviour described is what the endpoint actually did. |
| **[ATTESTED]** | Established from secondary sources (search results, press, documentation pages) but the primary artefact was not opened. Directionally reliable, not exact. |
| **[UNVERIFIED]** | Stated because it matters and is unknown. Must be resolved before the source is depended upon. |

No field list, row count, date range or licence is asserted from memory. Where a figure is not marked **[LIVE]**, treat it as a hypothesis to confirm at ingest time.

Two failures are themselves findings and are recorded rather than smoothed over: KilimoSTAT's TLS certificate has expired, and FEWS NET returns more than 10 MB for a single country with no working row limit.

---

## 1. Summary

Ranked by usefulness to the specific problem — recommending a price for one crop, in one county, today.

| # | Source | Cadence | Geography | Depth | Licence | Verdict |
|---|---|---|---|---|---|---|
| 1 | **KAMIS** (MoALD) | Daily | County + market | [UNVERIFIED] | **None published** | Best resolution by a distance. Admin-reviewed import. |
| 2 | **WFP Food Prices** (HDX) | Monthly | Market | 2006 → | HDX/WFP [UNVERIFIED exact] | The training and backtest backbone. |
| 3 | **FEWS NET FDW** | Monthly | Market | [UNVERIFIED] | Public API | Corroboration and gap-fill. Streaming required. |
| 4 | **KilimoSTAT** (MoALD) | Monthly | [UNVERIFIED] | [UNVERIFIED] | "Open Data Platform" | Official JSON API — but currently unreachable. |
| 5 | **RATIN / EAGC** | Daily | Regional | [UNVERIFIED] | Membership | Grains only. Evaluate later. |
| 6 | **FAO GIEWS FPMA** | Monthly | National | Long | FAO terms | Sanity check on aggregates. |
| 7 | **KNBS** | Monthly | National / urban | Long | Official statistics | Macro deflator, not crop pricing. |
| 8 | **NCPB** | Weekly [ATTESTED] | Market centres | [UNVERIFIED] | [UNVERIFIED] | Cereals reference; PDF, needs manual review. |
| 9 | **KALRO KADP** | [UNVERIFIED] | [UNVERIFIED] | [UNVERIFIED] | [UNVERIFIED] | Platform exists; price content unconfirmed. |
| 10 | **Kenya Open Data Portal** | — | — | — | — | **Superseded.** Do not build on it. |

---

## 2. Source dossiers

### 2.1 KAMIS — Kenya Agricultural Market Information System

`kamis.kilimo.go.ke` · Ministry of Agriculture and Livestock Development

**[LIVE]** The market page was retrieved and is current — rows carried the date **2026-07-29**, the day of this research. Table columns, verbatim: `Commodity`, `Classification`, `Grade`, `Sex`, `Market`, `Wholesale`, `Retail`, `Supply Volume`, `County`, `Date`. A sample row: *Dry Maize (White Maize)* at *Taveta* retail market, wholesale `30.00/Kg`, retail `40.00/Kg`, supply volume `2000`, dated `2026-07-29`.

**[LIVE]** The search form accepts County, Market, Product, Start Date, End Date, and a per-page selector offering up to 3,000 rows. An `Export to Excel` link exists at `/site/market_search?&export=excel`.

**[LIVE]** `robots.txt` returns **HTTP 404** — no crawl directives are published, permissive or restrictive.

**[LIVE]** No terms of use, licence, or API documentation appears on the pages retrieved (`/site/market`, `/site/market_search`, `/index.php/site/about`).

**[ATTESTED]** The about page states the system captures *"more than 150 products with the capture of output market data (quantities) and wholesale, retail, and farm-gate prices"* across *"five markets in each of the fourty seven counties"* — implying roughly 235 markets nationally.

**Assessment.** On coverage this is close to ideal for the problem. County *and* market resolution, daily cadence, wholesale *and* retail (the spread between them is the middleman margin a farmer loses, which the platform exists to expose), grade, and supply volume — a genuine supply signal the platform has no other way to obtain. The column set maps almost one-to-one onto what the engine needs.

**Risks.** Three, in order of seriousness. (1) **No published licence or terms** — the decisive constraint, addressed in `03_DATA_SOURCE_COMPARISON.md`. (2) **No API**; ingestion means parsing HTML or the Excel export, which is brittle against redesign. (3) Data quality is [UNVERIFIED] — enumerator-collected market data typically carries gaps, occasional order-of-magnitude keying errors, and inconsistent commodity naming. Assume all three and validate at ingest.

**Not yet known.** Historical depth via the date filter; whether farm-gate prices appear in the export or only wholesale/retail; missing-value density; commodity vocabulary stability; rate limiting.

---

### 2.2 WFP Food Prices for Kenya — Humanitarian Data Exchange

`data.humdata.org/dataset/wfp-food-prices-for-kenya`

**[LIVE]** A direct automated fetch returned **HTTP 403**, as did the CKAN `package_show` API. Ingestion will need a declared user agent or a manual download step. This is a real operational finding, not a transient error.

**[ATTESTED]** Monthly observations spanning **2006-01-15 → 2025-03-15** at the time of checking, refreshed monthly, published as CSV at market level. Part of the WFP global price database covering 98 countries and roughly 3,000 markets.

**Assessment.** This is the **training and backtest backbone**. Nineteen years of monthly history is the only asset in this review that can support seasonal decomposition, a rolling-origin backtest, and an honest answer to "will prices rise?". Its monthly cadence makes it useless for "what should I charge today" — that is KAMIS's job. The two are complements, not alternatives.

**Not yet known.** The exact licence string (HDX hosts several; **do not assume CC-BY** — read the resource metadata), the column schema, row count, which Kenyan markets are covered, and missing-value density per commodity.

---

### 2.3 FEWS NET Data Warehouse

`fdw.fews.net/api/marketpricefacts.csv?country_code=KE`

**[LIVE]** The endpoint is live, public and unauthenticated. A fetch with `&limit=5` **exceeded 10 MB** — the limit parameter was ignored and the full Kenyan extract was returned.

That single observation is worth more than a paragraph of documentation: the API works without credentials, the Kenyan dataset is substantial, and **naive whole-response ingestion is not viable**. The pipeline must stream, or page by a parameter that actually works, or ingest asynchronously outside a request. On Vercel Hobby with Atlas M0 this materially shapes the design.

**[ATTESTED]** Formats include CSV, JSON and XML; `country=Kenya` works as an alternative to `country_code`; the warehouse holds market prices, trade flows, exchange rates and agricultural statistics, with roughly 21 million data points across all countries.

**Assessment.** Best-documented public API in this review and the natural corroboration layer — a second independent estimate for the same market-month, useful for detecting when KAMIS has drifted or gone stale. Also the fallback if KAMIS access is ever withdrawn.

**Not yet known.** Column schema, working pagination parameters, Kenyan market list, update cadence, and the rate limit.

---

### 2.4 KilimoSTAT

`statistics.kilimo.go.ke/en/kilimostat-api/download_prices/` · MoALD

**[LIVE]** An automated fetch failed outright: **the TLS certificate has expired.**

This matters beyond inconvenience. It is the ministry's own designated open-data platform, and an expired certificate means any correctly-configured client refuses the connection. Working around it by disabling certificate verification would be unacceptable — it would strip transport authentication from a pipeline that feeds farmer-facing prices. The correct response is to report it to MoALD/KALRO and treat the source as unavailable until fixed.

**[ATTESTED]** Described as a JSON data endpoint for market prices with monthly update frequency, maintained by MoALD, with support at `datahub@kalro.org`. A parallel `download_crops` endpoint exists.

**Assessment.** On paper this is the *right* source — official, explicitly open, machine-readable, same ministry as KAMIS. If the certificate is fixed it should probably displace HTML scraping of KAMIS for anything it covers. Worth raising directly; the fix is trivial for them and unblocks a clean legal path.

---

### 2.5 RATIN / Eastern Africa Grain Council

`ratin.net` · `eagc.org`

**[ATTESTED]** Daily wholesale prices for staple grains across Kenya, Uganda, Tanzania, Rwanda and Burundi. Market prices are captured each morning between **06:00 and 09:00**; cross-border trade volumes are submitted between 19:00 and 23:00. An SMS interface exists (shortcode `8000` in Kenya) returning maize prices per bag by town.

**Assessment.** Genuinely daily and regional, and cross-border flow data is something no other source here offers — relevant to "what are neighbouring counties charging" at the national border. But it is **grains only**, which excludes most of what UmojaHub farmers list (tomatoes, kale, potatoes), and access appears membership-oriented rather than open. Defer.

---

### 2.6 FAO GIEWS / FPMA

`fao.org/giews/food-prices` · `fpma.fao.org`

**[ATTESTED]** Domestic and international monthly price series with a public dashboard and a documented API (a community Python client exists). Long historical coverage; country briefs carry narrative context on harvests and shocks.

**Assessment.** Aggregated to national level, so it cannot drive a county recommendation. Its value is as an independent sanity check — if UmojaHub's national weighted average for maize diverges sharply from FAO's, something is wrong upstream. Cheap to add, low volume, worth wiring as a monitoring signal rather than a pricing input.

---

### 2.7 KNBS — Kenya National Bureau of Statistics

`knbs.or.ke` · `kenya.opendataforafrica.org`

**[ATTESTED]** Publishes Consumer Price Indices monthly, including the Food and Non-Alcoholic Beverages basket, with releases current to at least April 2026. The Kenya Data Portal offers bulk export to TXT, CSV, XLS, MDB and DBF plus an OLAP analysis module.

**Assessment.** The brief named KNBS, so it is worth being clear about the mismatch: **CPI is a retail consumer index, not a farm-gate or wholesale price.** It measures what a shopper in Nairobi pays, after every margin in the chain. It cannot answer what a farmer in Kirinyaga should charge. It has one genuine use — deflating long nominal price series so a 2010 maize price is comparable with a 2026 one, which matters for the forecaster in `05_MODEL_SELECTION_REPORT.md`. Adopt for that purpose only.

---

### 2.8 NCPB — National Cereals and Produce Board

`ncpb.co.ke/reports/`

**[LIVE]** The reports page returned **HTTP 307** to an automated fetch; content was not retrieved.

**[ATTESTED]** A reports section exists carrying weekly market produce price reports and maize prices across Kenyan market centres. NCPB publishes its own purchase price per **90 kg bag** — the figure at the centre of the unit ambiguity documented in `01_RESEARCH_REPORT.md` §6.

**Assessment.** Authoritative for cereals and a useful floor reference: NCPB's announced buying price is a real, publicly-known alternative a farmer can compare against, which makes it good explanation material ("the board is offering X; the market here is paying Y"). Almost certainly PDF, so it is a manual or admin-mediated input, not an automated feed.

---

### 2.9 KALRO — Kenya Agricultural Data Sharing Platform

`datahub.kalro.org` · `kadp.kalro.org`

**[ATTESTED]** A data-sharing platform built on FarmStack, plus the Kenya Agricultural Observatory Platform (KAOP) launched with the Kenya Meteorological Department, described as offering market intelligence and 16-day weather forecasts.

**Assessment.** Institutionally the most promising relationship in this review — KALRO also hosts the KilimoSTAT support address. Whether the platform actually carries market price data usable here is **[UNVERIFIED]** and likely needs an account. Worth pursuing as part of the same outreach that raises the KilimoSTAT certificate. The KAOP weather integration is also the natural path for the future weather feature the brief asks the architecture to accommodate.

---

### 2.10 Negative findings

Recorded because a documented dead end saves the next person the search.

- **Kenya Open Data Portal (`opendata.go.ke`)** — **[ATTESTED]** the repository is no longer available; archived datasets were moved to HDX. The most recent substantive coverage dates to 2017. The brief named it; it should not be built on.
- **Wakulima Market** — no independent data portal exists. It appears in this codebase only as an attribution comment on the hard-coded `MIDDLEMAN_BENCHMARKS` map (`priceDataService.ts:92`) and as prose in the assistant prompt. Nairobi's wholesale markets are covered by KAMIS's county-level collection, which is the route to that data.
- **County market reports** — no evidence of a systematic, machine-readable, county-published price series. Counties feed KAMIS; KAMIS is the aggregation point.
- **World Bank microdata, "Kenya — Monthly food price estimates by product and market"** (catalog 6167) — **[ATTESTED]** exists. These are *modelled estimates*, not observations. Potentially useful for gap-filling thin market-months, but must never be presented to a farmer as an observed price. Flag distinctly if adopted.

---

## 3. Supporting datasets (not prices)

**County boundaries and adjacency.** **[ATTESTED]** geoBoundaries (via HDX) and the `Mondieki/kenya-counties-subcounties` repository provide county polygons and sub-counties; geoBoundaries is **ODbL**, whose share-alike terms must be reviewed before vendoring. **No pre-computed adjacency list was found** — the neighbour graph must be derived from polygons once and committed as a static constant. This is what unblocks D7 and the "neighbouring counties" question.

**Seasonality.** **[ATTESTED]** FEWS NET publishes Kenyan seasonal calendars and FAO/GIEWS country briefs carry harvest timing. Confirmed: bimodal rainfall, **long rains March–May accounting for roughly 80% of annual food production**, short rains October–November; maize harvest October–December in the highlands and around July in short-season areas. The current `seasonality.ts` calendar is hand-authored and carries no citations; it should be rebuilt against these sources with a per-crop reference.

---

## 4. What must be resolved before ingestion

Ordered by how much depends on the answer.

1. **KAMIS licence and permission.** No terms are published. A formal request to MoALD/KALRO (`datahub@kalro.org`) is the cleanest route and would also cover KilimoSTAT.
2. **KilimoSTAT TLS certificate.** Blocks the one officially-open machine-readable ministry source. Report it.
3. **WFP/HDX exact licence string**, read from resource metadata — not assumed.
4. **FEWS NET pagination.** A parameter that actually limits rows, or a streaming strategy. The 10 MB result makes this load-bearing.
5. **Commodity vocabulary** for KAMIS, WFP and FEWS. Each source's crop names must be mapped into `CROP_REGISTRY.sourceAliases`, which is deliberately unpopulated until the vocabularies have been inspected rather than guessed.
6. **Market → county mapping** for WFP and FEWS, which identify markets but may not carry a county column the way KAMIS does.
7. **Unit basis per source.** KAMIS appears to publish per-Kg; WFP and FEWS units are unconfirmed. Given §6 of the research report, an unconfirmed unit basis is disqualifying until resolved.

---

**Next:** `03_DATA_SOURCE_COMPARISON.md` — tiering, the legal posture, and the update strategy.
