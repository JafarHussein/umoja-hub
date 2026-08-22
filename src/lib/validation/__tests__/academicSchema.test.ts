import {
  academicProgrammeSchema,
  curriculumUnitSchema,
  enrolledUnitSchema,
  enrolmentUpdateSchema,
} from '../academicSchema';
import { AcademicDiscipline, KnowledgeArea, MAX_CURRENT_UNITS } from '@/types';

const VALID_UNIT = {
  code: 'SCS 231',
  title: 'Database Systems I',
  knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
};

const VALID_ENROLMENT = {
  programmeName: 'BSc Computer Science',
  discipline: AcademicDiscipline.CS,
  currentYear: 2,
  currentSemester: 1,
  currentUnits: [VALID_UNIT],
  completedUnits: [],
};

describe('enrolledUnitSchema', () => {
  it('accepts a unit with a code, a title and a knowledge area', () => {
    expect(enrolledUnitSchema.safeParse(VALID_UNIT).success).toBe(true);
  });

  it('accepts a unit with no code — a student may not remember it', () => {
    const result = enrolledUnitSchema.safeParse({
      title: 'Database Systems I',
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a published unit reference', () => {
    const result = enrolledUnitSchema.safeParse({
      ...VALID_UNIT,
      unitId: '507f1f77bcf86cd799439011',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a unitId that is not an identifier', () => {
    const result = enrolledUnitSchema.safeParse({ ...VALID_UNIT, unitId: 'not-an-id' });
    expect(result.success).toBe(false);
  });

  it('rejects a unit that maps onto nothing — it would be invisible to the Hub', () => {
    const result = enrolledUnitSchema.safeParse({ ...VALID_UNIT, knowledgeAreas: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an area outside the canonical taxonomy', () => {
    const result = enrolledUnitSchema.safeParse({
      ...VALID_UNIT,
      knowledgeAreas: ['QUANTUM_ALCHEMY'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than four areas for one unit', () => {
    const result = enrolledUnitSchema.safeParse({
      ...VALID_UNIT,
      knowledgeAreas: [
        KnowledgeArea.DATABASE_SYSTEMS,
        KnowledgeArea.DATA_ENGINEERING,
        KnowledgeArea.SOFTWARE_ENGINEERING,
        KnowledgeArea.WEB_DEVELOPMENT,
        KnowledgeArea.NETWORKING,
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a one-character unit title', () => {
    expect(enrolledUnitSchema.safeParse({ ...VALID_UNIT, title: 'D' }).success).toBe(false);
  });

  it('rejects a unit code longer than 20 characters', () => {
    const result = enrolledUnitSchema.safeParse({ ...VALID_UNIT, code: 'X'.repeat(21) });
    expect(result.success).toBe(false);
  });
});

describe('enrolmentUpdateSchema', () => {
  it('accepts a self-declared enrolment with no programme id', () => {
    expect(enrolmentUpdateSchema.safeParse(VALID_ENROLMENT).success).toBe(true);
  });

  it('accepts a published-curriculum enrolment', () => {
    const result = enrolmentUpdateSchema.safeParse({
      ...VALID_ENROLMENT,
      programmeId: '507f1f77bcf86cd799439011',
    });
    expect(result.success).toBe(true);
  });

  it('defaults completedUnits to an empty list', () => {
    const { completedUnits: _omitted, ...withoutCompleted } = VALID_ENROLMENT;
    const result = enrolmentUpdateSchema.safeParse(withoutCompleted);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.completedUnits).toEqual([]);
  });

  it('rejects a discipline outside CS and IT', () => {
    const result = enrolmentUpdateSchema.safeParse({ ...VALID_ENROLMENT, discipline: 'LAW' });
    expect(result.success).toBe(false);
  });

  it('rejects a semester with no units', () => {
    const result = enrolmentUpdateSchema.safeParse({ ...VALID_ENROLMENT, currentUnits: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more units than a semester can hold', () => {
    const result = enrolmentUpdateSchema.safeParse({
      ...VALID_ENROLMENT,
      currentUnits: Array.from({ length: MAX_CURRENT_UNITS + 1 }, () => VALID_UNIT),
    });
    expect(result.success).toBe(false);
  });

  it('rejects a fractional year of study', () => {
    const result = enrolmentUpdateSchema.safeParse({ ...VALID_ENROLMENT, currentYear: 2.5 });
    expect(result.success).toBe(false);
  });

  it('rejects year zero and a seventh year', () => {
    expect(enrolmentUpdateSchema.safeParse({ ...VALID_ENROLMENT, currentYear: 0 }).success).toBe(
      false
    );
    expect(enrolmentUpdateSchema.safeParse({ ...VALID_ENROLMENT, currentYear: 7 }).success).toBe(
      false
    );
  });

  it('rejects a fourth semester', () => {
    const result = enrolmentUpdateSchema.safeParse({ ...VALID_ENROLMENT, currentSemester: 4 });
    expect(result.success).toBe(false);
  });

  it('rejects a programme name of two characters', () => {
    const result = enrolmentUpdateSchema.safeParse({ ...VALID_ENROLMENT, programmeName: 'CS' });
    expect(result.success).toBe(false);
  });

  it('rejects a programme name beyond 120 characters', () => {
    const result = enrolmentUpdateSchema.safeParse({
      ...VALID_ENROLMENT,
      programmeName: 'B'.repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it('rejects more completed units than a degree could hold', () => {
    const result = enrolmentUpdateSchema.safeParse({
      ...VALID_ENROLMENT,
      completedUnits: Array.from({ length: 61 }, () => VALID_UNIT),
    });
    expect(result.success).toBe(false);
  });
});

describe('curriculum publication schemas', () => {
  it('accepts a well-formed curriculum unit', () => {
    const result = curriculumUnitSchema.safeParse({
      code: 'BCS 231',
      title: 'Database Systems I',
      year: 2,
      semester: 1,
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a curriculum unit that maps onto nothing', () => {
    const result = curriculumUnitSchema.safeParse({
      code: 'BCS 231',
      title: 'Database Systems I',
      year: 2,
      semester: 1,
      knowledgeAreas: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a curriculum unit taught in a year the degree does not have', () => {
    const result = curriculumUnitSchema.safeParse({
      code: 'BCS 231',
      title: 'Database Systems I',
      year: 9,
      semester: 1,
      knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a four-year programme', () => {
    const result = academicProgrammeSchema.safeParse({
      name: 'BSc Computer Science',
      discipline: AcademicDiscipline.CS,
      durationYears: 4,
      semestersPerYear: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a programme in a discipline outside scope', () => {
    const result = academicProgrammeSchema.safeParse({
      name: 'BSc Nursing',
      discipline: 'NURSING',
      durationYears: 4,
      semestersPerYear: 2,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a programme with no semesters', () => {
    const result = academicProgrammeSchema.safeParse({
      name: 'BSc Computer Science',
      discipline: AcademicDiscipline.CS,
      durationYears: 4,
      semestersPerYear: 0,
    });
    expect(result.success).toBe(false);
  });
});
