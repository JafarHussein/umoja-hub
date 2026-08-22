import { z } from 'zod';
import {
  AcademicDiscipline,
  KnowledgeArea,
  MAX_CURRENT_UNITS,
  MAX_PROGRAMME_YEARS,
  MAX_SEMESTERS_PER_YEAR,
} from '@/types';

// ---------------------------------------------------------------------------
// What a student may record about their own coursework.
//
// Two shapes reach the same enrolment: a student on a published programme picks
// a programme and a semester, and a student whose institution has published
// nothing types the same facts out. The second must work with no institution on
// the platform at all — the Hub has to be useful to a student at a university
// that has never heard of us, or it will never reach the universities.
// ---------------------------------------------------------------------------

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Not a valid identifier');

const knowledgeArea = z.enum(Object.values(KnowledgeArea) as [KnowledgeArea, ...KnowledgeArea[]]);

export const enrolledUnitSchema = z.object({
  unitId: objectId.optional(),
  code: z.string().trim().max(20, 'A unit code is at most 20 characters').optional(),
  title: z
    .string()
    .trim()
    .min(3, 'Give the unit’s full name')
    .max(120, 'A unit name is at most 120 characters'),
  knowledgeAreas: z
    .array(knowledgeArea)
    .min(1, 'Say which subject this unit covers')
    .max(4, 'Choose at most four subjects for one unit'),
});

/**
 * The self-declared path (T0) and the published-curriculum path (T1) share one
 * body. Which one was taken is decided on the server from whether a
 * `programmeId` resolves — the client cannot assert its own provenance, because
 * a claim that grades itself is not a claim worth recording.
 */
export const enrolmentUpdateSchema = z.object({
  programmeId: objectId.optional(),
  programmeName: z
    .string()
    .trim()
    .min(3, 'Give your programme’s name')
    .max(120, 'A programme name is at most 120 characters')
    .optional(),
  discipline: z.enum([AcademicDiscipline.CS, AcademicDiscipline.IT], {
    message: 'The Hub covers Computer Science and Information Technology only',
  }),
  currentYear: z
    .number()
    .int('Year of study must be a whole number')
    .min(1, 'Year of study starts at 1')
    .max(MAX_PROGRAMME_YEARS, `Year of study is at most ${MAX_PROGRAMME_YEARS}`),
  currentSemester: z
    .number()
    .int('Semester must be a whole number')
    .min(1, 'Semester starts at 1')
    .max(MAX_SEMESTERS_PER_YEAR, `Semester is at most ${MAX_SEMESTERS_PER_YEAR}`),
  currentUnits: z
    .array(enrolledUnitSchema)
    .min(1, 'Record at least one unit you are taking this semester')
    .max(MAX_CURRENT_UNITS, `Record at most ${MAX_CURRENT_UNITS} units`),
  completedUnits: z.array(enrolledUnitSchema).max(60).default([]),
});

export type EnrolmentUpdateInput = z.infer<typeof enrolmentUpdateSchema>;
export type EnrolledUnitInput = z.infer<typeof enrolledUnitSchema>;

// ---------------------------------------------------------------------------
// Curriculum publication — used by the demo seeder and by institution tooling.
// ---------------------------------------------------------------------------

export const curriculumUnitSchema = z.object({
  code: z.string().trim().min(2, 'A unit code is required').max(20),
  title: z.string().trim().min(3, 'A unit title is required').max(120),
  year: z.number().int().min(1).max(MAX_PROGRAMME_YEARS),
  semester: z.number().int().min(1).max(MAX_SEMESTERS_PER_YEAR),
  knowledgeAreas: z
    .array(knowledgeArea)
    .min(1, 'Map the unit onto at least one knowledge area')
    .max(4),
});

export const academicProgrammeSchema = z.object({
  name: z.string().trim().min(3, 'A programme name is required').max(120),
  discipline: z.enum([AcademicDiscipline.CS, AcademicDiscipline.IT]),
  durationYears: z.number().int().min(1).max(MAX_PROGRAMME_YEARS),
  semestersPerYear: z.number().int().min(1).max(MAX_SEMESTERS_PER_YEAR),
});
