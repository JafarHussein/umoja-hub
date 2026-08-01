/**
 * @jest-environment node
 */

import { ListingCategory, ListingUnit } from '@/types';
import {
  CROP_IDS,
  CROP_REGISTRY,
  SEASONAL_CROP_IDS,
  cropLabel,
  getCrop,
  resolveCrop,
} from '../crops';
import {
  KG_EQUIVALENTS,
  fromKgEquivalent,
  getConversion,
  resolveUnit,
  toKgEquivalent,
} from '../units';
import { KENYAN_COUNTIES, isKnownCounty, resolveCounty } from '../counties';

describe('crops — resolveCrop', () => {
  it('resolves every canonical id and label to itself', () => {
    for (const id of CROP_IDS) {
      expect(resolveCrop(id)).toBe(id);
      expect(resolveCrop(CROP_REGISTRY[id].label)).toBe(id);
    }
  });

  it('strips parentheticals, casing and whitespace', () => {
    expect(resolveCrop('  Kale (Sukuma Wiki) ')).toBe('kale');
    expect(resolveCrop('TOMATOES')).toBe('tomatoes');
    expect(resolveCrop('Green Grams (Ndengu)')).toBe('green-grams');
  });

  it('resolves the colloquial names the five old lists disagreed on', () => {
    expect(resolveCrop('sukuma wiki')).toBe('kale');
    expect(resolveCrop('Milk')).toBe('dairy');
    expect(resolveCrop('irish')).toBe('potatoes');
    expect(resolveCrop('pepper')).toBe('capsicum');
    expect(resolveCrop('ndengu')).toBe('green-grams');
    expect(resolveCrop('nyanya')).toBe('tomatoes');
  });

  it('prefers an exact match over phrase containment', () => {
    expect(resolveCrop('beans')).toBe('beans');
    expect(resolveCrop('French Beans')).toBe('french-beans');
  });

  it('matches whole words only, so "price" never resolves to rice', () => {
    expect(resolveCrop('price')).toBeNull();
    expect(resolveCrop('what is the price today')).toBeNull();
    expect(resolveCrop('rice')).toBe('rice');
  });

  it('finds the crop inside a listing title', () => {
    expect(resolveCrop('Fresh Tomatoes Grade A')).toBe('tomatoes');
  });

  it('returns null for unknown and empty input rather than guessing', () => {
    expect(resolveCrop('sorghum')).toBeNull();
    expect(resolveCrop('')).toBeNull();
    expect(resolveCrop('   ')).toBeNull();
  });

  it('covers every crop the simulator generates', () => {
    // scripts/simulate/dictionaries.ts — these previously resolved to nothing.
    const simulatorCrops = [
      'Tomatoes',
      'Maize',
      'Potatoes',
      'Kale (Sukuma Wiki)',
      'Onions',
      'Cabbages',
      'French Beans',
      'Avocados',
      'Bananas',
      'Carrots',
      'Green Grams (Ndengu)',
      'Milk',
    ];
    for (const crop of simulatorCrops) {
      expect(resolveCrop(crop)).not.toBeNull();
    }
  });
});

describe('crops — registry', () => {
  it('records which crops the seasonal layer covers', () => {
    // The ten crops seasonality.ts carries a calendar for.
    expect([...SEASONAL_CROP_IDS].sort()).toEqual(
      ['beans', 'capsicum', 'coffee', 'dairy', 'kale', 'maize', 'potatoes', 'rice', 'tea', 'tomatoes'].sort()
    );
  });

  it('leaves category null for cash crops with no marketplace equivalent', () => {
    expect(getCrop('tea').category).toBeNull();
    expect(getCrop('coffee').category).toBeNull();
    expect(getCrop('maize').category).toBe(ListingCategory.CEREALS);
  });

  it('lists at least one typical unit for every crop', () => {
    for (const id of CROP_IDS) {
      expect(CROP_REGISTRY[id].typicalUnits.length).toBeGreaterThan(0);
    }
  });

  it('falls back to the caller wording when labelling unknown text', () => {
    expect(cropLabel('sukuma wiki')).toBe('Kale (Sukuma Wiki)');
    expect(cropLabel('Sorghum')).toBe('Sorghum');
  });
});

describe('units — conversion refuses to guess', () => {
  it('treats KG as the identity for any crop', () => {
    expect(toKgEquivalent('maize', ListingUnit.KG, 12)).toBe(12);
  });

  it('returns null for DISPUTED constants unless explicitly opted in', () => {
    // A maize BAG is 90 kg in the trade but capped at 50 kg by the 2019 rules.
    expect(toKgEquivalent('maize', ListingUnit.BAG, 1)).toBeNull();
    expect(toKgEquivalent('maize', ListingUnit.BAG, 1, { allowDisputed: true })).toBe(90);
  });

  it('applies STANDARD constants without an opt-in', () => {
    expect(toKgEquivalent('dairy', ListingUnit.LITRE, 10)).toBeCloseTo(10.3);
  });

  it('returns null where no defensible constant exists', () => {
    expect(toKgEquivalent('cabbages', ListingUnit.PIECE, 1, { allowDisputed: true })).toBeNull();
    expect(toKgEquivalent('avocados', ListingUnit.CRATE, 1, { allowDisputed: true })).toBeNull();
    expect(getConversion('carrots', ListingUnit.BAG)).toBeNull();
  });

  it('round-trips through fromKgEquivalent', () => {
    const kg = toKgEquivalent('potatoes', ListingUnit.BAG, 3, { allowDisputed: true });
    expect(kg).toBe(150);
    expect(fromKgEquivalent('potatoes', ListingUnit.BAG, 150, { allowDisputed: true })).toBe(3);
  });

  it('documents the ambiguity on every DISPUTED entry', () => {
    for (const table of Object.values(KG_EQUIVALENTS)) {
      for (const conversion of Object.values(table ?? {})) {
        if (conversion.confidence === 'DISPUTED') {
          expect(conversion.note.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('narrows unit text', () => {
    expect(resolveUnit('kg')).toBe(ListingUnit.KG);
    expect(resolveUnit(' Crate ')).toBe(ListingUnit.CRATE);
    expect(resolveUnit('sack')).toBeNull();
  });
});

describe('counties', () => {
  it('resolves every canonical county to itself', () => {
    for (const county of KENYAN_COUNTIES) {
      expect(resolveCounty(county)).toBe(county);
    }
  });

  it('tolerates the punctuation variants real data arrives in', () => {
    expect(resolveCounty('Muranga')).toBe("Murang'a");
    expect(resolveCounty('Elgeyo Marakwet')).toBe('Elgeyo-Marakwet');
    expect(resolveCounty('taita taveta')).toBe('Taita-Taveta');
    expect(resolveCounty('  NAIROBI ')).toBe('Nairobi');
  });

  it('reduces all 47 counties to distinct keys, so no name is ambiguous', () => {
    const keys = KENYAN_COUNTIES.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    expect(new Set(keys).size).toBe(KENYAN_COUNTIES.length);
  });

  it('maps towns the repo mislabels as counties', () => {
    // scripts/simulate/dictionaries.ts lists 'Eldoret' among URBAN_COUNTIES.
    expect(resolveCounty('Eldoret')).toBe('Uasin Gishu');
    expect(resolveCounty('Kitale')).toBe('Trans Nzoia');
  });

  it('returns null for unrecognised names', () => {
    expect(resolveCounty('Kampala')).toBeNull();
    expect(resolveCounty('')).toBeNull();
    expect(isKnownCounty('Kiambu')).toBe(true);
    expect(isKnownCounty('Zanzibar')).toBe(false);
  });
});
