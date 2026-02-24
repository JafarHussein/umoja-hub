import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FarmerListingCard, type IListingCardData } from '@/components/foodhub/FarmerListingCard';
import { MarketplaceFilters } from '@/components/foodhub/MarketplaceFilters';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Marketplace — UmojaHub',
  description:
    'Buy directly from verified Kenyan farmers. Fresh produce at fair prices with transparent trust scores.',
};

interface IMarketplaceSearchParams {
  cropName?: string;
  county?: string;
  minPrice?: string;
  maxPrice?: string;
  verifiedOnly?: string;
  cursor?: string;
}

interface IListingsResponse {
  listings: IListingCardData[];
  nextCursor: string | null;
  total: number;
}

async function fetchListings(params: IMarketplaceSearchParams): Promise<IListingsResponse> {
  const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
  const searchParams = new URLSearchParams();

  if (params.cropName) searchParams.set('cropName', params.cropName);
  if (params.county) searchParams.set('county', params.county);
  if (params.minPrice) searchParams.set('minPrice', params.minPrice);
  if (params.maxPrice) searchParams.set('maxPrice', params.maxPrice);
  if (params.verifiedOnly === 'true') searchParams.set('verifiedOnly', 'true');
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const query = searchParams.toString();
  const url = `${baseUrl}/api/marketplace${query ? `?${query}` : ''}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    return { listings: [], nextCursor: null, total: 0 };
  }

  return res.json() as Promise<IListingsResponse>;
}

function ListingsSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

interface IListingsGridProps {
  searchParams: IMarketplaceSearchParams;
}

async function ListingsGrid({ searchParams }: IListingsGridProps): Promise<React.ReactElement> {
  const { listings, total } = await fetchListings(searchParams);

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded bg-surface-secondary border border-white/5 flex items-center justify-center mb-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 3L17 16H3L10 3Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="text-text-disabled"
            />
          </svg>
        </div>
        <p className="text-t4 font-body font-medium text-text-primary mb-1">No listings found</p>
        <p className="text-t5 font-body text-text-secondary">
          Try adjusting your filters or check back soon for new produce.
        </p>
        <Link
          href="/marketplace"
          className="mt-4 text-t5 font-body text-accent-green hover:underline underline-offset-2"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-t6 font-body text-text-disabled">
        {total.toLocaleString()} listing{total !== 1 ? 's' : ''} available
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <FarmerListingCard key={listing._id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

interface IPageProps {
  searchParams: Promise<IMarketplaceSearchParams>;
}

export default async function MarketplacePage({ searchParams }: IPageProps): Promise<React.ReactElement> {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <div className="border-b border-white/5 bg-surface-primary sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150">
            ← Back
          </Link>
          <h1 className="text-t3 font-heading font-semibold text-text-primary">Marketplace</h1>
          <Link
            href="/auth/register"
            className="text-t5 font-body text-accent-green hover:underline underline-offset-2"
          >
            Sell produce
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Filter sidebar — client component inside Suspense */}
          <Suspense
            fallback={
              <div className="w-52 flex-shrink-0 space-y-5">
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-11 w-full rounded-sm" />
                <div className="skeleton h-11 w-full rounded-sm" />
                <div className="skeleton h-11 w-full rounded-sm" />
              </div>
            }
          >
            <MarketplaceFilters />
          </Suspense>

          {/* Listings */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<ListingsSkeleton />}>
              <ListingsGrid searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
