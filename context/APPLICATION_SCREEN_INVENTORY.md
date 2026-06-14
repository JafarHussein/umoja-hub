# UmojaHub — Application Screen Inventory (v1.1)

**Jurisdiction:** authenticated app shell. Every screen lists its route, status (**live** = page exists, **net-new** = Phase 4 build), and backing endpoint.

**Status:** v1.1 — adds the entire Admin section and the role tool screens the blueprint omitted.

---

## 0. Corrections applied

- Added the **entire Admin section** (verification queues for farmer/lecturer/supplier/buyer, payout-request queue, mediation queue, group-token console, Knowledge CMS, brief contexts, impact summary).
- Added **Farm Assistant, Price Alerts, AI Mentor, Portfolio, peer-review queue list**.
- Added the **farmer settings pane with "Link Institutional Group Token"** (group-token redemption).

---

## 1. Onboarding (live)

| Screen | Route | Endpoint |
| --- | --- | --- |
| Role selection | `/onboarding/role-selection` | `POST /api/onboarding/role` |
| Identity (role-conditional) | `/onboarding/identity-input` | `POST /api/onboarding/identity` |
| Verification / institutional pin | `/onboarding/verification-upload` | `/api/onboarding/verification` · `/institutional-email[/verify]` |

## 2. Farmer

| Screen | Route | Status | Endpoint |
| --- | --- | --- | --- |
| Listings | `/dashboard/farmer/listings` | live | `/api/marketplace?own=true` |
| Orders / fulfillment pipeline | `/dashboard/farmer/orders` | live (UI-01 enhance) | `/api/orders` |
| Profile & verification | `/dashboard/farmer/profile` | live | `/api/farmers`, `/api/farmers/verify` |
| Prices | `/dashboard/farmer/prices` | live | price endpoints |
| Price alerts | within prices | net-new | `/api/prices/alerts` |
| Farm Assistant | `/dashboard/farmer/assistant` | live | `/api/assistant` |
| Group operations hub | `/dashboard/farmer/group` | live (UI-04) | `/api/groups` |
| **Escrow & settlement ledger** | `/dashboard/farmer/ledger` | net-new (UI-02) | `GET /api/farmers/ledger`, `POST /api/farmers/payout-requests` |
| **Settings — "Link Institutional Group Token"** | `/dashboard/farmer/settings` | net-new (UI-05) | `POST /api/groups/redeem-token` |

## 3. Buyer

| Screen | Route | Status | Endpoint |
| --- | --- | --- | --- |
| Marketplace | `/marketplace` | live | `/api/marketplace` |
| Listing detail | `/marketplace/[listingId]` | live | `/api/marketplace/[listingId]` |
| Checkout (90s poll) | within listing detail | net-new (UI-07) | `/api/orders`, daraja |
| Orders | `/dashboard/buyer/orders` | live | `/api/orders` |
| Order detail + **Escalate to Mediation** | `/dashboard/buyer/orders/[orderId]` | live (UI-06 enhance) | `POST /api/orders/[orderId]/mediation` |

## 4. Student

| Screen | Route | Status |
| --- | --- | --- |
| Dashboard | `/dashboard/student` | live |
| New project | `/dashboard/student/projects/new` | live |
| Developer log workbench (3 docs + 2 logs) | `/dashboard/student/projects/[id]` | live (UI-08 enhance) |
| Peer-review queue list | `/dashboard/student/peer-review` | live |
| Peer-review workbench | `/dashboard/student/peer-review/[id]` | live (UI-09) |
| Portfolio | `/dashboard/student/portfolio` | live |
| AI Mentor | `/dashboard/student/mentor` | live |

## 5. Lecturer

| Screen | Route | Status |
| --- | --- | --- |
| Dashboard | `/dashboard/lecturer` | live |
| Review queue | `/dashboard/lecturer/queue` | live |
| Review workspace (4 scores + 4×≥50-word comments) | `/dashboard/lecturer/reviews/[engagementId]` | live (UI-10 enhance) |

## 6. Admin (full section)

| Screen | Route | Status | Endpoint |
| --- | --- | --- | --- |
| Farmer verification queue | `/dashboard/admin/verification-queue` | live | `/api/admin/verification-queue`, `/verify-farmer` |
| Farmer detail | `/dashboard/admin/farmer/[farmerId]` | live | `/api/admin/farmers/[farmerId]` |
| Lecturer verification | `/dashboard/admin/lecturer-verification` | live | `/api/admin/lecturers`, `/verify-lecturer` |
| Supplier verification | `/dashboard/admin/supplier-verification` | live | `/api/admin/supplier-verification` |
| Supplier detail | `/dashboard/admin/supplier/[supplierId]` | live | — |
| **Buyer verification queue** | `/dashboard/admin/buyer-verification` | net-new | `/api/admin/buyer-verification-queue`, `/verify-buyer` |
| **Payout-request queue** | `/dashboard/admin/payouts` | net-new (UI-13) | `/api/admin/payout-requests` |
| **Mediation tracking** | `/dashboard/admin/mediation` | net-new (UI-14) | `/api/admin/mediation-requests` |
| **Group-token mint console** | `/dashboard/admin/group-tokens` | net-new (UI-15) | `POST /api/admin/group-tokens` |
| Knowledge CMS | `/dashboard/admin/knowledge` | live | `/api/admin/knowledge/articles` |
| Brief contexts | `/dashboard/admin/brief-contexts` | live | `/api/admin/brief-contexts` |
| Impact summary | `/dashboard/admin/impact-summary` | live | `/api/admin/impact-summary` |

## 7. Shared / public

| Screen | Route |
| --- | --- |
| Login (OAuth only) | `/auth/login` |
| Unauthorized | `/auth/unauthorized` |
| Knowledge hub / article | `/knowledge`, `/knowledge/[slug]` |
| Supplier directory (read-only telemetry, UI-11) | within farmer/buyer hubs |
