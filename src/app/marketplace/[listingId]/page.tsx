import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingGallery } from '@/components/marketplace/ListingGallery';
import { CheckoutPanel } from '@/components/marketplace/CheckoutPanel';
import { PriceFairness } from '@/components/marketplace/PriceFairness';
import { ListingCard, type IListingCardItem } from '@/components/marketplace/ListingCard';
import { VerificationBadge, DeliveryConfidence } from '@/components/app';
import {
  FarmerTrustTier,
  ListingUnit,
  ListingCategory,
  BuyerContactPreference,
  LISTING_CATEGORY_LABEL,
} from '@/types';

export const revalidate = 60;

interface IListingDetail {
  _id: string;
  title: string;
  cropName: string;
  category: ListingCategory | null;
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
  farmer: { firstName: string; lastName: string; county: string };
  trustScore: {
    compositeScore: number;
    tier: FarmerTrustTier;
    ratingScore: { averageRating: number; totalRatings: number };
  } | null;
  similar: IListingCardItem[];
}

type IListingApiDetail = Omit<IListingDetail, 'farmer'> & {
  farmer: IListingDetail['farmer'] | null;
};

async function fetchListing(listingId: string): Promise<IListingDetail | null> {
  const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/marketplace/${listingId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { data: IListingApiDetail | null };
  if (!body.data) return null;

  return {
    ...body.data,
    farmer: body.data.farmer ?? { firstName: '—', lastName: '', county: '' },
    similar: body.data.similar ?? [],
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
    description: `Buy ${listing.cropName} from ${listing.farmer.firstName} ${listing.farmer.lastName} in ${listing.pickupCounty}. KSh ${listing.currentPricePerUnit} / ${listing.unit.toLowerCase()}.`,
  };
}

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <p className="app-label text-app-muted">{children}</p>;
}

export default async function ListingDetailPage({ params }: IPageProps): Promise<React.ReactElement> {
  const { listingId } = await params;
  const listing = await fetchListing(listingId);
  if (!listing) notFound();

  const farmerName = `${listing.farmer.firstName} ${listing.farmer.lastName}`.trim();
  const trust = listing.trustScore;
  const hasRatings = Boolean(trust && trust.ratingScore.totalRatings >= 3);

  return (
    <div className="theme-app min-h-screen bg-app-canvas text-app-body">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-app-hairline bg-app-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="app-h2 text-app-ink transition-colors duration-150 hover:text-app-brand"
          >
            UmojaHub
          </Link>
          <Link
            href="/marketplace"
            className="app-nav inline-flex items-center gap-1.5 text-app-body transition-colors duration-150 hover:text-app-ink"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M9.5 6H2.5M5.5 9L2.5 6L5.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <ol className="app-meta flex items-center gap-2 text-app-muted">
            <li>
              <Link href="/marketplace" className="transition-colors duration-150 hover:text-app-ink">
                Marketplace
              </Link>
            </li>
            {listing.category && (
              <>
                <li aria-hidden="true" className="text-app-faint">/</li>
                <li>
                  <Link
                    href={`/marketplace?category=${listing.category}`}
                    className="transition-colors duration-150 hover:text-app-ink"
                  >
                    {LISTING_CATEGORY_LABEL[listing.category]}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true" className="text-app-faint">/</li>
            <li className="max-w-xs truncate text-app-ink">{listing.title}</li>
          </ol>
        </nav>

        <div className="mt-4 grid gap-8 lg:grid-cols-12">
          {/* ── Left: listing detail ─────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-7">
            <ListingGallery images={listing.imageUrls} alt={`${listing.cropName} — ${listing.title}`} />

            {/* Identity */}
            <div>
              <p className="app-label uppercase tracking-wide text-app-muted">{listing.cropName}</p>
              <h1 className="app-h1 mt-1 text-app-ink">{listing.title}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="app-data-xl text-app-ink">
                KSh {listing.currentPricePerUnit.toLocaleString()}
              </span>
              <span className="app-body text-app-muted">/ {listing.unit.toLowerCase()}</span>
            </div>

            {/* Price fairness (Price Intelligence) */}
            <PriceFairness
              cropName={listing.cropName}
              county={listing.pickupCounty}
              unit={listing.unit}
              price={listing.currentPricePerUnit}
            />

            {/* Farmer trust panel */}
            <div className="space-y-3 rounded-app-card border border-app-hairline bg-app-card p-4">
              <SectionLabel>Farmer</SectionLabel>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="app-body-strong text-app-ink">{farmerName || '—'}</span>
                  {listing.isVerifiedListing && <VerificationBadge state="verified" />}
                </div>
                {trust && trust.compositeScore > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-app-pill bg-app-brand-surface px-2.5 py-1">
                    <span aria-hidden className="text-app-brand">◆</span>
                    <span className="app-label text-app-muted">Trust</span>
                    <span className="app-data-m text-app-brand">{trust.compositeScore}</span>
                    <span className="app-meta text-app-muted">· {trust.tier}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="app-meta text-app-muted">{listing.farmer.county || listing.pickupCounty}</span>
                {trust && (
                  <DeliveryConfidence completed={trust.ratingScore.totalRatings} />
                )}
                {hasRatings && trust && (
                  <span className="app-meta text-app-muted">
                    <span className="app-data-m text-app-ink">
                      {trust.ratingScore.averageRating.toFixed(1)}
                    </span>{' '}
                    avg over {trust.ratingScore.totalRatings} orders
                  </span>
                )}
              </div>
            </div>

            {/* Transaction protections */}
            <div className="space-y-2.5 rounded-app-card border border-app-brand-border bg-app-brand-surface p-4">
              <SectionLabel>Your protections</SectionLabel>
              <ul className="space-y-2">
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="app-title leading-none text-app-brand">🔒</span>
                  <p className="app-meta text-app-muted">
                    <span className="app-body-strong text-app-ink">Escrow-protected payment.</span> Your
                    money is held by the platform and released to the farmer only when you confirm you
                    received your order.
                  </p>
                </li>
                {listing.isVerifiedListing && (
                  <li className="flex items-start gap-2.5">
                    <span aria-hidden className="app-body-strong leading-none text-app-brand">✓</span>
                    <p className="app-meta text-app-muted">
                      <span className="app-body-strong text-app-ink">Verified farmer.</span> Identity
                      reviewed and approved by UmojaHub administrators.
                    </p>
                  </li>
                )}
                <li className="flex items-start gap-2.5">
                  <span aria-hidden className="app-body-strong leading-none text-app-brand">⚖</span>
                  <p className="app-meta text-app-muted">
                    <span className="app-body-strong text-app-ink">Platform mediation.</span> If
                    something goes wrong, our team can step in to resolve it.
                  </p>
                </li>
              </ul>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <SectionLabel>About this listing</SectionLabel>
              <p className="app-body leading-relaxed text-app-body">{listing.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-app-card border border-app-hairline bg-app-card p-3">
                <SectionLabel>In stock</SectionLabel>
                <p className="mt-1">
                  <span className="app-data-m text-app-ink">
                    {listing.quantityAvailable.toLocaleString()}
                  </span>{' '}
                  <span className="app-body text-app-muted">{listing.unit.toLowerCase()}</span>
                </p>
              </div>
              <div className="rounded-app-card border border-app-hairline bg-app-card p-3">
                <SectionLabel>Location</SectionLabel>
                <p className="app-body mt-1 text-app-ink">{listing.pickupCounty}</p>
              </div>
            </div>

            {/* Pickup */}
            <div className="space-y-1 rounded-app-card border border-app-hairline bg-app-card p-4">
              <SectionLabel>Pickup details</SectionLabel>
              <p className="app-body text-app-muted">{listing.pickupDescription}</p>
            </div>

            {/* Contact method */}
            {listing.buyerContactPreference.length > 0 && (
              <div className="space-y-2">
                <SectionLabel>Contact method</SectionLabel>
                <div className="flex gap-2">
                  {listing.buyerContactPreference.map((pref) => (
                    <span
                      key={pref}
                      className="app-meta rounded-app-pill border border-app-hairline bg-app-card px-2.5 py-1 text-app-body"
                    >
                      {pref === BuyerContactPreference.PHONE ? 'Phone' : 'Platform message'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: checkout ──────────────────────────────────────────── */}
          <aside className="lg:col-span-5">
            <div className="rounded-app-card border border-app-hairline bg-app-card p-5 lg:sticky lg:top-24">
              <CheckoutPanel
                listingId={listing._id}
                cropName={listing.cropName}
                unit={listing.unit}
                pricePerUnit={listing.currentPricePerUnit}
                maxQuantity={listing.quantityAvailable}
                pickupCounty={listing.pickupCounty}
              />
              <p className="app-meta mt-6 text-center text-app-faint">
                Payments via M-Pesa · funds held in escrow until you confirm receipt · no platform fee.
              </p>
            </div>
          </aside>
        </div>

        {/* ── Similar listings ───────────────────────────────────────────── */}
        {listing.similar.length > 0 && (
          <section className="mt-12">
            <h2 className="app-h2 text-app-ink">Similar produce</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
              {listing.similar.map((item) => (
                <ListingCard key={item.id} listing={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
