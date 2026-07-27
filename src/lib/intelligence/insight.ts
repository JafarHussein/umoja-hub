// ---------------------------------------------------------------------------
// Deterministic insight builder for the Price Intelligence Engine.
//
// Turns the assembled numbers into one or two grounded sentences — no LLM, no
// invented facts. Used in the farmer recommendation panel and (later) injected
// into the AI assistant as ground truth.
// ---------------------------------------------------------------------------

import type { GeoScope } from './regions';
import { regionOf } from './regions';
import type { DemandLevel } from './demand';
import type { TrendResult } from './trend';
import type { SeasonPhase } from './seasonality';

export interface InsightInput {
  crop: string;
  county: string;
  unit: string;
  recommended: number | null;
  range: { low: number; high: number } | null;
  demand: DemandLevel;
  trend: TrendResult;
  season: SeasonPhase;
  geoScope: GeoScope;
}

const DEMAND_WORD: Record<DemandLevel, string> = {
  LOW: 'soft',
  MODERATE: 'steady',
  HIGH: 'high',
  VERY_HIGH: 'very high',
};

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function trendClause(trend: TrendResult): string {
  const pct = trend.changePct30d;
  if (trend.direction === 'RISING') {
    return pct !== null ? `rising (+${pct}% over 30 days)` : 'rising';
  }
  if (trend.direction === 'FALLING') {
    return pct !== null ? `easing (${pct}% over 30 days)` : 'easing';
  }
  return 'holding steady';
}

function seasonClause(crop: string, season: SeasonPhase): string {
  switch (season) {
    case 'PEAK_SUPPLY':
      return ` Supply is entering its seasonal peak, so prices typically soften in the coming weeks.`;
    case 'LOW_SUPPLY':
      return ` Supply is tight this time of year, which tends to support firmer prices.`;
    case 'OFF_SEASON':
      return ` This is off-season for ${crop}, so volumes are usually thin.`;
    default:
      return '';
  }
}

function scopeClause(county: string, geoScope: GeoScope): string {
  if (geoScope === 'COUNTY') return '';
  if (geoScope === 'REGION') {
    const region = regionOf(county);
    return ` This estimate draws on ${region ?? 'nearby'} regional data while ${county} activity builds.`;
  }
  return ` This estimate draws on national data while local activity builds.`;
}

export function buildInsight(input: InsightInput): string {
  const { crop, county, unit, recommended, range, demand, trend, season, geoScope } = input;

  if (recommended === null || range === null) {
    return `Not enough verified activity yet to recommend a price for ${crop} in ${county}. As more farmers list and complete sales here, this guidance will sharpen.`;
  }

  const demandSentence = `${capitalize(crop)} demand is ${DEMAND_WORD[demand]} in ${county} and prices are ${trendClause(trend)}.`;
  const rangeSentence = ` Produce priced around KSh ${range.low}–${range.high}/${unit.toLowerCase()} is selling fastest.`;

  return `${demandSentence}${rangeSentence}${seasonClause(crop, season)}${scopeClause(county, geoScope)}`.trim();
}
