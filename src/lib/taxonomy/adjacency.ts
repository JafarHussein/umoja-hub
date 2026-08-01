// ---------------------------------------------------------------------------
// County adjacency graph (D7).
//
// `regions.ts` groups the 47 counties into 8 former provinces, and the price
// engine widens county → region → national. That ladder has a hole: Nairobi is
// a province of one, so a Nairobi farmer has no regional peers at all and drops
// straight to national data. More generally, provincial grouping is a poor
// proxy for market adjacency — Kajiado borders Nairobi and sits in Rift Valley,
// Machakos borders Nairobi and sits in Eastern. Both are closer markets to a
// Nairobi seller than any national aggregate, and neither was reachable.
//
// This module supplies the missing tier. It is a committed constant rather than
// runtime geometry: no GIS dependency, no polygon store, no per-request cost.
//
// PROVENANCE. The lists were hand-assembled from the published county
// boundaries of the Constitution of Kenya (2010) First Schedule as rendered on
// public administrative maps, which is the fallback that
// context/price-intelligence/06_FEATURE_ENGINEERING_SPEC.md §2 explicitly
// prefers over waiting on the ODbL share-alike review (L4) for polygon data.
// Nothing here is derived from an ODbL dataset, so no share-alike obligation
// attaches.
//
// ACCURACY. Land borders only — a shared shoreline across a lake or gulf is not
// adjacency, so Homa Bay does not neighbour Siaya across the Winam Gulf. Where a
// boundary is a disputed or vanishingly short contact, the pair is omitted: for
// a market-proximity proxy a missing far-flung edge costs a little evidence,
// while a wrong edge imports a market that is not really next door. Symmetry,
// completeness and the absence of self-reference are asserted in tests rather
// than trusted.
// ---------------------------------------------------------------------------

import { resolveCounty } from './counties';
import type { KenyanCounty } from './counties';

/**
 * Every county's land neighbours. Symmetric by construction and by test — if A
 * lists B then B lists A.
 */
export const COUNTY_ADJACENCY: Readonly<Record<KenyanCounty, readonly KenyanCounty[]>> = {
  // ── Coast ────────────────────────────────────────────────────────────────
  Mombasa: ['Kilifi', 'Kwale'],
  Kwale: ['Mombasa', 'Kilifi', 'Taita-Taveta'],
  Kilifi: ['Mombasa', 'Kwale', 'Taita-Taveta', 'Tana River'],
  'Tana River': ['Kilifi', 'Lamu', 'Garissa', 'Isiolo', 'Kitui', 'Taita-Taveta'],
  Lamu: ['Tana River', 'Garissa'],
  'Taita-Taveta': ['Kwale', 'Kilifi', 'Tana River', 'Kitui', 'Makueni', 'Kajiado'],

  // ── North Eastern ────────────────────────────────────────────────────────
  Garissa: ['Lamu', 'Tana River', 'Isiolo', 'Wajir'],
  Wajir: ['Garissa', 'Isiolo', 'Marsabit', 'Mandera'],
  Mandera: ['Wajir', 'Marsabit'],

  // ── Eastern ──────────────────────────────────────────────────────────────
  Marsabit: ['Mandera', 'Wajir', 'Isiolo', 'Samburu', 'Turkana'],
  Isiolo: [
    'Marsabit',
    'Wajir',
    'Garissa',
    'Tana River',
    'Kitui',
    'Meru',
    'Tharaka-Nithi',
    'Laikipia',
    'Samburu',
  ],
  Meru: ['Isiolo', 'Tharaka-Nithi', 'Nyeri', 'Laikipia'],
  'Tharaka-Nithi': ['Meru', 'Isiolo', 'Kitui', 'Embu', 'Kirinyaga'],
  Embu: ['Tharaka-Nithi', 'Kirinyaga', "Murang'a", 'Machakos', 'Kitui'],
  Kitui: ['Tharaka-Nithi', 'Embu', 'Machakos', 'Makueni', 'Taita-Taveta', 'Tana River', 'Isiolo'],
  Machakos: ['Embu', 'Kitui', 'Makueni', 'Kajiado', 'Nairobi', 'Kiambu', "Murang'a"],
  Makueni: ['Machakos', 'Kitui', 'Taita-Taveta', 'Kajiado'],

  // ── Nairobi ──────────────────────────────────────────────────────────────
  // The county this defect was reported against. Under the provincial ladder it
  // had no peers whatsoever; it now reaches its three real neighbouring markets.
  Nairobi: ['Kiambu', 'Machakos', 'Kajiado'],

  // ── Central ──────────────────────────────────────────────────────────────
  Kiambu: ['Nairobi', 'Machakos', "Murang'a", 'Nyandarua', 'Nakuru', 'Kajiado'],
  "Murang'a": ['Kiambu', 'Nyandarua', 'Nyeri', 'Kirinyaga', 'Embu', 'Machakos'],
  Nyeri: ['Nyandarua', 'Laikipia', 'Meru', 'Kirinyaga', "Murang'a"],
  Kirinyaga: ['Nyeri', "Murang'a", 'Embu', 'Tharaka-Nithi'],
  Nyandarua: ['Nyeri', "Murang'a", 'Kiambu', 'Nakuru', 'Laikipia'],

  // ── Rift Valley ──────────────────────────────────────────────────────────
  Laikipia: ['Nyandarua', 'Nyeri', 'Meru', 'Isiolo', 'Samburu', 'Baringo', 'Nakuru'],
  Samburu: ['Turkana', 'Marsabit', 'Isiolo', 'Laikipia', 'Baringo'],
  Turkana: ['West Pokot', 'Baringo', 'Samburu', 'Marsabit'],
  'West Pokot': ['Turkana', 'Baringo', 'Elgeyo-Marakwet', 'Trans Nzoia'],
  'Trans Nzoia': ['West Pokot', 'Elgeyo-Marakwet', 'Uasin Gishu', 'Bungoma', 'Kakamega'],
  'Elgeyo-Marakwet': ['West Pokot', 'Baringo', 'Uasin Gishu', 'Trans Nzoia'],
  Baringo: [
    'Turkana',
    'West Pokot',
    'Elgeyo-Marakwet',
    'Uasin Gishu',
    'Nandi',
    'Nakuru',
    'Laikipia',
    'Samburu',
  ],
  'Uasin Gishu': ['Trans Nzoia', 'Elgeyo-Marakwet', 'Baringo', 'Nandi', 'Kakamega'],
  Nandi: ['Uasin Gishu', 'Kakamega', 'Vihiga', 'Kisumu', 'Kericho', 'Nakuru', 'Baringo'],
  Nakuru: [
    'Baringo',
    'Laikipia',
    'Nyandarua',
    'Kiambu',
    'Kajiado',
    'Narok',
    'Bomet',
    'Kericho',
    'Nandi',
  ],
  Narok: ['Bomet', 'Kisii', 'Migori', 'Nakuru', 'Kajiado'],
  Kajiado: ['Nairobi', 'Machakos', 'Makueni', 'Taita-Taveta', 'Narok', 'Nakuru', 'Kiambu'],
  Kericho: ['Kisumu', 'Nandi', 'Nakuru', 'Bomet', 'Nyamira'],
  Bomet: ['Kericho', 'Nyamira', 'Narok', 'Nakuru'],

  // ── Western ──────────────────────────────────────────────────────────────
  Kakamega: ['Bungoma', 'Busia', 'Siaya', 'Vihiga', 'Nandi', 'Uasin Gishu', 'Trans Nzoia'],
  Vihiga: ['Kakamega', 'Siaya', 'Kisumu', 'Nandi'],
  Bungoma: ['Trans Nzoia', 'Kakamega', 'Busia'],
  Busia: ['Bungoma', 'Kakamega', 'Siaya'],

  // ── Nyanza ───────────────────────────────────────────────────────────────
  Siaya: ['Busia', 'Kakamega', 'Vihiga', 'Kisumu'],
  Kisumu: ['Siaya', 'Vihiga', 'Nandi', 'Kericho', 'Nyamira', 'Kisii', 'Homa Bay'],
  'Homa Bay': ['Kisumu', 'Kisii', 'Migori'],
  Migori: ['Homa Bay', 'Kisii', 'Narok'],
  Kisii: ['Homa Bay', 'Migori', 'Narok', 'Nyamira', 'Kisumu'],
  Nyamira: ['Kisii', 'Kisumu', 'Kericho', 'Bomet'],
};

/**
 * Land neighbours of a county, tolerant of the spellings real data arrives in
 * ("Muranga", "Elgeyo Marakwet"). Empty for an unrecognised name — never a
 * guess, matching `resolveCounty`'s contract.
 */
export function neighboursOf(county: string): readonly KenyanCounty[] {
  const canonical = resolveCounty(county);
  return canonical ? COUNTY_ADJACENCY[canonical] : [];
}

/**
 * Whether two counties share a land border. False for a county against itself:
 * "adjacent" is a tier the engine reaches for *after* exhausting local data, so
 * a county must never be its own neighbour or the tiers would overlap.
 */
export function areAdjacent(a: string, b: string): boolean {
  const left = resolveCounty(a);
  const right = resolveCounty(b);
  if (left === null || right === null || left === right) return false;
  return COUNTY_ADJACENCY[left].includes(right);
}
