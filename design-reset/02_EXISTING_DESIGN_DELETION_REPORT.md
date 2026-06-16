# 02 — Existing Design (Visual System) Deletion Report

**Status:** Deletion plan for the abandoned *visual system* — the design tokens, theme, and style scaffolding that encode the directions this reset abandons.
**Policy:** Delete, do not archive. Recoverable via git history only.
**Hard constraint:** The working **product/app shell** (dashboard, marketplace, onboarding, auth) must continue to type-check, build, and render. Therefore the deletion is surgical: it removes the **website visual system** and the **dead legacy website tokens**, and preserves every token the dashboard consumes.

---

## 1. What is deleted vs preserved in the token layer

### `src/styles/globals.css`

| Block | Action | Reason |
|---|---|---|
| `.theme-website { … }` (light editorial theme) | **DELETE** | The abandoned website aesthetic. No product surface uses it. |
| `--ws-*` legacy block (canvas, copper, teal, violet, ws-text/border, ws-ease/dur) | **DELETE** | Website/StoryWorld-only. StoryWorld is cut; the website is being reset. |
| `:root` / `.theme-product` (dark surfaces, brand, state) | **KEEP** | The live product theme. |
| Dashboard legacy aliases (`--color-surface-*`, `--color-text-*`, `--font-*`, `--text-t*`, `--space-*`, `--radius-*`, motion) | **KEEP** | Still consumed by dashboard components and skeletons. |
| shadcn remap (`--background`, `--card`, `--primary`…) | **KEEP** | Consumed by `ui/` primitives. |
| Base resets, focus ring, scrollbar, skeleton shimmer | **KEEP** | Global, theme-agnostic. |

### `tailwind.config.ts`

| Token | Action | Reason |
|---|---|---|
| `colors.canvas`, `colors.ws.*`, `colors.copper`, `colors.teal`, `colors.violet` | **DELETE** | Website palette. |
| `fontFamily.jakarta`, `fontFamily['ibm-mono']` | **DELETE** | Website typefaces. |
| `fontSize['ws-display'|'ws-h1'|'ws-h2'|'ws-body'|'ws-meta'|'ws-mono']` | **DELETE** | Website type scale. |
| Semantic tokens (`bg`, `surface`, `fg`, `brand`, `ring`, state) | **KEEP** | Product + future foundation. |
| Dashboard legacy (`accent.green`, `text.*`, `surface.primary/elevated/secondary`) | **KEEP** | Dashboard consumers. |
| Dashboard fonts (`heading`/`body`/`mono`), `fontSize.t1..t6`, radius, motion, shimmer | **KEEP** | Product. |

---

## 2. Pre-flight safety checks (run before deleting tokens)

These must all return **zero hits outside `src/app/(website)` and `src/components/website`** (which are themselves being deleted in report 04):

```
grep -rn "theme-website"            src --include=*.tsx --include=*.ts
grep -rn "font-jakarta\|font-ibm-mono\|ws-display\|ws-h1\|ws-h2\|ws-body\|ws-meta\|ws-mono" src
grep -rn "bg-canvas\|bg-ws-\|text-ws-\|border-ws-\|text-copper\|bg-copper\|text-teal\|text-violet" src
grep -rn "ws-canvas\|ws-surface\|ws-copper\|ws-teal\|ws-violet\|ws-ease\|ws-dur" src
```

If any hit lands in a **product** file (`dashboard`, `marketplace`, `onboarding`, `auth`, or a non-website component), that file must be reconciled to a kept token **before** the token is deleted. (Report 05/Foundation note: expected result is zero product hits, because the import graph shows the website palette is website-only.)

---

## 3. What is explicitly NOT deleted

- The **brand green** `#007f4e` in every form (`--brand`, `accent.green`, `--primary`). It is the one continuous identity element and the future foundation's anchor.
- The **semantic token architecture** (`rgb(var(--x) / <alpha-value>)`). The *mechanism* is sound; only the website *values* are removed.
- All dark product tokens, dashboard fonts, shadcn mapping.

---

## 4. State after this deletion

- The token file describes **one** theme (dark product) plus its kept legacy aliases — no second theme, no dead website palette.
- `tailwind.config.ts` exposes only product + semantic tokens.
- The website routes (deleted in report 04) no longer have a palette to render against — intended; the website is reset to zero and will be rebuilt against `UMOJAHUB_DESIGN_FOUNDATION_V1.md`.
- The dashboard product builds and renders unchanged.

---

## 5. Out of scope (untouched)

No change to: Mongoose models, API routes, auth/RBAC, validation schemas, integrations (M-Pesa, Groq, SendGrid, Cloudinary, weather, SMS), cron, middleware logic, or any business rule. This report governs **CSS tokens and Tailwind config only**.
