/**
 * OpenAI service for Education Hub brief generation.
 * Uses plain fetch — consistent with darajaService.ts pattern.
 * Only called during ProjectEngagement creation (POST /api/education/engagements).
 */

import { env } from '@/lib/env';
import { AppError, logger } from '@/lib/utils';
import { StudentTier } from '@/types';
import { aiBriefSchema, openSourceBriefSchema } from '@/lib/education/brief';
import type { AIBrief, OpenSourceBrief } from '@/lib/education/brief';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message: string };
}

// ---------------------------------------------------------------------------
// Public brief types — stored as ProjectEngagement.brief (Mixed field)
// ---------------------------------------------------------------------------

// The canonical brief contract lives in `@/lib/education/brief` and is shared
// by this service, the demo seeder and the workspace that renders it. These
// aliases keep existing importers working.
export type GeneratedAIBrief = AIBrief;
export type GeneratedOpenSourceBrief = OpenSourceBrief;

// ---------------------------------------------------------------------------
// BriefContextItem — mirrors BriefContextLibrary subdocument shape
// ---------------------------------------------------------------------------

export interface BriefContextInput {
  industryName: string;
  problemDomains: string[];
  kenyanConstraints: string[];
  clientPersonaTemplate: {
    businessTypes: string[];
    counties: string[];
    contexts: string[];
  };
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function callOpenAI(messages: OpenAIMessage[]): Promise<string> {
  let res: Response;
  try {
    res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });
  } catch (fetchError) {
    logger.error('openaiService', 'Network error reaching OpenAI', { error: fetchError });
    throw new AppError('Brief generation is temporarily unavailable.', 503, 'AI_SERVICE_ERROR');
  }

  const data = (await res.json()) as OpenAIResponse;

  if (!res.ok || data.error) {
    logger.error('openaiService', 'OpenAI API error', {
      status: res.status,
      error: data.error,
    });
    throw new AppError('Brief generation is temporarily unavailable.', 503, 'AI_SERVICE_ERROR');
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AppError('Brief generation returned an empty response.', 503, 'AI_SERVICE_ERROR');
  }

  return content;
}

// ---------------------------------------------------------------------------
// AI_BRIEF track — full project brief generation
// ---------------------------------------------------------------------------

const TIER_COMPLEXITY_MAP: Record<StudentTier, string> = {
  [StudentTier.BEGINNER]: 'simple CRUD application with basic authentication (max 3 core features)',
  [StudentTier.INTERMEDIATE]:
    'multi-feature application with a third-party API integration (4–6 core features)',
  [StudentTier.ADVANCED]:
    'production-grade system with real-time features, ML components, or distributed concerns',
};

export async function generateAIBrief(
  tier: StudentTier,
  context?: BriefContextInput
): Promise<GeneratedAIBrief> {
  const complexityDesc = TIER_COMPLEXITY_MAP[tier];

  const industryBlock = context
    ? `Industry: ${context.industryName}.
Problem domains: ${context.problemDomains.join(', ')}.
Kenyan constraints to embed: ${context.kenyanConstraints.join(', ')}.
Example client types: ${context.clientPersonaTemplate.businessTypes.slice(0, 3).join(', ')}.
Example counties: ${context.clientPersonaTemplate.counties.slice(0, 3).join(', ')}.`
    : 'Choose any East African small-business or public-sector industry.';

  const systemPrompt = `You are a project brief generator for Kenyan computer science students at ${tier} level.
You write realistic, specific briefs grounded in the East African context:
mobile-first, M-Pesa payments common, intermittent connectivity, Swahili and English bilingual.
Always respond with a single valid JSON object — no markdown, no extra text.`;

  const userPrompt = `Generate a software project brief.
Complexity level: ${tier} — ${complexityDesc}
${industryBlock}

Respond with exactly this JSON schema:
{
  "title": "string — concise project name",
  "clientPersona": {
    "businessType": "string",
    "county": "string — must be a real Kenyan county",
    "context": "string — 1-2 sentences about the client's situation"
  },
  "problemStatement": "string — 2-3 sentences describing the core problem",
  "coreRequirements": ["string — 5 to 7 specific feature requirements"],
  "technicalConstraints": ["string — 2 to 4 technical constraints"],
  "kenyanContextConstraints": ["string — 2 to 3 Kenya-specific constraints"],
  "deliverables": ["string — 3 to 5 concrete deliverable items"],
  "suggestedTechStack": ["string — 3 to 5 technologies"],
  "estimatedComplexity": "LOW" | "MEDIUM" | "HIGH"
}`;

  const content = await callOpenAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    logger.error('openaiService', 'Failed to parse AI brief JSON', { content });
    throw new AppError('Brief generation returned malformed data.', 503, 'AI_SERVICE_ERROR');
  }

  // Validated against the same schema the seeder writes and the workspace
  // renders. A model response that does not conform is rejected here rather
  // than persisted into a Mixed column for the UI to fall over later.
  const parsed = aiBriefSchema.safeParse(raw);
  if (!parsed.success) {
    logger.error('openaiService', 'AI brief did not match the brief contract', {
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    throw new AppError('Brief generation returned incomplete data.', 503, 'AI_SERVICE_ERROR');
  }

  logger.info('openaiService', 'AI brief generated', { tier, industry: context?.industryName });
  return parsed.data;
}

// ---------------------------------------------------------------------------
// OPEN_SOURCE track — contribution plan generation
// Non-throwing fallback: if OpenAI fails, return a minimal but valid brief.
// ---------------------------------------------------------------------------

export async function generateOpenSourceBrief(
  repoUrl: string,
  repoName: string
): Promise<GeneratedOpenSourceBrief> {
  const systemPrompt = `You are a software contribution advisor for computer science students.
You write concise, actionable open-source contribution plans.
Always respond with a single valid JSON object — no markdown, no extra text.`;

  const userPrompt = `A student wants to contribute to: ${repoUrl} (${repoName}).
Write a realistic contribution plan. Respond with exactly this JSON schema:
{
  "title": "string — a short name for the contribution",
  "contributionGoal": "string — 1-2 sentences on what kind of contribution to make",
  "proposedApproach": "string — 2-3 sentences on finding an issue and making the contribution"
}`;

  const content = await callOpenAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    logger.error('openaiService', 'Failed to parse open-source brief JSON', { repoName });
    throw new AppError('Brief generation returned malformed data.', 503, 'AI_SERVICE_ERROR');
  }

  // There used to be a fallback here that returned a generic paragraph about
  // looking for "good first issue" labels. It was indistinguishable from a real
  // plan, so a student could be handed boilerplate believing it had been
  // written for their repository. Failing honestly is better than that: the
  // route surfaces a 503 and the student can try again.
  const parsed = openSourceBriefSchema.safeParse({
    ...(raw as Record<string, unknown>),
    repoUrl,
    repoName,
  });
  if (!parsed.success) {
    logger.error('openaiService', 'Open-source brief did not match the brief contract', {
      repoName,
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    throw new AppError('Brief generation returned incomplete data.', 503, 'AI_SERVICE_ERROR');
  }

  return parsed.data;
}
