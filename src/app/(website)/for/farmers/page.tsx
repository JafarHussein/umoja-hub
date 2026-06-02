import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FoodHubPage } from '@/components/website/FoodHubPage';
import { WorkflowStep } from '@/components/website/WorkflowStep';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { FaqItem } from '@/components/website/FaqItem';
import { TrustScoreNarrative } from '@/components/website/TrustScoreNarrative';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'For Farmers — UmojaHub Food Security Hub',
  description:
    'What verification requires, how the Trust Score is built, what an order involves, and what the platform does not guarantee. A complete guide for farmers before registering.',
};

const SECTIONS: AnchorSection[] = [
  { id: 'what-it-provides', label: 'What it provides' },
  { id: 'verification-guide', label: 'Verification guide' },
  { id: 'trust-score', label: 'Trust Score' },
  { id: 'marketplace-lifecycle', label: 'Marketplace lifecycle' },
  { id: 'mpesa-payment', label: 'M-Pesa payment' },
  { id: 'price-intelligence', label: 'Price Intelligence' },
  { id: 'farm-analytics', label: 'Farm Analytics Tool' },
  { id: 'responsibilities', label: 'Responsibilities' },
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

const VERIFICATION_STEPS = [
  {
    step: '01',
    actor: 'Farmer',
    action: 'Create an account',
    detail:
      'Register with your phone number and select the Farmer role. Confirm your number with the SMS OTP. Your account is created immediately — you can browse the marketplace and view Price Intelligence data before verification is complete. You cannot create listings yet.',
  },
  {
    step: '02',
    actor: 'Farmer',
    action: 'Submit three documents',
    detail:
      'Upload your National ID or passport, your land documentation (title deed, lease agreement, or a signed tenancy letter that names you), and a photograph of your farm or produce. All three must be submitted together — partial submissions are not reviewed.',
  },
  {
    step: '03',
    actor: 'Admin',
    action: 'Administrator reviews your submission',
    detail:
      'A named UmojaHub administrator examines your documents against published criteria: identity document names the person registered, land document relates to agricultural use, photograph is clear and consistent with stated crops. The decision is APPROVED or REJECTED. You receive an SMS either way within 1–3 business days.',
  },
  {
    step: '04',
    actor: 'System',
    action: 'Trust Score initialised at 40 points',
    detail:
      'Approval awards 40 points — the full Verification component of your Trust Score. You are now in the NEW tier and can create listings immediately. The remaining 60 points are built through completed orders, buyer ratings, and fulfillment consistency.',
  },
] as const;

const MPESA_STEPS = [
  {
    step: '01',
    actor: 'Buyer',
    action: 'Buyer places an order on your listing',
    detail:
      'The buyer selects your listing, specifies a quantity, and confirms the order. You receive an SMS with the order details. Status: PENDING.',
  },
  {
    step: '02',
    actor: 'System',
    action: 'Platform triggers STK Push via Safaricom Daraja API',
    detail:
      'UmojaHub automatically initiates a payment request to the buyer\'s registered M-Pesa phone number. The buyer sees an M-Pesa prompt on their phone — no action required from you.',
  },
  {
    step: '03',
    actor: 'Buyer',
    action: 'Buyer enters their M-Pesa PIN',
    detail:
      'The buyer enters their M-Pesa PIN on their own device. UmojaHub never receives this PIN — the transaction is between the buyer and Safaricom. You wait.',
  },
  {
    step: '04',
    actor: 'Safaricom',
    action: 'Safaricom confirms or rejects the transaction',
    detail:
      'Safaricom processes the payment. If the buyer\'s balance is sufficient and the PIN is correct, the transaction is confirmed. If insufficient funds or wrong PIN, the payment fails and the order remains PENDING.',
  },
  {
    step: '05',
    actor: 'System',
    action: 'UmojaHub receives Safaricom callback — order → PAID',
    detail:
      'UmojaHub receives confirmation from Safaricom and updates the order status to PAID. Payment is held by the platform at this stage — it is not yet in your M-Pesa account.',
  },
  {
    step: '06',
    actor: 'Farmer',
    action: 'You receive SMS: payment confirmed, ready to dispatch',
    detail:
      'Your dashboard shows the order as PAID. Only now should you prepare produce and arrange transport. Do not dispatch for a PENDING order.',
  },
  {
    step: '07',
    actor: 'Farmer',
    action: 'Dispatch produce and mark DISPATCHED',
    detail:
      'Deliver produce matching the listing — correct crop type, stated quantity, condition consistent with your description. Mark the order DISPATCHED in your dashboard. The buyer receives an SMS.',
  },
  {
    step: '08',
    actor: 'Buyer',
    action: 'Buyer confirms receipt — payment released to your M-Pesa',
    detail:
      'When the buyer marks the order RECEIVED, payment is released to your registered M-Pesa account. If the buyer does not confirm within the platform window after you mark dispatch, the system auto-completes the order and releases payment.',
  },
] as const;

const TRUST_COMPONENTS = [
  {
    name: 'Verification',
    weight: 40,
    description:
      'One-time. An administrator reviewed your documents and approved them. Binary — either earned (40 pts) or not (0 pts). The only component that requires administrator action rather than your own behavior.',
    note: 'Earn it once by completing the verification process. It does not increase further after approval.',
  },
  {
    name: 'Transactions',
    weight: 25,
    description:
      'Cumulative completed orders on a logarithmic scale. Early orders contribute more per transaction than later ones. Each order requires a real buyer payment — this component cannot be inflated artificially.',
    note: 'A farmer who completes 10 orders in two months builds this component faster than one who completes 3 orders in a year.',
  },
  {
    name: 'Ratings',
    weight: 20,
    description:
      'Average buyer rating across all completed orders, weighted so recent ratings carry more influence than older ones. A single negative rating has diminishing effect as your total count grows.',
    note: 'The best way to build this component: ensure your produce consistently matches your listing description.',
  },
  {
    name: 'Reliability',
    weight: 15,
    description:
      'The ratio of orders fulfilled to orders accepted over a rolling period. Accepting orders and failing to dispatch — regardless of the reason — reduces this component.',
    note: 'Only accept orders you are confident you can fulfil. Cancellations count against this even if your ratings are positive.',
  },
] as const;

const TRUST_TIERS = [
  {
    tier: 'NEW',
    range: '0–39 pts',
    signal: 'Verified identity. No meaningful transaction history yet.',
  },
  {
    tier: 'ESTABLISHED',
    range: '40–59 pts',
    signal: 'Growing transaction history with acceptable ratings.',
  },
  {
    tier: 'TRUSTED',
    range: '60–79 pts',
    signal: 'Substantial completed orders with consistent positive performance.',
  },
  {
    tier: 'PREMIUM',
    range: '80–100 pts',
    signal: 'Extensive history, high ratings, and high reliability sustained over time.',
  },
] as const;

const ORDER_STAGES = [
  {
    step: '01',
    actor: 'Farmer',
    action: 'Create a listing after approval',
    detail:
      'Set crop type, price per kilogram, available quantity, pickup county, and preferred contact method. Check Price Intelligence first — it shows what comparable listings are asking in your county.',
  },
  {
    step: '02',
    actor: 'Buyer',
    action: 'Buyer browses and places an order',
    detail:
      'Your listing is visible to any buyer searching for your crop type and county. A buyer selects your listing and places an order. You receive an SMS with quantity and buyer contact details. Status: PENDING.',
  },
  {
    step: '03',
    actor: 'Farmer',
    action: 'Wait for PAID status before preparing anything',
    detail:
      'Do not harvest, prepare produce, or arrange transport while the order is PENDING. The buyer has not paid yet. Only act after the status changes to PAID.',
  },
  {
    step: '04',
    actor: 'Farmer',
    action: 'Dispatch produce and mark DISPATCHED',
    detail:
      'Deliver produce that matches the listing — correct crop, stated quantity, in the condition you described. Mark the order DISPATCHED in your dashboard.',
  },
  {
    step: '05',
    actor: 'Buyer',
    action: 'Buyer confirms receipt — payment released',
    detail:
      'The buyer marks the order RECEIVED and leaves a rating. Payment releases to your M-Pesa. If the buyer does not confirm within the auto-complete window after you mark dispatch, the system completes the order automatically.',
  },
  {
    step: '06',
    actor: 'System',
    action: 'Trust Score recalculates',
    detail:
      'After each completed order, the platform recalculates your Trust Score from all four components. If the total crosses a tier boundary, your tier updates on your listing.',
  },
] as const;

const RESPONSIBILITIES = [
  {
    label: 'Listing accuracy',
    detail:
      'Your listings must accurately describe the crop type, available quantity, price per kilogram, and pickup county. Listing produce you do not have, or in quantities you cannot provide, is a violation of platform terms.',
  },
  {
    label: 'Order fulfillment',
    detail:
      'When a buyer pays for an order, you are expected to dispatch produce that matches the listing — correct crop, stated quantity, condition consistent with what was listed.',
  },
  {
    label: 'Quantity maintenance',
    detail:
      'Update your listing quantity as your stock changes. A buyer who places an order expecting 100 kg only to find 40 kg available has been misled by an inaccurate listing.',
  },
  {
    label: 'Single account',
    detail:
      'Each farmer may hold one account. Creating additional accounts to reset a Trust Score or circumvent a suspension is grounds for permanent removal.',
  },
  {
    label: 'Document currency',
    detail:
      'If the land documentation you submitted changes materially — you move to a different parcel, your lease expires — you are expected to notify the platform.',
  },
  {
    label: 'Accepting public ratings',
    detail:
      'Buyers can rate their transactions with you after completion. These ratings are visible on your profile and contribute to your Trust Score. You cannot opt out of the rating system.',
  },
] as const;

const LIMITATIONS = [
  {
    heading: 'Verification does not guarantee orders',
    detail:
      'Approval confirms your identity and documents were reviewed. It does not create demand for your produce. Whether orders arrive depends on demand for your crop type in your county, your price relative to comparable listings, and your Trust Score tier.',
  },
  {
    heading: 'Verification does not guarantee produce quality claims',
    detail:
      'UmojaHub does not inspect produce. Your listing describes what you will deliver. The buyer trusts your description. If the produce does not match, the buyer can leave a low rating. There is no quality certification process.',
  },
  {
    heading: 'Quality disputes have no financial remediation',
    detail:
      'If a buyer receives produce that does not match the listing, their recourse is to leave a low rating. The platform does not provide a refund mechanism for quality shortfalls.',
  },
  {
    heading: 'M-Pesa payment failure is outside UmojaHub\'s control',
    detail:
      "Safaricom's Daraja API must be available for payments to process. In rare cases, Safaricom may confirm payment on their side but the callback to UmojaHub is delayed — the order can appear PENDING even though payment cleared. These cases require administrator intervention.",
  },
  {
    heading: 'Buyers can choose not to rate',
    detail:
      'Rating is available to buyers after order completion but is not mandatory. Some transactions will always go unrated.',
  },
  {
    heading: 'Administrator review time varies',
    detail:
      'Verification queue depth depends on how many submissions are pending at any given time. Most reviews complete within 24–48 hours. During high-volume periods, it may take longer.',
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'How long does verification take?',
    answer:
      'Most submissions are reviewed within 24–48 hours. During high-volume periods, it may take longer. You will receive an SMS when the decision is made.',
  },
  {
    question: 'What happens if my verification is rejected?',
    answer:
      'Rejection is correctable. Your SMS will specify the reason. Common reasons: the land document does not clearly name you as the occupant, the produce photograph is not clear enough, or the identity document photograph is not legible. Correct the specific issue and resubmit. There is no limit on resubmissions and no waiting period between attempts.',
  },
  {
    question: 'Can I list multiple crops?',
    answer:
      'Yes. After approval you can create separate listings for each crop type. Each listing is independent — its own price, quantity, and county. You can have multiple active listings simultaneously.',
  },
  {
    question: 'What happens if a buyer places an order but does not pay?',
    answer:
      'The STK Push expires if the buyer does not respond within the timeout window. No money moves. The order remains PENDING. Do not prepare produce for a PENDING order — wait for PAID status. The pending order will expire and your listing continues to be visible.',
  },
  {
    question: 'What happens if I cannot fulfil an order after it is paid?',
    answer:
      "Contact the buyer through the platform immediately. Failing to dispatch a PAID order reduces your reliability component and is flagged to administrators. Reversing a confirmed M-Pesa payment is not automated and requires administrator intervention. Persistent non-dispatch is grounds for account suspension.",
  },
  {
    question: 'When does the payment arrive in my M-Pesa?',
    answer:
      "Payment is held by the platform until the buyer marks the order RECEIVED. If the buyer does not mark received within the platform's auto-complete window after you mark dispatch, the system auto-completes the order and releases payment.",
  },
  {
    question: 'How is the Trust Score calculated?',
    answer:
      'Four components: Verification (40 points, one-time), Transactions (25 points, completed order count), Ratings (20 points, average buyer rating weighted by recency), and Reliability (15 points, ratio of fulfilled to accepted orders). Total from 0 to 100 determines your tier.',
  },
  {
    question: 'Why is my Trust Score not increasing?',
    answer:
      'Newly verified farmers start at 40 points. The score increases only when you complete orders. To build your score: complete orders, ensure produce matches listings so buyers leave positive ratings, and only accept orders you can fulfil.',
  },
  {
    question: 'What if a buyer leaves a rating I believe is unfair?',
    answer:
      "Ratings reflect the buyer's assessment. The platform does not remove ratings based on a farmer's objection. A single low rating has diminishing influence as your total count grows. If you believe a rating was submitted fraudulently, you can report it to administrators — but removal is not guaranteed.",
  },
  {
    question: 'Does UmojaHub guarantee I will receive orders?',
    answer:
      'No. Verification is the precondition for listing — not a guarantee of demand. Whether orders arrive depends on demand for your crop in your county, your price relative to comparable listings, and your Trust Score tier.',
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FarmersPage(): React.ReactElement {
  return (
    <FoodHubPage
      audience="For Farmers"
      heading="You grow produce. Your reliability has no public record."
      intro="This page covers what verification requires, how the Trust Score is built, what an order involves step by step, and what the platform does not guarantee. Read it before you register."
      sections={SECTIONS}
      registerHref="/auth/register?role=farmer"
      registerLabel="Register as a farmer"
    >
      {/* ── What it provides ─────────────────────────────────────────────── */}
      <section id="what-it-provides" className="py-12 border-b border-ws-border-light">
        <SectionLabel>What it provides</SectionLabel>
        <SectionH2>Five structural responses to five structural problems</SectionH2>

        <div className="space-y-5 mb-8 max-w-prose">
          <Body>
            When a smallholder farmer brings produce to a local trader, the price they are offered
            is set by someone who also knows the end-market price. The farmer does not know that
            price. This is not a failure of individual bad actors — it is a structural consequence
            of asymmetric price information.
          </Body>
          <Body>
            A farmer who consistently fulfils orders on time is a reliable commercial partner. But
            that reliability is stored in informal memory — in the experience of the specific
            traders they have dealt with. It cannot be searched. It cannot be shown to a buyer in
            a different county. Social introductions do not scale.
          </Body>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-px border border-ws-border-light">
          {[
            {
              number: '01',
              heading: 'Verified identity',
              body: 'An administrator reviews your submitted documents and confirms you are who you say you are and farm what you claim to farm. After approval, every listing you create shows a verified status — the buyer knows a human reviewed your documents before your produce appeared in the marketplace.',
            },
            {
              number: '02',
              heading: 'Public Trust Score',
              body: "Your reliability is not stored in informal memory. Every completed order, every buyer rating, and every fulfilled commitment contributes to a Trust Score visible on your profile and on every listing. A buyer who has never met you can see your transaction count and tier before placing an order.",
            },
            {
              number: '03',
              heading: 'Price Intelligence',
              body: 'Before setting any listing price, you can see what comparable listings are asking for the same crop type in your county and neighboring counties. This is not a market price oracle — it reflects what other farmers on the platform are currently asking. But it is a signal you could not access through a broker conversation.',
            },
            {
              number: '04',
              heading: 'M-Pesa payment — no bank account required',
              body: "Every transaction uses M-Pesa STK Push. The buyer enters their M-Pesa PIN on their own device — UmojaHub never receives that PIN. Safaricom confirms. No cash handling. No bank account required. The payment record exists in Safaricom's system, independent of either party's claim.",
            },
            {
              number: '05',
              heading: 'Direct buyer access, nationwide',
              body: 'Your listing is visible to any buyer in Kenya who searches for your crop type in your county — not just buyers in your social or geographic network. A hotel buyer in Nairobi sourcing Kiambu produce can find your listing directly.',
            },
          ].map((item) => (
            <div
              key={item.number}
              className="flex items-start gap-4 p-5 bg-ws-surface-base border-b border-ws-border-light last:border-b-0"
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

        <div className="mt-6">
          <LimitationPanel eyebrow="What verification does not confirm">
            Verification confirms your identity documents are valid and relate to agricultural land
            use. It does not inspect produce quality, guarantee buyer demand for your crop, or
            promise any specific order volume.
          </LimitationPanel>
        </div>
      </section>

      {/* ── Verification guide ───────────────────────────────────────────── */}
      <section id="verification-guide" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Verification guide</SectionLabel>
        <SectionH2>The four-step verification process</SectionH2>
        <div className="mb-6 max-w-prose">
          <Body>
            Verification is reviewed by a named administrator against published criteria. The
            decision is APPROVED or REJECTED — there is no partial approval. Rejection includes a
            specific reason and is correctable. There is no limit on resubmissions.
          </Body>
        </div>

        <div className="mb-6">
          {VERIFICATION_STEPS.map((s, i) => (
            <WorkflowStep
              key={s.step}
              step={s.step}
              actor={s.actor}
              action={s.action}
              detail={s.detail}
              hub="food"
              isLast={i === VERIFICATION_STEPS.length - 1}
            />
          ))}
        </div>

        <div className="bg-ws-surface-raised border border-ws-border-light p-5 mb-4">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            Documents required — all three
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'National ID or passport',
                detail: 'Clear photograph. Must name you as the registrant.',
              },
              {
                label: 'Land documentation',
                detail: 'Title deed, lease agreement, or signed tenancy letter naming you.',
              },
              {
                label: 'Produce photograph',
                detail: 'Clear photograph of your farm or current crop. Must be identifiable.',
              },
            ].map((doc) => (
              <div key={doc.label} className="flex flex-col gap-1">
                <p className="font-geist text-ws-label font-medium text-ws-text-primary">
                  {doc.label}
                </p>
                <p className="font-geist text-ws-body-sm text-ws-text-secondary">{doc.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="font-geist text-ws-body-sm text-ws-text-tertiary">
          Verification criteria are published in full.{' '}
          <Link href="/trust" className="text-ws-hub-green hover:opacity-80 transition-opacity">
            Read the methodology →
          </Link>
        </p>
      </section>

      {/* ── Trust Score ──────────────────────────────────────────────────── */}
      <section id="trust-score" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Trust Score</SectionLabel>
        <SectionH2>Four components. Specific weights. Real implications.</SectionH2>
        <div className="mb-8 max-w-prose">
          <Body>
            Your Trust Score is a number from 0 to 100. Buyers see it as a tier label on your
            listings. The score has four components with defined weights. You control three of them
            entirely through your behavior. One requires administrator action and is earned once.
          </Body>
        </div>

        <div className="border border-ws-border-light mb-8">
          {TRUST_COMPONENTS.map((comp) => (
            <div
              key={comp.name}
              className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 border-b border-ws-border-light last:border-b-0"
            >
              <div className="sm:w-40 shrink-0">
                <p className="font-geist text-ws-label font-semibold text-ws-text-primary">
                  {comp.name}
                </p>
                <p className="font-geist-mono text-ws-caption text-ws-hub-green tabular-nums mt-0.5">
                  {comp.weight} points
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-2">
                  {comp.description}
                </p>
                <p className="font-geist text-ws-body-sm text-ws-text-tertiary border-l-2 border-ws-border-medium pl-3">
                  {comp.note}
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubH3>Trust Tiers</SubH3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px border border-ws-border-light mb-8">
          {TRUST_TIERS.map((tier) => (
            <div key={tier.tier} className="bg-ws-surface-raised p-4 flex flex-col gap-1.5">
              <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase">
                {tier.tier}
              </p>
              <p className="font-geist-mono text-ws-data text-ws-text-primary tabular-nums">
                {tier.range}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary">{tier.signal}</p>
            </div>
          ))}
        </div>

        <SubH3>Example Trust Score — TRUSTED tier farmer</SubH3>
        <p className="font-geist text-ws-body text-ws-text-secondary mb-5">
          The animated breakdown below shows how a farmer with 8 completed orders and consistent
          buyer ratings reaches a score of 74 (TRUSTED tier). Each component fills in sequence.
        </p>
        <TrustScoreNarrative />

        <div className="mt-5">
          <LimitationPanel eyebrow="What Trust Score does not mean">
            Trust Score reflects historical behavior — completed orders, ratings, and fulfillment
            consistency. It does not predict the quality of produce on any specific future order.
            A high-scoring farmer can still have a bad individual transaction. Tiers recalculate
            and can fall as well as rise.
          </LimitationPanel>
        </div>
      </section>

      {/* ── Marketplace lifecycle ────────────────────────────────────────── */}
      <section id="marketplace-lifecycle" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Marketplace lifecycle</SectionLabel>
        <SectionH2>From listing creation to completed order</SectionH2>
        <div className="mb-6 max-w-prose">
          <Body>
            Every order on the platform follows the same sequence. Understanding it prevents the
            most common errors — preparing produce before payment is confirmed, or dispatching
            without tracking the PAID status.
          </Body>
        </div>

        <div className="mb-6">
          {ORDER_STAGES.map((s, i) => (
            <WorkflowStep
              key={s.step}
              step={s.step}
              actor={s.actor}
              action={s.action}
              detail={s.detail}
              hub="food"
              isLast={i === ORDER_STAGES.length - 1}
            />
          ))}
        </div>

        <div className="bg-ws-surface-raised border border-ws-border-light p-5">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            A real scenario — Wanjiku, kale farmer, Kiambu County
          </p>
          <div className="space-y-3 font-geist text-ws-body text-ws-text-secondary leading-relaxed">
            <p>
              Wanjiku has 1.5 acres in Kiambu and grows kale. She submits her National ID,
              land lease agreement, and a photograph of her crop. The next day she receives an SMS:
              verification approved. Trust Score: 40. Tier: NEW.
            </p>
            <p>
              She creates her first listing at KES 24 per kilogram — below the Price Intelligence
              average for her county, because she is NEW tier with no completed orders. Three days
              later, she receives a PENDING order for 50 kg. She waits. Twenty minutes later: PAID.
              KES 1,200. She dispatches. The buyer marks received. Payment arrives in her M-Pesa.
            </p>
            <p>
              After eight completed orders and seven buyer ratings averaging 4.4 stars, her Trust
              Score crosses the ESTABLISHED threshold. She increases her price to KES 26 per
              kilogram. She no longer needs to price below market to compensate for a zero
              transaction count.
            </p>
          </div>
        </div>
      </section>

      {/* ── M-Pesa payment ───────────────────────────────────────────────── */}
      <section id="mpesa-payment" className="py-12 border-b border-ws-border-light">
        <SectionLabel>M-Pesa payment</SectionLabel>
        <SectionH2>The eight-step payment sequence</SectionH2>
        <div className="mb-6 max-w-prose">
          <Body>
            Every transaction uses Safaricom M-Pesa STK Push. No cash. No bank account required
            on either side. The payment record exists in Safaricom&apos;s system independent of either
            party&apos;s claim. UmojaHub never receives the buyer&apos;s M-Pesa PIN.
          </Body>
        </div>

        <div className="mb-6">
          {MPESA_STEPS.map((s, i) => (
            <WorkflowStep
              key={s.step}
              step={s.step}
              actor={s.actor}
              action={s.action}
              detail={s.detail}
              hub="food"
              isLast={i === MPESA_STEPS.length - 1}
            />
          ))}
        </div>

        <LimitationPanel eyebrow="M-Pesa failure scenarios">
          Safaricom&apos;s Daraja API must be available for payments to process. If Safaricom&apos;s service
          is interrupted, STK Pushes cannot be initiated. In rare edge cases, Safaricom may confirm
          payment on their side but the callback to UmojaHub is delayed — the order can appear
          PENDING even though payment cleared. These cases require administrator intervention and
          are not resolved automatically. UmojaHub is not affiliated with Safaricom and cannot
          assist with M-Pesa account issues.
        </LimitationPanel>
      </section>

      {/* ── Price Intelligence ───────────────────────────────────────────── */}
      <section id="price-intelligence" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Price Intelligence</SectionLabel>
        <SectionH2>What comparable listings are currently asking</SectionH2>
        <div className="space-y-4 max-w-prose mb-6">
          <Body>
            Price Intelligence is a read-only dashboard available to all registered farmers —
            including those whose verification is still PENDING. It shows the current distribution
            of listing prices for a selected crop type in a selected county, including neighboring
            counties.
          </Body>
          <Body>
            The data reflects what other farmers on the platform are currently asking — not
            the price buyers are paying, and not the price that produce sells for at Nairobi
            wholesale markets. It is a directional signal that gives you information you could not
            access through a broker conversation, where the broker alone knows both sides of
            the price.
          </Body>
        </div>

        <div className="border border-ws-border-light p-5">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            What it shows
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Price range', detail: 'Minimum and maximum current listing prices for a crop type in a county.' },
              { label: 'Median price', detail: 'The midpoint price across active listings in the selected county.' },
              { label: 'Neighboring counties', detail: 'Price distributions for adjacent counties, showing regional variation.' },
              { label: 'Listing count', detail: 'How many active listings exist for the crop type — an indicator of current supply.' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <p className="font-geist text-ws-label font-medium text-ws-text-primary">
                  {item.label}
                </p>
                <p className="font-geist text-ws-body-sm text-ws-text-secondary">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <LimitationPanel eyebrow="What Price Intelligence does not show">
            Price Intelligence reflects listed prices, not confirmed transaction prices. A farmer can
            list at any price — whether orders arrive at that price depends on buyer demand and your
            Trust Score tier. The tool does not predict demand.
          </LimitationPanel>
        </div>
      </section>

      {/* ── Farm Analytics Tool ──────────────────────────────────────────── */}
      <section id="farm-analytics" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Farm Analytics Tool</SectionLabel>
        <SectionH2>A deterministic calculator for crop and price planning</SectionH2>
        <div className="space-y-4 max-w-prose mb-6">
          <Body>
            The Farm Analytics Tool is a text-based interface available after registration. You
            can query it with agronomic questions — planting schedules, pest management approaches,
            soil preparation, crop rotation, and market timing for specific crops in specific
            counties.
          </Body>
          <Body>
            It provides guidance based on general agricultural knowledge for Kenyan conditions.
            It is a deterministic reference tool, not a certified extension officer.
          </Body>
        </div>

        <LimitationPanel eyebrow="What the Farm Analytics Tool does not do">
          The tool does not have real-time knowledge of your specific farm, soil type, or local
          weather unless you describe those conditions in your query. Each session starts from
          zero — it does not retain prior conversations. It is not a substitute for agricultural
          extension services or agronomic consultation. Verification is performed by human
          administrators, not automated tools.
        </LimitationPanel>
      </section>

      {/* ── Responsibilities ─────────────────────────────────────────────── */}
      <section id="responsibilities" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Responsibilities</SectionLabel>
        <SectionH2>What you agree to when you join</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] max-w-prose mb-8">
          These are not buried in a terms document. They are stated here because understanding
          them before you register is the purpose of this page.
        </p>

        <div className="border border-ws-border-light">
          {RESPONSIBILITIES.map((item) => (
            <div
              key={item.label}
              className="flex flex-col sm:flex-row sm:items-start gap-3 p-5 border-b border-ws-border-light last:border-b-0"
            >
              <p className="font-geist text-ws-label font-semibold text-ws-text-primary sm:w-44 shrink-0">
                {item.label}
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Limitations ──────────────────────────────────────────────────── */}
      <section id="limitations" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Limitations</SectionLabel>
        <SectionH2>What the platform does not guarantee</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] max-w-prose mb-8">
          Disclosing limitations before you encounter them is the honest version of building trust.
          A farmer who joins understanding these constraints will not be surprised. One who joins
          without understanding them will be disappointed by things the platform was never designed
          to prevent.
        </p>

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
        <SectionH2>If you are ready to register</SectionH2>

        <div className="border border-ws-border-light mb-6">
          {[
            {
              step: '01',
              action: 'Create a farmer account',
              detail:
                'Go to the registration page and select the Farmer role. You need a phone number that can receive SMS and an M-Pesa number for receiving payments.',
              link: { href: '/auth/register?role=farmer', label: 'Register as a farmer' },
            },
            {
              step: '02',
              action: 'Gather your documents before submitting',
              detail:
                'You need three items: National ID or passport (clear photograph), land documentation that names you, and a photograph of your farm or produce. All three must be submitted together. Incomplete submissions are rejected.',
              link: null,
            },
            {
              step: '03',
              action: 'While waiting for approval, use Price Intelligence',
              detail:
                'After registration, you can access Price Intelligence before verification completes. Look at what comparable crops are listed for in your county. This informs your pricing decision once you can list.',
              link: null,
            },
            {
              step: '04',
              action: 'After approval: create your first listing',
              detail:
                'You will receive an SMS when your verification is approved. Log in and create your first listing. Start with an accurate quantity you can actually provide.',
              link: null,
            },
            {
              step: '05',
              action: 'Wait for PAID — do not dispatch until it shows',
              detail:
                'Your first order may come in hours or days. When it arrives, it shows PENDING until the buyer pays. Only prepare produce and arrange transport after the order status shows PAID.',
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
                  {item.action}
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

        <div className="border border-ws-border-light p-5">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            If you have questions not answered here
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
            The{' '}
            <Link
              href="/marketplace"
              className="text-ws-text-primary underline underline-offset-2 hover:text-ws-hub-green transition-colors duration-150"
            >
              marketplace
            </Link>{' '}
            is public — you can browse listings from other verified farmers before registering. The{' '}
            <Link
              href="/trust"
              className="text-ws-text-primary underline underline-offset-2 hover:text-ws-hub-green transition-colors duration-150"
            >
              Trust &amp; Verification
            </Link>{' '}
            page has a detailed explanation of how verification works across both hubs.
          </p>
        </div>
      </section>
    </FoodHubPage>
  );
}
