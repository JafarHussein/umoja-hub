import React from 'react';
import Link from 'next/link';
import { ListingCategory } from '@/types';
import { ListingPhoto } from './ListingPhoto';

/** Drawn when a listing has no photograph, and when the one it has fails. */
function CardPlaceholder(): React.ReactElement {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M8 32L20 14L32 32H8Z" fill="currentColor" className="text-app-faint/50" />
        <circle cx="27" cy="12" r="4" fill="currentColor" className="text-app-faint/50" />
      </svg>
    </div>
  );
}

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

// Freshness is now carried by this line alone. It used to be told twice — once
// here and once as a "New" ribbon over the photo — which is the clearest case
// of a chip restating what the card already said.
function freshness(iso: string): { label: string } {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < DAY_MS) return { label: 'Today' };
  const days = Math.floor(diff / DAY_MS);
  if (days < 30) return { label: `${days}d ago` };
  const months = Math.floor(days / 30);
  return { label: `${months}mo ago` };
}

// Below this share of a typical batch we nudge the buyer that stock is thinning
// — creates the "act now" pull without inventing numbers.
const LOW_STOCK_THRESHOLD = 10;

export function ListingCard({
  listing,
  priority = false,
}: {
  listing: IListingCardItem;
  /** Preload this image (set only for the first above-the-fold cards — LCP). */
  priority?: boolean;
}): React.ReactElement {
  const { label: freshLabel } = freshness(listing.createdAt);
  const farmerName = `${listing.farmer.firstName} ${listing.farmer.lastName}`.trim();
  const unit = listing.unit.toLowerCase();
  const lowStock = listing.quantityAvailable > 0 && listing.quantityAvailable <= LOW_STOCK_THRESHOLD;
  const hasTrust = listing.farmer.trustScore > 0;

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      // Bandwidth-conscious for low-connectivity users: navigate on demand
      // rather than viewport-prefetching every detail page in a busy feed.
      prefetch={false}
      className="group block rounded-app-card focus:outline-none focus-visible:ring-2 focus-visible:ring-app-ring focus-visible:ring-offset-2 focus-visible:ring-offset-app-canvas"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-app-card border border-app-hairline bg-app-card transition-shadow duration-150 group-hover:shadow-app-float">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden bg-app-sunken">
          {listing.imageUrl ? (
            <ListingPhoto
              src={listing.imageUrl}
              alt={`${listing.cropName} from ${listing.pickupCounty}`}
              priority={priority}
              className="object-cover transition-transform duration-250 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              fallback={<CardPlaceholder />}
            />
          ) : (
            <CardPlaceholder />
          )}

          {/* One overlay, and only when it says something nothing else does.
              This corner used to carry four: a category chip, a Verified
              ribbon, and a New/Almost-gone ribbon.

              Category went because the buyer arrived here by category — via
              search, a filter or the category nav — so "Vegetables" under a
              photograph of spinach restates the query they just made.

              Verified went because it marked every card. A signal carried by
              everything carries nothing, and a badge that means nothing teaches
              people to skip badges that do. Verification is a precondition of
              publishing, so it is a property of the marketplace rather than of
              any listing in it; it now appears where it is actually acted on —
              the listing, the farmer, checkout.

              New went because it repeated the body text three lines below,
              which already reads "Kericho · Today".

              Almost gone stays. Scarcity appears nowhere else on the card, it
              changes whether this listing is worth opening now rather than
              later, and it is true of few listings — so it still discriminates. */}
          {lowStock && (
            <span className="app-label absolute bottom-2 left-2 rounded-app-pill bg-app-warning-surface px-2 py-0.5 text-app-warning">
              Almost gone
            </span>
          )}
        </div>

        {/* Body — the four things that decide whether this is worth opening:
            what it costs, what it is, where it is, and who is selling it.
            Spaced rather than packed: the room the removed chips gave back is
            spent on breathing space, not refilled with more to read. */}
        <div className="flex flex-1 flex-col p-4">
          {/* Price leads. It is the one value a buyer scans a feed for, and it
              is what makes two otherwise similar listings comparable. */}
          <p className="app-data-l text-app-ink">
            KSh {listing.currentPricePerUnit.toLocaleString()}
            <span className="app-meta text-app-faint"> / {unit}</span>
          </p>

          <h3 className="app-body-strong mt-1.5 line-clamp-2 text-app-ink">{listing.title}</h3>

          <p className="app-meta mt-1.5 text-app-muted">
            {listing.pickupCounty} · {freshLabel}
          </p>

          {/* Farmer, and the one trust signal that still discriminates.
              The Trust Score survives the cut the Verified badge did not
              because it is earned and it varies — a 51 and an 82 are different
              propositions, where "Verified" and "Verified" are not. It is
              pushed to the foot of the card and given no colour of its own, so
              it reads as a quiet fact about the seller rather than a claim
              competing with the produce. */}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="app-meta truncate text-app-muted">{farmerName || '—'}</span>
            {hasTrust && (
              <span
                className="app-meta inline-flex flex-shrink-0 items-center gap-1 text-app-muted"
                aria-label={`Farmer trust score ${listing.farmer.trustScore}`}
              >
                <span aria-hidden>◆</span>
                <span className="app-data-m" aria-hidden>
                  {listing.farmer.trustScore}
                </span>
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
