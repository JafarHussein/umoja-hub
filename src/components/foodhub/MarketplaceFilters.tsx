'use client';

import React, { useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { KENYAN_COUNTIES } from '@/types';

export function MarketplaceFilters(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const cropName = searchParams.get('cropName') ?? '';
  const county = searchParams.get('county') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';

  const hasActiveFilters = !!(cropName || county || minPrice || maxPrice || verifiedOnly);

  function updateParam(key: string, value: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('cursor');
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function clearAll(): void {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }

  return (
    <aside
      className={[
        'w-52 flex-shrink-0 space-y-5 transition-opacity duration-150',
        isPending ? 'opacity-50' : 'opacity-100',
      ].join(' ')}
      aria-label="Filter listings"
    >
      <div className="flex items-center justify-between">
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">Filters</p>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-t6 text-text-secondary hover:text-text-primary transition-colors duration-150 underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Crop name */}
      <div className="space-y-1.5">
        <label htmlFor="filter-crop" className="text-t5 font-body text-text-secondary block">
          Crop
        </label>
        <Input
          id="filter-crop"
          type="search"
          placeholder="e.g. tomatoes, maize"
          value={cropName}
          onChange={(e) => updateParam('cropName', e.target.value)}
        />
      </div>

      {/* County */}
      <div className="space-y-1.5">
        <label htmlFor="filter-county" className="text-t5 font-body text-text-secondary block">
          County
        </label>
        <select
          id="filter-county"
          value={county}
          onChange={(e) => updateParam('county', e.target.value)}
          className="w-full min-h-[44px] bg-surface-secondary border border-white/10 rounded-sm text-t5 font-body text-text-primary px-3 focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all duration-150"
        >
          <option value="">All counties</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div className="space-y-1.5">
        <p className="text-t5 font-body text-text-secondary">Price range (KES)</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParam('minPrice', e.target.value)}
            aria-label="Minimum price"
          />
          <span className="text-text-disabled flex-shrink-0" aria-hidden="true">
            –
          </span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Verified only toggle */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={verifiedOnly}
            onChange={(e) => updateParam('verifiedOnly', e.target.checked ? 'true' : '')}
            aria-label="Show verified listings only"
          />
          <div className="w-9 h-5 bg-surface-secondary rounded-full border border-white/10 peer-checked:bg-accent-green peer-focus-visible:ring-2 peer-focus-visible:ring-accent-green peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-primary transition-colors duration-150" />
          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-text-primary rounded-full shadow transition-transform duration-150 peer-checked:translate-x-4" />
        </div>
        <span className="text-t5 font-body text-text-secondary group-hover:text-text-primary transition-colors duration-150">
          Verified listings only
        </span>
      </label>
    </aside>
  );
}
