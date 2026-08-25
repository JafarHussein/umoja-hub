# UMOJAHUB HI-FI VISUAL LANGUAGE — V1 (PROPOSAL)

**Status: RATIFIED.** This is the visual language behind the app surface — the rationale and the Foundation-law citations for every visual decision. It was ratified and tokenized at the Phase 5 gate into [DESIGN_SYSTEM_V1.md](DESIGN_SYSTEM_V1.md), which holds the canonical token inventory; this document holds the *why* behind those tokens. Governed by `UMOJAHUB_WEBAPP_FOUNDATION_V1.md`; every decision below traces to a foundation law (cited inline).

---

## 0. The one-line read

> *Reading this as: a multi-role trust-infrastructure product surface for two populations (low-literacy farmers/buyers on weak devices ↔ expert lecturers/admins), with a **calm civic-utility** language — plain-spoken, warm-neutral, one honest color-meaning model — leaning on legibility and restraint, not spectacle. **Reliability is the aesthetic** (Foundation §2).*

This is **not** a landing page and **not** a Stripe/Linear/Notion tribute (Foundation §4.2). The taste-skill's anti-slop, color, type, and a11y discipline apply; its landing-page layout dials do not.

---

## 1. Typography — *legibility is the brief*

Foundation bans "default-Inter scream-headlines" (§4.3) but demands radical legibility for low-literacy users on weak devices (§3.4, §15). So: a warm, open, highly-legible grotesque for everything, plus a restrained mono used **only for data/figures** (the product is number-heavy: prices, Trust Scores, percentages, denominators).

- **Primary family — `Hanken Grotesk`** (Google Fonts, variable, free for commercial use). Warm, open apertures, exceptional small-size legibility, not an AI tell (not Inter/Geist). Used for all UI, headings, body.
- **Numeric/data family — `Spline Sans Mono`** (Google Fonts, variable, free). Used **only** for: Trust Score numbers, prices (`KSh 85/kg`), percentages, table figures, IDs/timestamps. Tabular by nature → columns lock. Signals precision + honesty without shouting. *(Deliberately NOT IBM Plex Mono / Sora — those are the live website's fonts; the app stays visually distinct.)*
- **Tabular numerals everywhere** data appears: `font-variant-numeric: tabular-nums`.
- **Two families only** → small font payload → 2G-safe (Foundation §4 perf law).

**Type scale** (replaces provisional `MidFi/*`; weights chosen for hierarchy-by-weight not raw scale, per taste §9.B):

| Token | Family / size / weight / line | Use |
|---|---|---|
| `Display` | Hanken 30 / 700 / 36 | page hero number-moments, role home greeting |
| `H1` | Hanken 23 / 700 / 30 | screen title |
| `H2` | Hanken 18 / 650 / 26 | section header |
| `Title` | Hanken 15 / 650 / 22 | card title, list-item title |
| `Body` | Hanken 14.5 / 450 / 22 | body text |
| `BodyStrong` | Hanken 14.5 / 600 / 22 | emphasized inline |
| `Label` | Hanken 12.5 / 600 / 16 / +2% tracking | field labels, eyebrows (rationed) |
| `Meta` | Hanken 12.5 / 450 / 16 | secondary/muted meta |
| `Nav` | Hanken 13.5 / 550 / 20 | sidebar nav |
| `DataXL` | Spline Mono 30 / 600 / 34 | Trust Score, hero figures |
| `DataL` | Spline Mono 20 / 550 / 26 | prices, key numbers |
| `DataM` | Spline Mono 13 / 450 / 18 | table figures, inline data |

Min interactive text 12.5px; min target 44px (Foundation §4.4).

---

## 2. Color — *one honest meaning-model*

Anti-tells honored: no AI-purple, no SaaS-blue glow, no beige+brass premium cliché (that ban is for premium-consumer briefs; this is a civic utility, executed with intent regardless). The palette is **earthed in East African agriculture** and built so **one color carries one honest meaning** — the most learnable model for low-literacy users (Foundation §3.4, §5):

### The story: "Cultivated trust"
- **Green = good / verified / growth / proceed.** Brand spine *and* the trust-positive semantic, intentionally unified into one mental model. Always reinforced with **icon + shape + text**, never color alone (Foundation §4.4 — so the brand/semantic overlap is safe and, in fact, clearer).
- **Murram (warm clay/amber) = the human accent** — soil/earth warmth. Used for illustration, highlights, empty-state warmth. **Never** a primary CTA (keeps the surface calm, never urgent — Foundation §2).
- **Warm neutrals = the calm ground.** Warm-tinted grays (not cold slate) → humane, not clinical; dodges the Linear/Stripe cold-gray tell.

### Light theme (primary) — JS palette constant
```
brand            #1E5C45   // deep shamba green — primary action, active nav, focus
brandHover       #184C39
brandSurface     #E8F0EB   // green-tint surface (verified panels, selected)
brandBorder      #BFD6C8

murram           #B5631F   // warm earth accent (illustration, highlights) — not CTAs
murramSurface    #F6ECE0

canvas           #F7F6F2   // warm off-white page ground
card             #FFFFFF
sunken           #EEEDE7   // wells, table header, skeleton base
hairline         #E4E2DA
strokeStrong     #CDCAC0
ink              #1C1B17   // warm near-black (headings)
body             #45433B   // body text
muted            #6E6B61   // secondary
faint            #97938A   // tertiary / placeholder (decorative only, never sole label)

// functional set — distinct, each used with icon+shape+text
success          #1E5C45   // == brand green (good/verified/completed)
successSurface   #E8F0EB
warning          #9A5B12   // amber — pending verification, awaiting fulfilment
warningSurface   #F7ECDD
danger           #A52A1F   // denied, error, dispute
dangerSurface    #F7E6E3
info             #2C5A73   // desaturated slate-blue — in-transit / informational ONLY (rationed)
infoSurface      #E6EDF1
focusRing        #1E5C45 @ 2px + 2px offset (AA)
```
Contrast: ink/body/muted on canvas & card all ≥ AA; brand on white = AA for large+UI, white on brand = AA. (Validated at DS gate with axe; pairings chosen to pass.)

### Dark theme (parallel value-map, not a fork — Foundation §14)
```
canvas #15140F  card #1E1C16  sunken #100F0B  hairline #322F26  strokeStrong #4A463A
ink #F3F1EA  body #CFCBBE  muted #98948A
brand #5FB893 (action/text-on-dark)  brandSurface #1C3A2E  brandBorder #2E5A45
murram #D98A45  warning #D99A3C  danger #E27A6E  info #6FA3C0
```
No pure `#000`/`#fff` (taste §8.B). State/trust hues hold meaning + contrast across both themes (Foundation §14).

---

## 3. Form, elevation, motion

- **Radius (one scale, locked — taste §4.4):** card/panel **10**, control/input **8**, chip/pill **full**, inner cell **6**.
- **Elevation = restraint.** Surfaces defined by border + background first. Shadow reserved for genuinely floating layers (the commit/checkout panel, dropdowns, modals, toasts). Shadows are **warm-tinted, never pure black**: `0 1px 2px rgba(28,27,23,.05), 0 8px 24px rgba(28,27,23,.08)`.
- **Borders** carry most hierarchy: `hairline` between rows/cards, `strokeStrong` on focus-adjacent/active.
- **Motion (Foundation §13, taste §6):** functional only — feedback, state-transition, hierarchy, continuity. `transform`/`opacity` only, short (120–220ms), `prefers-reduced-motion` honored globally, never the sole carrier of meaning. Verified on low-end hardware at code time. In hi-fi Figma: shown as state variants + a clickable prototype with simple smart-animate, nothing cinematic.

---

## 4. Trust components — the heart (Foundation §5)

A single trust vocabulary, designed once, reused everywhere. Glance → detail (progressive, Foundation §10).

- **TrustScore** — glance: green pill `◆ Verified · Trust 92` (diamond/shield glyph + word + `Trust NN` in Spline Mono). Detail: a quiet horizontal meter + methodology breakdown (weights, what counts, limits), always one tap away. The number is mono; the meter uses brand green on `sunken` track (no filled dashboard track as decoration — taste ban; this is a real trust instrument, so the meter is allowed and labeled).
- **VerificationBadge** — green pill, shield-check glyph + "Verified" text. Pending = amber `◷ Pending`. Denied = red `⊘ Denied`. Redundant icon+shape+text always.
- **StatusPill** — verified(green) / pending(amber) / in-transit(info) / completed(green) / denied(red). Icon + shape + text.
- **DeliveryConfidence (honest/progressive — owner decision)** — *new* state: "Building track record — N completed" (no %). *established* state (n≥~5): the `NN%` in DataXL mono + denominator line ("39 on time · 1 early · 1 late (2 days, buyer notified). Based on real completed deliveries — not an estimate."). Never implies a guarantee.
- **DecisionAttribution** — named human + evidence basis ("Verified by [admin], [date], on [evidence]"), never "an algorithm decided."
- **Honesty pairing (Foundation §3.2)** — every capability shows its limit in the same view. The buyer commit panel states "Funds held by UmojaHub until you confirm receipt" + what is/isn't protected, before commit.

---

## 5. Illustration & imagery (Foundation §12)

- Purpose-driven only, concentrated at anxiety/comprehension moments (login, role selection, verification, waiting, empty/error/success, trust explainers).
- **Culturally authentic** — real Kenyan farmers/students/markets, never generic/Western stock, never trendy blobs.
- Recolored to this palette (brand green + murram), 2G-safe, reduced-motion-safe.
- Pipeline: **undraw MCP** (`search_svgs` → `get_svg` → Figma `createNodeFromSvg`) recolored off the default purple; bespoke character set (path A) drops into the same named slots. Mid-fi grayscale stand-ins are replaced at hi-fi where a slot earns it.

---

## 6. What stays untouched
Platform logic, data, IA, content, copy decisions (English-first, i18n-tolerant, language toggle stubbed), the three senior-eng decisions (reviews-not-comments, honest Delivery Confidence, English-first). The live **website** (Sora + IBM Plex, light tokens) is out of scope and stays green.

---

## 7. Pre-flight (adapted from taste §14 to a product surface)
Zero em-dashes in product copy · one accent model (green) used consistently · one radius scale · all CTA/button text AA-contrast and one-line · form labels above inputs, AA contrast · no fake-precise numbers (all data labeled real/sample) · no decorative dots except real semantic state · status by icon+shape+text not color alone · dark mode defined + checked · 44px targets · tabular numerals on all data · reduced-motion honored.
