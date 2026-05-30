import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { DataTable } from '@/components/ui/DataTable';
import { TextLink } from '@/components/ui/TextLink';
import { TrackLabel } from '@/components/ui/TrackLabel';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'UmojaHub builds the verification infrastructure for East African agricultural markets and academic institutions.',
};

const SYSTEM_METRICS = [
  { indicator: 'Verified farmers',       value: '3,847 active profiles' },
  { indicator: 'Counties covered',        value: '23 of 47 — Kenya' },
  { indicator: 'Composite trust avg.',    value: '74.2 / 100.0' },
  { indicator: 'Active listings',         value: '1,204 this month' },
  { indicator: 'Order completion rate',   value: '89.3% (30-day)' },
  { indicator: 'Platform uptime',         value: '99.7% (90-day SLA)' },
  { indicator: 'Knowledge articles',      value: '312 peer-verified' },
  { indicator: 'AI interactions audited', value: '47,291 logged' },
];

const AGRI_TRUST_NODES = [
  'National ID cross-reference',
  'Cooperative registry — CAK',
  'Trust score engine (5-factor)',
];

const EDU_INTEGRITY_NODES = [
  'CUE / TVETA accreditation',
  'Lecturer peer-review chain',
  'AI audit log — token level',
];

const PARTNERS = [
  'University of Nairobi',
  'JKUAT',
  'Egerton University',
  'KALRO',
  'Kenya Farmers Association',
  'Strathmore University',
];

export default function HomePage() {
  return (
    <PageShell>

      {/* ── S1: Infrastructure Declaration ─────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">INFRASTRUCTURE OVERVIEW</p>

        <div className="flex gap-16">

          {/* 5-column left — editorial heading */}
          <div className="col-5">
            <h1 className="font-editorial text-d2 font-normal text-text-primary">
              UmojaHub is the<br />
              verification infrastructure<br />
              <em className="text-text-secondary">for East African agriculture.</em>
            </h1>

            <p className="font-institutional text-i2 text-text-secondary mt-8 leading-relaxed max-w-xs">
              Built to close the trust deficit between farmers, buyers, and academic institutions
              operating across 47 Kenyan counties — and the broader EAC region.
            </p>
          </div>

          {/* 7-column right — operational metrics table */}
          <div className="col-7 pt-1">
            <DataTable
              rows={SYSTEM_METRICS}
              showHeaders
              indicatorLabel="INDICATOR"
              valueLabel="VALUE"
              indicatorWidth="w-52"
              auditTimestamp="2026-05-30 00:00 UTC — automated pipeline"
            />
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S2: Problem Space ──────────────────────────────────────────────── */}
      <section className="canvas-inner section-pad">

        {/* Gold bar + pull quote */}
        <div className="flex gap-6">
          <div className="w-[3px] flex-shrink-0 self-stretch bg-track-gold" aria-hidden="true" />
          <blockquote className="font-editorial text-d3 italic font-normal text-text-primary leading-snug max-w-3xl">
            43% of produce across East Africa never reaches a market. Not because demand is
            absent — because trust infrastructure is absent.
          </blockquote>
        </div>

        {/* Three metric blocks divided by 1px rules */}
        <div className="mt-14 grid grid-cols-3 divide-x divide-rule">

          <div className="pr-12">
            <p className="font-mono text-d1 text-text-primary">43%</p>
            <p className="font-mono text-m1 text-text-secondary mt-3 leading-snug">
              of smallholder farmers in Kenya lack formal market access
            </p>
            <p className="eyebrow text-text-disabled mt-3">
              World Bank — EAC Agricultural Report 2024
            </p>
          </div>

          <div className="px-12">
            <p className="font-mono text-d1 text-text-primary">61%</p>
            <p className="font-mono text-m1 text-text-secondary mt-3 leading-snug">
              post-harvest loss rate without a verified buyer network
            </p>
            <p className="eyebrow text-text-disabled mt-3">
              FAO Sub-Saharan Supply Chain Index 2023
            </p>
          </div>

          <div className="pl-12">
            <p className="font-mono text-d1 text-text-primary">KES 89B</p>
            <p className="font-mono text-m1 text-text-secondary mt-3 leading-snug">
              annual economic loss from untransacted agricultural output in Kenya
            </p>
            <p className="eyebrow text-text-disabled mt-3">
              Kenya National Bureau of Statistics — 2025
            </p>
          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S3: Platform Architecture ──────────────────────────────────────── */}
      <section className="canvas-inner section-pad">
        <p className="eyebrow text-text-disabled mb-10">PLATFORM ARCHITECTURE</p>

        <div className="flex gap-16">

          {/* 5-column left — layer prose */}
          <div className="col-5 space-y-8">

            <div>
              <p className="eyebrow text-text-disabled mb-2">01 — MARKET INTELLIGENCE</p>
              <p className="font-institutional text-i2 text-text-secondary leading-relaxed">
                Real-time price signals from 23 active counties aggregate with OpenWeatherMap
                climate feeds and verified crop performance data. The layer surfaces analytical
                ground truth only — it makes no pricing decisions.
              </p>
            </div>

            <div>
              <p className="eyebrow text-track-gold mb-2">02 — AGRICULTURAL TRUST</p>
              <p className="font-institutional text-i2 text-text-secondary leading-relaxed">
                Farmer cooperative registrations, National ID cross-references, and KALRO
                certification records compose the agricultural verification graph. A composite
                trust score — weighted across five factors — governs marketplace access eligibility.
              </p>
            </div>

            <div>
              <p className="eyebrow text-track-blue mb-2">03 — EDUCATION INTEGRITY</p>
              <p className="font-institutional text-i2 text-text-secondary leading-relaxed">
                Academic credential verification runs on an entirely separate pipeline with no
                data intersection with the agricultural track. Every AI-assisted interaction is
                logged at the token level. No content is AI-generated.
              </p>
            </div>

            <div>
              <p className="eyebrow text-text-disabled mb-2">04 — TRANSACTION</p>
              <p className="font-institutional text-i2 text-text-secondary leading-relaxed">
                M-Pesa payment rails (Daraja API v3), order fulfillment tracking, and trust
                score recalculation run on the shared settlement layer. Each completed
                transaction writes an immutable, non-editable audit record.
              </p>
            </div>

          </div>

          {/* 7-column right — node diagram */}
          <div className="col-7 flex flex-col">

            {/* Layer 01: Market Intelligence — full width */}
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-rule" />
              <div className="px-5 py-4">
                <p className="eyebrow text-text-disabled">LAYER 01 — SHARED</p>
                <p className="font-mono text-m1 text-text-primary mt-1">MARKET INTELLIGENCE</p>
                <p className="font-mono text-m3 text-text-disabled mt-2 tracking-wide">
                  Price signals / Climate feeds / Supply forecasting
                </p>
              </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center py-1.5" aria-hidden="true">
              <div className="w-px h-3 bg-rule" />
            </div>

            {/* Layers 02 + 03: Dual track, side by side */}
            <div className="grid grid-cols-2 gap-2">

              <div className="border border-rule overflow-hidden">
                <div className="h-0.5 bg-track-gold" />
                <div className="px-5 py-4">
                  <TrackLabel track="gold" />
                  <p className="font-mono text-m1 text-text-primary mt-1.5">AGRICULTURAL TRUST</p>
                  <div className="mt-3 pt-3 border-t border-rule space-y-1.5">
                    {AGRI_TRUST_NODES.map((node) => (
                      <p key={node} className="font-mono text-m3 text-text-disabled">
                        — {node}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-rule overflow-hidden">
                <div className="h-0.5 bg-track-blue" />
                <div className="px-5 py-4">
                  <TrackLabel track="blue" />
                  <p className="font-mono text-m1 text-text-primary mt-1.5">EDUCATION INTEGRITY</p>
                  <div className="mt-3 pt-3 border-t border-rule space-y-1.5">
                    {EDU_INTEGRITY_NODES.map((node) => (
                      <p key={node} className="font-mono text-m3 text-text-disabled">
                        — {node}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Connector */}
            <div className="flex justify-center py-1.5" aria-hidden="true">
              <div className="w-px h-3 bg-rule" />
            </div>

            {/* Layer 04: Transaction — full width */}
            <div className="border border-rule overflow-hidden">
              <div className="h-0.5 bg-rule" />
              <div className="px-5 py-4">
                <p className="eyebrow text-text-disabled">LAYER 04 — SHARED</p>
                <p className="font-mono text-m1 text-text-primary mt-1">TRANSACTION</p>
                <p className="font-mono text-m3 text-text-disabled mt-2 tracking-wide">
                  M-Pesa STK Push (Daraja v3) / Order fulfillment / Trust score recalculation
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      <SectionDivider />

      {/* ── S4: Bridge to Platform ─────────────────────────────────────────── */}
      <section className="canvas-inner section-pad flex flex-col items-center text-center">

        <p className="eyebrow text-text-disabled mb-8">PLATFORM ACCESS — 2026 COHORT</p>

        <p className="font-editorial text-d3 italic font-normal text-text-primary max-w-2xl leading-snug">
          The platform is live and accepting verified users in the 2026 pilot cohort.
        </p>

        <p className="font-institutional text-i3 text-text-secondary mt-5 max-w-md leading-relaxed">
          Access is restricted to verified entities. Institutional administrators must complete
          the onboarding manifest before user provisioning begins.
        </p>

        <div className="flex items-center gap-12 mt-10">
          <TextLink href="/partnerships">
            Agricultural track — marketplace access
          </TextLink>
          <div className="w-px h-4 bg-rule" aria-hidden="true" />
          <TextLink href="/partnerships">
            Academic track — knowledge platform access
          </TextLink>
        </div>

      </section>

      <SectionDivider />

      {/* ── S5: Partners Row ───────────────────────────────────────────────── */}
      <section className="canvas-inner section-pad">

        <p className="eyebrow text-text-disabled mb-8">INSTITUTIONAL PARTNERS — COHORT 2026</p>

        <div className="flex items-center divide-x divide-rule">
          {PARTNERS.map((name) => (
            <span
              key={name}
              className="px-8 first:pl-0 last:pr-0 font-mono text-m2 text-text-disabled whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>

      </section>

    </PageShell>
  );
}
