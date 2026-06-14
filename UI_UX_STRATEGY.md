# UmojaHub — UI/UX Strategy

> The single, authoritative source of truth for how UmojaHub's interface is designed, built, and governed.
> Supersedes **all** prior design documentation. If anything else conflicts with this file, this file wins.
> Companion: [`REDESIGN_BOUNDARY_AUDIT.md`](./REDESIGN_BOUNDARY_AUDIT.md) (what we retired and why).

---

## 0. Why this document exists

The previous interface was "AI slop" — not from bad taste, but from **three competing design systems and a token layer nothing actually used** (see the boundary audit). The fix is not a prettier coat of paint; it is a **single enforced grammar** that both humans and AI must obey. Industry consensus is blunt about the cause: *"when design has no owner at the system level, AI slop looks inevitable because the design has no stable grammar to absorb change."* This document is that owner.

**The standard we are holding ourselves to:** the design-engineering bar set by Linear, Ramp, Stripe, and Vercel — infrastructure products that read as *crafted* because every visual decision traces to a system, contrast is decisive, whitespace is generous, and one accent does all the work.

---

## 1. The Modern Workflow

A methodology that prioritizes **high-fidelity, system-true UI over fast, unpolished iteration.** Speed comes from a strong foundation, not from skipping it.

### 1.1 Foundation-first, never feature-first
Build in dependency order. Nothing downstream is allowed to start until its foundation exists:

```
Tokens  →  Primitives  →  Composed components  →  Features (routes)
(CSS vars   (Button, Input,   (Card, Table, Modal,    (dashboard pages,
 + Tailwind   Badge — Radix     EmptyState — built      website sections)
 theme)       + cva)            ONLY from primitives)
```

A feature may **never** introduce a raw value. If a feature needs something the system can't express, you extend the *token/primitive layer first*, in its own commit, then consume it.

### 1.2 The build loop (per surface)
Every screen passes the same loop before it is "done":

1. **Reference** — pull the intended design from Figma (Figma MCP → `get_design_context`) or an explicit spec. No improvising layout from memory.
2. **Compose** — assemble from existing primitives + tokens only. Zero hardcoded hex/px/weight.
3. **Wire** — connect to the **protected** data contracts (existing endpoints/shapes). Logic is reused, never rewritten.
4. **Verify** — run the quality gates (§4): Lighthouse (perf/a11y/best-practices), axe (WCAG AA), and a visual/interaction pass via Chrome DevTools / Playwright MCP. Screenshot diff against the reference.
5. **Green** — type-check, lint, test all pass. Old markup for that surface is deleted in the same PR.

A surface is not "done" when it renders. It is done when it **passes the gates and the old version is gone.**

### 1.3 Surgical migration (not big-bang)
Per the boundary audit: convert one route at a time, preserving data plumbing, deleting old styling as replaced. The app stays shippable and reviewable at every commit. No multi-week red-build window.

### 1.4 One owner, one grammar
Every PR is reviewed against this document. New tokens/primitives require an explicit, deliberate decision recorded here — not an inline arbitrary value. "It looked fine" is not acceptance; passing the gates is.

---

## 2. The Tooling Stack

Curated for what elite teams actually use — signal over hype. Each tool has a **defined job**; we do not adopt tools we won't enforce.

### 2.1 Design ↔ code bridge
| Tool | Job | When |
| --- | --- | --- |
| **Figma MCP** (`get_design_context`, `get_screenshot`, `get_variable_defs`, Code Connect) | Source of truth for layout/spec; pull design into code, map components via Code Connect so design tokens ≙ code tokens | Before building any non-trivial surface |
| **`frontend-design` skill** | Generate distinctive, non-generic component/page scaffolds that avoid the AI monoculture | Greenfield components without a Figma ref |

### 2.2 Quality verification (the enforcement teeth)
| Tool | Job | When |
| --- | --- | --- |
| **Chrome DevTools MCP** (`lighthouse_audit`, `performance_start_trace`, `performance_analyze_insight`) | Core Web Vitals, perf traces, render bottlenecks — measured, not vibes | Per surface, before "done" |
| **Playwright MCP** (`browser_snapshot`, `browser_take_screenshot`, `browser_*`) | Interaction/visual QA, a11y snapshot, state coverage (loading/empty/error) | Per surface |
| **`@lhci/cli` (Lighthouse CI)** + **axe-core** in GitHub Actions | Block merges on perf/a11y regressions — the CI gate | Every PR |

### 2.3 Component & token engine
| Tool | Job |
| --- | --- |
| **shadcn/ui** (`vercel:shadcn` skill, CLI) | Copy-in, owned primitives built on Radix — already partially present (`button.tsx`, `tabs.tsx`, `sheet.tsx`); standardize on it |
| **Radix UI** | Accessible, unstyled primitive behavior (focus, keyboard, ARIA) so we never hand-roll a11y |
| **class-variance-authority (cva)** | Type-safe component variants — kills prop-chaos and one-off className drift |
| **Tailwind CSS 3 + CSS variables** | Token bindings: tokens map *directly* to utilities; CSS vars enable theming (dark dashboard / light website) from one source |
| **`tailwind-merge` + `clsx`** (`cn()`) | Safe class composition |

### 2.4 Explicitly NOT adopting (noise)
- Heavyweight 3D (react-three-fiber StoryWorld) — cut; revisit as a deliberate, budgeted feature, not a default.
- Per-component bespoke shadow/gradient recipes — banned (see §3).
- A second hand-maintained CSS-var copy that "mirrors" Tailwind (`theme.css` drift trap) — replaced by a single generated source.

---

## 3. Core Principles — design patterns & engineering habits

These are **enforceable rules**, not aspirations. They become the `CLAUDE.md` design ruleset in Phase 3.

### 3.1 Design language
1. **One token system, two themes.** A single set of semantic tokens (`--bg`, `--surface`, `--fg`, `--fg-muted`, `--border`, `--accent`, …) themed for the dark *product* and the light *website*. No third system. No `site/` fork grammar.
2. **Decisive contrast.** Clear figure/ground; no muddy mid-greys for primary text. Eye always knows where to go.
3. **One accent does the work.** A restrained neutral foundation + a single brand accent used sparingly. Color carries meaning (state/role), never decoration.
4. **Generous, systematic whitespace.** Spacing comes only from the scale (4/8-based). More space than feels necessary. Density is earned in data tables, not sprinkled everywhere.
5. **Typography is the design.** A tight, deliberate type ramp does the hierarchy work — not boxes, borders, and shadows. One ramp, shared.
6. **Depth is a system, not a recipe.** Elevation is defined once (border-led, minimal shadow) and reused. No per-component shadow invention.
7. **Motion is functional.** Tokenized durations/easings, purposeful transitions, and `prefers-reduced-motion` always honored.
8. **Anti-slop guardrails.** No Inter/Poppins-default + purple→blue-gradient + centered-everything + giant-radius aesthetic. Intentional, brand-true choices only.

### 3.2 Engineering habits (the hard rules)
1. **Zero hardcoded design values.** No raw hex, no arbitrary `px`/`rem` spacing, no `font-NNN`, no one-off `rounded-[Npx]` in feature code. Everything from tokens/scale. *This single rule would have prevented the entire slop.*
2. **Build only from primitives.** Features compose Card/Button/Table/Input/Badge/EmptyState — they don't hand-roll `<div className="…">` equivalents.
3. **Variants via cva, not prop soup or copy-paste classes.**
4. **Accessibility is non-negotiable.** WCAG AA contrast, full keyboard paths, visible focus, labelled controls, Radix behavior. Enforced by axe in CI.
5. **Every surface ships all states.** loading · empty · error · success — designed, not afterthoughts.
6. **Performance budgets are gates.** CWV thresholds enforced in CI; bundle weight watched (especially anything 3D/heavy).
7. **Protect the backend boundary.** Per the audit: redesign touches presentation only; data contracts, server logic, and `src/lib/**` are untouched.
8. **Strict naming & co-location.** `PascalCase` components, co-located by domain, primitives in `ui/`, one component per file, tokens in one place.
9. **Delete as you replace.** No dead parallel implementations left behind (the StoryWorld v1+v2 trap). One way to do each thing.
10. **TypeScript strict, zero `any`.** Already enforced — extends to component props and variant types.

---

## 4. Quality Gates (definition of done)

A surface or component is **done** only when all pass:

- [ ] **Tokens only** — no hardcoded hex/px/weight (grep-able; CI lint rule added).
- [ ] **Lighthouse** — Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95 (Chrome DevTools MCP locally; `@lhci/cli` in CI).
- [ ] **axe-core** — zero WCAG A/AA violations.
- [ ] **All states present** — loading/empty/error/success verified via Playwright MCP.
- [ ] **`prefers-reduced-motion`** honored.
- [ ] **Green pipeline** — `type-check && lint && test && build`.
- [ ] **Old version deleted** in the same change.

---

## 5. Execution map (Phase 3 preview)

1. Resolve `site/` (fold vs shared package).
2. Unified token layer: one semantic token set + CSS-var themes, single `tailwind.config.ts` binding. Retire `theme.css` mirror.
3. Rebuild primitives on Radix + cva (standardize the existing shadcn set).
4. Migrate surface-by-surface (website sections, then dashboard routes), data contracts preserved, gates enforced, old deleted.
5. Cut StoryWorld v1/v2 and dead design docs.
6. Rewrite the `CLAUDE.md` design section into the §3 ruleset; wire Lighthouse CI + axe into GitHub Actions.

---

## Sources

- [Design Engineering at Vercel](https://vercel.com/blog/design-engineering-at-vercel) — design-engineer workflow, craft principles (page speed, a11y, reusable components, "iterate to greatness").
- [Four design principles behind Stripe, Linear, and Vercel](https://www.pixeldarts.com/en/post/four-design-principles-behind-stripe-linear-and-vercel) — contrast, monochrome + one accent, whitespace, type.
- [Building a Scalable Design System with shadcn/UI, Tailwind & Design Tokens](https://shadisbaih.medium.com/building-a-scalable-design-system-with-shadcn-ui-tailwind-css-and-design-tokens-031474b03690) — tokens → Tailwind bindings → shadcn primitives → composed features.
- [Building a Robust Design System with Tailwind & Shadcn UI](https://vberkoz.com/posts/design-system-tailwind-shadcn/) — Radix + Tailwind + cva division of labor.
- [Escape "AI Slop" Landing Page Design](https://www.monet.design/blog/posts/escape-ai-slop-landing-page-design) and [How to Avoid AI Slop — the Design System Approach](https://www.mindstudio.ai/blog/claude-design-avoid-ai-slop-design-system) — slop characteristics, system-as-owner fix.
- [Lighthouse CI complete guide](https://unlighthouse.dev/learn-lighthouse/lighthouse-ci) and [WCAG compliance with axe-core, Next.js & GitHub Actions](https://medium.com/@SkorekM/from-theory-to-automation-wcag-compliance-using-axe-core-next-js-and-github-actions-b9f63af8e155) — CI enforcement of perf/a11y budgets.
