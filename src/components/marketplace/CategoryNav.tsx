'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { LISTING_CATEGORY_ORDER, LISTING_CATEGORY_LABEL } from '@/types';

// Horizontal category rail (Marketplace Rebuild, Stage 3). The primary
// discovery gesture — one tap narrows the whole feed. Reads/writes the
// `category` URL param so the server feed re-queries; keeps other filters and
// the search term intact, and resets pagination.

export function CategoryNav(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const active = searchParams.get('category') ?? '';

  function select(category: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (category && category !== active) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.delete('cursor');
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  const chips = [{ value: '', label: 'All produce' }].concat(
    LISTING_CATEGORY_ORDER.map((c) => ({ value: c, label: LISTING_CATEGORY_LABEL[c] }))
  );

  return (
    <nav
      aria-label="Produce categories"
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 transition-opacity duration-150',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        isPending && 'opacity-60'
      )}
    >
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <button
            key={chip.value || 'all'}
            type="button"
            onClick={() => select(chip.value)}
            aria-pressed={isActive}
            className={cn(
              'app-nav whitespace-nowrap rounded-app-pill border px-3.5 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-1 focus-visible:ring-offset-app-canvas',
              isActive
                ? 'border-app-brand bg-app-brand text-app-on-brand'
                : 'border-app-hairline bg-app-card text-app-body hover:border-app-border-strong'
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </nav>
  );
}
