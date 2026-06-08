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

const EXAMPLES_ROW1 = [
  {
    badge: 'APPROVED',
    badgeBorder: 'border-[#2E7D78]',
    badgeText: 'text-[#2E7D78]',
    bg: 'bg-[#E5ECE8]',
    type: 'Farmer Verification',
    docs: 'National ID present. Land documentation shows registered parcel in applicant name. Farm photograph shows cultivated land consistent with documented acreage.',
    reasoning: 'Documents are consistent, plausible, and complete. Verification criteria met.',
    reasoningColor: 'text-[#2E7D78]',
  },
  {
    badge: 'REJECTED',
    badgeBorder: 'border-[#B86A3D]',
    badgeText: 'text-[#B86A3D]',
    bg: 'bg-[#EFE7DA]',
    type: 'Farmer Verification',
    docs: 'National ID present. Land documentation references a parcel in a different name with no explanation of connection to applicant. Farm photograph shows uncultivated land.',
    reasoning:
      'Documents are inconsistent — land documentation does not connect to applicant identity. Resubmit with documentation that establishes the land connection clearly.',
    reasoningColor: 'text-[#B86A3D]',
  },
] as const;

const EXAMPLES_ROW2 = [
  {
    badge: 'VERIFIED',
    badgeBorder: 'border-[#2E7D78]',
    badgeText: 'text-[#2E7D78]',
    bg: 'bg-[#E5ECE8]',
    type: 'Student Portfolio',
    docs: 'Problem Breakdown: clearly defines the problem scope with specific constraints. Approach Plan: methodology appropriate to the problem with justified trade-offs. Reflection: identifies specific failures with analysis, not just description.',
    reasoning:
      'All four rubric dimensions scored at standard. Reflection demonstrates disciplined self-assessment. Peer score and lecturer score consistent.',
    reasoningColor: 'text-[#2E7D78]',
  },
  {
    badge: 'REVISION REQUIRED',
    badgeBorder: 'border-[#8B6544]',
    badgeText: 'text-[#8B6544]',
    bg: 'bg-[#EFE7DA]',
    type: 'Student Portfolio',
    docs: 'Problem Breakdown and Approach Plan meet standard. Reflection describes what was built but does not analyze what failed or what would be done differently.',
    reasoning:
      'Reflection dimension below standard. Specific feedback: the document summarizes the project but does not demonstrate retrospective judgment. Revise to address what failed and why, not just what was done.',
    reasoningColor: 'text-[#8B6544]',
  },
] as const;

const FARMERS_STEPS = [
  'Submit appeal to verification@umojahub.org with specific grounds',
  'Administrator reviews original decision with fresh eyes — independent of first reviewer',
  'Response within 5 business days',
  'Unresolved: escalation to platform governance contact',
] as const;

const STUDENT_STEPS = [
  'Submit appeal to education@umojahub.org with specific grounds for dispute',
  'REVISION_REQUIRED decisions can be appealed if feedback is unclear or unactionable',
  'Response within 48 hours',
  'Conflict of interest claims: separate process — state the reviewer name and nature of conflict',
] as const;

export default function TeamPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#131619] px-[160px] py-[120px] flex flex-col gap-7">
        <p className="font-jakarta font-500 text-[0.875rem] tracking-[0.02em] text-[#878078]">
          Team
        </p>
        <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] w-[900px]">
          Who decides.
          <br />
          Why names are published.
        </h1>
        <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A] w-[800px]">
          Anonymous governance is not governance. A farmer submitting identity documents to an
          unnamed entity has no basis for trust. Named administrators with stated credentials are the
          accountability mechanism.
        </p>
      </section>

      {/* S1 — Admin Profiles */}
      <section className="bg-[#F5F4F0] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 01
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[900px]">
          Who makes verification decisions
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#636C76] w-[760px]">
          Profiles are role-based. Personal names will be published when hiring is finalised. Each
          administrator is responsible for specific verification queues.
        </p>

        <div className="flex gap-6 w-full">
          {ADMINS.map((admin) => (
            <div
              key={admin.id}
              className="flex-1 bg-[#ECE8E1] border border-[#C8C2BA] flex flex-col"
            >
              {/* Card header */}
              <div className="bg-white border-b border-[#C8C2BA] pt-8 pb-6 px-8 flex flex-col gap-3">
                <div className="inline-flex self-start items-center bg-[#2E7D78] px-[10px] py-[6px]">
                  <span className="font-ibm-mono not-italic text-[0.6875rem] tracking-[0.02em] text-[#F2F0EC]">
                    {admin.id}
                  </span>
                </div>
                <p className="font-jakarta font-600 text-[1.125rem] leading-[1.35] text-[#1D232A]">
                  {admin.title}
                </p>
              </div>

              {/* Card body */}
              <div className="bg-white pt-7 pb-8 px-8 flex flex-col gap-5">
                <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#8A919A] uppercase">
                  Credentials
                </p>
                <p className="font-jakarta font-400 text-[0.9375rem] leading-[1.6] text-[#353C45]">
                  {admin.credentials}
                </p>
                <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#8A919A] uppercase">
                  Verification queues
                </p>
                {admin.queues.map((q) => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="shrink-0 size-[6px] bg-[#2E7D78]" />
                    <p className="font-jakarta font-400 text-[0.9375rem] text-[#353C45]">{q}</p>
                  </div>
                ))}
                <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#8A919A] uppercase">
                  Appeals contact
                </p>
                <p className="font-ibm-mono not-italic text-[0.875rem] text-[#2E7D78]">
                  {admin.contact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* S2 — Decision Scope */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 02
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] w-[900px]">
          What each administrator decides
        </p>

        {SCOPE_ITEMS.map((item) => (
          <div
            key={item.title}
            className="bg-[#1B2025] border border-[#2A3138] px-10 py-8 flex flex-col gap-5 w-full"
          >
            <p className="font-jakarta font-600 text-[1.25rem] leading-[1.3] text-[#F2F0EC]">
              {item.title}
            </p>
            <div className="flex gap-10 w-full">
              <div className="flex-1 flex flex-col gap-2">
                <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#878078] uppercase">
                  Reviews
                </p>
                <p className="font-jakarta font-400 text-[0.875rem] leading-[1.6] text-[#A9A29A]">
                  {item.reviews}
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#878078] uppercase">
                  Criteria
                </p>
                <p className="font-jakarta font-400 text-[0.875rem] leading-[1.6] text-[#A9A29A]">
                  {item.criteria}
                </p>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#878078] uppercase">
                  Not assessed
                </p>
                <p className="font-jakarta font-400 text-[0.875rem] leading-[1.6] text-[#A9A29A]">
                  {item.notAssessed}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* S3 — Decision Examples */}
      <section className="bg-[#ECE8E1] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#8A919A] uppercase">
          Section 03
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#1D232A] leading-[1.15] w-[900px]">
          Decision attribution examples
        </p>
        <p className="font-jakarta font-400 text-[1.125rem] leading-[1.6] text-[#636C76] w-[760px]">
          Anonymized examples showing what a complete decision looks like in each direction. These
          are not hypotheticals — they represent the actual criteria applied.
        </p>

        {/* Row 1 */}
        <div className="flex gap-5 w-full">
          {EXAMPLES_ROW1.map((ex) => (
            <div
              key={ex.badge}
              className={`flex-1 ${ex.bg} border border-[#C8C2BA] px-7 py-8 flex flex-col gap-4`}
            >
              <div className={`inline-flex self-start items-center border ${ex.badgeBorder} px-[10px] py-[6px]`}>
                <span className={`font-ibm-mono not-italic text-[0.6875rem] tracking-[0.04em] ${ex.badgeText}`}>
                  {ex.badge}
                </span>
              </div>
              <p className="font-jakarta font-600 text-[1rem] leading-[1.3] text-[#1D232A]">
                {ex.type}
              </p>
              <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#8A919A] uppercase">
                Documents reviewed
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] leading-[1.6] text-[#353C45]">
                {ex.docs}
              </p>
              <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#8A919A] uppercase">
                Decision reasoning
              </p>
              <p className={`font-jakarta font-400 text-[0.875rem] leading-[1.6] ${ex.reasoningColor}`}>
                {ex.reasoning}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex gap-5 w-full">
          {EXAMPLES_ROW2.map((ex) => (
            <div
              key={ex.badge}
              className={`flex-1 ${ex.bg} border border-[#C8C2BA] px-7 py-8 flex flex-col gap-4`}
            >
              <div className={`inline-flex self-start items-center border ${ex.badgeBorder} px-[10px] py-[6px]`}>
                <span className={`font-ibm-mono not-italic text-[0.6875rem] tracking-[0.04em] ${ex.badgeText}`}>
                  {ex.badge}
                </span>
              </div>
              <p className="font-jakarta font-600 text-[1rem] leading-[1.3] text-[#1D232A]">
                {ex.type}
              </p>
              <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#8A919A] uppercase">
                Documents reviewed
              </p>
              <p className="font-jakarta font-400 text-[0.875rem] leading-[1.6] text-[#353C45]">
                {ex.docs}
              </p>
              <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.04em] text-[#8A919A] uppercase">
                Decision reasoning
              </p>
              <p className={`font-jakarta font-400 text-[0.875rem] leading-[1.6] ${ex.reasoningColor}`}>
                {ex.reasoning}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* S4 — Appeals */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col gap-10">
        <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.08em] text-[#878078] uppercase">
          Section 04
        </p>
        <p className="font-jakarta font-600 text-[2.75rem] tracking-[-0.02em] text-[#F2F0EC] leading-[1.15] w-[800px]">
          Appeals process
        </p>

        <div className="flex gap-6 w-full">
          {/* Farmers and Suppliers */}
          <div className="flex-1 bg-[#1B2025] border-l-[3px] border-[#B86A3D] px-8 py-9 flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[1.25rem] leading-[1.3] text-[#F2F0EC]">
              Farmers and Suppliers
            </p>
            <p className="font-jakarta font-400 text-[0.875rem] leading-[1.4] text-[#878078]">
              30-day window from decision date
            </p>
            {FARMERS_STEPS.map((step, i) => (
              <div key={step} className="flex gap-4 items-start">
                <span className="shrink-0 font-jakarta font-600 text-[0.8125rem] text-[#B86A3D]">
                  {i + 1}
                </span>
                <p className="flex-1 font-jakarta font-400 text-[0.9375rem] leading-[1.6] text-[#A9A29A]">
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Students */}
          <div className="flex-1 bg-[#1B2025] border-l-[3px] border-[#56A8A2] px-8 py-9 flex flex-col gap-5">
            <p className="font-jakarta font-600 text-[1.25rem] leading-[1.3] text-[#F2F0EC]">
              Students
            </p>
            <p className="font-jakarta font-400 text-[0.875rem] leading-[1.4] text-[#878078]">
              72 hours from decision date
            </p>
            {STUDENT_STEPS.map((step, i) => (
              <div key={step} className="flex gap-4 items-start">
                <span className="shrink-0 font-jakarta font-600 text-[0.8125rem] text-[#56A8A2]">
                  {i + 1}
                </span>
                <p className="flex-1 font-jakarta font-400 text-[0.9375rem] leading-[1.6] text-[#A9A29A]">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
