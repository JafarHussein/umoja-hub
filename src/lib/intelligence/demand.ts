// ---------------------------------------------------------------------------
// Demand scoring for the Price Intelligence Engine.
//
// Demand is a 0–1 composite of signals that ACTUALLY exist in the schema:
// completed-order velocity, sell-through, listing views, and supply scarcity.
// There is no search/watchlist/purchase-attempt log, so those are deliberately
// not modelled (no fabricated signals). Real orders dominate; views are the
// weakest, most-gameable term. Pure — the engine supplies the raw metrics.
// See context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md Deliverable 5.
// ---------------------------------------------------------------------------

export type DemandLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export interface DemandInputs {
  /** Paid/completed orders for the crop+county in the last 30 days. */
  completedOrders30d: number;
  /** Count of AVAILABLE listings for the crop+county right now. */
  activeListings: number;
  /** Total quantity buyers have ordered (recent window). */
  totalQuantityOrdered: number;
  /** Total quantity farmers have listed (recent window). */
  totalQuantityListed: number;
  /** Mean viewCount across recent active listings. */
  avgViewCount: number;
}

export interface DemandResult {
  level: DemandLevel;
  score: number; // 0–1
}

/** Diminishing-returns curve: 0 → 0, grows toward 1, never exceeds it. */
function saturate(x: number): number {
  if (x <= 0) return 0;
  return 1 - Math.exp(-x);
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function scoreDemand(input: DemandInputs): DemandResult {
  // ~8 completed orders/month in one county is strong demand.
  const orderVelocity = saturate(input.completedOrders30d / 8);
  // Share of listed supply that buyers actually claimed.
  const sellThrough = clamp01(
    input.totalQuantityListed > 0 ? input.totalQuantityOrdered / input.totalQuantityListed : 0
  );
  // ~120 views on a fresh listing is high interest.
  const viewIntensity = saturate(input.avgViewCount / 120);
  // Fewer active sellers ⇒ a tighter market (capped).
  const scarcity = clamp01(4 / Math.max(input.activeListings, 1));

  const score =
    0.45 * orderVelocity + 0.25 * sellThrough + 0.15 * viewIntensity + 0.15 * scarcity;

  let level: DemandLevel;
  if (score >= 0.75) level = 'VERY_HIGH';
  else if (score >= 0.5) level = 'HIGH';
  else if (score >= 0.25) level = 'MODERATE';
  else level = 'LOW';

  return { level, score: Math.round(score * 100) / 100 };
}
