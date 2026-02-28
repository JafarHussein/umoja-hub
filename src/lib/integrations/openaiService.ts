/**
 * OpenAI service — GPT-4o brief generation with structured JSON output.
 * File: src/lib/integrations/openaiService.ts
 *
 * Uses response_format: { type: 'json_object' } to guarantee JSON.
 * Retries once on invalid structure.
 * Throws AppError(503, 'EDUCATION_BRIEF_GENERATION_FAILED') if both attempts fail.
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/utils';
import { AppError } from '@/lib/utils';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o';

// Minimum fields that must be present for a brief to be considered valid
const REQUIRED_BRIEF_FIELDS = [
  'projectTitle',
  'clientPersona',
  'problemStatement',
  'coreRequirements',
  'technicalRequirements',
  'kenyanConstraints',
  'outOfScope',
  'successCriteria',
  'suggestedTechStack',
  'estimatedDurationWeeks',
  'industryContext',
] as const;

export interface GeneratedBrief {
  projectTitle: string;
  clientPersona: {
    name: string;
    businessType: string;
    county: string;
    technicalLiteracy: 'low' | 'medium' | 'high';
    context: string;
  };
  problemStatement: string;
  coreRequirements: string[];
  technicalRequirements: string[];
  kenyanConstraints: string[];
  outOfScope: string[];
  successCriteria: string[];
  suggestedTechStack: string[];
  estimatedDurationWeeks: number;
  industryContext: string;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

function isValidBrief(data: unknown): data is GeneratedBrief {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return REQUIRED_BRIEF_FIELDS.every((field) => field in obj);
}

async function callOpenAI(prompt: string): Promise<GeneratedBrief | null> {
  const apiKey = env('OPENAI_API_KEY');

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    logger.error('openaiService', 'OpenAI API returned non-200', {
      status: res.status,
      error: errorBody,
    });
    return null;
  }

  const data = (await res.json()) as OpenAIResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    logger.error('openaiService', 'OpenAI returned empty content');
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (isValidBrief(parsed)) {
      return parsed;
    }
    logger.warn('openaiService', 'OpenAI response missing required brief fields', {
      keys: Object.keys(parsed as Record<string, unknown>),
    });
    return null;
  } catch {
    logger.error('openaiService', 'Failed to parse OpenAI JSON response');
    return null;
  }
}

/**
 * Generate a project brief via GPT-4o.
 * Retries once if the first response has invalid structure.
 * Throws 503 if both attempts fail.
 */
export async function generateBrief(prompt: string): Promise<GeneratedBrief> {
  // First attempt
  const firstResult = await callOpenAI(prompt);
  if (firstResult) {
    logger.info('openaiService', 'Brief generated successfully on first attempt');
    return firstResult;
  }

  // Second attempt
  logger.warn('openaiService', 'Brief generation failed on first attempt — retrying');
  const secondResult = await callOpenAI(prompt);
  if (secondResult) {
    logger.info('openaiService', 'Brief generated successfully on second attempt');
    return secondResult;
  }

  logger.error('openaiService', 'Brief generation failed on both attempts');
  throw new AppError(
    'Failed to generate project brief. Please try again.',
    503,
    'EDUCATION_BRIEF_GENERATION_FAILED'
  );
}

// ---------------------------------------------------------------------------
// moderateContent — OpenAI Moderation API
// ---------------------------------------------------------------------------

interface IModerationResponse {
  results?: Array<{ flagged: boolean }>;
}

/**
 * Check user-generated text against OpenAI's content moderation API.
 *
 * Fail-open design: if the moderation API is unreachable or returns an error,
 * the function returns false (not flagged) to avoid blocking legitimate content.
 * This matches the graceful-degradation rule for external API calls.
 *
 * @returns true if content is flagged (block it), false if safe or on API failure
 */
export async function moderateContent(text: string): Promise<boolean> {
  const apiKey = env('OPENAI_API_KEY');

  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) {
      logger.warn('openaiService', 'Moderation API non-200 — proceeding without moderation', {
        status: res.status,
      });
      return false;
    }

    const data = (await res.json()) as IModerationResponse;
    const flagged = data.results?.[0]?.flagged === true;

    if (flagged) {
      logger.warn('openaiService', 'Content flagged by moderation API');
    }

    return flagged;
  } catch (error) {
    logger.error('openaiService', 'Moderation API call failed — proceeding without moderation', {
      error,
    });
    return false;
  }
}
