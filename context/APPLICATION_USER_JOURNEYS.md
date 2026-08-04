# UmojaHub — Application User Journeys (v1.1)

**Jurisdiction:** authenticated app shell. Companion to `context/APPLICATION_EXPERIENCE_ARCHITECTURE.md`.

**Status:** v1.1 — reconciled against the live API. Journeys below match the shipped routes and models.

---

## 0. Corrections applied

1. **Farmer handover window = 24 hours** (matches `farmerTrustCalculator` on-time rule), not the blueprint's longer window.
2. **Student developer journey = 3 hashed documents + 2 structured logs**, not five free-text areas. Hashing is **per-document (3 hashes)** — there is no single "compiled hash".
3. **Lecturer review journey includes 4 mandatory comment fields, each ≥50 words** (with live word counters).
4. **Buyer mediation has a 48-hour gate** — recorded as a new product rule (was unstated).

---

## 1. Farmer journey

1. **Onboard** (OAuth → role → identity → verification document). Account is usable immediately; verification is reviewed asynchronously (`onboarding COMPLETED ≠ verified`).
2. **List produce** — create/edit listings; pause/reactivate (`AVAILABLE`/`INACTIVE`, FIX-05).
3. **Fulfil orders** — when an order is `PAID` + not yet confirmed, a **"Confirm Carrier Handover"** prompt appears with a **24-hour countdown from `paidAt`**. Confirming within 24h counts as on-time toward the reliability score.
4. **Settle** — view the escrow ledger (`GET /api/farmers/ledger`), file a payout request (`POST /api/farmers/payout-requests`, one open at a time, ≤ available balance). Admin approves and marks paid manually.
5. **Cooperatives** — redeem an admin-minted group join token (`POST /api/groups/redeem-token`, verified farmers only) to join a `FarmerGroup`.

## 2. Buyer journey

1. **Onboard** (OAuth/Google → role → identity → KRA tax compliance certificate). Verification reviewed via the admin buyer-verification queue (BE-09).
2. **Browse & buy** — marketplace → listing detail → checkout (quantity lock + 90-second Daraja poll + explicit timeout path).
3. **Track order** through `AWAITING_PAYMENT → IN_FULFILLMENT → RECEIVED → COMPLETED`.
4. **Escalate** — if an order has sat `PAID` + `IN_FULFILLMENT` for **≥48 hours since `paidAt`**, the buyer may file mediation (`POST /api/orders/[orderId]/mediation`, one open per order). **Mediation never mutates the order state machine** and does not feed the trust score; it surfaces an `UNDER_MEDIATION` banner only.

## 3. Student journey

1. **Onboard** (OAuth/**GitHub only** → role STUDENT → identity → institutional-email pin). `githubUsername` is captured from the OAuth profile and is read-only.
2. **Developer log workbench** (per engagement): **3 hashed document editors** plus **2 structured-entry logs** — a blocker log and an AI-usage log (`/api/education/engagements/[id]/documents | blockers | ai-usage`). Drafts auto-save.
3. **Finalize** — "Finalize & Hash for Review" is gated on all 3 documents; finalization produces **three per-document hash strings** (no compiled hash). Submission (`/submit`) sends the engagement for lecturer review.
4. **Peer review** — anonymized split-pane rubric; preset criteria serialize to canonical comment strings; numeric 1–5 scores.
5. **Feedback** — the lecturer's written engineering review is returned to the student; a signed-off project increments their completed-project count.

## 4. Lecturer journey

1. **Onboard** (OAuth/Google → role LECTURER → identity: department + staff ID → faculty credential letter). Verified via the admin lecturer queue (`isVerified` flag).
2. **Review workspace** — for each engagement: **4 numeric score inputs + 4 mandatory comment fields, each ≥50 words** with live word counters. A DENIED decision additionally requires a reason.
3. **Peer-score reveal** — peer scores are withheld server-side until the lecturer's own decision is recorded (FIX-08); they then appear with provenance text. The `/trust` independence claim is server-enforced.

## 5. Admin journey

Admin is OAuth + email allowlist only (`ADMIN_EMAIL_ALLOWLIST`, Google). Queues: farmer/lecturer/buyer/supplier verification, payout requests, mediation tracking, group-token mint console, Knowledge CMS, brief contexts, impact summary. The entire admin surface is hidden from non-admins (hard 404).
