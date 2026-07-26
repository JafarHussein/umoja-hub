'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListingCard, type IListingCardItem } from './ListingCard';

// Progressive feed loading (Marketplace Rebuild, Stage 6). The first page is
// server-rendered (SEO + fast paint); this client island appends subsequent
// pages via the marketplace cursor. Auto-loads as the sentinel nears the
// viewport, with a visible button as the accessible / no-observer fallback.
// Text search disables cursor paging server-side, so this only mounts for
// browse — and it remounts (via key) whenever the active filters change.

const GRID = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4';

interface IMarketplaceApiResponse {
  data: IListingCardItem[];
  nextCursor: string | null;
}

export function LoadMoreListings({ initialCursor }: { initialCursor: string }): React.ReactElement {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<IListingCardItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set('cursor', cursor);
      const res = await fetch(`/api/marketplace?${params.toString()}`);
      if (!res.ok) throw new Error('request failed');
      const body = (await res.json()) as IMarketplaceApiResponse;
      setItems((prev) => [...prev, ...(body.data ?? [])]);
      setCursor(body.nextCursor ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, cursor, searchParams]);

  // Auto-load when the sentinel approaches the viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loading, loadMore]);

  return (
    <>
      {items.length > 0 && (
        <div className={`mt-3 sm:mt-4 ${GRID}`}>
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {loading && (
        <div className={`mt-3 sm:mt-4 ${GRID}`} aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card"
            >
              <div className="skeleton aspect-[4/3] w-full" />
              <div className="space-y-2 p-3">
                <div className="skeleton h-5 w-24 rounded-app-cell" />
                <div className="skeleton h-4 w-full rounded-app-cell" />
                <div className="skeleton h-3 w-20 rounded-app-cell" />
              </div>
            </div>
          ))}
        </div>
      )}

      {cursor && (
        <div ref={sentinel} className="flex justify-center py-6">
          {!loading && (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="app-nav rounded-app-control border border-app-hairline bg-app-card px-5 py-2.5 text-app-body transition-colors duration-150 hover:border-app-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring"
            >
              {error ? 'Retry' : 'Load more'}
            </button>
          )}
        </div>
      )}

      <span aria-live="polite" className="sr-only">
        {loading ? 'Loading more listings' : ''}
      </span>
    </>
  );
}
