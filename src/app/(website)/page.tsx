import { TopicOverview } from '@/components/website/topics/TopicOverview';
import { TopicTrust } from '@/components/website/topics/TopicTrust';
import { TopicProducer } from '@/components/website/topics/TopicProducer';
import { TopicBuyer } from '@/components/website/topics/TopicBuyer';
import { TopicPayments } from '@/components/website/topics/TopicPayments';
import { TopicIdentity } from '@/components/website/topics/TopicIdentity';
import { TopicGovernance } from '@/components/website/topics/TopicGovernance';
import { TopicEvidence } from '@/components/website/topics/TopicEvidence';
import { TopicServices } from '@/components/website/topics/TopicServices';
import { TopicRisks } from '@/components/website/topics/TopicRisks';
import Link from 'next/link';
import { doorways } from '@/components/website/doorways';

/**
 * The Documentation Stream (foundation §13). Topics render in canonical spine
 * order; each is a self-contained, deep-linkable unit with paired limitations.
 * Content is fact-checked against UMOJAHUB_PLATFORM_CAPABILITIES_REFERENCE.md —
 * no marketing, no aspiration (WEBSITE_PURPOSE_V1 Principles 1, 3, 4).
 */
export default function WebsiteHome() {
  return (
    <article className="pb-10">
      <header className="mb-12 max-w-reading">
        <h1 className="font-heading text-display-sm text-fg md:text-display">UmojaHub</h1>
        <p className="mt-4 font-body text-read-lead text-fg-muted">
          Verification infrastructure for Kenyan farmers and computer-science students. This
          documentation explains how the platform works and what it does not guarantee — read it in
          full, no account required.
        </p>
        <nav aria-label="Start where you fit" className="mt-6">
          <p className="font-mono text-read-meta uppercase tracking-wide text-fg-subtle">
            New here? Start where you fit
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-body text-read-meta">
            {doorways.map((d) => (
              <li key={d.slug}>
                <Link href={`/for/${d.slug}`} className="text-brand-text hover:underline">
                  {d.audience}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <TopicOverview />
      <TopicTrust />
      <TopicProducer />
      <TopicBuyer />
      <TopicPayments />
      <TopicIdentity />
      <TopicGovernance />
      <TopicEvidence />
      <TopicServices />
      <TopicRisks />
    </article>
  );
}
