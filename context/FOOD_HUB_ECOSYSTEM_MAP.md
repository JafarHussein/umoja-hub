# Food Security Hub — Ecosystem Map
**Date**: 2026-06-01
**Purpose**: Complete account of every participant, information flow, trust relationship, incentive, and failure mode in the Food Security Hub. This document informs all content, diagrams, and page copy for the hub.

---

## WHO EXISTS IN THIS ECOSYSTEM AND WHY

### Farmers

**Who they are**: Smallholder farmers in Kenya, typically cultivating 0.5 to 5 acres, growing produce for market: vegetables, legumes, grains, fruit, tubers. Most operate without formal business registration. Many sell into the same local market chains their parents used.

**Why they exist in this ecosystem**: They have produce and no reliable mechanism to connect it to buyers outside their immediate social or geographic network. The informal channels they use — roadside traders, local markets, agricultural brokers — all extract a margin from a position of information advantage. The farmer does not know what the buyer in Nairobi is paying the trader for the same tomatoes. The trader knows both prices.

**What they need from the ecosystem**: A market in which their reliability is visible, their pricing is informed by actual demand data, and their payment arrives without requiring a bank account or physical presence of cash.

**What they contribute to the ecosystem**: Produce listings, accurate quantity and quality information, fulfillment behavior that generates Trust Score data, and ratings that create the reputation layer for buyers.

**What they risk**: Rejection during verification (recoverable), orders that go unfulfilled by buyers (mitigated by the payment-before-dispatch model), and the reputational cost of low ratings if they do not fulfil consistently.

---

### Buyers

**Who they are**: Individuals, households, restaurant buyers, hotel procurement officers, market traders seeking upstream supply, and small retail operators. They range from a household buying 5 kg of tomatoes to a hotel buying 200 kg of produce weekly.

**Why they exist in this ecosystem**: They want to purchase produce directly from farmers — for freshness, reduced cost, and accountability — but have no mechanism for identifying reliable farmers at scale. The existing alternatives (physical market, WhatsApp groups, broker networks) all require either physical presence or social network access to establish trust.

**What they need from the ecosystem**: A searchable, filterable directory of available produce from farmers whose identity has been reviewed by a third party, with visible transaction history so they can make an informed choice before committing payment.

**What they contribute to the ecosystem**: Payment (via M-Pesa, confirmed before fulfillment), ratings after receiving orders, and the demand signal that makes the marketplace valuable to farmers.

**What they risk**: Produce that does not match the listing description, a farmer who fails to dispatch after payment is confirmed, or a quality shortfall with no recourse. The rating system and Trust Score are partially designed to reduce — but not eliminate — these risks.

---

### Suppliers

**Who they are**: Agricultural input companies and distributors supplying seeds, fertilizers, pesticides, herbicides, and farm tools. They may be national distributors or regional specialists. They hold regulatory certifications (KEBS, PCPB, KEPHIS) relevant to their product categories.

**Why they exist in this ecosystem**: Cooperative groups of farmers need input suppliers who can handle bulk orders. Suppliers who are not in the ecosystem cannot be selected for cooperative group orders. Being in the verified supplier directory is the precondition for receiving group order nominations.

**What they need from the ecosystem**: Access to verified farmer cooperative groups who pool purchasing power, a payment mechanism that handles group orders with coordinated disbursement, and a verification status that makes their regulatory credentials visible to buyers.

**What they contribute to the ecosystem**: Agricultural input supply at scale, which enables farmer groups to reduce per-unit input costs and access inputs that individual smallholders could not afford or access alone.

**What they risk**: Group orders that fall below minimum quantity thresholds, coordination costs when group composition changes, and the platform's ability to sustain the cooperative group feature at operational scale.

---

### Platform Administrators

**Who they are**: UmojaHub staff responsible for reviewing verification submissions, handling escalated disputes, managing the supplier directory, and suspending accounts that violate platform rules.

**Why they exist in this ecosystem**: The verification system has no value without human review. An automated verification system that checked document formats without human judgment could be defeated by forged documents. The administrator is the trust anchor. Their review is what the "Verified" status actually represents.

**What they contribute**: The credibility of every "Verified" label on the platform. Without administrators actively reviewing submissions, the verification queue backs up and the trust system stalls. The throughput of the admin review queue determines how quickly new farmers can access the marketplace.

**What they risk and what constrains them**: Administrator judgment is not infallible. A document that passes review might be fraudulent. A legitimate farmer with atypical documentation might be rejected. The platform's verification quality is bounded by the quality of administrator review.

---

## HOW PARTICIPANTS INTERACT

### Farmer → Administrator (Verification)

The farmer submits identity documents (National ID or passport), land documentation (title deed, land lease agreement, or tenancy letter), and a photograph of their farm or produce. The submission enters a PENDING queue. An administrator reviews the documents against the submission, assesses whether the documents are consistent and plausible, and issues a decision: APPROVED or REJECTED. The farmer receives an SMS notification either way. Rejection includes a reason. Rejection is correctable — the farmer may resubmit with corrected or additional documentation.

What the administrator sees: the submitted documents, the farmer's registration information, their submission history.

What the administrator does not see: the farmer's transaction history (they are not verified yet), any buyer's payment information.

### Farmer → System (Listings)

After verification approval, the farmer creates listings. A listing specifies: crop type (from a defined list), price per kilogram, available quantity in kilograms, pickup county, preferred contact method, and an optional produce photograph. The system publishes the listing immediately. The farmer can update price, quantity, and availability. The farmer cannot list until they are verified. They cannot list crop types outside the approved list.

### Buyer → System (Discovery)

Buyers can browse listings without registration. They filter by county and crop type. Each listing shows the farmer's name, Trust Score tier (NEW / ESTABLISHED / TRUSTED / PREMIUM), number of completed orders, and verification status. The buyer sees enough information to make a comparative judgment before committing to any payment.

### Buyer → Safaricom → System (Payment)

When a buyer places an order, the system initiates an M-Pesa STK Push via Safaricom's Daraja API to the buyer's registered phone number. The buyer enters their M-Pesa PIN on their device. Safaricom processes and confirms the transaction. The confirmation goes to Safaricom's servers and then to UmojaHub's callback endpoint. The order status updates from PENDING to PAID. At no point does UmojaHub receive or store the buyer's M-Pesa PIN. If the STK Push times out or the buyer declines, the order remains PENDING and no payment has occurred.

### Farmer → Buyer (Fulfillment)

After payment confirmation, the farmer receives an SMS notification with order details. The farmer marks the order DISPATCHED when produce is sent. The buyer marks the order RECEIVED when produce arrives. If the buyer does not mark it received within a set window after the farmer marks it dispatched, the system may auto-complete — the exact window is platform-defined. After completion, both parties rate each other. The rating becomes part of the Trust Score calculation.

### Farmer ↔ Cooperative Group ↔ Supplier

Farmers form cooperative groups on the platform. A group nominates a supplier for a collective input order. The supplier receives the group order specification. The supplier fulfills. Payment is coordinated through the group. This pathway requires both the supplier to be verified in the supplier directory and the group to meet the minimum participation threshold for bulk orders.

---

## INFORMATION FLOWS

What moves through the ecosystem and between whom:

**Document flow**: Farmer → Admin (verification documents). Not visible to other users.

**Price signal**: Market listings → all buyers (public). Price intelligence dashboard → farmers (showing comparable listing prices by crop and county).

**Order data**: Buyer → system → farmer (order details via SMS and dashboard). Aggregate order counts are public via Trust Score display.

**Payment confirmation**: Safaricom → UmojaHub callback → system → farmer (SMS). The payment record is held by Safaricom. UmojaHub receives confirmation, not the underlying payment credentials.

**Rating data**: Buyer → system → farmer Trust Score (rating submitted after order completion). Farmer → system → buyer (farmer can also rate buyers, though this is secondary).

**Verification status**: Admin decision → farmer status field → publicly visible on all listings and farmer profile. The content of the documents reviewed is not public.

**Trust Score**: Calculated by system from four components. Publicly visible as tier label and numeric score. The component breakdown is visible to the farmer on their dashboard; buyers see only the aggregate tier.

**AI farm assistant queries**: Farmer → system → Groq API → farmer. Not stored long-term, not visible to other users.

---

## TRUST FLOWS

Trust in this ecosystem is not a single thing. It moves in layers.

**Layer 1 — Identity trust**: An administrator reviewed the farmer's documents and determined they represent a real person. This is the foundation layer. Without it, no listing is possible.

**Layer 2 — Behavioral trust**: Transaction history and ratings accumulate. Each completed order adds to the transaction component. Each buyer rating contributes to the rating component. This layer builds over time and cannot be purchased or faked — it requires actual transactions with actual buyers.

**Layer 3 — Reliability trust**: The ratio of fulfilled orders to total orders over a rolling period. A farmer who consistently fulfils is rewarded; inconsistency is penalized in the reliability component even if individual ratings are acceptable.

**Layer 4 — Composite signal**: The Trust Score (0–100) and tier (NEW, ESTABLISHED, TRUSTED, PREMIUM) are the buyer-facing aggregation of layers 1–3. They allow a buyer who has never met the farmer to make an informed comparative judgment.

**What trust flows cannot do**: They cannot verify produce quality at point of listing. They cannot prevent a farmer from listing produce that does not exist. They cannot prevent a bad actor who passes identity verification and is willing to accept a few bad ratings. They create accountability over time, not guaranteed performance on any single transaction.

---

## FAILURE MODES

### STK Push payment failure
The Safaricom push times out or the buyer declines. The order remains PENDING. No money has moved. The farmer is not notified unless a new payment is initiated. Resolution: buyer retries or cancels the order.

### Farmer non-dispatch after payment
Payment is confirmed (PAID status) but the farmer does not dispatch. This is the most significant trust failure in the system. Current mitigation: the rating system penalizes non-fulfillment. The reliability component of the Trust Score tracks fulfilment rate. Platform administrators can review accounts with sustained non-dispatch patterns.

### Produce does not match listing
The farmer dispatches and the buyer receives, but the produce is underweight, different variety, or in poor condition. The buyer's recourse is: submit a low rating with explanation. There is currently no automated dispute resolution for quality claims — the rating is the mechanism. This is a documented limitation.

### Verification document fraud
A farmer submits forged identity or land documents. An administrator reviews and, if the forgery is not detected, approves. The farmer lists and transacts. Detection depends on document quality review, not cryptographic verification. This is a documented limitation of human document review.

### Administrator review backlog
If the volume of verification submissions exceeds administrator capacity, the queue backs up. Farmers in PENDING status cannot list. The platform's growth rate is constrained by administrator throughput.

### Trust Score manipulation
A bad actor could attempt to game the Trust Score by completing many small, real transactions to build score, then executing a large fraudulent order. The system's protection: the verification requirement means every such attempt is connected to a real identity. The cost of the scheme is the real transactions required to build the score.

### Cooperative group collapse
A cooperative group nominates a supplier for a bulk order. Some members leave before the order is fulfilled. The remaining members may not meet the minimum threshold, or the per-unit cost advantage disappears. Resolution: platform-defined minimum commitment before an order is placed.

---

## INCENTIVES

**Farmer incentives to participate and behave well**:
- Access to buyers outside their social network
- Price transparency they could not access through traders
- Trust Score accumulation creates compounding commercial advantage
- High Trust Score correlates with higher listing visibility (platform may prioritize trusted listings)
- SMS payment confirmation is immediate — no waiting for broker payment

**Buyer incentives to participate and rate honestly**:
- Access to verified farmers with visible transaction history
- M-Pesa payment is familiar and trusted
- Honest ratings protect future buyers who rely on the same signal
- Self-interest: a buyer who gives dishonest ratings degrades the signal they themselves rely on

**Supplier incentives to join the directory**:
- Access to group orders at scale
- Verified status differentiates them from unlisted competitors
- Group orders are coordinated payment — lower collection cost than individual farmer sales

**Administrator incentives to review accurately**:
- Platform integrity depends on verification quality — their function is the foundation of the trust system
- Approving fraudulent accounts degrades the marketplace; rejecting legitimate accounts stalls growth

---

## WHAT HAPPENS WHEN PARTICIPANTS ENTER OR LEAVE

### A new farmer joins
Registration → document submission → PENDING review → APPROVED (typically within [admin SLA]) → first listing created → appears in marketplace → first order → Trust Score begins accumulating. The transition from NEW tier to ESTABLISHED tier requires verified status plus a number of completed transactions above the threshold.

### A farmer leaves or is suspended
Active listings deactivated. Trust Score frozen. Buyers who had pending orders with the farmer are notified. The farmer's historical transaction record remains in the system — it does not disappear, which protects buyers who rated them from having their rating history orphaned.

### A new buyer joins (or doesn't)
Buyers are not required to register to browse. Registration is required to place an order. A buyer who places an order is associated with an M-Pesa number — this is the buyer's identity anchor in the system. They do not require document verification.

### A new supplier joins the directory
Suppliers are not self-registered. They are added by administrators after credential verification (business registration, regulatory certificates). A supplier cannot list themselves. The directory is administrator-curated.

### An administrator joins or leaves
Their role in the verification queue is the critical dependency. If an administrator handling verification leaves, the queue must be reassigned. There is no automated fallback for human document review.
