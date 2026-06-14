import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team — UmojaHub',
  description:
    'The administrators who verify farmers and students, review disputes, and handle appeals. Named accountability for every decision.',
};

const ADMINS = [
  {
    id: 'ADMIN-AG-001',
    title: 'Verification Administrator — Agricultural Hub',
    credentials:
      'Academic or professional background in agricultural sciences, land administration, or rural development',
    queues: ['Farmer identity verification', 'Land documentation review', 'Supplier credential review'],
    contact: 'verification@umojahub.org',
  },
  {
    id: 'ADMIN-ED-001',
    title: 'Verification Administrator — Education Hub',
    credentials:
      'Academic background with institutional affiliation in computer science, information systems, or related field',
    queues: ['Lecturer credential verification', 'Student portfolio oversight', 'Conflict of interest review'],
    contact: 'education@umojahub.org',
  },
] as const;

const SCOPE_ITEMS = [
  {
    title: 'Farmer verification',
    reviews: 'National ID or passport, land documentation, farm photograph',
    criteria:
      'Consistency (documents reference each other coherently), plausibility (real person with documented land access), completeness (all required documents present)',
    notAssessed: 'Produce quality, business viability, farming experience',
  },
  {
    title: 'Supplier verification',
    reviews: 'Business registration documents, KEBS / PCPB / KEPHIS certifications',
    criteria:
      'Credential validity (certifications are current), registration status (active business registration)',
    notAssessed: 'Product quality, business performance, market pricing',
  },
  {
    title: 'Lecturer verification',
    reviews: 'Academic credentials, institutional affiliation documentation',
    criteria:
      'Confirmed academic standing in a relevant discipline, institutional affiliation verifiable',
    notAssessed: 'Research output, teaching performance, institutional ranking',
  },
] as const;

const EXAMPLES = [
  {
    badge: 'APPROVED',
    tone: 'success',
    type: 'Farmer Verification',
    docs: 'National ID present. Land documentation shows registered parcel in applicant name. Farm photograph shows cultivated land consistent with documented acreage.',
    reasoning: 'Documents are consistent, plausible, and complete. Verification criteria met.',
  },
  {
    badge: 'REJECTED',
    tone: 'warning',
    type: 'Farmer Verification',
    docs: 'National ID present. Land documentation references a parcel in a different name with no explanation of connection to applicant. Farm photograph shows uncultivated land.',
    reasoning:
      'Documents are inconsistent — land documentation does not connect to applicant identity. Resubmit with documentation that establishes the land connection clearly.',
  },
  {
    badge: 'VERIFIED',
    tone: 'success',
    type: 'Student Portfolio',
    docs: 'Problem Breakdown: clearly defines the problem scope with specific constraints. Approach Plan: methodology appropriate to the problem with justified trade-offs. Reflection: identifies specific failures with analysis, not just description.',
    reasoning:
      'All four rubric dimensions scored at standard. Reflection demonstrates disciplined self-assessment. Peer score and lecturer score consistent.',
  },
  {
    badge: 'REVISION REQUIRED',
    tone: 'warning',
    type: 'Student Portfolio',
    docs: 'Problem Breakdown and Approach Plan meet standard. Reflection describes what was built but does not analyze what failed or what would be done differently.',
    reasoning:
      'Reflection dimension below standard. Specific feedback: the document summarizes the project but does not demonstrate retrospective judgment. Revise to address what failed and why, not just what was done.',
  },
] as const;

const EXAMPLE_TONE: Record<(typeof EXAMPLES)[number]['tone'], { badge: string; reasoning: string }> = {
  success: { badge: 'border-success/40 text-success', reasoning: 'text-success' },
  warning: { badge: 'border-warning/40 text-warning', reasoning: 'text-warning' },
};

const APPEAL_COLUMNS = [
  {
    title: 'Farmers and Suppliers',
    window: '30-day window from decision date',
    steps: [
      'Submit appeal to verification@umojahub.org with specific grounds',
      'Administrator reviews original decision with fresh eyes — independent of first reviewer',
      'Response within 5 business days',
      'Unresolved: escalation to platform governance contact',
    ],
  },
  {
    title: 'Students',
    window: '72 hours from decision date',
    steps: [
      'Submit appeal to education@umojahub.org with specific grounds for dispute',
      'REVISION_REQUIRED decisions can be appealed if feedback is unclear or unactionable',
      'Response within 48 hours',
      'Conflict of interest claims: separate process — state the reviewer name and nature of conflict',
    ],
  },
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const SECTION_LABEL = 'font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle';
const FIELD_LABEL = 'text-xs font-semibold uppercase tracking-wide text-fg-subtle';

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-7 py-24`}>
          <p className={SECTION_LABEL}>Team</p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Who decides.
            <br />
            Why names are published.
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-fg-muted">
            Anonymous governance is not governance. A farmer submitting identity documents to an
            unnamed entity has no basis for trust. Named administrators with stated credentials are the
            accountability mechanism.
          </p>
        </div>
      </section>

      {/* S1 — Admin Profiles */}
      <section className="bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 01</p>
          <p className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Who makes verification decisions
          </p>
          <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
            Profiles are role-based. Personal names will be published when hiring is finalised. Each
            administrator is responsible for specific verification queues.
          </p>

          <div className="flex w-full flex-col gap-6 md:flex-row">
            {ADMINS.map((admin) => (
              <div key={admin.id} className="flex flex-1 flex-col rounded-sm border border-border bg-surface">
                {/* Card header */}
                <div className="flex flex-col gap-3 border-b border-border px-8 pb-6 pt-8">
                  <div className="inline-flex self-start items-center rounded-sm bg-brand px-2.5 py-1.5">
                    <span className="font-ibm-mono text-xs tracking-wide text-brand-fg">{admin.id}</span>
                  </div>
                  <p className="text-lg font-semibold leading-snug text-fg">{admin.title}</p>
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-5 px-8 pb-8 pt-7">
                  <p className={FIELD_LABEL}>Credentials</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{admin.credentials}</p>
                  <p className={FIELD_LABEL}>Verification queues</p>
                  {admin.queues.map((q) => (
                    <div key={q} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 bg-brand" />
                      <p className="text-sm text-fg-muted">{q}</p>
                    </div>
                  ))}
                  <p className={FIELD_LABEL}>Appeals contact</p>
                  <p className="font-ibm-mono text-sm text-brand">{admin.contact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* S2 — Decision Scope */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 02</p>
          <p className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            What each administrator decides
          </p>

          {SCOPE_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex w-full flex-col gap-5 rounded-sm border border-border bg-surface px-10 py-8"
            >
              <p className="text-xl font-semibold leading-snug text-fg">{item.title}</p>
              <div className="flex w-full flex-col gap-6 md:flex-row md:gap-10">
                <div className="flex flex-1 flex-col gap-2">
                  <p className={FIELD_LABEL}>Reviews</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{item.reviews}</p>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <p className={FIELD_LABEL}>Criteria</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{item.criteria}</p>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <p className={FIELD_LABEL}>Not assessed</p>
                  <p className="text-sm leading-relaxed text-fg-muted">{item.notAssessed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* S3 — Decision Examples */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 03</p>
          <p className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Decision attribution examples
          </p>
          <p className="max-w-3xl text-lg leading-relaxed text-fg-muted">
            Anonymized examples showing what a complete decision looks like in each direction. These
            are not hypotheticals — they represent the actual criteria applied.
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {EXAMPLES.map((ex) => (
              <div
                key={ex.badge}
                className="flex flex-col gap-4 rounded-sm border border-border bg-surface px-7 py-8"
              >
                <div
                  className={`inline-flex self-start items-center rounded-sm border px-2.5 py-1.5 ${EXAMPLE_TONE[ex.tone].badge}`}
                >
                  <span className="font-ibm-mono text-xs tracking-wide">{ex.badge}</span>
                </div>
                <p className="text-base font-semibold leading-snug text-fg">{ex.type}</p>
                <p className={FIELD_LABEL}>Documents reviewed</p>
                <p className="text-sm leading-relaxed text-fg-muted">{ex.docs}</p>
                <p className={FIELD_LABEL}>Decision reasoning</p>
                <p className={`text-sm leading-relaxed ${EXAMPLE_TONE[ex.tone].reasoning}`}>
                  {ex.reasoning}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* S4 — Appeals */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
          <p className={SECTION_LABEL}>Section 04</p>
          <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
            Appeals process
          </p>

          <div className="flex w-full flex-col gap-6 md:flex-row">
            {APPEAL_COLUMNS.map((col) => (
              <div
                key={col.title}
                className="flex flex-1 flex-col gap-5 border-l-2 border-brand bg-surface px-8 py-9"
              >
                <p className="text-xl font-semibold leading-snug text-fg">{col.title}</p>
                <p className="text-sm leading-snug text-fg-subtle">{col.window}</p>
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
