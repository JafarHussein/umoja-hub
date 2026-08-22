import type mongoose from 'mongoose';
import { AssignmentAudience, AssignmentStatus, KnowledgeArea } from '@/types';
import { isKnowledgeArea, knowledgeAreaLabel } from './knowledgeAreas';
import type { AcademicContext } from './academicContext';
import type { AssignedBrief } from './brief';

// ---------------------------------------------------------------------------
// A lecturer's project, and who it is for.
//
// Two rules govern everything here, and they pull in opposite directions on
// purpose.
//
// The first is that a lecturer knows their cohort better than the platform
// does. When they name a student, that is the answer — no year, semester or
// knowledge-area check may overrule it, because the whole reason for letting
// academics set work is that their judgement beats a generator's.
//
// The second is that an open offer still has to find the right people. A
// year-two database project shown to every student at the university is noise,
// and noise is how a feature that works stops being used. So a cohort offer is
// filtered by where the student actually is, and a named one is not filtered at
// all.
// ---------------------------------------------------------------------------

/** The shape this module reads off a ProjectAssignment document. */
export interface AssignmentRecord {
  _id: mongoose.Types.ObjectId | string;
  lecturerId: mongoose.Types.ObjectId | string;
  institutionId: mongoose.Types.ObjectId | string;
  title: string;
  problemStatement: string;
  coreRequirements: string[];
  deliverables?: string[];
  technicalConstraints?: string[];
  knowledgeAreas: string[];
  targetYear: number;
  targetSemester: number;
  audience: string;
  assignedStudentIds?: Array<mongoose.Types.ObjectId | string>;
  capacity?: number | null;
  status: string;
}

export interface EligibilityInput {
  studentId: string;
  institutionId?: mongoose.Types.ObjectId | string | undefined;
  academic: AcademicContext | null;
}

/**
 * Whether this student may take up this project.
 *
 * A closed or draft project is available to nobody. Beyond that: a named
 * student is always eligible; anybody else must be at the same institution and
 * in the year and semester the lecturer aimed it at.
 */
export function isEligible(assignment: AssignmentRecord, student: EligibilityInput): boolean {
  if (assignment.status !== AssignmentStatus.OPEN) return false;

  const named = (assignment.assignedStudentIds ?? []).map(String);
  if (named.includes(student.studentId)) return true;

  // A named assignment is visible only to the students on it. Falling through
  // to the cohort rules here would quietly publish work meant for two people.
  if (assignment.audience === AssignmentAudience.NAMED) return false;

  if (!student.institutionId) return false;
  if (String(assignment.institutionId) !== String(student.institutionId)) return false;
  if (!student.academic) return false;

  return (
    assignment.targetYear === student.academic.currentYear &&
    assignment.targetSemester === student.academic.currentSemester
  );
}

/**
 * The areas the lecturer says this exercises that the student is actually
 * studying. Empty is not a refusal — a lecturer may deliberately set work that
 * reaches past the syllabus — but it is worth showing, because a project with
 * no overlap at all is the one case where their aim may have slipped.
 */
export function overlappingAreas(
  assignment: AssignmentRecord,
  academic: AcademicContext
): KnowledgeArea[] {
  const studying = new Set(academic.knowledgeAreas);
  return assignment.knowledgeAreas.filter(isKnowledgeArea).filter((a) => studying.has(a));
}

/**
 * Turn a lecturer's project into the brief stored on the engagement.
 *
 * No model is called: the lecturer wrote this, and running their words through
 * a generator to "improve" them would be the platform overruling the person
 * who teaches the student. The academic anchor is attached exactly as it is for
 * a generated brief, so the two are comparable work in a lecturer's queue.
 */
export function assignmentToBrief(
  assignment: AssignmentRecord,
  academic: AcademicContext,
  setBy: string
): AssignedBrief {
  const areas = assignment.knowledgeAreas.filter(isKnowledgeArea);
  return {
    title: assignment.title,
    academicAnchor: {
      programmeName: academic.programmeName,
      year: academic.currentYear,
      semester: academic.currentSemester,
      units: academic.currentUnits.map((u) => (u.code ? `${u.code} ${u.title}` : u.title)),
      knowledgeAreas: academic.knowledgeAreas,
      provenance: academic.provenanceLabel,
    },
    assignmentId: String(assignment._id),
    setBy,
    problemStatement: assignment.problemStatement,
    coreRequirements: assignment.coreRequirements,
    technicalConstraints: assignment.technicalConstraints ?? [],
    deliverables: assignment.deliverables ?? [],
    exercises: areas.length > 0 ? areas.map(knowledgeAreaLabel) : ['Engineering judgement'],
  };
}

/**
 * How many students have already taken this up.
 *
 * Counted from the engagements rather than held as a running total on the
 * assignment: a counter and the records it counts drift the moment anything
 * fails halfway, and this is the number a lecturer's capacity limit rests on.
 */
export async function takenCount(
  assignmentId: mongoose.Types.ObjectId | string
): Promise<number> {
  const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
  return ProjectEngagement.countDocuments({ assignmentId } as object);
}
