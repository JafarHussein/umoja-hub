# Web App UI/UX — Destruction & Debt Report

**Reset directive:** 2026-06-16 (nuclear reset of the web-app presentation layer)
**Branch:** `chore/webapp-uiux-nuclear-reset`
**Covers deliverables:** 1 (UI Destruction Report) · 2 (Design Debt Report) · 3 (Obsolete Design Assumption Report)

## Ground rules (locked with owner)

- **Scope = WEB APP ONLY** — dashboards, auth, onboarding (the dark *product* surface).
- **Website (Documentation Stream, light mode) is OUT OF SCOPE** — shipped, live, must keep building. Its `theme-website` tokens + 3 fonts are **preserved**.
- **One Next.js build/deploy** serves both → the build must stay green. So this phase deletes *docs, Figma, assumptions, and token values* but **not** imported app `.tsx` (deleting those breaks the shared build and takes the website offline). App components are **replaced** during the gated redesign, not pre-deleted.
- **Platform logic is untouchable** — auth, marketplace, trust, verification, payments, education, schema, APIs, roles, admin, backend.

---

## 1 — Destruction log (what has been removed)

| Artifact | Type | Status |
|---|---|---|
| Figma page "App — Auth & Onboarding" (Login frame) | Figma design | **Deleted** (created earlier this session) |
| `UMOJAHUB_DESIGN_FOUNDATION_V1.md` | Design authority doc | **Deleted** |
| `design-system/VISUAL_SYSTEM_V1.md`, `design-system/TOKENS.md` | Design system docs | **Deleted** |
| `design-reset/` (16 files: audit, deletion reports, research findings 05–15) | Prior-reset research/audit | **Deleted** |
| CLAUDE.md "design system" mandate | Instruction | **Retired** (rewritten to the reset directive) |

All deletions are on a branch and git-recoverable if a specific finding is ever wanted as reference.

## 2 — Design debt remaining (to be REPLACED, not pre-deleted — build safety)

These are guilty-until-proven-innocent but cannot be deleted now without breaking the shared build (→ website offline). They are demolished by **replacement** when the new system lands.

- **Code token-values** — `globals.css` product/dark semantic block (`:root, .theme-product`), the app's color/spacing/radius/motion values; `tailwind.config.ts` app utilities. *(Next gated step: gut the product values while preserving the website slice; verify website still builds + renders.)*
- **App frontend components** — `src/components/ui/*` primitives (button, Card, Input, Modal, Badge, etc.), `shared/Header`, `shared/Sidebar`, `foodhub/*`, `education/*` view components. Their current *styling/visual identity* is debt; their *structure* is replaced screen-by-screen during the redesign.
- **The app's current dark visual identity** — colors, spacing, layout patterns, navigation chrome, density decisions. None survives automatically.

## 3 — Obsolete design assumptions (killed)

- **"Designed from inspiration, not understanding."** Borrowed SaaS/documentation visual language is obsolete. No reference product's identity is inherited.
- **"One token set themed by mode" / "product = dark."** Re-opened — the app's theming is redecided from research (multi-theme: light/dark/custom + a11y, colorblind, high-contrast).
- **Typeface lock (Sora / IBM Plex Sans / JetBrains Mono).** No font system survives automatically; re-decided in the new foundation.
- **"No illustration strategy."** Now mandatory — purposeful illustrations for auth, onboarding, empty/success/error/waiting/trust states.
- **Single static look per role.** Each role's mental model, literacy, risk tolerance, and connectivity context must be researched and designed for, not assumed uniform.

## 4 — Preserved (out of scope / build-critical / platform)

- **Website**: `src/app/(website)/*`, `src/components/website/*`, and `context/WEBSITE_*` docs — out of scope, untouched.
- **Website running slice**: `theme-website` tokens in `globals.css` + the 3 `next/font` families.
- **All platform logic, backend, models, API routes, tests** — untouched (659 tests green).
- **Flagged (kept, pending owner call):** `context/APPLICATION_USER_JOURNEYS.md` (behavioral reference — useful research input, not visual debt); the VS V1 Figma variable library / Foundations page (serves the website's tokens).

## 5 — Next (gated, pending approval)

1. Gut the app's code token-values (`globals.css` product mode) with website build/render verification.
2. **Research phase** — deliverables 4–18 (user research per role; marketplace/education/trust UX; illustration, motion, accessibility, multi-theme, tooling/MCP, design-systems, modern-webapp, anti-patterns, Figma workflow, component architecture, information density). **STOP for approval before any design.**
3. `webapp-reset/UMOJAHUB_WEBAPP_FOUNDATION_V1.md` — the new constitution. **STOP for approval before any pixels.**
