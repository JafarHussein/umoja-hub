# 07 — Data Pipeline Design

**Status:** Draft for approval · **Date:** 2026-07-29 · **Depends on:** `03`, `04`, `06`

The pipeline's job is narrow: turn heterogeneous external publications into observations the engine can weight, and **refuse anything it cannot vouch for**. Every design choice below follows from one premise — a bad row that reaches a farmer is far more costly than a good row that was rejected. The engine already reports low confidence honestly when evidence is thin (`01_RESEARCH_REPORT.md` §6), so rejection is cheap; a wrong price is not.

---

## 1. The source adapter contract

The boundary that makes KAMIS's manual-to-automated switch a one-file change (`03` §2.3).

```ts
export interface RawObservation {
  /** Verbatim, as published. No normalisation whatsoever. */
  cropRaw: string;
  marketRaw: string;
  countyRaw: string | null;
  unitRaw: string;
  priceType: 'WHOLESALE' | 'RETAIL' | 'FARMGATE';
  price: number;
  currency: string;
  observedAt: Date;
  gradeRaw?: string;
  classificationRaw?: string;
  supplyVolume?: number;
}

export interface SourceAdapter {
  readonly id: PriceSourceId;              // 'kamis' | 'wfp' | 'fews' | 'ncpb'
  readonly tier: 'A' | 'B';
  readonly expectedCadenceDays: number;
  readonly staleAfterDays: number;
  readonly requiresApproval: boolean;      // KAMIS: true until permission lands
  fetch(range: DateRange): Promise<RawObservation[]>;
}
```

Two rules make the boundary real:

- **Adapters never normalise.** They emit verbatim strings. If an adapter maps "Dry Maize (White Maize)" to `maize`, the mapping is invisible to validation and unreviewable in the admin UI. Normalisation belongs in one place so it can be audited in one place.
- **Adapters never write to the database.** They return values. This is what lets the manual-upload path and the HTTP path share every downstream stage — the file upload parses to the same `RawObservation[]` a live fetch would produce.

---

## 2. Stages

```
fetch ─▶ normalize ─▶ validate ─▶ dedupe ─▶ gate ─▶ store
             │            │                    │
             └── unresolved  └── rejections     └── awaiting approval
                        (all recorded on the IngestionRun)
```

### 2.1 Normalize

| Field | Resolution | On failure |
|---|---|---|
| Crop | `sourceAliases[sourceId]` exact match, then `resolveCrop` | **Unresolved** — recorded, not guessed |
| County | `resolveCounty` (spelling-tolerant) | Try market→county map; else unresolved |
| Market | Source's own market registry | Retained verbatim; not fatal |
| Unit | `resolveUnit` + the source's declared basis | **Fatal** — see §2.2 |
| Price type | Adapter-declared | Fatal if absent |
| Currency | Must be KES | Fatal — no FX conversion in this pipeline |

Unresolved crops and counties are **not** dropped silently. They accumulate on the run record and surface in the admin UI as *"12 rows used a crop name we don't recognise: 'Sorghum (White)', …"*, which is how the alias table gets populated from reality rather than from guesswork (`06` §4.3).

### 2.2 Validate

Rejection rules, in order. Each rejection is stored with its reason so the admin view can show *why*.

| # | Rule | Rationale |
|---|---|---|
| V1 | Price > 0 and finite | |
| V2 | Unit basis declared and resolvable | **Non-negotiable.** `02` §4.7: an unconfirmed unit basis is disqualifying. This is defect D1 arriving from a new direction. |
| V3 | `observedAt` within `[source start, now + 1 day]` | Rejects future dates and epoch defaults |
| V4 | Price inside the crop/unit plausibility envelope | Catches order-of-magnitude keying errors — the failure mode `02` §2.1 warns about |
| V5 | Not a duplicate of an existing observation | §2.3 |
| V6 | Crop resolved | Unmapped vocabulary must be reviewed, never fuzzy-matched |
| V7 | Deviation from the trailing median for that market/crop/unit within threshold | Spike detection — **flags for review, does not auto-reject** |

**On V4.** The envelope is a wide per-crop, per-unit band (roughly an order of magnitude around historical central tendency), maintained as a constant and widened whenever a legitimate rejection occurs. It exists to catch KES 4,000/kg tomatoes, not to enforce a view about prices. **It must never be tightened to the point where it rejects a genuine market shock** — the shocks are exactly when farmers most need the data, and a validator that suppresses them is worse than useless. V7 handles the ambiguous middle by flagging rather than rejecting.

**On V7's asymmetry.** Auto-rejecting spikes would make the system blind to real events; auto-accepting them propagates typos. Flagging routes the judgement to a human, which is the correct disposition for a case that is genuinely ambiguous.

### 2.3 Dedupe and idempotency

Natural key:

```
(sourceId, marketRaw, cropId, unit, priceType, observedAt[day])
```

A unique compound index enforces it at the database, so a re-run of the same import is a no-op rather than a doubling. This matters more than it looks: the manual import path invites an administrator to upload the same export twice, and `weekly-jobs` retries on failure. **An ingestion pipeline that is not idempotent silently doubles the weight of whatever it re-imports** — which, in a weighted median, quietly shifts the recommendation.

Re-imported rows with a *changed price* for the same key are treated as corrections: the observation is updated and the prior value retained on the run record.

### 2.4 The promotion gate

| Adapter | `requiresApproval` | Behaviour |
|---|---|---|
| WFP, FEWS | `false` | Valid rows promote automatically; flagged rows queue for review |
| KAMIS, NCPB | `true` | **Nothing enters the store until an administrator approves the run** |

This is where `03` §2.2's legal posture becomes code rather than intention.

---

## 3. Collections

### 3.1 `MarketPriceObservation`

```ts
{
  sourceId, sourceUrl, licence,          // provenance — required, never null
  cropId, cropRaw,                       // canonical + verbatim, both kept
  county, marketRaw,
  unit, priceType,
  pricePerUnit, currency: 'KES',
  supplyVolume?, gradeRaw?,
  observedAt, ingestedAt, ingestionRunId,
  status: 'ACTIVE' | 'SUPERSEDED' | 'FLAGGED' | 'REJECTED',
}
```

Indexes: `{cropId, unit, county, observedAt}` (the engine's read), `{sourceId, observedAt}` (health), and the unique natural key of §2.3.

**Both the canonical and verbatim values are stored.** When an alias mapping turns out to be wrong six months later, the verbatim column is what makes the error correctable instead of merely regrettable.

**Provenance is required.** No observation without `sourceId` and `licence`. This is what makes the "where did this number come from?" requirement in `01` §8 answerable at all, and it must be a schema-level requirement, not a convention.

### 3.2 `PriceIngestionRun`

One document per run: source, trigger (`CRON` | `ADMIN` | `SCRIPT`), actor, window, timings, counts (fetched / normalized / accepted / rejected / flagged / duplicate), rejection reasons grouped by rule, unresolved vocabulary lists, status, and the approving admin where applicable.

This *is* the update history the brief asks administrators to see (`11_ADMINISTRATOR_TOOLS.md`), and it is also the source-health record: the newest `ACTIVE` observation per source, compared against `staleAfterDays`, drives the staleness behaviour in `03` §3.3.

### 3.3 Retention

Atlas M0 is 512 MB and the pipeline is unbounded by default. Policy:

- **Daily-resolution observations:** retained 24 months, then rolled up to monthly median/min/max/count per market·crop·unit·priceType.
- **Monthly observations (WFP, FEWS):** retained in full — they are the forecasting backbone and are small.
- **Rejected rows:** retained 90 days as diagnostics, then dropped; the aggregate counts survive on the run record permanently.

Rollup runs as another `weekly-jobs` sub-task. Retention is specified now, before the first import, because storage policy retrofitted onto a full free-tier database is an outage rather than a chore.

---

## 4. Anomaly detection

Distinct from validation: validation asks *"is this row plausible?"*; anomaly detection asks *"has something changed?"* It runs after promotion, weekly, and never blocks ingestion.

| Detector | Signal | Action |
|---|---|---|
| **Source silence** | No new observations past `staleAfterDays` | Source marked stale; excluded from statistics; admin alert |
| **Volume shift** | Row count deviates sharply from the trailing run average | Flag run — usually a source redesign, not a market event |
| **Cross-source divergence** | KAMIS vs FEWS for the same market-month diverge beyond threshold | Flag for review. This is Tier B's entire purpose. |
| **National sanity** | Platform national weighted average vs FAO GIEWS | Monitoring signal only |
| **Vocabulary drift** | New unmapped crop strings appear | Queue for alias mapping |
| **Distribution shift** | Per-crop median moves beyond an expected band | Flag — may be a genuine shock; a human decides |

Every one of these is *informational*. None of them changes a farmer-facing number automatically. A detector that silently suppressed data would be a worse failure than the anomaly it caught, because it would be invisible.

---

## 5. Backfill

Historical loading runs **off-platform** — `scripts/prices/backfill.ts` on a developer machine, writing to Atlas directly, because the FEWS Kenya extract exceeded 10 MB with no working row limit **[LIVE]** and Vercel Hobby with an M0 behind it is the wrong place for that.

Same normalize/validate/dedupe stages — the script differs only in trigger and transport. Run once per source, reviewed before promotion, `PriceIngestionRun` recorded with `trigger: 'SCRIPT'` so the history is complete regardless of where the work happened.

---

## 6. Reading path

Feature assembly (`04` §1) queries both collections and merges them into the `EnginePoint[]` the pure core already consumes:

| | `PriceHistory` | `MarketPriceObservation` |
|---|---|---|
| Meaning | What happened on UmojaHub | What a market published |
| `source` weight | 1.0 sale / 0.6 listing | 0.7 (existing `EXTERNAL_INGESTION` constant) |
| Trust weight | Farmer's tier | **Neutral (1.0)** — a market has no trust tier |
| Geo weight | County of the farmer | County of the market |
| Filters | Unit, crop, window | Unit, crop, window, `priceType: WHOLESALE`, `status: ACTIVE`, source not stale |

Two consequences worth stating:

- The pure `assembleRecommendation` is **unchanged** by external data. It receives more `EnginePoint`s from a wider provenance. That is the payoff of having kept the core pure, and it is why the existing tests remain valid.
- **The 0.7 external weight is provisional.** It was set before any external data existed. Once the backtest harness runs (`12_TESTING_STRATEGY.md`), it should be calibrated against whether external observations actually predict realised platform sale prices better or worse than platform listings do — and revised on evidence rather than left as a guess that hardened into a constant.

---

**Next:** `08_UIUX_SPECIFICATION.md` — what a farmer actually sees.
