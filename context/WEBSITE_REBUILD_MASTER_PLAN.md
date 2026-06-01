# UmojaHub — Website Rebuild Master Plan
**Phase**: Execution
**Source of truth**: `context/WEBSITE_INFORMATION_ARCHITECTURE.md`
**Design system**: `context/WEBSITE_DESIGN_SYSTEM.md`
**Status**: Authoritative implementation specification

---

## PART 1 — DESIGN RESEARCH AUDIT

### Why Premium Websites Feel Premium

Before specifying a single component, the following analysis documents exactly what separates reference-class websites from template websites. Every implementation decision in this plan derives from this analysis.

---

#### Stripe

**What Stripe does that others do not:**
Stripe treats every visitor as technically literate. It explains how their payment infrastructure works — routing, fraud detection, webhook architecture — without hiding behind marketing language. The trust comes from the specificity. When Stripe says "99.999% uptime," it links to a live status page with incident history. When it explains fraud detection, it shows the actual decision tree.

**Typography**: Large, confident headlines — 56–72px — with precise line-height control. Body text is 17–18px with generous line-height for readability at depth. No metric is ever a round number: "135+ currencies," "$640 billion processed," not "hundreds of currencies" or "billions processed."

**Visuals**: Every graphic is the actual product. No concept art. No abstract illustrations representing "security" or "scale." Screenshots of the actual dashboard. Diagrams of the actual API flow. Code examples that work.

**What we take from Stripe**: Specificity as trust. Real numbers. Product as the visual. Technical depth without jargon. Every claim backed by something verifiable.

---

#### Ramp

**What Ramp does that others do not:**
Ramp's homepage leads with a specific claim — "Businesses save an average of 5% with Ramp" — and immediately shows the product that produces that outcome. There is zero gap between claim and evidence. The visual language communicates precision: monospaced numbers, data tables, real transaction amounts (not "KES X,000").

**Typography**: Extremely tight tracking on display headings. Numeric values always in a distinct weight/family from prose. The hierarchy is data → explanation, not explanation → data.

**Structural decisions**: The navigation reveals depth without overwhelming. A mega-menu shows all product areas but structures them by task, not by product name. The visitor can navigate by what they want to accomplish, not by memorizing product taxonomy.

**What we take from Ramp**: Data-first hierarchy. Monospaced metrics. Navigation organized by visitor intent. No round numbers. Evidence before explanation.

---

#### Linear

**What Linear does that others do not:**
Linear's website communicates speed and intentionality through every design decision. The typography is selected for precision. The copy is dense — more words per section than any competitor — but never wasteful. Every sentence earns its place. The product is shown in context: not a screenshot of the interface, but the interface solving a real problem for a real team.

**Motion**: Linear uses subtle, purposeful animation. The interface demos animate exactly as the product does — not faster, not slower. The motion communicates authenticity.

**Depth**: Feature pages are long. FAQ sections are exhaustive. The visitor is trusted to read. Linear does not optimize for attention spans — it optimizes for the visitor who will become a power user.

**What we take from Linear**: Trust the reader. Dense, precise copy. Animation that matches product reality. Feature pages that are genuinely exhaustive.

---

#### Vercel

**What Vercel does that others do not:**
Vercel explains infrastructure concepts — edge functions, ISR, serverless — in language that developers understand without condescension. The documentation and marketing website are philosophically unified: both treat the visitor as capable.

**Structural decisions**: The navigation has a clear hierarchy: Products → Solutions → Resources → Enterprise. "Solutions" is organized by use case, not by feature. A visitor looking to deploy a Next.js app finds it under "Framework" — not under "Products > Build > Compilation > Output."

**Trust signals**: Real performance metrics from real deployments. Actual build time graphs. Named customers with specific, attributed claims — not "Company X saves time" but "Company X deploys 400 times per day."

**What we take from Vercel**: Navigation organized by use case. Infrastructure trust through real metrics. Named, specific claims.

---

#### Notion

**What Notion does that others do not:**
Notion's marketing website is essentially a public template gallery. The product is explained not through abstract features but through real use cases: "A startup uses this to manage their roadmap. Here is their actual template." This makes the abstract concrete.

**Depth per audience**: Every major use case (engineering, product, HR, education) gets its own dedicated page with specific workflow explanations, real templates, and precise descriptions of outcomes.

**What we take from Notion**: Audience-specific pages with real workflows, not feature lists. Concrete examples before abstract claims.

---

#### GitHub

**What GitHub does that others do not:**
GitHub's numbers are the product. "100 million developers." "420 million repositories." These are not aspirational — they are facts. The website's job is to contextualize what these facts mean for the visitor.

Navigation organizes by: who you are (individual, team, enterprise), then by what you want to do (collaborate, automate, secure). The audience segmentation happens before the feature explanation.

**What we take from GitHub**: Audience segmentation in navigation. Numbers as product proof. Community as trust signal.

---

#### Anthropic

**What Anthropic does that others do not:**
Anthropic's website communicates intellectual credibility above everything else. The typography choices, the density of research publication links, the precision of language — all of it signals that the people behind this product think carefully. The website never oversells. It often undersells. This builds extraordinary trust.

**What we take from Anthropic**: Understatement as trust. Research citations where claims exist. Intellectual rigor visible in the copy itself.

---

### Translation to UmojaHub Implementation Decisions

| Reference insight | UmojaHub decision |
|---|---|
| Stripe: Specificity as trust | Every statistic on the site is a live count from the platform API — no rounded numbers, no projections |
| Stripe: Product as visual | Annotated screenshots of the actual platform, not concept illustrations |
| Ramp: Data-first hierarchy | Platform statistics appear before feature descriptions on every section |
| Ramp: Navigation by intent | Primary nav organized by audience type, not by product area |
| Linear: Trust the reader | All audience pages are long-form. No character limits on section copy. No artificial truncation. |
| Linear: Authentic animation | Workflow animations match actual platform interaction speed and sequence |
| Vercel: Use-case navigation | "For Farmers," "For Buyers," "For Students" — not "Marketplace," "Education," "Payments" |
| Notion: Concrete examples before abstraction | Every workflow section leads with what the user actually does, not what the feature is called |
| GitHub: Numbers as product | Verified farmer count, transaction count, county coverage — displayed before any feature description |
| Anthropic: Understatement | No "revolutionary," "game-changing," "world-class." Accurate language only. |

---

## PART 2 — WEBSITE ARCHITECTURE MAP

### Route Hierarchy

```
/ (Homepage)
├── /how-it-works
├── /for
│   ├── /for/farmers
│   ├── /for/buyers
│   ├── /for/suppliers
│   ├── /for/students
│   ├── /for/lecturers
│   ├── /for/employers
│   ├── /for/institutions
│   ├── /for/ngos
│   └── /for/cooperatives
├── /trust
├── /marketplace (existing — audit and extend)
├── /knowledge (existing — audit and extend)
├── /education
├── /about
├── /transparency
├── /faq
├── /security
├── /help
│   ├── /help/getting-started
│   ├── /help/farmers
│   ├── /help/buyers
│   ├── /help/students
│   ├── /help/lecturers
│   ├── /help/payments
│   └── /help/accounts
├── /legal
│   ├── /legal/terms
│   └── /legal/privacy
└── /status (health check redirect or status page)
```

### File system layout

All website pages live under `src/app/(website)/`. The `(website)` route group shares the website layout (nav + footer) and is distinct from `src/app/dashboard/` (the application) and `src/app/auth/` (auth flows).

```
src/app/(website)/
├── layout.tsx                  ← WebsiteLayout: nav + footer
├── page.tsx                    ← Homepage (rebuild)
├── how-it-works/page.tsx
├── for/
│   ├── farmers/page.tsx
│   ├── buyers/page.tsx
│   ├── suppliers/page.tsx
│   ├── students/page.tsx
│   ├── lecturers/page.tsx
│   ├── employers/page.tsx
│   ├── institutions/page.tsx
│   ├── ngos/page.tsx
│   └── cooperatives/page.tsx
├── trust/page.tsx
├── education/page.tsx
├── about/page.tsx
├── transparency/page.tsx
├── faq/page.tsx
├── security/page.tsx
├── help/
│   ├── page.tsx
│   ├── getting-started/page.tsx
│   ├── farmers/page.tsx
│   ├── buyers/page.tsx
│   ├── students/page.tsx
│   ├── lecturers/page.tsx
│   ├── payments/page.tsx
│   └── accounts/page.tsx
└── legal/
    ├── terms/page.tsx
    └── privacy/page.tsx

src/components/website/
├── WebsiteNav.tsx
├── WebsiteFooter.tsx
├── ProcessFlow.tsx             ← Reusable step-by-step workflow component
├── AudienceCard.tsx            ← Audience navigator card
├── StatStrip.tsx               ← Live platform statistics
├── TrustPillar.tsx             ← Trust system explanation component
├── FaqAccordion.tsx            ← FAQ with shadcn Accordion
├── SectionAnchor.tsx           ← Anchor navigation sidebar
├── AudiencePage.tsx            ← Shared layout for all /for/* pages
└── DiagramBlock.tsx            ← Wrapper for SVG process diagrams
```

**Critical**: The existing `src/app/page.tsx` (root landing page) is replaced by the `(website)` route group. The root `layout.tsx` changes to use the website layout by default for public routes.

---

## PART 3 — PAGE HIERARCHY AND SECTION INVENTORY

### Homepage (`/`)

Every section is a named component. Order is fixed.

1. `<WebsiteNav />` — persistent, no scroll hide
2. `<HeroPlatformStatement />` — platform truth statement, no tagline
3. `<AudienceNavigator />` — 9-card grid linking to /for/* pages
4. `<LivePlatformStats />` — live counts from `/api/transparency` (SSR)
5. `<MarketplaceFlowSection />` — how the marketplace works (5-step process flow)
6. `<EducationFlowSection />` — how the education hub works (6-step process flow)
7. `<TrustArchitectureSection />` — verification philosophy, links to /trust
8. `<PlatformCoverageSection />` — county coverage, M-Pesa integration fact
9. `<WebsiteFooter />` — full link grid

### `/for/farmers` (representative — all audience pages follow same structure)

1. `<AudienceHero />` — who this page is for, one precise sentence
2. `<SectionAnchor />` — sidebar TOC with jump links (sticky on desktop)
3. `<ProblemsSection />` — each problem as a named subsection with explanation
4. `<CapabilitiesSection />` — every activity available, numbered exhaustively
5. `<LifecycleSection />` — stage-by-stage lifecycle with visual stages
6. `<TrustScoreSection />` — trust score components explained precisely
7. `<VerificationSection />` — verification process step by step
8. `<ResponsibilitiesSection />` — what farmers must do
9. `<FAQSection />` — all farmer FAQs (full text, no truncation)
10. `<MisconceptionsSection />` — common misunderstandings corrected
11. `<FirstStepsSection />` — exactly what to do next, with links
12. `<AudienceCTA />` — register link (tertiary, not dominant)

### `/trust`

1. `<TrustPhilosophySection />` — why UmojaHub requires verification
2. `<FarmerVerificationSection />` — step-by-step with status diagram
3. `<SupplierVerificationSection />`
4. `<LecturerVerificationSection />`
5. `<EducationVerificationSection />` — three documents + peer + lecturer
6. `<TrustScoreMethodologySection />` — four components, weights, recalculation events
7. `<TrustLimitationsSection />` — what verification does NOT claim
8. `<ReportingConcernSection />` — contact for fraud reports

### `/how-it-works`

1. `<TwoHubsExplained />` — what each hub does, why they coexist
2. `<MarketplaceCompleteWorkflow />` — full lifecycle, every state
3. `<EducationCompleteWorkflow />` — full lifecycle, every state
4. `<PaymentSystemSection />` — M-Pesa STK Push explained precisely
5. `<VerificationSystemOverview />` — all three verification types
6. `<TrustScoreOverview />` — four components, tier thresholds
7. `<DataPrivacySection />` — what is collected, what is visible, what is private

### `/transparency`

1. `<LiveImpactMetrics />` — live counts from platform API
2. `<WhatWeTrack />` — metrics defined
3. `<WhatWeDoNotTrack />` — explicit disclosure
4. `<InfrastructureTransparency />` — providers named publicly
5. `<ServiceStatus />` — uptime, health endpoint link

---

## PART 4 — TECHNICAL IMPLEMENTATION REQUIREMENTS

### Route Group Architecture

The `(website)` route group must:
- Have its own `layout.tsx` with `<WebsiteNav />` and `<WebsiteFooter />`
- NOT share the dashboard `<Sidebar />` or `<LayoutWrapper />`
- NOT require authentication for any page
- Use `export const dynamic = 'force-static'` on pages with no live data
- Use `export const revalidate = 300` on pages that pull live platform stats (5-minute ISR)

The existing root `src/app/page.tsx` moves into `src/app/(website)/page.tsx`. The root `layout.tsx` should not contain dashboard chrome.

### Data Fetching for Live Stats

The `/api/admin/impact-summary` endpoint returns live platform metrics. The website's `<LivePlatformStats />` and `/transparency` page fetch from this at build time with 5-minute ISR revalidation. No client-side fetching — SSR/ISR only for these values.

A new public endpoint is required: `GET /api/transparency` — returns impact metrics without authentication. This is distinct from `/api/admin/impact-summary` which requires ADMIN role. The new endpoint returns only the publicly safe subset: verified farmer count, county count, completed order count, verified student project count, knowledge article count.

### Anchor Navigation

Long-form audience pages (`/for/*`, `/trust`, `/how-it-works`) must have an in-page table of contents that:
- Renders as a sticky sidebar on screens ≥ 1280px
- Renders as a dropdown anchor menu at the top of content on screens < 1280px
- Uses `IntersectionObserver` to highlight the currently visible section
- Anchors use slugified section IDs: `#verification-process`, `#trust-score`, `#faq`

### shadcn/ui Integration

Install and configure shadcn/ui for:
- `Accordion` — FAQs on all audience pages and `/faq`
- `NavigationMenu` — main website nav with audience mega-menu
- `Sheet` — mobile navigation drawer
- `Tabs` — audience content switching on `/how-it-works`
- `ScrollArea` — anchor navigation sidebar

All shadcn components must be themed via `components.json` to use the existing CSS custom properties (`--surface-primary`, `--accent-green`, etc.). No shadcn default styling should be visible.

### Typography Extensions for Website

The dashboard type scale (`text-t1` through `text-t6`) is insufficient for marketing display sizes. Add website-specific tokens to `tailwind.config.ts`:

```
text-display-xl  →  64px / line-height: 68px  (hero headline)
text-display-lg  →  48px / line-height: 52px  (section headline)
text-display-md  →  36px / line-height: 42px  (subsection headline)
text-display-sm  →  28px / line-height: 36px  (card headline)
```

These tokens are website-only. Dashboard components must never use them.

### Content Width Architecture

Website pages use a three-width system:
- Full bleed: `w-full` — background sections, dividers
- Container: `max-w-7xl mx-auto px-6` — section wrappers, nav, footer
- Reading width: `max-w-3xl` — all prose content (explanations, FAQs, lifecycle descriptions)

No marketing section should force the visitor to read lines longer than 75 characters. All paragraph text is constrained to `max-w-3xl`.

---

## PART 5 — SECTION COMPONENT SPECIFICATIONS

### `<WebsiteNav />`

**Behavior**: Persistent. Transparent on scroll top, gains `bg-surface-primary border-b border-zinc-800/50` on scroll > 20px. No collapse on scroll.

**Structure**:
```
[Logo]   [How It Works] [For You ▼] [Marketplace] [Knowledge]   [Sign in] [Get started →]
```

**For You dropdown** (NavigationMenu):
- Organized in two columns: Food Security Hub | Education Hub
- Food Security: Farmers, Buyers, Suppliers, Cooperatives
- Education: Students, Lecturers, Employers, Institutions, NGOs
- Bottom row: Trust & Verification, About, Transparency

**Mobile** (< 768px): hamburger → Sheet opens full-height drawer with same link structure in vertical list.

**Logo**: `UmojaHub` — wordmark only, same as existing. No icon change.

### `<WebsiteFooter />`

**Four-column link grid** on desktop, two-column on tablet, single column on mobile.

Column 1 — Platform:
- Marketplace, Knowledge Hub, Education Hub, How It Works

Column 2 — For You:
- Farmers, Buyers, Suppliers, Students, Lecturers, Employers, Institutions, NGOs, Cooperatives

Column 3 — Company:
- About, Transparency, Trust & Verification, Security

Column 4 — Support:
- Help Center, FAQ, Terms of Service, Privacy Policy

Bottom bar: copyright, platform version (not shown if sensitive), last deploy date.

### `<ProcessFlow steps={[]} />`

Reusable component for every workflow diagram on the site. Props: `steps: { actor: string; action: string; detail: string; }[]`. Renders as:
- Desktop: horizontal numbered sequence with connecting lines
- Mobile: vertical numbered list
- Each step: step number (monospace), actor label (small caps), action (heading weight), detail (body)

### `<LivePlatformStats />`

Fetches from `/api/transparency` at SSR time. Renders a 4-column stat strip:

| Verified Farmers | Counties Represented | Completed Orders | Verified Projects |
|---|---|---|---|
| `{n}` | `{n}` | `{n}` | `{n}` |

All values are monospace, `tabular-nums`. Labels are uppercase tracking-widest mono. No icons. No decorative elements. If the API is unreachable, the section renders with `—` placeholders and does not error.

### `<FaqAccordion items={[]} />`

Uses shadcn Accordion themed to design system. Each item:
- Trigger: `text-t4 font-body text-text-primary` question text
- Content: Full answer, `text-t4 font-body text-text-secondary`, prose width, no truncation
- No item is closed by default — all start closed, user opens individually
- No "show more" within an FAQ item

### `<SectionAnchor sections={[]} />`

Sticky sidebar TOC on desktop. Sections prop: `{ id: string; label: string }[]`. 

- Width: `w-48` fixed
- Position: `sticky top-24` on a `lg:col-span-1` column
- Current section: `text-text-primary` + left border `border-l-2 border-accent-green`
- Other sections: `text-text-disabled hover:text-text-secondary`
- On mobile: collapses to a `<select>` dropdown at top of content area

---

## PART 6 — ASSET REQUIREMENTS

### SVG Process Diagrams (custom-built, inline SVG)

These must be built as React components using SVG. No external diagram tools. No screenshots of Figma diagrams.

1. **`MarketplaceFlowDiagram`** — 5 nodes: Farmer Registers → Farmer Lists → Buyer Browses → Buyer Pays → Farmer Fulfills. Each node: actor label, action label, connecting arrow.

2. **`EducationFlowDiagram`** — 7 nodes: Student Registers → Track Selected → Brief Generated → Documents Submitted → Peer Review → Lecturer Review → Portfolio Updated.

3. **`MPesaPaymentFlow`** — 5 nodes, two actors (Buyer phone, Safaricom, Platform): Order Placed → STK Push Sent → PIN Entered → Safaricom Confirms → Order Updates.

4. **`FarmerVerificationFlow`** — 5 states: Unsubmitted → Pending → Under Review → Approved / Rejected.

5. **`TrustScoreComponents`** — 4 horizontal bars showing components and max values: Verification (40), Transactions (25), Ratings (20), Reliability (15).

6. **`TrustTierLadder`** — 4 rungs: NEW 0–39 → ESTABLISHED 40–59 → TRUSTED 60–79 → PREMIUM 80–100.

7. **`EducationDocumentStructure`** — 3 cards: Breakdown, Plan, Reflection. Each card shows what it demonstrates.

8. **`LecturerReviewDimensions`** — 4 boxes: Clarity, Methodology, Documentation, Reflection. Each labeled with what it assesses.

9. **`CooperativeOrderFlow`** — Group forms → Order proposed → Members join → Minimum met → Supplier fulfills.

10. **`PriceAlertFlow`** — Alert set → Cron runs → Threshold crossed → SMS fired.

### Annotated Screenshots (actual platform, captured and annotated in SVG overlay)

These require the platform to be running with real data:

1. Marketplace listing card — annotate: Trust Tier badge, verified badge, price, quantity, harvest date
2. Listing detail page — annotate: trust score position, farmer profile link, order button
3. Trust Score panel (farmer dashboard) — annotate: each component bar, current tier
4. Price Intelligence dashboard — annotate: benchmark comparison, platform premium indicator
5. Student portfolio entry — annotate: verification status, date, brief type, skills
6. AI Farm Assistant interface — annotate: weather context indicator, session continuity

### No Stock Photography Policy

Stated explicitly: zero stock photography on any website page. Options in order of preference:
1. Real photographs of actual farmers, buyers, students using the platform (future asset)
2. Illustrated vignettes consistent with design system (acceptable substitute at launch)
3. Abstract typographic treatments (acceptable alternative to photography)
4. Nothing (preferred over stock photography)

If photography is not available at launch, photography slots are replaced with data visualizations or process diagrams.

---

## PART 7 — MOTION REQUIREMENTS

### Principles

All animation is functional. It communicates state change, sequence, or hierarchy. It never communicates energy, excitement, or brand personality.

`prefers-reduced-motion: reduce` must disable all animation globally. Test this before launch.

### Permitted Animations

**Process flow step activation** (ProcessFlow component): Steps activate sequentially on scroll entry. Each step fades in with `opacity-0 → opacity-100` + `translateY(8px) → translateY(0)`. Duration: 200ms. Delay between steps: 100ms.

**Stat strip number reveal** (LivePlatformStats): On first viewport entry only, numbers count up from 0 to actual value over 800ms using `requestAnimationFrame`. Never loops. Never replays on re-scroll. Disabled with `prefers-reduced-motion`.

**Anchor nav active indicator**: `border-l-2 border-accent-green` slides between sections using CSS `transition-all duration-150`. Not a reflow — only the opacity/color changes.

**FAQ accordion**: shadcn Accordion default animation (height transition). Customize to `duration-150` only.

**Nav scroll state**: Background and border appearance on scroll uses `transition-all duration-150`. No layout shift.

### Banned Animations

- Hero section entrance animations (the hero loads instantly — no fade-in)
- Parallax scrolling
- Hover scale transforms
- Anything that loops
- Page transition animations
- Loading spinners (use skeleton patterns)

---

## PART 8 — ACCESSIBILITY REQUIREMENTS

Every website page must pass WCAG 2.1 AA before launch.

### Specific requirements

**Color contrast**: All body text (`text-text-secondary` = `#8B949E` on `#0D1117`) must pass 4.5:1 minimum. Verify with Colour Contrast Analyser before each page ships.

**Keyboard navigation**: Every interactive element reachable by Tab. Focus states visible with `ring-1 ring-accent-green`. Skip-to-content link at top of every page: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`.

**Anchor navigation**: All section IDs are unique per page. `<section id="..." aria-labelledby="section-heading-id">` pattern used throughout.

**FAQ accordion**: `aria-expanded`, `aria-controls`, `role="region"` applied correctly via shadcn Accordion. Do not override these attributes.

**Process diagrams**: SVG diagrams must have `role="img"` and `<title>` + `<desc>` elements describing the diagram content.

**Annotated screenshots**: Annotations must be readable by screen readers (`aria-describedby` linking image to annotation list).

**Mobile touch targets**: All interactive elements minimum 44×44px.

**Language**: `<html lang="en">` set in root layout.

---

## PART 9 — PERFORMANCE REQUIREMENTS

### Targets (measured with Lighthouse on production, 4G throttle)

| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| FCP (First Contentful Paint) | < 1.8s |
| TTI (Time to Interactive) | < 3.5s |
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |

### Implementation rules

**No client-side JavaScript for content**: All audience pages, trust pages, how-it-works are fully static or ISR. No `useEffect` fetching on marketing pages.

**Font loading**: Sora, IBM Plex Sans, JetBrains Mono loaded via `next/font/google` with `display: swap`. Preload only the weights used (600 for Sora, 400+500 for IBM Plex Sans, 400+600 for JetBrains Mono).

**Images**: All product screenshots served as `next/image` with explicit `width` and `height`. SVG diagrams are inline — no image requests.

**No third-party scripts on marketing pages**: No analytics, no chat widgets, no tracking pixels on any page until the user registers. Only after registration does any tracking apply.

**Bundle splitting**: Website components (`src/components/website/`) must not import dashboard components. The website bundle must not contain dashboard code.

---

## PART 10 — SEO REQUIREMENTS

### Per-page metadata (implemented via Next.js `generateMetadata`)

Every page exports a `generateMetadata` function. Never use static `<title>` tags.

| Page | Title pattern | Description |
|---|---|---|
| Homepage | `UmojaHub — Verified Agricultural Marketplace for East Africa` | 155 chars max, describes both hubs |
| /for/farmers | `For Farmers — UmojaHub` | Describes what farmers can do |
| /for/students | `For Students — UmojaHub` | Education Hub for CS students |
| /trust | `Trust & Verification — UmojaHub` | Verification methodology |
| /how-it-works | `How UmojaHub Works` | Platform mechanics |

### Structural SEO

- `<h1>` — exactly one per page, describes the page precisely
- `<h2>` — major sections
- `<h3>` — subsections
- No heading skips (h1 → h3 without h2)
- `<main id="main-content">` wraps all page content (for skip links and landmark navigation)
- `<nav aria-label="Main navigation">` for WebsiteNav
- `<footer>` semantic element for WebsiteFooter
- Canonical URLs via Next.js metadata API

### Open Graph

Every page has OG title, OG description, OG image. OG image is a static PNG generated once showing the UmojaHub wordmark and page title on `bg-surface-primary`. Not dynamically generated per page — a single branded template per section.

### Sitemap

`src/app/sitemap.ts` generates a sitemap including all website routes. Excludes dashboard routes, API routes, and auth routes.

---

## PART 11 — CONTENT IMPLEMENTATION REQUIREMENTS

### Copy rules

These apply to every sentence written for any website page:

1. No sentence may contain "revolutionary," "game-changing," "world-class," "transforming," "empowering," "disrupting," "seamless," "cutting-edge," "robust," "scalable," or "ecosystem"
2. Every claim must be verifiable from the platform's actual capabilities. If the feature does not exist in production, do not mention it.
3. Numbers are exact: `47 verified farmers` not `50+ farmers`. Pull from the live platform stats.
4. Passive voice is permitted when it is clearer than active voice. Grammar serves clarity, not style.
5. FAQ answers must fully answer the question. If the answer is long, it remains long. No truncation.
6. Lifecycle descriptions are sequential and complete. If there are 14 stages, document all 14.

### Prohibited content (enforced in code review)

- Testimonials (real or fabricated)
- Social proof elements not backed by verified platform data
- Before/after comparisons that are not verifiable
- Any section that exists purely to build excitement

### Writing format

Body copy: short paragraphs (3–5 sentences max). But sections are NOT short — multiple paragraphs per concept is expected and required.

Lists: used for activities, lifecycle stages, and FAQ answers. Never used as a substitute for prose explanation.

### Copy sources

All factual claims about platform capabilities derive from the codebase and the IA document. The copywriter does not invent capabilities. The IA document is the ceiling of what can be claimed.

---

## PART 12 — TRUST-BUILDING REQUIREMENTS

Trust is not built through design alone. The following requirements are non-negotiable:

**Verification transparency**: Every verification page explains what administrators check, what they do not check, and what verification does not guarantee. Hiding limitations destroys trust faster than disclosing them.

**Live statistics**: Static numbers decay and lose credibility. The platform statistics section pulls from a live API at build time (ISR, 5-minute revalidation). The timestamp of the last update is displayed next to the statistics.

**No promises**: The website does not promise that farmers will receive orders, that students will get jobs, or that buyers will find specific produce. It describes what the platform enables, not what outcomes it guarantees.

**Contact information**: A real contact email or form exists on the About page. Not a placeholder. If a visitor has a question the website did not answer, they have a path to ask it.

**Error pages**: `404.tsx` and `error.tsx` must be designed with the same care as landing pages. A broken page is a trust signal.

---

## PART 13 — RESPONSIVE DESIGN REQUIREMENTS

### Breakpoint system

Use Tailwind's default breakpoints. Three primary targets:

| Target | Breakpoint | Key differences |
|---|---|---|
| Mobile | < 768px | Single column, full-width sections, SectionAnchor as dropdown |
| Tablet | 768px–1279px | Two-column sections, ProcessFlow vertical |
| Desktop | ≥ 1280px | Three-column with SectionAnchor sidebar, ProcessFlow horizontal |

### Mobile-specific rules

- ProcessFlow renders vertical on mobile — never horizontal scroll
- WebsiteNav collapses to Sheet on mobile
- Stat strip: 2×2 grid on mobile (4 stats), not horizontal
- Audience navigator: 2×2 or 3×3 grid depending on count — never 1-column list
- FAQ accordion: same width as prose content — full width on mobile
- SectionAnchor: `<select>` dropdown on mobile, not sidebar

### Typography scaling

Website display tokens scale down on mobile:

| Token | Desktop | Mobile |
|---|---|---|
| `text-display-xl` | 64px | 40px |
| `text-display-lg` | 48px | 32px |
| `text-display-md` | 36px | 28px |

Implement via: `text-[40px] lg:text-[64px]` for responsive display sizes.

---

## PART 14 — ANALYTICS REQUIREMENTS

Analytics only after user consent (if applicable under Kenya Data Protection Act 2019). 

At minimum, the following events are tracked when analytics is active:
- Page view per route
- Audience page viewed (which `/for/*` page)
- FAQ item opened (which question)
- Register CTA clicked (from which page)
- Marketplace link clicked from website

No analytics on legal pages, help center, or security page.

Implementation: `src/lib/analytics.ts` — wrapper around whatever analytics provider is chosen. All tracking calls go through this wrapper so the provider can be swapped without touching component code.

---

## PART 15 — LAUNCH CHECKLIST

### Technical

- [ ] All pages pass `npm run type-check`
- [ ] All pages pass `npm run lint`
- [ ] No `any` types in website components
- [ ] `npm run build` completes without error
- [ ] `/api/transparency` endpoint exists and returns correct data without auth
- [ ] All links on all pages are valid (no 404s on internal links)
- [ ] `sitemap.ts` includes all website routes
- [ ] `robots.txt` excludes dashboard and API routes
- [ ] OG images exist for homepage and major pages
- [ ] `prefers-reduced-motion` disables all animation
- [ ] Skip-to-content link works on every page
- [ ] All SVG diagrams have accessible `<title>` and `<desc>`

### Performance

- [ ] Lighthouse Performance ≥ 90 on 4G throttle (homepage)
- [ ] Lighthouse Accessibility ≥ 95 (homepage and /trust)
- [ ] LCP < 2.5s on homepage
- [ ] CLS < 0.1 on all pages (font swap must not shift layout)
- [ ] No render-blocking resources on marketing pages

### Content

- [ ] Every claim is verifiable from platform capabilities
- [ ] No placeholder text anywhere
- [ ] No TODO comments in page content
- [ ] All FAQ questions have complete answers
- [ ] All audience lifecycles are complete (no truncated stages)
- [ ] Live platform stats reflect real data
- [ ] Contact email/form on About page is functional

### Design

- [ ] Design system tokens used correctly on every page (no raw hex values)
- [ ] No banned Tailwind classes (`rounded-md`, `text-sm`, etc.)
- [ ] No stock photography
- [ ] All SVG diagrams render correctly on mobile
- [ ] WebsiteNav appears correctly at all three breakpoints
- [ ] Audience pages have working anchor navigation

---

## PART 16 — QUALITY CHECKLIST (per page, before merging)

- [ ] Page renders without JS (progressive enhancement)
- [ ] All links work
- [ ] Anchor navigation links to correct sections
- [ ] FAQ accordion opens and closes correctly
- [ ] Mobile layout reviewed at 375px width
- [ ] Tablet layout reviewed at 768px width
- [ ] Long-form content reviewed at reading width (max-w-3xl constraint present)
- [ ] Typography uses only defined tokens
- [ ] No console errors
- [ ] Page metadata (`generateMetadata`) returns correct title and description

---

## PART 17 — DESIGN REVIEW CHECKLIST

Before any page is merged, it is reviewed against:

- [ ] Does this page match the IA document for this route?
- [ ] Does every section exist that the IA specifies?
- [ ] Is any section present that the IA says must NOT be present?
- [ ] Are all claims within the bounds of actual platform capabilities?
- [ ] Does the page trust the reader (no information hidden, no truncation without reason)?
- [ ] Does the page pass the 7 content review criteria from the IA document?
- [ ] Is animation disabled when `prefers-reduced-motion` is set?
- [ ] Would this page embarrass the platform if it appeared in a journalist's article?

---

## PART 18 — DEFINITION OF DONE

A website page is done when:

1. It is deployed to production (not preview)
2. It passes the Quality Checklist
3. It passes the Design Review Checklist
4. It is included in the sitemap
5. It has correct metadata
6. It has no placeholder content
7. It has been reviewed on mobile, tablet, and desktop
8. Accessibility score ≥ 95 on that page

The website is done when all pages in the route hierarchy are done.

---

## PART 19 — IMPLEMENTATION TASK BACKLOG

Tasks are ordered by dependency. No task should begin before its prerequisites are complete.

### Sprint 0 — Infrastructure (Prerequisite for everything)

**T0-1**: Add website display type tokens to `tailwind.config.ts`
(`text-display-xl`, `text-display-lg`, `text-display-md`, `text-display-sm`)
Prereq: none | Effort: 30 min

**T0-2**: Install and configure shadcn/ui
(`npx shadcn@latest init` with custom theme matching design tokens)
Components: Accordion, NavigationMenu, Sheet, Tabs, ScrollArea
Prereq: none | Effort: 1 hour

**T0-3**: Create `(website)` route group with shared layout
`src/app/(website)/layout.tsx` — WebsiteNav + main + WebsiteFooter
Move existing `src/app/page.tsx` to `src/app/(website)/page.tsx`
Prereq: T0-1, T0-2 | Effort: 1 hour

**T0-4**: Create `GET /api/transparency` public endpoint
Returns: `{ verifiedFarmers, counties, completedOrders, verifiedProjects, articles, lastUpdated }`
No auth required. Used by website for live stats.
Prereq: none | Effort: 1 hour

**T0-5**: Build `<WebsiteNav />` component
Desktop nav with NavigationMenu audience dropdown. Mobile nav with Sheet.
Prereq: T0-2, T0-3 | Effort: 3 hours

**T0-6**: Build `<WebsiteFooter />` component
Four-column link grid, responsive collapse, copyright.
Prereq: T0-3 | Effort: 1.5 hours

**T0-7**: Build `<ProcessFlow />` reusable component
Props: steps array. Horizontal on desktop, vertical on mobile.
Prereq: T0-1 | Effort: 2 hours

**T0-8**: Build `<SectionAnchor />` reusable component
Sticky sidebar on desktop, select dropdown on mobile. IntersectionObserver for active state.
Prereq: T0-2 | Effort: 2 hours

**T0-9**: Build `<FaqAccordion />` component
shadcn Accordion themed to design system. No truncation.
Prereq: T0-2 | Effort: 1 hour

**T0-10**: Build `<LivePlatformStats />` component
Fetches from `/api/transparency`. Count-up animation (respects prefers-reduced-motion).
Prereq: T0-4 | Effort: 1.5 hours

### Sprint 1 — Homepage Rebuild

**T1-1**: `<HeroPlatformStatement />` section
Platform truth statement. No tagline. Display-xl headline, prose body.
Prereq: T0-3 | Effort: 1 hour

**T1-2**: `<AudienceNavigator />` section
9-card grid. Each card: audience name, one-sentence description, link.
Prereq: T0-3 | Effort: 1 hour

**T1-3**: `<MarketplaceFlowSection />` section
Uses ProcessFlow. 5 steps. Links to /for/farmers, /for/buyers, /marketplace.
Prereq: T0-7 | Effort: 1 hour

**T1-4**: `<EducationFlowSection />` section
Uses ProcessFlow. 6 steps. Links to /for/students, /education.
Prereq: T0-7 | Effort: 1 hour

**T1-5**: `<TrustArchitectureSection />` section
Three columns: Farmer verification, Supplier verification, Education verification. Links to /trust.
Prereq: T0-3 | Effort: 1 hour

**T1-6**: Compose Homepage from all sections. Review and QA.
Prereq: T0-5, T0-6, T0-10, T1-1 through T1-5 | Effort: 1 hour

### Sprint 2 — Audience Pages

**T2-1**: For Farmers page (`/for/farmers`)
Full IA audience section. SectionAnchor. All subsections from IA.
Prereq: T0-7, T0-8, T0-9 | Effort: 1 day

**T2-2**: For Buyers page (`/for/buyers`)
Prereq: same | Effort: 4 hours

**T2-3**: For Students page (`/for/students`)
Prereq: same | Effort: 6 hours

**T2-4**: For Lecturers page (`/for/lecturers`)
Prereq: same | Effort: 3 hours

**T2-5**: For Employers page (`/for/employers`)
Prereq: same | Effort: 3 hours

**T2-6**: For Suppliers page (`/for/suppliers`)
Prereq: same | Effort: 2 hours

**T2-7**: For Cooperatives page (`/for/cooperatives`)
Prereq: same | Effort: 2 hours

**T2-8**: For NGOs & Government page (`/for/ngos`)
Prereq: same | Effort: 2 hours

**T2-9**: For Institutions page (`/for/institutions`)
Prereq: same | Effort: 2 hours

### Sprint 3 — System Pages

**T3-1**: Trust & Verification page (`/trust`)
Full IA trust section. All verification types. TrustScoreComponents diagram.
Prereq: T0-7, T0-8 | Effort: 6 hours

**T3-2**: How It Works page (`/how-it-works`)
Both hub workflows. Payment system. Data/privacy.
Prereq: T0-7 | Effort: 5 hours

**T3-3**: About page (`/about`)
Mission, geography, team, contact.
Prereq: T0-3 | Effort: 2 hours

**T3-4**: Transparency page (`/transparency`)
Live metrics. What we track. Infrastructure disclosure.
Prereq: T0-10 | Effort: 2 hours

**T3-5**: Education Hub explanation page (`/education`)
Public-facing explanation distinct from student operational guide.
Prereq: T0-7 | Effort: 3 hours

### Sprint 4 — Support and Legal

**T4-1**: FAQ master page (`/faq`)
All audience FAQs in one searchable page. FaqAccordion. Organized by audience.
Prereq: T0-9 | Effort: 3 hours

**T4-2**: Security page (`/security`)
What is disclosed publicly. Responsible disclosure contact.
Prereq: T0-3 | Effort: 2 hours

**T4-3**: Help Center structure (`/help` and sub-routes)
Top-level hub + per-audience operational guides.
Prereq: T0-3 | Effort: 1 day

**T4-4**: Terms of Service (`/legal/terms`)
Prereq: T0-3 | Effort: 2 hours (legal review required)

**T4-5**: Privacy Policy (`/legal/privacy`)
Kenya Data Protection Act 2019 compliance.
Prereq: T0-3 | Effort: 2 hours

### Sprint 5 — SEO, Performance, Accessibility

**T5-1**: `generateMetadata` for all pages
**T5-2**: `sitemap.ts`
**T5-3**: `robots.txt`
**T5-4**: OG images
**T5-5**: Lighthouse audit all pages — fix any failures
**T5-6**: WCAG 2.1 AA audit — fix any failures
**T5-7**: Mobile QA on real device (not just Chrome DevTools)

### Sprint 6 — SVG Diagram Library

All diagrams built as inline SVG React components in `src/components/website/diagrams/`.

**T6-1**: MarketplaceFlowDiagram
**T6-2**: EducationFlowDiagram
**T6-3**: MPesaPaymentFlow
**T6-4**: FarmerVerificationFlow
**T6-5**: TrustScoreComponents
**T6-6**: TrustTierLadder
**T6-7**: EducationDocumentStructure
**T6-8**: LecturerReviewDimensions

---

## TOTAL EFFORT ESTIMATE

| Sprint | Tasks | Estimated effort |
|---|---|---|
| Sprint 0 — Infrastructure | 10 | 15 hours |
| Sprint 1 — Homepage | 6 | 6 hours |
| Sprint 2 — Audience pages | 9 | ~25 hours |
| Sprint 3 — System pages | 5 | 18 hours |
| Sprint 4 — Support & Legal | 5 | 18 hours |
| Sprint 5 — SEO/Perf/A11y | 7 | 8 hours |
| Sprint 6 — Diagrams | 8 | 12 hours |
| **Total** | **50 tasks** | **~102 hours** |

Start with Sprint 0. Nothing else begins until T0-1 through T0-10 are complete.
