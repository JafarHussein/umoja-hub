# Low-Fidelity Wireframes — V1

**Gate: Low-fidelity wireframes.** Status: **DRAFT — awaiting approval.** Governed by [IA](IA_INFORMATION_ARCHITECTURE_V1.md) + [Foundation](UMOJAHUB_WEBAPP_FOUNDATION_V1.md).

**Location:** Figma file `bHjVuFiAzzBQdViTAj2Twh`, page **"App — Lo-Fi Wireframes"**.

**Fidelity:** Deliberately **grayscale, structure-only** — no colour, type, or visual-design decisions (those belong to the Design System gate). Built in a neutral placeholder style so review focuses on *structure, hierarchy, and flow*.

## What was wireframed (the proof set)

1. **Login** — wordmark, card, two OAuth actions, helper. Sign-in = sign-up.
2. **Onboarding — Role selection** — stepper (Role ▸ Identity ▸ Verification), four role options with descriptions, Continue. (Represents the 3-step wizard.)
3. **Farmer Home** — the role-adaptive **shell** furnishing a **low-density producer surface**: "what needs your attention" (3 large cards: pending orders, awaiting payment, verification), recent listings. Calm, decision-first, large targets.
4. **Lecturer Review Queue** — the **same shell** furnishing a **high-density expert surface**: a scannable review **data table** (student, project, submitted, SLA/overdue, status), filter controls, count.

## What the set proves

- **One role-adaptive shell** — identical mechanics (sidebar + top bar + **persistent trust/credential status**), different contents per role (Foundation §8). Learnable, stable.
- **Density adapts by role** (Foundation §11; deliverable 18) — farmer = spacious 3-card layout; lecturer = compact data table. Same system, different density.
- **Status-first / trust-in-the-shell** — the user's own verification/trust status is always present (farmer "Verified · Trust 72"; lecturer "Credential verified").
- **Decision-first hierarchy** — producer surface leads with attention/status; expert surface leads with the queue.

## Deliberately NOT decided here

Colour, typography, exact spacing values, iconography, illustration, motion, brand identity — all deferred to **mid/hi-fi and the Design System gate**. The grayscale is intentional.

## Open questions (carry forward)

- Farmer primary-nav size (8 items shown — is that too many for the target user? Foundation §16 / IA §8).
- Buyer default landing (browse vs orders).
- The audit-trail viewer surface (admin) — still to wireframe.
- All Foundation §16 user-validation unknowns remain open.

## Next gate

**Mid-fidelity** — tighten layout, real content structure, interaction states (still pre-visual), expanding to the remaining key surfaces (buyer browse + listing detail, student workspace, admin verification queue + case). Then hi-fi, prototype, design system.
