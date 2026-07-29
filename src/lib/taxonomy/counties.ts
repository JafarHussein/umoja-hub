// ---------------------------------------------------------------------------
// County name resolution.
//
// `KENYAN_COUNTIES` in src/types/index.ts stays the canonical list — this module
// re-exports it rather than copying it, and adds the one thing the platform was
// missing: a resolver that copes with the spellings real data arrives in.
//
// Zod enforces the exact strings at the API boundary, but the Mongoose schemas
// type `county` / `pickupCounty` as plain String, so seeds, simulators and any
// future external feed can (and do) introduce drift. Two live examples:
//   - "Murang'a" is routinely written "Muranga"; "Elgeyo-Marakwet" as
//     "Elgeyo Marakwet"; "Taita-Taveta" as "Taita Taveta".
//   - scripts/simulate/dictionaries.ts lists 'Eldoret' among URBAN_COUNTIES.
//     Eldoret is a town, not a county — it sits in Uasin Gishu.
//
// Scope note: NON_COUNTY_ALIASES covers only names already present in this
// repo's own data. A market-name → county map belongs with the ingestion
// adapters, and is not needed for the sources reviewed so far — KAMIS publishes
// County as its own column.
// ---------------------------------------------------------------------------

import { KENYAN_COUNTIES } from '@/types';
import type { KenyanCounty } from '@/types';

export { KENYAN_COUNTIES };
export type { KenyanCounty };

/** Towns and former names that appear in platform data but are not counties. */
const NON_COUNTY_ALIASES: Readonly<Record<string, KenyanCounty>> = {
  eldoret: 'Uasin Gishu',
  kitale: 'Trans Nzoia',
};

/**
 * Reduces a name to lowercase alphanumerics with separators removed, so that
 * apostrophes, hyphens and spaces all collapse to the same key:
 *   "Murang'a" and "Muranga"                 → "muranga"
 *   "Elgeyo-Marakwet" and "Elgeyo Marakwet"  → "elgeyomarakwet"
 * No two of the 47 counties collide under this reduction (asserted in tests).
 */
function normalizeCountyText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const CANONICAL_BY_NORMALIZED: ReadonlyMap<string, KenyanCounty> = new Map(
  KENYAN_COUNTIES.map((county) => [normalizeCountyText(county), county])
);

/**
 * Resolves free text to a canonical county, or null when unrecognised.
 * Tolerates case, apostrophes and hyphens, and maps the known non-county names
 * above. Never guesses at an unknown string.
 */
export function resolveCounty(freeText: string): KenyanCounty | null {
  const key = normalizeCountyText(freeText);
  if (key.length === 0) return null;
  return CANONICAL_BY_NORMALIZED.get(key) ?? NON_COUNTY_ALIASES[key] ?? null;
}

/** Whether the text names a county the platform recognises. */
export function isKnownCounty(freeText: string): boolean {
  return resolveCounty(freeText) !== null;
}
