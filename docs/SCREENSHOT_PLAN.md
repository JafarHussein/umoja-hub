# Screenshot Acquisition Plan

This document is the single source of truth for the README's visual narrative. Every
filename here is referenced by `README.md` — capture them with the exact names so the
document renders fully.

Two ways to capture:

- **Automated (recommended):** `scripts/capture-screenshots.ts` drives a running dev
  server with Playwright, minting a session cookie per role, and writes every PNG below
  with the correct name. (The app ships a light theme today; there is no dark capture.)
- **Manual:** mint a cookie with `scripts/dev-session.ts <email>`, set it in the browser,
  navigate to the route, and save the PNG under `docs/screenshots/<name>.png`.

## Prerequisites

```bash
npm run db:seed       # 5 canonical accounts (farmer, buyer, student, lecturer, admin)
npm run seed:demo     # full ecosystem (adds NGO / Employer / Institution + months of data)
npm run dev           # dev server on :3000 (separate terminal)
npx playwright install chromium
```

## Run the automated capture

```bash
tsx scripts/capture-screenshots.ts
# or against a custom origin:
BASE_URL=http://localhost:3000 tsx scripts/capture-screenshots.ts
```

Output lands in `docs/screenshots/`. Dynamic routes (`:listingId`, `:articleSlug`,
`:portfolioSlug`, `:engagementId`) are resolved automatically from seeded data; if any are
skipped, run `npm run seed:demo` again so the collections are populated, then re-run.

## Demo accounts

| Role | Account | Source |
|---|---|---|
| Farmer | `wanjiku.kamau@gmail.com` | `db:seed` |
| Buyer | `kamau.githinji@gmail.com` | `db:seed` |
| Student | `brian.otieno@students.uonbi.ac.ke` | `db:seed` |
| Lecturer | `g.ndungu@uonbi.ac.ke` | `db:seed` |
| Admin | `umojahub16@gmail.com` | `db:seed` |
| NGO / Employer / Institution | first user of each role | `seed:demo` (generated emails) |

## Checklist — exact filenames

### Public surface (no auth)
- [ ] `website-hero.png` — public marketing home (`/`)
- [ ] `auth-login.png` — credentials + OAuth sign-in (`/auth/login`)
- [ ] `onboarding-role-selection.png` — role picker (`/onboarding/role-selection`)
- [ ] `onboarding-identity.png` — identity capture (`/onboarding/identity-input`)
- [ ] `onboarding-verification-upload.png` — document upload (`/onboarding/verification-upload`)
- [ ] `marketplace-feed.png` — produce marketplace (`/marketplace`)
- [ ] `marketplace-listing-detail.png` — listing + farmer trust (`/marketplace/:listingId`)
- [ ] `knowledge-hub.png` — knowledge library (`/knowledge`)
- [ ] `knowledge-article.png` — sourced article (`/knowledge/:articleSlug`)
- [ ] `portfolio-public.png` — public verified credential (`/portfolio/:portfolioSlug`)
- [ ] `mobile-marketplace.png` — marketplace at 390px

### Farmer
- [ ] `farmer-listings.png` — `/dashboard/farmer/listings`
- [ ] `farmer-orders.png` — `/dashboard/farmer/orders`
- [ ] `farmer-ledger-escrow.png` — escrow balance + payouts (`/dashboard/farmer/ledger`)
- [ ] `farmer-trust-profile.png` — trust score breakdown (`/dashboard/farmer/profile`)
- [ ] `farmer-prices.png` — price intelligence (`/dashboard/farmer/prices`)
- [ ] `farmer-assistant.png` — AI farm assistant (`/dashboard/farmer/assistant`)
- [ ] `farmer-group.png` — group purchasing (`/dashboard/farmer/group`)

### Buyer
- [ ] `buyer-orders.png` — orders + escrow status (`/dashboard/buyer/orders`)
- [ ] `buyer-suppliers.png` — verified supplier directory (`/dashboard/buyer/suppliers`)

### Student
- [ ] `student-dashboard.png` — workspace home (`/dashboard/student`)
- [ ] `student-portfolio.png` — verified projects + skills (`/dashboard/student/portfolio`)
- [ ] `student-project-new.png` — brief generation (`/dashboard/student/projects/new`)
- [ ] `student-peer-review.png` — peer review queue (`/dashboard/student/peer-review`)
- [ ] `student-mentor.png` — AI mentor (`/dashboard/student/mentor`)

### Lecturer
- [ ] `lecturer-queue.png` — review queue (`/dashboard/lecturer/queue`)
- [ ] `lecturer-review.png` — 4-dimension rubric (`/dashboard/lecturer/reviews/:engagementId`)

### Employer / NGO / Institution
- [ ] `employer-overview.png` — talent overview (`/dashboard/employer`)
- [ ] `employer-talent-search.png` — verified-skill search (`/dashboard/employer/talent`)
- [ ] `ngo-dashboard.png` — sponsored cooperatives (`/dashboard/ngo`)
- [ ] `institution-dashboard.png` — members + outcomes (`/dashboard/institution`)

### Admin
- [ ] `admin-dashboard.png` — admin home (`/dashboard/admin`)
- [ ] `admin-verification-queue.png` — farmer/buyer verification (`/dashboard/admin/verification-queue`)
- [ ] `admin-escrow.png` — platform escrow ledger (`/dashboard/admin/escrow`)
- [ ] `admin-payouts.png` — payout queue (`/dashboard/admin/payouts`)
- [ ] `admin-mediation.png` — dispute resolution (`/dashboard/admin/mediation`)
- [ ] `admin-impact-summary.png` — platform analytics (`/dashboard/admin/impact-summary`)

> Tip: capture at a 1440×900 viewport for desktop and 390×844 for mobile. The capture
> script does this automatically. Keep PNGs under ~500 KB each (the script captures
> full-page where it makes sense).
