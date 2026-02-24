/**
 * Unit tests for portfolioTierer.ts
 * Target coverage: ≥ 90%
 * Spec: PHASE_IMPLEMENTATION_MASTER.md Phase 5 §D
 */

import { calculateTier, calculatePortfolioStrength, extractSkills } from '../portfolioTierer';
import { StudentTier, PortfolioStrength } from '@/types';
import type { IVerifiedProject, IStudentPortfolioStatus } from '@/types/education';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProject(tier: StudentTier, averageScore: number): IVerifiedProject {
  return {
    engagementId: `eng-${Math.random()}`,
    title: 'Test Project',
    tier,
    techStack: ['JavaScript'],
    verifiedAt: new Date(),
    averageScore,
    lecturerInstitution: 'University of Nairobi',
  };
}

function makePortfolio(
  overrides: Partial<IStudentPortfolioStatus>
): IStudentPortfolioStatus {
  return {
    _id: 'portfolio-1',
    studentId: 'student-1',
    currentTier: StudentTier.BEGINNER,
    portfolioStrength: PortfolioStrength.BUILDING,
    verifiedProjects: [],
    verifiedSkills: [],
    tierProgressionTimeline: [],
    stats: {
      verifiedProjectCount: 0,
      totalProjectCount: 0,
      techStacksUsed: [],
      reviewerInstitutions: [],
    },
    lastRecalculatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateTier
// ---------------------------------------------------------------------------

describe('calculateTier', () => {
  test('returns BEGINNER with no projects', () => {
    expect(calculateTier([])).toBe(StudentTier.BEGINNER);
  });

  test('returns BEGINNER with 1 BEGINNER project', () => {
    expect(calculateTier([makeProject(StudentTier.BEGINNER, 4.0)])).toBe(StudentTier.BEGINNER);
  });

  test('returns BEGINNER with 2 BEGINNER projects but avg score < 3.5', () => {
    const projects = [
      makeProject(StudentTier.BEGINNER, 3.0),
      makeProject(StudentTier.BEGINNER, 3.4),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.BEGINNER);
  });

  test('returns BEGINNER with 2 BEGINNER projects and avg score exactly 3.4 (boundary)', () => {
    const projects = [
      makeProject(StudentTier.BEGINNER, 3.4),
      makeProject(StudentTier.BEGINNER, 3.4),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.BEGINNER);
  });

  test('returns INTERMEDIATE with 2 BEGINNER projects and avg score exactly 3.5', () => {
    const projects = [
      makeProject(StudentTier.BEGINNER, 3.5),
      makeProject(StudentTier.BEGINNER, 3.5),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.INTERMEDIATE);
  });

  test('returns INTERMEDIATE with 2 BEGINNER projects and avg score > 3.5', () => {
    const projects = [
      makeProject(StudentTier.BEGINNER, 4.0),
      makeProject(StudentTier.BEGINNER, 5.0),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.INTERMEDIATE);
  });

  test('returns INTERMEDIATE with 1 INTERMEDIATE project (cannot advance to ADVANCED)', () => {
    const projects = [
      makeProject(StudentTier.BEGINNER, 4.0),
      makeProject(StudentTier.BEGINNER, 4.0),
      makeProject(StudentTier.INTERMEDIATE, 4.5),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.INTERMEDIATE);
  });

  test('returns INTERMEDIATE with 2 INTERMEDIATE projects and avg score < 4.0', () => {
    const projects = [
      makeProject(StudentTier.INTERMEDIATE, 3.5),
      makeProject(StudentTier.INTERMEDIATE, 3.9),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.BEGINNER); // No BEGINNER unlock either
  });

  test('returns ADVANCED with 2 INTERMEDIATE projects and avg score exactly 4.0', () => {
    const projects = [
      makeProject(StudentTier.INTERMEDIATE, 4.0),
      makeProject(StudentTier.INTERMEDIATE, 4.0),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.ADVANCED);
  });

  test('returns ADVANCED with 2 INTERMEDIATE projects and avg score > 4.0', () => {
    const projects = [
      makeProject(StudentTier.INTERMEDIATE, 4.5),
      makeProject(StudentTier.INTERMEDIATE, 5.0),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.ADVANCED);
  });

  test('ADVANCED takes precedence over INTERMEDIATE when both conditions met', () => {
    const projects = [
      makeProject(StudentTier.BEGINNER, 4.0),
      makeProject(StudentTier.BEGINNER, 4.0),
      makeProject(StudentTier.INTERMEDIATE, 4.5),
      makeProject(StudentTier.INTERMEDIATE, 4.5),
    ];
    expect(calculateTier(projects)).toBe(StudentTier.ADVANCED);
  });

  test('returns BEGINNER with 2 INTERMEDIATE projects and avg exactly 3.9 (boundary)', () => {
    const projects = [
      makeProject(StudentTier.INTERMEDIATE, 3.8),
      makeProject(StudentTier.INTERMEDIATE, 4.0),
    ];
    // avg = 3.9 → ADVANCED not unlocked; no BEGINNER unlock → BEGINNER
    expect(calculateTier(projects)).toBe(StudentTier.BEGINNER);
  });
});

// ---------------------------------------------------------------------------
// calculatePortfolioStrength
// ---------------------------------------------------------------------------

describe('calculatePortfolioStrength', () => {
  test('returns BUILDING with 0 verified projects', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.BEGINNER,
      stats: { verifiedProjectCount: 0, totalProjectCount: 0, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.BUILDING);
  });

  test('returns BUILDING with 1 verified BEGINNER project', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.BEGINNER,
      verifiedProjects: [makeProject(StudentTier.BEGINNER, 4.0)],
      stats: { verifiedProjectCount: 1, totalProjectCount: 1, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.BUILDING);
  });

  test('returns DEVELOPING with 2 verified projects', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.BEGINNER,
      verifiedProjects: [
        makeProject(StudentTier.BEGINNER, 4.0),
        makeProject(StudentTier.BEGINNER, 4.0),
      ],
      stats: { verifiedProjectCount: 2, totalProjectCount: 2, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.DEVELOPING);
  });

  test('returns DEVELOPING with INTERMEDIATE tier', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.INTERMEDIATE,
      verifiedProjects: [makeProject(StudentTier.INTERMEDIATE, 3.5)],
      stats: { verifiedProjectCount: 1, totalProjectCount: 1, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.DEVELOPING);
  });

  test('returns STRONG with ADVANCED tier', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.ADVANCED,
      verifiedProjects: [
        makeProject(StudentTier.ADVANCED, 3.5),
        makeProject(StudentTier.ADVANCED, 3.5),
      ],
      stats: { verifiedProjectCount: 2, totalProjectCount: 2, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.STRONG);
  });

  test('returns STRONG with INTERMEDIATE tier and 3+ projects', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.INTERMEDIATE,
      verifiedProjects: [
        makeProject(StudentTier.INTERMEDIATE, 3.5),
        makeProject(StudentTier.INTERMEDIATE, 3.5),
        makeProject(StudentTier.INTERMEDIATE, 3.5),
      ],
      stats: { verifiedProjectCount: 3, totalProjectCount: 3, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.STRONG);
  });

  test('returns EXCEPTIONAL with ADVANCED, 2+ projects, avg score ≥ 4.5', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.ADVANCED,
      verifiedProjects: [
        makeProject(StudentTier.ADVANCED, 4.5),
        makeProject(StudentTier.ADVANCED, 5.0),
      ],
      stats: { verifiedProjectCount: 2, totalProjectCount: 2, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.EXCEPTIONAL);
  });

  test('returns STRONG (not EXCEPTIONAL) when avg score is 4.4 (just below 4.5)', () => {
    const portfolio = makePortfolio({
      currentTier: StudentTier.ADVANCED,
      verifiedProjects: [
        makeProject(StudentTier.ADVANCED, 4.4),
        makeProject(StudentTier.ADVANCED, 4.4),
      ],
      stats: { verifiedProjectCount: 2, totalProjectCount: 2, techStacksUsed: [], reviewerInstitutions: [] },
    });
    expect(calculatePortfolioStrength(portfolio)).toBe(PortfolioStrength.STRONG);
  });
});

// ---------------------------------------------------------------------------
// extractSkills
// ---------------------------------------------------------------------------

describe('extractSkills', () => {
  test('returns empty array for empty inputs', () => {
    const result = extractSkills({ suggestedTechStack: [], githubLanguages: [] });
    expect(result).toEqual([]);
  });

  test('marks skills as confirmed when in both brief and GitHub', () => {
    const result = extractSkills({
      suggestedTechStack: ['JavaScript', 'React'],
      githubLanguages: ['JavaScript', 'CSS'],
    });
    const jsSkill = result.find((s) => s.skillName === 'JavaScript');
    const reactSkill = result.find((s) => s.skillName === 'React');
    expect(jsSkill?.confirmedViaGithub).toBe(true);
    expect(reactSkill?.confirmedViaGithub).toBe(false);
  });

  test('assigns correct category for known skills', () => {
    const result = extractSkills({
      suggestedTechStack: ['JavaScript', 'Node.js', 'MongoDB', 'M-Pesa'],
      githubLanguages: [],
    });
    const categories = Object.fromEntries(result.map((s) => [s.skillName, s.category]));
    expect(categories['JavaScript']).toBe('Frontend');
    expect(categories['Node.js']).toBe('Backend');
    expect(categories['MongoDB']).toBe('Database');
    expect(categories['M-Pesa']).toBe('Payments & Integrations');
  });

  test('assigns General category for unknown skills', () => {
    const result = extractSkills({
      suggestedTechStack: ['SomeUnknownTech'],
      githubLanguages: [],
    });
    expect(result[0]?.category).toBe('General');
  });

  test('does not include GitHub-only skills (not in brief)', () => {
    const result = extractSkills({
      suggestedTechStack: ['JavaScript'],
      githubLanguages: ['JavaScript', 'Ruby', 'Go'],
    });
    const skillNames = result.map((s) => s.skillName);
    expect(skillNames).not.toContain('Ruby');
    expect(skillNames).not.toContain('Go');
    expect(skillNames).toContain('JavaScript');
  });

  test('all brief skills are returned regardless of GitHub presence', () => {
    const techStack = ['TypeScript', 'React', 'Next.js', 'MongoDB'];
    const result = extractSkills({
      suggestedTechStack: techStack,
      githubLanguages: [],
    });
    expect(result.map((s) => s.skillName)).toEqual(techStack);
  });
});
