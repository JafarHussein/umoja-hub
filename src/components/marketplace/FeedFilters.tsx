'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import { KENYAN_COUNTIES } from '@/types';

// Feed filter rail (Marketplace Rebuild, Stage 3). Rebuild of the retired dark
// MarketplaceFilters onto the `.theme-app` tokens. Covers county, price range,
// verified-only, and sort — every control writes a URL param and resets
// pagination so the server feed re-queries. Trust/nearby filters + the mobile
// filter sheet land in Stage 5. On mobile this stacks above the grid; on desktop
// it is a sticky side rail.

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Recommended' },
  { value: 'recent', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
];

const selectClass = cn(
  'app-body h-11 w-full rounded-app-control border border-app-hairline bg-app-card px-3 text-app-ink',
  'focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand transition-colors duration-150'
);

const inputClass = cn(
  'app-body h-11 w-full rounded-app-control border border-app-hairline bg-app-card px-3 text-app-ink',
  'placeholder:text-app-faint focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand transition-colors duration-150'
);

export function FeedFilters({ className }: { className?: string }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [isPending, startTransition] = useTransition();

  // "Near me" resolves the signed-in user's home county (GET /api/buyers/me) so
  // the toggle can scope the feed to their locality — no county lives in the
  // auth session, so we fetch it lazily and fall back to a disabled toggle.
  const [userCounty, setUserCounty] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/buyers/me');
        if (!res.ok) return;
        const body = (await res.json()) as { data: { county: string | null } };
        if (!cancelled) setUserCounty(body.data.county);
      } catch {
        // network error — the toggle stays disabled
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const county = searchParams.get('county') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const minQuantity = searchParams.get('minQuantity') ?? '';
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const highTrust = searchParams.get('highTrust') === 'true';
  const sort = searchParams.get('sort') ?? '';

  // The search term and category live in their own controls; "Clear all" here
  // resets only the filters this rail owns.
  const hasActiveFilters = Boolean(
    county || minPrice || maxPrice || minQuantity || verifiedOnly || highTrust
  );

  function updateParam(key: string, value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('cursor');
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const nearbyAvailable = status === 'authenticated' && Boolean(userCounty);
  const nearbyOn = Boolean(userCounty && county === userCounty);

  function toggleNearby(on: boolean): void {
    updateParam('county', on && userCounty ? userCounty : '');
  }

  function clearFilters(): void {
    const params = new URLSearchParams(searchParams.toString());
    ['county', 'minPrice', 'maxPrice', 'minQuantity', 'verifiedOnly', 'highTrust', 'cursor'].forEach(
      (k) => params.delete(k)
    );
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <aside
      aria-label="Filter and sort listings"
      className={cn(
        'space-y-5 transition-opacity duration-150',
        isPending && 'opacity-60',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="app-label text-app-muted">Filters</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="app-meta text-app-brand underline underline-offset-2 transition-colors duration-150 hover:text-app-brand-hover"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-1.5">
        <label htmlFor="feed-sort" className="app-meta text-app-muted">
          Sort by
        </label>
        <select
          id="feed-sort"
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value || 'default'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* County */}
      <div className="space-y-1.5">
        <label htmlFor="feed-county" className="app-meta text-app-muted">
          County
        </label>
        <select
          id="feed-county"
          value={county}
          onChange={(e) => updateParam('county', e.target.value)}
          className={selectClass}
        >
          <option value="">All counties</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Near me — scopes to the signed-in user's home county */}
        <label
          className={cn(
            'group flex items-center gap-3 pt-1.5',
            nearbyAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
          )}
        >
          <span className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={nearbyOn}
              disabled={!nearbyAvailable}
              onChange={(e) => toggleNearby(e.target.checked)}
              aria-label="Show produce in my county only"
            />
            <span className="block h-5 w-9 rounded-app-pill border border-app-hairline bg-app-sunken transition-colors duration-150 peer-checked:border-app-brand peer-checked:bg-app-brand peer-focus-visible:ring-2 peer-focus-visible:ring-app-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app-canvas" />
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-app-pill bg-app-card shadow transition-transform duration-150 peer-checked:translate-x-4" />
          </span>
          <span className="app-body text-app-body transition-colors duration-150 group-hover:text-app-ink">
            Near me{nearbyAvailable ? ` · ${userCounty}` : ''}
          </span>
        </label>
        {status === 'unauthenticated' && (
          <p className="app-meta text-app-faint">Sign in to shop produce near you.</p>
        )}
      </div>

      {/* Price range */}
      <div className="space-y-1.5">
        <p className="app-meta text-app-muted">Price range (KSh)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            aria-label="Minimum price"
            className={inputClass}
          />
          <span className="text-app-faint" aria-hidden="true">
            –
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            aria-label="Maximum price"
            className={inputClass}
          />
        </div>
      </div>

      {/* Minimum quantity */}
      <div className="space-y-1.5">
        <label htmlFor="feed-min-qty" className="app-meta text-app-muted">
          Minimum quantity
        </label>
        <input
          id="feed-min-qty"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Any amount"
          value={minQuantity}
          onChange={(e) => updateParam('minQuantity', e.target.value)}
          aria-label="Minimum quantity available"
          className={inputClass}
        />
      </div>

      {/* Trust & verification toggles */}
      <div className="space-y-3">
        <label className="group flex cursor-pointer items-center gap-3">
          <span className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={verifiedOnly}
              onChange={(e) => updateParam('verifiedOnly', e.target.checked ? 'true' : '')}
              aria-label="Show verified farmers only"
            />
            <span className="block h-5 w-9 rounded-app-pill border border-app-hairline bg-app-sunken transition-colors duration-150 peer-checked:border-app-brand peer-checked:bg-app-brand peer-focus-visible:ring-2 peer-focus-visible:ring-app-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app-canvas" />
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-app-pill bg-app-card shadow transition-transform duration-150 peer-checked:translate-x-4" />
          </span>
          <span className="app-body text-app-body transition-colors duration-150 group-hover:text-app-ink">
            Verified farmers only
          </span>
        </label>

        <label className="group flex cursor-pointer items-center gap-3">
          <span className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={highTrust}
              onChange={(e) => updateParam('highTrust', e.target.checked ? 'true' : '')}
              aria-label="Show high-trust farmers only"
            />
            <span className="block h-5 w-9 rounded-app-pill border border-app-hairline bg-app-sunken transition-colors duration-150 peer-checked:border-app-brand peer-checked:bg-app-brand peer-focus-visible:ring-2 peer-focus-visible:ring-app-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app-canvas" />
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-app-pill bg-app-card shadow transition-transform duration-150 peer-checked:translate-x-4" />
          </span>
          <span className="app-body text-app-body transition-colors duration-150 group-hover:text-app-ink">
            High-trust farmers only
          </span>
        </label>
      </div>
    </aside>
  );
}
