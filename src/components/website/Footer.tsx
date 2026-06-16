import Link from 'next/link';
import { doorways } from './doorways';

/**
 * Website footer. Plain, non-marketing description (WEBSITE_PURPOSE_V1
 * Principle 1) + site-wide access to the audience doorways. Server component.
 */
export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto]">
        <div className="max-w-reading space-y-3 font-body text-read-meta text-fg-muted">
          <p className="font-heading text-read-h3 text-fg">
            Umoja<span className="text-brand-text">Hub</span>
          </p>
          <p>
            Verification infrastructure for Kenyan farmers and computer-science students. UmojaHub
            records who is verified, by whom, and on what evidence — so strangers can transact with
            less risk.
          </p>
          <p className="text-fg-subtle">
            This site explains the platform in full and requires no account to read.
          </p>
        </div>
        <nav aria-label="Audience doorways" className="font-body text-read-meta">
          <p className="mb-3 font-mono uppercase tracking-wide text-fg-subtle">Start where you fit</p>
          <ul className="space-y-2">
            {doorways.map((d) => (
              <li key={d.slug}>
                <Link href={`/for/${d.slug}`} className="text-fg-muted hover:text-brand-text">
                  {d.audience}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
