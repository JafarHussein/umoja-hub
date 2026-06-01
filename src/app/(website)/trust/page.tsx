import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AudiencePage } from '@/components/website/AudiencePage';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const metadata: Metadata = {
  title: 'Trust & Verification — UmojaHub',
  description:
    'How UmojaHub verifies farmers, suppliers, lecturers, and student project submissions. What verification proves, what it does not, and how the Trust Score is calculated.',
};

const sections: AnchorSection[] = [
  { id: 'verification-philosophy', label: 'Verification philosophy' },
  { id: 'farmer-verification', label: 'Farmer verification' },
  { id: 'supplier-verification', label: 'Supplier verification' },
  { id: 'lecturer-verification', label: 'Lecturer verification' },
  { id: 'project-verification', label: 'Project verification' },
  { id: 'trust-score', label: 'Trust Score' },
  { id: 'what-verification-does-not-claim', label: 'What it does not claim' },
  { id: 'reporting-a-concern', label: 'Reporting a concern' },
];

interface DocType {
  label: string;
  accepted: string;
  adminChecks: string;
}

const farmerDocTypes: DocType[] = [
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

const supplierCredentials: SupplierCredential[] = [
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

const lecturerCredentials: LecturerCredential[] = [
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

const reviewDimensions: ReviewDimension[] = [
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

const trustComponents: TrustComponent[] = [
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

const trustTiers: TrustTier[] = [
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

const foodHubNotClaimed: NotClaimedItem[] = [
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

const educationHubNotClaimed: NotClaimedItem[] = [
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

export default function TrustPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="Trust & Verification · All Audiences"
      heading="Nothing on UmojaHub is self-asserted. Here is exactly what was verified, by whom, and what that verification does and does not mean."
      intro="This page describes every verification process on the platform — for farmers, suppliers, lecturers, and student projects. It exists because a clear statement of methodology, including its limits, builds more trust than any claim of trustworthiness."
      sections={sections}
      registerHref="/contact"
      registerLabel="Contact us with a verification question"
    >
      {/* Section 1 — Verification Philosophy */}
      <section id="verification-philosophy" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          01 · Verification philosophy
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Why self-assertion cannot be the basis for trust
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
          Every claim on a CV is made by the person who benefits from that claim. Every product
          listing by an unverified seller carries only the seller&apos;s word. Every certificate
          can be replicated. The problem is not dishonesty — most people are honest. The problem
          is that there is no structural way to distinguish an honest claim from a dishonest one
          when only one party has verified it.
        </p>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          UmojaHub requires independent verification for every actor whose claims others depend
          on: farmers list produce buyers will purchase, suppliers sell inputs farmer groups will
          receive, lecturers review submissions employers will read. None of these actors can
          verify their own claims. A human administrator reviews documents before any claim is
          presented as verified.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50 mb-8">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
              What self-assertion looks like
            </p>
            <ul className="space-y-3">
              {[
                'A farmer who says they grow two tonnes of maize monthly with no way to confirm',
                'A supplier who claims KEBS certification on a price list with no document submitted',
                'A student who lists six projects on a CV with no reviewer ever having seen them',
                'A lecturer described as senior faculty by their own application',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="font-mono text-t6 text-text-disabled mt-0.5 shrink-0">—</span>
                  <p className="font-body text-t5 text-text-secondary">{item}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
              What verified evidence looks like
            </p>
            <ul className="space-y-3">
              {[
                'A farmer whose identity and land documentation was reviewed by an administrator before they could list',
                'A supplier whose KEBS, PCPB, or KEPHIS credential documents were reviewed and recorded before the directory listing was published',
                'A student whose project was reviewed against a defined rubric by a named, credentials-confirmed lecturer',
                'A lecturer whose academic credentials and institutional affiliation were reviewed before they entered the reviewer pool',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="font-mono text-t6 text-accent-green mt-0.5 shrink-0">—</span>
                  <p className="font-body text-t5 text-text-secondary">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            What verification costs
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed mb-3">
            Human review creates a bottleneck. Verification takes 24–48 hours because a person
            must review every submission. There is no automated approval. This is not a product
            limitation to be fixed — it is the mechanism by which verification carries weight. An
            automated system that approved all submissions would produce the same outcome as
            self-assertion.
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            Verification is also point-in-time, not continuous. A farmer verified in March is not
            re-verified in September. A lecturer verified in one academic year may change affiliation
            the next. The platform&apos;s trust signals reflect the state at time of verification
            plus accumulated behavioural evidence. They do not reflect continuous real-time monitoring.
          </p>
        </div>
      </section>

      {/* Section 2 — Farmer Identity Verification */}
      <section id="farmer-verification" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          02 · Farmer identity verification
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Three documents. One administrator. A consistency check — not fraud forensics.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          Every farmer who lists produce on UmojaHub submitted three categories of documentation
          and had them reviewed by a platform administrator. The review assesses consistency and
          plausibility — not legal authenticity. The distinction matters.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {farmerDocTypes.map((doc, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-8">
                <div className="shrink-0 sm:w-44 mb-2 sm:mb-0">
                  <p className="font-body text-t5 font-semibold text-text-primary">{doc.label}</p>
                  <p className="font-body text-t5 text-text-disabled mt-0.5">{doc.accepted}</p>
                </div>
                <div className="flex-1">
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    Admin checks
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {doc.adminChecks}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-amber-900/30 bg-amber-950/10 rounded-sm p-5 max-w-3xl mb-8">
          <p className="font-mono text-t6 text-amber-400 uppercase tracking-widest mb-3">
            What the administrator cannot do
          </p>
          <ul className="space-y-2">
            {[
              'Verify land ownership through government land registries — the administrator reviews the submitted document, not the official land register',
              'Detect sophisticated document forgeries — obvious issues are caught; convincing forgeries may not be',
              'Confirm that the farm is currently active or that the claimed crop is currently in production',
              'Verify that the photograph represents the specific land described in the land document',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="font-mono text-t6 text-amber-400 mt-0.5 shrink-0">—</span>
                <p className="font-body text-t5 text-text-secondary">{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Review outcomes and resubmission
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-800/50 mb-6">
          {[
            {
              status: 'APPROVED',
              color: 'text-accent-green',
              detail:
                "Documents are consistent and plausible. The farmer's Trust Score is initialized with the verification component (40 points). They may now create listings.",
            },
            {
              status: 'REJECTED',
              color: 'text-red-400',
              detail:
                'A specific rejection reason is sent by SMS and is visible in the farmer dashboard. The reason is correctable. There is no penalty for rejection and no limit on resubmissions. The resubmission review follows the same 24–48 hour process.',
            },
            {
              status: 'PENDING',
              color: 'text-amber-400',
              detail:
                'The submission is in the administrator review queue. The farmer can browse the marketplace, view Price Intelligence data, and use the AI Farm Assistant during this period. They cannot create listings yet.',
            },
          ].map((outcome) => (
            <div key={outcome.status} className="bg-surface-primary p-6">
              <p className={`font-mono text-t6 uppercase tracking-widest mb-2 ${outcome.color}`}>
                {outcome.status}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{outcome.detail}</p>
            </div>
          ))}
        </div>

        <p className="font-body text-t5 text-text-secondary leading-relaxed max-w-3xl">
          After approval, verification enables listings but does not guarantee orders. A newly
          verified farmer with no completed orders has a Trust Score in the NEW tier (40 points).
          Orders build the remaining score components over time.
        </p>
      </section>

      {/* Section 3 — Supplier Verification */}
      <section id="supplier-verification" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          03 · Supplier verification
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Suppliers cannot add themselves to the directory. Administrators add them.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
          The supplier directory is not a self-registration system. A supplier that wants to be
          listed applies through the platform contact process. A platform administrator reviews the
          application, verifies the submitted regulatory credentials, and creates the directory
          entry. There is no self-service path to joining the supplier directory.
        </p>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          This design choice has a consequence: the number of suppliers in the directory is bounded
          by administrator capacity to verify them. A supplier not yet in the directory cannot be
          listed until the review process is complete.
        </p>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Credentials reviewed
        </h3>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {supplierCredentials.map((cred, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-28">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {cred.body}
                </p>
              </div>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{cred.what}</p>
            </div>
          ))}
        </div>

        <div className="border border-amber-900/30 bg-amber-950/10 rounded-sm p-5 max-w-3xl mb-8">
          <p className="font-mono text-t6 text-amber-400 uppercase tracking-widest mb-3">
            Document review, not registry query
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            The administrator reviews credential documents submitted by the supplier. They do not
            independently query KEBS, PCPB, or KEPHIS registries in real time unless the document
            raises specific concerns. The verification is a consistency check — it confirms that the
            supplier submitted a plausible credential document, not that the credential is currently
            active in the issuing body&apos;s registry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
              What it means for farmers
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              A supplier in the directory submitted regulatory credential documents that were reviewed
              by a platform administrator before the listing was published. The verification does not
              guarantee product quality on any specific order. Farmers remain responsible for
              inspecting inputs received.
            </p>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
              What it means for cooperative groups
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              Group bulk orders are placed with suppliers in the verified directory. The verification
              provides a plausibility baseline for supplier legitimacy — it does not guarantee
              pricing, delivery, or product quality on any specific bulk order. Payment coordination
              for group orders is currently managed outside the platform&apos;s automated payment
              system.{' '}
              <Link
                href="/for/cooperatives#payment-coordination"
                className="text-text-primary underline underline-offset-2 hover:text-accent-green transition-colors"
              >
                See how cooperative payment works
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Section 4 — Lecturer Verification */}
      <section id="lecturer-verification" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          04 · Lecturer verification
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          The reviewer&apos;s name is visible on every portfolio entry. That visibility is why
          credentials matter.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          An employer who reads a portfolio entry sees the reviewer&apos;s name and institutional
          affiliation. They can look the reviewer up. They can verify the institution exists and
          that the reviewer is or was affiliated with it. This traceability is what makes the
          credential meaningful — and it only works because the reviewer&apos;s credentials were
          independently reviewed before they were added to the reviewer pool.
        </p>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          What was reviewed
        </h3>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {lecturerCredentials.map((cred, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                {cred.category}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed mb-2">
                {cred.what}
              </p>
              <p className="font-body text-t5 text-text-disabled leading-relaxed">{cred.note}</p>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl mb-6">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Conflict of interest — what is structural and what is self-policed
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed mb-3">
            The platform prevents a student&apos;s own institution from determining their reviewer
            assignment. This is structural — a reviewer at Institution A is not assigned to review a
            student who registered with Institution A&apos;s email domain.
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            Personal relationship conflicts are currently self-policed. If a reviewer knows a student
            personally — as a former student, a family member, a personal acquaintance — the platform
            does not detect this. The reviewer is expected to exercise professional judgment and
            decline the assignment. This limitation is disclosed because it is material to
            understanding what the institutional conflict of interest protection does and does not
            cover.
          </p>
        </div>

        <div className="border border-amber-900/30 bg-amber-950/10 rounded-sm p-5 max-w-3xl">
          <p className="font-mono text-t6 text-amber-400 uppercase tracking-widest mb-3">
            Verification is point-in-time
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            A reviewer verified in one academic year may change institutional affiliation the next.
            They are not automatically removed from the reviewer pool when their status changes. The
            platform reviews reviewer standing periodically. Until a review is completed, a previously
            verified reviewer may remain active. Employers who want to verify a reviewer&apos;s current
            affiliation should search independently — the portfolio entry shows affiliation at time of
            verification, not current status.
          </p>
        </div>
      </section>

      {/* Section 5 — Education Project Verification */}
      <section id="project-verification" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          05 · Education project verification
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Three documents. Peer review. Lecturer review. A cryptographic hash at submission.
          This is what VERIFIED means.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-10 max-w-3xl">
          A VERIFIED portfolio entry is not self-reported. It is the output of a documented
          process involving at least two independent reviewers, a defined rubric, and a
          cryptographic record of what was submitted. Each step is described below.
        </p>

        {/* Three documents */}
        <div className="mb-10">
          <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
            The three-document structure
          </h3>
          <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
            Every project submission must include three process documents. These documents are not a
            report of what was built. They are a record of how the student thought through the
            problem. The distinction is intentional — code shows output; these documents show
            reasoning.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-800/50">
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
              <div key={doc.name} className="bg-surface-primary p-6">
                <p className="font-body text-t4 font-semibold text-text-primary mb-1">{doc.name}</p>
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
                  Reveals: {doc.reveals}
                </p>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">{doc.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Peer review */}
        <div className="mb-10">
          <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
            Peer review
          </h3>
          <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
            After submission, the student is assigned a peer review from another student on the
            platform. Peer review is not ceremonial — it is a required gate before a submission
            enters the lecturer review queue. It has two structural purposes: it raises the floor
            on submission quality, and it develops the reviewing student&apos;s ability to apply
            the rubric.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50 mb-6">
            <div className="bg-surface-primary p-6">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
                What the peer reviewer sees
              </p>
              <ul className="space-y-2">
                {[
                  'The project brief',
                  'All three submitted documents',
                  'The rubric for all four assessment dimensions',
                  'The code or repository link',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="font-mono text-t6 text-text-disabled mt-0.5 shrink-0">—</span>
                    <p className="font-body text-t5 text-text-secondary">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface-primary p-6">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
                What the peer reviewer produces
              </p>
              <ul className="space-y-2">
                {[
                  'A numeric score (1–5) on each of the four assessment dimensions',
                  'Written commentary for each dimension',
                  'A score that is locked before the submission moves to the lecturer queue',
                  'Commentary the lecturer sees but that does not determine the outcome',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="font-mono text-t6 text-text-disabled mt-0.5 shrink-0">—</span>
                    <p className="font-body text-t5 text-text-secondary">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Note on timing
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              A student who submits must complete their assigned peer review before their own
              submission advances to the lecturer queue. The timeline is not entirely within the
              submitting student&apos;s control — if their assigned review or the review of their
              submission is delayed, the process is paused. This affects planning expectations.
            </p>
          </div>
        </div>

        {/* Lecturer review */}
        <div className="mb-10">
          <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
            Lecturer review
          </h3>
          <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
            A verified lecturer receives the complete submission package: brief, three documents,
            code, and peer score with commentary. They review independently and issue one of three
            decisions. The minimum commentary standard is 50 substantive words per dimension —
            not 50 words total.
          </p>
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-6">
            {reviewDimensions.map((dim, i) => (
              <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
                <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                  {dim.dimension}
                </p>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {dim.assesses}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-800/50">
            {[
              {
                decision: 'VERIFIED',
                color: 'text-accent-green',
                detail:
                  'The submission meets the standard across all four dimensions at minimum threshold. The portfolio entry is published with the reviewer name, date, and peer scores visible.',
              },
              {
                decision: 'REVISION_REQUIRED',
                color: 'text-amber-400',
                detail:
                  'Specific documented weaknesses that revision can address. Feedback is returned to the student with a documented improvement path. The revised submission re-enters the review process.',
              },
              {
                decision: 'DENIED',
                color: 'text-red-400',
                detail:
                  'The submission does not meet the standard and revision within the current project scope cannot remedy it. DENIED decisions are relatively rare. The student may start a new project engagement.',
              },
            ].map((outcome) => (
              <div key={outcome.decision} className="bg-surface-primary p-6">
                <p className={`font-mono text-t6 uppercase tracking-widest mb-2 ${outcome.color}`}>
                  {outcome.decision}
                </p>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {outcome.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Document hash */}
        <div>
          <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
            The document hash
          </h3>
          <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
            At the moment of submission, a SHA-256 hash of the document content is created and
            recorded in the verification audit log with a timestamp. This hash appears in the
            published portfolio entry. It serves one specific purpose: confirming document integrity.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50">
            <div className="bg-surface-primary p-6">
              <p className="font-mono text-t6 text-accent-green uppercase tracking-widest mb-3">
                What the hash proves
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                That the documents currently visible in the portfolio entry are identical to the
                documents submitted at the time of review. If any character in any document was
                altered after submission, the hash will not match the current documents. An employer
                who verifies the hash is confirming: these are the documents the reviewer reviewed.
              </p>
            </div>
            <div className="bg-surface-primary p-6">
              <p className="font-mono text-t6 text-red-400 uppercase tracking-widest mb-3">
                What the hash does not prove
              </p>
              <ul className="space-y-2">
                {[
                  'That the student wrote the documents',
                  'That the documents accurately describe work that was actually done',
                  'That the code submitted was written by the student',
                  'That the student understands the content of the documents',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="font-mono text-t6 text-text-disabled mt-0.5 shrink-0">—</span>
                    <p className="font-body text-t5 text-text-secondary">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — Trust Score Methodology */}
      <section id="trust-score" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          06 · Farmer Trust Score methodology
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Four components. One composite score. Four tiers. Recalculates automatically.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          The Trust Score is a composite numeric value from 0 to 100 assigned to every verified
          farmer. It reflects accumulated evidence — not time on the platform. A farmer who completes
          ten orders in two months builds Trust Score faster than a farmer who completes three orders
          in a year.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {trustComponents.map((comp, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                <div className="shrink-0 sm:w-44 mb-2 sm:mb-0">
                  <p className="font-body text-t5 font-semibold text-text-primary">{comp.name}</p>
                  <p className="font-mono text-t6 text-accent-green tabular-nums mt-0.5">
                    {comp.weight}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-body text-t5 text-text-secondary leading-relaxed mb-1">
                    {comp.measures}
                  </p>
                  <p className="font-body text-t5 text-text-disabled leading-relaxed">{comp.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Trust tiers
        </h3>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-6 max-w-3xl">
          The composite score determines a tier. Tiers are visible on listings and inform buyers
          about the depth of a farmer&apos;s track record. Tiers are not permanent — they
          recalculate based on the current score. A farmer in TRUSTED tier who stops fulfilling
          orders will see their reliability component fall and may drop to ESTABLISHED.
        </p>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {trustTiers.map((tier, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-32">
                <p className="font-mono text-t5 font-semibold text-text-primary">{tier.tier}</p>
                <p className="font-mono text-t6 text-text-disabled tabular-nums">{tier.range}</p>
              </div>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{tier.meaning}</p>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          When the score recalculates
        </h3>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
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
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-start sm:gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 sm:w-56 mb-1 sm:mb-0">
                <p className="font-body text-t5 font-semibold text-text-primary">{item.trigger}</p>
              </div>
              <p className="font-body text-t5 text-text-secondary">{item.result}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 7 — What Verification Does Not Claim */}
      <section id="what-verification-does-not-claim" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          07 · What verification does not claim
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Verification makes honest self-reporting legible. It does not replace judgment.
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-10 max-w-3xl">
          This section is the most important on this page. Every user of the platform — buyers,
          employers, cooperative groups, students — should read it before making a decision based
          on verification status. Knowing what verification does not claim prevents false
          expectations from forming, which prevents the larger trust collapse that follows a bad
          experience that was never disclosed as possible.
        </p>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Food Security Hub
        </h3>
        <div className="space-y-3 mb-10">
          {foodHubNotClaimed.map((item, i) => (
            <div key={i} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t5 font-semibold text-text-primary mb-2">{item.label}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <h3 className="font-heading text-t3 font-semibold text-text-primary tracking-tight mb-4">
          Education Hub
        </h3>
        <div className="space-y-3 mb-8">
          {educationHubNotClaimed.map((item, i) => (
            <div key={i} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t5 font-semibold text-text-primary mb-2">{item.label}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            The shared principle
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            Verification makes honest self-reporting legible. A farmer who genuinely farms what they
            claim can now demonstrate that to a buyer they have never met. A student who genuinely
            worked through a hard problem can now show that to an employer who never saw the process.
            The platform does not make dishonest self-reporting impossible. It makes dishonest
            self-reporting more consequential — because when it is discovered, the Trust Score falls,
            the rating is public, and the portfolio entry is either absent or scrutinized.
          </p>
        </div>
      </section>

      {/* Section 8 — Reporting a Concern */}
      <section id="reporting-a-concern" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-4">
          08 · Reporting a verification concern
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          What to do if you suspect a verified account or portfolio entry is fraudulent
        </h2>
        <p className="font-body text-t4 text-text-secondary leading-relaxed mb-8 max-w-3xl">
          Verification reduces the frequency of fraud. It does not eliminate it. When suspicious
          activity is identified, reporting it is how the system self-corrects. Here is what to do
          in each case.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {[
            {
              actor: 'Buyer suspects a listing is fraudulent',
              steps:
                'Use the Report button on the listing or order, or contact support via the contact page. Describe the specific concern — what was listed, what was received, and the discrepancy. Administrators investigate. If fraud is confirmed, the listing is suspended and the farmer account is reviewed. Reporting does not trigger an automatic refund — it triggers an administrative investigation.',
            },
            {
              actor: 'Employer suspects a portfolio entry is misrepresented',
              steps:
                "Contact the platform via the contact page with the portfolio URL and a description of the concern. If you used the document hash to verify integrity and found a mismatch, include that information — it is the most actionable report. Administrators investigate the submission record. Confirmed misrepresentation may result in the portfolio entry being removed and the account reviewed.",
            },
            {
              actor: 'Anyone suspects a reviewer has a conflict of interest',
              steps:
                'Contact the platform via the contact page describing the concern. Reviewer effectiveness data is monitored for patterns — unusually high pass rates, systematic score misalignment with peer assessments. A single concern report is reviewed alongside broader pattern data. Confirmed bias or conflict results in the reviewer being removed from the active pool and their recent decisions reviewed.',
            },
          ].map((row, i) => (
            <div key={i} className="px-5 py-5 border-b border-zinc-800/50 last:border-0">
              <p className="font-body text-t5 font-semibold text-text-primary mb-2">{row.actor}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{row.steps}</p>
            </div>
          ))}
        </div>

        <Link
          href="/contact"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-accent-green/50 hover:text-text-primary"
        >
          Contact us with a verification concern
        </Link>
      </section>
    </AudiencePage>
  );
}
