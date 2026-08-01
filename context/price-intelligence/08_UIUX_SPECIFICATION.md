# 08 — UI/UX Specification

**Status:** Draft for approval · **Date:** 2026-07-29 · **Depends on:** `05`, `06`, `09`

> **Governance.** The web app is under the nuclear reset directive (`CLAUDE.md`, 2026-06-16). The constitution is `webapp-reset/UMOJAHUB_WEBAPP_FOUNDATION_V1.md`; the token system is `webapp-reset/DESIGN_SYSTEM_V1.md`; **Figma (file `bHjVuFiAzzBQdViTAj2Twh`) is the source of truth** and no implementation-led design exploration is permitted.
>
> **This document is a specification, not a design.** It defines behaviour, content, states and constraints so that Lo-fi → Mid-fi → Hi-fi → Prototype can be produced in Figma and approved at each gate. **No component code is written until those gates pass.**

---

## 1. What is wrong with the current panel

`PriceRecommendationPanel.tsx` (195 lines) renders a heading, a confidence pill, a large price with a "Use" button, and five label–value rows: market range, regional average, demand, trend, expected earnings. It is competent, it uses the right tokens, and the brief is correct to discard it.

The problem is not visual. It is that **the panel answers a question the farmer did not ask.** It reports five statistics of equal visual weight and leaves the farmer to synthesise a decision from them. Nothing in it says *what to do*, *how sure we are*, *what happens if you wait*, or *where this came from*. The "Use" button is the only affordance, and it invites acceptance without understanding — the exact black-box behaviour the brief prohibits.

A financial analytics product for a professional can present a metric grid, because the professional arrives with a model in their head. A smallholder deciding what to charge for a crate of tomatoes has no such model. **The interface must supply the reasoning, not just the inputs to it.**

---

## 2. Design position

**An assistant that has done the homework and shows its work.**

Concretely, four commitments that each rule out a common alternative:

| Commitment | Rules out |
|---|---|
| **Lead with a judgement, not a table.** One sentence stating what the market is paying and how sure we are. | The metric grid |
| **Every figure is traceable.** Any number can be expanded to the evidence behind it. | "Trust the AI" |
| **Uncertainty is displayed, never hidden.** Thin evidence looks visibly thin. | A confident-looking number over three data points |
| **Guidance, never enforcement.** No blocked listing, no forced price, no dark pattern. | Validation errors on "wrong" prices |

The fourth is already the platform's behaviour and must survive the redesign.

---

## 3. Structure: three tiers of disclosure

The farmer surface is one component with three tiers. **Tier 1 is always visible; Tiers 2 and 3 expand.** This is what lets the same component serve a farmer who wants a number in four seconds and one who wants to understand the market.

### Tier 1 — The verdict *(always visible)*

- **The headline.** Recommended range as the primary figure — `KSh 112–125 / kg` — in `Data XL`, Spline Sans Mono, tabular numerals. **The range is the headline, not the point estimate.** A single number implies a precision the data does not have; a range is both more honest and more useful, and it is what the engine actually computes (weighted p25–p75 around the median).
- **Confidence, as words first.** `High confidence · 18 recent sales in Kirinyaga`. The percentage may appear, secondary. A bare "92%" invites the question "92% of what?" and has no good answer.
- **One sentence of plain reasoning**, from the explanation layer: *"Prices in Kirinyaga have risen about 8% this month as supply from neighbouring counties has tightened."*
- **Position feedback** once the farmer has typed a price (§4).

### Tier 2 — The evidence *(expanded by default on the standalone page, collapsed in the form)*

Grouped into three questions, each a small block:

| Block | Answers | Contents |
|---|---|---|
| **What the market is paying** | "What are buyers currently paying?" | County median · range · neighbouring counties · wholesale/retail spread where external data exists |
| **Which way it is moving** | "Will prices rise or fall? Should I wait?" | Recent trend · seasonal position · forward tendency with its uncertainty band · wait-vs-sell guidance |
| **How fast it will sell** | "What price gives the highest chance of selling?" | Demand level · competing listings · expected selling speed at the typed price |

### Tier 3 — The ledger *(always available, never automatic)*

*"Where does this come from?"* opens the evidence ledger: number of observations, their split between completed sales / asking prices / external market data, the geographic scope actually used, the date range, and named sources with dates. This is the tier that makes the whole feature defensible, and it is also what an administrator sees when answering a dispute.

---

## 4. The farmer's moment: typing a price

The brief asks that entering a price immediately surfaces guidance. The behaviour:

| Farmer's price vs recommended range | Signal | Copy |
|---|---|---|
| Inside the range | **Well placed** (success) | "In line with what buyers in Kirinyaga are paying." |
| 0–15% above high | **Above typical** (warning) | "A little above the usual range. It may take longer to sell." |
| >15% above high | **Well above typical** (warning) | "Much higher than recent sales here. Buyers may pass this by." |
| 0–15% below low | **Below typical** (info) | "Below the usual range — it should sell quickly, but you may be leaving money behind." |
| >15% below low | **Well below typical** (info, emphasised) | "Well under what buyers here have been paying. Please check your price." |

Rules:

- **Never an error state.** Underpricing uses `info`, not `danger` — a farmer is free to sell cheaply and the platform's job is to make sure it is a choice. Overpricing uses `warning`, never blocking. The `danger` token appears nowhere in this component.
- **Underpricing is treated as the more serious harm.** It is silent — a farmer who underprices sells fast and never learns they lost margin. Its copy is therefore more direct, even though its token is calmer.
- **Debounced and non-jumpy.** The signal updates on pause, not per keystroke. Layout height must not change as the message changes — the current 400 ms debounce (`PriceRecommendationPanel.tsx:59`) is right; reserved space is the addition.
- **Nothing appears when confidence is too low to justify it.** Below the display threshold in `09_RECOMMENDATION_ENGINE_SPEC.md`, the component shows the empty state instead of judging a price it cannot assess.

---

## 5. States

At pilot scale the thin states are the *common* case, not the edge case. They are specified first-class and must be designed in Figma with equal care, not treated as a fallback.

| State | Condition | Behaviour |
|---|---|---|
| **Idle** | No crop or county chosen | Quiet prompt: "Choose a crop and county to see what the market is paying." |
| **Loading** | First fetch | Skeleton at the final height. No spinner. |
| **Confident** | ≥ MIN_POINTS at county scope, good confidence | Full three tiers |
| **Widened** | Fell back to adjacent / region / national | Full display, but **the scope is stated in the headline**: "Based on prices across Central region — too few recent sales in Kirinyaga alone." |
| **Thin** | Below `MIN_POINTS` | **No price.** "We don't have enough recent sales of tomatoes near you to suggest a price yet." Plus what the farmer can do: see the crop's national picture, or list and help build the record. |
| **Degraded** | Engine error | "We can't read the market right now. You can still publish your listing." Never blocks. |
| **Stale** | External sources stale | Renders normally with a dated note: "Market data last updated 14 June." |

The **Thin** state is the most important screen in this specification. It is what most farmers will see first, and it is where the platform either earns trust by admitting ignorance or loses it by inventing a number.

---

## 6. Visualizations

The brief asks for meaningful visualizations and warns against a dashboard full of charts. Both halves are taken seriously: **four charts total, each earning its place by answering a question that a sentence cannot.**

| # | Chart | Question | Form |
|---|---|---|---|
| 1 | **Price history** | "What has been happening?" | Sparkline in Tier 1; full line chart with an uncertainty band in Tier 2. Actual history solid, forward tendency dashed with a shaded band — **visually distinct, never continuous with the actuals.** |
| 2 | **Where your price sits** | "Is my price too high or too low?" | Horizontal strip: recommended range as a band, recent observations as ticks, the farmer's typed price as a labelled marker. Replaces three of the current panel's five rows. |
| 3 | **Neighbouring counties** | "What are neighbours charging?" | Ranked horizontal bars, the farmer's county highlighted. Needs the adjacency graph (`06` §2). |
| 4 | **Seasonal pattern** | "Is this normally a good time to sell?" | Twelve-month band showing the crop's typical seasonal position, today marked. Only where a cited calendar or a derived index exists — the seven crops without one show nothing rather than a flat line. |

**Explicitly rejected:** pie or donut charts (no part-to-whole question here); gauge/speedometer for confidence (implies precision the score does not have); dual-axis charts (misleading by construction); any chart rendered when its underlying data is below `MIN_POINTS` — a chart of three points is decoration that looks like evidence.

**Chart rules.** Follow the platform's `app` token ramp. Colour never carries meaning alone — every state has a label or shape. Tabular numerals throughout. Every chart needs a text equivalent for screen readers and for the case where it fails to render. Wide charts scroll inside their own container; the page never scrolls horizontally.

---

## 7. Surfaces

| Surface | Route | Role |
|---|---|---|
| **Listing form** | Farmer listing creation | Tier 1 + collapsed Tier 2. Decision support at the moment of decision. The primary surface. |
| **Prices page** | Farmer prices route | All three tiers, exploratory: pick crop, county, unit; compare; look back. |
| **Listing detail (buyer)** | Marketplace | Fairness signal only — `10_BUYER_PROTECTION_STRATEGY.md` |
| **Cooperative view** | Group dashboard | Existing `cooperativeInsights.ts` projection, re-skinned |
| **Admin** | Admin prices | `11_ADMINISTRATOR_TOOLS.md` |
| **Farm Assistant** | Chat | Grounded in engine figures via `assistantPriceContext.ts` — unchanged; the assistant quotes the engine and never authors a price |

Consistency requirement: the number a farmer sees in the listing form, on the prices page, and from the assistant must be **the same number**, because they share one cached `composeRecommendation` call. Any divergence is a defect, and `09` §D4 removes the second, contradicting price system that makes divergence possible today.

---

## 8. Content and language

The audience is a smallholder farmer, often on a phone, often not reading English as a first language. There is an active localization programme (`feat/localization-pass-2`, merged) and this component's copy joins it.

- **Short sentences. Concrete nouns. No jargon.** Never "weighted median", "confidence interval", "percentile" or "model" on the farmer surface. "Usual range", "how sure we are", "recent sales".
- **Currency is `KSh`**, matching the localization pass. Figures in Spline Sans Mono with tabular numerals.
- **Never imply obligation.** "You could", "many farmers here are getting", never "you should charge".
- **Attribute external data in plain words:** "from the Ministry of Agriculture's market prices (KAMIS), 27 July" — not a citation format.
- **Never claim more certainty than the ledger supports.** If four observations back a figure, the copy says four.

---

## 9. Accessibility and performance

- **WCAG 2.1 AA.** Note the standing rule from the design system's contrast audit: `text/faint` is reserved for placeholder, disabled and large decorative text only — **any informational meta or timestamp uses `text/muted`.** This component is dense with meta text and is exactly where that rule gets broken; it is called out here so the Figma review catches it.
- **Colour is never the only signal** — icon plus shape plus text on every state, consistent with the existing StatusPill discipline.
- **Charts have text equivalents** and the component is fully usable with charts suppressed.
- **Mobile-first at 360 px.** Tier 1 must be complete and readable without scrolling on a small phone. Charts stack; the price strip (chart 2) is the one chart that must work at that width, since it carries the primary judgement.
- **Perceived instantaneity.** Cached at 600 s server-side (`04` §4); skeleton at final height; no layout shift; previous data stays visible while new data loads rather than blanking.

---

## 10. Figma deliverables and gates

Per the reset process — stop and present at each gate; never skip one.

| Gate | Deliverable |
|---|---|
| **Lo-fi** | Tier structure; the five typed-price states; all seven display states — *including Thin and Degraded* |
| **Mid-fi** | Content hierarchy; the four charts; mobile 360 px; expand/collapse behaviour |
| **Hi-fi** | Full token application, Light + Dark; contrast pass; the evidence ledger |
| **Prototype** | Typing a price and watching the signal change; expanding to the ledger |
| **Design system** | New primitives only if genuinely new — the price strip almost certainly is; range/confidence display may compose from existing Card, StatusPill, Alert, Table |
| **Implementation plan** | Component breakdown, API shape alignment with `09`, test plan |

**Reuse before creation.** `src/components/app/` already provides Button, Card, Alert, StatusPill, VerificationBadge, TrustScore, Table, Tabs, Modal, Field. The redesign composes these wherever possible; every proposed new primitive must justify why an existing one does not serve. This is the rule that kept the app component library coherent through five role hubs and it applies here.

---

**Next:** `09_RECOMMENDATION_ENGINE_SPEC.md` — the contract this interface renders.
