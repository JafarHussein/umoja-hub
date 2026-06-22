// ---------------------------------------------------------------------------
// Seasonal intelligence for the Price Intelligence Engine.
//
// No multi-year price history exists yet, so seasonality is a curated static
// calendar built from Kenya's bimodal rains (long rains Mar–May, short rains
// Oct–Dec) and known harvest windows. It is INTERPRETIVE only — it colours the
// insight text and cross-checks demand; it never overrides observed prices.
// Coverage = the 10 crops the platform tracks; anything else returns UNKNOWN.
// See context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md Deliverable 7.
// ---------------------------------------------------------------------------

export type SeasonPhase = 'IN_SEASON' | 'PEAK_SUPPLY' | 'LOW_SUPPLY' | 'OFF_SEASON' | 'UNKNOWN';

// Twelve phases per crop, index 0 = January … 11 = December.
type MonthlyCalendar = readonly [
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
  SeasonPhase,
];

const I: SeasonPhase = 'IN_SEASON';
const P: SeasonPhase = 'PEAK_SUPPLY';
const L: SeasonPhase = 'LOW_SUPPLY';
const O: SeasonPhase = 'OFF_SEASON';

const KENYA_CROP_SEASONS: Record<string, MonthlyCalendar> = {
  //         Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
  maize: [I, I, L, L, L, L, L, P, P, P, I, I],
  beans: [P, I, L, L, I, I, L, P, P, I, L, P],
  tomatoes: [L, L, I, I, I, P, P, P, I, I, L, L],
  potatoes: [P, I, L, L, I, P, P, I, L, L, I, P],
  kale: [L, L, I, I, I, I, I, I, I, I, I, I],
  capsicum: [L, L, I, I, I, P, P, I, I, I, L, L],
  tea: [I, I, P, P, I, I, L, L, I, P, P, I],
  coffee: [L, L, O, O, O, I, I, I, I, P, P, P],
  rice: [P, I, L, L, O, O, L, I, I, P, P, P],
  dairy: [L, L, I, P, P, P, I, I, L, L, P, I],
};

/**
 * Normalises a free-text crop name to a calendar/benchmark key.
 * e.g. "Kale (Sukuma Wiki)" → "kale", "  Tomatoes " → "tomatoes".
 */
export function normalizeCrop(cropName: string): string {
  return cropName
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // drop parentheticals like "(sukuma wiki)"
    .trim();
}

/** The season phase for a crop at a given date (defaults to now). */
export function getSeasonPhase(cropName: string, at: Date = new Date()): SeasonPhase {
  const calendar = KENYA_CROP_SEASONS[normalizeCrop(cropName)];
  if (!calendar) return 'UNKNOWN';
  return calendar[at.getMonth()] ?? 'UNKNOWN';
}
