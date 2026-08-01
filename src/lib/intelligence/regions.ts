// ---------------------------------------------------------------------------
// Regional hierarchy for the Price Intelligence Engine.
//
// Maps each of Kenya's 47 counties to one of 8 historical regions (former
// provinces). The engine prefers county-local price data, then widens through
// adjacent counties, then the region, then nationally, until it has enough
// evidence to recommend a price. This is a code constant (no DB) — see
// context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md Deliverable 6.
//
// The ADJACENT tier comes from src/lib/taxonomy/adjacency.ts and was added to
// close D7: provincial grouping is a poor proxy for market proximity, and it
// left Nairobi — a province of one — with no peers between itself and the whole
// country.
// ---------------------------------------------------------------------------

import { areAdjacent } from '@/lib/taxonomy/adjacency';

export type KenyaRegion =
  | 'Nairobi'
  | 'Central'
  | 'Coast'
  | 'Eastern'
  | 'North Eastern'
  | 'Nyanza'
  | 'Rift Valley'
  | 'Western';

/** The widening tiers the engine searches, narrowest first. */
export type GeoScope = 'COUNTY' | 'ADJACENT' | 'REGION' | 'NATIONAL';

const REGION_COUNTIES: Record<KenyaRegion, readonly string[]> = {
  Nairobi: ['Nairobi'],
  Central: ['Kiambu', 'Kirinyaga', "Murang'a", 'Nyandarua', 'Nyeri'],
  Coast: ['Kilifi', 'Kwale', 'Lamu', 'Mombasa', 'Taita-Taveta', 'Tana River'],
  Eastern: [
    'Embu',
    'Isiolo',
    'Kitui',
    'Machakos',
    'Makueni',
    'Marsabit',
    'Meru',
    'Tharaka-Nithi',
  ],
  'North Eastern': ['Garissa', 'Mandera', 'Wajir'],
  Nyanza: ['Homa Bay', 'Kisii', 'Kisumu', 'Migori', 'Nyamira', 'Siaya'],
  'Rift Valley': [
    'Baringo',
    'Bomet',
    'Elgeyo-Marakwet',
    'Kajiado',
    'Kericho',
    'Laikipia',
    'Nakuru',
    'Nandi',
    'Narok',
    'Samburu',
    'Trans Nzoia',
    'Turkana',
    'Uasin Gishu',
    'West Pokot',
  ],
  Western: ['Bungoma', 'Busia', 'Kakamega', 'Vihiga'],
};

const COUNTY_TO_REGION: Record<string, KenyaRegion> = Object.entries(REGION_COUNTIES).reduce(
  (acc, [region, counties]) => {
    for (const county of counties) {
      acc[county] = region as KenyaRegion;
    }
    return acc;
  },
  {} as Record<string, KenyaRegion>
);

/** Region a county belongs to, or null if the county name is unrecognised. */
export function regionOf(county: string): KenyaRegion | null {
  return COUNTY_TO_REGION[county] ?? null;
}

/** All counties sharing a region with the given county (including itself). */
export function regionPeers(county: string): readonly string[] {
  const region = regionOf(county);
  return region ? REGION_COUNTIES[region] : [county];
}

/**
 * Classifies how a data point's county relates to the target county:
 * COUNTY (exact), ADJACENT (shares a land border), REGION (same former
 * province), or NATIONAL (anywhere else).
 *
 * ADJACENT is checked before REGION because a bordering county is the closer
 * market even when the two sit in different provinces — Kajiado is Rift Valley
 * and Machakos is Eastern, yet both are nearer to a Nairobi seller than any
 * county reached by the provincial grouping. Where a neighbour happens to share
 * the region too, ADJACENT still wins: it is the narrower and better-evidenced
 * claim of the two.
 */
export function scopeOf(targetCounty: string, pointCounty: string): GeoScope {
  if (pointCounty === targetCounty) return 'COUNTY';
  if (areAdjacent(targetCounty, pointCounty)) return 'ADJACENT';
  const targetRegion = regionOf(targetCounty);
  if (targetRegion !== null && regionOf(pointCounty) === targetRegion) return 'REGION';
  return 'NATIONAL';
}
