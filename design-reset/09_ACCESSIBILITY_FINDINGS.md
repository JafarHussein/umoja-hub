# 09 — Accessibility Findings

**Status:** Evidence on accessibility. Target standard for UmojaHub: **WCAG 2.2 Level AA**. Rationale: AA is the global baseline; UmojaHub's audience (low-end devices, varied literacy, motor/visual diversity, touch-first) makes 2.2's mobile/cognitive additions especially relevant.

---

## 1. WCAG 2.2 — what changed (Oct 2023)

WCAG 2.2 **adds nine success criteria** to 2.1 (it removes/changes nothing). The new criteria target keyboard navigation, **touch targets, cognitive accessibility, and authentication.** ([W3C WAI](https://www.w3.org/WAI/standards-guidelines/wcag/), [AudioEye](https://www.audioeye.com/post/wcag-22/), [Level Access](https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/))

The most load-bearing 2.2 additions for UmojaHub:

| Criterion | Requirement | Why it matters here |
|---|---|---|
| **2.5.8 Target Size (Min)** AA | Pointer targets ≥ **24×24 CSS px** | Touch-first users on small phones |
| **2.4.11 Focus Not Obscured (Min)** AA | Focused element not hidden by sticky/overlay content | Keyboard + low-vision users |
| **2.5.7 Dragging Movements** AA | Drag actions need a single-pointer alternative | Motor diversity; low-end touchscreens |
| **3.3.8 Accessible Authentication (Min)** AA | No cognitive-function test (e.g. memorize/transcribe) required to log in | Reduces login friction; supports OAuth-first auth UmojaHub already uses |
| **3.2.6 Consistent Help** A | Help in consistent location across pages | Trust/findability for novice users |
| **3.3.7 Redundant Entry** A | Don't make users re-enter info already given in a process | Multi-step onboarding/checkout |

## 2. Foundational AA carried from 2.1 (still required)

- **Contrast**: text ≥ 4.5:1 (normal), 3:1 (large); UI components/graphics 3:1. (The brand-text tokens in the repo were already chosen "AA on bg" — keep that discipline.)
- **Visible focus** on all interactive elements (the repo's global `:focus-visible` brand ring is a good base).
- **Keyboard operability** for everything; no keyboard traps.
- **Text resize** to 200% without loss of content/function.

## 3. Beyond-the-checklist for this audience

- **Touch-first, one-handed**: primary actions reachable; targets generous (≥44px recommended for primary, ≥24px AA floor).
- **Low literacy / second-language**: plain language, icon+label (never icon-only for key actions), avoid idiom. (Jakob's Law + cognitive load, reports 05/14.)
- **Low-vision / sunlight**: high contrast is a field-condition requirement (outdoor farmers), not just compliance.
- **Reduced motion** as a first-class mode (report 08).

## 4. Process

- Bake a11y into the token/component layer (focus, contrast, target size) so it's correct *by default*.
- Verify with automated tooling (Lighthouse a11y via the `chrome-devtools` MCP; axe-class checks) **and** manual keyboard/screen-reader passes — automation catches ~30–40% of issues only.

---

## 5. Accessibility principles for the foundation

1. **WCAG 2.2 AA is the floor**, enforced in tokens/components by default.
2. **24px AA / 44px primary** touch targets.
3. **Visible focus, full keyboard operability**, focus never obscured.
4. **Icon + label**; plain language; second-language friendly.
5. **Contrast as a field requirement** (sunlight, cheap screens).
6. **Reduced motion + no auth cognitive tests.**
7. **Don't make users re-enter data** across steps.

### Sources
- [W3C WAI — WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/) · [W3C — WCAG 2.2 requirements](https://w3c.github.io/wcag/requirements/22/)
- [AudioEye — WCAG 2.2 explained](https://www.audioeye.com/post/wcag-22/) · [Level Access — WCAG 2.2 checklist](https://www.levelaccess.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/) · [WCAG.com — 2.2 summary](https://www.wcag.com/blog/wcag-2-2-aa-summary-and-checklist-for-website-owners/)
