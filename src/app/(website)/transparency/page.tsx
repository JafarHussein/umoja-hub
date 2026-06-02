import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { GovernancePage } from '@/components/website/GovernancePage';
import { getTransparencyData } from '@/lib/transparency';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Platform Transparency — UmojaHub',
  description:
    'Live platform metrics, what UmojaHub tracks and does not track, infrastructure disclosure, and service status.',
};

const sections: AnchorSection[] = [
  { id: 'live-metrics', label: 'Live metrics' },
  { id: 'what-we-track', label: 'What we track' },
  { id: 'what-we-do-not-track', label: 'What we do not track' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'service-status', label: 'Service status' },
];

interface NotTrackedItem {
  label: string;
  detail: string;
}

const notTracked: NotTrackedItem[] = [
  {
    label: 'Post-transaction price outcomes',
    detail:
      'The platform records that a transaction occurred and the KES value of that transaction. It does not record what the buyer would have paid through alternative channels (physical market, broker). The claim that UmojaHub delivers better prices to farmers cannot be supported by platform data alone.',
  },
  {
    label: 'Farmer income improvement',
    detail:
      'Completing transactions on the platform does not tell us whether the farmer earned more than they would have through other channels. A farmer who sells 100 kg of tomatoes at KES 45/kg on the platform may have previously sold through a broker at KES 30/kg — or at KES 50/kg. The platform does not know and does not claim to know.',
  },
  {
    label: 'Produce quality outcomes',
    detail:
      'The platform does not inspect produce and does not track whether produce received matched the listing description. Buyer ratings capture satisfaction retroactively but are not a systematic quality measurement system.',
  },
  {
    label: 'Post-graduation employment outcomes',
    detail:
      'The platform does not track whether students with VERIFIED portfolio entries received job offers, were hired, or improved their employment outcomes compared to students without verified portfolios. This would require post-platform longitudinal tracking that the platform does not conduct.',
  },
  {
    label: 'Platform attribution',
    detail:
      'Correlation between platform use and improved outcomes is not the same as causation. A farmer who sells through UmojaHub may also sell through other channels, attend market days, and benefit from seasonal price increases unrelated to the platform. The platform cannot isolate its own contribution.',
  },
  {
    label: 'Farmer retention and dropout',
    detail:
      'The platform tracks active verified farmers — it does not surface how many farmers registered, verified, posted listings, received no orders, and stopped using the platform. That number exists in the data but is not reported here because it would require definition work and contextual framing to be useful rather than misleading.',
  },
];

interface InfraItem {
  provider: string;
  role: string;
  note: string | null;
}

const infrastructure: InfraItem[] = [
  {
    provider: 'MongoDB Atlas',
    role: 'Primary database — user accounts, listings, orders, project submissions, verification records, and all platform data',
    note: null,
  },
  {
    provider: 'Safaricom Daraja API',
    role: 'M-Pesa payment processing — STK Push initiation, payment confirmation callbacks, transaction reference tracking',
    note: 'UmojaHub is a licensed third-party Daraja API developer. It is not affiliated with Safaricom.',
  },
  {
    provider: 'Groq',
    role: 'Farm Analytics Tool (farmer-facing crop and pricing guidance) and Project Guidance Tool (student-facing structured questioning tool during project work)',
    note: null,
  },
  {
    provider: 'OpenAI',
    role: 'Structured brief generation from the agricultural context library, and knowledge article content moderation',
    note: null,
  },
  {
    provider: 'Cloudinary',
    role: 'File storage — farmer verification documents (identity, land documentation, produce photographs) and any media uploads',
    note: null,
  },
  {
    provider: 'SendGrid',
    role: 'Transactional email — registration confirmation, verification decisions, order notifications, password reset',
    note: null,
  },
  {
    provider: "Africa's Talking",
    role: 'SMS notifications — order alerts to farmers and buyers, verification status updates, price alert triggers',
    note: null,
  },
];

function formatKES(value: number): string {
  if (value >= 1_000_000) {
    return `KES ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `KES ${(value / 1_000).toFixed(0)}K`;
  }
  return `KES ${value.toLocaleString('en-KE')}`;
}

export default async function TransparencyPage(): Promise<React.ReactElement> {
  const data = await getTransparencyData().catch(() => ({
    verifiedFarmers: 0,
    counties: 0,
    completedOrders: 0,
    totalTransactionVolumeKES: 0,
    verifiedProjects: 0,
    verifiedLecturers: 0,
    articles: 0,
    pendingVerificationCount: 0,
    lastUpdated: new Date().toISOString(),
  }));

  const snapshotDate = new Date(data.lastUpdated).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <GovernancePage
      eyebrow="Governance · Transparency"
      heading="What the platform measures, what it does not, and who runs the infrastructure."
      intro="This page publishes UmojaHub's live operational metrics, explains exactly what each metric counts and does not count, and discloses the infrastructure providers and automated tools in use. Updated every five minutes from the platform database."
      sections={sections}
      ctaHref="/contact"
      ctaLabel="Contact us with a data inquiry"
    >
      {/* Section 1 — Live Metrics */}
      <section id="live-metrics" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          01 · Live metrics
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          Current platform activity
        </h2>
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary mb-8">
          Snapshot computed {snapshotDate} · Page revalidates every 5 minutes
        </p>

        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          Food Security Hub
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light mb-8">
          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-display-3 font-semibold text-ws-text-primary tabular-nums mb-1">
              {data.verifiedFarmers.toLocaleString('en-KE')}
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Verified Farmers
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-1">
              Counts
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
              Currently approved, active farmers with confirmed identity and land documentation.
              Recalculates when a farmer account is suspended or becomes inactive.
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
              Does not count
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6]">
              All-time registrations, farmers in PENDING verification, or farmers whose accounts
              have been suspended.
            </p>
          </div>

          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-display-3 font-semibold text-ws-text-primary tabular-nums mb-1">
              {data.completedOrders.toLocaleString('en-KE')}
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Completed Orders
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-1">
              Counts
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
              Orders that reached RECEIVED status — the buyer confirmed receipt and payment
              released to the farmer. Both parties confirmed the transaction.
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
              Does not count
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6]">
              PENDING orders, PAID orders awaiting dispatch, DISPATCHED orders not yet confirmed,
              or orders that were cancelled before payment.
            </p>
          </div>

          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-display-3 font-semibold text-ws-text-primary tabular-nums mb-1">
              {formatKES(data.totalTransactionVolumeKES)}
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Transaction Volume
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-1">
              Counts
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
              Sum in KES of all completed orders — those that reached RECEIVED status with payment
              confirmed by Safaricom.
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
              Does not count
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6]">
              PENDING or PAID order values, orders where payment was initiated but not confirmed,
              or cooperative group order values (payment is coordinated outside the platform
              payment system).
            </p>
          </div>

          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-display-3 font-semibold text-ws-text-primary tabular-nums mb-1">
              {data.counties.toLocaleString('en-KE')}
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Counties Represented
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-1">
              Counts
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
              Kenyan counties where at least one verified active farmer has at least one active
              listing currently live on the marketplace.
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
              Does not count
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6]">
              Counties where farmers are registered but have no active listing, or counties where
              all listings are currently deactivated or expired.
            </p>
          </div>
        </div>

        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          Education Hub
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light">
          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-display-3 font-semibold text-ws-text-primary tabular-nums mb-1">
              {data.verifiedProjects.toLocaleString('en-KE')}
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Verified Portfolio Projects
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-1">
              Counts
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
              Project submissions that received a VERIFIED decision from a verified lecturer after
              passing peer review. Each represents one published portfolio entry.
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
              Does not count
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6]">
              Submissions in PEER_REVIEW or REVISION_REQUIRED status, DENIED submissions, or the
              number of students who have at least one VERIFIED project (one student can have
              multiple verified entries — this counts entries, not students).
            </p>
          </div>

          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-display-3 font-semibold text-ws-text-primary tabular-nums mb-1">
              {data.verifiedLecturers.toLocaleString('en-KE')}
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Verified Lecturers
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-1">
              Counts
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
              Lecturers whose academic credentials and institutional affiliation have been reviewed
              and confirmed by a platform administrator. They are eligible to review submissions.
            </p>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
              Does not count
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6]">
              Lecturers who registered but have not completed credential review, or verified
              lecturers who have not completed any review in the current period.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — What We Track and Why */}
      <section id="what-we-track" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          02 · What we track and why
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-6">
          Each metric exists for a specific reason. Here it is.
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          Platform metrics are not neutral. Choosing what to count and how to count it reflects
          what the platform believes matters. The explanations below are intended to help program
          evaluators and researchers understand what these numbers actually represent before using
          them in reports.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden">
          {[
            {
              metric: 'Verified farmer count',
              why: 'Verified farmers are the supply side of the marketplace. Without them, there are no listings. This metric measures the active, verified supply base — not total registrations. Total registrations would include farmers who dropped off after verification failed or who registered and never listed.',
              howCalculated:
                'Count of User documents with role=FARMER and verification status=APPROVED and account status=ACTIVE. Recomputed by the impact summary cron.',
            },
            {
              metric: 'Completed order count',
              why: 'Completed orders are the only orders where both parties confirmed a successful transaction. PAID status means a buyer paid; it does not mean the farmer fulfilled the order. RECEIVED status means the farmer dispatched and the buyer confirmed receipt. This is the metric that reflects actual platform utility.',
              howCalculated:
                'Count of Order documents with status=RECEIVED. Does not include CANCELLED, PENDING, PAID, or DISPATCHED orders.',
            },
            {
              metric: 'Transaction volume (KES)',
              why: 'The total KES value of completed transactions gives program evaluators a sense of economic activity on the platform. It is the closest available proxy for the money flowing through the marketplace. It is not a measure of farmer income, profit, or benefit relative to alternative channels.',
              howCalculated:
                'Sum of the totalAmount field on Order documents with status=RECEIVED. Recomputed by the impact summary cron.',
            },
            {
              metric: 'Counties represented',
              why: 'Geographic coverage is a proxy for platform reach. A county where no verified farmer has an active listing is not meaningfully "covered" even if a farmer from that county registered. This metric requires both verification and an active listing — the minimum threshold for the marketplace to be usable in that county.',
              howCalculated:
                'Count of distinct pickup county values on active Listing documents where the associated farmer has status=APPROVED and ACTIVE. Recomputed by the impact summary cron.',
            },
            {
              metric: 'Verified portfolio projects',
              why: 'VERIFIED project count is the Education Hub output metric. It represents the number of independently reviewed portfolio entries — the unit of verified evidence the hub produces. This metric tells program evaluators how many verified credential records the Education Hub has produced.',
              howCalculated:
                'Live count of ProjectEngagement documents with status=VERIFIED. Updated in real time, not from the snapshot.',
            },
            {
              metric: 'Verified lecturers',
              why: 'Reviewer capacity is the bottleneck for Education Hub throughput. A small reviewer pool means longer queue wait times. This metric is a leading indicator of throughput capacity — if the reviewer count drops, submission wait times will increase.',
              howCalculated:
                'Count of verified lecturer accounts as recorded in the impact summary snapshot. Recomputed by the cron.',
            },
          ].map((item, i) => (
            <div key={i} className="px-5 py-5 border-b border-ws-border-light last:border-0">
              <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary mb-2">
                {item.metric}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-2">
                {item.why}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6] pl-3 border-l border-ws-border-light">
                {item.howCalculated}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — What We Do Not Track */}
      <section id="what-we-do-not-track" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          03 · What we do not track
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-6">
          Six things the platform data cannot tell you
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          Organizations that use platform data in program evaluations, impact reports, or funding
          proposals should read this section before citing any UmojaHub metric. Each item below
          is a question that platform data cannot answer — and a note on what would actually be
          required to answer it.
        </p>

        <div className="space-y-3">
          {notTracked.map((item, i) => (
            <div key={i} className="border border-ws-border-light p-5">
              <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary mb-2">
                {item.label}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl mt-6">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            What would be required
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7]">
            Answering the questions above requires external research methodology: farmer income
            surveys, buyer price comparison data, and longitudinal employment tracking for students.
            UmojaHub can provide anonymized transaction data to partner organizations under a
            formal data governance agreement. Contact us if your organization is conducting a
            program evaluation that requires this data.
          </p>
        </div>
      </section>

      {/* Section 4 — Infrastructure */}
      <section id="infrastructure" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          04 · Infrastructure
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-6">
          The providers the platform runs on
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          UmojaHub discloses its infrastructure providers at a category level. This is not a
          complete architectural specification. Security-specific infrastructure details — session
          management, webhook authentication, document storage access controls — are disclosed on
          the{' '}
          <Link
            href="/security"
            className="text-ws-text-primary underline underline-offset-2 hover:text-ws-hub-green transition-colors duration-150"
          >
            Security page
          </Link>
          .
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden">
          {infrastructure.map((item, i) => (
            <div key={i} className="px-5 py-5 border-b border-ws-border-light last:border-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                <div className="shrink-0 sm:w-44 mb-2 sm:mb-0">
                  <p className="font-geist-mono text-ws-body-sm font-semibold text-ws-text-primary">
                    {item.provider}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                    {item.role}
                  </p>
                  {item.note !== null && (
                    <p className="font-geist text-ws-body-sm text-ws-text-tertiary leading-[1.6] mt-1">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl mt-6">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            Automated tool disclosure
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-3">
            UmojaHub uses automated tools at two specific points: the Farm Analytics Tool and
            Project Guidance Tool (Groq), and the structured brief generator and content moderation
            (OpenAI). No automated tool is used for any verification decision — farmer, supplier,
            or lecturer credentials are reviewed by human administrators only. No automated tool
            is used for any component of the Trust Score calculation or any reviewer assignment.
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            Where automated tools are used, their specific limitations are disclosed on the audience
            pages for farmers (Farm Analytics Tool) and students (Project Guidance Tool). The
            constraints are: no memory between sessions, and general knowledge only within the
            domain defined by the platform.
          </p>
        </div>
      </section>

      {/* Section 5 — Service Status */}
      <section id="service-status" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          05 · Service status
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-6">
          Current platform status
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-ws-border-light mb-8">
          {[
            { service: 'Marketplace', status: 'Operational' },
            { service: 'M-Pesa payments', status: 'Operational' },
            { service: 'Education Hub', status: 'Operational' },
            { service: 'Farm Analytics Tool', status: 'Operational' },
            { service: 'Project Guidance Tool', status: 'Operational' },
            { service: 'Verification queue', status: 'Operational' },
          ].map((item) => (
            <div
              key={item.service}
              className="bg-ws-surface-base p-6 flex items-center justify-between gap-4"
            >
              <p className="font-geist text-ws-body-sm text-ws-text-secondary">{item.service}</p>
              <span className="font-geist-mono text-ws-caption text-ws-hub-green uppercase shrink-0">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            Uptime history and incident reporting
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-3">
            A public uptime history and incident log is not yet available. Platform incidents that
            affect in-flight transactions (payments held in escrow during downtime, submissions in
            review queue during a service interruption) are resolved by platform administrators
            on resumption of service.
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            If you are experiencing a service issue now, contact us via the{' '}
            <Link
              href="/contact"
              className="text-ws-text-primary underline underline-offset-2 hover:text-ws-hub-green transition-colors duration-150"
            >
              contact page
            </Link>
            . Transaction disputes that arise from platform downtime are escalated to
            administrators for manual resolution.
          </p>
        </div>
      </section>
    </GovernancePage>
  );
}
