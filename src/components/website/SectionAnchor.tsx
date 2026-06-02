'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export interface AnchorSection {
  id: string;
  label: string;
}

interface SectionAnchorProps {
  sections: AnchorSection[];
  hub?: 'food' | 'education';
}

export function SectionAnchor({ sections, hub }: SectionAnchorProps): React.ReactElement {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);

  const activeLink =
    hub === 'education'
      ? 'border-ws-hub-blue text-ws-hub-blue'
      : 'border-ws-hub-green text-ws-hub-green';

  const activeTab =
    hub === 'education' ? 'text-ws-hub-blue border-ws-hub-blue' : 'text-ws-hub-green border-ws-hub-green';

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

  // Scroll active tab into view on the tablet tab strip
  useEffect(() => {
    if (!tabListRef.current) return;
    const activeEl = tabListRef.current.querySelector<HTMLElement>('[data-active="true"]');
    activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId]);

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    scrollTo(e.target.value);
  };

  return (
    <>
      {/* Desktop sidebar — xl+ */}
      <nav
        aria-label="Page sections"
        className="hidden xl:block sticky top-[88px] w-[200px] shrink-0 self-start"
      >
        <ul className="flex flex-col gap-0.5">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={activeId === section.id ? 'location' : undefined}
                className={cn(
                  'block pl-3 py-1.5 font-geist text-ws-body-sm transition-colors duration-150 border-l-2',
                  activeId === section.id
                    ? activeLink
                    : 'text-ws-text-tertiary hover:text-ws-text-secondary border-transparent'
                )}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(section.id);
                }}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tablet horizontal tab strip — md to xl */}
      <nav
        aria-label="Page sections"
        className="hidden md:block xl:hidden sticky top-16 z-30 bg-ws-surface-base border-b border-ws-border-light"
      >
        <div ref={tabListRef} className="flex overflow-x-auto px-6 scrollbar-none">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              data-active={activeId === section.id}
              aria-current={activeId === section.id ? 'location' : undefined}
              onClick={() => scrollTo(section.id)}
              className={cn(
                'flex-none whitespace-nowrap px-4 py-3 font-geist text-ws-body-sm border-b-2 transition-colors duration-150',
                activeId === section.id
                  ? activeTab
                  : 'text-ws-text-tertiary border-transparent hover:text-ws-text-secondary'
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile select — below md */}
      <div className="md:hidden mb-6">
        <label htmlFor="section-nav-select" className="sr-only">
          Jump to section
        </label>
        <select
          id="section-nav-select"
          value={activeId}
          onChange={handleSelectChange}
          className="w-full font-geist text-ws-body-sm text-ws-text-primary bg-ws-surface-base border border-ws-border-medium px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ws-hub-green"
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
