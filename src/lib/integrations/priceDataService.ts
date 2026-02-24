/**
 * Price data service — platform premium calculation and weekly price aggregation.
 * Per BUSINESS_LOGIC.md §9 and §10.2.
 */

import { connectDB } from '@/lib/db';
import PriceHistory from '@/lib/models/PriceHistory.model';
import { logger } from '@/lib/utils';

/**
 * Calculates the percentage premium UmojaHub farmers earn vs the middleman benchmark.
 * Returns null when benchmark is zero or undefined.
 * Per BUSINESS_LOGIC.md §9.
 */
export function calculatePlatformPremium(
  umojaHubAveragePrice: number,
  middlemanBenchmark: number
): number | null {
  if (!middlemanBenchmark || middlemanBenchmark === 0) return null;
  return (
    Math.round(((umojaHubAveragePrice - middlemanBenchmark) / middlemanBenchmark) * 100 * 10) / 10
  );
}

export interface WeeklyPriceAggregation {
  cropName: string;
  county: string;
  averageListingPrice: number | null;
  averageTransactionPrice: number | null;
  lowestPrice: number;
  highestPrice: number;
  dataPointCount: number;
}

/**
 * Aggregates PriceHistory for a crop+county pair over the last 7 days.
 * Per BUSINESS_LOGIC.md §10.2.
 */
export async function aggregateWeeklyPrices(
  cropName: string,
  county: string
): Promise<WeeklyPriceAggregation | null> {
  try {
    await connectDB();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [result] = await PriceHistory.aggregate([
      {
        $match: {
          cropName,
          county,
          recordedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          averageListingPrice: {
            $avg: { $cond: [{ $eq: ['$source', 'LISTING_CREATED'] }, '$pricePerUnit', null] },
          },
          averageTransactionPrice: {
            $avg: { $cond: [{ $eq: ['$source', 'ORDER_COMPLETED'] }, '$pricePerUnit', null] },
          },
          lowestPrice: { $min: '$pricePerUnit' },
          highestPrice: { $max: '$pricePerUnit' },
          dataPointCount: { $sum: 1 },
        },
      },
    ]);

    if (!result) return null;

    return {
      cropName,
      county,
      averageListingPrice: result.averageListingPrice ?? null,
      averageTransactionPrice: result.averageTransactionPrice ?? null,
      lowestPrice: result.lowestPrice,
      highestPrice: result.highestPrice,
      dataPointCount: result.dataPointCount,
    };
  } catch (error) {
    logger.error('priceDataService', 'Failed to aggregate weekly prices', { cropName, county, error });
    return null;
  }
}

/**
 * Middleman benchmark reference prices (KES/KG) for major Kenyan crops.
 * Used by the market-insight cron job.
 * Source: Wakulima Market, Kongowea Market, City Market Nairobi averages.
 */
export const MIDDLEMAN_BENCHMARKS: Record<string, number> = {
  maize: 35,
  beans: 110,
  tomatoes: 55,
  potatoes: 40,
  tea: 25,
  coffee: 380,
  rice: 90,
  kale: 18,
  capsicum: 75,
  dairy: 42,
};

export function getMiddlemanBenchmark(cropName: string): number | null {
  const normalized = cropName.toLowerCase().trim();
  return MIDDLEMAN_BENCHMARKS[normalized] ?? null;
}
