# 08 — Motion Design Findings

**Status:** Evidence on motion/animation. The prior direction (StoryWorld, `AnimateIn`, scene transitions, copper/teal motion easings) leaned on motion for *spectacle*. This report reframes motion as *function* under hard performance and accessibility constraints.

---

## 1. Motion must be functional, brief, and reduced by default

- UX motion "typically does not last more than 1 second"; keep duration short and movement reasonable. ([Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/), [Sarah Darr](https://www.sarahdarr.com/post/accessible-animation-best-practices))
- **Scaling or panning large objects are vestibular triggers** — avoid them. Prefer opacity/color/fade over large positional motion. ([IBM Design](https://medium.com/design-ibm/accessible-motion-why-its-essential-and-how-to-do-it-right-ff38afcbc7a9), [CodeLucky](https://codelucky.com/css-accessibility-reduced-motion/))

## 2. `prefers-reduced-motion` is mandatory, not optional

- The media feature detects a user's OS-level setting; sites **must** detect it and adjust at the code level (CSS for CSS animations, JS for JS animations). ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion), [CSS-Tricks](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/))
- Motion can disorient or harm people with vestibular disorders, photosensitive epilepsy, low vision, and distract users with ADHD. ([BOIA](https://www.boia.org/blog/what-to-know-about-the-css-prefers-reduced-motion-feature))
- **Best practice is not all-or-nothing**: under reduced-motion, use *less/slower/replaced* motion (lean on fade/color), not necessarily zero. ([Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/))

## 3. Provide controls for any auto-playing/looping motion

WCAG **SC 2.2.2 Pause, Stop, Hide** requires a mechanism to limit motion that starts automatically and lasts >5 s. ([Pope Tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)) → No autoplaying carousels/looping hero animations without a stop control.

## 4. Motion costs bandwidth and battery (UmojaHub-specific)

Decorative motion ships JS/CSS weight and burns CPU on low-end Android — directly conflicting with the 2G cost reality (report 05). For UmojaHub, **the default state of motion is "almost none."**

---

## 5. Motion principles for the foundation

1. **Function only**: motion must communicate state change (loading, success, transition), never decorate.
2. **≤200–300 ms** for UI transitions; nothing essential conveyed by motion alone.
3. **No large scale/pan/parallax**; prefer opacity/color/small-distance transforms.
4. **`prefers-reduced-motion` respected globally** via a single base rule; reduced = fade/instant.
5. **Pause/stop** for anything auto-playing.
6. **Motion has a bandwidth budget**; if it adds weight, justify against the data cost.

> Net: the StoryWorld-era motion vocabulary is retired. A global reduced-motion rule and a tiny set of functional transitions replace it.

### Sources
- [MDN — prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) · [CSS-Tricks](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/)
- [Pope Tech — Accessible animation](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/) · [IBM Design — Accessible motion](https://medium.com/design-ibm/accessible-motion-why-its-essential-and-how-to-do-it-right-ff38afcbc7a9)
- [BOIA — prefers-reduced-motion](https://www.boia.org/blog/what-to-know-about-the-css-prefers-reduced-motion-feature) · [CodeLucky](https://codelucky.com/css-accessibility-reduced-motion/) · [Sarah Darr](https://www.sarahdarr.com/post/accessible-animation-best-practices)
