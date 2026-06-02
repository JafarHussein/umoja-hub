# UmojaHub — Website Visual System V2
**Status**: Authoritative design document. Replaces all prior visual design guidance.
**Supersedes**: `context/WEBSITE_DESIGN_SYSTEM.md`, `context/FRONTEND.md` (website sections), all Sprint planning documents' visual decisions.
**Preserves**: `context/WEBSITE_INFORMATION_ARCHITECTURE.md` in its entirety — the IA survives. The visual expression of it does not.

---

## SECTION 1 — DESIGN PHILOSOPHY

### The Central Problem Being Solved

The website's job is not to sell UmojaHub.

It is to create the conditions under which a Kenyan farmer who has never heard of the platform, a CS student weighing whether to trust a verification system with their academic record, or an employer evaluating whether a portfolio entry is genuinely meaningful — can arrive at genuine understanding. Not excitement. Not willingness to convert. Understanding.

This distinction governs every visual decision in this document. A design that makes visitors feel good about UmojaHub without understanding it has failed. A design that makes visitors understand UmojaHub but feel neutral about it has succeeded.

### What Understanding Requires

Understanding requires that:
- Information is presented in the order the mind needs it, not the order a marketing funnel needs it
- Complexity is not hidden — it is organized
- Claims are bounded by what is actually true
- The system explains its own rules
- Trust is earned through transparency, not through the aesthetics of trustworthiness

### The Aesthetic Position

UmojaHub exists in a real place doing real work with real consequences. A farmer's income depends on buyers believing their listing is legitimate. A student's employment prospects depend on employers respecting the verification mark. The platform handles actual money through an actual payment processor. These are serious things.

The visual language must match this seriousness.

**Not serious in the sense of gray and corporate.** Serious in the sense of: every decision is earned. Nothing decorates. Nothing performs. The visual system is so controlled that when something is given visual weight, it carries that weight because it deserves it.

The reference benchmark — Ramp, Stripe, Linear, Notion, Figma, Vercel, Mercury — were chosen because each of these products solved a version of this same problem: how do you make technically complex, high-trust infrastructure feel navigable, honest, and credible to the people who depend on it? Study their solutions. Extract principles. Apply them to a problem none of them have faced: a dual-hub agricultural verification platform in East Africa, where M-Pesa is the payment layer and Trust Score is the product.

### Principles

**1. Specificity over genre.** Every visual element should be answerable with: "This exists because UmojaHub is this specific thing." Not: "This exists because verification platforms look like this."

**2. Restraint as a trust signal.** The absence of decoration communicates that you are confident in your information. Decoration is what you add when the information alone doesn't feel like enough.

**3. Typography is argument.** The relationship between typefaces, the hierarchy between sizes, the treatment of numbers versus prose — these are argumentative choices. They tell the reader what matters and in what order.

**4. Animation explains, never performs.** Every animation must answer: "What does a visitor understand about UmojaHub's system after seeing this that they did not understand before the animation began?" No answer means no animation.

**5. Light and dark are meaningful.** The website is not uniformly dark or uniformly light. Light sections feel like the physical world of agriculture — daylight, paper, documents. Dark sections feel like the verification layer — the infrastructure that processes identity, payment, and trust. Transitions between them should feel intentional, not arbitrary.

**6. The product earns the design.** Annotated screenshots of the actual platform are more powerful than any illustration. The system diagrams are built from how the system actually works. Nothing is prettier than reality.

---

## SECTION 2 — VISUAL IDENTITY DIRECTION

### What UmojaHub Looks Like

UmojaHub does not look like a startup. It does not look like a government agency. It does not look like an NGO. It does not look like a bank. It is genuinely new — a verification-backed marketplace and education system built for a context that none of the design references above were built for.

The visual direction is: **Documentary Precision.**

This means the website looks like it was produced by a research institution with designers who care. Like a serious academic journal that has been designed by people who understand both the content and the craft. Like the interface of a verification system that you would actually trust your income to.

**The East African context is expressed through:**
- A color palette anchored in Kenyan agricultural pigments (deep soil red, crop green, document amber) — not illustrated landscapes
- A typographic seriousness that references the visual culture of formal institutions in the region: land registries, cooperative societies, agricultural extension documents
- Restraint that matches the communication culture of professional agricultural organizations in Kenya — these are not playful brands

**The verification core is expressed through:**
- Hard edges, not soft gradients
- Exact numbers, not rounded approximations
- Explicit status states, not implied sentiment
- Document-like layouts where information is organized by meaning, not aesthetics

**What it explicitly does not look like:**
- Fintech startup (no geometric gradients, no "made for Gen Z" type choices)
- Agricultural NGO (no earthy illustration, no "Africa rising" visual language)
- SaaS platform (no card grids with icons, no feature-per-bullet layouts)
- A shadcn or Tailwind showcase (no component-driven visual vocabulary)

---

## SECTION 3 — TYPOGRAPHY SYSTEM

### Decision: Replace the Font Stack

The current stack (Sora / IBM Plex Sans / JetBrains Mono) is competent. It is not specific. Sora reads as generic tech display. IBM Plex Sans reads as IBM's design language applied to other contexts. Neither communicates what UmojaHub specifically is.

### New Font Stack

```
font-editorial   →  Instrument Serif (Google Fonts, variable, free)
font-interface   →  Geist (Vercel GitHub, free, variable)
font-data        →  Geist Mono (Vercel GitHub, free, variable)
```

**Why Instrument Serif for display/editorial:**
Instrument Serif (designed by Rodrigo Fuenzalida, 2022) occupies a position between high-end magazine typography and serious academic text. It has the authority of a print publication without the formality of a financial institution. It communicates that what is beneath this headline is worth reading carefully — not scrolling past. No SaaS competitor uses it for this reason: they need display type that communicates speed and momentum, not depth and weight. UmojaHub's website is about depth. Instrument Serif is precise.

**Why Geist for interface/body:**
Geist (Vercel, 2023) was designed for software interfaces. It has exceptional clarity at small sizes, works at reading scales without fatigue, and has a slightly technical quality that distinguishes it from the warmth of Inter or the neutrality of DM Sans. It pairs with Instrument Serif by providing contrast — serif editorial moments give way to sans-serif operational reading.

**Why Geist Mono for data:**
Consistency with Geist. All numbers, verification codes, status labels, timestamps, and metric values use Geist Mono. This creates a visible, typographic distinction between "prose explaining the system" (Geist) and "data from the system" (Geist Mono). Buyers see a farmer's Trust Score in Geist Mono and understand that this is a computed value, not a description.

### Type Scale

```
Display 1:   Instrument Serif  80px / 84px   tracking: -0.04em  weight: 400 (italic)
Display 2:   Instrument Serif  60px / 64px   tracking: -0.03em  weight: 400
Display 3:   Instrument Serif  44px / 50px   tracking: -0.02em  weight: 400
Section:     Geist             32px / 38px   tracking: -0.02em  weight: 600
Subsection:  Geist             24px / 30px   tracking: -0.01em  weight: 600
Body Large:  Geist             18px / 28px   tracking: 0        weight: 400
Body:        Geist             16px / 26px   tracking: 0        weight: 400
Label:       Geist             14px / 20px   tracking: 0        weight: 500
Caption:     Geist Mono        12px / 16px   tracking: +0.06em  weight: 400 uppercase
Data:        Geist Mono        varies        tracking: 0        weight: 500 tabular-nums
```

### Responsive Scaling

```
Display 1:  80px desktop → 48px tablet → 36px mobile
Display 2:  60px desktop → 40px tablet → 30px mobile
Display 3:  44px desktop → 32px tablet → 24px mobile
Section:    32px desktop → 26px tablet → 22px mobile
Body Large: 18px always
Body:       16px always
```

### The Italic Moment

Instrument Serif's italic is its most distinctive feature — it drops into a true calligraphic form, not a slanted roman. This makes it typographically interesting at large display sizes.

Display 1 headlines on hub-level pages (For Farmers, For Students, etc.) use the **italic** form. This signals: you are reading about a person and their experience, not a product feature. The shift to italic at large scale is uncommon and specific.

Display 2 and Display 3 headlines use the regular form. The italic is reserved for the most significant statement on each page.

### Hierarchy Rules

**Instrument Serif handles:** Page-level declarations, section introductions (the "statement" before the detail), pull quotes used as editorial emphasis.

**Geist handles:** All operational and explanatory text — how things work, what steps to follow, what terms mean, navigation labels, footer links, button text.

**Geist Mono handles:** All data output — numbers, percentages, status labels (VERIFIED, PENDING, APPROVED), dates, order references, trust score values, tier labels, timestamps.

**The typographic signature of the platform:** Whenever UmojaHub's system produces a value — a Trust Score, a verification status, a date, a price — it is in Geist Mono, uppercase where appropriate, with a subtle color treatment (see Section 4). This makes the distinction between what a person writes and what the system computes visually unmistakable.

### Reading Width Constraints

All prose must observe reading width constraints:
```
Primary content container:  max-w-[72ch]   for body text, explanations, FAQs
Secondary content:          max-w-[88ch]   for wider reading contexts
Data tables / diagrams:     full container width is acceptable
```

No body text spans a full-width container. This is inviolable.

### Eyebrow / Section Label Treatment

Above every major section headline, a label identifies what the section is:

```
VERIFIED FARMER · FOOD SECURITY HUB
```

Format: Geist Mono, 11px, uppercase, tracking +0.12em, color: text-tertiary. The section label uses a centered dot (·) as separator. The combination of extreme tracking, small size, and mono typeface makes these labels read as system-generated context — like metadata above a database record.

---

## SECTION 4 — COLOR SYSTEM

### Decision: Replace the Color System

The current system (dark GitHub-derived palette, #007F4E green, zinc grays) is generic dark SaaS. It was inherited from the application dashboard rather than designed for the website's distinct purposes.

The new system is designed from the content outward.

### Palette Philosophy

The website operates in two distinct visual modes that are semantically different:

**Light mode sections** — Used when explaining agricultural context, presenting human-scale information, showing how the physical world works (farmer verification, produce listings, cooperative groups). Light communicates: daylight, paper, the material world.

**Dark mode sections** — Used for the verification layer, data infrastructure, trust score calculations, the payment system. Dark communicates: the system layer, computation, verification infrastructure.

This is not "dark mode / light mode" in the user preference sense. These are fixed semantic decisions. The homepage alternates between them. The audience pages are primarily light with dark data panels.

### Color Tokens

**Surface — Light**
```
surface-paper      #F8F6F2   Primary page background (warm white, like aged paper)
surface-linen      #EFECE7   Elevated surfaces, cards (like unbleached linen)
surface-cream      #E8E5DF   Secondary panels, code backgrounds
```

**Surface — Dark**
```
surface-soil       #0D0D0B   Primary dark background (near-black, very warm)
surface-deep       #161612   Elevated dark surfaces, cards
surface-charcoal   #201F1B   Panels within dark sections
```

**Typography — Light Surfaces**
```
text-ink           #1C1A16   Primary text on light (warm near-black, not pure black)
text-stone         #6B6761   Secondary text (warm mid-gray)
text-dust          #A39F99   Tertiary, captions, disabled states
```

**Typography — Dark Surfaces**
```
text-parchment     #F0EDE8   Primary text on dark (warm off-white)
text-sand          #9C9893   Secondary text on dark
text-ash           #5E5C58   Tertiary on dark
```

**Semantic Colors**
```
verified-green     #1A5C34   Verification success, VERIFIED status, Trust tier PREMIUM
                             — deep forest green, more specific than generic SaaS green
                             
verified-green-bg  #EDF4F0   Background tint for verified states on light surfaces
verified-green-dk  #2D7A4A   Verified states on dark surfaces

trust-amber        #A85F2C   Limitations, warnings, REVISION_REQUIRED states
                             — Kenyan red soil color, used for honest caveats
trust-amber-bg     #FBF4EF   Background tint for warning states on light surfaces

data-navy          #1B3A6B   Data visualizations only — bar charts, maps, metrics display
data-navy-bg       #EEF1F8   Background tint for data panels

denial-muted       #8B4040   DENIED states — muted, not alarming
```

**Borders and Lines**
```
border-light       #DDD9D3   1px separators on light surfaces
border-dark        #2A2924   1px separators on dark surfaces
border-verified    #8AB89E   Borders for verified state containers (light surface)
border-warning     #C9956B   Borders for warning state containers (light surface)
```

### Color Usage Rules

**verified-green** is used for and only for:
- The VERIFIED status label
- Trust tier PREMIUM and TRUSTED indicators
- The primary CTA button ("Register as farmer", "Begin your project")
- Active anchor navigation indicator
- The verification checkmark in diagrams

**trust-amber** is used for and only for:
- REVISION_REQUIRED states
- Limitation disclosures ("What verification does not claim")
- Warning panels about system constraints
- The honest disclosure about what cannot be guaranteed

**data-navy** is used for and only for:
- Data visualizations on the Transparency page
- County maps
- Statistical charts

**Everything else** uses the surface/typography palette. Headings are dark ink, not colored. Links in body text are dark ink with a 1px bottom border, no color change. Navigation labels are stone, active state is ink.

**What never gets color treatment:**
- Section headers
- Card borders (they use border-light or border-dark at 1px)
- Navigation items (except active state: ink weight)
- Icons used for information (always stone or dust)
- Background shapes or decorative gradients (these do not exist)

### Dark Section Usage Pattern

The homepage structure:
```
Platform Definition Statement     —  Light surface
Audience Navigator                —  Light surface
Platform Activity Statistics      —  Dark section (soil background, parchment text)
Marketplace Flow                  —  Light surface
Education Hub Flow                —  Light surface
Trust Architecture                —  Dark section
```

Audience pages:
```
Page header / context             —  Dark section (signals: you are in a specific hub)
All content sections              —  Light surface (reading content)
Verification data panels          —  Dark section insets within light sections
```

The dark header on audience pages signals a deliberate shift from the homepage. You have entered a specific context. The return to light for the content section signals: you are now reading. The occasional dark data panel within the light content signals: this is system output, not explanation.

---

## SECTION 5 — LAYOUT SYSTEM

### The Page Structure Contract

Every public website page follows this structure:
```
[Navigation — 64px fixed]
[Page Header]             — sets context, identifies hub/audience
[Content Body]            — alternating section pattern
[Page Footer]
```

**Navigation**: Fixed, 64px height. Transparent over the first screen if the page header is dark. White/soil background after scroll passes 80px.

**Page Header**: The first section of every non-homepage page. On hub-specific pages (For Farmers, For Students, etc.), the header is dark (soil background) and contains:
- Eyebrow label: `FOOD SECURITY HUB · FOR FARMERS`
- Page title in Display 1 italic (Instrument Serif)
- One paragraph (max 3 sentences) answering: "What does this page help you understand?"
- A section-anchor navigation for the page's sections (sidebar on desktop, scrolling tab strip on mobile)

**Content Body**: Alternates between content intent. The rhythm:
```
Content section (explanation)      → light surface
Data panel (system output)         → dark inset or bordered panel
Content section (next explanation) → light surface
...
```

**Footer**: Four-column, light surface with border-top.

### Container System

Three containers, used purposefully:

```
Layout max-width:   max-w-[1280px]  — nav, section wrappers, footer
Content max-width:  max-w-[900px]   — most section content
Reading max-width:  max-w-[72ch]    — all prose, FAQs, body text
```

### Section Anatomy

Every content section has this internal structure:
```
[Section eyebrow]          — Geist Mono, 11px, uppercase, tracked
[Section headline]         — Instrument Serif Display 2 or 3
[Section lead paragraph]   — Geist Body Large, max-w-[72ch]
[Section content]          — grid, diagram, list, or prose
[Section link/CTA]         — optional, only when a next action is clear
```

The section eyebrow, headline, and lead paragraph are always left-aligned. Center-aligned text does not appear on this website. Content is never center-justified. The left edge is the spine.

---

## SECTION 6 — GRID STRATEGY

### The Base Grid

All content is laid out on a 12-column grid with 24px gutters and 48px horizontal margins on desktop. On tablet: 8 columns, 20px gutters, 32px margins. On mobile: 4 columns, 16px gutters, 20px margins.

The grid is the skeleton. It is not shown. It is felt.

### Page-Level Grid Patterns

**Full-width content (most sections):**
All 12 columns used. Content inside observes the reading max-width (72ch for prose).

**Split layout (explanation + diagram/data):**
```
5 columns text | 1 column gap | 6 columns visual
```
Text is in columns 1–5, diagram or data panel is in columns 7–12. On mobile, these stack — text above, visual below.

**Three-column content (process steps, feature comparisons):**
```
4 columns | 4 columns | 4 columns
```
Used for process steps in workflow diagrams and three-way comparisons (rare).

**Sidebar layout (audience pages with anchor nav):**
```
2 columns anchor nav (sticky) | 1 column gap | 9 columns content
```
The anchor nav sidebar is fixed-width at 200px, not proportional. It is a utility element.

### Spacing Vocabulary

The spacing scale is an 8-point system. All spacing is a multiple of 8px:

```
Space 1:   8px    — within components (icon gap, etc.)
Space 2:   16px   — between closely related elements (heading to body)
Space 3:   24px   — between list items, between sub-sections
Space 4:   40px   — between major elements within a section
Space 5:   64px   — between page sections (mobile)
Space 6:   96px   — between page sections (desktop)
Space 7:   128px  — between the page header and first content section
Space 8:   160px  — used only for dramatic opening sections (homepage hero)
```

Vertical rhythm is everything. The relationship between section headlines and the space above them, between body paragraphs, between a diagram and its caption — these are not arbitrary. They create reading pace.

---

## SECTION 7 — MOTION SYSTEM

### Authority

All website animations use GSAP + ScrollTrigger. The setup from the previous system (gsap registered once in `src/lib/gsap.ts`, imported from there exclusively) is preserved. The animation vocabulary is entirely replaced.

### Motion Language Definition

The motion language of UmojaHub derives from what the platform actually does: **things become known**. Documents are reviewed. Statuses are confirmed. Trust is established through accumulated evidence. The motion should express this — the progression from unknown to confirmed.

### Animation Vocabulary

**1. Emergence (Default Entrance)**

Most elements enter the viewport by becoming visible. Not by moving. Not by scaling. By emerging.

Implementation:
```
opacity: 0 → 1
duration: 600ms
ease: power2.out
no Y translation (no slide-up)
```

The decision to remove the Y-translation from all default entrances is deliberate. Slide-up entrance animations have become the mark of a Tailwind/Framer Motion template. Emergences are less expected. They are also more honest — information appearing is not the same as information arriving from below.

The only exception: the first element on a page (the Display 1 headline) can use a 12px Y-translation to distinguish the page's opening from all subsequent reveals. This is used once per page.

**2. Sequence Reveal (For Process Steps)**

When a workflow diagram has sequential steps, they emerge in sequence with a measured delay:

```
Per-step delay: 120ms
Per-step duration: 500ms
ease: power2.out
```

The connecting lines between steps use SVG stroke-dashoffset animation — lines draw from the source node to the destination node, following the flow direction. This is the only "drawing" motion on the site.

Line draw implementation:
```
stroke-dasharray: [total-path-length]
stroke-dashoffset: [total-path-length] → 0
duration: 400ms per segment
ease: none (linear — lines don't have momentum, they're data routes)
```

**3. Verification Mark (Status Reveal)**

When a diagram shows the moment of verification — when a PENDING status becomes APPROVED, when a DENIED state exists, when a TRUSTED tier is shown — the status label uses a specific reveal:

```
Scale: 0.92 → 1.0
Opacity: 0 → 1
Duration: 300ms
ease: power3.out
```

The slight scale from 0.92 (barely perceptible) creates the impression that the label was always there and is being read for the first time. Not that it appeared. This distinction matters.

**4. Data Emergence (Statistics / Metrics)**

Numbers that represent real platform data (verified farmers, completed transactions, counties) reveal using a count-up that begins at 70% of the final value:

```
Start: 70% of final value (not zero — starting at zero is theatrical)
End: final value
Duration: 800ms
ease: power2.out (slight deceleration at the end — settling into place)
snap: { textContent: 1 } (integer snap)
```

Starting at 70% removes the theatrical sweep. The numbers feel like they're being counted, not performed.

**5. Diagram Draw (SVG Path Animation)**

Full process flow diagrams animate in three phases:

Phase 1 (0–200ms): Diagram container fades in. Node backgrounds appear.
Phase 2 (200–800ms): Connecting lines draw in sequence, left-to-right / top-to-bottom.
Phase 3 (800–1000ms): Node labels fade in on each node after its connecting lines have drawn.

This makes the viewer follow the path of the flow before reading the labels, which is the correct reading order for a process diagram.

**6. Scroll-Pinned Narrative (Trust Score, M-Pesa Flow)**

Two specific sections use ScrollTrigger pinning to tell a sequential story through scroll:

- **Trust Score progression** (For Farmers page, Trust page): The trust score component fills gradually as the user scrolls. Each component activates in order: Verification (40pt) → Transactions (25pt) → Ratings (20pt) → Reliability (15pt). The total bar fills as the user passes each component explanation.

- **M-Pesa payment flow** (For Buyers page, For Farmers page): The payment sequence diagram activates step by step as the user scrolls through the explanation. The STK Push moment — the phone rendering the payment prompt — is emphasized with the Verification Mark animation.

These pinned sections are contained and purposeful. They are not scroll-jacking for effect. They replace what would otherwise be four or five separate scroll-triggered animations with a single cohesive experience that rewards reading.

### prefers-reduced-motion Rule

Every animation block uses the mm.add pattern:

```typescript
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  // all animations here
});
// reduced-motion visitors see all content immediately, no layout shift
```

Initial states are never set in CSS. GSAP sets the from-state at runtime. This means all content is fully visible before JavaScript loads.

### Navigation Transitions

Page-to-page transitions use CSS only — no GSAP required:

```css
.page-transition-out { opacity: 0; transition: opacity 150ms ease; }
.page-transition-in { opacity: 0; animation: fadeIn 200ms ease 50ms forwards; }
```

Fast, clean, no spatial navigation implied. The previous page fades, the new page fades in.

### Banned Animations

```
✗  Scale transforms on content (hover:scale, entrance scale)
✗  Rotation of any element
✗  Horizontal slide-in animations
✗  Bounce / spring / elastic easing
✗  Looping animations of any kind
✗  Parallax scrolling (background layers moving at different speeds)
✗  Hover animations that change layout (no hover:translate-y, no hover:shadow)
✗  Particle effects, confetti, sparkles
✗  Gradient animations
✗  Typewriter effects
✗  Cursor followers
✗  Page preloaders
✗  duration > 1000ms on any single element
✗  stagger delay > 150ms
```

---

## SECTION 8 — ILLUSTRATION STRATEGY

### No Decorative Illustration

The website contains zero decorative illustrations. No abstract shapes, no geometric patterns, no illustrated characters, no agricultural scene backgrounds. Illustration is a resource used only when a concept cannot be communicated through text or diagram alone.

### What Replaces Illustration

**Real Screenshots**: The actual UmojaHub platform interface, captured at 2× resolution, shown in context. A screenshot of the price intelligence dashboard is more honest and more credible than any illustration of it. Screenshots are treated as primary assets.

**System Diagrams**: See Section 9 for the complete diagram strategy. Process flows, verification flows, and trust score breakdowns are built as SVG React components, not illustrations.

**Photography**: See Section 10. Real photographs of real contexts, treated with editorial discipline.

**Typography as Visual**: At large display sizes, Instrument Serif headlines have enough visual presence to carry sections without any supporting illustration. The decision to use a distinctive typeface means the visual weight of the headline IS the visual treatment.

### When Illustration Is Permitted

One category only: **conceptual diagrams that cannot be represented as process flows**. For example: the relationship between the two hubs (Food Security + Education) sharing a verification architecture could be expressed as an abstract structural diagram. This is not decorative — it communicates a relationship that is difficult to show in a process flow.

These conceptual diagrams follow the diagram strategy in Section 9.

---

## SECTION 9 — DIAGRAM STRATEGY

### Philosophy

Every diagram on the website is built to answer one specific question. The question is stated implicitly by the section context. If a diagram cannot be justified by a single question it answers, it is removed.

### Diagram Construction Standard

All diagrams are SVG React components. This is maintained from the previous system for correct reasons (scalability, accessibility, theming, animation compatibility).

**New visual vocabulary for diagrams:**

**Nodes (actor or state):**
- Action nodes (things a person does): `rect` with `rx="2"` — slightly rounded rectangle, never a circle. 120px × 48px on horizontal layouts, full-width on vertical.
- System nodes (things the platform does automatically): `rect` with a dashed stroke — the dashing indicates automation, not human action.
- Status nodes (APPROVED, VERIFIED, DENIED): Pill shape (high border-radius), colored background using the semantic palette.
- Decision nodes (where the path splits): Rhombus (diamond), used only when a genuine decision point exists.

**Connecting lines:**
- All connections are straight horizontal or vertical lines with 90-degree turns — no curved arrows. Curves imply organic flow. This system is sequential and rule-based.
- Arrowheads: minimal — 6px, filled, the same color as the line.
- Lines: 1.5px stroke weight on light, 1px on dark backgrounds.

**Labels:**
- Node labels: Geist 13px, centered within the node.
- Actor labels: Geist Mono 10px, uppercase, above the node group with tracking.
- Annotation labels: Geist 12px, left-aligned, connected to the annotated element by a 1px horizontal hairline.

**Color in diagrams:**
- Default node background: surface-linen (light) or surface-deep (dark)
- Default node border: border-light (light) or border-dark (dark)
- Verified/approved nodes: verified-green-bg background, verified-green border
- Pending/processing nodes: #F5F0E8 background, #C9B78A border (amber/amber)
- Denied/rejected nodes: #FAF0F0 background, #C98080 border (muted red)
- System-automated nodes: surface-cream background, dashed border-light
- Connecting lines: text-stone (light), text-ash (dark)

**Typography in diagrams:**
- Never use a different type treatment in diagrams than on the page. No bold actor labels in diagrams if labels are not bold on the page. Diagrams are part of the page's typographic system.

### Diagram Sizing

Diagrams are responsive. They use `viewBox` and `width="100%"`. On mobile, horizontal process flows become vertical (nodes stack top-to-bottom with connecting lines between them). This requires two SVG variants or a responsive SVG that reflows based on viewport.

### Specific Diagrams Required (Priority Order)

1. **M-Pesa Payment Flow** (For Buyers page, For Farmers page)
   - Question answered: "What exactly happens between clicking Pay and the order being confirmed?"
   - Actors: Buyer, UmojaHub, Safaricom
   - Key moment: The STK Push is sent to the buyer's phone — this is the central node
   - Must show the concurrent paths (Safaricom's callback to UmojaHub happens while the buyer is interacting with their phone)

2. **Farmer Verification Process** (For Farmers page, Trust page)
   - Question answered: "What happens to my documents after I submit them?"
   - Five stages: Submission → Pending → Admin Review → Decision → (Approved or Rejected)
   - Key design: The Rejected path must be as clear as the Approved path, including the resubmission loop

3. **Trust Score Component Breakdown** (For Farmers page, Trust page)
   - Question answered: "What is my Trust Score actually made of?"
   - Not a pie chart. A horizontal bar showing four components filling left-to-right: Verification (40), Transactions (25), Ratings (20), Reliability (15).
   - Animated: fills progressively on scroll (see Section 7, scroll-pinned narrative)

4. **Education Hub Workflow** (For Students page, Education Hub page)
   - Question answered: "What are all the stages between signing up and having a verified portfolio entry?"
   - Must show: both tracks (AI_BRIEF and OPEN_SOURCE), the three documents, peer review, lecturer review, and the three decision outcomes

5. **Marketplace Transaction Flow** (Homepage, For Buyers page, For Farmers page)
   - Question answered: "How does produce move from a farmer's listing to a buyer's hands?"
   - Six nodes: Verified Farmer → Listing Created → Buyer Browses → Order Placed → M-Pesa Confirmed → Farmer Fulfills → Buyer Rates

6. **Trust Tier Ladder** (For Farmers page, For Buyers page, Trust page)
   - Question answered: "How does a farmer progress from NEW to PREMIUM?"
   - A vertical stack showing four tiers with score ranges and what each tier enables

7. **Document Audit Trail** (Trust page)
   - Question answered: "How does UmojaHub know a student's documents haven't been altered after submission?"
   - Shows hashing at submission time and the audit record that results

8. **Cooperative Group Order Flow** (For Cooperatives page, For Farmers page)
   - Question answered: "How does a group bulk order actually work?"

---

## SECTION 10 — PHOTOGRAPHY STRATEGY

### Policy

The platform does not use stock photography. This is inviolable.

The reasons are not merely aesthetic. Using stock photographs of African farmers in a platform that exists to help African farmers creates a specific form of dishonesty: the implication that you are showing the people you serve when you are showing licensed models. This is a trust failure for a platform whose core proposition is verified identity.

### If Genuine Photography Exists

Real photographs of real farmers, students, buyers, or agricultural contexts are used on:
- About page (organizational context)
- For Farmers page (one primary photograph of an actual farmer who uses the platform, with consent)
- For Students page (one photograph of an actual student, with consent)

Editorial treatment:
- Black-and-white or desaturated — removes the "lifestyle photography" quality, adds seriousness
- Full-width or half-width, cropped tightly to the person or context
- No text overlaid on photographs
- No filter effects or color treatments that aestheticize poverty or agricultural labor

### If Genuine Photography Does Not Exist

All photography slots remain empty at launch. The typographic and diagrammatic treatment is sufficient. An empty space is better than a lie.

The absence of photography is noted in the page as an honest acknowledgment: "Photographs of farmers verified on the platform will be added here with permission. They are not included until they are available."

This honesty is itself a trust signal.

---

## SECTION 11 — ICONOGRAPHY STRATEGY

### The Icon Policy

Icons are used in exactly three contexts:

**1. Navigation utility icons:**
- Menu (hamburger) — mobile nav trigger
- Close (×) — sheet/drawer close
- External link indicator — on links to Safaricom, Cloudinary, etc.
- Chevron — FAQ accordion indicator

These are functional. They are Lucide icons in 20px size, text-stone color on light, text-sand on dark.

**2. Status indicators in diagrams:**
These are not icons — they are SVG shapes built into diagrams. A small circle (6px) filled with verified-green or trust-amber next to a status label. Not a CheckCircle icon. Not a Badge icon. A dot.

**3. Nowhere else.**

There are no feature icons. No icons preceding list items. No icons in cards. No icons representing audiences in the audience navigator. No decorative icons.

**Why:** Icon-per-feature layouts are the single most recognizable marker of SaaS template design. They communicate "here is our list of features" in a format every conversion-optimized landing page uses. UmojaHub's website does not contain features. It contains explanations.

---

## SECTION 12 — TRUST-BUILDING PATTERNS

### What Actually Builds Trust

Trust on the website is built through the same mechanism as trust on the platform: **specificity and accountability**.

The website's trust comes from:
- Explaining limitations before claiming strengths
- Showing real numbers with update timestamps
- Using exact technical language (STK Push, not "mobile payment")
- Disclosing which third parties handle what data
- Showing the review process, not just the outcome
- Giving the rejection reason visibility equal to the approval path

None of these require specific visual components. They require editorial discipline. The visual patterns below support that discipline.

### Status Panel Component

For displaying system states (verification statuses, project decisions):

```
┌─────────────────────────────────────┐
│  VERIFICATION DECISION — APPROVED   │  ← Geist Mono, 11px, uppercase, verified-green
│  ─────────────────────────────────  │  ← 1px hairline, border-verified
│  Your identity documents have been  │  ← Geist Body, text-ink
│  reviewed by a UmojaHub             │
│  administrator and confirmed.       │
│                                     │
│  Submitted: 4 June 2026             │  ← Geist Mono, 12px, text-stone
│  Decision: 5 June 2026             │
└─────────────────────────────────────┘
```

This panel is left-bordered with a 3px solid stripe in the semantic color (verified-green, trust-amber, or denial-muted). The stripe is the only non-hairline border in the design system.

### Limitation Disclosure Pattern

Whenever a section makes a claim about what the platform provides, a Limitation Disclosure must follow within the same section:

```
┌─────────────────────────────────────┐
│  WHAT VERIFICATION DOES NOT CLAIM   │  ← Geist Mono, 11px, uppercase, trust-amber
│  ─────────────────────────────────  │  ← 1px hairline, border-warning
│  Verification confirms identity.    │  ← Geist Body, text-stone
│  It does not assess the quality of  │
│  a farmer's produce in advance, or  │
│  guarantee that any order will be   │
│  fulfilled to the buyer's           │
│  satisfaction.                      │
└─────────────────────────────────────┘
```

This pattern appears wherever the website could be read as making an implicit guarantee it does not make.

### Live Data Display

```
  3,247                    ← Geist Mono, 60px, text-ink, tabular-nums
  Verified farmers
  Updated 2 hours ago      ← Geist Mono, 12px, text-dust
```

Numbers are large, typed, and timestamped. No chart. No progress bar. No growth indicator. The number exists in time and the timestamp grounds it in reality.

### The Honest Absence

When data is not available, the display is explicit:

```
  —                        ← em dash, Geist Mono, 60px, text-dust
  County coverage map
  Available in Sprint 3    ← Geist, 12px, text-dust, italic
```

Never placeholder data. Never demo data. Never "coming soon" in a way that implies soon. A roadmap reference if useful, an em dash if not.

---

## SECTION 13 — INFORMATION DENSITY RULES

### Density Is a Design Decision

The reference benchmarks (Stripe, Linear, Ramp, Mercury) all vary their information density deliberately. Dense sections communicate: this is system-level information, read carefully. Sparse sections communicate: this is a significant point, take space to understand it.

### Density Levels

**Level 1 — Declaration** (lowest density): Used for the first section of every page. One large headline, one lead paragraph. Maximum 60 words in the lead. The spacing above and below this content is Space 7 (128px) on desktop. This density says: stop. Read this. The rest follows.

**Level 2 — Explanation** (moderate density): Used for most content sections. Section headline, 1–2 body paragraphs, possibly a diagram. Standard spacing (Space 5/6). The reading pace is moderate.

**Level 3 — Documentation** (high density): Used for the complete workflow sections, FAQ sections, verification methodology. Multiple sub-sections within a section, dense prose, no unnecessary white space within the content itself. But the section as a whole still observes the container max-width and reading-width constraints. This is a reference section — the visitor who needs it will read it; the one who doesn't can skip it with the anchor navigation.

**Level 4 — Data** (highest density): Used for transparency metrics, Trust Score calculations, statistical displays. Tight spacing within the data panel. Geist Mono throughout. No prose within the data panel itself — only data.

### Anti-Patterns

```
✗  One sentence per card across an 8-card grid (wastes density signal)
✗  Large white space followed by a trivial content item (wastes scale)
✗  Full-width prose without reading width constraint (unreadable at scale)
✗  Dense data panels without visual separation from surrounding prose
✗  Section headlines that require the body text to understand them
   (headlines must be independently comprehensible)
✗  Three-sentence sections followed by massive padding (implies the content
   was padded to look substantial)
```

---

## SECTION 14 — ACCESSIBILITY RULES

### Foundations

**Color contrast**: All text meets WCAG AA at minimum, targeting AAA for body text. Light surface body text (text-ink on surface-paper) achieves 16:1 contrast. Dark surface body text (text-parchment on surface-soil) achieves 14:1 contrast.

**Font size**: Minimum body font size is 16px. No content text below 13px (caption/label level only, and only where a larger size would break the visual treatment's intent).

**Focus states**: Every interactive element has a visible focus ring. The focus ring is: `2px solid #1A5C34` (verified-green) with `2px offset`. The choice of verified-green for focus rings connects the accessibility pattern to the platform's semantic color — focused = active = verified.

**prefers-reduced-motion**: All GSAP animations are gated. No content is initially hidden by CSS before GSAP runs. Every visitor sees all content, animated or not.

**Motion**: No content relies on animation to be understood. Every diagram is fully legible in its static final state.

### Screen Reader Requirements

Every SVG diagram has:
- `role="img"` on the SVG element
- `aria-labelledby` pointing to a `<title>` element
- `<desc>` element with a complete text description of what the diagram shows

Status panels use:
- `role="status"` on dynamically updated elements
- `aria-live="polite"` where status can change

All navigation:
- Keyboard-navigable in logical tab order
- `aria-current="page"` on active nav item
- `aria-expanded` on accordion and disclosure elements

### Structural Accessibility

Page landmark regions are explicit:
```
<header role="banner">    — navigation
<main>                    — primary content
<nav aria-label="...">    — anchor navigation and primary nav
<footer role="contentinfo">
```

Heading levels follow document outline — no skipping levels.

---

## SECTION 15 — COMPONENT DESIGN PRINCIPLES

### The Rule: Components Inherit, Pages Override

The website has no component library separate from its pages. Components are extracted from page designs, not the other way around. A component is created when a pattern appears identically on three or more pages. Otherwise, it remains page-specific.

This prevents the "shadcn showcase" failure mode — where the visual language is determined by the component library's defaults rather than the specific communication need.

### Component Philosophy

**Every component renders real information or functional structure.** There are no placeholder components, no empty-state skeletons in the design, no "illustration here" boxes. Components are designed from the content that will fill them.

**No shadow-based depth.** Components are separated from their context by 1px borders (on light: border-light; on dark: border-dark), not by drop shadows. Shadow-based depth implies physicality and material metaphors that this design system explicitly rejects. Depth is created by color difference (surface-paper vs. surface-linen) and border.

**No rounded corners beyond 4px (`rounded-sm`) except for status pills (8px, `rounded-full`).**

Cards use `rounded-sm` (2px). Buttons use `rounded-sm`. Only status labels — VERIFIED, PENDING, APPROVED, DENIED — use pill form. Pills are reserved for things that have two states, like a circuit: on or off.

**Border-radius vocabulary:**
```
Components, cards, panels:    rounded-none or rounded-sm (2px)
Status labels, tier badges:   rounded-full
Input fields:                 rounded-sm
Buttons:                      rounded-sm
```

No `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl` on any website element.

### Core Component Inventory

**StatusLabel**: The inline verification state component.
```
[● VERIFIED]  or  [● PENDING]  or  [● REJECTED]
```
Geist Mono, 11px, uppercase, tracked. Dot + space + label. Colored dot matches semantic color. Used in diagrams, data panels, and inline within prose where a system state is referenced.

**AudienceCard**: The card in the audience navigator.
- No icon
- Eyebrow: hub label (FOOD SECURITY HUB / EDUCATION HUB)
- Headline: audience name (Farmers, Students, etc.)
- Sub-headline: one sentence, what the hub does for this audience
- Border: 1px border-light, hover: 1px border-stone
- No shadow, no lifted state on hover

**WorkflowStep**: A single step in a process diagram.
- Step number: Geist Mono, 13px, verified-green
- Actor: Geist Mono, 11px, uppercase, text-dust
- Action: Geist, 16px, text-ink, weight 600
- Detail: Geist, 15px, text-stone
- Note (optional): Geist, 13px, italic, text-dust, in a bordered box

**LifecycleStage**: Vertical timeline component for long workflows.
- Left border: 1px border-light, runs the height of the stage
- Stage number node: 8px circle, surface-paper background, border-light border, verified-green dot center
- Same typography as WorkflowStep

**DataPanel**: The dark inset used within light sections for system output.
- Dark background (surface-deep)
- All typography uses the dark-surface tokens
- 1px border-dark
- Used for: verification status displays, trust score data, payment confirmation examples

**LimitationPanel**: Limitation disclosures.
- Left border: 3px solid trust-amber
- Background: trust-amber-bg
- Eyebrow: "WHAT [X] DOES NOT CLAIM" in Geist Mono, trust-amber
- Body: Geist, text-stone

**FaqItem**: Accordion.
- Question: Geist, 16px, text-ink, weight 500
- Chevron: 16px, text-stone, rotates 180deg on open (CSS transition)
- Answer: Geist, 16px, text-stone, revealed on open (height animation via GSAP)
- Border-bottom: 1px border-light between items

---

## SECTION 16 — NAVIGATION PHILOSOPHY

### Navigation as Directory

The navigation serves 11 audience types, two hubs, and multiple structural pages. Its job is to help any visitor identify where they belong and get there in one step.

The navigation is not a marketing tool. It does not lead with the platform's best features. It leads with the visitor's need.

**Primary principle:** A farmer who visits the homepage and knows nothing about UmojaHub should be able to look at the navigation, identify "For Farmers", and arrive at the correct page without having read a single word of homepage content.

### Navigation Structure

```
[UmojaHub logo]  Marketplace  How It Works  For You ▾  Trust  About  [Sign in]  [Register]
```

The "For You" dropdown is the directory. On hover/click, it opens a structured panel:

```
┌──────────────────────────────────────────────────────────────┐
│  FOOD SECURITY HUB                  EDUCATION HUB            │
│  ─────────────────                  ──────────────           │
│  Farmers                            Students                  │
│  Buyers                             Lecturers                 │
│  Suppliers                          Employers                 │
│  Cooperatives                       Institutions              │
│                                     NGOs & Government         │
│                                                               │
│  ── Platform ────────────────────────────────────────────    │
│  Trust & Verification  ·  Platform Transparency  ·  About   │
└──────────────────────────────────────────────────────────────┘
```

The panel has two columns, labeled with hub names. The hub names use the eyebrow label treatment (Geist Mono, 11px, uppercase, tracked). Audience links are Geist 15px, text-stone, hover: text-ink. The hub structure visible in the dropdown is the first navigation of UmojaHub's dual nature.

### Visual Treatment

Navigation bar:
- Height: 64px
- Background: transparent over the first viewport if the page header is dark (surface-soil). Transitions to surface-paper on light pages.
- After 80px of scroll: 1px border-bottom (border-light or border-dark), background fills.
- Logo: "UmojaHub" in Geist, 18px, weight 600, text-ink (light) or text-parchment (dark)
- Nav links: Geist, 15px, text-stone, active: text-ink, weight 500
- "Register" button: Geist, 14px, weight 500, verified-green background, text-parchment

### Mobile Navigation

Below 768px: hamburger → full-height sheet from the right.
Sheet content: flattened version of the desktop nav — hub labels visible as section headers within the list.
No nested dropdowns on mobile. Linear list.

### Anchor Navigation (Audience Pages)

Long audience pages have a persistent sidebar showing all sections. On desktop:
```
[sidebar at 200px width, sticky top: 88px]
• The problem
• How UmojaHub responds
• The complete workflow
• ...

[each item is Geist, 13px, text-dust; active item is text-ink + 2px left border verified-green]
```

On tablet and mobile, the sidebar collapses to a horizontal scrolling tab strip at the top of the content area. On mobile, the tab strip becomes a select dropdown.

---

## SECTION 17 — STORYTELLING PHILOSOPHY

### The Story Structure

UmojaHub has a specific story structure for each audience:

**1. Name the problem.** Not in abstract. In the exact situation of the specific person.
**2. Show how the problem works.** The mechanism. Why the problem persists without UmojaHub.
**3. Show how UmojaHub changes the mechanism.** Not the outcome — the mechanism.
**4. Show the complete workflow.** Every step. Nothing hidden.
**5. Show the limitations.** What the platform does not do. What it cannot guarantee.
**6. Give the person agency.** What to do now. Where to start.

This structure is applied to every audience page. It is also the implicit structure of the homepage, compressed into six sections.

### The Storytelling Principle: Mechanism First

The dominant design failure in purpose-driven platform communication is claiming outcomes and showing screenshots. "Farmers earn more. Here is the dashboard."

UmojaHub's story is about mechanism: how does trust get built? How does payment actually work? Who reviews verification documents? What happens when a student's project is DENIED?

The mechanism is the compelling part. Once you understand the mechanism — that a platform administrator personally reviews every verification document, that a buyer's M-Pesa PIN never touches UmojaHub's servers, that a student's documents are hashed at submission time — the outcome claims become unnecessary. The mechanism is the trust signal.

### Voice

The website's writing voice is:
- Direct: "Your documents are reviewed by a UmojaHub administrator." Not "Your documents go through our robust review process."
- Specific: "The typical review time is one to three business days." Not "We review quickly."
- Bounded: "This confirms identity. It does not assess produce quality." Always say what it is and what it is not.
- Respectful: The farmers and students being addressed are adults making consequential decisions. They are not being sold to. They are being informed.

Never:
- Transformative language ("empowering farmers")
- Community language ("join our growing community")
- Platform confidence language ("trust the process")
- Startup language ("we're on a mission")

---

## SECTION 18 — HOMEPAGE NARRATIVE STRATEGY

### The Problem with Existing Homepage Design

The current homepage (even after the redesign) still structures itself as: [hero] → [audience navigator] → [features] → [how it works]. This is the landing page pattern. It exists to convert. It starts with the platform and asks visitors to fit themselves into it.

The new homepage starts with **three structural failures** — the actual problems that made UmojaHub necessary — and then shows how UmojaHub responds to each one. The visitor arrives not at a product pitch but at a recognition of something they may already know is true.

### Homepage Section Sequence

**Section 1 — Platform Definition Statement** (Declaration density)
No hero image. No hero illustration. One Display 1 headline, italic:

*"A verified marketplace and education platform for East Africa."*

One paragraph, max 60 words, answering: what is UmojaHub, what two systems does it connect, what is the geographic scope, what is the verification commitment.

No CTA in this section. The definition comes first.

**Section 2 — The Two Structural Problems**
Dark section (soil background).
Two columns: left column is the food security problem, right column is the education problem. Each column:
- A two-sentence problem statement
- 3–5 specific, verifiable consequences of the problem (bulleted, Geist, text-sand)
- One sentence: "UmojaHub addresses this by [mechanism]."

This section does not introduce the platform's features. It grounds the platform in real problems.

**Section 3 — Audience Navigator**
Light section.
Headline: "Find your context." (Display 3)
The 11 audience types organized by hub (Food Security Hub · Education Hub). Cards as described in Component Inventory.

**Section 4 — How the Marketplace Works**
Light section.
The marketplace flow diagram (animated on scroll). Below the diagram: 3 things the marketplace requires before a transaction can happen (verification, M-Pesa phone, active listing). This section is functional education, not a feature list.

**Section 5 — How the Education Hub Works**
Light section, continues from above.
The Education Hub flow diagram. Below: what a verified portfolio entry means to an employer. One sentence.

**Section 6 — Platform Activity** (Dark section, soil background)
Live statistics in the data display format. No chart. Four numbers: verified farmers, completed transactions, verified portfolio entries, counties covered. Each with a timestamp.
Below the numbers: one sentence about what these represent. No projection. No growth claim.

**Section 7 — Trust Architecture Overview**
Light section.
Not a feature list. A structural explanation in 3 paragraphs: (1) how farmer trust works, (2) how education trust works, (3) what both have in common. No CTA. Link to "Read the full verification methodology →"

**No hero. No headline CTA. No "Get started" above the fold.**

The visitor who reaches the register link knows exactly why they're registering.

---

## SECTION 19 — HUB-LEVEL NARRATIVE STRATEGY

### Audience Page Structure

Each audience page (For Farmers, For Students, etc.) follows the same four-part structure:

**Part 1 — Context Setting** (dark header section)
- Hub label + page title (Display 1 italic)
- The specific situation of this audience in East Africa, stated without sentimentality
- What the platform responds to for this audience specifically
- Anchor navigation sidebar

**Part 2 — How It Works** (light sections, alternating density)
- The complete workflow, documented step by step
- Each step uses the WorkflowStep component
- Where a process branches (Approved or Rejected), both paths are shown
- Where automation exists, it is labeled (System Automated nodes in diagrams)

**Part 3 — The System Layer** (data panels embedded in light sections)
- Trust Score breakdown (for farmer page)
- Verification status display (for all pages)
- The payment flow (for farmer and buyer pages)
- The review dimensions (for student and lecturer pages)
- All data uses Geist Mono, all rendered in DataPanel components

**Part 4 — Limitations, FAQ, Next Steps** (light sections, documentation density)
- Limitation disclosures before the FAQ
- FAQ in FaqItem accordion
- Next steps: 3 links maximum — where to go if you're ready to register, where to go if you still have questions, where to go to understand the verification process in full

### What Makes Each Page Specific

The visual system is shared across pages but the content makes each page unmistakably for one audience. The farmer page shows the M-Pesa payment flow from the farmer's perspective. The buyer page shows it from the buyer's perspective. The student page shows the three-document structure in full. The employer page shows what a portfolio entry contains without the student lifecycle.

The differentiation is content, not visual. This is the correct relationship between design system and content.

---

## SECTION 20 — REASONS EXISTING WEBSITE DIRECTIONS WERE REJECTED

### Why the Previous Design System Failed

This section documents the specific reasons the prior design system was rejected. It exists so these decisions are not repeated.

**1. The palette was inherited, not designed.**

The dark palette (#0D1117, #161B22, #1F2937) is the GitHub color scheme. It was carried into the application dashboard as a sensible dark mode choice and then into the website without questioning whether the website needed to be dark at all. A marketplace website for agricultural products has no inherent reason to be uniformly dark. The choice was never justified for the website's specific communication needs.

**2. The fonts were arbitrary.**

Sora was chosen because it "looks like a modern startup." IBM Plex Sans was chosen because it's "clean." Neither choice was made in relation to what UmojaHub is. The result is a typographic system that could describe any fintech startup in any geography. The website should feel specifically like UmojaHub — an agricultural verification platform in East Africa. The font choices did not support that.

**3. The green was generic.**

#007F4E is a standard "agricultural green" — the color of environmental brands, organic food companies, and any startup that wants to signal sustainability. It was not chosen in relation to UmojaHub's specific meaning. The new verified-green (#1A5C34) is darker, more specific, and communicates "deep and established" rather than "fresh and growing."

**4. The animation was borrowed.**

Fade-up + stagger is the default GSAP animation pattern for modern marketing websites. It was not designed for UmojaHub's content. The result is that every section entrance feels the same as every other entrance — there is no motion grammar, just motion presence. The new system derives animation from the platform's core behavior: things becoming known, processes completing, states being confirmed.

**5. The component vocabulary was shadcn.**

The audience navigator cards, the accordion FAQ, the navigation menu, the tabs — all used shadcn components styled to match the palette. The result is that the website looks like a shadcn showcase. Visitors who have built with shadcn recognize the components immediately, which breaks the sense that this is a specifically designed product. Components should be designed from content requirements, not extracted from a library.

**6. The section alternation was decorative.**

Alternating between bg-surface-primary and bg-surface-elevated created visual rhythm that did not carry meaning. Why is section 2 elevated? No reason — it's just alternation. The new system uses light and dark surfaces to signal the difference between human-scale agricultural content (light) and system-layer verification content (dark). Every surface choice carries a reason.

**7. The page structure was conversion-optimized.**

The homepage started with a hero, followed by a CTA, followed by features. This is the landing page pattern. The website's goal is understanding, not conversion. A visitor who understands does not need to be converted — they will register because the platform is what they need. The redesign moved in this direction but still retained conversion-pattern elements (CTA buttons in hero sections, benefit-framed section headlines).

**8. Photography was absent but design was not adapted.**

The design assumed eventual photography (illustrated hero images as placeholders). When photography wasn't available, the design fell apart because sections were dimensioned for images that didn't exist. The new system is designed to work without photography — typographic treatment and diagrams are the primary content layer, and photography is a possible addition, not a design dependency.

**9. The anchor navigation was not integrated into the page structure.**

The SectionAnchor sidebar was added to audience pages as a UI pattern without being integrated into the page's visual hierarchy. It sat beside the content without reflecting the content's section structure visually. The new design makes anchor navigation part of the page header, not an afterthought.

**10. Every section could have appeared on a different website.**

This is the final and most damning judgment. The hero headline on the farmers page could have appeared on a payments startup. The audience navigator cards could have appeared on any platform with multiple user types. The process flow section could have appeared on any marketplace. Nothing was visually specific to UmojaHub. The test for every section in the new design: if this section appeared on any other website, would it feel wrong? It should feel wrong.

---

# PHASE 2 — PAGE AUDIT

**Standard:** Every existing page is audited against the new design system. The audit answers: what survives, what is removed, and what is rebuilt. Assume 80–90% visual replacement.

---

## Homepage (`src/app/(website)/page.tsx`)

**What survives:**
- Page structure (six sections)
- getTransparencyData() call and data integration
- revalidate = 300 (correct ISR strategy)
- Section sequence (definition → audiences → stats → marketplace flow → education flow → trust)

**What is removed:**
- All component visual implementations
- The current RootProblemStatement (green hero styling, CTA placement above understanding)
- The current AudienceNavigator (card grid with generic hover treatments)
- The current LivePlatformStats (stat strip layout and styling)
- All section backgrounds (generic alternation pattern)
- All border/radius treatments from existing components

**What is rebuilt:**
- RootProblemStatement → `PlatformDefinitionStatement`: Display 1 italic headline, single paragraph, no CTA, no decorative elements
- The structural problems section (new): dark section, two-column problems, food security + education framing
- AudienceNavigator → rebuilt with hub grouping, new card treatment, no icons
- LivePlatformStats → `PlatformActivityDisplay`: dark section, four numbers in Geist Mono, timestamps, no charts
- MarketplaceFlowSection → rebuilt with new SVG diagram vocabulary, new section structure
- EducationFlowSection → rebuilt with new SVG diagram vocabulary
- TrustArchitectureSection → three-paragraph structural explanation, no diagram on homepage

**Why:** The homepage fails the "specific to UmojaHub" test comprehensively. Every section uses generic patterns. The section introducing the audience navigator could appear on any multi-role platform. The stats strip is identical to hundreds of startup stats strips. The redesign retains the information architecture while replacing every visual decision.

---

## For Farmers (`src/app/(website)/for/farmers/page.tsx`)

**What survives:**
- All written content (this is the best content on the site — deep, specific, honest)
- Section structure (problem → response → workflow → trust → responsibilities → limitations → FAQ)
- Workflow stage data (workflowStages array)
- FAQ data (faqItems array)
- SectionAnchor configuration (section list)

**What is removed:**
- All JSX structure below the data declarations
- All className treatments
- AudiencePage wrapper component
- All section layout HTML
- The current visual hierarchy (uses generic dark card layouts)

**What is rebuilt:**
- Dark header section: hub label, Display 1 italic page title, 2-sentence introduction, anchor navigation
- Workflow section: new WorkflowStep components with the new typography
- Trust Score breakdown: scroll-pinned narrative replacing static display
- All FAQs: new FaqItem accordion
- M-Pesa payment flow: new animated SVG diagram
- Verification flow: new SVG diagram with the new node vocabulary
- Limitation panels: new LimitationPanel components

**Why:** The content is right. Every visual implementation is wrong.

---

## For Buyers (`src/app/(website)/for/buyers/page.tsx`)

**What survives:** All written content, workflow stages, FAQs, section structure.

**What is removed:** All visual implementation.

**What is rebuilt:** Same structural rebuilding as Farmers. Key additions: the marketplace listing anatomy annotated screenshot (real screenshot required before this section can be built), the M-Pesa flow from buyer's perspective.

**Why:** Same as Farmers.

---

## For Students (`src/app/(website)/for/students/page.tsx`)

**What survives:** All written content, the three-document structure explanation, FAQ.

**What is removed:** All visual implementation.

**What is rebuilt:** Dark header, Education Hub context. Three-document structure diagram (new SVG diagram vocabulary). The review pipeline diagram (peer review → lecturer review → decision branching). Scroll-pinned narrative for the full pipeline.

**Why:** Same as Farmers. Special note: the Education Hub pages are the weakest in visual specificity — they look the most like a generic SaaS feature list. The content is correct; it needs the most aggressive visual rebuilding.

---

## For Lecturers (`src/app/(website)/for/lecturers/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** Dark Education Hub header. Four-dimension assessment diagram (clarity, methodology, documentation, reflection). The three decisions (VERIFIED, REVISION_REQUIRED, DENIED) shown with the new StatusLabel components. Effectiveness tracking explanation.

**Why:** Same.

---

## For Employers (`src/app/(website)/for/employers/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** Dark Education Hub header with the specific framing for employers ("This page explains what a verified portfolio entry means before you rely on it in a hiring decision"). Portfolio entry anatomy (annotated diagram showing what a portfolio entry contains). The verification audit trail diagram.

**Why:** Same. Additional note: this page currently feels like a features page for employers. It must feel like a methodology document. The rebuild prioritizes transparency over persuasion.

---

## For Suppliers (`src/app/(website)/for/suppliers/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** Food Security Hub header. Supplier verification credential list (KEBS, PCPB, KEPHIS) as a structured data panel. Cooperative group order flow diagram.

**Why:** Same.

---

## For Institutions (`src/app/(website)/for/institutions/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** Education Hub header. How faculty register diagram (simple, 3-step). Partnership inquiry contact section.

**Why:** Same.

---

## For Cooperatives (`src/app/(website)/for/cooperatives/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** Food Security Hub header. Cooperative group formation flow (named farmer creates group → invites verified farmers → group proposes bulk order). The group ordering process as a WorkflowStep sequence.

**Why:** Same.

---

## For NGOs (`src/app/(website)/for/ngos/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** A different structure than other audience pages — this page should feel more like a transparency report page than a product explanation page. Impact metrics displayed (data panels). Geographic coverage context.

**Why:** Same.

---

## Transparency (`src/app/(website)/transparency/page.tsx`)

**What survives:** The concept and data structure.

**What is removed:** All visual implementation.

**What is rebuilt:** This page should be the design showcase for the data display pattern. Four large numbers. Methodology section. What we track, what we don't track. Infrastructure disclosure. Service status.

**Why:** Same, plus: this page currently undersells the platform's commitment to transparency. The redesign makes transparency a visual statement — numbers large, methodology explicit, limitations disclosed prominently.

---

## About (`src/app/(website)/about/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation, all generic "about us" formatting.

**What is rebuilt:** Plain, editorial. Why we exist. What we have built. Geographic focus. Organizational information. This page uses the lightest section treatment — it is the one place on the site where the typography alone carries the page. No diagrams. No data panels. One thing: if genuine photographs exist, one appears here.

**Why:** The current About page is the most generic on the site.

---

## How It Works (`src/app/(website)/how-it-works/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** The most diagram-heavy page on the site. Seven diagrams (marketplace flow, education flow, payment flow, verification flow, trust score, cooperative ordering, price intelligence). Each diagram uses the new SVG vocabulary. Anchor navigation is essential here.

**Why:** Same.

---

## Trust (`src/app/(website)/trust/page.tsx`)

**What survives:** All written content.

**What is removed:** All visual implementation.

**What is rebuilt:** The most important page on the site. Dark header that signals: you are reading the platform's methodology, not its marketing. Every verification system documented completely. The Trust Score component breakdown as the scroll-pinned narrative. Limitation disclosures prominent, not buried.

**Why:** This page must feel like reading a verification methodology document, not a marketing page about verification. It is the strongest trust signal the website has.

---

## Navigation and Layout Components

**What survives:**
- WebsiteNav structure concept (fixed top, transparent → filled on scroll)
- Footer four-column concept
- SectionAnchor concept

**What is removed:**
- All shadcn NavigationMenu usage (replaced with a custom nav)
- All current className treatments
- The mega-menu visual implementation

**What is rebuilt:**
- WebsiteNav from scratch: new hub-structured dropdown, new visual treatments
- Footer from scratch: new typography, new color (light footer, not dark)
- SectionAnchor from scratch: integrated into page header structure

---

# PHASE 3 — IMPLEMENTATION ROADMAP

---

## Pre-Sprint: Foundation Work

**Dependencies: Must complete before any page work begins.**

### F1: Font Integration
Install Instrument Serif (Google Fonts) and Geist/Geist Mono (self-hosted from Vercel's GitHub release).

Update `src/app/layout.tsx` to load fonts via `next/font`.
Update `tailwind.config.ts` with new font-family tokens (font-editorial, font-interface, font-data).
Update `src/styles/globals.css` with new CSS custom properties.

Deliverable: Running dev server shows new font stack throughout.

### F2: Color Token Replacement
Replace all existing color tokens in `tailwind.config.ts` and `globals.css`.
New tokens: all surface, text, border, and semantic colors from Section 4.
Delete all references to the old palette (bg-surface-primary, bg-surface-elevated, etc.).

Deliverable: Type-check passes. Build passes.

### F3: GSAP Motion System
Create `src/lib/gsap.ts` (preserved from prior system — verify it exists and is correct).
Create `src/lib/motion.ts` — exports typed animation preset functions:
- `emergenceAnim(targets, options)`
- `sequenceReveal(targets, options)`
- `verificationMark(target)`
- `dataEmergence(target, finalValue)`
- `diagramDraw(paths)`

These functions encapsulate the animation vocabulary from Section 7 so individual components don't need to know the GSAP parameters.

Deliverable: Motion presets documented and testable.

### F4: Base Layout Components
Build the new WebsiteNav component from scratch.
Build the new Footer component from scratch.
Build the page layout wrapper (dark header concept).

Deliverable: Any page can use new nav/footer without existing component dependencies.

### F5: Core Component Library
Build the following components (in this order, dependencies first):
1. StatusLabel
2. AudienceCard
3. WorkflowStep
4. LifecycleStage
5. DataPanel
6. LimitationPanel
7. FaqItem
8. SectionAnchor (rebuilt)

Deliverable: Storybook or dev page shows all components rendering correctly with real content.

---

## Sprint 1 — Homepage and Trust Foundation

**Goal: The homepage communicates exactly what UmojaHub is to any visitor in under 60 seconds of reading.**

### S1.1: PlatformDefinitionStatement section
New component. Display 1 italic headline. One paragraph. No CTA. Light surface.

### S1.2: The Two Problems section
New section. Dark (soil background). Two-column layout. Food Security problem | Education problem. Real prose.

### S1.3: AudienceNavigator rebuilt
New component using AudienceCard. Hub grouping (Food Security Hub label above farmer/buyer/supplier/cooperative, Education Hub label above student/lecturer/employer/institution). Grid layout.

### S1.4: New marketplace flow SVG diagram
The animated marketplace transaction flow. Uses new SVG node vocabulary. Animated via diagramDraw preset.

### S1.5: New education flow SVG diagram
Same treatment as marketplace flow.

### S1.6: PlatformActivityDisplay
Dark section, four numbers, timestamps. Count-up animation using dataEmergence preset.

### S1.7: Trust Architecture text section
Three-paragraph structural explanation. No diagram. Link to Trust page.

**Sprint 1 deliverable:** Homepage complete, all animations functional, all accessibility requirements met.

**GSAP usage:** diagramDraw on marketplace + education flows, dataEmergence on statistics, emergenceAnim on all sections.
**Diagram requirements:** Marketplace transaction flow SVG, Education pipeline SVG.
**Asset requirements:** None (no photography required for homepage).

---

## Sprint 2 — Trust and Verification Pages

**Goal: The Trust page and How It Works page function as the methodology documentation for the platform.**

### S2.1: Trust page dark header
Hub label, Display 1 title, introduction paragraph, anchor navigation.

### S2.2: Verification flows (3 SVGs)
- Farmer verification flow (Submission → Pending → Admin Review → Approved/Rejected)
- Supplier verification flow
- Lecturer verification flow

### S2.3: Trust Score scroll-pinned narrative
GSAP ScrollTrigger pinned section. Scroll drives the component-by-component fill animation. Uses `motionCanvas` approach with GSAP ScrollTrigger.

### S2.4: Education project verification SVG
Three documents → peer review → lecturer review → VERIFIED/REVISION_REQUIRED/DENIED.

### S2.5: LimitationPanel placements
Every verification section ends with a LimitationPanel. Four panels total on the Trust page.

### S2.6: How It Works page structure
All seven diagrams from the diagram priority list. Anchor navigation for all seven sections. Long-form prose documentation.

**Sprint 2 deliverable:** Trust and How It Works pages complete. These are the platform's deepest trust signals.

**GSAP usage:** ScrollTrigger pinned Trust Score narrative, sequenceReveal on all process steps, emergenceAnim on all sections.
**Diagram requirements:** Three verification flows, Trust Score pinned animation, education project verification.
**Asset requirements:** None.

---

## Sprint 3 — Food Security Hub Pages

**Goal: Farmers, Buyers, Suppliers, and Cooperatives pages complete.**

### S3.1: Shared Food Security Hub header component
Dark header with FOOD SECURITY HUB eyebrow, configurable title and intro.

### S3.2: For Farmers page
All content from existing page, rebuilt with new components. M-Pesa payment flow SVG (farmer perspective). Trust Score scroll-pinned narrative (same component as Trust page, reused). Verification flow diagram (same as Trust page, reused). Price Intelligence annotated screenshot (real screenshot required).

### S3.3: For Buyers page
M-Pesa payment flow SVG (buyer perspective). Marketplace listing anatomy annotated screenshot (real screenshot required). Trust Tier explanation DataPanel.

### S3.4: For Suppliers page
Supplier verification credential list as DataPanel. Cooperative group order flow SVG (required for Sprint 3).

### S3.5: For Cooperatives page
Cooperative group formation flow. Group ordering WorkflowStep sequence.

**Sprint 3 deliverable:** All Food Security Hub audience pages complete.

**GSAP usage:** All standard presets. M-Pesa flow uses verificationMark at the payment confirmation node.
**Diagram requirements:** M-Pesa payment flow (two perspectives), Cooperative group order flow.
**Asset requirements:** Price Intelligence screenshot, marketplace listing screenshot. These are real screenshots from the live platform — must be captured before Sprint 3 can complete.

---

## Sprint 4 — Education Hub Pages

**Goal: Students, Lecturers, Employers, and Institutions pages complete.**

### S4.1: Shared Education Hub header component
Dark header with EDUCATION HUB eyebrow, configurable title and intro.

### S4.2: For Students page
All content from existing page, rebuilt. Three-document structure diagram (new SVG). Education pipeline SVG (same as homepage, reused). Peer review + lecturer review relationship diagram. Portfolio entry anatomy (annotated diagram — not a screenshot, as student data is private).

### S4.3: For Lecturers page
Four-dimension assessment diagram. Review process workflow. Three decision StatusLabel displays.

### S4.4: For Employers page
Portfolio entry anatomy (same component as Students page). Verification audit trail diagram. Contact/inquiry section.

### S4.5: For Institutions page
Faculty registration flow. Student participation explanation.

**Sprint 4 deliverable:** All Education Hub audience pages complete.

**Diagram requirements:** Three-document structure diagram, peer/lecturer review relationship diagram, verification audit trail diagram.
**Asset requirements:** AI Mentor interface screenshot (real screenshot from the live platform).

---

## Sprint 5 — Structural Pages

**Goal: Transparency, About, NGOs/Government pages complete.**

### S5.1: Transparency page
This page should be the design showpiece for data display. Full rebuild. Impact metrics with maximum visual weight given to the numbers. Methodology section. Infrastructure disclosure. Service status.

### S5.2: About page
Minimal design. Editorial typography only. One section for genuine photography if available.

### S5.3: For NGOs page
Impact data display, geographic context, partnership inquiry.

**Sprint 5 deliverable:** All structural pages complete.

**Diagram requirements:** County coverage map (geographic SVG — may require external data source for county boundaries).
**Asset requirements:** Photography (if genuine photographs are available). Otherwise: no photography.

---

## Sprint 6 — Polish and Cross-Cutting

**Goal: The website is complete, consistent, and performant.**

### S6.1: Mobile audit
Every page reviewed on actual mobile devices. Anchor navigation becomes scrolling tab strip on tablet, select on mobile. All diagrams reflow to vertical on mobile. All touch targets meet 44px minimum.

### S6.2: Animation audit
Every page reviewed with prefers-reduced-motion enabled. All content visible without animation. No layout shift on animation start.

### S6.3: Accessibility audit
Screen reader walkthrough of every page. All SVG diagrams have title and desc. All interactive elements keyboard-navigable. All contrast ratios verified.

### S6.4: Performance audit
All SVG diagrams lazy-loaded below the fold. No blocking font loads. GSAP only loaded for Client Components that use it.

### S6.5: Content consistency review
Every Limitation Disclosure is in place. Every claim is bounded. No placeholder text. No placeholder data. No TODO comments.

---

## Asset Requirements Summary

### Screenshots Required (block Sprint 3/4 completion)
- Marketplace listing card (real platform data)
- Marketplace listing detail page
- Price Intelligence dashboard
- Farmer Trust Score display
- Student project submission interface
- Peer review interface
- AI Farm Assistant interface (if available in current build)
- AI Mentor interface (if available in current build)

### Genuine Photography (required for Sprint 5 About page — optional)
- If available: one farmer photograph, taken with consent, editorial treatment
- If not available: section intentionally left empty with honest note

### County GeoJSON (required for Sprint 5 Transparency map)
- Kenyan county boundary GeoJSON for the coverage map SVG
- Publicly available from Kenya National Bureau of Statistics open data

---

## GSAP Dependency Summary

| Feature | Component | ScrollTrigger | Pin |
|---|---|---|---|
| All section entrances | every page | yes | no |
| Marketplace flow diagram | Homepage, How It Works | yes | no |
| Education flow diagram | Homepage, How It Works | yes | no |
| Trust Score fill animation | Farmers, Trust | yes | yes |
| M-Pesa payment sequence | Buyers, Farmers | yes | yes |
| Platform statistics count-up | Homepage | yes | no |
| All workflow step sequences | All audience pages | yes | no |
| Verification flow diagrams | Trust, Farmers | yes | no |

ScrollTrigger pinning is used in exactly two places: Trust Score narrative and M-Pesa payment sequence. Both are intentional, content-driven decisions. All other animations use one-shot scroll triggers (once: true).

---

## Implementation Constraints

**Never implement before design is approved:** Each sprint's section layouts should be reviewed against this document before JSX is written. The design document governs. Code follows design.

**Diagram SVGs are designed before they are built:** Each SVG diagram is specified on paper or in a design tool before being implemented as a React component. Building a diagram directly in SVG code without a design spec produces diagrams that communicate poorly.

**Screenshots cannot be mocked:** The annotated screenshot sections of Farmers and Buyers pages cannot be published with placeholder images. Either a real screenshot exists, or the section does not launch. This constraint is a quality standard, not a technical limitation.

**No design system drift:** If a component produced during implementation deviates from this document, the document governs — the implementation is revised, not the document. Design drift begins with the first small exception.
