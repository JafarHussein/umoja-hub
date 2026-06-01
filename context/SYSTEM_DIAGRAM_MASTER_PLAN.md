# System Diagram Master Plan
**Date**: 2026-06-01
**Purpose**: Define every diagram that must exist, what each must convey, where it lives, how it is built, and what understanding it produces that text alone cannot. No decorative diagrams. No illustrations. Only knowledge diagrams that make complex systems legible.

---

## DIAGRAM PHILOSOPHY

A diagram earns its existence only if it answers a question that text cannot answer as efficiently.

Text is better at: nuance, qualification, context, causation, limitation disclosure.

Diagrams are better at: showing relationships, sequences, branching logic, component hierarchy, parallel processes, and the relative position of actors.

Every diagram below specifies: what the visitor understands *after* seeing it that they did not understand *before*. If that answer is absent, the diagram should not be built.

---

## DIAGRAM IMPLEMENTATION STANDARD

All diagrams are inline SVG React components. No external diagram tools. No raster images. No decorative elements.

Design tokens:
- Background: `#0D1117` (surface-primary) or `#131920` (surface-elevated)
- Primary lines: `#21262D` (border)
- Accent: `#007F4E` (accent-green)
- Text primary: `#E6EDF3`
- Text secondary: `#8B949E`
- Text disabled: `#484F58`
- Font: monospace labels for identifiers, body font for descriptions

Interaction model: Static by default on all diagrams. GSAP scroll-trigger fade-in on first enter (with `prefers-reduced-motion` guard). No click interactions unless specified.

File location: `src/components/website/diagrams/`

---

## FOOD SECURITY HUB DIAGRAMS

---

### 1. Food Hub Ecosystem Map

**File**: `FoodHubEcosystemDiagram.tsx`

**Purpose**: Show all actors in the Food Security Hub and how they are connected.

**Audience**: Any visitor who wants to understand the full system before engaging with any part of it.

**What the visitor understands after seeing it**:

The ecosystem has five human actor types (Farmer, Buyer, Supplier, Administrator, Cooperative Group) and three system types (Verification System, Payment System, Trust System). They can see which actors interact directly with which other actors, and which actors interact only through the system.

**Information conveyed**:

Nodes:
- Farmer (ellipse, left side)
- Buyer (ellipse, right side)
- Cooperative Group (ellipse, lower left, contained within or adjacent to Farmer cluster)
- Supplier (ellipse, lower right)
- Administrator (rectangle, top)
- Verification System (rectangle, middle — admin feeds into this)
- Trust System (rectangle, middle — transactions and ratings feed into this)
- Payment System (rectangle, between Buyer and Farmer — Safaricom label)

Edges (labeled):
- Farmer → Verification System: "submits documents"
- Administrator → Verification System: "reviews"
- Verification System → Farmer: "approved/rejected"
- Farmer → Trust System: "transactions, fulfillment"
- Buyer → Trust System: "ratings"
- Buyer → Payment System: "M-Pesa STK Push"
- Payment System → Farmer: "payment confirmed"
- Farmer → Buyer: "produce delivered"
- Cooperative Group → Supplier: "group order"
- Supplier → Cooperative Group: "inputs delivered"

**Placement**: `/how-it-works` page, Food Hub section. Also on `/for/farmers` and `/for/buyers` introduction sections.

**Visual structure**: Horizontal layout. Farmer cluster left, Buyer cluster right, Administrator at top, Payment System center, Trust System center-right, Verification System center-left.

---

### 2. Trust Score Component Diagram

**File**: `TrustScoreDiagram.tsx`

**Purpose**: Show the four Trust Score components, their weights, and what each measures.

**Audience**: Farmers who want to understand how to build their score. Buyers who want to understand what the score means before choosing a farmer.

**What the visitor understands after seeing it**:

The Trust Score is not a black box. It has four specific components with specific weights. Only one component (Verification) is binary and one-time. The other three grow from behavior. A farmer controls their score primarily through their actions over time, not through any single event.

**Information conveyed**:

Four horizontal bars or arc segments:
1. Verification — 40 points — label: "Identity and document review. One-time. Binary."
2. Transactions — 25 points — label: "Completed order count. Logarithmic scale."
3. Ratings — 20 points — label: "Buyer ratings. Weighted by recency."
4. Reliability — 15 points — label: "Fulfilled vs accepted order ratio."

Secondary annotation: which components the farmer controls entirely (Transactions, Reliability, Ratings — through behavior) vs. which requires admin action (Verification — one-time).

Secondary annotation: time to first meaningful score — "A farmer with 5 completed orders and positive ratings can reach ESTABLISHED tier."

**Placement**: `/for/farmers` page, Trust Score section. `/trust` page.

**Visual structure**: Horizontal stacked bar showing weight proportions. Each bar segment expands to show description on hover (or is static with descriptions below).

---

### 3. Trust Tier Progression

**File**: `TrustTierDiagram.tsx`

**Purpose**: Show the four tiers, their score ranges, and what each communicates to buyers.

**Audience**: Farmers (so they understand what they are working toward) and buyers (so they understand what a tier label means).

**What the visitor understands after seeing it**:

Tiers are not permanent achievements. They reflect current score. The progression is earned through behavior — there is no shortcut. The difference between NEW and ESTABLISHED is primarily a few completed transactions with positive outcomes.

**Information conveyed**:

Four labeled stages on a scale:
- NEW (0–39): "Verified identity. No transaction history yet."
- ESTABLISHED (40–59): "Growing transaction history. Positive early ratings."
- TRUSTED (60–79): "Substantial history. Consistent positive performance."
- PREMIUM (80–100): "Extensive history. High ratings. High reliability over time."

Two arrows:
- Forward arrow (behavior increases score): "Fulfilled orders, positive ratings, consistent reliability"
- Backward arrow (behavior can lower score): "Unfulfilled orders, negative ratings, declining reliability"

Critical annotation: "Tiers recalculate based on current score. Performance decline will lower tier."

**Placement**: `/for/farmers` page. `/trust` page.

**Visual structure**: Left-to-right linear scale with four labeled zones. Color progression from `text-disabled` to `accent-green` as tiers increase.

---

### 4. Marketplace Order Lifecycle

**File**: `OrderLifecycleDiagram.tsx`

**Purpose**: Show the complete lifecycle of a marketplace order including all status states, transitions, and actors responsible at each step.

**Audience**: Farmers and buyers who want to understand what happens to an order from placement to completion, including failure branches.

**What the visitor understands after seeing it**:

An order passes through discrete states. Different actors control the transition at each state. There are branch points where the order can stall or fail. Both parties have actions they must take.

**Information conveyed**:

States (vertical flow, left actor column, right actor column):
- PENDING — waiting for buyer payment
- [Branch] → STK Push timeout → remains PENDING or cancelled
- PAID — Safaricom confirmed payment
- DISPATCHED — farmer confirmed dispatch
- RECEIVED — buyer confirmed receipt
- COMPLETED — both ratings available
- [Branch from PAID] → farmer non-dispatch → admin escalation path
- [Branch from DISPATCHED] → auto-complete window if buyer does not confirm

Actor labels at each transition:
- PENDING → PAID: Buyer (M-Pesa PIN) + Safaricom (confirmation)
- PAID → DISPATCHED: Farmer
- DISPATCHED → RECEIVED: Buyer
- RECEIVED → COMPLETED: System (automatic after receipt confirmation)

**Placement**: `/for/farmers` page, `/for/buyers` page.

**Visual structure**: Vertical flowchart with two side columns (Farmer actions, Buyer actions) and central status states.

---

### 5. Farmer Verification Lifecycle

**File**: `FarmerVerificationDiagram.tsx`

**Purpose**: Show what happens from the moment a farmer submits verification documents to the moment they can create listings.

**Audience**: Farmers who are about to start verification and want to understand the process.

**What the visitor understands after seeing it**:

The verification process has defined states. The farmer has things to do and then waits. The administrator reviews. The outcome is binary. Rejection is correctable. They can see exactly what will happen before it happens.

**Information conveyed**:

States:
1. Farmer submits documents
2. Status → PENDING
3. Administrator reviews (no action available to farmer during this period)
4. [Branch] → APPROVED → SMS sent → farmer can create listings
5. [Branch] → REJECTED → SMS with reason sent → farmer can resubmit with corrections

Documents required at Step 1 (annotated):
- National ID or passport
- Land documentation (title deed, lease, or signed tenancy letter)
- Produce photograph

What farmer can do at each state:
- PENDING: nothing (waiting for review)
- APPROVED: create listings, access price intelligence, use AI Farm Assistant
- REJECTED: read rejection reason, correct documentation, resubmit

**Placement**: `/for/farmers` page, Verification section.

**Visual structure**: Simple linear flow with two branches at the decision point. Narrow, vertical. Annotations on each state.

---

### 6. M-Pesa Payment Flow

**File**: `MpesaPaymentDiagram.tsx`

**Purpose**: Show exactly what happens during a payment — which system does what, and what UmojaHub never receives.

**Audience**: Buyers who want to understand what happens to their M-Pesa PIN. Farmers who want to understand when and how they know payment has been confirmed.

**What the visitor understands after seeing it**:

UmojaHub does not receive the buyer's PIN. The PIN goes from the buyer's device to Safaricom. UmojaHub receives only a confirmation. The buyer's financial credentials never pass through UmojaHub's systems.

**Information conveyed**:

Three actors in columns: UmojaHub | Safaricom | Buyer

Sequence:
1. UmojaHub → Safaricom: "Initiate STK Push (buyer phone number, amount)"
2. Safaricom → Buyer phone: "STK Push notification"
3. Buyer → Safaricom: "Enter PIN (on device)"
4. Safaricom → UmojaHub: "Payment confirmed callback"
5. UmojaHub → system: "Order status → PAID"
6. UmojaHub → Farmer: "SMS: order paid, ready to dispatch"

Annotation on Step 3: "UmojaHub never receives the buyer's PIN. The PIN goes from buyer device to Safaricom directly."

**Placement**: `/for/buyers` page, `/how-it-works` page.

**Visual structure**: Three-column sequence diagram. Horizontal arrows between columns for each step.

---

## EDUCATION HUB DIAGRAMS

---

### 7. Project Lifecycle (Education Hub)

**File**: `ProjectLifecycleDiagram.tsx`

**Purpose**: Show the complete lifecycle of a student project from track selection to portfolio publication, including all branches.

**Audience**: Students who want to understand the process before starting. Employers who want to understand how a portfolio entry was produced.

**What the visitor understands after seeing it**:

A portfolio entry passes through multiple human review stages before it is published. There are multiple points where the project can return to the student for revision. DENIED is a possible outcome. The process has defined states, not a black box.

**Information conveyed**:

States (vertical flow):
1. Student selects track (AI_BRIEF or OPEN_SOURCE)
2. Brief generated (AI_BRIEF) or repository submitted (OPEN_SOURCE)
3. Student produces three documents + code
4. Student submits → Hash created and recorded
5. Peer review queue → Peer assigned → Peer submits score and commentary
6. Lecturer queue → Lecturer reviews
7. [Branch] → VERIFIED → portfolio updated
8. [Branch] → REVISION_REQUIRED → feedback returned → student revises → resubmit (loops back to step 3)
9. [Branch] → DENIED → project closed → student may start new project

Actors annotated at each step:
- Steps 1–4: Student
- Steps 3–4: System (hash creation)
- Step 5: Peer reviewer (identified, registered)
- Step 6–7/8/9: Verified lecturer

**Placement**: `/for/students` page. `/education` page.

**Visual structure**: Vertical flow with three terminal branches. Side annotations for actors.

---

### 8. Evidence Lifecycle and Authenticity Chain

**File**: `EvidenceLifecycleDiagram.tsx`

**Purpose**: Show how evidence is created, preserved, and verified — specifically the hash mechanism and audit log.

**Audience**: Employers who want to understand how to verify authenticity. Students who want to understand what the hash means.

**What the visitor understands after seeing it**:

The document hash is created at submission and compared against what is visible in the portfolio. If the documents were altered after submission, the hashes would not match. An employer can independently verify this comparison.

**Information conveyed**:

Linear flow with two branches converging at verification point:

Branch A (at submission):
- Student submits documents
- System creates SHA-256 hash of document content
- Hash + timestamp stored in audit log

Branch B (at employer verification):
- Employer downloads documents from portfolio
- Employer runs SHA-256 hash on downloaded documents

Convergence:
- Hashes match → documents are authentic (not altered after submission)
- Hashes do not match → documents were altered after submission

Critical annotation: "UmojaHub makes the hash visible in the portfolio. The employer runs the comparison independently — they do not need to trust UmojaHub's comparison."

**Placement**: `/for/employers` page. `/for/students` page (Trust section). `/trust` page.

**Visual structure**: Y-shaped convergence diagram. Two parallel paths (submission-time, verification-time) converging at the comparison step.

---

### 9. Review Chain and Trust Transfer

**File**: `ReviewChainDiagram.tsx`

**Purpose**: Show how trust is created by and transferred through the review chain — from UmojaHub verifying the lecturer to the employer trusting the portfolio entry.

**Audience**: Employers who want to understand what "VERIFIED" actually means and where the trust in that label comes from.

**What the visitor understands after seeing it**:

Trust in a portfolio entry is not asserted by the platform. It is constructed from a chain of verified decisions. Every link in the chain can be independently checked. The employer does not need to trust UmojaHub's word — they can trace the chain.

**Information conveyed**:

Vertical chain:
1. UmojaHub administrator → Lecturer: "verified credentials (academic/professional)"
2. Lecturer → Student submission: "VERIFIED decision with substantive commentary"
3. Student submission → Portfolio entry: "published with verification metadata"
4. Portfolio entry → Employer: "readable, linkable, hash-verifiable"

At each link, what is verifiable:
1. Lecturer verification: "visible in lecturer profile"
2. Decision: "timestamped, named reviewer"
3. Documents: "hash-verifiable"
4. Portfolio: "public URL, no registration required"

**Placement**: `/for/employers` page (primary). `/trust` page.

**Visual structure**: Vertical chain with four links. Each link shows what can be independently verified.

---

### 10. Peer Review and Quality Gate

**File**: `PeerReviewDiagram.tsx`

**Purpose**: Show what peer review is, why it exists, and how it connects to lecturer review.

**Audience**: Students who want to understand what peer review involves and why it is mandatory.

**What the visitor understands after seeing it**:

Peer review is not a formality. It is a structured quality assessment on four specific dimensions by an identified reviewer. The lecturer sees the peer score before reviewing. Peer review raises the quality floor — lecturers review submissions that have already passed a structured assessment.

**Information conveyed**:

Two-phase flow:

Phase 1 — Peer Review:
- Submission enters peer queue
- Peer receives: brief, three documents, rubric (four dimensions)
- Peer scores: Clarity, Methodology, Documentation Quality, Reflection Depth (1–5 each)
- Peer submits commentary
- Score locked

Phase 2 — Lecturer Review:
- Submission enters lecturer queue
- Lecturer receives: brief, three documents, rubric, peer score + commentary
- Lecturer reviews independently (peer score informs, does not determine)
- Lecturer decision: VERIFIED / REVISION_REQUIRED / DENIED

Critical annotation: "Peer score locked before lecturer sees submission. Lecturer cannot retroactively influence peer score."

**Placement**: `/for/students` page. `/for/lecturers` page.

**Visual structure**: Two-phase horizontal flow with transition point between phases.

---

## CROSS-PLATFORM DIAGRAMS

---

### 11. Platform Identity Architecture

**File**: `IdentityArchitectureDiagram.tsx`

**Purpose**: Show how identity is anchored and maintained across both hubs — who is verified, by whom, how, and what it enables.

**Audience**: Any visitor who wants to understand the verification system at the platform level rather than within a single hub.

**What the visitor understands after seeing it**:

Both hubs share a common identity verification model: a human administrator reviews submitted documents. Verification enables different things in each hub. Identity verification is the precondition for participation in both systems.

**Information conveyed**:

Two parallel columns (Food Hub | Education Hub) with a shared foundation:

Shared foundation:
- User registers (email + role)
- Administrator reviews submitted credentials

Food Hub column (after admin review):
- Farmer: identity + land documents → can list produce
- Supplier: business registration + regulatory certs → appears in supplier directory
- Lecturer is not in this hub

Education Hub column (after admin review):
- Student: registration only (no admin review required for submission)
- Peer: registration (no admin review required, but review quality tracked)
- Lecturer: academic/professional credentials → can issue verification decisions

What verification enables at each level:
- Food Hub farmer: listing access, Trust Score accumulation
- Food Hub supplier: directory inclusion, group order access
- Education Hub lecturer: ability to issue VERIFIED decisions

**Placement**: `/trust` page. `/how-it-works` page.

**Visual structure**: Horizontal two-column layout with shared base. Each column shows the verification path for the hub's key actors.

---

### 12. Role Interaction Map

**File**: `RoleInteractionDiagram.tsx`

**Purpose**: Show every role on the platform and who each role interacts with directly versus through the system.

**Audience**: Visitors who want to understand the platform's actor topology before committing to any one page.

**What the visitor understands after seeing it**:

Nine roles interact in specific, bounded ways. Not all roles interact with each other. The Administrator role is the trust anchor for both hubs. The Buyer and Employer roles are consumers of trust evidence, not producers. The Farmer, Student, Peer, Lecturer roles are producers of trust evidence.

**Information conveyed**:

Node-edge graph:
- Administrator (central, connected to: Farmer verification, Supplier verification, Lecturer verification, Dispute escalation)
- Farmer (connected to: Listing system, Trust Score, Cooperative Group, AI Farm Assistant)
- Buyer (connected to: Listing system, Payment System, Rating system)
- Cooperative Group (connected to: Farmer cluster, Supplier)
- Supplier (connected to: Cooperative Group, Administrator)
- Student (connected to: Brief system, Submission system, Peer reviewer, AI Mentor)
- Peer (connected to: Submission queue, Review system)
- Lecturer (connected to: Review queue, Decision system)
- Employer (connected to: Portfolio system — read only, no writes)

**Placement**: `/how-it-works` page. Possibly `/about` page.

**Visual structure**: Force-directed node-edge graph, statically rendered as SVG. No animation beyond scroll-trigger fade-in.

---

## DIAGRAM BUILD SEQUENCE

Build diagrams in this order — earlier diagrams inform later page content, and later diagrams depend on earlier pages being built first.

1. TrustScoreDiagram — needed for `/for/farmers` page (Sprint 2)
2. TrustTierDiagram — needed for `/for/farmers` page (Sprint 2)
3. FarmerVerificationDiagram — needed for `/for/farmers` page (Sprint 2)
4. OrderLifecycleDiagram — needed for `/for/farmers` and `/for/buyers` pages (Sprint 2)
5. ProjectLifecycleDiagram — needed for `/for/students` page (Sprint 2)
6. PeerReviewDiagram — needed for `/for/students` and `/for/lecturers` pages (Sprint 2)
7. EvidenceLifecycleDiagram — needed for `/for/employers` page (Sprint 3)
8. ReviewChainDiagram — needed for `/for/employers` page (Sprint 3)
9. MpesaPaymentDiagram — needed for `/for/buyers` and `/how-it-works` pages (Sprint 3)
10. FoodHubEcosystemDiagram — needed for homepage and `/how-it-works` (Sprint 3)
11. IdentityArchitectureDiagram — needed for `/trust` page (Sprint 3)
12. RoleInteractionDiagram — needed for `/how-it-works` page (Sprint 3)
