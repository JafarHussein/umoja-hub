/**
 * Portfolio tier and strength calculator.
 * File: src/lib/trust/portfolioTierer.ts
 * Spec: BUSINESS_LOGIC.md §2
 *
 * Trigger: Called after every VERIFIED lecturer decision.
 * Never called on GET requests.
 */

import { StudentTier, PortfolioStrength } from '@/types';
import type { IVerifiedProject, IStudentPortfolioStatus } from '@/types/education';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

// ---------------------------------------------------------------------------
// calculateTier
// ---------------------------------------------------------------------------

/**
 * Determines the student's current tier from their verified projects.
 *
 * Unlock rules (BUSINESS_LOGIC.md §2.1):
 *   INTERMEDIATE — 2× verified BEGINNER projects with average score ≥ 3.5
 *   ADVANCED     — 2× verified INTERMEDIATE projects with average score ≥ 4.0
 */
export function calculateTier(verifiedProjects: IVerifiedProject[]): StudentTier {
  const beginnerProjects = verifiedProjects.filter((p) => p.tier === StudentTier.BEGINNER);
  const intermediateProjects = verifiedProjects.filter(
    (p) => p.tier === StudentTier.INTERMEDIATE
  );

  const avgBeginnerScore = average(beginnerProjects.map((p) => p.averageScore));
  const avgIntermediateScore = average(intermediateProjects.map((p) => p.averageScore));

  if (intermediateProjects.length >= 2 && avgIntermediateScore >= 4.0) {
    return StudentTier.ADVANCED;
  }
  if (beginnerProjects.length >= 2 && avgBeginnerScore >= 3.5) {
    return StudentTier.INTERMEDIATE;
  }
  return StudentTier.BEGINNER;
}

// ---------------------------------------------------------------------------
// calculatePortfolioStrength
// ---------------------------------------------------------------------------

/**
 * Determines the portfolio strength label based on tier, project count, and average score.
 * Spec: BUSINESS_LOGIC.md §2.2
 */
export function calculatePortfolioStrength(portfolio: IStudentPortfolioStatus): PortfolioStrength {
  const { currentTier, stats, verifiedProjects } = portfolio;
  const avgScore = average(verifiedProjects.map((p) => p.averageScore));
  const count = stats.verifiedProjectCount;

  if (currentTier === StudentTier.ADVANCED && count >= 2 && avgScore >= 4.5) {
    return PortfolioStrength.EXCEPTIONAL;
  }
  if (
    currentTier === StudentTier.ADVANCED ||
    (currentTier === StudentTier.INTERMEDIATE && count >= 3)
  ) {
    return PortfolioStrength.STRONG;
  }
  if (currentTier === StudentTier.INTERMEDIATE || count >= 2) {
    return PortfolioStrength.DEVELOPING;
  }
  return PortfolioStrength.BUILDING;
}

// ---------------------------------------------------------------------------
// Skill extraction
// ---------------------------------------------------------------------------

/**
 * Category map for skill classification (BUSINESS_LOGIC.md §2.3).
 */
const CATEGORY_MAP: Record<string, string> = {
  JavaScript: 'Frontend',
  TypeScript: 'Frontend',
  React: 'Frontend',
  'Next.js': 'Frontend',
  CSS: 'Frontend',
  'Tailwind CSS': 'Frontend',
  HTML: 'Frontend',
  'Node.js': 'Backend',
  Express: 'Backend',
  Python: 'Backend',
  FastAPI: 'Backend',
  Django: 'Backend',
  MongoDB: 'Database',
  PostgreSQL: 'Database',
  Firebase: 'Database',
  MySQL: 'Database',
  'React Native': 'Mobile',
  Flutter: 'Mobile',
  'M-Pesa': 'Payments & Integrations',
  Daraja: 'Payments & Integrations',
  'REST API': 'Architecture',
  Git: 'Tooling',
  Docker: 'Tooling',
  Redis: 'Database',
};

function categoryFor(skill: string): string {
  return CATEGORY_MAP[skill] ?? 'General';
}

interface SkillExtractionInput {
  suggestedTechStack: string[];
  githubLanguages: string[];
}

interface ExtractedSkill {
  skillName: string;
  category: string;
  confirmedViaGithub: boolean;
}

/**
 * Extract skills from a verified project.
 * Rules (BUSINESS_LOGIC.md §2.3):
 *   - Skills in BOTH brief and GitHub → confirmed
 *   - Skills in brief only → declared (not GitHub-confirmed)
 *   - Skills in GitHub only → NOT included (must be in brief scope)
 */
export function extractSkills(input: SkillExtractionInput): ExtractedSkill[] {
  const githubSet = new Set(input.githubLanguages);

  // Include all brief skills; mark confirmed if also detected in GitHub
  return input.suggestedTechStack.map((skill) => ({
    skillName: skill,
    category: categoryFor(skill),
    confirmedViaGithub: githubSet.has(skill),
  }));
}
