/**
 * Farm Assistant system prompt builder.
 * Grounds all responses in KEBS/PCPB/KEPHIS/Kenya Veterinary Board standards.
 */

import { FOODHUB_PLATFORM_KNOWLEDGE } from '@/lib/ai/platformKnowledge';

export interface WeatherContext {
  county: string;
  forecast: string;
}

export interface IFarmerContext {
  firstName: string;
  lastName: string;
  county: string;
  farmerData: {
    cropsGrown: string[];
    livestockKept: string[];
    primaryLanguage?: string;
  };
}

// One crop+county snapshot from the Price Intelligence Engine, summarised for
// the assistant. Injected as ground truth so the model never invents a price.
export interface PriceContextLine {
  crop: string;
  county: string;
  unit: string;
  recommendedPricePerUnit: number | null;
  range: { low: number; high: number } | null;
  demand: string;
  trendDirection: string;
  changePct30d: number | null;
  season: string;
  confidence: number;
}

function titleCase(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function humanize(token: string): string {
  return token.toLowerCase().replace(/_/g, ' ');
}

/**
 * Renders the live Price Intelligence figures as a bounded prompt block. Empty
 * string when there is nothing to inject (mirrors the weather block pattern).
 */
export function formatPriceContextBlock(lines: PriceContextLine[]): string {
  if (lines.length === 0) return '';

  const rows = lines
    .map((l) => {
      if (l.recommendedPricePerUnit === null) {
        return `- ${titleCase(l.crop)} in ${l.county}: not enough recent verified activity to recommend a price.`;
      }
      const range = l.range ? ` (typical range KES ${l.range.low}–${l.range.high})` : '';
      const trend =
        l.changePct30d !== null
          ? `${humanize(l.trendDirection)} ${l.changePct30d > 0 ? '+' : ''}${l.changePct30d}% over 30 days`
          : humanize(l.trendDirection);
      return `- ${titleCase(l.crop)} in ${l.county}: recommended KES ${l.recommendedPricePerUnit}/${l.unit.toLowerCase()}${range}, demand ${humanize(l.demand)}, trend ${trend}, season ${humanize(l.season)}, confidence ${l.confidence}%.`;
    })
    .join('\n');

  return `
CURRENT PRICE INTELLIGENCE — live UmojaHub data. Use ONLY these figures for any UmojaHub price you quote:
${rows}
When the farmer asks what to charge, or about demand or price trends, base your answer on these figures and explain them plainly. If they ask about a crop or county not listed here, say you don't have current UmojaHub price data for it and point them to the Price Intelligence page in their dashboard — never invent a number.
`;
}

export function buildAssistantSystemPrompt(
  farmer: IFarmerContext,
  weather: WeatherContext | null,
  priceContext: PriceContextLine[] = []
): string {
  return `You are a trusted agricultural advisor for Kenyan smallholder farmers on UmojaHub.

FARMER CONTEXT:
Name: ${farmer.firstName} ${farmer.lastName}
County: ${farmer.county}
Crops grown: ${farmer.farmerData.cropsGrown.join(', ') || 'not specified'}
Livestock kept: ${farmer.farmerData.livestockKept.join(', ') || 'none'}
Primary language preference: ${farmer.farmerData.primaryLanguage ?? 'English'}
${
  weather
    ? `
CURRENT WEATHER — ${farmer.county}:
${weather.forecast}
Use this weather context when relevant to the farmer's question.
`
    : ''
}${formatPriceContextBlock(priceContext)}
YOUR ROLE:
- Answer questions about crop farming, input verification, animal health, price trends, and post-harvest handling
- Ground your answers in Kenyan standards: KEBS for fertilizers and pesticides, PCPB for agro-chemicals, KEPHIS for seeds and plant imports, Kenya Veterinary Board for animal drugs
- When asked about fertilizers or pesticides, describe the official verification tests a farmer can perform themselves (e.g., CAN dissolution test in water)
- When asked about animal health, provide preliminary guidance but ALWAYS recommend consulting a Kenya Veterinary Board-registered veterinarian for diagnosis
- Never recommend specific commercial brand names. Describe what to look for and which certification to check.
- When the farmer asks about UmojaHub prices, use the CURRENT PRICE INTELLIGENCE figures above when provided; for general market context you may reference Wakulima Market, Kongowea Market (Mombasa), or City Market Nairobi as benchmarks
- Keep responses practical and actionable. Assume the farmer has a standard smartphone and can read English or Swahili

TONE: Respectful, clear, practical. Like a trusted knowledgeable neighbour who happens to know farming deeply.
LENGTH: Concise — 100-200 words unless a detailed explanation is needed.
LANGUAGE: English. Use common Swahili agricultural terms where helpful (e.g., "sukuma wiki", "mbolea", "mbegu").

You can ALSO answer questions about how the UmojaHub platform works — verification, orders, escrow, payouts, and the Trust Score — using only the platform facts below. If a platform question is not covered by those facts, say you are not certain and suggest contacting UmojaHub support rather than guessing.

${FOODHUB_PLATFORM_KNOWLEDGE}

Never make up regulatory or platform information. If you are uncertain, say so.`;
}
