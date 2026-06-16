# UmojaHub Design Tokens — Reference

**Status:** Canonical. Produced by Visual System V1 (foundation §16.1).
**Source of truth:** `src/styles/globals.css` (token values) + `tailwind.config.ts` (utility bindings). This doc describes them; the code is authoritative.
**Rule:** Author all UI against **TIER 2 semantic** tokens (via the Tailwind utilities below). Never hard-code hex; never consume TIER 1 primitives directly in components.

---

## 1. Architecture — three tiers, two modes

```
TIER 1  PRIMITIVES   raw palette (--c-*)        mode-agnostic; components never use these
TIER 2  SEMANTIC     role + intent (--bg, …)    re-mapped per MODE; the only tier UI consumes
TIER 3  COMPONENT    scoped (--btn-*, …)        added only when semantic can't express a need
```

**Two modes off one semantic set** (never parallel systems):
- **`product`** — dark dashboard. Default on `:root`; also `.theme-product`.
- **`website`** — light, restrained warm off-white. Applied via `class="theme-website"` on the website layout root.

A dark band inside a light page flips back via a nested `.theme-product`.

---

## 2. Semantic tokens (TIER 2) — the vocabulary

| Token | Tailwind utilities | Role | Product (dark) | Website (light) |
|---|---|---|---|---|
| `--bg` | `bg-background` | Page background | `#0d1117` | `#fafaf8` |
| `--surface` | `bg-surface` | Card / panel | `#161b22` | `#ffffff` |
| `--surface-raised` | `bg-surface-raised` | Raised card / hover | `#1f2937` | `#ffffff` |
| `--surface-sunken` | `bg-surface-sunken` | Recessed well | `#010409` | `#f0efeb` |
| `--fg` | `text-fg` | Primary text | `#e6edf3` | `#1c1e21` |
| `--fg-muted` | `text-fg-muted` | Secondary text | `#8b949e` | `#565a61` |
| `--fg-subtle` | `text-fg-subtle` | Tertiary / meta | `#6e7681` | `#6b6f76` |
| `--fg-disabled` | `text-fg-disabled` | Disabled text | `#484f58` | `#aeb2b8` |
| `--border` | `border-border` | Hairline border | `white / 8%` | `black / 10%` |
| `--border-strong` | `border-border-strong` | Stronger border | `white / 16%` | `black / 16%` |
| `--brand` | `bg-brand` `text-brand` `border-brand` | The one accent | `#007f4e` | `#007f4e` |
| `--brand-hover` | `bg-brand-hover` | Brand hover/press | `#009960` | `#006b42` |
| `--brand-fg` | `text-brand-fg` | Text on brand fill | `#ffffff` | `#ffffff` |
| `--brand-text` | `text-brand-text` | Brand-coloured text (AA on bg) | `#3fb98a` | `#0a6b47` |
| `--ring` | `ring-ring` / focus | Focus ring | `#2da56f` | `#007f4e` |
| `--success` | `*-success` | Verified / positive | `#3fb950` | `#23793f` |
| `--warning` | `*-warning` | Attention / review | `#d29922` | `#8f6314` |
| `--danger` | `*-danger` | Error / destructive | `#f85149` | `#b53625` |
| `--info` | `*-info` | Informational | `#58a6ff` | `#2f5fc2` |

All solid tokens are stored as space-separated RGB triplets, so **alpha modifiers work**: `bg-brand/15`, `text-danger`, `border-danger/30`. State *tints* come from `/10`–`/15`, not separate `-bg` tokens. Borders carry their own alpha.

**Accessibility:** every text/UI pairing meets **WCAG 2.2 AA** in both modes. In website mode, `success`/`warning` are darkened from the dark-mode hues to clear 4.5:1 on `--bg` (validated: fg 15.99:1, muted 6.63:1, subtle 4.83:1, brand-text 6.27:1, white-on-brand 5.07:1, state ≥5:1).

---

## 3. Typography

One voice, two density contexts — same families everywhere:
- **Sora** → `font-heading` (headings)
- **IBM Plex Sans** → `font-body` (body / UI; the body default)
- **JetBrains Mono** → `font-mono` (data / code / badges)

Latin-subset, weights trimmed to those in use. (Geist/Geist Mono removed in P4.)

**Product scale (compact, data-dense):** `text-t1` 32 · `text-t2` 24 · `text-t3` 20 · `text-t4` 16 · `text-t5` 14 · `text-t6` 12 (px).

**Website reading scale (long-form Documentation Stream):**
`text-display` 3.5rem · `text-display-sm` 2.5rem · `text-read-h2` 1.75rem · `text-read-h3` 1.25rem · `text-read-lead` 1.375rem · `text-read-body` 1.125rem/1.7 · `text-read-meta` 0.875rem.
Reading measure: **`max-w-reading`** (68ch).

---

## 4. Spacing, radius, motion

- **Spacing:** the default Tailwind 4px/8-pt grid (`p-2`=8px, `gap-4`=16px, …). Canonical; no custom scale.
- **Radius:** `rounded` 6px · `rounded-sm` 4px. Depth comes from **borders + surface steps**, never drop shadows.
- **Motion (functional only, foundation §10):** `duration-150` (micro) · `duration-250` (panel) · `ease-standard` (`cubic-bezier(0.4,0,0.2,1)`). A global `prefers-reduced-motion` rule collapses all transitions/animations to near-instant.

---

## 5. shadcn compatibility shim

`globals.css` maps shadcn's variable names (`--background`, `--card`, `--primary`, …) to TIER 2 semantic tokens for any shadcn-derived primitive. No current component uses shadcn utilities directly. `--border` and `--ring` are owned by the mode-aware semantic tokens (the shim does not redeclare them).

---

## 6. Rules

1. **Semantic only** in components — never TIER 1 primitives, never raw hex.
2. **One system, themed by mode** — never add a parallel palette or a second theme outside this system.
3. **Color carries meaning** — one accent (brand green); state = success/warning/danger/info/`verified`(success).
4. **AA is the floor** in both modes.
5. **Motion is functional** and reduced-motion-safe.
6. Changes are made by **amending the foundation + this system**, never by spawning a competing "authoritative" doc.
