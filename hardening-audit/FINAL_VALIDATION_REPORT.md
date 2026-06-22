# UmojaHub — Final System Validation & Hardening Report

_Validation pass before project presentation. Live audit performed against the running
dev server (`npm run dev`) with a seeded database, authenticated as each role via forged
NextAuth session cookies (`scripts/dev-session.ts`). Gate after all changes: **type-check ✓,
lint 0 errors ✓, 719/719 tests ✓.**_

---

## 1. Role-by-role audit (live, in-browser)

Every page below returned **HTTP 200 with 0 console errors and no runtime/error overlays**.
Data-bearing pages were confirmed to render real seeded data.

| Role | Pages exercised | Result |
|---|---|---|
| **Admin** | dashboard, verification queue (+Review modal), supplier/lecturer verify, payouts, escrow, mediation, knowledge CMS, impact summary | ✅ render; queue lists 5 pending; **3 findings** (see §2) |
| **Farmer** | listings, orders, profile, assistant, ledger, prices | ✅ render; listings show 3 real products with KSh pricing/stock |
| **Buyer** | marketplace, orders, suppliers | ✅ render; orders show real order (ORD-2024-001), suppliers list |
| **Student** | home, portfolio, projects/new, peer-review, mentor, profile | ✅ render; correct empty states (this user has no active project) |
| **Lecturer** | home, review queue, profile | ✅ render; queue shows 2 real pending reviews with student names |

**Role model clarification (corrects the brief's "7 roles"):** the platform has **8** roles —
`FARMER, BUYER, STUDENT, LECTURER, ADMIN, NGO, EMPLOYER, INSTITUTION`. Only the first four
**self-register**; ADMIN is provisioned; **NGO/EMPLOYER/INSTITUTION are seed-only ecosystem
accounts** (they have dashboards but no public signup). **"Cooperative" is not a role** — a
cooperative is a `FarmerGroup` sponsored by an NGO. The 5 demonstrable login roles were all
audited above.

## 2. Bug report (found during the live audit)

| # | Severity | Finding | Status |
|---|---|---|---|
| B1 | Medium (visible) | Admin verification modal/table rendered the literal **"undefined"** as a farmer's surname when `lastName` was missing ("E2E Unverified Farmer undefined"). | ✅ **Fixed** — `fullName()` helper drops empty parts. |
| B2 | Medium (demo hygiene) | **E2E test-fixture users leak into the live admin verification queue** ("E2E Unverified Farmer", no county/crops/document). A lecturer demoing would see them. | ⚠️ Recommendation (§7) — seed/fixture hygiene, not a code defect. |
| B3 | High (workflow gap) | Seeded **pending farmers carry document metadata but no `documentImageUrl`**, so the admin verification queue has **no actual document to review**. The review UI is correct (shows a graceful "no document" state), but the demo can't show the evidence-review step. | ⚠️ Recommendation (§7) — seed should attach sample document images. |

No dead buttons, broken forms, permission leaks, runtime errors, or console errors were found
across the 5 audited roles.

## 3. File-upload investigation

**Root cause:** onboarding (`onboarding/verification-upload`) and the farmer profile uploaded
files straight from the browser to Cloudinary using `NEXT_PUBLIC_CLOUDINARY_*` (an unsigned
preset). Those vars are inlined at build time and are silently `undefined` in any environment
that didn't bake them in (or a stale dev server), producing "Uploads are not configured /
Upload failed." A robust signed server route existed (`/api/upload/sign`) but was **dead code**.
Live testing proved the Cloudinary account itself works (images and PDFs both upload HTTP 200).

**Fix (implemented):**
- New **`POST /api/upload`** — server route that uploads via the `env.ts`-validated
  `CLOUDINARY_*` credentials (Basic auth, proven HTTP 200), auth-gated to all upload roles
  including BUYER (which the old sign route omitted). No reliance on `NEXT_PUBLIC_*`.
- `cloudinaryService` now accepts **PDF** (buyer tax certificates, lecturer credential letters).
- Onboarding + profile uploads rewired to `/api/upload`.

**Admin document viewer (ISSUE 1, second half):** the farmer verification detail modal now
presents the document as evidence — **inline image preview that opens full resolution on click
(zoom)**, a **PDF open/download card**, an explicit **Download** (Cloudinary `fl_attachment`),
and the **upload timestamp**, alongside the existing farmer info + Approve/Reject.

## 4. AI assistant investigation

**Root cause:** both AI services pinned `llama3-8b-8192`, which **Groq has decommissioned**.
Verified live against the Groq API with the real key: `llama3-8b-8192` → **HTTP 400
`model_decommissioned`**; the call always failed `res.ok` and returned the canned fallback —
the entire "fake AI" symptom. The API key is valid.

**Fix (implemented & live-verified):**
- Both services → **`llama-3.3-70b-versatile`** (HTTP 200; a quality upgrade).
- **Platform knowledge injected** (`src/lib/ai/platformKnowledge.ts`) into both prompts so they
  answer UmojaHub mechanics (escrow, Trust Score, verification, project reviews) using
  **code-accurate facts** (Trust Score 40/25/20/15, tiers at 40/60/80, escrow lifecycle, etc.),
  with instructions to defer to support on anything not covered.
- **Live in-browser proof:** as a farmer, asked "How does escrow work and what is my Trust
  Score?" → real, accurate answer (not the fallback), correctly deferring on the user-specific
  score ("check it on your profile").

## 5. Email notification matrix

Built on the existing **Nodemailer/SMTP** infra via the central `notify()` hub (in-app + email),
with a branded template (context → details → next step → role-aware CTA). No-op in tests / when
SMTP is unset.

| Role | Events emailed |
|---|---|
| Farmer | welcome+docs-under-review · verification approved/rejected · order paid (escrow held) · escrow released · payout approved/rejected · order escalated to mediation · dispute resolved |
| Buyer | welcome+cert-under-review · **verification approved/rejected (newly added)** · payment confirmed · mediation request received · dispute resolved |
| Student | welcome (account verified) · project submitted · new peer review assigned · review completed |
| Lecturer | welcome+credentials-under-review · **verification approved (newly added)** |
| Admin | new verification request · new dispute filed (`notifyAdmins` fan-out) |

Intentionally in-app only: portfolio views (anti-spam). Lower-priority gaps in §7.

## 6. Workflow completion matrix

| Workflow | Beginning → Middle → End | Status |
|---|---|---|
| Farmer verification | upload docs → admin reviews → approve/reject → SMS+email+in-app | ✅ complete (demo needs doc images, B3) |
| Order + escrow | place & pay (M-Pesa) → funds held → confirm dispatch → buyer confirms → released → payout settled | ✅ complete, fully notified |
| Dispute / mediation | buyer opens → admins alerted → admin resolves → refund/release → both parties notified | ✅ complete |
| Education | brief → in-progress → submit → peer review → lecturer review → verified/revision/denied | ✅ complete, notified |
| Buyer/lecturer verification | submit → admin decides → notified | ✅ complete (email parity added) |

## 7. Remaining issues / recommendations (not blocking, documented)

1. **B3 — seed document images:** attach sample `documentImageUrl`s to pending farmers so the
   verification-review step shows real evidence in a demo.
2. **B2 — fixture hygiene:** remove E2E fixture users from the demo DB (or exclude from the seed).
3. **Listing images:** `CreateListingForm` still uses a manual "paste a Cloudinary URL" box —
   one-line change to point at `/api/upload` for a real file picker.
4. **"Request resubmission"** as a distinct admin action needs a new `VerificationStatus` +
   re-upload flow; today *reject-with-reason* already emails the farmer to resubmit.
5. **Lecturer "new item in queue" nudge:** lecturers pull from a queue rather than being
   push-assigned, so there's no single event to email on; add one when a project transitions to
   `UNDER_LECTURER_REVIEW` if a nudge is wanted.
6. **NGO/Employer/Institution** have dashboards but no signup flow; confirm whether public
   onboarding for them is in scope for the pilot.

## 8. Presentation readiness

A lecturer can assume FARMER, BUYER, STUDENT, LECTURER, or ADMIN and move through every
supported workflow without hitting a runtime error, dead button, broken form, or fake AI. The
AI assistants now respond intelligently and understand the platform. Lifecycle events are
communicated by in-app notification + email (and SMS where it already existed). The one visible
blemish (B1, "undefined" surname) is fixed. The two remaining demo risks (B2/B3) are **data
seeding** matters, not application defects, and are quick to resolve before the presentation.

## 9. Fixed-issues summary

- AI: decommissioned model → `llama-3.3-70b-versatile` (both assistants).
- AI: injected code-accurate platform knowledge (escrow / Trust Score / verification / reviews).
- Upload: server-side `/api/upload` (env-safe), PDF support; onboarding + profile rewired.
- Admin: inline document viewer (preview, zoom, download, timestamp).
- Email: lifecycle emails across all 5 roles + admin alerts; buyer/lecturer verification parity.
- UI: "undefined" surname display bug.
- (Earlier this session) project-paper figures + reliable PDF export.

## 10. Final confidence score

**8.5 / 10 — presentation-ready for the five demonstrable roles.**
Application layer is clean (0 console errors across the audit, full test suite green, every core
workflow has a beginning/middle/end with real user-facing communication). The 1.5-point
deduction is entirely **demo data seeding** (B2 fixtures, B3 missing document images) — fix
those two seed items and this is a confident 9.5.
