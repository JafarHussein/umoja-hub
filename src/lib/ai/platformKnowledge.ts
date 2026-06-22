/**
 * Canonical, code-accurate UmojaHub platform knowledge injected into the AI
 * assistants so they can answer "how does the platform work" questions (escrow,
 * trust score, verification, project reviews) instead of only domain advice.
 *
 * Keep these facts in sync with the implementation:
 *  - Trust score:   src/lib/trust/farmerTrustCalculator.ts
 *  - Escrow/orders: src/app/api/orders, src/lib/payments, src/app/api/admin/mediation-requests
 *  - Verification:  src/app/api/onboarding, src/app/api/admin/verify-*
 *  - Education:     src/app/api/education, src/app/api/peer-reviews, src/app/api/lecturer/reviews
 */

// Facts a FARMER (or buyer) may ask the Farm Assistant about the platform.
export const FOODHUB_PLATFORM_KNOWLEDGE = `UMOJAHUB PLATFORM FACTS (use these to answer questions about how UmojaHub works):

Getting verified (farmers):
- During sign-up you upload an identity document (National ID, cooperative card, or passport). It is marked PENDING and an administrator reviews it.
- When approved, your account becomes verified, you receive a 40-point verification score, and you can list produce. You are notified by in-app message, email, and SMS. If rejected, you get the reason and can re-submit.

Orders and escrow (this is how a buyer's payment is protected):
- A buyer pays for an order with M-Pesa. The money is NOT sent straight to you — it is held in escrow by UmojaHub.
- You then confirm dispatch of the produce. When the buyer confirms they received it, the funds are released from escrow and become available to you.
- If something goes wrong, the buyer can open mediation; an administrator reviews it and decides to release the funds to you or refund the buyer.
- Payouts: once funds are released from escrow, you request a payout from your ledger and an administrator settles it to you.

Trust Score (0–100, shown on your profile and used to rank listings):
- Verification — 40 points, granted when an admin approves your documents.
- Transactions — up to 25 points: more completed orders and higher total sales volume increase it.
- Ratings — up to 20 points: your average buyer rating, counted once you have at least 3 ratings.
- Reliability — up to 15 points: confirming dispatch within 24 hours of payment raises it; disputes lower it.
- Tiers: New (under 40), Established (40+), Trusted (60+), Premium (80+). A higher tier ranks your listings higher, so buyers find you first.`;

// Facts a STUDENT may ask the AI Mentor about the platform.
export const EDUCATION_PLATFORM_KNOWLEDGE = `UMOJAHUB PLATFORM FACTS (use these to answer questions about how UmojaHub works):

Becoming a verified student:
- At sign-up you confirm a university email address with a 6-digit code. That verifies you are a genuine student. This is separate from project verification below.

Building a verified portfolio:
- You work on projects and the verified ones, together with the skills they demonstrate, form a public portfolio that employers can discover through talent search.

Project lifecycle (how a project becomes verified):
1. Generate an AI project brief and start working (status: in progress). You submit three process documents — a problem breakdown, an approach plan, and a final reflection.
2. Submit for PEER REVIEW: another active student is assigned to review your work and give structured feedback.
3. LECTURER REVIEW: a verified lecturer assesses your project against a structured rubric covering several dimensions of quality.
4. Outcome: the project is verified, sent back for revision, or denied. A verified project strengthens your portfolio and demonstrated skills.

Skills and tiers:
- Your demonstrated skills come from the projects you complete and the lecturer's rubric assessment — they are evidence-backed, not self-declared.
- Students progress through tiers (Beginner, Intermediate, Advanced) as they complete verified projects.

The AI Mentor (you) guides without writing code for the student; project verification is always decided by peers and a human lecturer, never by you.`;
