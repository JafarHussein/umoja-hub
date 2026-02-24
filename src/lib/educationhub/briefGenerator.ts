/**
 * AI Brief generation prompt builder.
 * File: src/lib/educationhub/briefGenerator.ts
 * Spec: BUSINESS_LOGIC.md §5
 */

interface BriefContextItem {
  id: string;
  industryName: string;
  description: string;
  clientPersonaTemplate?: {
    businessTypes?: string[];
    counties?: string[];
    contexts?: string[];
  };
  problemDomains?: string[];
  kenyanConstraints?: string[];
  exampleProjects?: string[];
  targetTiers?: string[];
}

export function buildBriefGenerationPrompt(
  tier: string,
  interestArea: string,
  techStack: string[],
  context: BriefContextItem
): string {
  const durationMap: Record<string, number> = {
    BEGINNER: 2,
    INTERMEDIATE: 4,
    ADVANCED: 6,
  };
  const weeks = durationMap[tier] ?? 4;

  return `You are a product manager generating a structured project brief for a ${tier}-level Kenyan CS student on UmojaHub.

USE THIS INDUSTRY CONTEXT:
${JSON.stringify(context, null, 2)}

STUDENT PROFILE:
- Tier: ${tier}
- Interest area: ${interestArea}
- Preferred tech stack: ${techStack.join(', ')}

GENERATE a project brief following this EXACT JSON structure. Return ONLY the JSON — no preamble, no commentary, no markdown code fences.

{
  "projectTitle": "string — specific and descriptive, not generic",
  "clientPersona": {
    "name": "string — real Kenyan name",
    "businessType": "string",
    "county": "string — real Kenyan county",
    "technicalLiteracy": "low | medium | high",
    "context": "string — 2-3 sentences describing their situation and why they need this"
  },
  "problemStatement": "string — specific problem, not abstract. 3-4 sentences.",
  "coreRequirements": ["string", "string", "string"],
  "technicalRequirements": ["string", "string"],
  "kenyanConstraints": ["string", "string"],
  "outOfScope": ["string", "string"],
  "successCriteria": ["string", "string"],
  "suggestedTechStack": ["string", "string"],
  "estimatedDurationWeeks": ${weeks},
  "industryContext": "string — one sentence naming the industry and Kenyan relevance"
}

RULES FOR EACH FIELD:
- coreRequirements: 4-6 items
- technicalRequirements: 3-5 items appropriate for ${tier} level
- kenyanConstraints: minimum 3 — must be REAL constraints, not generic platitudes
- outOfScope: 3-5 items — things the student must NOT build
- successCriteria: 3-4 measurable criteria
- suggestedTechStack: must overlap with student's preferences where appropriate

KENYAN CONSTRAINTS must include at least one from each category:
- Connectivity: e.g., "Must function on 2G connections (GPRS/EDGE)"
- Payment: e.g., "M-Pesa STK Push as the only payment method — no card payments"
- Device: e.g., "Target device: low-end Android (2GB RAM, Android 8+)"
- Literacy: e.g., "Interface must be usable by users with low digital literacy"

The brief must feel like it was written for a real Kenyan business. No generic "e-commerce platform" or "social media app" briefs.`;
}
