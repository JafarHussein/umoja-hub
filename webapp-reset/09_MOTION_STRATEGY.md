# Motion Strategy

**Reset deliverable 9** (Gate 3). Builds on Gates 1–2.

## The governing constraint: this audience runs on weak devices

Gate 1 established low-end Android, 2G/3G, mixed literacy as a core population. So motion is **functional, restrained, and performance-safe by default** — never cinematic, never decorative. Janky motion on a weak device reads as a *broken*, untrustworthy product, which directly attacks the platform's core asset.

## Motion must be motivated — the only permitted jobs

1. **Feedback** — acknowledge a user action (a tap, a submit). Most critical at the platform's high-stakes moments: **payment, document submission, verification**. A clear "received / processing" beat reduces the anxiety Gate 1 found at exactly these points.
2. **State transition** — show that something *changed* (verification pending → verified; order placed → fulfilling). State changes are central to this product; motion makes them legible.
3. **Hierarchy / attention** — draw the eye to the one thing that matters next.
4. **Continuity / orientation** — keep the user oriented across a flow (onboarding steps, drill-in/out).

If an animation serves none of these, it doesn't ship.

## Hard rules (carry into the design system)

- Animate **`transform` and `opacity` only**; never layout properties. Short durations (functional, not showy).
- **`prefers-reduced-motion` honored globally** (already implemented platform-wide) — and reduced-motion must remain fully usable; **never encode meaning in motion alone** (a state change must also be conveyed by text/icon/colour).
- **Never block content on animation** — content-first, motion as enhancement (consistent with the low-bandwidth, JS-light ethos).
- Test on **real low-end hardware**, not just a fast laptop.

## Motion intensity adapts by surface (role-aware)

- **Dashboards / lecturer / admin tools** — minimal motion. The app is a *tool*; motion is feedback and state only.
- **Onboarding / trust / first-run moments** — slightly more, strictly motivated (continuity, reassurance), still cheap.

## Open questions to validate

- Real-device performance budget for motion (frame timing on target phones).
- Does reassurance-motion at payment/verification **measurably reduce anxiety / abandonment**? (Test.)
- Does any motion **hinder** low-literacy comprehension? (Watch real sessions.)

## Sources

- Builds on [04 User Research](04_USER_RESEARCH_FINDINGS.md) (device/bandwidth reality) and the platform's existing global `prefers-reduced-motion` rule.
