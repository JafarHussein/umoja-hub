# UmojaHub — Application Design System (v1.1)

## Jurisdiction preamble

> **`context/FRONTEND.md` governs the public marketing website. This document governs the authenticated application shell (`/dashboard/*`, `/onboarding/*`) exclusively.**
>
> The two systems are intentionally different: the website is a light, editorial marketing surface; the app shell is a **dark, dense, utilitarian** product surface. Do not import website tokens (Plus Jakarta Sans, marketing color scales) into the app shell, and do not import app-shell tokens into the website.
>
> Note (2026-06-13): `context/FRONTEND.md` is **not currently present** in the repo. Until it is, the website track is governed by the Figma sources; the app-shell tokens below are the live, code-backed source of truth (`tailwind.config.ts`).

**Status:** v1.1 — tokens transcribed verbatim from `tailwind.config.ts`. The earlier deprecated "generic SaaS" styling (soft shadows, gray/white cards) is void.

---

## 1. Color (dark-only)

| Token | Hex | Use |
| --- | --- | --- |
| `surface-primary` | `#0D1117` | page background |
| `surface-elevated` | `#161B22` | cards, panels |
| `surface-secondary` | `#1F2937` | inputs, insets |
| `accent-green` | `#007F4E` | primary actions, focus, active state |
| `text-primary` | `#E6EDF3` | headings, body |
| `text-secondary` | `#8B949E` | labels, secondary copy |
| `text-disabled` | `#484F58` | hints, disabled |
| `border` / `ring` | CSS vars | shadcn-mapped borders/focus rings |

Borders are hairlines on translucency (`border-white/5`, `border-white/10`). Depth comes from surface elevation, not drop shadows.

## 2. Typography

| Family | Token | Stack |
| --- | --- | --- |
| Heading | `font-heading` | Sora |
| Body | `font-body` | IBM Plex Sans |
| Mono | `font-mono` | JetBrains Mono |

**Strict 6-step scale** (use these only — no arbitrary sizes):

| Token | Size / line-height / weight |
| --- | --- |
| `t1` | 32px / 1.2 / 600 |
| `t2` | 24px / 1.3 / 600 |
| `t3` | 20px / 1.4 / 500 |
| `t4` | 16px / 1.5 / 400 |
| `t5` | 14px / 1.5 / 400 |
| `t6` | 12px / 1.4 / 400 |

## 3. Shape, spacing, motion

- Radius: `rounded` = 6px (default), `rounded-sm` = 4px. Nothing more rounded.
- Transitions: `duration-150` (default), `duration-250`. Ease only; no bounce.
- `animation-shimmer` for skeleton loaders.
- Inputs are min-height 44px (touch target).

## 4. Components (reuse, do not re-create)

- `@/components/ui/Input` — `Input`, `Textarea` (label/error/hint props, a11y wired).
- `@/components/ui/button` — `Button` (base-ui + cva; `variant`: default/primary/outline/secondary/ghost/destructive/link; `size`; `isLoading`).
- Onboarding chrome: `src/app/onboarding/_components/OnboardingShell.tsx` (card + step indicator + `OnboardingError` + `onboardingSelectClasses`).

## 5. Patterns

- **Card:** `bg-surface-elevated border border-white/5 rounded p-6`.
- **Inline alert (error):** `bg-red-950/40 border border-red-800/50 text-red-400`, `role="alert"`.
- **Selectable card / option:** `border-accent-green bg-accent-green/10` when active; `aria-pressed`.
- **Focus:** `focus-visible:ring-2 focus-visible:ring-accent-green` with `ring-offset-surface-primary`.

Every screen in the Screen Inventory (DOC-05) must be built from these tokens and components; pull values from here, never invent them.
