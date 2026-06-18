# Multi-Theme Architecture Report

**Reset deliverable 11** (Gate 3). Builds on Gates 1–3.

## Requirement

The new app design system must support **light, dark, future custom themes, and accessibility modes (high-contrast, large-text, colour-blind-safe), with system-preference detection** — and look *exceptional*, not merely functional, in every mode.

## Architecture: themes are value-maps over one semantic set (never parallel systems)

The proven mechanism (already shipped for the website's light mode) is the right one and should be the app's foundation too:

- **Three tiers:** `primitive` (raw palette, mode-agnostic) → `semantic` (role+intent: `bg`, `surface`, `fg`, `brand`, `state/*`, `border` — the only tier components consume) → `component` (scoped, only when needed).
- **A theme is a re-mapping of the semantic set**, applied via a single scope (class / `data-theme` attribute) on a subtree. **One semantic vocabulary, many value maps.** Never fork into parallel `--app-*` / `--xyz-*` systems — that was an explicitly-killed assumption.
- This makes **light/dark/custom/white-label** all *values*, not code forks, and lets a nested subtree flip themes (e.g. an inverted band) cleanly.

## Accessibility modes compose with colour themes

- **High-contrast** = a theme variant with AA→AAA-boosted token values; gated on `prefers-contrast`.
- **Large-text** = a type-scale mode (token-driven) that composes with any colour theme; respects OS large-text / zoom.
- **Colour-blind safety is not a separate theme** — it's a *constraint on every theme*: state colours must be distinguishable without hue, backed by the redundant icon+shape+text encoding (deliverable 10). Validate palettes against common CVD types.
- All modes respect `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-motion`.

## Colour discipline (per theme)

- Define semantic roles **once**; each theme supplies **AA-validated values** for every text/UI pairing (the discipline the website already follows).
- **State colours (success/warning/danger/info/verified) must hold meaning across all themes** and clear contrast in each — they carry the trust signals, so they cannot wash out in dark or high-contrast mode.
- Brand identity must stay recognizable across modes (don't desaturate the brand into dark mode).

## Mechanics & performance

- Theme switch via CSS custom properties — **cheap, no re-render storm**; instant.
- Default to **system preference**; offer a manual toggle where a mode would otherwise lose key expression.
- No pure `#000`/`#fff` (depth); depth via surface steps + borders, not heavy shadow.

## Relationship to the preserved website

The website's `theme-website` (light) is the **reference implementation of this mechanism** and stays live. The app's new themes reuse the *architecture* but get **new, research-driven values** — the app is not required to reuse the website's specific palette (that's a foundation decision).

## Open questions to validate

- **How many themes at launch** (light + dark + high-contrast? custom/white-label later?).
- **Manual toggle vs system-only** — and whether users want it.
- Any **white-label / partner-theming** requirement (would raise the bar on token scoping).

## Sources

- Builds on the platform's existing three-tier, mode-themed token mechanism (the preserved website slice) + [10 Accessibility](10_ACCESSIBILITY_REPORT.md).
