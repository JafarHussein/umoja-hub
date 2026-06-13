# UmojaHub — Application Figma Blueprint (v1.1)

**Jurisdiction:** authenticated app shell. This document reconciles the Figma blueprint with the live API and the design system (DOC-04). It records the corrected view specs and the Figma-variable → code mapping.

**Status:** v1.1 — corrections below are binding on any Figma work for the app shell.

---

## 0. Corrections applied

1. **VIEW-DET-01 (student developer log) redrawn** — 3 document editors + 2 structured-entry log tables, a 3/3 completion checklist, and three per-document hash strings (no compiled hash).
2. **Lecturer review workspace** — add 4 numeric score inputs + **4 mandatory ≥50-word comment fields** with live word counters; DENIED requires a reason; post-decision peer-score reveal panel.
3. **Variables table paths fixed** — models live at `src/lib/models/*.model.ts`; the nav is `src/components/shared/Sidebar.tsx`.
4. **`DataGrid.tsx` and `TableComponents.tsx` are net-new** (do not exist yet) — mark them as to-be-built, not as existing references.

---

## 1. VIEW-DET-01 — Student Developer Log Workbench (corrected)

Layout (top → bottom):

1. **Header** — engagement title, status chip, the 3/3 completion checklist.
2. **Three document editors** — each a labelled rich-text/markdown area with auto-save draft state and an individual **hash string** shown after finalize. Backed by `/api/education/engagements/[id]/documents`.
3. **Two structured-entry log tables:**
   - **Blocker log** — rows of `{ description, status }` → `/api/education/engagements/[id]/blockers`.
   - **AI-usage log** — rows of `{ tool, purpose, prompt-summary }` → `/api/education/engagements/[id]/ai-usage`.
4. **Finalize bar** — "Finalize & Hash for Review", **disabled until all 3 documents exist**; on finalize, render the three hash strings; "Submit for Review" → `/submit`.

Do **not** draw five free-text areas or a single combined hash.

## 2. Lecturer Review Workspace

- Left: anonymized engagement content (the 3 documents + 2 logs, read-only).
- Right: rubric — **4 numeric inputs (1–5)** + **4 comment fields, each with a live word counter enforcing ≥50 words**.
- Decision: APPROVE / DENY; DENY reveals a required reason field.
- **Peer-score reveal panel** is hidden until the lecturer's decision is recorded (server-enforced, FIX-08), then shows peer scores with provenance text.

## 3. Figma-variable → code mapping (corrected paths)

| Figma variable group | Code source | Notes |
| --- | --- | --- |
| Roles / statuses / enums | `src/types/index.ts` | `Role`, `OnboardingStage`, `OrderFulfillmentStatus`, `VerificationStatus`, `FarmerTrustTier`, … |
| Data shapes | `src/lib/models/*.model.ts` | one model per file; **not** a flat `models.ts` |
| Color / type / radius tokens | `tailwind.config.ts` | see DOC-04 |
| Navigation | `src/components/shared/Sidebar.tsx` | existing |
| Page chrome | `src/components/shared/{Header,LayoutWrapper}.tsx` | existing |
| Onboarding chrome | `src/app/onboarding/_components/OnboardingShell.tsx` | existing |

## 4. Component build flags

| Component | Status |
| --- | --- |
| `Input`, `Textarea`, `Button` | existing (`src/components/ui/`) |
| `Sidebar`, `Header`, `LayoutWrapper` | existing (`src/components/shared/`) |
| **`DataGrid.tsx`** | **net-new** — admin queue tables (payouts, mediation, verification) |
| **`TableComponents.tsx`** | **net-new** — shared table primitives (header, row, cell, empty/loading states) |

Net-new components must be built from DOC-04 tokens (dark surfaces, hairline borders, the t1–t6 scale) — not generic gray/white tables.
