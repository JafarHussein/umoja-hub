# Illustration Strategy

**Reset deliverable 8** (Gate 3). Required by the directive: illustrations that **explain, guide, reduce anxiety, and build trust — never decoration**. Builds on Gates 1–2.

## Why illustration is load-bearing here (not optional polish)

For this audience it is not ornament. Evidence: for **low-literacy users, recognizable well-designed visuals (icons/illustrations) carry meaning where words fail**, and inclusive design must account for **literacy, language, culture, and situational constraints**, not just disability. Gate 1 found mixed-literacy, payment-anxious farmers as a core population. So illustration is a **comprehension and trust instrument**.

## The one rule: every illustration has a job

Permitted jobs: **explain** a mechanic, **guide** a next action, **reduce anxiety** at a high-stakes moment, **build trust**, **support onboarding**, **soften an empty/error state**. If an illustration can't name its job in one sentence, it doesn't ship. Banned: trendy blobs, generic Western stock, decorative filler, culturally-mismatched imagery.

## Where illustration earns its place (priority map)

| Surface | Job |
|---|---|
| Login / first-run | Lower the stakes, create warmth, signal legitimacy |
| Role selection | Help users *self-identify* by depicting their real context (farmer / buyer / student / lecturer) |
| Onboarding steps | Explain *what* this step is and *why* it's needed (payoff stated) |
| Identity verification | Reduce the top farmer anxiety — "what happens to my ID?" — by *showing* the document → fingerprint → decision flow |
| Verification waiting | Reduce uncertainty during the pending state (a known anxiety moment) |
| Empty states | Guide the user to populate, never a dead blank |
| Success / error states | Confirm or recover with clarity and warmth |
| Trust & process explainers | Make the Trust Score and the peer→lecturer verification chain legible visually |

## Cultural authenticity (non-negotiable)

Illustrations must depict **the actual users — Kenyan farmers, students, markets — not generic or Western imagery**. Mismatched representation undermines the trust the platform sells. Cultural review is part of the production process.

## Production & system (decide in the design-system gate)

- An **illustration *system***, not one-offs: a defined style, a palette **bound to the design tokens**, consistent line/▢fill/perspective rules, reusable across surfaces.
- **Performance is a hard constraint** (Gate 1: low bandwidth): optimized SVG / lightweight formats, lazy-loaded, reduced-motion-safe. A heavy illustration that fails to load on 2G is worse than none.
- **Production approach** likely AI-assisted generation (ties into the tooling/MCP report) **under firm art direction + consistency + cultural review** — generation is a means, not an excuse for inconsistency or stereotype.

## Open questions to validate

- Do the illustrations **actually improve comprehension / reduce anxiety** for real low-literacy users? (Test, don't assume.)
- Cultural-authenticity review with Kenyan users.
- The right **abstraction level** (literal scene vs. simplified icon-illustration) per surface and literacy level.

## Sources

- [ScienceDirect — Designing inclusive digital platforms for low-literacy users](https://www.sciencedirect.com/science/article/pii/S2451958825000326)
- [MockFlow — Inclusive UX design guide (2026)](https://mockflow.com/blog/inclusive-ux-design)
