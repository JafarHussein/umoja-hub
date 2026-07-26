import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LISTING_CATEGORY_LABEL, ListingCategory } from '@/types';

// Marketplace feed card (Marketplace Rebuild, Stage 6 primitive, introduced in
// Stage 3). Built on the `.theme-app` token group. Consumes the GET
// /api/marketplace item shape directly — the API is the contract; this card
// never reshapes it. Designed to scan in a glance: photo, price, title,
// location, farmer, trust, freshness.

export interface IListingCardFarmer {
  id: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  trustScore: number;
  trustTier: string;
}

export interface IListingCardItem {
  id: string;
  title: string;
  cropName: string;
  category: ListingCategory | null;
  quantityAvailable: number;
  unit: string;
  currentPricePerUnit: number;
  pickupCounty: string;
  imageUrl: string;
  farmer: IListingCardFarmer;
  listingStatus: string;
  createdAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function freshness(iso: string): { label: string; isNew: boolean } {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < DAY_MS) return { label: 'Today', isNew: true };
  const days = Math.floor(diff / DAY_MS);
  if (days < 3) return { label: `${days}d ago`, isNew: true };
  if (days < 30) return { label: `${days}d ago`, isNew: false };
  const months = Math.floor(days / 30);
  return { label: `${months}mo ago`, isNew: false };
}

// Below this share of a typical batch we nudge the buyer that stock is thinning
// — creates the "act now" pull without inventing numbers.
const LOW_STOCK_THRESHOLD = 10;

export function ListingCard({ listing }: { listing: IListingCardItem }): React.ReactElement {
  const { label: freshLabel, isNew } = freshness(listing.createdAt);
  const farmerName = `${listing.farmer.firstName} ${listing.farmer.lastName}`.trim();
  const unit = listing.unit.toLowerCase();
  const lowStock = listing.quantityAvailable > 0 && listing.quantityAvailable <= LOW_STOCK_THRESHOLD;
  const hasTrust = listing.farmer.trustScore > 0;

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group block rounded-app-card focus:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-app-card border border-app-hairline bg-app-card transition-shadow duration-150 group-hover:shadow-app-float">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden bg-app-sunken">
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={`${listing.cropName} from ${listing.pickupCounty}`}
              fill
              className="object-cover transition-transform duration-250 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <path d="M8 32L20 14L32 32H8Z" fill="currentColor" className="text-app-faint/50" />
                <circle cx="27" cy="12" r="4" fill="currentColor" className="text-app-faint/50" />
              </svg>
            </div>
          )}

          {/* Category chip */}
          {listing.category && (
            <span className="app-label absolute left-2 top-2 rounded-app-pill bg-app-card/90 px-2 py-0.5 text-app-body backdrop-blur-sm">
              {LISTING_CATEGORY_LABEL[listing.category]}
            </span>
          )}

          {/* Verified ribbon */}
          {listing.farmer.isVerified && (
            <span className="app-label absolute right-2 top-2 inline-flex items-center gap-1 rounded-app-pill bg-app-success-surface px-2 py-0.5 text-app-success backdrop-blur-sm">
              <span aria-hidden>✓</span>
              Verified
            </span>
          )}

          {/* Freshness / low-stock ribbon */}
          {isNew ? (
            <span className="app-label absolute bottom-2 left-2 rounded-app-pill bg-app-brand px-2 py-0.5 text-app-on-brand">
              New
            </span>
          ) : lowStock ? (
            <span className="app-label absolute bottom-2 left-2 rounded-app-pill bg-app-warning-surface px-2 py-0.5 text-app-warning">
              Low stock
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-3">
          {/* Price */}
          <p className="app-data-l text-app-ink">
            KSh {listing.currentPricePerUnit.toLocaleString()}
            <span className="app-meta text-app-faint"> / {unit}</span>
          </p>

          {/* Title */}
          <h3 className="app-body-strong mt-1 line-clamp-2 text-app-ink">{listing.title}</h3>

          {/* Location + freshness */}
          <p className="app-meta mt-1 text-app-muted">
            {listing.pickupCounty} · {freshLabel}
          </p>

          {/* Farmer + trust */}
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-app-hairline pt-2">
            <span className="app-meta truncate text-app-muted">{farmerName || '—'}</span>
            {hasTrust && (
              <span className="app-meta inline-flex flex-shrink-0 items-center gap-1 text-app-brand">
                <span aria-hidden>◆</span>
                <span className="app-data-m">{listing.farmer.trustScore}</span>
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
