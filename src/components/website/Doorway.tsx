import Link from 'next/link';
import type { Doorway as DoorwayData } from './doorways';

/**
 * Renders an audience doorway: a short orientation + curated links into the
 * Stream. Server component. Per foundation §13, it is an entrance, not content
 * — every link points to a canonical section on `/`.
 */
export function Doorway({ data }: { data: DoorwayData }) {
  return (
    <article className="max-w-reading pb-10">
      <header className="mb-10">
        <p className="font-mono text-read-meta uppercase tracking-wide text-fg-subtle">
          A doorway into the documentation
        </p>
        <h1 className="mt-2 font-heading text-display-sm text-fg">{data.title}</h1>
        <p className="mt-4 font-body text-read-lead text-fg-muted">{data.lead}</p>
      </header>

      <nav aria-label={`${data.audience} — where to start`}>
        <ul className="divide-y divide-border border-y border-border">
          {data.links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="group flex items-baseline justify-between gap-4 py-4 transition-colors duration-150 hover:bg-surface-sunken"
              >
                <span>
                  <span className="font-heading text-read-h3 text-fg group-hover:text-brand-text">
                    {l.label}
                  </span>
                  <span className="mt-1 block font-body text-read-meta text-fg-muted">{l.why}</span>
                </span>
                <span aria-hidden="true" className="font-body text-read-body text-brand-text">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="mt-8 font-body text-read-body text-fg-muted">
        Prefer to read everything?{' '}
        <Link href="/" className="text-brand-text underline underline-offset-4">
          The full documentation
        </Link>{' '}
        covers the whole platform, top to bottom — no account required.
      </p>
    </article>
  );
}
