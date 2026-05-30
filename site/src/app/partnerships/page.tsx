import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SectionDivider } from '@/components/ui/SectionDivider';

export const metadata: Metadata = {
  title: 'Partnerships & Pilot Onboarding',
  description:
    'Cohort 2026 institutional access — verified node onboarding for universities, NGOs, and farmer cooperatives.',
};

export default function PartnershipsPage() {
  return (
    <PageShell>
      {/* S1: Intake Declaration */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>

      <SectionDivider />

      {/* S2: Partnership Tiers Matrix */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>

      <SectionDivider />

      {/* S3: Verification Node Onboarding Process */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>

      <SectionDivider />

      {/* S4: Institutional Intake Manifest */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>

      <SectionDivider />

      {/* S5: Legal & Data Sovereign Footprint */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>
    </PageShell>
  );
}
