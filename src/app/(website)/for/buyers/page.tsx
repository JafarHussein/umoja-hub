import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AudiencePage } from '@/components/website/AudiencePage';
import { FaqAccordion, type FaqItem } from '@/components/website/FaqAccordion';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const metadata: Metadata = {
  title: 'For Buyers — UmojaHub Food Security Hub',
  description:
    'What the verified badge means, how to read a farmer\'s Trust Score, how M-Pesa payment works, what happens when things go wrong, and what the platform does not guarantee. A complete guide before placing your first order.',
};

const sections: AnchorSection[] = [
  { id: 'the-problem', label: 'The problem' },
  { id: 'how-it-responds', label: 'How UmojaHub responds' },
  { id: 'reading-trust-signals', label: 'Reading trust signals' },
  { id: 'how-payment-works', label: 'How payment works' },
  { id: 'what-can-go-wrong', label: 'What can go wrong' },
  { id: 'a-real-scenario', label: 'A real scenario' },
  { id: 'complete-workflow', label: 'The complete workflow' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'misconceptions', label: 'Misconceptions' },
  { id: 'next-steps', label: 'What to do next' },
];

interface TrustSignal {
  label: string;
  whatItMeans: string;
  whatItDoesNotMean: string;
}

const trustSignals: TrustSignal[] = [
  {
    label: 'Verified badge',
    whatItMeans:
      "A platform administrator reviewed the farmer's identity documents — National ID or passport, land documentation, and a produce photograph — and determined they were consistent and plausible. Every listing on the marketplace comes from a verified farmer. Unverified farmers cannot create listings.",
    whatItDoesNotMean:
      "That the produce quality is inspected, certified, or guaranteed. Verification confirms identity and farming documentation. It is not a quality audit of any individual listing.",
  },
  {
    label: 'Trust Score (0–100)',
    whatItMeans:
      "A composite score from four components: identity verification (up to 40 pts, one-time), completed order count on a logarithmic scale (up to 25 pts), average buyer rating weighted by recency (up to 20 pts), and fulfilment ratio over a rolling period (up to 15 pts). The score is recalculated automatically after each completed order.",
    whatItDoesNotMean:
      "A guarantee of quality on any individual transaction. The score reflects historical behaviour across all completed orders. A high-scoring farmer can still have a bad individual order.",
  },
  {
    label: 'Trust Tier',
    whatItMeans:
      "A named category derived from the Trust Score: NEW (0–39 pts), ESTABLISHED (40–59 pts), TRUSTED (60–79 pts), PREMIUM (80–100 pts). Tiers are visible on listings and allow you to compare farmers at a glance before viewing their full profile.",
    whatItDoesNotMean:
      "A permanent certification. Tiers recalculate whenever the Trust Score changes. A farmer who stops fulfilling orders reliably can drop from TRUSTED to ESTABLISHED as the reliability component falls.",
  },
  {
    label: 'Completed order count',
    whatItMeans:
      "The number of orders fulfilled and confirmed as received by buyers. This is the clearest single indicator of how active and reliable the farmer has been on the platform.",
    whatItDoesNotMean:
      "The number of orders placed or initiated. Only completed, buyer-confirmed orders count toward this figure.",
  },
  {
    label: 'Average rating',
    whatItMeans:
      "The average of buyer ratings submitted across all completed orders, weighted so recent ratings carry more influence than older ones. You can read individual ratings and their written commentary on the farmer's full profile.",
    whatItDoesNotMean:
      "A guarantee that your specific order will match the average experience. A farmer with a 4.8 average across 60 orders can still have a poor individual transaction.",
  },
];

interface TrustTierEntry {
  tier: string;
  range: string;
  interpretation: string;
}

const trustTiers: TrustTierEntry[] = [
  {
    tier: 'NEW',
    range: '0–39 pts',
    interpretation:
      "Verified identity, no meaningful transaction history. You would be among the farmer's first buyers. There is no track record to assess — you are deciding based on verification alone.",
  },
  {
    tier: 'ESTABLISHED',
    range: '40–59 pts',
    interpretation:
      "Growing transaction history with some buyer ratings. Enough to make a basic assessment — read the existing ratings before ordering.",
  },
  {
    tier: 'TRUSTED',
    range: '60–79 pts',
    interpretation:
      "Substantial completed orders with consistent positive performance. A strong comparative signal — this farmer has a real, reviewable record that most buyers can rely on without a prior relationship.",
  },
  {
    tier: 'PREMIUM',
    range: '80–100 pts',
    interpretation:
      "Extensive history, high ratings, and high reliability sustained over time. The platform's strongest trust signal — earned through consistent performance across many orders.",
  },
];

interface PaymentStep {
  label: string;
  actor: string;
  detail: string;
  note: string | null;
}

const paymentSteps: PaymentStep[] = [
  {
    label: 'Select a listing and specify quantity',
    actor: 'Buyer',
    detail:
      'Find the produce you want and enter the quantity. The platform confirms the quantity is available in the current listing and presents the total price based on the listed price per kilogram.',
    note: null,
  },
  {
    label: 'Confirm the order',
    actor: 'Buyer',
    detail:
      'Review the order details and confirm. The platform atomically reserves the ordered quantity from the listing — other buyers cannot order the same stock while your payment is pending.',
    note: null,
  },
  {
    label: 'STK Push sent to your phone',
    actor: 'Platform + Safaricom',
    detail:
      'The platform initiates an STK Push via Safaricom\'s Daraja API to your registered M-Pesa phone number. Within seconds, your phone receives a Safaricom payment prompt showing the amount and merchant name.',
    note: 'Your phone number on your UmojaHub account must be the same number registered to your M-Pesa account.',
  },
  {
    label: 'Enter your M-Pesa PIN on your phone',
    actor: 'Buyer',
    detail:
      'The Safaricom prompt appears on your phone. You enter your M-Pesa PIN directly into the Safaricom interface — not into any UmojaHub screen. UmojaHub never receives your PIN at any point in this process.',
    note: 'The STK Push expires after approximately three minutes. If you do not respond within that window, the push times out and no payment occurs.',
  },
  {
    label: 'Safaricom processes and confirms',
    actor: 'Safaricom',
    detail:
      "Safaricom processes the transaction on their end. When confirmed, Safaricom sends a confirmation to your phone (the standard Safaricom SMS) and simultaneously sends a callback to UmojaHub's systems.",
    note: null,
  },
  {
    label: 'Order status updates to PAID',
    actor: 'Platform',
    detail:
      'UmojaHub receives the Safaricom callback and updates the order status from PENDING to PAID. Both you and the farmer receive SMS notifications simultaneously.',
    note: 'Payment is held during fulfillment — it does not transfer immediately to the farmer\'s M-Pesa. It releases when you mark the order received.',
  },
  {
    label: 'Farmer dispatches produce',
    actor: 'Farmer',
    detail:
      "The farmer sees the PAID status and prepares your order. When they dispatch, they mark the order DISPATCHED and you receive an SMS notification with the farmer's contact information.",
    note: null,
  },
  {
    label: 'Mark the order received',
    actor: 'Buyer',
    detail:
      "When your produce arrives, mark the order RECEIVED in your account. This action releases the payment to the farmer's registered M-Pesa account. If you do not mark the order received within the platform's auto-completion window after the farmer marks dispatch, the system auto-completes and releases payment automatically.",
    note: 'Mark the order received only when the produce has actually arrived. Auto-completion exists to protect farmers from buyers who receive produce but do not complete the step.',
  },
  {
    label: 'Submit a rating',
    actor: 'Buyer',
    detail:
      'After the order is marked received, you can submit a 1–5 star rating for the farmer, with optional written commentary. Your rating is permanent and contributes directly to the farmer\'s Trust Score. Future buyers rely on your honest assessment.',
    note: 'Rating is not mandatory. But a buyer who rates consistently contributes to the accuracy of Trust Scores for all buyers who come after.',
  },
];

interface WorkflowStage {
  label: string;
  actor: string;
  detail: string;
  note: string | null;
}

const workflowStages: WorkflowStage[] = [
  {
    label: 'Browse the marketplace',
    actor: 'Buyer',
    detail:
      'The full marketplace is publicly accessible without registration. You can view all active listings, filter by crop type, county, price range, and minimum Trust Tier, and read individual farmer profiles including their complete Trust Score breakdown and all past ratings.',
    note: 'No account is required for this stage. Registration is only required to place an order.',
  },
  {
    label: 'Register',
    actor: 'Buyer',
    detail:
      'To place an order, create an account with your name, email, and phone number. Your phone number must be the same number registered to your M-Pesa account — it is where the payment STK Push will be sent. Verify your email via the link sent to your inbox.',
    note: null,
  },
  {
    label: 'Find and select produce',
    actor: 'Buyer',
    detail:
      'Use the search and filter tools to find the produce you need. Filter by crop, county, price range, and minimum Trust Tier. View listing details: crop name, description, quantity available, price, harvest date, pickup location, and the farmer\'s full trust profile.',
    note: null,
  },
  {
    label: 'Specify quantity and confirm order',
    actor: 'Buyer',
    detail:
      'Enter the quantity you want. The platform confirms availability and shows the total price. Confirm the order. The quantity is reserved immediately.',
    note: 'You can cancel a PENDING order before payment is confirmed. Once the order status changes to PAID, it cannot be cancelled through the platform.',
  },
  {
    label: 'Complete M-Pesa payment',
    actor: 'Buyer + Safaricom',
    detail:
      'Respond to the STK Push on your phone within the timeout window. Enter your M-Pesa PIN on your phone — not on any UmojaHub screen. Safaricom processes and confirms. Both you and the farmer receive SMS notifications.',
    note: null,
  },
  {
    label: 'Receive produce and mark received',
    actor: 'Buyer',
    detail:
      'The farmer dispatches your order and you receive an SMS when they do. When the produce arrives, mark the order RECEIVED. This releases payment to the farmer. If you do not mark received within the auto-completion window after dispatch, the system releases payment automatically.',
    note: 'Mark the order received only when produce has actually arrived.',
  },
  {
    label: 'Submit a rating',
    actor: 'Buyer',
    detail:
      'Rate the farmer on a 1–5 scale. You can add written commentary. Your rating is permanent, visible to all future buyers, and directly influences the farmer\'s Trust Score. An accurate rating — positive or negative — protects the buyers who come after you.',
    note: null,
  },
];

interface Limitation {
  heading: string;
  detail: string;
}

const limitations: Limitation[] = [
  {
    heading: 'No financial remediation for quality or quantity shortfalls',
    detail:
      "If produce arrives in the wrong quantity, wrong condition, or different variety from what was listed, the platform has no refund mechanism. Your recourse is to leave a low rating with a written explanation of the discrepancy. The rating affects the farmer's Trust Score and warns future buyers. It does not compensate you for what you received.",
  },
  {
    heading: 'Verified identity is not a quality guarantee',
    detail:
      "The verified badge on a listing means a platform administrator reviewed the farmer's identity documents and land documentation. It does not mean anyone inspected the specific produce in that listing. Quality is self-reported by the farmer in the listing description. Your Trust Tier assessment reduces quality risk — it does not eliminate it.",
  },
  {
    heading: 'Trust Score reflects history, not a future commitment',
    detail:
      "A farmer's Trust Score reflects their track record across past orders. A PREMIUM tier farmer can still deliver a poor individual order. A NEW tier farmer can deliver perfectly. Tier reduces comparative risk — it does not guarantee any individual outcome.",
  },
  {
    heading: 'Payment auto-completes if you do not mark received',
    detail:
      "If you receive your produce but do not mark the order RECEIVED within the platform's auto-completion window after the farmer marks dispatch, the system automatically completes the order and releases payment to the farmer. At that point, you can no longer dispute receipt through the order status. Leave a rating with your assessment instead.",
  },
  {
    heading: 'No automated refund for farmer non-dispatch',
    detail:
      "If a farmer accepts your PAID order and does not dispatch, your recourse is to escalate to platform support. There is no automated refund mechanism. Administrator review is required. This process is not instant and is not guaranteed to result in payment recovery. The rating system penalises farmers who do this — it does not make you whole.",
  },
  {
    heading: 'M-Pesa is the only payment method',
    detail:
      "UmojaHub is built for the Kenyan market where M-Pesa is the dominant mobile money platform. Card payments, bank transfers, and other payment methods are not currently supported. Your registered phone number must match your M-Pesa account.",
  },
  {
    heading: 'UmojaHub is not affiliated with Safaricom',
    detail:
      "UmojaHub uses Safaricom's M-Pesa Daraja API as a licensed third-party developer. Any issue with your M-Pesa account, balance, SIM status, or Safaricom service is a Safaricom matter. UmojaHub cannot access your M-Pesa account or assist with Safaricom account problems.",
  },
];

const faqItems: FaqItem[] = [
  {
    question: 'Can I browse produce without creating an account?',
    answer:
      "Yes. The entire marketplace is publicly accessible without registration — listings, prices, farmer profiles, Trust Scores, and past ratings. You only need to create an account when you want to place an order.",
  },
  {
    question: 'What if I miss the STK Push on my phone?',
    answer:
      "If you do not respond to the Safaricom payment prompt within the timeout window (approximately three minutes), the push expires. No money leaves your M-Pesa account. The order remains PENDING. You can initiate a new payment attempt from your order status screen, which sends a new STK Push.",
  },
  {
    question: 'Can I cancel an order after paying?',
    answer:
      "You can cancel a PENDING order — before payment is confirmed — through the platform. Once the order status changes to PAID, the order is in fulfillment and cannot be cancelled through normal account actions. Contact platform support if you have a paid order you need to discuss. There is no guarantee that cancellation of a paid order will result in payment recovery.",
  },
  {
    question: 'What if the produce I receive does not match the listing?',
    answer:
      "Mark the order received (so that your order is closed and the farmer's status updates) and then submit a rating with a specific, factual description of the discrepancy — wrong quantity, wrong variety, poor condition, and so on. Your rating is permanent and visible to all future buyers.\n\nThe platform does not provide financial remediation for quality or quantity shortfalls. The rating system is the accountability mechanism, not a refund process.",
  },
  {
    question: 'Can I get a refund if the produce quality is poor?',
    answer:
      "The platform does not have a refund mechanism for quality complaints. If produce does not match the listing, your recourse is to rate the transaction honestly with a written explanation. This protects future buyers. It does not compensate you for what you received.\n\nIf you believe the situation involved deliberate misrepresentation rather than a quality shortfall, you can report it to platform administrators in addition to leaving a rating.",
  },
  {
    question: 'What if the farmer does not dispatch after I have paid?',
    answer:
      "If your order shows PAID and the farmer has not updated the status to DISPATCHED after a reasonable period, contact platform support. Administrators can review the case and contact the farmer.\n\nThere is no automated refund for non-dispatch. Resolution depends on administrator review and is not instant. The rating system penalises farmers who do not fulfil paid orders — it does not make buyers whole for non-dispatch.",
  },
  {
    question: 'What does a farmer\'s tier tell me?',
    answer:
      "NEW: verified identity, no meaningful transaction history — you are taking a first-order risk with no track record to assess.\n\nESTABLISHED: growing history with some buyer ratings — enough to make a basic judgment if you read the existing ratings.\n\nTRUSTED: substantial completed orders with consistent positive performance — a strong signal for buyers who have no prior relationship with the farmer.\n\nPREMIUM: extensive history, high ratings, high reliability sustained over time — the platform's strongest signal.\n\nTier is a comparative tool, not a guarantee. Read individual ratings alongside the tier.",
  },
  {
    question: 'What information does the farmer see about me?',
    answer:
      "Before you place an order: nothing. Buyers are anonymous to farmers until an order is placed.\n\nAfter you place an order: your name, your phone number, and any delivery address you specify for the order. The farmer needs this information to contact you about fulfillment.",
  },
  {
    question: 'When does payment release to the farmer?',
    answer:
      "Payment is held during fulfillment — it does not transfer to the farmer immediately after your M-Pesa payment is confirmed. It releases when you mark the order RECEIVED. If you do not mark received within the auto-completion window after the farmer marks dispatch, the system releases payment automatically.\n\nThe auto-completion window exists to protect farmers from buyers who receive produce but do not complete the confirmation step.",
  },
  {
    question: 'What if my M-Pesa payment goes through but the order is not confirmed?',
    answer:
      "The platform detects payment confirmation from Safaricom's callback. If your M-Pesa account shows a payment sent but your order status has not updated within 15 minutes, contact platform support. Your payment is on record and can be reconciled. Do not attempt to pay again for the same order before contacting support.",
  },
  {
    question: 'Can I order from multiple farmers in a single checkout?',
    answer:
      "Orders are placed per listing — one order per listing per checkout. To buy from multiple farmers, you place separate orders for each. Each order has its own M-Pesa STK Push and its own fulfillment timeline.",
  },
  {
    question: 'Is M-Pesa the only payment method?',
    answer:
      "Yes. UmojaHub is built for the Kenyan market where M-Pesa is the dominant mobile payment platform. Your registered phone number must be your M-Pesa number. Card payments and bank transfers are not currently supported.",
  },
  {
    question: 'Do I need to submit verification documents as a buyer?',
    answer:
      "No. Buyers are not document-verified. Your M-Pesa phone number is your identity anchor in the system — it is where payment prompts are sent and where your transaction history is associated. You register with your name, email, and phone number only.",
  },
];

interface Misconception {
  belief: string;
  correction: string;
}

const misconceptions: Misconception[] = [
  {
    belief: '"Verified" means the produce quality is certified.',
    correction:
      "Verified means the farmer's identity documents and land documentation were reviewed by a platform administrator. No one inspects or certifies the quality of any individual listing. Quality is self-reported by the farmer. The Trust Score and buyer ratings are the quality signal — not the verified badge.",
  },
  {
    belief: 'I enter my M-Pesa PIN on the UmojaHub website.',
    correction:
      "You never enter your M-Pesa PIN on any UmojaHub interface. When you place an order, Safaricom sends a payment prompt directly to your phone. You enter your PIN on your phone's Safaricom screen — the same way you authorise any M-Pesa STK Push payment. UmojaHub receives only the payment confirmation from Safaricom.",
  },
  {
    belief: 'A high Trust Score guarantees I will have a good experience.',
    correction:
      "Trust Score reflects a farmer's historical behaviour across all past orders. It is a comparative signal, not a performance bond. A PREMIUM tier farmer can still deliver a poor individual order — if they do, their Trust Score will decline after your rating. Read individual ratings alongside the tier, particularly the most recent ones.",
  },
  {
    belief: 'I can get a refund if the produce quality is not what was described.',
    correction:
      "The platform does not have a financial remediation mechanism for quality or quantity shortfalls. If produce does not match the listing, your recourse is to rate the transaction honestly with a specific written explanation. That rating permanently affects the farmer's Trust Score and warns future buyers. It does not result in a refund.",
  },
  {
    belief: 'I need to register before I can see what produce is available and at what prices.',
    correction:
      "The entire marketplace — all listings, prices, Trust Scores, farmer profiles, and past buyer ratings — is publicly accessible without registration. Registration is only required when you want to place an order. Browse first, register when you find something you want to order.",
  },
];

export default function BuyersPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="Food Security Hub · For Buyers"
      heading="You want to buy direct from farmers. Knowing which farmers to trust before the first order has always required a personal introduction."
      intro="This page covers what the verified badge means, how to read a farmer's Trust Score, how M-Pesa payment works, what happens when things go wrong, and what the platform does not guarantee. Read it before you place your first order."
      sections={sections}
      registerHref="/auth/register?role=buyer"
      registerLabel="Register as a buyer"
    >
      {/* 1. The Problem */}
      <section id="the-problem" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          The problem
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          Why sourcing produce directly from farmers has always been difficult
        </h2>

        <div className="space-y-5 max-w-prose">
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            Before a platform like this exists, buying produce directly from a farmer you have never
            met requires a personal introduction. Someone you trust knows the farmer and can vouch
            for them. Without that introduction, you have no mechanism to assess whether the
            farmer is reliable, whether their produce matches what they describe, or whether they
            will fulfil an order after you pay. Every direct purchase from an unknown farmer is a
            decision made on trust you have no basis for.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            The existing alternatives each solve part of the problem and leave the rest intact.
            Physical markets give you access to produce but require your physical presence and offer
            no verification of the seller. WhatsApp groups extend geographic reach but have no
            verification layer and degrade into low-trust environments as they grow. Supermarket
            supply chains are convenient but add multiple handling layers, each adding cost and
            removing traceability. Broker-supplied produce adds margin without disclosing what the
            farmer received — and attaches the broker&apos;s identity, not the farmer&apos;s, to
            the produce you buy.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            The specific failures: no searchable directory of available produce from verified
            sources, no portable reputation for farmers that persists across transactions, no
            payment mechanism that confirms before the farmer must commit to dispatching, and no
            accountability system when a transaction goes wrong.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            These are the specific problems the Food Security Hub was built to address — not all of
            them, and not without conditions, which the limitations section of this page discloses.
          </p>
        </div>
      </section>

      {/* 2. How UmojaHub Responds */}
      <section id="how-it-responds" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          How UmojaHub responds
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          Five structural responses to the buyer&apos;s verification problem
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-zinc-800/50">
          {[
            {
              number: '01',
              heading: 'Verified farmers only',
              body: "Only farmers whose identity documents have been reviewed and approved by a platform administrator can create listings. You do not browse a mix of verified and unverified sellers — every listing you see has passed a human identity review. The farmer is who they say they are, and they farm what they say they farm.",
            },
            {
              number: '02',
              heading: 'Trust Score as searchable history',
              body: "A farmer's transaction history, buyer ratings, and fulfilment reliability are computed into a Trust Score (0–100) and a tier (NEW, ESTABLISHED, TRUSTED, PREMIUM) that appear on every listing. Before you place an order, you can see how many orders the farmer has completed, what buyers said about them, and how reliably they have fulfilled. The Trust Score makes reputation searchable.",
            },
            {
              number: '03',
              heading: 'Browse without registering',
              body: "The entire marketplace is public. You can search for any crop in any county, compare listings, read full farmer profiles, and review every past rating without creating an account. Registration is only required when you want to place an order. You are not asked to commit before you have enough information to decide.",
            },
            {
              number: '04',
              heading: 'M-Pesa payment — PIN on your phone, not the platform',
              body: "When you place an order, Safaricom sends a payment prompt directly to your registered phone number. You enter your M-Pesa PIN on your phone — not on any UmojaHub screen. UmojaHub receives only the payment confirmation. Payment is held during fulfilment and releases when you mark the order received.",
            },
            {
              number: '05',
              heading: 'Rating system that protects the next buyer',
              body: "After each completed order, you can rate the transaction. Your rating directly affects the farmer's Trust Score and is visible to every buyer who views that farmer's profile after you. Honest ratings — including low ratings with specific explanations — are the primary accountability mechanism in the marketplace. They do not compensate you, but they protect the buyers who come next.",
            },
          ].map((item) => (
            <div key={item.number} className="bg-surface-primary p-6 flex flex-col gap-3">
              <span className="font-mono text-t6 text-accent-green tabular-nums">{item.number}</span>
              <h3 className="font-heading text-t3 font-medium text-text-primary">{item.heading}</h3>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Reading Trust Signals */}
      <section id="reading-trust-signals" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          Reading trust signals
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-4">
          What each element of a listing means — and what it does not mean
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-8">
          Every listing shows several trust signals. Understanding what each signal actually
          represents prevents both over-reliance on it and under-use of it.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {trustSignals.map((signal) => (
            <div
              key={signal.label}
              className="flex flex-col gap-3 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <p className="font-body text-t5 text-text-primary font-medium">{signal.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    What it means
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {signal.whatItMeans}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    What it does not mean
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {signal.whatItDoesNotMean}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-4">
          What each Trust Tier means for your purchase decision
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800/50">
          {trustTiers.map((tier) => (
            <div key={tier.tier} className="bg-surface-elevated p-5 flex flex-col gap-2">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                {tier.tier}
              </p>
              <p className="font-mono text-t5 text-text-primary tabular-nums">{tier.range}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                {tier.interpretation}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-surface-elevated border border-zinc-800/50 rounded-sm p-5">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            Tier is a comparative tool. When choosing between two listings for the same crop at
            similar prices, tier and completed order count are the quickest comparison. When the
            decision is more consequential — large quantities, recurring orders — read the
            individual ratings and written commentary on each farmer&apos;s profile before
            ordering.
          </p>
        </div>
      </section>

      {/* 4. How Payment Works */}
      <section id="how-payment-works" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          How payment works
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-4">
          M-Pesa STK Push — every step from order confirmation to payment released
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-8">
          The payment process uses M-Pesa&apos;s STK Push mechanism. Your PIN is entered on your
          phone, not on this platform. UmojaHub receives only the payment confirmation from
          Safaricom — it never handles your payment credentials.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
          {paymentSteps.map((step, i) => (
            <div
              key={step.label}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <span className="font-mono text-t6 text-text-disabled tabular-nums shrink-0 pt-0.5 w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <p className="font-body text-t5 text-text-primary font-medium">{step.label}</p>
                  <span className="font-mono text-t6 text-text-disabled uppercase tracking-widest shrink-0">
                    {step.actor}
                  </span>
                </div>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {step.detail}
                </p>
                {step.note && (
                  <p className="font-body text-t6 text-text-disabled mt-2 border-l border-zinc-800/50 pl-3">
                    {step.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. What Can Go Wrong */}
      <section id="what-can-go-wrong" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          What can go wrong
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-4">
          Three failure scenarios — what happens and what your recourse is
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-8">
          Understanding failure modes before they happen is more useful than discovering them
          mid-transaction. These are the three most common issues buyers encounter.
        </p>

        <div className="space-y-4">
          {[
            {
              heading: 'Scenario A — The STK Push fails or expires',
              situation:
                'You placed an order. Your phone received a Safaricom payment prompt. You did not respond in time, or the prompt failed to arrive.',
              whatHappens:
                'If the push expires or you decline it, no money leaves your M-Pesa. The order remains PENDING. Your reserved quantity is held while the order is active.',
              yourRecourse:
                'Initiate a new payment attempt from your order status screen. A new STK Push is sent to your phone. Respond within the timeout window. If the prompt consistently fails to arrive, check your M-Pesa balance, ensure your registered phone number matches your M-Pesa account, and contact Safaricom if the M-Pesa service appears to be having issues.',
              cannotDo: 'You cannot force a payment confirmation without completing the STK Push.',
            },
            {
              heading: 'Scenario B — Produce does not match the listing',
              situation:
                'Your order was paid, fulfilled, and you marked it received. When you inspect the produce, the quantity is short, the quality is poor, or the variety is different from what was listed.',
              whatHappens:
                "Payment has already released to the farmer (you marked received). The order is complete in the platform's records.",
              yourRecourse:
                'Submit a rating with a specific, factual description of the discrepancy. Write what was ordered, what arrived, and the precise shortfall. Your rating is permanent, visible to all future buyers, and directly affects the farmer\'s Trust Score. You can also report the issue to platform support, who can review the case and may take action against the farmer\'s account for repeated misrepresentation.',
              cannotDo:
                "The platform does not provide financial remediation for quality or quantity shortfalls. A rating and an administrator report are the available mechanisms. They protect future buyers — they do not compensate you.",
            },
            {
              heading: 'Scenario C — Farmer does not dispatch after you have paid',
              situation:
                "Your order shows PAID. You received the payment confirmation SMS. The farmer has not updated the order status to DISPATCHED after what you consider a reasonable period.",
              whatHappens:
                'Payment is held during fulfilment — it has not yet been transferred to the farmer. The order remains in a PAID status awaiting dispatch.',
              yourRecourse:
                "Contact the farmer directly using the contact information in your order details. If you cannot reach the farmer or the situation is not resolved, escalate to platform support. Administrators can contact the farmer and review the case.",
              cannotDo:
                "There is no automated refund for non-dispatch. Administrator review is required and is not instant. If the administrator confirms non-dispatch, they can take action against the farmer's account — but outcome and timeline vary.",
            },
          ].map((scenario) => (
            <div key={scenario.heading} className="border border-zinc-800/50 rounded-sm overflow-hidden">
              <div className="bg-surface-elevated px-5 py-4 border-b border-zinc-800/50">
                <p className="font-body text-t5 text-text-primary font-medium">{scenario.heading}</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    Situation
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {scenario.situation}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    What happens
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {scenario.whatHappens}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    Your recourse
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {scenario.yourRecourse}
                  </p>
                </div>
                <div className="border-l border-zinc-800/50 pl-3">
                  <p className="font-body text-t6 text-text-disabled leading-relaxed">
                    {scenario.cannotDo}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. A Real Scenario */}
      <section id="a-real-scenario" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          A real scenario
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          What ordering actually looks like — James, Nairobi restaurant buyer
        </h2>

        <div className="border-l-2 border-zinc-800/50 pl-6 space-y-8">
          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              Before registration
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              James buys kale weekly for a Nairobi restaurant. He currently buys from a market
              trader. He has heard about UmojaHub and visits the website to see if it is real.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              He goes directly to the marketplace without registering. He searches for kale in
              Kiambu County. He finds seven listings. He sorts by Trust Score. The first result
              shows a TRUSTED farmer with 47 completed orders and an average rating of 4.7. He
              reads the farmer&apos;s profile, sees the Trust Score component breakdown, and reads
              six of the most recent buyer ratings. He decides to order from this farmer.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              Registration and first order
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              He registers with his phone number — the same number as his M-Pesa account — his
              name, and a password. Role: Buyer. He confirms via SMS OTP. Account created. No
              document verification required.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              He places an order: 50 kg of kale. The platform confirms availability and shows the
              total price. He confirms.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              M-Pesa payment
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              His phone receives a Safaricom payment prompt showing the amount and the merchant
              name. He enters his M-Pesa PIN on his phone. A Safaricom confirmation message
              appears: payment sent.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              His order dashboard updates: Order #KE0051 — PAID. He receives an SMS. He did not
              enter his PIN into UmojaHub. It went to Safaricom. UmojaHub received the
              confirmation.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              Delivery and rating
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              He receives an SMS: order dispatched. The produce arrives the next day. He checks
              the quantity and condition — 50 kg of kale, fresh, matching the listing description.
              He marks the order RECEIVED. Payment releases to the farmer&apos;s M-Pesa. He rates
              5 stars.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              He notices the farmer&apos;s completed order count increased from 47 to 48. His
              rating is now one of those visible on the profile.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              The following week — a different outcome
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The following week, James sees a new listing for kale from a NEW tier farmer at a
              slightly lower price. He decides to try them — he reads the verified badge, sees zero
              completed orders, and decides the price difference is worth the risk for a small
              order.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              He orders 30 kg. He pays. The produce arrives. He opens the crate: 25 kg, not 30 kg.
              No message from the farmer explaining the shortfall. He has already accepted delivery.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              He marks the order RECEIVED — the produce is there, even if short. Payment releases.
              He rates 2 stars with a written comment: &quot;Received 25 kg, not the 30 kg I
              paid for. No explanation from farmer.&quot; The rating is permanent and visible. The
              farmer&apos;s ratings component declines. James has not recovered the cost of the
              missing 5 kg. Other buyers will see his rating before deciding whether to order.
            </p>
          </div>

          <div className="space-y-4 border border-zinc-800/50 p-5">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              What this scenario shows
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              The Trust Score reduced James&apos;s risk on the first order — he chose a farmer
              with a real, reviewable track record. It did not eliminate risk on the second order,
              because a NEW tier farmer has no track record to review. The rating system worked as
              designed: the accurate, specific rating now protects the next buyer who views that
              farmer&apos;s profile. It did not compensate James for the missing 5 kg. Understanding
              this distinction before you order is the purpose of reading this page.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Complete Workflow */}
      <section id="complete-workflow" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          The complete workflow
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          Every stage from browsing to rating
        </h2>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
          {workflowStages.map((stage, i) => (
            <div
              key={stage.label}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <span className="font-mono text-t6 text-text-disabled tabular-nums shrink-0 pt-0.5 w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <p className="font-body text-t5 text-text-primary font-medium">{stage.label}</p>
                  <span className="font-mono text-t6 text-text-disabled uppercase tracking-widest shrink-0">
                    {stage.actor}
                  </span>
                </div>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {stage.detail}
                </p>
                {stage.note && (
                  <p className="font-body text-t6 text-text-disabled mt-2 border-l border-zinc-800/50 pl-3">
                    {stage.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Limitations */}
      <section id="limitations" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          Limitations
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-4">
          What the platform does not guarantee
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-8">
          The most important limitation is the first one below. Read it before you order.
        </p>

        <div className="space-y-4">
          {limitations.map((item) => (
            <div key={item.heading} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t5 text-text-primary font-medium mb-2">{item.heading}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">FAQ</p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-8">
          Frequently asked questions
        </h2>
        <FaqAccordion items={faqItems} />
      </section>

      {/* 10. Misconceptions */}
      <section id="misconceptions" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          Misconceptions
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-8">
          Specific incorrect beliefs — corrected directly
        </h2>

        <div className="space-y-4">
          {misconceptions.map((item) => (
            <div
              key={item.belief}
              className="border border-zinc-800/50 rounded-sm overflow-hidden"
            >
              <div className="bg-surface-elevated px-5 py-3 border-b border-zinc-800/50">
                <p className="font-body text-t5 text-text-disabled italic">{item.belief}</p>
              </div>
              <div className="px-5 py-4">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {item.correction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 11. Next Steps */}
      <section id="next-steps" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          What to do next
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-8">
          If you are ready to place your first order
        </h2>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {[
            {
              step: '01',
              action: 'Browse the marketplace first — no account required',
              detail:
                'Go to the marketplace and search for the produce you want in your county. Read farmer profiles and ratings before you decide. Registration is only needed when you want to order.',
              link: { href: '/marketplace', label: 'Browse the marketplace' },
            },
            {
              step: '02',
              action: 'Register when you find produce you want to order',
              detail:
                'You need your name, email address, and the phone number registered to your M-Pesa account. That number is where payment prompts will be sent.',
              link: { href: '/auth/register?role=buyer', label: 'Register as a buyer' },
            },
            {
              step: '03',
              action: "For your first order, choose a TRUSTED or PREMIUM tier farmer",
              detail:
                "You can order from any verified farmer, but for a first order on a platform you have not used before, a farmer with a substantial completed order count and positive ratings gives you the most information to assess before committing.",
              link: null,
            },
            {
              step: '04',
              action: 'Have your phone ready when you complete the order',
              detail:
                'The STK Push arrives within seconds of your order confirmation. Respond to the Safaricom prompt on your phone within the timeout window — approximately three minutes. If you miss it, you can retry from the order screen.',
              link: null,
            },
            {
              step: '05',
              action: 'Mark received when produce arrives — and rate honestly',
              detail:
                'Marking received releases payment to the farmer. Rate every transaction accurately. Your rating is the accountability mechanism for future buyers. A specific, factual low rating is more useful to the marketplace than no rating at all.',
              link: null,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <span className="font-mono text-t6 text-text-disabled tabular-nums shrink-0 pt-0.5 w-6">
                {item.step}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-t5 text-text-primary font-medium mb-1">
                  {item.action}
                </p>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {item.detail}
                </p>
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="inline-flex items-center justify-center min-h-[40px] mt-3 px-4 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t6 transition-all duration-150 hover:border-accent-green/50 hover:text-text-primary"
                  >
                    {item.link.label}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
            If you have questions not answered here
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            The{' '}
            <Link
              href="/trust"
              className="text-text-primary underline underline-offset-2 hover:text-accent-green transition-colors duration-150"
            >
              Trust &amp; Verification
            </Link>{' '}
            page has a detailed explanation of how farmer verification works and what the Trust
            Score methodology involves. If your question is not answered there, contact the
            platform through the support page.
          </p>
        </div>
      </section>
    </AudiencePage>
  );
}
