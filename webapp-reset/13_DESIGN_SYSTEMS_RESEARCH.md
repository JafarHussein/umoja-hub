# Design Systems Research

**Reset deliverable 13** (Gate 4). **We study these for architecture, accessibility, and process — we do NOT inherit their visual identity** (per directive). The question is *how mature systems are built*, not *how they look*.

## Systems studied and the lesson each offers

| System | Why relevant | Architectural lesson to take |
|---|---|---|
| **GOV.UK Design System / USWDS** | Trust-first, public-sector, **accessibility-led, plain-language, works on poor devices** — the closest philosophical match to UmojaHub's trust + inclusive + low-bandwidth mandate | Accessibility and **progressive enhancement as the foundation** (content works without JS); plain-language patterns; rigorous, evidence-backed component docs. The strongest reference for *how to think*. |
| **IBM Carbon** | Enterprise, **data-dense** | Mature token system; **data-table / dense-surface patterns** for the lecturer/admin density (deliverable 18). |
| **Shopify Polaris** | **Marketplace / commerce admin**, two-sided | Patterns for merchant-side management surfaces; reducing seller friction; status/feedback conventions. |
| **Material 3** | Sophisticated **theming/token** model | Token-driven theming architecture (semantic roles, dynamic theming) — take the *mechanism*, not the Material look. |
| **Radix Themes / shadcn / base-ui** | **Owned, headless, a11y-first primitives** | The code substrate pattern: own the component code, accessibility baked into primitives, token-driven. The app already uses base-ui/shadcn-style primitives — keep that architecture, re-skin to the new system. |

## Common lessons across all of them

1. **Token-driven, semantic, themeable** — none hardcode values in components (validates the 3-tier approach, deliverable 11).
2. **Accessibility is built into primitives and tokens**, not bolted on per screen (deliverable 10).
3. **Components have rigorous, documented APIs** and full state coverage.
4. **The system is documented and governed** — a living source of truth, which for us is Figma + Code Connect.

## What we explicitly reject

- **Their visual identity** — no Carbon/Material/Polaris/GOV.UK *look*. UmojaHub's identity comes from its own research, not a borrowed system.
- **Over-abstraction** — we build the components this platform needs, not a generic kit.

## Sources

- [GOV.UK Design System](https://design-system.service.gov.uk/) · [USWDS](https://designsystem.digital.gov/)
- [IBM Carbon](https://carbondesignsystem.com/) · [Shopify Polaris](https://polaris-react.shopify.com/) · [Material 3](https://m3.material.io/) · [Radix Themes](https://www.radix-ui.com/themes)
