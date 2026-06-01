import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AudiencePage } from '@/components/website/AudiencePage';
import { FaqAccordion, type FaqItem } from '@/components/website/FaqAccordion';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const metadata: Metadata = {
  title: 'For Farmers — UmojaHub Food Security Hub',
  description:
    'What verification requires, how the Trust Score is built, what an order involves, and what the platform does not guarantee. A complete guide for farmers before registering.',
};

const sections: AnchorSection[] = [
  { id: 'the-problem', label: 'The problem' },
  { id: 'how-it-responds', label: 'How UmojaHub responds' },
  { id: 'real-scenario', label: 'A real scenario' },
  { id: 'complete-workflow', label: 'The complete workflow' },
  { id: 'how-trust-works', label: 'How trust works' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'misconceptions', label: 'Misconceptions' },
  { id: 'next-steps', label: 'What to do next' },
];

interface WorkflowStage {
  label: string;
  actor: string;
  detail: string;
  note: string | null;
}

const workflowStages: WorkflowStage[] = [
  {
    label: 'Register',
    actor: 'Farmer',
    detail:
      'Create an account with your phone number and select the Farmer role. Confirm your number with the SMS OTP sent to your phone. Your account is created immediately.',
    note: 'You can browse the marketplace, view Price Intelligence data, and use the AI Farm Assistant before verification is complete. You cannot create listings yet.',
  },
  {
    label: 'Submit verification documents',
    actor: 'Farmer',
    detail:
      'Upload three items: your National ID or passport, your land documentation (title deed, lease agreement, or a signed tenancy letter), and a photograph of your farm or produce. All three must be submitted together.',
    note: null,
  },
  {
    label: 'Wait for administrator review',
    actor: 'Admin',
    detail:
      'A UmojaHub administrator reviews your documents against your registration information. They check whether the documents are consistent and plausible — that the identity document names the person registered, that the land document relates to agricultural use, that the photograph is clear. The decision is APPROVED or REJECTED. You receive an SMS either way.',
    note: 'Rejection includes a specific reason. It is correctable and there is no limit on resubmissions. Most reviews complete within 24–48 hours, though queue depth can affect this.',
  },
  {
    label: 'Create a listing',
    actor: 'Farmer',
    detail:
      'After approval, create a listing for each crop you are selling. Set: crop type (from the approved list), price per kilogram, available quantity in kilograms, pickup county, and preferred contact method. The listing goes live immediately and is visible to buyers without any delay.',
    note: 'Check Price Intelligence before setting your price — it shows what comparable listings are asking in your county and in neighboring counties.',
  },
  {
    label: 'Receive an order',
    actor: 'Farmer',
    detail:
      'When a buyer places an order, you receive an SMS with the order details: quantity, buyer information, and total amount. The order status shows PENDING while the buyer completes M-Pesa payment.',
    note: 'Do not prepare produce or arrange transport for a PENDING order. Only dispatch after the order status changes to PAID.',
  },
  {
    label: 'Buyer pays',
    actor: 'System + Safaricom',
    detail:
      "Safaricom sends an STK Push to the buyer's registered M-Pesa phone number. The buyer enters their PIN on their device. Safaricom processes and confirms. The order status updates to PAID. You receive an SMS: payment confirmed, ready to dispatch.",
    note: 'Payment is held by the platform at this stage — it is not yet in your M-Pesa account. It releases when the order is marked received.',
  },
  {
    label: 'Dispatch produce',
    actor: 'Farmer',
    detail:
      'Arrange transport and deliver produce that matches the listing: correct crop type, correct quantity, in the condition you described. Mark the order DISPATCHED in your dashboard. The buyer receives an SMS notification.',
    note: null,
  },
  {
    label: 'Buyer confirms receipt',
    actor: 'Buyer',
    detail:
      'The buyer marks the order RECEIVED. Payment is released to your registered M-Pesa account. If the buyer does not confirm within the platform window after you mark dispatch, the system auto-completes the order and releases payment.',
    note: null,
  },
  {
    label: 'Both parties rate',
    actor: 'Both',
    detail:
      "After completion, both you and the buyer can submit ratings. Buyer ratings of you contribute to your Trust Score's ratings component. Your rating of the buyer is recorded but does not currently factor into any buyer-facing score.",
    note: null,
  },
  {
    label: 'Trust Score recalculates',
    actor: 'System',
    detail:
      'After each completed order, the platform recalculates your Trust Score from all four components. If the total crosses a tier boundary, your tier updates and your listing displays the new tier to buyers.',
    note: null,
  },
];

interface TrustComponent {
  name: string;
  weight: number;
  description: string;
  note: string;
}

const trustComponents: TrustComponent[] = [
  {
    name: 'Verification',
    weight: 40,
    description:
      'One-time. An administrator reviewed your submitted documents and approved them. This component is binary — either earned (40 pts) or not (0 pts). It does not increase further after approval.',
    note: 'The only component that requires administrator action rather than your own behavior. Earn it once by completing the verification process.',
  },
  {
    name: 'Transactions',
    weight: 25,
    description:
      'Cumulative completed orders on a logarithmic scale. Early orders contribute more per transaction than later ones — the difference between 0 and 5 orders is large; the difference between 95 and 100 is small. Each order requires a real buyer payment — this component cannot be inflated artificially.',
    note: 'A farmer who completes 10 orders in two months builds this component faster than one who completes 3 orders in a year.',
  },
  {
    name: 'Ratings',
    weight: 20,
    description:
      'Average buyer rating across all completed orders, weighted so recent ratings carry more influence than older ones. A single negative rating has diminishing effect as your total count grows. A farmer with one bad rating out of 40 orders is not equivalent to one with one bad rating out of 2.',
    note: 'The best way to build this component: ensure your produce consistently matches your listing description.',
  },
  {
    name: 'Reliability',
    weight: 15,
    description:
      'The ratio of orders fulfilled to orders accepted over a rolling period. Accepting orders and failing to dispatch — regardless of the reason — reduces this component. A farmer who accepts 10 orders and fulfils 9 scores higher on this component than one who accepts 10 and fulfils 6.',
    note: 'Only accept orders you are confident you can fulfil. Cancellations and non-dispatches count against this component even if your ratings are positive.',
  },
];

interface TrustTier {
  tier: string;
  range: string;
  signal: string;
}

const trustTiers: TrustTier[] = [
  {
    tier: 'NEW',
    range: '0–39 pts',
    signal:
      'Verified identity. No meaningful transaction history yet. Some buyers will wait for a track record before ordering.',
  },
  {
    tier: 'ESTABLISHED',
    range: '40–59 pts',
    signal:
      'Growing transaction history with acceptable ratings. Buyers can assess a real record — not extensive, but present.',
  },
  {
    tier: 'TRUSTED',
    range: '60–79 pts',
    signal:
      'Substantial completed orders with consistent positive performance. A strong signal for buyers who have not transacted with you before.',
  },
  {
    tier: 'PREMIUM',
    range: '80–100 pts',
    signal:
      "Extensive history, high ratings, and high reliability sustained over time. The platform's strongest trust signal to a buyer.",
  },
];

interface Responsibility {
  label: string;
  detail: string;
}

const responsibilities: Responsibility[] = [
  {
    label: 'Listing accuracy',
    detail:
      'Your listings must accurately describe the crop type, available quantity, price per kilogram, and pickup county. Listing produce you do not have, or in quantities you cannot provide, is a violation of platform terms.',
  },
  {
    label: 'Order fulfillment',
    detail:
      'When a buyer pays for an order, you are expected to dispatch produce that matches the listing — correct crop, stated quantity, and condition consistent with what was listed. Failure to dispatch a PAID order requires administrator involvement to resolve.',
  },
  {
    label: 'Quantity maintenance',
    detail:
      'Update your listing quantity as your stock changes. A buyer who places an order expecting 100 kg only to find you have 40 kg available has been misled by an inaccurate listing.',
  },
  {
    label: 'Single account',
    detail:
      'Each farmer may hold one account. Creating additional accounts to reset a Trust Score, circumvent a suspension, or access features you have been denied is grounds for permanent removal.',
  },
  {
    label: 'Document currency',
    detail:
      'If the land documentation you submitted changes materially — you move to a different parcel, your lease expires — you are expected to notify the platform. Verification is based on documents submitted at a point in time.',
  },
  {
    label: 'Accepting public ratings',
    detail:
      'Buyers can rate their transactions with you after completion. These ratings are visible on your profile and contribute to your Trust Score. You cannot opt out of the rating system.',
  },
];

interface Limitation {
  heading: string;
  detail: string;
}

const limitations: Limitation[] = [
  {
    heading: 'Verification does not guarantee orders',
    detail:
      'Approval confirms your identity and documents were reviewed. It does not create demand for your produce. Whether orders arrive depends on demand for your crop type in your county, your price relative to comparable listings, and your Trust Score tier. A newly approved farmer may wait days or weeks for their first order.',
  },
  {
    heading: 'Verification does not guarantee produce quality claims',
    detail:
      'UmojaHub does not inspect produce. Your listing describes what you will deliver. The buyer trusts your description. If the produce does not match, the buyer can leave a low rating. There is no quality certification process — verification is identity and land documentation only.',
  },
  {
    heading: 'Quality disputes have no financial remediation',
    detail:
      'If a buyer receives produce that does not match the listing — wrong quantity, poor condition — their recourse is to leave a low rating. The platform does not provide a refund mechanism for quality shortfalls. The rating system is the accountability mechanism, not financial remediation.',
  },
  {
    heading: 'M-Pesa payment failure is outside UmojaHub\'s control',
    detail:
      "Safaricom's Daraja API must be available for payments to process. If Safaricom's service is interrupted, STK Pushes cannot be initiated. In rare edge cases, Safaricom may confirm payment on their side but the callback to UmojaHub's system is delayed — the order can appear PENDING even though payment cleared on the buyer's M-Pesa statement. These cases require administrator intervention and are not resolved automatically.",
  },
  {
    heading: 'Buyers can choose not to rate',
    detail:
      'Rating is available to buyers after order completion but is not mandatory. A buyer who does not leave a rating does not contribute to your Trust Score. Over time, the ratings you do receive become your data — but some transactions will always go unrated.',
  },
  {
    heading: 'The platform is not affiliated with Safaricom',
    detail:
      "UmojaHub uses Safaricom's Daraja API as a licensed third-party developer. Any M-Pesa account issue — balance, network, SIM status — is a Safaricom matter. UmojaHub cannot access your M-Pesa account or assist with Safaricom account problems.",
  },
  {
    heading: 'Administrator review time varies',
    detail:
      'Verification queue depth depends on how many submissions are pending at any given time. Most reviews complete within 24–48 hours. During high-volume periods, it may take longer. The platform does not guarantee a specific review turnaround.',
  },
];

const faqItems: FaqItem[] = [
  {
    question: 'How long does verification take?',
    answer:
      'Verification review time depends on the current administrator queue. Most submissions are reviewed within 24–48 hours. During high-volume periods, it may take longer. You will receive an SMS when the decision is made. The platform does not provide a specific turnaround guarantee.',
  },
  {
    question: 'What happens if my verification is rejected?',
    answer:
      'Rejection is correctable. Your SMS will specify the reason. Common reasons: the land document does not clearly name you as the occupant or owner, the produce photograph is not clear enough to confirm the crop type, or the identity document photograph is not legible. Correct the specific issue identified and resubmit. There is no limit on resubmissions and no waiting period between attempts.',
  },
  {
    question: 'Can I list multiple crops?',
    answer:
      'Yes. After approval, you can create separate listings for each crop type you grow. Each listing is independent — it has its own price per kilogram, quantity, and pickup county. You can have multiple active listings simultaneously.',
  },
  {
    question: 'What happens if a buyer places an order but does not pay?',
    answer:
      "The system sends an STK Push to the buyer's registered phone. If the buyer does not respond within the timeout window, the push expires. No money moves. The order remains PENDING. Do not prepare produce or arrange transport for a PENDING order — wait for the order status to show PAID. The pending order will expire and your listing continues to be visible to other buyers.",
  },
  {
    question: 'What happens if I cannot fulfil an order after it is paid?',
    answer:
      "Contact the buyer through the platform as soon as you know. Failing to dispatch a PAID order creates a negative signal in your reliability component and is flagged to administrators. Reversing a confirmed M-Pesa payment is not an automated process — it requires administrator involvement and is not guaranteed to be resolved quickly. Persistent non-dispatch is grounds for account suspension.",
  },
  {
    question: 'When does the payment arrive in my M-Pesa?',
    answer:
      "Payment is held by the platform until the order is marked RECEIVED by the buyer. After the buyer confirms receipt, payment releases to your registered M-Pesa number. If the buyer does not mark received within the platform's auto-complete window after you mark dispatch, the system will auto-complete the order and release payment automatically.",
  },
  {
    question: 'How is the Trust Score calculated?',
    answer:
      'Four components: Verification (40 points, one-time, earned when your documents are approved), Transactions (25 points, based on completed order count on a logarithmic scale), Ratings (20 points, average buyer rating weighted by recency), and Reliability (15 points, ratio of fulfilled to accepted orders over a rolling period). The total from 0 to 100 determines your tier.',
  },
  {
    question: 'Why is my Trust Score not increasing?',
    answer:
      'Newly verified farmers start with 40 points — the verification component. The score increases only when you complete orders. The transactions component builds from completed order count. The ratings component builds from buyer ratings after completion. The reliability component builds from a consistent fulfilment ratio. To build your score: complete orders, ensure produce matches listings so buyers leave positive ratings, and only accept orders you can fulfil.',
  },
  {
    question: 'Can I change my listing price after creating it?',
    answer:
      'Yes. You can update the price, quantity, and availability at any time. Changes take effect immediately. Orders already paid at a previous price proceed at the price that was in effect when the order was placed — price changes do not affect existing orders.',
  },
  {
    question: 'What is the AI Farm Assistant?',
    answer:
      'A text-based interface for general agronomic questions. You can ask about planting schedules, pest management, soil preparation, crop rotation, and market timing for specific crops. It provides guidance based on general agricultural knowledge. It is not a certified extension officer and does not have real-time knowledge of your specific farm, soil type, or local weather unless you describe those conditions in your message. Each session starts from zero — it does not remember previous conversations.',
  },
  {
    question: 'What if a buyer leaves a rating I believe is unfair?',
    answer:
      "Ratings reflect the buyer's assessment of the transaction. The platform does not remove ratings based on a farmer's objection. A single low rating has diminishing influence as your total count grows — it affects a score based on 3 ratings more than one based on 40. If you believe a rating was submitted fraudulently or violates platform terms, you can report it to administrators, but removal is not guaranteed.",
  },
  {
    question: 'Does UmojaHub guarantee I will receive orders?',
    answer:
      'No. Verification is the precondition for listing — it is not a guarantee of demand. Whether orders arrive depends on demand for your crop in your county, your price relative to comparable listings, and your Trust Score tier. The platform cannot guarantee sales volume for any farmer.',
  },
  {
    question: 'Can I have more than one farmer account?',
    answer:
      'No. Creating multiple accounts to inflate your Trust Score, circumvent a suspension, or access features after being removed is a violation of platform terms and grounds for permanent removal.',
  },
];

interface Misconception {
  belief: string;
  correction: string;
}

const misconceptions: Misconception[] = [
  {
    belief: 'Verification means UmojaHub guarantees my sales.',
    correction:
      'Verification confirms your identity and farming documents were reviewed by an administrator. It is the precondition for listing produce — not a guarantee that any buyer will order from you. Whether orders arrive depends on demand for your crop, your pricing relative to other listings, and your Trust Score tier.',
  },
  {
    belief: 'My Trust Score will increase as I spend more time on the platform.',
    correction:
      'Trust Score does not increase with account age. It increases with verified identity (40 pts — earned once at approval), completed orders (transactions component), buyer ratings after those orders (ratings component), and a consistent fulfilment ratio (reliability component). A farmer registered for two years with no completed orders has the same Trust Score as one registered yesterday: 40 points if verified, 0 if not.',
  },
  {
    belief: 'If my verification is rejected, I cannot reapply.',
    correction:
      'Rejection is correctable and there is no limit on resubmissions. The rejection SMS specifies the reason. Most rejections are due to documentation issues — an unclear photograph, a land document that does not name you as the occupant — that are straightforward to resolve. Rejection is not a determination of ineligibility.',
  },
  {
    belief: 'UmojaHub is a Safaricom product.',
    correction:
      "UmojaHub is not affiliated with Safaricom. UmojaHub uses Safaricom's M-Pesa Daraja API as a licensed third-party developer. For questions about your M-Pesa account, balance, or Safaricom service, contact Safaricom — UmojaHub cannot assist with Safaricom account issues.",
  },
  {
    belief: 'A high Trust Score means my produce quality is guaranteed to buyers.',
    correction:
      'Trust Score measures three behavioral signals: how many orders you have completed, how buyers rated their experience, and how consistently you fulfilled accepted orders. It does not measure the quality of your produce at any future point. A PREMIUM tier farmer who delivers underweight or poor-condition produce will receive negative ratings and see their score decline.',
  },
];

export default function FarmersPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="Food Security Hub · For Farmers"
      heading="You grow produce. Your reliability has no public record."
      intro="This page covers what verification requires, how the Trust Score is built, what an order actually involves, and what the platform does not guarantee. Read it before you register."
      sections={sections}
      registerHref="/auth/register?role=farmer"
      registerLabel="Register as a farmer"
    >
      {/* 1. The Problem */}
      <section id="the-problem" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          The problem
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          Why the system smallholder farmers operate in structurally disadvantages them
        </h2>

        <div className="space-y-5 max-w-prose">
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            When a smallholder farmer brings produce to a local trader or market broker, the price
            they are offered is set by someone who also knows the end-market price — the price the
            same produce sells for at a Nairobi wholesale market, a hotel kitchen, or a retail
            outlet. The farmer does not know that price. They know only what they are being offered
            in front of them, and they have no time, and often no means, to independently verify
            whether the offer reflects actual demand or a margin that stays with the intermediary.
            This is not a failure of individual bad actors — it is a structural consequence of
            asymmetric price information.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            The second problem is portable reputation. A farmer who consistently fulfils orders on
            time, delivers the quantity stated, and charges a fair price is a reliable commercial
            partner. But that reliability is stored in informal memory — in the experience of the
            specific traders and neighbors they have dealt with. It cannot be searched. It cannot be
            shown to a buyer in a different county. When a new buyer encounters them, they have no
            basis for distinguishing this reliable farmer from an unreliable one except the social
            introduction of someone they both know. Social introductions do not scale. They are
            bounded by geography and prior relationship.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            The third problem is reach. A farmer in Kiambu can sell to buyers who come to Kiambu,
            or to brokers who work that route. Buyers in Nairobi who want direct farm relationships
            have no systematic way to find them. There is no searchable directory of available
            produce from verified sources. Without such a directory, buyers default to the
            intermediary networks they already know — and the farmer remains invisible to buyers
            who would have preferred to buy directly.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            These three failures — price opacity, unportable reputation, and geographic reach
            constraints — are the specific problems the Food Security Hub was built to address.
          </p>
        </div>
      </section>

      {/* 2. How UmojaHub Responds */}
      <section id="how-it-responds" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          How UmojaHub responds
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          Five structural responses to five structural problems
        </h2>

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-zinc-800/50">
            {[
              {
                number: '01',
                heading: 'Verified identity',
                body: 'An administrator reviews your submitted documents and confirms you are who you say you are and farm what you claim to farm. This does not require business registration. It does not require a bank account. It requires a National ID or passport, land documentation, and a produce photograph. After approval, every listing you create shows "Verified" — the buyer knows a human reviewed your documents before your produce appeared in the marketplace.',
              },
              {
                number: '02',
                heading: 'Public Trust Score',
                body: 'Your reliability is not stored in informal memory anymore. Every completed order, every buyer rating, and every fulfilled commitment contributes to a Trust Score that is visible on your profile and on every listing. A buyer in Nairobi who has never met you can see your transaction count, your tier, and your rating average before placing an order. Your reliability becomes searchable.',
              },
              {
                number: '03',
                heading: 'Price Intelligence',
                body: 'Before setting the price on any listing, you can see what comparable listings are asking for the same crop type in your county and neighboring counties. This is not a market price oracle — it reflects what other farmers on the platform are currently asking. But it is a directional signal you could not access through a broker conversation, where the broker alone knows both sides of the price.',
              },
              {
                number: '04',
                heading: 'M-Pesa payment — no bank account required',
                body: "Every transaction on UmojaHub uses M-Pesa STK Push. The buyer enters their M-Pesa PIN on their own device — UmojaHub never receives that PIN. Safaricom confirms. The order updates. You receive an SMS. No cash handling. No bank account required on either side. No payment that requires the buyer to physically be present. The payment record exists in Safaricom's system, independent of either party's claim.",
              },
              {
                number: '05',
                heading: 'Direct buyer access, nationwide',
                body: 'Your listing is visible to any buyer in Kenya who searches for your crop type in your county — not just buyers in your social or geographic network. A hotel buyer in Nairobi sourcing Kiambu produce can find your listing directly. A restaurant buyer who wants to build a direct farmer relationship can filter by verified status and Trust Score tier. You are no longer invisible to buyers who were never in your network.',
              },
            ].map((item) => (
              <div key={item.number} className="bg-surface-primary p-6 flex flex-col gap-3">
                <span className="font-mono text-t6 text-accent-green tabular-nums">
                  {item.number}
                </span>
                <h3 className="font-heading text-t3 font-medium text-text-primary">
                  {item.heading}
                </h3>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. A Real Scenario */}
      <section id="real-scenario" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          A real scenario
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          What joining actually looks like — Wanjiku, kale farmer, Kiambu County
        </h2>

        <div className="border-l-2 border-zinc-800/50 pl-6 space-y-8">
          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              Before registration
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Wanjiku has 1.5 acres in Kiambu and grows kale. She sells primarily to roadside
              traders who come to her farm. She has been told she receives KES 15 per kilogram. She
              has seen the same kale priced at KES 30 per kilogram at a Nairobi market. She cannot
              confirm the gap — the trader does not share what they sell for on the other end.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A neighbor farmer tells her about UmojaHub. She visits the website on her Android
              phone. She reads the explanation of what verification requires. She reads what the
              platform does not guarantee. She reads that there is no promise of sales — only a
              mechanism to make her available to buyers who would otherwise have no way to find her.
              She decides to register.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              Registration and verification
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              She enters her phone number, creates a password, and selects Farmer. She confirms her
              number with an SMS OTP. Account created. She can now see the marketplace and the Price
              Intelligence dashboard — but she cannot list anything yet.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              She opens the Price Intelligence dashboard. Kale in Kiambu County is currently listed
              by other farmers at KES 22 to 28 per kilogram. This is the first time she has seen
              market-side pricing information that was not filtered through a trader&apos;s offer.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              She photographs her National ID. She photographs her land lease agreement — it names
              her, specifies the parcel, and is signed by the landowner. She photographs her kale
              crop in the field. She uploads all three. Her dashboard shows: PENDING.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              She waits. There is no countdown. The next day, she receives an SMS: verification
              approved. Her dashboard updates. Trust Score: 40. Tier: NEW. She can now create
              listings.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              First listing
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              She creates her first listing. Crop: Kale. Quantity: 200 kg. Price: KES 24 per
              kilogram — below the average she saw in Price Intelligence, because she is NEW tier
              with no completed orders and expects buyers to be cautious. County: Kiambu. Contact
              method: SMS.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The listing goes live immediately. She can see it in the marketplace alongside
              listings from ESTABLISHED and TRUSTED farmers. Those farmers show order counts in the
              dozens. Hers shows zero. She is new. She expects to wait.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              First order — three days later
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Three days after listing, she receives an SMS: new order, 50 kg of kale, order number
              KE0042. She opens her dashboard. Status: PENDING — waiting for buyer to pay. She does
              not harvest anything yet. She does not arrange transport. She waits for PAID.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Twenty minutes later: a second SMS. Order KE0042 paid. KES 1,200 received. Ready to
              dispatch. She now harvests and prepares 50 kg. She arranges transport to the buyer —
              the order details include the buyer&apos;s contact information and the pickup address they
              specified. She marks the order DISPATCHED. The buyer receives an SMS.
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              Completion and what changes
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The buyer marks the order RECEIVED. The KES 1,200 arrives in her M-Pesa account —
              this is the first direct buyer payment she has received without a trader in between.
              Both parties leave ratings. The buyer gives her 4 stars. She gives the buyer 5 stars.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Her Trust Score updates. She now has one completed order and one buyer rating. She
              remains in NEW tier — the tier boundary for ESTABLISHED requires more transactions.
              Her listing now shows: 1 completed order. It is a small number. It is also real.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Three weeks later, after eight completed orders and seven buyer ratings averaging
              4.4 stars, her Trust Score crosses the ESTABLISHED threshold. Her listing now shows
              the ESTABLISHED badge. She increases her price to KES 26 per kilogram. She no longer
              needs to price below market to compensate for a zero transaction count.
            </p>
          </div>

          <div className="space-y-4 border border-zinc-800/50 p-5">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              What this scenario does not show
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              Wanjiku&apos;s path was reasonably smooth. She had clear documentation. Her first buyer
              paid. Her produce arrived in good condition. Not every farmer&apos;s experience follows
              this path. Some verification submissions are rejected and require resubmission. Some
              buyers place PENDING orders that never pay. Some buyers receive produce and leave low
              ratings. The scenario above is accurate but not universal. The limitations section of
              this page documents what can go wrong.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Complete Workflow */}
      <section id="complete-workflow" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          The complete workflow
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-6">
          Every stage from registration to completed order
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

      {/* 5. How Trust Works */}
      <section id="how-trust-works" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          How trust works
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-4">
          The Trust Score: four components, specific weights, real implications
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-8">
          Your Trust Score is a number from 0 to 100. Buyers see it as a tier label on your
          listings. The score is not a black box — it has four components with defined weights. You
          control three of them entirely through your behavior. One requires administrator action and
          is earned once.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {trustComponents.map((comp) => (
            <div
              key={comp.name}
              className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="sm:w-44 shrink-0">
                <p className="font-body text-t5 text-text-primary font-medium">{comp.name}</p>
                <p className="font-mono text-t6 text-accent-green tabular-nums mt-0.5">
                  {comp.weight} points
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {comp.description}
                </p>
                <p className="font-body text-t6 text-text-disabled mt-2 border-l border-zinc-800/50 pl-3">
                  {comp.note}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-4">
          Trust Tiers
        </h3>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-6">
          Your score maps to one of four tiers that appear on your listings. Tiers are not permanent
          achievements — they recalculate every time your score changes. A farmer who stops
          fulfilling orders reliably can drop from TRUSTED to ESTABLISHED as the reliability
          component falls.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800/50">
          {trustTiers.map((tier) => (
            <div key={tier.tier} className="bg-surface-elevated p-5 flex flex-col gap-2">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                {tier.tier}
              </p>
              <p className="font-mono text-t5 text-text-primary tabular-nums">{tier.range}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{tier.signal}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-surface-elevated border border-zinc-800/50 rounded-sm p-5">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
            What Trust Score does not mean
          </p>
          <ul className="space-y-2">
            {[
              'It does not predict the quality of produce on any specific order.',
              'It does not guarantee that any individual transaction will go smoothly.',
              'A NEW tier farmer is not untrustworthy — they have verified identity and no transaction history yet.',
              'A high Trust Score can decline if fulfillment behavior changes.',
              'Trust Score reflects historical behavior, not guaranteed future performance.',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 rounded-full bg-text-disabled shrink-0" />
                <p className="font-body text-t5 text-text-secondary">{point}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Responsibilities */}
      <section id="responsibilities" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          Responsibilities
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-4">
          What you agree to when you join
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-8">
          These are not buried in a terms document. They are stated here because understanding them
          before you register is the purpose of this page.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
          {responsibilities.map((item) => (
            <div
              key={item.label}
              className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <p className="font-body text-t5 text-text-primary font-medium sm:w-44 shrink-0">
                {item.label}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Limitations */}
      <section id="limitations" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          Limitations
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-4">
          What the platform does not guarantee
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed max-w-prose mb-8">
          Disclosing limitations before you encounter them is the honest version of building trust.
          A farmer who joins understanding these constraints will not be surprised. One who joins
          without understanding them will be disappointed by things the platform was never designed
          to prevent.
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

      {/* 8. FAQ */}
      <section id="faq" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          FAQ
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-8">
          Frequently asked questions
        </h2>
        <FaqAccordion items={faqItems} />
      </section>

      {/* 9. Misconceptions */}
      <section id="misconceptions" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          Misconceptions
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-8">
          Specific incorrect beliefs — corrected directly
        </h2>

        <div className="space-y-4">
          {misconceptions.map((item) => (
            <div key={item.belief} className="border border-zinc-800/50 rounded-sm overflow-hidden">
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

      {/* 10. What to Do Next */}
      <section id="next-steps" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
          What to do next
        </p>
        <h2 className="font-heading text-display-sm font-semibold text-text-primary tracking-tight mb-8">
          If you are ready to register
        </h2>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
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
                'You need three items: National ID or passport (clear photograph), land documentation (title deed, lease agreement, or signed tenancy letter that names you), and a photograph of your farm or produce. All three must be submitted together. Incomplete submissions will be rejected.',
              link: null,
            },
            {
              step: '03',
              action: 'While waiting for approval, use Price Intelligence',
              detail:
                'After registration, you can access the Price Intelligence dashboard before verification is complete. Look at what comparable crops are listed for in your county. This informs your pricing decision once you can list.',
              link: null,
            },
            {
              step: '04',
              action: 'After approval: create your first listing',
              detail:
                'You will receive an SMS when your verification is approved. Log in and create your first listing. Set a price informed by what you saw in Price Intelligence. Start with an accurate quantity you can actually provide.',
              link: null,
            },
            {
              step: '05',
              action: 'Wait for your first order — and do not dispatch until it is PAID',
              detail:
                'Your first order may come in hours or days. When it arrives, it shows PENDING until the buyer pays. Only prepare produce and arrange transport after the order status shows PAID. Not before.',
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
              href="/marketplace"
              className="text-text-primary underline underline-offset-2 hover:text-accent-green transition-colors duration-150"
            >
              marketplace
            </Link>{' '}
            is public — you can browse listings from other verified farmers before registering. The{' '}
            <Link
              href="/trust"
              className="text-text-primary underline underline-offset-2 hover:text-accent-green transition-colors duration-150"
            >
              Trust &amp; Verification
            </Link>{' '}
            page has a more detailed explanation of how verification works across both hubs. If your
            question is not answered by either, contact the platform through the support page.
          </p>
        </div>
      </section>
    </AudiencePage>
  );
}
