'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AnchorSection {
  id: string;
  label: string;
}

interface SectionAnchorProps {
  sections: AnchorSection[];
}

export function SectionAnchor({ sections }: SectionAnchorProps): React.ReactElement {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [sections]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Desktop sidebar — visible xl+ */}
      <nav
        aria-label="Page sections"
        className="hidden xl:block sticky top-24 w-48 shrink-0"
      >
        <ul className="flex flex-col gap-1">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={cn(
                  'block pl-3 py-1 font-body text-t5 transition-colors duration-150 border-l-2',
                  activeId === section.id
                    ? 'text-text-primary border-accent-green'
                    : 'text-text-disabled hover:text-text-secondary border-transparent'
                )}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveId(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile dropdown — visible below xl */}
      <div className="xl:hidden mb-6">
        <label htmlFor="section-nav" className="sr-only">
          Jump to section
        </label>
        <select
          id="section-nav"
          value={activeId}
          onChange={handleSelectChange}
          className="w-full font-body text-t5 text-text-primary bg-surface-elevated border border-zinc-800/50 rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent-green"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
