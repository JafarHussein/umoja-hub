/**
 * Price data service — platform premium calculation and weekly price aggregation.
 */

import { connectDB } from '@/lib/db';
import PriceHistory from '@/lib/models/PriceHistory.model';
import { logger } from '@/lib/utils';
import { ListingUnit } from '@/types';

/**
 * Calculates the percentage premium UmojaHub farmers earn vs the middleman benchmark.
 * Returns null when benchmark is zero or undefined.
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
  unit: string;
  averageListingPrice: number | null;
  averageTransactionPrice: number | null;
  lowestPrice: number;
  highestPrice: number;
  dataPointCount: number;
}

/**
 * Aggregates PriceHistory for a crop+county+unit triple over the last 7 days.
 *
 * `unit` is part of the key, not an afterthought: without it `lowestPrice` and
 * `highestPrice` are a min and a max taken across a bimodal KG/BAG set and are
 * guaranteed to come from different units (D17, and D1 before it).
 */
export async function aggregateWeeklyPrices(
  cropName: string,
  county: string,
  unit: string
): Promise<WeeklyPriceAggregation | null> {
  try {
    await connectDB();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [result] = await PriceHistory.aggregate([
      {
        $match: {
          cropName,
          county,
          unit,
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
      unit,
      averageListingPrice: result.averageListingPrice ?? null,
      averageTransactionPrice: result.averageTransactionPrice ?? null,
      lowestPrice: result.lowestPrice,
      highestPrice: result.highestPrice,
      dataPointCount: result.dataPointCount,
    };
  } catch (error) {
    logger.error('priceDataService', 'Failed to aggregate weekly prices', {
      cropName,
      county,
      unit,
      error,
    });
    return null;
  }
}

/**
 * The unit every figure in `MIDDLEMAN_BENCHMARKS` is quoted in.
 *
 * This was always true — the table has carried a "(KES/KG)" comment since it was
 * written — but nothing enforced it, and `getMiddlemanBenchmark` handed the same
 * number to a caller asking about BAG prices. That is D17: maize is 35 KES/kg
 * here and trades at roughly 3,600 KES per 90 kg bag, so applying this table to
 * a BAG request understates the benchmark by two orders of magnitude and turns
 * `platformPremium` into a meaningless ratio between two different quantities.
 */
export const MIDDLEMAN_BENCHMARK_UNIT: ListingUnit = ListingUnit.KG;

/**
 * Middleman benchmark reference prices, **per kilogram**, for major Kenyan crops.
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

/**
 * The benchmark for a crop in the caller's unit, or null when this table has no
 * figure on that basis.
 *
 * Returning null for a BAG request is the correct answer, not a gap to be filled
 * by conversion. A Kenyan bag has no single weight — maize trades at 90 kg while
 * the Crops (Food Crops) Regulations 2019 cap a package at 50 kg — so deriving a
 * bag benchmark from the per-kg figure would bake in a ~44% error. This is the
 * same refusal `src/lib/taxonomy/units.ts` documents and the same one the
 * recommendation engine makes when it filters units instead of converting them.
 * A missing benchmark shows nothing; a converted one shows a confident lie.
 */
export function getMiddlemanBenchmark(cropName: string, unit: string): number | null {
  if (unit.trim().toUpperCase() !== MIDDLEMAN_BENCHMARK_UNIT) return null;
  const normalized = cropName.toLowerCase().trim();
  return MIDDLEMAN_BENCHMARKS[normalized] ?? null;
}
