# WEBSITE / WEB APP BOUNDARY
**Classification:** System Manifesto — Architectural Law  
**Authority:** Supersedes any prior implicit decisions about component placement.  
**Enforcement:** Every new file, every new component, every new page must clear this boundary before being written.

---

## PRELIMINARY NOTE: ACTUAL DIRECTORY STRUCTURE

There is no `/site` folder in this repository. The two systems exist as Next.js route groups within `src/app/`:

| System | Directory | URL Pattern |
|--------|-----------|-------------|
| Informational Website | `src/app/(website)/` | `umojahub.com/*` |
| Operational Web App | `src/app/dashboard/` | `umojahub.com/dashboard/*` |
| Auth Gateway | `src/app/auth/` | `umojahub.com/auth/*` |
| **Homeless (needs assignment)** | `src/app/marketplace/`, `src/app/knowledge/` | See Section 1 |

The `(website)` route group in Next.js is a parenthesized directory — it does not affect the URL path. All pages inside it render at the root domain. This is the correct location for the informational website. The rest of this document uses `(website)` and `dashboard` as the authoritative labels.

---

## SECTION 1 — PURGE LOG & STRUCTURAL BREAKDOWN

Every file in the codebase is classified below. Classification law: a component belongs where the **lowest-trust user state that can legitimately access it** dictates. If anonymous access is legitimate, it belongs on the website. If session + role is required to make the component meaningful, it belongs in the app.

---

### PAGES: `src/app/(website)/`

| File | Classification | Justification |
|------|---------------|---------------|
| `page.tsx` | `[WEBSITE]` | Anonymous entry point; answers "what is UmojaHub" within 15 seconds; no session dependency. |
| `about/page.tsx` | `[WEBSITE]` | Platform origin, current state, geographic scope, contact — all pre-commitment informational content. |
| `transparency/page.tsx` | `[WEBSITE]` | Live metrics and methodology disclosure; must be readable without an account to serve auditors and donors. |
| `trust/page.tsx` | `[WEBSITE]` | Verification rubric documentation; a visitor evaluating the platform reads this before registering. |
| `team/page.tsx` | `[WEBSITE]` | Named administrator accountability and appeals pathway; public accountability requires public access. |
| `how-it-works/page.tsx` | `[WEBSITE]` | Sequential walkthrough of platform mechanics; pre-registration educational content. |
| `education/page.tsx` | `[WEBSITE]` | Education Hub overview; audience routing gateway for anonymous students, lecturers, and employers. |
| `for/farmers/page.tsx` | `[WEBSITE]` | Farmer audience gateway; sets expectations and verifies relevance before any account creation. |
| `for/buyers/page.tsx` | `[WEBSITE]` | Buyer audience gateway; explains what verified procurement means before commitment. |
| `for/suppliers/page.tsx` | `[WEBSITE]` | Supplier audience gateway; surfaces verification criteria and limitations upfront. |
| `for/cooperatives/page.tsx` | `[WEBSITE]` | Cooperative audience gateway; explains group listing mechanics before registration. |
| `for/students/page.tsx` | `[WEBSITE]` | Student audience gateway; clarifies what Portfolio Verified means and what the platform cannot provide. |
| `for/lecturers/page.tsx` | `[WEBSITE]` | Lecturer audience gateway; explains the review protocol and time expectations before signup. |
| `for/employers/page.tsx` | `[WEBSITE]` | Employer audience gateway; defines what Portfolio Verified means legally and practically. |
| `for/institutions/page.tsx` | `[WEBSITE]` | Institution audience gateway; explains what institutional partnership involves. |
| `for/ngos/page.tsx` | `[WEBSITE]` | NGO & Government gateway; mandate alignment matrix, what field staff can and cannot do, untracked items. |
| `layout.tsx` | `[WEBSITE]` | Injects WebsiteNav and WebsiteFooter; provides `body.is-hydrated` gate and IntersectionObserver for progressive animation. |

---

### PAGES: `src/app/marketplace/` and `src/app/knowledge/` — HOMELESS

These pages currently live outside both route groups. They have no layout inheritance from `(website)` — no WebsiteNav, no WebsiteFooter. They are architectural orphans. Both must be relocated.

| File | Final Classification | Ruling |
|------|---------------------|--------|
| `marketplace/page.tsx` | `[WEBSITE]` | Anonymous read-only browse of verified listings. ISR 60s. No session required. Equivalent to browsing Stripe's product directory before creating an account. Belongs at `(website)/marketplace/page.tsx`. |
| `marketplace/[listingId]/page.tsx` | `[WEBSITE]` — with one ejection | The listing detail view (images, trust score, farmer county, quantity) is informational and should be publicly accessible. **However:** `CheckoutForm` (M-Pesa payment initiation) is an operational write action and must not render for unauthenticated users. The page must gate the checkout action on session: anonymous users see listing detail + "Sign in to purchase" CTA; authenticated buyers see the checkout form. The page stays on the website; the transactional mutation gates on auth state. |
| `knowledge/page.tsx` | `[WEBSITE]` | Read-only agricultural article browsing. ISR 3600s. No session required. Content is editorial, not user-generated per visit. Belongs at `(website)/knowledge/page.tsx`. |
| `knowledge/[slug]/page.tsx` | `[WEBSITE]` | Individual knowledge article. Read-only, statically rendered, no write operations. Belongs at `(website)/knowledge/[slug]/page.tsx`. |
| `knowledge/KnowledgeHubClient.tsx` | `[WEBSITE]` | Client-side category filter for the knowledge browse page. Remains with its page. |

---

### PAGES: `src/app/dashboard/`

All dashboard pages are `[WEB APP]`. Justification is identical across all: they require an authenticated session, perform role-gated operations, and initiate write mutations against the database.

| File | Classification | Specific Justification |
|------|---------------|----------------------|
| `dashboard/layout.tsx` | `[WEB APP]` | Authenticated shell with role-based sidebar and header. Session validation at layout level. |
| `dashboard/farmer/listings/page.tsx` | `[WEB APP]` | Creates and manages listings — a write operation requiring FARMER role session. |
| `dashboard/farmer/orders/page.tsx` | `[WEB APP]` | Order fulfillment management; reads/updates farmer's own orders under session. |
| `dashboard/farmer/assistant/page.tsx` | `[WEB APP]` | Groq AI farm assistant; stateful chat, session-persisted, role-gated. |
| `dashboard/farmer/group/page.tsx` | `[WEB APP]` | Cooperative group order participation; requires verified FARMER role. |
| `dashboard/farmer/prices/page.tsx` | `[WEB APP]` | Price intelligence dashboard with county-specific data pulled under farmer session. |
| `dashboard/farmer/profile/page.tsx` | `[WEB APP]` | Profile and document management; write operations, session required. |
| `dashboard/buyer/orders/page.tsx` | `[WEB APP]` | Buyer order history and management; reads buyer's own transactional records. |
| `dashboard/buyer/orders/[orderId]/page.tsx` | `[WEB APP]` | Individual order detail with payment status and fulfillment timeline; session-scoped. |
| `dashboard/student/page.tsx` | `[WEB APP]` | Student entry point; immediately fetches student's engagement record, redirects to active project. |
| `dashboard/student/projects/new/page.tsx` | `[WEB APP]` | Project creation form; POST to DB, STUDENT role required. |
| `dashboard/student/projects/[id]/page.tsx` | `[WEB APP]` | Project workspace with tabs (AI usage, blockers, documents); write operations, session-scoped. |
| `dashboard/student/portfolio/page.tsx` | `[WEB APP]` | Portfolio management; reads and displays verified portfolio items under session. |
| `dashboard/student/peer-review/page.tsx` | `[WEB APP]` | Peer review queue; lists assigned reviews, session-scoped. |
| `dashboard/student/peer-review/[id]/page.tsx` | `[WEB APP]` | Peer review submission; write operation, STUDENT role, one review per engagement. |
| `dashboard/student/mentor/page.tsx` | `[WEB APP]` | Groq AI mentor chat; stateful conversation, session-persisted. |
| `dashboard/lecturer/page.tsx` | `[WEB APP]` | Lecturer entry point; routes to active review queue. |
| `dashboard/lecturer/queue/page.tsx` | `[WEB APP]` | Verification review queue; lists pending student engagements, LECTURER role required. |
| `dashboard/lecturer/reviews/[engagementId]/page.tsx` | `[WEB APP]` | Review scoring and submission; write operation, LECTURER role. |
| `dashboard/admin/verification-queue/page.tsx` | `[WEB APP]` | Farmer/supplier document review queue; ADMIN role required. |
| `dashboard/admin/farmer/[farmerId]/page.tsx` | `[WEB APP]` | Individual farmer review and verification decision; write operation, ADMIN role. |
| `dashboard/admin/supplier-verification/page.tsx` | `[WEB APP]` | Supplier batch verification queue; ADMIN role. |
| `dashboard/admin/supplier/[supplierId]/page.tsx` | `[WEB APP]` | Individual supplier review and decision; write operation, ADMIN role. |
| `dashboard/admin/lecturer-verification/page.tsx` | `[WEB APP]` | Lecturer credential verification queue; ADMIN role. |
| `dashboard/admin/knowledge/page.tsx` | `[WEB APP]` | Knowledge article management; write operations, ADMIN role. |
| `dashboard/admin/brief-contexts/page.tsx` | `[WEB APP]` | AI brief context management; write operations, ADMIN role. |
| `dashboard/admin/impact-summary/page.tsx` | `[WEB APP]` | Aggregate platform metrics for internal reporting; ADMIN role. |

---

### PAGES: `src/app/auth/`

Auth pages are a gateway layer — neither website nor app. They serve users in transition between states.

| File | Classification | Justification |
|------|---------------|---------------|
| `auth/login/page.tsx` | `[SHARED]` | Entry into the authenticated system; accessed from website CTAs; renders without session. |
| `auth/register/page.tsx` | `[SHARED]` | New account creation; accessed from website; no session required to load. |
| `auth/forgot-password/page.tsx` | `[SHARED]` | Recovery flow; no session required; not a dashboard operation. |
| `auth/reset-password/page.tsx` | `[SHARED]` | Token-gated password reset; not an authenticated operation but not public content either. |
| `auth/unauthorized/page.tsx` | `[SHARED]` | RBAC rejection screen; shown when a session lacks the required role for a dashboard route. |

---

### COMPONENTS: `src/components/website/`

| File | Classification | Justification |
|------|---------------|---------------|
| `WebsiteNav.tsx` | `[WEBSITE]` | Anonymous-facing primary navigation; no session dependency; renders hub dropdown menus. |
| `WebsiteFooter.tsx` | `[WEBSITE]` | Anonymous-facing footer with governance links; static editorial content. |
| `GovernancePage.tsx` | `[WEBSITE]` | Reusable layout shell for About/Transparency/Team/NGOs; dark header + sticky section anchor + CTA footer. |
| `SectionAnchor.tsx` | `[WEBSITE]` | Three-tier responsive in-page navigation (desktop sidebar, tablet tab strip, mobile select); website content only. |
| `LimitationPanel.tsx` | `[WEBSITE]` | Amber amber disclosure panel for capability claims; website transparency infrastructure. |
| `AdminProfile.tsx` | `[WEBSITE]` | Named administrator display with credentials; public accountability, not an app admin tool. |
| `CentralStructuralDiagram.tsx` | `[WEBSITE]` | SVG architecture diagram (desktop 840×290, mobile 360×520); educational, no dynamic data. |
| `TrustScoreNarrative.tsx` | `[WEBSITE]` | Example trust score breakdown with GSAP scroll animation on desktop; illustrative, not live data. |
| `DataPanel.tsx` | `[WEBSITE]` | Platform statistics display panel; reads from transparency API, renders on website. |
| `LivePlatformStats.tsx` | `[WEBSITE]` | Live metric counters from the transparency data feed; website governance section. |
| `PlatformStatusWidget.tsx` | `[WEBSITE]` | Service status grid (operational/pending/degraded); transparency disclosure on website. |
| `StatusLabel.tsx` | `[WEBSITE]` | Inline status indicator (OPERATIONAL / PENDING / DEGRADED); website token colors only. |
| `HubCard.tsx` | `[WEBSITE]` | Hub entry card on homepage; editorial, no session dependency. |
| `WorkflowStep.tsx` | `[WEBSITE]` | Numbered step display in how-it-works flows; static educational content. |
| `FaqAccordion.tsx` | `[WEBSITE]` | FAQ section wrapper; renders FaqItem list; no session dependency. |
| `FaqItem.tsx` | `[WEBSITE]` | Individual accordion FAQ item; static editorial content. |
| `TrustScoreDisplay.tsx` | `[WEBSITE]` | Website-specific trust score display; uses ws-* tokens. Distinct from the app version in `foodhub/`. |
| `AudienceNavigator.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion in a cleanup sprint. |
| `AudiencePage.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `EcosystemMap.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `EduHubPage.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `EducationFlowSection.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `FoodHubPage.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `HeroPlatformStatement.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `MarketplaceFlowSection.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `ProcessFlow.tsx` | `[WEBSITE — DEAD]` | V1 component using deprecated app tokens (text-accent-green, font-heading/Sora, font-mono/JetBrains); not imported by any active page; candidate for deletion. |
| `TrustArchitectureSection.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |
| `TrustChainDiagram.tsx` | `[WEBSITE — DEAD]` | V1 component not imported by any active page; candidate for deletion. |

---

### COMPONENTS: `src/components/foodhub/`

| File | Classification | Justification |
|------|---------------|---------------|
| `CheckoutForm.tsx` | `[WEB APP]` | Initiates M-Pesa STK push and creates an Order document; write operation, should only render for authenticated buyers. |
| `CreateListingForm.tsx` | `[WEB APP]` | Creates a Listing document; write operation, FARMER role required. |
| `FarmAssistantChat.tsx` | `[WEB APP]` | Stateful AI chat using Groq; session-persisted conversation, FARMER role. |
| `GroupOrderCard.tsx` | `[WEB APP]` | Displays and manages group order participation; session-scoped. |
| `OrderTimeline.tsx` | `[WEB APP]` | Renders order state machine progression; reads session-scoped order data. |
| `PriceIntelligenceDashboard.tsx` | `[WEB APP]` | Full price intelligence workspace with county-scoped charts; FARMER role dashboard widget. |
| `TrustScoreDisplay.tsx` | `[WEB APP]` | Renders `compositeScore + tier` for app context; uses deprecated V1 tokens (text-accent-green, font-mono). Distinct from `components/website/TrustScoreDisplay.tsx`. |
| `FarmerListingCard.tsx` | `[SHARED]` | Used in both the public marketplace browse page and the farmer dashboard listings page; read-only display. |
| `KnowledgeArticleCard.tsx` | `[SHARED]` | Used in both the public knowledge hub and potentially in dashboard knowledge management; read-only display. |
| `MarketplaceFilters.tsx` | `[SHARED]` | Client-side filter UI used on the public marketplace browse page; no session dependency, pure UI state. |
| `PriceTrendChart.tsx` | `[SHARED]` | Recharts wrapper for price trend data; renderable in both public price pages and dashboard contexts. |
| `SupplierCard.tsx` | `[SHARED]` | Supplier display card; read-only, renderable in both public and authenticated contexts. |
| `ArticleSourceBadge.tsx` | `[SHARED]` | Source attribution badge for knowledge articles; pure display, no session dependency. |

---

### COMPONENTS: `src/components/education/`

| File | Classification | Justification |
|------|---------------|---------------|
| `MentorChat.tsx` | `[WEB APP]` | Groq AI mentor; stateful conversation persisted under student session. |
| `DocumentsTab.tsx` | `[WEB APP]` | Document upload dropzone; write operation via Cloudinary, session-scoped to the student's project. |
| `BlockersTab.tsx` | `[WEB APP]` | Project blocker management; write operations, session-scoped. |
| `AIUsageTab.tsx` | `[WEB APP]` | AI usage disclosure tab within the project workspace; session-scoped. |
| `ProjectStatusStepper.tsx` | `[WEB APP]` | Renders the project lifecycle state machine; reads session-scoped project state. |
| `ReviewScoreForm.tsx` | `[WEB APP]` | Lecturer review scoring and submission form; write operation, LECTURER role required. |

---

### COMPONENTS: `src/components/shared/`

| File | Classification | Justification |
|------|---------------|---------------|
| `Header.tsx` | `[WEB APP]` | Authenticated dashboard header; accepts `role`, `firstName`, `onSignOut` — meaningless without a session. |
| `Sidebar.tsx` | `[WEB APP]` | Role-based dashboard navigation; renders different nav items per Role enum value. |
| `LayoutWrapper.tsx` | `[WEB APP]` | Dashboard shell combining Header and Sidebar; strictly an authenticated layout. |
| `Providers.tsx` | `[SHARED]` | Next.js `SessionProvider` and `ThemeProvider` wrapper; required by both website (for auth state) and app. |

---

### COMPONENTS: `src/components/ui/`

All UI primitives are `[SHARED]`. They carry no domain logic, no session dependency, and no assumptions about user state.

| File | Classification | Note |
|------|---------------|------|
| `button.tsx` | `[SHARED]` | Design system primitive. |
| `Badge.tsx` | `[SHARED]` | Design system primitive. |
| `Card.tsx` | `[SHARED]` | Design system primitive. |
| `Input.tsx` | `[SHARED]` | Design system primitive. |
| `Modal.tsx` | `[SHARED]` | Design system primitive. |
| `SkeletonLoader.tsx` | `[SHARED]` | Loading state primitives (ListSkeleton, CardSkeleton). |
| `VerifiedBadge.tsx` | `[SHARED]` | Verified state badge; renderable in both contexts. |
| `accordion.tsx` | `[SHARED]` | Design system primitive. |
| `navigation-menu.tsx` | `[SHARED]` | Design system primitive. |
| `scroll-area.tsx` | `[SHARED]` | Design system primitive. |
| `sheet.tsx` | `[SHARED]` | Design system primitive; used by WebsiteNav mobile hamburger. |
| `tabs.tsx` | `[SHARED]` | Design system primitive. |

---

## SECTION 2 — REFINED STATIC WEBSITE ARCHITECTURE

The website answers one question per page and exits. Every page is publicly accessible, server-rendered, and content-complete without JavaScript. The nav is WebsiteNav. The footer is WebsiteFooter. No session is required to read any page.

### Route Map

```
src/app/(website)/
│
├── page.tsx                         HOMEPAGE
│   ├── Block 1: Above-fold — platform definition + 15-second routing
│   │   Four routing cards: Farmer / Student / Buyer / NGO
│   │   Each card: what you can do, what you cannot, where to start
│   ├── Block 2: Dual-hub explanation — why agriculture + education on one platform
│   │   Operational answer: one verification infrastructure serves both
│   ├── Block 3: Trust architecture overview
│   │   TrustScoreNarrative (GSAP desktop only, CSS fallback mobile)
│   │   CentralStructuralDiagram (SVG, static-first)
│   ├── Block 4: Live platform stats
│   │   LivePlatformStats (ISR 300s)
│   └── Block 5: Entry CTAs — Register / Sign In
│
├── for/
│   ├── farmers/page.tsx             FARMER AUDIENCE GATEWAY
│   │   ├── What you get (with explicit does-not-include)
│   │   ├── Verification requirements and timeline
│   │   ├── LimitationPanel: what the platform cannot guarantee
│   │   ├── Step-by-step success journey (GovernancePage layout)
│   │   └── CTA: Register as Farmer → /auth/register?role=farmer
│   │
│   ├── buyers/page.tsx              BUYER AUDIENCE GATEWAY
│   │   ├── What verified procurement means
│   │   ├── How trust scores work (links to /trust)
│   │   ├── What buyer protections exist and do not exist
│   │   └── CTA: Browse Marketplace → /marketplace
│   │
│   ├── suppliers/page.tsx           SUPPLIER AUDIENCE GATEWAY
│   │   ├── Supplier verification criteria
│   │   ├── LimitationPanel: verification does not guarantee sales volume
│   │   └── CTA: Register as Supplier → /auth/register?role=supplier
│   │
│   ├── cooperatives/page.tsx        COOPERATIVE AUDIENCE GATEWAY
│   │   ├── How group listings work
│   │   ├── Cooperative membership requirements
│   │   └── CTA: Register → /auth/register
│   │
│   ├── students/page.tsx            STUDENT AUDIENCE GATEWAY
│   │   ├── What Portfolio Verified means
│   │   ├── What it does not mean (employment guarantee, salary data)
│   │   ├── Verification criteria: project, peer review, lecturer sign-off, git commits
│   │   ├── LimitationPanel: we verify process, not outcome quality
│   │   └── CTA: Register as Student → /auth/register?role=student
│   │
│   ├── lecturers/page.tsx           LECTURER AUDIENCE GATEWAY
│   │   ├── Review protocol and time commitment (72-hour SLA)
│   │   ├── What lecturers can and cannot do during review
│   │   ├── How decisions are documented
│   │   └── CTA: Register as Lecturer → /auth/register?role=lecturer
│   │
│   ├── employers/page.tsx           EMPLOYER AUDIENCE GATEWAY
│   │   ├── What Portfolio Verified means legally and practically
│   │   ├── What employers can verify independently
│   │   ├── Attribution limitations (we do not guarantee code authorship)
│   │   └── CTA: Browse Verified Portfolios → (future public portfolio index)
│   │
│   ├── institutions/page.tsx        INSTITUTION AUDIENCE GATEWAY
│   │   ├── Institutional partnership explanation
│   │   ├── What data institutions can access (none, currently)
│   │   └── CTA: Contact → mailto inquiry
│   │
│   └── ngos/page.tsx                NGO & GOVERNMENT GATEWAY
│       ├── Mandate alignment matrix (food security + education/youth)
│       ├── What field staff can and cannot do
│       ├── Impact metrics with methodology disclosure
│       ├── Untracked items (6 explicit)
│       ├── FAQ (10 items)
│       └── How to engage per audience type
│
├── marketplace/page.tsx             PUBLIC LISTING BROWSE (relocate from root)
│   ├── Verified listing grid (ISR 60s)
│   ├── MarketplaceFilters (client-side, no session)
│   └── FarmerListingCard (read-only, no checkout)
│
├── marketplace/[listingId]/page.tsx  LISTING DETAIL (relocate from root)
│   ├── Listing images, crop info, quantity, price
│   ├── Farmer trust score (public read)
│   ├── Public view: "Sign in to purchase" CTA for anonymous users
│   └── Authenticated view: CheckoutForm (session-gated, BUYER role)
│
├── knowledge/page.tsx               PUBLIC KNOWLEDGE HUB (relocate from root)
│   ├── Agricultural article browse (ISR 3600s)
│   ├── Category filter (client-side)
│   └── KnowledgeArticleCard grid
│
├── knowledge/[slug]/page.tsx        KNOWLEDGE ARTICLE (relocate from root)
│   ├── Full article content
│   └── Source attribution (ArticleSourceBadge)
│
├── trust/page.tsx                   TRUST & VERIFICATION METHODOLOGY
│   ├── Verification rubric per actor type
│   ├── Score calculation methodology
│   ├── What verification does not guarantee
│   └── Links to /team for accountability
│
├── transparency/page.tsx            TRANSPARENCY HUB
│   ├── Live metrics (ISR 300s): verified farmers, orders, KES volume, counties, verified projects, verified lecturers
│   ├── Calculation methodology per metric
│   ├── What we do not track (6 items)
│   ├── Infrastructure provider disclosure
│   ├── Automated tool disclosure
│   └── Service status grid
│
├── team/page.tsx                    VERIFICATION TEAM
│   ├── Named administrators with credentials
│   ├── Decision attribution examples per actor type
│   ├── Verification criteria documentation per type
│   ├── Appeals process (30-day for farmers/suppliers, 72-hour for students)
│   └── Escalation process
│
├── about/page.tsx                   ABOUT UMOJAHUB
│   ├── Three structural failures addressed
│   ├── Current platform state (Food Security Hub + Education Hub, operational/pending)
│   ├── Geographic focus (Kenya first, East Africa in scope)
│   └── Contact inquiry types
│
├── how-it-works/page.tsx            HOW IT WORKS
│   ├── End-to-end walkthrough per actor type
│   └── WorkflowStep components
│
└── education/page.tsx               EDUCATION HUB OVERVIEW
    ├── Education Hub component map
    └── Links to /for/students, /for/lecturers, /for/employers, /for/institutions
```

### Website Layout Constraints

- **Nav**: `WebsiteNav` only. No dashboard chrome, no Sidebar, no role badge.
- **Footer**: `WebsiteFooter` only. Links to governance, contact, platform status.
- **Font surface**: ws-* Tailwind tokens exclusively. No `font-heading` (Sora), no `text-accent-green`, no `font-mono` (JetBrains Mono) — those are app tokens.
- **Animation**: CSS-first. GSAP loaded dynamically, desktop-only, for three sequences maximum.
- **Auth dependency**: Zero. Every page renders complete content without a session. Auth state may be read client-side to personalize a CTA (e.g., "Go to Dashboard" instead of "Register") but is never required for content delivery.
- **ISR**: Homepage + Transparency = `revalidate = 300`. All audience pages = `revalidate = 86400`. Marketplace = `revalidate = 60`. Knowledge = `revalidate = 3600`.

---

## SECTION 3 — OPERATIONAL WEB APP BLUEPRINT

The app answers one question: "given that I am authenticated and role-confirmed, what operation do I need to execute right now?" Every page assumes a session. Every mutation requires the correct Role. The layout is the authenticated shell: `Sidebar` + `Header` + role-specific workspace.

### Route Map

```
src/app/dashboard/
│
├── layout.tsx                       AUTHENTICATED SHELL
│   ├── Validates session via getServerSession
│   ├── Renders Sidebar (role-specific nav)
│   ├── Renders Header (role badge, user menu, sign-out)
│   └── Redirects to /auth/login if no session
│
├── farmer/
│   ├── listings/page.tsx            LISTING MANAGER
│   │   ├── My listings grid (FarmerListingCard)
│   │   ├── CreateListingForm (inline or modal)
│   │   ├── Edit / deactivate listing controls
│   │   └── Verification status per listing
│   │
│   ├── orders/page.tsx              ORDER FULFILLMENT
│   │   ├── Incoming orders list
│   │   ├── OrderTimeline per order
│   │   └── Fulfillment confirmation actions
│   │
│   ├── prices/page.tsx              PRICE INTELLIGENCE
│   │   ├── PriceIntelligenceDashboard
│   │   ├── PriceTrendChart per crop/county
│   │   └── County market comparison
│   │
│   ├── assistant/page.tsx           AI FARM ASSISTANT
│   │   ├── FarmAssistantChat (Groq)
│   │   └── Conversation history (session-persisted)
│   │
│   ├── group/page.tsx               GROUP ORDERS
│   │   ├── GroupOrderCard list
│   │   └── Join / leave group actions
│   │
│   └── profile/page.tsx             PROFILE & DOCUMENTS
│       ├── Identity document upload (Cloudinary)
│       ├── Farm details management
│       └── Verification status display
│
├── buyer/
│   ├── orders/page.tsx              ORDER HISTORY
│   │   └── All buyer orders with status
│   │
│   └── orders/[orderId]/page.tsx    ORDER DETAIL
│       ├── OrderTimeline
│       ├── Payment status (M-Pesa reference)
│       └── Fulfillment tracking
│
├── student/
│   ├── page.tsx                     STUDENT ENTRY
│   │   └── Redirects to active project or project creation
│   │
│   ├── projects/new/page.tsx        PROJECT CREATION
│   │   └── New project intake form (title, description, git repo)
│   │
│   ├── projects/[id]/page.tsx       PROJECT WORKSPACE
│   │   ├── ProjectStatusStepper
│   │   ├── DocumentsTab (upload, manage)
│   │   ├── BlockersTab (log, resolve)
│   │   └── AIUsageTab (disclosure log)
│   │
│   ├── portfolio/page.tsx           PORTFOLIO MANAGER
│   │   └── Verified and pending portfolio items
│   │
│   ├── peer-review/page.tsx         PEER REVIEW QUEUE
│   │   └── Assigned reviews list
│   │
│   ├── peer-review/[id]/page.tsx    PEER REVIEW WORKSPACE
│   │   └── Review criteria form + submission
│   │
│   └── mentor/page.tsx              AI MENTOR
│       └── MentorChat (Groq, session-persisted)
│
├── lecturer/
│   ├── page.tsx                     LECTURER ENTRY
│   │   └── Routes to queue or active review
│   │
│   ├── queue/page.tsx               REVIEW QUEUE
│   │   └── Pending student engagement list
│   │
│   └── reviews/[engagementId]/page.tsx  REVIEW WORKSPACE
│       ├── Student project evidence
│       ├── ReviewScoreForm
│       └── Decision submission (approve / revise / reject)
│
└── admin/
    ├── verification-queue/page.tsx   FARMER VERIFICATION QUEUE
    │   └── Pending farmer document submissions
    │
    ├── farmer/[farmerId]/page.tsx    FARMER REVIEW
    │   ├── Document viewer
    │   └── Approve / reject / request-revision actions
    │
    ├── supplier-verification/page.tsx  SUPPLIER QUEUE
    │   └── Pending supplier submissions
    │
    ├── supplier/[supplierId]/page.tsx  SUPPLIER REVIEW
    │   └── Document viewer + decision actions
    │
    ├── lecturer-verification/page.tsx  LECTURER CREDENTIAL QUEUE
    │   └── Pending lecturer credential submissions
    │
    ├── knowledge/page.tsx            KNOWLEDGE MANAGEMENT
    │   └── Article create / edit / publish controls
    │
    ├── brief-contexts/page.tsx       AI BRIEF CONTEXTS
    │   └── AI assistant context management
    │
    └── impact-summary/page.tsx       INTERNAL IMPACT METRICS
        └── Aggregate platform statistics (internal view, not the public transparency page)
```

### App Layout Constraints

- **Layout**: `dashboard/layout.tsx` provides Sidebar + Header. No WebsiteNav, no WebsiteFooter.
- **Font surface**: App tokens. The app has its own token set (separate from ws-*). Do not mix ws-* tokens into dashboard components.
- **Session requirement**: Every page calls `getServerSession(authOptions)` and `requireRole()` before any DB operation. No exceptions.
- **Animation**: None. The app is a tool, not a story. No GSAP, no CSS entrance animations. Loading states use SkeletonLoader primitives.
- **Write operations**: All mutations go through API routes at `/api/*`. No direct model access from page components.

---

## SECTION 4 — CROSS-SYSTEM INTERCONNECTS

### Website → Web App Entry Points

**Global Header CTAs (WebsiteNav)**

| Action | Behavior | Notes |
|--------|----------|-------|
| "Register" button | `href="/auth/register"` — renders role selection | First screen of the registration wizard |
| "Sign in" link | `href="/auth/login"` — renders login form | On success, NextAuth redirects to `callbackUrl` or default dashboard per role |
| Nav dropdown "Appeals & Disputes" | `href="/team#appeals-process"` | Stays on website; the appeals pathway is a governance document, not an app operation |

**Homepage Routing Cards**

Each of the four homepage routing cards (Farmer, Student, Buyer, NGO) leads to the relevant audience gateway page on the website, not directly into the app. The gateway page does the expectation-setting. The CTA at the bottom of each gateway page is the actual entry into auth.

| Card | Gateway page | Gateway CTA target |
|------|-------------|-------------------|
| Farmer | `/for/farmers` | `/auth/register?role=farmer` |
| Student | `/for/students` | `/auth/register?role=student` |
| Buyer | `/for/buyers` | `/marketplace` (browse first, auth gates checkout) |
| NGO / Government | `/for/ngos` | Contact inquiry (mailto, no app account) |

**In-Content CTAs**

Any page on the website that mentions a specific dashboard feature links to the relevant gateway page, never directly to a dashboard URL. A farmer reading `/for/farmers` sees "Register to list your produce" → `/auth/register?role=farmer`. An authenticated farmer reading the same page (detected client-side via `useSession`) sees "Go to your listings" → `/dashboard/farmer/listings`. The page content is identical; only the CTA resolves differently based on session state.

**Marketplace Checkout Gate**

On `/marketplace/[listingId]`, the `CheckoutForm` renders only if `session?.user.role === Role.BUYER`. Anonymous users and non-buyer authenticated users see a disclosure instead:

```
Anonymous:            "Sign in as a Buyer to purchase this listing."  →  /auth/login?callbackUrl=/marketplace/[listingId]
Authenticated Farmer: "You are registered as a Farmer. Buyers purchase listings."
```

The listing detail data (farmer name, county, trust score, images, pricing) is always visible. Only the transactional action gates on session.

---

### Web App → Website Exit Points

Authenticated users have four legitimate reasons to jump to the website from inside the app. All exits open in the same tab (no `target="_blank"`) since these are same-domain navigations that do not terminate the session.

| From (App) | To (Website) | Trigger |
|-----------|-------------|---------|
| Any dashboard page | `/trust` | "How is my trust score calculated?" link in farmer profile sidebar |
| Any dashboard page | `/transparency` | "Platform status" link in dashboard footer |
| Any dashboard page | `/team#appeals-process` | "Appeal a decision" link shown on rejected verification status cards |
| Student project workspace | `/for/students` | "What does Portfolio Verified mean?" info link near the verification status stepper |

The app dashboard layout (`dashboard/layout.tsx`) does not include WebsiteNav — the Sidebar handles all in-app navigation. These exit links are inline, contextual, and targeted. They do not represent a navigation paradigm shift; they are documentation references.

**Session preservation**: Because these are same-domain navigation events (not cross-domain), the NextAuth session cookie persists across navigation. An authenticated user who clicks "How is my trust score calculated?" from their dashboard, reads `/trust`, and then presses the browser back button returns to their dashboard session intact. No re-authentication required.

---

## ENFORCEMENT CHECKLIST

Before committing any new page or component, answer all four questions:

1. **User state**: Can an anonymous user access this legitimately? If yes → `(website)`. If session required → `dashboard`.
2. **Write operations**: Does this component initiate any database mutation, M-Pesa call, or file upload? If yes → `dashboard` or session-gated within `(website)`.
3. **Token surface**: Does this component use ws-* tokens? If yes → it belongs in `(website)` components. Does it use app tokens (text-accent-green, font-heading, font-mono)? If yes → it belongs in `foodhub/`, `education/`, or `shared/`.
4. **Layout inheritance**: Does this page need WebsiteNav + WebsiteFooter? → Place inside `(website)`. Does it need Sidebar + Header? → Place inside `dashboard`.

If any answer is ambiguous, default to the more restrictive classification and document the reason. Ambiguity resolves toward protection, not permissiveness.
