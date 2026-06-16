# 07 — Modern Onboarding Findings

**Status:** Evidence on onboarding/activation. **Scope note:** UmojaHub already adopted a progressive, onboarding-first auth model (role-selection → identity-input → verification-upload). The *logic* is out of scope for the reset; this report governs the **design/UX** of those flows only.

---

## 1. Onboard toward the user's goal, not your feature tour

The strongest finding across sources: stop showcasing features; **structure onboarding around what the user wants to achieve**, revealing detail progressively. ([UX Design Institute](https://www.uxdesigninstitute.com/blog/ux-onboarding-best-practices-guide/), [Userpilot](https://userpilot.com/blog/progressive-disclosure-examples/))

**For UmojaHub:** a farmer's goal is "sell my produce and get paid," not "learn UmojaHub." A student's is "build a verified portfolio item." Onboarding should move them toward the first real outcome, not a tour.

## 2. Activation > registration

SaaS activation research: the metric that matters is reaching the **"aha"/first-value moment**, and onboarding should be engineered to get users there fast; drop-off concentrates where steps feel pointless or heavy. ([SaaSFactor activation](https://www.saasfactor.co/blogs/saas-user-activation-proven-onboarding-strategies-to-increase-retention-and-mrr), [drop-off](https://www.saasfactor.co/blogs/why-users-drop-off-during-onboarding-and-how-to-fix-it))

**For UmojaHub:** first value differs per role — define each explicitly (farmer: first listing live; buyer: first verified supplier found; student: first project created). Verification can gate *transacting* without gating *seeing value*.

## 3. Chunk the steps; 3–4 choices max

Limiting to **3–4 simultaneous choices per step cuts completion time 20–40%** and lowers abandonment. ([SaaSFactor](https://www.saasfactor.co/blogs/saas-user-activation-proven-onboarding-strategies-to-increase-retention-and-mrr))

**For UmojaHub:** the existing 3-step onboarding is well-aligned; each step must stay single-purpose and not balloon into a dense form.

## 4. Respect the trust context

Because UmojaHub's users arrive skeptical (report 05), onboarding must **explain why each step exists** — especially identity/verification uploads, which can read as risky to first-time users. Transparency about *why* a document is requested and *how* it's protected is itself an activation lever (it reduces fear-driven abandonment).

## 5. Empty-state-as-onboarding

Post-signup, the first screen of each role is an onboarding surface (report 06): explain the empty state, show one example, point to the first action. ([Userpilot](https://userpilot.com/blog/progressive-disclosure-examples/))

---

## 6. Onboarding design principles for the foundation

1. **Goal-first**, per-role, not feature-tour.
2. Define and instrument each role's **first-value moment**.
3. **Don't gate seeing value** behind verification; gate only transacting.
4. **Explain the why** of every sensitive step (trust context).
5. **Chunk**; ≤4 choices/step; single-purpose steps.
6. First post-signup screen = **instructive empty state**.

### Sources
- [UX Design Institute — Onboarding best practices](https://www.uxdesigninstitute.com/blog/ux-onboarding-best-practices-guide/)
- [Userpilot — Progressive disclosure](https://userpilot.com/blog/progressive-disclosure-examples/)
- [SaaSFactor — Activation](https://www.saasfactor.co/blogs/saas-user-activation-proven-onboarding-strategies-to-increase-retention-and-mrr) · [SaaSFactor — Drop-off](https://www.saasfactor.co/blogs/why-users-drop-off-during-onboarding-and-how-to-fix-it)
