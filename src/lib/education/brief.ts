import { z } from 'zod';
import { ProjectTrack } from '@/types';

// ---------------------------------------------------------------------------
// The canonical shape of a project brief.
//
// There was no canonical shape before this file, and that is precisely how the
// student workspace came to crash on every seeded project. Three places each
// held their own idea of what a brief was: the OpenAI service returned one
// shape, the demo seeder wrote another, and the page rendered a third — reading
// `brief.estimatedComplexity.toLowerCase()` on an object that had never carried
// that field. `ProjectEngagement.brief` is a Mixed column, so nothing objected
// until a student opened their own project.
//
// One schema now governs all four boundaries: what the model is asked to
// produce, what the seeder writes, what is persisted, and what the UI reads.
//
// The schema alone is not enough, because a brief written months ago cannot be
// made to conform retroactively. `normalizeBrief` therefore renders *any*
// stored value into a shape the UI can display — degraded and clearly labelled
// when fields are absent, never thrown. A page must not crash because one
// optional field is missing from one old record.
// ---------------------------------------------------------------------------

export const BRIEF_COMPLEXITY = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type BriefComplexity = (typeof BRIEF_COMPLEXITY)[number];

/** A brief written for a project the student builds from nothing. */
export const aiBriefSchema = z.object({
  title: z.string().trim().min(1),
  clientPersona: z.object({
    businessType: z.string().trim().min(1),
    county: z.string().trim().min(1),
    context: z.string().trim().min(1),
  }),
  problemStatement: z.string().trim().min(1),
  coreRequirements: z.array(z.string().trim().min(1)).min(1),
  technicalConstraints: z.array(z.string().trim().min(1)).default([]),
  kenyanContextConstraints: z.array(z.string().trim().min(1)).default([]),
  deliverables: z.array(z.string().trim().min(1)).default([]),
  suggestedTechStack: z.array(z.string().trim().min(1)).default([]),
  estimatedComplexity: z.enum(BRIEF_COMPLEXITY),
});

/** A brief for contributing to a repository that already exists. */
export const openSourceBriefSchema = z.object({
  title: z.string().trim().min(1),
  repoUrl: z.string().trim().min(1),
  repoName: z.string().trim().min(1),
  contributionGoal: z.string().trim().min(1),
  proposedApproach: z.string().trim().min(1),
});

export type AIBrief = z.infer<typeof aiBriefSchema>;
export type OpenSourceBrief = z.infer<typeof openSourceBriefSchema>;

export function briefSchemaFor(track: ProjectTrack): z.ZodTypeAny {
  return track === ProjectTrack.OPEN_SOURCE ? openSourceBriefSchema : aiBriefSchema;
}

/** True when `value` is a well-formed brief for the given track. */
export function isValidBrief(track: ProjectTrack, value: unknown): boolean {
  return briefSchemaFor(track).safeParse(value).success;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export interface BriefFact {
  label: string;
  value: string;
}

export interface BriefSection {
  heading: string;
  items: string[];
}

export interface NormalizedBrief {
  /** Which shape was recognised. `unrecognised` still renders. */
  kind: 'ai' | 'open-source' | 'unrecognised';
  title: string;
  summary: string;
  facts: BriefFact[];
  sections: BriefSection[];
  complexity: BriefComplexity | null;
  /** True when the stored brief did not fully match the current contract. */
  degraded: boolean;
}

function asString(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((s) => s.length > 0);
}

function section(heading: string, items: string[]): BriefSection[] {
  return items.length > 0 ? [{ heading, items }] : [];
}

/**
 * Turn whatever is stored on the engagement into something renderable.
 *
 * Never throws, never returns undefined fields, and reports whether it had to
 * fall back. A brief that predates the contract shows what it does have and is
 * marked degraded, so the gap is visible to the student rather than fatal.
 */
export function normalizeBrief(track: string | undefined, raw: unknown): NormalizedBrief {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const isOpenSource = track === ProjectTrack.OPEN_SOURCE;

  if (isOpenSource) {
    const parsed = openSourceBriefSchema.safeParse(value);
    if (parsed.success) {
      const b = parsed.data;
      return {
        kind: 'open-source',
        title: b.title,
        summary: b.contributionGoal,
        facts: [
          { label: 'Repository', value: b.repoName },
          { label: 'Source', value: b.repoUrl },
        ],
        sections: [{ heading: 'Proposed approach', items: [b.proposedApproach] }],
        complexity: null,
        degraded: false,
      };
    }

    const repoName = asString(value.repoName) || asString(value.repo);
    const repoUrl = asString(value.repoUrl);
    return {
      kind: 'unrecognised',
      title: asString(value.title) || 'Open-source contribution',
      summary: asString(value.contributionGoal),
      facts: [
        ...(repoName ? [{ label: 'Repository', value: repoName }] : []),
        ...(repoUrl ? [{ label: 'Source', value: repoUrl }] : []),
      ],
      sections: section('Proposed approach', [asString(value.proposedApproach)].filter(Boolean)),
      complexity: null,
      degraded: true,
    };
  }

  const parsed = aiBriefSchema.safeParse(value);
  if (parsed.success) {
    const b = parsed.data;
    return {
      kind: 'ai',
      title: b.title,
      summary: b.problemStatement,
      facts: [
        { label: 'Client', value: `${b.clientPersona.businessType} · ${b.clientPersona.county}` },
        { label: 'Situation', value: b.clientPersona.context },
      ],
      sections: [
        { heading: 'Core requirements', items: b.coreRequirements },
        ...section('Technical constraints', b.technicalConstraints),
        ...section('Kenyan context', b.kenyanContextConstraints),
        ...section('Deliverables', b.deliverables),
        ...section('Suggested stack', b.suggestedTechStack),
      ],
      complexity: b.estimatedComplexity,
      degraded: false,
    };
  }

  // Degraded path — read whatever is genuinely there. `clientPersona` was a
  // plain string in older records, so it is accepted in both shapes.
  const persona = value.clientPersona;
  const personaText =
    typeof persona === 'string'
      ? persona
      : persona && typeof persona === 'object'
        ? [
            asString((persona as Record<string, unknown>).businessType),
            asString((persona as Record<string, unknown>).county),
          ]
            .filter(Boolean)
            .join(' · ')
        : '';

  const complexityRaw = asString(value.estimatedComplexity).toUpperCase();
  const complexity = (BRIEF_COMPLEXITY as readonly string[]).includes(complexityRaw)
    ? (complexityRaw as BriefComplexity)
    : null;

  return {
    kind: 'unrecognised',
    title: asString(value.title) || 'Project brief',
    summary: asString(value.problemStatement),
    facts: personaText ? [{ label: 'Client', value: personaText }] : [],
    sections: [
      // `constraints` is the older field name; both are surfaced.
      ...section('Core requirements', asStringArray(value.coreRequirements)),
      ...section(
        'Constraints',
        asStringArray(value.technicalConstraints).concat(asStringArray(value.constraints))
      ),
      ...section('Kenyan context', asStringArray(value.kenyanContextConstraints)),
      ...section('Deliverables', asStringArray(value.deliverables)),
      ...section('Suggested stack', asStringArray(value.suggestedTechStack)),
    ],
    complexity,
    degraded: true,
  };
}
