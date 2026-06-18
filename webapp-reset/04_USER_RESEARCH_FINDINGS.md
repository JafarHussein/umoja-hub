# User Research Findings — Web App

**Reset deliverable 4.** Research gate 1 of the batched process. **Scope: the web-app roles** (FARMER, BUYER, STUDENT, LECTURER, ADMIN). Website-only audiences (employers, NGOs, institutions, government) are out of scope here and covered by the live website.

## Method & honesty caveat (read first)

This is **secondary research + structured synthesis** grounded in (a) the actual platform behaviour in the codebase, and (b) cited external evidence on the real user population. It is **not** primary user research. The whole point of this reset is that *assumptions hardened into decisions* last time — so every role below separates **Evidence** (sourced or code-true) from **Hypothesis (to validate)**. Nothing here is a design decision; it is the input to one. A primary-research plan is in the last section, and the foundation must not treat unvalidated hypotheses as settled.

## Operating context (the reality we design into)

- **Mobile-money is universal and trusted; the app's payment model rides on it.** Kenya hit **91% mobile-money penetration** (June 2025), 60M+ M-Pesa users, and **71% of adults receiving agricultural payments get them digitally**, mostly via M-Pesa. Trust in M-Pesa is built on reliability and Safaricom's reputation, and it's perceived as *safer than cash*. → The app should lean on this existing trust, not reinvent a payment mental model. *(Evidence)*
- **Smartphones are rising but app usage among farmers is still low** — constrained by **low digital literacy, poor interface usability, and lack of farmer-centric design**, plus uneven bandwidth. Adoption skews **male and younger**. → Interface simplicity and low-bandwidth tolerance are not "nice to have"; they are the difference between use and abandonment. *(Evidence)*
- **The education side exists because of a real crisis:** a wide employer/graduate **skills mismatch** (average digital-skills test ~55%), graduates lacking hands-on coding experience, and the literature explicitly proposing **digital portfolios that demonstrate tangible capability** as the intervention. → UmojaHub's "verify the process, not the certificate" thesis is evidence-backed; the UI's job is to make that demonstrable capability *legible to a skeptical employer*. *(Evidence)*
- **Connectivity, language, device, and pressure vary enormously across roles.** Design cannot assume a fast phone, a quiet moment, English fluency, or prior app literacy. *(Evidence/Hypothesis)*

---

## FARMER — the producer

- **Snapshot:** Smallholder or small-cooperative producer, rural/peri-urban, mixed literacy, mobile-first (often a shared or mid-range Android on 2G/3G). *(Hypothesis to validate — device/literacy spread.)*
- **Primary goal:** Sell produce at a fair price to buyers they've never met, get paid reliably, and build a reputation that travels.
- **Mental model:** "Will I actually get paid, and will a stranger believe I'm real?" Reputation = survival. They think in *deliveries and payments*, not "dashboards." *(Hypothesis.)*
- **Tech comfort / access:** Comfortable with M-Pesa and SMS; **not** assumed comfortable with complex app navigation. Bandwidth-constrained. *(Evidence: app-usage barriers.)*
- **Risk tolerance:** Low. A failed/uncertain payment or a confusing verification step can lose them for good.
- **How they decide / build trust:** Concrete proof — money arriving, a visible verified status, a trust score they understand. Abstract UI flourish erodes trust; plainness and reliability build it. *(Hypothesis.)*
- **Anxiety moments:** Identity verification (handing over an ID), listing produce (did it work?), waiting for payment, a dispute.
- **Onboarding reality:** Must be completable on a slow phone, in few steps, with each step's *purpose and payoff* stated. Drop-off risk is highest here.
- **UX implications:** Radically simple primary flows; payment status must be unambiguous and prominent; verification must explain *why* and *what happens to my documents*; tolerate low bandwidth; consider local-language and low-literacy affordances (icons + words, not words alone).

## BUYER — the market

- **Snapshot:** Individual or institutional purchaser evaluating unknown farmers before paying. More likely on a better device/connection than the farmer. *(Hypothesis.)*
- **Primary goal:** Buy produce confidently from someone they can *evaluate before paying*.
- **Mental model:** "Can I trust this seller enough to send money first?" They read signals of reliability the way they'd read a market stall's reputation.
- **Risk tolerance:** Medium — they pay before dispatch, so the trust signal must carry weight; there's no escrow today.
- **How they decide / build trust:** The **Trust Score** and verification badges are the decision instrument. They need to *read* a score quickly and understand its basis, plus clear recourse if something goes wrong.
- **Anxiety moments:** Committing payment, judging an unfamiliar farmer, "what if it doesn't arrive?"
- **UX implications:** Trust signals must be legible at a glance *and* explorable in depth; the score's meaning and limits must be honest and adjacent; recourse must be visible *before* purchase, not hidden post-failure.

## STUDENT — the Education Hub

- **Snapshot:** University CS student (often 20–29, the unemployment-heavy cohort), building proof of how they actually work. Likely the most tech-comfortable role, but under real economic pressure. *(Evidence: 800k new annual job-seekers, youth unemployment.)*
- **Primary goal:** Produce verifiable proof of capability — not a certificate of attendance — that a skeptical employer will believe.
- **Mental model:** "How do I stand out when a degree isn't enough?" They think in *projects, commits, and evidence*.
- **Risk tolerance:** Will invest effort if the payoff (credible verification) is real; intolerant of busywork or a dead-end outcome.
- **How they build trust:** In the *fairness and rigor* of the review (anonymous peer review → credential-verified lecturer) and in the verification being something they can *show*.
- **Anxiety moments:** Submitting work for judgment; the REVISION_REQUIRED dead-end; not knowing what "Verified" will mean to an employer.
- **UX implications:** Make the process and its rigor visible (it's the value); show exactly what each outcome means and the path between them; surface tamper-evidence plainly; the workspace should feel like a serious tool, not a gamified toy.

## LECTURER — the verifier

- **Snapshot:** Credential-verified academic reviewing student submissions, time-poor, doing this alongside teaching.
- **Primary goal:** Render fair, defensible verification decisions efficiently, with their professional credibility attached.
- **Mental model:** "Is this work genuinely the student's, and does it meet the bar?" They think in *evidence and justification*.
- **Risk tolerance:** Low on their own reputation — their name is on the decision. They need enough evidence to decide and a way to justify it.
- **How they build trust:** In the platform giving them complete evidence (the work, logs, history) and a structured, low-friction rubric.
- **Anxiety/friction moments:** Incomplete evidence; an unclear queue; a heavy or ambiguous scoring form.
- **UX implications:** Information-dense but scannable review surfaces; evidence first; the rubric must be fast and force written justification without feeling punitive; queue clarity (what's pending, SLA).

## ADMIN — governance & accountability

- **Snapshot:** Named platform administrator making verification/governance decisions, accountable and on the record.
- **Primary goal:** Verify identities and adjudicate fairly and quickly, leaving an auditable trail.
- **Mental model:** "Decisions are attributed to me; I must be right and be able to show why."
- **Risk tolerance:** Low — errors are visible and consequential.
- **UX implications:** High information density done *well* (not cramped); fast triage queues; decisions paired with the evidence and a recorded rationale; the audit trail must be a first-class surface, not an afterthought.

---

## Cross-cutting design implications (inputs to the foundation — not yet decisions)

1. **Trust is the product; the UI's job is to make trust legible.** Every role's core anxiety is some flavour of "can I believe this?" The visual language must *communicate trustworthiness* (clarity, honesty, reliability cues) over impressiveness.
2. **Two populations, one platform, very different contexts.** Farmers/buyers (low-bandwidth, mixed literacy, payment-anxious) vs. students/lecturers/admins (tool-users, evidence-dense). The system likely needs **density that adapts to role**, not one density for all. *(Hypothesis — validate before locking.)*
3. **Low-bandwidth and low-literacy tolerance are core constraints, not edge cases** — at least on the food-security side.
4. **Honesty as an interface principle.** The platform already discloses its limits (simulated payments, no escrow, dead-end outcomes). The UI must continue to pair capability with limitation, because over-claiming destroys the exact trust we're selling.
5. **Anxiety-reducing moments are illustration/explanation opportunities** (verification, waiting, first-run, outcomes) — feeding the mandatory Illustration Strategy.

## Critical unknowns → primary-research plan (before the foundation is approved)

These must be validated with real users, not assumed:

- **Device/bandwidth/literacy distribution per role** (esp. farmers) — field survey or partner data.
- **Do farmers/buyers actually understand the Trust Score?** — comprehension testing with the real artifact.
- **Onboarding drop-off points** — instrument the funnel; watch first-run sessions.
- **What "Verified" must convey to a real Kenyan employer** — interview hiring managers (note: employer is website-side, but the student UI depends on the answer).
- **Lecturer review friction** — observe real reviews; time the rubric.
- **Language needs** — is English-only acceptable, or is Swahili/local-language support a requirement for farmer adoption?

**Recommendation:** treat the hypotheses above as explicit risks in the foundation; schedule lightweight validation (5–8 users per role) before high-fidelity design.

## Sources

- [KIPPRA — Enhancing market access through digital technologies among smallholder farmers in Kenya](https://kippra.or.ke/enhancing-market-access-through-digital-technologies-among-smallholder-farmers-in-kenya/)
- [Adoption of mobile phone applications by smallholder farmers, Tharaka Nithi County (Cogent/T&F)](https://www.tandfonline.com/doi/full/10.1080/23311932.2023.2265225)
- [FinTech Magazine — Kenya's mobile money market hits 91% penetration](https://fintechmagazine.com/news/kenya-leads-the-world-in-mobile-money-penetration)
- [Radarr Africa — Kenya tops Africa in digital farm payments](https://radarr.africa/kenya-tops-africa-in-digital-farm-payments-as-mobile-money/)
- [The Star — Skills gap fuelling unemployment in Kenya](https://www.the-star.co.ke/business/kenya/2025-07-04-skills-gap-fueling-unemployment-in-kenya-experts-1)
- [Tharaka Invention Academy — micro-credentials & digital portfolios](https://inventionschool.tech/skills-to-work/)
