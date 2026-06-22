// ---------------------------------------------------------------------------
// Cooperative price insights for the Price Intelligence Engine (Deliverable 12).
//
// Scopes the engine to a FarmerGroup's members: which crops they sell, how their
// realised prices compare to the county recommendation (who's underselling),
// their top crops by completed-sale value, and per-crop demand trend. Read-only
// over Order + the recommendation engine. `aggregateMemberCrops` is pure.
// ---------------------------------------------------------------------------

import { connectDB } from '@/lib/db';
import { logger } from '@/lib/utils';
import { OrderFulfillmentStatus } from '@/types';
import { normalizeCrop } from './seasonality';
import { roundKES } from './weighting';
import { classifyTrend } from './trend';
import type { TrendDirection } from './trend';
import { composeRecommendation } from './priceIntelligence';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;
const MAX_CROPS = 8;

export interface MemberOrder {
  crop: string;
  unit: string;
  pricePerUnit: number;
  totalAmountKES: number;
  farmerId: string;
  recordedAt: Date;
}

export interface CoopCropRow {
  crop: string;
  unit: string;
  memberMedianPrice: number | null;
  completedSales: number;
  completedValueKES: number;
  trendDirection: TrendDirection;
  activeMembers: number;
}

export interface CoopCropInsight extends CoopCropRow {
  countyBenchmark: number | null;
  deltaPct: number | null;
}

export interface CooperativeInsights {
  county: string;
  memberCount: number;
  activeMemberCount: number;
  totalCompletedValueKES: number;
  crops: CoopCropInsight[];
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function modalUnit(units: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const u of units) counts.set(u, (counts.get(u) ?? 0) + 1);
  let best = 'KG';
  let bestCount = -1;
  for (const [u, n] of counts) {
    if (n > bestCount) {
      best = u;
      bestCount = n;
    }
  }
  return best;
}

/** Groups members' completed orders into per-crop performance rows. Pure. */
export function aggregateMemberCrops(orders: readonly MemberOrder[], now: Date): CoopCropRow[] {
  const byCrop = new Map<string, MemberOrder[]>();
  for (const o of orders) {
    const arr = byCrop.get(o.crop) ?? [];
    arr.push(o);
    byCrop.set(o.crop, arr);
  }

  return [...byCrop.entries()]
    .map(([crop, list]) => {
      const unit = modalUnit(list.map((o) => o.unit));
      const unitOrders = list.filter((o) => o.unit === unit);
      const med = median(unitOrders.map((o) => o.pricePerUnit));
      return {
        crop,
        unit,
        memberMedianPrice: med !== null ? roundKES(med) : null,
        completedSales: list.length,
        completedValueKES: Math.round(list.reduce((s, o) => s + o.totalAmountKES, 0)),
        trendDirection: classifyTrend(
          unitOrders.map((o) => ({ pricePerUnit: o.pricePerUnit, recordedAt: o.recordedAt })),
          now
        ).direction,
        activeMembers: new Set(list.map((o) => o.farmerId)).size,
      };
    })
    .sort((a, b) => b.completedValueKES - a.completedValueKES);
}

export async function computeCooperativeInsights(input: {
  county: string;
  memberIds: readonly string[];
}): Promise<CooperativeInsights> {
  const now = new Date();
  const empty: CooperativeInsights = {
    county: input.county,
    memberCount: input.memberIds.length,
    activeMemberCount: 0,
    totalCompletedValueKES: 0,
    crops: [],
  };

  if (input.memberIds.length === 0) return empty;

  try {
    await connectDB();
    const { default: Order } = await import('@/lib/models/Order.model');
    const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);

    const rawOrders = await Order.find({
      farmerId: { $in: input.memberIds },
      fulfillmentStatus: OrderFulfillmentStatus.COMPLETED,
      createdAt: { $gte: cutoff },
    })
      .select('cropName unit pricePerUnit totalAmountKES farmerId createdAt receivedByBuyerAt')
      .lean();

    const orders: MemberOrder[] = rawOrders.map((o) => ({
      crop: normalizeCrop(o.cropName),
      unit: o.unit,
      pricePerUnit: o.pricePerUnit,
      totalAmountKES: o.totalAmountKES,
      farmerId: String(o.farmerId),
      recordedAt: new Date((o.receivedByBuyerAt as Date | undefined) ?? o.createdAt),
    }));

    const rows = aggregateMemberCrops(orders, now);

    // Enrich the top crops with the county recommendation as a benchmark.
    const crops: CoopCropInsight[] = [];
    for (const row of rows.slice(0, MAX_CROPS)) {
      const rec = await composeRecommendation({ crop: row.crop, county: input.county, unit: row.unit });
      const benchmark = rec.recommendedPricePerUnit;
      const deltaPct =
        benchmark !== null && benchmark !== 0 && row.memberMedianPrice !== null
          ? Math.round(((row.memberMedianPrice - benchmark) / benchmark) * 100)
          : null;
      crops.push({ ...row, countyBenchmark: benchmark, deltaPct });
    }

    return {
      county: input.county,
      memberCount: input.memberIds.length,
      activeMemberCount: new Set(orders.map((o) => o.farmerId)).size,
      totalCompletedValueKES: rows.reduce((s, r) => s + r.completedValueKES, 0),
      crops,
    };
  } catch (error) {
    logger.error('cooperativeInsights', 'computeCooperativeInsights failed; returning empty', {
      county: input.county,
      error,
    });
    return empty;
  }
}
