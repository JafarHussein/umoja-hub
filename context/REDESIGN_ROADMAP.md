# UmojaHub — Official UI/UX Redesign Roadmap

**Version:** 2.0 — Onboarding Architecture Edition
**Date:** 2026-05-31
**Status:** Active — Implementation Blueprint
**Scope:** Full platform redesign — website, Food Security Hub, Education Hub, design system, onboarding architecture
**Constraint:** Backend APIs, database schemas, and business logic are frozen unless explicitly marked as `[BACKEND REQUIRED]`.

---

## DOCUMENT PURPOSE

This document is the single source of truth for the UmojaHub UI/UX redesign. A new designer or developer joining the project should be able to read this document and understand: what exists, what is being redesigned, why, in what order, and what success looks like at each stage.

Do not implement anything without consulting this document first.
Do not make design decisions not covered by this document without updating it first.

---

## CRITICAL PRODUCT DECISION — AUTHENTICATION PHILOSOPHY

> **This section documents a product-level decision that affects both frontend and backend. Read before implementing anything in the auth or onboarding systems.**

### The Problem with the Current Registration Flow

The current `/auth/register` page collects 7 fields in a single form before a user can access anything:

```
firstName, lastName, email, password, phoneNumber, role, county
```

This is registration fatigue. A farmer who arrived from a WhatsApp link, curious about the platform, is immediately confronted with a wall of fields before they have seen a single reason to trust the platform with their information.

**The data confirms the risk:** Every field added to a registration form reduces completion rate. Seven required fields before any value is delivered is a conversion-destroying pattern for the target demographic.

### The New Philosophy: Experience First, Data When Needed

The new flow:

```
Landing Page
  → Authenticate (minimal friction)
  → Select role
  → Enter platform immediately
  → Guided, progressive onboarding
  → Data collected only when it unlocks specific value
  → Dashboard fully accessible
```

Users experience the platform before they are asked to invest in it.

### Authentication Method Decision

**Current backend:** NextAuth v4, CredentialsProvider only (email + password).

**Required change:** Add lightweight authentication options. Recommended priority:

1. **[BACKEND REQUIRED] Email Magic Link (OTP)** — SendGrid is already configured as an env var. A user enters their email, receives a 6-digit code or magic link, and is authenticated. No password to forget, no password to enter. This is the single highest-impact auth improvement for the target demographic.

2. **[BACKEND REQUIRED] Google OAuth** — One-tap authentication for users with Google accounts. Particularly relevant for students and lecturers who use institutional Google accounts.

3. **Retain Email + Password** — Keep as an option, not the default. Some users prefer it.

**Implementation note for backend:** Adding Google OAuth and magic link to NextAuth v4 requires:
- Adding `GoogleProvider` and `EmailProvider` to `src/lib/auth/options.ts`
- Adding `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `EMAIL_SERVER` to `src/lib/env.ts` required vars
- Updating the User model: make `hashedPassword` fully optional (currently it is `select: '+hashedPassword'` but the field itself may be required in the schema)
- Handling the case where an OAuth user has no `hashedPassword` in the `authorize` callback

These are small, contained backend changes. They do not affect any existing API routes.

**If the backend change cannot be made immediately:** The progressive onboarding wizard can be built on top of the existing email+password auth. The UX improvement is significant even with the current auth method — the wizard replaces the single form with a step-by-step flow. The auth method is orthogonal to the onboarding architecture.

---

## PART 1 — CURRENT STATE ANALYSIS

### Foundational Observation

The existing implementation has **capability without communication.** The platform can verify a farmer, process an M-Pesa payment atomically, generate a cryptographically signed student credential, and manage a 6-stage review pipeline. None of these capabilities are legible to the user. The trust architecture exists in the database. It does not exist in the interface.

The redesign is not primarily a visual project. It is a communication project.

---

### Food Security Hub — Current State Assessment

#### Capabilities (Confirmed in Codebase)

- Farmer self-registration with role assignment
- Document-based farmer verification: submit → admin review → approve/reject
- FarmerTrustScore: 4-component model (verification 40pts, transactions, ratings, reliability)
- Trust tier system: NEW → ESTABLISHED → TRUSTED → PREMIUM with 0–100 composite score
- Marketplace listings: create, browse (paginated, multi-filter), ISR cached at 60 seconds
- Marketplace listing detail page at `/marketplace/[listingId]`
- M-Pesa STK Push with atomic inventory reservation (race condition safe)
- Daraja webhook: idempotent payment confirmation, inventory rollback on failure
- Order lifecycle: 6-state machine
- Buyer ratings: orderId-unique, triggers async trust recalculation
- Knowledge Hub: ISR articles, category/tag filters, admin CMS
- AI Farm Assistant: Groq LLaMA3, per-session history, 30-day TTL
- Price alerts: cron-checked daily, SMS triggered on match
- PriceHistory records at listing and order events
- Verified Supplier directory: admin-managed, filterable
- Admin operations: 5 tools (verification queues, CMS, analytics)

#### Weaknesses With User Impact

**W1: The verification waiting experience is a void.**
After submitting documents, the farmer enters 24–48 hours with a blank dashboard and no acknowledgment. This is the highest drop-off risk moment. A blank screen after a meaningful action communicates indifference.

**W2: The trust tier is a label without explanation.**
ESTABLISHED, TRUSTED, PREMIUM appear in the UI but are never explained. A buyer cannot make a confident purchasing decision from a label alone. The trust architecture is invisible.

**W3: Farmers cannot manage listings post-creation.**
No edit or delete routes. Agricultural pricing is volatile. A platform that cannot accommodate price changes is a static catalogue, not an operational tool.

**W4: The marketplace has no buyer orientation.**
First-time buyers arrive to a listing grid with no explanation of what "verified" means, how M-Pesa payment works, or why they should trust the platform. The marketplace assumes context buyers do not have.

**W5: No onboarding flow exists for any role.**
Every role enters a dashboard that assumes context the user does not have. No first-time experience layer. No guided next action.

**W6: The buyer has no home.**
Buyers land on `/dashboard/buyer/orders` — an empty list if they have never ordered. The bridge between dashboard and marketplace does not exist.

**W7: Mobile navigation is broken.**
Sidebar hidden below 768px with no replacement. No hamburger. The application does not function on mobile, which is the primary device for the target demographic.

**W8: Error states are absent.**
No error boundaries. Network failures crash components. Intermittent connectivity is a normal operating condition in Kenya, not an edge case.

---

### Education Hub — Current State Assessment

#### Capabilities (Confirmed in Codebase)

- Two-track project creation: AI_BRIEF (GPT-4o) and OPEN_SOURCE (GitHub)
- BriefContextLibrary: 8 industry contexts, admin-manageable
- 6-stage project status machine with correct transition guards
- Process document submission: 3 structured documents
- SHA-256 document hashing stored in VerificationAuditLog
- Blocker log and AI usage log (running records)
- Peer review: scored, compare-and-swap status guard
- Lecturer review: 4-dimensional, VERIFIED/REVISION_REQUIRED/DENIED
- VerificationAuditLog: immutable record
- LecturerEffectiveness tracking
- StudentPortfolioStatus aggregation
- Admin lecturer verification
- AI Mentor chat: Groq-backed, session-aware

#### Weaknesses With User Impact

**W1: The pipeline is a status badge, not a journey.**
A student in stage 4 of 6 sees a text badge. No understanding of who has their project, what comes next, or how long to expect.

**W2: REVISION_REQUIRED has no designed response.**
The most important feedback moment — a professional academic reviewed their work — is surfaced as a badge change. The feedback that may be the most valuable thing the platform produces for a student is buried in a tab.

**W3: The portfolio credential does not exist as a designed surface.**
The `verificationUrl` field exists in the data model. The public credential page is not confirmed as a designed, implemented route. The entire value proposition of the Education Hub is undeliverable.

**W4: The AI usage log is invisible.**
Students document every AI tool used during development. This is the platform's most forward-thinking feature and its clearest differentiator. It is completely invisible in the UI. Students do not understand why they are logging it.

**W5: The lecturer review interface lacks reading support.**
A tabbed interface presents everything at equal weight. A lecturer reviewing 3000 words of process documentation has no structural support. Review quality is constrained by interface quality.

---

## PART 2 — PRODUCT VISION

### The Design Philosophy

**UmojaHub should feel like a well-run institution that trusts you.**

Not a startup. Not a government portal. Not enterprise software. An institution in the best sense: a structure that exists to serve a mission, serious about what it does, treating every person with dignity.

### The Three Emotional Registers

**Website:** Patient, specific, honest. Does not rush to the CTA. Earns trust before asking for anything. A farmer reads it and feels: *"These people understand my situation."*

**Food Security Hub:** A reliable business tool that respects your time. Immediate clarity about what to do and what has happened. The farmer feels: *"I know exactly where I stand."*

**Education Hub:** Institutional rigor that takes the student seriously. The process feels genuinely demanding in the way that a real credential must be. The student feels: *"This process was worth my time."*

### The Single Design Sentence

Every design decision is evaluable against:

> **"Does this help the person in front of this screen understand their situation and know what to do next?"**

### What to Explicitly Avoid

| Avoid | Instead |
|---|---|
| Growth hacking language ("Join thousands of...") | Exact, current numbers |
| Fake urgency | No urgency — the product earns action |
| Feature-first communication | Problem-first, outcome-focused |
| Complexity as credibility signal | Clarity as the highest form of competence |
| Generic "AI-powered" claims | Name the model, explain the constraint, show the output |
| Asking for data before explaining why it is needed | Trust before data — always |

---

## PART 3 — ONBOARDING ARCHITECTURE AND PROGRESSIVE TRUST FRAMEWORK

> **This is a foundational pillar of UmojaHub's UX strategy. Every auth and onboarding implementation decision defers to this section.**

### The Principle: Trust Before Data

The platform must earn every piece of information it collects. Before asking for sensitive or personal information, the platform must:

1. Explain why the information is needed
2. Explain what functionality it unlocks
3. Explain how the user benefits from providing it

This is not a legal requirement. It is a trust requirement. A platform that asks for information without explanation communicates that it does not respect the user's right to understand what they are consenting to.

### Research: What Works — Extracted Principles

The following platforms were studied not to be copied, but to extract principles transferable to UmojaHub's specific context.

**Duolingo:**
- One concept per screen. Never more than one decision per step.
- Progress indicator creates commitment and motivates completion.
- Celebrates each step, not just the final outcome.
- Explains value before asking for investment.
- Never shows a blank or empty state.

*Transferable to UmojaHub:* Each onboarding step is a single screen with one primary question or action. Progress is visible throughout. Each completed step unlocks something immediately visible.

**Notion:**
- Gets you into the product within 30 seconds of account creation.
- Onboarding is embedded in the product, not a separate wizard you must escape.
- Templates reduce blank-slate anxiety — you are never starting from zero.
- Import from existing tools reduces the cost of switching.

*Transferable to UmojaHub:* After authentication and role selection, users enter the platform immediately. Onboarding continues inside the product as guided prompts, not as a blocking wizard.

**Stripe:**
- Shows exactly what each step enables before the user completes it.
- Verification is staged: start with basic information, add detail as capabilities unlock.
- Explains the regulatory or trust reason for each data request.
- Test mode before live mode — Stripe lets you use the product before you can process real payments.

*Transferable to UmojaHub:* Farmers can see the marketplace, price intelligence, and knowledge content before submitting verification documents. The platform shows what verification unlocks before asking for it.

**Linear:**
- Opinionated defaults reduce decision fatigue.
- Gets you to your first meaningful action in under 2 minutes.
- Does not ask about everything upfront — discovers preferences through use.

*Transferable to UmojaHub:* Role-specific defaults mean the platform makes reasonable assumptions rather than asking about everything. A student who has not specified their institution yet gets a default experience, not a blocked experience.

**Ramp:**
- Role-aware from the first screen.
- Shows what unlocks at each step of the verification journey.
- The waiting period after submitting documents is productive — you can see what you will be able to do.

*Transferable to UmojaHub:* The farmer's verification waiting state is not a blank screen — it is a preview of what becomes available after verification, with a specific timeline.

**Airbnb Host Onboarding:**
- Conversational framing: "Tell us about your farm" not "Enter farm information."
- Shows a preview of the result throughout the process.
- Celebrates meaningful milestones.
- Never asks for information without showing what it produces.

*Transferable to UmojaHub:* Each onboarding step shows a preview of the output (a listing card preview, a portfolio credential preview) to motivate completion.

---

### The Authentication Architecture

#### Step 0: Authentication (Pre-Role)

**Minimum viable authentication:**
- Email address only (magic link sent via SendGrid — `[BACKEND REQUIRED]`)
- OR Google Sign-In (`[BACKEND REQUIRED]`)
- OR Email + password (current, retained as fallback)

**What is NOT collected at authentication:**
- Name (not yet)
- Phone number (not yet)
- Role (next step)
- County (later)

**What happens after authentication:**
- New users: Role selection screen
- Returning users with incomplete profiles: Resume onboarding at last completed step
- Returning users with complete profiles: Dashboard

**Technical note:** For new OAuth users (Google), the User model must be created with `hashedPassword: undefined`. The `authorize` function in CredentialsProvider already handles the `!user.hashedPassword` case by denying login — this means OAuth-created users would be denied login via credentials. The auth flow must route OAuth users through the OAuth callback only.

---

### Role Selection Architecture

After authentication, every new user reaches a single role selection screen.

**Design principles for this screen:**
- One decision: which role am I?
- Each role is described in one sentence that describes what the person does, not what the platform offers
- No descriptions that begin with "Access to..." or "Manage your..."

**Role descriptions (conversational framing):**

| Role | Description |
|---|---|
| Farmer | I grow food and want to sell directly to buyers |
| Buyer | I want to buy fresh produce directly from verified farms |
| Student | I am building a technical project and want a verified credential |
| Lecturer | I review student work and issue verified academic decisions |

After role selection, the user enters the platform AND begins role-specific onboarding. These are not sequential — they happen simultaneously. The user is in the product from this point forward.

---

### Farmer Onboarding Journey

**User goal:** Sell produce, receive M-Pesa payments, build a trusted reputation.
**Platform goal:** A verified, active farmer with at least one live listing within 72 hours of registration.

#### Step 1: Your Name and County
*Collected:* `firstName`, `lastName`, `county`
*Why now:* The platform needs to address you and show you relevant content.
*What unlocks:*
- Knowledge Hub (county-relevant articles)
- Price intelligence (county-specific price data)
- Farm Assistant chat

**Screen design:** Conversational heading: "First, tell us who you are." Three fields. County is a searchable dropdown, not a 47-item scroll list. Progress indicator: 1 of 5.

**What the farmer sees after this step:** The platform with Knowledge Hub and price data immediately accessible. A persistent onboarding panel shows the remaining steps and what they unlock.

---

#### Step 2: What Do You Grow?
*Collected:* `farmerData.cropsGrown[]`, `farmerData.primaryLanguage`
*Why now:* So we can personalise your price alerts and Knowledge Hub content.
*What unlocks:*
- Personalised price alerts (set alerts for your specific crops)
- Crop-specific Knowledge Hub content
- Farm Assistant with crop context

**Screen design:** Multi-select chip list of common Kenyan crops. Search field for less common crops. "What else do you grow?" is a secondary option for adding custom crops. Heading: "What do you grow? We'll show you relevant prices and advice."

---

#### Step 3: Your Farm
*Collected:* `farmerData.farmSizeAcres`, `farmerData.livestockKept[]`, contact preference
*Why now:* Buyers who contact you will want to know about your operation. This information helps you appear in relevant searches.
*What unlocks:*
- Listing creation (draft mode — not live until verified)
- Ability to preview how your listing appears to buyers

**Screen design:** Heading: "Tell us about your farm." Three optional fields with the explicit note: "This information will be visible to buyers. You can update it anytime." Farm size with unit selector. Livestock multi-select. Contact preference radio.

---

#### Step 4: Verification Documents
*Collected:* `farmerData.verificationDocuments`
*Why now:* Verification is required before your listings go live and before you can receive M-Pesa payments.
*What unlocks:* Live listings, M-Pesa payments, verified badge on profile.

**This is the most important trust moment in the farmer's onboarding journey. The screen must:**

1. Explain exactly what verification is: "A member of our admin team will review your documents within 48 hours."
2. Explain what is checked: "We verify that you are a real person and a real farmer in the county you specified."
3. Explain what is not shared: "Your documents are reviewed only by our admin team. They are not visible to buyers."
4. Show a specific timeline: "48 hours, Monday–Friday. You will receive an SMS when the review is complete."
5. Show exactly what becomes available after verification (a preview of a live listing card with the verified badge).
6. Provide the document upload interface.

**What the farmer sees after submitting documents:** NOT a blank screen. A designed verification-in-progress state with: a specific timeline, what they submitted, who is reviewing it, and what to do while they wait (draft their listing, explore price data, read Knowledge Hub articles).

---

#### Step 5: Your First Listing
*Collected:* First `MarketplaceListing` record
*Why now:* A listing is the farmer's first value delivery — the action that makes the rest of the platform meaningful.
*What unlocks:* Full marketplace participation, buyer discovery, M-Pesa order creation.

**This step is available in draft mode from Step 3 forward.** The farmer can build their listing while waiting for verification. When verification is approved, the listing is promoted from draft to live with a single confirmation.

**Screen design:** Listing creation form with price guidance: "Tomatoes are currently trading at KES 65–85/kg in Nairobi." The guidance is pulled from PriceHistory data. Preview panel shows the listing card as buyers will see it, updating in real time as the farmer fills in fields.

---

#### Farmer Onboarding Completion State

When a farmer completes all 5 steps:
- The onboarding panel is replaced by an acknowledgment: "Your farm is ready. Your listing is live."
- Trust tier is displayed: "You are now an ESTABLISHED farmer."
- Clear next action: "Your first buyer will see your listing. We'll send you an SMS when an order comes in."

**Profile completion tracking:**
The platform shows a simple completion indicator on the farmer's profile. Not a percentage — a specific item: "Add your livestock to attract buyers looking for eggs and dairy." Specific, contextual prompts rather than a generic progress bar.

---

### Buyer Onboarding Journey

**User goal:** Find verified, fairly priced produce and purchase it safely.
**Platform goal:** A buyer who completes their first order within their first session.

#### Step 1: Your Name
*Collected:* `firstName`, `lastName`
*Why now:* To address you and personalise the marketplace.
*What unlocks:* Full marketplace access.

**Screen design:** Heading: "What should we call you?" Two fields. That is all. After submission, the buyer enters the marketplace immediately. No further blocking steps.

---

#### Step 2: Contact Preference (Contextual, Not Blocking)
*Collected:* `phoneNumber`, notification preference
*When collected:* At order creation, not at onboarding. The buyer provides their phone number when they place their first order because that is when it is needed for M-Pesa payment.
*Why this timing:* Asking for a phone number before a buyer has expressed intent to purchase creates friction with no payoff. Asking for it at the moment of purchase creates no friction — the buyer understands exactly why it is needed.

---

#### Buyer Onboarding Completion State

Buyers are in the product after Step 1. There is no "completion" ceremony — the product is the marketplace. The onboarding is complete when the buyer has placed their first order and received the M-Pesa confirmation.

**First-time buyer experience in the marketplace:**
- A single, dismissible banner explains what "Verified Farmer" means
- A "How to buy" tooltip is available on the CTA button of every listing card
- The first time a buyer clicks "Place Order," a brief 3-screen guide walks them through the M-Pesa payment flow

---

### Student Onboarding Journey

**User goal:** Build a real technical project and receive a verifiable credential.
**Platform goal:** A student with an active project engagement within their first session.

#### Step 1: Institution and Course
*Collected:* `studentData.institution`, `studentData.course`
*Why now:* Personalises the project brief options and connects your credential to your academic context.
*What unlocks:* AI Mentor chat, Knowledge Hub.

**Screen design:** Heading: "Tell us about your studies." Institution text input with autocomplete for common Kenyan universities. Course selection (Computer Science, Software Engineering, Information Technology, Data Science, or Other).

---

#### Step 2: Your Experience Level
*Collected:* `studentData.yearOfStudy`, initial tier self-assessment
*Why now:* The AI Brief generator creates briefs appropriate to your level. A first-year student gets a different brief than a final-year student.
*What unlocks:* Tier-appropriate project briefs.

**Screen design:** Heading: "How long have you been coding?" Three options with honest descriptions:
- Beginner (Less than a year, or still learning fundamentals)
- Intermediate (1–2 years, comfortable with a language and basic projects)
- Advanced (3+ years, ready for production-grade challenges)

No gatekeeping — students self-select. If they underestimate, they can change their tier later.

---

#### Step 3: Start Your Project
*What happens:* The student is shown the project creation flow (AI Brief or Open Source track selection). This is not an onboarding step in a separate wizard — it is the first real action in the product.
*What unlocks:* Full Education Hub.

**The project creation is the completion of onboarding for students.** Once they have a project engagement, the onboarding panel disappears and the pipeline progress component takes its place.

---

### Lecturer Onboarding Journey

**User goal:** Review student projects with institutional authority and contribute to student credentialing.
**Platform goal:** A verified, active lecturer with a review completed within their first week.

#### Step 1: Institution and Department
*Collected:* `lecturerData.institution`, `lecturerData.department`, `lecturerData.position`
*Why now:* Your institutional affiliation is what gives your review decisions credibility.
*What unlocks:* Ability to view the review queue (in preview mode — reviews submitted before verification do not count toward credentials).

**Screen design:** Heading: "Tell us about your institution." Three fields. An honest note: "Your institution affiliation will be verified by our admin team before your reviews are issued as credentials."

---

#### Step 2: Affiliation Verification
*Collected:* Evidence of institutional affiliation (institutional email, staff page URL, or document upload)
*Why now:* Lecturer verification is what distinguishes a UmojaHub credential from a self-assessment.
*What unlocks:* After admin approval — full review authority, name appears on student credentials.

**Screen design:** Three options for verification evidence, with explanation of each:
1. Institutional email (e.g., @uon.ac.ke) — fastest path
2. Staff profile URL — for institutions without email-based verification
3. Document upload — for non-standard situations

**Waiting state design:** Same principle as farmer verification — not blank. Shows the review queue in preview mode. The lecturer can read student submissions and prepare their thinking, even though their decisions do not yet count as credentials.

---

### The Progressive Unlock Architecture

The following table shows which platform capabilities are available at each profile completion stage for each role. This is the definitive reference for what should and should not be accessible at any given point in a user's journey.

| Capability | Farmer Step | Buyer Step | Student Step | Lecturer Step |
|---|---|---|---|---|
| Knowledge Hub | After Step 1 | Immediately | After Step 1 | After Step 1 |
| Price intelligence | After Step 1 | — | — | — |
| Farm Assistant | After Step 1 | — | After Step 1 | — |
| AI Mentor | — | — | After Step 1 | — |
| Marketplace browse | After Step 1 | After Step 1 | After Step 1 | After Step 1 |
| Price alert setup | After Step 2 | — | — | — |
| Listing creation (draft) | After Step 3 | — | — | — |
| Project creation | — | — | After Step 2 | — |
| Review queue (preview) | — | — | — | After Step 1 |
| Marketplace purchase | — | After Step 1 | — | — |
| Listing creation (live) | After Step 4 (verified) | — | — | — |
| M-Pesa payments | After Step 4 (verified) | After first order | — | — |
| Full portfolio | — | — | After first project | — |
| Review authority | — | — | — | After Step 2 (admin verified) |

---

### The Onboarding Panel Component

The onboarding panel is a persistent, collapsible component that appears in the application shell for users with incomplete profiles. It is not a modal. It is not a blocking overlay. It lives in the sidebar or as a slim banner, depending on the completion state.

**States:**
1. **Active (steps remaining):** Slim card showing the next step, what it unlocks, and an estimated time to complete (e.g., "2 minutes"). Always dismissible.
2. **Completed:** Replaced by a one-time congratulatory message and then permanently hidden.
3. **Dismissed:** A small "Complete your profile" link remains in the sidebar. The user can return at any time.

**Principle:** The onboarding panel never interrupts the user's current task. It is an invitation, not an interruption.

---

### Trust-Building Moments in Onboarding

These are the moments during onboarding where the platform actively builds trust, not just collects data.

**TBM-1: The verification explanation screen.**
Before the farmer submits documents, the platform explains the entire verification process in plain language. Who reviews it. What they check. How long it takes. What the farmer gets when it is approved. This screen is not a legal disclaimer — it is a promise.

**TBM-2: The "here's what you unlocked" confirmation.**
After each onboarding step, the platform shows exactly what became available. Not a generic "Step complete!" Not a confetti animation. A specific, functional change: "Price alerts are now set up. You'll receive an SMS when tomato prices in Nairobi hit your target."

**TBM-3: The waiting state design.**
Both farmer verification and lecturer verification require admin review. The waiting state is designed to be productive, not passive. It shows what is coming and gives the user meaningful things to do. It includes a specific timeline.

**TBM-4: The first transaction acknowledgment.**
When a farmer receives their first M-Pesa payment, the platform acknowledges it with more than a status badge. The M-Pesa receipt number is prominent. The buyer's rating invitation is clear. The trust tier progress is shown.

**TBM-5: The credential reveal.**
When a student receives a VERIFIED decision, the credential is not just a status update. The platform shows the credential as it will appear to employers — the full public credential page with their scores, their lecturer's name and institution, and the SHA-256 hash. This is the moment the Education Hub's value proposition is proven.

---

### Onboarding Anti-Patterns (Explicitly Banned)

These patterns are common in onboarding design and must not appear in UmojaHub:

| Anti-Pattern | Why Banned |
|---|---|
| "Complete your profile to unlock features" (generic) | Tells the user nothing about what specifically they get |
| Progress percentage bars on profiles | Gamification that pressures without guiding |
| Skipping verification with a "remind me later" that is never shown again | Destroys the business model (farmers need to be verified to transact) |
| Asking for phone number before it is needed | Data collected without value exchange |
| Welcome emails with 5 "getting started" links | Information overload at the moment of highest engagement |
| Onboarding modal that blocks the product | Product must be visible — onboarding is a guide, not a gate |
| "You're 70% complete!" with no specifics | Meaningless without context |

---

## PART 4 — WEBSITE REDESIGN ROADMAP

### Phase 1 — Foundation

**Goals:** Establish the technical and structural foundation.

**Deliverables:**
- `tailwind.config.ts` extended with editorial tier tokens: light surface palette (`bg-canvas`, `bg-canvas-elevated`, `text-ink-*`), `text-display` (fluid: `clamp(36px, 5vw, 56px)`), `section-gap` spacing
- shadcn/ui installed (CSS variable mode, TypeScript, src directory)
- Lucide React installed; icon conventions documented
- `tailwind-merge` and `class-variance-authority` installed
- Component directory structure: `src/components/website/`, `src/components/ui/`, `src/components/shared/`
- Light/dark CSS variables defined in `globals.css`
- `lib/fonts.ts` exports font variables for both editorial and application contexts
- Test page at `/design-system` (dev-only) validates both surface modes

**Dependencies:** None. Prerequisite to all other phases.

**Success Criteria:**
- `npm run build` passes with new dependencies
- Existing application pages are visually unchanged
- Both light and dark surfaces render correctly on the test page

---

### Phase 2 — Information Architecture

**Goals:** Define the complete structure, navigation, and content map before any visual design.

**Public Routes:**

| Route | Primary Audience | Primary Goal |
|---|---|---|
| `/` | All audiences | Establish mission; direct to correct audience path |
| `/for-farmers` | Farmers considering registration | Problem → solution → workflow → trust |
| `/for-buyers` | Institutional and individual buyers | Verified sourcing, payment safety |
| `/for-students` | CS/tech students | Credential value, process rigor |
| `/for-educators` | Lecturers and universities | Review role, institutional value |
| `/for-institutions` | NGOs, government, development partners | Impact data, partnership models |
| `/verify/[hash]` | Employers, credential checkers | Verify a specific student credential |

**Navigation Architecture:**

Primary nav: `[Logo]` · `Platform ▾` · `For Farmers` · `For Students` · `Institutions ▾` · `Sign in` · `Get started`

Platform dropdown: Food Security Hub, Education Hub, Trust Infrastructure, Price Intelligence

Institutions dropdown: Agricultural Institutions, Universities, Government & NGOs, Development Partners

Mobile: Hamburger → full-screen overlay → same structure

**Dependencies:** Phase 1.

**Success Criteria:** Every audience type has a clear entry path in ≤ 2 clicks from homepage.

---

### Phase 3 — Trust Architecture

**Goals:** Define how every trust mechanism is communicated before any visual design.

**Trust Communication Specification:**

| Trust Claim | Current | Required |
|---|---|---|
| Farmer verification is real | Nothing | Named review process, SLA, what is checked |
| M-Pesa payment is confirmed | Order status badge | Transaction receipt with M-Pesa reference, prominent |
| Student credential is cryptographically signed | Nothing | Visible hash on credential, verifiable at `/verify/[hash]` |
| Lecturer is institution-affiliated | "Verified" badge | Institution name, verification date, review count |
| Trust tier is earned not assigned | Tier label | Score breakdown: what each component measures and how it accrues |

**The Honesty Rule:** No trust claim uses language that cannot be substantiated. "Bank-grade security" without explanation is banned. "Verified by a named, institution-affiliated lecturer at the University of Nairobi" is permitted.

**Honest Metrics Framework:**
- Rule 1: Never show a metric without its denominator
- Rule 2: Never show a metric that cannot be updated
- Rule 3: Show only metrics that communicate something meaningful to the audience reading them

**Dependencies:** Phase 2. Trust claims must fit within the IA structure.

---

### Phase 4 — Content Strategy

**Goals:** Write the actual words before any visual design begins.

**Voice Guidelines:**

*Website:* Patient, specific, honest. Uses second person without being presumptuous. Never uses "seamless." Never promises speed. Acknowledges complexity.

*Application:* Precise, actionable, brief. Labels are nouns. Actions are verbs. Status messages describe the situation accurately, not optimistically.

*Error voice:* Does not blame the user. States what happened, why if known, and what to do next. Example: "Your M-Pesa payment timed out. Your order has been cancelled and your listing is available again. You can try again from your orders page."

*Onboarding voice:* Conversational. "Tell us about your farm" not "Enter farm information." "What do you grow?" not "Select crop types."

**Character count constraints for visual design:**
- Hero headline: ≤ 72 characters
- Section headline: ≤ 60 characters
- Body paragraph: ≤ 120 words
- Empty state message: ≤ 30 words
- Onboarding step heading: ≤ 40 characters

**Dependencies:** Phase 3. Content must reflect trust claims accurately.

---

### Phase 5 — Visual Design

**Goals:** Apply the design system to the IA and content established in Phases 1–4.

**Surface decision:** The website uses the editorial light palette. The application uses the dark palette. `accent-green` is shared. The shift from light website to dark application communicates a transition from learning to doing.

**Photography/illustration policy:** No stock photography. No AI-generated imagery. Acceptable options: actual platform screenshots, typographic treatments, abstract geometric compositions using the design system's vocabulary.

**Product screenshots as primary visual asset:** Screenshots of the actual platform working are more credible than any illustration.

**Deliverables:** Homepage, For-Farmers, For-Students, For-Buyers, For-Educators, For-Institutions pages, redesigned auth pages, `/verify/[hash]` credential page.

---

### Phase 6 — Motion Design

**Motion budget (website only):**

| Element | Motion | Duration | Purpose |
|---|---|---|---|
| Section reveal | Fade + 8px upward translate, intersection-triggered | 400ms | Paces argument |
| Nav dropdown | Fade in | 120ms | Signals new content |
| CTA button hover | Border brightening | 150ms | Confirms interactivity |
| Trust metric counter | Count-up, once on intersection | 600ms | Makes numbers feel live |
| Mobile nav | Slide from left | 200ms | Standard mobile pattern |

All motion respects `prefers-reduced-motion: reduce`. No animation is continuous.

---

### Phase 7 — Implementation

**Build order within this phase:**
1. Homepage
2. Auth pages (login, register redesign with role-selection and onboarding wizard)
3. `/verify/[hash]` credential page
4. For-Students
5. For-Farmers
6. For-Buyers, For-Educators, For-Institutions

**Lighthouse targets:** Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90

---

## PART 5 — APPLICATION REDESIGN ROADMAP

### Food Security Hub

#### Navigation Structure

**Farmer:**
```
My Listings        — primary operational surface
My Orders          — active order management with action prioritisation
Farm Assistant     — AI advisor
Price Intelligence — alerts and market data
My Group           — cooperative (when implemented)
Profile            — trust tier + verification status
```

**Buyer:**
```
Marketplace        — primary discovery surface
My Orders          — post-purchase management
Knowledge Hub      — public, pre-login accessible
```

**Admin:**
```
Operations         — morning check: all pending actions in one view
Farmer Verification
Lecturer Verification
Supplier Verification
Knowledge CMS
Impact Summary
Brief Contexts
```

---

#### Dashboard Strategy

**The Dashboard-as-Action-Queue Principle:**

Every dashboard entry point answers: "What requires your attention right now?" Not "here is all the data about your account."

**Farmer contextual states:**

| Profile State | First Screen |
|---|---|
| Unverified (just registered) | Onboarding panel: Step 2 (crops) or Step 3 (farm details) |
| Documents submitted, awaiting review | Verification-in-progress designed state with timeline |
| Verified, no listings | Single CTA: create your first listing |
| Listings active, no orders | Listing performance + price intelligence prompt |
| Orders pending action | Action queue: orders requiring dispatch confirmation |
| Completed orders | Trust tier progress toward next tier |

**Buyer contextual states:**

| State | First Screen |
|---|---|
| New buyer, no orders | Marketplace with first-time buyer orientation banner |
| Active orders | Orders list with status and required actions |

**Admin morning check view:**
Single view: N farmer verifications pending · N lecturer verifications pending · N supplier verifications pending · N knowledge articles awaiting review. Each number links directly to the relevant queue. No charts. Just the work.

---

#### Core Workflows

**Farmer Verification Flow:**
1. Document submission form with explanation of what is checked
2. Submission confirmation: what was submitted, timestamp, expected 48-hour timeline
3. Waiting state: productive preview of what becomes available after verification
4. Approved: acknowledgment + trust tier displayed + first listing CTA
5. Rejected: specific reason shown prominently + resubmission path

**M-Pesa Payment Flow (Buyer):**
1. Order creation form with phone number field
2. "Check your phone" screen: clear instruction, visual indication of pending STK Push
3. "I didn't receive a prompt" retry path
4. Payment confirmed: M-Pesa receipt number prominent, copyable, with explanation of what it means
5. Farmer notification: parallel SMS + in-app notification

**Trust Tier Component:**
```
TRUSTED Farmer
━━━━━━━━━━━━━━━━━━━━

Verification     ████████████  40/40
Transactions     ██████████    22/30
Buyer ratings    ████████      12/20
Reliability      ██            4/10

78/100 · 15 completed orders
Next tier (PREMIUM) at 80/100
```
This component appears on: marketplace farmer profile (buyer-visible), farmer's own dashboard (with next-tier progress), order confirmation page.

---

#### Priority Matrix — Food Hub

**Must Have (blocks pilot launch):**
- Mobile navigation (hamburger + overlay)
- Error boundaries on all dashboard pages
- Farmer verification waiting state (designed)
- Onboarding wizard (all farmer steps)
- Listing edit and delete
- M-Pesa payment waiting screen
- Trust tier component with score breakdown
- Buyer onboarding (Step 1 only — minimal)
- Action-queue dashboard view for farmers

**Should Have (improves pilot quality):**
- Price guidance in listing creation form
- Listing preview before publication
- Verification rejection response flow
- Trust tier progress toward next tier
- Post-payment farmer notification

**Could Have (post-pilot):**
- Group cooperative flow
- Listing sharing
- Advanced price intelligence dashboard
- Supplier self-registration

---

### Education Hub

#### Navigation Structure

**Student:**
```
My Project         — pipeline + documents + feedback
Peer Review        — assigned review (when active)
AI Mentor          — chat
Portfolio          — credentials + stats
```

**Lecturer:**
```
Review Queue       — pending engagements, sorted by time in state
My Reviews         — completed history
```

---

#### Core Workflows

**Project Pipeline Component:**

The student dashboard's central element is a pipeline progress component, not a status badge. It shows:

```
  ①           ②             ③               ④                  ⑤                ⑥
Brief       In            Submitted    Under Peer         Under Lecturer      Verified
Generated  Progress                    Review              Review
  ✓           ✓               ✓        ← You are here    Coming next
```

At stage 4: "Your project is being reviewed by Brian Mwenda. Expected completion: within 5 days."
At stage 5: "Your project is with Dr. Grace Ndung'u at the University of Nairobi."

**REVISION_REQUIRED Response Flow:**

When a student logs in after receiving REVISION_REQUIRED, the first screen is dedicated entirely to the feedback:

```
Dr. Grace Ndung'u reviewed your project.

REVISION REQUIRED

Problem Understanding  ████░   4/5
Solution Quality       ███░░   3/5
Process Quality        ████░   4/5
AI Usage Transparency  █████   5/5

Feedback:
"Your approach plan shows strong understanding of the M-Pesa
integration challenge. However, the final reflection does not
adequately address the scalability constraints you encountered
during development. Please expand on how you would approach
connection pooling differently in a production environment."

→ Review feedback and update your project
```

This screen is not embedded in tabs. It IS the dashboard until the student acknowledges it.

**Lecturer Review Interface:**

Two-panel layout:
- Left (60%): Document reader. Sequential navigation between three process documents, blocker log, AI usage log. Optimised for reading: 16px type, 65-character line length, adequate line height.
- Right (40%): Evaluation form. Sections revealed progressively as documents are read. The AI usage section of the form appears only after the lecturer has viewed the AI usage log.

**Portfolio Credential Public Page (`/verify/[hash]`):**

Designed for an employer or hiring manager reading it. Not a certificate. A professional data sheet:
```
UmojaHub Verified Project Credential

Student: Brian Mwenda
Project: Agricultural Marketplace with M-Pesa Payments
Submitted: 2026-04-15  Verified: 2026-05-03

Verified by: Dr. Grace Ndung'u
Institution: University of Nairobi, Department of Computer Science

Review Scores:
Problem Understanding     4/5
Solution Quality          4/5
Process Quality           5/5
AI Usage Transparency     4/5
Overall Average           4.25/5

Credential Hash: a3f2c1d4...8e9b7f
This hash was recorded at submission. Verify at umojahub.com/verify/a3f2c1d4...

Status: VALID ● Last verified: 2026-05-31
```

**AI Usage Log — Student-Facing Purpose:**

Before the first AI usage log entry, the platform explains:
"This log is part of your credential. When a lecturer and employer reviews your work, they will see exactly which AI tools you used and how. Thorough AI usage logging demonstrates intellectual honesty and is a positive signal, not a risk. Students who document AI usage well receive higher AI Usage Transparency scores."

---

#### Priority Matrix — Education Hub

**Must Have:**
- Pipeline progress component
- REVISION_REQUIRED dedicated response screen
- Portfolio credential public page (`/verify/[hash]`)
- Lecturer review two-panel reading interface
- AI usage log with purpose explanation
- Student onboarding wizard (Steps 1–3)

**Should Have:**
- Project brief reveal designed experience
- Process document save-without-submit
- Blocker log as running log
- Peer review assignment transparency

**Could Have:**
- Lecturer effectiveness dashboard
- Employer-facing student directory
- Cohort management

---

## PART 6 — DESIGN SYSTEM ROADMAP

### Typography

**Three fonts. Two contexts. One purpose.**

| Font | Domain | Reasoning |
|---|---|---|
| Sora | Headings, display, KPIs | Geometric, authoritative, brand-neutral in Kenya |
| IBM Plex Sans | Body, labels, controls | Readable at small sizes, technical with humanist warmth |
| JetBrains Mono | Numbers, IDs, hashes, amounts | Monospaced alignment prevents layout shift on data updates |

**Type scale:**

| Token | Size | Context | Notes |
|---|---|---|---|
| `text-display` | `clamp(36px, 5vw, 56px)` | Website hero only | Only fluid size in the system |
| `text-t1` | 32px | Page titles, display KPIs | Both surfaces |
| `text-t2` | 24px | Section headings | Both surfaces |
| `text-t3` | 20px | Card headings | Both surfaces |
| `text-t4` | 16px | Body copy | Both surfaces; minimum for mobile readability |
| `text-t5` | 14px | Secondary labels | Both surfaces |
| `text-t6` | 12px | Captions, tags | Both surfaces; never for actionable information |

**Mandatory rules:**
- All monetary and numerical values: `font-mono tabular-nums`
- Never `text-sm`, `text-base`, `text-lg` (Tailwind defaults)
- Never `font-sans`

---

### Color Strategy

**Two-surface architecture:**

Application (dark):
- `bg-surface-primary`: `#0D1117` — page background
- `bg-surface-elevated`: `#161B22` — cards, panels
- `bg-surface-secondary`: `#1F2937` — inputs, inner containers
- `text-text-primary`: `#E6EDF3`
- `text-text-secondary`: `#8B949E`
- `text-text-disabled`: `#484F58` ⚠️ (2.1:1 contrast ratio — use only for genuinely inactive elements, never for information users need to read)

Website editorial (light):
- `bg-canvas`: `#FAFAF9` — warm white; not pure white (harsh contrast)
- `bg-canvas-elevated`: `#FFFFFF` — cards
- `text-ink-primary`: `#111110`
- `text-ink-secondary`: `#6F6E69`
- `text-ink-tertiary`: `#A9A6A0` — captions only

Shared across both surfaces:
- `accent-green`: `#007F4E` — the single thread connecting website to application
- `accent-green-light`: `#E8F5EE` — tinted backgrounds on light surface

**The `accent-green` scarcity principle:** This colour carries one meaning: something is verified, confirmed, or approved. Never used decoratively. When users see green, it means something happened.

---

### Component Hierarchy

Level 1 — Primitives (shadcn/ui base, fully restyled):
`Button`, `Input`, `Select`, `Checkbox`, `RadioGroup`, `Textarea`, `Label`, `Dialog`, `Tabs`, `Tooltip`, `Alert`, `Badge`, `Separator`

Level 2 — Application patterns:
`DataRow`, `StatCard`, `RowList`, `PageHeader`, `FilterBar`, `EmptyState`, `SkeletonShell`, `ErrorBoundary`, `PipelineProgress`, `OnboardingPanel`

Level 3 — Domain components:

Food Hub (`src/components/food-hub/`):
`TrustTierBadge`, `ListingCard`, `OrderTimeline`, `PriceAlertRow`, `VerificationStatusCard`, `MpesaWaitingScreen`, `FarmerCard`

Education Hub (`src/components/education/`):
`EngagementPipeline`, `ProcessDocEditor`, `ReviewScoreForm`, `PortfolioCredential`, `RevisionFeedbackCard`, `MentorChat`, `AiUsageLog`

Website (`src/components/website/`):
`AudienceHero`, `HowItWorksSection`, `TrustExplainer`, `CredentialPreview`, `StatsStrip`, `RoleCard`

Onboarding (`src/components/onboarding/`):
`OnboardingWizard`, `OnboardingStep`, `OnboardingProgress`, `RoleSelector`, `CropPicker`, `UnlockPreview`

---

### Accessibility Standards

**WCAG 2.1 AA minimum. Non-negotiable rules:**

- All interactive elements have visible focus states (`focus-visible:ring-1 ring-accent-green`)
- All images have `alt` text or `aria-hidden="true"`
- All form inputs have associated `<label>` elements (not just placeholder text)
- All status badges have semantic ARIA (`role="status"` or `aria-label` with the state)
- All modals trap focus (shadcn/ui Dialog handles this natively)
- All navigation uses landmark regions: `<nav>`, `<main>`, `<header>`, `<footer>`
- Heading hierarchy: never skip levels (h1 → h2 → h3)
- Touch targets: `min-h-[44px] min-w-[44px]` everywhere
- Colour is never the only signal of state

**Contrast audit results:**
- `text-text-primary` on `bg-surface-primary`: ~13:1 ✅
- `text-text-secondary` on `bg-surface-primary`: ~4.5:1 ✅ (AA)
- `text-text-disabled` on `bg-surface-primary`: ~2.1:1 ❌ — limit strictly to genuinely inactive elements
- `accent-green` on `bg-surface-primary`: ~4.8:1 ✅ (AA)

---

### Motion Principles

**Tier 0 — No motion (application default):** All state changes instant. Speed communicates confidence.

**Tier 1 — Micro (150ms):** Hover, focus, active states. Already specified in FRONTEND.md.

**Tier 2 — Transition (200–400ms, website only):** Section reveals, nav dropdowns, mobile nav. Never continuous.

**Accessibility rule:** All motion responds to `prefers-reduced-motion: reduce` with `transition: none`. No exceptions.

---

## PART 7 — IMPLEMENTATION ORDER

### Week 1 — Foundation and Critical Fixes

**Theme:** Fix what is actively harming users today.

**Mon–Tue:** Install shadcn/ui, Lucide React, tailwind-merge, class-variance-authority. Extend `tailwind.config.ts`. Create component directory structure.

**Wed–Thu:** Mobile hamburger navigation in `LayoutWrapper.tsx`. Full-screen overlay at < 768px. Tested at 375px on every existing page.

**Fri:** Error boundaries on all dashboard pages. Retry capability. Network failure no longer crashes the application.

**Outcome:** Application works on mobile. Network failures handled gracefully.

---

### Week 2 — Design System Core

**Theme:** Build the vocabulary every subsequent week uses.

**Mon–Tue:** Level 1 primitives (all shadcn/ui components restyled).

**Wed–Thu:** Level 2 patterns (`DataRow`, `StatCard`, `RowList`, `PageHeader`, `EmptyState`, `SkeletonShell`, `PipelineProgress`). The `PipelineProgress` component is complex — it gets dedicated Wednesday.

**Fri:** `OnboardingWizard` and `OnboardingPanel` shell components. Storybook setup.

**Outcome:** Complete component vocabulary. Every subsequent week builds with these components.

---

### Week 3 — Authentication and Onboarding Architecture

**Theme:** Replace the registration wall with the progressive onboarding system.

**Mon:** Backend prerequisite evaluation. If Email magic link (`[BACKEND REQUIRED]`) is ready: integrate. If not: the onboarding wizard is built on existing email+password auth — the wizard and the auth method are independent.

**Tue–Wed:** Registration flow redesign. Replace the 7-field form with:
1. Authentication step (email + password, or magic link if ready)
2. Role selection screen
3. Role-specific onboarding wizard shell (Step 1 of each role)

**Thu:** Farmer onboarding Steps 1–3 (name/county, crops, farm details).

**Fri:** Student onboarding Steps 1–3 (institution, course/level, project creation entry). Lecturer onboarding Steps 1–2.

**Outcome:** New users experience the platform within 60 seconds of first arriving, without completing a 7-field form.

---

### Week 4 — Website

**Theme:** Rebuild the platform's public face.

**Mon:** Finalise all website copy (this is a content day, not a build day).

**Tue–Wed:** Homepage with all sections. Light editorial surface.

**Thu:** `/verify/[hash]` credential page (no login required). Auth pages redesigned.

**Fri:** For-Farmers and For-Students audience pages.

**Outcome:** The platform's trust-building public surface is live.

---

### Week 5 — Food Hub Application

**Theme:** Farmers and buyers have a complete, operational experience.

**Mon:** Farmer verification waiting state and approval/rejection flows.

**Tue:** Listing edit, delete, and preview-before-publication.

**Wed:** M-Pesa payment waiting screen. "I didn't receive a prompt" retry flow. Payment confirmed state.

**Thu:** Trust tier component with score breakdown. Integration on marketplace profiles and farmer dashboard.

**Fri:** Action-queue dashboard for farmers. Buyer onboarding (Step 1). Buyer → marketplace bridge for empty orders state.

**Outcome:** Farmers can manage their complete listing lifecycle. Buyers have a clear payment experience. Trust is legible.

---

### Week 6 — Education Hub Application

**Theme:** The Education Hub's value proposition is visible in the interface.

**Mon:** Pipeline progress component integration on student dashboard.

**Tue:** REVISION_REQUIRED dedicated response screen.

**Wed:** Process document editor with save-without-submit, blocker log as running log, AI usage log with purpose explanation and structured fields.

**Thu:** Lecturer review two-panel interface (document reader + progressive evaluation form).

**Fri:** Student portfolio page with verified credential links to public credential page.

**Outcome:** Education Hub credentialing process is legible to students, rigorous for lecturers, and credible to employers.

---

### Week 7 — Remaining Audience Pages and Quality

**Theme:** Complete the website and achieve accessibility compliance.

**Mon–Tue:** For-Buyers, For-Educators, For-Institutions audience pages.

**Wed:** Full axe DevTools audit across all pages. Fix every WCAG AA violation.

**Thu:** Mobile audit at 375px, 390px, 768px on all pages. Fix all issues.

**Fri:** Final build. `npm run type-check && npm run lint && npm run test`. Lighthouse audit on homepage and three key application pages. Deploy to Vercel production.

**Outcome:** Platform is pilot-ready. All critical user flows work on mobile. Accessibility compliant.

---

## PART 8 — DESIGN REVIEW FRAMEWORK

Every screen must pass this checklist before merge. The review has eight dimensions. Trust is first because everything else depends on it.

---

### Section 1: Trust

- [ ] Does this screen make any claim that cannot be substantiated by platform capability?
- [ ] Are all numerical values exact and current?
- [ ] Does the screen communicate the user's actual state accurately?
- [ ] If something went wrong, does the screen say so clearly?
- [ ] Are all trust mechanisms (verification status, scores, credentials) shown with appropriate explanation?
- [ ] Are all status indicators semantically accurate?
- [ ] Does the onboarding explain WHY information is requested before asking for it?

### Section 2: Clarity

- [ ] Can a first-time user understand what to do next without documentation?
- [ ] Is the primary action immediately identifiable?
- [ ] Is there a clear hierarchy between primary, secondary, and tertiary information?
- [ ] Are labels self-sufficient without requiring context?
- [ ] Is the empty state handled with an explanation and a suggested action?
- [ ] Is the loading state a shaped skeleton matching the loaded content?
- [ ] For onboarding steps: is there exactly one decision or action per screen?

### Section 3: Accessibility

- [ ] Correct heading hierarchy (h1 once, h2 and h3 follow in order)?
- [ ] All images have meaningful `alt` text or `aria-hidden="true"`?
- [ ] All interactive elements have accessible names?
- [ ] All form inputs have associated `<label>` elements?
- [ ] All error messages linked to their inputs via `aria-describedby`?
- [ ] All interactive elements reachable and operable by keyboard?
- [ ] Visible focus indicator on every interactive element?
- [ ] Status changes announced to screen readers?
- [ ] axe DevTools: zero violations?
- [ ] All text meets WCAG AA contrast (4.5:1 normal, 3:1 large)?
- [ ] `prefers-reduced-motion` respected?

### Section 4: Information Density

- [ ] Is density appropriate to context (dense for application, generous for website)?
- [ ] Correct amount of information — neither hiding useful data nor overwhelming?
- [ ] All numerical values in monospaced font with `tabular-nums`?
- [ ] Currency amounts formatted correctly (KES with space, commas for thousands)?

### Section 5: Mobile Usability

- [ ] Works at 375px viewport?
- [ ] All interactive elements ≥ 44px × 44px?
- [ ] Navigation accessible on mobile?
- [ ] No horizontal overflow?
- [ ] Text inputs ≥ 16px (prevents iOS zoom)?
- [ ] Tested on a real mobile device (not only DevTools)?

### Section 6: Human-Centered Communication

- [ ] Does the screen speak to a person, not a system?
- [ ] Are error messages in plain language: what happened + what to do?
- [ ] Does the screen acknowledge the user's situation?
- [ ] Does success feel like success? Does failure feel handled?
- [ ] Grade 8 readability target for farmer-facing and student-facing pages?
- [ ] Zero marketing language, startup jargon, or artificial urgency?

### Section 7: Consistency

- [ ] All type sizes use `text-t*` scale?
- [ ] All colours use design system tokens (no raw hex)?
- [ ] Border radius within allowed range (`rounded-sm` max in application)?
- [ ] No `shadow-*` in application?
- [ ] No `font-sans`?
- [ ] All transitions use `duration-150` in application?
- [ ] Existing component used rather than new inline implementation?

### Section 8: Performance

- [ ] Lighthouse Performance ≥ 80?
- [ ] All images use `next/image`?
- [ ] No layout shifts (CLS)?
- [ ] Skeleton loaders used to prevent layout shift?
- [ ] Acceptable load on simulated 3G?

---

## PART 9 — MASTER PLAN SUMMARY

| Section | Status | Owner |
|---|---|---|
| Critical product decision (auth philosophy) | Documented; `[BACKEND REQUIRED]` items flagged | Backend before Week 3 |
| Current state analysis | Complete | Reference only |
| Product vision | Complete | Reference always |
| Onboarding architecture | Complete | Implement Week 3 |
| Website roadmap | Complete | Implement Weeks 4 + 7 |
| Food Hub application roadmap | Complete | Implement Week 5 |
| Education Hub application roadmap | Complete | Implement Week 6 |
| Design system | Complete | Implement Weeks 1–2 |
| Implementation timeline | 7 weeks | Begin Week 1 immediately |
| Design review checklist | Complete | Apply before every merge |

---

### The Governing Principle

Before implementing any screen:

> **"Does this help the person in front of this screen understand their situation and know what to do next?"**

Before collecting any piece of user data:

> **"Have we explained why this is needed, what it unlocks, and how the user benefits?"**

If either answer is not clearly yes, the implementation is not ready.

---

*This document is the official UmojaHub UI/UX redesign roadmap. All design decisions defer to this document. Update this document before implementing anything it does not cover.*
