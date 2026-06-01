# User Journey Library
**Date**: 2026-06-01
**Purpose**: Detailed, operationally accurate journeys for each major participant in each hub. Not marketing stories. Not success testimonials. Accurate walkthroughs of what people actually experience — including what they cannot do, what they have to wait for, what failure looks like, and what happens next.

---

## HOW TO USE THIS LIBRARY

These journeys inform:
- Content for audience pages (`/for/farmers`, `/for/students`, etc.)
- Scenario sections in ecosystem explanations
- FAQ answers
- Misconception corrections

Each journey specifies: starting state, decisions the person makes, actions they take, what the system does, trust checkpoints, realistic outcomes, and failure cases. Every journey includes the friction — the waits, the constraints, the things that do not immediately work.

---

## FOOD SECURITY HUB JOURNEYS

---

### Journey 1: A Farmer Joins UmojaHub

**Person**: Wanjiku. Kale farmer in Kiambu County. 1.5 acres. Sells primarily to roadside traders who come to her farm. Has been told the traders pay KES 15/kg. Saw the same kale priced at KES 30/kg at a Nairobi market. Has an Android phone with M-Pesa.

**Starting state**: Has not heard of UmojaHub until a neighbor farmer mentioned it. Not registered.

---

**Phase 1: Discovery**

Wanjiku visits the UmojaHub website on her phone. The first thing she sees is not a sign-up form. She reads that UmojaHub was built because farmers sell into a system where traders control price information. This matches her experience. She reads that verified farmers can list directly with buyers. She continues.

She finds the "For Farmers" page. She reads the full explanation of what verification requires, what the Trust Score means, what happens when an order comes in. She reads the "what verification does not guarantee" section — no guarantee of sales, no guarantee of quality claims. She understands that registration does not mean immediate income.

She decides to register.

**Decision point**: Create an account.

---

**Phase 2: Registration**

She enters her phone number, name, and creates a password. She selects the role: Farmer. She receives an OTP by SMS to confirm her phone number. She enters it. Account created.

**What she can now do**: View the marketplace (as a visitor), access the AI Farm Assistant, view the Price Intelligence dashboard.

**What she cannot do yet**: Create listings. She is not verified.

She looks at the Price Intelligence dashboard. She can see that kale in Kiambu County is currently listed by other farmers at an average of KES 22–28/kg. She does not list yet — she needs to be verified — but she now has information she did not have before.

---

**Phase 3: Verification Submission**

She navigates to the verification section of her farmer dashboard. The dashboard shows her verification status: UNVERIFIED. It tells her what documents she needs to submit.

She takes a photograph of her national ID card (both sides). She photographs the lease agreement for her land. She photographs her kale growing in the field.

She uploads all three. The submission goes through. Her dashboard now shows: PENDING.

**What she can do during PENDING**: Use the AI Farm Assistant, view Price Intelligence, browse the marketplace.

**What she cannot do**: Create listings. There is no timer visible for when the review will complete. The dashboard says she will receive an SMS when the review is complete.

**What she waits for**: Administrator review. The wait time depends on the current queue depth. She may wait hours. She may wait a day or two.

---

**Phase 4: Verification Decision**

She receives an SMS: "Your UmojaHub verification has been approved. You can now create listings."

Her dashboard updates. Status: VERIFIED. Trust Score now shows 40 (verification component). Tier: NEW.

**What changes immediately**: She can create produce listings.

**What does not change immediately**: Her Trust Score will not meaningfully increase until she completes transactions with buyers. The tier NEW is accurate — she is new.

---

**Phase 5: First Listing**

She creates her first listing. She selects: Kale. Price: KES 26/kg (informed by Price Intelligence — she sets slightly below average, anticipating that her NEW tier will make buyers cautious). Available quantity: 200 kg. Pickup county: Kiambu. Preferred contact: SMS.

The listing goes live immediately. She can now see it in the marketplace alongside other farmer listings.

**What she expects**: Immediate orders.

**What actually happens**: Nothing, for several days. Her listing is live but she is a NEW tier farmer with 0 completed orders. Buyers who search for kale in Kiambu see her listing but also see listings from ESTABLISHED and TRUSTED farmers. She needs to wait for her first buyer.

**What she can do while waiting**: Adjust price, update quantity, ask the AI Farm Assistant about optimal kale harvest timing, read knowledge articles.

---

**Phase 6: First Order**

A buyer places an order for 50 kg. Wanjiku receives an SMS: "New order: 50 kg Kale. Order #KE0042. Buyer will pay by M-Pesa."

She sees the order in her dashboard. Status: PENDING (waiting for buyer to complete M-Pesa payment).

The buyer receives an STK Push on their phone. They enter their M-Pesa PIN. Safaricom confirms. Wanjiku receives a second SMS: "Order #KE0042 paid. KES 1,300 received. Please dispatch."

Her dashboard shows the order status: PAID. The payment is not yet in her M-Pesa account — it is held pending fulfillment confirmation.

---

**Phase 7: First Fulfillment**

She prepares 50 kg of kale and arranges transport to the buyer (the buyer specified Nairobi delivery). She marks the order DISPATCHED in her dashboard.

The buyer receives an SMS: "Your order #KE0042 has been dispatched."

The buyer confirms receipt. Wanjiku receives a final SMS: "Order #KE0042 complete. Payment released to your M-Pesa."

The payment arrives in her M-Pesa account.

Both parties can now rate each other. The buyer leaves a 4-star rating. Wanjiku leaves a 5-star rating for the buyer.

**Trust Score update**: Transactions component begins accumulating. Rating component begins accumulating. Her Trust Score moves above 40. She remains in NEW tier until she has enough transactions to move to ESTABLISHED.

---

**Failure case: Order placed, buyer does not pay**

A buyer places an order for 30 kg. The STK Push is sent. The buyer does not respond — the push times out. The order remains PENDING.

Wanjiku can see the order in PENDING status. She does not dispatch. She does not prepare a special harvest for this order until payment confirms. She waits.

After [platform-defined period], the pending order expires. No payment occurred. No dispatch occurred. Her Trust Score is unaffected — only completed orders affect it.

**Failure case: Dispatch confirmed but buyer does not mark received**

Wanjiku dispatches an order and marks it DISPATCHED. The buyer does not mark it RECEIVED within [platform-defined window]. The system may auto-complete the order after the window expires, releasing payment.

This is a documentation gap — the farmer should know the auto-complete window before committing to dispatch.

---

### Journey 2: A Buyer Finds and Orders Produce

**Person**: James. Purchasing produce for a Nairobi restaurant. Buys kale weekly. Currently buys from a market trader. Wants to try buying direct.

**Starting state**: Has heard about UmojaHub. Visits the website to see if it is real.

---

**Phase 1: Exploration without registration**

James visits the marketplace directly. He does not register. He can see all listings — farmer name, crop, price, county, Trust Score tier, completed order count, verification status.

He searches for kale in Kiambu. He finds seven listings. He sorts by Trust Score. The first result is a farmer with 47 completed orders, TRUSTED tier, average rating 4.7. The second is a farmer with 3 completed orders, ESTABLISHED tier, rating 4.5. The third is a NEW tier farmer with 0 completed orders.

He reads the farmer profiles for the first two. He sees the Trust Score breakdown. He decides to order from the TRUSTED farmer.

**Decision point**: Register to place an order.

---

**Phase 2: Registration**

James enters his phone number (the M-Pesa number he will use for payment), his name, and a password. Role: Buyer. SMS OTP confirmation. Account created.

**What changes**: He can now place orders. He does not submit any verification documents — buyers are not document-verified.

---

**Phase 3: Placing an Order**

He navigates back to the listing he chose. He enters the quantity: 50 kg. He clicks "Order."

The platform initiates an STK Push to his phone number. His phone displays a Safaricom payment request for KES [amount]. He enters his M-Pesa PIN on his phone.

He sees a Safaricom confirmation message on his phone: payment sent.

The order dashboard updates: Order #KE0051 — PAID. He receives an SMS: "Your order has been placed and paid. The farmer will dispatch shortly."

**What he knows now**: Payment is confirmed. He did not enter his PIN into UmojaHub — it went to Safaricom. UmojaHub received a confirmation.

---

**Phase 4: Receiving the Order**

He receives an SMS: "Order #KE0051 has been dispatched."

The produce arrives. He marks the order RECEIVED in the app.

He receives an SMS confirmation: order complete.

He is prompted to leave a rating. He rates the order 5 stars.

**What he notices**: The farmer's Trust Score updated. The completed order count on the farmer's profile increased by 1.

---

**Failure case: Produce does not match listing**

James receives the produce but finds it is 40 kg, not 50 kg. The shortfall is unexplained.

His recourse: leave a low rating with a written explanation. This affects the farmer's Trust Score. James cannot claim a refund through the platform — there is no financial remediation mechanism for quantity shortfalls. This is a documented limitation.

James now knows that ordering from higher-tier farmers correlates with — but does not guarantee — accurate fulfillment.

---

### Journey 3: A Supplier Joins the Directory

**Person**: A representative of a seed supplier with KEBS certification, wanting to access cooperative group orders.

**Starting state**: Learned that farmer cooperative groups on UmojaHub place group orders from verified suppliers.

---

**What they find on the website**:

The supplier page explains: suppliers are not self-registered. They are added by administrators after credential verification. The page lists the contact process for requesting directory inclusion.

**What they do**: Contact UmojaHub administrators with their business registration certificate, KRA PIN certificate, KEBS certification (or relevant regulatory certificate), and premises photograph.

**What happens**: Administrator reviews. Supplier is added to the directory with their verified credentials visible. They are now selectable by cooperative groups for group orders.

**What the supplier cannot do**: Control which groups nominate them. Adjust their directory listing without administrator involvement. Self-promote within the platform.

---

## EDUCATION HUB JOURNEYS

---

### Journey 4: A Student Completes a First Project

**Person**: David. Third-year CS student at Strathmore. Has built several projects for class but has nothing verifiable to show employers. Heard about the Education Hub from a classmate.

**Starting state**: Has not used UmojaHub. Not registered.

---

**Phase 1: Reading the Education Hub explanation**

David reads the `/for/students` page. He reads that the Education Hub produces verified portfolio entries backed by structured documentation and verified lecturer review. He reads what each document must demonstrate. He reads the AI Mentor section — it asks questions, it does not write his documents.

He reads the "what VERIFIED does not mean" section. He understands that VERIFIED means a reviewer assessed his work against a rubric. It does not mean he is guaranteed to get hired.

He decides to register.

---

**Phase 2: Registration and Track Selection**

He registers. Role: Student. Email confirmation.

He selects the AI_BRIEF track. He chooses the Agriculture domain — he has built a crop disease detection project for class.

The system generates a brief. The brief specifies: a mobile-accessible tool for smallholder farmers to document crop health observations and receive actionable guidance. Specific constraints: must function with intermittent connectivity. Deliverables: data model, interaction flow, and implementation notes.

This is not the project he already built for class. The brief generated a new scope.

**Decision point**: Does he start with this brief, or select a different track?

He decides to start with the generated brief. He has four weeks to complete it.

---

**Phase 3: Producing the Documents**

**Problem Breakdown (week 1)**

David opens the AI Mentor. He writes: "Can you help me write my breakdown document?"

The Mentor responds with a question: "What problem in your brief do you think is most underspecified? What would you need to know to solve it?"

He answers. The Mentor asks another question. He writes for two hours, working through his answer to its questions. He never receives text he can paste into his document. He receives questions that force him to articulate his own thinking.

He writes his Breakdown document. It is longer than he expected — he documented three alternative approaches he considered and why he rejected two of them.

**Approach Plan (week 2)**

He designs the data model. He plans the implementation in weekly milestones. He writes his Plan document.

**Implementation (weeks 2–3)**

He builds the project. He encounters two significant problems: the intermittent connectivity requirement is harder than anticipated. He solves one. He works around the second.

**Final Reflection (week 4)**

He writes his Reflection document. He is honest: the connectivity problem he worked around is not properly solved. He documents what a proper solution would require. He describes what he learned about offline-first data synchronization that he did not know before starting.

**Decision checkpoint**: He reads the Reflection document back. It sounds professional. It sounds honest. It shows he knows the limits of what he built.

---

**Phase 4: Submission**

He submits all three documents and the GitHub repository link.

The system creates a SHA-256 hash of the document content. The hash is recorded in the audit log with a timestamp. His submission status changes to: PEER_REVIEW.

---

**Phase 5: Peer Review**

An assigned peer reviewer receives his submission. David does not know who they are. The reviewer assesses his submission on four dimensions. They submit a score and written commentary.

David does not receive the peer score directly — it is visible to the lecturer during their review. David waits.

During this wait, he is assigned a peer review himself — he reviews another student's submission. He finds the process clarifying. The rubric he applies to the other student's Reflection document makes him think about his own.

---

**Phase 6: Lecturer Review**

His submission enters the lecturer queue. A verified lecturer in the Agriculture track is assigned. They review all three documents, the code, and the peer score.

David waits. He does not know how long this will take. The wait depends on the current queue depth and the assigned lecturer's availability.

---

**Phase 7: Decision**

He receives a notification: REVISION_REQUIRED.

The lecturer's commentary (63 words): "Your Problem Breakdown is the strongest part of this submission — the alternative approach analysis is unusually thorough. Your Reflection correctly identifies the offline-sync limitation. The Approach Plan needs more specificity in the testing section: how did you plan to verify that the connectivity handling worked before implementation? Please revise the Plan document to address this gap specifically."

David is initially disappointed. He reads the comment again. He understands what is missing. He revises the Approach Plan to add a specific testing methodology for the connectivity scenario.

He resubmits.

---

**Phase 8: Second Decision**

He receives: VERIFIED.

His portfolio page updates. The entry shows: project title, Agriculture track, AI_BRIEF type, verification date, lecturer name and affiliation, peer score, skills demonstrated, and links to all three documents.

A shareable URL is generated. He puts it in his CV. An employer who clicks the link can read his Reflection document. They can see that a named lecturer at a named institution reviewed his work and found it meets the standard.

**What his portfolio entry shows an employer**:

That he built a project under a defined brief. That a peer reviewer and a verified lecturer reviewed his structured process documentation. That the reviewer assessed his ability to analyse a problem, plan work, execute, and reflect on what he built and what he didn't. That the documents he claims to have written are the ones that were reviewed — the hash proves it.

---

### Journey 5: A Lecturer Reviews a Submission

**Person**: Dr. Wachira. Lecturer in CS at a Kenyan university. Registered as a verified reviewer in the Agriculture and Health tracks.

**Starting state**: Has completed verification. Can now review submissions assigned to their tracks.

---

**Phase 1: Receiving an Assignment**

Dr. Wachira receives a notification: a submission in the Agriculture track is assigned for review. They open the review dashboard.

They see: the generated brief, all three student documents, a link to the code repository, and the peer score with peer commentary (peer gave 3.5/5 on reflection depth with commentary: "The reflection identifies what didn't work but does not explain why the student chose the approach that failed").

**What they do not see**: the student's name or institution until after the decision is made. This prevents bias.

---

**Phase 2: Review**

Dr. Wachira reads the brief first. They read the Problem Breakdown. They read the Approach Plan. They read the Reflection carefully — they agree with the peer reviewer's observation. The reflection describes a failed approach without explaining why it was chosen.

They open the code. The implementation is solid for what the brief required.

They make their decision: REVISION_REQUIRED. They write commentary: 72 words explaining specifically what the Reflection must address.

---

**Phase 3: Outcome**

The student receives the REVISION_REQUIRED notification with the commentary. Dr. Wachira's review is recorded in the audit log — their name, their decision, their commentary, the timestamp.

If the student resubmits, Dr. Wachira may or may not be assigned the second review (depends on queue assignment).

**Failure case: Reviewer conflict of interest**

If the student is a current student in Dr. Wachira's institution, the system should prevent assignment. If this is detected after assignment, the review must be reassigned. The system constraint is imperfect — it depends on institution affiliation data being current and accurate.

---

### Journey 6: An Employer Verifies a Portfolio Entry

**Person**: Hiring manager at a Nairobi fintech. Reviewing CVs for a junior developer role. A candidate listed a UmojaHub verified portfolio entry.

**Starting state**: Has not used UmojaHub before. The candidate included a URL in their CV.

---

**Phase 1: Viewing the Portfolio**

The hiring manager clicks the URL. They land on a public portfolio page — no registration required. They see:

- Project title and brief description
- Track: Agriculture
- Verification status: VERIFIED
- Verification date: [date]
- Reviewer: [lecturer name], [institution]
- Peer score: 3.8/5.0 (four dimensions listed)
- Skills: mobile development, offline-first architecture, data modeling

They see three expandable documents: Problem Breakdown, Approach Plan, Final Reflection. They click Reflection.

They read it. They notice: the student documented a technical failure honestly. They explained why the approach failed. They explained what they would do differently. They proposed a proper solution they did not have time to implement.

**What the hiring manager thinks**: This student thinks about their work after they finish it. That is unusual.

---

**Phase 2: Verification**

They want to confirm the portfolio entry is authentic. They note the document hash displayed on the page.

They download the Reflection document. They run a SHA-256 hash on the downloaded file. The hash matches the hash displayed on the portfolio page. The document they read is the same document that was reviewed.

They look up the reviewer's name. The reviewer is listed as a lecturer at [institution] with verified credentials.

**Decision**: Schedule an interview.

---

**Failure case: Employer does not know what VERIFIED means**

An employer views a VERIFIED portfolio entry and assumes it means the student is ready for a senior role. They make hiring decisions based on overestimated capability.

This failure mode is an education problem, not a platform problem. The portfolio page should disclose clearly what VERIFIED means and does not mean. The employer who reads the disclosure will not make this error.
