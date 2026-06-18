# UmojaHub Web App Design — Build Checklist

**The living tracker.** I drive ("take the wheel"); this is updated and committed as items complete. Working agreement at the bottom.

## Phase 0 — Reset, research & direction ✅ DONE
- [x] Demolition (docs/Figma/old foundation deleted) + app token-values gutted (website preserved & verified)
- [x] 18 research deliverables (gates 1–4, approved)
- [x] Foundation approved · IA approved
- [x] Directions: Marketplace (sourcing) · Onboarding (role-last) · Illustration plan · Character brief
- [x] Journey & Screen Map (all roles) · Experience Journeys (all roles)
- [x] Lo-fi proof set (role-adaptive shell; density contrast)

## Phase 1 — Lo-fi wireframes, every role end-to-end  ✅ COMPLETE
Grayscale, structure-only, **named illustration slots**. All five roles + shared spine + cross-cutting craft built (~80 screens). **Next gate: owner review of the full lo-fi set → mid-fi (Phase 1→2).**

**Shared entry (front door)** ✅ COMPLETE
- [x] Welcome · [x] Intent · [x] Education · [x] Role confirmation (last)
- [x] Sign in
- [x] Context: language
- [x] Context: location
- [x] Role-specific setup (farmer; other roles' tails reuse the pattern)
- [x] Verification handoff (the anxiety-reducing screen)
- [x] Done / first-run

**Farmer end-to-end** ✅ COMPLETE (F-01–F-18)
- [x] Home (shell) · [x] Verification status · [x] List produce (capture → preview → publish)
- [x] My listings + [x] edit · [x] Orders + [x] fulfill · [x] Money/ledger + [x] payout
- [x] Reviews + [x] Trust Score detail · [x] Prices · [x] Group orders · [x] Assistant (chat) · [x] Profile

**Buyer end-to-end** ✅ COMPLETE (B-01–B-17 + B-04 mobile)
- [x] Home · [x] Search + [x] results · [x] Discovery feed ([x] desktop + [x] mobile) · [x] Post a Need + [x] responses
- [x] Opportunity Review · [x] Commit + [x] checkout (M-Pesa) · [x] Track + [x] confirm + [x] review
- [x] Procurement ([x] basket, [x] compare) · [x] Suppliers · [x] Profile · [x] Orders history

**Student end-to-end** ✅ COMPLETE (S-01–S-13)
- [x] Home · [x] Create project · [x] Workspace ([x] Overview/[x] docs/[x] AI-log/[x] blockers) · [x] Submit
- [x] Peer review ([x] queue + [x] workspace) · [x] Outcome · [x] Portfolio · [x] Mentor chat

**Lecturer end-to-end** ✅ COMPLETE (L-01–L-06)
- [x] Home · [x] Credential verification · [x] Review queue (dense table) · [x] Review workspace (evidence-first) · [x] Decision · [x] Profile

**Admin end-to-end** ✅ COMPLETE (A-01–A-15)
- [x] Overview/triage · [x] Verification queues (farmer/supplier/lecturer) · [x] Case review (farmer/supplier/lecturer)
- [x] Mediation · [x] Payouts · [x] Content (knowledge + AI briefs) + ops (group tokens + payment lab) · [x] Impact · [x] Audit-trail viewer

**Cross-cutting craft** ✅ COMPLETE
- [x] AI chat (assistant + mentor — built in F-17 / S-12) · [x] Knowledge hub (browse + article)
- [x] Notifications · [x] Settings (theme + a11y prefs) · [x] System states (empty/loading/error/offline/404) · [x] Unauthorized

## Phase 2 — Illustration integration  ✅ COMPLETE (lo-fi)
- [x] Named slots placed across auth/onboarding
- [x] **Character figures placed (owner chose Option A):** original grayscale flat-vector farmer/student/buyer/lecturer across Welcome, Intent (per option), Role-confirm, Done. Skin-tone/dress authenticity = a hi-fi/DS-gate pass (or swap to Humaaans/Blush export there).
- [x] Concept illustrations placed as original grayscale lo-fi stand-ins (recoloured/finalised at DS gate): secure sign-in (shield), trust chain (ID→check→badge→reputation), harvest/listing, **data-security at verification handoff** (doc+fingerprint+lock — the #1 anxiety reducer), success, restricted/lock (unauthorized)
- [x] State illustrations: empty (box) · error (alert) · offline (cloud) · 404 (search) · loading (skeleton)

## Phase 3 — Mid-fidelity  🚧 IN PROGRESS (owner gave go 2026-06-18; lo-fi approved)
Tighten layout + **real content structure + interaction states**, per role. Built on a **new "App — Mid-Fi" page** (lo-fi page preserved untouched for diffing).

**Mid-fi conventions** (still pre–Design-System; colour & type stay provisional, decided at Phase 5):
- **Restrained neutral palette + ONE provisional accent** (not the final brand colour) used only to mark primary action / active / focus. Real type *scale* and real spacing/hierarchy; real copy (English — see decision below).
- **Real content structure:** actual field labels, realistic data, real table columns, real card spec rows. No lorem.
- **Interaction states made explicit** as side-by-side variants per key surface: default · hover · active/selected · focus · disabled · loading (skeleton) · empty · error. (We don't have a prototype yet — states are *shown*, Phase 4 wires them.)
- **i18n-tolerant layout:** ~30% text-expansion headroom, no text baked into fixed-width chips/buttons, no text-in-images.
- Illustration slots keep the Phase-2 grayscale stand-ins; recolour at DS gate.

**Senior-engineer decisions resolving the flagged opens (owner-delegated 2026-06-18):**
- **Reviews, not comments** — structured, transaction-gated reviews (overall + Quality / Delivery reliability / Communication + optional note) → farmer Trust Score; **no public comment threads**; logistics Qs go 1:1 via inquiry channel. *(see MARKETPLACE_DESIGN_DIRECTION_V1 amendment)*
- **Delivery Confidence = honest & progressive** — default "Building track record — N completed" (no %); % only in established state (n ≥ ~5) and always with its denominator. Component variant new ↔ established. *(same amendment)*
- **English-first, i18n-tolerant, language toggle stubbed in Settings**, Swahili deferred post-pilot. *(see Foundation open-Q2 resolution)*

Order (mirrors lo-fi): Shared front door / onboarding spine → Farmer → Buyer → Student → Lecturer → Admin → cross-cutting. Check in at the end of each role.
- [x] Mid-fi page + provisional palette/type/spacing primitives established — page **"App — Mid-Fi"** (id `139:2`); 10 provisional Inter text styles `MidFi/*` (Display 28 / H1 22 / H2 18 / Title 15 / Body 14 / Body Strong 14 / Label 12 / Meta 12 / Number 24 / Nav 13). Palette applied via a JS constant (light-neutral: canvas #F4F5F7, card #FFF, hairline #E2E5EA, ink/text #1C2024, body #3A4048, muted #6B7280, **one provisional accent #2F6F5E**, states success/warn/danger/info) — deliberately NOT bound to variables (provisional, re-tokenized at Phase 5). Spacing 4/8/12/16/24/32; radius 4/6/8.
  - **✅ RESOLVED — pre-reset remnant DISCARDED (owner ruling 2026-06-18).** The Figma "Foundations" page held a finished-looking green **dark "Product" theme** + `Product/*` Sora/IBM Plex styles — a pre-reset remnant. Deleted: Foundations page, the **Product** color mode, and the `Product/*` text styles. **Preserved (live website, out of scope):** Color collection **Website** mode, all `Website/*` text styles, `Mono/Data`, and the Primitives/Spacing/Radius collections. Note: Sora + IBM Plex Sans are the *website's* typefaces (kept); only the app-side Product styles were removed. Phase 5 DS gate starts the app palette/type fresh.
- [x] Shared front door / onboarding spine — **10 screens** (ON-01…ON-10): Welcome, Sign in (OAuth-only), Language (English-selected / Kiswahili "Coming soon"), Location, Intent (role surfaced not asked), Education interlude (trust + honest-limits "OUR PROMISE" callout), Role confirmation (last), Farm setup (fields + produce chips), Verification handoff (What we check / What we never do — the #1 anxiety reducer), Done/first-run. Laid out L→R on page `139:2`, x = 0…12240.
- [x] **Farmer** (11 screens: Home, Verification status, List produce, Orders+fulfil, Reviews & Trust, My listings, Money/ledger, Market prices, Group orders, Farm assistant, Profile) · [x] **Buyer** (12 screens: Home, Opportunity Review, Search, Discovery, Post a Need, Commit/checkout, Track+confirm+review, Procurement, Suppliers, Orders, Profile — Discovery-mobile deferred to a mobile pass) · [x] **Student** (8 screens: Home, Workspace [AI-log transparency], Peer review, Create project, Portfolio [verified], AI mentor [Socratic/logged], Submit [integrity declaration], Outcome [verifiable credential]) · [ ] Lecturer (Home done) · [ ] Admin
- [ ] Cross-cutting (AI chat, knowledge, notifications, settings, system states)

## Phase 4 — Hi-fidelity + interactive prototype
- [ ] Visual-complete screens + clickable prototype, per role

## Phase 5 — Design System  (the gate where colour & type are decided)
- [ ] Palette · typography · tokens (Figma variables ↔ code) · component library · multi-theme

## Phase 6 — Implementation
- [ ] Implementation plan → code (replacing the gutted app surfaces, build stays green)

---

## Working agreement (how "take the wheel" runs)
1. I **drive Phase 1** autonomously and keep this checklist updated (committed each batch).
2. I **check in at the end of each ROLE** (not each screen) with screenshots for your review.
3. I **stop and ask only for genuine decisions** — the flagged open items (marketplace comments-vs-reviews, Delivery-Confidence data, language English-vs-Swahili) and anything that needs your call.
4. Illustration stays as **named slots**; your character exports (path A) drop straight in.
5. Platform logic untouched; the live website stays green throughout.
6. Approval gates still hold at **fidelity jumps** (Phase 1→2, →3, →5) — I won't silently escalate fidelity or start the Design System without your go.
