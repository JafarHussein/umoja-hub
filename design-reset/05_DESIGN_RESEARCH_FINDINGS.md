# 05 — Design Research Findings (cross-cutting)

**Status:** Evidence synthesis. This is the umbrella research doc; reports 06–15 drill into specific domains. Every claim here is sourced.
**Lens:** Findings are filtered through UmojaHub's *actual* users — smallholder Kenyan farmers (often on 2G/low-end Android, paying per-MB), CS students building verifiable portfolios, skeptical buyers, lecturers, and admins. We deliberately did **not** start from famous products' aesthetics.

---

## 1. The central design problem is *trust*, not *taste*

UmojaHub's own purpose document states the case plainly: its users "arrive in an environment where trust cannot be assumed." Stripe/GitHub users arrive *already trusting* the medium; UmojaHub's do not. The design literature confirms this is a solvable design problem, not a branding one.

- The **Stanford Web Credibility Project** (3 years, 4,500+ people) found that the *average* user "paid far more attention to the superficial aspects of a site, such as visual cues, than to its content." Credibility is built across four dimensions: **graphic design, structure design, content design, and social-cue design.** ([Stanford](https://credibility.stanford.edu/guidelines/index.html))
- This is a double-edged finding: surface design *carries* trust, so a cheap or incoherent UI actively **destroys** the credibility the engineering earns. UmojaHub's current incoherence (three palettes, five "authoritative" docs) is therefore a *trust liability*, not just an aesthetic one.

**Implication for the foundation:** the visual system's first job is to *signal verifiability and competence* — clean structure, consistent cues, evidence on the surface — before it is "beautiful."

---

## 2. Cognitive load is the budget; spend it on the task

Three laws, all validated, govern how much a user can handle:

- **Hick's Law** — more options = slower decisions; reduce/segment choices. ([Laws of UX](https://lawsofux.com/), [Dovetail](https://dovetail.com/ux/hicks-law/))
- **Miller's Law** — working memory holds ~7±2 items; **chunk** content. ([Perpetual](https://www.perpetualny.com/blog/ux-design-principle-004-millers-law))
- **Jakob's Law** — users expect your site to work like the other sites they already know; **leverage familiar mental models** rather than inventing novel ones. ([UX Design Institute](https://www.uxdesigninstitute.com/blog/laws-of-ux/))

**Implication:** UmojaHub serves first-time-internet-commerce users. Novel, "memorable" interaction metaphors (the StoryWorld direction) tax exactly the users with the least cognitive surplus. **Familiar > clever.** Memorability should come from *clarity and trust*, not from inventing new navigation physics.

---

## 3. Ethical design outperforms manipulation — measurably

- Dark patterns reliably *raise* short-term conversion but *destroy* trust: a 2023 Dovetail study found **56% of users lost trust** in a platform due to manipulative design. ([Eleken](https://www.eleken.co/blog-posts/dark-patterns-examples), [CBTW](https://cbtw.tech/insights/dark-patterns-in-ux-short-term-wins-long-term-business-risks))
- A Princeton/Chicago study of 11,000 e-commerce sites found 10% used deceptive practices. ([research summary](https://www.eleken.co/blog-posts/dark-patterns-examples))

**Implication:** For a platform whose entire thesis is *trust*, dark patterns are not merely unethical — they are strategically self-defeating. The foundation must **forbid** them by name (see report 15).

---

## 4. Performance *is* UX for this audience

- On a 2G connection, a **5 MB page takes ~40 s**; a **500 KB page takes ~4 s**. Every extra second of load costs ~7% of conversions. ([Techrahisi](https://techrahisi.co.ke/how-to-design-mobile-apps-for-low-bandwidth-networks/))
- Data has direct monetary cost: in nearby Nigeria, 1 GB costs ₦1,000–3,000 and a 50 MB session "is spending real money." Kenya is comparable. ([Launchpad](https://launchpad.ng/resources/africa-low-bandwidth-design))

**Implication:** Heavy hero animations, large imagery, and decorative motion are not neutral — they **cost UmojaHub's farmers money** and exclude them. Performance budgets are a *design* constraint, not an engineering afterthought (see reports 06 and 08).

---

## 5. Design tokens are the antidote to churn

The repo's churn (multiple resets, three palettes) is a textbook symptom of an immature token system. Mature 2025 practice:

- **Three-tier tokens**: global (raw values) → **semantic/alias** (role + intent, e.g. `color.primary`) → component-scoped. Author UI against *semantic* tokens so palette changes don't break dependents. ([Netguru](https://www.netguru.com/blog/design-token-naming-best-practices), [Smashing](https://www.smashingmagazine.com/2024/05/naming-best-practices/))
- Mature teams add **versioning, deprecation policy, and automated linting** of tokens. ([Design Systems Collective](https://www.designsystemscollective.com/systematic-taxonomy-in-design-tokens-a-framework-for-scalable-ui-architecture-45cc6f2c7686))

**Implication:** UmojaHub already adopted the *right mechanism* (`rgb(var(--x)/<alpha>)` semantic tokens) — the failure was keeping legacy layers alive in parallel. The foundation must mandate **one** semantic token set, a **deprecation policy** (no indefinite legacy), and **theme-by-mode**, not theme-by-parallel-system.

---

## 6. What this means for UmojaHub (synthesis)

| Evidence | UmojaHub design consequence |
|---|---|
| Surface cues carry trust (Stanford) | Coherence and verifiable cues are P0; incoherence is a trust bug |
| Cognitive load laws | Familiar patterns; chunked, progressive flows; fewer choices per step |
| Dark patterns erode trust | Ethical-by-default; forbidden-pattern list |
| 2G cost reality | Strict performance/data budgets as design constraints |
| Token maturity | One semantic token set, deprecation policy, mode-based theming |

These five findings are the spine of `UMOJAHUB_DESIGN_FOUNDATION_V1.md`.

---

### Sources
- [Stanford Web Credibility Project](https://credibility.stanford.edu/guidelines/index.html)
- [Laws of UX](https://lawsofux.com/) · [UX Design Institute — Laws of UX](https://www.uxdesigninstitute.com/blog/laws-of-ux/) · [Dovetail — Hick's Law](https://dovetail.com/ux/hicks-law/) · [Perpetual — Miller's Law](https://www.perpetualny.com/blog/ux-design-principle-004-millers-law)
- [Eleken — Dark patterns](https://www.eleken.co/blog-posts/dark-patterns-examples) · [CBTW — Dark patterns business risk](https://cbtw.tech/insights/dark-patterns-in-ux-short-term-wins-long-term-business-risks)
- [Techrahisi — Low-bandwidth design](https://techrahisi.co.ke/how-to-design-mobile-apps-for-low-bandwidth-networks/) · [Launchpad — Africa low-bandwidth](https://launchpad.ng/resources/africa-low-bandwidth-design)
- [Netguru — Token naming](https://www.netguru.com/blog/design-token-naming-best-practices) · [Smashing — Naming best practices](https://www.smashingmagazine.com/2024/05/naming-best-practices/) · [Design Systems Collective — Token taxonomy](https://www.designsystemscollective.com/systematic-taxonomy-in-design-tokens-a-framework-for-scalable-ui-architecture-45cc6f2c7686)
