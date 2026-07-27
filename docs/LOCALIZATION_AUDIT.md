# UmojaHub — Kenyan-English Localization Audit

**Pass 1 scope: the commerce hot-path** — the marketplace (buyer-facing browse + checkout),
the farmer surfaces, the buyer surfaces, and the emails/notifications on the ordering path.

**Pass 2 scope (delivered — see the "Pass 2 — Delivered" section at the end):** the remaining
roles (student, lecturer, admin, NGO, institution, employer), a whole-app currency
standardization, and an error-copy sweep. The AI-assistant prompts were reviewed and
intentionally left as-is (already strongly Kenya-grounded).

**Why this exists.** Project review flagged that parts of UmojaHub used terminology that
does not read as natural to Kenyan users (*Listing*, *Fulfill Order*, *Settlement*,
*Marketplace Feed*, *Pending Verification*, *Vendor*, *Inventory*). Technically correct, but
not the language people expect from trusted Kenyan platforms (M-Pesa, eCitizen, HELB, KRA
iTax, Jiji, Jumia, Safaricom, Equity, Co-op Bank, Twiga, DigiFarm). The goal: make the app
read as if it were designed in Kenya, for Kenyan users — professional, modern, and
bank/government/enterprise-grade — while feeling immediately familiar. **No slang, no Sheng,
no informal register.**

**Method.** In-place copy edits (no i18n library, no central copy module — the codebase
inlines its text, so we matched that pattern). Display labels only: **enum values, DB
fields, and API-contract strings were never touched** (they remain the source of truth in
`src/types/index.ts` and the Mongoose models). Duplicated status-label maps were
consolidated into one shared source so wording cannot drift.

---

## 2. Localization report — principles applied

1. **Context over literal replacement.** The same word maps differently per screen. On the
   buyer feed a *listing* becomes *produce*; on the farmer dashboard *My Listings* becomes
   *My Produce*; a paused item's status is *Paused*, not *Inactive*.
2. **Shopping, not inventory.** Buyers browse *produce*, *Place order*, choose *Collect* or
   *Delivery*, and see plain protection language — never "inventory", "fulfillment", or
   "vendor".
3. **Farming vocabulary for farmers.** *Produce*, *Add produce*, *Publish produce*,
   *Confirm dispatch*, *Market Prices*, *My Cooperative*, *Farm Inputs* — the words a
   Kenyan farmer expects, not software jargon.
4. **Escrow: keep the word, always explain it** (owner decision). "Escrow" is a genuine,
   bank-grade trust signal, so it stays — but every occurrence is paired with plain,
   M-Pesa-style wording ("held safely by UmojaHub until you confirm delivery"). The
   checkout already ships a 3-step plain-language escrow explainer; it was preserved.
5. **Human errors and empty states.** "Failed to load orders" → "Could not load your
   orders"; "No listings yet" → "No produce yet". Say what happened and what to do next; no
   implementation detail.
6. **Trust language stays where it signals safety; softens where it intimidates.** Buyers
   no longer "Escalate to Platform Mediation" — they "Ask UmojaHub to step in" / "Send to
   UmojaHub" and get "We received your report". The formal term *Mediation* is retained on
   the admin/operational side (the admin nav item is literally "Mediation") and in
   farmer-facing operational notices.

---

## 3. Old → New terminology mapping (context-keyed)

| Current | New | Context / screen |
|---|---|---|
| Listings *(farmer nav)* | **My Produce** | Farmer sidebar |
| My Listings *(page title)* | **My Produce** | `farmer/listings` |
| New listing / Create first listing | **Add produce** | `farmer/listings` buttons |
| New crop listing *(modal title)* | **Add your produce** | CreateListingForm |
| Create listing *(submit)* | **Publish produce** | CreateListingForm |
| Listing title *(field)* | **Produce title** | CreateListingForm |
| "Failed to create listing…" | **"Could not post your produce…"** | CreateListingForm error |
| Stock *(table header)* | **Available** | farmer listings table |
| In stock *(detail label)* | **Available** | listing detail |
| Inactive *(status pill)* | **Paused** | farmer listings |
| Settlement *(nav + page)* | **Payments** | farmer sidebar + `farmer/ledger` |
| Releasable *(balance card + escrow pill)* | **Cleared** | farmer ledger |
| Available to request | **Available to withdraw** | farmer ledger |
| "…becomes releasable" | **"…it clears"** | farmer ledger copy |
| Price Intelligence *(nav + page)* | **Market Prices** | farmer sidebar + `farmer/prices` |
| Group Tools *(nav)* | **My Cooperative** | farmer sidebar |
| Suppliers *(farmer nav)* | **Farm Inputs** | farmer sidebar |
| Confirm handover / Confirm Carrier Handover | **Confirm dispatch** | farmer orders |
| Handover window elapsed | **Dispatch window closed** | farmer orders countdown |
| "…once buyers purchase from your listings." | **"…once buyers order your produce."** | farmer orders empty state |
| Listing *(feed count)* | **produce** ("N produce available") | marketplace feed |
| No listings match your search | **No produce matches your search** | marketplace empty state |
| About this listing | **About this produce** | listing detail |
| Listing not found | **Produce not found** | listing detail metadata |
| Low stock *(ribbon)* | **Almost gone** | ListingCard |
| Add to cart / Collection method | **How you'll get it** | CheckoutPanel |
| Pickup · {county} | **Collect · {county}** | CheckoutPanel |
| Listings *(suggest section)* | **Available now** | MarketplaceSearch |
| "N listings" *(suggest count)* | **"N available"** | MarketplaceSearch |
| Browse marketplace | **Browse produce** | buyer orders |
| In fulfillment *(buyer status)* | **Being prepared** | buyer orders (label only; enum unchanged) |
| Failed to load orders / order | **Could not load your orders / this order** | buyer orders |
| Escalate to Platform Mediation | **Ask UmojaHub to step in** | buyer order detail |
| Submit escalation | **Send to UmojaHub** | buyer order detail |
| Under platform mediation. …your escalation | **UmojaHub is stepping in. …your report** | buyer order detail alert |
| "Could not file your escalation." | **"Could not send your report…"** | buyer order detail error |
| Your mediation request was received | **We received your report** | buyer notification |
| Funds released from escrow | **Payment released to you** | farmer notification |

**Kept as-is** (already natural / bank-grade): Marketplace, Orders, My Orders, Verified,
Farm Assistant, Profile, County, Delivery, Trust score, Cooperative, Knowledge Hub, Checkout,
Pay with M-Pesa, Request Payout, Held in escrow, Mark as received. Enum *values* and
category labels (Vegetables, Fruits, Cereals & Grains, …) unchanged.

---

## 4. Screen-by-screen changes

**Marketplace (buyer browse + checkout)**
- `src/app/marketplace/page.tsx` — empty state, feed count.
- `src/app/marketplace/[listingId]/page.tsx` — metadata, "About this produce", "Available".
- `src/components/marketplace/MarketplaceSearch.tsx` — suggest section label + counts (placeholder was already good).
- `src/components/marketplace/ListingCard.tsx` — "Almost gone".
- `src/components/marketplace/FeedFilters.tsx` — aria-label.
- `src/components/marketplace/CheckoutPanel.tsx` — "How you'll get it", "Collect · {county}".

**Farmer**
- `…/farmer/_components/FarmerShell.tsx` — nav: My Produce, Payments, Market Prices, My Cooperative, Farm Inputs.
- `…/farmer/listings/page.tsx` — title, buttons, empty/error states, table headers, "Paused", lockout copy.
- `…/farmer/orders/page.tsx` — "Confirm dispatch", "Dispatch window closed", empty state.
- `…/farmer/ledger/page.tsx` — "Payments", "Cleared", "Available to withdraw", copy.
- `…/farmer/prices/page.tsx` — "Market Prices".
- `src/components/foodhub/CreateListingForm.tsx` — modal title/description, "Produce title", "Publish produce", error.
- `src/components/foodhub/OrderTimeline.tsx` — reviewed; already plain (Placed / Paid — held in escrow / Dispatched / Received / Payment released). No change.

**Buyer**
- `…/buyer/_components/BuyerShell.tsx` — reviewed; already natural. No change.
- `…/buyer/orders/page.tsx` — "Being prepared", "Browse produce", error; now uses shared label map.
- `…/buyer/orders/[orderId]/page.tsx` — shared label maps, softened mediation copy, error.

**Shared label source**
- `src/types/index.ts` — added `ORDER_FULFILLMENT_LABEL` and `ORDER_PAYMENT_LABEL` (display
  text only). Buyer list + detail now import these instead of maintaining two private copies.

**Emails / notifications**
- `src/app/api/orders/[orderId]/status/route.ts` — dispatch + release notifications reworded.
- `src/app/api/orders/[orderId]/mediation/route.ts` — buyer-facing notification softened to "report".
- `src/lib/notifications/notify.ts`, `src/lib/integrations/emailTemplates.ts` — reviewed; already plain/trustworthy. No change.

---

## 5. Button audit

`New listing → Add produce`, `Create first listing → Add produce`, `Create listing →
Publish produce`, `Confirm handover / Confirm Carrier Handover → Confirm dispatch`, `Add to
cart / fulfillment toggle → Collect · {county} / Delivery`, `Escalate to Platform Mediation
→ Ask UmojaHub to step in`, `Submit escalation → Send to UmojaHub`. Kept: `Request Payout`,
`Mark as received`, `Pay KSh … with M-Pesa`, `Retry`, `Sign in`, `Sell produce`.

## 6. Navigation audit

Farmer: Listings→**My Produce**, Settlement→**Payments**, Price Intelligence→**Market
Prices**, Group Tools→**My Cooperative**, Suppliers→**Farm Inputs**; kept Orders, Farm
Assistant, Profile. Buyer: kept Marketplace, My Orders, Suppliers, Knowledge Hub (all
already natural). *(Suppliers on the buyer side is retained — legitimate professional
procurement language for enterprise buyers; see Pass 2 to reconsider "My Farmers".)*

## 7. Email audit

Lifecycle emails are generated from the notification title/body via `sendLifecycleEmail`, so
the reworded order/escrow/mediation notifications carry through to email. The branded
wrapper (`emailTemplates.ts`) is professional and trustworthy — greeting, "Next step:",
single CTA "Open UmojaHub", footer identifying UmojaHub as "a trust-based agricultural
marketplace" — and was left unchanged. Static templates (student code, password reset) are
Pass 2.

## 8. Notification audit

- Farmer dispatch → buyer: "Your order is on the way" + plain escrow-release explanation.
- Buyer receipt → farmer: **"Payment released to you"** (was "Funds released from escrow").
- Buyer files a report: **"We received your report"** (was "Your mediation request was
  received"); body: "…payment stays protected in escrow until this is resolved."
- Farmer/admin operational notices retain *mediation*/*dispute* (correct register for them).

## 9. AI-assistant language audit (documented; **applied in Pass 2**)

The Farm Assistant prompt (`src/lib/foodhub/assistantPrompt.ts`) is already strongly
Kenya-grounded: "trusted agricultural advisor for Kenyan smallholder farmers", KEBS/PCPB/
KEPHIS/Kenya Veterinary Board grounding, market references (Wakulima, Kongowea, City
Market), Swahili agricultural terms (sukuma wiki, mbolea, mbegu), and a "trusted
knowledgeable neighbour" tone. The AI Mentor and brief generator are similarly grounded
(mobile-first, M-Pesa, intermittent connectivity). **No changes needed for naturalness;**
any refinement is deferred to Pass 2 to keep this pass's diff commerce-scoped.

## 10. Consistency audit

- Status conveyed by **icon + shape + text**, never colour alone — preserved (glyphs ✓ ◷ ◐
  ⊘ 🔒 ↺ ◆ untouched).
- Buyer list and detail now render fulfillment/payment labels from **one shared map** — no
  drift possible.
- Currency: UI uses **KSh**; SMS/notification bodies and the ledger amount field use **KES**
  (ISO code). This split is pre-existing and acceptable (banks/SMS commonly use KES), but is
  flagged for a **single decision in Pass 2** (recommend standardising visible UI on `KSh`).
- Pluralization (`{n} item{s}`), `en-KE` dates, and the escrow explainer copy preserved.

---

## Pass 2 — Delivered

Owner decisions for this pass: **standardize visible UI currency to `KSh`**; **keep buyer
"Suppliers"** (legitimate enterprise-procurement register); **leave AI prompts as-is**.

1. **Roles (student, lecturer, admin, NGO, institution, employer).** The shells and page
   vocabulary were already role-appropriate and natural (My Project, Peer Review, AI Mentor,
   Portfolio, Review Queue, Pending Reviews; admin Verification/Escrow/Mediation/Payouts;
   NGO Cooperatives; Employer Discover talent; Institution Members). **No jargon found** —
   no *Vendor / Inventory / Fulfill / Portfolio Submission* on these surfaces. Only change:
   admin nav **"Lecturer Verify" → "Lecturer Verification"** (consistency with siblings).
2. **Currency → `KSh` everywhere in visible UI.** Swept `KES` → `KSh` in every user-facing
   string: farmer/coop/NGO/admin price panels and `formatKES` helpers, admin
   escrow/mediation/payouts/payment-lab/price-analytics/impact-summary, the ledger amount
   field + listing-form price label, the payout validation message, and the SMS/notification
   bodies (payment confirmed/failed, escrow release, payout request, mediation refund/release,
   price alerts). The farmer price-insight sentence became *"Produce priced around KSh … is
   selling fastest"* (was *"Listings around KES …"*). **Untouched:** code identifiers
   (`totalAmountKES`, `amountKES`, `formatKES`, `roundKES`, …), enum values, DB fields, and
   the AI-prompt grounding in `assistantPrompt.ts` (per the leave-AI decision).
3. **Error-copy sweep.** Standardized user-visible **"Failed to X" → "Could not X"** across
   farmer/student/lecturer/admin/NGO surfaces and checkout (e.g. "Failed to load profile" →
   "Could not load your profile"; "Failed to place order" → "Could not place your order").
   Internal `logger.error(...)` and thrown `Error('Failed to fetch')` strings (developer-only)
   were left as-is. Replaced the internal term **"engagement" → "submission"** in the lecturer
   review error.
4. **Emails.** The lifecycle wrapper and the static student-code / password-reset templates
   already read as trustworthy, institution-quality copy — **reviewed, no change needed**.
5. **AI prompts.** Reviewed; already strongly Kenya-grounded — **left as-is** per owner call.

### Not done (intentional / future)
- **Buyer "Suppliers"** kept (owner decision) — revisit only if a warmer register is wanted.
- **Admin-internal labels** "Payment Lab" and "Brief Contexts" kept — operator-only tooling,
  renaming risks confusion; out of scope.
- The currency split noted in §10 is now **resolved** (visible UI standardized on `KSh`).
