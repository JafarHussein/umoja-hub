# 15 — Design Anti-Patterns Report

**Status:** The "do not do" list. The directive explicitly asks to separate patterns that *look good but fail users* from patterns that *help users*. This report names the forbidden patterns and the UmojaHub-specific traps.

---

## 1. Dark patterns — forbidden outright

Dark patterns raise short-term conversion but **destroy trust** (56% of users report losing trust; long-term churn, legal/regulatory risk). For a *trust* platform they are strategically suicidal. ([Eleken](https://www.eleken.co/blog-posts/dark-patterns-examples), [CBTW](https://cbtw.tech/insights/dark-patterns-in-ux-short-term-wins-long-term-business-risks))

**Banned by name:**
- **Sneaking** — hidden fees, costs revealed only at the end (especially toxic for farmer payouts/buyer pricing).
- **Forced continuity / hard-to-cancel** — easy in, hard out.
- **Confirmshaming** — guilt-wording on opt-outs ("No, I don't care about my farm").
- **Preselected opt-ins** — pre-ticked consent/marketing.
- **Trick questions / double negatives** in forms.
- **Roach motel** — easy to get into a state, hard to leave.
- **Fake urgency/scarcity** — countdown timers, "only 1 left" untruths.
- **Disguised ads / fake notifications.**
- **Obstruction** — burying privacy/verification info.

## 2. "Looks good in a portfolio, fails real users" patterns

These are the patterns the prior directions drifted toward. Avoid:

| Anti-pattern | Why it fails UmojaHub's users | Evidence |
|---|---|---|
| **Hamburger-only / hidden nav** | Halves discoverability; hurts novices most | report 10, NN/g |
| **Heavy hero animation / parallax / scroll-jacking** | Costs data (₦/MB), burns low-end CPU, vestibular risk | reports 05, 08 |
| **Mega menus on a small site** | Complexity with no payoff; "gone wrong" actively harms | report 10 |
| **Icon-only controls** | Ambiguous for low-literacy/second-language users | report 09 |
| **Multi-column forms** | Slower, more errors | report 14 |
| **Low-contrast "aesthetic" text** | Fails AA; unreadable in sunlight on cheap screens | report 09 |
| **Novel/"memorable" navigation metaphors** (the StoryWorld reflex) | Taxes users with least cognitive surplus; violates Jakob's Law | report 05 |
| **Auto-playing carousels without controls** | Violates WCAG 2.2.2; distracting | report 08 |
| **Infinite scroll on key task pages** | Findability loss; no footer/orientation | NN/g IA |
| **Placeholder text as labels** | Disappears on focus; memory + a11y failure | report 14 |

## 3. Process anti-patterns (what caused the churn)

The reset exists because of *process* anti-patterns as much as UI ones:

- **Multiple "authoritative" documents** — five sources of truth = none. → one foundation.
- **Parallel/legacy token systems kept indefinitely** — drift. → one semantic set + deprecation policy (report 05).
- **Aesthetic-first, evidence-never** — directions chosen by reference to Stripe/Linear, not UmojaHub's users. → evidence-traceable decisions (the whole point of this folder).
- **"Memorable" over "usable"** — chasing screenshots/awards. The directive's own warning. → usable, trustworthy, *then* distinctive.
- **Resetting instead of converging** — repeated full restarts. → this is the *last* reset; the foundation is the convergence point.

## 4. The one-line test

For any proposed pattern, ask: **"Does this help a skeptical farmer on a 2G phone complete a real task and trust the result?"** If the honest answer is "no, but it looks impressive," it is an anti-pattern here.

### Sources
- [Eleken — 18 dark patterns](https://www.eleken.co/blog-posts/dark-patterns-examples) · [CBTW — dark patterns business risk](https://cbtw.tech/insights/dark-patterns-in-ux-short-term-wins-long-term-business-risks) · [Page Flows — deceptive design](https://pageflows.com/resources/dark-patterns/)
- Cross-refs: reports 05, 08, 09, 10, 14 (sourced therein).
