'use client';

/**
 * Persistent index / table of contents (foundation §13.1).
 *
 * Progressive enhancement: the links are real anchors that render and work
 * server-side with JS disabled (essential on 2G). When JS runs, a single
 * IntersectionObserver highlights the section currently in view (scroll-spy)
 * and sets aria-current. On pages without these sections (the doorways) the
 * observer simply finds nothing and the index stays a plain link list.
 */
import { useEffect, useState } from 'react';
import { streamTopics } from './streamTopics';

export function StreamIndex({ showHeading = true }: { showHeading?: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const ids: string[] = [];
    for (const t of streamTopics) {
      ids.push(t.id);
      for (const s of t.sections) ids.push(s.id);
    }
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return; // e.g. doorway pages — nothing to spy on

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Contents" className="font-body text-read-meta">
      {showHeading ? (
        <p className="mb-3 font-mono uppercase tracking-wide text-fg-subtle">Contents</p>
      ) : null}
      <ol className="space-y-3">
        {streamTopics.map((t) => {
          const topicActive = activeId === t.id;
          return (
            <li key={t.id}>
              <a
                href={`/#${t.id}`}
                aria-current={topicActive ? 'true' : undefined}
                className={
                  topicActive ? 'font-medium text-brand-text' : 'font-medium text-fg hover:text-brand-text'
                }
              >
                {String(t.n).padStart(2, '0')} · {t.title}
              </a>
              <ul className="mt-1 ml-1 space-y-1 border-l border-border pl-3">
                {t.sections.map((s) => {
                  const active = activeId === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`/#${s.id}`}
                        aria-current={active ? 'true' : undefined}
                        className={active ? 'text-brand-text' : 'text-fg-muted hover:text-brand-text'}
                      >
                        {s.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
