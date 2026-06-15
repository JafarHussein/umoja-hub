import type { Metadata } from 'next';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'Team · UmojaHub',
  description:
    'The administrators who verify farmers and students, review disputes, and handle appeals. Named accountability for every decision.',
};

const ADMINS = [
  {
    id: 'ADMIN-AG-001',
    title: 'Verification Administrator, Agricultural Hub',
    credentials: 'Academic or professional background in agricultural sciences, land administration, or rural development',
    queues: ['Farmer identity verification', 'Land documentation review', 'Supplier credential review'],
    contact: 'verification@umojahub.org',
  },
  {
    id: 'ADMIN-ED-001',
    title: 'Verification Administrator, Education Hub',
    credentials: 'Academic background with institutional affiliation in computer science, information systems, or related field',
    queues: ['Lecturer credential verification', 'Student portfolio oversight', 'Conflict of interest review'],
    contact: 'education@umojahub.org',
  },
] as const;

const SCOPE_ITEMS = [
  {
    title: 'Farmer verification',
    reviews: 'National ID or passport, land documentation, farm photograph',
    criteria: 'Consistency, plausibility (a real person with documented land access), completeness',
    notAssessed: 'Produce quality, business viability, farming experience',
  },
  {
    title: 'Supplier verification',
    reviews: 'Business registration documents, KEBS / PCPB / KEPHIS certifications',
    criteria: 'Credential validity (certifications are current), active registration status',
    notAssessed: 'Product quality, business performance, market pricing',
  },
  {
    title: 'Lecturer verification',
    reviews: 'Academic credentials, institutional affiliation documentation',
    criteria: 'Confirmed academic standing in a relevant discipline, verifiable institutional affiliation',
    notAssessed: 'Research output, teaching performance, institutional ranking',
  },
] as const;

const EXAMPLES = [
  {
    badge: 'Approved',
    tone: 'success',
    type: 'Farmer Verification',
    docs: 'National ID present. Land documentation shows a registered parcel in the applicant name. Farm photograph shows cultivated land consistent with documented acreage.',
    reasoning: 'Documents are consistent, plausible, and complete. Verification criteria met.',
  },
  {
    badge: 'Rejected',
    tone: 'warning',
    type: 'Farmer Verification',
    docs: 'National ID present. Land documentation references a parcel in a different name with no explanation of connection to the applicant. Farm photograph shows uncultivated land.',
    reasoning: 'Documents are inconsistent. Land documentation does not connect to applicant identity. Resubmit with documentation that establishes the land connection clearly.',
  },
  {
    badge: 'Verified',
    tone: 'success',
    type: 'Student Portfolio',
    docs: 'Problem Breakdown defines the problem scope with specific constraints. Approach Plan methodology is appropriate with justified trade-offs. Reflection identifies specific failures with analysis, not just description.',
    reasoning: 'All four rubric dimensions scored at standard. Reflection demonstrates disciplined self-assessment. Peer and lecturer scores consistent.',
  },
  {
    badge: 'Revision required',
    tone: 'warning',
    type: 'Student Portfolio',
    docs: 'Problem Breakdown and Approach Plan meet standard. Reflection describes what was built but does not analyze what failed or what would be done differently.',
    reasoning: 'Reflection dimension below standard. The document summarizes the project but does not demonstrate retrospective judgment. Revise to address what failed and why.',
  },
] as const;

const EXAMPLE_BADGE: Record<(typeof EXAMPLES)[number]['tone'], string> = {
  success: 'border-success/40 text-success',
  warning: 'border-warning/40 text-warning',
};

const APPEAL_COLUMNS = [
  {
    title: 'Farmers and suppliers',
    window: '30-day window from decision date',
    steps: [
      'Submit appeal to verification@umojahub.org with specific grounds',
      'Administrator reviews the original decision with fresh eyes, independent of the first reviewer',
      'Response within 5 business days',
      'Unresolved cases escalate to the platform governance contact',
    ],
  },
  {
    title: 'Students',
    window: '72 hours from decision date',
    steps: [
      'Submit appeal to education@umojahub.org with specific grounds for dispute',
      'Revision-required decisions can be appealed if feedback is unclear or unactionable',
      'Response within 48 hours',
      'Conflict of interest claims use a separate process: state the reviewer name and nature of conflict',
    ],
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';
const FIELD = 'text-xs font-semibold uppercase tracking-wide text-fg-subtle';

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Team
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Who decides.
              <br />
              Why names are published.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              Anonymous governance is not governance. A farmer submitting identity documents to an
              unnamed entity has no basis for trust. Named administrators with stated credentials are
              the accountability mechanism.
            </p>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="A verification administrator reviewing submissions"
              label="Administrator at work"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Admin profiles */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Who makes verification decisions</h2>
          <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
            Profiles are role-based. Personal names will be published when hiring is finalised. Each
            administrator is responsible for specific verification queues.
          </p>
          <div className="flex w-full flex-col gap-6 md:flex-row">
            {ADMINS.map((admin) => (
              <div key={admin.id} className="flex flex-1 flex-col gap-5 rounded border border-border bg-surface p-8">
                <span className="w-fit rounded-sm bg-surface-sunken px-2.5 py-1 font-ibm-mono text-xs text-fg-muted">
                  {admin.id}
                </span>
                <p className="text-lg font-semibold leading-snug text-fg">{admin.title}</p>
                <p className={FIELD}>Credentials</p>
                <p className="text-sm leading-relaxed text-fg-muted">{admin.credentials}</p>
                <p className={FIELD}>Verification queues</p>
                {admin.queues.map((q) => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <p className="text-sm text-fg-muted">{q}</p>
                  </div>
                ))}
                <p className={FIELD}>Appeals contact</p>
                <p className="font-ibm-mono text-sm text-brand">{admin.contact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decision scope */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-8 py-24`}>
          <h2 className={H2}>What each administrator decides</h2>
          <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
            {SCOPE_ITEMS.map((item) => (
              <div key={item.title} className="flex flex-col gap-5 py-8">
                <p className="text-xl font-semibold leading-snug text-fg">{item.title}</p>
                <div className="flex w-full flex-col gap-6 md:flex-row md:gap-10">
                  <div className="flex flex-1 flex-col gap-2">
                    <p className={FIELD}>Reviews</p>
                    <p className="text-sm leading-relaxed text-fg-muted">{item.reviews}</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <p className={FIELD}>Criteria</p>
                    <p className="text-sm leading-relaxed text-fg-muted">{item.criteria}</p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <p className={FIELD}>Not assessed</p>
                    <p className="text-sm leading-relaxed text-fg-muted">{item.notAssessed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decision examples */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Decision attribution examples</h2>
          <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
            Anonymized examples showing what a complete decision looks like in each direction. These
            are not hypotheticals. They represent the actual criteria applied.
          </p>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border md:grid-cols-2">
            {EXAMPLES.map((ex) => (
              <div key={ex.badge + ex.type} className="flex flex-col gap-4 bg-surface p-8">
                <div className="inline-flex self-start">
                  <span className={`rounded-full border px-2.5 py-1 font-ibm-mono text-xs tracking-wide ${EXAMPLE_BADGE[ex.tone]}`}>
                    {ex.badge}
                  </span>
                </div>
                <p className="text-base font-semibold leading-snug text-fg">{ex.type}</p>
                <p className={FIELD}>Documents reviewed</p>
                <p className="text-sm leading-relaxed text-fg-muted">{ex.docs}</p>
                <p className={FIELD}>Decision reasoning</p>
                <p className="text-sm leading-relaxed text-fg-muted">{ex.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Appeals */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <h2 className={H2}>Appeals process</h2>
          <div className="flex w-full flex-col gap-6 md:flex-row">
            {APPEAL_COLUMNS.map((col) => (
              <div key={col.title} className="flex flex-1 flex-col gap-5 rounded border-l-2 border-brand bg-surface-sunken px-8 py-9">
                <p className="text-xl font-semibold leading-snug text-fg">{col.title}</p>
                <p className="text-sm text-fg-subtle">{col.window}</p>
                {col.steps.map((step, i) => (
                  <div key={step} className="flex items-start gap-4">
                    <span className="shrink-0 text-sm font-semibold text-brand">{i + 1}</span>
                    <p className="flex-1 text-sm leading-relaxed text-fg-muted">{step}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
