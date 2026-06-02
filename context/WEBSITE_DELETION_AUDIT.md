# WEBSITE DELETION AUDIT
**Status:** Awaiting approval before any file is removed.
**Date:** 2026-06-02
**Scope:** Every website-related artifact currently in the repository, classified by disposition.

No file has been deleted. This document is the inventory. Deletion executes only after this audit is reviewed and approved.

---

## LEGEND

- **KEEP** — Retains full value under a blank-slate strategy. Stays in place. No action.
- **ARCHIVE** — Contains research, analysis, or platform knowledge that remains useful as reference. Not a design decision — a knowledge record. Move to `context/archive/` or treat as read-only.
- **DELETE** — Implementation or design artifact for the old website. No residual value once the new direction is established. Git history preserves it if recovery is ever needed.

The default answer for anything website-specific is **DELETE**. Work is not preserved because effort was invested. It is preserved only if a future engineer would benefit from reading it regardless of how the website is redesigned.

---

## PART 1 — CONTEXT DOCUMENTS

| File | Disposition | Reason |
|------|-------------|--------|
| `context/WEBSITE_EXPERIENCE_ARCHITECTURE_V1.md` | **DELETE** | Superseded by V2. V2 itself is now reset. No reference value beyond git history. |
| `context/WEBSITE_EXPERIENCE_ARCHITECTURE_V2.md` | **ARCHIVE** | The Gemini audit methodology, criticism-to-root-cause analysis, and first-principles sections contain platform insight independent of design decisions. The sprint plan, component specs, and GSAP sequences are deleted in spirit. |
| `context/WEBSITE_INFORMATION_ARCHITECTURE.md` | **ARCHIVE** | Eleven complete audience definitions with full lifecycle documentation, FAQ content, platform truth statements, and content review criteria. This is platform knowledge, not website design. A future website will need to understand these audiences regardless of how it is built. |
| `context/WEBSITE_REBUILD_MASTER_PLAN.md` | **DELETE** | Sprint plan for the old website. The website being rebuilt makes this irrelevant. |
| `context/WEBSITE_DESIGN_SYSTEM.md` | **DELETE** | Old design system specification (pre-V2). Superseded and now reset. |
| `context/WEBSITE_VISUAL_SYSTEM_V2.md` | **DELETE** | V2 visual design specification. Entire visual direction is reset. |
| `context/FRONTEND.md` | **DELETE** | V2 design system governing document. ws-* tokens, motion system, typography decisions — all reset. |
| `context/REDESIGN_ROADMAP.md` | **DELETE** | Sprint roadmap for the V2 redesign. Website direction is reset; roadmap is void. |
| `context/SYSTEM_DIAGRAM_MASTER_PLAN.md` | **DELETE** | Diagram plan for the old website's visual system. No residual value. |
| `context/SPRINT_1_GAP_ANALYSIS.md` | **ARCHIVE** | Documents what was missing from V1. The gaps identified (trust depth, limitation disclosures, administrator accountability) remain valid platform requirements even in a reset. |
| `context/SPRINT_2_UNDERSTANDING_FIRST_PLAN.md` | **ARCHIVE** | Planning document that articulates the "understanding-first" philosophy. Useful reference for how to think about content depth on the new website. |
| `context/TRANSPARENCY_CONTENT_ARCHITECTURE.md` | **ARCHIVE** | Detailed content plan for the transparency page — what data to show, what methodology to disclose, what to omit. Content requirements remain valid regardless of design. |
| `context/USER_JOURNEY_LIBRARY.md` | **ARCHIVE** | User journey research documenting the mental states of farmers, students, buyers, employers at each stage of platform contact. Platform-level knowledge, not website-specific design. |
| `context/STATUS_QUO_ANALYSIS.md` | **ARCHIVE** | Analysis of pre-platform market conditions and the problems UmojaHub addresses. Foundational platform knowledge. |
| `context/IA_GAP_REPORT.md` | **ARCHIVE** | Gap report identifying what information the website was failing to provide to each audience. The gaps identified remain real; only the implementation direction is reset. |
| `context/WEBSITE_WEBAPP_BOUNDARY.md` | **KEEP** | The boundary principles (website educates, app executes; classification law; enforcement checklist) remain valid under any website design. This document governs the division of responsibility, not the presentation. |
| `context/ARCHITECTURE_AUDIT.md` | **DELETE** | Incomplete audit begun during the previous phase. Now superseded by the reset. |
| `context/FOOD_HUB_ECOSYSTEM_MAP.md` | **KEEP** | Platform-level knowledge about the Food Security Hub ecosystem (actors, information flows, incentives, failure modes). Not website design — platform understanding. |
| `context/EDUCATION_HUB_ECOSYSTEM_MAP.md` | **KEEP** | Platform-level knowledge about the Education Hub ecosystem. Same reasoning. |
| `context/PRODUCTION_ROADMAP.md` | **KEEP** | Backend/infrastructure readiness roadmap targeting first 100 users. Not website design. |
| `context/RUNBOOK.md` | **KEEP** | Operational runbook for engineers handling production incidents. Not website design. |

---

## PART 2 — PAGE ROUTES

### Pages inside `src/app/(website)/` — the website route group

| File | Disposition | Reason |
|------|-------------|--------|
| `src/app/(website)/layout.tsx` | **DELETE** | Website layout shell providing WebsiteNav, WebsiteFooter, `body.is-hydrated` gate, and IntersectionObserver. The layout itself must be rebuilt from a new foundation. |
| `src/app/(website)/page.tsx` | **DELETE** | Homepage built under the V2 design direction. Entire design and content strategy is reset. |
| `src/app/(website)/about/page.tsx` | **DELETE** | Rebuilt in Sprint 5. Design direction reset. |
| `src/app/(website)/education/page.tsx` | **DELETE** | Education Hub overview page built under V2 direction. |
| `src/app/(website)/for/farmers/page.tsx` | **DELETE** | Farmer audience gateway. |
| `src/app/(website)/for/buyers/page.tsx` | **DELETE** | Buyer audience gateway. |
| `src/app/(website)/for/suppliers/page.tsx` | **DELETE** | Supplier audience gateway. |
| `src/app/(website)/for/cooperatives/page.tsx` | **DELETE** | Cooperative audience gateway. |
| `src/app/(website)/for/students/page.tsx` | **DELETE** | Student audience gateway. |
| `src/app/(website)/for/lecturers/page.tsx` | **DELETE** | Lecturer audience gateway. |
| `src/app/(website)/for/employers/page.tsx` | **DELETE** | Employer audience gateway. |
| `src/app/(website)/for/institutions/page.tsx` | **DELETE** | Institution audience gateway. |
| `src/app/(website)/for/ngos/page.tsx` | **DELETE** | NGO & Government gateway. Rebuilt in Sprint 5. |
| `src/app/(website)/how-it-works/page.tsx` | **DELETE** | How It Works page. |
| `src/app/(website)/team/page.tsx` | **DELETE** | Verification Team page. Built in Sprint 5. |
| `src/app/(website)/transparency/page.tsx` | **DELETE** | Transparency Hub. Rebuilt in Sprint 5. |
| `src/app/(website)/trust/page.tsx` | **DELETE** | Trust & Verification page. |

### Homeless pages outside both route groups

| File | Disposition | Reason |
|------|-------------|--------|
| `src/app/marketplace/page.tsx` | **KEEP** | Public marketplace browse is a platform feature, not website design. Anonymous visitors browsing produce is a core platform function. The page requires visual reconciliation with the new website but its existence and function are not reset. |
| `src/app/marketplace/[listingId]/page.tsx` | **KEEP** (with violation note) | Listing detail is a platform feature. The `CheckoutForm` embedded on this page is an unresolved boundary violation (financial transaction on a public page). The page is kept; the violation is a pending fix. |
| `src/app/knowledge/page.tsx` | **KEEP** | Public knowledge hub is a platform feature. Read-only public educational content. |
| `src/app/knowledge/KnowledgeHubClient.tsx` | **KEEP** | Client-side category filter, moves with its page. |
| `src/app/knowledge/[slug]/page.tsx` | **KEEP** | Individual knowledge article. Read-only public content. |

---

## PART 3 — WEBSITE COMPONENTS

### `src/components/website/`

Every component in this directory was built for the V2 design direction. With the website reset to zero, the design system they implement is void. They are deleted. The underlying problem they solved (how do you render a trust score narrative, a section anchor, a governance layout) will be reconsidered from scratch when the new website is designed.

| File | Disposition | Reason |
|------|-------------|--------|
| `WebsiteNav.tsx` | **DELETE** | Nav built for V2 visual direction. New website needs new nav. |
| `WebsiteFooter.tsx` | **DELETE** | Footer built for V2 visual direction. |
| `GovernancePage.tsx` | **DELETE** | Reusable layout shell for V2 governance pages. |
| `SectionAnchor.tsx` | **DELETE** | Three-tier in-page nav (desktop sidebar / tablet tabs / mobile select) for V2 long-form pages. |
| `LimitationPanel.tsx` | **DELETE** | Amber disclosure panel for capability claims. The pattern (limitation disclosure) is kept as a principle in the new purpose document. The component is reset. |
| `AdminProfile.tsx` | **DELETE** | Named administrator display component. |
| `CentralStructuralDiagram.tsx` | **DELETE** | SVG architecture diagram built for V2 homepage. |
| `TrustScoreNarrative.tsx` | **DELETE** | GSAP-animated score breakdown built for V2. |
| `DataPanel.tsx` | **DELETE** | Statistics display panel. |
| `LivePlatformStats.tsx` | **DELETE** | Live metric counters. |
| `PlatformStatusWidget.tsx` | **DELETE** | Service status grid. |
| `StatusLabel.tsx` | **DELETE** | Inline status indicator. |
| `HubCard.tsx` | **DELETE** | Hub entry card for V2 homepage. |
| `WorkflowStep.tsx` | **DELETE** | Numbered step display. |
| `FaqAccordion.tsx` | **DELETE** | FAQ section wrapper. |
| `FaqItem.tsx` | **DELETE** | Individual accordion FAQ item. |
| `TrustScoreDisplay.tsx` (website version) | **DELETE** | Website-specific trust score display using ws-* tokens. |
| `AudienceNavigator.tsx` | **DELETE** | Dead V1 component. Was already scheduled for deletion. |
| `AudiencePage.tsx` | **DELETE** | Dead V1 component. |
| `EcosystemMap.tsx` | **DELETE** | Dead V1 component. |
| `EduHubPage.tsx` | **DELETE** | Dead V1 component. |
| `EducationFlowSection.tsx` | **DELETE** | Dead V1 component. |
| `FoodHubPage.tsx` | **DELETE** | Dead V1 component. |
| `HeroPlatformStatement.tsx` | **DELETE** | Dead V1 component. |
| `MarketplaceFlowSection.tsx` | **DELETE** | Dead V1 component. |
| `ProcessFlow.tsx` | **DELETE** | Dead V1 component using deprecated tokens. |
| `TrustArchitectureSection.tsx` | **DELETE** | Dead V1 component. |
| `TrustChainDiagram.tsx` | **DELETE** | Dead V1 component. |

---

## PART 4 — MOTION AND ANIMATION INFRASTRUCTURE

| File | Disposition | Reason |
|------|-------------|--------|
| `src/lib/motion.ts` | **DELETE** | Contains `trustScoreAnimation()`, `diagramActivation()`, `mPesaSequence()` — all written for specific V2 website components that are being deleted. When a new website is designed, animation sequences (if any) are re-derived from first principles. |
| `src/lib/gsap.ts` | **KEEP** | GSAP registration utility (`gsap.registerPlugin(ScrollTrigger)`). Contains no website-specific logic. May be useful in future contexts (including web app). |

---

## PART 5 — STYLING INFRASTRUCTURE

| File / Section | Disposition | Reason |
|----------------|-------------|--------|
| `tailwind.config.ts` — ws-* token extensions | **DELETE** | All `ws-surface-*`, `ws-hub-*`, `ws-text-*`, `ws-status-*`, `ws-border-*` custom tokens, the `display` font family (Plus Jakarta Sans), and all `ws-*` font-size extensions are website design system artifacts. They are removed when the `(website)` route group is deleted. App tokens and non-website config stay. |
| `src/styles/globals.css` — animate-on-scroll system | **DELETE** | The `.animate-on-scroll`, `body.is-hydrated`, `.in-view`, and `prefers-reduced-motion` override CSS block was written for the V2 website's progressive animation architecture. The pattern can be reconsidered when the new website is designed. App-facing CSS remains. |
| `src/styles/globals.css` — base styles | **KEEP** | Base resets, font loading, and non-website CSS that the dashboard and auth pages depend on. |

---

## SUMMARY COUNTS

| Disposition | Count |
|-------------|-------|
| KEEP | 11 items |
| ARCHIVE | 9 items |
| DELETE | 43 items |

**What remains after execution:**
- The entire web application (`src/app/dashboard/`, API routes, models, auth)
- The marketplace and knowledge pages (platform features, not website design)
- Platform-level context documents (ecosystem maps, runbook, production roadmap)
- The boundary principles (`WEBSITE_WEBAPP_BOUNDARY.md`)
- The research archive (audience knowledge, IA gap analysis, user journeys)
- All UI primitives in `src/components/ui/`
- All foodhub, education, and shared components
- GSAP registration utility (`src/lib/gsap.ts`)

**What disappears:**
- The entire `(website)` route group (16 pages + layout)
- All 27 website components
- V2 design system (ws-* tokens, globals CSS animation block, motion.ts)
- 7 context documents (website design, architecture V1/V2, redesign roadmap, visual systems)
