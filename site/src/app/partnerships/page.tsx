import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { DataTable } from '@/components/ui/DataTable';
import { TrackLabel } from '@/components/ui/TrackLabel';
import { TextLink } from '@/components/ui/TextLink';

export const metadata: Metadata = {
  title: 'Partnerships & Pilot Onboarding',
  description:
    'Cohort 2026 institutional access — verified node onboarding for universities, NGOs, and farmer cooperatives.',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const COHORT_PARAMS = [
  { indicator: 'Cohort Cycle',              value: 'Annual — Opens January, Closes March 31' },
  { indicator: 'Institution Types',         value: 'Accredited Universities / NGOs / Farmer Cooperatives' },
  { indicator: 'Verification Node Slots',   value: '12 institutions per cohort (current: 4 filled)' },
  { indicator: 'Minimum Operational Scale', value: '500+ enrolled students OR 1,000+ farmer members' },
  { indicator: 'Data Jurisdiction',         value: 'Kenya, Uganda, Tanzania — EAC member states only' },
  { indicator: 'Review Timeline',           value: '6–8 weeks from complete submission receipt' },
];

interface TierRow {
  readonly label: string;
  readonly academic: string;
  readonly agricultural: string;
}

const TIER_ROWS: TierRow[] = [
  {
    label:        'Integration Scope',
    academic:     'Knowledge hub access, academic verification API, student content pipeline, AI mentor integration',
    agricultural: 'Marketplace listing API, M-Pesa payment gateway, trust score node, cooperative group management',
  },
  {
    label:        'Institution Requirements',
    academic:     'Accreditation: CUE or TVETA. Min 500 enrolled agri-students. Designated IT administrator required.',
    agricultural: 'Legal registration: NGO Bureau or Cooperative Societies Act. Min 1,000 farmer members. EAC-geofenced.',
  },
  {
    label:        'Verification Capacity',
    academic:     'Up to 2,000 student verifications/year. Lecturer pool: min 3 verified subject-matter experts.',
    agricultural: 'Up to 5,000 farmer verifications/year. Cooperative officer designated as verification administrator.',
  },
  {
    label:        'Data Access Level',
    academic:     'Student enrollment records (read). Academic content contribution (write). No farmer PII access.',
    agricultural: 'Farmer identity records (write). Market pricing data (read/write). No student academic record access.',
  },
  {
    label:        'Annual Reporting',
    academic:     'Verification accuracy audit — Q2 and Q4. Submitted to UmojaHub Academic Integrity Board.',
    agricultural: 'Transaction volume report — monthly. Submitted to UmojaHub Agricultural Trust Council.',
  },
  {
    label:        'Operational SLA',
    academic:     '99.5% API uptime guarantee. 48-hour breach notification. Annual penetration test required.',
    agricultural: '99.2% API uptime guarantee. 72-hour breach notification. Cooperative charter renewal required yearly.',
  },
];

type StageTrack = 'gold' | 'blue' | 'both' | 'verified' | 'terminated';

interface OnboardingStage {
  readonly num: string;
  readonly title: string;
  readonly duration: string;
  readonly trackLabel: StageTrack;
  readonly barClass: string;
  readonly numClass: string;
  readonly items: readonly string[];
}

const ONBOARDING_STAGES: OnboardingStage[] = [
  {
    num:        '01',
    title:      'Administrative Charter Verification',
    duration:   'Weeks 1–2',
    trackLabel: 'both',
    barClass:   'bg-track-blue',
    numClass:   'text-track-blue',
    items: [
      'Legal charter document submission',
      'Accreditation body cross-reference',
      'Board resolution or cooperative certificate',
      'Primary contact identity verification',
    ],
  },
  {
    num:        '02',
    title:      'Platform Integration Assessment',
    duration:   'Weeks 2–3',
    trackLabel: 'both',
    barClass:   'bg-track-blue',
    numClass:   'text-track-blue',
    items: [
      'IT infrastructure compatibility check',
      'API access credential provisioning',
      'Test environment integration',
      'Security posture review',
    ],
  },
  {
    num:        '03',
    title:      'Data Sovereignty Agreement',
    duration:   'Weeks 3–4',
    trackLabel: 'both',
    barClass:   'bg-state-verified',
    numClass:   'text-state-verified',
    items: [
      'DPA signing — Kenya ODPC Form B2',
      'Cross-border transfer prohibition sign-off',
      'Training exclusion clause review',
      'Data retention period confirmation',
    ],
  },
  {
    num:        '04',
    title:      'Administrator Pool Onboarding',
    duration:   'Weeks 4–5',
    trackLabel: 'blue',
    barClass:   'bg-track-blue',
    numClass:   'text-track-blue',
    items: [
      'Min. 3 designated administrators verified',
      'Role assignment: LECTURER or CO-OP OFFICER',
      'Content moderation training completion',
      'Emergency protocol acknowledgement',
    ],
  },
  {
    num:        '05',
    title:      'Pilot Cohort Activation',
    duration:   'Weeks 6–8',
    trackLabel: 'both',
    barClass:   'bg-state-verified',
    numClass:   'text-state-verified',
    items: [
      'First 50 users onboarded under supervision',
      'Verification accuracy baseline established',
      'Trust score calibration for node',
      'Full production access granted',
    ],
  },
];

interface FormField {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly inputType: string;
  readonly inputMode?: 'numeric' | 'tel' | 'email' | 'text';
}

const ENTITY_FIELDS: FormField[] = [
  { id: 'entity-legal-name',   label: 'LEGAL INSTITUTION NAME',          hint: 'As registered with accreditation body',                              inputType: 'text' },
  { id: 'entity-charter-id',   label: 'CHARTER / REGISTRATION NUMBER',   hint: 'National registration authority ID',                                 inputType: 'text' },
  { id: 'entity-country',      label: 'COUNTRY OF REGISTRY',             hint: 'EAC member states only — KE / UG / TZ / RW / BI / SS',              inputType: 'text' },
  { id: 'entity-type',         label: 'INSTITUTION TYPE',                hint: 'UNIVERSITY / TECHNICAL INSTITUTE / NGO / COOPERATIVE',              inputType: 'text' },
  { id: 'entity-track',        label: 'TRACK SELECTION',                 hint: 'ACADEMIC TRACK or AGRICULTURAL TRACK — select one',                 inputType: 'text' },
];

const OPERATIONAL_FIELDS: FormField[] = [
  { id: 'ops-volume',          label: 'EXPECTED ANNUAL USER VOLUME',     hint: 'Students enrolled / farmers registered',                            inputType: 'text', inputMode: 'numeric' },
  { id: 'ops-use-case',        label: 'PRIMARY VERIFICATION USE CASE',   hint: 'Student identity / Farmer cooperative ID / Both',                  inputType: 'text' },
  { id: 'ops-infrastructure',  label: 'EXISTING DIGITAL INFRASTRUCTURE', hint: 'LMS / ERP / MIS system currently in use, or NONE',                 inputType: 'text' },
  { id: 'ops-counties',        label: 'COUNTIES / DISTRICTS OF OPERATION', hint: 'List all active geographic areas of operation',                  inputType: 'text' },
  { id: 'ops-api-tier',        label: 'REQUESTED API ACCESS TIER',       hint: 'STANDARD (1K req/day) / EXTENDED (10K req/day)',                   inputType: 'text' },
];

const CONTACT_FIELDS: FormField[] = [
  { id: 'contact-name',        label: 'DESIGNATED ADMINISTRATOR NAME',   hint: 'Full legal name — no initials',                                     inputType: 'text' },
  { id: 'contact-email',       label: 'OFFICIAL INSTITUTIONAL EMAIL',    hint: 'Must be @institution.ac.ke domain or equivalent',                  inputType: 'email',  inputMode: 'email' },
  { id: 'contact-title',       label: 'ADMINISTRATOR TITLE / ROLE',      hint: 'e.g. Deputy Vice Chancellor, Cooperative Secretary',               inputType: 'text' },
  { id: 'contact-phone',       label: 'DIRECT TELEPHONE (COUNTRY CODE)', hint: '+254 / +256 / +255 only',                                          inputType: 'tel',    inputMode: 'tel' },
];

const SLA_FIELDS = [
  { indicator: 'API Uptime',          value: '99.5% Academic / 99.2% Agricultural' },
  { indicator: 'Maintenance Window',  value: 'Sundays 02:00–04:00 EAT — 72hr notice' },
  { indicator: 'Incident Response',   value: 'P0: 1hr / P1: 4hr / P2: 24hr' },
  { indicator: 'Breach Notification', value: 'Academic: 48hr / Agricultural: 72hr' },
  { indicator: 'Annual Pen. Test',    value: 'Required — certificate to UmojaHub' },
];

const DPT_FIELDS = [
  { indicator: 'Legal Basis',        value: 'Kenya Data Protection Act 2019 — Art. 30' },
  { indicator: 'Data Residency',     value: 'Kenya AWS af-south-1 — no cross-border' },
  { indicator: 'Retention Period',   value: 'Active partnership + 3 years post-exit' },
  { indicator: 'Right to Erasure',   value: 'User-initiated — 30-day fulfilment window' },
  { indicator: 'Audit Log Access',   value: 'Via DPA request — 14-day turnaround' },
];

const TERMINATION_FIELDS = [
  { indicator: 'Notice Period',      value: '90 days written notice — partnerships@umojahub.co.ke' },
  { indicator: 'Data Export Window', value: '60 days from termination notice to export' },
  { indicator: 'Node Sunset',        value: 'All credentials revoked at termination + 30 days' },
  { indicator: 'Re-application',     value: '12-month exclusion after voluntary exit' },
  { indicator: 'Immediate Exit',     value: 'Charter fraud / data breach / ODPC non-compliance' },
];

// ─── Shared field renderer ─────────────────────────────────────────────────

interface FormFieldProps {
  readonly field: FormField;
  readonly accentClass: string;
}

function ManifestField({ field, accentClass }: FormFieldProps) {
  return (
    <label className="block" htmlFor={field.id}>
      <span className={`eyebrow ${accentClass}`}>{field.label}</span>
      <input
        id={field.id}
        type={field.inputType}
        inputMode={field.inputMode}
        placeholder={field.hint}
        autoComplete="off"
        spellCheck={false}
        className={[
          'w-full bg-transparent border-b border-rule mt-1 py-2',
          'font-mono text-m1 text-text-primary',
          'placeholder:text-text-disabled',
          'focus:outline-none focus:border-track-blue',
          'transition-colors duration-150',
        ].join(' ')}
      />
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnershipsPage() {
  return (
    <PageShell>

      {/* ── S1: Intake Declaration ─────────────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-track-gold mb-10">
          COHORT 2026 — INSTITUTIONAL ACCESS
        </p>

        <div className="flex gap-16">

          {/* 5-column left — Playfair italic declaration */}
          <div className="col-5">
            <h1 className="font-editorial text-[54px] leading-[68px] font-normal text-text-primary">
              UmojaHub is accepting<br />
              institutional partners<br />
              <em className="text-text-secondary">for verified node access in 2026.</em>
            </h1>
            <p className="font-institutional text-i2 text-text-secondary mt-8 leading-relaxed max-w-sm">
              Applications are reviewed on a rolling basis within each cohort window. Incomplete
              submissions are not reviewed. All data submitted is governed by the Kenya Data
              Protection Act 2019.
            </p>
          </div>

          {/* 7-column right — cohort parameters table */}
          <div className="col-7 pt-2">
            <DataTable
              rows={COHORT_PARAMS}
              showHeaders
              indicatorLabel="PARAMETER"
              valueLabel="DETAIL"
              indicatorWidth="w-52"
              auditTimestamp="Cohort 2026 — Application window currently open"
            />
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S2: Partnership Tiers Matrix ───────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-4">PARTNERSHIP TIERS</p>
        <h2 className="font-editorial text-d3 font-normal text-text-primary mb-10">
          Two entry points. One shared verification infrastructure.
        </h2>

        <table className="w-full font-mono text-m1 border-collapse">
          <thead>
            <tr>
              {/* Label column — empty header */}
              <th scope="col" className="w-44 pb-0 align-bottom" />

              {/* Academic Track header */}
              <th scope="col" className="pb-0 text-left align-bottom">
                <div className="border-t-2 border-track-blue pt-3 px-5">
                  <div className="flex items-baseline gap-4">
                    <TrackLabel track="blue" />
                    <span className="font-mono text-m2 text-text-disabled">
                      Universities / Technical Institutes
                    </span>
                  </div>
                </div>
              </th>

              {/* Agricultural Track header */}
              <th scope="col" className="pb-0 text-left align-bottom">
                <div className="border-t-2 border-track-gold pt-3 px-5">
                  <div className="flex items-baseline gap-4">
                    <TrackLabel track="gold" />
                    <span className="font-mono text-m2 text-text-disabled">
                      NGOs / Farmer Cooperatives
                    </span>
                  </div>
                </div>
              </th>
            </tr>

            {/* Full-width divider below headers */}
            <tr aria-hidden="true">
              <td colSpan={3} className="py-0">
                <div className="h-px bg-rule" />
              </td>
            </tr>
          </thead>

          <tbody>
            {TIER_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-rule">
                <td className="py-4 pr-6 text-text-disabled font-institutional text-i3 align-top">
                  {row.label}
                </td>
                <td className="py-4 px-5 text-text-secondary align-top leading-snug border-l border-rule">
                  {row.academic}
                </td>
                <td className="py-4 px-5 text-text-secondary align-top leading-snug border-l border-rule">
                  {row.agricultural}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <SectionDivider />

      {/* ── S3: Verification Node Onboarding Process ───────────────────────── */}
      <section className="canvas-inner section-pad">
        <div className="flex gap-16 mb-10">
          <div className="col-5">
            <p className="eyebrow text-text-disabled mb-4">VERIFICATION NODE ONBOARDING</p>
            <h2 className="font-editorial text-d3 font-normal text-text-primary leading-snug">
              From administrative charter<br />
              <em className="text-text-secondary">to first verified transaction: 5 stages.</em>
            </h2>
          </div>
          <div className="col-7 flex items-end">
            <p className="font-mono text-m2 text-text-secondary leading-snug">
              Estimated total timeline: 6–8 weeks from complete submission receipt.
              Stage 04 applies to the Academic Track only — Agricultural Track proceeds directly
              to Stage 05 upon Stage 03 completion.
            </p>
          </div>
        </div>

        {/* Five-stage horizontal grid */}
        <div className="grid grid-cols-5 gap-4">
          {ONBOARDING_STAGES.map((stage) => (
            <div key={stage.num}>
              {/* Track-colored top bar */}
              <div className={`h-0.5 ${stage.barClass}`} aria-hidden="true" />

              <div className="pt-4">
                {/* Stage number + track label */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className={`font-mono text-[20px] leading-none ${stage.numClass}`}>
                    {stage.num}
                  </span>
                  <TrackLabel track={stage.trackLabel} />
                </div>

                {/* Stage title */}
                <p className="font-institutional text-i3 font-medium text-text-primary leading-snug">
                  {stage.title}
                </p>

                {/* Duration */}
                <p className="font-mono text-m3 text-text-disabled mt-1.5 tracking-wide">
                  {stage.duration}
                </p>

                {/* Item list */}
                <div className="mt-3 pt-3 border-t border-rule space-y-1.5">
                  {stage.items.map((item) => (
                    <p key={item} className="font-mono text-m3 text-text-disabled leading-snug">
                      — {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── S4: Institutional Intake Manifest ──────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-4">INSTITUTIONAL INTAKE MANIFEST</p>
        <div className="flex gap-16 mb-10">
          <div className="col-5">
            <h2 className="font-editorial text-d3 font-normal text-text-primary leading-snug">
              Complete all fields.<br />
              <em className="text-text-secondary">Incomplete submissions are not reviewed.</em>
            </h2>
          </div>
          <div className="col-7 flex items-end">
            <p className="font-mono text-m2 text-text-secondary leading-snug">
              This manifest is a binding intake document. Submission confirms agreement with
              UmojaHub&apos;s Institutional Partnership Framework v2.1 (2026). Falsified submissions
              are grounds for permanent exclusion from all cohorts.
            </p>
          </div>
        </div>

        {/* Three-column form grid */}
        <div className="grid grid-cols-3 gap-12">

          {/* Column A — Entity Credentials */}
          <div>
            <p className="eyebrow text-track-blue mb-6">A — ENTITY CREDENTIALS</p>
            <div className="space-y-6">
              {ENTITY_FIELDS.map((field) => (
                <ManifestField key={field.id} field={field} accentClass="text-track-blue" />
              ))}
            </div>
          </div>

          {/* Column B — Operational Scope */}
          <div>
            <p className="eyebrow text-track-gold mb-6">B — OPERATIONAL SCOPE</p>
            <div className="space-y-6">
              {OPERATIONAL_FIELDS.map((field) => (
                <ManifestField key={field.id} field={field} accentClass="text-track-gold" />
              ))}
            </div>
          </div>

          {/* Column C — Administrative Contact */}
          <div>
            <p className="eyebrow text-text-disabled mb-6">C — ADMINISTRATIVE CONTACT</p>
            <div className="space-y-6">
              {CONTACT_FIELDS.map((field) => (
                <ManifestField key={field.id} field={field} accentClass="text-text-disabled" />
              ))}
            </div>

            {/* Submission instruction */}
            <div className="mt-8 pt-6 border-t border-rule">
              <p className="font-mono text-m3 text-text-disabled leading-snug tracking-wide">
                Submit completed manifest to:
              </p>
              <p className="font-mono text-m2 text-text-secondary mt-1">
                partnerships@umojahub.co.ke
              </p>
              <p className="font-mono text-m3 text-text-disabled mt-2 leading-snug">
                Subject line: [COHORT 2026] [INSTITUTION NAME] — INTAKE MANIFEST
              </p>
            </div>
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S5: Legal & Data Sovereign Footprint ───────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">
          OPERATIONAL SLA & DATA PROCESSING TERMS
        </p>

        <div className="grid grid-cols-3 divide-x divide-rule">

          {/* Column 1 — Service Level Agreement */}
          <div className="pr-10">
            <p className="eyebrow text-track-blue mb-5">SERVICE LEVEL AGREEMENT</p>
            <DataTable
              rows={SLA_FIELDS}
              showHeaders={false}
              indicatorWidth="w-40"
            />
          </div>

          {/* Column 2 — Data Processing Terms */}
          <div className="px-10">
            <p className="eyebrow text-state-verified mb-5">DATA PROCESSING TERMS</p>
            <DataTable
              rows={DPT_FIELDS}
              showHeaders={false}
              indicatorWidth="w-36"
            />
          </div>

          {/* Column 3 — Partnership Termination */}
          <div className="pl-10">
            <p className="eyebrow text-state-terminated mb-5">PARTNERSHIP TERMINATION</p>
            <DataTable
              rows={TERMINATION_FIELDS}
              showHeaders={false}
              indicatorWidth="w-36"
            />
            <p className="font-mono text-m3 text-text-disabled mt-5 leading-snug tracking-wide">
              Framework version: IPF-2026-v2.1 — Last reviewed: 2026-01-15 —
              Legal counsel: Kimura &amp; Associates, Nairobi
            </p>
          </div>

        </div>

        {/* Closing statement */}
        <div className="mt-20 flex flex-col items-center text-center">
          <p className="font-editorial text-d3 italic font-normal text-text-primary">
            Every verified node strengthens the entire network.
          </p>
          <div className="flex items-center gap-10 mt-8">
            <TextLink href="/verification">
              Review the verification model
            </TextLink>
            <div className="w-px h-4 bg-rule" aria-hidden="true" />
            <TextLink href="/ai-safety">
              Review AI safety documentation
            </TextLink>
            <div className="w-px h-4 bg-rule" aria-hidden="true" />
            <TextLink href="/">
              Return to infrastructure overview
            </TextLink>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
