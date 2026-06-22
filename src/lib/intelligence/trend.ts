// ---------------------------------------------------------------------------
// Price-trend classification for the Price Intelligence Engine.
//
// Compares the average price in a recent window against the window immediately
// before it, for 7 / 30 / 90 day spans. Direction is taken from the 30-day
// change (the most stable signal), falling back to 7d then 90d. Pure — the
// engine supplies the already-fetched, time-stamped prices.
// See context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md Deliverable 4.
// ---------------------------------------------------------------------------

export type TrendDirection = 'RISING' | 'STABLE' | 'FALLING';

export interface TrendResult {
  direction: TrendDirection;
  changePct7d: number | null;
  changePct30d: number | null;
  changePct90d: number | null;
}

export interface TrendPoint {
  pricePerUnit: number;
  recordedAt: Date;
}

/** Movement beyond ±5% is treated as a real rise/fall, otherwise stable. */
const STABLE_BAND_PCT = 5;

function meanInWindow(
  points: readonly TrendPoint[],
  now: Date,
  fromDaysAgo: number,
  toDaysAgo: number
): number | null {
  const fromMs = now.getTime() - fromDaysAgo * 24 * 60 * 60 * 1000;
  const toMs = now.getTime() - toDaysAgo * 24 * 60 * 60 * 1000;
  const inWindow = points.filter((p) => {
    const t = p.recordedAt.getTime();
    return t >= toMs && t < fromMs;
  });
  if (inWindow.length === 0) return null;
  return inWindow.reduce((sum, p) => sum + p.pricePerUnit, 0) / inWindow.length;
}

/**
 * Percent change of the last `days` window vs the `days` window before it.
 * Null when either window has no data.
 */
export function changePct(points: readonly TrendPoint[], now: Date, days: number): number | null {
  const recent = meanInWindow(points, now, 0, days);
  const prior = meanInWindow(points, now, days, days * 2);
  if (recent === null || prior === null || prior === 0) return null;
  return Math.round(((recent - prior) / prior) * 100 * 10) / 10;
}

function directionFrom(pct: number | null): TrendDirection | null {
  if (pct === null) return null;
  if (pct > STABLE_BAND_PCT) return 'RISING';
  if (pct < -STABLE_BAND_PCT) return 'FALLING';
  return 'STABLE';
}

export function classifyTrend(points: readonly TrendPoint[], now: Date = new Date()): TrendResult {
  const changePct7d = changePct(points, now, 7);
  const changePct30d = changePct(points, now, 30);
  const changePct90d = changePct(points, now, 90);

  const direction =
    directionFrom(changePct30d) ?? directionFrom(changePct7d) ?? directionFrom(changePct90d) ?? 'STABLE';

  return { direction, changePct7d, changePct30d, changePct90d };
}
