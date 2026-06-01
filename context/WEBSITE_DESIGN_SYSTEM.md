# UmojaHub — Website Design System
**Scope**: Public website only (`src/app/(website)/` and `src/components/website/`)
**Extends**: `context/FRONTEND.md` (dashboard design system — read that first)
**Authority**: This document governs all website visual decisions. When conflict exists with FRONTEND.md, this document wins for website pages.

---

## DESIGN PHILOSOPHY

The website design system is an extension of the application design system — same tokens, same font stack, same structural philosophy. But the website has different requirements: it must convey depth and credibility to someone who has never used the platform, not just serve data to someone who already has.

The reference point is not "what does a marketing website look like." The reference point is "what does a research paper look like when it is presented beautifully." Dense. Authoritative. No wasted space. Every element justifiable.

Visual north star: Stripe's documentation meets Ramp's financial precision meets Linear's typographic intentionality.

The website should feel like it was built by people who care intensely about both what they are communicating and how they are communicating it.

---

## 1. TYPOGRAPHY SYSTEM

### Font Stack (inherited from FRONTEND.md)

```
font-heading    →  Sora (headings, display)
font-body       →  IBM Plex Sans (prose, labels, UI)
font-mono       →  JetBrains Mono (numbers, codes, IDs)
```

These fonts are already loaded in the application. No additional font loading required.

### Website Display Scale (NEW — website only)

The dashboard type scale (`text-t1` through `text-t6`) is insufficient for marketing display. Add to `tailwind.config.ts`:

```js
// In theme.extend.fontSize:
'display-xl': ['64px', { lineHeight: '68px', letterSpacing: '-0.02em' }],
'display-lg': ['48px', { lineHeight: '52px', letterSpacing: '-0.02em' }],
'display-md': ['36px', { lineHeight: '42px', letterSpacing: '-0.01em' }],
'display-sm': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
```

### Responsive display scaling

Display sizes scale down on mobile. Always implement as:

```tsx
// display-xl: 64px desktop → 40px mobile
className="text-[40px] lg:text-display-xl"

// display-lg: 48px desktop → 32px mobile
className="text-[32px] lg:text-display-lg"

// display-md: 36px desktop → 24px mobile (use text-t2 on mobile)
className="text-t2 lg:text-display-md"
```

### Type hierarchy for website pages

| Use | Token | Font | Weight | Example |
|---|---|---|---|---|
| Page hero | `text-display-xl` | `font-heading` | 600 | Platform definition |
| Section headline | `text-display-lg` | `font-heading` | 600 | "How the marketplace works" |
| Subsection | `text-display-md` | `font-heading` | 500 | "What farmers can do" |
| Card headline | `text-display-sm` | `font-heading` | 500 | Problem name |
| Body prose | `text-t4` (16px) | `font-body` | 400 | All explanatory paragraphs |
| Secondary label | `text-t5` (14px) | `font-body` | 400 | Metadata, list details |
| Caption / eyebrow | `text-t6` (12px) | `font-mono` | 400 uppercase | Section labels |
| All metrics | `text-t2`+ | `font-mono` | 600 | Platform statistics |

### Eyebrow labels (used above every major section headline)

```tsx
<p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
  For Farmers · Verification
</p>
<h2 className="font-heading text-display-md font-semibold text-text-primary tracking-tight">
  How verification works
</h2>
```

Eyebrow format: `Category · Subcategory` — always monospace, always uppercase, always tracking-widest, always `text-text-disabled`.

### Reading width constraint (mandatory on all prose)

All paragraph text, FAQ answers, lifecycle descriptions, and body copy must be wrapped:

```tsx
<div className="max-w-prose">   {/* 65ch — Tailwind default */}
  <p className="font-body text-t4 text-text-secondary">...</p>
</div>
```

Or for slightly wider reading lines:

```tsx
<div className="max-w-3xl">
  {/* prose content */}
</div>
```

Never let body text span a full `max-w-7xl` container. It becomes unreadable above ~80 characters per line.

---

## 2. COLOR SYSTEM

### Inherited tokens (from FRONTEND.md — do not redefine)

```
bg-surface-primary     #0D1117   Page background
bg-surface-elevated    #161B22   Cards, panels
bg-surface-secondary   #1F2937   Inner containers, hover states
text-text-primary      #E6EDF3   Headings, values
text-text-secondary    #8B949E   Body copy, descriptions
text-text-disabled     #484F58   Captions, timestamps, eyebrows
text-accent-green      #007F4E   CTAs, verified states
border-zinc-800/50               Universal separator
```

### Website-specific color decisions

**Hero section**: `bg-surface-primary` — same as page background. No hero section gets a different background. The content IS the hero, not a color block.

**Section alternation**: Alternating sections between `bg-surface-primary` and `bg-surface-elevated` creates visual rhythm without decoration. Pattern:

```
Section 1 (hero):           bg-surface-primary
Section 2 (stats):          bg-surface-elevated  (full-bleed)
Section 3 (marketplace):    bg-surface-primary
Section 4 (education):      bg-surface-elevated  (full-bleed)
Section 5 (trust):          bg-surface-primary
...
```

Full-bleed elevated sections use `w-full bg-surface-elevated border-y border-zinc-800/50` with inner `max-w-7xl mx-auto px-6`.

**Accent usage**: `accent-green` is used ONLY for:
- Primary CTAs ("Get started", "Register as farmer")
- Verified/approved states (badges, indicators)
- Active anchor navigation indicator
- Process flow step numbers

Never use `accent-green` as a background for anything other than primary CTAs.

### What gets color treatment

```
✓  Primary CTA buttons        →  bg-accent-green text-text-primary
✓  Verified status badges      →  text-accent-green bg-accent-green/10
✓  Active anchor nav item      →  border-l-2 border-accent-green text-text-primary
✓  Process step numbers        →  text-accent-green font-mono
✓  Hover on secondary buttons  →  hover:border-white/20 hover:text-text-primary

✗  Section backgrounds         →  Never colored
✗  Decorative underlines       →  Never colored
✗  Icons used decoratively     →  Never accent-green
✗  Hover highlights on cards   →  hover:bg-surface-secondary only
```

---

## 3. SPACING SYSTEM

### Website-specific spacing (extends dashboard compact spacing)

The dashboard uses tight spacing (`p-3`, `gap-3`, `space-y-6`). The website uses more generous spacing between major sections to create reading rhythm while maintaining the same compact density within sections.

| Context | Class |
|---|---|
| Between major page sections | `py-16 lg:py-24` |
| Between subsections within a section | `space-y-12` |
| Between paragraphs | `space-y-4` |
| Between heading and body | `mt-4` or `mt-6` |
| Between eyebrow and heading | `mb-3` |
| Card internal padding | `p-6` (website cards are larger than dashboard cards) |
| Between cards in a grid | `gap-4` or `gap-6` |
| Section horizontal padding | `px-6` |

### The 8pt grid

All spacing values are multiples of 4px (Tailwind default). Website sections use multiples of 16px (`py-16` = 64px, `py-24` = 96px). Within sections, multiples of 8px or 16px. Within components, the dashboard convention (4px increments) applies.

### Max-width system

Three containers, used consistently:

```tsx
// Full container — nav, section wrappers, footer
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Content container — most section content
<div className="max-w-5xl mx-auto">

// Reading container — prose, FAQs, lifecycle descriptions
<div className="max-w-3xl">
```

---

## 4. GRID SYSTEM

### Website-specific grid patterns

**Audience navigator** (homepage): 3×3 grid on desktop, 2×N on tablet, 1×N on mobile
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Two-column layout** (text + diagram/card): 5/7 split on desktop
```tsx
<div className="grid lg:grid-cols-12 gap-8 lg:gap-16">
  <div className="lg:col-span-5">{/* text */}</div>
  <div className="lg:col-span-7">{/* diagram or card */}</div>
</div>
```

**Audience page layout** (anchor nav + content): 1/4 sidebar + 3/4 content
```tsx
<div className="grid lg:grid-cols-4 gap-8">
  <div className="lg:col-span-1">{/* SectionAnchor */}</div>
  <div className="lg:col-span-3">{/* page content */}</div>
</div>
```

**Stat strip** (4 metrics): 4-column horizontal on desktop, 2×2 on tablet, 1-column on mobile
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-zinc-800/50">
```

---

## 5. COMPONENT PATTERNS

### Website Card (larger than dashboard card)

```tsx
<div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-6 space-y-4">
  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
    Label
  </p>
  <h3 className="font-heading text-display-sm font-semibold text-text-primary">
    Card headline
  </h3>
  <p className="font-body text-t4 text-text-secondary">
    Explanation
  </p>
</div>
```

### Audience Navigator Card

```tsx
<a href="/for/farmers" className="group block bg-surface-elevated border border-zinc-800/50 rounded-sm p-5 hover:border-white/20 transition-colors duration-150">
  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
    Food Security Hub
  </p>
  <p className="font-heading text-t3 font-semibold text-text-primary group-hover:text-text-primary mb-2">
    Farmers
  </p>
  <p className="font-body text-t5 text-text-secondary">
    List verified produce, manage orders, build trust score.
  </p>
</a>
```

### Process Step (used within ProcessFlow)

```tsx
<div className="flex gap-4">
  <div className="flex-shrink-0">
    <span className="font-mono text-t6 text-accent-green uppercase tracking-widest">
      Step 01
    </span>
  </div>
  <div>
    <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
      {actor}
    </p>
    <p className="font-heading text-display-sm font-semibold text-text-primary mb-2">
      {action}
    </p>
    <p className="font-body text-t4 text-text-secondary">
      {detail}
    </p>
  </div>
</div>
```

### Lifecycle Stage

```tsx
<div className="relative pl-8 pb-8 border-l border-zinc-800/50 last:border-l-transparent last:pb-0">
  {/* Stage number node */}
  <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-surface-elevated border-2 border-zinc-800/50 flex items-center justify-center">
    <div className="h-1.5 w-1.5 rounded-full bg-accent-green" />
  </div>
  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
    Stage {n}
  </p>
  <p className="font-heading text-display-sm font-semibold text-text-primary mb-3">
    {stageName}
  </p>
  <p className="font-body text-t4 text-text-secondary max-w-prose">
    {description}
  </p>
</div>
```

### Section Divider

```tsx
<div className="border-t border-zinc-800/50 my-16 lg:my-24" />
```

### Website CTA Button (primary)

```tsx
<a
  href="/auth/register"
  className="inline-flex items-center justify-center min-h-[48px] px-8 rounded-sm bg-accent-green text-text-primary font-body text-t4 font-medium transition-all duration-150 hover:opacity-90"
>
  Register as farmer →
</a>
```

### Website CTA Button (secondary)

```tsx
<a
  href="/marketplace"
  className="inline-flex items-center justify-center min-h-[48px] px-8 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t4 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
>
  Browse marketplace
</a>
```

### Inline trust signal (used within body text)

```tsx
<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-accent-green/10 border border-accent-green/20 text-accent-green font-mono text-t6">
  VERIFIED
</span>
```

---

## 6. NAVIGATION PATTERNS

### WebsiteNav structure

```tsx
<header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 transition-all duration-150"
  // bg-transparent when at top
  // bg-surface-primary when scrolled
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
    <Logo />
    <DesktopNav />   {/* hidden on mobile */}
    <NavActions />   {/* Sign in + Get started */}
    <MobileNavTrigger />  {/* Sheet trigger, hidden on desktop */}
  </div>
</header>
```

`DesktopNav` uses shadcn `NavigationMenu`. The "For You" item triggers a mega-menu:

```
┌────────────────────────────────────────────────┐
│  Food Security Hub          Education Hub       │
│  ─────────────────          ──────────────       │
│  Farmers                    Students             │
│  Buyers                     Lecturers            │
│  Suppliers                  Employers            │
│  Cooperatives               Institutions         │
│                             NGOs & Government    │
│                                                  │
│  ── Platform ──────────────────────────────────  │
│  Trust & Verification   About   Transparency     │
└────────────────────────────────────────────────┘
```

Mega-menu background: `bg-surface-elevated border border-zinc-800/50 rounded-sm`. No shadows.

### Mobile nav (Sheet)

Full-height sheet from left. Renders all nav links as a vertical list. Close button top-right. Same link structure as desktop, linear (no dropdowns).

### Scroll behavior

On scroll > 20px from top:
- Nav gains: `bg-surface-primary border-b border-zinc-800/50`
- At top: transparent background (hero section visible behind nav)

Use `useEffect` + `window.addEventListener('scroll', ...)` in the Nav component. This is the ONLY client-side JS on marketing pages that runs without user interaction.

### Active page indicator

Current page link in nav: `text-text-primary` instead of `text-text-secondary`. Determined via `usePathname()`.

---

## 7. FOOTER ARCHITECTURE

Full four-column link grid. No newsletter signup. No social media links (unless official accounts exist). No "follow us" prompts.

```tsx
<footer className="border-t border-zinc-800/50 bg-surface-primary">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">

    {/* Top section: logo + tagline */}
    <div className="mb-12">
      <Logo />
      <p className="font-body text-t5 text-text-secondary mt-2 max-w-xs">
        Verified agricultural marketplace and education platform for East Africa.
      </p>
    </div>

    {/* Link grid */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
      <FooterColumn title="Platform" links={[...]} />
      <FooterColumn title="For You" links={[...]} />
      <FooterColumn title="Company" links={[...]} />
      <FooterColumn title="Support" links={[...]} />
    </div>

    {/* Bottom bar */}
    <div className="border-t border-zinc-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="font-mono text-t6 text-text-disabled">
        © 2026 UmojaHub. Built for East Africa.
      </p>
      <div className="flex gap-6">
        <Link href="/legal/terms">Terms</Link>
        <Link href="/legal/privacy">Privacy</Link>
        <Link href="/security">Security</Link>
      </div>
    </div>
  </div>
</footer>
```

FooterColumn heading: `font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4`
FooterColumn links: `font-body text-t5 text-text-secondary hover:text-text-primary transition-colors duration-150`

---

## 8. ICON SYSTEM

### Policy

Icons are used functionally, never decoratively.

Permitted uses:
- Navigation arrow (→) in CTA buttons — rendered as character, not SVG icon
- External link indicator in trust/security pages
- Chevron in FAQ accordion (shadcn default, restyled)
- Status indicators in process flows (circle nodes)

Prohibited uses:
- Feature icons (no icon-per-feature layouts)
- Decorative section dividers using icons
- Social media icons (unless official accounts)
- "Check mark" bullets in feature lists (use `text-accent-green` dot instead)

### Icon library

If icons are needed: use `lucide-react` (already in the project from dashboard usage). Only import the specific icons needed — never import the full library.

Website-permitted icons:
- `ArrowRight` — CTA button suffix
- `ExternalLink` — external links
- `ChevronDown` — FAQ accordion
- `Menu` — mobile nav trigger

---

## 9. ILLUSTRATION STRATEGY

### Philosophy

Illustration is not used for decoration. Every illustration on the website is a process diagram, a data visualization, or an annotated screenshot.

### Diagram construction rules

All process diagrams are SVG React components built inline — not imported images, not Figma exports, not screenshots of diagrams.

**Why SVG React components:**
- They scale perfectly on all screens
- They can use CSS custom properties for theming
- They are accessible (can include `<title>` and `<desc>`)
- They do not require design tool dependencies
- They can be animated with CSS

**SVG component structure:**
```tsx
// src/components/website/diagrams/MarketplaceFlowDiagram.tsx
export function MarketplaceFlowDiagram(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 800 200"
      role="img"
      aria-labelledby="marketplace-flow-title"
      className="w-full h-auto"
    >
      <title id="marketplace-flow-title">
        Marketplace workflow: Farmer registers → Farmer lists → Buyer browses → Buyer pays → Farmer fulfills
      </title>
      <desc>
        A five-step sequential diagram showing the marketplace workflow.
      </desc>
      {/* nodes and arrows */}
    </svg>
  );
}
```

**SVG color usage:** Use `currentColor` for strokes and text, `fill="var(--color-surface-elevated)"` for node backgrounds, `stroke="var(--color-zinc-800-50)"` for borders. This ensures diagrams adapt to the theme.

### Annotated screenshots

Product screenshots are captured as real PNG/WebP images of the live platform with real data. Annotations are SVG overlays positioned absolutely over the screenshot using a container div:

```tsx
<div className="relative">
  <Image src="/screenshots/listing-card.webp" alt="..." width={800} height={400} />
  <svg className="absolute inset-0 w-full h-full pointer-events-none">
    {/* callout lines and labels */}
  </svg>
</div>
```

Screenshots are captured at 2× resolution for retina displays and served via `next/image` with automatic optimization.

---

## 10. ANIMATION SYSTEM

### Animation tokens (add to tailwind.config.ts)

```js
// In theme.extend.keyframes:
'fade-up': {
  '0%': { opacity: '0', transform: 'translateY(8px)' },
  '100%': { opacity: '1', transform: 'translateY(0)' },
},
// In theme.extend.animation:
'fade-up': 'fade-up 200ms ease-out forwards',
'fade-up-delayed': 'fade-up 200ms ease-out 100ms forwards',
```

### Intersection Observer pattern (for scroll-triggered reveals)

```tsx
// src/hooks/useInView.ts
import { useEffect, useRef, useState } from 'react';

export function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
```

### Respecting prefers-reduced-motion

```tsx
// All animation classes must be wrapped:
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
className={!prefersReduced ? 'animate-fade-up' : ''}
```

Or via CSS:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up,
  .animate-fade-up-delayed {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

---

## 11. TRUST SIGNAL PATTERNS

### Verified badge (inline)

```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-accent-green/10 border border-accent-green/20 font-mono text-t6 text-accent-green uppercase tracking-widest">
  Verified
</span>
```

### Admin review disclosure (in verification sections)

```tsx
<div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-4">
  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
    Human Review Required
  </p>
  <p className="font-body text-t5 text-text-secondary">
    Every verification decision is made by a platform administrator who reviews the submitted
    documents. Verification is never automatic.
  </p>
</div>
```

### Live stat with timestamp

```tsx
<div>
  <p className="font-mono text-display-lg font-semibold text-text-primary tabular-nums">
    {verifiedFarmers}
  </p>
  <p className="font-body text-t5 text-text-secondary">Verified farmers</p>
  <p className="font-mono text-t6 text-text-disabled mt-1">
    Updated {relativeTime(lastUpdated)}
  </p>
</div>
```

### Limitation disclosure (in trust sections)

Displayed as a clearly labeled panel — not hidden in footnotes:

```tsx
<div className="border border-amber-900/30 bg-amber-950/10 rounded-sm p-4">
  <p className="font-mono text-t6 text-amber-400 uppercase tracking-widest mb-2">
    What verification does not claim
  </p>
  <p className="font-body text-t5 text-text-secondary">
    {limitationText}
  </p>
</div>
```

---

## 12. MOBILE PATTERNS

### Content priority on mobile

The three-column `SectionAnchor + content` layout collapses to:
1. Page title
2. `<select>` jump-to-section dropdown (SectionAnchor mobile form)
3. Full content, single column

The audience navigator 3×3 grid collapses to 2×N.

Stat strip 4-column collapses to 2×2.

ProcessFlow horizontal sequence collapses to vertical numbered list.

Footer 4-column collapses to 2×2, then 1×N on small mobile.

### Touch target enforcement

```tsx
// Every link in nav, footer, audience cards must be min 44px tall:
className="min-h-[44px] flex items-center"
```

### No horizontal scroll

No element may cause horizontal overflow on mobile. SVG diagrams use `viewBox` and `width="100%"` — they are never fixed pixel width. ProcessFlow on mobile is vertical, never horizontal scroll.

---

## 13. shadcn/ui CONFIGURATION

### Install command

```bash
npx shadcn@latest init
```

Configuration (`components.json`):
```json
{
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "rsc": true,
  "tsx": true,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Theming overrides

Map shadcn CSS variables to our design tokens in `globals.css`:

```css
:root {
  --background: 220 14% 6%;        /* #0D1117 */
  --foreground: 210 40% 90%;       /* #E6EDF3 */
  --card: 215 12% 10%;             /* #161B22 */
  --card-foreground: 210 40% 90%;
  --border: 215 14% 20%;          /* zinc-800/50 approximation */
  --input: 215 14% 16%;           /* #1F2937 */
  --primary: 158 100% 25%;        /* #007F4E accent-green */
  --primary-foreground: 210 40% 90%;
  --muted: 215 12% 10%;
  --muted-foreground: 217 10% 55%; /* #8B949E */
  --accent: 215 12% 14%;
  --accent-foreground: 210 40% 90%;
  --radius: 0.25rem;               /* 4px — matches rounded-sm */
}
```

### Components to install

```bash
npx shadcn@latest add accordion
npx shadcn@latest add navigation-menu
npx shadcn@latest add sheet
npx shadcn@latest add tabs
npx shadcn@latest add scroll-area
```

After install: review each generated component file and verify border radius is `rounded-sm` (4px). shadcn defaults to `rounded-md` — override every instance.

---

## 14. DESIGN REVIEW GATE

Before any website component is merged, it must pass:

```
Typography check:
  ✓ Only font-heading, font-body, font-mono used
  ✓ Only text-t* or text-display-* tokens (no text-sm, text-base, etc.)
  ✓ All numeric values use font-mono + tabular-nums
  ✓ Prose text constrained to max-w-3xl or max-w-prose

Color check:
  ✓ No raw hex values
  ✓ No bg-white, bg-gray-*, bg-slate-*
  ✓ No text-gray-*, text-white
  ✓ No purple-*, violet-*, indigo-*
  ✓ accent-green used only for CTAs, verified states, active indicators

Spacing check:
  ✓ No arbitrary spacing values not in the spacing system
  ✓ Major sections use py-16 or py-24
  ✓ Cards use p-6 (website) not p-3 (dashboard)

Border/radius check:
  ✓ No rounded-md, rounded-lg, rounded-xl
  ✓ Cards and panels: rounded-sm only
  ✓ Badges: rounded-[2px] only
  ✓ No shadow-*

Animation check:
  ✓ prefers-reduced-motion handled
  ✓ No duration-200 or higher
  ✓ No hover:scale-*, hover:shadow-*

Content check:
  ✓ No placeholder text
  ✓ No banned vocabulary (revolutionary, game-changing, etc.)
  ✓ All claims verifiable
  ✓ No stock photography
```
