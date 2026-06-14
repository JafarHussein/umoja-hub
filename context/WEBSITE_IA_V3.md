# Website Information Architecture V3
**Status:** Phase 0 — Governing content architecture
**Authority:** Every Figma frame, every wireframe section, every content block derives from this document.
**Relationship to other docs:** Executes the principles from WEBSITE_PURPOSE_V1.md. Reflects boundaries from WEBSITE_WEBAPP_BOUNDARY.md. Content draws from FOOD_HUB_ECOSYSTEM_MAP.md, EDUCATION_HUB_ECOSYSTEM_MAP.md, and STORYTELLING_FRAMEWORK.md.

---

## HOW TO USE THIS DOCUMENT

This document defines every page on the website — what sections it contains, what each section accomplishes, what it must answer, and what it must not contain. It is the brief for Phase 1 Figma wireframes.

A wireframe designer using this document should never ask: "What goes in this section?" The answer is here.

---

## GLOBAL NAVIGATION

### Primary Nav Items

```
UmojaHub [logo]
├── Hubs
│   ├── Food Security Hub → /for/farmers (or hub overview)
│   └── Education Hub → /education
├── How It Works → /how-it-works
├── Trust & Verification → /trust
├── Transparency → /transparency
└── [CTA] Register / Sign In
```

### Audience Dropdown (within Hubs or standalone)
```
Who are you?
├── I'm a Farmer → /for/farmers
├── I'm a Buyer → /for/buyers
├── I'm a Supplier → /for/suppliers
├── I'm a Cooperative → /for/cooperatives
├── I'm a Student → /for/students
├── I'm a Lecturer → /for/lecturers
├── I'm an Employer → /for/employers
├── I'm an Institution → /for/institutions
└── NGO / Government → /for/ngos
```

### Footer Navigation
```
Platform
├── About → /about
├── Team → /team
├── Transparency → /transparency
├── Trust & Verification → /trust
└── How It Works → /how-it-works

Hubs
├── Food Security Hub → /for/farmers
├── Education Hub → /education
├── Marketplace → /marketplace
└── Knowledge Hub → /knowledge

For Participants
├── Farmers → /for/farmers
├── Buyers → /for/buyers
├── Students → /for/students
├── Lecturers → /for/lecturers
└── Employers → /for/employers

Governance
├── Appeals & Disputes → /team#appeals
└── Platform Status → /transparency#status

Contact
└── [Email address]
```

---

## PAGE: HOMEPAGE (`/`)

**Narrative goal:** The visitor arrives with "What is UmojaHub?" and leaves understanding the platform structure, why verification matters, and which audience path to follow.

**One-sentence test:** A visitor who reads only the homepage should be able to accurately describe UmojaHub to someone who has never heard of it, and know which page to visit next.

---

### Section 1 — Platform Identity Statement (Above Fold)

**What it answers:** Q1: What is UmojaHub?

**Content:**
- Platform name
- Precise description (not a tagline — a factual statement)
  - "A platform where verified Kenyan farmers list produce for direct sale, and computer science students build verifiable project portfolios."
- Two supporting clarifications:
  - "No middlemen. No commissions. No self-reported credentials."
- Immediate routing: two entry points visible above the fold
  - Food Security Hub path
  - Education Hub path

**What it must NOT contain:**
- Aspirational language ("transforming agriculture")
- Vague claims ("empowering farmers")
- Mission statements
- Hero photography (Phase 3 decision — this is IA, not visual design)

**Functional requirement:** A visitor who lands here with no prior context should understand in 15 seconds that this is a verified marketplace + portfolio verification platform for Kenya.

---

### Section 2 — The Two Structural Failures

**What it answers:** Q2: Why does "verified" matter?

**Content:**
Two panels, each describing a structural failure:

Panel A — The Farmer's Problem:
- Farmers sell through brokers who know the end-market price. The farmer does not.
- The farmer cannot compare offers. Cannot signal reliability to buyers they've never met. Cannot receive payment without physical presence.
- This is not individual bad actors — it is a structural information asymmetry.

Panel B — The Student's Problem:
- CS students graduate with degrees that certify attendance, GitHub repos that are self-reported, and CVs that describe claims no one can verify.
- Employers have seen AI-generated portfolios, inflated credentials, and unverifiable GitHub contributions.
- This is not student dishonesty — it is the absence of a trustworthy verification mechanism.

**What connects them:**
Both problems share the same root: the absence of a mechanism to establish trust between strangers before a consequential transaction.

**What it must NOT contain:**
- Competitor comparisons
- Claims that UmojaHub has "solved" these problems
- Statistics from external sources (only internal platform data)

---

### Section 3 — The Verification Philosophy

**What it answers:** Q3: How does UmojaHub create trust?

**Content:**
- One shared principle: nothing claimed on UmojaHub is unverified.
- Two applications:
  - For the Food Security Hub: farmer identity reviewed by named administrators. Trust Score built from real transaction history.
  - For the Education Hub: project documents reviewed by named, credentials-confirmed lecturers. Portfolio entry records the reviewer.
- The key distinction from other platforms: verification is a human decision, not a checkbox.

**Visual anchor point (Phase 2/3 decision):**
A diagram showing the verification spine — the single trust infrastructure serving both hubs. This is a placeholder at wireframe stage.

**What it must NOT contain:**
- Technical implementation details
- Specific administrator names (belongs on /team)
- Trust Score formula (belongs on /trust)

---

### Section 4 — Trust Architecture Overview

**What it answers:** Q4: What does verification look like in practice — at a high level?

**Content:**
Two parallel flows, simplified:

Food Security Hub flow:
Farmer submits documents → Administrator reviews → APPROVED / REJECTED → Listings live → Transactions build Trust Score → Buyers see tier

Education Hub flow:
Student submits project + 3 documents → Peer reviews → Lecturer reviews → VERIFIED / REVISION / DENIED → Portfolio entry records reviewer + decision + hash

**What it must NOT contain:**
- Full process details (belongs on /trust and audience pages)
- Technical language (STK push details belong on /for/buyers)

---

### Section 5 — Live Evidence

**What it answers:** Q6: Is this actually working?

**Content:**
- Verified farmers (count, live)
- Transactions completed (count, live)
- Counties represented (count, live)
- Student portfolios verified (count, live)
- Verified lecturers (count, live)
- Last updated timestamp

**Disclosure immediately below:**
"These figures reflect the platform as it operates today. Methodology for each metric is disclosed on the Transparency page."

**Technical requirement:** ISR revalidation every 300 seconds. No client-side fetching.

**What it must NOT contain:**
- Projected numbers
- Claims about future growth
- External data or comparisons

---

### Section 6 — Audience Routing

**What it answers:** Q8: Is this relevant to me?

**Content:**
Five cards (or equivalent routing elements):

1. Farmers — "Sell verified produce to buyers outside your network. M-Pesa payment confirmed before dispatch."
2. Students — "Build a verifiable project portfolio. Reviewed by credentialed lecturers."
3. Buyers — "Purchase produce from farmers with visible transaction history and identity verification."
4. Employers — "Read portfolios that include the reviewer's name, credentials, and decision."
5. NGOs & Government — "Mandate alignment and impact metrics with methodology disclosure."

Each card: one sentence about what they get + link to audience page.

**What it must NOT contain:**
- Misleading benefit claims
- More than one sentence per card (depth belongs on audience pages)
- Cards for audiences who primarily read (employers, institutions) without noting they don't register

---

### Section 7 — Entry CTA

**Content:**
Two CTAs:
- "Register" → /auth/register
- "Sign in" → /auth/login

Optional: session-aware behavior — if visitor is already authenticated, show "Go to Dashboard" instead.

**What it must NOT contain:**
- Urgency language ("Join now", "Limited spots")
- Social proof manipulation ("10,000 farmers can't be wrong")

---

## PAGE: FOR FARMERS (`/for/farmers`)

**Narrative goal:** A skeptical farmer leaves with complete, honest understanding of what participation involves, what it costs, what it cannot do, and a clear decision about whether to register.

**One-sentence test:** A farmer who reads this page should be able to accurately explain the verification process, the Trust Score, M-Pesa payment, and the platform's limitations to another farmer.

---

### Section 1 — What Farmers Get (Precise)

**Content:**
- Access to buyers outside their social/geographic network via a publicly searchable listing
- Price transparency: their listed price compared against verified weekly market benchmarks for ten major Kenyan crops
- M-Pesa payment confirmed before dispatch — payment arrives via Safaricom to their registered phone
- Trust Score that accumulates across transactions, increasing listing visibility over time
- SMS notifications for order status, payment confirmation, and price alerts
- AI farm assistant (available in the dashboard after registration)
- Cooperative group access for bulk agricultural input purchasing

**Immediately followed by (Limitation Disclosure):**
What participation does NOT guarantee:
- Buyers for your produce (demand depends on market conditions)
- Higher income than current channels
- Produce quality verification on behalf of buyers
- Dispute resolution for produce quality claims after delivery

---

### Section 2 — The Verification Process

**Content:**

**Documents required:**
- National ID or Kenyan passport
- Land documentation: title deed, land lease agreement, or tenancy letter
- Farm photograph or produce photograph

**What the administrator does:**
An administrator reviews the submitted documents for consistency and plausibility — are the documents consistent with each other, do they represent a real person with documented connection to land? The administrator does not assess farm quality, produce quality, or business viability.

**Decision:**
- APPROVED: farmer status becomes VERIFIED. Listings are immediately possible.
- REJECTED: farmer receives a reason via SMS. Rejection is correctable — resubmission with additional documentation is possible.

**Timeline:**
[Platform SLA for review — to be specified by operations team]

**What the administrator sees:**
Submitted documents and registration information. Nothing else.

**What is NOT visible to others:**
Document content. Only the verified/unverified status is public.

---

### Section 3 — The Trust Score

**Content:**
Four components:
1. Verification status (binary: verified or not)
2. Transaction volume (count of completed orders)
3. Buyer ratings (average rating from post-transaction buyer feedback)
4. Order reliability (ratio of fulfilled orders to total orders over a rolling window)

Four tiers:
- NEW: recently verified, few or no completed transactions
- ESTABLISHED: verified with a documented transaction history
- TRUSTED: verified with a strong history of positive ratings and consistent fulfillment
- PREMIUM: the highest tier, reflecting deep transaction history and consistently high ratings

What the Trust Score affects:
- Visibility in search results (TRUSTED and PREMIUM listings appear before NEW listings for the same crop and county)
- Buyer confidence (buyers can see the tier on every listing)

What the Trust Score does NOT affect:
- Platform access (any verified farmer can list, regardless of tier)
- Payment processing (M-Pesa payment works identically across all tiers)

→ Link to /trust for complete Trust Score methodology

---

### Section 4 — M-Pesa Payment Flow (Complete)

**Content:**

Step-by-step:
1. Buyer places order on the platform
2. Platform initiates an M-Pesa STK Push to the buyer's registered phone
3. Buyer receives a prompt on their device and enters their M-Pesa PIN
4. Safaricom processes the transaction and sends a confirmation to UmojaHub's callback endpoint
5. Order status updates from PENDING to PAID
6. Farmer receives SMS with order details and payment confirmation
7. Farmer dispatches produce
8. Buyer marks order RECEIVED
9. Both parties submit ratings

**What the platform holds:**
Order confirmation record. Payment amount. Safaricom transaction reference.

**What the platform DOES NOT hold:**
Buyer's M-Pesa PIN. Full payment credentials. Safaricom account details.

**Payment failure scenarios:**
- STK Push times out: no money moves. Order stays PENDING. Buyer can retry or cancel.
- Buyer declines: same as above.
- Network error: same as above.

---

### Section 5 — Cooperative Groups

**Content:**
What cooperative groups are: organized farmer groups on the platform that place collective bulk orders for agricultural inputs from verified suppliers.

How they work:
- Farmers form a group on the platform
- The group nominates a verified supplier for a collective input order
- The supplier fulfills; payment is coordinated through the group

Who can join:
Any verified farmer. There is no separate cooperative registration.

What collective groups can access:
Bulk agricultural input pricing not available to individual farmers.

What the platform CANNOT guarantee:
Minimum group size for any specific order. Supplier availability. That collective input costs will be lower than individual purchasing in all cases.

---

### Section 6 — Failure Modes (Disclosed)

**Content:**

**Farmer non-dispatch after payment:**
The payment-before-dispatch model means buyers pay before produce is dispatched. If a farmer consistently fails to dispatch after payment, the reliability component of their Trust Score degrades. Administrators can review accounts with sustained non-dispatch patterns.

**STK Push failure:**
See Section 4. No financial risk to the farmer — payment must confirm before dispatch obligation begins.

**Trust Score gaming:**
The verification requirement means any bad actor attempting to game the Trust Score through artificial transactions is connected to a real, verified identity. The cost of building a fraudulent score is the real transactions required.

**Administrator review backlog:**
If the volume of verification submissions exceeds administrator capacity, the review queue backs up. Farmers in PENDING status cannot list until their review is complete. There is no automated fallback for human document review.

---

### Section 7 — Farmer Registration CTA

**Content:**
- "Register as a Farmer" → /auth/register?role=farmer
- "Already have an account? Sign in" → /auth/login

---

## PAGE: FOR STUDENTS (`/for/students`)

**Narrative goal:** A skeptical CS student leaves understanding exactly what Portfolio Verified means, what the process requires, what an employer sees, and whether the time investment is justified.

---

### Section 1 — What Portfolio Verified Is (and Is Not)

**What it IS:**
A permanent record showing that a named, credentials-confirmed reviewer assessed your project work against a published rubric and issued a documented decision. The reviewer's name, title, and institutional affiliation appear in your portfolio entry. The documents you submitted are publicly readable. A cryptographic hash created at submission confirms the documents were not altered after review.

**What it IS NOT:**
- A guarantee of employment
- A salary signal
- An employment readiness certification
- An institutional grade or transcript item
- An accredited academic credential
- Affiliated with your university (participation is independent of institutional enrollment)

---

### Section 2 — What the Process Involves

**Brief selection:**
Two tracks:
- AI_BRIEF: The platform generates a project brief from a real agricultural industry context. The brief is fixed — you cannot modify its scope or requirements.
- OPEN_SOURCE: You bring a real open-source project and work from its actual codebase. The brief is derived from the project's real issues and context.

**Three required documents:**

1. Problem Breakdown
What it is: your analysis of the problem stated in the brief. Shows whether you understand the domain and can decompose a complex problem.
What reviewers look for: depth of problem understanding, clarity of decomposition, domain awareness.

2. Approach Plan
What it is: how you structured the work before beginning. Shows planning discipline — the ability to think before executing.
What reviewers look for: logical sequencing, anticipation of blockers, realistic scoping.

3. Final Reflection
What it is: what you built, what failed, what you would do differently, and what you learned.
Why this is the most significant document: It reveals professional thinking quality. A developer who can accurately assess their own failures learns faster and operates more reliably than one who cannot. This is the document an employer reads most carefully.

**Submission:**
When you submit, the platform creates a cryptographic hash of your documents and records it in the audit log with a timestamp. From this point, the documents cannot be altered without the hash failing.

---

### Section 3 — The Review Process

**Peer Review:**
After submission, another student on the platform receives your documents and reviews them against the four-dimension rubric. They score each dimension (1–5) and write commentary. Their score is recorded and locked before your submission enters the lecturer queue.

Why peer review exists:
- It raises the floor of submissions entering the formal queue
- Peers who review poorly (scores inconsistent with eventual lecturer decisions) are tracked — their review quality has consequences
- Reviewing others develops your own submission quality

**Lecturer Review:**
A verified lecturer (credentials confirmed by a platform administrator) receives your documents, the peer score, and the rubric. They make an independent assessment. Their decision is one of three:

VERIFIED:
The submission meets the standard. Your portfolio updates immediately. The entry is permanent. The lecturer's name, affiliation, and the verification date are recorded.

REVISION_REQUIRED:
The submission has specific identified weaknesses. The lecturer writes substantive commentary (minimum 50 words of specific assessment) explaining what must be improved. You may revise and resubmit. Both the original and the revision are preserved in the audit log.

DENIED:
The submission does not meet the standard and revision cannot remedy it. It does not appear in your portfolio. You may start a new project. The decision and reasoning are recorded.

---

### Section 4 — What an Employer Sees

A portfolio entry contains:
- Project title and brief type (AI_BRIEF or OPEN_SOURCE)
- Track (Agriculture, Health, Finance, Infrastructure)
- Verification date
- Reviewer name and institutional affiliation
- Peer score (aggregate)
- Skills demonstrated (drawn from rubric dimensions)
- Your three documents (readable in full by anyone)
- Document hash (for independent authenticity verification)

An employer reading your Reflection document gets a direct window into how you approach problems, how you assess failure, and whether your professional thinking is disciplined.

---

### Section 5 — Conflict of Interest Protections

**What the platform prevents:**
- A lecturer cannot review submissions from students at their own institution
- A lecturer cannot review submissions from students with whom they have a verifiable direct teaching relationship
- Peer review scores are locked before the lecturer sees the submission — the lecturer cannot retroactively influence the peer score

---

### Section 6 — Timeline

**Realistic estimates:**
- Document production: 1–4 weeks depending on project complexity
- Peer review: typically within 72 hours of submission entering the queue
- Lecturer review: 72-hour SLA from entering the queue
- Total for a complete VERIFIED entry: 2–6 weeks

---

### Section 7 — What Portfolio Verified Doesn't Cover

- The platform verifies your process — not that you wrote every line of code yourself
- Employers who want code attribution should examine your commit history independently
- The platform does not track what happens after verification — employment, salary, career trajectory
- VERIFIED status does not expire, but it reflects the state of your work at the time of submission — it does not update to reflect skills gained after submission

---

### Section 8 — Student Registration CTA

"Register as a Student" → /auth/register?role=student

---

## PAGE: FOR BUYERS (`/for/buyers`)

**Narrative goal:** A buyer leaves understanding what "verified" means when buying produce, how to read Trust Scores, how payment works, and what recourse exists.

---

### Section 1 — What Verified Procurement Means

A verified farmer listing on UmojaHub has had their identity documents reviewed by a platform administrator who confirmed they represent a real person with documented access to land. The verification status is not self-asserted. It is a human review decision.

What this tells you:
- You are transacting with a real person whose identity has been reviewed
- Their listing includes their Trust Score and tier — a visible record of their transaction history and buyer ratings

What this does NOT tell you:
- Produce quality at the time of your order
- Whether what arrives matches the listing exactly
- Absolute guarantee of fulfillment

---

### Section 2 — How to Read Trust Scores

[Full Trust Score tier explanation — see Farmer section, rephrased for buyer perspective]

What to do with this information:
For a large or important order, prefer a TRUSTED or PREMIUM farmer. For a trial order, a NEW farmer's verified status still confirms real identity.

---

### Section 3 — How Payment Works

[Complete M-Pesa payment flow — same as farmer section but from buyer perspective]

Your protection:
You enter your PIN to authorize payment after viewing the listing, the farmer's Trust Score, and the farmer's identity. You do not pay in advance of initiating an order — the STK Push is triggered at the moment of order placement.

---

### Section 4 — What Buyers Risk

Documented honestly:
- Produce that does not match the listing description
- Produce that is underweight, different variety, or in poor condition
- No automated dispute resolution for quality claims — the rating system is the recourse mechanism

**Recourse:** Submit a rating with explanation after receiving your order. Ratings directly affect the farmer's Trust Score and future listing visibility.

---

### Section 5 — Browse Before You Commit

Buyers can browse the full marketplace without registering. You can see all active listings, all farmer Trust Scores, and all county/crop filters before creating an account. Registration is required only to place an order.

→ Browse the Marketplace (links to /marketplace)
→ Register as a Buyer (links to /auth/register?role=buyer)

---

## PAGE: FOR EMPLOYERS (`/for/employers`)

**Narrative goal:** An employer who received a portfolio link leaves understanding what was verified, by whom, with what evidence, and how to independently confirm it — without registering.

---

### Section 1 — What Portfolio Verified Means (Employer Version)

A Portfolio Verified entry means:
- A student produced three specific documents (Problem Breakdown, Approach Plan, Final Reflection) in response to a defined brief
- Another student reviewed the documents against a published four-dimension rubric and scored them
- A named lecturer — whose credentials were confirmed by a platform administrator — made an independent final decision
- The decision was VERIFIED (the submission met the standard)
- The documents were cryptographically hashed at submission — they cannot be altered after review

---

### Section 2 — The Verification Chain

You can follow this chain:
1. UmojaHub verified the lecturer's identity and credentials
2. The lecturer reviewed the submission against a published rubric
3. The platform preserved a document hash that allows document authenticity confirmation
4. The portfolio records all of the above — reviewer name, decision date, document hash

---

### Section 3 — What You Can Verify Independently

- Reviewer identity: the reviewer's name and institutional affiliation are in the portfolio. You can look up their credentials independently.
- Document authenticity: request the document hash. Confirm it matches the documents in the portfolio.
- Decision date: the verification date is timestamped and recorded.
- Decision type: VERIFIED / REVISION_REQUIRED / DENIED history is preserved (the student's path to VERIFIED is visible).

---

### Section 4 — What You Are Assessing When You Read the Portfolio

You are reading the student's Reflection document. This document contains:
- What they built
- What failed during the project
- What they would do differently
- What they learned

This gives you a direct window into how the student approaches failure, how accurately they can self-assess, and whether their professional thinking is disciplined. It is more informative than a list of technologies on a CV.

---

### Section 5 — What Portfolio Verified Does NOT Mean

- It does not certify employment readiness
- It does not verify that the student wrote every line of code
- It does not set a salary floor or ceiling
- It does not indicate performance on any specific technology
- It is not an accredited academic credential
- It is not affiliated with the student's university

---

### No CTA

Employers do not register. The page ends with:
- Link to browse public portfolios (once public portfolio index exists)
- Contact pathway for institutional assessment questions

---

## PAGE: FOR LECTURERS (`/for/lecturers`)

**Narrative goal:** A potential reviewer leaves understanding the commitment, the protocol, the constraints, and whether participation is worthwhile.

---

### Section 1 — What Lecturer Participation Involves

**Time commitment per review:**
One review requires: reading three documents, reviewing a peer score and commentary, completing a four-dimension rubric assessment with substantive written commentary (minimum 50 words of specific assessment, not summary). Expect 45–90 minutes per review.

**What you decide:**
VERIFIED, REVISION_REQUIRED, or DENIED. Each decision requires written commentary explaining the specific reasons.

**What you can review:**
Only submissions on tracks where you are verified. You cannot review submissions from students at your own institution or from students with whom you have a verifiable direct teaching relationship.

---

### Section 2 — How Lecturer Verification Works

To become a verified reviewer, you submit your academic credentials to a platform administrator. The administrator confirms your institutional affiliation and academic standing. Once approved, you can begin reviewing on your verified tracks.

---

### Section 3 — What Constraints Apply

- You cannot review your own students (conflict of interest prevention)
- Your decisions carry your name and credentials — they are public in every portfolio entry you contribute to
- Your effectiveness metrics are tracked: score consistency with peer reviewers, decision patterns over time
- A one-word decision with no commentary does not meet the standard — it will be returned for resubmission

---

### Section 4 — Why Participation Matters

The Education Hub's credibility depends on reviewer quality. A VERIFIED decision from a credentialed reviewer at a recognized institution carries weight with employers. A VERIFIED decision from an anonymous reviewer carries none.

Your participation is the trust mechanism. Without named, credentials-confirmed reviewers, the verification chain breaks.

---

### CTA

"Register as a Lecturer" → /auth/register?role=lecturer

---

## PAGE: FOR NGOs & GOVERNMENT (`/for/ngos`)

**Narrative goal:** An NGO or government agency professional leaves with clear mandate alignment, honest impact data, and an accurate picture of what the platform can and cannot provide.

---

### Section 1 — Mandate Alignment Matrix

Two mandate areas:

Food Security / Agricultural Development:
- Platform operates: verified farmer marketplace, price intelligence, cooperative input purchasing
- Relevant mandates: smallholder farmer income, food chain transparency, agricultural input access, rural market connectivity
- What the platform measures: verified farmers, transactions, KES volume, counties
- What the platform does NOT measure: net farm income change, nutritional outcomes, post-transaction produce quality, export volumes

Youth Employment / ICT Skills:
- Platform operates: project verification, portfolio credentialing, peer and lecturer review
- Relevant mandates: youth employment readiness, verifiable skills development, ICT capacity building
- What the platform measures: verified student portfolios, verified lecturers, projects by track
- What the platform does NOT measure: employment outcomes, salary outcomes, post-graduation career trajectory

---

### Section 2 — Geographic Coverage

Current operational counties: [list with live counts from transparency API]
Kenya-first by design.
East Africa expansion: in scope, not yet operational.

---

### Section 3 — What Your Organization Can Do

Field staff can:
- Share information about the platform with farmers and students in their networks
- Register as farmers if they are farmers
- Browse public listings and portfolios without registering

Field staff cannot:
- Create bulk accounts on behalf of farmers or students
- Pre-verify farmers or expedite the review queue
- Access individual farmer or student data

---

### Section 4 — What the Platform Cannot Provide

- Individual user data (platform does not share user databases with external organizations)
- Cohort reporting on specific programs
- Custom impact measurement for partner mandates
- Field intervention coordination
- Referral programs with data sharing

---

### Section 5 — Impact Data (Live)

[Same live statistics as transparency page with methodology disclosure]

---

### Section 6 — FAQ

10-item FAQ addressing the most common NGO/government questions about:
- Data governance
- Partnership possibilities
- What "verified" means for official program recognition
- How to cite platform data
- Whether the platform is affiliated with government programs
- How to engage with platform leadership

---

### Section 7 — Contact

How to engage: types of inquiry the platform responds to, expected response timeline, contact channel.

---

## PAGE: TRUST & VERIFICATION (`/trust`)

**Narrative goal:** Anyone wanting the complete methodology — farmers before submitting, students before starting, employers validating, researchers auditing — finds a complete, honest, technically accurate explanation.

---

### Section 1 — The Trust Score (Food Security Hub)

**Four components with weightings:**
[Exact weightings — to be confirmed with platform team before this section is written]

Component 1: Verification Status
What it measures: whether the farmer has passed identity verification
Weight: [X]%
What changes it: administrator APPROVED decision (one-time)

Component 2: Transaction Volume
What it measures: count of completed orders
Weight: [X]%
What changes it: each RECEIVED order increases this component; order cancellations before fulfillment do not

Component 3: Buyer Ratings
What it measures: average rating from post-transaction buyer feedback
Weight: [X]%
What changes it: each submitted buyer rating recalculates this component

Component 4: Order Reliability
What it measures: ratio of fulfilled orders to total orders over a rolling window
Weight: [X]%
What changes it: each dispatch confirmation and each order that is not dispatched within the expected window

**Tier thresholds:**
- NEW: [score range]
- ESTABLISHED: [score range]
- TRUSTED: [score range]
- PREMIUM: [score range]

**Limitation disclosure:**
The Trust Score cannot detect sophisticated document fraud at the verification stage. It cannot prevent a bad actor who is willing to build score through real transactions before executing a fraudulent order. It creates accountability over time — not guaranteed performance on any single transaction.

---

### Section 2 — Farmer Verification Methodology

**What documents are reviewed:**
National ID / passport, land documentation, farm photograph.

**What the administrator assesses:**
Consistency (do the documents reference each other coherently), plausibility (does the documentation represent a real person with documented land access), completeness (are all required documents present).

**What the administrator does NOT assess:**
Farm quality, produce quality, business viability, farming experience.

**Decision criteria:**
APPROVED: documents are consistent, plausible, and complete.
REJECTED: documents are incomplete, inconsistent, or do not represent a plausible land connection. Rejection reasons are specific and correctable.

**What verification does NOT guarantee:**
That the farmer's land is what they describe it as. That the farmer will fulfill orders. That produce quality will match listings.

---

### Section 3 — Education Hub Verification Methodology

**What reviewers assess (four dimensions):**
1. Clarity of problem understanding (1–5)
2. Methodology appropriateness (1–5)
3. Documentation quality (1–5)
4. Reflection depth (1–5)

**Minimum standards for each decision:**
VERIFIED: scores and commentary that indicate the submission demonstrates competence in all four dimensions.
REVISION_REQUIRED: one or more dimensions below standard but improvable. Specific written commentary required.
DENIED: fundamental issues that revision cannot address.

**Document hash creation:**
At submission, the platform creates a SHA-256 hash of the combined document content and records it in the audit log with a timestamp and submission ID. The hash is the authenticity anchor for the portfolio entry.

**Peer score locking:**
Peer scores are locked before submission enters the lecturer queue. Lecturers cannot see peer scores while reviewing — they receive the final peer score only after their own independent assessment is complete.
[NOTE: Confirm whether lecturers see peer scores before or after — this is an architecture decision that affects the page content.]

**What verification does NOT guarantee:**
Code authorship (the platform records and verifies documented process, not that every line of code was written by the student). Employment outcomes. Skill level on any specific technology.

---

### Section 4 — Appeals and Recourse

**For farmers:**
- Rejection: resubmit with corrected or additional documentation. No fee. No limit on resubmissions.
- Dispute with a decision after approval: [30-day window] → contact the verification team via [contact method] → [SLA for response]
- Escalation: [who handles escalated appeals, how to reach them]

**For students:**
- REVISION_REQUIRED: revise and resubmit within [window]. The specific feedback is actionable — not general.
- DENIED: [can the student appeal a DENIED decision? This is an architecture question that affects page content]
- Conflict of interest claim: [process for claiming a reviewer had a conflict of interest not caught by the system]

**For anyone:**
→ Link to /team for named administrator accountability

---

## PAGE: TRANSPARENCY (`/transparency`)

**Narrative goal:** A researcher, auditor, or funder arrives wanting evidence of real operations. They leave with real numbers, disclosed methodology, honest omissions.

---

### Section 1 — Live Platform Statistics

Each metric with:
- Current count (ISR, revalidate 300s)
- What the count includes
- What the count excludes
- How it is calculated

Metrics:
- Verified farmers (APPROVED status, active accounts only / or total ever approved — specify)
- Completed transactions (RECEIVED status, not just PAID)
- Total transaction value in KES
- Counties with at least one active listing
- Verified student portfolios (VERIFIED decisions, not just submissions)
- Verified lecturers (approved reviewer accounts, active)

---

### Section 2 — What We Do Not Track

Explicit list:
1. Farm income before and after registration
2. Nutritional outcomes from marketplace transactions
3. Whether verified students are employed
4. Salary outcomes for verified students
5. Post-transaction produce quality scores
6. County food security indices

---

### Section 3 — Infrastructure Disclosure

Third-party services used:
- Safaricom Daraja API (M-Pesa payment processing)
- MongoDB Atlas (database)
- Cloudinary (document and image storage)
- Groq API (AI farm assistant and AI mentor)
- OpenAI API (brief generation and content moderation)
- Vercel (hosting)
- SendGrid (email notifications)
- Africa's Talking (SMS notifications)
- OpenWeatherMap API (weather data for farm assistant)

For each: what it does on the platform, what data it receives.

---

### Section 4 — Service Status

Real-time grid showing operational status of each major platform function:
- Farmer verification queue
- Student review queue
- Marketplace
- M-Pesa payment processing
- AI farm assistant
- AI mentor
- SMS notifications

Status states: OPERATIONAL / DEGRADED / PENDING

---

## PAGE: TEAM (`/team`)

**Narrative goal:** Anyone who wants to know who makes verification decisions — and who to contact if those decisions are wrong — finds named, credentialed people and a real appeals process.

---

### Section 1 — Who Makes Verification Decisions

For each active administrator:
- Full name
- Role on the platform
- Academic or professional credentials
- Which verification queues they manage
- Contact method for formal appeals

**Why names are published:**
Anonymous governance is not governance. A farmer submitting identity documents to an unnamed entity has no basis for trust.

---

### Section 2 — What Each Administrator Decides

**Farmer verification:**
- Reviews: National ID/passport, land documentation, farm photograph
- Criteria: consistency, plausibility, completeness
- Not assessed: produce quality, business viability

**Supplier verification:**
- Reviews: business registration, KEBS/PCPB/KEPHIS certifications
- Criteria: credential validity, registration status

**Lecturer verification:**
- Reviews: academic credentials, institutional affiliation
- Criteria: confirmed academic standing in a relevant discipline

---

### Section 3 — Decision Attribution Examples

Anonymized examples showing:
- What a complete APPROVED farmer verification looks like (what documents were present, why the decision was APPROVED)
- What a REJECTED farmer verification looks like (what was missing, what would have changed the decision)
- What a VERIFIED student portfolio entry looks like (rubric scores, commentary depth, what made it VERIFIED)
- What a REVISION_REQUIRED decision looks like (specific feedback, not general)

---

### Section 4 — Appeals Process

**Farmer / Supplier appeals (30-day window):**
Step 1: Submit appeal to [specific contact]
Step 2: Administrator reviews the original decision with fresh eyes
Step 3: Response within [SLA]
Step 4: If unresolved, escalation to [escalation contact]

**Student appeals (72-hour window after decision):**
Step 1: [process]
Step 2–4: [steps]

**Conflict of interest claims:**
If a reviewer had a conflict of interest not caught by the system, how to report and what happens.

---

## PAGE: ABOUT (`/about`)

**Narrative goal:** Anyone wanting to understand why this exists finds an honest account of origin, current state, limitations, and contact information.

---

### Section 1 — Three Structural Failures

**Failure 1 — Agricultural price opacity:**
Smallholder Kenyan farmers sell through intermediaries who hold the price information. This is not individual bad actors — it is a structural feature of how price information flows through agricultural supply chains.

**Failure 2 — Student credential opacity:**
Kenyan CS students graduate with degrees that certify attendance and portfolios that are self-reported. There is no existing mechanism that allows an employer to confirm that a specific person produced specific work without directly engaging that person.

**Failure 3 — Agricultural input access at scale:**
Individual smallholder farmers cannot access bulk pricing for seeds, fertilizers, and tools because their purchasing volume is too small. Cooperative structures exist but lack the verification and coordination infrastructure for reliable collective ordering.

---

### Section 2 — What the Platform Is Now

- Food Security Hub: operational
- Education Hub: operational
- Geographic coverage: Kenya, [counties list]
- East Africa expansion: in scope, not yet live

---

### Section 3 — What the Platform Is Not

- Not a charity
- Not a government program
- Not a commission-taking marketplace (the platform takes no commission on transactions)
- Not affiliated with any specific NGO, government ministry, or international development organization
- Not a certification body (Portfolio Verified is not an accredited credential)

---

### Section 4 — Contact

Types of inquiry the team responds to:
- Partnership enquiries (NGO, government, institutional)
- Press and research inquiries
- Technical issues not resolvable through the platform
- Escalated appeals

Response timeline: [specific SLA]

---

## PAGE: HOW IT WORKS (`/how-it-works`)

**Narrative goal:** A visitor who wants the complete end-to-end walkthrough — all actors, all steps, in sequence — finds it here.

---

### Section 1 — Food Security Hub: Complete Flow

From farmer registration to first transaction, every step.

---

### Section 2 — Education Hub: Complete Flow

From student registration to VERIFIED portfolio entry, every step.

---

### Section 3 — The Cooperative Group Flow

From group formation to input order fulfillment, every step.

---

## PAGE: EDUCATION HUB OVERVIEW (`/education`)

**Narrative goal:** Routing page. Explains the Education Hub at one level above the audience pages and directs each audience to their specific page.

---

### Section 1 — What the Education Hub Is

The Education Hub is a structured project verification platform for Kenyan CS students. Projects pass through a documented review process involving peer review and verified lecturer review. Successful projects are recorded in a permanent, publicly verifiable portfolio.

---

### Section 2 — Audience Routing

- Students → /for/students
- Lecturers → /for/lecturers
- Employers → /for/employers
- Institutions → /for/institutions

---

## PAGE: PUBLIC MARKETPLACE (`/marketplace`)

**Narrative goal:** Anonymous visitors can browse verified listings, apply filters, and understand what they're seeing — without registering.

---

### Section 1 — Listings Grid

Verified listings only. ISR revalidate 60s.
Each listing card: crop type, quantity, price per kg, county, Trust Score tier, harvest date, farmer name.
No checkout on this page.

---

### Section 2 — Filters

By county (dropdown)
By crop type (multi-select)
By Trust Score tier (checkbox: NEW / ESTABLISHED / TRUSTED / PREMIUM)
Price range (slider)

Client-side filtering. No session required.

---

### Section 3 — Unauthenticated CTA

Persistent banner or CTA: "Sign in as a Buyer to purchase listings."

---

## PAGE: MARKETPLACE LISTING DETAIL (`/marketplace/[id]`)

---

### Section 1 — Listing Information

Crop type, available quantity, price per kg, harvest date, county, listing photograph (if any).

---

### Section 2 — Farmer Information

Farmer name, verified status badge, Trust Score tier, completed order count.
Link to farmer's public profile (if exists).

---

### Section 3 — Payment Gate

**Anonymous visitor:** "Sign in as a Buyer to purchase this listing." → /auth/login?callbackUrl=/marketplace/[id]
**Authenticated Farmer:** "You are registered as a Farmer. Buyers purchase listings."
**Authenticated Buyer:** CheckoutForm (M-Pesa STK Push)

---

## PAGE: KNOWLEDGE HUB (`/knowledge`)

Article browse. ISR revalidate 3600s.
Category filter (client-side).
KnowledgeArticleCard grid.

---

## PAGE: KNOWLEDGE ARTICLE (`/knowledge/[slug]`)

Full article. Static render.
Source attribution (ArticleSourceBadge).
