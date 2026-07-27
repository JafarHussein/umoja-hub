'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { FeedFilters } from './FeedFilters';

// Mobile filter entry point (Marketplace Rebuild, Stage 5). Desktop uses the
// sticky side rail; on small screens filtering lives behind one button that
// opens a bottom sheet — the whole filter surface on a single screen, thumb
// reachable, never a separate page. Filters apply live via URL params, so the
// sheet's footer button simply closes.

const FILTER_KEYS = [
  'q',
  'category',
  'county',
  'minPrice',
  'maxPrice',
  'minQuantity',
  'verifiedOnly',
  'highTrust',
] as const;

export function MobileFilterButton({ className }: { className?: string }): React.ReactElement {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = (): void => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Count active facets — price (min and/or max) counts once.
  let activeCount = 0;
  let priceCounted = false;
  for (const key of FILTER_KEYS) {
    const val = searchParams.get(key);
    if (!val) continue;
    if (key === 'minPrice' || key === 'maxPrice') {
      if (!priceCounted) {
        activeCount += 1;
        priceCounted = true;
      }
    } else {
      activeCount += 1;
    }
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      // Focus trap — keep Tab within the sheet (WCAG 2.4.3).
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'));
        if (list.length === 0) return;
        const first = list[0]!;
        const last = list[list.length - 1]!;
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey && activeEl === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'app-nav inline-flex items-center gap-2 rounded-app-control border border-app-hairline bg-app-card px-3.5 py-2 text-app-body transition-colors duration-150 hover:border-app-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
          className
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2 4h12M4 8h8M6 12h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="app-label inline-flex h-5 min-w-5 items-center justify-center rounded-app-pill bg-app-brand px-1.5 text-app-on-brand">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Filter listings"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close filters"
            onClick={close}
            className="absolute inset-0 bg-app-ink/40"
          />

          {/* Sheet */}
          <div
            ref={dialogRef}
            className="relative max-h-[85vh] overflow-y-auto rounded-t-app-card border-t border-app-hairline bg-app-canvas p-5 shadow-app-float"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="app-h2 text-app-ink">Filter &amp; sort</p>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close filters"
                className="rounded-app-pill p-1.5 text-app-muted transition-colors duration-150 hover:text-app-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <FeedFilters />

            <button
              type="button"
              onClick={close}
              className="app-nav mt-6 w-full rounded-app-control bg-app-brand px-4 py-3 text-app-on-brand transition-colors duration-150 hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
            >
              View results
            </button>
          </div>
        </div>
      )}
    </>
  );
}
