/**
 * @jest-environment node
 *
 * Unit tests for the assistant ↔ Price Intelligence bridge: intent detection,
 * crop/county extraction, and the prompt-block formatter.
 */

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import { detectPriceIntent, extractCrops, extractCounty } from '../assistantPriceContext';
import { formatPriceContextBlock } from '@/lib/foodhub/assistantPrompt';
import type { PriceContextLine } from '@/lib/foodhub/assistantPrompt';

describe('detectPriceIntent', () => {
  it('detects price/charge/demand questions', () => {
    expect(detectPriceIntent('What should I charge for tomatoes?')).toBe(true);
    expect(detectPriceIntent('Why is maize demand rising?')).toBe(true);
    expect(detectPriceIntent('Which crops perform best in Nakuru?')).toBe(true);
  });

  it('ignores non-price questions', () => {
    expect(detectPriceIntent('How do I treat tomato blight?')).toBe(false);
    expect(detectPriceIntent('When should I plant maize?')).toBe(false);
  });
});

describe('extractCrops', () => {
  it('finds a named crop', () => {
    expect(extractCrops('what should I charge for tomatoes', [])).toEqual(['tomatoes']);
  });

  it('resolves synonyms', () => {
    expect(extractCrops('price of sukuma wiki', [])).toEqual(['kale']);
    expect(extractCrops('how much is a tomato', [])).toEqual(['tomatoes']);
  });

  it('falls back to the farmer crops when none named', () => {
    expect(extractCrops('what are my best prices', ['maize', 'beans'])).toEqual(['maize', 'beans']);
  });

  it('caps at three crops', () => {
    const crops = extractCrops('maize beans tea rice coffee prices', []);
    expect(crops.length).toBe(3);
  });

  it('returns empty when nothing resolves', () => {
    expect(extractCrops('what is the weather', [])).toEqual([]);
  });
});

describe('extractCounty', () => {
  it('picks a county named in the message', () => {
    expect(extractCounty('tomato prices in Nakuru', 'Kiambu')).toBe('Nakuru');
  });

  it('defaults to the farmer county', () => {
    expect(extractCounty('what should I charge for tomatoes', 'Kiambu')).toBe('Kiambu');
  });
});

describe('formatPriceContextBlock', () => {
  const line: PriceContextLine = {
    crop: 'tomatoes',
    county: 'Kirinyaga',
    unit: 'KG',
    recommendedPricePerUnit: 77,
    range: { low: 74, high: 79 },
    demand: 'HIGH',
    trendDirection: 'RISING',
    changePct30d: 9.9,
    season: 'PEAK_SUPPLY',
    confidence: 30,
  };

  it('returns empty string with no lines', () => {
    expect(formatPriceContextBlock([])).toBe('');
  });

  it('renders the figures and the grounding instruction', () => {
    const block = formatPriceContextBlock([line]);
    expect(block).toContain('CURRENT PRICE INTELLIGENCE');
    expect(block).toContain('Use ONLY these figures');
    expect(block).toContain('Tomatoes in Kirinyaga');
    expect(block).toContain('KES 77/kg');
    expect(block).toContain('+9.9% over 30 days');
    expect(block).toContain('never invent a number');
  });

  it('renders an honest line when there is no recommendation', () => {
    const block = formatPriceContextBlock([{ ...line, recommendedPricePerUnit: null, range: null }]);
    expect(block).toContain('not enough recent verified activity');
  });
});
