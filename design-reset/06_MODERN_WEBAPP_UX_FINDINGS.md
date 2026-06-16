# 06 — Modern Web App UX Findings

**Status:** Evidence on what makes a modern web *application* (the authenticated product shell) usable — distinct from the marketing website (report 10 covers IA/navigation broadly).

---

## 1. Progressive disclosure is the core app pattern

NN/g-grounded research shows progressive disclosure — revealing complexity only as needed — can **reduce task completion time by 20–40%** while improving comprehension, and products using it see **~35% fewer onboarding support tickets**. ([Userpilot](https://userpilot.com/blog/progressive-disclosure-examples/), [UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/), [LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/))

**For UmojaHub:** the dashboard serves five roles with very different needs. Each role's shell should expose its *core* job first (a farmer: "list produce / see orders / get paid"), with advanced capabilities (ledger detail, group tokens, mediation) one layer down — not all surfaced at once.

## 2. Empty states are onboarding, not dead ends

**84% of users who hit a blank state without contextual help abandon within the first session.** The fix: explain *why* it's empty, show an example, and lead straight to the key action (Asana/Notion model). ([Userpilot](https://userpilot.com/blog/progressive-disclosure-examples/))

**For UmojaHub:** a farmer's first dashboard, a buyer's empty order list, a student's empty portfolio — each must teach and point to the next action, never present a void. This is high-leverage and currently under-specified.

## 3. Limit choices per step

Research: **3–4 choices per step** reduces completion time 20–40% and reduces errors. ([SaaSFactor](https://www.saasfactor.co/blogs/saas-user-activation-proven-onboarding-strategies-to-increase-retention-and-mrr)) This is Hick's Law applied to flows (report 14).

**For UmojaHub:** multi-step flows (create listing, checkout, project submission) should chunk into small, single-purpose steps rather than dense forms.

## 4. Familiarity beats novelty (Jakob's Law in the app)

Users transfer expectations from apps they already use (WhatsApp, M-Pesa, mobile banking). Conventional placement of nav, primary actions, and status reduces learning cost. ([UX Design Institute](https://www.uxdesigninstitute.com/blog/laws-of-ux/))

**For UmojaHub:** mirror M-Pesa/mobile-money mental models for payment and confirmation flows; users already trust and understand them.

## 5. The product shell is dark-themed and works — evolve, don't restart

The existing `ui/` primitives + dark product tokens are functional and tested (659 tests pass post-reset). Modern practice favors **incremental hardening** of a working shell (accessibility, empty states, responsive, performance) over a from-scratch rebuild of plumbing. The reset targets *identity and website*, not the app's interaction plumbing.

---

## 6. App-shell checklist derived from evidence

- [ ] Each role shell leads with its primary job; secondary tools one layer down (progressive disclosure)
- [ ] Every list/collection has a designed, instructive empty state
- [ ] Multi-step flows chunked to ≤4 decisions per step
- [ ] Payment/confirmation flows mirror M-Pesa mental models
- [ ] Primitives audited for theme-portability and WCAG 2.2 (report 09)
- [ ] Performance budget enforced on app routes (report 08)

### Sources
- [Userpilot — Progressive disclosure](https://userpilot.com/blog/progressive-disclosure-examples/) · [UXPin](https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/) · [LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- [SaaSFactor — Activation](https://www.saasfactor.co/blogs/saas-user-activation-proven-onboarding-strategies-to-increase-retention-and-mrr) · [SaaSFactor — Drop-off](https://www.saasfactor.co/blogs/why-users-drop-off-during-onboarding-and-how-to-fix-it)
- [UX Design Institute — Laws of UX](https://www.uxdesigninstitute.com/blog/laws-of-ux/)
