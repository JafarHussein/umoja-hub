# Transparency Content Architecture
**Date**: 2026-06-01
**Purpose**: Define what the platform must disclose, where each disclosure belongs, and what language to use. This is the canonical reference for all transparency content on the website and in the platform.

---

## WHY TRANSPARENCY CONTENT EXISTS

Trust is not built by saying "trust us." It is built by explaining:

- What we know
- What we do not know
- What we verify
- What we do not verify
- What we can guarantee
- What we cannot guarantee

A platform that discloses its limitations proactively is more trustworthy than one that makes users discover limitations through a bad experience. Every limitation disclosed here reduces the number of disappointed users who feel misled.

The standard for this content: be specific enough that a farmer, buyer, student, or employer who reads it will not be surprised by anything that happens to them on the platform.

---

## FOOD SECURITY HUB TRANSPARENCY

---

### Farmer Verification

**What the verification process involves**:

A farmer submits three categories of documentation:

1. **Identity document**: National ID card or passport. The administrator confirms the document number, name, and photograph are consistent with the account registration details.

2. **Land documentation**: One of the following — title deed, land lease agreement, or a signed tenancy letter from a landowner. The administrator reviews whether the document names the applicant and whether it plausibly describes agricultural land use.

3. **Produce photograph**: A photograph of the farm or produce submitted by the applicant. The administrator uses this as a plausibility check — is this consistent with the claimed crop type and farming operation?

A UmojaHub administrator reviews all three documents together. They make a judgment: does this submission represent a real person who plausibly farms the crop they claim to farm?

**What verification proves**:

That a person submitted documents consistent with the claimed identity and farming operation, and that a UmojaHub administrator reviewed those documents and found them plausible at the time of review.

**What verification does not prove**:

- That the documents are genuine. Document review by a human administrator is not equivalent to government identity verification. A sufficiently convincing fraudulent document may pass review.
- That the farmer currently farms the crop they claimed at the time of submission. Verification is a point-in-time review, not a continuous audit.
- That the farmer will fulfil orders. Verification establishes identity, not reliability. Reliability is established by the Trust Score, which requires actual transaction history.
- That the produce is of the quality described in any listing. UmojaHub does not inspect produce.

**The gap between verification and trust**:

Verification is the floor, not the ceiling. A newly verified farmer with no completed orders is a real person with confirmed identity — and nothing else. A farmer with a TRUSTED tier Trust Score has confirmed identity, a substantial transaction history, and a pattern of positive buyer ratings. These are different levels of evidence. Buyers should understand the difference.

---

### Trust Score

**What the Trust Score is**:

A composite numeric score from 0 to 100 calculated from four components:

| Component | Weight | What it measures |
|-----------|--------|------------------|
| Verification | 40 points | Whether the farmer has completed document verification |
| Transactions | 25 points | Number of completed orders, scaled logarithmically |
| Ratings | 20 points | Average buyer rating across all completed orders, weighted by recency |
| Reliability | 15 points | Ratio of fulfilled orders to accepted orders over a rolling period |

**What each component reveals**:

*Verification (40 points)*: This is the only component that does not require any buyer interaction. A newly verified farmer starts with 40 points. This component does not increase — it is either present (verified) or absent (unverified). Its disproportionate weight relative to its binary nature reflects the platform's view that verified identity is the precondition for everything else.

*Transactions (25 points)*: Scales logarithmically — the difference between 0 and 5 orders is large; the difference between 95 and 100 orders is small. This prevents the score from simply rewarding volume without quality. A farmer cannot reach a high transactions score from fake orders — each order requires a real buyer payment.

*Ratings (20 points)*: Weighted by recency. Recent ratings carry more weight than older ones, which means a farmer who performs poorly after a good start will see their rating component fall. A single bad rating has diminishing influence as the number of ratings grows — a farmer with one bad rating out of forty orders is not equivalent to a farmer with one bad rating out of two orders.

*Reliability (15 points)*: Tracks the proportion of accepted orders that are fulfilled. A farmer who accepts orders and then fails to dispatch repeatedly will have a low reliability score regardless of how positive their completed-order ratings are. This component specifically targets the failure mode of selective order acceptance.

**What the Trust Score does not mean**:

- It does not predict the quality of produce on any specific order.
- It does not guarantee that an individual transaction will go smoothly.
- It does not reflect the farmer's actual agronomic capability or the quality of their farming practices.
- A high Trust Score means the farmer has a verified identity, completed a meaningful number of orders, received positive ratings, and fulfilled orders reliably. It means this pattern has been consistent — not that it will continue indefinitely.
- A low Trust Score on a newly joined farmer does not mean they are untrustworthy — it may simply mean they have not yet completed transactions.

**Trust Tiers**:

| Tier | Score range | What it signals |
|------|-------------|-----------------|
| NEW | 0–39 | Verified identity only, or very early transaction history |
| ESTABLISHED | 40–59 | Growing transaction history with acceptable ratings |
| TRUSTED | 60–79 | Substantial transaction history with consistent positive performance |
| PREMIUM | 80–100 | Extensive history, high ratings, high reliability over time |

Tiers are not permanent. They recalculate based on current score. A farmer in TRUSTED tier who stops fulfilling orders will see their reliability component fall and may drop to ESTABLISHED. The tier reflects current behavior pattern, not career achievement.

---

### Ratings

**How ratings work**:

After an order is marked as completed (both parties confirm receipt), both the buyer and the farmer can submit a rating. Buyer ratings of farmers are the component that most directly reflects a buyer's experience. Farmer ratings of buyers are recorded but not currently factored into Trust Score — they inform administrator visibility of problematic buyers.

Ratings are on a five-point scale. Buyers may leave a comment alongside the numeric rating. Comments are visible on the farmer's profile page.

**What a rating represents**:

The buyer's assessment of the transaction they completed. It reflects: produce matching the listing, quantity accuracy, fulfillment speed, and communication quality. It does not reflect: objective produce quality standards, agronomic practices, or anything the buyer cannot observe.

**What ratings do not prevent**:

A buyer who received good produce but is having a bad day can leave a low rating. A buyer who received bad produce may not leave a rating at all. Ratings reflect buyer behavior as well as farmer behavior. The volume of ratings matters — a score based on 3 ratings is less stable than one based on 40.

---

### Dispute Handling

**What constitutes a dispute**:

A payment confirmed by Safaricom but an order not dispatched. A buyer who marks received but claims produce did not match. A farmer who disputes a buyer rating.

**How disputes are currently handled**:

The primary dispute resolution mechanism is the rating system — buyers leave accurate ratings, farmers see consequences in their Trust Score. Escalated disputes (payment confirmed, no dispatch after [platform-defined window]) are reviewed by platform administrators. There is no binding arbitration. The platform does not guarantee reimbursement for quality failures.

**What is not covered**:

Quality disputes — produce that arrived but was below expected standard — are handled through the rating system, not through financial remediation. Buyers accept this limitation when transacting on the platform.

---

### M-Pesa Payment Mechanics

**How payment works technically**:

1. Buyer places order. System calls Safaricom Daraja API with the buyer's phone number.
2. Safaricom sends an STK Push to the buyer's phone.
3. Buyer enters their M-Pesa PIN on their device.
4. Safaricom processes the transaction and sends a callback to UmojaHub's server.
5. UmojaHub updates the order status.

**What UmojaHub does and does not handle**:

UmojaHub initiates the payment request and receives the confirmation. It never receives or stores the buyer's M-Pesa PIN. The PIN goes from the buyer's device to Safaricom directly. UmojaHub receives only a confirmation that the transaction occurred and the transaction reference number.

**Payment failure scenarios**:

- *STK Push timeout*: If the buyer does not respond to the push within the timeout window, the request expires. No money moves. The order remains PENDING. The buyer can attempt payment again.
- *Buyer declines*: The buyer receives the push and explicitly declines. No money moves. The order remains PENDING.
- *Safaricom service interruption*: If Safaricom's Daraja API is unavailable, the STK Push cannot be initiated. Payment cannot proceed until the service is restored. UmojaHub does not control Safaricom's infrastructure.
- *Network timeout after payment*: In rare cases, Safaricom may confirm payment but the callback to UmojaHub's server may be delayed. The order may appear to still be PENDING on the platform while the payment has actually cleared on the buyer's M-Pesa statement. This is a documented edge case that requires administrator intervention to resolve.

**Platform affiliation**:

UmojaHub is not affiliated with Safaricom. UmojaHub uses Safaricom's Daraja API as a licensed third-party developer. Any issues with M-Pesa itself (balance, network, account status) are outside UmojaHub's control.

---

### What Platform Administrators Can See

Administrators can view:

- Verification submission documents (for review purposes)
- Account registration details for all users
- Order history and status for all transactions
- Transaction reference numbers (not full M-Pesa account details)
- Dispute escalation queues
- Listing content for all active and inactive listings
- Trust Score component breakdowns for all farmer accounts
- Suspension logs and reason codes

Administrators cannot view:

- Buyer M-Pesa account details or PIN
- Farmer mobile money account balances
- Document content that was not submitted to the platform
- Communications between farmers and buyers that happen outside the platform (phone calls, WhatsApp, etc.)

---

### AI Use in the Food Security Hub

**AI Farm Assistant**:

The AI Farm Assistant (powered by Groq) is a text-based query interface. A farmer asks a question; the system generates a response.

What it can do: provide general agronomic guidance on planting schedules, pest management, crop rotation, and market timing based on general agricultural knowledge.

What it cannot do: provide advice calibrated to the farmer's specific soil, specific climate conditions, or specific local pest patterns without the farmer providing that context in the query. It is not a substitute for a certified agricultural extension officer. It does not connect to live weather data unless explicitly described by the farmer.

What it does not do: The AI Farm Assistant does not learn from conversations over time. It does not remember previous sessions. Each conversation begins from zero context unless the farmer provides context in the current message.

**Price Intelligence**:

The Price Intelligence dashboard shows comparable listing prices for a given crop type in the farmer's county and neighboring counties. This data is derived from active listings on UmojaHub — it reflects what other farmers are currently asking, not confirmed sale prices. It is not a market price oracle. It is a directional signal based on platform listing data.

---

## EDUCATION HUB TRANSPARENCY

---

### Review Process

**How peer review works**:

A submission enters the peer review queue. A peer reviewer is assigned. They receive the brief, all three documents, and the rubric. They submit scores on four dimensions and written commentary. The score and commentary are locked before the submission moves to the lecturer queue.

The peer reviewer is identified — anonymous peer reviews are not accepted. The peer reviewer's assessment is visible to the lecturer, who can see the score and commentary. The peer review does not determine the outcome — the lecturer makes the final decision independently.

**How lecturer review works**:

The lecturer receives the complete submission package: brief, three documents, code/repository, and peer score with commentary. They review against the same four-dimension rubric. They issue a decision (VERIFIED, REVISION_REQUIRED, or DENIED) with written commentary of minimum 50 substantive words.

The lecturer's decision is final for that review cycle. A REVISION_REQUIRED decision returns the submission to the student with the commentary. A DENIED decision closes the submission; the student may start a new project.

**How reviewer assignment works**:

Reviewers are assigned from the pool of verified reviewers for the relevant track who have no conflict of interest with the submitting student. The platform prevents the student's direct lecturer from reviewing their submission. If the reviewer pool for a track is thin, queue wait times increase.

---

### Lecturer Approval

**What lecturer verification means**:

A lecturer submitted credentials (academic or professional qualifications relevant to the track they applied for) and employment or affiliation documentation. A UmojaHub administrator reviewed the documents. The administrator confirmed the credentials are consistent with the claimed position.

**What lecturer verification does not mean**:

- It does not mean the lecturer is the best possible reviewer for the submission.
- It does not mean their assessment is free from error or bias.
- It does not mean the reviewing institution endorses UmojaHub.
- It does not mean the reviewer has current academic standing — verification is point-in-time.

Verification confirms credentials were reviewed at a point in time. It does not guarantee ongoing quality of assessment.

---

### Document Hashes

**What the hash is**:

A cryptographic hash (SHA-256) of the submitted document content, created at the moment of submission and recorded in the verification audit log with a timestamp.

**What the hash proves**:

That the documents currently visible in the portfolio entry are identical to the documents submitted at the time of submission. If any character in any document has been altered after submission, the hash will not match the current documents.

**What the hash does not prove**:

- That the student wrote the documents themselves. The hash proves document integrity, not authorship.
- That the documents are accurate. A Reflection document that describes work not actually done would hash consistently — it proves the document wasn't changed after submission, not that it's honest.
- That the code submitted was written by the student. Code authenticity is harder to verify than document integrity.

An employer who uses the hash to verify a portfolio entry is confirming: the documents they are reading are the same documents that were reviewed. They are not confirming: the student wrote them, the student understands them, or the student's claims within them are accurate.

---

### Verification Meaning and Limitations

**What VERIFIED means**:

A named, credentials-confirmed reviewer assessed all three documents and the code against a defined rubric and determined the submission met the documented standard. The decision was recorded with a timestamp.

**What VERIFIED does not mean**:

- That the student can be hired for any specific role.
- That the code is production-ready or free of security vulnerabilities.
- That the student's claims about their experience within the documents are accurate.
- That the platform endorses the student's work product.
- That the reviewer found the submission exceptional — VERIFIED means it met the standard, not that it exceeded it.

**What REVISION_REQUIRED means**:

The submission has specific documented weaknesses the reviewer identified. It does not mean the submission is bad — it means it is not yet at the standard and has a specific path to improvement. A student who receives REVISION_REQUIRED feedback and addresses it thoroughly before resubmitting may produce a stronger portfolio entry than a student whose first submission was borderline VERIFIED.

**What DENIED means**:

The submission does not meet the standard and revision within the current project scope cannot remedy it. DENIED decisions are relatively rare. A DENIED submission does not appear in the portfolio. It does not preclude starting a new project.

---

### Portfolio Generation

**What appears in the portfolio**:

- Project title and brief description
- Track and brief type (AI_BRIEF or OPEN_SOURCE)
- Verification status and date
- Reviewer name and institutional affiliation
- Peer review score (four dimensions)
- Skills demonstrated (tagged by track and project type)
- The three document texts (Breakdown, Plan, Reflection) — readable in full
- The document hash
- A shareable URL

**What does not appear**:

- DENIED submissions
- Submissions in PENDING, REVISION_REQUIRED, or any intermediate status
- Reviewer commentary in full — the reviewer summary is visible, not verbatim internal notes

**Portfolio visibility**:

Portfolio pages are public. No registration is required to view them. Any person with the URL can read the portfolio entries.

---

### AI Use in the Education Hub

**AI Brief Generator**:

For the AI_BRIEF track, the system generates a project brief from a curated context library for the selected track. The context library is maintained by the UmojaHub team. The AI (OpenAI API) generates a specific brief from general parameters — industry domain, problem type, constraint set.

What this means in practice: the brief reflects the quality and specificity of the context library. A richer context library produces more specific, more challenging briefs. The brief generation process is opaque to the student — they receive the brief, not the prompt or parameters that generated it.

**AI Mentor**:

The AI Mentor (powered by Groq) is a question-response interface available to students working on their submissions.

What it will do: ask the student questions about their project to help them articulate their own reasoning. "What did you decide not to do and why?" is a question the Mentor will ask. "What did you learn that surprised you?" is another.

What it will not do: write any part of the student's submission documents. If a student asks the AI Mentor to write their Reflection document, the Mentor will respond with a question that redirects them to the task of articulating their own thinking.

The Mentor's role is Socratic — it surfaces the student's reasoning by asking for it, not by providing it. Documents generated by a student using the Mentor as a writing aid would not survive peer or lecturer review because the reasoning would be the AI's, and reviewers are assessing whether the student can reason like this.

**What AI is not used for**:

- Reviewer assignment
- Scoring or decision assistance for peer reviewers or lecturers
- Any component of the Trust Score calculation
- Any element of the farmer verification process

These decisions require human judgment and human accountability. Automated assistance in these decisions would undermine the verifiability of the outcomes they produce.
