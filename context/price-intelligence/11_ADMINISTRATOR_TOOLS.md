# 11 — Administrator Tools

**Status:** Draft for approval · **Date:** 2026-08-01 · **Depends on:** `03`, `07`, `09`

Documents `01`–`10` describe a system that reads data. This one describes how the data gets in, and how anyone answers for a number after it has been shown.

Both matter more than their position in the sequence suggests. `03` §2.2 concluded that KAMIS — the single most valuable source — is **admin-mediated until permission arrives**, which makes the import screen the primary ingestion path rather than a fallback. And `01` §8 set the standard that *an administrator should be able to answer "where did this number come from?" for any recommendation the platform has ever shown*. Neither is achievable with the tooling that exists today.

---

## 1. What already exists

Verified against source.

**`src/lib/intelligence/priceAnalytics.ts`** is a substantial read-only oversight layer, exposed at `GET /api/admin/price-analytics` (ADMIN-gated, `route.ts:19`) and rendered at `/dashboard/admin/price-analytics`, which is linked from `AdminShell.tsx:110`. Like the engine, it separates a pure `assemblePriceAnalytics` from an async `computePriceAnalytics` wrapper. It produces five projections: commodity overview (median, trend, 30-day change, volatility, point count), demand hotspots, regional price comparison, supply concentration, and market anomalies flagged at 3.5 MADs from the median.

**This is good work and this document does not replace it.** It answers *"what is the market doing?"* — a monitoring question — competently.

**`AdminAuditLog`** is an append-only record of admin actions (`adminId`, `action`, `targetId`, `targetType`, `details`, `createdAt`), indexed on `{adminId, createdAt}` and `{targetId}`, with `updatedAt` disabled at the schema level. The model comment states the rule plainly: *never delete or update rows; add new entries only.* Every tool specified below writes to it.

**What does not exist.** There is no ingestion of any kind. `MarketPriceObservation` and `PriceIngestionRun` (`07` §3.1–3.2) are specified but unbuilt — no model, no route, no screen. There is no CSV or spreadsheet parsing anywhere in the codebase; the only upload path is `src/app/api/upload/route.ts`, which posts images to Cloudinary and is open to all five roles. The only parsing dependency in `package.json` is Zod.

So the gap is total: **the primary ingestion path for the platform's most valuable data source is currently a screen that does not exist.**

---

## 2. The three questions admin tooling must answer

The existing analytics answers the first. The other two are unaddressed.

| Question | Audience | Status |
|---|---|---|
| What is the market doing? | Oversight, weekly | **Built** — `priceAnalytics.ts` |
| How do I get external data in, safely? | Operations, weekly | **Missing** — §3 |
| Where did *this* number come from? | Dispute handling, on demand | **Missing** — §4 |

These are genuinely different tools and should not be merged into one dashboard. The first is browsed; the second is a task with a beginning and an end; the third is a lookup performed under pressure while a farmer or buyer is waiting for an answer.

---

## 3. The import path

`03` §2.3 committed to manual import over scraping, and gave the reasoning: a scraper against an unlicensed HTML table has three independent failure modes — legal, technical, and reputational — while *"the manual-import path costs an administrator a few minutes per week, unblocks everything immediately, and converts to an automated feed the day permission arrives with no change to anything downstream of the adapter."*

The design consequence is that **the import screen is an adapter, not a special case.** It produces exactly what an automated adapter would produce, and the pipeline below it cannot tell the difference.

### 3.1 The flow

Five steps, and the fourth is the one that matters.

1. **Upload.** An administrator exports from KAMIS using the site's own `Export to Excel` and uploads the file. Source and observation date-range are selected explicitly rather than inferred — a mis-set date silently backdates an entire import.
2. **Parse and normalize.** The file is mapped through the source's adapter into candidate `MarketPriceObservation` rows: crops resolved via `resolveCrop`, units anchored, counties mapped from market names, `cropRaw`/`marketRaw` preserved verbatim per `07` §3.1.
3. **Validate.** Schema validation, plus the anomaly rules of `07` §4 and the natural-key duplicate check of `07` §2.3.
4. **Preview and confirm — mandatory.** Nothing is written before an administrator sees what will be written.
5. **Commit.** Accepted rows are inserted; a `PriceIngestionRun` records the outcome; an `AdminAuditLog` entry records who did it.

### 3.2 Why the preview step is non-negotiable

A weekly import writes thousands of rows that immediately move the numbers farmers price against. An import that silently accepts a column shift, a stale export, or a units change is worse than no import at all, because the resulting prices are wrong in a way that looks authoritative — the exact failure `01` §6 concluded the platform must never accept.

The preview must show, before any write:

- **Counts:** fetched, accepted, rejected, flagged, duplicate.
- **Rejections grouped by rule**, not as a flat list. Fifty rows failing one rule is a mapping bug; fifty rows failing fifty rules is a bad file.
- **Unresolved vocabulary** — crop names and market names the taxonomy could not map. This list is the single most useful output of the whole screen, because it is how `src/lib/taxonomy/crops.ts` learns. D2 existed because five crop lists drifted with nobody watching.
- **Impact:** for each affected crop/county/unit cell, the current median and the median this import would produce. **An administrator should be able to see that maize in Kirinyaga is about to move 40% before committing, not after.**

**Rejection is not failure.** A run that rejects 30% of its rows and says clearly why is working correctly. The counts belong on the run record permanently (`07` §3.2), because the trend in rejection rate is how a source's quality degradation becomes visible before it becomes a pricing error.

### 3.3 Guardrails

| Guardrail | Reason |
|---|---|
| **ADMIN only**, `requireRole(session, Role.ADMIN)` | Ingestion moves every price on the platform |
| **Declared source + licence required** | `07` §3.1 makes provenance a schema requirement; the screen cannot offer a path around it |
| **Idempotent on the natural key** | A double-click or a re-upload of the same export must not double-count. Re-imports supersede rather than duplicate (`SUPERSEDED`, not deletion) |
| **File size and row cap** | Atlas M0 is 512 MB (`03` §3.4) |
| **`AdminAuditLog` entry per commit** | Who imported what, when |
| **No partial commit on failure** | A half-written import is an unreproducible state |

### 3.4 Manual single-observation entry

NCPB announces a cereal price by press release and PDF (`03` §2.2). It is one number, published occasionally, and it matters as a reference floor. A bulk import screen is the wrong shape for it, so a single-observation form shares the same validation, the same provenance requirement and the same audit trail. The `sourceUrl` is required here too — a hand-entered number without a citation is a rumour with an admin's name on it.

---

## 4. Provenance: answering for a number

`01` §8 requires that an administrator can explain any recommendation the platform has ever shown. `08` §3 makes the same object the farmer's third disclosure tier — *"this is the tier that makes the whole feature defensible, and it is also what an administrator sees when answering a dispute."*

The engine already carries most of it. `PriceRecommendation.basis` returns `dataPointCount`, `completedSaleShare`, `geoScope` and `windowDays` today, and `09` §3.6 extends it with named sources, `externalShare` and `observationSpan`. The administrator view is that ledger, unredacted — the one audience that sees the evidence rather than a projection of it.

**The honest limit, stated plainly.** The engine is *reproducible*, not *replayed*: `assembleRecommendation` is pure (`04` §133), so the same points and the same clock produce the same output forever. But nothing stores the point set as it stood when a farmer saw a number three weeks ago, and the 10-minute cache means the number shown was computed at an unrecorded moment inside a window. An administrator can therefore answer **"what does this recommendation rest on, and what did the evidence look like over this period?"** — not **"reproduce byte-for-byte what this farmer saw on the 14th."**

Claiming the stronger property would require snapshotting every recommendation served, which is a write on every keystroke and is not affordable on M0. **Do not build it, and do not let the UI imply it.** The weaker claim is enough to resolve a dispute, because disputes are about whether a figure was reasonable and where it came from, not about millisecond reproduction.

What the view shows for a given crop · county · unit:

- The current recommendation with its full `basis` ledger.
- The contributing observations: value, source, date, geographic scope, computed weight, and — for external rows — `sourceUrl` and `cropRaw`/`marketRaw` as received.
- Which points were excluded and why: outside the window, wrong unit (D1), disputed, failed the crop match, or dropped for source staleness (`03` §3.3).
- The ingestion runs that supplied the external share, linking to §3's run records.

**Weights are shown to administrators.** `06` §3 forbids showing trust as a factor on the *farmer* surface, because a farmer must never read the platform as saying their reputation changed what they may charge. That rule protects a farmer from a misreading; it does not apply to the person investigating a complaint, who cannot adjudicate a weighted median without seeing the weights.

---

## 5. Source health

`03` §3.3 specifies that a source whose newest observation exceeds its staleness threshold stops contributing to new recommendations — *"a source that has stopped publishing is a different failure from an old-but-still-published observation."* That behaviour is invisible unless someone is told.

One panel, derived from `PriceIngestionRun` and the newest `ACTIVE` observation per source (`07` §3.2):

| Column | Purpose |
|---|---|
| Source · licence · posture | `03` §2.2 status, including the blocked ones |
| Newest observation · expected cadence · stale after | KAMIS 21 days; WFP/FEWS 75 |
| **Status** | `HEALTHY` / `DUE` / `STALE` / `BLOCKED` |
| Last run · outcome · rejection rate | The quality trend |
| Share of engine weight | What the platform actually loses if it dies |

**Staleness raises a notification, not just a badge.** The platform has a first-class notification layer (`notify()` / `notifyAdmins()`), and a weekly import that an administrator simply forgot is the most likely real failure mode of this whole design. `STALE` and a failed run both notify admins. This is the same reasoning that made D6 severe — the crons were POST-only while Vercel invoked GET, so they never ran in production and **nothing said so**.

`BLOCKED` is a first-class state, not an error. KilimoSTAT has an expired TLS certificate and WFP returns 403 (`03` §2.2); both are correctly non-functional, and the panel must show them as *known and awaiting a reply* rather than as something an administrator should try to fix by disabling certificate verification.

---

## 6. Scope discipline

Not in this document, deliberately:

- **No admin override of a recommendation.** An administrator who could hand-set a price would create a number with no evidence behind it, which defeats every guarantee in `09`. Corrections are made by fixing the *data* — flagging an observation, correcting an alias, superseding a run.
- **No editing or deleting observations.** `status` transitions (`ACTIVE` → `FLAGGED` / `SUPERSEDED` / `REJECTED`) only, so the record of what was believed stays intact.
- **No new admin analytics.** `priceAnalytics.ts` covers the monitoring question and is not reopened here.
- **No automated KAMIS adapter** until a reply arrives (`03` §2.2). The manual path is the design, not a stopgap.

---

## 7. Sequencing

`03` §3.2 records the scheduling consequence — *"the admin tooling in `11_ADMINISTRATOR_TOOLS.md` is therefore load-bearing from day one, not a phase-two nicety."* Concretely, the order is forced:

1. `MarketPriceObservation` + `PriceIngestionRun` models (`07` §3)
2. The import path (§3) — nothing external exists until this ships
3. Source health (§5) — worthless before there is a run to report
4. Provenance (§4) — most valuable once the external share is non-zero, though the platform-only ledger is useful immediately

Steps 1–2 gate every external-data claim in documents `03`, `06`, `07` and `09`. **Until they ship, the engine is platform-data-only** — which `03` §3.3 already requires it to remain correct under, and which it is today.

---

## 8. Defects and risks registered by this document

| # | Item | Note |
|---|---|---|
| **R1** | **The most valuable source has no ingestion path.** KAMIS is Tier A and admin-mediated; the screen that mediates it does not exist. Every external-data feature in `06`, `07` and `09` is blocked behind §3. | Risk, not a defect — the engine is correct without it |
| **R2** | **No provenance record for recommendations already shown.** The platform has been serving numbers since PR #39 and cannot fully reconstruct the evidence behind a past one. §4 bounds the honest claim rather than pretending otherwise. | Accepted limit; do not build snapshotting |
| **R3** | **Source staleness has no owner.** `03` §3.3 drops stale sources from the statistic silently. Without §5's notification, a forgotten weekly import degrades confidence with no signal — the D6 failure mode in a new place. | Fix with §5 |

---

**Next:** `12_TESTING_STRATEGY.md` — the final document: forecast accuracy against a seasonal-naïve baseline, recommendation coverage, and the share of displayed figures backed by a completed sale rather than an asking price.
