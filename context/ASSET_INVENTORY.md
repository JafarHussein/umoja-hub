# Asset Inventory
**Status:** Phase 0 — Complete before any Phase 3 design begins
**Authority:** Every visual asset that will appear on the website must have an entry here. No asset is produced until it is listed. No asset enters implementation without first existing in Figma.
**Rule:** Assets are designed in Figma, exported for implementation. Not the reverse.

---

## CATEGORY 1 — DIAGRAMS

All 18 diagrams from DIAGRAM_INVENTORY.md.

**Production format:** SVG (vector, scalable, lightweight)
**Notes:** Diagrams with text must have text embedded as outlines OR use a web-safe fallback for text layers to prevent font loading issues. Dark mode variants required for all diagrams if the site supports dark mode.

| ID | Name | Phase 3 Priority |
|----|------|-----------------|
| D01 | Platform Overview | Priority 5 |
| D02 | Trust Architecture (detailed) | Priority 12 |
| D03 | Farmer Verification Flow | Priority 1 |
| D04 | M-Pesa Payment Flow | Priority 3 |
| D05 | Trust Score Anatomy | Priority 4 |
| D06 | Trust Score Over Time | Priority 13 |
| D07 | Ecosystem Map: Food Security | Priority 10 |
| D08 | Cooperative Group Flow | Priority 14 |
| D09 | Price Intelligence Flow | Priority 15 |
| D10 | Evidence Chain | Priority 2 |
| D11 | Three Documents | Priority 9 |
| D12 | Review Process Flow | Priority 6 |
| D13 | Rubric Visualization | Priority 16 |
| D14 | Portfolio Entry Anatomy | Priority 7 |
| D15 | Trust Transfer Chain | Priority 8 |
| D16 | Ecosystem Map: Education | Priority 11 |
| D17 | Administrator Decision Accountability | Priority 17 |
| D18 | Appeals Process Flow | Priority 18 |

---

## CATEGORY 2 — ILLUSTRATIONS

Illustrations are created in Phase 3 as part of the visual identity definition. No illustrations exist yet. This inventory describes what will be needed.

**Production format:** SVG preferred. Complex scenes: optimized SVG or WebP.
**Style decision:** To be made in Phase 3 (illustrative vs. schematic, color treatment, character representation).

### IL01 — Farmer in Field (Hero or Section Anchor)
**Used on:** /for/farmers (above fold or section anchor)
**Purpose:** Establishes the human context of the Food Security Hub. A Kenyan smallholder farmer in a realistic field context.
**Constraints:**
- Must not be stereotypical or generic African imagery
- Must feel specific to Kenya — if landmarks or vegetation appear, they should be accurate
- Farmer should not appear passive — this is a capable professional using a platform
**Decision point:** Is this a photograph (Phase 3 photography decision) or an illustration?

### IL02 — Student at Work (Hero or Section Anchor)
**Used on:** /for/students
**Purpose:** Establishes the human context of the Education Hub. A Kenyan CS student working on a project.
**Constraints:**
- Kenyan context (if a setting is shown)
- Not generic stock photography of "developer at laptop"
- Should convey focus and professional seriousness

### IL03 — M-Pesa Transaction (Illustrative)
**Used on:** /for/farmers (Section 4), /for/buyers (Section 3)
**Purpose:** Accompanying the M-Pesa payment flow text — shows a phone receiving an STK Push.
**Constraints:**
- Must show a phone with an M-Pesa prompt (authentic UI reference, not fabricated)
- Not a real phone screenshot from a real person's device
- Should show the buyer's action, not the backend

### IL04 — Verification Decision Scene
**Used on:** /trust or /for/farmers
**Purpose:** Shows a human administrator reviewing documents — the trust anchor made visible.
**Constraints:**
- Must feel authoritative, not casual
- Documents visible but not readable (protect privacy metaphor)
- Should convey careful review, not rubber-stamping

### IL05 — Portfolio Presentation Scene
**Used on:** /for/employers or /for/students
**Purpose:** Shows the end state — a student's verified portfolio being reviewed by an employer.
**Constraints:**
- Should show the portfolio entry (not a generic screen)
- Employer context (desk, professional setting, Kenya-specific if possible)

---

## CATEGORY 3 — PRODUCT SCREENSHOTS / MOCKUPS

Screenshots show what the platform looks like in practice. They are mockups in Phase 3 (Figma-designed) — not actual screenshots until the web app design is complete.

**Production format:** PNG @2x, optimized for web. WebP with PNG fallback.
**Note:** These are mockups of the web application UI. They must look like a real, designed application — not placeholder UI. This means the web app design must be sufficiently complete before these mockups can be produced.

| ID | What it shows | Used on | Dependency |
|----|--------------|---------|------------|
| SC01 | Marketplace listing browse page | /for/buyers, /marketplace | Web app design |
| SC02 | Farmer dashboard — listings manager | /for/farmers | Web app design |
| SC03 | Trust Score display on a listing | /trust, /for/buyers | Web app design |
| SC04 | Price intelligence dashboard | /for/farmers | Web app design |
| SC05 | Student project workspace (DocumentsTab) | /for/students | Web app design |
| SC06 | Portfolio entry (public view) | /for/employers | Web app design |
| SC07 | Lecturer review workspace | /for/lecturers | Web app design |
| SC08 | Verification queue (admin) — anonymized | /team or /trust | Web app design |

**Note:** Screenshots cannot be finalized until the web application has a designed, implemented UI. This is the dependency that connects website Phase 3 to web application design progress. If web app design is not complete when website Phase 3 begins, use wireframe-quality mockups with a note in the Figma file.

---

## CATEGORY 4 — ICONS

An icon library is required. The style (line, filled, duotone) is a Phase 3 visual identity decision.

### System Icons (Functional UI)

Required for:
- Navigation (menu, close, chevron, external link)
- Form UI (upload, download, search, filter, checkbox, radio)
- Status indicators (checkmark, warning, error, info)
- Verification states (verified badge, pending indicator, rejected indicator)
- Trust Score tiers (distinct visual for NEW / ESTABLISHED / TRUSTED / PREMIUM)

### Platform Concept Icons (Editorial)

Required for:
- Farmer (represents the farmer audience)
- Student (represents the student audience)
- Buyer (represents the buyer audience)
- Employer (represents the employer audience)
- Cooperative Group
- Supplier
- NGO / Government
- Administrator
- Lecturer
- Document (general)
- Hash / cryptographic anchor
- M-Pesa / payment
- Trust (abstract)
- Verification (abstract)
- AI assistant
- Price / market data
- Knowledge article
- Location / county

**Production format:** SVG icon set. Consistent viewBox. Optimized paths.
**Quantity estimate:** ~40–60 icons

---

## CATEGORY 5 — TYPOGRAPHY ASSETS

**Decision required in Phase 3:** Final typeface selections.

**Questions to resolve:**
1. Primary typeface (headings): Does the website continue with Plus Jakarta Sans (used in V2) or does Phase 3 introduce a new typeface? This is a Phase 3 visual identity decision.
2. Body typeface: Same or different from heading typeface?
3. Monospace typeface: For hash display, code references, platform IDs — a monospace font is needed. What is it?
4. Typeface loading strategy: Self-hosted or Google Fonts / Typekit? Affects performance.

**Typography scale to define:**
- Display: one or two sizes (homepage hero)
- Heading 1–4
- Body (regular, large, small)
- Caption
- Label
- Mono (hash display, IDs)

---

## CATEGORY 6 — PHOTOGRAPHY

Photography strategy is a Phase 3 decision. These are the questions that must be answered before any photography is sourced or commissioned.

**Questions:**
1. Original photography or licensed stock?
2. If stock: which sources are acceptable? (Unsplash, Getty, local Kenya photographers?)
3. What subjects are photographed? (Farmers, produce, markets, students, devices, landscapes?)
4. What treatment? (Color, desaturated, color-graded, mixed with illustration?)
5. What is NOT photographed? (Anything that could be stereotypical or tokenizing)

**Areas that require photography (or illustration as substitute):**
- Kenyan agricultural context (fields, produce, markets, farm equipment)
- Kenyan student context (studying, building, working)
- Kenyan buyer context (procurement, receiving produce)
- Produce types featured on the marketplace (tomatoes, maize, beans, etc.)

---

## CATEGORY 7 — BRAND MARK AND WORDMARK

**Status:** Unknown — is there an existing UmojaHub logo / wordmark? This must be confirmed before Phase 3 begins.

**If no existing brand mark:** A brand identity design exercise must be scoped as part of Phase 3.
**If existing brand mark:** It must be provided in Figma-compatible format (SVG or well-structured layer set) before Phase 3 visual identity work begins.

**Required formats (final):**
- SVG wordmark (dark backgrounds)
- SVG wordmark (light backgrounds)
- SVG icon mark (for favicon, social, compact contexts)
- PNG @2x fallback for each

---

## CATEGORY 8 — OPEN GRAPH / SOCIAL PREVIEW IMAGES

One OG image per major page. Designed in Phase 3, produced before launch.

| Page | OG image content |
|------|-----------------|
| Homepage | Platform name + one-line description |
| /for/farmers | "Food Security Hub — Verified Produce Marketplace" |
| /for/students | "Education Hub — Portfolio Verification" |
| /for/employers | "Portfolio Verified — What Employers Need to Know" |
| /transparency | "Platform Transparency — Live Data" |
| /trust | "Trust & Verification Methodology" |
| All others | Generic brand OG image |

**Format:** 1200×630 PNG
**Style:** Consistent with final visual identity

---

## ASSET PRODUCTION STATUS TRACKING

| Category | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|
| Diagrams (18) | Placeholders | Layout + content | Final visual design |
| Illustrations (5) | Not required | Not required | Designed |
| Screenshots (8) | Not required | Wireframe quality | Final (depends on web app) |
| Icons | Not required | Not required | Complete set |
| Typography | Not required | Scale defined | Final typefaces |
| Photography | Not required | Not required | Sourced / commissioned |
| Brand mark | Required (placeholder ok) | Required | Final |
| OG images | Not required | Not required | Designed |

---

## CONSTRAINTS GOVERNING ALL ASSETS

**Performance constraint:** The entire above-the-fold experience (first viewport) must be fast on a mid-range Android device with a 4G connection in Kenya. This means:
- Hero images (if any) must be optimized aggressively
- Above-fold assets must not block render
- Fonts must be subset or loaded with `font-display: swap`
- SVG diagrams must be optimized (no unnecessary paths)

**Accessibility constraint:**
- All icons must have accessible labels or be treated as decorative
- All diagrams must have text alternatives
- All photographs must have descriptive alt text (not "image of farmer")
- Color cannot be the only information carrier in any diagram or status indicator

**Licensing constraint:**
All assets must be licensable for commercial use. Document the license for each licensed asset in this inventory before it enters production.
