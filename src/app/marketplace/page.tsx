import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ListingCard, type IListingCardItem } from '@/components/marketplace/ListingCard';
import { CategoryNav } from '@/components/marketplace/CategoryNav';
import { MarketplaceSearch } from '@/components/marketplace/MarketplaceSearch';
import { FeedFilters } from '@/components/marketplace/FeedFilters';
import { ActiveFilterChips } from '@/components/marketplace/ActiveFilterChips';
import { MobileFilterButton } from '@/components/marketplace/MobileFilterButton';
import { LoadMoreListings } from '@/components/marketplace/LoadMoreListings';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Marketplace — UmojaHub',
  description:
    'Buy directly from verified Kenyan farmers. Fresh produce at fair prices with transparent trust scores and escrow-backed orders.',
};

interface IMarketplaceSearchParams {
  q?: string;
  category?: string;
  county?: string;
  minPrice?: string;
  maxPrice?: string;
  minQuantity?: string;
  verifiedOnly?: string;
  highTrust?: string;
  sort?: string;
  cursor?: string;
}

// GET /api/marketplace is the stable contract; the card consumes an item as-is.
interface IMarketplaceApiResponse {
  data: IListingCardItem[];
  nextCursor: string | null;
  total: number;
}

interface IListingsResult {
  listings: IListingCardItem[];
  nextCursor: string | null;
  total: number;
}

async function fetchListings(params: IMarketplaceSearchParams): Promise<IListingsResult> {
  const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set('q', params.q);
  if (params.category) searchParams.set('category', params.category);
  if (params.county) searchParams.set('county', params.county);
  if (params.minPrice) searchParams.set('minPrice', params.minPrice);
  if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice);
  if (params.minQuantity) searchParams.set('minQuantity', params.minQuantity);
  if (params.verifiedOnly === 'true') searchParams.set('verifiedOnly', 'true');
  if (params.highTrust === 'true') searchParams.set('highTrust', 'true');
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const query = searchParams.toString();
  const url = `${baseUrl}/api/marketplace${query ? `?${query}` : ''}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return { listings: [], nextCursor: null, total: 0 };

  const body = (await res.json()) as IMarketplaceApiResponse;
  return {
    listings: body.data ?? [],
    nextCursor: body.nextCursor ?? null,
    total: body.total ?? 0,
  };
}

function ListingsSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-2 p-3">
            <div className="skeleton h-5 w-24 rounded-app-cell" />
            <div className="skeleton h-4 w-full rounded-app-cell" />
            <div className="skeleton h-3 w-20 rounded-app-cell" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function ListingsGrid({
  searchParams,
}: {
  searchParams: IMarketplaceSearchParams;
}): Promise<React.ReactElement> {
  const { listings, nextCursor, total } = await fetchListings(searchParams);

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-app-card border border-app-hairline bg-app-card py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-app-control border border-app-hairline bg-app-sunken">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" className="text-app-faint" />
            <path d="M14 14L19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-app-faint" />
          </svg>
        </div>
        <p className="app-title text-app-ink">No listings match your search</p>
        <p className="app-body mt-1 text-app-muted">
          Try a different category, widen your price range, or clear your filters.
        </p>
        <Link
          href="/marketplace"
          className="app-body mt-4 inline-flex text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
        >
          Clear everything
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="app-meta text-app-muted" role="status" aria-live="polite">
        {total.toLocaleString()} listing{total !== 1 ? 's' : ''} available
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {listings.map((listing, index) => (
          <ListingCard key={listing.id} listing={listing} priority={index < 4} />
        ))}
      </div>
      {nextCursor && (
        // Keyed on the active filters so appended pages reset when the query changes.
        <LoadMoreListings key={JSON.stringify(searchParams)} initialCursor={nextCursor} />
      )}
    </div>
  );
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<IMarketplaceSearchParams>;
}): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <div className="theme-app min-h-screen bg-app-canvas text-app-body">
      {/* ── Header: brand · search · account ─────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-app-hairline bg-app-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <Link
            href="/"
            className="app-h2 flex-shrink-0 text-app-ink transition-colors duration-150 hover:text-app-brand"
          >
            UmojaHub
          </Link>
          <div className="min-w-0 flex-1 sm:max-w-2xl">
            <MarketplaceSearch />
          </div>
          <div className="hidden flex-shrink-0 items-center gap-4 sm:flex">
            <Link
              href="/auth/login"
              className="app-nav whitespace-nowrap text-app-body transition-colors duration-150 hover:text-app-ink"
            >
              Sell produce
            </Link>
            <Link
              href="/auth/login"
              className="app-nav whitespace-nowrap rounded-app-control bg-app-brand px-3.5 py-2 text-app-on-brand transition-colors duration-150 hover:bg-app-brand-hover"
            >
              Sign in
            </Link>
          </div>

          {/* Compact account entry on mobile (full links hide below sm) */}
          <Link
            href="/auth/login"
            aria-label="Sign in or sell produce"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-app-control border border-app-hairline text-app-body transition-colors duration-150 hover:border-app-border-strong sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3.5 15a5.5 5.5 0 0111 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {/* Category rail */}
        <div className="border-t border-app-hairline">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <CategoryNav />
          </div>
        </div>
      </header>

      {/* ── Body: filter rail + feed ─────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Filter access + active-filter summary */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <MobileFilterButton className="lg:hidden" />
          <ActiveFilterChips />
        </div>

        <div className="lg:flex lg:gap-8">
          <FeedFilters className="hidden lg:sticky lg:top-32 lg:block lg:w-56 lg:flex-shrink-0 lg:self-start" />
          <section className="min-w-0 flex-1">
            <Suspense fallback={<ListingsSkeleton />}>
              <ListingsGrid searchParams={params} />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
}
