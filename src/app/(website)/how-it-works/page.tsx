import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AudiencePage } from '@/components/website/AudiencePage';
import { EcosystemMap } from '@/components/website/EcosystemMap';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const metadata: Metadata = {
  title: 'How It Works — UmojaHub',
  description:
    'Complete overview of the Food Security Hub marketplace, Education Hub project verification, M-Pesa payment system, verification methodology, and Trust Score calculation.',
};

const sections: AnchorSection[] = [
  { id: 'the-two-hubs', label: 'The two hubs' },
  { id: 'food-security-hub', label: 'Food Security Hub' },
  { id: 'education-hub', label: 'Education Hub' },
  { id: 'payment-system', label: 'Payment system' },
  { id: 'verification-system', label: 'Verification system' },
  { id: 'trust-score-system', label: 'Trust Score system' },
  { id: 'data-and-privacy', label: 'Data and privacy' },
];

interface WorkflowStep {
  step: string;
  actor: string;
  detail: string;
  note: string | null;
}

const foodHubSteps: WorkflowStep[] = [
  {
    step: '01',
    actor: 'Farmer',
    detail:
      'Register with a phone number, select the Farmer role, and confirm the number with an SMS OTP. The account is created immediately.',
    note: 'The marketplace is browsable without registration. Verification is required before listing. Farmers can use Price Intelligence and the AI Farm Assistant while verification is pending.',
  },
  {
    step: '02',
    actor: 'Farmer',
    detail:
      'Submit three verification documents: a National ID or passport, land documentation (title deed, lease agreement, or a signed tenancy letter from the landowner), and a photograph of the farm or produce.',
    note: null,
  },
  {
    step: '03',
    actor: 'Admin',
    detail:
      'A UmojaHub administrator reviews the documents for consistency and plausibility. They check whether the identity document name matches the registered name, whether the land documentation plausibly describes agricultural use, and whether the photograph is consistent with the claimed crop. Decision: APPROVED or REJECTED. The farmer receives an SMS either way within 24–48 hours.',
    note: 'Rejection includes a specific correctable reason. There is no limit on resubmissions. The second review follows the same 24–48 hour process — there is no priority lane.',
  },
  {
    step: '04',
    actor: 'System',
    detail:
      "On approval, the farmer's Trust Score initializes with the verification component (40 points). Trust Tier becomes ESTABLISHED. They may now create marketplace listings.",
    note: null,
  },
  {
    step: '05',
    actor: 'Farmer',
    detail:
      'Create a listing: select crop type from the approved list, set price per kilogram, enter available quantity, choose pickup county, and set preferred contact method. The listing goes live immediately with no additional delay.',
    note: 'Check Price Intelligence before setting the price — it shows what comparable listings are asking in the same county and neighboring counties.',
  },
  {
    step: '06',
    actor: 'Buyer',
    detail:
      'Browse listings without registering. Filter by crop type, county, price range, and minimum Trust Tier. View any listing detail — crop description, quantity, price, harvest date, pickup county, farmer Trust Score, verified badge, and completed order count.',
    note: null,
  },
  {
    step: '07',
    actor: 'Buyer',
    detail:
      'Register with a phone number, select the Buyer role. Place an order by specifying quantity. The platform validates availability and immediately initiates an M-Pesa STK Push to the registered phone number.',
    note: null,
  },
  {
    step: '08',
    actor: 'Safaricom',
    detail:
      "Safaricom sends a payment prompt to the buyer's phone. The buyer enters their M-Pesa PIN on their device — not on the platform. UmojaHub never receives the PIN. Safaricom processes the transaction and sends a confirmation callback to UmojaHub. Order status updates to PAID. The farmer receives an SMS: payment confirmed.",
    note: 'The farmer must not prepare produce or arrange transport for a PENDING order. Only dispatch after the order status changes to PAID.',
  },
  {
    step: '09',
    actor: 'Farmer',
    detail:
      'After receiving the PAID SMS, arrange transport and dispatch produce to the buyer. Update the order status to DISPATCHED. Payment is held by the platform at this stage — it has not yet transferred to the farmer M-Pesa account.',
    note: null,
  },
  {
    step: '10',
    actor: 'Buyer',
    detail:
      'On receipt, mark the order RECEIVED in the platform. Payment releases immediately to the farmer M-Pesa account. If the buyer does not mark received within the platform auto-completion window, the system marks it received automatically and payment releases.',
    note: null,
  },
  {
    step: '11',
    actor: 'Buyer',
    detail:
      'Submit a 1–5 star rating with an optional written comment. The rating is visible on the farmer public profile. It contributes to the Trust Score ratings component, weighted by recency.',
    note: null,
  },
];

const educationHubSteps: WorkflowStep[] = [
  {
    step: '01',
    actor: 'Student',
    detail: 'Register with an email address or phone number and select the Student role.',
    note: null,
  },
  {
    step: '02',
    actor: 'Student',
    detail:
      'Select a project track. AI_BRIEF: the platform generates a project brief from the agricultural industry context library — a real problem type in a real Kenyan agricultural domain with defined technical constraints. OPEN_SOURCE: the student selects a real open-source repository and proposes a meaningful contribution scope.',
    note: null,
  },
  {
    step: '03',
    actor: 'System / Student',
    detail:
      'On the AI_BRIEF track, the platform generates a specific brief including a problem statement, domain context, technical constraints, and evaluation criteria. On the OPEN_SOURCE track, the student defines the contribution scope and has it confirmed before work begins.',
    note: null,
  },
  {
    step: '04',
    actor: 'Student',
    detail:
      'Work on the project. The AI Mentor is available throughout — it responds to questions with questions, not answers. It asks the student to articulate their reasoning. It will not write documents or generate code on the student behalf.',
    note: null,
  },
  {
    step: '05',
    actor: 'Student',
    detail:
      'Write three process documents before submitting. Problem Breakdown: decompose the brief into its component problems, document alternative approaches considered and rejected with reasoning, identify technical risks. Approach Plan: specify the implementation approach, milestones, and task decomposition. Final Reflection: document what was completed, what was not and why, what was learned, what would be done differently.',
    note: 'The Reflection is the most scrutinized document in review. A polished Breakdown with a superficial Reflection is weaker than the reverse — reviewers are reading for honest self-assessment, not a summary of what was built.',
  },
  {
    step: '06',
    actor: 'System',
    detail:
      'The student submits all three documents and the code or repository link. The platform creates a SHA-256 hash of the document content and records it in the audit log with a timestamp. Submission is one-way — it cannot be undone. Status becomes PEER_REVIEW.',
    note: null,
  },
  {
    step: '07',
    actor: 'Peer student',
    detail:
      'The submitting student is assigned another submission to peer review. They score it on four dimensions (1–5) and write commentary for each. The peer score is locked before the submission advances to the lecturer queue. The peer reviewer is identified — anonymous reviews are not accepted.',
    note: 'The submitting student must complete their assigned peer review before their own submission advances to the lecturer queue.',
  },
  {
    step: '08',
    actor: 'Verified lecturer',
    detail:
      'A verified lecturer selects the submission from the queue. They receive the brief, all three documents, the code or repository, and the peer score with commentary. They assess the four dimensions independently and issue a decision with a minimum of 50 substantive words of commentary per dimension.',
    note: null,
  },
  {
    step: '09',
    actor: 'System',
    detail:
      'VERIFIED: a portfolio entry is published — project title, track, verification date, reviewer name and institution, peer scores on four dimensions, all three document texts in full, document hash, and repository link. Permanently accessible via a public URL with no registration required to view.',
    note: 'REVISION_REQUIRED: specific feedback returned to the student; revised submission re-enters the review process. DENIED: does not appear in portfolio; the student may begin a new project engagement.',
  },
  {
    step: '10',
    actor: 'Employer',
    detail:
      "Access the portfolio URL without registering. Read all three documents in full. See the reviewer name and institutional affiliation — searchable independently. Check the peer scores on each dimension. Verify the document hash: the documents visible are the same documents the reviewer reviewed.",
    note: null,
  },
];

interface PaymentStep {
  step: string;
  who: string;
  what: string;
}

const paymentSteps: PaymentStep[] = [
  {
    step: '01',
    who: 'Buyer',
    what: "Clicks place order and specifies quantity. The platform validates that the quantity is available and the listing is active before initiating payment.",
  },
  {
    step: '02',
    who: 'Platform',
    what: "Calls Safaricom's Daraja API with the buyer's registered phone number and the order total. A payment request is initiated immediately.",
  },
  {
    step: '03',
    who: 'Safaricom',
    what: "Sends an STK Push — a payment prompt — to the buyer's phone. The buyer must respond within the timeout window or the request expires.",
  },
  {
    step: '04',
    who: 'Buyer',
    what: "Enters their M-Pesa PIN on their own device. The PIN travels directly from the buyer's phone to Safaricom. UmojaHub never receives or stores the PIN.",
  },
  {
    step: '05',
    who: 'Safaricom',
    what: 'Processes the transaction, deducts from the buyer M-Pesa balance, and sends a confirmation callback to the UmojaHub server with the transaction reference number and amount.',
  },
  {
    step: '06',
    who: 'Platform',
    what: 'Receives the callback, records the transaction reference, and updates the order status to PAID. An SMS fires to the farmer: payment confirmed, ready to dispatch. Payment is held — it has not yet transferred to the farmer.',
  },
  {
    step: '07',
    who: 'Platform',
    what: "When the buyer marks RECEIVED (or the auto-completion window elapses), payment is released from the platform hold to the farmer's registered M-Pesa account.",
  },
];

interface FailureMode {
  scenario: string;
  whatHappens: string;
}

const paymentFailures: FailureMode[] = [
  {
    scenario: 'STK Push timeout',
    whatHappens:
      'The buyer did not respond to the prompt within the timeout window. No money moves. The order stays PENDING. The buyer can re-initiate payment from their order view.',
  },
  {
    scenario: 'Buyer declines',
    whatHappens: 'The buyer received the prompt and explicitly declined. No money moves. The order stays PENDING.',
  },
  {
    scenario: 'Insufficient M-Pesa balance',
    whatHappens:
      'Safaricom rejects the transaction. No money moves. The buyer receives a Safaricom notification. The order stays PENDING.',
  },
  {
    scenario: 'Safaricom service interruption',
    whatHappens:
      "Safaricom's Daraja API is unavailable. UmojaHub cannot initiate the STK Push. Payment cannot proceed until service is restored. UmojaHub does not control Safaricom's infrastructure.",
  },
  {
    scenario: 'Callback delay',
    whatHappens:
      "In rare cases, Safaricom confirms payment but the callback to UmojaHub arrives late. The order may appear PENDING on the platform while payment has already cleared on the buyer's M-Pesa statement. This requires administrator intervention to resolve.",
  },
];

interface TrustComponent {
  name: string;
  weight: string;
  measures: string;
}

const trustComponents: TrustComponent[] = [
  {
    name: 'Verification',
    weight: '40 pts',
    measures:
      'Binary — present or absent. Awarded when identity and land documents are reviewed and approved by an administrator. Does not recalculate after awarded.',
  },
  {
    name: 'Transactions',
    weight: '25 pts',
    measures:
      'Number of completed orders, scaled logarithmically. Early orders have a larger impact than later ones. Cannot be fabricated — each order requires a real buyer payment confirmed by Safaricom.',
  },
  {
    name: 'Ratings',
    weight: '20 pts',
    measures:
      'Average buyer rating across all completed orders, weighted by recency. Recent ratings carry more weight. A single bad rating has diminishing influence as total rating count grows.',
  },
  {
    name: 'Reliability',
    weight: '15 pts',
    measures:
      'Ratio of fulfilled orders to accepted orders over a rolling window. High ratings from completed orders do not compensate for a pattern of non-fulfilment.',
  },
];

interface TrustTier {
  tier: string;
  range: string;
  meaning: string;
}

const trustTiers: TrustTier[] = [
  {
    tier: 'NEW',
    range: '0–39',
    meaning: 'Verified identity, no meaningful transaction history yet.',
  },
  {
    tier: 'ESTABLISHED',
    range: '40–59',
    meaning: 'Verified identity with a growing transaction record and some buyer ratings.',
  },
  {
    tier: 'TRUSTED',
    range: '60–79',
    meaning:
      'Substantial transaction history with consistent positive ratings and reliable fulfilment.',
  },
  {
    tier: 'PREMIUM',
    range: '80–100',
    meaning: "Extensive history, high ratings, high reliability. The platform's strongest signal.",
  },
];

interface DataCategory {
  label: string;
  detail: string;
}

const publicData: DataCategory[] = [
  {
    label: 'Marketplace listings',
    detail:
      'Crop type, price per kilogram, quantity available, pickup county, harvest date, farmer Trust Tier and verified badge, and completed order count. Visible to all visitors without registration.',
  },
  {
    label: 'Farmer public profile',
    detail:
      'Trust Score, Trust Tier, completed order count, average buyer rating, and all buyer rating comments. Visible to all visitors without registration.',
  },
  {
    label: 'Student portfolio entries',
    detail:
      'All VERIFIED project entries — project title, track, verification date, reviewer name and institutional affiliation, peer scores on four dimensions, all three document texts in full, document hash, and repository link. Visible to all visitors without registration.',
  },
  {
    label: 'Supplier directory',
    detail:
      'Supplier name, verified regulatory credential types (which certification bodies — not the document content), and product categories offered. Visible to all visitors.',
  },
];

const privateData: DataCategory[] = [
  {
    label: 'Farmer contact details',
    detail:
      "The farmer's phone number and full name are visible to a buyer only after that buyer places an order. Before an order, buyers see the Trust Score and verified badge — not personal contact information.",
  },
  {
    label: 'Buyer contact details',
    detail:
      "The buyer's phone number and delivery address are visible to the farmer only after the buyer places an order. Before an order, the farmer cannot identify any specific buyer who is viewing their listing.",
  },
  {
    label: 'Verification documents',
    detail:
      'All submitted documents — identity documents, land documentation, produce photographs, lecturer credentials — are visible only to platform administrators. They are not shared with any other party.',
  },
  {
    label: 'Non-VERIFIED portfolio submissions',
    detail:
      'DENIED decisions do not appear in the public portfolio. They are retained in the platform audit log, visible to administrators only. The student public profile does not indicate that a DENIED decision was issued.',
  },
  {
    label: 'Full order records',
    detail:
      'Quantity, payment reference, and full transaction history are visible to the parties to the transaction and to administrators. They are not part of the public farmer profile.',
  },
];

const retentionItems: DataCategory[] = [
  {
    label: 'Transaction history',
    detail:
      'Retained for the lifetime of the account and for a period after account deletion as required by applicable law. Transaction records may be retained for counterparty record-keeping even if one party deletes their account.',
  },
  {
    label: 'Verification documents',
    detail:
      'Retained while the account is active. Upon account deletion, the documents become inaccessible to all parties including administrators. A compliance retention period may apply.',
  },
  {
    label: 'VERIFIED portfolio entries',
    detail:
      'VERIFIED portfolio entries are intended to be permanent. A student who deletes their account should understand that employers who already have the portfolio URL will continue to be able to access the entry via that URL. The entry does not automatically disappear.',
  },
  {
    label: 'Account deletion requests',
    detail:
      'Users may request account deletion through platform settings or by contacting support via the contact page. Deletion removes access to the account and removes personal profile content from public view. Some records are retained as described above.',
  },
];

export default function HowItWorksPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="Platform Overview · All Audiences"
      heading="Two hubs, one platform. Here is exactly how each one works — before you register."
      intro="This page explains the complete mechanics of both hubs: the Food Security Hub marketplace, the Education Hub project verification system, the M-Pesa payment flow, the verification system, and the Trust Score. Read it before registering. Audience-specific pages go deeper on each role."
      sections={sections}
      registerHref="/auth/register"
      registerLabel="Create an account"
    >
      {/* Section 1 — The Two Hubs */}
      <section id="the-two-hubs" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          01 · The two hubs
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Why these two systems exist on the same platform
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          UmojaHub runs two separate systems. They are not bundled together for marketing reasons.
          They are connected by a structural design decision.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50 mb-8">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
              Food Security Hub
            </p>
            <p className="font-body text-t4 font-semibold text-text-primary mb-3">
              A marketplace connecting verified Kenyan farmers to buyers
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed mb-4">
              Verified farmers list produce. Buyers search and filter by crop, county, price, and
              farmer Trust Tier. Orders are placed and paid via M-Pesa STK Push — no cash, no
              broker, no margin extracted by an intermediary who knows both prices. Payment is held
              until the buyer confirms receipt.
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              Cooperative groups of farmers can also use the hub to place collective bulk orders for
              agricultural inputs from verified suppliers at rates individual farmers cannot access.
            </p>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
              Education Hub
            </p>
            <p className="font-body text-t4 font-semibold text-text-primary mb-3">
              A structured project verification system for computer science students
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed mb-4">
              Students complete real software projects — either from a brief the platform generates
              or from an open-source repository they select. They produce three process documents.
              A peer student reviews the submission first. A verified lecturer reviews it
              independently. VERIFIED projects are published in a permanent, publicly accessible
              portfolio with a cryptographic integrity record.
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              Employers access student portfolios without registering. They read the documents in
              full and can verify independently that nothing was changed after submission.
            </p>
          </div>
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            The structural connection
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed mb-3">
            Agricultural project briefs on the AI_BRIEF track are drawn from real Kenyan
            agricultural industry contexts — the same domain the Food Security Hub operates in.
            A student building a crop disease detection tool is building something that could
            directly benefit the farmers on this platform.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            The Education Hub produces computer science graduates with direct domain knowledge of
            agricultural challenges. The Food Security Hub creates the industry context that makes
            that domain knowledge meaningful to employers. The two hubs are not separate verticals
            sharing a login system — they are two sides of the same infrastructure problem.
          </p>
        </div>

        <EcosystemMap />
      </section>

      {/* Section 2 — Food Security Hub Workflow */}
      <section id="food-security-hub" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          02 · Food Security Hub
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Complete workflow — from farmer registration to buyer rating
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          Every step below names who acts, what they do, and what the system does automatically.
          The actor label is visible at the left of each row.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
          {foodHubSteps.map((step, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                <div className="shrink-0 sm:w-36 mb-2 sm:mb-0">
                  <p className="font-mono text-t6 text-text-disabled">{step.step}</p>
                  <p className="font-body text-t5 font-semibold text-text-primary mt-0.5">
                    {step.actor}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {step.detail}
                  </p>
                  {step.note !== null && (
                    <p className="font-body text-t5 text-text-disabled leading-relaxed mt-2 pl-3 border-l border-zinc-800/50">
                      {step.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4 flex-wrap">
          <Link
            href="/for/farmers"
            className="font-body text-t5 text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Full guide for farmers
          </Link>
          <Link
            href="/for/buyers"
            className="font-body text-t5 text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Full guide for buyers
          </Link>
          <Link
            href="/for/suppliers"
            className="font-body text-t5 text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Full guide for suppliers
          </Link>
          <Link
            href="/for/cooperatives"
            className="font-body text-t5 text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            How cooperative groups work
          </Link>
        </div>
      </section>

      {/* Section 3 — Education Hub Workflow */}
      <section id="education-hub" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          03 · Education Hub
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Complete workflow — from student registration to employer verification
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          The Education Hub workflow is student-initiated and reviewer-decided. No step is
          automated — human review is the mechanism at every verification stage.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
          {educationHubSteps.map((step, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                <div className="shrink-0 sm:w-36 mb-2 sm:mb-0">
                  <p className="font-mono text-t6 text-text-disabled">{step.step}</p>
                  <p className="font-body text-t5 font-semibold text-text-primary mt-0.5">
                    {step.actor}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {step.detail}
                  </p>
                  {step.note !== null && (
                    <p className="font-body text-t5 text-text-disabled leading-relaxed mt-2 pl-3 border-l border-zinc-800/50">
                      {step.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-4 flex-wrap">
          <Link
            href="/for/students"
            className="font-body text-t5 text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Full guide for students
          </Link>
          <Link
            href="/for/lecturers"
            className="font-body text-t5 text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Full guide for lecturers
          </Link>
          <Link
            href="/for/employers"
            className="font-body text-t5 text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
          >
            Full guide for employers
          </Link>
        </div>
      </section>

      {/* Section 4 — Payment System */}
      <section id="payment-system" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          04 · Payment system
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          M-Pesa STK Push — what happens between &quot;place order&quot; and &quot;payment
          confirmed&quot;
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          UmojaHub uses Safaricom&apos;s Daraja API for all marketplace payments. Understanding
          how this works prevents confusion when payment seems to stall.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {paymentSteps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-start sm:gap-6 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 sm:w-36 mb-2 sm:mb-0">
                <p className="font-mono text-t6 text-text-disabled">{step.step}</p>
                <p className="font-body text-t5 font-semibold text-text-primary mt-0.5">
                  {step.who}
                </p>
              </div>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{step.what}</p>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          What happens when payment does not complete
        </h3>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {paymentFailures.map((failure, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                {failure.scenario}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                {failure.whatHappens}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
              On idempotency
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              If Safaricom&apos;s callback fires twice due to a network retry, the platform
              processes the payment confirmation only once. It tracks the Safaricom transaction
              reference number and does not double-apply a payment if the same confirmation arrives
              again. This prevents double-payment bugs in edge-case network conditions.
            </p>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
              On callback acknowledgement
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              When Safaricom sends a payment confirmation, it expects an immediate response.
              UmojaHub always acknowledges receipt of the confirmation promptly, then processes
              the payment update internally. This prevents Safaricom from repeatedly retrying the
              confirmation while the platform is processing — which would cause duplicate callback
              attempts.
            </p>
          </div>
        </div>

        <p className="font-body text-t5 text-text-disabled leading-relaxed mt-4 max-w-3xl">
          UmojaHub is not affiliated with Safaricom. It uses Safaricom&apos;s Daraja API as a
          licensed third-party developer. Issues with M-Pesa service availability, account status,
          or network connectivity are outside UmojaHub&apos;s control.
        </p>
      </section>

      {/* Section 5 — Verification System */}
      <section id="verification-system" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          05 · Verification system
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Human review at every trust-critical step. Nothing self-asserted.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          Both hubs require independent human verification before any actor can make claims that
          others depend on. Here is what verification involves for each actor type.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50 mb-8">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
              Food Security Hub
            </p>
            <div className="space-y-4">
              {[
                {
                  who: 'Farmers',
                  what: 'Submit identity document, land documentation, and produce photograph. A platform administrator reviews all three for consistency and plausibility. Decision: APPROVED or REJECTED (correctable, resubmittable). Review takes 24–48 hours.',
                },
                {
                  who: 'Suppliers',
                  what: 'Cannot self-register. Apply via the contact process. An administrator reviews submitted KEBS, PCPB, KEPHIS, and business registration credentials before creating the directory entry.',
                },
              ].map((item) => (
                <div key={item.who}>
                  <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                    {item.who}
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.what}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
              Education Hub
            </p>
            <div className="space-y-4">
              {[
                {
                  who: 'Lecturers',
                  what: 'Submit academic qualifications and institutional affiliation documentation. An administrator confirms credentials before the lecturer can access the review queue. Their name and institution appear on every portfolio entry they verify.',
                },
                {
                  who: 'Student projects',
                  what: 'Each project passes peer review (four dimensions scored 1–5, locked before lecturer sees) and independent lecturer review (four dimensions, minimum 50-word commentary each, three possible decisions). A SHA-256 hash is created at submission time and records document integrity permanently.',
                },
              ].map((item) => (
                <div key={item.who}>
                  <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                    {item.who}
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.what}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
            Verification does not claim
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            Verification is a consistency check, not fraud forensics. A verified farmer is a real
            person who submitted plausible documents — not a person whose land ownership was
            confirmed through the official registry. A VERIFIED portfolio entry means the submission
            met the defined standard — not that the student will perform well in any specific role.
            The full methodology, including every claim verification does not make, is at the{' '}
            <Link href="/trust" className="text-text-primary underline underline-offset-2 hover:text-accent-green transition-colors">
              Trust &amp; Verification page
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Section 6 — Trust Score System */}
      <section id="trust-score-system" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          06 · Trust Score system
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          A composite score built from four components. Recalculates automatically. Cannot be
          purchased.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          The Trust Score applies to farmers only. It is a numeric value from 0 to 100 computed
          from four independent components. It reflects accumulated behavioral evidence — not time
          on the platform, not payment of any fee, and not platform preference.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {trustComponents.map((comp, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-start sm:gap-6 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 sm:w-40 mb-2 sm:mb-0">
                <p className="font-body text-t5 font-semibold text-text-primary">{comp.name}</p>
                <p className="font-mono text-t6 text-accent-green tabular-nums mt-0.5">
                  {comp.weight}
                </p>
              </div>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{comp.measures}</p>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Trust Tiers
        </h3>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
          The composite score determines a tier. Tiers are displayed on every listing. Tiers are
          not permanent — a farmer who stops fulfilling orders will see their score fall and their
          tier drop. Tiers reflect current behavior pattern, not lifetime achievement.
        </p>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-6">
          {trustTiers.map((tier, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-32">
                <p className="font-mono text-t5 font-semibold text-text-primary">{tier.tier}</p>
                <p className="font-mono text-t6 text-text-disabled tabular-nums">{tier.range}</p>
              </div>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{tier.meaning}</p>
            </div>
          ))}
        </div>

        <p className="font-body text-t5 text-text-secondary leading-relaxed max-w-3xl">
          The Trust Score recalculates automatically when: a verification decision is made, an
          order reaches RECEIVED status, a buyer submits a rating, or an order is accepted but
          not dispatched past the fulfilment window. Detailed methodology is at the{' '}
          <Link
            href="/trust#trust-score"
            className="text-text-primary underline underline-offset-2 hover:text-accent-green transition-colors"
          >
            Trust &amp; Verification page
          </Link>
          .
        </p>
      </section>

      {/* Section 7 — Data and Privacy */}
      <section id="data-and-privacy" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          07 · Data and privacy
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          What is publicly visible. What is private. How long it is retained.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          UmojaHub is a transparency-first platform. The information below is specific about what
          any person — registered or not — can see, and what is protected.
        </p>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Publicly visible — no registration required
        </h3>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {publicData.map((item, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <p className="font-body text-t5 font-semibold text-text-primary mb-1">{item.label}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Private — visible only to specific parties
        </h3>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {privateData.map((item, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <p className="font-body text-t5 font-semibold text-text-primary mb-1">{item.label}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Data retention and deletion
        </h3>
        <div className="space-y-3">
          {retentionItems.map((item, i) => (
            <div key={i} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t5 font-semibold text-text-primary mb-2">{item.label}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </AudiencePage>
  );
}
