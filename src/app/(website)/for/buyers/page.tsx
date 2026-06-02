import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FoodHubPage } from '@/components/website/FoodHubPage';
import { WorkflowStep } from '@/components/website/WorkflowStep';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { FaqItem } from '@/components/website/FaqItem';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'For Buyers — UmojaHub Food Security Hub',
  description:
    "What the verified badge means, how to read a farmer's Trust Score, how M-Pesa payment works, what happens when things go wrong, and what the platform does not guarantee.",
};

const SECTIONS: AnchorSection[] = [
  { id: 'what-it-provides', label: 'What it provides' },
  { id: 'reading-trust-signals', label: 'Reading trust signals' },
  { id: 'placing-an-order', label: 'Placing an order' },
  { id: 'mpesa-payment', label: 'M-Pesa payment' },
  { id: 'failure-paths', label: 'What can go wrong' },
  { id: 'dispute-process', label: 'Submitting a dispute' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'first-steps', label: 'First steps' },
];

// ─── Shared layout primitives ─────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-3">{children}</p>
  );
}

function SectionH2({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h2 className="font-display text-ws-section text-ws-text-primary mb-4 max-w-2xl">{children}</h2>
  );
}

function Body({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7]">{children}</p>
  );
}

function SubH3({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h3 className="font-display text-ws-subsection text-ws-text-primary mb-3">{children}</h3>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRUST_SIGNALS = [
  {
    label: 'Verified badge',
    means: "A platform administrator reviewed the farmer's identity documents — National ID or passport, land documentation, and a produce photograph — and determined they were consistent and plausible. Every listing on the marketplace comes from a verified farmer. Unverified farmers cannot create listings.",
    doesNotMean: "That the produce quality is inspected, certified, or guaranteed. Verification confirms identity and farming documentation only.",
  },
  {
    label: 'Trust Score (0–100)',
    means: "A composite score from four components: identity verification (up to 40 pts), completed order count (up to 25 pts), average buyer rating weighted by recency (up to 20 pts), and fulfillment ratio (up to 15 pts). Recalculated after each completed order.",
    doesNotMean: "A guarantee of quality on any individual transaction. The score reflects historical behaviour across past orders.",
  },
  {
    label: 'Trust Tier',
    means: "NEW (0–39 pts): verified identity, no transaction history. ESTABLISHED (40–59 pts): growing history with some ratings. TRUSTED (60–79 pts): substantial completed orders with consistent performance. PREMIUM (80–100 pts): extensive history, high ratings, high reliability.",
    doesNotMean: "A permanent certification. Tiers recalculate whenever the Trust Score changes. A farmer can drop tiers if fulfilment behavior changes.",
  },
  {
    label: 'Completed order count',
    means: "The number of orders fulfilled and confirmed as received by buyers. The clearest single indicator of how active and reliable the farmer has been on the platform.",
    doesNotMean: "The number of orders placed or initiated. Only completed, buyer-confirmed orders count.",
  },
  {
    label: 'Average rating',
    means: "The average of buyer ratings across all completed orders, weighted so recent ratings carry more influence. Individual rating commentary is visible on the farmer's full profile.",
    doesNotMean: "A guarantee that your specific order will match the average experience.",
  },
] as const;

const PAYMENT_STEPS = [
  {
    step: '01',
    actor: 'Buyer',
    action: 'Select a listing and specify quantity',
    detail:
      "Find the produce you want and enter the quantity. The platform confirms the quantity is available and shows the total price. The quantity is atomically reserved — other buyers cannot order the same stock while your payment is pending.",
  },
  {
    step: '02',
    actor: 'Platform + Safaricom',
    action: 'STK Push sent to your registered M-Pesa phone',
    detail:
      "The platform initiates an STK Push via Safaricom's Daraja API to your registered M-Pesa phone number. Within seconds, your phone receives a Safaricom payment prompt showing the amount. Your M-Pesa phone number must match the number on your UmojaHub account.",
  },
  {
    step: '03',
    actor: 'Buyer',
    action: 'Enter your M-Pesa PIN on your phone — not on UmojaHub',
    detail:
      "The Safaricom prompt appears on your phone. You enter your M-Pesa PIN directly into the Safaricom interface. UmojaHub never receives your PIN at any point in this process. The STK Push expires after approximately three minutes.",
  },
  {
    step: '04',
    actor: 'Safaricom',
    action: 'Safaricom processes and confirms',
    detail:
      "Safaricom processes the transaction. When confirmed, Safaricom sends a confirmation SMS to your phone and simultaneously sends a callback to UmojaHub.",
  },
  {
    step: '05',
    actor: 'Platform',
    action: 'Order status updates to PAID — payment held in escrow',
    detail:
      "UmojaHub receives the Safaricom callback and updates the order from PENDING to PAID. Both you and the farmer receive SMS notifications. Payment is held during fulfillment — it does not transfer to the farmer yet.",
  },
  {
    step: '06',
    actor: 'Farmer',
    action: 'Farmer dispatches produce',
    detail:
      "The farmer sees the PAID status and dispatches your order. When they mark DISPATCHED, you receive an SMS with the farmer's contact information.",
  },
  {
    step: '07',
    actor: 'Buyer',
    action: 'Mark RECEIVED — payment releases to farmer',
    detail:
      "When your produce arrives, mark the order RECEIVED. This releases payment to the farmer's M-Pesa. If you do not mark received within the auto-completion window after dispatch, the system auto-completes and releases payment automatically.",
  },
  {
    step: '08',
    actor: 'Buyer',
    action: 'Submit a rating',
    detail:
      "Rate the farmer on a 1–5 scale with optional written commentary. Your rating is permanent, visible to all future buyers, and directly influences the farmer's Trust Score. An accurate rating protects the buyers who come after you.",
  },
] as const;

const LIMITATIONS = [
  {
    heading: 'No financial remediation for quality or quantity shortfalls',
    detail:
      "If produce arrives in the wrong quantity or condition, the platform has no refund mechanism. Your recourse is to leave a low rating with a written explanation. The rating affects the farmer's Trust Score and warns future buyers. It does not compensate you.",
  },
  {
    heading: 'Verified identity is not a quality guarantee',
    detail:
      "The verified badge means a platform administrator reviewed the farmer's identity and land documents. It does not mean anyone inspected the produce. Quality is self-reported by the farmer in the listing description.",
  },
  {
    heading: 'Trust Score reflects history, not a future commitment',
    detail:
      "A farmer's Trust Score reflects their track record across past orders. A PREMIUM tier farmer can still deliver a poor individual order. Tier reduces comparative risk — it does not guarantee any individual outcome.",
  },
  {
    heading: 'Payment auto-completes if you do not mark received',
    detail:
      "If you receive produce but do not mark RECEIVED within the platform's auto-completion window after dispatch is marked, the system completes the order and releases payment. At that point, you can no longer dispute receipt through order status.",
  },
  {
    heading: 'No automated refund for farmer non-dispatch',
    detail:
      "If a farmer accepts your PAID order and does not dispatch, your recourse is to escalate to platform support. There is no automated refund — administrator review is required. This process is not instant.",
  },
  {
    heading: 'M-Pesa is the only payment method',
    detail:
      "Your registered phone number must match your M-Pesa account. Card payments, bank transfers, and other payment methods are not currently supported.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'Can I browse produce without creating an account?',
    answer:
      "Yes. The entire marketplace — all listings, prices, Trust Scores, farmer profiles, and past buyer ratings — is publicly accessible without registration. Registration is only required when you want to place an order.",
  },
  {
    question: 'What if I miss the STK Push on my phone?',
    answer:
      "If you do not respond within the timeout window (approximately three minutes), the push expires. No money leaves your M-Pesa account. The order remains PENDING. You can initiate a new payment attempt from your order status screen.",
  },
  {
    question: 'Can I cancel an order after paying?',
    answer:
      "You can cancel a PENDING order before payment is confirmed. Once the order status changes to PAID, the order cannot be cancelled through normal account actions. Contact platform support if you have a paid order you need to discuss.",
  },
  {
    question: 'What if the produce I receive does not match the listing?',
    answer:
      "Mark the order RECEIVED and submit a rating with a specific, factual description of the discrepancy — wrong quantity, wrong variety, poor condition. Your rating is permanent and visible to all future buyers. The platform does not provide financial remediation for quality shortfalls.",
  },
  {
    question: 'What if the farmer does not dispatch after I have paid?',
    answer:
      "If your order shows PAID and the farmer has not updated to DISPATCHED after a reasonable period, contact platform support. Administrators can review the case. There is no automated refund for non-dispatch.",
  },
  {
    question: 'What if my M-Pesa payment goes through but the order is not confirmed?',
    answer:
      "If your M-Pesa shows a payment sent but your order status has not updated within 15 minutes, contact platform support. Your payment is on record and can be reconciled. Do not attempt to pay again for the same order before contacting support.",
  },
  {
    question: 'What information does the farmer see about me?',
    answer:
      "Before you place an order: nothing. After you place an order: your name, your phone number, and any delivery address you specify. The farmer needs this to contact you about fulfillment.",
  },
  {
    question: 'Do I need to submit verification documents as a buyer?',
    answer:
      "No. Buyers are not document-verified. Your M-Pesa phone number is your identity anchor in the system. You register with your name, email, and phone number only.",
  },
  {
    question: 'Can I order from multiple farmers in a single checkout?',
    answer:
      "Orders are placed per listing. To buy from multiple farmers, place separate orders for each. Each order has its own M-Pesa STK Push and its own fulfillment timeline.",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyersPage(): React.ReactElement {
  return (
    <FoodHubPage
      audience="For Buyers"
      heading="You want to buy direct from farmers. Knowing which farmers to trust before the first order has always required a personal introduction."
      intro="This page covers what the verified badge means, how to read a farmer's Trust Score, how M-Pesa payment works, what happens when things go wrong, and what the platform does not guarantee."
      sections={SECTIONS}
      registerHref="/auth/register?role=buyer"
      registerLabel="Register as a buyer"
    >
      {/* ── What it provides ─────────────────────────────────────────────── */}
      <section id="what-it-provides" className="py-12 border-b border-ws-border-light">
        <SectionLabel>What it provides</SectionLabel>
        <SectionH2>Five structural responses to the buyer&apos;s verification problem</SectionH2>

        <div className="space-y-4 max-w-prose mb-8">
          <Body>
            Before a platform like this exists, buying direct from a farmer you have never met
            requires a personal introduction. Without it, there is no mechanism to assess whether
            the farmer is reliable, whether their produce matches what they describe, or whether
            they will fulfil an order after you pay.
          </Body>
          <Body>
            The existing alternatives each solve part of the problem. Physical markets give you
            access to produce but require physical presence and offer no seller verification.
            WhatsApp groups extend geographic reach but have no verification layer. Broker-supplied
            produce adds margin without disclosing what the farmer received.
          </Body>
        </div>

        <div className="border border-ws-border-light mb-6">
          {[
            {
              number: '01',
              heading: 'Verified farmers only',
              body: "Only farmers whose identity documents have been reviewed and approved by a platform administrator can create listings. Every listing you see has passed a human identity review.",
            },
            {
              number: '02',
              heading: 'Trust Score as searchable history',
              body: "A farmer's transaction history, buyer ratings, and fulfilment reliability are computed into a Trust Score (0–100) and a tier that appear on every listing. Before placing an order, you can see how many orders the farmer has completed and what buyers said about them.",
            },
            {
              number: '03',
              heading: 'Browse without registering',
              body: "The entire marketplace is public. You can search for any crop in any county, compare listings, and review past ratings without creating an account. Registration is only required when you want to place an order.",
            },
            {
              number: '04',
              heading: 'M-Pesa payment — PIN on your phone, not the platform',
              body: "When you place an order, Safaricom sends a payment prompt to your registered phone. You enter your M-Pesa PIN on your phone — not on any UmojaHub screen. Payment is held during fulfilment and releases when you mark the order received.",
            },
            {
              number: '05',
              heading: 'Rating system that protects the next buyer',
              body: "After each completed order, you can rate the transaction. Your rating directly affects the farmer's Trust Score and is visible to every buyer who views that farmer's profile after you.",
            },
          ].map((item) => (
            <div
              key={item.number}
              className="flex items-start gap-4 p-5 border-b border-ws-border-light last:border-b-0"
            >
              <span className="font-geist-mono text-ws-caption text-ws-hub-green tabular-nums shrink-0 mt-0.5">
                {item.number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                  {item.heading}
                </p>
                <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Reading trust signals ─────────────────────────────────────────── */}
      <section id="reading-trust-signals" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Reading trust signals</SectionLabel>
        <SectionH2>What each element of a listing means — and what it does not mean</SectionH2>
        <div className="mb-8 max-w-prose">
          <Body>
            Every listing shows several trust signals. Understanding what each signal actually
            represents prevents both over-reliance on it and under-use of it.
          </Body>
        </div>

        <div className="border border-ws-border-light mb-8">
          {TRUST_SIGNALS.map((signal) => (
            <div
              key={signal.label}
              className="p-5 border-b border-ws-border-light last:border-b-0"
            >
              <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-3">
                {signal.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1.5">
                    What it means
                  </p>
                  <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                    {signal.means}
                  </p>
                </div>
                <div>
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1.5">
                    What it does not mean
                  </p>
                  <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                    {signal.doesNotMean}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <SubH3>Using tier as a purchase decision tool</SubH3>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
          When choosing between two listings for the same crop at similar prices, tier and completed
          order count are the quickest comparison. When the decision is more consequential — large
          quantities, recurring orders — read the individual ratings and written commentary on each
          farmer&apos;s profile before ordering.
        </p>
        <LimitationPanel eyebrow="Tier is comparative, not a guarantee">
          Trust Tier reduces comparative risk between farmers — it does not guarantee any
          individual transaction will go smoothly. A PREMIUM tier farmer can still have a bad
          individual order. A NEW tier farmer can deliver perfectly.
        </LimitationPanel>
      </section>

      {/* ── Placing an order ─────────────────────────────────────────────── */}
      <section id="placing-an-order" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Placing an order</SectionLabel>
        <SectionH2>From browsing to confirmed order</SectionH2>
        <div className="mb-6 max-w-prose">
          <Body>
            The marketplace is public. You do not need a registration to browse listings, read
            Trust Scores, or review farmer ratings. Registration is required only when you place
            an order.
          </Body>
        </div>

        <div className="border border-ws-border-light mb-6">
          {[
            {
              step: '01',
              heading: 'Browse without registering',
              detail: "Search by crop type, county, price range, and minimum Trust Tier. View all active listings, read farmer profiles, and review every past rating. No account required.",
            },
            {
              step: '02',
              heading: 'Register to place an order',
              detail: "Create an account with your name, email, and phone number. Your phone number must be the same number registered to your M-Pesa account — it is where the payment STK Push will be sent.",
            },
            {
              step: '03',
              heading: 'Specify quantity and confirm',
              detail: "Enter the quantity you want. The platform confirms availability and shows the total price. Confirm the order. The quantity is reserved immediately — other buyers cannot order the same stock while your payment is pending.",
            },
            {
              step: '04',
              heading: 'Complete M-Pesa payment',
              detail: "Respond to the STK Push on your phone within the timeout window. Enter your M-Pesa PIN on your phone — not on any UmojaHub screen.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 p-5 border-b border-ws-border-light last:border-b-0"
            >
              <span className="font-geist-mono text-ws-caption text-ws-hub-green tabular-nums shrink-0 mt-0.5">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                  {item.heading}
                </p>
                <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── M-Pesa payment ───────────────────────────────────────────────── */}
      <section id="mpesa-payment" className="py-12 border-b border-ws-border-light">
        <SectionLabel>M-Pesa payment</SectionLabel>
        <SectionH2>The complete payment sequence — buyer perspective</SectionH2>
        <div className="mb-6 max-w-prose">
          <Body>
            Every transaction uses Safaricom M-Pesa STK Push. You enter your PIN on your phone,
            not on this platform. UmojaHub never receives your payment credentials — only the
            payment confirmation from Safaricom.
          </Body>
        </div>

        <div className="mb-6">
          {PAYMENT_STEPS.map((s, i) => (
            <WorkflowStep
              key={s.step}
              step={s.step}
              actor={s.actor}
              action={s.action}
              detail={s.detail}
              hub="food"
              isLast={i === PAYMENT_STEPS.length - 1}
            />
          ))}
        </div>

        <LimitationPanel eyebrow="M-Pesa failure scenarios">
          If the STK Push times out, no payment occurs and the order remains PENDING — you can
          retry. If your M-Pesa shows a deduction but your order status is still PENDING after 15
          minutes, contact platform support before retrying. In rare cases, Safaricom confirms
          payment but the callback to UmojaHub is delayed — this requires administrator
          intervention and is not resolved automatically.
        </LimitationPanel>
      </section>

      {/* ── Failure paths ────────────────────────────────────────────────── */}
      <section id="failure-paths" className="py-12 border-b border-ws-border-light">
        <SectionLabel>What can go wrong</SectionLabel>
        <SectionH2>Three failure paths — who intervenes and what resolution looks like</SectionH2>
        <div className="mb-8 max-w-prose">
          <Body>
            A large-scale buyer&apos;s primary risk is financial loss due to logistics failure or
            produce that does not match the listing. This section documents the three failure paths
            explicitly — not to warn buyers away from the platform, but because understanding what
            happens when things fail is what allows a buyer to make an informed first-order
            decision.
          </Body>
        </div>

        {/* Failure 1 */}
        <div className="border border-ws-border-light mb-4">
          <div className="bg-ws-surface-raised px-5 py-3 border-b border-ws-border-light">
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase">
              Failure Path 1
            </p>
            <p className="font-display text-ws-subsection text-ws-text-primary mt-1">
              Payment failure
            </p>
          </div>
          <div className="p-5">
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">Causes:</strong> STK Push
              times out (buyer does not respond within ~3 minutes), insufficient M-Pesa balance,
              wrong PIN entered, Safaricom service interruption.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">What happens:</strong> No
              money leaves your M-Pesa account. The order remains PENDING. The reserved listing
              quantity is not released until the payment window expires or you cancel the order.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">Who intervenes:</strong>{' '}
              Safaricom, for M-Pesa account issues. For payment confirmed by Safaricom but not
              reflected in order status after 15 minutes — platform support.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
              <strong className="text-ws-text-primary font-semibold">Resolution:</strong> Retry
              payment from your order screen. If your M-Pesa confirms a deduction but the order
              status has not updated, contact platform support before retrying — do not attempt
              to pay twice for the same order.
            </p>
          </div>
        </div>

        {/* Failure 2 */}
        <div className="border border-ws-border-light mb-4">
          <div className="bg-ws-surface-raised px-5 py-3 border-b border-ws-border-light">
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase">
              Failure Path 2
            </p>
            <p className="font-display text-ws-subsection text-ws-text-primary mt-1">
              Produce mismatch
            </p>
          </div>
          <div className="p-5">
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">Causes:</strong> Farmer
              delivers wrong crop, wrong quantity, poor condition, or produce materially different
              from the listing description.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">What happens:</strong> You
              receive produce. The order is marked RECEIVED (either by you or by auto-completion).
              Payment releases to the farmer.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">Who intervenes:</strong>{' '}
              Platform administrators, if you report the mismatch. Review is not instant.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
              <strong className="text-ws-text-primary font-semibold">Resolution:</strong> Submit
              a rating with a specific, factual description of the discrepancy. This permanently
              affects the farmer&apos;s Trust Score and warns future buyers. The platform does not
              provide financial remediation for produce quality or quantity shortfalls. If you
              believe the mismatch involved deliberate misrepresentation, report it to platform
              administrators in addition to the rating.
            </p>
          </div>
        </div>

        {/* Failure 3 */}
        <div className="border border-ws-border-light mb-6">
          <div className="bg-ws-surface-raised px-5 py-3 border-b border-ws-border-light">
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase">
              Failure Path 3
            </p>
            <p className="font-display text-ws-subsection text-ws-text-primary mt-1">
              Non-delivery
            </p>
          </div>
          <div className="p-5">
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">Causes:</strong> Farmer
              accepts your order, your M-Pesa payment clears and order status shows PAID, but the
              farmer does not dispatch produce within a reasonable time.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">What happens:</strong> Your
              order status remains PAID with no DISPATCHED update. Payment is held in the platform
              — it has not been released to the farmer yet.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
              <strong className="text-ws-text-primary font-semibold">Who intervenes:</strong>{' '}
              Platform administrators. Non-dispatch of a PAID order is flagged to administrators
              and creates a negative signal in the farmer&apos;s reliability component automatically.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
              <strong className="text-ws-text-primary font-semibold">Resolution:</strong> Contact
              platform support. Administrators can contact the farmer and review the case. There
              is no automated refund — administrator review is required and is not instant. Farmers
              who persistently fail to dispatch paid orders face account suspension. Payment has
              not yet been released to the farmer in non-dispatch cases, which gives administrators
              more leverage than in produce-mismatch cases.
            </p>
          </div>
        </div>

        <LimitationPanel eyebrow="The rating system is the primary accountability mechanism">
          Honest, specific ratings — including low ratings with written explanations — are how
          the platform maintains quality over time. A rating does not compensate you for a bad
          transaction. It protects the buyers who come after you.
        </LimitationPanel>
      </section>

      {/* ── Dispute process ──────────────────────────────────────────────── */}
      <section id="dispute-process" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Submitting a dispute</SectionLabel>
        <SectionH2>How to escalate a transaction to administrator review</SectionH2>
        <div className="mb-6 max-w-prose">
          <Body>
            A dispute is a formal escalation to platform administrators. It is separate from a
            rating. You can and should rate every completed transaction regardless of whether you
            also escalate. Not every poor transaction warrants a dispute — rating is sufficient for
            quality shortfalls. Dispute escalation is appropriate for suspected deliberate
            misrepresentation or confirmed non-delivery.
          </Body>
        </div>

        <div className="border border-ws-border-light mb-5">
          {[
            {
              step: '01',
              heading: 'Submit through the order screen',
              detail: "Go to the order in your account and use the \"Report an issue\" option. Describe the specific problem: what you ordered, what you received (or did not receive), and when.",
            },
            {
              step: '02',
              heading: 'Both parties are given opportunity to respond',
              detail: "The farmer is notified and can provide their account of the transaction. Administrator review considers both parties' accounts and the order record.",
            },
            {
              step: '03',
              heading: 'Administrator reviews and determines',
              detail: "A platform administrator reviews the case. They can contact both parties, review the order timeline, and determine an outcome. Review is not instant — expect 2–5 business days.",
            },
            {
              step: '04',
              heading: 'Outcome is communicated to both parties',
              detail: "The administrator communicates the determination. Possible outcomes: no action, warning to farmer, account restriction, or account suspension for the farmer.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 p-5 border-b border-ws-border-light last:border-b-0"
            >
              <span className="font-geist-mono text-ws-caption text-ws-hub-green tabular-nums shrink-0 mt-0.5">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                  {item.heading}
                </p>
                <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <LimitationPanel eyebrow="Dispute resolution does not guarantee financial recovery">
          The dispute process can result in action against the farmer account. It does not
          guarantee return of payment or replacement produce. Financial remediation is not a
          platform capability — the rating and dispute systems are accountability mechanisms,
          not insurance.
        </LimitationPanel>
      </section>

      {/* ── Limitations ──────────────────────────────────────────────────── */}
      <section id="limitations" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Limitations</SectionLabel>
        <SectionH2>What the platform does not guarantee</SectionH2>

        <div className="flex flex-col gap-3">
          {LIMITATIONS.map((item) => (
            <div key={item.heading} className="border border-ws-border-light p-5">
              <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-2">
                {item.heading}
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-12 border-b border-ws-border-light">
        <SectionLabel>FAQ</SectionLabel>
        <SectionH2>Frequently asked questions</SectionH2>
        <div className="border border-ws-border-light px-5">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* ── First steps ──────────────────────────────────────────────────── */}
      <section id="first-steps" className="py-12">
        <SectionLabel>First steps</SectionLabel>
        <SectionH2>Start by browsing — no registration required</SectionH2>

        <div className="border border-ws-border-light mb-6">
          {[
            {
              step: '01',
              heading: 'Browse the marketplace — no account needed',
              detail: "The marketplace is fully public. Search by crop, county, Trust Tier, and price range. Read farmer profiles, Trust Scores, and past buyer ratings before registering.",
              link: { href: '/marketplace', label: 'Browse the marketplace' },
            },
            {
              step: '02',
              heading: 'Read the Trust & Verification methodology',
              detail: "Before placing your first order, read the full verification criteria. Understanding what the verified badge does and does not confirm is important before you rely on it.",
              link: { href: '/trust', label: 'Read the methodology' },
            },
            {
              step: '03',
              heading: 'Register and ensure your M-Pesa number matches',
              detail: "Create a buyer account with your name, email, and phone number. Your phone number must be the same number registered to your M-Pesa account.",
              link: { href: '/auth/register?role=buyer', label: 'Register as a buyer' },
            },
            {
              step: '04',
              heading: 'Place your first order on a TRUSTED or PREMIUM tier farmer',
              detail: "For your first order, filter by TRUSTED or PREMIUM tier and read the last 5–10 ratings on the farmer's profile before ordering. This gives you the most information before committing.",
              link: null,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 p-5 border-b border-ws-border-light last:border-b-0"
            >
              <span className="font-geist-mono text-ws-caption text-ws-text-tertiary tabular-nums shrink-0 pt-0.5 w-6">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                  {item.heading}
                </p>
                <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                  {item.detail}
                </p>
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="inline-flex items-center justify-center min-h-[40px] mt-3 px-4 border border-ws-hub-green text-ws-hub-green font-geist text-ws-body-sm hover:bg-ws-hub-green hover:text-white transition-colors duration-150"
                  >
                    {item.link.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </FoodHubPage>
  );
}
