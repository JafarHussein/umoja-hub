import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { DataTable } from '@/components/ui/DataTable';
import { TextLink } from '@/components/ui/TextLink';
import { TrackLabel } from '@/components/ui/TrackLabel';

export const metadata: Metadata = {
  title: 'Institutional Verification Model',
  description:
    'How UmojaHub establishes ground truth for farmer identity and academic integrity across East Africa.',
};

// ─── Data ────────────────────────────────────────────────────────────────────

const AGRI_VERIFICATION_ROWS = [
  { indicator: 'Accepted documents',    value: 'National ID / Cooperative Card / Passport' },
  { indicator: 'Cross-reference',       value: 'CAK cooperative registry API' },
  { indicator: 'ID number format',      value: '8-digit KRA PIN — alphanumeric CAK prefix' },
  { indicator: 'Physical inspection',   value: 'Required at Tier 2 and above' },
  { indicator: 'Verification expiry',   value: '24 months from last confirmed transaction' },
  { indicator: 'Data handler',          value: 'ODPC-compliant — Kenya Data Protection Act 2019' },
];

const ACADEMIC_INTEGRITY_ROWS = [
  { indicator: 'Accreditation check',   value: 'CUE / TVETA database — live API call' },
  { indicator: 'Program scope',         value: 'Agriculture / Food Science / Environmental Mgmt' },
  { indicator: 'Enrollment status',     value: 'Active registration required at time of submission' },
  { indicator: 'Lecturer credential',   value: 'PhD or 5+ years industry experience — verified' },
  { indicator: 'Content ownership',     value: 'Submitter retains full rights — platform licence only' },
  { indicator: 'Review SLA',            value: '14 calendar days maximum — logged if breached' },
];

interface PipelineStage {
  readonly num: string;
  readonly title: string;
  readonly body: string;
  readonly emphasis?: string;
}

const FARMER_STAGES: PipelineStage[] = [
  {
    num: '01',
    title: 'Document Submission',
    body: 'Farmer uploads National ID scan, Cooperative Card, or Passport via Cloudinary unsigned upload preset. Accepted formats: JPEG, PNG, PDF. Maximum 5MB. Metadata field carries document number — no OCR.',
  },
  {
    num: '02',
    title: 'Format Validation',
    body: 'System checks document type, file format integrity, and Cloudinary AI quality score (minimum 60). Malformed submissions are rejected immediately with a structured error code — no queue entry is created.',
  },
  {
    num: '03',
    title: 'Document Number Extraction',
    body: 'Number validated per type: National ID (8-digit numeric), Cooperative Card (alphanumeric CAK prefix), Passport (KE + 7 alphanumeric). Format failure returns 400 VALIDATION_FAILED — resubmission permitted.',
  },
  {
    num: '04',
    title: 'Registry Cross-Reference',
    body: 'Number matched against the Cooperatives Authority of Kenya (CAK) registry API. Passport holders cross-referenced against DRC-linked immigration records. No registry data is stored — result is MATCH or NO_MATCH only.',
  },
  {
    num: '05',
    title: 'KYC Administrator Assignment',
    body: 'Application enters the admin verification queue (GET /api/admin/verification-queue) as PENDING. Queue is FIFO with priority override for re-applications. Admins have 72 hours before auto-escalation to senior reviewer.',
  },
  {
    num: '06',
    title: 'Human Review & Decision',
    body: 'Administrator compares document image against registry record. Decision written via PATCH /api/admin/verify-farmer with status: APPROVED | REJECTED | ADDITIONAL_DOCS_REQUIRED. Rejection mandates a reason code.',
  },
  {
    num: '07',
    title: 'Trust Score Initialization',
    body: 'On APPROVED: FarmerTrustScore document is created with compositeScore: 0, tier: BRONZE. Farmer gains VERIFIED status and can publish marketplace listings. Score accumulates with each completed, rated transaction.',
  },
];

const ACADEMIC_STAGES: PipelineStage[] = [
  {
    num: '01',
    title: 'Content Submission',
    body: 'Lecturer or student submits article with topic classification, minimum two institutional source citations, and a category tag. Submissions without citations are rejected at intake with code MISSING_CITATIONS.',
  },
  {
    num: '02',
    title: 'AI Pre-Screening',
    body: 'Groq LLM checks for prohibited output types: fabricated data, uncited claims, and creative generation. Every token of the AI session is written to the permanent audit log. A PROHIBITED_OUTPUT flag triggers an immediate content hold.',
  },
  {
    num: '03',
    title: 'Reviewer Selection',
    body: 'System selects from the verified LECTURER pool using subject-area matching. Selection excludes the submitter\'s own institution to prevent in-network bias. No manual reviewer request path exists at any permission level.',
  },
  {
    num: '04',
    title: 'Admin Assignment Lock',
    body: 'Reviewer identity is hashed in all student-visible records. Reviewer has 14 calendar days to complete the rubric assessment. SLA breach is logged against the institution\'s compliance record — not the individual reviewer.',
    emphasis: 'Admin assigns reviewer from verified pool — student has zero input.',
  },
  {
    num: '05',
    title: 'Final Publication Decision',
    body: 'Reviewer submits scored rubric (40/35/25 weighting). Decision written as: PUBLISHED | DRAFT | ARCHIVED. Decision, ISO 8601 timestamp, reviewer hash, and score breakdown are written to an immutable MongoDB record. No post-decision edits are possible.',
  },
];

interface RubricWeight {
  readonly weight: string;
  readonly label: string;
  readonly note: string;
}

const RUBRIC_WEIGHTS: RubricWeight[] = [
  { weight: '40', label: 'Factual accuracy',         note: 'Verifiable against KALRO or accredited extension data' },
  { weight: '35', label: 'Practical applicability',  note: 'Actionable guidance for smallholder farming context' },
  { weight: '25', label: 'Citation quality',          note: 'Peer-reviewed or institutional sources required' },
];

const ASSIGNMENT_PROTOCOL = [
  { indicator: 'Reviewer pool',        value: 'Verified LECTURER status only' },
  { indicator: 'Self-assignment',      value: 'Prohibited — enforced at query level' },
  { indicator: 'Conflict of interest', value: 'Same institution — automatic disqualification' },
  { indicator: 'Max active reviews',   value: '3 concurrent per lecturer' },
  { indicator: 'Assignment expiry',    value: '72 hours — then auto-reassignment + log entry' },
];

const AUDIT_RECORD_FIELDS = [
  { indicator: 'decision',         value: 'PUBLISHED | DRAFT | ARCHIVED' },
  { indicator: 'timestamp',        value: 'ISO 8601 — stored in UTC+3 (EAT)' },
  { indicator: 'reviewer_id',      value: 'SHA-256 hash — permanent, non-reversible' },
  { indicator: 'score_breakdown',  value: 'Object — per rubric item, immutable' },
  { indicator: 'editable',         value: 'false — enforced at schema level' },
  { indicator: 'ttl',              value: 'never — retained indefinitely per DPA' },
];

interface FraudRow {
  readonly threat: string;
  readonly mechanism: string;
  readonly detection: string;
  readonly outcome: string;
}

const FRAUD_MATRIX: FraudRow[] = [
  {
    threat:    'Document forgery',
    mechanism: 'Cloudinary metadata extraction + file hash comparison',
    detection: 'Hash mismatch against previously submitted document registry',
    outcome:   'Immediate rejection + 12-month application ban',
  },
  {
    threat:    'Identity spoofing',
    mechanism: 'CAK registry cross-reference + ODPC name validation',
    detection: 'Name or ID mismatch flagged by automated cross-check',
    outcome:   'Account freeze + manual admin escalation',
  },
  {
    threat:    'AI content laundering',
    mechanism: 'Token-level audit log + prohibited output classifier',
    detection: 'PROHIBITED_OUTPUT tag detected in stored AI session',
    outcome:   'Content blocked + immutable incident record created',
  },
  {
    threat:    'Peer review collusion',
    mechanism: 'Conflict-of-interest graph — institution + co-author edges',
    detection: 'Reviewer-submitter institutional connection identified',
    outcome:   'Automatic reassignment + incident flag on both records',
  },
  {
    threat:    'Duplicate accounts',
    mechanism: 'Phone number deduplication + session device fingerprint',
    detection: 'Duplicate phone or device signature matched to existing user',
    outcome:   'Secondary account disabled + primary account flagged',
  },
  {
    threat:    'Cooperative ghost members',
    mechanism: 'Transaction activity threshold check — 90-day rolling window',
    detection: 'Zero marketplace activity — listing or order — in 90 days',
    outcome:   'Trust score decay applied + manual review trigger issued',
  },
];

interface AccessibleField {
  readonly field: string;
  readonly type: string;
  readonly note: string;
}

interface RestrictedField {
  readonly field: string;
  readonly reason: string;
}

const ACCESSIBLE_FIELDS: AccessibleField[] = [
  { field: 'student_id',           type: 'string',    note: 'SHA-256, institution-scoped only' },
  { field: 'verification_status',  type: 'enum',      note: 'VERIFIED | PENDING | REJECTED' },
  { field: 'content_submissions',  type: 'array',     note: 'Own institution submissions only' },
  { field: 'review_scores',        type: 'object[]',  note: 'Aggregated — no reviewer identity' },
  { field: 'last_active',          type: 'date',      note: 'Date precision only — no timestamp' },
  { field: 'article_status',       type: 'enum',      note: 'PUBLISHED | DRAFT | ARCHIVED' },
];

const RESTRICTED_FIELDS: RestrictedField[] = [
  { field: 'farmer_pii',           reason: 'Cross-track isolation — architectural' },
  { field: 'payment_records',      reason: 'Agricultural track only' },
  { field: 'ai_session_tokens',    reason: 'Raw audit log — restricted access' },
  { field: 'reviewer_identity',    reason: 'Hashed reference only — never plain' },
  { field: 'other_institutions',   reason: 'No cross-institution data access' },
  { field: 'student_device_data',  reason: 'ODPC Article 25 restriction' },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function VerificationPage() {
  return (
    <PageShell>

      {/* ── S1: Page Declaration ─────────────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">INSTITUTIONAL VERIFICATION MODEL</p>

        <div className="flex gap-16">

          {/* 5-column left — 54px editorial heading */}
          <div className="col-5">
            <h1 className="font-editorial text-[54px] leading-[68px] font-normal text-text-primary">
              Verification is<br />
              not a feature.<br />
              <em className="text-text-secondary">It is the foundation.</em>
            </h1>
          </div>

          {/* 7-column right — framing copy + 2px gold rule */}
          <div className="col-7 flex flex-col justify-between pt-2">
            <div className="space-y-4">
              <p className="font-institutional text-i1 text-text-secondary leading-relaxed">
                UmojaHub's verification model answers a single question before any transaction,
                enrollment, or content contribution is permitted:
              </p>
              <p className="font-editorial text-d4 italic font-normal text-text-primary leading-snug">
                Is this person who they claim to be, operating in the capacity they claim?
              </p>
              <p className="font-institutional text-i2 text-text-secondary leading-relaxed">
                For farmers, this means cooperative membership, land-use rights, and a traceable
                transaction history verified against the Cooperatives Authority of Kenya registry.
              </p>
              <p className="font-institutional text-i2 text-text-secondary leading-relaxed">
                For academic institutions, this means CUE accreditation status, lecturer credentials,
                and a peer-review chain that is architecturally insulated from student influence at
                every stage.
              </p>
              <p className="font-institutional text-i2 text-text-secondary leading-relaxed">
                Both tracks share one infrastructure layer. Zero data intersects between them.
              </p>
            </div>
            {/* 2px gold closing rule */}
            <div className="w-full mt-10 border-t-2 border-track-gold" aria-hidden="true" />
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S2: What Verification Means ──────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">WHAT VERIFICATION ESTABLISHES</p>

        <div className="grid grid-cols-2 gap-16">

          {/* Agricultural Identity */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-[2px] w-4 bg-track-gold flex-shrink-0" aria-hidden="true" />
              <TrackLabel track="gold" />
              <span className="font-mono text-m2 text-text-disabled">— AGRICULTURAL IDENTITY</span>
            </div>
            <DataTable
              rows={AGRI_VERIFICATION_ROWS}
              showHeaders
              indicatorLabel="PARAMETER"
              valueLabel="REQUIREMENT"
              indicatorWidth="w-44"
            />
          </div>

          {/* Academic Integrity */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-[2px] w-4 bg-track-blue flex-shrink-0" aria-hidden="true" />
              <TrackLabel track="blue" />
              <span className="font-mono text-m2 text-text-disabled">— ACADEMIC INTEGRITY</span>
            </div>
            <DataTable
              rows={ACADEMIC_INTEGRITY_ROWS}
              showHeaders
              indicatorLabel="PARAMETER"
              valueLabel="REQUIREMENT"
              indicatorWidth="w-44"
            />
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S3: Farmer Identity Flow ─────────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <div className="flex gap-16">

          {/* 5-column left — label + heading */}
          <div className="col-5">
            <p className="eyebrow text-track-gold mb-4">AGRICULTURAL TRACK</p>
            <h2 className="font-editorial text-d3 font-normal text-text-primary leading-snug">
              Farmer Identity<br />
              <em className="text-text-secondary">Verification Flow</em>
            </h2>
            <p className="font-institutional text-i2 text-text-secondary mt-6 leading-relaxed">
              Seven stages from document submission to verified marketplace access. Every stage
              writes to the permanent audit record. The process is non-negotiable and identical
              for all cooperative types.
            </p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-mono text-d4 text-track-gold [font-feature-settings:'tnum'_1]">7</span>
              <span className="eyebrow text-text-disabled">stages — avg. 5 business days</span>
            </div>
          </div>

          {/* 7-column right — stage list */}
          <div className="col-7">
            <div className="border-t border-rule">
              {FARMER_STAGES.map((stage) => (
                <div key={stage.num} className="flex gap-6 py-5 border-b border-rule">
                  <span className="font-mono text-[18px] leading-none text-track-gold w-8 flex-shrink-0 pt-0.5">
                    {stage.num}
                  </span>
                  <div className="min-w-0">
                    <p className="font-institutional text-i2 font-medium text-text-primary">
                      {stage.title}
                    </p>
                    <p className="font-mono text-m1 text-text-secondary mt-1.5 leading-snug">
                      {stage.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S4: Academic Integrity Flow ──────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <div className="flex gap-16">

          {/* 5-column left — label + heading */}
          <div className="col-5">
            <p className="eyebrow text-track-blue mb-4">ACADEMIC TRACK</p>
            <h2 className="font-editorial text-d3 font-normal text-text-primary leading-snug">
              Academic Integrity<br />
              <em className="text-text-secondary">Verification Flow</em>
            </h2>
            <p className="font-institutional text-i2 text-text-secondary mt-6 leading-relaxed">
              Five stages from content submission to publication. The peer-review chain is
              architecturally insulated from student influence. Reviewer identity is hashed
              in all student-accessible records.
            </p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="font-mono text-d4 text-track-blue [font-feature-settings:'tnum'_1]">5</span>
              <span className="eyebrow text-text-disabled">stages — max. 14 calendar days</span>
            </div>
          </div>

          {/* 7-column right — stage list */}
          <div className="col-7">
            <div className="border-t border-rule">
              {ACADEMIC_STAGES.map((stage) => (
                <div key={stage.num} className="flex gap-6 py-5 border-b border-rule">
                  <span className="font-mono text-[18px] leading-none text-track-blue w-8 flex-shrink-0 pt-0.5">
                    {stage.num}
                  </span>
                  <div className="min-w-0">
                    <p className="font-institutional text-i2 font-medium text-text-primary">
                      {stage.title}
                    </p>
                    {stage.emphasis && (
                      <p className="font-mono text-m1 text-text-primary mt-1.5 leading-snug">
                        {stage.emphasis}
                      </p>
                    )}
                    <p className="font-mono text-m1 text-text-secondary mt-1.5 leading-snug">
                      {stage.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S5: Lecturer Review Cycle ────────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">LECTURER REVIEW GOVERNANCE</p>

        <div className="grid grid-cols-3 divide-x divide-rule">

          {/* Column 1 — Assignment Protocol */}
          <div className="pr-10">
            <p className="eyebrow text-track-blue mb-5">ASSIGNMENT PROTOCOL</p>
            <DataTable
              rows={ASSIGNMENT_PROTOCOL}
              showHeaders={false}
              indicatorWidth="w-36"
            />
          </div>

          {/* Column 2 — Review Rubric with weighted scores */}
          <div className="px-10">
            <p className="eyebrow text-track-blue mb-5">REVIEW RUBRIC</p>
            <div className="space-y-5">
              {RUBRIC_WEIGHTS.map((item) => (
                <div key={item.label}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-d4 text-text-primary [font-feature-settings:'tnum'_1]">
                      {item.weight}
                    </span>
                    <span className="font-institutional text-i3 font-medium text-text-primary">
                      {item.label}
                    </span>
                  </div>
                  <p className="font-mono text-m2 text-text-secondary mt-1 leading-snug">
                    {item.note}
                  </p>
                </div>
              ))}
              <div className="border-t border-rule pt-4">
                <p className="font-mono text-m2 text-text-disabled">
                  Pass threshold: 75 / 100 aggregate minimum score
                </p>
              </div>
            </div>
          </div>

          {/* Column 3 — Decision Audit Record */}
          <div className="pl-10">
            <p className="eyebrow text-track-blue mb-5">DECISION AUDIT RECORD</p>
            <DataTable
              rows={AUDIT_RECORD_FIELDS}
              showHeaders={false}
              indicatorWidth="w-36"
            />
            <p className="font-mono text-m3 text-text-disabled mt-5 leading-snug tracking-wide">
              All decision records are written once. No field may be modified after the
              decision timestamp is set. Queried only via authenticated admin routes.
            </p>
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S6: Fraud Prevention Matrix ──────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-3">FRAUD PREVENTION MATRIX</p>
        <p className="font-institutional text-i2 text-text-secondary mb-10 max-w-2xl">
          Active controls across both verification tracks. Each threat is addressed at the
          infrastructure level — not the policy level.
        </p>

        <table className="w-full font-mono text-m1 border-collapse">
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 pr-8 font-normal w-40">
                THREAT
              </th>
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 pr-8 font-normal w-64">
                MECHANISM
              </th>
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 pr-8 font-normal w-72">
                DETECTION
              </th>
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 font-normal">
                OUTCOME
              </th>
            </tr>
          </thead>
          <tbody>
            {FRAUD_MATRIX.map((row) => (
              <tr key={row.threat} className="border-b border-rule">
                <td className="py-3.5 pr-8 text-state-terminated align-top">{row.threat}</td>
                <td className="py-3.5 pr-8 text-text-secondary align-top leading-snug">{row.mechanism}</td>
                <td className="py-3.5 pr-8 text-text-secondary align-top leading-snug">{row.detection}</td>
                <td className="py-3.5 text-text-primary align-top leading-snug">{row.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <SectionDivider />

      {/* ── S7: Audit Trail Access Schema ────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">AUDIT TRAIL ACCESS SCHEMA</p>
        <p className="font-institutional text-i2 text-text-secondary mb-8 max-w-2xl">
          Data fields available to a verified institution administrator via authenticated API.
          Agricultural track data is architecturally unreachable — not policy-restricted.
        </p>

        <div className="grid grid-cols-2 gap-12">

          {/* Accessible fields */}
          <div>
            <p className="eyebrow text-state-verified mb-4">ACCESSIBLE — INSTITUTION ADMIN</p>
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-state-verified" />
              <div className="divide-y divide-rule">
                {ACCESSIBLE_FIELDS.map((f) => (
                  <div key={f.field} className="flex items-start gap-4 px-5 py-3">
                    <span className="font-mono text-m1 text-state-verified flex-shrink-0 w-44">
                      {f.field}
                    </span>
                    <span className="font-mono text-m2 text-text-disabled w-20 flex-shrink-0">
                      {f.type}
                    </span>
                    <span className="font-mono text-m2 text-text-secondary leading-snug">
                      {f.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Restricted fields */}
          <div>
            <p className="eyebrow text-state-terminated mb-4">INACCESSIBLE — STRUCTURALLY RESTRICTED</p>
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-state-terminated" />
              <div className="divide-y divide-rule">
                {RESTRICTED_FIELDS.map((f) => (
                  <div key={f.field} className="flex items-start gap-4 px-5 py-3">
                    <span className="font-mono text-m1 text-state-terminated line-through opacity-50 flex-shrink-0 w-44">
                      {f.field}
                    </span>
                    <span className="font-mono text-m2 text-text-disabled leading-snug">
                      {f.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S8: Call To Action ───────────────────────────────────────────── */}
      <section className="canvas-inner section-pad flex flex-col items-center text-center">

        <p className="eyebrow text-text-disabled mb-8">ONBOARDING TRACK SELECTION</p>

        <p className="font-editorial text-d3 italic font-normal text-text-primary max-w-xl leading-snug">
          Which infrastructure track is your institution entering?
        </p>

        <p className="font-institutional text-i3 text-text-secondary mt-5 max-w-md leading-relaxed">
          Both tracks share the same onboarding manifest. Select your path to begin the
          verification node application for Cohort 2026.
        </p>

        <div className="flex items-center gap-12 mt-10">
          <TextLink href="/partnerships">
            Agricultural verification node — onboarding manifest
          </TextLink>
          <div className="w-px h-4 bg-rule" aria-hidden="true" />
          <TextLink href="/partnerships">
            Academic integrity node — partnership track
          </TextLink>
        </div>

      </section>

    </PageShell>
  );
}
