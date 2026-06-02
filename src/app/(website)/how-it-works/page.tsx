import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SectionAnchor } from '@/components/website/SectionAnchor';
import { CentralStructuralDiagram } from '@/components/website/CentralStructuralDiagram';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'How It Works — UmojaHub',
  description:
    'Complete overview of the Food Security Hub marketplace, Education Hub project verification, M-Pesa payment system, verification methodology, and Trust Score calculation.',
};

const SECTIONS: AnchorSection[] = [
  { id: 'the-two-hubs', label: 'The two hubs' },
  { id: 'food-security-hub', label: 'Food Security Hub' },
  { id: 'education-hub', label: 'Education Hub' },
  { id: 'payment-system', label: 'Payment system' },
  { id: 'verification-system', label: 'Verification system' },
  { id: 'trust-score-system', label: 'Trust Score system' },
  { id: 'data-and-privacy', label: 'Data and privacy' },
];

interface HubStep {
  step: string;
  actor: string;
  detail: string;
  note: string | null;
}

const FOOD_HUB_STEPS: HubStep[] = [
  {
    step: '01',
    actor: 'Farmer',
    detail:
      'Register with a phone number, select the Farmer role, and confirm the number with an SMS OTP. The account is created immediately.',
    note: 'The marketplace is browsable without registration. Verification is required before listing. Farmers can use Price Intelligence while verification is pending.',
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
      'A UmojaHub administrator reviews the documents for consistency and plausibility. Decision: APPROVED or REJECTED. The farmer receives an SMS either way within 24–48 hours.',
    note: 'Rejection includes a specific correctable reason. There is no limit on resubmissions. The second review follows the same 24–48 hour process.',
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
      'Create a listing: select crop type, set price per kilogram, enter available quantity, choose pickup county, and set preferred contact method. The listing goes live immediately.',
    note: 'Check Price Intelligence before setting the price — it shows what comparable listings are asking in the same county.',
  },
  {
    step: '06',
    actor: 'Buyer',
    detail:
      'Browse listings without registering. Filter by crop type, county, price range, and minimum Trust Tier. View any listing detail — crop description, quantity, price, harvest date, pickup county, farmer Trust Score, verified badge.',
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
      "Safaricom sends a payment prompt to the buyer's phone. The buyer enters their M-Pesa PIN on their device — not on the platform. UmojaHub never receives the PIN. Order status updates to PAID. The farmer receives an SMS: payment confirmed.",
    note: 'The farmer must not dispatch produce for a PENDING order. Only dispatch after the order status changes to PAID.',
  },
  {
    step: '09',
    actor: 'Farmer',
    detail:
      'After receiving the PAID SMS, arrange transport and dispatch produce. Update the order status to DISPATCHED. Payment is held by the platform at this stage — it has not yet transferred to the farmer.',
    note: null,
  },
  {
    step: '10',
    actor: 'Buyer',
    detail:
      'On receipt, mark the order RECEIVED in the platform. Payment releases immediately to the farmer M-Pesa account. If the buyer does not mark received within the auto-completion window, the system marks it received automatically.',
    note: null,
  },
  {
    step: '11',
    actor: 'Buyer',
    detail:
      'Submit a 1–5 star rating with an optional written comment. The rating is visible on the farmer public profile and contributes to the Trust Score ratings component, weighted by recency.',
    note: null,
  },
];

const EDUCATION_HUB_STEPS: HubStep[] = [
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
      'Select a project track. AI_BRIEF: the platform generates a project brief from the agricultural industry context library — a real problem type in a real Kenyan agricultural domain. OPEN_SOURCE: the student selects a real open-source repository and proposes a meaningful contribution scope.',
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
      'Work on the project. The Project Guidance Tool is available throughout — it provides structural templates and relevant technical documentation. It will not write documents or generate code for the student.',
    note: null,
  },
  {
    step: '05',
    actor: 'Student',
    detail:
      'Write three process documents before submitting. Problem Breakdown: decompose the brief into its component problems, document alternative approaches and risks. Approach Plan: specify implementation approach and milestones. Final Reflection: document what was completed, what was not and why, what was learned.',
    note: 'The Reflection is the most scrutinized document. Reviewers read for honest self-assessment, not a summary of what was built.',
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
      'The submitting student is assigned another submission to peer review. They score it on four dimensions (1–5) and write commentary for each. The peer score is locked before the submission advances to the lecturer queue.',
    note: 'The submitting student must complete their assigned peer review before their own submission advances to the lecturer queue.',
  },
  {
    step: '08',
    actor: 'Verified lecturer',
    detail:
      'A verified lecturer selects the submission from the queue. They receive the brief, all three documents, the code, and the peer score with commentary. They assess the four dimensions independently and issue a decision with a minimum of 50 substantive words per dimension.',
    note: null,
  },
  {
    step: '09',
    actor: 'System',
    detail:
      'VERIFIED: a portfolio entry is published — project title, track, verification date, reviewer name and institution, peer scores on four dimensions, all three document texts in full, document hash, and repository link. Permanently accessible via a public URL.',
    note: 'REVISION_REQUIRED: specific feedback returned to the student; revised submission re-enters the review process. DENIED: does not appear in portfolio; the student may begin a new project engagement.',
  },
  {
    step: '10',
    actor: 'Employer',
    detail:
      "Access the portfolio URL without registering. Read all three documents in full. See the reviewer name and institutional affiliation. Check the peer scores on each dimension. Verify the document hash: the documents visible are the same documents the reviewer reviewed.",
    note: null,
  },
];

interface PaymentStep {
  step: string;
  who: string;
  what: string;
}

const PAYMENT_STEPS: PaymentStep[] = [
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

const PAYMENT_FAILURES: FailureMode[] = [
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
      "Safaricom's Daraja API is unavailable. UmojaHub cannot initiate the STK Push. Payment cannot proceed until service is restored.",
  },
  {
    scenario: 'Callback delay',
    whatHappens:
      "In rare cases, Safaricom confirms payment but the callback to UmojaHub arrives late. The order may appear PENDING while payment has cleared on the buyer's M-Pesa statement. This requires administrator intervention.",
  },
];

interface TrustComponent {
  name: string;
  weight: string;
  measures: string;
}

const TRUST_COMPONENTS: TrustComponent[] = [
  {
    name: 'Verification',
    weight: '40 pts',
    measures:
      'Binary — present or absent. Awarded when identity and land documents are reviewed and approved. Does not recalculate after awarded.',
  },
  {
    name: 'Transactions',
    weight: '25 pts',
    measures:
      'Number of completed orders, scaled logarithmically. Cannot be fabricated — each order requires a real buyer payment confirmed by Safaricom.',
  },
  {
    name: 'Ratings',
    weight: '20 pts',
    measures:
      'Average buyer rating across all completed orders, weighted by recency. A single bad rating has diminishing influence as total rating count grows.',
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

const TRUST_TIERS: TrustTier[] = [
  { tier: 'NEW', range: '0–39', meaning: 'Verified identity, no meaningful transaction history yet.' },
  { tier: 'ESTABLISHED', range: '40–59', meaning: 'Verified identity with a growing transaction record and some buyer ratings.' },
  { tier: 'TRUSTED', range: '60–79', meaning: 'Substantial transaction history with consistent positive ratings and reliable fulfilment.' },
  { tier: 'PREMIUM', range: '80–100', meaning: "Extensive history, high ratings, high reliability. The platform's strongest signal." },
];

interface DataCategory {
  label: string;
  detail: string;
}

const PUBLIC_DATA: DataCategory[] = [
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
      'Supplier name, verified regulatory credential types, and product categories offered. Visible to all visitors.',
  },
];

const PRIVATE_DATA: DataCategory[] = [
  {
    label: 'Farmer contact details',
    detail:
      "The farmer's phone number and full name are visible to a buyer only after that buyer places an order. Before an order, buyers see the Trust Score and verified badge — not personal contact information.",
  },
  {
    label: 'Buyer contact details',
    detail:
      "The buyer's phone number and delivery address are visible to the farmer only after the buyer places an order.",
  },
  {
    label: 'Verification documents',
    detail:
      'All submitted documents — identity documents, land documentation, produce photographs, lecturer credentials — are visible only to platform administrators. They are not shared with any other party.',
  },
  {
    label: 'Non-VERIFIED portfolio submissions',
    detail:
      'DENIED decisions do not appear in the public portfolio. They are retained in the platform audit log, visible to administrators only.',
  },
  {
    label: 'Full order records',
    detail:
      'Quantity, payment reference, and full transaction history are visible to the parties to the transaction and to administrators. They are not part of the public farmer profile.',
  },
];

const RETENTION_ITEMS: DataCategory[] = [
  {
    label: 'Transaction history',
    detail:
      'Retained for the lifetime of the account and for a period after account deletion as required by applicable law.',
  },
  {
    label: 'Verification documents',
    detail:
      'Retained while the account is active. Upon account deletion, the documents become inaccessible to all parties including administrators.',
  },
  {
    label: 'VERIFIED portfolio entries',
    detail:
      'VERIFIED portfolio entries are intended to be permanent. A student who deletes their account should understand that employers who already have the portfolio URL will continue to be able to access the entry.',
  },
  {
    label: 'Account deletion requests',
    detail:
      'Users may request account deletion through platform settings or by contacting support. Deletion removes access to the account and removes personal profile content from public view. Some records are retained as described above.',
  },
];

// ── Shared primitives ─────────────────────────────────────────────────────

function SectionLabel({ n, label }: { n: string; label: string }): React.ReactElement {
  return (
    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
      {n} · {label}
    </p>
  );
}

function SectionH2({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h2 className="font-display text-[24px] leading-[30px] md:text-[28px] md:leading-[34px] font-bold tracking-[-0.02em] text-ws-text-primary mb-4">
      {children}
    </h2>
  );
}

function SubH3({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h3 className="font-display text-[18px] leading-[24px] font-semibold text-ws-text-primary mb-4">
      {children}
    </h3>
  );
}

function Body({ children, className }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return (
    <p className={`font-geist text-[17px] leading-[26px] text-ws-text-secondary ${className ?? ''}`}>
      {children}
    </p>
  );
}

function DataList({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="border border-ws-border-light overflow-hidden divide-y divide-ws-border-light">
      {children}
    </div>
  );
}

function TwoColGrid({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light border border-ws-border-light">
      {children}
    </div>
  );
}

function GridPanel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="bg-ws-surface-base p-6">{children}</div>;
}

function NoteBox({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="border border-ws-border-medium px-5 py-4 max-w-3xl">
      <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">{eyebrow}</p>
      <div className="font-geist text-[17px] leading-[26px] text-ws-text-secondary">{children}</div>
    </div>
  );
}

export default function HowItWorksPage(): React.ReactElement {
  return (
    <>
      {/* ── Dark header ── */}
      <header className="bg-ws-surface-dark border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-4">
            Platform Overview · All Audiences
          </p>
          <h1 className="font-display text-[28px] leading-[34px] md:text-[36px] md:leading-[42px] font-bold tracking-[-0.02em] text-ws-text-bright mb-4 max-w-3xl">
            Two hubs, one platform. Here is exactly how each one works — before you register.
          </h1>
          <p className="font-geist text-[17px] leading-[26px] text-ws-text-dim max-w-2xl">
            This page explains the complete mechanics of both hubs: the Food Security Hub
            marketplace, the Education Hub project verification system, the M-Pesa payment flow,
            the verification system, and the Trust Score. Audience-specific pages go deeper on
            each role.
          </p>
        </div>
      </header>

      {/* ── Tablet sticky tab strip ── */}
      <div className="md:block xl:hidden">
        <SectionAnchor sections={SECTIONS} />
      </div>

      {/* ── Content with xl sidebar ── */}
      <div className="bg-ws-surface-base">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="xl:flex xl:items-start xl:gap-16">

            {/* Desktop sidebar */}
            <div className="hidden xl:block">
              <SectionAnchor sections={SECTIONS} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">

              {/* ── Section 1 — The Two Hubs ── */}
              <section id="the-two-hubs" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="01" label="The two hubs" />
                <SectionH2>Why these two systems exist on the same platform</SectionH2>
                <Body className="mb-8 max-w-3xl">
                  UmojaHub runs two separate systems. They are not bundled together for marketing
                  reasons. They are connected by a structural design decision.
                </Body>

                <div className="mb-8">
                  <TwoColGrid>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-3">
                        Food Security Hub
                      </p>
                      <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-3">
                        A marketplace connecting verified Kenyan farmers to buyers
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
                        Verified farmers list produce. Buyers search and filter by crop, county,
                        price, and farmer Trust Tier. Orders are placed and paid via M-Pesa STK
                        Push — no cash, no broker, no margin extracted by an intermediary. Payment
                        is held until the buyer confirms receipt.
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        Cooperative groups of farmers can also place collective bulk orders for
                        agricultural inputs from verified suppliers.
                      </p>
                    </GridPanel>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-3">
                        Education Hub
                      </p>
                      <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-3">
                        A structured project verification system for computer science students
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-4">
                        Students complete real software projects. They produce three process
                        documents. A peer student reviews the submission first. A verified lecturer
                        reviews it independently. VERIFIED projects are published in a permanent,
                        publicly accessible portfolio with a cryptographic integrity record.
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        Employers access student portfolios without registering and can verify
                        independently that nothing was changed after submission.
                      </p>
                    </GridPanel>
                  </TwoColGrid>
                </div>

                <div className="mb-8">
                  <NoteBox eyebrow="The structural connection">
                    <p className="mb-3">
                      Agricultural project briefs on the AI_BRIEF track are drawn from real Kenyan
                      agricultural industry contexts — the same domain the Food Security Hub
                      operates in. A student building a crop disease detection tool is building
                      something that could directly benefit the farmers on this platform.
                    </p>
                    <p>
                      The Education Hub produces computer science graduates with direct domain
                      knowledge of agricultural challenges. The Food Security Hub creates the
                      industry context that makes that domain knowledge meaningful to employers.
                      The two hubs are two sides of the same infrastructure problem.
                    </p>
                  </NoteBox>
                </div>

                <div className="animate-on-scroll">
                  <CentralStructuralDiagram />
                </div>
              </section>

              {/* ── Section 2 — Food Security Hub ── */}
              <section id="food-security-hub" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="02" label="Food Security Hub" />
                <SectionH2>Complete workflow — from farmer registration to buyer rating</SectionH2>
                <Body className="mb-8 max-w-3xl">
                  Every step below names who acts, what they do, and what the system does
                  automatically.
                </Body>

                <div className="mb-6">
                  <DataList>
                    {FOOD_HUB_STEPS.map((step) => (
                      <div key={step.step} className="px-5 py-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                          <div className="shrink-0 sm:w-36 mb-2 sm:mb-0">
                            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary">
                              {step.step}
                            </p>
                            <p className="font-geist text-ws-label font-semibold text-ws-text-primary mt-0.5">
                              {step.actor}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                              {step.detail}
                            </p>
                            {step.note !== null && (
                              <p className="font-geist text-ws-body text-ws-text-tertiary leading-relaxed mt-2 pl-3 border-l-2 border-ws-border-light">
                                {step.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </DataList>
                </div>

                <div className="flex gap-4 flex-wrap">
                  {[
                    { label: 'Full guide for farmers', href: '/for/farmers' },
                    { label: 'Full guide for buyers', href: '/for/buyers' },
                    { label: 'Full guide for suppliers', href: '/for/suppliers' },
                    { label: 'How cooperative groups work', href: '/for/cooperatives' },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="font-geist text-ws-body text-ws-text-tertiary underline underline-offset-2 hover:text-ws-text-primary transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </section>

              {/* ── Section 3 — Education Hub ── */}
              <section id="education-hub" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="03" label="Education Hub" />
                <SectionH2>
                  Complete workflow — from student registration to employer verification
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  The Education Hub workflow is student-initiated and reviewer-decided. No step is
                  automated — human review is the mechanism at every verification stage.
                </Body>

                <div className="mb-6">
                  <DataList>
                    {EDUCATION_HUB_STEPS.map((step) => (
                      <div key={step.step} className="px-5 py-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                          <div className="shrink-0 sm:w-36 mb-2 sm:mb-0">
                            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary">
                              {step.step}
                            </p>
                            <p className="font-geist text-ws-label font-semibold text-ws-text-primary mt-0.5">
                              {step.actor}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                              {step.detail}
                            </p>
                            {step.note !== null && (
                              <p className="font-geist text-ws-body text-ws-text-tertiary leading-relaxed mt-2 pl-3 border-l-2 border-ws-border-light">
                                {step.note}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </DataList>
                </div>

                <div className="flex gap-4 flex-wrap">
                  {[
                    { label: 'Full guide for students', href: '/for/students' },
                    { label: 'Full guide for lecturers', href: '/for/lecturers' },
                    { label: 'Full guide for employers', href: '/for/employers' },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="font-geist text-ws-body text-ws-text-tertiary underline underline-offset-2 hover:text-ws-text-primary transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </section>

              {/* ── Section 4 — Payment System ── */}
              <section id="payment-system" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="04" label="Payment system" />
                <SectionH2>
                  M-Pesa STK Push — what happens between &quot;place order&quot; and &quot;payment
                  confirmed&quot;
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  UmojaHub uses Safaricom&apos;s Daraja API for all marketplace payments.
                  Understanding how this works prevents confusion when payment seems to stall.
                </Body>

                <div className="mb-8">
                  <DataList>
                    {PAYMENT_STEPS.map((step) => (
                      <div
                        key={step.step}
                        className="flex flex-col sm:flex-row sm:items-start sm:gap-6 px-5 py-5"
                      >
                        <div className="shrink-0 sm:w-36 mb-2 sm:mb-0">
                          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary">
                            {step.step}
                          </p>
                          <p className="font-geist text-ws-label font-semibold text-ws-text-primary mt-0.5">
                            {step.who}
                          </p>
                        </div>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {step.what}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <SubH3>What happens when payment does not complete</SubH3>
                <div className="mb-8">
                  <DataList>
                    {PAYMENT_FAILURES.map((failure) => (
                      <div key={failure.scenario} className="px-5 py-5">
                        <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                          {failure.scenario}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {failure.whatHappens}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <div className="mb-4">
                  <TwoColGrid>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
                        On idempotency
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        If Safaricom&apos;s callback fires twice due to a network retry, the
                        platform processes the payment confirmation only once. It tracks the
                        Safaricom transaction reference number and does not double-apply a payment
                        if the same confirmation arrives again.
                      </p>
                    </GridPanel>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
                        On callback acknowledgement
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        When Safaricom sends a payment confirmation, it expects an immediate
                        response. UmojaHub always acknowledges receipt promptly, then processes the
                        payment update internally. This prevents Safaricom from repeatedly retrying
                        the confirmation.
                      </p>
                    </GridPanel>
                  </TwoColGrid>
                </div>

                <Body className="text-ws-text-tertiary max-w-3xl">
                  UmojaHub is not affiliated with Safaricom. It uses Safaricom&apos;s Daraja API
                  as a licensed third-party developer. Issues with M-Pesa service availability,
                  account status, or network connectivity are outside UmojaHub&apos;s control.
                </Body>
              </section>

              {/* ── Section 5 — Verification System ── */}
              <section id="verification-system" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="05" label="Verification system" />
                <SectionH2>
                  Human review at every trust-critical step. Nothing self-asserted.
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  Both hubs require independent human verification before any actor can make claims
                  that others depend on.
                </Body>

                <div className="mb-8">
                  <TwoColGrid>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-4">
                        Food Security Hub
                      </p>
                      <div className="flex flex-col gap-4">
                        {[
                          {
                            who: 'Farmers',
                            what: 'Submit identity document, land documentation, and produce photograph. A platform administrator reviews all three for consistency and plausibility. Decision: APPROVED or REJECTED. Review takes 24–48 hours.',
                          },
                          {
                            who: 'Suppliers',
                            what: 'Cannot self-register. Apply via the contact process. An administrator reviews submitted KEBS, PCPB, KEPHIS, and business registration credentials before creating the directory entry.',
                          },
                        ].map((item) => (
                          <div key={item.who}>
                            <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                              {item.who}
                            </p>
                            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                              {item.what}
                            </p>
                          </div>
                        ))}
                      </div>
                    </GridPanel>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-4">
                        Education Hub
                      </p>
                      <div className="flex flex-col gap-4">
                        {[
                          {
                            who: 'Lecturers',
                            what: 'Submit academic qualifications and institutional affiliation documentation. An administrator confirms credentials before the lecturer can access the review queue. Their name and institution appear on every portfolio entry they verify.',
                          },
                          {
                            who: 'Student projects',
                            what: 'Each project passes peer review (four dimensions scored 1–5, locked before lecturer sees) and independent lecturer review (four dimensions, minimum 50-word commentary each). A SHA-256 hash is created at submission time.',
                          },
                        ].map((item) => (
                          <div key={item.who}>
                            <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                              {item.who}
                            </p>
                            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                              {item.what}
                            </p>
                          </div>
                        ))}
                      </div>
                    </GridPanel>
                  </TwoColGrid>
                </div>

                <NoteBox eyebrow="Verification does not claim">
                  <p>
                    Verification is a consistency check, not fraud forensics. A verified farmer is
                    a real person who submitted plausible documents — not a person whose land
                    ownership was confirmed through the official registry. A VERIFIED portfolio
                    entry means the submission met the defined standard — not that the student will
                    perform well in any specific role. The full methodology is at the{' '}
                    <Link
                      href="/trust"
                      className="text-ws-text-primary underline underline-offset-2 hover:text-ws-hub-green transition-colors duration-150"
                    >
                      Trust &amp; Verification page
                    </Link>
                    .
                  </p>
                </NoteBox>
              </section>

              {/* ── Section 6 — Trust Score System ── */}
              <section id="trust-score-system" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="06" label="Trust Score system" />
                <SectionH2>
                  A composite score built from four components. Recalculates automatically.
                  Cannot be purchased.
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  The Trust Score applies to farmers only. It is a numeric value from 0 to 100
                  computed from four independent components. It reflects accumulated behavioral
                  evidence — not time on the platform, not payment of any fee.
                </Body>

                <div className="mb-8">
                  <DataList>
                    {TRUST_COMPONENTS.map((comp) => (
                      <div
                        key={comp.name}
                        className="flex flex-col sm:flex-row sm:items-start sm:gap-6 px-5 py-5"
                      >
                        <div className="shrink-0 sm:w-40 mb-2 sm:mb-0">
                          <p className="font-geist text-ws-label font-semibold text-ws-text-primary">
                            {comp.name}
                          </p>
                          <p className="font-geist-mono text-ws-caption text-ws-hub-green tabular-nums mt-0.5">
                            {comp.weight}
                          </p>
                        </div>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {comp.measures}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <SubH3>Trust Tiers</SubH3>
                <Body className="mb-6 max-w-3xl">
                  The composite score determines a tier, displayed on every listing. Tiers are
                  not permanent — a farmer who stops fulfilling orders will see their score fall
                  and their tier drop.
                </Body>
                <div className="mb-6">
                  <DataList>
                    {TRUST_TIERS.map((tier) => (
                      <div key={tier.tier} className="flex items-start gap-4 px-5 py-4">
                        <div className="shrink-0 w-32">
                          <p className="font-geist-mono text-ws-data font-medium text-ws-text-primary">
                            {tier.tier}
                          </p>
                          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary tabular-nums">
                            {tier.range}
                          </p>
                        </div>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {tier.meaning}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <Body className="max-w-3xl">
                  The Trust Score recalculates automatically when: a verification decision is made,
                  an order reaches RECEIVED status, a buyer submits a rating, or an order is
                  accepted but not dispatched past the fulfilment window. Detailed methodology is
                  at the{' '}
                  <Link
                    href="/trust#trust-score"
                    className="text-ws-text-primary underline underline-offset-2 hover:text-ws-hub-green transition-colors duration-150"
                  >
                    Trust &amp; Verification page
                  </Link>
                  .
                </Body>
              </section>

              {/* ── Section 7 — Data and Privacy ── */}
              <section id="data-and-privacy" className="py-12">
                <SectionLabel n="07" label="Data and privacy" />
                <SectionH2>
                  What is publicly visible. What is private. How long it is retained.
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  UmojaHub is a transparency-first platform. The information below is specific
                  about what any person — registered or not — can see, and what is protected.
                </Body>

                <SubH3>Publicly visible — no registration required</SubH3>
                <div className="mb-8">
                  <DataList>
                    {PUBLIC_DATA.map((item) => (
                      <div key={item.label} className="px-5 py-5">
                        <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                          {item.label}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <SubH3>Private — visible only to specific parties</SubH3>
                <div className="mb-8">
                  <DataList>
                    {PRIVATE_DATA.map((item) => (
                      <div key={item.label} className="px-5 py-5">
                        <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                          {item.label}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <SubH3>Data retention and deletion</SubH3>
                <div className="flex flex-col gap-3">
                  {RETENTION_ITEMS.map((item) => (
                    <div key={item.label} className="border border-ws-border-light px-5 py-4">
                      <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-2">
                        {item.label}
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
