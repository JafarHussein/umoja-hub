/**
 * Persistent index / table of contents (foundation §13.1). Pure anchor links —
 * works with JS disabled and on 2G; placed in a sticky sidebar on wide screens
 * and inside a native <details> disclosure on small screens (never
 * hamburger-only for the primary index, per design-reset/10).
 */
import { streamTopics } from './streamTopics';

export function StreamIndex() {
  return (
    <nav aria-label="Contents" className="font-body text-read-meta">
      <p className="mb-3 font-mono uppercase tracking-wide text-fg-subtle">On this page</p>
      <ol className="space-y-3">
        {streamTopics.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`} className="font-medium text-fg hover:text-brand-text">
              {String(t.n).padStart(2, '0')} · {t.title}
            </a>
            <ul className="mt-1 ml-1 space-y-1 border-l border-border pl-3">
              {t.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-fg-muted hover:text-brand-text">
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </nav>
  );
}
