# Education Hub — Ecosystem Map
**Date**: 2026-06-01
**Purpose**: Complete account of every participant, information flow, trust relationship, incentive, and failure mode in the Education Hub. This document informs all content, diagrams, and page copy for the hub.

---

## WHO EXISTS IN THIS ECOSYSTEM AND WHY

### Students

**Who they are**: CS students at Kenyan universities — public and private — who have completed or are completing projects during their studies. They range from second-year students building their first structured project to final-year students preparing for industry entry. They may be at well-known institutions (Strathmore, USIU, KU, UoN) or smaller institutions whose names carry less weight with employers.

**Why they exist in this ecosystem**: They cannot prove capability through existing channels. Their degree certifies attendance and examination performance. Their GitHub portfolio is self-reported. Their CV describes what they claim to have done. None of these creates a verifiable evidence chain that an employer can independently confirm. They need a record of their work that is authenticated by a third party who has no incentive to inflate it.

**What they need from the ecosystem**: A structured process that produces a verifiable record — not just a checkbox credential, but an artifact that documents their analytical process, planning discipline, and professional self-reflection, reviewed by a person whose own credentials are verified.

**What they contribute**: Work output (three documents per project), peer review labor (they review others' submissions in exchange for having their own reviewed), and the body of verified project evidence that makes the portfolio system meaningful.

**What they risk**: Time investment in projects that may result in DENIED or REVISION_REQUIRED decisions. Peer review assignments that require meaningful engagement. The discomfort of having their Reflection document — their honest self-assessment — read by peers and lecturers.

---

### Peers

**Who they are**: Other registered students on the Education Hub who have completed their own submission process and are eligible to review submissions from other students.

**Why they exist in this ecosystem**: They are not optional. Without peer review, every submission goes directly to the lecturer queue. A lecturer reviewing 30 submissions without a quality gate spends disproportionate time on submissions that fail basic coherence and documentation standards. Peers provide the first structured quality assessment that raises the floor of what reaches the formal review queue.

**Why peers can be trusted to review at all**: Peers review against the same four-dimension rubric the lecturer uses. Their score is recorded and visible to the lecturer. Peers who consistently score inconsistently with lecturer decisions over time will be flagged — their review quality is itself tracked. This is the accountability mechanism for peer reviewers.

**What they contribute**: A structured assessment of four dimensions (clarity, methodology, documentation quality, reflection depth) with accompanying justification. This is not a pass/fail judgment — it is a scored evaluation with commentary that the lecturer can see and weigh.

**What they develop by participating**: Assessment capability. A student who reviews ten submissions learns what makes a strong Reflection document in a way that benefits their own next submission. Peer review participation is a deliberate design choice to create a learning loop within the review system.

---

### Lecturers

**Who they are**: Academic staff or industry professionals with domain expertise in a relevant track (Agriculture, Health, Finance, Infrastructure) and CS capability. They register on the platform, submit their credentials, and are reviewed by administrators before they can issue decisions.

**Why they exist in this ecosystem**: Their presence is what makes the verification credential meaningful. A student portfolio verified by an anonymous reviewer means nothing. A portfolio verified by a named, credentials-confirmed lecturer at a specific institution carries weight that a self-reported portfolio does not. The lecturer is the trust anchor for the entire credentialing chain.

**Why a lecturer's verification matters specifically**: An employer who sees a VERIFIED portfolio entry can check: who reviewed it, what their credentials are, and when the decision was issued. The verification chain is visible. This is different from any self-reported credential where the verification chain is invisible.

**What they contribute**: Final decisions (VERIFIED, REVISION_REQUIRED, DENIED) with substantive written commentary (minimum 50 words of specific assessment, not summary). The commentary is preserved in the audit log and visible in the portfolio entry.

**What they risk**: Time (each review takes meaningful engagement with three documents and a peer score). Reputation — their effectiveness metrics are tracked by the platform, and persistent misalignment between their decisions and peer assessments, or unusually high or low pass rates, are indicators the platform can review.

**What constrains them**: They can only review on tracks in which they are verified. They cannot review their own students' submissions (conflict of interest prevention). Their decision must be accompanied by substantive commentary — a one-word decision with no commentary does not meet the standard.

---

### Institutions

**Who they are**: Universities and CS programs whose faculty members participate as verified lecturers. The institution's relationship with the platform is indirect — it flows through its individual faculty members.

**Why they exist in this ecosystem**: If an institution has no verified lecturers on the platform, its students cannot get their submissions reviewed on the relevant tracks — or can only access reviewers from other institutions. Institutional participation in the reviewer pool determines the capacity of the verification system.

**What they contribute (indirectly)**: Reviewer capacity. An institution with five verified lecturers contributes five reviewers to the pool. Their faculty's assessment quality determines the quality of verifications issued for submissions they review.

**What the institution gains**: Their graduates accumulate verified portfolio entries that can be independently checked. An institution whose graduates consistently produce strong verified projects builds a visible track record over time — visible because the portfolio system is public.

**What the institution does not control**: They cannot influence whether their students receive VERIFIED decisions. The reviewer assigned to a submission is not the student's own lecturer (conflict of interest prevention). The decision is made by the assigned reviewer against the rubric.

---

### Employers

**Who they are**: Organizations hiring CS graduates — technology companies, banks, NGOs, government agencies, startups. They may view portfolios without registering. They may look at a portfolio as part of a hiring decision, or they may seek to independently verify a claim a candidate has made.

**Why they exist in this ecosystem**: They are the endpoint of the trust chain. If employers do not consume verified portfolio entries as meaningful evidence, the entire system produces credentials that no one uses. Employer trust in the credential is the value that flows backward through the system — through lecturer review, peer review, student effort, and platform verification infrastructure.

**What they need from the ecosystem**: A portfolio entry they can read without knowing how the platform works, that explains exactly what was reviewed, by whom, and what decision was reached. They need to be able to independently verify authenticity if they choose. They need to understand what a VERIFIED decision means and — equally importantly — what it does not mean.

**What they contribute**: Demand signal. Employers who value verified portfolios create the incentive for students to participate. Employers who dismiss them remove that incentive. The platform's long-term value depends on employer adoption being real, not assumed.

---

## HOW EVIDENCE MOVES THROUGH THE SYSTEM

This is the critical path. Every step either preserves or risks the integrity of the evidence.

**Step 1 — Brief generation**
Student selects track (AI_BRIEF) or brings a repository (OPEN_SOURCE). For AI_BRIEF track, the system generates a project brief from a curated context library specific to the chosen track and a Kenyan industry problem domain. The brief is fixed — the student cannot negotiate its scope or requirements. This prevents self-selection of easy problems.

**Step 2 — Document production**
The student produces three documents:
- **Problem Breakdown**: analysis of the problem stated in the brief. Demonstrates whether the student understands the domain and can decompose a complex problem.
- **Approach Plan**: how the student structured the work before beginning. Demonstrates planning discipline and the ability to think before executing.
- **Final Reflection**: what the student built, what failed, what they would do differently, and what they learned. This is the most significant document — it reveals professional thinking quality more directly than any other artifact.

The student also submits code or a repository link.

**Step 3 — Submission and hash creation**
When the student submits, the platform creates a cryptographic hash of the document content and records it in the verification audit log with a timestamp. From this point, the documents cannot be altered without the hash failing to match. The hash is the authenticity anchor for everything that follows.

**Step 4 — Peer review**
A peer reviewer is assigned. They receive all three documents and the rubric. They score on four dimensions (1–5 each): clarity of problem understanding, methodology appropriateness, documentation quality, and reflection depth. They submit written commentary alongside the numeric score. The peer score is locked before the submission enters the lecturer queue.

**Step 5 — Lecturer review**
The lecturer sees: all three documents, the code/repository, the peer score and commentary, and the rubric. They assess independently — the peer score informs but does not determine their judgment. The lecturer issues one of three decisions:

- **VERIFIED**: the submission meets the standard. The portfolio updates. The entry is permanent.
- **REVISION_REQUIRED**: the submission has specific identified weaknesses. The lecturer provides written commentary explaining what must be improved. The student may revise and resubmit. The original submission and the revision are both preserved in the audit log.
- **DENIED**: the submission does not meet the standard and revision cannot remedy it. It does not appear in the portfolio. The student may start a new project.

**Step 6 — Portfolio publication**
VERIFIED entries appear on the student's public portfolio page. The portfolio shows: project title, track, brief type, verification date, lecturer name and institutional affiliation, peer score, skills demonstrated, and the document hash. The documents themselves (Breakdown, Plan, Reflection) are visible in the portfolio. An employer can read them.

---

## HOW CREDIBILITY IS CREATED

Credibility in this system is not asserted. It is constructed from a chain of verified decisions.

1. The platform verifies the lecturer's identity and credentials (administrator review).
2. The lecturer reviews the submission against a defined rubric with a documented decision and commentary.
3. The peer reviewer reviews against the same rubric before the lecturer sees the submission.
4. The document hash ensures the documents cannot be altered after submission.
5. The portfolio entry records all of the above: who reviewed, what was decided, when.

An employer can follow this chain. They know who made the decision. They know the decision is timestamped. They know the documents they are reading are the same documents that were reviewed. They can look up the reviewer's credentials.

This is not a guarantee of quality. It is a guarantee of authenticity and process.

---

## HOW AUTHENTICITY IS PRESERVED

**Document hash**: Created at submission. Stored in audit log. The hash of the submitted documents must match the hash of the documents visible in the portfolio. If anyone altered the documents after submission, the hash would not match. An employer who requests the hash can verify independently.

**Brief locking**: The AI-generated brief is delivered to the student and fixed. It is part of the audit record. The student cannot claim a different brief than what was generated.

**Peer score locking**: The peer score is locked before the lecturer sees the submission. A lecturer cannot retroactively influence the peer score. A peer reviewer cannot revise their score after seeing the lecturer's decision.

**Reviewer identity**: Lecturers are verified before they can review. Anonymous reviews are not accepted. Every decision is associated with an identified, credentials-confirmed reviewer.

**Submission history**: Revised submissions are preserved alongside the original. The full history is available in the audit log. There is no hidden path to a VERIFIED decision — the path through REVISION_REQUIRED is recorded.

---

## HOW TRUST IS TRANSFERRED

The chain by which an employer trusts a portfolio entry they have never seen before:

**UmojaHub verifies the lecturer** → the administrator reviewed the lecturer's credentials and confirmed they are who they claim to be.

**The lecturer reviews the submission** → a person with confirmed credentials made an independent assessment against a defined rubric.

**The platform preserves the hash** → the documents visible in the portfolio are the same documents the lecturer reviewed.

**The portfolio is public** → anyone can view the entry, the review decision, the reviewer's name, and the documents, without registering.

**The employer can independently verify** → if they request the document hash, they can confirm document authenticity without trusting the platform.

Trust transfers through this chain. The employer does not need to trust the student's claim. They can verify the claim through a chain of independently verifiable steps.

---

## FAILURE MODES

### Peer review gaming
A student completes a superficial peer review to unlock their own submission review. Mitigation: peer review quality is tracked (score consistency with eventual lecturer decisions). Persistent low-quality peer reviews can result in reduced review privileges.

### Lecturer conflict of interest
A lecturer reviews a submission from their own student. Mitigation: the system prevents a lecturer from reviewing submissions from students at their own institution, or from students they have directly taught in a verifiable relationship. This is a structural constraint, not a policy hope.

### Brief repetition
Two students at the same institution receive similar briefs and their submissions look alike. This is a risk in the AI_BRIEF track. Mitigation: briefs are generated with variable parameters; the system tracks brief similarity across concurrent submissions. The OPEN_SOURCE track eliminates this risk entirely.

### Document fabrication after submission
A student submits documents, receives VERIFIED, then claims to an employer that they produced documents beyond what they submitted. The hash does not prevent this claim — it only proves the submitted documents are authentic. The platform can only verify what was submitted.

### Lecturer availability collapse
If the pool of verified lecturers for a track shrinks (lecturers leave, become unavailable), the review queue for that track backs up. Students submitting in that track wait longer. The platform's throughput on any track is bounded by the number of active verified lecturers for that track.

### Employer non-adoption
Employers who do not look at portfolio entries create no pull for students to participate. The platform's long-term value depends on employer adoption being real. If employers treat the verified portfolio identically to a self-reported GitHub link, the trust chain loses its value.

---

## INCENTIVES

**Student incentives to produce high-quality submissions**:
- VERIFIED status on a public portfolio is the desired outcome — it requires quality
- REVISION_REQUIRED feedback is free mentorship from a domain expert
- Peer review participation develops assessment skills
- The Reflection document, written carefully, is the best demonstration of professional thinking available to any student

**Peer incentives to review thoroughly**:
- Review quality is tracked — low-quality reviews have consequences
- Reviewing others develops the student's own submission quality
- Participation is required to have their own submission reviewed

**Lecturer incentives to review carefully**:
- Their decisions carry their name and credentials — low-quality decisions reflect on them
- Their effectiveness metrics are tracked
- A credible review system produces credible credentials that make their role meaningful

**Employer incentives to consult portfolios**:
- Verified portfolios reduce screening cost — the employer reads the Reflection document and gets a direct window into how the student thinks
- Hash verification is available for authenticity checks at no cost

**Institutional incentives to participate**:
- Their graduates accumulate verified records
- Faculty gain a structured engagement with student work quality
- The institution's verification track record is indirectly visible through its graduates' portfolio entries
