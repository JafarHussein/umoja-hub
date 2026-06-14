# UmojaHub Redesign — Phase 0 Boundary Audit

> **Status:** Phase 0 complete · Non-destructive reconnaissance
> **Purpose:** Document the *exact* surgical line between protected backend/logic and the UI layer to be scrapped, and diagnose the root cause of the current "AI slop" before any deletion occurs.
> **Companion doc:** [`UI_UX_STRATEGY.md`](./UI_UX_STRATEGY.md) — the methodology, tooling, and governance that replace what this audit retires.

---

## 1. Root-Cause Diagnosis — why the UI reads as "slop"

The interface is not bad because of bad taste. It is bad because of **migration churn with no enforced source of truth**. Concretely, the repo contains **three coexisting, conflicting design systems** and a token layer that is defined but bypassed.

### 1.1 Three competing design systems

| System | Location | Surface | Type | Color philosophy |
| --- | --- | --- | --- | --- |
| **Dashboard** (dark) | root `tailwind.config.ts` + `src/styles/theme.css` | `#0D1117` GitHub-dark | Sora / IBM Plex Sans / JetBrains Mono, `t1–t6` scale | Single green `#007F4E` |
| **Website** (warm) | same root config, `ws-*` tokens | `#F5F4F0` warm canvas | Plus Jakarta Sans / IBM Plex Mono, `ws-display…ws-meta` | Copper / teal / violet |
| **Marketing `site/`** | separate Next.js app in `site/` | `#FFFFFF` editorial | **Playfair Display serif** / IBM Plex Sans/Mono, `d1–d4`/`i1–i4`/`m1–m3` | Gold / blue "track" |

Two of these are crammed into a **single** `tailwind.config.ts`; the third is an entirely separate Next.js application (`site/`, port 3001, its own `package.json`/`tailwind.config.ts`). Nothing is shared. There is no common primitive, no common token, no common type ramp.

### 1.2 The token system exists but is bypassed

The most damning evidence. `src/app/(website)/page.tsx` defines its entire visual surface with **hardcoded arbitrary values**, ignoring the tokens defined two files away in `tailwind.config.ts`:

- Colors: `bg-[#131619]`, `text-[#56A8A2]`, `text-[#F2F0EC]`, `bg-[#E5E1DA]`, `border-[#C8C2BA]` — raw hex instead of `bg-ws-surface-*`.
- Spacing: `px-[120px]`, `py-[128px]`, `py-[96px]`, `gap-[56px]` — magic numbers, no spacing scale.
- Weight: `font-800`, `font-600`, `font-400` — non-standard utilities, not the design ramp.
- Radius: `rounded-[2px]` and `rounded-[4px]` mixed arbitrarily.

This is the textbook "AI slop" failure mode confirmed by industry sources: *depth and spacing behave like decoration because each component reinvents its own recipe.* When the design has no enforced grammar, every task re-invents the values.

### 1.3 Duplicate / dead implementations left in-tree

- **StoryWorld v1 *and* v2** (react-three-fiber 3D scenes) both shipped, gated by `NEXT_PUBLIC_STORYWORLD_V2`. Heavy bundle weight, two parallel codebases. **Decision: cut both** from the redesign surface (revisit later as a deliberate feature).
- **Three styling sources of truth:** `src/app/globals.css` (stub), `src/styles/globals.css` (real, 98 lines), `src/styles/theme.css` (96 lines of CSS vars that "mirror tailwind.config.ts exactly" — i.e. a second hand-maintained copy that *will* drift).
- A pile of superseding design docs in `context/` (see §4).

---

## 2. The Surgical Boundary

The boundary is **NOT file-level**. In the App Router, data-fetching and presentation interleave inside the same files. The cut is *within* files: preserve the data plumbing, replace the markup.

### 2.1 PROTECTED — never touched by the redesign

| Layer | Paths |
| --- | --- |
| Domain logic | `src/lib/**` — `db.ts`, `models/`, `validation/`, `auth/`, `payments/`, `integrations/`, `trust/`, `env.ts`, `utils.ts` |
| API surface | `src/app/api/**` (all route handlers) |
| Routing guard | `src/middleware.ts` |
| **Inside page/components** | server data-fetching, `getServerSession`/`requireRole`, server actions, the **fetch endpoints + response shapes** (data contracts) the UI consumes |

**Worked example — `src/app/dashboard/farmer/listings/page.tsx`:**
- 🔒 **Protected:** the endpoints `/api/marketplace?own=true`, `/api/farmers`, `PATCH /api/marketplace/:id`; the shapes `IMyListing` / `IListingsResponse` / `IFarmerResponse`; the role-gating logic; the `listingStatus` toggle business rule; the verification-lockout state machine (`lockoutForStatus`).
- ✂️ **Scrap:** every `className`, the inline SVGs, the hand-built table grid, the skeleton markup, all layout.

### 2.2 SCRAP / REBUILD — presentation only

- `src/components/**` (the JSX + styling; data contracts preserved as typed props)
- `src/styles/**`, `src/app/globals.css`, both `tailwind.config.ts` files
- `src/lib/cn.ts` (re-established), `src/lib/gsap.ts`, `src/lib/storyworld/**` (cut)
- `src/components/website/StoryWorld/**` (cut)
- Design `.md` docs in `context/` (see §4)

### 2.3 Migration discipline (per approved "surgical replacement")

Foundation-first, never big-bang. Order: **unified tokens → primitives → convert each route onto them, deleting old as replaced.** Build, type-check, lint, and tests stay green at every commit. No route is "done" until it passes the Phase 1 quality gates (Lighthouse + axe + visual review).

---

## 3. `site/` resolution

`site/` is a separate, minimal marketing-site experiment (third design language). Per the approved scope ("unify both `src/` and `site/`"), it does **not** stay a fork. Both apps converge on **one** shared token + primitive foundation. The Phase 3 plan must decide whether `site/` folds into the root `app/(website)` group or remains a separate deploy target consuming a shared design package — resolved at the top of Phase 3 after a focused read of `site/src/**`.

---

## 4. Documentation to retire (Phase 3, after strategy approval)

Deprecated/superseded design docs (backend/ops docs are **kept**):

- `context/FRONTEND.md`, `context/APPLICATION_DESIGN_SYSTEM.md`, `context/WEBSITE_IA_V3.md`, `context/STORYTELLING_FRAMEWORK.md`, `context/FIGMA_WORK_PLAN.md`, `context/APPLICATION_FIGMA_BLUEPRINT.md`, the `context/archive/**` design set, and the StoryWorld/design-reset docs.
- **`CLAUDE.md`:** surgically replace only the *DESIGN SYSTEM* directive + design rules. **Keep** all backend governance (architecture pipeline, env, DB, RBAC, workflow, commit rules) — it is not the source of the slop and is genuinely strong.

> Retire = delete only once the replacement in `UI_UX_STRATEGY.md` + new `CLAUDE.md` design section is in place and approved. Nothing is deleted in Phase 0.
