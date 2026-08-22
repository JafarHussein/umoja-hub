import { normalizeBrief, isValidBrief, aiBriefSchema } from '../brief';
import { ProjectTrack } from '@/types';
import { aiBrief, openSourceBrief } from '../../../../scripts/demo/text';
import { Rng, seedFromString } from '../../../../scripts/demo/rng';

const SEED_ANCHOR = {
  programmeName: 'BSc Computer Science',
  year: 2,
  semester: 1,
  units: ['SCS 231 Database Systems I', 'SCS 232 Operating Systems I'],
  knowledgeAreas: ['DATABASE_SYSTEMS', 'OPERATING_SYSTEMS'],
  provenance: 'From your institution’s published curriculum',
};

const validAIBrief = {
  title: 'SMS market price alerts',
  academicAnchor: SEED_ANCHOR,
  learningOutcomes: ['Design a schema from the queries the system must answer.'],
  architecturalChallenge: 'Two writers can touch the same record at the same time.',
  clientPersona: {
    businessType: 'Agribusiness cooperative',
    county: 'Nakuru',
    context: 'Coordinates deliveries from 300 members.',
  },
  problemStatement: 'Members cannot see the price before they travel to market.',
  coreRequirements: ['Record member deliveries', 'Send a daily price SMS'],
  technicalConstraints: ['Must run on 3G'],
  kenyanContextConstraints: ['M-Pesa is the only payment rail'],
  deliverables: ['A deployed system'],
  suggestedTechStack: ['Node.js', 'MongoDB'],
  estimatedComplexity: 'MEDIUM',
};

describe('brief contract', () => {
  describe('isValidBrief', () => {
    it('accepts a brief that matches the AI_BRIEF contract', () => {
      expect(isValidBrief(ProjectTrack.AI_BRIEF, validAIBrief)).toBe(true);
    });

    it('rejects the shape the seeder used to write', () => {
      // clientPersona as a string, `constraints` instead of the three constraint
      // arrays, and no estimatedComplexity — the exact record that crashed the
      // workspace on every seeded project.
      expect(
        isValidBrief(ProjectTrack.AI_BRIEF, {
          title: 'Something',
          tier: 'BEGINNER',
          clientPersona: 'A Nairobi-based agribusiness',
          problemStatement: 'Build a thing.',
          constraints: ['Must work offline'],
          deliverables: ['A prototype'],
        })
      ).toBe(false);
    });

    it('rejects an open-source brief with no repository', () => {
      expect(
        isValidBrief(ProjectTrack.OPEN_SOURCE, {
          title: 'Contribute somewhere',
          contributionGoal: 'Fix a bug.',
          proposedApproach: 'Find an issue.',
        })
      ).toBe(false);
    });
  });

  describe('normalizeBrief', () => {
    it('renders a conforming AI brief without degrading', () => {
      const view = normalizeBrief(ProjectTrack.AI_BRIEF, validAIBrief);

      expect(view.kind).toBe('ai');
      expect(view.degraded).toBe(false);
      expect(view.title).toBe('SMS market price alerts');
      expect(view.complexity).toBe('MEDIUM');
      // The coursework leads, because that is what the project is for.
      expect(view.facts[0]!.label).toBe('Written from');
      expect(view.facts[0]!.value).toContain('SCS 231 Database Systems I');
      expect(view.facts[1]).toEqual({
        label: 'Coursework record',
        value: 'From your institution’s published curriculum',
      });
      expect(view.facts).toContainEqual({
        label: 'Client',
        value: 'Agribusiness cooperative · Nakuru',
      });
      expect(view.sections.map((s) => s.heading)).toContain('What this must teach you');
      expect(view.sections.map((s) => s.heading)).toContain('Core requirements');
    });

    it('renders a conforming open-source brief', () => {
      const view = normalizeBrief(ProjectTrack.OPEN_SOURCE, {
        title: 'Contribute to ushahidi/platform',
        academicAnchor: SEED_ANCHOR,
        repoUrl: 'https://github.com/ushahidi/platform',
        repoName: 'ushahidi/platform',
        contributionGoal: 'Land a reviewed change.',
        proposedApproach: 'Reproduce an open issue first.',
      });

      expect(view.kind).toBe('open-source');
      expect(view.degraded).toBe(false);
      expect(view.complexity).toBeNull();
      expect(view.summary).toBe('Land a reviewed change.');
    });

    it('renders an old-format brief instead of throwing', () => {
      const view = normalizeBrief(ProjectTrack.AI_BRIEF, {
        title: 'Digital attendance for a TVET institution',
        clientPersona: 'A county health office digitising clinic operations',
        problemStatement: 'Attendance is taken on paper.',
        constraints: ['Must work on intermittent 3G'],
        deliverables: ['A deployed, working prototype'],
      });

      expect(view.kind).toBe('unrecognised');
      expect(view.degraded).toBe(true);
      expect(view.title).toBe('Digital attendance for a TVET institution');
      expect(view.complexity).toBeNull();
      expect(view.facts).toEqual([
        { label: 'Client', value: 'A county health office digitising clinic operations' },
      ]);
      expect(view.sections.find((s) => s.heading === 'Constraints')?.items).toEqual([
        'Must work on intermittent 3G',
      ]);
    });

    it('survives a brief that is missing, null or not an object', () => {
      for (const value of [undefined, null, 'a string', 42]) {
        const view = normalizeBrief(ProjectTrack.AI_BRIEF, value);
        expect(view.degraded).toBe(true);
        expect(view.title).toBe('Project brief');
        expect(view.complexity).toBeNull();
        expect(view.sections).toEqual([]);
      }
    });
  });

  // The seeder and the app disagreed for as long as nothing compared them.
  describe('the demo seeder writes the same contract the app reads', () => {
    it('emits a valid AI brief', () => {
      const rng = new Rng(seedFromString('brief-contract-test'));
      const brief = aiBrief(rng, 'Clinic appointment booking', SEED_ANCHOR, ['Node.js']);

      expect(aiBriefSchema.safeParse(brief).success).toBe(true);
      expect(normalizeBrief(ProjectTrack.AI_BRIEF, brief).degraded).toBe(false);
    });

    it('writes the learning outcomes out of the student’s own knowledge areas', () => {
      const rng = new Rng(seedFromString('brief-contract-test'));
      const brief = aiBrief(rng, 'Clinic appointment booking', SEED_ANCHOR, ['Node.js']) as {
        learningOutcomes: string[];
        architecturalChallenge: string;
      };

      expect(brief.learningOutcomes.join(' ')).toContain('Database Systems');
      expect(brief.architecturalChallenge).toContain('Database Systems');
    });

    it('takes its complexity from the year of study, not from a choice', () => {
      const rng = new Rng(seedFromString('brief-contract-test'));
      const first = aiBrief(rng, 'A', { ...SEED_ANCHOR, year: 1 }) as { estimatedComplexity: string };
      const final = aiBrief(rng, 'B', { ...SEED_ANCHOR, year: 4 }) as { estimatedComplexity: string };

      expect(first.estimatedComplexity).toBe('LOW');
      expect(final.estimatedComplexity).toBe('HIGH');
    });

    it('emits a valid open-source brief', () => {
      const brief = openSourceBrief(
        'https://github.com/apache/fineract',
        'apache/fineract',
        SEED_ANCHOR
      );

      expect(isValidBrief(ProjectTrack.OPEN_SOURCE, brief)).toBe(true);
      expect(normalizeBrief(ProjectTrack.OPEN_SOURCE, brief).degraded).toBe(false);
    });
  });
});
