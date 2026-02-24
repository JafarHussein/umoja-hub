/**
 * Farmer Trust Score Calculator
 * Exact formulas per BUSINESS_LOGIC.md §1
 * Called after every Order completion and Rating submission — never on GET requests.
 */

import { FarmerTrustTier } from '@/types';
import FarmerTrustScore from '@/lib/models/FarmerTrustScore.model';
import User from '@/lib/models/User.model';
import Order from '@/lib/models/Order.model';
import Rating from '@/lib/models/Rating.model';
import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Internal calculation interfaces
// ---------------------------------------------------------------------------

interface ITrustInputs {
  verificationStatus: string;
  completedOrders: number;
  totalVolumeKES: number;
  totalRatings: number;
  averageRating: number;
  onTimeConfirmationRate: number;
  disputeCount: number;
  disputesRuledAgainst: number;
}

interface IScoreBreakdown {
  verificationScore: number;
  transactionScore: {
    completedOrders: number;
    totalVolumeKES: number;
    scoreContribution: number;
  };
  ratingScore: {
    averageRating: number;
    totalRatings: number;
    scoreContribution: number;
  };
  reliabilityScore: {
    onTimeConfirmationRate: number;
    disputeCount: number;
    disputesRuledAgainst: number;
    scoreContribution: number;
  };
  compositeScore: number;
  tier: FarmerTrustTier;
}

// ---------------------------------------------------------------------------
// §1.2 Verification Score (40 points)
// ---------------------------------------------------------------------------

function calculateVerificationScore(verificationStatus: string): number {
  return verificationStatus === 'APPROVED' ? 40 : 0;
}

// ---------------------------------------------------------------------------
// §1.3 Transaction Score (max 25 points)
// ---------------------------------------------------------------------------

function calculateTransactionScore(
  completedOrders: number,
  totalVolumeKES: number
): number {
  const orderCountScore = Math.min(completedOrders * 0.5, 12);
  const volumeScore = Math.min(totalVolumeKES / 50000, 13);
  return Math.min(orderCountScore + volumeScore, 25);
}

// ---------------------------------------------------------------------------
// §1.4 Rating Score (max 20 points)
// ---------------------------------------------------------------------------

function calculateRatingScore(
  totalRatings: number,
  averageRating: number
): number {
  if (totalRatings < 3) return 0;
  // Linear scale: 1.0 star = 4 points, 5.0 stars = 20 points
  return Math.round(((averageRating - 1) / 4) * 20);
}

// ---------------------------------------------------------------------------
// §1.5 Reliability Score (max 15 points)
// ---------------------------------------------------------------------------

function calculateReliabilityScore(
  onTimeConfirmationRate: number,
  disputeCount: number,
  disputesRuledAgainst: number
): number {
  const baseReliability = onTimeConfirmationRate * 12;
  const disputePenalty = disputeCount * 2;
  const ruledAgainstPenalty = disputesRuledAgainst * 5;
  return Math.max(
    0,
    Math.min(baseReliability - disputePenalty - ruledAgainstPenalty, 15)
  );
}

// ---------------------------------------------------------------------------
// §1.6 Composite Score and Tier Assignment
// ---------------------------------------------------------------------------

function assignTier(compositeScore: number): FarmerTrustTier {
  if (compositeScore >= 80) return FarmerTrustTier.PREMIUM;
  if (compositeScore >= 60) return FarmerTrustTier.TRUSTED;
  if (compositeScore >= 40) return FarmerTrustTier.ESTABLISHED;
  return FarmerTrustTier.NEW;
}

// ---------------------------------------------------------------------------
// Pure calculation function (exported for unit testing)
// ---------------------------------------------------------------------------

export function calculateCompositeScore(inputs: ITrustInputs): IScoreBreakdown {
  const verificationScore = calculateVerificationScore(inputs.verificationStatus);
  const transactionContribution = calculateTransactionScore(
    inputs.completedOrders,
    inputs.totalVolumeKES
  );
  const ratingContribution = calculateRatingScore(
    inputs.totalRatings,
    inputs.averageRating
  );
  const reliabilityContribution = calculateReliabilityScore(
    inputs.onTimeConfirmationRate,
    inputs.disputeCount,
    inputs.disputesRuledAgainst
  );

  const compositeScore = Math.round(
    verificationScore + transactionContribution + ratingContribution + reliabilityContribution
  );

  return {
    verificationScore,
    transactionScore: {
      completedOrders: inputs.completedOrders,
      totalVolumeKES: inputs.totalVolumeKES,
      scoreContribution: transactionContribution,
    },
    ratingScore: {
      averageRating: inputs.averageRating,
      totalRatings: inputs.totalRatings,
      scoreContribution: ratingContribution,
    },
    reliabilityScore: {
      onTimeConfirmationRate: inputs.onTimeConfirmationRate,
      disputeCount: inputs.disputeCount,
      disputesRuledAgainst: inputs.disputesRuledAgainst,
      scoreContribution: reliabilityContribution,
    },
    compositeScore,
    tier: assignTier(compositeScore),
  };
}

// ---------------------------------------------------------------------------
// §1.7 On-Time Confirmation Rate
// Farmers who confirm (IN_FULFILLMENT) within 24h of PAID status count as on-time.
// ---------------------------------------------------------------------------

async function fetchOnTimeConfirmationRate(
  farmerId: mongoose.Types.ObjectId
): Promise<number> {
  const paidOrders = await Order.find({
    farmerId,
    paymentStatus: 'PAID',
  }).lean();

  if (paidOrders.length === 0) return 1.0; // Benefit of the doubt for new farmers

  let onTimeCount = 0;
  for (const order of paidOrders) {
    if (order.paidAt && order.confirmedByFarmerAt) {
      const msDiff = order.confirmedByFarmerAt.getTime() - order.paidAt.getTime();
      const hoursDiff = msDiff / (1000 * 60 * 60);
      if (hoursDiff <= 24) onTimeCount++;
    }
  }

  return onTimeCount / paidOrders.length;
}

// ---------------------------------------------------------------------------
// Main recalculate function — called after order completion or rating submission
// ---------------------------------------------------------------------------

export async function recalculate(farmerId: string): Promise<void> {
  await connectDB();

  const farmerObjectId = new mongoose.Types.ObjectId(farmerId);

  try {
    // Fetch farmer data for verification status
    const farmer = await User.findById(farmerObjectId).lean();
    if (!farmer || !farmer.farmerData) {
      logger.error('farmerTrustCalculator', 'Farmer not found or missing farmerData', { farmerId });
      return;
    }

    // Fetch completed orders aggregate
    const completedOrdersAgg = await Order.aggregate([
      {
        $match: {
          farmerId: farmerObjectId,
          fulfillmentStatus: 'COMPLETED',
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalVolume: { $sum: '$totalAmountKES' },
        },
      },
    ]);

    const completedOrders = completedOrdersAgg[0]?.count ?? 0;
    const totalVolumeKES = completedOrdersAgg[0]?.totalVolume ?? 0;

    // Fetch disputed orders (flagged against farmer)
    const disputeCount = await Order.countDocuments({
      farmerId: farmerObjectId,
      fulfillmentStatus: 'DISPUTED',
    });

    // disputesRuledAgainst: orders in DISPUTED status where buyer raised dispute
    // For MVP: treat all disputed as ruled against (no admin dispute resolution implemented yet)
    const disputesRuledAgainst = disputeCount;

    // Fetch ratings
    const ratingAgg = await Rating.aggregate([
      { $match: { farmerId: farmerObjectId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    const averageRating = ratingAgg[0]?.averageRating ?? 0;
    const totalRatings = ratingAgg[0]?.totalRatings ?? 0;

    // Calculate on-time confirmation rate
    const onTimeConfirmationRate = await fetchOnTimeConfirmationRate(farmerObjectId);

    const inputs: ITrustInputs = {
      verificationStatus: farmer.farmerData.verificationStatus,
      completedOrders,
      totalVolumeKES,
      totalRatings,
      averageRating,
      onTimeConfirmationRate,
      disputeCount,
      disputesRuledAgainst,
    };

    const breakdown = calculateCompositeScore(inputs);

    // Upsert FarmerTrustScore
    await FarmerTrustScore.findOneAndUpdate(
      { farmerId: farmerObjectId },
      {
        farmerId: farmerObjectId,
        verificationScore: breakdown.verificationScore,
        transactionScore: breakdown.transactionScore,
        ratingScore: breakdown.ratingScore,
        reliabilityScore: breakdown.reliabilityScore,
        compositeScore: breakdown.compositeScore,
        tier: breakdown.tier,
        lastCalculatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info('farmerTrustCalculator', 'Trust score recalculated', {
      farmerId,
      compositeScore: breakdown.compositeScore,
      tier: breakdown.tier,
    });
  } catch (error) {
    logger.error('farmerTrustCalculator', 'Failed to recalculate trust score', {
      farmerId,
      error,
    });
    // Non-blocking — do not rethrow; caller's request continues
  }
}
