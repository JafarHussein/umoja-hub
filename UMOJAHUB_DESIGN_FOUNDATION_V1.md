# UMOJAHUB_DESIGN_FOUNDATION_V1

**Status: DRAFT — AWAITING APPROVAL.**
No new design work — no screens, components, visual systems, or style documents — may begin until this document is approved. This is the single source of truth that replaces every prior, contradictory "authoritative" design document.

**Evidence base:** `design-reset/01`–`15` (audit + sourced research) and the surviving product-truth docs (`UMOJAHUB_PLATFORM_CAPABILITIES_REFERENCE.md`, `context/FOOD_HUB_ECOSYSTEM_MAP.md`, `context/EDUCATION_HUB_ECOSYSTEM_MAP.md`, `context/APPLICATION_USER_JOURNEYS.md`, `context/WEBSITE_PURPOSE_V1.md`). Every decision below cites evidence; none is preference.

**Scope:** UI/UX only. Backend, data model, business logic, auth/RBAC, payments, and integrations are out of scope and unchanged.

---

## 0. Why this document exists

UmojaHub's engineering is strong; its UI/UX layer churned through five+ resets, leaving three palettes, two font systems, and several competing "authoritative" documents (`design-reset/01`). The cause was **aesthetic-first, evidence-never** decision-making and **resetting instead of converging** (`design-reset/15 §3`). This document is the convergence point. After it, decisions are traceable to evidence, and there is one source of truth.

---

## 1. Who are the users?

From the ecosystem maps and capabilities reference:

- **Smallholder Kenyan farmers** — 0.5–5 acres, often no formal business registration, frequently on **low-end Android over 2G/3G**, paying **per megabyte**, sometimes outdoors in bright sun, varied literacy and English-as-second-language. *Primary, most-constrained user.*
- **Buyers** — purchasing produce from farmers they have **no prior relationship with**; arrive skeptical of quality and legitimacy.
- **CS students** — building **verifiable** portfolio/project evidence; institutions may lack global brand recognition, so verifiability is the value.
- **Lecturers** — reviewing/scoring student work; time-constrained.
- **Admins** — verification, mediation, payouts, oversight.

**The unifying truth:** every audience "arrives in an environment where trust cannot be assumed" (`WEBSITE_PURPOSE_V1`). Stripe/GitHub users arrive already trusting the medium; UmojaHub's do not.

## 2. How do they think?

(`design-reset/05, 14`)
- **Skeptical first.** Credibility must be *shown*, not asserted. Surface cues carry trust (Stanford Web Credibility).
- **Cost-aware.** Data is money; a heavy page is a financial and emotional barrier.
- **Pattern-transfer.** They reason from apps they already trust — **M-Pesa, WhatsApp, mobile banking** (Jakob's Law). Novel metaphors cost them.
- **Limited cognitive surplus** for learning software while doing real, money-bearing work (Hick's/Miller's Laws).

## 3. What are they trying to accomplish?

| User | Core job | First-value moment |
|---|---|---|
| Farmer | Sell produce and **get paid** | First listing live |
| Buyer | Find a **verified** supplier and transact safely | First verified supplier found |
| Student | Build a **verified** project/portfolio item | First project created |
| Lecturer | Review and score efficiently | First review submitted |
| Admin | Verify, mediate, pay out with confidence | Queue cleared |

Design serves these jobs. Everything else is secondary.

---

## 4. What should UmojaHub *feel* like?

Three words, in priority order: **Trustworthy. Clear. Grounded.**

- **Trustworthy** — it looks and behaves like a place where real money and real reputations are safe. Verification, provenance, and status are visible and legible. Coherence itself signals competence (`design-reset/05 §1`).
- **Clear** — every screen has one obvious primary action; nothing is hidden behind cleverness; language is plain and in the user's terms (`design-reset/06, 14`).
- **Grounded** — calm, fast, and lightweight; it respects the user's data, device, and attention. It feels *engineered*, not *decorated* — matching the quality of the system underneath.

Distinctiveness comes from **doing the trustworthy/clear/grounded thing better than anyone**, not from spectacle.

## 5. What should UmojaHub *not* feel like?

(`design-reset/15`)
- Not a **flashy startup landing page** — no scroll-jacking, parallax, heavy hero video, or motion spectacle. These cost farmers money and exclude them.
- Not a **generic AI-template SaaS** — no soft-rounded gray cards with drop shadows for their own sake (also the deprecated direction in `CLAUDE.md`).
- Not a **novelty showcase** — no "memorable" invented navigation (the retired StoryWorld direction).
- Not **manipulative** — no dark patterns, fake urgency, or confirmshaming. For a trust platform these are self-defeating.
- Not **incoherent** — never again multiple palettes / type systems / sources of truth.

---

## 6. Non-negotiable design principles

1. **Trust is the product; the UI is its first proof.** Coherence, verifiable cues, and honest surfaces come before beauty. *(05 §1)*
2. **Evidence over taste.** Every notable design decision traces to `design-reset/` evidence or is escalated as an explicit open question. *(whole folder)*
3. **One source of truth.** This document + the semantic token set. No parallel "authoritative" docs, no parallel token systems. Legacy tokens carry a deprecation date, never "indefinitely." *(01, 05 §5)*
4. **One semantic token system, themed by mode.** Global → semantic → component tiers; theme via modes, never via a second parallel system. Brand green `#007f4e` is the fixed anchor. *(05 §5)*
5. **Performance is a design constraint.** Hard budgets; assume 2G + low-end Android. Default to server-rendered, progressively-enhanced, minimal-JS. Subset fonts; WebP/AVIF; lazy non-critical assets. *(05 §4, 06, 14)*
6. **WCAG 2.2 AA is the floor, enforced by default in tokens/components.** *(09)*
7. **Familiar mental models.** Mirror M-Pesa/WhatsApp/mobile-banking conventions, especially for money and messaging. *(05 §2, 14)*
8. **Progressive disclosure.** Lead with the core job per role; reveal complexity on demand; never a blank/void empty state. *(06, 07)*
9. **Motion is functional or absent.** *(08)*
10. **Plain, inclusive language; icon + label.** Second-language and low-literacy friendly. *(09)*

## 7. Forbidden principles (hard "no")

(`design-reset/15`)
- ❌ Dark patterns of any kind (sneaking, forced continuity, confirmshaming, preselected opt-ins, fake urgency, roach motel, obstruction).
- ❌ Hamburger-only / hidden primary navigation.
- ❌ Heavy hero animation, parallax, scroll-jacking, autoplay carousels without controls.
- ❌ Mega menus (the site is small).
- ❌ Icon-only controls for key actions; placeholder-as-label; low-contrast "aesthetic" text.
- ❌ Multi-column forms.
- ❌ Novel/"memorable" navigation metaphors that violate Jakob's Law.
- ❌ Reintroducing a second theme/palette/font system outside this foundation.
- ❌ Choosing inspiration from a product (Stripe/Linear/etc.) *before* the problem — inspiration is selected, with rationale, only after this foundation.

---

## 8. Visual patterns that support the goals

> This foundation fixes **principles and constraints**, not final pixels. Specific scales/values are ratified in a follow-up "Visual System V1" *after this doc is approved*, built in Figma + tokens (`design-reset/11–13`).

- **Color:** one semantic set; **brand green `#007f4e`** as the single accent that does the work; color carries **meaning** (success/warning/danger/info/verified), never decoration; all combinations meet AA, validated in sunlight/cheap-screen conditions. *(01 T-2, 09)*
- **Surfaces:** start from the working dark product theme as the proven base; any website/light theme is a **mode of the same token set**, not a parallel system. *(02)*
- **Typography:** **one** typographic voice across product and website (collapse the current two-font split); subset aggressively; type scale optimized for small screens and readability, not display drama. *(01 T-3, 13)*
- **Components:** standardize `ui/` primitives on **Radix-backed, a11y-by-default** behavior (shadcn copy-in already present), evolving the working app rather than restarting it. *(06 §5, 13)*
- **Verification/trust cues:** a consistent, legible visual language for "verified," provenance, status, and scores — this is UmojaHub's signature surface, the place to invest distinctiveness. *(05 §1)*

## 9. Interaction patterns that support the goals

(`design-reset/14`)
- One **clear primary action** per screen; defaults for the common case.
- **Single-column, top-labeled forms**; inline, specific, recoverable errors; no redundant entry.
- **Chunked flows**, ≤4 decisions/step, visible progress, no data loss on back.
- **Immediate, honest feedback**; skeletons on slow networks; **safe retry** on flaky connectivity (no double-charge — surface the existing idempotent payment behavior, logic unchanged).
- **Confirm only the irreversible.**
- Generous **touch targets** (≥24px AA, ≥44px primary), one-handed reach.

## 10. Motion patterns that support the goals

(`design-reset/08`)
- Motion only to **communicate state** (loading, success, transition).
- **≤200–300 ms**; no large scale/pan/parallax; prefer opacity/color/small transforms.
- **`prefers-reduced-motion` honored globally** (reduced = fade/instant).
- **Pause/stop** for anything auto-playing; nothing essential conveyed by motion alone.
- Motion has a **bandwidth budget** — if it adds weight, justify it against data cost.

## 11. Accessibility requirements

(`design-reset/09`) — **WCAG 2.2 AA**, with emphasis on:
- Target size **≥24px (AA)** / **≥44px primary**; focus visible and **never obscured**; full keyboard operability.
- **Contrast** ≥4.5:1 text / 3:1 large & UI — treated as a *field requirement* (sunlight, cheap screens), not just compliance.
- **No cognitive-test authentication** (supports OAuth-first); **no redundant entry**; **consistent help** placement.
- **Icon + label**, plain language, second-language friendly.
- Reduced motion as a first-class mode. Verified via Lighthouse/axe **and** manual keyboard/screen-reader passes.

## 12. Onboarding philosophy

(`design-reset/07`)
- **Goal-first, per role** — move users toward their first real outcome, not a feature tour.
- **Activation, not registration** — instrument each role's first-value moment.
- **Don't gate seeing value behind verification** — gate only transacting.
- **Explain the *why*** of every sensitive step (identity/verification) — transparency reduces fear-driven abandonment and is itself a trust lever.
- **Chunk**; ≤4 choices/step; the existing 3-step flow stays single-purpose.
- First post-signup screen = **instructive empty state**.

---

## 13. What carries over (not reset)

- The **working product** (dashboard/marketplace/onboarding/auth) — plumbing, RBAC, 659 passing tests. We **evolve** its identity, not its logic.
- **Brand green `#007f4e`** — the one continuous identity element.
- The **semantic token architecture** (`rgb(var(--x)/<alpha>)`).
- **Product-truth docs** as the ongoing evidence base.

## 14. Open questions for approval

1. **Default surface theme** for the *website*: dark (matching product) or a light mode of the same tokens? *(recommend: decide in Visual System V1 via Figma exploration; do not fork the token system either way)*
2. **Single typeface family** to unify product + website (collapsing Sora/Jakarta) — needs a pick.
3. **Audience-page consolidation**: the old site had 7 `/for/*` pages; IA evidence (`10`) favors a smaller, flat set — confirm the audience list before rebuild.
4. **Flagged docs** in `design-reset/03 §3` (`WEBSITE_PURPOSE_V1`, `WEBSITE_WEBAPP_BOUNDARY`, `WEBSITE_ENFORCEMENT_RULES`, `APPLICATION_USER_JOURNEYS`) — kept as input; confirm keep, or delete for a barer slate.

## 15. What approval unlocks

On approval, the next (separate) deliverables — **not before** — are:
1. **Visual System V1** (final color/type/spacing/component tokens) in Figma + code tokens.
2. **App-shell hardening** plan (a11y, empty states, performance) — evolve the working product.
3. **Website rebuild** plan against this foundation (flat IA, performance-budgeted, trust-forward).

Until then, this document stands alone. Design begins only after it is approved.
