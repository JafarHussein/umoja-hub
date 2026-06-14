import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { TrustScoreDisplay } from '@/components/foodhub/TrustScoreDisplay';
import { CheckoutForm } from '@/components/foodhub/CheckoutForm';
import { FarmerTrustTier, ListingUnit, BuyerContactPreference } from '@/types';

export const revalidate = 60;

interface IListingDetail {
  _id: string;
  title: string;
  cropName: string;
  description: string;
  quantityAvailable: number;
  unit: ListingUnit;
  currentPricePerUnit: number;
  pickupCounty: string;
  pickupDescription: string;
  imageUrls: string[];
  isVerifiedListing: boolean;
  buyerContactPreference: BuyerContactPreference[];
  createdAt: string;
  farmer: {
    firstName: string;
    lastName: string;
    county: string;
  };
  trustScore: {
    compositeScore: number;
    tier: FarmerTrustTier;
    ratingScore: {
      averageRating: number;
      totalRatings: number;
    };
  } | null;
}

// GET /api/marketplace/[listingId] returns { data: { ...listing, farmer, trustScore } }
// where farmer is null when the owning account no longer resolves.
type IListingApiDetail = Omit<IListingDetail, 'farmer'> & {
  farmer: IListingDetail['farmer'] | null;
};

async function fetchListing(listingId: string): Promise<IListingDetail | null> {
  const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/marketplace/${listingId}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const body = (await res.json()) as { data: IListingApiDetail | null };
  if (!body.data) return null;

  return {
    ...body.data,
    farmer: body.data.farmer ?? { firstName: '—', lastName: '', county: '' },
  };
}

interface IPageProps {
  params: Promise<{ listingId: string }>;
}

export async function generateMetadata({ params }: IPageProps): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await fetchListing(listingId);
  if (!listing) return { title: 'Listing not found — UmojaHub' };
  return {
    title: `${listing.title} — UmojaHub Marketplace`,
    description: `Buy ${listing.cropName} from ${listing.farmer.firstName} ${listing.farmer.lastName} in ${listing.pickupCounty}. KES ${listing.currentPricePerUnit} / ${listing.unit.toLowerCase()}.`,
  };
}

export default async function ListingDetailPage({ params }: IPageProps): Promise<React.ReactElement> {
  const { listingId } = await params;
  const listing = await fetchListing(listingId);

  if (!listing) {
    notFound();
  }

  const farmerName = `${listing.farmer.firstName} ${listing.farmer.lastName}`;
  const primaryImage = listing.imageUrls[0] ?? null;

  return (
    <div className="h-screen overflow-hidden bg-surface-primary flex flex-col">

      {/* ── Breadcrumb — fixed height ──────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-zinc-800/50 bg-surface-primary">
        <div className="px-6 py-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-t6 font-body text-text-secondary">
              <li>
                <Link
                  href="/marketplace"
                  className="hover:text-text-primary transition-colors duration-150"
                >
                  Marketplace
                </Link>
              </li>
              <li aria-hidden="true" className="text-text-disabled">/</li>
              <li className="text-text-primary truncate max-w-xs">{listing.title}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ── Asymmetric split — fills remaining viewport height ────────────── */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">

        {/* Left — scrollable listing detail (8 cols / ~70%) */}
        <div className="md:col-span-8 overflow-y-auto px-6 py-8 space-y-6">

          {/* Primary image */}
          <div className="aspect-[4/3] bg-surface-secondary rounded-[4px] border border-zinc-800/50 relative overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={`${listing.cropName} — ${listing.title}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 65vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path
                    d="M10 38L24 16L38 38H10Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    className="text-text-disabled"
                  />
                  <circle
                    cx="33"
                    cy="14"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-text-disabled"
                  />
                </svg>
              </div>
            )}
            {listing.isVerifiedListing && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 bg-surface-primary/90 border border-zinc-800/50 rounded-[2px] px-2 py-1 text-t6 font-mono text-accent-green uppercase tracking-wide backdrop-blur-sm">
                  <VerifiedBadge label="Verified listing" />
                  Verified
                </span>
              </div>
            )}
          </div>

          {/* Crop identity */}
          <div>
            <p className="text-t6 font-mono text-text-secondary uppercase tracking-widest mb-1">
              {listing.cropName}
            </p>
            <h1 className="text-t1 font-heading font-semibold text-text-primary tracking-tight">
              {listing.title}
            </h1>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-t1 font-mono font-semibold text-text-primary tabular-nums">
              KES {listing.currentPricePerUnit.toLocaleString()}
            </span>
            <span className="text-t4 font-body text-text-secondary">
              / {listing.unit.toLowerCase()}
            </span>
          </div>

          {/* Farmer identity card */}
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-3">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Farmer
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-t4 font-body font-medium text-text-primary">
                  {farmerName}
                </span>
                {listing.isVerifiedListing && (
                  <VerifiedBadge label={`${farmerName} is verified`} />
                )}
              </div>
              {listing.trustScore && (
                <TrustScoreDisplay
                  compositeScore={listing.trustScore.compositeScore}
                  tier={listing.trustScore.tier}
                />
              )}
            </div>
            <div className="flex items-center gap-4 text-t5 font-body text-text-secondary">
              <span>{listing.farmer.county}</span>
              {listing.trustScore && listing.trustScore.ratingScore.totalRatings >= 3 && (
                <span>
                  {listing.trustScore.ratingScore.averageRating.toFixed(1)} avg
                  ({listing.trustScore.ratingScore.totalRatings} orders)
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              About this listing
            </p>
            <p className="text-t4 font-body text-text-secondary leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-3">
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                Stock
              </p>
              <p className="text-t4 font-body font-medium text-text-primary">
                <span className="font-mono tabular-nums">
                  {listing.quantityAvailable.toLocaleString()}
                </span>{' '}
                <span className="text-text-secondary font-normal">
                  {listing.unit.toLowerCase()}
                </span>
              </p>
            </div>
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-3">
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                Location
              </p>
              <p className="text-t4 font-body font-medium text-text-primary">
                {listing.pickupCounty}
              </p>
            </div>
          </div>

          {/* Pickup details */}
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-4 space-y-1">
            <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Pickup details
            </p>
            <p className="text-t5 font-body text-text-secondary">{listing.pickupDescription}</p>
          </div>

          {/* Contact preference */}
          {listing.buyerContactPreference.length > 0 && (
            <div>
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
                Contact method
              </p>
              <div className="flex gap-2">
                {listing.buyerContactPreference.map((pref) => (
                  <span
                    key={pref}
                    className="text-t6 font-mono text-text-secondary bg-surface-elevated border border-zinc-800/50 rounded-[2px] px-2 py-1 uppercase"
                  >
                    {pref === BuyerContactPreference.PHONE ? 'Phone' : 'Platform message'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — fixed checkout workspace (4 cols / ~30%) */}
        <div className="md:col-span-4 border-l border-zinc-800 bg-zinc-900/30 p-6 overflow-y-auto flex flex-col">
          <CheckoutForm
            listingId={listing._id}
            cropName={listing.cropName}
            unit={listing.unit}
            pricePerUnit={listing.currentPricePerUnit}
            maxQuantity={listing.quantityAvailable}
            pickupCounty={listing.pickupCounty}
          />
          <p className="text-t6 font-body text-text-disabled text-center mt-6">
            Payments processed via M-Pesa. No platform fee.
          </p>
        </div>

      </div>
    </div>
  );
}
