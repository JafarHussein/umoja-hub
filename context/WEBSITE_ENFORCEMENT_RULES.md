# WEBSITE ENFORCEMENT RULES
**Status:** Hard rules. Not guidelines. Not principles. Not suggestions.
**Authority:** Every future page, component, section, paragraph, CTA, diagram, illustration, animation, screenshot, or interaction must pass the applicable rules before it is built.
**Application:** These rules apply six months from now with the same force they apply today. They are written to survive personnel changes, sprint pressure, and feature creep.

---

## SECTION 1 — THE PRIMARY TEST

Before anything else, apply this test to every proposed piece of content or functionality:

**Does this require a session to be meaningful?**
- Yes → It belongs in the web application.
- No → It may belong on the website. Continue to Section 2.

**Does this create, modify, or delete any platform record?**
- Yes → It belongs in the web application. No exceptions.
- No → Continue to Section 2.

**Does this initiate any financial transaction, payment flow, or M-Pesa interaction?**
- Yes → It belongs in the web application. No exceptions. The website never touches money.
- No → Continue to Section 2.

If a piece of content or functionality passes all three questions (No / No / No), it is a candidate for the website. It is not automatically approved — it must still pass Section 2.

---

## SECTION 2 — CONTENT RULES

**Rule C1 — The Verifiability Rule**
Every factual claim on the website must be verifiable against the platform's actual data, codebase, or governance documents. Claims that require interpretation, projection, or inference are prohibited. Enforcement: before publishing any claim, identify the specific source that makes it true. If no source exists, the claim is cut.

**Rule C2 — The Completeness Rule**
Every capability claim is paired with its corresponding limitation in the same section, not in a footnote. "Farmers can create listings" is not complete. "Farmers who have passed identity verification can create marketplace listings. The platform does not pre-verify the quality, quantity accuracy, or harvest date accuracy of listed produce — those are the farmer's responsibility" is complete. Enforcement: every capability statement must have a sibling limitation statement before publication.

**Rule C3 — The Audience Rule**
Content on the website is for people who have not yet decided to engage. If a piece of content assumes the reader already has an account, already understands the platform, or is in the middle of a task — it belongs in the application. Enforcement: ask "would a first-time visitor to this page have the context needed to understand this?" If no, the content either needs rewriting or belongs in the app.

**Rule C4 — The Action Prohibition Rule**
The website never asks a visitor to take an action that changes platform state. CTAs on the website are of two types only: (1) navigate to another page on the website, (2) navigate to the auth gateway (register or sign in). A CTA that says "Submit your documents" or "Place your order" or "Create a listing" belongs in the application. Enforcement: every CTA is reviewed against this rule before the page ships.

**Rule C5 — The Aspiration Prohibition Rule**
No aspirational language. No transformation narratives. No empowerment rhetoric. No market size statistics. No projections. No comparisons to competitors. No claims about what the platform will do in the future unless it is live. Enforcement: every sentence is read as if by a journalist looking for overstatement. Anything that would require hedging or qualification if challenged is rewritten or cut.

**Rule C6 — The Stock Prohibition Rule**
No stock photography. No generic illustrations. No icons used for decoration. No placeholder content. If a visual cannot be sourced as a genuine representation of the platform (a real screenshot, a real diagram, a real metric), it is not used. Enforcement: every visual asset requires a documented source before the page is published.

**Rule C7 — The Operational Content Prohibition Rule**
The following content types are prohibited on the website regardless of context: live chat interfaces, form submissions that modify data, payment forms, document upload dropzones, review scoring forms, dashboard widgets showing authenticated-user-specific data. The website contains informational content only. Enforcement: any interactive element on the website that communicates with the platform's database is automatically a violation.

---

## SECTION 3 — TRUST AND GOVERNANCE RULES

**Rule T1 — Named Accountability Requirement**
Any description of the verification process that involves human review must identify who performs that review by name and credential. "A platform administrator reviews your documents" is insufficient. "Documents are reviewed by [Name], [Credential], [Role]" is sufficient. Enforcement: the team page is maintained current. Any reference to administrators on other pages links to the team page.

**Rule T2 — Appeals Disclosure Requirement**
Every page that describes a verification decision (approve/reject/verify/deny) must link to or describe the appeals process. The appeals process is not optional content — it is required context for any decision that affects a user's standing on the platform. Enforcement: no page may describe a verification outcome without including or linking to the appeals path.

**Rule T3 — Limitation Co-Location Requirement**
Limitations are placed in the same section as the capabilities they qualify, not in a separate disclaimer section, not in a footer, not in a legal page. A user reading about portfolio verification reads, in the same section, what portfolio verification does not guarantee. Enforcement: every capability section is reviewed for its paired limitation before publication.

**Rule T4 — Metrics Accuracy Requirement**
Platform metrics published on the website (verified farmers, completed transactions, verified portfolios, counties, etc.) reflect actual platform data. They are sourced from the platform's transparency API. Where metrics are not yet meaningful (zero or near-zero), they are either omitted or published with honest context ("we launched X weeks ago"). No projection or estimate is labeled as an actual count. Enforcement: metrics are reviewed against live data before each website update.

---

## SECTION 4 — BOUNDARY ENFORCEMENT RULES

**Rule B1 — The Checkout Firewall**
No M-Pesa payment initiation, order creation, or financial transaction of any kind occurs on the website. The marketplace listing browse is a website function. The act of purchasing from that listing is an application function. The transition point is authentication. Enforcement: `CheckoutForm` or any equivalent component is prohibited from rendering on any page outside the authenticated dashboard.

**Rule B2 — The Write Operation Firewall**
No API call that uses HTTP POST, PUT, PATCH, or DELETE may be initiated from a website page by an unauthenticated user. The only exceptions are the auth gateway routes (registration, login, password reset) which are transition mechanisms, not website pages. Enforcement: any component on a website page that calls a write API must first verify session state. If session is absent, the component renders a sign-in CTA, not the write interface.

**Rule B3 — The Dashboard Component Prohibition**
No component built for the dashboard (role-specific headers, sidebars, verification queue interfaces, order management interfaces, project workspace tabs) appears on the website under any framing. Enforcement: `src/components/shared/Header.tsx`, `src/components/shared/Sidebar.tsx`, `src/components/shared/LayoutWrapper.tsx`, and all dashboard page components are strictly prohibited from import in any `(website)` page.

**Rule B4 — The Layout Integrity Rule**
Every page in the `src/app/(website)/` route group inherits its layout from `(website)/layout.tsx`. That layout provides the website's navigation and footer. No page inside `(website)/` may suppress the nav or footer. No page outside `(website)/` that serves anonymous users may omit equivalent website-level navigation context. Enforcement: the marketplace and knowledge pages (currently homeless) must be moved inside `(website)/` before the next design sprint begins.

**Rule B5 — The Token Integrity Rule**
Website pages use website design tokens. Application pages use application design tokens. No token crossing. When the new website design system is defined, its tokens are named and scoped exclusively for the website context. They do not appear in dashboard components. Application tokens do not appear in website pages. Enforcement: a linting rule or manual review ensures no dashboard token name appears in `(website)/` page files.

---

## SECTION 5 — CTA CLASSIFICATION RULES

Every call-to-action on the website is classified as one of four types. No other types are permitted.

**Type 1 — Explore CTA**
Navigates the visitor to more information on the website. Target is always a website page or anchor. Examples: "Learn how verification works", "Read the trust score methodology", "See the verification team".

**Type 2 — Registration CTA**
Navigates the visitor to the registration flow. Target is always `/auth/register`. May include a `role` query parameter to pre-select the visitor's role. Examples: "Register as a Farmer", "Create a Student account", "Join as a Buyer". This CTA appears only after the website has provided sufficient context for the visitor to make an informed decision to register.

**Type 3 — Sign-In CTA**
Navigates the authenticated-but-logged-out visitor back to the application. Target is always `/auth/login` with an appropriate `callbackUrl`. Examples: "Sign in to access your dashboard", "Sign in to place this order".

**Type 4 — External Reference CTA**
Navigates the visitor to an external resource: a government data source cited in impact metrics, a regulatory body whose certification is mentioned in supplier verification, the M-Pesa documentation referenced in the payment explanation. Opens in a new tab. Source is disclosed inline.

**Prohibited CTA types on the website:**
- "Create a listing" (application action)
- "Submit your documents" (application action)
- "Place an order" (application action — the browse page may link to a listing detail, but the purchase CTA is never on the website)
- "Upload your portfolio" (application action)
- Any CTA that triggers a write operation without authentication

---

## SECTION 6 — FUTURE DECISION PROTOCOL

When a future sprint proposes content or functionality for the website, this protocol is applied before any implementation begins:

**Step 1:** Apply the Primary Test (Section 1). If any question returns Yes, the item is redirected to the web application. Stop.

**Step 2:** Apply the relevant Content Rules (Section 2). If any rule fails, the item is either rewritten to comply or cut. No item advances with a failing rule.

**Step 3:** If the item involves governance, accountability, or verification claims, apply Trust and Governance Rules (Section 3).

**Step 4:** If the item involves any interactive element, apply Boundary Enforcement Rules (Section 4).

**Step 5:** If the item includes a call-to-action, classify it under Section 5. If it does not fit one of the four types, it is not a website CTA.

An item that passes all five steps is approved for website implementation and proceeds to design and development.

An item that fails at any step is either redirected to the correct system or cut. It does not proceed to design.
