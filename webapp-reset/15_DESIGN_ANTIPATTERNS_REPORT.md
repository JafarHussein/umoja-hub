# Design Anti-Patterns Report

**Reset deliverable 15** (Gate 4). The forbidden list. Two tiers: generic AI-design tells, and — more importantly — **trust-platform-specific anti-patterns that are existential for a product whose product is trust.**

## Tier 1 — Trust-platform anti-patterns (EXISTENTIAL — never, under any pressure)

A platform selling trust dies the instant it behaves untrustworthily. These are hard bans:

- **Manufactured urgency / scarcity** ("3 buyers viewing!", fake countdowns).
- **Fake or inflated trust signals** — fabricated reviews, inflated transaction counts, decorative "verified" badges that don't mean verification.
- **Over-claiming protection** — implying escrow/buyer-protection/guarantees that don't exist (today: no escrow, no dispute workflow, simulated payments). Every capability is **paired with its limitation, in view**.
- **Hiding limitations or bad outcomes** — burying the REVISION_REQUIRED dead-end, hiding "no chargeback," concealing what happens to an uploaded ID.
- **Dark patterns** — confirm-shaming, roach-motel cancellation, pre-checked consents, disguised ads, forced continuity.
- **Deceptive verification states** — anything that lets "pending" read as "verified," or implies human review that didn't happen.

## Tier 2 — Generic AI-design / "slop" tells (avoid by default)

From the standing anti-slop discipline (taste-skill):

- AI-purple/blue gradient glows; oversaturated neon; pure `#000`/`#fff`.
- The generic **three-equal-feature-cards** row; centered-hero-on-mesh sameness.
- **Inter as a default**, oversized scream-headlines, random serif-word emphasis.
- **Decorative blob illustrations / generic Western stock** (deliverable 08 already bans these — illustrations must have a job and depict the real users).
- **Div-based fake screenshots/dashboards**; hand-rolled SVG icons.
- Eyebrow-on-every-section; section-number eyebrows; decorative status dots; the em-dash crutch.
- "Jane Doe" / "Acme" placeholder content; fake-precise invented metrics.

## Tier 3 — Accessibility, density & performance anti-patterns

- **Colour-only meaning** (esp. trust/verification states) — banned; redundant icon+shape+text required (deliverable 10).
- Low contrast; touch targets <44px; placeholder-as-label; meaning conveyed by motion alone.
- **False density** (cramming to look "data-rich") and lazy over-spacing of genuine data surfaces (deliverable 18).
- Heavy assets / blocking JS on 2G; layout shift; spectacle motion on weak devices.

## Enforcement

Run Tier-1 as a release blocker on every trust-bearing surface; Tiers 2–3 via the taste-skill critique gate + the a11y/perf QA gate (deliverable 12).

## Sources

- taste-skill anti-slop ruleset (workspace) + prior gates' trust/honesty findings ([05](05_MARKETPLACE_UX_RESEARCH.md), [07](07_TRUST_VERIFICATION_UX_RESEARCH.md), [10](10_ACCESSIBILITY_REPORT.md)).
