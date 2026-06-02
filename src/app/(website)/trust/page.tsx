import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SectionAnchor } from '@/components/website/SectionAnchor';
import { WorkflowStep } from '@/components/website/WorkflowStep';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { TrustScoreNarrative } from '@/components/website/TrustScoreNarrative';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Trust & Verification — UmojaHub',
  description:
    'How UmojaHub verifies farmers, suppliers, lecturers, and student project submissions. What verification proves, what it does not, and how the Trust Score is calculated.',
};

const SECTIONS: AnchorSection[] = [
  { id: 'verification-philosophy', label: 'Verification philosophy' },
  { id: 'farmer-verification', label: 'Farmer verification' },
  { id: 'supplier-verification', label: 'Supplier verification' },
  { id: 'lecturer-verification', label: 'Lecturer verification' },
  { id: 'project-verification', label: 'Project verification' },
  { id: 'trust-score', label: 'Trust Score' },
  { id: 'what-verification-does-not-claim', label: 'What it does not claim' },
  { id: 'appeals', label: 'Appeals & escalation' },
  { id: 'reporting-a-concern', label: 'Reporting a concern' },
];

interface DocType {
  label: string;
  accepted: string;
  adminChecks: string;
}

const FARMER_DOC_TYPES: DocType[] = [
  {
    label: 'Identity document',
    accepted: 'National ID card or passport',
    adminChecks:
      'Document number, name, and photograph are consistent with account registration. Name on the document must match the name used to register.',
  },
  {
    label: 'Land documentation',
    accepted: 'Title deed, lease agreement, or a signed tenancy letter from the landowner',
    adminChecks:
      'Document names the applicant as owner, tenant, or named occupant and plausibly describes agricultural land use. A tenancy letter must be signed by the landowner and must name the farmer specifically.',
  },
  {
    label: 'Produce photograph',
    accepted: 'Photograph of the farm, crop rows, or produce ready for sale',
    adminChecks:
      'Plausibility check — is this consistent with the claimed crop type and farming operation? The photograph is not GPS-authenticated. It is assessed for consistency with the claim.',
  },
];

interface SupplierCredential {
  body: string;
  what: string;
}

const SUPPLIER_CREDENTIALS: SupplierCredential[] = [
  {
    body: 'KEBS',
    what: 'Kenya Bureau of Standards — certification numbers for relevant agricultural input product categories',
  },
  {
    body: 'PCPB',
    what: 'Pest Control Products Board — registration for pesticide and herbicide products',
  },
  {
    body: 'KEPHIS',
    what: 'Kenya Plant Health Inspectorate Service — phytosanitary certification for seed suppliers',
  },
  {
    body: 'Business reg.',
    what: "Companies Registry number or business name registration confirming the supplier's legal trading status",
  },
];

interface LecturerCredential {
  category: string;
  what: string;
  note: string;
}

const LECTURER_CREDENTIALS: LecturerCredential[] = [
  {
    category: 'Academic qualifications',
    what: 'Degree certificates, transcripts, or other formal academic credentials relevant to the reviewer track applied for (Software Engineering, Computer Science, or an adjacent technical field)',
    note: 'Administrators confirm the credential is consistent with the claimed institution and level. They do not contact the issuing institution unless the document raises specific concerns.',
  },
  {
    category: 'Institutional affiliation',
    what: 'Employment letter, staff ID, or other documentation confirming current or recent academic or professional affiliation',
    note: "Affiliation is recorded and displayed on every portfolio entry associated with this reviewer. Employers and students can see the reviewer name and institution on the portfolio entry — this public visibility is why credential review exists.",
  },
];

interface ReviewDimension {
  dimension: string;
  assesses: string;
}

const REVIEW_DIMENSIONS: ReviewDimension[] = [
  {
    dimension: 'Clarity of problem understanding',
    assesses:
      'Does the student demonstrate that they understood the brief and the problem it describes — not just what was asked, but why the problem matters and where the difficulty lies?',
  },
  {
    dimension: 'Methodology appropriateness',
    assesses:
      'Is the chosen approach sensible for the problem? Are rejected alternatives documented with reasoning? Did the student show judgment in selecting how to proceed?',
  },
  {
    dimension: 'Documentation quality',
    assesses:
      'Are the three documents coherent, internally consistent, and specific? Do they reflect the actual implementation, or describe a project that was never built?',
  },
  {
    dimension: 'Reflection depth',
    assesses:
      'Does the Reflection document honestly assess what worked and what did not? Does it identify specific failures and explain them? Is it a genuine account of the experience or a surface-level summary?',
  },
];

interface TrustComponent {
  name: string;
  weight: string;
  measures: string;
  detail: string;
}

const TRUST_COMPONENTS: TrustComponent[] = [
  {
    name: 'Verification',
    weight: '40 points',
    measures: 'Whether the farmer has completed identity and land document review',
    detail:
      "Binary — present (40 points) or absent (0 points). A farmer cannot earn partial verification credit. It does not recalculate after it is awarded. Its weight reflects the platform's view that verified identity is the precondition for all other evidence.",
  },
  {
    name: 'Transactions',
    weight: '25 points',
    measures: 'Number of completed orders, scaled logarithmically',
    detail:
      'The score gain between 0 and 5 completed orders is large. Between 95 and 100, it is small. This prevents the score from simply rewarding volume. Each completed order requires a real buyer payment confirmed by Safaricom — orders cannot be fabricated.',
  },
  {
    name: 'Ratings',
    weight: '20 points',
    measures: 'Average buyer rating across all completed orders, weighted by recency',
    detail:
      'Recent ratings carry more weight than older ones. A farmer who performs poorly after a strong start will see this component fall. A single bad rating has diminishing influence as the total number of ratings grows.',
  },
  {
    name: 'Reliability',
    weight: '15 points',
    measures: 'Ratio of fulfilled orders to accepted orders over a rolling window',
    detail:
      'Targets the failure mode of selective order acceptance — a farmer who accepts orders and then fails to dispatch. High ratings from completed orders do not compensate for a pattern of non-fulfilment.',
  },
];

interface TrustTier {
  tier: string;
  range: string;
  meaning: string;
}

const TRUST_TIERS: TrustTier[] = [
  {
    tier: 'NEW',
    range: '0–39',
    meaning:
      'Verified identity with no transaction history, or very early history. A real person with reviewed documents and nothing else yet established on the platform.',
  },
  {
    tier: 'ESTABLISHED',
    range: '40–59',
    meaning:
      'Verified identity with a growing transaction record. Some buyer ratings exist. The farmer is building a pattern that future buyers can begin to read.',
  },
  {
    tier: 'TRUSTED',
    range: '60–79',
    meaning:
      'Substantial transaction history with consistent positive ratings. Buyer confidence is well-supported by evidence. The farmer has demonstrated reliable fulfilment.',
  },
  {
    tier: 'PREMIUM',
    range: '80–100',
    meaning:
      "Extensive history, high ratings, and high reliability over time. The platform's strongest available signal. Buyers purchasing from a PREMIUM farmer are relying on the deepest evidence base the platform can provide.",
  },
];

interface NotClaimedItem {
  label: string;
  detail: string;
}

const FOOD_HUB_NOT_CLAIMED: NotClaimedItem[] = [
  {
    label: 'Produce quality guarantee',
    detail:
      'Verification confirms a farmer is who they say they are and plausibly farms what they claim to farm. It does not inspect produce. A PREMIUM-tier farmer can list substandard produce. The rating system addresses quality retroactively — it does not prevent quality failures before they occur.',
  },
  {
    label: 'Continuous audit of farming activity',
    detail:
      'Verification is a point-in-time review. A farmer who was active at the time of verification may have reduced activity, changed crops, or changed land tenure since. The platform does not re-verify farmers on a regular cycle.',
  },
  {
    label: 'Document fraud detection',
    detail:
      'Administrator review can identify obvious inconsistencies — a mismatched name, an expired document, a blurry photograph. It is not forensic document examination. A convincing fraudulent document may pass initial review. When this occurs, it should be reported immediately.',
  },
  {
    label: 'Fulfilment guarantee',
    detail:
      'A verified farmer with a high Trust Score is supported by evidence of past behaviour. That evidence cannot guarantee future behaviour. Every transaction carries the risk that a farmer does not dispatch after payment. This risk is mitigated by the Trust Score, not eliminated by it.',
  },
  {
    label: 'Price endorsement',
    detail:
      'Farmers set their own prices. The platform provides Price Intelligence to inform pricing decisions but does not endorse, recommend, or constrain any specific price. A listing priced above market rate remains visible to buyers.',
  },
];

const EDUCATION_HUB_NOT_CLAIMED: NotClaimedItem[] = [
  {
    label: 'Employment suitability',
    detail:
      'VERIFIED means a named, credentials-confirmed reviewer assessed all three documents and the code against a defined rubric and determined the submission met the documented standard. It does not mean the student will perform well in any specific role.',
  },
  {
    label: 'Document authorship',
    detail:
      'The document hash proves that the documents currently visible in the portfolio are the same documents reviewed at the time of submission. It proves document integrity — that nothing was altered after review. It does not prove the student wrote the documents.',
  },
  {
    label: 'Code production readiness',
    detail:
      'Code submitted as part of a project engagement was assessed for reasoning quality. It was not audited for production readiness, security vulnerabilities, or professional engineering standards.',
  },
  {
    label: 'Exceptional quality',
    detail:
      'VERIFIED means the submission met the standard, not that it exceeded it. A submission that barely meets the threshold and one that far exceeds it both receive VERIFIED status. Reviewer commentary in the portfolio entry reflects quality within that result.',
  },
  {
    label: 'Document accuracy',
    detail:
      'The review process assesses whether documentation reflects genuine engagement with the work. It cannot independently verify every factual claim in every document. A Reflection describing work not actually done would be difficult to detect if the reviewer cannot test the implementation narrative.',
  },
  {
    label: 'Ongoing reviewer standing',
    detail:
      "Lecturer verification is point-in-time. A reviewer whose academic affiliation ends after verification is not automatically removed from the reviewer pool. The platform reviews reviewer status periodically, but there is always a lag between a real-world status change and a platform update.",
  },
];

// ── Verification flow steps (S2.5) ────────────────────────────────────────

const FARMER_FLOW = [
  {
    step: '01',
    actor: 'Farmer',
    action: 'Submits three document categories',
    detail: 'Identity document, land documentation, and produce photograph uploaded through the dashboard.',
  },
  {
    step: '02',
    actor: 'Platform',
    action: 'Creates timestamped submission record',
    detail: 'Submission enters the administrator review queue. Status changes to PENDING.',
  },
  {
    step: '03',
    actor: 'Administrator',
    action: 'Reviews documents for consistency and plausibility',
    detail: 'Name match, document plausibility, photograph consistency. 24–48 hours. Decision criteria are published in full on this page.',
  },
  {
    step: '04',
    actor: 'Platform',
    action: 'Issues decision — APPROVED or REJECTED',
    detail: 'Farmer receives SMS. APPROVED: Trust Score initialized at 40 points. REJECTED: specific correctable reason provided. No limit on resubmissions.',
  },
] as const;

const EDUCATION_FLOW = [
  {
    step: '01',
    actor: 'Student',
    action: 'Submits three documents and code repository',
    detail: 'Problem Breakdown, Approach Plan, Final Reflection, and a repository link.',
  },
  {
    step: '02',
    actor: 'Platform',
    action: 'Creates SHA-256 document hash and submission record',
    detail: 'Hash is permanently recorded in the audit log with a timestamp. Submission is one-way.',
  },
  {
    step: '03',
    actor: 'Peer student',
    action: 'Scores submission across four dimensions',
    detail: 'Peer score is locked before the submission enters the lecturer queue. The submitting student must complete their assigned peer review first.',
  },
  {
    step: '04',
    actor: 'Verified lecturer',
    action: 'Reviews independently — minimum 50 substantive words per dimension',
    detail: 'Receives brief, documents, code, and peer score. Issues one of three decisions.',
  },
  {
    step: '05',
    actor: 'Platform',
    action: 'Publishes VERIFIED portfolio entry with permanent public URL',
    detail: 'Entry shows reviewer name, institution, peer scores, all three document texts, and document hash.',
  },
] as const;

// ── Shared section container ──────────────────────────────────────────────

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

// Row list container (replaces bg-surface-elevated pattern)
function DataList({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="border border-ws-border-light overflow-hidden divide-y divide-ws-border-light">
      {children}
    </div>
  );
}

// 2-col grid panel (replaces bg-zinc-800/50 gap grid)
function TwoColGrid({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light border border-ws-border-light">
      {children}
    </div>
  );
}

function ThreeColGrid({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-ws-border-light border border-ws-border-light">
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

export default function TrustPage(): React.ReactElement {
  return (
    <>
      {/* ── Dark header (S2.1) ── */}
      <header className="bg-ws-surface-dark border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20">
          <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-4">
            Trust & Verification · All Audiences
          </p>
          <h1 className="font-display text-[28px] leading-[34px] md:text-[36px] md:leading-[42px] font-bold tracking-[-0.02em] text-ws-text-bright mb-4 max-w-3xl">
            Nothing on UmojaHub is self-asserted. Here is exactly what was verified, by whom,
            and what that verification does and does not mean.
          </h1>
          <p className="font-geist text-[17px] leading-[26px] text-ws-text-dim max-w-2xl">
            This page describes every verification process on the platform — for farmers, suppliers,
            lecturers, and student projects. It exists because a clear statement of methodology,
            including its limits, builds more trust than any claim of trustworthiness.
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

              {/* ── Section 1 — Verification Philosophy ── */}
              <section id="verification-philosophy" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="01" label="Verification philosophy" />
                <SectionH2>Why self-assertion cannot be the basis for trust</SectionH2>
                <Body className="mb-4 max-w-3xl">
                  Every claim on a CV is made by the person who benefits from that claim. Every
                  product listing by an unverified seller carries only the seller&apos;s word.
                  Every certificate can be replicated. The problem is not dishonesty — most people
                  are honest. The problem is that there is no structural way to distinguish an
                  honest claim from a dishonest one when only one party has verified it.
                </Body>
                <Body className="mb-8 max-w-3xl">
                  UmojaHub requires independent verification for every actor whose claims others
                  depend on: farmers list produce buyers will purchase, suppliers sell inputs farmer
                  groups will receive, lecturers review submissions employers will read. None of
                  these actors can verify their own claims. A human administrator reviews documents
                  before any claim is presented as verified.
                </Body>

                <TwoColGrid>
                  <GridPanel>
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                      What self-assertion looks like
                    </p>
                    <ul className="flex flex-col gap-2">
                      {[
                        'A farmer who says they grow two tonnes of maize monthly with no way to confirm',
                        'A supplier who claims KEBS certification on a price list with no document submitted',
                        'A student who lists six projects on a CV with no reviewer ever having seen them',
                        'A lecturer described as senior faculty by their own application',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="font-geist-mono text-ws-caption text-ws-text-tertiary mt-0.5 shrink-0">
                            —
                          </span>
                          <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </GridPanel>
                  <GridPanel>
                    <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-4">
                      What verified evidence looks like
                    </p>
                    <ul className="flex flex-col gap-2">
                      {[
                        'A farmer whose identity and land documentation was reviewed by an administrator before they could list',
                        'A supplier whose KEBS, PCPB, or KEPHIS credential documents were reviewed and recorded before the directory listing was published',
                        'A student whose project was reviewed against a defined rubric by a named, credentials-confirmed lecturer',
                        'A lecturer whose academic credentials and institutional affiliation were reviewed before they entered the reviewer pool',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="font-geist-mono text-ws-caption text-ws-hub-green mt-0.5 shrink-0">
                            —
                          </span>
                          <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </GridPanel>
                </TwoColGrid>

                <div className="mt-6">
                  <NoteBox eyebrow="What verification costs">
                    <p className="mb-3">
                      Human review creates a bottleneck. Verification takes 24–48 hours because a
                      person must review every submission. There is no automated approval. This is
                      not a product limitation to be fixed — it is the mechanism by which
                      verification carries weight. An automated system that approved all submissions
                      would produce the same outcome as self-assertion.
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-tertiary">
                      Verification is also point-in-time, not continuous. A farmer verified in March
                      is not re-verified in September. A lecturer verified in one academic year may
                      change affiliation the next. The platform&apos;s trust signals reflect the
                      state at time of verification plus accumulated behavioural evidence. They do
                      not reflect continuous real-time monitoring.
                    </p>
                  </NoteBox>
                </div>
              </section>

              {/* ── Section 2 — Farmer Verification (S2.5) ── */}
              <section id="farmer-verification" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="02" label="Farmer identity verification" />
                <SectionH2>
                  Three documents. One administrator. A consistency check — not fraud forensics.
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  Every farmer who lists produce on UmojaHub submitted three categories of
                  documentation and had them reviewed by a platform administrator. The review
                  assesses consistency and plausibility — not legal authenticity. The distinction
                  matters.
                </Body>

                {/* Verification process flow (S2.5) */}
                <div className="mb-8">
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                    The verification sequence
                  </p>
                  {FARMER_FLOW.map((s, i) => (
                    <WorkflowStep
                      key={s.step}
                      step={s.step}
                      actor={s.actor}
                      action={s.action}
                      detail={s.detail}
                      hub="food"
                      isLast={i === FARMER_FLOW.length - 1}
                    />
                  ))}
                </div>

                <SubH3>What was reviewed — document by document</SubH3>
                <div className="mb-8">
                  <DataList>
                    {FARMER_DOC_TYPES.map((doc) => (
                      <div key={doc.label} className="px-5 py-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8">
                          <div className="shrink-0 sm:w-44 mb-2 sm:mb-0">
                            <p className="font-geist text-ws-label font-semibold text-ws-text-primary">
                              {doc.label}
                            </p>
                            <p className="font-geist text-ws-body-sm text-ws-text-tertiary mt-0.5">
                              {doc.accepted}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
                              Admin checks
                            </p>
                            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                              {doc.adminChecks}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </DataList>
                </div>

                <div className="mb-8">
                  <LimitationPanel eyebrow="What the administrator cannot do">
                    <ul className="flex flex-col gap-2">
                      {[
                        'Verify land ownership through government land registries — the administrator reviews the submitted document, not the official land register',
                        'Detect sophisticated document forgeries — obvious issues are caught; convincing forgeries may not be',
                        'Confirm that the farm is currently active or that the claimed crop is currently in production',
                        'Verify that the photograph represents the specific land described in the land document',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="font-geist-mono text-ws-caption text-ws-status-pending mt-0.5 shrink-0">
                            —
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </LimitationPanel>
                </div>

                <SubH3>Review outcomes and resubmission</SubH3>
                <ThreeColGrid>
                  {[
                    {
                      status: 'APPROVED',
                      color: 'text-ws-hub-green',
                      detail:
                        "Documents are consistent and plausible. The farmer's Trust Score is initialized with the verification component (40 points). They may now create listings.",
                    },
                    {
                      status: 'REJECTED',
                      color: 'text-ws-status-denied',
                      detail:
                        'A specific rejection reason is sent by SMS and is visible in the farmer dashboard. The reason is correctable. There is no penalty for rejection and no limit on resubmissions.',
                    },
                    {
                      status: 'PENDING',
                      color: 'text-ws-status-pending',
                      detail:
                        'The submission is in the administrator review queue. The farmer can browse the marketplace and view Price Intelligence data during this period. They cannot create listings yet.',
                    },
                  ].map((outcome) => (
                    <GridPanel key={outcome.status}>
                      <p className={`font-geist-mono text-ws-caption uppercase mb-2 ${outcome.color}`}>
                        {outcome.status}
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        {outcome.detail}
                      </p>
                    </GridPanel>
                  ))}
                </ThreeColGrid>

                <Body className="mt-6 max-w-3xl">
                  After approval, verification enables listings but does not guarantee orders. A
                  newly verified farmer with no completed orders has a Trust Score in the NEW tier
                  (40 points). Orders build the remaining score components over time.
                </Body>
              </section>

              {/* ── Section 3 — Supplier Verification ── */}
              <section id="supplier-verification" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="03" label="Supplier verification" />
                <SectionH2>
                  Suppliers cannot add themselves to the directory. Administrators add them.
                </SectionH2>
                <Body className="mb-4 max-w-3xl">
                  The supplier directory is not a self-registration system. A supplier that wants
                  to be listed applies through the platform contact process. A platform administrator
                  reviews the application, verifies the submitted regulatory credentials, and
                  creates the directory entry. There is no self-service path to joining the supplier
                  directory.
                </Body>
                <Body className="mb-8 max-w-3xl">
                  This design choice has a consequence: the number of suppliers in the directory
                  is bounded by administrator capacity to verify them. A supplier not yet in the
                  directory cannot be listed until the review process is complete.
                </Body>

                <SubH3>Credentials reviewed</SubH3>
                <div className="mb-8">
                  <DataList>
                    {SUPPLIER_CREDENTIALS.map((cred) => (
                      <div key={cred.body} className="flex items-start gap-4 px-5 py-5">
                        <div className="shrink-0 w-28">
                          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                            {cred.body}
                          </p>
                        </div>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {cred.what}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <div className="mb-8">
                  <LimitationPanel eyebrow="Document review, not registry query">
                    The administrator reviews credential documents submitted by the supplier. They
                    do not independently query KEBS, PCPB, or KEPHIS registries in real time unless
                    the document raises specific concerns. The verification is a consistency check —
                    it confirms that the supplier submitted a plausible credential document, not that
                    the credential is currently active in the issuing body&apos;s registry.
                  </LimitationPanel>
                </div>

                <TwoColGrid>
                  <GridPanel>
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
                      What it means for farmers
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                      A supplier in the directory submitted regulatory credential documents that were
                      reviewed by a platform administrator before the listing was published. The
                      verification does not guarantee product quality on any specific order. Farmers
                      remain responsible for inspecting inputs received.
                    </p>
                  </GridPanel>
                  <GridPanel>
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
                      What it means for cooperative groups
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                      Group bulk orders are placed with suppliers in the verified directory. The
                      verification provides a plausibility baseline for supplier legitimacy — it
                      does not guarantee pricing, delivery, or product quality on any specific bulk
                      order.{' '}
                      <Link
                        href="/for/cooperatives#payment-coordination"
                        className="text-ws-text-primary underline underline-offset-2 hover:text-ws-hub-green transition-colors duration-150"
                      >
                        See how cooperative payment works
                      </Link>
                      .
                    </p>
                  </GridPanel>
                </TwoColGrid>
              </section>

              {/* ── Section 4 — Lecturer Verification ── */}
              <section id="lecturer-verification" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="04" label="Lecturer verification" />
                <SectionH2>
                  The reviewer&apos;s name is visible on every portfolio entry. That visibility
                  is why credentials matter.
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  An employer who reads a portfolio entry sees the reviewer&apos;s name and
                  institutional affiliation. They can look the reviewer up. They can verify the
                  institution exists and that the reviewer is or was affiliated with it. This
                  traceability is what makes the credential meaningful — and it only works because
                  the reviewer&apos;s credentials were independently reviewed before they were added
                  to the reviewer pool.
                </Body>

                <SubH3>What was reviewed</SubH3>
                <div className="mb-8">
                  <DataList>
                    {LECTURER_CREDENTIALS.map((cred) => (
                      <div key={cred.category} className="px-5 py-5">
                        <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                          {cred.category}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-2">
                          {cred.what}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-tertiary leading-relaxed">
                          {cred.note}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <div className="mb-6">
                  <NoteBox eyebrow="Conflict of interest — what is structural and what is self-policed">
                    <p className="mb-3">
                      The platform prevents a student&apos;s own institution from determining their
                      reviewer assignment. This is structural — a reviewer at Institution A is not
                      assigned to review a student who registered with Institution A&apos;s email
                      domain.
                    </p>
                    <p>
                      Personal relationship conflicts are currently self-policed. If a reviewer knows
                      a student personally — as a former student, a family member, a personal
                      acquaintance — the platform does not detect this. The reviewer is expected to
                      exercise professional judgment and decline the assignment. This limitation is
                      disclosed because it is material to understanding what the institutional
                      conflict of interest protection does and does not cover.
                    </p>
                  </NoteBox>
                </div>

                <LimitationPanel eyebrow="Verification is point-in-time">
                  A reviewer verified in one academic year may change institutional affiliation the
                  next. They are not automatically removed from the reviewer pool when their status
                  changes. The platform reviews reviewer standing periodically. Until a review is
                  completed, a previously verified reviewer may remain active. Employers who want
                  to verify a reviewer&apos;s current affiliation should search independently — the
                  portfolio entry shows affiliation at time of verification, not current status.
                </LimitationPanel>
              </section>

              {/* ── Section 5 — Education Project Verification (S2.6) ── */}
              <section id="project-verification" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="05" label="Education project verification" />
                <SectionH2>
                  Three documents. Peer review. Lecturer review. A cryptographic hash at
                  submission. This is what VERIFIED means.
                </SectionH2>
                <Body className="mb-10 max-w-3xl">
                  A VERIFIED portfolio entry is not self-reported. It is the output of a documented
                  process involving at least two independent reviewers, a defined rubric, and a
                  cryptographic record of what was submitted. Each step is described below.
                </Body>

                {/* Project verification flow (S2.6) */}
                <div className="mb-10">
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                    The verification sequence
                  </p>
                  {EDUCATION_FLOW.map((s, i) => (
                    <WorkflowStep
                      key={s.step}
                      step={s.step}
                      actor={s.actor}
                      action={s.action}
                      detail={s.detail}
                      hub="education"
                      isLast={i === EDUCATION_FLOW.length - 1}
                    />
                  ))}
                </div>

                {/* Three documents */}
                <div className="mb-10">
                  <SubH3>The three-document structure</SubH3>
                  <Body className="mb-6 max-w-3xl">
                    Every project submission must include three process documents. These documents
                    are not a report of what was built. They are a record of how the student thought
                    through the problem. The distinction is intentional — code shows output; these
                    documents show reasoning.
                  </Body>
                  <ThreeColGrid>
                    {[
                      {
                        name: 'Problem Breakdown',
                        reveals: 'Problem understanding',
                        detail:
                          "The student's decomposition of the brief into its component problems. Alternative approaches considered and rejected, with reasoning. Risk factors identified before implementation begins. This document reveals whether the student understood the brief — not just what was asked, but why the problem is hard.",
                      },
                      {
                        name: 'Approach Plan',
                        reveals: 'Planning discipline',
                        detail:
                          "The student's intended implementation approach, milestone structure, and task decomposition. Written before significant implementation begins. Reveals whether the student can plan before executing — a separate skill from implementation capability.",
                      },
                      {
                        name: 'Final Reflection',
                        reveals: 'Professional maturity',
                        detail:
                          'Written after implementation. Documents what was completed, what was not completed and why, what was harder than anticipated, what the student would do differently. Reveals whether the student can honestly assess their own work — the most significant indicator in the submission.',
                      },
                    ].map((doc) => (
                      <GridPanel key={doc.name}>
                        <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                          {doc.name}
                        </p>
                        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
                          Reveals: {doc.reveals}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {doc.detail}
                        </p>
                      </GridPanel>
                    ))}
                  </ThreeColGrid>
                </div>

                {/* Peer review */}
                <div className="mb-10">
                  <SubH3>Peer review</SubH3>
                  <Body className="mb-6 max-w-3xl">
                    After submission, the student is assigned a peer review from another student on
                    the platform. Peer review is not ceremonial — it is a required gate before a
                    submission enters the lecturer review queue.
                  </Body>
                  <div className="mb-4">
                    <TwoColGrid>
                      <GridPanel>
                        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                          What the peer reviewer sees
                        </p>
                        <ul className="flex flex-col gap-2">
                          {[
                            'The project brief',
                            'All three submitted documents',
                            'The rubric for all four assessment dimensions',
                            'The code or repository link',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-3">
                              <span className="font-geist-mono text-ws-caption text-ws-text-tertiary mt-0.5 shrink-0">
                                —
                              </span>
                              <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                            </li>
                          ))}
                        </ul>
                      </GridPanel>
                      <GridPanel>
                        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
                          What the peer reviewer produces
                        </p>
                        <ul className="flex flex-col gap-2">
                          {[
                            'A numeric score (1–5) on each of the four assessment dimensions',
                            'Written commentary for each dimension',
                            'A score that is locked before the submission moves to the lecturer queue',
                            'Commentary the lecturer sees but that does not determine the outcome',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-3">
                              <span className="font-geist-mono text-ws-caption text-ws-text-tertiary mt-0.5 shrink-0">
                                —
                              </span>
                              <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                            </li>
                          ))}
                        </ul>
                      </GridPanel>
                    </TwoColGrid>
                  </div>
                  <NoteBox eyebrow="Note on timing">
                    <p>
                      A student who submits must complete their assigned peer review before their
                      own submission advances to the lecturer queue. The timeline is not entirely
                      within the submitting student&apos;s control — if their assigned review or
                      the review of their submission is delayed, the process is paused.
                    </p>
                  </NoteBox>
                </div>

                {/* Lecturer review */}
                <div className="mb-10">
                  <SubH3>Lecturer review — four dimensions</SubH3>
                  <Body className="mb-6 max-w-3xl">
                    A verified lecturer receives the complete submission package: brief, three
                    documents, code, and peer score with commentary. They review independently and
                    issue one of three decisions. The minimum commentary standard is 50 substantive
                    words per dimension — not 50 words total.
                  </Body>
                  <div className="mb-6">
                    <DataList>
                      {REVIEW_DIMENSIONS.map((dim) => (
                        <div key={dim.dimension} className="px-5 py-5">
                          <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-1">
                            {dim.dimension}
                          </p>
                          <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                            {dim.assesses}
                          </p>
                        </div>
                      ))}
                    </DataList>
                  </div>
                  <ThreeColGrid>
                    {[
                      {
                        decision: 'VERIFIED',
                        color: 'text-ws-hub-blue',
                        detail:
                          'The submission meets the standard across all four dimensions at minimum threshold. The portfolio entry is published with the reviewer name, date, and peer scores visible.',
                      },
                      {
                        decision: 'REVISION_REQUIRED',
                        color: 'text-ws-status-pending',
                        detail:
                          'Specific documented weaknesses that revision can address. Feedback is returned to the student with a documented improvement path. The revised submission re-enters the review process.',
                      },
                      {
                        decision: 'DENIED',
                        color: 'text-ws-status-denied',
                        detail:
                          'The submission does not meet the standard and revision within the current project scope cannot remedy it. DENIED decisions are relatively rare. The student may start a new project engagement.',
                      },
                    ].map((outcome) => (
                      <GridPanel key={outcome.decision}>
                        <p className={`font-geist-mono text-ws-caption uppercase mb-2 ${outcome.color}`}>
                          {outcome.decision}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {outcome.detail}
                        </p>
                      </GridPanel>
                    ))}
                  </ThreeColGrid>
                </div>

                {/* Document hash */}
                <div>
                  <SubH3>The document hash</SubH3>
                  <Body className="mb-6 max-w-3xl">
                    At the moment of submission, a SHA-256 hash of the document content is created
                    and recorded in the verification audit log with a timestamp. This hash appears in
                    the published portfolio entry. It serves one specific purpose: confirming document
                    integrity.
                  </Body>
                  <TwoColGrid>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-3">
                        What the hash proves
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        That the documents currently visible in the portfolio entry are identical to
                        the documents submitted at the time of review. If any character in any
                        document was altered after submission, the hash will not match the current
                        documents.
                      </p>
                    </GridPanel>
                    <GridPanel>
                      <p className="font-geist-mono text-ws-caption text-ws-status-denied uppercase mb-3">
                        What the hash does not prove
                      </p>
                      <ul className="flex flex-col gap-2">
                        {[
                          'That the student wrote the documents',
                          'That the documents accurately describe work that was actually done',
                          'That the code submitted was written by the student',
                          'That the student understands the content of the documents',
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="font-geist-mono text-ws-caption text-ws-text-tertiary mt-0.5 shrink-0">
                              —
                            </span>
                            <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                          </li>
                        ))}
                      </ul>
                    </GridPanel>
                  </TwoColGrid>
                </div>
              </section>

              {/* ── Section 6 — Trust Score (S2.3 + S2.4) ── */}
              <section id="trust-score" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="06" label="Farmer Trust Score methodology" />
                <SectionH2>
                  Four components. One composite score. Four tiers. Recalculates automatically.
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  The Trust Score is a composite numeric value from 0 to 100 assigned to every
                  verified farmer. It reflects accumulated evidence — not time on the platform. A
                  farmer who completes ten orders in two months builds Trust Score faster than a
                  farmer who completes three orders in a year.
                </Body>

                {/* Animated Trust Score display (S2.4) */}
                <div className="mb-8 max-w-lg">
                  <TrustScoreNarrative />
                </div>

                <div className="mb-8">
                  <DataList>
                    {TRUST_COMPONENTS.map((comp) => (
                      <div key={comp.name} className="px-5 py-5">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                          <div className="shrink-0 sm:w-44 mb-2 sm:mb-0">
                            <p className="font-geist text-ws-label font-semibold text-ws-text-primary">
                              {comp.name}
                            </p>
                            <p className="font-geist-mono text-ws-caption text-ws-hub-green tabular-nums mt-0.5">
                              {comp.weight}
                            </p>
                          </div>
                          <div className="flex-1">
                            <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed mb-1">
                              {comp.measures}
                            </p>
                            <p className="font-geist text-ws-body text-ws-text-tertiary leading-relaxed">
                              {comp.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </DataList>
                </div>

                <SubH3>Trust tiers</SubH3>
                <Body className="mb-6 max-w-3xl">
                  The composite score determines a tier. Tiers are visible on listings and inform
                  buyers about the depth of a farmer&apos;s track record. Tiers are not permanent —
                  they recalculate based on the current score. A farmer in TRUSTED tier who stops
                  fulfilling orders will see their reliability component fall and may drop to
                  ESTABLISHED.
                </Body>
                <div className="mb-8">
                  <DataList>
                    {TRUST_TIERS.map((tier) => (
                      <div key={tier.tier} className="flex items-start gap-4 px-5 py-5">
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

                <SubH3>When the score recalculates</SubH3>
                <DataList>
                  {[
                    {
                      trigger: 'Verification decision',
                      result: 'Verification component initializes at 40 points',
                    },
                    {
                      trigger: 'Order reaches RECEIVED status',
                      result: 'Transaction component updates based on completed order volume',
                    },
                    {
                      trigger: 'Buyer submits a rating',
                      result: 'Ratings component updates with new rating, weighted by recency',
                    },
                    {
                      trigger: 'Order accepted but not dispatched past fulfilment window',
                      result: 'Reliability component updates downward',
                    },
                  ].map((item) => (
                    <div
                      key={item.trigger}
                      className="flex flex-col sm:flex-row sm:items-start sm:gap-4 px-5 py-4"
                    >
                      <div className="shrink-0 sm:w-56 mb-1 sm:mb-0">
                        <p className="font-geist text-ws-label font-semibold text-ws-text-primary">
                          {item.trigger}
                        </p>
                      </div>
                      <p className="font-geist text-ws-body text-ws-text-secondary">{item.result}</p>
                    </div>
                  ))}
                </DataList>
              </section>

              {/* ── Section 7 — What Verification Does Not Claim ── */}
              <section id="what-verification-does-not-claim" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="07" label="What verification does not claim" />
                <SectionH2>
                  Verification makes honest self-reporting legible. It does not replace judgment.
                </SectionH2>
                <Body className="mb-10 max-w-3xl">
                  This section is the most important on this page. Every user of the platform —
                  buyers, employers, cooperative groups, students — should read it before making a
                  decision based on verification status. Knowing what verification does not claim
                  prevents false expectations from forming.
                </Body>

                <SubH3>Food Security Hub</SubH3>
                <div className="flex flex-col gap-3 mb-10">
                  {FOOD_HUB_NOT_CLAIMED.map((item) => (
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

                <SubH3>Education Hub</SubH3>
                <div className="flex flex-col gap-3 mb-8">
                  {EDUCATION_HUB_NOT_CLAIMED.map((item) => (
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

                <NoteBox eyebrow="The shared principle">
                  <p>
                    Verification makes honest self-reporting legible. A farmer who genuinely farms
                    what they claim can now demonstrate that to a buyer they have never met. A
                    student who genuinely worked through a hard problem can now show that to an
                    employer who never saw the process. The platform does not make dishonest
                    self-reporting impossible. It makes dishonest self-reporting more consequential —
                    because when it is discovered, the Trust Score falls, the rating is public, and
                    the portfolio entry is either absent or scrutinized.
                  </p>
                </NoteBox>
              </section>

              {/* ── Section 8 — Appeals & Escalation (S2.7) ── */}
              <section id="appeals" className="py-12 border-b border-ws-border-light">
                <SectionLabel n="08" label="Appeals & escalation" />
                <SectionH2>Every decision can be challenged. Here is how.</SectionH2>
                <Body className="mb-8 max-w-3xl">
                  Verification decisions are made by human administrators reviewing documents against
                  published criteria. Human review can produce errors. The appeals process exists
                  because an incorrect decision — a rejection based on a misread document, a denial
                  that missed something in the submission — has direct consequences for the
                  applicant. A process for contesting it is not optional.
                </Body>

                <div className="flex flex-col gap-4 mb-8">
                  {[
                    {
                      actor: 'Farmer or supplier — rejected verification',
                      process:
                        'Submit an appeal through the dashboard within 30 days of the rejection. Your appeal is assigned to an administrator who was not involved in the original decision. Include a specific explanation of why you believe the rejection was in error — not a general objection but a statement addressing the specific reason given. You will receive a response within 5 business days.',
                    },
                    {
                      actor: 'Lecturer — rejected credential verification',
                      process:
                        'Submit an appeal within 30 days by providing additional documentation supporting your qualifications. The second review is assigned to a different administrator.',
                    },
                    {
                      actor: 'Student — DENIED project submission',
                      process:
                        'Within 72 hours of receiving a DENIED decision, you may submit a Request Second Review through the dashboard. Your request must include a link to a new git commit or an updated document that specifically addresses the rubric failures cited in the denial feedback. The second review is assigned to a different lecturer. If the second review also results in DENIED, the decision is final for that submission. You may begin a new project engagement at any time.',
                    },
                    {
                      actor: 'Buyer — dispute over an order',
                      process:
                        'Submit a dispute through the order view in the dashboard. Describe the specific discrepancy — what was listed, what was received, the difference. Both parties are given an opportunity to respond. An administrator reviews the evidence and issues a determination. The determination is not an automatic refund; it is an administrative investigation that may result in refund, partial refund, or no action depending on evidence.',
                    },
                  ].map((item) => (
                    <div key={item.actor} className="border border-ws-border-light px-5 py-5">
                      <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-2">
                        {item.actor}
                      </p>
                      <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                        {item.process}
                      </p>
                    </div>
                  ))}
                </div>

                <SubH3>Escalation</SubH3>
                <NoteBox eyebrow="Senior administrator review">
                  <p>
                    Escalated concerns are reviewed by a senior administrator who was not involved
                    in the original decision or the first appeal. Their determination is final. The
                    escalation path is not available as a first step — the standard appeals process
                    must be completed first.
                  </p>
                </NoteBox>
              </section>

              {/* ── Section 9 — Reporting a Concern ── */}
              <section id="reporting-a-concern" className="py-12">
                <SectionLabel n="09" label="Reporting a verification concern" />
                <SectionH2>
                  What to do if you suspect a verified account or portfolio entry is fraudulent
                </SectionH2>
                <Body className="mb-8 max-w-3xl">
                  Verification reduces the frequency of fraud. It does not eliminate it. When
                  suspicious activity is identified, reporting it is how the system self-corrects.
                </Body>

                <div className="mb-8">
                  <DataList>
                    {[
                      {
                        actor: 'Buyer suspects a listing is fraudulent',
                        steps:
                          'Use the Report button on the listing or order, or contact support via the contact page. Describe the specific concern — what was listed, what was received, and the discrepancy. Administrators investigate. If fraud is confirmed, the listing is suspended and the farmer account is reviewed. Reporting does not trigger an automatic refund — it triggers an administrative investigation.',
                      },
                      {
                        actor: 'Employer suspects a portfolio entry is misrepresented',
                        steps:
                          "Contact the platform via the contact page with the portfolio URL and a description of the concern. If you used the document hash to verify integrity and found a mismatch, include that information. Administrators investigate the submission record. Confirmed misrepresentation may result in the portfolio entry being removed and the account reviewed.",
                      },
                      {
                        actor: 'Anyone suspects a reviewer has a conflict of interest',
                        steps:
                          'Contact the platform via the contact page describing the concern. Reviewer effectiveness data is monitored for patterns — unusually high pass rates, systematic score misalignment with peer assessments. A confirmed bias or conflict results in the reviewer being removed from the active pool and their recent decisions reviewed.',
                      },
                    ].map((row) => (
                      <div key={row.actor} className="px-5 py-5">
                        <p className="font-geist text-ws-label font-semibold text-ws-text-primary mb-2">
                          {row.actor}
                        </p>
                        <p className="font-geist text-ws-body text-ws-text-secondary leading-relaxed">
                          {row.steps}
                        </p>
                      </div>
                    ))}
                  </DataList>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-border-medium font-geist text-ws-body text-ws-text-secondary hover:border-ws-hub-green hover:text-ws-text-primary transition-colors duration-150"
                >
                  Contact us with a verification concern
                </Link>
              </section>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
