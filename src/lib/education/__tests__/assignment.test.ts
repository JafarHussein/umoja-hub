/**
 * @jest-environment node
 */

import {
  AcademicDiscipline,
  AcademicProvenance,
  AssignmentAudience,
  AssignmentStatus,
  KnowledgeArea,
} from '@/types';
import { assignmentToBrief, isEligible, overlappingAreas } from '../assignment';
import type { AssignmentRecord } from '../assignment';
import { assignedBriefSchema, normalizeBrief } from '../brief';
import { projectAssignmentSchema } from '@/lib/validation/educationSchema';
import type { AcademicContext } from '../academicContext';

const ACADEMIC: AcademicContext = {
  programmeName: 'BSc Computer Science',
  discipline: AcademicDiscipline.CS,
  currentYear: 2,
  currentSemester: 1,
  currentUnits: [
    {
      code: 'SCS 231',
      title: 'Database Systems I',
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
      areaLabels: ['Database Systems'],
    },
  ],
  knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
  provenance: AcademicProvenance.INSTITUTION_CURRICULUM,
  provenanceLabel: 'From your institution’s published curriculum',
  provenanceRecordedAt: new Date('2026-02-01T00:00:00Z'),
};

const ASSIGNMENT: AssignmentRecord = {
  _id: 'assign-1',
  lecturerId: 'lect-1',
  institutionId: 'inst-1',
  title: 'Offline-first attendance register',
  problemStatement: 'Attendance is recorded on paper and copied in weekly.',
  coreRequirements: ['Record attendance offline', 'Reconcile two devices'],
  deliverables: ['A deployed system'],
  technicalConstraints: ['Usable for a full day with no connection'],
  knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS, KnowledgeArea.MOBILE_DEVELOPMENT],
  targetYear: 2,
  targetSemester: 1,
  audience: AssignmentAudience.COHORT,
  assignedStudentIds: [],
  status: AssignmentStatus.OPEN,
};

const STUDENT = { studentId: 'stu-1', institutionId: 'inst-1', academic: ACADEMIC };

describe('isEligible', () => {
  it('offers an open cohort project to a student in the right semester', () => {
    expect(isEligible(ASSIGNMENT, STUDENT)).toBe(true);
  });

  it('withholds a draft and a closed project from everybody', () => {
    for (const status of [AssignmentStatus.DRAFT, AssignmentStatus.CLOSED]) {
      expect(isEligible({ ...ASSIGNMENT, status }, STUDENT)).toBe(false);
    }
  });

  it('never crosses institutions', () => {
    expect(isEligible({ ...ASSIGNMENT, institutionId: 'inst-2' }, STUDENT)).toBe(false);
  });

  it('withholds it from another year or semester', () => {
    expect(isEligible({ ...ASSIGNMENT, targetYear: 3 }, STUDENT)).toBe(false);
    expect(isEligible({ ...ASSIGNMENT, targetSemester: 2 }, STUDENT)).toBe(false);
  });

  it('withholds a cohort project from a student with no coursework on record', () => {
    expect(isEligible(ASSIGNMENT, { ...STUDENT, academic: null })).toBe(false);
  });

  it('withholds it from a student with no institution', () => {
    expect(isEligible(ASSIGNMENT, { ...STUDENT, institutionId: undefined })).toBe(false);
  });

  // A lecturer naming a student is the strongest signal there is, and no
  // year, semester or institution check may overrule it.
  it('always offers a named student their project', () => {
    const named: AssignmentRecord = {
      ...ASSIGNMENT,
      audience: AssignmentAudience.NAMED,
      assignedStudentIds: ['stu-1'],
      targetYear: 4,
      targetSemester: 2,
      institutionId: 'inst-9',
    };
    expect(isEligible(named, { ...STUDENT, academic: null })).toBe(true);
  });

  it('hides a named project from everybody it does not name', () => {
    const named: AssignmentRecord = {
      ...ASSIGNMENT,
      audience: AssignmentAudience.NAMED,
      assignedStudentIds: ['someone-else'],
    };
    // Same institution, same semester — it must still not fall through to the
    // cohort rules, or work meant for two people is quietly published.
    expect(isEligible(named, STUDENT)).toBe(false);
  });
});

describe('overlappingAreas', () => {
  it('reports what the student is actually studying of it', () => {
    expect(overlappingAreas(ASSIGNMENT, ACADEMIC)).toEqual([KnowledgeArea.DATABASE_SYSTEMS]);
  });

  it('reports nothing rather than guessing when there is no overlap', () => {
    const far = { ...ASSIGNMENT, knowledgeAreas: [KnowledgeArea.RESEARCH_METHODS] };
    expect(overlappingAreas(far, ACADEMIC)).toEqual([]);
  });

  it('ignores an area outside the taxonomy', () => {
    const odd = { ...ASSIGNMENT, knowledgeAreas: ['QUANTUM_ALCHEMY'] };
    expect(overlappingAreas(odd, ACADEMIC)).toEqual([]);
  });
});

describe('assignmentToBrief', () => {
  const brief = assignmentToBrief(ASSIGNMENT, ACADEMIC, 'Dr. Grace Ndungu');

  it('produces a brief that satisfies the contract', () => {
    expect(assignedBriefSchema.safeParse(brief).success).toBe(true);
  });

  it('keeps the lecturer’s own words', () => {
    expect(brief.title).toBe('Offline-first attendance register');
    expect(brief.problemStatement).toBe(ASSIGNMENT.problemStatement);
    expect(brief.coreRequirements).toEqual(ASSIGNMENT.coreRequirements);
  });

  it('anchors it to the student’s coursework, exactly as a generated brief is', () => {
    expect(brief.academicAnchor.units).toEqual(['SCS 231 Database Systems I']);
    expect(brief.academicAnchor.provenance).toBe('From your institution’s published curriculum');
  });

  it('names who set it', () => {
    expect(brief.setBy).toBe('Dr. Grace Ndungu');
  });

  it('renders with the lecturer leading and without degrading', () => {
    const view = normalizeBrief('LECTURER_ASSIGNED', brief);
    expect(view.kind).toBe('assigned');
    expect(view.degraded).toBe(false);
    expect(view.facts[0]).toEqual({ label: 'Set by', value: 'Dr. Grace Ndungu' });
    expect(view.sections.map((s) => s.heading)).toContain('What this must exercise');
  });

  it('renders a brief written before the contract instead of throwing', () => {
    const view = normalizeBrief('LECTURER_ASSIGNED', { title: 'An older one' });
    expect(view.degraded).toBe(true);
    expect(view.title).toBe('An older one');
  });
});

describe('projectAssignmentSchema', () => {
  const VALID = {
    title: 'Offline-first attendance register',
    problemStatement:
      'Attendance is recorded on paper and copied into a spreadsheet at the end of each week.',
    coreRequirements: ['Record attendance offline'],
    deliverables: [],
    technicalConstraints: [],
    knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
    targetYear: 2,
    targetSemester: 1,
    audience: AssignmentAudience.COHORT,
    assignedStudentIds: [],
    status: AssignmentStatus.OPEN,
  };

  it('accepts a well-formed project', () => {
    expect(projectAssignmentSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects a project that says nothing about the problem', () => {
    expect(
      projectAssignmentSchema.safeParse({ ...VALID, problemStatement: 'Build a thing.' }).success
    ).toBe(false);
  });

  it('rejects a project with nothing to build', () => {
    expect(projectAssignmentSchema.safeParse({ ...VALID, coreRequirements: [] }).success).toBe(
      false
    );
  });

  it('rejects a project that exercises nothing', () => {
    expect(projectAssignmentSchema.safeParse({ ...VALID, knowledgeAreas: [] }).success).toBe(false);
  });

  it('rejects more subjects than one project can carry', () => {
    const seven = [
      KnowledgeArea.DATABASE_SYSTEMS,
      KnowledgeArea.NETWORKING,
      KnowledgeArea.OPERATING_SYSTEMS,
      KnowledgeArea.WEB_DEVELOPMENT,
      KnowledgeArea.MOBILE_DEVELOPMENT,
      KnowledgeArea.CLOUD_COMPUTING,
      KnowledgeArea.MACHINE_LEARNING,
    ];
    expect(projectAssignmentSchema.safeParse({ ...VALID, knowledgeAreas: seven }).success).toBe(
      false
    );
  });

  it('rejects a student id that is not an identifier', () => {
    expect(
      projectAssignmentSchema.safeParse({ ...VALID, assignedStudentIds: ['nope'] }).success
    ).toBe(false);
  });

  it('accepts a capacity and rejects a capacity of zero', () => {
    expect(projectAssignmentSchema.safeParse({ ...VALID, capacity: 5 }).success).toBe(true);
    expect(projectAssignmentSchema.safeParse({ ...VALID, capacity: 0 }).success).toBe(false);
  });
});
