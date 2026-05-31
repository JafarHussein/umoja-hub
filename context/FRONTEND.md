<frontend_aesthetics>

# UmojaHub Frontend Design System
## Visual North Star: Ramp.com — Technical Precision, Zero Decoration

Read this file in full before writing any JSX. These rules are non-negotiable.

---

## Core Principle

This is a financial and agricultural data platform. Every design decision prioritises
data density, scanability, and technical credibility over decoration. If a visual element
cannot be justified by the data it communicates, remove it.

---

## 1. Typography Hierarchy

Three fonts. Each has a strict domain. Never mix them outside their domain.

### Headings & Display — Sora

```css
font-family: var(--font-sora)  →  Tailwind: font-heading
```

Used for: page titles, section headings, KPI values, modal titles.
Character: geometric, wide tracking, clean. Communicates authority and structure.

```tsx
<h1 className="text-t1 font-heading font-semibold text-text-primary tracking-tight">
  Dashboard
</h1>
```

### Body & Controls — IBM Plex Sans

```css
font-family: var(--font-ibm-plex-sans)  →  Tailwind: font-body
```

Used for: all prose, form labels, descriptions, table row text, button labels, helper text.
Character: highly readable, structural, technical. No decorative personality.

```tsx
<p className="text-t5 font-body text-text-secondary">
  Awaiting M-Pesa confirmation
</p>
```

### Metrics, Financials, IDs, Codes — JetBrains Mono

```css
font-family: var(--font-jetbrains-mono)  →  Tailwind: font-mono
```

Used for: ALL numeric values (KES amounts, scores, counts, percentages), reference IDs,
hash strings, status codes, timestamps.

**MANDATORY:** All monospaced numeric displays must include `tabular-nums`:

```tsx
<span className="text-t2 font-mono font-semibold text-text-primary tabular-nums">
  KES 4,500
</span>
```

`tabular-nums` ensures digits align on grid lines when values change. Never omit this
on numeric displays. Numbers must never shift the layout.

### BANNED fonts — never use these in any file

- Inter
- Roboto
- Arial
- System-ui
- Any Google Font not already in this list
- `font-sans` (resolves to system stack — always specify `font-body` or `font-heading`)

### Type Scale — 6 steps only. No arbitrary sizes. No Tailwind defaults.

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `text-t1` | 32px | 600 | Page titles, display KPIs |
| `text-t2` | 24px | 600 | Section headings, KES totals |
| `text-t3` | 20px | 500 | Card headings, modal titles |
| `text-t4` | 16px | 400 | Body copy, primary form labels |
| `text-t5` | 14px | 400 | Secondary labels, table rows, metadata |
| `text-t6` | 12px | 400 | Captions, timestamps, uppercase tags, mono IDs |

**Banned:** `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`.
Use the `text-t*` scale exclusively.

---

## 2. Layout & Spacing Architecture

### Spacing Grid — Compact & Dense

Preferred spacing increments: `2`, `3`, `4`, `6`. Avoid `8+` inside cards.
The goal is to fit more signal per viewport, not to breathe.

| Context | Gap/Padding |
|---------|-------------|
| Between page sections | `space-y-6` |
| Between cards in a grid | `gap-3` |
| Card internal padding | `p-3` or `p-4` |
| Row internal padding | `px-4 py-2.5` |
| Between label and value | `mt-0.5` or `mt-1` |

### Razor-Sharp Edges — Maximum `rounded-sm` (4px)

Large rounded corners communicate friendliness and softness. This platform communicates
precision and structure. Enforce these rules:

| Element | Allowed radius |
|---------|----------------|
| Cards, panels, containers | `rounded-sm` (4px) — MAXIMUM |
| Buttons | `rounded-sm` (4px) |
| Input fields | `rounded-sm` (4px) |
| Badges, tags | `rounded-[2px]` |
| Progress nodes, indicators | `rounded-full` (circles only) |

**Banned:** `rounded` (6px), `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`,
`rounded-3xl`. These communicate generic SaaS — not financial precision.

### Structural Contrast — Flat Zinc Surfaces with 1px Micro-Borders

No shadows. No gradients. Structure is defined by borders and surface elevation.

| Layer | Background | Border |
|-------|-----------|--------|
| Page base | `bg-surface-primary` (`#0D1117`) | — |
| Card / panel | `bg-surface-elevated` (`#161B22`) | `border border-zinc-800/50` |
| Inner container | `bg-surface-secondary` (`#1F2937`) | `border border-zinc-800/50` |
| Active row hover | `bg-surface-secondary` | — |

**The micro-border standard:** `border-zinc-800/50` is the universal separator.
It produces a crisp, 1px structural line that reads as technical precision —
not the softness of `border-white/5`.

Use `border-white/10` only for interactive elements where a slightly brighter
border communicates interactivity (hover states, focus rings).

**Banned surface patterns:**
- `shadow-*` — no drop shadows anywhere
- `bg-gradient-to-*` on cards or panels
- `bg-white` / `bg-gray-*` / `bg-slate-*` — light mode surfaces are forbidden
- `border-gray-*` — always use `border-zinc-800/50` or `border-white/10`

---

## 3. Color Tokens

Use the custom Tailwind tokens defined in `tailwind.config.ts`. Never use raw hex values
in component code. Never use Tailwind's built-in color scale (gray, slate) except for
the specific status palette listed below.

### Surfaces

| Token | Value | Role |
|-------|-------|------|
| `bg-surface-primary` | `#0D1117` | Page background |
| `bg-surface-elevated` | `#161B22` | Cards, panels |
| `bg-surface-secondary` | `#1F2937` | Inputs, inner containers, table rows |

### Text

| Token | Value | Role |
|-------|-------|------|
| `text-text-primary` | `#E6EDF3` | Headings, values, primary content |
| `text-text-secondary` | `#8B949E` | Labels, descriptions, metadata |
| `text-text-disabled` | `#484F58` | Timestamps, captions, inactive states |

### Accent

| Token | Value | Role |
|-------|-------|------|
| `text-accent-green` / `bg-accent-green` | `#007F4E` | CTAs, confirmed states, verified |
| `bg-accent-green/10` | — | Tinted icon backgrounds |
| `border-accent-green` | — | Active/selected control borders |

### Status Colors (only for semantic states)

| State | Classes |
|-------|---------|
| Error / danger | `text-red-400` `bg-red-950/20` `border-red-900/30` |
| Warning / pending | `text-amber-400` `bg-amber-950/20` `border-amber-900/30` |
| Success / verified | `text-accent-green` `bg-accent-green/10` |

### BANNED colors

- Purple, violet, indigo — not in this palette
- Any decorative gradient (`from-purple-*`, etc.)
- `text-gray-*` — use `text-text-*` tokens
- `text-white` directly — use `text-text-primary`

---

## 4. Interactive Integrity

### Focus States — CSS Outlines Only

No soft glows. No `ring-offset-*`. Use sharp, single-pixel focus rings:

```tsx
className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-green"
```

For inputs specifically:

```tsx
className="focus:border-accent-green focus:ring-1 focus:ring-accent-green"
```

### Hover States — Structural Only

Hover must change border opacity or background — never color or size:

```tsx
// Correct
"hover:border-white/20 transition-colors duration-150"
"hover:bg-surface-secondary transition-colors duration-150"

// Banned
"hover:scale-105"
"hover:shadow-lg"
"hover:text-accent-green" (unless it's a link)
```

### Transition Duration — 150ms Only

```tsx
"transition-all duration-150"     // for combined property changes
"transition-colors duration-150"  // for color-only changes
```

Never use `duration-200`, `duration-300`, `duration-500`. Ramp-caliber micro-interactions
are fast — they communicate confidence, not animation.

### Minimum Touch Target

All interactive elements: `min-h-[44px]` on mobile. Never build a tap target below this.

---

## 5. Skeleton States — MANDATORY

Every page and every list must render an exact-shape skeleton during loading.
A loading state that doesn't match the shape of the arriving data causes layout shift.
Layout shift destroys trust.

### Rule: Skeleton must mirror the layout of loaded content

If a card has a label, a value, and a stat grid — the skeleton must have a matching
label placeholder, value placeholder, and grid of boxes. Not a generic spinner.

### Standard skeleton element

```tsx
<div className="h-4 w-32 bg-surface-secondary rounded-sm animate-pulse" />
```

### Page skeleton pattern

```tsx
function PageSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="space-y-1.5">
        <div className="h-3 w-20 bg-surface-secondary rounded-sm animate-pulse" />
        <div className="h-7 w-40 bg-surface-secondary rounded-sm animate-pulse" />
      </div>
      {/* Stat grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-3 space-y-2">
            <div className="h-3 w-16 bg-surface-secondary rounded-sm animate-pulse" />
            <div className="h-6 w-20 bg-surface-secondary rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
      {/* Row list skeleton */}
      <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0">
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-surface-secondary rounded-sm animate-pulse" />
              <div className="h-3 w-20 bg-surface-secondary rounded-sm animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-surface-secondary rounded-sm animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Never use `<p>Loading...</p>` or a spinner alone. It is banned.

---

## 6. Empty States

Every list, queue, or table must handle zero-item state explicitly.

```tsx
{items.length === 0 && (
  <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-8 text-center">
    <p className="text-t4 font-body text-text-secondary">No items yet.</p>
    <p className="text-t5 font-body text-text-disabled mt-1">
      Contextual explanation — what the user should do next.
    </p>
  </div>
)}
```

---

## 7. Structural Layout Patterns

### Page Shell

```tsx
<div className="min-h-screen bg-surface-primary">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    {/* content */}
  </div>
</div>
```

### Page Header

```tsx
<div className="flex items-center justify-between">
  <div>
    <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
      Section · Subsection
    </p>
    <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
      Page Title
    </h1>
  </div>
</div>
```

### Data Panel (card)

```tsx
<div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-4 space-y-3">
  <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
    Panel Label
  </p>
  {/* content */}
</div>
```

### Key-Value Data Row

```tsx
<div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-0">
  <span className="text-t5 font-body text-text-secondary">Label</span>
  <span className="text-t5 font-mono text-text-primary tabular-nums">Value</span>
</div>
```

### Row List (replaces all table elements)

```tsx
<div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
  {rows.map((row) => (
    <div
      key={row.id}
      className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 last:border-0 hover:bg-surface-secondary transition-colors duration-150"
    >
      {/* row content */}
    </div>
  ))}
</div>
```

**Banned:** `<table>`, `<thead>`, `<tbody>` with light-mode styling.
Use the row-list pattern exclusively for tabular data.

### Stat Grid

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
  <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-3">
    <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
      Label
    </p>
    <p className="text-t2 font-heading font-semibold text-text-primary tabular-nums">
      1,234
    </p>
  </div>
</div>
```

---

## 8. Status Badges

Use `Badge` from `src/components/ui/Badge.tsx`. Never write inline ad-hoc colored spans.

| State | Semantic | Badge variant |
|-------|----------|---------------|
| PENDING / AWAITING_PAYMENT | waiting | `warning` |
| PAID / VERIFIED / APPROVED | confirmed | `success` |
| FAILED / DENIED / REJECTED | terminal | `danger` |
| IN_PROGRESS / IN_FULFILLMENT | active | `info` |
| COMPLETED | closed | `success` |
| DRAFT / UNVERIFIED | inactive | `neutral` |

---

## 9. Animation — Two Patterns Only

| Pattern | Class | Use |
|---------|-------|-----|
| Skeleton loading | `animate-pulse` | All loading placeholder elements |
| Shimmer (custom) | `animate-shimmer` | Content-shaped skeleton lines |
| State transition | `transition-colors duration-150` | Hover, focus color changes |
| Combined transition | `transition-all duration-150` | Border + background together |

**Banned animations:** `animate-bounce`, `animate-spin` (except explicit button loaders),
any CSS keyframe not defined in `tailwind.config.ts`, `duration-200` or higher.

---

## 10. Component Inventory — Check Before Building

| Component | Location | Use for |
|-----------|----------|---------|
| `Card` | `ui/Card.tsx` | ⚠️ Check border radius — override to `rounded-sm` if needed |
| `Button` | `ui/Button.tsx` | All interactive buttons |
| `Input` | `ui/Input.tsx` | All form inputs |
| `Modal` | `ui/Modal.tsx` | All overlay dialogs |
| `Badge` | `ui/Badge.tsx` | Status labels |
| `SkeletonLoader` | `ui/SkeletonLoader.tsx` | Use or inline `animate-pulse` divs |
| `VerifiedBadge` | `ui/VerifiedBadge.tsx` | Verification indicators |
| `OrderTimeline` | `foodhub/OrderTimeline.tsx` | Compact horizontal progress |
| `OrderTimelineDetailed` | `foodhub/OrderTimeline.tsx` | Vertical detailed progress (order detail pages) |
| `TrustScoreDisplay` | `foodhub/TrustScoreDisplay.tsx` | Farmer trust tier |
| `FarmAssistantChat` | `foodhub/FarmAssistantChat.tsx` | Pattern reference for AI chat UIs |

New Education Hub components go in `src/components/education/` — never in `foodhub/`.

---

## 11. Master Forbidden Pattern List

```
✗  rounded / rounded-md / rounded-lg / rounded-xl    # too soft — max rounded-sm (4px)
✗  shadow-* / drop-shadow-*                          # no shadows
✗  bg-gradient-to-* (decorative)                     # no gradients on surfaces
✗  bg-white / bg-gray-* / bg-slate-*                 # no light mode
✗  border-gray-* / divide-gray-*                     # use border-zinc-800/50
✗  text-gray-* / text-white                          # use text-text-* tokens
✗  text-sm / text-base / text-lg (Tailwind defaults) # use text-t* scale
✗  font-sans                                         # use font-body
✗  purple-* / violet-* / indigo-*                    # not in palette
✗  duration-200 / duration-300 / duration-500        # 150ms only
✗  hover:scale-* / hover:shadow-*                    # structural hover only
✗  <table> with light styling                        # use row-list pattern
✗  <p>Loading...</p> alone                           # always skeleton
✗  bare empty div with no state message              # always empty state card
✗  numeric spans without tabular-nums                # always add on font-mono numbers
```

</frontend_aesthetics>
