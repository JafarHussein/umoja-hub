# Diagram Inventory
**Status:** Phase 0 — Complete inventory before Figma work begins
**Authority:** Every diagram that will appear on the website must be inventoried here before it is designed. No diagram enters the Figma file without a prior entry in this document.
**Rule:** Diagrams are not decoration. Every diagram must be the clearest way to communicate something that prose cannot.

---

## HOW TO READ THIS INVENTORY

Each entry contains:
- **ID**: reference identifier
- **Name**: what the diagram is called
- **Page**: which page it appears on
- **Section**: which section of that page
- **Purpose**: what the diagram explains that prose cannot
- **Actors / elements**: what must appear in it
- **Complexity level**: Simple / Medium / Complex (affects Phase 3 effort estimate)
- **Prose alternative**: what the site shows if the diagram fails to load or is not yet complete

---

## CATEGORY 1 — PLATFORM ARCHITECTURE

### D01 — Platform Overview Diagram
**Page:** Homepage
**Section:** Section 3 — Verification Philosophy
**Purpose:** Shows the relationship between the two hubs and the shared verification spine. The visitor should understand in one glance that UmojaHub is not two separate products but one infrastructure serving two use cases.
**Must show:**
- The two hubs (Food Security Hub, Education Hub)
- The shared verification layer that serves both
- The verification outputs (Trust Score for farmers, Portfolio Verified for students)
- The human decision-makers (administrators, lecturers) as the trust anchor
**Must NOT show:**
- Technical implementation details
- Database architecture
- API endpoints
- Code
**Complexity:** Medium
**Prose alternative:** "Both hubs share a single trust infrastructure — human administrators review farmers, human lecturers review students. The verification philosophy is identical."

---

### D02 — Trust Architecture Diagram (Detailed)
**Page:** /trust
**Section:** Section 1 — Overview
**Purpose:** Shows the full trust architecture — how trust is created, transferred, and accumulated across both hubs. This is for visitors who want the complete picture, not the homepage summary.
**Must show:**
- Trust creation points (admin approval, transaction completion, lecturer decision)
- Trust transfer paths (admin → verified farmer → buyer confidence; admin → lecturer → verified student → employer confidence)
- Trust accumulation over time (Trust Score builds with transactions)
- The human anchor at each trust creation point
**Complexity:** Complex
**Prose alternative:** Full prose in Section 2 and Section 3 of /trust.

---

## CATEGORY 2 — FOOD SECURITY HUB FLOWS

### D03 — Farmer Verification Flow
**Page:** /for/farmers, /trust
**Section:** /for/farmers Section 2, /trust Section 2
**Purpose:** Shows the farmer's path from registration through verification to active listing. Removes the anxiety of the unknown — the farmer sees every step before committing.
**Must show:**
- Registration
- Document submission (what three documents)
- Administrator review
- Decision (APPROVED / REJECTED)
- REJECTED path: reason → resubmit
- APPROVED path: listing creation → marketplace visibility
**Must NOT show:**
- Internal admin interface details
- Document storage infrastructure
**Complexity:** Simple
**Prose alternative:** The step-by-step list in Section 2 of /for/farmers.

---

### D04 — M-Pesa Payment Flow
**Page:** /for/farmers (Section 4), /for/buyers (Section 3)
**Purpose:** Shows the exact sequence of events in an M-Pesa payment. Critical for trust — buyers and farmers need to understand that payment is confirmed before dispatch, and that the platform never holds payment credentials.
**Must show:**
- Buyer places order
- Platform initiates STK Push → Safaricom → Buyer's phone
- Buyer enters M-Pesa PIN (on their device — not on the platform)
- Safaricom confirmation → UmojaHub callback
- Order status: PENDING → PAID
- Farmer receives SMS
- Farmer dispatches
- Buyer marks RECEIVED
- Both rate
**Must show clearly:**
- The boundary between what UmojaHub holds (order record, payment confirmation) and what Safaricom holds (payment credentials, PIN)
**Failure path:**
- STK Push timeout / buyer decline → order stays PENDING → no money moved
**Complexity:** Medium
**Prose alternative:** The step-by-step payment flow text in Section 4 of /for/farmers.

---

### D05 — Trust Score Anatomy Diagram
**Page:** /trust (Section 1), /for/farmers (Section 3)
**Purpose:** Shows the four components of the Trust Score, their weights, and how they combine into a tier. Buyers use this to understand what they're reading. Farmers use this to understand how to build score.
**Must show:**
- Four components (Verification Status, Transaction Volume, Buyer Ratings, Order Reliability)
- Visual weight distribution
- The four tiers (NEW → ESTABLISHED → TRUSTED → PREMIUM)
- What score range corresponds to each tier
**Must NOT show:**
- The exact algorithm formula (show the components and weights, not the computation)
**Complexity:** Medium
**Prose alternative:** Section 1 of /trust.

---

### D06 — Trust Score Over Time (Illustrative)
**Page:** /for/farmers (Section 3) or /trust
**Purpose:** Shows a hypothetical farmer's Trust Score building from NEW through PREMIUM over time, illustrating what kinds of activity build score. This is illustrative — not a real farmer's data.
**Must show:**
- Timeline axis (not real dates — "Month 1, Month 3, Month 6, Month 12")
- Score axis (0–100)
- Key events marked on the timeline (first listing, first order, first rating, first 10 orders, etc.)
- Tier thresholds as horizontal bands
**Must be clearly labeled:** "Illustrative example — not a real farmer"
**Complexity:** Simple
**Prose alternative:** The Trust Score section explains components; this diagram is supplementary.

---

### D07 — Ecosystem Map: Food Security Hub
**Page:** /for/farmers or a dedicated ecosystem section on the homepage
**Purpose:** Shows all participants in the Food Security Hub and their relationships — who connects to whom, what flows between them.
**Must show:**
- Farmers
- Buyers
- Suppliers
- Cooperative Groups
- Platform Administrators
- Safaricom / M-Pesa (as external actor)
- Arrows labeled with what flows between participants (produce listings, payment, ratings, documents, verification decisions, input orders)
**Must NOT show:**
- Technical implementation
- Internal database tables
**Complexity:** Complex
**Prose alternative:** FOOD_HUB_ECOSYSTEM_MAP.md sections (condensed for the website).

---

### D08 — Cooperative Group Order Flow
**Page:** /for/cooperatives, /for/farmers (Section 5)
**Purpose:** Shows how a collective input order works — from group formation through supplier fulfillment.
**Must show:**
- Farmers forming a group
- Group nominates supplier
- Supplier is in verified directory (precondition)
- Collective order placed
- Supplier fulfills
- Payment coordinated through group
**Complexity:** Simple
**Prose alternative:** Section 5 of /for/farmers.

---

### D09 — Price Intelligence Flow
**Page:** /for/farmers (Section 1 — What Farmers Get)
**Purpose:** Shows how market price data flows to the farmer — where the benchmark data comes from, how it relates to the farmer's listed price.
**Must show:**
- Market benchmark data source
- Ten major Kenyan crops in scope
- Farmer's listed price
- The comparison view the farmer sees
- Price alert threshold configuration
**Complexity:** Simple
**Prose alternative:** Bullet in Section 1 of /for/farmers.

---

## CATEGORY 3 — EDUCATION HUB FLOWS

### D10 — Evidence Chain Diagram
**Page:** /for/students (Section 2), /for/employers (Section 2), /trust (Section 3)
**Purpose:** The most important Education Hub diagram. Shows how credibility is constructed step by step — from submission hash through peer review through lecturer review to the employer's independent verification. This is the chain an employer follows when evaluating a portfolio.
**Must show:**
- Student submits three documents
- Platform creates SHA-256 hash at submission
- Peer reviewer receives documents (hash already locked)
- Peer scores and locks their review
- Lecturer receives documents + peer score
- Lecturer issues decision (VERIFIED / REVISION_REQUIRED / DENIED)
- Portfolio entry records: reviewer name, credentials, decision, date, hash
- Employer: reads documents, sees reviewer credentials, can verify hash independently
**Must clearly show:**
- What cannot be altered after submission (the hash is the lock)
- What the employer can independently verify
**Complexity:** Complex
**Prose alternative:** Section 2 of /for/employers and Section 3 of /trust.

---

### D11 — Three Documents Diagram
**Page:** /for/students (Section 2)
**Purpose:** Shows what the three documents are and what each one reveals about the student. Helps students understand why three specific documents — not just code.
**Must show:**
- Problem Breakdown: domain understanding, problem decomposition
- Approach Plan: planning discipline, pre-execution thinking
- Final Reflection: professional thinking quality, self-assessment accuracy
- Code / repository: supplementary
- The progression: what reviewers look for in each
**Complexity:** Simple
**Prose alternative:** Section 2 of /for/students.

---

### D12 — Review Process Flow (Education Hub)
**Page:** /for/students (Section 3), /trust (Section 3)
**Purpose:** Shows the complete path a student submission takes from submission to portfolio publication, including REVISION_REQUIRED path.
**Must show:**
- Submission
- Hash creation (timestamp)
- Peer review assignment
- Peer review completion (score locked)
- Lecturer queue entry
- Lecturer review
- Three decision branches:
  - VERIFIED → Portfolio publishes immediately → permanent
  - REVISION_REQUIRED → Feedback returned → Student revises → Re-enters peer review? or goes directly back to lecturer? → [architecture question]
  - DENIED → Does not appear in portfolio → Can start new project
- Audit log preservation at every step
**Complexity:** Medium
**Prose alternative:** Section 3 of /for/students.

---

### D13 — Rubric Visualization
**Page:** /trust (Section 3), /for/students (Section 3), /for/lecturers (Section 1)
**Purpose:** Shows the four review dimensions and what each 1–5 score represents for each dimension.
**Must show:**
- Four dimensions in parallel columns
- Score scale (1–5) with labels at each level
- Brief description of what each level looks like in practice
**Complexity:** Medium
**Prose alternative:** Section 3 of /trust.

---

### D14 — Portfolio Entry Anatomy
**Page:** /for/employers (Section 1)
**Purpose:** Shows exactly what an employer sees in a portfolio entry. Reduces friction — an employer who knows what they're looking at before they open the page reads it more effectively.
**Must show:**
- Project title
- Track (Agriculture / Health / Finance / Infrastructure)
- Brief type (AI_BRIEF / OPEN_SOURCE)
- Verification date
- Reviewer name and institutional affiliation
- Peer score
- Skills demonstrated
- Three documents (linked)
- Document hash (visible, with instructions for independent verification)
**Must be clearly labeled:** "Example portfolio entry — not a real student"
**Complexity:** Simple (screenshot / annotated mockup style)
**Prose alternative:** Section 1 of /for/employers.

---

### D15 — Trust Transfer Chain (Education Hub)
**Page:** /for/employers (Section 2)
**Purpose:** Shows how an employer who has never heard of UmojaHub can trust a portfolio entry — each link in the chain.
**Must show:**
- UmojaHub verifies lecturer credentials
- Lecturer reviews submission against rubric
- Platform preserves document hash
- Portfolio records reviewer name + decision + date
- Employer can: look up reviewer, verify hash, read documents
**Complexity:** Simple (linear chain diagram)
**Prose alternative:** Section 2 of /for/employers.

---

### D16 — Ecosystem Map: Education Hub
**Page:** /education overview page or homepage
**Purpose:** Shows all participants in the Education Hub and their relationships.
**Must show:**
- Students
- Peers (other students as reviewers)
- Lecturers
- Platform Administrators (who verify lecturers)
- Employers (who read portfolios)
- Institutions (indirect participants through their faculty)
- Arrows: what flows between participants
**Complexity:** Complex
**Prose alternative:** EDUCATION_HUB_ECOSYSTEM_MAP.md sections.

---

## CATEGORY 4 — GOVERNANCE DIAGRAMS

### D17 — Administrator Decision Accountability Map
**Page:** /team
**Purpose:** Shows who makes which decisions and what accountability mechanisms govern each decision-maker.
**Must show:**
- Each named administrator
- Which queues they manage
- What criteria govern their decisions
- The appeals pathway (who handles appeals, on what timeline)
**Must be real — no placeholders.**
**Complexity:** Medium
**Note:** This diagram requires real administrator information to be complete. It cannot be finalized in Phase 3 until the team page content is confirmed.

---

### D18 — Appeals Process Flow
**Page:** /trust (Section 4), /team (Section 4)
**Purpose:** Shows exactly what happens when someone appeals a decision — every step, who is involved, what the timeline is.
**Must show:**
- Farmer/student/supplier initiates appeal
- Submission pathway
- Reviewer (fresh administrator)
- Decision timeline (SLA)
- Escalation path if unresolved
- Resolution: decision upheld / decision reversed
**Complexity:** Simple (flowchart)
**Prose alternative:** Section 4 of /trust.

---

## DIAGRAM PRODUCTION SEQUENCE

Phase 1 (Wireframes): All diagrams are placeholders — boxes with titles and content descriptions only.

Phase 2 (Mid-Fi): Diagram content is laid out in rough form — shapes, labels, directional arrows, but not final visual treatment.

Phase 3 (High-Fi): All diagrams designed in final visual language — colors, typography, iconography, annotations.

**Priority order for Phase 3 completion:**

1. D03 — Farmer Verification Flow (appears on the page most farmers land on first)
2. D10 — Evidence Chain Diagram (the most important Education Hub diagram)
3. D04 — M-Pesa Payment Flow (directly addresses buyer trust concern)
4. D05 — Trust Score Anatomy (appears on /trust and /for/farmers)
5. D01 — Platform Overview Diagram (homepage)
6. D12 — Review Process Flow (Education Hub)
7. D14 — Portfolio Entry Anatomy (employer page)
8. D15 — Trust Transfer Chain (employer page)
9. D11 — Three Documents Diagram (student page)
10. D07 — Ecosystem Map: Food Security (complex, reserved for later)
11. D16 — Ecosystem Map: Education (complex, reserved for later)
12. D02 — Trust Architecture Diagram (detailed version for /trust)
13. D06 — Trust Score Over Time (illustrative, low priority)
14. D08 — Cooperative Group Order Flow
15. D09 — Price Intelligence Flow
16. D13 — Rubric Visualization
17. D17 — Administrator Decision Accountability Map
18. D18 — Appeals Process Flow

---

## DIAGRAM DESIGN CONSTRAINTS (TO BE RESOLVED IN PHASE 3)

These questions must be answered before diagram visual design begins:

1. **Visual language:** Are diagrams illustrative (custom illustration style) or schematic (clean technical diagrams)? This is a Phase 3 visual identity decision.
2. **Color usage in diagrams:** Can diagrams use colors beyond the brand palette? (e.g., green = approved, red = rejected, amber = pending)
3. **Level of detail:** Do ecosystem maps show actor portraits/icons or abstract shapes?
4. **Interactivity:** Do any diagrams have hover states or expand-on-click behavior? (Phase 4 prototype decision)
5. **Mobile versions:** Do complex diagrams (D02, D07, D16) have simplified mobile variants, or do they scroll horizontally?
