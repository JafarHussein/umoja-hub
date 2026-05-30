import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { TrackLabel } from '@/components/ui/TrackLabel';
import { TextLink } from '@/components/ui/TextLink';

export const metadata: Metadata = {
  title: 'AI Safety & Integrity Documentation',
  description:
    'Technical specification of how UmojaHub constrains AI to analytical roles — never generative.',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PERMITTED_OUTPUT_VALUES = [
  'price_trend_analysis',
  'crop_performance_summary',
  'supply_demand_insights',
  'learning_path_recommendation',
  'question_answering_with_citations',
];

const PROHIBITED_OUTPUT_VALUES = [
  'original_content_generation',
  'uncited_factual_claims',
  'grade_or_score_fabrication',
  'identity_inference',
  'predictive_pricing_without_data',
];

interface SchemaEntry {
  readonly key: string;
  readonly value: string;
}

const AUDIT_LOG_FIELDS: SchemaEntry[] = [
  { key: 'log_every_token',  value: 'true' },
  { key: 'storage',          value: '"MongoDB"' },
  { key: 'collection',       value: '"chat_sessions"' },
  { key: 'editable',         value: 'false' },
  { key: 'ttl',              value: '"never"' },
  { key: 'cross_reference',  value: '"interaction_id"' },
];

interface PipelineStage {
  readonly step: string;
  readonly event: string;
  readonly description: string;
  readonly schema: SchemaEntry[];
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    step: '01',
    event: 'USER_INPUT_RECEIVED',
    description: 'Raw input captured from authenticated user session',
    schema: [
      { key: 'log_id',      value: '"umj_[uid]_[timestamp]"' },
      { key: 'event',       value: '"INPUT_RECEIVED"' },
      { key: 'user_role',   value: '"FARMER | LECTURER | STUDENT"' },
      { key: 'session_id',  value: '"[uuid-v4]"' },
      { key: 'editable',    value: 'false' },
    ],
  },
  {
    step: '02',
    event: 'INTENT_CLASSIFICATION',
    description: 'Input classified against permitted intent taxonomy',
    schema: [
      { key: 'intent_type',        value: '"ANALYTICAL | MENTORING | SEARCH"' },
      { key: 'prohibited_flag',    value: 'false' },
      { key: 'confidence',         value: '0.94' },
      { key: 'classifier_version', value: '"v2.3.1"' },
    ],
  },
  {
    step: '03',
    event: 'PRE_CALL_PROHIBITED_CHECK',
    description: 'Input screened against prohibited output pattern list before API call',
    schema: [
      { key: 'patterns_checked',   value: '5' },
      { key: 'violations_found',   value: '0' },
      { key: 'check_passed',       value: 'true' },
      { key: 'blocked_on_fail',    value: 'true' },
    ],
  },
  {
    step: '04',
    event: 'GROQ_API_CALL',
    description: 'Constrained inference call — analytical mode only, zero retention',
    schema: [
      { key: 'model',          value: '"llama3-8b-8192"' },
      { key: 'tokens_in',      value: '847' },
      { key: 'tokens_out',     value: '312' },
      { key: 'latency_ms',     value: '1240' },
      { key: 'data_retained',  value: 'false' },
    ],
  },
  {
    step: '05',
    event: 'OUTPUT_SCREENING',
    description: 'Response scanned for prohibited output types before delivery',
    schema: [
      { key: 'prohibited_detected',  value: '0' },
      { key: 'flags',                value: '[]' },
      { key: 'screener_version',     value: '"classifier_v2"' },
      { key: 'pass',                 value: 'true' },
    ],
  },
  {
    step: '06',
    event: 'AUDIT_LOG_WRITE',
    description: 'Full interaction record written — immutable, permanent',
    schema: [
      { key: 'log_id',    value: '"umj_847_20260530_1423"' },
      { key: 'storage',   value: '"MongoDB"' },
      { key: 'editable',  value: 'false' },
      { key: 'ttl',       value: '"never"' },
    ],
  },
  {
    step: '07',
    event: 'RESPONSE_DELIVERY',
    description: 'Labelled output returned — AI-ASSISTED tag mandatory',
    schema: [
      { key: 'ai_label',         value: '"AI-ASSISTED"' },
      { key: 'human_reviewed',   value: 'false | true' },
      { key: 'citation_present', value: 'true' },
      { key: 'publishable',      value: 'false' },
    ],
  },
];

interface OversightRow {
  readonly contentType: string;
  readonly aiRole: string;
  readonly humanGate: string;
  readonly override: string;
  readonly blocked: boolean;
}

const OVERSIGHT_MATRIX: OversightRow[] = [
  {
    contentType: 'Market price analysis',
    aiRole:      'Aggregation — verified data sources only',
    humanGate:   'Farmer confirms before acting on recommendation',
    override:    'Farmer decision — not blocked',
    blocked:     false,
  },
  {
    contentType: 'Knowledge article',
    aiRole:      'Citation checking + structural summarisation',
    humanGate:   'Lecturer peer review — mandatory before PUBLISHED',
    override:    'No — human gate cannot be bypassed',
    blocked:     true,
  },
  {
    contentType: 'Farm advisory output',
    aiRole:      'Pattern matching from verified crop performance data',
    humanGate:   'Farmer reads and acts — no lock required',
    override:    'Farmer autonomous — not blocked',
    blocked:     false,
  },
  {
    contentType: 'Academic rubric scoring',
    aiRole:      'Rubric scoring suggestion — flagged AI-ASSISTED',
    humanGate:   'Lecturer holds final authority — score is not binding',
    override:    'No — lecturer decision is final',
    blocked:     true,
  },
  {
    contentType: 'Identity verification flag',
    aiRole:      'Document format validation only — no identity inference',
    humanGate:   'KYC administrator mandatory before APPROVED status',
    override:    'No — human review cannot be skipped',
    blocked:     true,
  },
];

interface ComplianceField {
  readonly field: string;
  readonly value: string;
}

const KENYA_ODPC_FIELDS: ComplianceField[] = [
  { field: 'Legal basis',          value: 'Kenya Data Protection Act 2019 — Article 30' },
  { field: 'Registration',         value: 'ODPC Controller — Reg. ODPC/2026/1847' },
  { field: 'Cross-border',         value: 'Data stored within Kenya — no international transfer' },
  { field: 'Breach notification',  value: '72 hours to ODPC — mandatory' },
  { field: 'DPA officer',          value: 'Designated — details on record with ODPC' },
  { field: 'Annual compliance',    value: 'Certificate submitted Q1 each year' },
  { field: 'User data access',     value: 'Subject access right — 30-day fulfilment' },
];

const DATA_ANON_FIELDS: ComplianceField[] = [
  { field: 'Student records',      value: 'SHA-256 hashed before any aggregation' },
  { field: 'Farmer identity',      value: 'Cross-track access architecturally blocked' },
  { field: 'AI session logs',      value: 'PII stripped before retention — token IDs only' },
  { field: 'Analytics exports',    value: 'k-anonymity threshold minimum 5' },
  { field: 'Groq data handling',   value: 'Zero-retention mode — API-level enforcement' },
  { field: 'Account closure',      value: 'Anonymised within 30 days — verifiable on request' },
  { field: 'Aggregation scope',    value: 'Intra-institution only — no cross-org analytics' },
];

const TRAINING_EXCLUSION_FIELDS: ComplianceField[] = [
  { field: 'Contractual basis',    value: 'All institutional contracts — Clause 7.3' },
  { field: 'Groq configuration',   value: 'Zero-retention mode confirmed in enterprise agreement' },
  { field: 'OpenAI API',           value: 'Not used for any content generation — no exposure' },
  { field: 'Training influence',   value: 'Zero — confirmed by Groq enterprise contract' },
  { field: 'Data export to Groq',  value: 'Inference only — no storage at Groq infrastructure' },
  { field: 'Exclusion clause',     value: 'In all institutional contracts — non-negotiable' },
  { field: 'Audit right',          value: 'Annual verification — available on written request' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiSafetyPage() {
  return (
    <PageShell>

      {/* ── S1: Policy Declaration ─────────────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">AI SAFETY & INTEGRITY DOCUMENTATION</p>

        <div className="flex gap-16">

          {/* 5-column left — 3px gold bar + declaration */}
          <div className="col-5 flex gap-6">
            {/* 3px gold vertical bar — runs the full height of the left column content */}
            <div className="w-[3px] flex-shrink-0 self-stretch bg-track-gold" aria-hidden="true" />

            <div>
              <h1 className="font-editorial text-d2 italic font-normal text-text-primary leading-snug">
                AI as analytical auditor and mentor.<br />
                <span className="text-text-secondary not-italic">Never as creator.</span>
              </h1>
              <p className="font-institutional text-i2 text-text-secondary mt-6 leading-relaxed">
                UmojaHub's AI layer is architecturally prohibited from generating original content.
                Every token of every interaction is logged permanently. No AI output is published
                without a human reviewer in the chain.
              </p>
              <p className="font-institutional text-i2 text-text-secondary mt-3 leading-relaxed">
                These are not policy intentions. They are enforced at the API configuration level,
                audited at the token level, and contractually binding for every institutional partner.
              </p>
            </div>
          </div>

          {/* 7-column right — permitted / prohibited split */}
          <div className="col-7 grid grid-cols-2 gap-6">

            {/* Permitted outputs */}
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-state-verified" />
              <div className="px-5 py-5">
                <p className="eyebrow text-state-verified mb-5">PERMITTED OUTPUTS</p>
                <div className="space-y-2.5">
                  {PERMITTED_OUTPUT_VALUES.map((v) => (
                    <div key={v} className="flex items-start gap-2.5">
                      <span className="font-mono text-m2 text-state-verified mt-px flex-shrink-0">
                        {'—'}
                      </span>
                      <span className="font-mono text-m2 text-text-secondary leading-snug">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prohibited outputs */}
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-state-terminated" />
              <div className="px-5 py-5">
                <p className="eyebrow text-state-terminated mb-5">PROHIBITED OUTPUTS</p>
                <div className="space-y-2.5">
                  {PROHIBITED_OUTPUT_VALUES.map((v) => (
                    <div key={v} className="flex items-start gap-2.5">
                      <span className="font-mono text-m2 text-state-terminated mt-px flex-shrink-0">
                        {'—'}
                      </span>
                      <span className="font-mono text-m2 text-text-secondary leading-snug line-through opacity-70">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S2: Zero-Generation Engine Spec ──────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <div className="flex gap-16">

          {/* 5-column left — section header + context */}
          <div className="col-5">
            <p className="eyebrow text-text-disabled mb-4">ENGINE SPECIFICATION</p>
            <h2 className="font-editorial text-d3 font-normal text-text-primary leading-snug">
              Zero-generation<br />
              <em className="text-text-secondary">constraint model</em>
            </h2>
            <p className="font-institutional text-i2 text-text-secondary mt-6 leading-relaxed">
              The Groq API is configured in analytical mode only. The constraint set below
              is applied at the API call layer — upstream of prompt construction. It cannot
              be altered by any user action, platform setting, or crafted prompt input.
            </p>
            <p className="font-mono text-m2 text-text-disabled mt-5 leading-snug">
              Model in use: llama3-8b-8192<br />
              Mode: inference only<br />
              Data retention: zero<br />
              Token audit: permanent
            </p>
          </div>

          {/* 7-column right — syntax-colored config block */}
          <div className="col-7">
            <div className="font-mono text-m1 leading-6 [font-feature-settings:'tnum'_1] bg-surface-elevated border border-rule overflow-hidden">
              <div className="h-0.5 bg-rule" />

              <div className="p-6">

                {/* Opening brace */}
                <div><span className="text-text-disabled">{'{'}</span></div>

                {/* PROHIBITED_OUTPUTS */}
                <div className="pl-4 mt-2">
                  <span className="text-text-disabled">&quot;</span>
                  <span className="text-state-terminated">PROHIBITED_OUTPUTS</span>
                  <span className="text-text-disabled">&quot;: [</span>
                </div>
                {PROHIBITED_OUTPUT_VALUES.map((v) => (
                  <div key={v} className="pl-8">
                    <span className="text-state-terminated opacity-80">&quot;{v}&quot;</span>
                    <span className="text-text-disabled">,</span>
                  </div>
                ))}
                <div className="pl-4">
                  <span className="text-text-disabled">],</span>
                </div>

                {/* PERMITTED_OUTPUTS */}
                <div className="pl-4 mt-3">
                  <span className="text-text-disabled">&quot;</span>
                  <span className="text-state-verified">PERMITTED_OUTPUTS</span>
                  <span className="text-text-disabled">&quot;: [</span>
                </div>
                {PERMITTED_OUTPUT_VALUES.map((v) => (
                  <div key={v} className="pl-8">
                    <span className="text-state-verified opacity-80">&quot;{v}&quot;</span>
                    <span className="text-text-disabled">,</span>
                  </div>
                ))}
                <div className="pl-4">
                  <span className="text-text-disabled">],</span>
                </div>

                {/* AUDIT_LOG */}
                <div className="pl-4 mt-3">
                  <span className="text-text-disabled">&quot;</span>
                  <span className="text-track-blue">AUDIT_LOG</span>
                  <span className="text-text-disabled">&quot;: {'{'}</span>
                </div>
                {AUDIT_LOG_FIELDS.map((f) => (
                  <div key={f.key} className="pl-8">
                    <span className="text-track-blue opacity-80">&quot;{f.key}&quot;</span>
                    <span className="text-text-disabled">: </span>
                    <span className="text-track-blue">{f.value}</span>
                    <span className="text-text-disabled">,</span>
                  </div>
                ))}
                <div className="pl-4">
                  <span className="text-text-disabled">{'}'}</span>
                </div>

                {/* Closing brace */}
                <div className="mt-2">
                  <span className="text-text-disabled">{'}'}</span>
                </div>
              </div>

              {/* Lock-down notice — full-bleed footer inside the block */}
              <div className="border-t border-rule px-6 py-3 flex items-center gap-3">
                <span className="font-mono text-m3 text-state-terminated tracking-wide uppercase">
                  IMMUTABLE
                </span>
                <span className="font-mono text-m2 text-text-disabled">
                  Not configurable via platform UI, API key, or prompt injection.
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S3: Verification & Logging Pipeline ──────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-3">VERIFICATION & LOGGING PIPELINE</p>
        <p className="font-institutional text-i2 text-text-secondary mb-10 max-w-2xl">
          Every AI interaction traverses seven sequential stages. Each stage writes to the
          permanent audit record before the next stage begins. No stage can be skipped.
        </p>

        <div className="border-t border-rule">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.event}
              className="grid grid-cols-[180px_1fr] gap-12 py-5 border-b border-rule"
            >
              {/* Left — step counter + event name */}
              <div className="flex-shrink-0">
                <span className="font-mono text-[18px] text-track-blue leading-none">
                  {stage.step}
                </span>
                <p className="font-mono text-m2 text-text-primary mt-1.5 leading-snug">
                  {stage.event}
                </p>
                <p className="font-mono text-m3 text-text-disabled mt-1 leading-snug tracking-wide">
                  {stage.description}
                </p>
              </div>

              {/* Right — schema block */}
              <div className="bg-surface-elevated border border-rule px-5 py-3 [font-feature-settings:'tnum'_1]">
                {stage.schema.map((entry) => (
                  <div key={entry.key} className="flex items-start gap-4 py-0.5">
                    <span className="font-mono text-m2 text-text-secondary w-36 flex-shrink-0">
                      {entry.key}:
                    </span>
                    <span className="font-mono text-m2 text-text-primary">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider />

      {/* ── S4: Human Oversight Matrix ───────────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-8">HUMAN OVERSIGHT MATRIX</p>

        {/* Status lifecycle journey */}
        <div className="flex items-center gap-3 font-mono text-m1 [font-feature-settings:'tnum'_1] mb-10">
          <span className="text-text-disabled">UNVERIFIED</span>
          <span className="text-text-disabled" aria-hidden="true">→</span>
          <span className="text-track-blue">AI-ASSISTED</span>
          <span className="text-text-disabled" aria-hidden="true">→</span>
          <span className="text-track-gold">HUMAN-REVIEWED</span>
          <span className="text-text-disabled" aria-hidden="true">→</span>
          <span className="text-state-verified">VERIFIED</span>
          <span className="font-mono text-m3 text-text-disabled ml-6 tracking-wide self-center">
            — OPERATIONAL STATUS JOURNEY — ALL CONTENT TYPES
          </span>
        </div>

        {/* Governance table */}
        <table className="w-full font-mono text-m1 border-collapse">
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 font-normal w-44 pr-8">
                CONTENT TYPE
              </th>
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 font-normal w-64 pr-8">
                AI ROLE
              </th>
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 font-normal w-64 pr-8">
                HUMAN GATE
              </th>
              <th scope="col" className="eyebrow text-text-disabled text-left pb-3 font-normal">
                OVERRIDE POSSIBLE
              </th>
            </tr>
          </thead>
          <tbody>
            {OVERSIGHT_MATRIX.map((row) => (
              <tr key={row.contentType} className="border-b border-rule">
                <td className="py-3.5 pr-8 text-text-primary align-top">{row.contentType}</td>
                <td className="py-3.5 pr-8 text-text-secondary align-top leading-snug">{row.aiRole}</td>
                <td className="py-3.5 pr-8 text-text-secondary align-top leading-snug">{row.humanGate}</td>
                <td className={[
                  'py-3.5 align-top leading-snug',
                  row.blocked ? 'text-state-terminated' : 'text-text-secondary',
                ].join(' ')}>
                  {row.override}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <SectionDivider />

      {/* ── S5: Compliance & Privacy Schema ──────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">INSTITUTIONAL COMPLIANCE & PRIVACY SCHEMA</p>

        <div className="grid grid-cols-3 divide-x divide-rule">

          {/* Column 1 — Kenya ODPC */}
          <div className="pr-10">
            <TrackLabel track="gold" className="mb-1" />
            <p className="font-mono text-m1 text-text-primary mt-1.5 mb-5">KENYA ODPC</p>
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-track-gold" />
              <div className="divide-y divide-rule">
                {KENYA_ODPC_FIELDS.map((f) => (
                  <div key={f.field} className="px-4 py-2.5">
                    <p className="font-mono text-m3 text-text-disabled tracking-wide uppercase mb-0.5">
                      {f.field}
                    </p>
                    <p className="font-mono text-m2 text-text-primary leading-snug">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 — Data Anonymisation */}
          <div className="px-10">
            <TrackLabel track="blue" className="mb-1" />
            <p className="font-mono text-m1 text-text-primary mt-1.5 mb-5">DATA ANONYMISATION</p>
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-track-blue" />
              <div className="divide-y divide-rule">
                {DATA_ANON_FIELDS.map((f) => (
                  <div key={f.field} className="px-4 py-2.5">
                    <p className="font-mono text-m3 text-text-disabled tracking-wide uppercase mb-0.5">
                      {f.field}
                    </p>
                    <p className="font-mono text-m2 text-text-primary leading-snug">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3 — Training Exclusion */}
          <div className="pl-10">
            <TrackLabel track="verified" className="mb-1" />
            <p className="font-mono text-m1 text-text-primary mt-1.5 mb-5">TRAINING EXCLUSION</p>
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-state-verified" />
              <div className="divide-y divide-rule">
                {TRAINING_EXCLUSION_FIELDS.map((f) => (
                  <div key={f.field} className="px-4 py-2.5">
                    <p className="font-mono text-m3 text-text-disabled tracking-wide uppercase mb-0.5">
                      {f.field}
                    </p>
                    <p className="font-mono text-m2 text-text-primary leading-snug">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Closing CTA */}
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="font-editorial text-d4 italic font-normal text-text-primary max-w-lg leading-snug">
            Is this the level of AI governance your institution requires?
          </p>
          <div className="flex items-center gap-12 mt-8">
            <TextLink href="/partnerships">
              Review the full partnership framework
            </TextLink>
            <div className="w-px h-4 bg-rule" aria-hidden="true" />
            <TextLink href="/verification">
              Return to the verification model
            </TextLink>
          </div>
        </div>
      </section>

    </PageShell>
  );
}
