# End-to-End Journey & Screen Map — V1

**The master design blueprint.** Status: **DRAFT — awaiting approval.** The goal is to **enumerate every screen for every role so nothing is assumed or missed** (owner mandate 2026-06-17). Governed by the [Foundation](UMOJAHUB_WEBAPP_FOUNDATION_V1.md), [IA](IA_INFORMATION_ARCHITECTURE_V1.md), [Marketplace Direction](MARKETPLACE_DESIGN_DIRECTION_V1.md), [Onboarding Direction](ONBOARDING_DESIGN_DIRECTION_V1.md).

**How to read:** each row = one screen/surface · its purpose · key content · the states it must define. IDs are stable handles for the wireframing backlog. Grounded in the real routes (`src/app/**`); new surfaces implied by the design directions are marked **(NEW)** and carry a backend-verify flag (design never touches logic). Every screen owns its **empty / loading / error / offline** states unless noted.

---

## A. Entry & cross-cutting

| ID | Screen | Purpose | Key content | States |
|----|--------|---------|-------------|--------|
| X-01 | Sign in | OAuth entry (sign-in = sign-up) | Google / GitHub; provider→role note; error copy | error (account/provider mismatch), loading |
| X-02 | Onboarding · Welcome | Warm intro, set expectation | One-line what-it-is; start | — |
| X-03 | Onboarding · Context (language) | Ask language (access + payoff) | Language choice, "why" | — |
| X-04 | Onboarding · Context (location) | County, to connect nearby | County picker, "why" | error (none) |
| X-05 | Onboarding · Intent ("what brings you?") | Surface role indirectly | Sell / Buy / Build portfolio / Review work | — |
| X-06 | Onboarding · Education interludes | Teach trust/verification/honesty | Illustrated explainers (tailored) | — |
| X-07 | Onboarding · Role confirmation (LAST) | Confirm informed role | "You're here to ___, right?" | — |
| X-08 | Onboarding · Role-specific setup | Collect role context | Farmer farm/produce · Buyer context · Student institution · Lecturer credentials | error |
| X-09 | Onboarding · Verification handoff | Explain + reduce anxiety | What/why; "what happens to your documents" | — |
| X-10 | Onboarding · Done / first-run | Land in role home gently | Confirmation + first action | — |
| X-11 | Notifications center | Surface status events | Payment/verification/order/review events; per-role | empty, loading |
| X-12 | Account & settings | Account, prefs | Profile, **theme + accessibility prefs**, language, sign-out | — |
| X-13 | Knowledge Hub · Browse | Educational content (shared) | Categories, article list | empty, loading |
| X-14 | Knowledge Hub · Article | Read an article | Content, source attribution | loading |
| X-15 | AI Chat · Farm Assistant (farmer) | AI help (chat design) | Conversation, input, AI-usage framing | empty/first-run, loading/streaming, error |
| X-16 | AI Chat · Mentor (student) | AI mentor (chat design) | Conversation, session history | empty/first-run, streaming, error |
| X-17 | Unauthorized | RBAC rejection | Explanation + path back | — |
| X-18 | Global system states | Reusable empty/loading/error/offline/404 | Patterns + illustration | n/a (is the states) |

*Chat design (X-15/16) is one shared pattern, two contexts.*

---

## B. Farmer (producer)

| ID | Screen | Purpose | Key content | States |
|----|--------|---------|-------------|--------|
| F-01 | Farmer Home | "What needs my attention" | Pending orders, **awaiting payment**, verification status, recent listings | empty (new farmer), loading |
| F-02 | Verification status | Track identity verification | Pending / verified / rejected + next steps | pending, verified, rejected |
| F-03 | **List produce — capture** (NEW-ish) | Upload the opportunity | Photos/**video**, crop, **quantity**, price, terms, location | draft, validation error, uploading |
| F-04 | List produce — trust framing | Show how it'll appear as an Opportunity | Preview (Opportunity card), market context | — |
| F-05 | List produce — confirm/publish | Publish | Review + publish | success, error |
| F-06 | My Listings | Manage produce | List, status, edit/deactivate | empty, loading |
| F-07 | Listing detail/edit | Edit a listing | Fields, performance | — |
| F-08 | Orders (incoming) | See orders to fulfill | Order list, status | empty, loading |
| F-09 | Order detail / fulfill | Fulfill an order | Buyer, terms, **fulfillment actions**, timeline | per-status |
| F-10 | Money · Ledger | Payments received (#1 anxiety) | Balance, transactions, **payout request** | empty, loading |
| F-11 | Payout request / status | Request & track payout | Amount, method, status | pending, paid, error |
| F-12 | Reviews received | Reputation | Reviews, respond? | empty |
| F-13 | Trust Score detail | Understand my reputation | 4 components, tier, how to improve (honest) | — |
| F-14 | Price intelligence | Market prices | Crop/county prices, **trends** | empty, loading |
| F-15 | Group orders | Cooperative participation | Available groups, join/leave, my group | empty |
| F-16 | Suppliers | Supplier directory | List, detail | empty |
| F-17 | Farm Assistant | (→ X-15) | — | — |
| F-18 | Profile | Identity, farm, settings | Verification, farm details, → settings | — |

---

## C. Buyer (sourcing) — the reframed marketplace

| ID | Screen | Purpose | Key content | States |
|----|--------|---------|-------------|--------|
| B-01 | Buyer Home | Active orders + entry to sourcing | Order status, the 3 entry points | empty, loading |
| B-02 | **Marketplace · Search** | Intent-driven sourcing (~45%) | Query + **filters** (crop, qty, county, timeframe, verified/trust min, price) | empty results, loading |
| B-03 | Search results | Evaluate matches | Opportunity cards/rows, sort/filter | empty, loading |
| B-04 | **Marketplace · Discovery feed** | Opportunity-driven (~35%) | Scroll of **Opportunity cards** (trust/market/delivery signals); desktop + mobile distinct | loading, end-of-feed |
| B-05 | **Post a Need** (NEW) | Reverse marketplace (~20%) | Describe need (crop, qty, county, timeframe, terms) | draft, submitted |
| B-06 | My Needs + responses (NEW) | Suppliers respond to me | Need status, supplier responses to compare | empty, loading |
| B-07 | **Opportunity Review** (NEW) | Build confidence before paying | Farmer, why trusted, **delivery history**, cooperative, market context, **recourse**, **payment protection** | loading |
| B-08 | Commit to Purchase | Decision point | Terms summary, quantity, total, confirm | error |
| B-09 | Checkout / M-Pesa payment | Pay | STK push, status, no-escrow honesty | initiating, pending, success, failed |
| B-10 | Order tracking | Track after payment | Status timeline, payment ref, contact | per-status |
| B-11 | Confirm receipt | Close the loop | Confirm produce received | — |
| B-12 | Review the farmer | Reputation feedback | Review form (→ trust) | — |
| B-13 | Orders history | Past orders | List, status, detail | empty, loading |
| B-14 | **Procurement · Basket** (NEW) | Source across farmers | Multi-farmer basket, request terms | empty |
| B-15 | **Procurement · Compare suppliers** (NEW) | Well-informed sourcing | Side-by-side trusted suppliers | — |
| B-16 | Suppliers directory | Browse verified suppliers | List, supplier detail | empty |
| B-17 | Profile / settings | Account | → settings | — |

---

## D. Student (Education Hub)

| ID | Screen | Purpose | Key content | States |
|----|--------|---------|-------------|--------|
| S-01 | Student Home | Active project / start | Current project status / start CTA | empty (no project), loading |
| S-02 | Create project | Intake | Title, description, git repo | validation error |
| S-03 | **Project workspace** | The core student view | Status stepper, tabs: **documents**, **AI-usage log**, **blockers** | per-tab states, loading |
| S-04 | Documents tab | Upload evidence | Dropzone, files, **hash/tamper-evidence shown** | empty, uploading, error |
| S-05 | AI-usage tab | Disclose AI use | Log entries, add | empty |
| S-06 | Blockers tab | Log/resolve blockers | List, add, resolve | empty |
| S-07 | Submit project | Submit for review | Hashing on submit, confirmation, what-happens-next | confirm, success |
| S-08 | Peer review queue | Assigned reviews | List of assigned | empty, loading |
| S-09 | Peer review workspace | Do a review | Criteria form (anonymous) | error |
| S-10 | Outcome view | See result | VERIFIED / REVISION_REQUIRED / DENIED + meaning + path (honest re: dead-end) | per-outcome |
| S-11 | Portfolio | The showable artifact | Verified items; **shareable** (gap: employer URL not built — honest) | empty |
| S-12 | AI Mentor | (→ X-16) | — | — |
| S-13 | Profile | Account, institution | → settings | — |

---

## E. Lecturer (verifier)

| ID | Screen | Purpose | Key content | States |
|----|--------|---------|-------------|--------|
| L-01 | Lecturer Home | Route to queue/active | Queue summary, credential status | empty, loading |
| L-02 | Credential verification | Track credential status | Pending / verified / revoked | per-status |
| L-03 | Review Queue | Pending engagements (dense) | Table: student(anon), project, submitted, **SLA**, status | empty, loading |
| L-04 | Review workspace | Adjudicate | **Evidence first**; rubric (dimensions + **forced justification**); decision | loading, error |
| L-05 | Decision submitted | Confirm outcome | Recorded decision + attribution | success |
| L-06 | Profile | Account | → settings | — |

---

## F. Admin (governance)

| ID | Screen | Purpose | Key content | States |
|----|--------|---------|-------------|--------|
| A-01 | Admin Overview / triage | Platform health + what needs action | Queues summary, key metrics | loading |
| A-02 | Farmer verification queue | Pending farmer IDs | Dense list | empty, loading |
| A-03 | Farmer case review | Decide | Document viewer, **approve/reject/request-revision**, recorded | error |
| A-04 | Supplier verification queue | Pending suppliers | Dense list | empty |
| A-05 | Supplier case review | Decide | Viewer + decision | error |
| A-06 | Lecturer verification queue | Pending credentials | Dense list | empty |
| A-07 | Lecturer case review | Decide | Credential + decision | error |
| A-08 | Mediation / disputes | Adjudicate disputes | Cases, evidence, resolution | empty |
| A-09 | Payouts | Review & approve payouts | Requests, approve | empty |
| A-10 | Knowledge management | Manage articles | Create/edit/publish | — |
| A-11 | AI brief contexts | Manage AI context | Edit | — |
| A-12 | Group tokens | Ops | Manage tokens | — |
| A-13 | Payment lab | Ops (sim) | Tools | — |
| A-14 | Impact summary | Internal metrics | Aggregates | loading |
| A-15 | **Audit-trail viewer** (NEW — Foundation §5 gap) | Who decided, on what, when | Append-only log, filter, attribution | empty, loading |

---

## G. Summary & suggested build order

**~80 screens** across 6 areas (cross-cutting 18 · farmer 18 · buyer 17 · student 13 · lecturer 6 · admin 15), each with its states. Marked **(NEW)** surfaces (Post-a-Need, Opportunity Review, procurement, audit viewer, delivery-confidence signals) carry **backend-verify flags** — design proceeds, logic untouched, dependencies confirmed before/at build.

**Suggested wireframing order** (one coherent journey at a time, you reviewing each):
1. **Entry** — Sign in + the reframed Onboarding (X-01–X-10) — the front door everyone shares.
2. **Farmer end-to-end** — signup→onboard→**list produce**→orders→**payment** (F-01–F-13).
3. **Buyer end-to-end** — the marketplace (Search/Discovery/Post-a-Need) → **Opportunity Review** → checkout → track → review (B-01–B-13), then procurement (B-14–16).
4. **Student end-to-end** — workspace → submit → outcome → portfolio (S-01–S-11).
5. **Lecturer + Admin** — review/queue/decision surfaces (L, A).
6. **Cross-cutting craft** — AI chat, knowledge, notifications, settings, system states (X-11–X-18).

**Open items to confirm** (won't assume): marketplace comments-vs-reviews, Delivery-Confidence data reality, onboarding format (chat vs step), language support — plus all Foundation §16 user-validation unknowns. Re-order freely; tell me what's missing.
