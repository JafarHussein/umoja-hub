// ---------------------------------------------------------------------------
// Canonical produce taxonomy — the single source of truth for crop identity.
//
// Before this module the platform carried FIVE independent crop lists that had
// drifted apart:
//   - src/lib/intelligence/seasonality.ts      (10 season-calendar keys)
//   - src/lib/integrations/priceDataService.ts (10 middleman benchmark keys)
//   - src/lib/intelligence/assistantPriceContext.ts (10 keys + a synonym map)
//   - src/components/foodhub/CreateListingForm.tsx  (10 dropdown values)
//   - scripts/simulate/dictionaries.ts         (12 DIFFERENT crops)
//
// The simulator's crops did not match the engine's, so most generated listings
// resolved to `season: UNKNOWN` and `middlemanBenchmark: null`. Every one of
// those lists now derives from CROP_REGISTRY, and every crop-name comparison
// goes through `resolveCrop`.
//
// `hasSeasonCalendar` is deliberately part of the registry rather than hidden:
// it records exactly which crops the seasonal layer can speak about, so the gap
// is measurable instead of silently degrading to UNKNOWN.
// ---------------------------------------------------------------------------

import { ListingCategory, ListingUnit } from '@/types';

export type CropId =
  | 'maize'
  | 'beans'
  | 'tomatoes'
  | 'potatoes'
  | 'kale'
  | 'capsicum'
  | 'tea'
  | 'coffee'
  | 'rice'
  | 'dairy'
  | 'onions'
  | 'cabbages'
  | 'french-beans'
  | 'avocados'
  | 'bananas'
  | 'carrots'
  | 'green-grams';

export interface CropDefinition {
  id: CropId;
  /** Full display name, including the colloquial form buyers recognise. */
  label: string;
  /** Compact form for tables, chips and chart axes. */
  shortLabel: string;
  /** Alternate spellings and colloquial names, all lowercase. */
  synonyms: readonly string[];
  /**
   * Marketplace category. `null` where no ListingCategory maps cleanly — tea and
   * coffee are cash crops with no matching enum member. Inventing a mapping here
   * would recreate exactly the drift this module exists to prevent; extending
   * ListingCategory is a marketplace-taxonomy decision, not a pricing one.
   */
  category: ListingCategory | null;
  /** Units this crop is actually traded in on the platform. Not a conversion. */
  typicalUnits: readonly ListingUnit[];
  /** Whether src/lib/intelligence/seasonality.ts carries a calendar for it. */
  hasSeasonCalendar: boolean;
}

export const CROP_REGISTRY: Readonly<Record<CropId, CropDefinition>> = {
  maize: {
    id: 'maize',
    label: 'Maize',
    shortLabel: 'Maize',
    synonyms: ['mahindi', 'dry maize', 'white maize', 'corn'],
    category: ListingCategory.CEREALS,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  beans: {
    id: 'beans',
    label: 'Beans',
    shortLabel: 'Beans',
    synonyms: ['bean', 'maharagwe', 'dry beans'],
    category: ListingCategory.LEGUMES,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  tomatoes: {
    id: 'tomatoes',
    label: 'Tomatoes',
    shortLabel: 'Tomatoes',
    synonyms: ['tomato', 'nyanya'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.CRATE, ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  potatoes: {
    id: 'potatoes',
    label: 'Potatoes',
    shortLabel: 'Potatoes',
    synonyms: ['potato', 'irish', 'irish potatoes', 'viazi'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  kale: {
    id: 'kale',
    label: 'Kale (Sukuma Wiki)',
    shortLabel: 'Kale',
    synonyms: ['sukuma wiki', 'sukuma', 'collard greens'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  capsicum: {
    id: 'capsicum',
    label: 'Capsicum',
    shortLabel: 'Capsicum',
    synonyms: ['capsicums', 'pepper', 'sweet pepper', 'bell pepper', 'pilipili hoho'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.KG, ListingUnit.CRATE],
    hasSeasonCalendar: true,
  },
  tea: {
    id: 'tea',
    label: 'Tea',
    shortLabel: 'Tea',
    synonyms: ['green leaf', 'majani'],
    category: null,
    typicalUnits: [ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  coffee: {
    id: 'coffee',
    label: 'Coffee',
    shortLabel: 'Coffee',
    synonyms: ['cherry', 'coffee cherry', 'kahawa'],
    category: null,
    typicalUnits: [ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  rice: {
    id: 'rice',
    label: 'Rice',
    shortLabel: 'Rice',
    synonyms: ['mchele', 'paddy'],
    category: ListingCategory.CEREALS,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: true,
  },
  dairy: {
    id: 'dairy',
    label: 'Milk',
    shortLabel: 'Milk',
    synonyms: ['milk', 'fresh milk', 'maziwa', 'raw milk'],
    category: ListingCategory.DAIRY,
    typicalUnits: [ListingUnit.LITRE],
    hasSeasonCalendar: true,
  },
  onions: {
    id: 'onions',
    label: 'Onions',
    shortLabel: 'Onions',
    synonyms: ['onion', 'dry onion', 'red onion', 'kitunguu'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: false,
  },
  cabbages: {
    id: 'cabbages',
    label: 'Cabbages',
    shortLabel: 'Cabbages',
    synonyms: ['cabbage', 'kabichi'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.PIECE, ListingUnit.KG],
    hasSeasonCalendar: false,
  },
  'french-beans': {
    id: 'french-beans',
    label: 'French Beans',
    shortLabel: 'French Beans',
    synonyms: ['french bean', 'green beans', 'mishiri'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.KG],
    hasSeasonCalendar: false,
  },
  avocados: {
    id: 'avocados',
    label: 'Avocados',
    shortLabel: 'Avocados',
    synonyms: ['avocado', 'parachichi', 'hass'],
    category: ListingCategory.FRUITS,
    typicalUnits: [ListingUnit.CRATE, ListingUnit.PIECE, ListingUnit.KG],
    hasSeasonCalendar: false,
  },
  bananas: {
    id: 'bananas',
    label: 'Bananas',
    shortLabel: 'Bananas',
    synonyms: ['banana', 'ndizi'],
    category: ListingCategory.FRUITS,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: false,
  },
  carrots: {
    id: 'carrots',
    label: 'Carrots',
    shortLabel: 'Carrots',
    synonyms: ['carrot', 'karoti'],
    category: ListingCategory.VEGETABLES,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: false,
  },
  'green-grams': {
    id: 'green-grams',
    label: 'Green Grams (Ndengu)',
    shortLabel: 'Green Grams',
    synonyms: ['green gram', 'ndengu', 'mung beans', 'mung bean'],
    category: ListingCategory.LEGUMES,
    typicalUnits: [ListingUnit.BAG, ListingUnit.KG],
    hasSeasonCalendar: false,
  },
};

export const CROP_IDS: readonly CropId[] = Object.keys(CROP_REGISTRY) as CropId[];

/** Crops the seasonal layer can speak about. */
export const SEASONAL_CROP_IDS: readonly CropId[] = CROP_IDS.filter(
  (id) => CROP_REGISTRY[id].hasSeasonCalendar
);

/**
 * Lowercases, strips parenthetical asides, drops punctuation and collapses
 * whitespace — e.g. "  Kale (Sukuma Wiki) " → "kale".
 */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** id + label + synonyms, longest first so "green grams" wins over "grams". */
const LOOKUP: readonly (readonly [string, CropId])[] = CROP_IDS.flatMap((id) => {
  const crop = CROP_REGISTRY[id];
  const keys = [id, id.replace(/-/g, ' '), normalizeText(crop.label), ...crop.synonyms];
  return keys.map((key) => [normalizeText(key), id] as const);
})
  .filter(([key]) => key.length > 0)
  .sort((a, b) => b[0].length - a[0].length);

/** Whole-word containment, so "price" never matches "rice". */
function containsPhrase(haystack: string, needle: string): boolean {
  const index = haystack.indexOf(needle);
  if (index === -1) return false;
  const before = index === 0 ? ' ' : haystack[index - 1];
  const afterIndex = index + needle.length;
  const after = afterIndex >= haystack.length ? ' ' : haystack[afterIndex];
  return before === ' ' && after === ' ';
}

/**
 * Resolves free text to a canonical crop id, or null when nothing matches.
 *
 * Replaces three divergent matchers: `normalizeCrop` (seasonality), the
 * `CROP_SYNONYMS` map (assistant), and the anchored `^crop` regex the engine
 * used against PriceHistory. Exact matches win before phrase containment, so
 * "beans" resolves to `beans` rather than `french-beans`.
 */
export function resolveCrop(freeText: string): CropId | null {
  const text = normalizeText(freeText);
  if (text.length === 0) return null;

  for (const [key, id] of LOOKUP) {
    if (key === text) return id;
  }
  for (const [key, id] of LOOKUP) {
    if (containsPhrase(text, key)) return id;
  }
  return null;
}

/** The registry entry for a crop id. */
export function getCrop(id: CropId): CropDefinition {
  return CROP_REGISTRY[id];
}

/** Every searchable name for a crop: its id, label and synonyms. */
export function cropAliases(id: CropId): readonly string[] {
  const crop = CROP_REGISTRY[id];
  const terms = [id.replace(/-/g, ' '), normalizeText(crop.label), ...crop.synonyms];
  return [...new Set(terms.map(normalizeText).filter((t) => t.length > 0))].sort(
    (a, b) => b.length - a.length
  );
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A word-boundary regex matching any alias of a crop, for querying the
 * free-text `cropName` column.
 *
 * This is deliberately a SUPERSET filter — `\bbeans\b` also matches
 * "French Beans" — because the database cannot express "longest alias wins".
 * Always narrow the results with `matchesCrop`, which applies the correct
 * precedence. Fetching a small superset and filtering precisely in memory is
 * the only way to get this right without a schema migration.
 */
export function cropNamePattern(id: CropId): RegExp {
  const alternation = cropAliases(id).map(escapeRegex).join('|');
  return new RegExp('\\b(' + alternation + ')\\b', 'i');
}

/** Whether free text resolves to exactly this crop. */
export function matchesCrop(freeText: string, id: CropId): boolean {
  return resolveCrop(freeText) === id;
}

/** Display label for free text, falling back to the caller's own wording. */
export function cropLabel(freeText: string): string {
  const id = resolveCrop(freeText);
  return id ? CROP_REGISTRY[id].label : freeText;
}
