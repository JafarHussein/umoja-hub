# Information Architecture Gap Report
**Date**: 2026-06-01
**Prepared by**: Principal Information Architect
**Scope**: All eleven audience pages + homepage + cross-cutting pages
**Method**: Gap analysis against WEBSITE_INFORMATION_ARCHITECTURE.md, FOOD_HUB_ECOSYSTEM_MAP.md, EDUCATION_HUB_ECOSYSTEM_MAP.md, TRANSPARENCY_CONTENT_ARCHITECTURE.md, USER_JOURNEY_LIBRARY.md, STATUS_QUO_ANALYSIS.md, and the existing /for/farmers page.

**The standard applied**: After reading any page, can the visitor answer these questions without going elsewhere? If no, there is a gap.

---

## HOW TO READ THIS REPORT

Each audience section has six categories:

- **[E] Ecosystem Explanations** — What the visitor still doesn't understand about the environment they operate in
- **[T] Transparency Content** — What the platform has not yet disclosed about its own mechanics, assumptions, and failure modes
- **[D] System Diagrams** — Visual explanations specified with title, purpose, information shown, and diagram type
- **[J] Human Journeys** — Journeys missing or underspecified, with scenario descriptions
- **[A] Alternative Analysis** — Existing alternatives that need structural analysis on the page
- **[K] Missing Knowledge Inventory** — Questions the visitor may still have after reading, with priority level

**Priority levels for [K]**: HIGH = visitor cannot confidently use the platform without this, MEDIUM = significant gap that reduces trust, LOW = informational gap that improves understanding.

---

## ASSESSMENT OF THE EXISTING FARMERS PAGE

The farmers page is a strong foundation. It correctly establishes the problem, covers the workflow completely, discloses limitations honestly, and avoids aspirational language. The Wanjiku scenario is effective.

**What it does well:**
- The problem section correctly identifies three structural failures (price opacity, unportable reputation, geographic reach)
- The workflow is complete and includes the critical "wait for PAID before dispatching" guidance
- Limitations are disclosed before the FAQ, not buried
- Misconceptions are corrected directly without defensiveness
- The Trust Score explanation is specific and numerical

**What it still leaves unanswered:**
The page explains what the platform does. It does not yet explain why the system that existed before the platform was structured the way it was, why that structure persists, or what the platform cannot address even when it is working correctly. This is the primary gap.

---

## AUDIENCE 1 — FARMERS

### [E] Ecosystem Explanations — Gaps

**The broker system: why it exists, not just how it extracts margin**

The page correctly identifies that brokers have information the farmer doesn't. It does not explain WHY this structure is difficult to displace. Four structural reasons:

1. **Capital access**: Brokers pay immediately, often in cash. UmojaHub requires a buyer to initiate an M-Pesa payment — the farmer waits for demand, then waits for payment confirmation. A broker who visits the farm and pays on the spot eliminates this uncertainty. For a farmer who needs school fees paid next week, immediacy has real value that the platform cannot replicate.

2. **Logistics**: Brokers provide transport. The platform does not. A farmer without a truck or an established transport relationship still has to solve the logistics problem independently. This cost is real and often absorbed into the broker's margin invisibly.

3. **Cold chain**: Brokers have storage and cold chain access. A farmer who lists produce on the platform and receives no orders within three days faces spoilage without a broker as fallback. The platform does not solve the spoilage risk — it assumes a buyer will come before the produce deteriorates.

4. **Market relationship capital**: Brokers have years of established relationships with Nairobi wholesale market buyers, hotel procurement officers, and restaurant kitchens. A new farmer on the platform is competing against farmers who have transaction histories, not against brokers with relationship capital.

This should be on the page because: a farmer who understands why the broker system persists will understand why the platform solves only some of their problems, not all of them. A farmer who expects the platform to replace all broker functions will be disappointed when logistics, cold chain, and capital timing remain their problem.

**Why cooperatives don't fully solve the problem**

The platform includes a cooperative group feature. The page does not explain why existing cooperatives without the platform don't solve the core problems. Three reasons:

1. **Individual reputation is not portable**: A farmer who leaves a cooperative (or whose cooperative is dissolved) takes no reputation with them. The cooperative's brand is the trust signal, not the individual farmer. On UmojaHub, the Trust Score is individual and persists regardless of group membership.

2. **Geographic catchment**: Agricultural cooperatives are geographically bounded by design — they aggregate farmers in a specific area. A farmer outside the catchment cannot join. UmojaHub has no geographic restriction on joining.

3. **Governance opacity**: Cooperative governance varies significantly. A member farmer may not know what price the cooperative ultimately sold their produce for, what margins were applied, or what administrative costs were deducted. UmojaHub shows the buyer's payment directly to the farmer.

**Why WhatsApp groups fail specifically at scale**

The page mentions that the platform provides "nationwide" access. It does not explain why the existing nationwide channel — WhatsApp agricultural groups — fails the farmer. The specific failure: informal reputation does not transfer across group boundaries and degrades as groups grow. A farmer known and trusted by 50 members is unknown and untrusted by the 451st member who joins. UmojaHub's verification and Trust Score create reputation that is independent of social network membership.

**The seasonal demand structure**

The page implies buyer demand is relatively uniform. It is not. Demand for specific crops fluctuates significantly by season and by event (Ramadan, school calendar, Christmas). The page does not explain what a farmer should expect during low-demand periods for their crop, or how to use Price Intelligence to anticipate demand cycles. A farmer who lists kale in a month when kale supply significantly exceeds demand will face a long wait regardless of their Trust Score.

---

### [T] Transparency Content — Gaps

**Payment escrow: who holds the money and for how long**

The page says "payment is held by the platform" after STK Push confirmation. It does not say: held by whom, in what form, under what legal arrangement, for how long, and what happens to it if the platform goes offline during the holding period. This is the most significant transparency gap on the farmers page. A farmer who asks "if UmojaHub closes tomorrow, where is my KES 1,200 from the order I dispatched yesterday?" cannot answer this question from the page.

**What administrator review does and does not involve**

The page says administrators review documents and confirm they are "consistent and plausible." It does not explain what this means in practice. Specifically:

- Administrators **cannot** verify land ownership through government land registries. They review the document submitted — they cannot cross-check against the official land register.
- Administrators **cannot** detect sophisticated document forgeries. They can identify obvious issues (wrong name, expired document, clearly blurry photograph) but are not forensic document examiners.
- Administrators **can** compare the name on the identity document with the name on the farmer's account registration.
- The verification confirmation is "this document appears consistent with this claim" — not "this person's identity has been officially verified."

This matters for farmers because it sets accurate expectations about what verification means. It also matters for buyers (who rely on verification to inform their trust decisions).

**Cooperative group payment coordination: the current implementation**

The WEBSITE_INFORMATION_ARCHITECTURE.md states explicitly: "The group ordering process coordinates between the platform and the supplier outside the platform's payment system in the current implementation." This is never mentioned on the farmers page. A farmer who joins a cooperative group expecting a fully automated bulk ordering and payment system will discover that the payment coordination process is currently manual. This needs to be disclosed.

**The AI Farm Assistant's memory limitation**

The FAQ includes "Each session starts from zero." This belongs in a transparency section, not only in the FAQ. A farmer who uses the Farm Assistant to track a pest problem across three weeks of conversations will find that the assistant has no memory of previous conversations. They must re-explain the context each time. This limitation is significant enough to disclose prominently.

**What happens when Price Intelligence shows your price is above market**

The page explains what Price Intelligence is. It does not explain what it means if a farmer's listing is priced above what comparable listings show. Specifically: does the platform downrank listings priced significantly above comparable listings? Does the platform notify the farmer? The page implies Price Intelligence is purely informational — but if the platform does anything automated with the price comparison, this should be disclosed.

**The dispute resolution ceiling**

The limitations section correctly states that the platform has no financial remediation for quality shortfalls. What it does not explain is what "report it to administrators" actually results in. Can the platform force a refund? (Evidently not.) Can the platform suspend the farmer? (Yes, for repeated violations.) Does the platform have any dispute resolution process beyond "rate and report"? This needs to be stated directly.

---

### [D] System Diagrams — Specifications

**Diagram 1: Why the Intermediary System Persists**
- Title: "The agricultural intermediary ecosystem before UmojaHub"
- Purpose: Show that brokers solve real problems for farmers (capital, logistics, cold chain) and that those problems don't disappear when the platform is adopted
- Information shown: Farmer → broker (cash now, no logistics required); broker → market (information advantage, relationship capital); what the farmer does not see (end-market price); what problems the platform solves (information, payment, reputation) vs. what it doesn't (logistics, cold chain, capital timing)
- Type: Ecosystem map, split into "what the broker system provides" vs. "what UmojaHub addresses"

**Diagram 2: Farmer Verification Flow**
- Title: "From document upload to verified listing"
- Purpose: Show the farmer exactly what happens at each stage and what they need to do
- Information shown: Upload → PENDING → Admin receives in queue → Admin reviews (consistency check, not fraud detection) → APPROVED/REJECTED → SMS → if rejected: correctable, resubmit → if approved: Trust Score initialized at 40, listing enabled
- Type: Sequential process diagram, two paths (approved / rejected with loop)

**Diagram 3: M-Pesa Payment Flow — Farmer Perspective**
- Title: "What happens between 'buyer places order' and 'payment arrives in your M-Pesa'"
- Purpose: Show the farmer every step in the payment process, including who does what, what is automatic, and when they receive each notification
- Information shown: Order placed (PENDING) → platform initiates STK Push → buyer's phone receives prompt → buyer enters PIN → Safaricom confirms → callback to UmojaHub → order updates to PAID → SMS fires to farmer → payment held during fulfillment → buyer marks received → payment releases to farmer's M-Pesa
- Type: Sequential flow diagram with actor lanes (Farmer / Buyer / Safaricom / Platform)

**Diagram 4: Trust Score Architecture**
- Title: "How your Trust Score is calculated"
- Purpose: Show the four components visually with their maximum contributions
- Information shown: Four component blocks (Verification 40, Transactions 25, Ratings 20, Reliability 15), composite total to 100, tier assignment from composite (0–39 NEW, 40–59 ESTABLISHED, 60–79 TRUSTED, 80–100 PREMIUM), indicators of which components require admin action vs. which are behavior-driven
- Type: Component diagram with score bar visualization

**Diagram 5: Price Intelligence Data Flow**
- Title: "What Price Intelligence shows and where the data comes from"
- Purpose: Prevent the misconception that Price Intelligence shows confirmed sale prices or official market rates
- Information shown: Source (active listings on UmojaHub by other farmers) → what it reflects (asking prices, not confirmed sale prices) → what the farmer sees (their crop's listing price range in their county and neighboring counties) → what it does not show (broker buy prices, retail prices, confirmed transaction prices)
- Type: Data flow diagram from source to farmer display

---

### [J] Human Journeys — Missing

**Journey: Failed Verification — Document Rejection and Resubmission**

Starting state: Farmer has registered and submitted documents. Documents are in PENDING review.
What happens: Administrator reviews. The land documentation is a lease agreement that names the landowner, not the farmer. Farmer's name does not appear as occupant. Rejection reason: "Land document does not name you as the occupant or tenant. Please resubmit with a tenancy letter signed by the landowner that specifically names you."
Farmer receives SMS. Reads rejection in dashboard. Contacts landowner. Obtains signed tenancy letter. Photographs the letter. Resubmits all three documents. Returns to PENDING. Admin reviews resubmission. Approves.
What the farmer learns: Rejection is specific and correctable. There is no penalty. The second review is the same process as the first.
What the farmer does not expect: The second review also takes 24–48 hours. There is no priority lane for resubmissions.

**Journey: Abandoned — No Orders Arrive**

Starting state: Farmer registers, verifies, creates listing for an agricultural product with weak demand in their county.
What happens: Listing is live. Fourteen days pass. No orders arrive. The farmer sees other listings in their county for the same crop. Some have 20 completed orders. Most have zero.
The farmer does not understand why: Their price is comparable. Their Trust Score (NEW, 40 points) is correct for a newly verified farmer. The issue is demand — buyers for this specific crop in this specific county are infrequent.
The farmer deactivates their listing. Returns to selling through traders.
What this journey reveals: The platform cannot guarantee orders. This is stated in the limitations section. But the journey reveals an understanding gap: farmers need to understand the demand side — what buyers actually search for, which crops have active buyer demand in their county, and what a realistic timeline for first orders looks like for NEW tier farmers.

**Journey: STK Push Failure — Buyer Does Not Complete Payment**

Starting state: Farmer receives SMS. New order, 30 kg of tomatoes. Status: PENDING.
What happens: The farmer waits. No PAID notification arrives. The STK Push expired on the buyer's phone — they saw the prompt but were in a meeting and missed it. The order remains PENDING for the platform-defined timeout period. The order automatically cancels. The farmer's listing quantity is restored.
The farmer's question: Did I do something wrong? Will this happen often?
What they need to understand: PENDING orders that don't convert to PAID are a normal occurrence. The farmer loses nothing. No produce was prepared (the page correctly instructs: wait for PAID). The only cost is the wait.

**Journey: Quality Dispute — Wrong Quantity Delivered**

Starting state: Farmer has TRUSTED tier. Receives order for 80 kg of sweet potatoes. Dispatches. Buyer receives, marks RECEIVED. Payment releases. Buyer leaves 2-star rating with comment: "Received only 60 kg, not the 80 kg paid for. No explanation."
What happens to the farmer: Buyer rating of 2 contributes to the ratings component. Reliability component is not directly affected (the order was technically fulfilled — produce was dispatched and received). The Trust Score declines modestly.
The farmer's perspective: They believe they dispatched 80 kg. They have no way to verify. The buyer has already received payment release. The platform has no mechanism to adjudicate quantity claims.
What the farmer can do: Contact the buyer directly. Leave a response (if the platform allows). Report the rating if they believe it violates platform terms.
What the farmer cannot do: Compel a refund reversal. Remove the rating without administrator review. Prevent the Trust Score impact.
What this journey reveals: The rating system is the accountability mechanism. It penalizes the farmer if the buyer's claim is accurate and also penalizes them if the buyer's claim is inaccurate and uncontested. This is disclosed in the limitations section but needs to be reinforced in a journey.

**Journey: Cooperative Group Bulk Order**

Starting state: Farmer with five neighbors forms a cooperative group. They want to bulk-purchase fertilizer from a KEBS-certified supplier.
What happens: Group is created on platform. Members are invited and join. Group nominates a supplier from the verified directory. Order specification is created (product, total quantity, per-member contribution). The payment coordination process is not automated through the platform — it currently requires the group to coordinate payment separately and the order to be manually confirmed with the supplier through the administrator.
The farmer's expectation vs. reality: Farmers expect the bulk ordering process to work like the marketplace — initiate order, complete M-Pesa payment, receive confirmation. The current implementation does not work this way for group orders. The gap between expectation and reality is significant and should be disclosed before the farmer forms a group.

---

### [A] Alternative Analysis — Gaps

The farmers page identifies the problem but does not systematically explain why existing alternatives fail. The page needs these comparisons:

**What farmers currently do (alternatives):**
1. Sell through road traders and brokers (dominant)
2. Transport to local market directly (significant cost/time/spoilage risk)
3. WhatsApp and Facebook group sales (growing but trust-limited)
4. Agricultural cooperative-mediated sales (where cooperatives exist)

**Why each fails:**
- Brokers: information asymmetry is structural, not incidental. The broker's business model requires the farmer not knowing the end-market price. This is not a fixable information problem — it is the broker's competitive advantage.
- Local market: geographic constraint cannot be overcome by attending the market more often. The buyers who come to Kiambu market define the demand ceiling. No amount of market attendance reaches a Nairobi restaurant buyer who doesn't go to Kiambu.
- WhatsApp groups: trust formation is group-membership-specific. It does not transfer. A farmer known in one group is unknown in the next.
- Cooperatives: well-managed cooperatives solve some problems. But individual reputation is not portable — it stays with the cooperative. The farmer's track record on UmojaHub is theirs.

**What UmojaHub does not solve from the above:**
- Logistics: still the farmer's problem
- Cold chain access: still the farmer's problem
- Capital timing: buyers pay after STK Push, not immediately on farm-gate delivery
- Agronomic knowledge: Farm Assistant provides general guidance only

---

### [K] Missing Knowledge Inventory — Farmers

| Question | Why It Matters | Where It Should Be Answered | Priority |
|---|---|---|---|
| Who holds my payment between STK Push confirmation and buyer receipt confirmation? | Farmer needs to understand the escrow arrangement before trusting the payment system | Limitations section or dedicated payment transparency section | HIGH |
| What happens to my escrow payment if UmojaHub goes offline mid-order? | Farmer needs to know their money is protected outside the platform's operational continuity | Limitations section | HIGH |
| How does the cooperative group bulk order payment work in practice? | The current implementation is not what farmers expect from the rest of the platform | Cooperative Groups section (separate) | HIGH |
| What does administrator review actually check? Can they detect a forged document? | Farmer needs to understand verification is a consistency check, not fraud forensics | Verification section | HIGH |
| Can I sell livestock through the platform? | Many Kenyan smallholders keep livestock alongside crops | FAQ | MEDIUM |
| What is the minimum viable farm size to use the platform? | A subsistence farmer with 0.1 acres may not benefit from the marketplace | FAQ or eligibility note | MEDIUM |
| Can a buyer contact me before placing an order, before payment? | Farmers may want pre-sale communication, especially for large orders | FAQ | MEDIUM |
| What happens if I delete my account — does my Trust Score disappear? | Data portability and account permanence question | FAQ | MEDIUM |
| How does the Price Intelligence data update? Is it real-time or weekly? | Affects how farmers use the tool for pricing decisions | Price Intelligence section | MEDIUM |
| What crops are eligible for Price Intelligence benchmarks? | 10 crops are covered but what if I grow a crop outside the benchmarked list? | Price Intelligence section | MEDIUM |
| Can I list produce before harvest (future availability)? | Helps farmers manage pre-orders and production planning | FAQ | LOW |
| What happens to my listing if a buyer orders more than what's available? | Inventory management edge case | FAQ | LOW |
| Does the platform notify me when a competing farmer lists the same crop in my county at a lower price? | Market intelligence feature question | FAQ | LOW |
| Can I communicate with a buyer about order modifications after payment? | Post-payment communication channel | FAQ | LOW |
| What is the platform's suspension appeal process? | Account fairness question | Responsibilities section or FAQ | MEDIUM |

---

## AUDIENCE 2 — BUYERS

No page exists yet. The entire understanding of this audience is unbuilt.

### [E] Ecosystem Explanations — Required

**Why direct produce sourcing is structurally difficult without platforms**

The buyer audience — households, restaurants, hotels, schools, hospitals — currently sources produce through physical markets, supermarkets, or broker networks. The specific failures from the buyer's perspective:

- Physical markets require physical presence. A hotel procurement officer sourcing from Nairobi's City Market sees whatever is available that day at whatever price the seller offers. There is no searchable directory of what will be available tomorrow, from whom, and at what price.
- Supermarket supply chains add multiple handling layers, each of which adds cost and removes farm-to-buyer traceability. A buyer who wants to know where their produce came from cannot find out.
- Broker-supplied produce has no identity attached. The buyer knows the broker. They do not know the farmer.

**Why farmer reliability is difficult to verify without a platform**

A buyer who has purchased from an unknown farmer once has no systematic way to know if that farmer will be reliable on the next order. They must rely on: (a) their own previous experience; (b) a social introduction; or (c) a visible track record. Without a Trust Score, only the first two are available. The page needs to explain this verification problem from the buyer's perspective.

**The M-Pesa STK Push ecosystem — why it matters to know how it works**

Many buyers will have used M-Pesa STK Push for other services. But many will have questions about what happens when they press the buy button. The page needs to explain what STK Push is, why it is secure (PIN entry on their device, not on the platform), and what it means that UmojaHub never receives their M-Pesa credentials.

---

### [T] Transparency Content — Required

**What "verified" means to a buyer — and what it doesn't**

A buyer sees a "Verified" badge on a listing. They need to understand exactly what was verified: the farmer's identity documents and land documentation. Not verified: the quality of the produce in the current listing, whether the quantity stated is actually available, whether the produce in the photograph matches what will be dispatched, or whether the farmer's farming practices are sustainable.

**What happens if the farmer does not dispatch after payment**

This is the highest-risk scenario for buyers and it is currently underspecified everywhere. What happens: payment is confirmed by Safaricom. Order status is PAID. The farmer does not dispatch. The buyer waits. The buyer does not know when to escalate. The platform does not auto-detect non-dispatch in real time — it detects it through the absence of a DISPATCHED status update past the fulfillment window.

The buyer needs to know: what action they can take, when they can take it, what the platform will do, and what they will not be able to recover (there is no automatic refund mechanism for non-dispatch beyond administrator intervention).

**There is no financial remediation for quality shortfalls**

This must be stated clearly and early. A buyer who receives underweight or poor-quality produce has one recourse: a rating with explanation. The platform does not provide refunds. The Trust Score penalizes the farmer, which helps future buyers. It does not compensate the current buyer. This is the most significant limitation for buyers and it must appear prominently, not only in an FAQ answer.

**What data about the buyer is shared with the farmer**

The buyer needs to know: after they place an order, what does the farmer see about them? (Name, phone number, delivery address.) Before they place an order, what can the farmer see? (Nothing — buyers are anonymous to farmers until an order is placed.)

**The auto-completion window**

The page should state the specific time window after which the system auto-completes an order if the buyer hasn't marked it received. This is a material fact for buyers who travel frequently or who receive produce and forget to mark it. If the auto-complete fires, payment releases to the farmer. The buyer cannot then dispute receipt.

---

### [D] System Diagrams — Required

**Diagram 1: M-Pesa STK Push — What the Buyer Experiences**
- Title: "From 'place order' to 'payment confirmed' — what you do and what you see"
- Purpose: Show the buyer each step in the payment process from their phone's perspective
- Information shown: Click buy → quantity confirmed → platform sends STK Push → phone receives Safaricom prompt → buyer enters PIN on their device (not on the platform) → Safaricom processes → confirmation appears → order status updates → SMS confirmation
- Type: Sequential flow diagram showing phone screen states and platform state changes in parallel

**Diagram 2: Listing Anatomy — What Every Element Means**
- Title: "Reading a marketplace listing"
- Purpose: Help buyers interpret every element of a listing before placing an order
- Information shown: Annotated listing card showing: crop name, quantity, price, harvest date, pickup county, farmer name, verified badge (what it means), Trust Tier label (what each tier means), completed order count, average rating
- Type: Annotated screenshot or illustrated listing diagram

**Diagram 3: Trust Tier Buyer Decision Guide**
- Title: "What each trust tier means for your purchasing decision"
- Purpose: Help buyers understand what they are actually reading when they see NEW/ESTABLISHED/TRUSTED/PREMIUM
- Information shown: NEW (verified identity, no transaction history — you're taking a first-order risk), ESTABLISHED (some transaction history, limited rating data), TRUSTED (substantial history, consistent positive ratings — strong signal), PREMIUM (extensive history, high ratings, high reliability — platform's strongest signal); and explicitly: tier is not a guarantee of individual transaction quality
- Type: Tier progression diagram with plain-language interpretation for each

**Diagram 4: What Happens When Produce Doesn't Match**
- Title: "Your recourse when an order doesn't match the listing"
- Purpose: Set accurate expectations for buyers about the dispute process before they place an order
- Information shown: Receive order → order doesn't match listing → options available (rate with explanation, report to admin) → what happens to farmer (Trust Score impact) → what buyer recovers (nothing financial, future buyers benefit from accurate rating)
- Type: Decision tree or process diagram

---

### [J] Human Journeys — Required

**Journey: First-time Buyer — Complete Path**

Starting state: Restaurant procurement manager who sources produce through a wholesale market. Learns about UmojaHub from a colleague.
What they need to know: Whether the prices are competitive, whether the produce quality is reliable, how the payment works, and what happens if something goes wrong.
Path: Browses marketplace without registering (sees listings, Trust Scores, prices). Compares a TRUSTED farmer's tomato listing to what they pay at the market. Price is similar. Registers. Completes M-Pesa payment on first order. Receives produce. Marks received. Leaves rating.
What they discover: The M-Pesa process was easier than expected. The produce arrived correctly. The farmer's Trust Score matches the reliability they experienced.
What they note: They had to mark the order received in the app — they didn't know this was required. Payment released automatically after that.

**Journey: Failed STK Push — What Happens**

Starting state: Buyer has placed an order and expects to pay.
What happens: STK Push arrives on phone. Buyer is in a meeting, doesn't see it. Push expires after three minutes. Order remains PENDING. Buyer checks later and doesn't understand why the order hasn't processed.
Buyer opens the app. Sees PENDING. Initiates retry (if the platform allows). New STK Push sent. Buyer enters PIN. Payment confirmed.
What the buyer needed to understand beforehand: They need to be ready to respond to their phone within minutes of clicking buy. The payment prompt expires. If they miss it, they need to retry.

**Journey: James — Produce Doesn't Match Listing** *(adapted from USER_JOURNEY_LIBRARY.md)*

Starting state: Buyer orders 50 kg of tomatoes from a TRUSTED farmer. Pays KES 1,750.
What happens: Produce arrives. Only 40 kg in the crate. No explanation from farmer.
Buyer's options: Mark received (which releases payment), then rate with the shortfall noted. Or not mark received (but auto-completion will eventually fire regardless). The buyer has no mechanism to block payment release pending a dispute.
Buyer marks received. Rates 2 stars. Writes: "Received 40 kg, not the 50 kg ordered. No explanation from farmer. Lost KES 350 in produce that was not delivered."
What changes: The farmer's ratings component declines. Other buyers who read the rating see a specific, factual complaint from a named order.
What doesn't change: The buyer does not receive KES 350 back. The platform has no mechanism for this.
What the buyer learns: The Trust Score reduces the risk of this happening. It does not eliminate the risk. And when it happens, the recourse is public accountability, not financial remediation.

**Journey: Farmer Doesn't Dispatch After Payment**

Starting state: Buyer has paid for an order. Order status is PAID. Three days pass with no DISPATCHED update from the farmer.
Buyer escalates: Reports the issue to platform support. Administrator reviews the case. Administrator contacts the farmer.
What happens in the best case: Farmer explains a logistics delay. Dispatch occurs on day 4.
What happens in the worst case: Farmer cannot be reached. Administrator investigates. If farmer is found to be non-responsive, the case is flagged.
What the buyer cannot guarantee: A refund. The platform's refund mechanism for confirmed-payment non-dispatch is not automated and requires administrator intervention.
What the buyer learns: Payment escrow does not protect against non-dispatch automatically. Administrator escalation is the recourse. Outcome is not guaranteed.

---

### [A] Alternative Analysis — Required

**Why buyers currently source the way they do**

| Alternative | What it provides | Where it fails |
|---|---|---|
| Physical market (City Market, Wakulima) | Known location, immediate purchase, price negotiation possible | Geographic constraint, no pre-market price discovery, no farmer identity verification, quality uncertainty for some crops, time cost of physical presence |
| Supermarket wholesale | Convenience, consistency, invoicing for businesses | Premium price for handling and markup, no direct farmer relationship, no farm-to-buyer traceability |
| Broker supply | Established relationship, delivery coordination | Buyer pays for broker margin without visibility into what the broker pays the farmer, no underlying farmer identity |
| Personal farmer relationships | Trust established over time, price possibly better | Requires social introduction, geographically limited, one farmer cannot always meet supply needs |
| WhatsApp group purchasing | Some price transparency | No verification of any party, ephemeral reputation, fraud risk at scale |

**What UmojaHub addresses from the buyer's perspective:**
- Searchable directory of available produce from farmers whose identity has been reviewed
- Trust Score that reflects actual transaction history (not just a claimed history)
- M-Pesa payment that neither party has to handle as cash or trust transfer

**What UmojaHub does not address:**
- Logistics and delivery (farmer's responsibility)
- Produce quality guarantee (rating system penalizes retroactively, doesn't guarantee prospectively)
- Financial remediation when things go wrong

---

### [K] Missing Knowledge Inventory — Buyers

| Question | Why It Matters | Where It Should Be Answered | Priority |
|---|---|---|---|
| What if I receive produce I'm not satisfied with — can I get my money back? | Most important trust question for any buyer | Prominently in limitations, before the FAQ | HIGH |
| What happens if the farmer doesn't dispatch after I've paid? | Second most important trust question | Prominent in workflow section, not only in FAQ | HIGH |
| What does "Verified" on a listing actually mean was checked? | Buyers may assume quality was verified, not just identity | Early in the page, before workflow | HIGH |
| What does the auto-completion window mean — when does payment release without my action? | Buyer may not know to mark received, causing unintended auto-completion | Workflow section | HIGH |
| Can I get a refund if my M-Pesa payment goes through but no order is confirmed? | Rare but high-concern scenario | FAQ | HIGH |
| What data does the farmer see about me? | Privacy concern for buyers who don't want their phone number or address known | Transparency section | MEDIUM |
| Can I order from multiple farmers in a single checkout? | Practical purchasing question for bulk buyers | FAQ | MEDIUM |
| Is there a minimum or maximum order size? | Practical constraint | FAQ | MEDIUM |
| Can I schedule recurring orders from the same farmer? | Restaurant/hotel procurement question | FAQ | MEDIUM |
| Can I contact a farmer before placing an order? | Pre-purchase communication | FAQ | MEDIUM |
| What if my M-Pesa balance is insufficient when the STK Push arrives? | Common failure scenario | FAQ | MEDIUM |
| How do I know if produce is fresh? Can I see harvest date? | Quality signal question | Visual diagram of listing elements | LOW |
| Can I filter for specific Trust Tiers — exclude NEW farmers? | Practical marketplace filter question | Marketplace filtering section | LOW |
| What is a buyer's responsibility to rate? | Reciprocal trust system participation | Responsibilities section | LOW |

---

## AUDIENCE 3 — SUPPLIERS

No page exists yet.

### [E] Ecosystem Explanations — Required

**Why agricultural input supply to smallholders is fragmented**

Smallholder farmers individually cannot access bulk-rate pricing for seeds, fertilizers, and pesticides. Suppliers price for volume. A single farmer buying 50 kg of fertilizer pays retail. A cooperative of 30 farmers buying 1,500 kg pays significantly less per unit. The page needs to explain this economics of scale before explaining how the platform addresses it.

**Why supplier credibility is difficult for farmers to assess**

A farmer buying seeds from an unverified vendor faces real risk: counterfeit seeds, unlicensed pesticides, KEBS non-compliant fertilizers. The regulatory certification landscape (KEBS, PCPB, KEPHIS) exists because this risk is real. The page needs to explain what these certifications mean and why their verification matters.

### [T] Transparency Content — Required

**That suppliers are added by administrators, not self-registered**

This is a defining characteristic of the supplier directory. It must be stated prominently: suppliers cannot add themselves to the directory. They apply and are reviewed by platform administrators. This means: the number of suppliers in the directory is bounded by administrator capacity to verify them; and a supplier who is not yet in the directory has no self-service path to joining.

**That group order payment coordination is currently outside the platform payment system**

The most significant transparency gap for suppliers: cooperative group orders do not currently flow through the M-Pesa payment system the way individual marketplace orders do. Payment coordination for group orders is manual. This is a current implementation limitation that directly affects suppliers' expectations about the ordering process.

**Which regulatory credentials are checked and how**

The page should state: the administrator reviews the credential documents submitted by the supplier. They do not independently verify these credentials with the issuing regulatory body (KEBS, PCPB, KEPHIS) unless the platform has a formal data-sharing arrangement. The verification is a document consistency check, not a real-time registry query.

### [K] Missing Knowledge Inventory — Suppliers

| Question | Why It Matters | Where | Priority |
|---|---|---|---|
| How do we apply to be listed in the directory? | Primary action question for a supplier visiting the page | Contact/application section | HIGH |
| What credentials do we need to provide? | Enables supplier to prepare before applying | Requirements section | HIGH |
| How long does the verification process take? | Planning question | Verification process section | HIGH |
| Can we update our directory listing after it's live? | Ongoing operations question | FAQ | MEDIUM |
| What is the minimum group order size required to trigger a cooperative bulk order? | Supplier needs to know when orders will arrive | Cooperative ordering section | MEDIUM |
| What information appears in our listing? | Supplier needs to know what buyers will see | Listing anatomy section | MEDIUM |
| Can we be removed from the directory and for what reasons? | Compliance and risk question | Responsibilities section | MEDIUM |

---

## AUDIENCE 4 — STUDENTS

No page exists yet.

### [E] Ecosystem Explanations — Required

**Why CVs are structurally insufficient — the self-assertion problem**

Every claim in a CV is made by the person who benefits from that claim. There is no independent review. Employers have learned to discount CV claims because they have no verification mechanism. The discount is larger for students from smaller institutions whose institutional signal doesn't partially substitute for individual evidence. The page needs to open with this structural problem stated precisely, not as "you need a better portfolio" but as "the mechanism by which employers evaluate practical capability is broken and here is exactly how it breaks."

**The AI code generation crisis — why GitHub portfolios have degraded**

This is the most pressing current ecosystem explanation need. AI code generation (GPT-4, Claude, Gemini) now produces code that passes cursory technical review. A student whose GitHub portfolio was entirely AI-generated is visually indistinguishable from one who wrote everything themselves — unless the reviewer goes deep into understanding the code, which hiring managers generally cannot do at scale for every candidate. The result: GitHub portfolios have become significantly less trustworthy as evidence of individual capability. This makes documentation of reasoning — which AI cannot fake in the same way — more valuable than it was three years ago. The Education Hub's emphasis on Breakdown, Plan, and Reflection documents is a direct response to this crisis, and the page should say so.

**The institutional signaling problem — why it structurally disadvantages certain students**

A degree from Strathmore University provides an institutional signal in addition to the individual student's evidence. The institution's selectivity and reputation partly substitute for portfolio evidence in employer evaluation. A degree from a smaller regional university provides only the individual signal, which is insufficient on its own. Students from smaller institutions who are genuinely more capable than students from well-known institutions compete at a structural disadvantage because the mechanism that should differentiate capability (the actual work) is invisible to employers. UmojaHub's portfolio system is portable and institution-independent — a VERIFIED decision from a named, credentials-confirmed lecturer carries weight regardless of which institution the student attends.

**Why peer review exists — the quality gate argument**

Students need to understand why peer review is mandatory, not ceremonial. Without it, every submission goes directly to the lecturer queue. A lecturer reviewing 30 submissions without a quality gate spends disproportionate time on work that fails basic coherence and documentation standards. The peer review gate raises the floor. Additionally — and this is the part students often miss — completing a peer review is one of the most effective ways to improve their own next submission. The rubric they apply to another student's Reflection document teaches them what a strong Reflection looks like in a way that abstract guidance does not.

**Why the Reflection document is the most significant indicator**

Students typically invest most energy in the Breakdown and Plan documents because those feel more technical. The Reflection is often written quickly at the end. This is exactly backwards from the reviewer's perspective. The Reflection reveals what the student actually learned — whether they can honestly assess their own limitations, whether they understand what went wrong and why, and whether they have the professional maturity to document failure alongside success. A polished Breakdown with a superficial Reflection is a weaker submission than a modest Breakdown with a deeply honest Reflection.

---

### [T] Transparency Content — Required

**What VERIFIED means and what it explicitly does not mean**

This is the most important transparency section on the students page. VERIFIED means: a named, credentials-confirmed reviewer assessed all three documents and the code against a defined rubric and determined the submission met the documented standard. VERIFIED does not mean:

- That you will be hired for any specific role
- That your code is production-ready
- That your claims within the documents are accurate (the hash proves the documents weren't changed after submission, not that they're honest)
- That the platform endorses your work product
- That the reviewer found the submission exceptional — VERIFIED means it met the standard, not that it exceeded it

**What the document hash proves and what it doesn't**

The SHA-256 hash created at submission proves that the documents currently in the portfolio are identical to the documents submitted at the time of review. It does not prove:

- That the student wrote the documents
- That the documents accurately describe work actually done
- That the code submitted was written by the student

An employer who uses the hash to verify a portfolio entry is confirming document integrity, not authorship.

**The REVISION_REQUIRED process — how many times can a student revise?**

The WEBSITE_INFORMATION_ARCHITECTURE.md identifies this as an open question. Until it is answered by the product team, the page should disclose: the maximum number of revisions permitted is [to be specified] and that this information is available in the platform's current terms. This is preferable to omitting the question entirely.

**Who the lecturer is and what they can see**

Students need to know: the lecturer assigned to their submission is not their own lecturer (conflict of interest prevention). They cannot request a specific reviewer. The reviewer sees: all three documents, the code/repository link, the peer review score and commentary, and the rubric. They do not see: the student's academic transcript, their grades, their institution's standing, or any other contextual information about the student beyond what the student has provided in their documents.

**What happens to DENIED submissions in the student's record**

DENIED submissions do not appear in the public portfolio. They are preserved in the platform's audit log (which administrators can see). The student can start a new project engagement. A DENIED decision does not preclude participation in future projects. The student's public profile does not indicate that a DENIED decision was issued — only VERIFIED projects appear.

**The peer review timeline reality**

The page should disclose that a student must complete their assigned peer review before their own submission advances to the lecturer queue. If a student submits and their peer review assignment is delayed or the assigned student fails to complete it, this affects the submitting student's timeline. The page should be honest that the review process's pace is not entirely within the submitting student's control.

---

### [D] System Diagrams — Specifications

**Diagram 1: Why the Current Portfolio Evidence System Fails**
- Title: "What existing portfolio tools show — and what they can't"
- Purpose: Establish why UmojaHub is necessary, not just useful
- Information shown: CV (self-asserted, no reviewer) → GitHub (shows output, not reasoning; AI-generated indistinguishable) → LinkedIn (marketing document, endorsements meaningless) → Degree (certifies attendance and exam performance, not practical capability) → each has an arrow pointing to the specific evidence gap it cannot address
- Type: Comparative analysis diagram (four columns, each showing the tool and its evidence gap)

**Diagram 2: The Evidence Chain**
- Title: "How a verified portfolio entry is created"
- Purpose: Show every step from brief to portfolio entry with the verification chain intact
- Information shown: Track selection → brief generation/assignment → three documents produced → code submitted → submission creates document hash (recorded in audit log) → peer review (four dimensions scored, locked before lecturer sees) → lecturer review (independent, informed by peer score) → VERIFIED/REVISION_REQUIRED/DENIED → if VERIFIED: portfolio entry published with hash, reviewer name, decision date
- Type: Sequential process diagram with branching paths at the lecturer decision

**Diagram 3: Three-Document Structure — What Each Demonstrates**
- Title: "The three documents and what they reveal about your thinking"
- Purpose: Help students understand what reviewers are looking for before they start writing
- Information shown: Problem Breakdown (demonstrates: problem decomposition, alternative approach analysis, risk identification — reveals: whether you understood the brief); Approach Plan (demonstrates: milestone structure, task decomposition, timeline reasoning — reveals: planning discipline before coding); Final Reflection (demonstrates: honest completion assessment, documented failures, stated learning, differential diagnosis of what would be done differently — reveals: professional maturity and self-assessment honesty)
- Type: Component diagram with three sections, each showing document purpose and what it reveals

**Diagram 4: AI Mentor — What It Does and Doesn't Do**
- Title: "The AI Mentor's role in your project"
- Purpose: Prevent the incorrect expectation that the Mentor will help write documents
- Information shown: Student asks question → Mentor asks a question in return (not an answer) → Student reasons through → Mentor asks deeper question → Student articulates understanding → Student writes their own document from their own reasoning. Contrast with: what the Mentor explicitly does not do (generate document text, provide answers to be copied, complete code sections)
- Type: Interaction sequence diagram showing the Socratic pattern

**Diagram 5: Peer Review + Lecturer Review Relationship**
- Title: "Two reviews, one decision"
- Purpose: Show how peer review feeds into lecturer review without determining it
- Information shown: Submission → peer assigned → peer scores four dimensions (1–5) + commentary → peer score locked → enters lecturer queue → lecturer sees submission + peer score + peer commentary → lecturer assesses independently → lecturer decision is final; arrow showing that peer score informs but does not determine lecturer judgment
- Type: Process flow diagram showing the sequence and the relationship between reviews

**Diagram 6: Review Decision Tree**
- Title: "What happens after you submit"
- Purpose: Show all possible outcomes including REVISION_REQUIRED loop and DENIED path
- Information shown: Submit → peer review → lecturer review → VERIFIED (permanent portfolio entry) → REVISION_REQUIRED (feedback returned, revision submitted, re-enters peer review) → DENIED (does not appear in portfolio, student may start new project)
- Type: Decision tree with three branching outcomes and their consequences

**Diagram 7: Portfolio Entry Anatomy**
- Title: "What appears in a verified portfolio entry"
- Purpose: Show students what their completed portfolio entry will look like before they start working
- Information shown: Project title, track (AI_BRIEF/OPEN_SOURCE), brief type, verification date, reviewer name and institutional affiliation, peer review score (four dimensions), skills demonstrated, all three document texts (visible in full), document hash, GitHub repository link
- Type: Annotated layout diagram of a portfolio entry

---

### [J] Human Journeys — Required

**Journey: David — Complete Successful Project (from USER_JOURNEY_LIBRARY.md)**

Starting state: Third-year CS student at Strathmore. Has built class projects. Nothing verifiable to show employers.
Path summary: Reads /for/students page (specifically the VERIFIED/not-VERIFIED distinction). Registers. Selects AI_BRIEF track, Agriculture domain. Receives brief (crop health observation tool for smallholder farmers, intermittent connectivity constraint). Decides to start.

Week 1: Opens AI Mentor. "Can you help me write my breakdown document?" Mentor responds with a question: "What problem in your brief do you think is most underspecified? What would you need to know to solve it?" Two hours of Mentor-guided reasoning. Writes Breakdown — longer than expected, three alternative approaches documented and two rejected with reasoning.

Week 2: Designs data model. Plans milestones. Writes Plan document. Begins implementation.

Weeks 2–3: Builds project. Offline-first connectivity proves harder than anticipated. Solves one aspect. Works around another.

Week 4: Writes Reflection. Honest: the connectivity workaround is not properly solved. Documents what a proper solution requires. Describes learning about offline-first data synchronization.

Submits all three documents and GitHub link. System creates SHA-256 hash. Status: PEER_REVIEW.

Assigned to review another student's submission. Finds the process clarifying — the rubric he applies to their Reflection makes him think about his own.

Waits. Doesn't know the queue depth.

Lecturer assigned. Reviews documents, code, peer score. Issues decision: REVISION_REQUIRED. Feedback (63 words): "The Reflection section on the connectivity workaround is the weakest part of this submission. You acknowledge the problem but don't explain what you tried before accepting the workaround, why other approaches failed, or what implementing a real solution would require technically. This section needs to demonstrate deeper reasoning about the technical constraint you encountered, not just acknowledge that the workaround exists."

David reads the feedback. He's disappointed but not confused — the feedback is specific. He revises the Reflection. Adds: what he tried first (client-side queueing with timestamp collision detection), why it failed (clock drift between devices), why proper offline-first synchronization requires a conflict resolution algorithm he didn't have time to implement, and what that algorithm would involve. The new Reflection section is 400 words, not 100.

Resubmits. Returns to peer review (or skips if policy doesn't re-require it — this needs product confirmation). Enters lecturer queue. Lecturer reviews revised submission. Issues VERIFIED.

Portfolio entry published. Shows: project title, AI_BRIEF track, Agriculture domain, verification date, lecturer name and institutional affiliation, peer score on four dimensions, all three documents visible in full including the Reflection with the connectivity analysis, document hash, GitHub link.

David shares the URL with a prospective employer. The employer reads the Reflection. Notes that the student documented a failure honestly and analyzed the technical constraint at depth. This is more useful than the GitHub commit history showing the same code.

**Journey: REVISION_REQUIRED — The Three Realities**

This journey documents three students who receive REVISION_REQUIRED feedback and what differentiates them:

*Student A*: Addresses the specific feedback mechanically — adds a paragraph that restates the reviewer's concern without genuinely engaging with it. Resubmits. Receives REVISION_REQUIRED again with a note that the revision did not address the underlying issue.

*Student B*: Reads the feedback carefully. Identifies the specific dimension where the weakness was noted. Rewrites that section from scratch, engaging with the underlying concern. Resubmits. Receives VERIFIED.

*Student C*: Reads the feedback. Realizes the feedback points to a genuine gap in their understanding, not just their documentation. Goes back to the problem, does additional research, rebuilds their understanding, then rewrites the document from a position of better understanding. Receives VERIFIED with a note that the revised submission showed significantly stronger reasoning.

The learning outcome: REVISION_REQUIRED is not a punishment. It is specific feedback from a qualified reviewer about where the submission fell short. A student who treats it as useful information improves. A student who treats it as an obstacle to bypass will eventually be DENIED.

**Journey: The AI Trap — Attempted Document Generation**

Student downloads their brief. Asks an AI chatbot (not the AI Mentor) to write their Problem Breakdown document from the brief. The AI produces a coherent-sounding document. The student submits it.

What happens in peer review: The peer reviewer notices that the document describes alternative approaches with unusual specificity but without any personal reasoning connecting the student to the analysis. The approaches listed are generic textbook options, not the specific tradeoffs that emerge from actually working through the brief's constraints. The peer score on "clarity of problem understanding" is low — not because the text is unclear, but because it doesn't demonstrate that the student understood *this* problem.

The lecturer reviews with the peer score in hand. The Reflection document (also AI-generated) accurately describes the project requirements but contains no personal reflection — no documented uncertainty, no acknowledged failures, no evidence that anything was harder than expected. The code submitted is also AI-generated and noticeably disconnected from the implementation decisions supposedly justified in the Plan.

The lecturer issues DENIED. Commentary: "The documentation appears to have been generated rather than written by the student. The Reflection in particular contains no personal account of the implementation process — no described difficulties, no documented decisions, no evidence that the student engaged with the technical challenges of the brief. The document integrity check confirms the submitted documents were not altered after submission; this is not about document tampering. The concern is about authorship. The platform's review process cannot verify authorship, but it can assess whether the documentation reflects genuine student engagement with the work. This submission does not."

What the student learns: The hash proves the documents are unchanged, not that they're genuine. The reviewer is reading for evidence of thinking, not just coherent text. AI-generated documentation is discernible to reviewers with domain expertise precisely because it lacks the irregular texture of genuine engagement — documented uncertainty, specific failures, personal reasoning.

**Journey: Employer Verification (from USER_JOURNEY_LIBRARY.md)**

Starting state: A hiring manager at a Nairobi fintech company is reviewing a shortlisted candidate. The candidate has shared their UmojaHub portfolio URL.

The employer reads the portfolio entry. They see: project title, AI_BRIEF track, verification date, the reviewer's name and institutional affiliation (they can look the reviewer up), the peer score on four dimensions, and all three documents in full.

They read the Reflection document. It is the most useful document they've read in any candidate's application — it documents what the student built, what they didn't finish, why they didn't finish it, and what they would do differently. The employer has spent years conducting technical interviews trying to get this information, and they often don't get it because candidates are in performance mode during interviews.

The employer is skeptical: could the portfolio entry be falsified? They look at the document hash. They use the verification link to confirm: the documents on the page produce the same SHA-256 hash as the hash recorded in the audit log at the time of submission.

What they've confirmed: the documents they read are the same documents the reviewer reviewed. What they haven't confirmed: the student wrote them. They decide to ask about this in the interview — specifically, to have the student walk through the offline-first connectivity problem documented in the Reflection. If the student can explain their reasoning live, the portfolio entry is validated.

What this journey reveals: The portfolio is evidence of process, not a proof of capability. The interview confirms capability. The portfolio makes the interview more efficient by directing the interviewer to the most revealing evidence.

---

### [A] Alternative Analysis — Required

The full STATUS_QUO_ANALYSIS.md (Part 2) content should be on the students page. Distilled:

| Alternative | What it provides | Why it structurally fails for junior developers |
|---|---|---|
| CV/Resume | Formatted summary of claimed experience | Entirely self-asserted, no independent review, employers discount proportionally to institutional prestige |
| GitHub portfolio | Record of committed code | Shows output not reasoning; AI-generated indistinguishable from authored; commit history gameable; no independent reviewer |
| LinkedIn profile | Professional identity, endorsements | Endorsements self-selected, credentials unverified, recommendations written by advocates not neutral assessors; known marketing document |
| Academic transcript | Grades across coursework | Measures exam performance on structured assessments, not unstructured problem-solving; doesn't distinguish reasoning quality; institutional bias for prestige schools |
| Coding bootcamp certificate | Curriculum completion | Certifies attendance in a structured program, not independent project quality |

**What UmojaHub adds:**
- Independent review by a named, credentials-confirmed reviewer
- Structured documentation of reasoning process, not just output
- Cryptographic integrity check (hash)
- Permanent, publicly accessible, institution-independent record

**What UmojaHub does not add:**
- A guarantee of employability
- A proof of authorship
- An employment network or job board
- A replacement for technical interviews

---

### [K] Missing Knowledge Inventory — Students

| Question | Why It Matters | Where | Priority |
|---|---|---|---|
| How long does the review process take from submission to decision? | Students need to plan around the timeline | Workflow section (honest: "depends on queue depth, no SLA") | HIGH |
| What exactly does a reviewer see about me beyond my documents? | Privacy and context question | Transparency section | HIGH |
| How many times can I revise before DENIED? | Students need to understand the revision limit | Transparency section (or open question disclosure if unresolved) | HIGH |
| Who is assigned as my lecturer and can I request a specific one? | Students may have concerns about reviewer expertise | Transparency section | HIGH |
| Can I do multiple projects simultaneously? | Practical planning question | FAQ | MEDIUM |
| What happens to my portfolio after I graduate? | Permanence question for job-seeking graduates | Portfolio section | MEDIUM |
| Is my portfolio visible before I have any VERIFIED projects? | Students want to know if incomplete portfolios are public | Portfolio section | MEDIUM |
| What does the peer reviewer know about me? | Privacy question | Peer review section | MEDIUM |
| Does the AI Mentor have access to my documents? | Context awareness question | AI Mentor section | MEDIUM |
| Can I delete a DENIED project from my history? | Students worry about evidence of failure | Transparency section | MEDIUM |
| What if my assigned peer reviewer does a superficial or dishonest review? | System integrity question | Peer review section | MEDIUM |
| Can employers contact me through the platform? | Portfolio utility question | Portfolio section | MEDIUM |
| Does the platform integrate with LinkedIn or other networks? | Distribution question | Portfolio section | LOW |
| What data is associated with my account if I leave the platform? | Data retention question | FAQ | LOW |
| Can I request a different brief if I disagree with the AI-generated one? | Track selection question | AI_BRIEF section | LOW |

---

## AUDIENCE 5 — LECTURERS

No page exists yet.

### [E] Ecosystem Explanations — Required

**Why the lecturer's identity is the trust anchor**

The page must explain why anonymous reviews are insufficient and why a named, credentials-confirmed reviewer creates a fundamentally different trust signal than a platform-administered anonymized review. An employer who reads a VERIFIED decision associated with a named lecturer at a named institution can look that person up. They can verify the institution exists. They can verify the lecturer teaches or taught there. The chain is traceable. This traceability is what makes the credential meaningful — and it's only available because lecturers submit to credential verification.

**How participating builds value for the lecturer and their institution**

Their graduates accumulate verified portfolio entries. Employers in the region begin to associate verified portfolios with quality. The institution's reputation is indirectly visible through the quality track record of its graduates' verified projects. A department head whose faculty are active reviewers may find that their graduates' verified portfolios begin to carry weight with employers — a competitive differentiator for the institution.

### [T] Transparency Content — Required

**Conflict of interest enforcement — what is structural vs. what is policy**

The WEBSITE_INFORMATION_ARCHITECTURE.md states: "The platform does not currently enforce institutional conflict-of-interest restrictions in the review assignment system. Lecturers are expected to exercise professional judgment and recuse themselves from reviewing students they know personally."

This is the most significant transparency gap for the lecturers page. Structural enforcement does not currently exist for this case. Lecturers who review a student they personally know are relying on their own professional judgment, not a system constraint. The website should disclose this honestly: the platform prevents the student's own institutional affiliation from determining reviewer assignment, but personal relationship conflicts are currently self-policed.

**Effectiveness tracking — what is tracked and what happens when metrics deviate**

The page should explain: what metrics are tracked (number of reviews, average scores given across dimensions, decision distribution — proportion of VERIFIED/REVISION_REQUIRED/DENIED), what deviation looks like (unusually high pass rate, unusually low scores consistently misaligned with eventual resubmission outcomes), and what happens when deviation is detected (platform review, not automatic action). Lecturers need to know their assessments are monitored for quality, not to intimidate them, but because this monitoring is what makes the credential trustworthy.

**No monetary compensation currently**

This should be stated directly and early. Lecturers participate as professional contributors. There is no current compensation model. If this changes, it should be updated.

**Review time expectation — what a thorough review actually takes**

The WEBSITE_INFORMATION_ARCHITECTURE.md states 30–60 minutes. This should appear with context: what that time involves (reading 2,000–5,000 words of student documentation, assessing against rubric, writing substantive commentary on four dimensions). A lecturer who plans to review during a spare ten minutes is not capable of meeting the 50-word-per-dimension substantive commentary standard.

### [D] System Diagrams — Specifications

**Diagram 1: Review Queue — How Submissions Enter and Exit**
- Title: "From submission to decision — the lecturer's view"
- Purpose: Show how submissions arrive, how the lecturer selects from the queue, and what happens after a decision
- Information shown: Submission enters queue after peer review → lecturer selects project → reads brief, three documents, code/repository, peer score → assesses four dimensions → writes commentary (min 50 words each) → issues VERIFIED/REVISION_REQUIRED/DENIED → decision locked → student notified → if REVISION_REQUIRED: revised submission re-enters queue
- Type: Process flow diagram

**Diagram 2: Four-Dimension Assessment Framework**
- Title: "The four dimensions and what substantive commentary looks like"
- Purpose: Help lecturers understand exactly what they are assessing and what the commentary standard requires
- Information shown: Clarity of problem understanding, Methodology appropriateness, Documentation quality, Reflection depth — for each: what strong evidence looks like, what weak evidence looks like, example commentary phrasing (not template, but illustration of substantive vs. superficial)
- Type: Four-quadrant or four-row structured guide

**Diagram 3: Three Decision Types — When Each Applies**
- Title: "VERIFIED, REVISION_REQUIRED, DENIED — the decision criteria"
- Purpose: Give lecturers a framework for making consistent decisions
- Information shown: VERIFIED (meets standard across all four dimensions at minimum threshold), REVISION_REQUIRED (specific identified weaknesses that revision can address — has a documented improvement path), DENIED (does not meet standard and revision within current project scope cannot remedy it)
- Type: Decision tree or comparative table

### [K] Missing Knowledge Inventory — Lecturers

| Question | Why It Matters | Where | Priority |
|---|---|---|---|
| Am I required to review a minimum number of submissions? | Commitment question | FAQ | HIGH |
| What happens if I issue a decision that is later disputed? | Accountability question | Transparency section | HIGH |
| How are conflict of interest situations handled? | Ethics question | Transparency section — honest about self-policing | HIGH |
| Can I see how my decision compares to the peer score? | Assessment calibration question | Review interface section | MEDIUM |
| Can I change my decision after submitting it? | Error correction question | FAQ | MEDIUM |
| What does "effectiveness tracking" measure and what triggers a review? | Performance accountability question | Transparency section | MEDIUM |
| Can I specialize in specific project types within my track? | Expertise matching question | FAQ | LOW |

---

## AUDIENCE 6 — EMPLOYERS

No page exists yet.

### [E] Ecosystem Explanations — Required

**Why the junior developer hiring pipeline is broken**

Employers conduct technical interviews because no pre-interview artifact reliably signals capability for junior developers. CVs are self-reported. GitHub portfolios show output not reasoning and cannot distinguish authored code from AI-generated. Degrees certify examination performance not project execution quality. The result: employers bear the cost of extensive screening for every candidate, including many who would have been screened out earlier if better evidence existed.

The Education Hub's portfolio system is a partial solution to this problem. The page should explain the problem first, at depth, before explaining how the portfolio addresses it. An employer who doesn't understand why the existing system is broken will not understand why a VERIFIED portfolio entry is more valuable than a GitHub link.

**What the verification chain means in employer terms**

An employer reading the words "VERIFIED by UmojaHub" needs context for what that means. The page should translate the verification chain into employer language: a named person, whose academic credentials were reviewed by a platform administrator, independently read all three of this student's documents and their code, assessed them against a defined rubric, and determined they met the minimum standard. The reviewer's name is listed. You can look them up. You can see their institutional affiliation. If you want to contact the platform with a verification inquiry, here's how.

---

### [T] Transparency Content — Required

**The full "what VERIFIED does not mean" section**

The employer page needs this section in full and with greater emphasis than the students page, because employers are making consequential decisions based on this credential. VERIFIED does not mean:

- The student will perform well in the specific role you are hiring for
- The code is production-ready or meets your engineering standards
- The student wrote every line of the code themselves
- The student's claims within the documents are accurate (you are reading the same documents the reviewer read, but the reviewer cannot verify the accuracy of the student's narrative either)
- The reviewer found the submission exceptional — VERIFIED means it met the defined standard

**What the Reflection document specifically reveals**

The employer page should explain why the Reflection document is the most useful hiring evidence in the portfolio. A Reflection that documents what went wrong, why, and what the student would do differently gives an interviewer a specific, factual starting point for a technical discussion. This is qualitatively different from asking "what was your greatest challenge?" in a generic interview. The Reflection gives a specific challenge already documented before the interview begins.

**How to use the portfolio as an interview preparation tool**

The portfolio is not a hiring decision. It is an interview preparation tool. The employer page should explain: read the Reflection before the interview. Identify the technical challenges the student documented. Ask the student to explain their reasoning on those specific challenges. If they can explain the documented reasoning fluently and extend it, the portfolio entry is validated by the interview. If they cannot, that is useful information too.

**Document hash verification — the independent verification path**

The page should explain precisely how an employer who wants to verify independently can do so. The hash in the portfolio entry, when computed against the documents currently visible, should match the hash recorded in the audit log at submission time. How to request this verification should be explicitly stated.

---

### [D] System Diagrams — Specifications

**Diagram 1: The Verification Chain — Employer Perspective**
- Title: "Who reviewed this portfolio entry and how"
- Purpose: Make the full verification chain visible to employers who are deciding how much weight to give a portfolio entry
- Information shown: Student submits → document hash created (immutable) → peer reviewer assesses four dimensions (scored, locked) → verified lecturer reviews (independent, sees peer score) → VERIFIED decision issued (timestamped, associated with named reviewer) → portfolio entry published with full audit trail
- Type: Trust chain diagram from student submission to employer view

**Diagram 2: What a Portfolio Entry Contains — Annotated**
- Title: "Reading a verified portfolio entry"
- Purpose: Help employers interpret every element of a portfolio entry
- Information shown: Project title, AI_BRIEF or OPEN_SOURCE indicator, track (Agriculture/Health/Finance), brief type, verification date, reviewer name and institutional affiliation, peer scores on four dimensions (what each dimension measures), skills demonstrated, the three document texts in full, document hash with verification link, GitHub repository link
- Type: Annotated layout diagram

**Diagram 3: Evidence Strength Comparison**
- Title: "What a verified portfolio entry shows vs. what other portfolio tools show"
- Purpose: Help employers calibrate the relative weight of a verified portfolio vs. other evidence types
- Information shown: Comparative table — CV (self-asserted, no reviewer), GitHub (code output, no reasoning documentation, no independent reviewer), Degree (program completion, not project execution), UmojaHub VERIFIED (structured process documentation, peer review gate, credentials-confirmed lecturer review, cryptographic integrity, named reviewer visible)
- Type: Comparative table

### [K] Missing Knowledge Inventory — Employers

| Question | Why It Matters | Where | Priority |
|---|---|---|---|
| What does VERIFIED specifically guarantee and not guarantee? | Decision-critical information | Most prominent section on page | HIGH |
| Who reviewed this student's work and what are their credentials? | Reviewer trust question | Verification chain section | HIGH |
| How can I independently verify a portfolio entry? | Authentic verification question | Document hash section | HIGH |
| What should I ask the candidate in an interview based on their portfolio? | Practical utility question | Portfolio as interview tool section | HIGH |
| Does the platform track post-platform employment outcomes? | Outcome validity question (answer: no) | Transparency section | MEDIUM |
| Can I contact the reviewing lecturer directly? | Verification escalation question | Contact section | MEDIUM |
| Can I search for students with specific skills or verified projects? | Sourcing question | FAQ | MEDIUM |
| What happens if I believe a portfolio entry is misrepresented? | Fraud concern question | Reporting section | MEDIUM |
| Is there a formal partnership or bulk access program for employers? | Enterprise query | Contact section | LOW |

---

## AUDIENCE 7 — INSTITUTIONS

No page exists yet.

### [E] Ecosystem Explanations — Required

**How institutional participation affects student outcomes**

An institution whose faculty members are active reviewers creates a self-reinforcing advantage for their students: their graduates enter a platform where the reviewer pool includes people from their own discipline. More importantly, faculty who review other students' work bring that assessment experience into their own teaching — what they see in the submission quality of students from other institutions informs what they teach their own students. The feedback loop benefits the institution.

**What the institution does not control**

This is the most important ecosystem explanation for an institution: the platform does not allow an institution to guarantee their students will receive favorable reviews. The conflict of interest prevention means their own faculty cannot review their students. The rubric is fixed. The decision is the reviewer's. The institution contributes to the reviewer pool; they do not control the outcomes for their students.

### [T] Transparency Content — Required

**That institutions participate through individual faculty, not formal institutional agreements**

A university administrator considering platform engagement needs to understand: there is no institutional registration or sign-up. Individual faculty members register, submit credentials, and are verified. The institution's relationship with the platform is entirely through its individual faculty members. An institution cannot "partner" with UmojaHub in the traditional sense without individual faculty making that commitment.

**Whether a formal partnership program exists**

The WEBSITE_INFORMATION_ARCHITECTURE.md identifies this as an open product question. Until the product team answers it, the page should disclose: "Individual faculty verification is the current path for institutional engagement. A formal institutional partnership program is [under development / not currently available / available upon inquiry]."

---

## AUDIENCE 8 — NGOs AND GOVERNMENT

No page exists yet. This is a combined audience with shared needs.

### [E] Ecosystem Explanations — Required

**How the Food Security Hub relates to food security mandates**

Agricultural NGOs working in Kenya's smallholder farming sector have specific mandate areas: increasing farmer income, improving market access, reducing information asymmetry, building farmer resilience. The page needs to show specifically which mandate areas the platform addresses and which it does not. "Food security" is broad — the platform addresses market access and price transparency for smallholder produce; it does not address food storage, processing, nutritional access, or last-mile food distribution.

**How the Education Hub relates to youth employment mandates**

Organizations focused on youth skills development and employability have a specific interest in the Education Hub's portfolio system. The page should explain specifically what the portfolio system does that other youth skills programs cannot: produce a portable, institution-independent, independently verified credential that survives beyond the program lifecycle.

### [T] Transparency Content — Required

**What impact metrics exist and how they are calculated**

The NGO/government page should explain exactly what the platform tracks (verified farmer count, completed transaction count, counties represented, student portfolio verifications, lecturer count) and exactly how each is calculated. "Verified farmer count" includes only currently approved, active farmers — not all-time registrations. These distinctions matter for organizations that will use the data in reports.

**What impact data the platform does not track**

This section must exist. The platform does not track: post-transaction price outcomes (what buyers paid vs. what they would have paid without the platform), farmer income improvement, produce quality outcomes, post-graduation employment outcomes for students. Any NGO that wants to use this data for impact evaluation will need to conduct their own studies. The platform can provide transaction data for partner farmers with appropriate data governance agreements, but it does not automatically generate impact evaluation evidence.

---

## CROSS-CUTTING GAPS

These gaps affect multiple pages and require attention across the information architecture.

### [E] Cross-Cutting Ecosystem Gap: The Two Hubs' Relationship

Neither the homepage nor any audience page yet explains why these two hubs exist on the same platform. The connection is not arbitrary: agricultural project briefs are drawn from real Kenyan agricultural industry contexts (the same domain the Food Security Hub operates in). Students who build tools for smallholder farmers are building things that could directly benefit farmers on the platform. This connection should be explained — not as marketing ("everything is connected!") but as a structural design decision: the Education Hub produces CS graduates with domain knowledge of agricultural challenges; the Food Security Hub creates the industry context that makes that domain knowledge meaningful.

### [T] Cross-Cutting Transparency Gap: Platform Operational Risk

No page currently discloses: what happens to in-flight transactions or pending reviews if the platform experiences extended downtime. This matters most for:

- Farmers with PAID orders in escrow
- Buyers who have paid but not received
- Students with submissions in the peer or lecturer review queue

The platform should disclose its data protection and continuity commitments at a category level on the Platform Transparency page.

### [T] Cross-Cutting Transparency Gap: Data Deletion

No page currently explains what happens to a user's data if they delete their account. For farmers: does their Trust Score history disappear? Do their completed orders disappear from buyers' order histories? For students: does their portfolio disappear? Does their VERIFIED status remain visible to employers who already have the URL? These are consequential questions that affect whether users commit to the platform long-term.

### [D] Cross-Cutting System Diagram: Full Ecosystem Map

A single diagram showing all actors in both hubs, their relationships, and how trust flows between them. This belongs on the homepage or the How It Works page.

- Title: "Every participant in UmojaHub and their role"
- Purpose: Show the complete system, including actors that are not registered users (buyers who browse without registering, employers who view portfolios, administrators who are not shown in public-facing content)
- Information shown: Food Security Hub actors (farmers, buyers, suppliers, cooperative groups, administrators) and their relationships; Education Hub actors (students, peers, lecturers, institutions, employers) and their relationships; shared platform layer (verification, trust architecture, M-Pesa integration)
- Type: Ecosystem relationship diagram

### [D] Cross-Cutting System Diagram: Trust Architecture

A single diagram showing how trust is created and transferred in both hubs.

- Title: "How trust is built and transferred on UmojaHub"
- Purpose: Show that trust in this system is not asserted — it is constructed from verified steps
- Information shown: Food Security Hub trust chain (admin verifies farmer → farmer builds transaction history → ratings → Trust Score tier visible to buyers); Education Hub trust chain (admin verifies lecturer → peer reviews submission → lecturer reviews submission → portfolio entry visible to employers); shared principle: nothing on the platform is self-asserted
- Type: Trust flow diagram with two parallel chains

---

## HOMEPAGE — GAPS

The homepage currently has: RootProblemStatement, AudienceNavigator, LivePlatformStats, MarketplaceFlowSection, EducationFlowSection, TrustArchitectureSection.

**What a first-time visitor still cannot answer after reading the homepage:**

| Question | Gap | Where to add |
|---|---|---|
| Why do these two hubs exist on the same platform? | The connection between Food Security Hub and Education Hub is unexplained | RootProblemStatement or a dedicated synthesis section |
| Who are the administrators? | Human review is the backbone of both hubs but administrators are invisible | TrustArchitectureSection |
| What happens when things go wrong? | No failure mode is mentioned on the homepage | A "what the platform doesn't guarantee" note in TrustArchitectureSection |
| What does it cost? | No pricing information on the homepage | Somewhere on the homepage, clearly |
| Is this platform in active use or is it new? | Live stats answer this partially, but context for the numbers is missing | LivePlatformStats section (add: "as of [date]" and a note about what the numbers represent) |

---

## MASTER GAP PRIORITY SUMMARY

The following gaps are highest priority across all audiences:

1. **Payment escrow transparency** (Farmers, Buyers) — Who holds the money between STK Push confirmation and buyer receipt confirmation, and what happens if the platform goes offline.

2. **"What VERIFIED does not mean"** (Students, Employers) — The most consequential transparency section for both audiences. Needs to be prominent on both pages, not buried in FAQ.

3. **Cooperative group payment disclosure** (Farmers, Suppliers) — The group ordering payment process is currently manual and outside the platform payment system. This must be disclosed before farmers form groups or suppliers engage with group orders.

4. **Conflict of interest disclosure for lecturer review** (Lecturers) — The self-policing nature of personal relationship conflict of interest must be disclosed.

5. **The AI code generation crisis** (Students) — Why documentation of reasoning is more valuable now than it was three years ago, and why UmojaHub's three-document structure is a direct response to a real and growing problem.

6. **Ecosystem explanations for broker system persistence** (Farmers) — Why the intermediary system structurally persists and what the platform does and does not displace.

7. **The document hash section** (Students, Employers) — What it proves, what it doesn't prove, and how to use it for independent verification.

8. **Financial remediation ceiling** (Buyers, Farmers) — No refund mechanism for quality shortfalls. This must be prominent on both pages, not only in FAQ.

9. **Administrator review: what it checks and what it doesn't** (All) — The verification is a consistency check, not fraud forensics. Setting accurate expectations prevents trust collapse when a fraudulent account is eventually detected.

10. **Account data deletion** (All) — What happens to Trust Score history, portfolio entries, and transaction records if a user deletes their account.

---

## WHAT TO BUILD NEXT — SEQUENCED BY UNDERSTANDING IMPACT

**Stage 1 — Complete the core audience pages (highest understanding impact)**

1. `/for/students` — The Education Hub's most important audience page. The ecosystem explanations, VERIFIED/not-VERIFIED transparency, and David's journey are foundational to employer trust in the credential.
2. `/for/buyers` — The demand side of the marketplace. Without this page, buyers have no deep understanding of what the Trust Score means or what their recourse is.
3. `/for/employers` — The Education Hub's external validation audience. Employer adoption is the flywheel; employer understanding is the precondition.

**Stage 2 — System explanation pages (structural understanding)**

4. `/trust` — The Trust and Verification page, covering both hubs, with the explicit "what verification does not claim" section.
5. `/how-it-works` — Complete workflow explanation for both hubs.
6. `/transparency` — Live metrics, what is tracked, what isn't, infrastructure transparency.

**Stage 3 — Remaining audience pages**

7. `/for/lecturers`
8. `/for/suppliers`
9. `/for/institutions`
10. `/for/cooperatives`
11. `/for/ngos` (combined with government)

**Stage 4 — Deep content**

12. Cross-cutting system diagrams (Full Ecosystem Map, Trust Architecture)
13. Human journey companion pages or deep sections
14. Alternative analysis content

---

*This document supersedes any previous content planning. Every page built after this date should be reviewed against this gap analysis before publishing. A page that cannot answer the questions in its [K] inventory — at minimum the HIGH-priority items — should not be considered complete.*
