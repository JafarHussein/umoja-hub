# Frontend Design System
**Authority:** This document governs all visual implementation decisions for the UmojaHub website and web application. Every token is derived from an approved design decision. Nothing is invented in code.
**Status:** Brand identity v1.0 complete. Typography, color, and accent systems locked. Component tokens: pending Phase 4 handoff bundle.

---

## BRAND IDENTITY

### Core Positioning
UmojaHub sits at the intersection of real-world economic participation, verifiable digital trust, and long-term opportunity creation.

**Must feel like:** Modern fintech · Premium SaaS · Infrastructure software · Professional research platforms

**Must not feel like:** Traditional agriculture website · Ed-tech portal · Banking dashboard · Government system · Charity platform · Cryptocurrency exchange

### Visual Posture

| Pillar | Expression |
|--------|------------|
| Trusted Infrastructure | Stable, methodical, auditable, long-lived |
| Human Progress | Productive, constructive, opportunity-oriented, forward-moving |
| Operational Confidence | Verification before visibility; evidence before claims; structure before scale |

### Emotional Calibration

| Attribute | Level |
|-----------|-------|
| Trust | Very high |
| Warmth | Medium |
| Precision | High |
| Sophistication | High |
| Corporate formality | Medium |
| Institutional credibility | High |
| Technical competence | Very high |
| Visual energy | Controlled |

### Geographic Posture
Geographically neutral. The visual language suggests "global verification infrastructure with human-centered participation" — not a platform built for a specific country.

---

## TYPOGRAPHY

### Typefaces

| Role | Family | Fallback Stack |
|------|--------|----------------|
| Marketing & content pages | Plus Jakarta Sans | -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif |
| Data & technical interfaces | IBM Plex Mono | SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace |

**Source:** Plus Jakarta Sans — Google Fonts, OFL license, free commercial use, self-hosting supported. IBM Plex Mono — Apache 2.0, IBM open-source.

**Loading strategy:** Self-hosted WOFF2. `font-display: swap`. Subset to Latin + Latin Extended.

---

### Type Scale

#### Display / Hero
| Property | Value |
|----------|-------|
| Size | `5rem` (80px) desktop → `3rem` (48px) mobile |
| Weight | `700` or `800` |
| Line height | `1.05` |
| Letter spacing | `-0.03em` |
| Color | Heading Primary |

#### H1 — Primary Section Header
| Property | Value |
|----------|-------|
| Size | `2.75rem` (44px) → `2rem` (32px) mobile |
| Weight | `600` |
| Line height | `1.15` |
| Letter spacing | `-0.02em` |

#### H2 — Sub-heading / Card Group Title
| Property | Value |
|----------|-------|
| Size | `1.5rem` (24px) → `1.25rem` (20px) |
| Weight | `500` |
| Line height | `1.3` |
| Letter spacing | `-0.01em` |

#### Body
| Property | Value |
|----------|-------|
| Size | `1.125rem` (18px) |
| Weight | `400` |
| Line height | `1.6` |
| Letter spacing | `0` |

#### Meta — Badges, Labels, Utility Text
| Property | Value |
|----------|-------|
| Size | `0.875rem` (14px) / `0.75rem` (12px) minor utilities |
| Weight | `500` or `600` |
| Line height | `1.4` |
| Letter spacing | `+0.02em` |

#### Mono — Hash Display / Technical IDs
| Property | Value |
|----------|-------|
| Family | IBM Plex Mono |
| Size | `0.875rem` (14px) |
| Weight | `400` |
| Line height | `1.5` |
| Letter spacing | `0` |

### Typography Rules
- **Optical tracking:** Letter spacing tracks inversely with size. Hero −0.03em → Meta +0.02em. Never negative below 16px.
- **Case:** Sentence case everywhere. No `text-transform: uppercase`.
- **Weight rule:** 700/800 for Display only. H1 max 600. Body always 400. Meta steps up to 600 on dark backgrounds only.
- **High contrast scaling:** Text below 16px increases weight by one step for legibility on variable backgrounds.

---

## COLOR SYSTEM

### Philosophy
A restrained spectrum built around slate mineral tones, graphite neutrals, cold metallic accents, and controlled luminous highlights. Avoids green-for-agriculture and blue-for-technology clichés. Creates immediate brand ownership through distinction.

---

### Light Theme (Primary)

#### Canvas
| Token | Hex | Usage |
|-------|-----|-------|
| `canvas-base` | `#F5F4F0` | Page background |
| `canvas-elevated` | `#F0EEE9` | Sticky navs, overlays |
| `surface-primary` | `#ECE8E1` | Cards, panels |
| `surface-secondary` | `#E5E1DA` | Nested card surfaces |

#### Typography
| Token | Hex | Usage |
|-------|-----|-------|
| `text-heading` | `#1D232A` | All headings |
| `text-body` | `#353C45` | Body copy |
| `text-secondary` | `#636C76` | Supporting copy, captions |
| `text-meta` | `#8A919A` | Timestamps, metadata, labels |

No pure black. No pure white.

#### Borders & Separators
| Token | Hex | Usage |
|-------|-----|-------|
| `border-soft` | `#D8D3CC` | Card edges, subtle divisions |
| `border-default` | `#C8C2BA` | Default component borders |
| `divider-scroll` | `#BDB7AF` | Infinite scroll item separation |

Borders become increasingly important during infinite-scroll stacking. Never remove card separation on hover.

#### System Surfaces
| Token | Hex | Usage |
|-------|-----|-------|
| `surface-success` | `#E5ECE8` | Verified state backgrounds |
| `surface-warning` | `#EFE7DA` | Elevated review required |
| `surface-review` | `#E9E2DF` | Revision required state |
| `surface-technical` | `#E3E6E8` | System logs, mono content areas |

---

### Dark Theme (Auto Mode)

#### Canvas
| Token | Hex | Usage |
|-------|-----|-------|
| `canvas-base` | `#131619` | Page background |
| `canvas-elevated` | `#171B1F` | Sticky navs, overlays |
| `surface-primary` | `#1B2025` | Cards, panels |
| `surface-secondary` | `#21272D` | Nested card surfaces |

No pure black.

#### Typography
| Token | Hex | Usage |
|-------|-----|-------|
| `text-heading` | `#F2F0EC` | All headings |
| `text-body` | `#D6D1CB` | Body copy |
| `text-secondary` | `#A9A29A` | Supporting copy |
| `text-meta` | `#878078` | Timestamps, metadata |

#### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `border-soft` | `#2A3138` | Card edges |
| `border-default` | `#39414A` | Default borders |
| `divider-scroll` | `#49515A` | Scroll item separation |

---

### Accent Systems

#### Aurora Copper — Primary Action
| Theme | Hex |
|-------|-----|
| Light | `#B86A3D` |
| Dark | `#D88A5A` |

**Used for:** Primary CTA buttons · Marketplace conversion actions · Lecturer applications · M-Pesa payment triggers · Key conversion moments

**Not used for:** Status indicators, informational states, decorative purposes.

---

#### Glacial Teal — Trust & Verification Anchor
| Theme | Hex |
|-------|-----|
| Light | `#2E7D78` |
| Dark | `#56A8A2` |

**Used for:** Verification badges · Administrator identifiers · Lecturer approval states · SHA-256 trust indicators · System integrity markers

**Why not green:** Green signals "success" in most systems. Glacial Teal signals "validated" and "proven authentic" — a more specific, less generic claim.

---

#### Lunar Violet — Secondary Highlight
| Theme | Hex |
|-------|-----|
| Light | `#6B5A9A` |
| Dark | `#9581CC` |

**Used for:** Featured opportunities · Innovation initiatives · Education ecosystem highlights

**Constraint:** Never as a primary action color. Sparingly — one instance per page maximum.

---

## APPLICATION PATTERNS

### Marketplace Card (Verified Farmer)
```
Surface:        surface-primary
Border:         border-soft
Card title:     text-heading  +  Plus Jakarta Sans H2
Farmer name:    text-body
Location:       text-meta
Verification:   Glacial Teal background tint + icon + IBM Plex Mono ID
Primary CTA:    Aurora Copper fill + light text
```
On hover: increase shadow elevation slightly. Preserve visible border. Never remove card separation. Feed must feel **layered and organized — not blended**.

### Role-Based Administrator Panel
```
Role label:     text-heading  +  Plus Jakarta Sans H2 weight
Identifier:     Glacial Teal chip
Operational metadata: text-meta
System logs:    IBM Plex Mono  +  surface-technical background
```
Administrator feels institutional and process-driven, not personality-driven.

### Revision Required State
```
Background:     #E9E2DF  (surface-review)
Border:         #C8A895
Text:           #7A5342
Icon:           Aurora Copper
```
Never bright red. Creates urgency without visual panic.

### System Alerts

**Informational:**
```
Background: #E3E6E8   Border: #A8B1B9   Text: #353C45
```

**Verification Complete:**
```
Background: #E5ECE8   Border: #7FA9A4   Text: #2E7D78
```

**Elevated Review Required:**
```
Background: #EFE7DA   Border: #C7A27D   Text: #8B6544
```

No saturated red. No neon green. No corporate blue. System communicates **confidence, not anxiety**.

---

## ICONOGRAPHY

**Style:** Mixed — line icons for navigation and actions, filled icons for status and verification states.

```
Navigation / actions:  Line, 1.5–2px stroke, 24×24 viewBox
Status / states:       Filled
  VERIFIED ●   TRUSTED ●   PENDING ●   REJECTED ●
```

Semantic distinction: filled = system state, line = user action.

**Quantity:** ~40–60 icons. Full list in `context/ASSET_INVENTORY.md` Category 4.

---

## ILLUSTRATION & PHOTOGRAPHY

**Diagrams (D01–D18):** Schematic / technical. Clean nodes, arrows, labels. No character illustration. Consistent with trust/verification methodology tone. All 18 diagrams use this visual language. Colors derived from this design system.

**Photography:** None at launch. Avoids tokenizing imagery risk. Hero sections use typography + diagrams. Revisit with original commissioned photography post-launch.

**Product screenshots (SC01–SC08):** The primary visual proof of the platform. These replace photography on audience pages. See `context/ASSET_INVENTORY.md` Category 3.

---

## SPACING

*Phase 2 decisions documented in Figma `02 / Foundations`.* 8px base grid. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256px.

---

## TAILWIND CONFIGURATION (Phase 4 only)

Do not use these values in implementation until Phase 4 handoff bundle is exported and approved.

```typescript
// tailwind.config.ts — Phase 4 implementation only
colors: {
  canvas: {
    base: '#F5F4F0',
    elevated: '#F0EEE9',
  },
  surface: {
    primary: '#ECE8E1',
    secondary: '#E5E1DA',
    success: '#E5ECE8',
    warning: '#EFE7DA',
    review: '#E9E2DF',
    technical: '#E3E6E8',
  },
  text: {
    heading: '#1D232A',
    body: '#353C45',
    secondary: '#636C76',
    meta: '#8A919A',
  },
  border: {
    soft: '#D8D3CC',
    default: '#C8C2BA',
    divider: '#BDB7AF',
  },
  copper: {
    DEFAULT: '#B86A3D',
    dark: '#D88A5A',
  },
  teal: {
    DEFAULT: '#2E7D78',
    dark: '#56A8A2',
  },
  violet: {
    DEFAULT: '#6B5A9A',
    dark: '#9581CC',
  },
},
fontFamily: {
  sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
  mono: ['"IBM Plex Mono"', 'SFMono-Regular', 'Consolas', '"Liberation Mono"', 'monospace'],
},
```

---

## DECISION LOG

| Date | Decision | Reason |
|------|----------|--------|
| 2026-06-02 | Plus Jakarta Sans primary typeface | Free, OFL, commercial use, self-hosting. No licensing delay. |
| 2026-06-02 | IBM Plex Mono for data/technical | Apache 2.0. Excellent hash display legibility. |
| 2026-06-02 | Warm mineral canvas (#F5F4F0 light, #131619 dark) | Avoids sterile white and pure black. Mineral neutrals project stability without clinical coldness. |
| 2026-06-02 | Aurora Copper (#B86A3D) as primary action | Most platforms use blue or green. Copper creates brand ownership. Premium, memorable, human, confident — without aggression. |
| 2026-06-02 | Glacial Teal (#2E7D78) for verification/trust | Green = generic success. Teal = validated authenticity. Semantically specific to UmojaHub's core value proposition. |
| 2026-06-02 | No photography at launch | Geographically neutral posture; avoids tokenizing/stereotyping risk. Product screenshots (SC01–SC08) serve as visual proof. |
| 2026-06-02 | Schematic diagrams, no editorial illustration | Trust infrastructure posture. Technical, methodical, auditable — not narrative or lifestyle. |
| 2026-06-02 | Mixed icon style (line + filled) | Line for user actions; filled for system states. Semantic distinction reinforces the verified/unverified binary central to the platform. |
| 2026-06-02 | No saturated red in any state | System communicates confidence, not anxiety. Revision Required uses surface-review (#E9E2DF) + Aurora Copper icon, not red. |
