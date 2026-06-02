# Website Design Pipeline
**Status:** Phase 0 — Strategy complete, Phase 1 ready to begin
**Authority:** This document governs the full design pipeline. Nothing enters implementation until Phase 4 prototype is approved.
**Relationship to other docs:** Depends on WEBSITE_PURPOSE_V1.md, WEBSITE_WEBAPP_BOUNDARY.md, FOOD_HUB_ECOSYSTEM_MAP.md, EDUCATION_HUB_ECOSYSTEM_MAP.md. Content for each phase is derived from WEBSITE_IA_V3.md.

**Tool assignments:**
- Phases 1–2: Figma (wireframes, information architecture validation, mid-fidelity structure)
- Phases 3–4: Claude Design (high-fidelity visual design, interactive prototype, handoff bundle)
- Implementation: Claude Code (fed Claude Design's handoff bundle + Routines for bulk pages)

---

## THE RULE

Code is not the design environment.
Design tools are the design environment.
Code exists only to faithfully implement what has already been designed and approved.

This rule is not a suggestion. It applies to every element: colors, layouts, diagrams, animations, illustrations, icons, typography, spacing, interactive states. If it has not been designed and approved, it does not exist in code.

**Which design tool, and when:**
- Phases 1–2 use Figma. Figma is best for proving information architecture, validating narrative flow, and locking structural decisions. It has no AI generation that could shortcut the thinking. That is the point.
- Phases 3–4 use Claude Design. Once structural decisions are locked, Claude Design generates high-fidelity visuals and interactive prototypes from the Phase 2 decisions fed as inputs. It exports a handoff bundle directly to Claude Code.

Claude Design is not used in Phases 1–2 because generation shortcuts the thinking that those phases exist to force. An AI that produces beautiful visuals before the information architecture is validated produces beautiful wrong things.

---

## PHASE 0 — STRATEGY
**Status:** Complete
**Inputs:** Platform truth, audience research, ecosystem maps, boundary principles
**Outputs:** Purpose documents, audience definitions, trust architecture, IA, content architecture, diagram inventory, asset inventory

### Deliverables

| Document | Location | Status |
|----------|----------|--------|
| Website Purpose & Principles | `context/WEBSITE_PURPOSE_V1.md` | ✅ Complete |
| Website / Web App Boundary | `context/WEBSITE_WEBAPP_BOUNDARY.md` | ✅ Complete |
| Food Security Hub Ecosystem Map | `context/FOOD_HUB_ECOSYSTEM_MAP.md` | ✅ Complete |
| Education Hub Ecosystem Map | `context/EDUCATION_HUB_ECOSYSTEM_MAP.md` | ✅ Complete |
| Storytelling Framework | `context/STORYTELLING_FRAMEWORK.md` | ✅ Complete |
| Website Information Architecture | `context/WEBSITE_IA_V3.md` | ✅ Complete |
| Diagram Inventory | `context/DIAGRAM_INVENTORY.md` | ✅ Complete |
| Asset Inventory | `context/ASSET_INVENTORY.md` | ✅ Complete |

### Phase 0 Exit Criteria
Before Phase 1 begins, confirm:
- [ ] Every page has a defined content architecture in WEBSITE_IA_V3.md
- [ ] Every diagram is inventoried with purpose and complexity level
- [ ] Storytelling framework approved (question-answer-question chain is coherent)
- [ ] Asset inventory reviewed — no category missing
- [ ] No implementation work has started

---

## PHASE 1 — LOW FIDELITY FIGMA
**Status:** Ready to begin
**Inputs:** WEBSITE_IA_V3.md (content architecture), STORYTELLING_FRAMEWORK.md (narrative arc)
**Constraint:** Black and white only. No colors, no branding, no illustrations, no gradients, no images.
**Goal:** Prove the experience works before aesthetics exist.

### What Phase 1 Figma Contains

Every page from WEBSITE_IA_V3.md represented as:
- Block-level information hierarchy (which content is primary, secondary, tertiary)
- Section sequence (what order do sections appear on the page)
- Navigation structure (how does the nav work, what menus exist)
- Content relationships (what links where and why)
- Above-fold orientation (what does a visitor see in the first 15 seconds)
- Routing patterns (how does the site guide a visitor to deeper content)

### What Phase 1 Figma Does NOT Contain
- Colors of any kind (use only black, white, and grays for hierarchy)
- Brand typography (use system fonts: Arial, Georgia)
- Illustrations or icons
- Photographs or placeholder images
- Animation indicators
- Final copy (use real content categories but not polished prose)

### Pages to Wireframe (Priority Order)

**Priority 1 — Must wire before anything else:**
1. Homepage (`/`)
2. For Farmers (`/for/farmers`)
3. For Students (`/for/students`)
4. Trust & Verification (`/trust`)

**Priority 2 — Wire before Phase 2:**
5. For Buyers (`/for/buyers`)
6. For Employers (`/for/employers`)
7. Transparency (`/transparency`)
8. Team (`/team`)

**Priority 3 — Wire before Phase 2 completion:**
9. How It Works (`/how-it-works`)
10. About (`/about`)
11. For Lecturers (`/for/lecturers`)
12. For NGOs & Government (`/for/ngos`)
13. For Cooperatives (`/for/cooperatives`)
14. Education Hub Overview (`/education`)

**Priority 4 — Wire before Phase 3:**
15. Public Marketplace (`/marketplace`)
16. Marketplace Listing Detail (`/marketplace/[id]`)
17. Knowledge Hub (`/knowledge`)
18. Knowledge Article (`/knowledge/[slug]`)

### Phase 1 Success Criteria
A reviewer with no prior knowledge of UmojaHub should:
- Understand the platform's structure from the homepage alone
- Be able to navigate to the page relevant to their role
- Find answers to their core questions on the relevant audience page
- Be able to locate the verification methodology page
- Be able to reach the CTA at the end of each audience journey

Phase 1 is complete when a journey through the wireframes produces no confusion about platform purpose or navigation.

### Phase 1 Exit Criteria
- [ ] All 18 pages wireframed
- [ ] Homepage narrative arc validated (complete question-answer chain)
- [ ] Navigation flows annotated (what clicking each element does)
- [ ] At least one complete user journey traced through the wireframes per primary audience
- [ ] Review session completed with critical reader
- [ ] No section exists without a content reason documented in WEBSITE_IA_V3.md

---

## PHASE 2 — MID FIDELITY FIGMA
**Status:** Blocked on Phase 1
**Goal:** Prove the communication works.

### What Phase 2 Adds
- Spacing systems (8px base grid or equivalent)
- Typography hierarchy (heading levels, body sizes, caption sizes — no final fonts yet)
- Page layout grids (12-column, breakpoints)
- Content grouping visual logic (how related content is visually associated)
- Diagram placeholders (boxed areas with content descriptors for each diagram)
- Screenshot placement indicators (where product screenshots appear and what they show)
- Information density decisions (what is dense, what is spacious, and why)
- Navigation microinteractions documented (hover states, dropdown behavior)
- Above-fold content decisions locked

### Phase 2 Exit Criteria
- [ ] Every major content decision locked (what information appears at each content density level)
- [ ] All diagrams placed (even as placeholders) with content descriptions
- [ ] Typography scale defined (not font family — just size relationships and weight roles)
- [ ] Spacing system applied consistently across all pages
- [ ] Clickable prototype possible (basic navigation works through click targets)
- [ ] Content review completed — does every section earn its place?

---

## PHASE 3 — HIGH FIDELITY (CLAUDE DESIGN)
**Status:** Blocked on Phase 2
**Tool:** Claude Design (claude.ai — requires Pro/Max/Team/Enterprise subscription)
**Goal:** Create the final website experience visually. Every page, every breakpoint, every state.

### What Phase 3 Inputs into Claude Design

Claude Design requires a design system to work from. Before Phase 3 begins, prepare the following brief to feed into Claude Design as context:

1. **Phase 2 decisions** (exported from Figma):
   - Spacing system (base grid, scale)
   - Typography scale (size relationships and weight roles — not final typefaces yet)
   - Layout grids (column counts, breakpoints, margin/gutter values)
   - Content density decisions per section (what is spacious, what is dense)
   - All 18 page wireframes (Phase 2 mid-fidelity versions)

2. **Brand identity decisions** (resolved before Phase 3 begins):
   - Color system (primary palette, semantic colors, surface colors)
   - Final typeface selections (heading, body, mono)
   - Illustration style direction
   - Icon library style (line / filled / duotone)
   - Photography treatment (if photography is used)

3. **Diagram content** (from DIAGRAM_INVENTORY.md):
   - All 18 diagram descriptions, actors, and content requirements
   - Priority order for production (D03, D10, D04 first)

4. **Codebase context** (if any exists at Phase 3 time):
   - If the web app's design system is partially built, feed the codebase to Claude Design so it can extract tokens and components automatically

### What Phase 3 Produces in Claude Design

Using the brief above as input, iterate page by page:

- High-fidelity visual design for all 18 pages
- All responsive states (mobile / tablet / desktop) per page
- All interactive states (hover, focus, active, disabled, loading)
- All 18 diagrams in final visual language (designed directly in Claude Design canvas)
- All illustrations (generated or placed in Claude Design)
- Motion planning (annotated on canvas — Claude Design can prototype motion behaviors)
- Interaction planning (scroll behaviors, hover states, click feedback)
- Design tokens documented (exported from Claude Design for Tailwind config)

### Iteration Workflow in Claude Design

- Use **chat** for structural and aesthetic shifts across a page
- Use **inline comments** for targeted component-level adjustments
- Validate every generated page against `WEBSITE_IA_V3.md` — generation does not replace review
- Validate every diagram against `DIAGRAM_INVENTORY.md` — purpose, actors, and limitations must be present

### Phase 3 Success Criteria
A reviewer should be able to look at the Claude Design canvas and experience the final website — every page, every state, every diagram — without opening a browser. Claude Design's interactive prototype capability means this test is literal, not metaphorical.

### Phase 3 Exit Criteria
- [ ] All 18 pages in final high-fidelity state in Claude Design
- [ ] All responsive states (mobile / tablet / desktop)
- [ ] All interactive states (hover, focus, active, disabled, loading)
- [ ] Every diagram complete — not placeholder, not approximate
- [ ] Every illustration complete
- [ ] Motion annotated for all animated sequences
- [ ] Design tokens exported (color, spacing, type, border-radius, shadow)
- [ ] Accessibility review (color contrast, touch target sizes, reading order)
- [ ] Each page validated against WEBSITE_IA_V3.md — no section missing, no section added

---

## PHASE 4 — PROTOTYPE + HANDOFF (CLAUDE DESIGN)
**Status:** Blocked on Phase 3
**Tool:** Claude Design (interactive prototype mode) → Claude Design Handoff Bundle → Claude Code
**Goal:** A reviewer can experience the complete website without a browser. Once approved, a single instruction hands the design to Claude Code.

### What Phase 4 Does in Claude Design

Claude Design generates interactive prototypes natively — no separate prototyping step required. Phase 4 is:

1. **Wire up the prototype** — connect all 18 pages through navigation, CTAs, dropdowns, and audience journey flows inside Claude Design
2. **Add scroll and transition behaviors** — sticky nav, scroll-triggered reveals, page enter/exit states
3. **Build mobile prototype** — separate prototype flow for mobile breakpoints
4. **Review all 7 journeys** (see checklist below)
5. **Export handoff bundle** — when approved, use Claude Design's "Handoff to Claude Code" export

### Prototype Review Checklist

A reviewer completes the following journeys without confusion. If any journey produces confusion, the relevant page returns to Phase 3 for revision before re-review.

1. First-time visitor → Homepage → "What is UmojaHub?" answered → routing decision made
2. Farmer → Homepage → /for/farmers → all 10 questions answered → CTA reached
3. Student → Homepage → /for/students → all 10 questions answered → CTA reached
4. Employer → /for/employers (direct arrival) → verification chain understood → independently verifiable without registering
5. NGO analyst → /for/ngos → mandate alignment assessed → impact data found → contact pathway reached
6. Researcher → /transparency → methodology read → /team → named accountability and appeals process found
7. Skeptic → /trust → full methodology read → limitations prominent → /team → administrator credentials verifiable

### The Handoff Bundle

When the prototype is approved, Claude Design's export menu produces a handoff bundle containing:
- All page designs with annotated specs
- Design tokens (ready for Tailwind config extraction)
- Component inventory
- Asset export specifications
- Interactive states documented

This bundle is passed to Claude Code with a single instruction. Claude Code implements from the bundle rather than from developer interpretation of design intent.

### Phase 4 Exit Criteria
- [ ] All 7 prototype journeys completed without confusion
- [ ] Mobile prototype reviewed on an actual mobile device (not a desktop browser preview)
- [ ] Prototype approved by decision-maker
- [ ] Handoff bundle exported from Claude Design
- [ ] Handoff bundle reviewed — all pages present, all tokens exported, no missing states

---

## WHAT COMES AFTER PHASE 4

Only after Phase 4 approval does any implementation work begin.

### Implementation with Claude Code + Handoff Bundle

**Step 1 — Pass the handoff bundle to Claude Code**
Feed Claude Design's exported handoff bundle to Claude Code. Claude Code reads the bundle and begins implementation. No manual component spec writing. No developer interpretation of design intent.

**Step 2 — Design token extraction**
Extract colors, spacing, type scale, border-radius, and shadow values from the handoff bundle → Tailwind config. This is the only time ws-* tokens or equivalent are defined in the codebase — derived directly from the approved design, not invented.

**Step 3 — Component implementation**
Claude Code builds React components from the handoff bundle, page by page, starting with the homepage and Priority 1 audience pages.

**Step 4 — Bulk page generation with Claude Code Routines**
The 9 audience pages (/for/farmers, /for/students, /for/buyers, etc.) share structural patterns. Once one audience page is implemented and validated, Claude Code Routines generate the remaining 8 with the structural variations documented in WEBSITE_IA_V3.md. This replaces implementing each page from scratch.

**Step 5 — Asset preparation**
SVG diagrams optimized. Images compressed. Icon library extracted. All assets from ASSET_INVENTORY.md accounted for.

**Step 6 — Content entry**
Real copy from WEBSITE_IA_V3.md entered into pages. No placeholder text.

**Step 7 — Validation**
- Responsive testing (mobile device — not browser preview — especially for Kenyan mid-range Android context)
- Accessibility audit (color contrast, touch targets, reading order, alt text)
- Performance audit (above-fold speed on 4G in Kenya)
- Cross-browser testing

**Step 8 — Launch**

None of these steps happen before Phase 4 approval and handoff bundle export.

---

## FILE STRUCTURE

### Figma File (Phases 1–2)

```
UmojaHub Website — Wireframes & Structure
│
├── 📁 00 — Phase 0 Reference
│   ├── Platform Architecture Overview
│   ├── Audience Map
│   └── Content Architecture Summary (from WEBSITE_IA_V3.md)
│
├── 📁 01 — Phase 1 Wireframes (black & white only)
│   ├── Homepage
│   ├── Audience Pages (Farmers, Students, Buyers, Employers, etc.)
│   ├── Methodology Pages (Trust, Transparency, Team)
│   ├── About / How It Works / Education
│   ├── Marketplace / Knowledge
│   └── Navigation & Footer Patterns
│
└── 📁 02 — Phase 2 Mid Fidelity
    ├── Spacing System
    ├── Typography Scale
    ├── Layout Grids
    ├── All Pages (upgraded from Phase 1)
    └── Design System Decisions (exported as brief for Claude Design)
```

### Claude Design Project (Phases 3–4)

```
UmojaHub Website — High Fidelity & Prototype
│
├── Design System (generated from Phase 2 brief)
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Components
│   └── Icons
│
├── Pages — Desktop
│   ├── Homepage
│   ├── All Audience Pages (9)
│   ├── Methodology Pages (Trust, Transparency, Team)
│   ├── About / How It Works / Education
│   └── Marketplace / Knowledge
│
├── Pages — Tablet & Mobile
│   └── [same pages, responsive states]
│
├── Diagrams (all 18 from DIAGRAM_INVENTORY.md)
│
├── Illustrations & Assets
│
└── Interactive Prototype
    ├── Desktop Journey Flows (7 review journeys)
    └── Mobile Journey Flows
```

---

## DECISION LOG

| Date | Decision | Reason |
|------|----------|--------|
| 2026-06-02 | Website enters design-first pipeline | V1 and V2 implementations failed audits; design must precede implementation |
| 2026-06-02 | Phase 0 strategy documents complete | Purpose, boundaries, ecosystem maps all pre-exist from prior strategic work |
| 2026-06-02 | Phase 1 ready to begin | All strategy documents complete; Figma file can be opened |
| 2026-06-02 | Phases 3–4 assigned to Claude Design, not Figma | Claude Design (Anthropic, launched April 2026) generates high-fidelity visuals from a design system brief, produces interactive prototypes natively, and exports a handoff bundle directly to Claude Code — replacing manual high-fidelity Figma work and the implementation brief step. Phases 1–2 remain in Figma because generation cannot replace the thinking those phases require. |
| 2026-06-02 | Plus Jakarta Sans selected as primary typeface | Replaces Söhne. Free, open-source (OFL), commercial use permitted, self-hosting supported. No licensing delay before Phase 3. |
| 2026-06-02 | IBM Plex Mono for data/technical interfaces | Replaces Söhne Mono. Apache 2.0, IBM open-source. Pairs well with Plus Jakarta Sans. |
| 2026-06-02 | Team page: role-based administrator profiles | No personal names/credentials until operational hiring finalised. Four roles defined: Regional Administrator (Producer Verification), Regional Administrator (Marketplace Operations), Compliance Administrator (Trust & Appeals), Verification Officer (Onboarding). D17 diagram unblocked. |
| 2026-06-02 | About page contact emails confirmed | partnerships@umojahub.org · press@umojahub.org · hello@umojahub.org |
| 2026-06-02 | For Lecturers CTA route: /lecturers/apply | Dedicated application flow, not /register?role=lecturer. Requires credential review; separate route enables tracking and analytics. |
| 2026-06-02 | Marketplace: infinite scroll | Default browsing mode. Encourages discovery. Requirements: sticky filters, search, URL state preservation, back-to-top. Pagination reserved for admin dashboards, audit logs, financial records, verification queues. |
| 2026-06-02 | Phase 3 proceeding in Figma, not Claude Design | Claude Design is not available as an agent tool. Phase 3 high-fidelity work continues in the existing Figma file via use_figma. Pages named 03 / PageName. Brand identity v1.0 locked: Plus Jakarta Sans + IBM Plex Mono, cold-fintech palette, Aurora Copper / Glacial Teal / Lunar Violet accents. |
