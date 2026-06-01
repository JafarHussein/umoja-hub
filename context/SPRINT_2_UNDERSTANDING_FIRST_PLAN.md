# Sprint 2 — Understanding-First Plan
**Date**: 2026-06-01
**Principle**: Every element must earn its existence by increasing visitor understanding.
**Metric**: A visitor who reads a page should understand UmojaHub so thoroughly that the next logical action is using it — not because they were persuaded, but because they fully understand the system.

---

## BEFORE ANY CODE — THE QUESTIONS THIS PLAN ANSWERS

This plan addresses:

1. What does each audience page need to explain?
2. What root problems must be articulated before the platform is described?
3. What scenarios help visitors understand the system?
4. What transparency content builds trust?
5. What must be redesigned in the homepage from Sprint 1?

---

## PART 1 — HOMEPAGE REDESIGN

### The homepage has one job

The homepage must answer a question that visitors do not consciously ask but that every visitor implicitly has:

**"Is this real, does it work, and is it for me?"**

The current homepage answers none of these. It describes a product. It does not answer whether the product is credible, whether it solves a real problem, or whether it is relevant to the specific person reading it.

### The new homepage narrative arc

The homepage is not a collection of sections. It is a sequential argument.

Each section advances the argument. Each section answers a specific question the visitor has at that point in their reading.

**Question 1**: "What is this?" → Platform Definition (exists — needs deepening)

**Question 2**: "Why does this need to exist?" → Root Problem Statement (MISSING — must build)

**Question 3**: "Who does this affect?" → Audience reality (currently shallow grid — needs redesign)

**Question 4**: "How does it actually work?" → System explanation (currently step list — needs reasoning added)

**Question 5**: "Why should I trust this?" → Verification philosophy (currently thin 3 columns — needs expansion)

**Question 6**: "Is it real? Is it active?" → Live evidence (exists — is correct)

**Question 7**: "What should I do next?" → Audience paths (not a CTA — a navigation of understanding)

---

### Section redesign: Root Problem Statement (NEW — replaces Hero)

**What question it answers**: "Why does UmojaHub need to exist?"

**What must be explained**:

The Kenyan smallholder farmer sells into a system that structurally disadvantages them. When they bring produce to market, the market price they receive is determined by traders who also control the market price information. The farmer cannot independently verify whether the offered price reflects actual demand. The farmer has no formal mechanism to build a reputation with buyers they have never met. They cannot distinguish themselves from an unreliable farmer because no public, verifiable reputation system exists for agricultural commerce in Kenya. They have no formal commercial identity in the digital economy.

The buyer faces the opposite problem. They want to purchase produce directly from farmers — for freshness, for lower cost, for accountability — but they cannot identify which farmers are reliable without an introduction through a social network or physical market visit. There is no searchable, verified directory of farmers with verifiable track records.

The Education Hub exists for a parallel reason. A Kenyan CS graduate cannot prove their practical capability to an employer who has never worked with them. Their degree says which subjects they studied. It does not say what they built, how they documented their work, or whether a qualified reviewer assessed the quality. Self-reported GitHub portfolios cannot be verified by an employer — the code could have been written by anyone, or written for class rather than from genuine problem-solving. The result is that employers apply blanket skepticism to portfolios, and students with genuine capability are indistinguishable from students without it.

UmojaHub was built to address these three specific failures: price opacity for farmers, trust deficit in direct agricultural commerce, and credential gap for CS students.

**Format**: Prose. Not a list. Not a card grid. Three paragraphs explaining three problems. The platform is not mentioned until the problems are fully stated.

**Length**: Substantial. This is not a marketing blurb. This is the reason the platform exists.

---

### Section redesign: How the Marketplace Works (deeper reasoning)

**Current problem**: ProcessFlow shows steps. It does not explain why the steps are structured this way.

**Required addition**: After the visual flow, a prose explanation of the structural reasoning:

*Why verification before listing*: Without pre-verification, any person could list any produce under any name. A buyer has no basis for trust. The verification requirement is not a bureaucratic hurdle — it is the foundation of the trust system. Every listing on UmojaHub is from a person whose identity was reviewed by a human administrator who saw their documents.

*Why M-Pesa STK Push rather than cash or bank transfer*: Cash payment requires physical presence and creates no record. Bank transfer requires both parties to have bank accounts — approximately 40% of Kenyan adults do not. The STK Push model uses Safaricom's infrastructure (trusted by virtually every Kenyan with a phone) and creates a verifiable payment record that neither party can dispute. UmojaHub never handles the buyer's payment credentials.

*Why ratings matter structurally*: Without a rating system, a farmer who fulfils every order reliably is indistinguishable from one who does not. The rating component of the Trust Score is designed to reward consistent performance over time. A single rating has diminishing influence as more ratings accumulate. This prevents gaming — a single fabricated review cannot meaningfully inflate a score against a background of real transaction history.

**Format**: ProcessFlow visual kept. Followed by three paragraphs of structural reasoning. Prose. Dense. Trusts the reader.

---

### Section redesign: How the Education Hub Works (deeper reasoning)

**Current problem**: Six steps listed. The problem being solved is never stated.

**Required addition**: Before the flow, the problem statement. After the flow, the reasoning.

*The problem*: An employer receives a resume with five GitHub repositories listed. They have no way to know: who wrote the code, whether the student understood it, whether the documentation was the student's own thinking, or whether any qualified person assessed the quality. The portfolio is self-reported and therefore unverifiable. Employers respond by discounting self-reported portfolios and relying on institutional reputation, which advantages students from well-known universities and disadvantages students from smaller institutions regardless of their actual capability.

*Why three documents rather than just the code*: Code demonstrates technical execution. The Breakdown document demonstrates analytical capability — the ability to decompose a problem and reason about alternatives. The Plan document demonstrates project management capability — the ability to structure work before beginning it. The Reflection document is the most significant indicator of professional maturity — the ability to assess your own work honestly, identify what failed and why, and propose improvements. An employer reading a student's Reflection knows whether that student thinks like a professional. The three-document structure was chosen because it makes the student's reasoning visible, not just their output.

*Why peer review is mandatory before lecturer review*: A lecturer reviewing 30 student submissions without a pre-assessment gate would spend significant time on submissions that fail basic criteria of coherence and documentation quality. Peer review ensures that every submission reaching the lecturer queue has already been assessed by an informed reader against the same criteria the lecturer will apply. This protects the lecturer's time and raises the quality floor of what reaches the formal review queue.

*Why the document hash matters*: When a student submits documents, the platform creates a cryptographic hash of the document content. This hash is stored in the verification audit log. This means the documents cannot be altered after submission — if anyone (student or platform) changed the content, the hash would not match. An employer who cares about authenticity can request the hash and verify it against the submitted documents independently.

**Format**: Problem statement paragraph. Process flow visual. Three paragraphs of structural reasoning.

---

### Section redesign: AudienceNavigator

**Current problem**: Nine cards. One sentence each. Navigational but not educational.

**New approach**: The navigator should help visitors identify their specific problem, not their category. 

The redesign organizes around two questions:
1. Which hub is relevant to you?
2. What specific problem do you have?

The two-hub split should be visually clear. Under each hub, audiences are presented with the specific problem they face (not their category label). The link goes to the full audience page.

Example reframe:
- Old: "Farmers — List produce, receive M-Pesa payment directly, and build a trust score across verified orders."
- New: "You grow produce but cannot reach buyers who trust you → For Farmers"

Or stated another way: the one-sentence description should name the PROBLEM, not the solution. The solution is what the linked page explains.

---

## PART 2 — AUDIENCE PAGES: THE STANDARD

Every audience page is an educational document, not a feature page.

### The correct mental model for audience pages

Think of an audience page as a comprehensive answer to every meaningful question a person in that role might have before joining the platform.

If a farmer reads the farmer page and still has unanswered questions about how verification works, what Trust Score means, what happens when a buyer does not pay, or what happens when they are rejected — the page has failed.

The success state: a farmer reads the page and feels they have been fully briefed. Every significant uncertainty has been addressed. Every process has been explained. Every limitation has been disclosed. They understand what using UmojaHub will be like before they sign up.

### Structure every audience page around understanding, not features

**Section 1 — The Problem (specific to this audience)**
Not "UmojaHub helps farmers." The actual problem Kenyan farmers face in agricultural commerce. Named, specific, and verified against the platform's own IA.

**Section 2 — How UmojaHub addresses this (structural reasoning)**
Not a feature list. An explanation of why each design decision was made. Why verification is required. Why M-Pesa. Why Trust Score. Why ratings. The reasoning, not the feature.

**Section 3 — A real scenario (first-week experience)**
Walk through the experience of a person in this role during their first use of the platform. Not marketing. Not "success story." A detailed, accurate walkthrough of what they will actually do, see, and experience. Include what they will not be able to do until certain steps are complete.

**Section 4 — The complete workflow (all stages)**
Every stage from registration to full participation. Named stages. What the user does. What the system does. What they can expect.

**Section 5 — How trust works for this audience (where relevant)**
For farmers and suppliers: full Trust Score explanation. For students: how verification works for portfolio entries. For buyers: how to read farmer trust signals. For employers: how to verify a portfolio entry.

**Section 6 — Responsibilities**
What this person is agreeing to when they join. Not buried. Stated clearly. This is trust-building — disclosing responsibilities makes the platform feel serious and credible.

**Section 7 — Limitations and edge cases**
What happens when things go wrong. What the platform does not protect against. What the user's recourse is. What verification does not guarantee. These disclosures are trust-building, not trust-destroying.

**Section 8 — FAQ (comprehensive, full answers)**
Every real question. Full answers. No truncation. Organized by topic.

**Section 9 — Common misconceptions (where applicable)**
Specific incorrect beliefs that this audience might arrive with. Corrected directly.

**Section 10 — What to do next**
Specific. Sequenced. Links to the correct starting point.

---

## PART 3 — CONTENT FOR EACH AUDIENCE PAGE

### FOR FARMERS (`/for/farmers`)

**Root problem to explain**:
Kenyan smallholder farmers sell into a market where price information is controlled by the same traders who buy their produce. A farmer who consistently fulfils orders reliably has no public record of that reliability — they cannot prove their track record to a new buyer. They have no formal identity in the digital economy without business registration. Agronomic advice requires access to extension officers who are geographically inaccessible to most small-scale farmers.

**Real scenario to include**:
*Wanjiku, a kale farmer in Kiambu, joins UmojaHub*. Walk through her exact experience: what she sees on first login, what the onboarding asks for, what she submits for verification, what the waiting period looks like, what happens when she gets approved, what creating her first listing involves, what her dashboard shows while awaiting an order, what the SMS says when a buyer pays, and what she does to mark the order fulfilled.

**Key explanations**:
- Why verification is required before listing (not optional)
- What the Trust Score measures (four components, specific weights)
- Why ratings take three transactions to fully activate
- How the Price Intelligence dashboard works and why it matters
- What the AI Farm Assistant can and cannot do
- What cooperative groups enable
- What SMS notifications fire and when

**Misconceptions to correct**:
- Verification does not guarantee sales
- Trust Score is based on actions, not account age
- Rejection is correctable, not permanent
- UmojaHub is not a Safaricom product

---

### FOR BUYERS (`/for/buyers`)

**Root problem to explain**:
A buyer purchasing from an unknown farmer has no mechanism to assess whether that farmer is legitimate, has fulfilled orders for others, or has a history of accurate listings. Purchasing through traders adds cost and reduces freshness without adding accountability or verifiability. There is no searchable, verified directory of available produce from verifiable sources.

**Real scenario to include**:
*James, purchasing produce for a Nairobi restaurant, uses UmojaHub for the first time*. What he sees when he arrives (public marketplace, no registration required). What information he can see about a farmer before ordering. What the trust score means in practical terms when choosing between two listings. What the M-Pesa STK Push experience looks like on his phone. What happens to the order after he pays.

**Key explanations**:
- How to read a farmer's trust profile (Trust Score, tier, history)
- Why the M-Pesa STK Push model means they never share payment credentials with UmojaHub
- What happens if a payment goes through but order is not confirmed
- What "verified farmer" means (and what it does not mean)
- What recourse exists if produce does not match the listing

---

### FOR STUDENTS (`/for/students`)

**Root problem to explain**:
Employers cannot distinguish a student who developed genuine capability from one who completed coursework without deep understanding. Degrees certify attendance and examination performance. They do not certify whether a student can analyse a problem, plan structured work, execute on that plan, and reflect honestly on what they learned. Self-reported portfolios cannot be verified. GitHub repositories cannot confirm who wrote the code or whether the student understood it.

**Real scenario to include**:
*David, a third-year CS student at Strathmore, completes his first Education Hub project*. What the track selection looks like. What the AI-generated brief contains. What the AI Mentor says when he asks it to write his breakdown document for him (it refuses and asks him a question instead). What submitting the documents feels like. What peer review involves. How long the lecturer queue wait is. What REVISION_REQUIRED feedback looks like. What his portfolio shows after a VERIFIED decision.

**Key explanations**:
- The two tracks (AI_BRIEF vs OPEN_SOURCE) and when to choose each
- What each of the three documents must demonstrate
- Why the Reflection Document is weighted most heavily by reviewers
- Why peer review is mandatory before lecturer review
- What DENIED means (does not appear in portfolio, can start fresh)
- What the document hash is and why it matters
- What an employer can see in a portfolio entry
- What the AI Mentor will and will not do

---

### FOR LECTURERS (`/for/lecturers`)

**Root problem to explain**:
Student portfolios need human expert assessment to be meaningful. Without verified lecturers, the review system is either self-assessed (not credible) or machine-assessed (not rigorous enough to evaluate professional reasoning quality). The platform needs academic professionals who can assess not just code quality but the quality of a student's analytical process, planning discipline, and honest self-reflection.

**What to explain**:
- The four assessment dimensions in full detail: clarity, methodology, documentation quality, reflection depth
- What constitutes 50-word substantive commentary (vs. summary, vs. description)
- The three decision types and exactly when each applies
- What the review queue looks like and how projects are selected
- How effectiveness tracking works and what it measures
- What "verified lecturer" status means and how it is obtained

---

### FOR EMPLOYERS (`/for/employers`)

**Root problem to explain**:
Employers cannot verify self-reported portfolios. They cannot confirm who wrote code in a GitHub repository, whether documentation was the student's own thinking, or whether any qualified person reviewed the work. The result is either over-reliance on institutional reputation or under-reliance on portfolio evidence — both of which fail talented students from smaller institutions.

**What to explain**:
- What a VERIFIED portfolio entry means (exactly what review it passed)
- Who reviews student submissions (verified lecturers — explain what that means)
- What the three-document structure reveals about professional capability
- How to read a portfolio entry (what each field means)
- How to independently verify a portfolio entry if needed
- What the difference means between a student with one verified project and five

**No registration required**. Make this explicit and early.

---

### FOR SUPPLIERS (`/for/suppliers`)

**What to explain**:
Suppliers are not self-registered. They are added by administrators after credential verification. The page explains the supplier directory, what credentials are verified, what information appears in each listing, and how a supplier can be added to the directory.

**Key content**:
- What verified supplier status means (business registration, regulatory certificates)
- Which regulatory bodies are relevant (KEBS, PCPB, KEPHIS)
- How cooperative group orders work (group proposes, supplier fulfils)
- How to contact administrators about directory inclusion

---

### FOR COOPERATIVES (`/for/cooperatives`)

**What to explain**:
What cooperative groups are on the platform. What forming one requires. How bulk ordering works. What the minimum participation threshold means. How group orders coordinate. How this reduces per-unit input costs.

---

### FOR INSTITUTIONS (`/for/institutions`)

**What to explain**:
Institutions connect to the platform through their individual faculty members. Faculty register, submit credentials, and are verified. The institution's relationship is indirect — through the quality of its verified lecturers' reviews. What verification means for faculty. What student participation in the Education Hub produces for the institution's graduates.

---

### FOR NGOs (`/for/ngos`)

**What to explain**:
The platform's publicly accessible impact data. How NGOs can support farmers getting verified. How field staff can introduce the platform to farmer groups. Contact for partnership. What data is available and what is not.

---

## PART 4 — TRANSPARENCY CONTENT PLAN

This content must exist somewhere on the website. It can be consolidated on the `/transparency` page or distributed across audience pages.

### What must be disclosed

**Verification limitations**:
- Identity verification confirms documents were submitted and reviewed. It does not guarantee the farmer will fulfil orders.
- Lecturer verification confirms academic or professional credentials. It does not guarantee review quality.
- Student portfolio verification confirms a lecturer reviewed and approved the work. It does not guarantee the student is employable.

**AI limitations**:
- The AI Farm Assistant provides general agronomic guidance. It is not a certified extension officer or veterinarian.
- The AI Mentor does not write student documents. It asks questions.
- The AI brief generator produces structured briefs from a curated context library. The quality of the brief depends on the richness of the context.

**Platform limitations**:
- UmojaHub does not guarantee sales for farmers.
- UmojaHub does not guarantee employment outcomes for students.
- UmojaHub does not guarantee produce quality.
- UmojaHub is not affiliated with Safaricom.

**Data handling**:
- Verification documents are stored securely. They are not visible to other users.
- Document hashes are stored permanently. They cannot be altered.
- Transaction history is used to calculate Trust Score components.

---

## PART 5 — DIAGRAMS REQUIRED

Each of the following diagrams must increase understanding. None are decorative.

### Trust Score Component Diagram
Shows the four components (Verification 40pts, Transactions 25pts, Ratings 20pts, Reliability 15pts) with explanations of what each measures and how each is earned. Should show which components the farmer controls (transactions, reliability, ratings — through behavior) vs. which requires admin action (verification — one-time). This explains why a farmer can increase their score by fulfilling orders reliably.

### Trust Tier Progression Diagram
Four tiers on a scale: NEW (0–39), ESTABLISHED (40–59), TRUSTED (60–79), PREMIUM (80–100). Shows what each tier communicates to buyers. Does NOT imply it is easy or fast to progress. Includes what triggers recalculation.

### Marketplace Transaction Flow (with actors)
More detailed than the ProcessFlow currently shows. Include: what Safaricom's role is vs. UmojaHub's role vs. farmer's role vs. buyer's role at each step. Particularly important for the payment step — who does what.

### Education Verification Chain
Shows: Student → documents submitted → peer review → lecturer review → verification decision → portfolio. With branches: REVISION_REQUIRED → revise → resubmit; DENIED → new project. Shows the document hash creation step.

### Verification Document Review Process
Shows: farmer submits → PENDING status → admin queue → admin reviews → APPROVED or REJECTED → SMS fires. Shows what the farmer can do at each status.

---

## PART 6 — WHAT THE AUDIENCE NAVIGATOR SHOULD BECOME

The AudienceNavigator should not be a grid of nine equal cards.

It should be organized around two parallel systems:

**Food Security Hub** and **Education Hub**

Under each hub: the specific audiences with a problem framing, not a feature description.

Food Security Hub:
- **I grow produce and want to sell directly** → For Farmers
- **I buy produce and want verified sources** → For Buyers
- **I supply agricultural inputs to farmer groups** → For Suppliers
- **We are farmers who want to purchase inputs collectively** → For Cooperatives

Education Hub:
- **I am a student who wants a verified portfolio** → For Students
- **I am a lecturer who can review student work** → For Lecturers
- **I hire developers and want verifiable evidence of capability** → For Employers
- **I run an institution with a CS programme** → For Institutions

Other:
- **We are an NGO or government organization** → For NGOs

The one-line description under each should name the problem, not the solution. The linked page explains the solution.

---

## PART 7 — WRITING PRINCIPLES FOR ALL CONTENT

### Specificity over generality
"A farmer who completes ten orders in two months builds trust faster than a farmer who completes three orders in a year" is more informative than "Trust is based on actions, not time."

Write the specific version.

### Reasoning before conclusions
Explain WHY before stating WHAT. "The verification requirement ensures that every listing is from a person whose identity was reviewed by a human" is better than "Only verified farmers can list."

### Disclose limitations before being asked
Every section that describes a system should disclose what that system does not guarantee. Limitations disclosed proactively build more trust than limitations discovered after an unpleasant experience.

### Avoid compression that removes understanding
When two sentences are needed to explain something accurately, write two sentences. Do not compress to one sentence that loses the reasoning.

### Trust the reader
Write for someone who is intelligent, reading carefully, and has a real decision to make. They do not need to be handled. They need to be informed.

---

## PART 8 — IMPLEMENTATION ORDER

1. **Homepage redesign** — apply the narrative arc from Part 1. Start with root problem. Add structural reasoning to process flows. Redesign audience navigator. This is not an additive change — sections must be rewritten, not extended.

2. **For Farmers page** — the most complex and most important audience page. Built first because it establishes the pattern for all others.

3. **For Students page** — second most important. Complex Education Hub explanation.

4. **For Buyers page** — third.

5. **Remaining audience pages** — in priority order: Lecturers, Employers, Suppliers, Cooperatives, NGOs, Institutions.

6. **Transparency diagrams** — planned in Part 5. Built as inline SVG React components. Sequenced after the pages that will use them are built.

---

## DECISION CRITERION FOR EVERY FUTURE ELEMENT

Before building any section, component, or piece of content, answer:

**What specific understanding does the visitor gain after reading/seeing this that they did not have before?**

If the answer is unclear or absent: the element should not be built.
