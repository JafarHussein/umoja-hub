# UMOJAHUB WEB APP FOUNDATION — V1

**The constitution of the UmojaHub web application.** Status: **APPROVED 2026-06-16**, amended by A1 (2026-08-04) below.

**Authority.** This is the single source of truth for the web-app presentation layer. It was built from the reset research corpus (gates 1–4), whose conclusions are carried in the sections below — the corpus itself has been retired now that it is spent. This document is **amended through the gated process, never silently superseded.**

**Scope.** The **web app** — dashboards, auth, onboarding (the operational surface). The public **website (Documentation Stream) is out of scope** and remains live. **Platform logic is untouchable** — this governs presentation only.

**The anti-assumption clause (read first).** The previous design failed because *assumptions hardened into decisions.* This document therefore separates **Principles (locked)** from **Open Questions (must be validated before they become decisions, §16)**. Anything not yet validated is named as such. No reviewer or designer may treat an open question as settled.

---

## AMENDMENT A1 — Education Hub vision reset (2026-08-04)

**Filed under the amendment rule above; supersedes every conflicting statement in this document.**

This foundation was written when the Education Hub was understood as a credential
platform — a system that proved a student's capability to a skeptical employer. That
product direction has been **retired by owner directive**. The Education Hub is the
**practical execution layer beside a Kenyan CS or IT degree**: it exists to turn
theoretical coursework into continuous, real engineering experience from the first
semester to graduation. There is no employer in the model.

What this amendment changes in the text below:

- **§1 (thesis).** "a student and an employer who never will" is struck. The student's
  counterpart is their **lecturer and their institution**, not a hiring manager.
- **§5 (principles).** "Process is shown, because the process is the value — especially
  in education (… A bare badge convinces no skeptic)" is struck. The value is the
  engineering experience itself; there is no badge and no skeptic to convince.
- **§6 (student persona).** "How do I prove capability when a degree isn't enough? Wants
  a credible, *showable* verification" is replaced by: **"I am being taught theory I have
  never applied — how do I become an engineer before I graduate?"** The student wants
  real work, real review, and real feedback; they remain intolerant of busywork and
  dead-ends.
- **§16 (open questions).** "What must 'Verified' convey to a real Kenyan employer" is
  struck as no longer a question this platform asks. It is replaced by: **how does the
  platform learn what a student is actually studying** (institution integration), and
  **what makes a lecturer's engineering review worth their time**.

Deliverable 06 (Education UX Research), whose thesis was the employer credibility gap,
has been deleted. Its replacement is gated behind the new Education Hub foundation,
`EDUCATION_HUB_FOUNDATION_V2.md`. Everything in this document concerning the Food
Security Hub, the visual language, and the presentation layer stands unchanged.

---

## 1. The thesis — what UmojaHub *is*

UmojaHub is **trust infrastructure** for people who must transact with strangers — a farmer and a buyer who have never met; a student and an employer who never will. The backend earns trust through verification, scoring, and named human accountability.

**The web app's entire job is to make that trust *legible and honest*.** Every screen either helps someone believe ("can I trust this seller / this verification / this platform?") or it is in the way. The interface is not decoration over a strong backend; it is the **surface where trust is either communicated or lost.**

## 2. What UmojaHub feels like — and never feels like

**It feels:** Clear. Honest. Calm under pressure. Reliable. Plain-spoken. Earned. Like a tool that respects your time, your intelligence, and your circumstances — whether you're a farmer on a slow phone in Wajir or an admin adjudicating a verification at 11pm.

**It never feels:** Flashy. Salesy. Urgent or manipulative. Borrowed (it is not a Stripe/Linear/Notion tribute). Impressive-for-its-own-sake. Condescending to low-literacy users or cramped for expert users. Like it's hiding something.

The feeling is produced by **clarity, honesty, reliability, and restraint** — not by spectacle. For this product, *reliability is the aesthetic.*

## 3. Mandatory principles (the core laws)

1. **Trust legibility above all.** Every trust signal (verification, score, status, attribution) is perceivable, understandable, and honest. If a screen makes trust harder to read, it fails.
2. **Honesty is an interface law.** Every capability is paired with its limitation, *in the same view*. The platform never implies protection, verification, or outcomes it does not provide. (No escrow → say so. Dead-end outcome → show it. ID uploaded → explain what happens to it.)
3. **Adapt to the person.** Two populations share one platform. Density, complexity, and guidance **adapt by role** — simple/low-bandwidth for farmers & buyers; dense/efficient for lecturers & admins — reconciled by **progressive disclosure**, never by dumbing-down or cramming.
4. **Inclusion is core usability, not compliance.** WCAG 2.2 AA is the floor in every theme; trust states use **redundant icon + shape + text, never colour alone**; visuals carry meaning for low-literacy users; performance tolerates weak devices and poor networks. These are requirements, not enhancements.
5. **Status is always visible.** At the platform's high-anxiety moments — payment, submission, verification — the user always knows what's happening and what comes next.
6. **Restraint.** One idea per screen-moment. Motion and illustration are functional, never ornamental. Nothing exists "because it looks nice."
7. **Built from research, defensible by design.** Every decision traces to evidence or a named, owned hypothesis. "It looks good" is not a justification.

## 4. Forbidden principles (hard bans)

1. **Trust-platform dark patterns** — fake/inflated signals, manufactured urgency or scarcity, over-claiming protection, deceptive verification states, confirm-shaming, roach-motel flows. *Existential; release-blocking on any trust-bearing surface.*
2. **Borrowed visual identity** — inheriting the look of Stripe/Linear/GitHub/Vercel/Apple/Notion/etc. Study architecture; never copy identity.
3. **Generic AI-design slop** — AI-purple gradients, three-equal-card rows, default-Inter scream-headlines, decorative blob illustrations, generic/Western stock, div-based fake screenshots, eyebrow-on-every-section, the em-dash crutch, "Acme/Jane Doe" content.
4. **Colour-only meaning, motion-only meaning, placeholder-as-label, sub-44px targets, heavy assets on 2G.**
5. **Spectacle that costs performance or clarity.** Trend-chasing. Impressive-but-unhelpful.

## 5. How trust is communicated

- A **single trust vocabulary**, defined once and reused everywhere: `TrustScore`, `VerificationBadge`, `StatusPill` (pending/verified/denied), `TierIndicator`, `DecisionAttribution` (who decided, on what evidence). Consistency *is* a trust cue.
- **Layered legibility:** a glanceable signal (tier, badge, number) backed by an explorable, honest breakdown (methodology, weights, limits). A low-literacy buyer acts on the glance; an auditor inspects the detail.
- **Named human accountability** is surfaced, not hidden behind "an algorithm." Decisions show their human and their basis.
- **Process is shown, because the process is the value** — especially in education (anonymous peer → credentialed lecturer → written justification). A bare badge convinces no skeptic.

## 6. How each role thinks

- **Farmer** — "Will I get paid, and will a stranger believe I'm real?" Low tech-comfort, weak device, payment-anxious. Needs radical simplicity + unambiguous payment status + a reputation they understand.
- **Buyer** — "Can I trust this seller enough to pay first?" The Trust Score is their decision instrument; recourse must be visible before they commit.
- **Student** — "How do I prove capability when a degree isn't enough?" Wants a credible, *showable* verification; intolerant of busywork and dead-ends.
- **Lecturer** — "Is this genuinely their work, and does it meet the bar?" Time-poor; their name is on the decision; needs evidence-first surfaces + a fast, justifiable rubric.
- **Admin** — "Decisions are attributed to me." Needs high-quality density, fast triage, and a first-class audit trail.

## 7. How onboarding works

- **Purpose-and-payoff at every step** — each step states what it is and why it matters. (Highest drop-off risk is the farmer; design for the weakest device and the least patience.)
- **Completable on a slow phone in few steps.** Identity verification reduces anxiety by *showing* what happens to documents (illustration-supported).
- **Role-aware from the first meaningful moment** — the experience shapes to who you are.
- Sign-in *is* sign-up (OAuth-first, the platform's current model); onboarding is the post-auth wizard.

## 8. How navigation works

- **Role-adaptive shells.** Each role gets navigation tuned to its job — not one generic shell. The structure a farmer needs is not the structure an admin needs.
- **Learnable and stable** — respects the mental models of low-digital-literacy users; no novelty navigation that breaks learned patterns.
- Navigation is **quiet and dependable**, never a showpiece.

## 9. How dashboards behave

- A dashboard is a **tool for the next action**, not a vanity wall of widgets. It answers "what do I need to do now?"
- **Role-specific** content and density; status-first; empty/loading/error states are first-class, not afterthoughts.
- Expert dashboards (lecturer/admin) are **dense done well** (scannable tables, fast triage); producer dashboards (farmer) are **calm and minimal**.

## 10. How complexity is revealed

- **Progressive disclosure is the universal mechanism** — *glance → detail*. It reconciles the platform's central tension (simplicity for some, depth for others) on one system.
- The user is never shown more than the decision in front of them requires; depth is always one deliberate step away.

## 11. How information is prioritized

- **Density adapts by role** via a density scale (comfortable ↔ compact), applied per surface — components flex via tokens, never forked.
- **The decision comes first.** On every screen, the thing the user must understand or do is the most prominent thing. Trust signals sit where the decision is made.
- Genuine data surfaces get **real data-table patterns**; never cramming, never over-spacing data.

## 12. How illustration is used

- **Purpose-driven only** — explain, guide, reduce anxiety, build trust, support onboarding. Every illustration names its job or it doesn't ship.
- **Culturally authentic** — depicts the real users (Kenyan farmers, students, markets), never generic or Western stock, never trendy blobs.
- A consistent **illustration system** bound to tokens; **performance-bound** (optimized, 2G-safe, reduced-motion-safe).
- Concentrated at anxiety/comprehension moments: login, role selection, verification, waiting, empty/error/success, trust explainers.

## 13. How motion is used

- **Functional only**, governed by the weak-device reality. Permitted jobs: **feedback, state transition, hierarchy, continuity.** Nothing cinematic.
- `transform`/`opacity` only; short; **`prefers-reduced-motion` honoured globally**; **never the sole carrier of meaning.** Minimal in tools; slightly more (motivated) in onboarding/trust moments. Verified on real low-end hardware.

## 14. How themes behave

- **Themes are value-maps over one semantic token set** (primitive → semantic → component), never parallel systems. Light, dark, and future custom/white-label themes are *values*, not forks.
- **Accessibility modes compose** — high-contrast and large-text layer over any colour theme. **Colour-blind safety is a constraint on every theme** (backed by redundant encoding), not a separate theme.
- **State/trust colours hold meaning and contrast across all themes.** System preferences (`color-scheme`, `contrast`, `reduced-motion`) respected by default.
- *(Specific palette and typefaces are deliberately NOT fixed here — they are decided at the Design System gate. This document fixes the principles they must satisfy.)*

## 15. How accessibility is guaranteed

- **AA floor in every theme, baked into tokens and components** (contrast-validated pairings, accessible states in the primitive) so screens can't easily regress.
- Beyond disability: **literacy, language, and situational constraints** (outdoor/sunlight, low bandwidth) are accessibility concerns here.
- Verified by **automated (axe/Lighthouse) + manual keyboard & screen-reader passes**, on real devices and real network conditions.

## 16. Open questions — must be validated before becoming decisions

These are **named risks, not settled facts.** High-fidelity design must not proceed on them unvalidated:

1. **Does the target user actually comprehend the Trust Score?** (Highest leverage — test the real artifact.)
2. **Language:** is English-only acceptable, or is Swahili/local-language support required for farmer adoption? *(Design-scope resolved for pilot, 2026-06-18, senior-engineer call: **English-first content**; mid-fi layouts are **i18n-tolerant** — budget ~30% text expansion, short microcopy, no text-in-images, no text baked into fixed-width chips; a **language toggle is stubbed in Settings**. Full Swahili translation is a platform-logic lift deferred post-pilot. The **adoption question itself stays an open risk** — validate with farmers before funding translation.)*
3. **What must "Verified" convey to a real Kenyan employer** to be believed?
4. **Lecturer rubric friction** — where do rigor and speed trade off?
5. **Onboarding drop-off points** per role — instrument and observe.
6. **Device/bandwidth/literacy distribution** per role (esp. farmers).
7. **Theme count at launch** and manual-toggle vs system-only.

**Recommendation:** lightweight validation (5–8 users per role) before high-fidelity, with these tracked as explicit risks.

## 17. What approval of this foundation unlocks

The next gates, each stopping for approval:
**Information Architecture → Low-fidelity → Mid-fidelity → High-fidelity → Interactive Prototype → Design System (palette, type, tokens, components) → Implementation Plan → Code.**

No pixels until this constitution is approved.
