import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { SectionDivider } from '@/components/ui/SectionDivider';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'UmojaHub is the verification infrastructure for East African agricultural markets and academic institutions.',
};

export default function HomePage() {
  return (
    <PageShell>
      {/* S1: Infrastructure Overview Declaration */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>

      <SectionDivider />

      {/* S2: Post-harvest loss anchor + platform stat */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>

      <SectionDivider />

      {/* S3: Dual-track architecture diagram */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>

      <SectionDivider />

      {/* S4: Navigation paths */}
      <section className="canvas-inner section-pad">
        {/* content: Phase 2 implementation */}
      </section>
    </PageShell>
  );
}
