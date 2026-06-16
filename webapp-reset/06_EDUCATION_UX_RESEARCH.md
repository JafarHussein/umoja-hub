# Education Platform UX Research — Education Hub

**Reset deliverable 6** (Gate 2). Builds on [04 User Research](04_USER_RESEARCH_FINDINGS.md). Grounded in the actual Education Hub behaviour + the cited skills-mismatch / portfolio evidence.

## The platform as it actually works (code-true)

- A STUDENT creates a **project engagement** and produces **process evidence**: project documents plus **logs (AI-usage disclosure, blockers)**, **hashed (SHA-256) on submission** for tamper evidence.
- Review is **two-stage: anonymous peer review → credential-verified LECTURER**, scored on a **multi-dimension rubric requiring written justification** per dimension.
- Outcomes: **VERIFIED / REVISION_REQUIRED / DENIED**. Today **REVISION_REQUIRED is effectively a dead-end**, and **employer-facing verification-by-URL is not built** — the verified record shows a count, not a shareable proof.

## The core UX problem

Kenya's graduate crisis is a **credibility gap**, not a content gap: employers don't believe a certificate proves capability (avg digital-skills test ~55%; graduates lack hands-on experience). The literature's proposed cure is exactly this platform's thesis — **digital portfolios that demonstrate tangible capability.** So the UX problem is twofold:

1. **Make the student's demonstrable capability legible** to a skeptical employer.
2. **Make the verification itself credible** — the *rigor of the process* is the product, so it must be visible, not hidden behind a badge.

Three sub-roles, three different surfaces: student (produce), peer (review), lecturer (adjudicate).

## Evidence-based patterns that apply

- **Process transparency builds assessment credibility** — showing *how* work was verified (anonymous peer + credentialed human + written justification) is what makes "Verified" mean something. A bare badge is worthless to a skeptic. *(Evidence/principle.)*
- **Anonymous, structured review reduces bias** and is a trust feature — surface that it's anonymous and rubric-driven. *(Principle.)*
- **Evidence-first for reviewers** — assessors decide faster and more fairly when the work, logs, and history are front-and-center and the rubric is low-friction. *(Gate 1, LECTURER.)*
- **The portfolio is the legible artifact** the student takes to the market — it must be shareable and self-explaining (today it isn't; that's a gap to flag).

## Platform-specific implications (inputs to the foundation)

1. **The student workspace should read as a serious professional tool**, not a gamified course — the audience is under real economic pressure and wants credibility, not badges.
2. **Make the process and its rigor visible** to all three audiences — it *is* the value proposition. Show the anonymous-peer → credentialed-lecturer → written-justification chain.
3. **Outcomes and the paths between them must be explicit and honest** — especially the **REVISION_REQUIRED dead-end**: the UI must not imply a resubmission path that doesn't exist, and this is a prime candidate to fix in the rebuild.
4. **Tamper-evidence (SHA-256 hashing) must be made legible** — "your work is fingerprinted on submission" is a trust signal; explain it plainly (and note the limit: no public hash check yet).
5. **Reviewer/lecturer surfaces are information-dense done well** — evidence first, fast rubric, forced justification without feeling punitive, clear queue + SLA.

## Honesty / limitation pairing (mandatory)

REVISION_REQUIRED dead-ends; no shareable employer-facing verification URL yet; verified record is a count, not a full project list; no public hash verification. The student UI must not promise an employer experience that isn't built.

## Open questions to validate

- **What must "Verified" convey to a real Kenyan employer** to be believed? (Interview hiring managers — the student UI depends on this answer.)
- **Lecturer rubric friction** — observe real reviews; time the form; find where rigor and speed trade off.
- Does showing the **process chain** actually raise employer/student confidence? (Test.)

## Sources

- [The Star — Skills gap fuelling unemployment in Kenya](https://www.the-star.co.ke/business/kenya/2025-07-04-skills-gap-fueling-unemployment-in-kenya-experts-1)
- [Tharaka Invention Academy — micro-credentials & digital portfolios](https://inventionschool.tech/skills-to-work/)
