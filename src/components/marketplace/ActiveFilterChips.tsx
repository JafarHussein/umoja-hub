'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { LISTING_CATEGORY_LABEL, ListingCategory } from '@/types';

// Active-filter summary (Marketplace Rebuild, Stage 5). Makes the current query
// legible at a glance and removable one chip at a time — the buyer never has to
// reopen a panel to see or undo what is filtering the feed. Reads the same URL
// params the filters/search/category controls write.

interface IChip {
  key: string;
  label: string;
  remove: string[]; // params cleared when the chip is dismissed
}

export function ActiveFilterChips(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get('q');
  const category = searchParams.get('category');
  const county = searchParams.get('county');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minQuantity = searchParams.get('minQuantity');
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const highTrust = searchParams.get('highTrust') === 'true';

  const chips: IChip[] = [];
  if (q) chips.push({ key: 'q', label: `“${q}”`, remove: ['q'] });
  if (category && category in LISTING_CATEGORY_LABEL) {
    chips.push({
      key: 'category',
      label: LISTING_CATEGORY_LABEL[category as ListingCategory],
      remove: ['category'],
    });
  }
  if (county) chips.push({ key: 'county', label: county, remove: ['county'] });
  if (minPrice || maxPrice) {
    const label = minPrice && maxPrice
      ? `KSh ${Number(minPrice).toLocaleString()}–${Number(maxPrice).toLocaleString()}`
      : minPrice
        ? `From KSh ${Number(minPrice).toLocaleString()}`
        : `Up to KSh ${Number(maxPrice).toLocaleString()}`;
    chips.push({ key: 'price', label, remove: ['minPrice', 'maxPrice'] });
  }
  if (minQuantity) {
    chips.push({ key: 'minQuantity', label: `Min ${Number(minQuantity).toLocaleString()}`, remove: ['minQuantity'] });
  }
  if (verifiedOnly) chips.push({ key: 'verifiedOnly', label: 'Verified', remove: ['verifiedOnly'] });
  if (highTrust) chips.push({ key: 'highTrust', label: 'High trust', remove: ['highTrust'] });

  if (chips.length === 0) return null;

  function removeKeys(keys: string[]): void {
    const params = new URLSearchParams(searchParams.toString());
    keys.forEach((k) => params.delete(k));
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
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 transition-opacity duration-150',
        isPending && 'opacity-60'
      )}
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => removeKeys(chip.remove)}
          className="app-meta inline-flex items-center gap-1.5 rounded-app-pill border border-app-hairline bg-app-card py-1 pl-3 pr-2 text-app-body transition-colors duration-150 hover:border-app-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className="text-app-faint">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="app-meta text-app-brand underline underline-offset-2 transition-colors duration-150 hover:text-app-brand-hover focus-visible:outline-none"
      >
        Clear all
      </button>
    </div>
  );
}
