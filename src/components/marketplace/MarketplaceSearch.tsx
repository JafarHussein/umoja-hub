'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';

// Feed search box with instant autocomplete (Marketplace Rebuild, Stage 4).
// Typing queries GET /api/marketplace/suggest and surfaces produce, category,
// county, and direct-listing matches. Enter (or picking a suggestion) drives the
// server feed via URL params — the feed itself never re-queries per keystroke.
// Implements the WAI-ARIA combobox pattern: arrow keys move, Enter selects,
// Escape closes, aria-activedescendant tracks focus.

const DEBOUNCE_MS = 140;
const MIN_QUERY = 2;

interface ISuggestResponse {
  data: {
    crops: { value: string; count: number }[];
    categories: { value: string; label: string }[];
    counties: { value: string; count: number }[];
    listings: {
      id: string;
      title: string;
      cropName: string;
      pickupCounty: string;
      currentPricePerUnit: number;
      unit: string;
    }[];
  };
}

type FlatItem =
  | { kind: 'crop'; domId: string; label: string; count: number }
  | { kind: 'category'; domId: string; label: string; value: string }
  | { kind: 'county'; domId: string; label: string; count: number }
  | { kind: 'listing'; domId: string; label: string; listingId: string; meta: string };

const SECTION_LABEL: Record<FlatItem['kind'], string> = {
  crop: 'Produce',
  category: 'Categories',
  county: 'Counties',
  listing: 'Listings',
};

function flatten(data: ISuggestResponse['data']): FlatItem[] {
  const items: FlatItem[] = [];
  data.crops.forEach((c, i) =>
    items.push({ kind: 'crop', domId: `sug-crop-${i}`, label: c.value, count: c.count })
  );
  data.categories.forEach((c, i) =>
    items.push({ kind: 'category', domId: `sug-cat-${i}`, label: c.label, value: c.value })
  );
  data.counties.forEach((c, i) =>
    items.push({ kind: 'county', domId: `sug-county-${i}`, label: c.value, count: c.count })
  );
  data.listings.forEach((l, i) =>
    items.push({
      kind: 'listing',
      domId: `sug-listing-${i}`,
      label: l.title,
      listingId: l.id,
      meta: `KSh ${l.currentPricePerUnit.toLocaleString()} / ${l.unit.toLowerCase()} · ${l.pickupCounty}`,
    })
  );
  return items;
}

export function MarketplaceSearch(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get('q') ?? '';
  const [value, setValue] = useState(urlQuery);
  const [items, setItems] = useState<FlatItem[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const listboxId = 'marketplace-suggest-listbox';

  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  // ── URL navigation helpers — every path resets pagination ─────────────────
  const replaceWith = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete('cursor');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const closeList = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const runSearch = useCallback(
    (term: string) => {
      replaceWith((p) => {
        if (term.trim()) p.set('q', term.trim());
        else p.delete('q');
      });
      closeList();
    },
    [replaceWith, closeList]
  );

  const selectItem = useCallback(
    (item: FlatItem) => {
      if (item.kind === 'crop') {
        setValue(item.label);
        runSearch(item.label);
      } else if (item.kind === 'category') {
        replaceWith((p) => {
          p.set('category', item.value);
          p.delete('q');
        });
        setValue('');
        closeList();
      } else if (item.kind === 'county') {
        replaceWith((p) => {
          p.set('county', item.label);
          p.delete('q');
        });
        setValue('');
        closeList();
      } else {
        closeList();
        router.push(`/marketplace/${item.listingId}`);
      }
    },
    [runSearch, replaceWith, closeList, router]
  );

  // ── Debounced suggestion fetch ────────────────────────────────────────────
  const fetchSuggestions = useCallback((term: string) => {
    if (abort.current) abort.current.abort();
    if (term.trim().length < MIN_QUERY) {
      setItems([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    abort.current = controller;
    void (async () => {
      try {
        const res = await fetch(`/api/marketplace/suggest?q=${encodeURIComponent(term.trim())}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const body = (await res.json()) as ISuggestResponse;
        const flat = flatten(body.data);
        setItems(flat);
        setActive(-1);
        setOpen(flat.length > 0);
      } catch {
        // aborted or network error — keep the previous list
      }
    })();
  }, []);

  function onChange(next: string): void {
    setValue(next);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchSuggestions(next), DEBOUNCE_MS);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && items.length > 0) {
        setOpen(true);
        setActive(0);
        return;
      }
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && active >= 0 && items[active]) {
        selectItem(items[active]);
      } else {
        runSearch(value);
      }
    } else if (e.key === 'Escape') {
      closeList();
    }
  }

  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
      if (abort.current) abort.current.abort();
    },
    []
  );

  const activeId = active >= 0 && items[active] ? items[active].domId : undefined;

  // Precompute section boundaries so headers render once per group.
  const withHeaders = useMemo(() => {
    let prev: FlatItem['kind'] | null = null;
    return items.map((item) => {
      const showHeader = item.kind !== prev;
      prev = item.kind;
      return { item, showHeader };
    });
  }, [items]);

  return (
    <div className="relative w-full">
      <form onSubmit={(e) => e.preventDefault()} role="search" className="relative">
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
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => items.length > 0 && setOpen(true)}
          onBlur={() => window.setTimeout(closeList, 120)}
          placeholder="Search produce, e.g. tomatoes, maize, Pishori rice"
          aria-label="Search the marketplace"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          {...(activeId ? { 'aria-activedescendant': activeId } : {})}
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
              runSearch('');
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
      </form>

      {/* Suggestions dropdown */}
      {open && items.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          // Prevent the input blur from firing before the click registers.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-96 overflow-y-auto rounded-app-control border border-app-hairline bg-app-card py-1 shadow-app-float"
        >
          {withHeaders.map(({ item, showHeader }, index) => (
            <React.Fragment key={item.domId}>
              {showHeader && (
                <li
                  aria-hidden="true"
                  className="app-label px-3 pb-1 pt-2 text-app-faint"
                >
                  {SECTION_LABEL[item.kind]}
                </li>
              )}
              <li
                id={item.domId}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => selectItem(item)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 transition-colors duration-150',
                  index === active ? 'bg-app-sunken' : 'bg-transparent'
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className="text-app-faint">
                    {item.kind === 'listing' ? '›' : item.kind === 'county' ? '⌖' : '⌕'}
                  </span>
                  <span className="app-body truncate text-app-ink">{item.label}</span>
                </span>
                <span className="app-meta flex-shrink-0 text-app-muted">
                  {item.kind === 'crop' || item.kind === 'county'
                    ? `${item.count} listing${item.count !== 1 ? 's' : ''}`
                    : item.kind === 'listing'
                      ? item.meta
                      : 'Category'}
                </span>
              </li>
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
