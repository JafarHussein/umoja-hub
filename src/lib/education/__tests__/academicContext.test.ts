/**
 * @jest-environment node
 */

import { AcademicDiscipline, AcademicProvenance, KnowledgeArea } from '@/types';
import {
  academicContextPrompt,
  resolveEnrolment,
  toAcademicContext,
} from '../academicContext';
import type { EnrolmentUpdateInput } from '@/lib/validation/academicSchema';

const mockProgrammeFindById = jest.fn();
jest.mock('@/lib/models/AcademicProgramme.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockProgrammeFindById(...a) },
}));

const mockUnitFind = jest.fn();
jest.mock('@/lib/models/CurriculumUnit.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockUnitFind(...a) },
}));

const ENROLMENT = {
  programmeName: 'BSc Computer Science',
  discipline: AcademicDiscipline.CS,
  currentYear: 2,
  currentSemester: 2,
  provenance: AcademicProvenance.SELF_DECLARED,
  provenanceRecordedAt: new Date('2026-01-15T00:00:00Z'),
  currentUnits: [
    {
      code: 'SCS 241',
      title: 'Database Systems II',
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS, KnowledgeArea.DATA_ENGINEERING],
    },
    {
      code: 'SCS 242',
      title: 'Operating Systems II',
      knowledgeAreas: [KnowledgeArea.OPERATING_SYSTEMS, KnowledgeArea.DATABASE_SYSTEMS],
    },
  ],
};

describe('toAcademicContext', () => {
  it('reads a stored enrolment into the view the Hub reasons with', () => {
    const context = toAcademicContext(ENROLMENT);
    expect(context).not.toBeNull();
    expect(context!.programmeName).toBe('BSc Computer Science');
    expect(context!.currentUnits).toHaveLength(2);
    expect(context!.currentUnits[0]!.areaLabels).toContain('Database Systems');
  });

  it('orders knowledge areas by how much of the semester rests on them', () => {
    // DATABASE_SYSTEMS is carried by both units; the others by one each.
    expect(toAcademicContext(ENROLMENT)!.knowledgeAreas[0]).toBe(KnowledgeArea.DATABASE_SYSTEMS);
  });

  it('states where the record came from rather than implying it', () => {
    expect(toAcademicContext(ENROLMENT)!.provenanceLabel).toBe('You told us this');
    expect(
      toAcademicContext({
        ...ENROLMENT,
        provenance: AcademicProvenance.INSTITUTION_CURRICULUM,
      })!.provenanceLabel
    ).toBe('From your institution’s published curriculum');
  });

  it('treats an unrecognised provenance as self-declared, never as confirmed', () => {
    const context = toAcademicContext({ ...ENROLMENT, provenance: 'LECTURER_SAID_SO' });
    expect(context!.provenance).toBe(AcademicProvenance.SELF_DECLARED);
  });

  it('returns null for a missing record', () => {
    expect(toAcademicContext(null)).toBeNull();
    expect(toAcademicContext(undefined)).toBeNull();
  });

  it('returns null when there are no units — there is no partial honest answer', () => {
    expect(toAcademicContext({ ...ENROLMENT, currentUnits: [] })).toBeNull();
    expect(toAcademicContext({ ...ENROLMENT, currentUnits: null })).toBeNull();
  });

  it('drops units that map onto nothing the taxonomy recognises', () => {
    const context = toAcademicContext({
      ...ENROLMENT,
      currentUnits: [
        ENROLMENT.currentUnits[0]!,
        { code: 'XX 100', title: 'Swahili', knowledgeAreas: ['SWAHILI'] },
        { code: 'XX 101', title: 'Untitled', knowledgeAreas: [] },
        { title: '', knowledgeAreas: [KnowledgeArea.NETWORKING] },
      ],
    });
    expect(context!.currentUnits).toHaveLength(1);
  });

  it('returns null when every unit is unmappable', () => {
    const context = toAcademicContext({
      ...ENROLMENT,
      currentUnits: [{ title: 'Swahili', knowledgeAreas: ['SWAHILI'] }],
    });
    expect(context).toBeNull();
  });

  it('falls back to a stated placeholder rather than an empty programme name', () => {
    const context = toAcademicContext({ ...ENROLMENT, programmeName: '   ' });
    expect(context!.programmeName).toBe('Undeclared programme');
  });

  it('defaults an unknown discipline to CS rather than inventing a faculty', () => {
    const context = toAcademicContext({ ...ENROLMENT, discipline: 'LAW' });
    expect(context!.discipline).toBe(AcademicDiscipline.CS);
    expect(
      toAcademicContext({ ...ENROLMENT, discipline: AcademicDiscipline.IT })!.discipline
    ).toBe(AcademicDiscipline.IT);
  });
});

describe('academicContextPrompt', () => {
  it('describes the leading areas in full and names every unit', () => {
    const prompt = academicContextPrompt(toAcademicContext(ENROLMENT)!, 2);
    expect(prompt).toContain('BSc Computer Science');
    expect(prompt).toContain('year 2, semester 2');
    expect(prompt).toContain('SCS 241 Database Systems II');
    expect(prompt).toContain('Does NOT count as exercising it');
  });

  it('caps how many areas are described so the brief is about something', () => {
    const prompt = academicContextPrompt(toAcademicContext(ENROLMENT)!, 1);
    expect(prompt).toContain('Database Systems —');
    expect(prompt).not.toContain('Operating Systems —');
  });
});

describe('resolveEnrolment', () => {
  const SELF_DECLARED: EnrolmentUpdateInput = {
    programmeName: 'BSc Information Technology',
    discipline: AcademicDiscipline.IT,
    currentYear: 3,
    currentSemester: 1,
    currentUnits: [
      { title: 'Cloud Infrastructure', knowledgeAreas: [KnowledgeArea.CLOUD_COMPUTING] },
    ],
    completedUnits: [],
  };

  beforeEach(() => jest.clearAllMocks());

  it('records a submission with no programme as self-declared', async () => {
    const resolved = await resolveEnrolment(SELF_DECLARED);
    expect(resolved.provenance).toBe(AcademicProvenance.SELF_DECLARED);
    expect(resolved.programmeName).toBe('BSc Information Technology');
    expect(mockProgrammeFindById).not.toHaveBeenCalled();
  });

  it('uppercases a self-declared unit code and keeps the student’s title', async () => {
    const resolved = await resolveEnrolment({
      ...SELF_DECLARED,
      currentUnits: [
        { code: 'cit 3151', title: 'Cloud', knowledgeAreas: [KnowledgeArea.CLOUD_COMPUTING] },
      ],
    });
    expect(resolved.currentUnits[0]!.code).toBe('CIT 3151');
    expect(resolved.currentUnits[0]!.title).toBe('Cloud');
  });

  it('names the programme as undeclared rather than blank', async () => {
    const { programmeName: _dropped, ...anonymous } = SELF_DECLARED;
    const resolved = await resolveEnrolment(anonymous as EnrolmentUpdateInput);
    expect(resolved.programmeName).toBe('Undeclared programme');
  });

  it('carries the student’s institution onto a self-declared record', async () => {
    const institutionId = 'inst-1' as unknown as Parameters<typeof resolveEnrolment>[1];
    const resolved = await resolveEnrolment(SELF_DECLARED, institutionId);
    expect(String(resolved.institutionId)).toBe('inst-1');
  });

  it('lets the institution’s own title and mapping win over the request', async () => {
    mockProgrammeFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'prog-1',
        name: 'BSc Computer Science',
        discipline: AcademicDiscipline.CS,
        institutionId: 'inst-1',
      }),
    });
    mockUnitFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439011',
          code: 'SCS 231',
          title: 'Database Systems I',
          knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
        },
      ]),
    });

    const resolved = await resolveEnrolment({
      programmeId: '507f1f77bcf86cd799439012',
      discipline: AcademicDiscipline.IT,
      currentYear: 2,
      currentSemester: 1,
      currentUnits: [
        {
          unitId: '507f1f77bcf86cd799439011',
          title: 'Databases lol',
          knowledgeAreas: [KnowledgeArea.MACHINE_LEARNING],
        },
      ],
      completedUnits: [],
    });

    expect(resolved.provenance).toBe(AcademicProvenance.INSTITUTION_CURRICULUM);
    expect(resolved.programmeName).toBe('BSc Computer Science');
    expect(resolved.discipline).toBe(AcademicDiscipline.CS);
    expect(resolved.currentUnits[0]!.title).toBe('Database Systems I');
    expect(resolved.currentUnits[0]!.knowledgeAreas).toEqual([KnowledgeArea.DATABASE_SYSTEMS]);
  });

  it('downgrades a partly matched submission to self-declared', async () => {
    mockProgrammeFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'prog-1',
        name: 'BSc Computer Science',
        discipline: AcademicDiscipline.CS,
        institutionId: 'inst-1',
      }),
    });
    mockUnitFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439011',
          code: 'SCS 231',
          title: 'Database Systems I',
          knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
        },
      ]),
    });

    const resolved = await resolveEnrolment({
      programmeId: '507f1f77bcf86cd799439012',
      discipline: AcademicDiscipline.CS,
      currentYear: 2,
      currentSemester: 1,
      currentUnits: [
        {
          unitId: '507f1f77bcf86cd799439011',
          title: 'Database Systems I',
          knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
        },
        { title: 'An elective I picked up', knowledgeAreas: [KnowledgeArea.NETWORKING] },
      ],
      completedUnits: [],
    });

    expect(resolved.provenance).toBe(AcademicProvenance.SELF_DECLARED);
  });

  it('treats a programme id that does not resolve as no evidence at all', async () => {
    mockProgrammeFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const resolved = await resolveEnrolment({
      ...SELF_DECLARED,
      programmeId: '507f1f77bcf86cd799439012',
    });

    expect(resolved.provenance).toBe(AcademicProvenance.SELF_DECLARED);
    expect(resolved.programmeId).toBeUndefined();
    expect(mockUnitFind).not.toHaveBeenCalled();
  });

  it('ignores a unit id belonging to a different programme', async () => {
    mockProgrammeFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'prog-1',
        name: 'BSc Computer Science',
        discipline: AcademicDiscipline.CS,
        institutionId: 'inst-1',
      }),
    });
    // The query is scoped to the programme, so a foreign unit simply returns
    // nothing — and the record must not then claim institutional backing.
    mockUnitFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

    const resolved = await resolveEnrolment({
      programmeId: '507f1f77bcf86cd799439012',
      discipline: AcademicDiscipline.CS,
      currentYear: 2,
      currentSemester: 1,
      currentUnits: [
        {
          unitId: '507f1f77bcf86cd799439099',
          title: 'Someone else’s unit',
          knowledgeAreas: [KnowledgeArea.NETWORKING],
        },
      ],
      completedUnits: [],
    });

    expect(resolved.provenance).toBe(AcademicProvenance.SELF_DECLARED);
    expect(resolved.currentUnits[0]!.unitId).toBeUndefined();
  });
});
