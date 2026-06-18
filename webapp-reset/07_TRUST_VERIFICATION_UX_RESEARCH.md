# Trust & Verification UX Research

**Reset deliverable 7** (Gate 2). The cross-cutting layer beneath both hubs. Builds on [04](04_USER_RESEARCH_FINDINGS.md), [05](05_MARKETPLACE_UX_RESEARCH.md), [06](06_EDUCATION_UX_RESEARCH.md).

## The platform as it actually works (code-true)

- **Farmer Trust Score** — a composite of **four weighted components** (summing to 100), grouped into **tiers**, **recalculated** on defined triggers. It is the marketplace's primary reputation instrument.
- **Identity verification** — farmer submits an **ID document → a named admin makes the decision**; lecturer is a **binary credential check**. Documents stored on **Cloudinary + SHA-256 fingerprint** (no public hash check).
- **Governance** — decisions are made by **named humans**, recorded in an **append-only audit log** (**no viewer UI yet**), with **appeals handled by email only**.

## The core UX problem

**Trust is the product.** Across every role the central anxiety is a variant of *"can I believe this — this seller, this verification, this platform?"* So the UI's primary job is to **communicate trustworthiness and make verification legible**, across audiences with very different literacy and stakes, **while being scrupulously honest about its limits** — because over-claiming is the fastest way to destroy trust.

This layer is cross-cutting: the Trust Score lives in the marketplace, verification states gate both hubs, and governance/accountability underpins the whole platform's legitimacy to auditors and institutions.

## Evidence-based patterns that apply

- **Verification badges and reputation are decision inputs, not decoration** — they change behaviour and belong where the decision is made. *(Evidence, deliverable 05.)*
- **Methodology transparency builds trust** — letting a skeptic see *how* a score/verification is computed converts a badge into evidence. *(Principle.)*
- **Honest disclosure of limits is itself a trust signal** — naming what the platform does *not* guarantee increases credibility with the exact analytical audiences (auditors, employers, institutions) that matter. *(Consistent with the live website's approach.)*
- **Named-human accountability beats "an algorithm decided"** for trust — surface *who* decided and on what basis. *(Principle; platform already works this way.)*

## Platform-specific implications (inputs to the foundation)

1. **The Trust Score must be readable at a glance *and* fully explorable** — a tier/number a low-literacy buyer can act on, backed by an honest breakdown of the four components, weights, recalculation triggers, and limits. **Comprehension is unproven — validate before locking the visualization.**
2. **Verification states must be unambiguous everywhere** — pending / verified / denied, with clear meaning and next steps. These states recur across farmer, lecturer, student, listing.
3. **Document handling must be explained, not assumed** — "what happens to my ID" is a top farmer anxiety (Gate 1). Show the fingerprinting + storage story plainly; pair the limit (no public hash check).
4. **Accountability should be surfaceable** — *who decided, on what evidence, when*. The append-only audit log currently has **no viewer**; the rebuild should treat a read surface as first-class for institutional trust.
5. **Appeals / recourse must be visible and dignified** — currently email-only; the UI should make the path findable and honest about timelines, not bury it.
6. **A unified "trust & verification" visual vocabulary** should be defined once (badge, score, state, tier, attribution) and reused across both hubs — consistency is itself a trust cue.

## Honesty / limitation pairing (mandatory)

No public hash verification; no audit-log viewer; appeals email-only; simulated payments in pilot. Every trust surface must pair the capability with its current limit, in view.

## Open questions to validate

- **Trust Score comprehension** — the single highest-leverage unknown; test the real artifact with real buyers/farmers.
- **How much methodology to expose, and where** — enough to convince a skeptic without overwhelming a low-literacy user. Likely a layered (glance → detail) pattern, to be validated.
- **What auditors/institutions need to see** to trust governance (informs whether/how to expose the audit trail).

## Sources

- [Tadelis — Reputation & feedback systems in online platform markets (Berkeley)](https://faculty.haas.berkeley.edu/stadelis/Annual_Review_Tadelis.pdf)
- [LogRocket — Trust-driven UX](https://blog.logrocket.com/ux-design/trust-driven-ux-examples/)
