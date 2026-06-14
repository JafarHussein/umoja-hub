# Storytelling Framework
**Status:** Phase 0 — Governing narrative architecture
**Authority:** Every page, every section, every content block must trace back to a question in this framework. If a section does not answer a question, it does not exist.
**Principle:** Every section answers a question while creating the next question.

---

## THE CENTRAL THESIS

A visitor arrives with one question: "What is UmojaHub?"

They should leave having answered a sequence of questions — not because we forced them through a designed funnel, but because each answer is genuinely incomplete without the next answer.

The experience is not a pitch. It is not a tour. It is a discovery.

Each section is a door. Every door opens onto another door.
The visitor walks through willingly because they want to know what is behind the next one.

---

## THE HOMEPAGE NARRATIVE ARC

This is the canonical question-answer-question chain. Every homepage section corresponds to a link in this chain. No link can be skipped.

---

**Q1: What is UmojaHub?**

> A platform where Kenyan farmers list verified produce and computer science students build verified portfolios.

**Why this creates Q2:**
This answer contains two things the visitor does not yet understand: "verified" (what does that mean here?) and "both farmers and students" (why are these two things on the same platform?).

---

**Q2: Why does "verified" matter — and why do both farmers and students need it?**

> Because existing systems have a structural problem: neither can build trust with strangers. Farmers are exploited by middlemen who have information advantages. Students have portfolios that no employer can independently confirm. Both problems have the same root: the absence of a mechanism to establish trust before a transaction.

**Why this creates Q3:**
The visitor now understands the problem. But understanding a problem does not mean understanding how UmojaHub solves it — or whether the solution is genuine rather than claimed.

---

**Q3: How does UmojaHub actually create trust where none existed before?**

> Through verification. Not automated verification. Human verification. Documents reviewed by named administrators. Projects reviewed by named lecturers. Every "Verified" label is a record of a real human decision, not a checkbox. This is the trust architecture.

**Why this creates Q4:**
The visitor now understands that verification exists and involves real people. But they don't yet understand what verification actually looks like in practice — the process, the criteria, the decisions.

---

**Q4: What does verification actually look like in practice?**

> For a farmer: document submission → administrator review → decision. For a student: project submission → peer review → lecturer review → decision. The process is documented, the criteria are published, the decision-makers are named. Nothing happens in a black box.

**Why this creates Q5:**
The visitor understands the process. But they still do not understand who the decision-makers are, whether they can be trusted, and what happens if a decision is wrong.

---

**Q5: Who are the decision-makers and can they be trusted?**

> Named administrators. Named lecturers. Their credentials are published. Their decision criteria are published. Their decisions are recorded with timestamps and cannot be altered. If a decision is wrong, the appeals process is documented and handled by a specific person.

**Why this creates Q6:**
The visitor understands accountability. But they don't yet know whether the platform is actually operating — or whether this is a well-described concept that has no real users.

---

**Q6: Is this actually working — does anyone use it?**

> [Live platform statistics: verified farmers, completed transactions, counties represented, student portfolios verified, verified lecturers.] These are real numbers from the platform as it operates today.

**Why this creates Q7:**
The visitor sees evidence of real operations. But they also know that every platform has a best-case pitch and an honest-case picture. They want to know what the platform can't do.

---

**Q7: What can't the platform do?**

> The platform verifies identity — not produce quality in advance. It records project verification — not employment outcomes. It creates accountability over time — not guaranteed performance on any single transaction. These limitations are not asterisks. They are primary content.

**Why this creates Q8:**
The visitor now has a complete, honest picture of the platform. The final question is: is this relevant to me, specifically?

---

**Q8: Is this relevant to me — and what does participation look like for my role?**

> It depends on your role. Farmers access buyers outside their network, with price intelligence and verified identity. Students build a verifiable record of their work, reviewed by credentialed professionals. Buyers access farmers with visible transaction histories. Employers access portfolios they can independently confirm. Each role has its own detailed answer.

→ This is the routing moment. The visitor selects their role and continues into the audience-specific journey.

---

## AUDIENCE JOURNEY ARCS

Each audience page continues the narrative from where the homepage routing leaves off. The questions are role-specific.

---

### FARMER JOURNEY

**Starting mental state:** "I heard about this from someone. I'm skeptical. I've been burned by platforms that didn't deliver. I don't understand why I should give someone my ID documents."

**Q1: What do I actually get by joining?**
Access to buyers outside your social network. Price transparency — you can see what other farmers are listing comparable produce for in your county. M-Pesa payment confirmed before you dispatch. A Trust Score that accumulates with every completed order, making each future sale more likely.

**Q2: What is a Trust Score and why does it matter?**
A number between 0 and 100 calculated from four things: your verified status, your transaction history, your buyer ratings, and your order reliability. Buyers can see it. A higher score means buyers are more likely to choose your listing over an unverified seller or a seller with a lower score.

**Q3: What does verification actually require of me?**
A national ID or passport. Land documentation (title deed, land lease, or tenancy letter). A photograph of your farm or produce. These go to a platform administrator. They review and decide.

**Q4: What happens to my documents — who sees them?**
Only the administrator who reviews them. Your document content is never displayed publicly. Only your verified status is public.

**Q5: What if my application is rejected?**
You receive a reason. Rejection is correctable. You can resubmit with additional documentation. Most rejections happen because documentation is incomplete, not because the farmer is invalid.

**Q6: What does the platform cost me?**
No commission. No listing fee. No percentage of the transaction. The platform takes nothing from your sale.

**Q7: What can the platform NOT do for me?**
It cannot guarantee buyers for your produce. It cannot verify produce quality on behalf of buyers. It cannot resolve disputes about quality after delivery. It cannot guarantee that you earn more than you do through your current channels — though the price intelligence gives you the information to make that judgment yourself.

**Q8: How does payment work, exactly?**
A buyer places an order. The platform sends them an M-Pesa STK push — a prompt to their phone. They enter their PIN. Safaricom confirms. You receive an SMS. You dispatch. The money is confirmed before produce leaves your farm.

**Q9: What if something goes wrong with payment?**
If the STK push times out or the buyer declines, no money moves. The order stays pending. The buyer can retry or cancel.

**Q10: What if a buyer doesn't pay after I've prepared the order?**
Orders require payment confirmation before the system marks them as requiring dispatch. You dispatch after confirmation, not before.

→ CTA: Register as a Farmer

---

### STUDENT JOURNEY

**Starting mental state:** "I have a GitHub. I have a degree. Why do I need another platform to tell employers I can code? Also — will this actually help me get a job, or is this just another portfolio website?"

**Q1: What is Portfolio Verified and how is it different from GitHub?**
GitHub is self-reported. Every commit, every repo, every README is authored by the person claiming it — and employers know this. Portfolio Verified means a named, credentials-confirmed reviewer assessed your work against a published rubric and issued a documented decision. The reviewer's credentials are visible. The decision is timestamped and cannot be altered. An employer can check the reviewer independently.

**Q2: What does the process actually involve?**
You receive a project brief (or bring your own open-source project). You produce three documents: a Problem Breakdown (your analysis of the problem), an Approach Plan (how you structured the work), and a Final Reflection (what you built, what failed, what you learned). A peer reviews your submission. A verified lecturer makes the final decision.

**Q3: Why three documents — why can't I just submit code?**
Code shows what you built. The documents show how you think. An employer reading your Reflection document knows how you approach failure, how you self-assess, and whether your thinking process is disciplined. This is information that a GitHub repository cannot provide.

**Q4: Who reviews my work?**
First, another student on the platform (peer review). Then a verified lecturer — a named academic with confirmed credentials at a specific institution. The lecturer's name and affiliation appear in your portfolio entry. An employer can look them up.

**Q5: What does the reviewer actually assess?**
Four dimensions: clarity of problem understanding, methodology appropriateness, documentation quality, and reflection depth. Scores on each dimension (1–5) plus written commentary. The peer score is recorded before the lecturer sees it. The lecturer's decision is one of three: VERIFIED, REVISION_REQUIRED, or DENIED.

**Q6: What happens if I get REVISION_REQUIRED or DENIED?**
REVISION_REQUIRED: the reviewer writes specific commentary explaining what needs improvement. You revise and resubmit. The original and the revision are both preserved in the audit log — the path to VERIFIED is recorded.
DENIED: the submission does not meet the standard. It does not appear in your portfolio. You can start a new project.

**Q7: What does an employer actually see?**
A portfolio entry containing: project title, track, brief type, verification date, reviewer name and institutional affiliation, peer score, skills demonstrated, and your three documents. The employer reads your Reflection. They know who reviewed it. They can verify the reviewer's credentials.

**Q8: Can the employer independently verify my portfolio?**
Yes. Each submission creates a cryptographic hash of your documents at the moment of submission. An employer who wants to confirm document authenticity can request the hash. If the documents were altered after submission, the hash would not match.

**Q9: What does the platform NOT promise?**
It does not guarantee employment. It does not track salary outcomes. It does not affiliate with your university — your institution is not a party to the verification. A student at any institution can participate independently.

**Q10: How long does this take?**
Brief track: one to four weeks for document production, depending on complexity. Peer review: typically within 72 hours. Lecturer review: 72-hour SLA. Total timeline: two to six weeks for a complete verified entry.

→ CTA: Register as a Student

---

### BUYER JOURNEY

**Starting mental state:** "I want to buy fresh produce directly from farmers. But I don't know these farmers. How do I know I won't get cheated?"

**Q1: What does 'verified farmer' actually mean?**
An administrator reviewed the farmer's identity documents and confirmed they represent a real person with documented access to the land they claim to farm. The verification status is not self-asserted — it is a human review decision.

**Q2: How do I know which farmer to trust?**
Trust Score and Trust Tier. Every verified farmer has a score (0–100) and a tier (NEW, ESTABLISHED, TRUSTED, PREMIUM) based on their transaction history, buyer ratings, and order reliability. A PREMIUM farmer has hundreds of completed orders and consistent ratings. A NEW farmer has been verified but has few completed transactions.

**Q3: How does payment work?**
You place an order. The platform sends you an M-Pesa STK push — a prompt to your phone. You enter your M-Pesa PIN. Safaricom confirms. The farmer receives notification and dispatches. Your payment is confirmed before produce is dispatched.

**Q4: What if the produce doesn't match the listing?**
Your recourse is the rating system. You submit a rating and explanation after receiving your order. Ratings affect the farmer's Trust Score, which affects how visible their listings are. Persistent quality shortfalls hurt the farmer's ability to operate on the platform.

**Q5: What if the farmer doesn't dispatch after payment is confirmed?**
The farmer's reliability component of their Trust Score tracks dispatch rate. Repeated non-dispatch leads to score degradation and administrator review. The payment-before-dispatch model means your money moves only after you've committed to buy — but non-dispatch is a failure the platform's accountability mechanisms address.

**Q6: What CAN'T the platform guarantee?**
The platform cannot verify produce quality at the point of listing. It cannot guarantee that what arrives matches the photograph. It creates accountability over time through ratings and Trust Score, but it cannot prevent any single instance of quality shortfall.

→ CTA: Browse the Marketplace / Register as a Buyer

---

### EMPLOYER JOURNEY

**Starting mental state:** "A candidate sent me a portfolio link. I'm hiring for a developer role. I want to know if this credential means anything real, or if it's another self-reported badge."

**Q1: What exactly was verified?**
The process: the student produced three documents (Problem Breakdown, Approach Plan, Final Reflection) in response to a defined brief. A peer reviewed the documents against a four-dimension rubric. A verified lecturer made an independent final decision — VERIFIED, REVISION_REQUIRED, or DENIED.

**Q2: Who did the verifying?**
The name, title, and institutional affiliation of the lecturer who issued the decision is visible in the portfolio entry. The lecturer was verified by a platform administrator who reviewed their academic credentials before they could review any submission.

**Q3: How do I know the documents I'm reading are the original documents the reviewer assessed?**
Each submission creates a cryptographic hash at the moment of submission. The hash is stored in the audit log. You can request the hash and confirm it matches the documents in the portfolio. If the documents were altered after submission, the hashes would not match.

**Q4: What does VERIFIED NOT mean?**
It does not mean the student writes exceptional code — it means their documented work process was assessed as meeting the platform's standard by a qualified reviewer. It does not certify employment readiness, salary suitability, or a specific skill level on any particular technology. It verifies that a real person with confirmed credentials assessed a documented work process.

**Q5: Can I see the documents without registering?**
Yes. Portfolios are publicly accessible. You do not need an account to view a portfolio entry, read the documents, see the reviewer's name, or check the verification date.

→ No CTA. The employer does not register. The page ends with a reference to independent verification and a contact pathway for institutional questions.

---

### NGO / GOVERNMENT JOURNEY

**Starting mental state:** "I work in agricultural development / youth employment. Is this platform relevant to our programs? Can I trust its numbers?"

**Q1: What programs does this platform support?**
The Food Security Hub addresses food chain transparency, farmer income, and agricultural input access — relevant to food security, agricultural development, and rural livelihood mandates. The Education Hub addresses verifiable technical credentials for Kenyan youth — relevant to youth employment, ICT skills, and economic inclusion mandates.

**Q2: What geographic coverage does the platform have?**
Kenya-first, initially. Multiple counties, with the county breakdown published on the Transparency page with live counts. East Africa is in scope but not yet operational.

**Q3: What can your field staff do?**
Field staff can register as farmers (if they are farmers), or explain the platform to farmers in their networks. There is no separate field staff role.

**Q4: What can your organization NOT do through this platform?**
Organizations cannot create bulk accounts for farmers, pre-verify farmers on behalf of the platform, or access individual farmer data. The platform does not make its user database available to external organizations. Individual farmers consent to their own participation.

**Q5: What impact data is available?**
Verified farmers, total transactions, KES transaction volume, counties represented, verified student projects, verified lecturers. Methodology for each metric is disclosed on the Transparency page.

**Q6: What data does the platform NOT track?**
Farm income pre/post registration (the platform records transaction amounts, not net income). Nutritional outcomes. Employment outcomes. Post-graduation salary. County food security indices. Export volumes.

**Q7: How can we support farmer or student adoption?**
Through information sharing and field awareness. The platform does not have partnership structures that involve data sharing, co-branding, or referral programs at this stage.

→ CTA: Contact for partnership enquiries

---

## THE TRANSPARENCY PAGE ARC

This page serves researchers, auditors, journalists, and funders. The narrative arc is different: it is not discovery — it is verification. The visitor arrives wanting to check claims, not discover new ones.

**What the visitor needs to confirm:**
- Are the numbers real?
- What methodology produces them?
- What is not counted?
- Who makes operational decisions?
- What third-party services does the platform use?
- Is the platform operational or aspirational?

The page answers each question directly. No narrative arc. Direct answers. Disclosed methodology per metric. Explicit list of what is not tracked. Current service status.

---

## THE TRUST PAGE ARC

This page serves anyone who wants to understand the verification methodology in depth — farmers before they submit documents, students before they submit projects, employers before they decide to trust a portfolio, researchers auditing the methodology.

**Questions answered, in order:**
1. What are the four components of the Trust Score?
2. What weight does each component carry?
3. What events trigger recalculation?
4. What does each tier (NEW / ESTABLISHED / TRUSTED / PREMIUM) represent in practice?
5. What does verification of a farmer actually involve?
6. What criteria does an administrator use?
7. What verification cannot guarantee (document fraud, produce quality)
8. What does lecturer verification involve?
9. What criteria govern the review rubric?
10. What verification cannot guarantee (code authorship, employment outcomes)
11. What is the appeals process?
12. Who handles appeals and on what timeline?

---

## THE ABOUT PAGE ARC

This page serves people who want to understand why the platform exists — its origin, its current state, its limitations, and its honest assessment of where it is.

**It is not an origin story. It is not startup mythology.**
It is an honest account of three structural failures and the platform that addresses them.

**Structure:**
1. The three structural failures (broker information asymmetry, student credential inflation, agricultural input access at scale)
2. What the platform is now (Food Security Hub operational, Education Hub operational)
3. Geographic reality (Kenya, specific counties, no global expansion claim)
4. What the platform is not (a charity, a government program, an NGO, a commission-taking marketplace)
5. Contact (types of inquiry the team responds to)

---

## SECTION DESIGN PRINCIPLES

### The Depth Principle
Every section that introduces a concept continues until the concept is complete. If explaining how the Trust Score works requires three paragraphs, write three paragraphs. Do not tease. Do not create preview cards that link to a separate explanation page unless the full explanation genuinely requires its own page.

### The Limitation Principle
Every capability statement is paired with a limitation statement. Place the limitation immediately after the capability — not in a footnote, not on a separate page.

Example:
"The platform verifies farmer identity through document review."
[Immediately followed by:]
"Document review by a human administrator cannot detect sophisticated forgeries. The platform reduces the risk of identity fraud — it does not eliminate it."

### The Specificity Principle
No vague claims. Every claim is testable. "Farmers can compare their listed price against verified weekly market benchmarks for ten major Kenyan crops" is specific. "We help farmers earn more" is not and will never appear on the website.

### The Evidence Principle
Where evidence exists, show it. Real numbers are stronger than any narrative. A claim supported by a live count is more trustworthy than the same claim stated as aspiration.

### The Completion Principle
A section that raises a question the page does not answer is incomplete. Either answer the question on the page, or provide a clear path to the page that does.

---

## CROSS-PAGE NARRATIVE CONTINUITY

Pages do not exist in isolation. The visitor carries questions from one page to the next. These cross-page narrative bridges must work:

**Homepage → Farmer page:**
Homepage tells the farmer what the platform offers. The farmer page answers: how does this actually work for me, specifically?

**Homepage → Student page:**
Homepage explains the Education Hub exists. The student page answers: why does this verification matter to employers who've never heard of UmojaHub?

**Farmer page / Student page → Trust page:**
Audience pages introduce the Trust Score / verification process. The Trust page provides the complete methodology for visitors who want to go deeper.

**Trust page → Team page:**
The Trust page explains that human administrators make decisions. The Team page answers: who are these humans, and what are their credentials?

**Transparency page ↔ Team page:**
These pages cross-reference each other. Transparency shows the numbers. Team shows who is accountable for them.

**Any page → About:**
Any visitor who wants to understand why this platform was built finds that answer on the About page. The About page does not duplicate content from audience pages — it explains origin and purpose, not mechanics.
