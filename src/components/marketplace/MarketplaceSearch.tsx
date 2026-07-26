'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

// Feed search box (Marketplace Rebuild, Stage 3). Debounced write to the `q`
// URL param; the server feed runs the full-text query. Autocomplete/suggestions
// land in Stage 4 — the input is deliberately shaped to host them later.

const DEBOUNCE_MS = 350;

export function MarketplaceSearch(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(urlQuery);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when the URL changes from elsewhere (e.g. Clear all).
  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  function commit(next: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) {
      params.set('q', next.trim());
    } else {
      params.delete('q');
    }
    params.delete('cursor');
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function onChange(next: string): void {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), DEBOUNCE_MS);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    commit(value);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-faint"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search produce, e.g. tomatoes, maize, Pishori rice"
        aria-label="Search the marketplace"
        className={cn(
          'app-body h-11 w-full rounded-app-control border border-app-hairline bg-app-card pl-9 pr-9 text-app-ink',
          'placeholder:text-app-faint focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand',
          'transition-colors duration-150'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            if (timer.current) clearTimeout(timer.current);
            commit('');
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-app-pill p-1 text-app-faint transition-colors duration-150 hover:text-app-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-app-ring"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      <span aria-live="polite" className="sr-only">
        {isPending ? 'Updating results' : ''}
      </span>
    </form>
  );
}
