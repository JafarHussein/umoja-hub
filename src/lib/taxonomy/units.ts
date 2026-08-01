// ---------------------------------------------------------------------------
// Unit handling for produce prices.
//
// WHY THIS MODULE REFUSES TO CONVERT BY DEFAULT
//
// A "bag" in Kenya does not have one weight, and the ambiguity is legal as well
// as practical:
//
//   - Maize trades at 90 kg/bag — NCPB publishes its farmgate price per 90 kg
//     bag — while the Crops (Food Crops) Regulations 2019 cap a package at
//     50 kg. Both figures are in live use, and NCPB has been challenged in
//     parliament for the 90 kg bag.
//   - Irish potatoes are capped at 50 kg by the Crops (Irish Potato)
//     Regulations 2019, yet "extended bags" of 110 kg (historically up to 150 kg)
//     persist in the trade; enforcement drives recur.
//
// Converting a BAG price to a KG price with the wrong constant produces a ~44%
// error — far worse than the mixed-unit defect this taxonomy was written to
// fix. So the recommendation path NEVER converts: it compares like with like by
// filtering on the farmer's stated unit (see priceIntelligence.ts). Fewer points
// and an honest confidence score beats more points and a wrong number.
//
// The table below therefore exists for EXTERNAL DATA INGESTION, where a source
// states its own basis explicitly (KAMIS publishes per-Kg wholesale and retail),
// and every entry carries the confidence in that constant. `toKgEquivalent`
// returns null for anything DISPUTED unless the caller opts in deliberately.
// ---------------------------------------------------------------------------

import { ListingUnit } from '@/types';
import type { CropId } from './crops';

export const UNIT_LABEL: Readonly<Record<ListingUnit, string>> = {
  [ListingUnit.KG]: 'kg',
  [ListingUnit.BAG]: 'bag',
  [ListingUnit.CRATE]: 'crate',
  [ListingUnit.LITRE]: 'litre',
  [ListingUnit.PIECE]: 'piece',
};

/**
 * STANDARD — one weight is used consistently in the trade.
 * DISPUTED  — legal and market practice disagree, or the item varies by size.
 *             Never applied silently.
 */
export type ConversionConfidence = 'STANDARD' | 'DISPUTED';

export interface UnitConversion {
  /** Kilograms in one unit of this crop. */
  kg: number;
  confidence: ConversionConfidence;
  /** Why this figure, and what competes with it. */
  note: string;
}

type CropUnitTable = Partial<Record<ListingUnit, UnitConversion>>;

/**
 * Only crops and units with a defensible figure appear here. An absent entry is
 * a deliberate refusal to guess, not an oversight.
 */
export const KG_EQUIVALENTS: Readonly<Partial<Record<CropId, CropUnitTable>>> = {
  maize: {
    [ListingUnit.BAG]: {
      kg: 90,
      confidence: 'DISPUTED',
      note: '90 kg is the de facto trading bag (NCPB buys and prices per 90 kg bag), but the Crops (Food Crops) Regulations 2019 cap a package at 50 kg. Both are in live use.',
    },
  },
  beans: {
    [ListingUnit.BAG]: {
      kg: 90,
      confidence: 'DISPUTED',
      note: 'Follows the 90 kg gunny-bag grain convention; the 2019 50 kg packaging cap applies equally.',
    },
  },
  'green-grams': {
    [ListingUnit.BAG]: {
      kg: 90,
      confidence: 'DISPUTED',
      note: 'Traded in the same 90 kg gunny bag as other pulses; subject to the same 50 kg statutory cap.',
    },
  },
  potatoes: {
    [ListingUnit.BAG]: {
      kg: 50,
      confidence: 'DISPUTED',
      note: 'The Crops (Irish Potato) Regulations 2019 set 50 kg as the maximum package, but 110 kg extended bags persist in the trade.',
    },
  },
  dairy: {
    [ListingUnit.LITRE]: {
      kg: 1.03,
      confidence: 'STANDARD',
      note: 'Density of raw cow milk, ~1.03 kg/L. Prices are quoted per litre; conversion is only for cross-source comparison.',
    },
  },
};

export interface ToKgOptions {
  /**
   * Opt in to DISPUTED constants. Callers that set this must surface the
   * ambiguity to the user — never use it on a path that shows a farmer a price.
   */
  allowDisputed?: boolean;
}

/** The conversion record for a crop/unit pair, or null when none is defensible. */
export function getConversion(cropId: CropId, unit: ListingUnit): UnitConversion | null {
  if (unit === ListingUnit.KG) {
    return { kg: 1, confidence: 'STANDARD', note: 'Identity.' };
  }
  return KG_EQUIVALENTS[cropId]?.[unit] ?? null;
}

/**
 * Converts a quantity in `unit` to kilograms. Returns null when no defensible
 * constant exists, or when the only constant is DISPUTED and the caller has not
 * opted in. Never guesses.
 */
export function toKgEquivalent(
  cropId: CropId,
  unit: ListingUnit,
  quantity: number,
  options: ToKgOptions = {}
): number | null {
  const conversion = getConversion(cropId, unit);
  if (!conversion) return null;
  if (conversion.confidence === 'DISPUTED' && options.allowDisputed !== true) return null;
  return quantity * conversion.kg;
}

/** Inverse of `toKgEquivalent`, under the same refusal rules. */
export function fromKgEquivalent(
  cropId: CropId,
  unit: ListingUnit,
  kilograms: number,
  options: ToKgOptions = {}
): number | null {
  const conversion = getConversion(cropId, unit);
  if (!conversion) return null;
  if (conversion.confidence === 'DISPUTED' && options.allowDisputed !== true) return null;
  if (conversion.kg === 0) return null;
  return kilograms / conversion.kg;
}

/** Narrows arbitrary text to a ListingUnit, or null. */
export function resolveUnit(value: string): ListingUnit | null {
  const key = value.trim().toUpperCase();
  return (Object.values(ListingUnit) as string[]).includes(key) ? (key as ListingUnit) : null;
}
