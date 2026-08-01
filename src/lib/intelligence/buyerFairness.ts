// ---------------------------------------------------------------------------
// Buyer fairness — a narrow projection of the Price Intelligence recommendation
// for the public marketplace listing page.
//
// Why a projection rather than opening /api/prices/recommendation to buyers:
// the recommendation object is a farmer decision-support instrument. Serving it
// publicly would hand out county-by-county medians and a forward view — an
// arbitrage map for the intermediaries the platform exists to compress — and
// would give one side of a negotiation the other side's floor. A buyer needs to
// know whether THIS price is reasonable, not what the seller will accept.
//
// Follows the pattern already established by cooperativeInsights.ts and
// ngoMarketHealth.ts: one composeRecommendation call, projected down to what a
// single audience may see. Fixes D14 (see context/price-intelligence/10_*.md).
// ---------------------------------------------------------------------------

import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import { composeRecommendation } from './priceIntelligence';
import type { ConfidenceBand, PriceRecommendation } from './priceIntelligence';
import type { GeoScope } from './regions';

/**
 * Positional bands, per `08` §4 and `09` §3.5. Purely a function of the price
 * and the already-computed range, so the farmer surface and the buyer surface
 * cannot reach contradictory judgements about the same listing.
 */
export type PriceAssessment = 'WELL_BELOW' | 'BELOW' | 'IN_RANGE' | 'ABOVE' | 'WELL_ABOVE';

/** Distance outside the range at which "a little" becomes "well". */
const WELL_MARGIN = 0.15;

export interface BuyerFairness {
  /** Null when there is not enough evidence to judge — never a default band. */
  assessment: PriceAssessment | null;
  confidenceBand: ConfidenceBand;
  /** Geographic tier the estimate actually used, so "typical" is not read as local. */
  basis: GeoScope;
  windowDays: number;
}

/**
 * Pure five-band classification. Returns null when there is no range, which is
 * the engine's way of saying it has fewer than MIN_POINTS comparable
 * observations. A missing band renders nothing; it never falls back to IN_RANGE.
 */
export function assessPrice(
  price: number,
  range: { low: number; high: number } | null
): PriceAssessment | null {
  if (!range || !Number.isFinite(price) || price <= 0) return null;

  const { low, high } = range;
  if (price >= low && price <= high) return 'IN_RANGE';

  // Compare the proportional distance rather than a scaled bound: `high * 1.15`
  // is 229.99999999999997 for high = 200, which would push an exactly-15% price
  // into WELL_ABOVE. The ratio form puts the boundary where the spec says it is.
  if (price > high) return (price - high) / high > WELL_MARGIN ? 'WELL_ABOVE' : 'ABOVE';
  return (low - price) / low > WELL_MARGIN ? 'WELL_BELOW' : 'BELOW';
}

/**
 * Projects a full recommendation down to the buyer-visible contract.
 *
 * Deliberately omitted: recommendedPricePerUnit and range (the seller's number
 * and floor), neighbours, trend, demand, expected earnings, point counts and
 * every trust input. `06` §3 — trust weights whose observations count, never
 * what a farmer may charge, and the buyer surface must not imply otherwise.
 */
export function projectBuyerFairness(
  recommendation: PriceRecommendation,
  price: number
): BuyerFairness {
  return {
    assessment: assessPrice(price, recommendation.range),
    confidenceBand: recommendation.confidenceBand,
    basis: recommendation.basis.geoScope,
    windowDays: recommendation.basis.windowDays,
  };
}

/**
 * Listing-scoped entry point. The caller supplies a listing id rather than a
 * free crop/county/unit triple, so the endpoint cannot be swept across the
 * taxonomy to reconstruct the engine.
 *
 * Returns null for exactly one reason — the listing does not exist. Infrastructure
 * failures propagate, so the caller can answer with a truthful 500 rather than a
 * 404 that claims the listing is gone. Collapsing distinct causes into one silent
 * empty result is what hid D14 for an entire release, and is not repeated here.
 *
 * `composeRecommendation` already absorbs its own failures into a null-price,
 * zero-confidence result, so thin or unavailable price data surfaces as an
 * unjudgeable assessment rather than an error.
 */
export async function getListingFairness(listingId: string): Promise<BuyerFairness | null> {
  await connectDB();
  const { default: MarketplaceListing } = await import('@/lib/models/MarketplaceListing.model');

  const listing = await MarketplaceListing.findById(listingId)
    .select('cropName pickupCounty unit currentPricePerUnit')
    .lean();

  if (!listing) {
    logger.warn('buyerFairness', 'Fairness requested for a listing that does not exist', {
      listingId,
    });
    return null;
  }

  // Shares the cached composeRecommendation call with every other consumer, so
  // the buyer and the farmer are reading the same market view.
  const recommendation = await composeRecommendation({
    crop: listing.cropName,
    county: listing.pickupCounty,
    unit: listing.unit,
  });

  return projectBuyerFairness(recommendation, listing.currentPricePerUnit);
}
