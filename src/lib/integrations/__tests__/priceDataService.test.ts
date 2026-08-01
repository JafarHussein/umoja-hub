/**
 * @jest-environment node
 *
 * D17 — the middleman benchmark table is quoted per kilogram, and nothing used
 * to enforce that. `getMiddlemanBenchmark` handed the same figure to a caller
 * asking about BAG prices, so `platformPremium` compared a per-bag average
 * against a per-kg reference. Maize is 35 KES/kg here and trades at roughly
 * 3,600 KES per 90 kg bag: the two differ by two orders of magnitude, which is
 * D1's mixed-unit defect one collection over.
 */

import {
  MIDDLEMAN_BENCHMARKS,
  MIDDLEMAN_BENCHMARK_UNIT,
  calculatePlatformPremium,
  getMiddlemanBenchmark,
} from '../priceDataService';
import { ListingUnit } from '@/types';

describe('D17 — getMiddlemanBenchmark is unit-scoped', () => {
  it('returns the per-kg figure for a KG request', () => {
    expect(getMiddlemanBenchmark('maize', ListingUnit.KG)).toBe(35);
    expect(getMiddlemanBenchmark('tomatoes', ListingUnit.KG)).toBe(55);
  });

  it('returns null for every unit the table is not authored in', () => {
    // Not a gap to be filled by conversion. A Kenyan bag has no single weight —
    // maize trades at 90 kg while the Crops (Food Crops) Regulations 2019 cap a
    // package at 50 kg — so a derived bag benchmark would bake in a ~44% error.
    // The same refusal src/lib/taxonomy/units.ts documents.
    for (const unit of [ListingUnit.BAG, ListingUnit.CRATE, ListingUnit.LITRE, ListingUnit.PIECE]) {
      expect(getMiddlemanBenchmark('maize', unit)).toBeNull();
    }
  });

  it('never returns a bag figure derived from the per-kg one', () => {
    const perKg = getMiddlemanBenchmark('maize', ListingUnit.KG) as number;
    const perBag = getMiddlemanBenchmark('maize', ListingUnit.BAG);
    expect(perBag).toBeNull();
    // Guards the specific temptation: 35 × 90 = 3,150 must never appear.
    expect(perBag).not.toBe(perKg * 90);
  });

  it('tolerates casing and padding on both arguments', () => {
    expect(getMiddlemanBenchmark('  Maize ', 'kg')).toBe(35);
    expect(getMiddlemanBenchmark('TOMATOES', ' Kg ')).toBe(55);
  });

  it('returns null for a crop with no benchmark', () => {
    expect(getMiddlemanBenchmark('dragonfruit', ListingUnit.KG)).toBeNull();
  });

  it('declares the basis its figures are quoted in', () => {
    // The constant is what the cron, the seed and the tests all agree on. If the
    // table is ever re-authored on another basis, this is the single line to change.
    expect(MIDDLEMAN_BENCHMARK_UNIT).toBe(ListingUnit.KG);
    expect(Object.keys(MIDDLEMAN_BENCHMARKS).length).toBeGreaterThan(0);
  });
});

describe('calculatePlatformPremium', () => {
  it('expresses the platform price as a percentage above the benchmark', () => {
    expect(calculatePlatformPremium(44, 40)).toBe(10);
  });

  it('goes negative when the platform is below the benchmark', () => {
    expect(calculatePlatformPremium(36, 40)).toBe(-10);
  });

  it('refuses to divide by a zero or missing benchmark', () => {
    expect(calculatePlatformPremium(44, 0)).toBeNull();
  });
});
