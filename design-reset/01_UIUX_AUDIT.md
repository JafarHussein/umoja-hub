# 01 — UI/UX Audit of UmojaHub

**Status:** Research output. No design decisions are made here — this is a forensic account of the UI/UX layer as it exists at the moment of the reset.
**Branch audited:** `chore/website-design-pipeline`
**Scope:** UI/UX layer only. Backend, data model, business logic, and integrations are explicitly out of scope and were not assessed.
**Method:** Read the repo's design tokens (`src/styles/globals.css`, `tailwind.config.ts`), the component tree (`src/components/**`), the route map (`src/app/**/page.tsx`), and the full corpus of design/strategy documents in the root and `context/`. Import graph traced with ripgrep.

---

## 1. Executive summary

UmojaHub's engineering is mature; its UI/UX layer is not. The problem is **not** that any single screen is broken — the platform builds and runs. The problem is **churn and incoherence**: the design layer has been reset repeatedly (V1 → V2 → Figma-first → "Experience Architecture V2" → Unified Tokens V3 → StoryWorld → taste-skill remediation), each pass leaving sediment behind. The result is:

- **Two parallel design languages** living in one token file (a dark "product" theme and a light "website" theme), plus a third **legacy** layer kept "until the last consumer migrates" — a migration that never finished.
- **~25 design/strategy documents**, several of which explicitly declare themselves "authoritative" or "supersedes all prior documents" — and contradict each other. There is no single source of truth; there are many, stacked.
- A **website** (`src/app/(website)/*`, 15 routes) that was remediated in the most recent three commits but rests on an aesthetic direction (StoryWorld, "warm editorial", copper/teal/violet accents) that this reset abandons.
- A **product/app shell** (`src/app/dashboard/*`, marketplace, onboarding, auth) that is the genuinely working surface and that shares primitives (`src/components/ui/*`) and tokens with — but is architecturally separable from — the website.

The engineering underneath deserves a UI/UX layer with one identity, one source of truth, and decisions traceable to evidence. It currently has none of those three.

---

## 2. The token layer

`src/styles/globals.css` is the single token file. It encodes **three** overlapping systems:

| Layer | Selector / location | Purpose | Health |
|---|---|---|---|
| Product theme | `:root`, `.theme-product` | Dark dashboard (GitHub-like greys, `#0d1117`), one brand green `#007f4e` | Coherent, in use |
| Website theme | `.theme-website` | Light "editorial" (`#f7f6f2`), same token names, light values | Abandoned by this reset |
| Legacy compat | `:root` (second block) | `--color-*`, `--font-*`, `--text-t*`, `--space-*`, motion, **and** a large `--ws-*` website block (copper/teal/violet, warm canvas) | Mixed: dashboard aliases live; `--ws-*` is dead-on-arrival |
| shadcn remap | `:root` (third block) | Maps shadcn variables to dark palette | In use by `ui/` primitives |

`tailwind.config.ts` mirrors this split: semantic tokens (`bg`, `surface`, `fg`, `brand`, state colors) **plus** a website-only block (`canvas`, `ws.*`, `copper`, `teal`, `violet`), website fonts (`jakarta`, `ibm-mono`), and website type scale (`ws-display`, `ws-h1`…).

**Finding T-1.** The "unified tokens" effort (Phase 3.2) was a genuine improvement — semantic, alpha-capable, `rgb(var(--x) / <alpha-value>)` triplets — but it was layered *on top of* the legacy system rather than replacing it. Both coexist. New code is told to use the new tokens "but the legacy ones keep working." This is the single biggest source of visual drift.

**Finding T-2.** The brand green `#007f4e` is the one constant across every reset. It is the only element of the visual identity that has earned continuity. Everything else (typefaces, accent palette, surface philosophy, motion vocabulary) has changed at least three times.

**Finding T-3.** Two font systems are loaded: Sora/IBM Plex Sans/JetBrains Mono (dashboard) and Plus Jakarta Sans/IBM Plex Mono (website). No single typographic voice spans the product.

---

## 3. The component layer

| Group | Path | Consumers | Disposition signal |
|---|---|---|---|
| `ui/` primitives | `src/components/ui/*` (button, Card, Input, Modal, Badge, VerifiedBadge, SkeletonLoader) | Dashboard, marketplace, onboarding, auth, foodhub, education, shared — **and zero website pages** | Product layer. Survives the reset. |
| `website/` | `src/components/website/*` (Nav, Footer, AnimateIn, D01Diagram, D01DiagramLazy, ImageSlot, MediaFrame) | **Only** `(website)` pages (+ internal) | 100% website-only. Reset target. |
| `foodhub/`, `education/` | feature components | Dashboard/marketplace | Product layer. Survives. |
| `shared/` | Header, Sidebar, Providers, LayoutWrapper, IdentityRecords, VerificationLockout | App shell | Product layer. Survives. |

**Finding C-1.** The import graph gives a **clean cut line**. The website layer (`(website)` routes + `components/website/*` + the `.theme-website`/`--ws-*` tokens) is fully isolated from the working product. Resetting it does not touch the dashboard's ability to build or render.

**Finding C-2.** `ui/` primitives are dark-theme-coupled (shadcn remap is dark-only). They are functional for the product but were never made theme-portable. Any future unified identity will need these primitives to be the foundation, so their dark-coupling is a constraint to resolve in the new foundation, not a defect to delete.

---

## 4. The document layer

The `context/` directory + repo root hold ~25 design/strategy documents. They fall into three honest buckets:

1. **Obsolete visual/experience direction** (design systems, experience architectures, StoryWorld, Figma blueprints, IA-for-visual, asset/diagram inventories, the entire `context/archive/`). These encode abandoned aesthetics. → deletion candidates (see report 03).
2. **Product truth / domain evidence** (`UMOJAHUB_PLATFORM_CAPABILITIES_REFERENCE.md`, the two ecosystem maps, production roadmap, runbook, decision records, corrective-actions checklist). These describe what the platform *is* and *does* — the evidence base the new foundation must cite. → keep.
3. **Non-visual strategy** (`WEBSITE_PURPOSE_V1.md`, `WEBSITE_WEBAPP_BOUNDARY.md`, `WEBSITE_ENFORCEMENT_RULES.md`, `APPLICATION_USER_JOURNEYS.md`). These explicitly contain "no design, no UI, no visual system" and define enduring purpose/audience/boundary. → keep as foundation input, flagged for user veto.

**Finding D-1.** Multiple documents claim supreme authority ("Supersedes all prior…", "Governing document", "Authoritative encyclopedia"). When five documents all claim to be the single source of truth, none is. This is the documentary symptom of the same churn seen in the token layer.

**Finding D-2.** The valuable, durable signal is concentrated in bucket 2 (capabilities + ecosystems + journeys). It survived every reset because it describes reality, not aspiration. The new foundation should be built from this bucket and nothing else.

---

## 5. Strengths worth preserving (not deleting)

- **Brand green `#007f4e`** — the one continuous identity element.
- **Semantic token *architecture*** (the `rgb(var() / <alpha>)` pattern) — the *mechanism* is correct even though the *values* and the website theme are being reset.
- **The capabilities reference + ecosystem maps** — a rare, source-cited account of what the product actually does and who it serves. This is gold and must anchor the foundation.
- **The product/app shell** — a working, RBAC-aware, multi-role surface. The reset rebuilds the *identity*, not the *plumbing*.

---

## 6. Weaknesses driving the reset

1. **No single visual identity** — three palettes, two font systems, two themes.
2. **No source of truth** — competing "authoritative" documents.
3. **Unfinished migrations** — legacy tokens kept indefinitely.
4. **Aesthetic-led, not evidence-led** — directions chosen by reference to other products (Stripe/Linear/etc.) rather than to UmojaHub's users (farmers on 2G, students building trust, skeptical buyers).
5. **Motion/IA/onboarding never grounded in research** — patterns adopted by fashion, not by usability evidence.

---

## 7. What this audit licenses

This audit is the basis for:
- **Report 02** — deletion of the abandoned visual system (tokens + theme).
- **Report 03** — deletion of obsolete documents.
- **Report 04** — deletion of website-only components and routes.
- The research reports (05–15) — to ground the new foundation in evidence.
- **`UMOJAHUB_DESIGN_FOUNDATION_V1.md`** — the single source of truth that replaces the stacked, contradictory documents.

The audit makes **no** aesthetic recommendation. That is the foundation's job, after evidence.
