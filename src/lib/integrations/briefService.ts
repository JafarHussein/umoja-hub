/**
 * OpenAI service for Education Hub brief generation.
 * Uses plain fetch — consistent with darajaService.ts pattern.
 * Only called during ProjectEngagement creation (POST /api/education/engagements).
 */

import { env } from '@/lib/env';
import { AppError, logger } from '@/lib/utils';
import { aiBriefSchema, openSourceBriefSchema } from '@/lib/education/brief';
import type { AIBrief, OpenSourceBrief } from '@/lib/education/brief';
import { academicContextPrompt } from '@/lib/education/academicContext';
import type { AcademicContext } from '@/lib/education/academicContext';

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

export interface AIBriefRequest {
  /** What the student is studying now. The project exists to exercise it. */
  academic: AcademicContext;
  /**
   * The student's engineering interest. A filter, never the driver: the units
   * decide what must be exercised, the interest decides which of several valid
   * projects they get. Letting interest drive would recreate the self-selection
   * of easy work that retiring the difficulty tier was meant to end.
   */
  interest?: string | undefined;
  industry?: BriefContextInput | undefined;
}

export async function generateAIBrief(request: AIBriefRequest): Promise<GeneratedAIBrief> {
  const { academic, interest, industry } = request;

  const industryBlock = industry
    ? `Industry: ${industry.industryName}.
Problem domains: ${industry.problemDomains.join(', ')}.
Kenyan constraints to embed: ${industry.kenyanConstraints.join(', ')}.
Example client types: ${industry.clientPersonaTemplate.businessTypes.slice(0, 3).join(', ')}.
Example counties: ${industry.clientPersonaTemplate.counties.slice(0, 3).join(', ')}.`
    : 'Choose any Kenyan small-business or public-sector industry.';

  const interestBlock = interest
    ? `The student's engineering interest is ${interest}. Use it to choose BETWEEN valid projects
and to shape the parts that are free — never to replace what the units require. A student who
loves AI and is studying Operating Systems gets an OS-heavy project with a learning workload on
top, not a machine-learning project with a nod to processes.`
    : 'No engineering interest is on record. Choose the most representative valid project.';

  const systemPrompt = `You write project briefs for Kenyan computer science and IT undergraduates.
A brief describes ONE piece of real software the student builds and a lecturer reviews as an
engineer would. It must force the student to practise what they are being taught this semester —
if the project could be completed without exercising the knowledge areas below, it is the wrong
brief. Ground everything in the Kenyan context: mobile-first, M-Pesa common, intermittent
connectivity, bilingual Swahili and English, real counties and real kinds of business.
Always respond with a single valid JSON object — no markdown, no extra text.`;

  const userPrompt = `${academicContextPrompt(academic)}

${interestBlock}

${industryBlock}

Respond with exactly this JSON schema:
{
  "title": "string — concise project name",
  "learningOutcomes": ["string — 3 to 5 statements of what building this must make the student able to do, each tied to one of the knowledge areas above and phrased as a capability, not a feature"],
  "architecturalChallenge": "string — 2-3 sentences naming the pressure that makes those knowledge areas load-bearing here, and what breaks if the student ignores it",
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
}

"estimatedComplexity" is your assessment of the work you have described. It is not a dial and
nobody chose it — the year of study and the units decide how demanding the project is.`;

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

  // The anchor is recorded from the enrolment, not asked of the model: what the
  // student is studying is a fact the platform holds, and a language model
  // repeating it back is a chance for it to be repeated back wrong.
  const anchored = {
    ...(raw as Record<string, unknown>),
    academicAnchor: {
      programmeName: academic.programmeName,
      year: academic.currentYear,
      semester: academic.currentSemester,
      units: academic.currentUnits.map((u) => (u.code ? `${u.code} ${u.title}` : u.title)),
      knowledgeAreas: academic.knowledgeAreas,
      provenance: academic.provenanceLabel,
    },
  };

  // Validated against the same schema the seeder writes and the workspace
  // renders. A model response that does not conform is rejected here rather
  // than persisted into a Mixed column for the UI to fall over later.
  const parsed = aiBriefSchema.safeParse(anchored);
  if (!parsed.success) {
    logger.error('openaiService', 'AI brief did not match the brief contract', {
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    throw new AppError('Brief generation returned incomplete data.', 503, 'AI_SERVICE_ERROR');
  }

  logger.info('openaiService', 'AI brief generated', {
    knowledgeAreas: academic.knowledgeAreas.slice(0, 3),
    industry: industry?.industryName,
  });
  return parsed.data;
}

// ---------------------------------------------------------------------------
// OPEN_SOURCE track — contribution plan generation
// Non-throwing fallback: if OpenAI fails, return a minimal but valid brief.
// ---------------------------------------------------------------------------

export async function generateOpenSourceBrief(
  repoUrl: string,
  repoName: string,
  academic: AcademicContext
): Promise<GeneratedOpenSourceBrief> {
  const systemPrompt = `You are a software contribution advisor for Kenyan computer science and IT
undergraduates. You write concise, actionable open-source contribution plans that make the student
practise what they are being taught this semester — a contribution that exercises none of their
coursework is the wrong contribution to point them at.
Always respond with a single valid JSON object — no markdown, no extra text.`;

  const userPrompt = `A student wants to contribute to: ${repoUrl} (${repoName}).

${academicContextPrompt(academic, 2)}

Write a realistic contribution plan that lands in the part of that repository where the knowledge
areas above are load-bearing. Respond with exactly this JSON schema:
{
  "title": "string — a short name for the contribution",
  "contributionGoal": "string — 1-2 sentences on what kind of contribution to make, naming which of the knowledge areas above it exercises",
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
    academicAnchor: {
      programmeName: academic.programmeName,
      year: academic.currentYear,
      semester: academic.currentSemester,
      units: academic.currentUnits.map((u) => (u.code ? `${u.code} ${u.title}` : u.title)),
      knowledgeAreas: academic.knowledgeAreas,
      provenance: academic.provenanceLabel,
    },
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
