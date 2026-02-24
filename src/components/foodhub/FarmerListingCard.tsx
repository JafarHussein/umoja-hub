import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { TrustScoreDisplay } from './TrustScoreDisplay';
import { FarmerTrustTier, ListingUnit } from '@/types';

export interface IListingCardFarmer {
  firstName: string;
  lastName: string;
}

export interface IListingCardTrustScore {
  compositeScore: number;
  tier: FarmerTrustTier;
}

export interface IListingCardData {
  _id: string;
  title: string;
  cropName: string;
  currentPricePerUnit: number;
  unit: ListingUnit;
  quantityAvailable: number;
  pickupCounty: string;
  imageUrls: string[];
  isVerifiedListing: boolean;
  farmer: IListingCardFarmer;
  trustScore: IListingCardTrustScore | null;
}

export interface IFarmerListingCardProps {
  listing: IListingCardData;
}

export function FarmerListingCard({ listing }: IFarmerListingCardProps): React.ReactElement {
  const imageUrl = listing.imageUrls[0] ?? null;
  const farmerName = `${listing.farmer.firstName} ${listing.farmer.lastName}`;

  return (
    <Link
      href={`/marketplace/${listing._id}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary rounded"
    >
      <article className="bg-surface-elevated border border-white/5 rounded overflow-hidden transition-all duration-150 group-hover:border-white/10">
        {/* Crop image */}
        <div className="aspect-[4/3] bg-surface-secondary relative overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${listing.cropName} from ${listing.pickupCounty}`}
              fill
              className="object-cover transition-transform duration-250 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 32L20 14L32 32H8Z"
                  fill="currentColor"
                  className="text-text-disabled"
                />
                <circle cx="27" cy="12" r="4" fill="currentColor" className="text-text-disabled" />
              </svg>
            </div>
          )}

          {listing.isVerifiedListing && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 bg-surface-primary/80 border border-white/10 rounded-[2px] px-1.5 py-0.5 text-t6 font-mono text-accent-green uppercase tracking-wide backdrop-blur-sm">
                <VerifiedBadge label="Verified listing" />
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-4">
          {/* Crop label */}
          <p className="text-t6 font-mono text-text-secondary uppercase tracking-widest mb-1">
            {listing.cropName}
          </p>

          {/* Title */}
          <h3 className="text-t4 font-body font-medium text-text-primary mb-3 line-clamp-1">
            {listing.title}
          </h3>

          {/* Price */}
          <div className="mb-3">
            <span className="text-t2 font-heading font-semibold text-text-primary">
              KES {listing.currentPricePerUnit.toLocaleString()}
            </span>
            <span className="text-t5 text-text-secondary ml-1">
              / {listing.unit.toLowerCase()}
            </span>
          </div>

          {/* Farmer row + trust score */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-t5 text-text-secondary truncate">{farmerName}</span>
              {listing.isVerifiedListing && <VerifiedBadge label={`${farmerName} is verified`} />}
            </div>
            {listing.trustScore && (
              <TrustScoreDisplay
                compositeScore={listing.trustScore.compositeScore}
                tier={listing.trustScore.tier}
                size="sm"
              />
            )}
          </div>

          {/* Meta: county + stock */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-t6 text-text-disabled">{listing.pickupCounty}</span>
            <span className="text-t6 text-text-disabled">
              {listing.quantityAvailable.toLocaleString()}&nbsp;{listing.unit.toLowerCase()} left
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
