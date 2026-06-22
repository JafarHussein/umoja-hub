// ---------------------------------------------------------------------------
// Bridges the Farm Assistant to the Price Intelligence Engine.
//
// Detects price intent in a farmer's message, works out which crop(s) and county
// they mean, and pulls live recommendations so the assistant answers with real
// engine numbers instead of guessing. The detection/extraction helpers are pure
// and unit-tested; `buildPriceContextForMessage` does the (best-effort) fetch.
// See context/PRICE_INTELLIGENCE_ENGINE_DESIGN.md Deliverable 14.
// ---------------------------------------------------------------------------

import { KENYAN_COUNTIES } from '@/types';
import { composeRecommendation } from './priceIntelligence';
import { normalizeCrop } from './seasonality';
import type { PriceContextLine } from '@/lib/foodhub/assistantPrompt';

/** Crops the engine has data + a seasonal calendar for. */
const KNOWN_CROPS = [
  'maize',
  'beans',
  'tomatoes',
  'potatoes',
  'kale',
  'capsicum',
  'tea',
  'coffee',
  'rice',
  'dairy',
];

/** Singular/colloquial forms mapped to the canonical crop key. */
const CROP_SYNONYMS: Record<string, string> = {
  'sukuma wiki': 'kale',
  sukuma: 'kale',
  tomato: 'tomatoes',
  potato: 'potatoes',
  irish: 'potatoes',
  bean: 'beans',
  capsicums: 'capsicum',
  pepper: 'capsicum',
  milk: 'dairy',
};

/** Words that signal the farmer is asking about price, demand, or trend. */
const PRICE_KEYWORDS = [
  'price',
  'charge',
  'sell',
  'selling',
  'worth',
  'cost',
  'market',
  'demand',
  'rate',
  'ksh',
  'kes',
  'shilling',
  'earn',
  'money',
  'profit',
  'best',
  'perform',
  'trend',
  'rising',
  'falling',
];

/** Max crops to fetch per message — bounds the prompt size and DB load. */
const MAX_CROPS = 3;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word match — avoids false hits like "rice" inside "price". */
function mentions(haystack: string, needle: string): boolean {
  return new RegExp(`\\b${escapeRegex(needle)}\\b`).test(haystack);
}

export function detectPriceIntent(message: string): boolean {
  const m = message.toLowerCase();
  return PRICE_KEYWORDS.some((k) => m.includes(k));
}

/**
 * Crops referenced in the message (synonyms resolved), falling back to the
 * farmer's own crops when none are named. Capped at MAX_CROPS.
 */
export function extractCrops(message: string, fallbackCrops: readonly string[]): string[] {
  const m = message.toLowerCase();
  const found: string[] = [];

  for (const [synonym, crop] of Object.entries(CROP_SYNONYMS)) {
    if (mentions(m, synonym) && !found.includes(crop)) found.push(crop);
  }
  for (const crop of KNOWN_CROPS) {
    if (mentions(m, crop) && !found.includes(crop)) found.push(crop);
  }

  if (found.length === 0) {
    for (const c of fallbackCrops) {
      const n = normalizeCrop(c);
      if (KNOWN_CROPS.includes(n) && !found.includes(n)) found.push(n);
    }
  }

  return found.slice(0, MAX_CROPS);
}

/** A county named in the message, else the farmer's own county. */
export function extractCounty(message: string, defaultCounty: string): string {
  const m = message.toLowerCase();
  for (const county of KENYAN_COUNTIES) {
    const re = new RegExp(`\\b${county.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(m)) return county;
  }
  return defaultCounty;
}

/**
 * Builds the Price Intelligence prompt lines for a message. Returns [] when the
 * message is not price-related or no known crop can be resolved. Never throws —
 * composeRecommendation already degrades gracefully.
 */
export async function buildPriceContextForMessage(
  message: string,
  county: string,
  farmerCrops: readonly string[]
): Promise<PriceContextLine[]> {
  if (!detectPriceIntent(message)) return [];

  const crops = extractCrops(message, farmerCrops);
  if (crops.length === 0) return [];

  const targetCounty = extractCounty(message, county);

  const lines: PriceContextLine[] = [];
  for (const crop of crops) {
    const rec = await composeRecommendation({ crop, county: targetCounty, unit: 'KG' });
    lines.push({
      crop,
      county: targetCounty,
      unit: rec.unit,
      recommendedPricePerUnit: rec.recommendedPricePerUnit,
      range: rec.range,
      demand: rec.demand.level,
      trendDirection: rec.trend.direction,
      changePct30d: rec.trend.changePct30d,
      season: rec.season.phase,
      confidence: rec.confidence,
    });
  }

  return lines;
}
