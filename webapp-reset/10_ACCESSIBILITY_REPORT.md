# Accessibility Report

**Reset deliverable 10** (Gate 3). Builds on Gates 1–2.

## Scope: accessibility here means more than disability

Evidence: inclusive design must account for **age, literacy, language, cultural background, and situational constraints — not only disability**, and improvements for disabled users also help **low-literacy and second-language users**. For this platform's audience (mixed-literacy rural farmers, varied devices, outdoor use, second-language English) accessibility *is* core usability, not a compliance checkbox.

## Floor and targets

- **WCAG 2.2 AA is the non-negotiable floor**, AAA for critical text where feasible. (The website already meets AA; the app's new system must too, in every theme.)
- Touch targets **≥44px** (varied motor ability, small/cracked screens, outdoor use).
- Visible, non-obscured focus; full keyboard operability; correct semantics + labels for screen readers.

## Platform-specific accessibility priorities

1. **Never encode meaning in colour alone — especially trust/verification states.** Verified / pending / denied, and Trust-Score tiers, must use **redundant encoding: icon + shape + text**, not just red/green. This serves colour-blind users *and* (with clear icons) low-literacy users. This is the single most important a11y rule for this product because the trust signals *are* the product.
2. **Low-literacy support is an accessibility concern** — recognizable visuals paired with plain language; consider **read-aloud / read-along** for onboarding and verification; comprehensible naming for findability.
3. **Language** — validate whether **English-only is acceptable or Swahili/local-language support is required** for farmer adoption (flagged in Gate 1 as a real unknown).
4. **High-contrast and large-text modes** (see Multi-Theme report) for low vision and **outdoor/sunlight legibility** (rural daytime use).
5. **System-preference detection** — `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-motion` respected by default.
6. **Bandwidth as accessibility** — content must be perceivable before heavy assets load (a blank screen on 2G is an access failure).

## How this is enforced (carry into the design system)

- Accessibility built into **tokens and components by default** (contrast-validated token pairings in every theme; accessible component states baked in), so individual screens can't easily regress.
- Verified via **automated (axe/Lighthouse) AND manual keyboard + screen-reader passes** — the standard the website already holds to.

## Open questions to validate

- **Language requirement** (English-only vs. Swahili) — highest-impact unknown.
- **Read-aloud/read-along** feasibility and demand.
- Testing with **real users who have disabilities and/or low literacy**, on real devices, in real (outdoor, low-bandwidth) conditions.

## Sources

- [Portland.gov — Accessibility for designers & UX researchers](https://www.portland.gov/officeofequity/digital-accessibility/how-make-accessible-web-content/accessibility-designers-and)
- [ScienceDirect — Inclusive digital platforms for low-literacy users](https://www.sciencedirect.com/science/article/pii/S2451958825000326)
