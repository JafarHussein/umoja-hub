import type mongoose from 'mongoose';
import {
  ACADEMIC_PROVENANCE_LABEL,
  AcademicDiscipline,
  AcademicProvenance,
  KnowledgeArea,
} from '@/types';
import { KNOWLEDGE_AREAS, isKnowledgeArea, knowledgeAreaLabel } from './knowledgeAreas';
import type { EnrolledUnitInput, EnrolmentUpdateInput } from '@/lib/validation/academicSchema';

// ---------------------------------------------------------------------------
// What the student is studying, in the only form the rest of the Hub reads.
//
// Everything above this module speaks knowledge areas. Unit codes, programme
// names and institutional labels stop here. That is the whole point of the
// taxonomy: the messiness is per-institution, the reasoning is not.
// ---------------------------------------------------------------------------

export interface AcademicUnitView {
  code?: string;
  title: string;
  knowledgeAreas: KnowledgeArea[];
  areaLabels: string[];
}

export interface AcademicContext {
  programmeName: string;
  discipline: AcademicDiscipline;
  currentYear: number;
  currentSemester: number;
  currentUnits: AcademicUnitView[];
  /** Distinct areas across the current units, most-covered first. */
  knowledgeAreas: KnowledgeArea[];
  provenance: AcademicProvenance;
  /** Plain-language statement of where this came from. Shown, not implied. */
  provenanceLabel: string;
  provenanceRecordedAt: Date;
}

/** The shape this module reads off a StudentEnrolment document. */
export interface EnrolmentRecord {
  programmeName?: string;
  discipline?: string;
  currentYear?: number;
  currentSemester?: number;
  currentUnits?: Array<{
    code?: string | null;
    title?: string | null;
    knowledgeAreas?: unknown;
  }> | null;
  provenance?: string;
  provenanceRecordedAt?: Date;
}

function unitView(unit: {
  code?: string | null;
  title?: string | null;
  knowledgeAreas?: unknown;
}): AcademicUnitView | null {
  const title = typeof unit.title === 'string' ? unit.title.trim() : '';
  if (title.length === 0) return null;
  const areas = Array.isArray(unit.knowledgeAreas)
    ? unit.knowledgeAreas.filter(isKnowledgeArea)
    : [];
  if (areas.length === 0) return null;
  const code = typeof unit.code === 'string' && unit.code.trim().length > 0 ? unit.code.trim() : undefined;
  return {
    ...(code ? { code } : {}),
    title,
    knowledgeAreas: areas,
    areaLabels: areas.map(knowledgeAreaLabel),
  };
}

/**
 * Turn a stored enrolment into the view the Hub reasons with.
 *
 * Returns `null` when the record cannot support a decision — no units, or no
 * unit that maps onto the taxonomy. There is no honest partial answer to "what
 * is this student studying?", and inventing one is how a brief ends up claiming
 * an academic link it does not have.
 */
export function toAcademicContext(record: EnrolmentRecord | null | undefined): AcademicContext | null {
  if (!record) return null;

  const units = (record.currentUnits ?? [])
    .map(unitView)
    .filter((u): u is AcademicUnitView => u !== null);
  if (units.length === 0) return null;

  const discipline =
    record.discipline === AcademicDiscipline.IT ? AcademicDiscipline.IT : AcademicDiscipline.CS;
  const provenance =
    record.provenance === AcademicProvenance.INSTITUTION_CURRICULUM
      ? AcademicProvenance.INSTITUTION_CURRICULUM
      : AcademicProvenance.SELF_DECLARED;

  // Ordered by how much of this semester rests on the area, so a brief written
  // from the first few is written from what the student is most immersed in.
  const weight = new Map<KnowledgeArea, number>();
  for (const unit of units) {
    for (const area of unit.knowledgeAreas) {
      weight.set(area, (weight.get(area) ?? 0) + 1);
    }
  }
  const knowledgeAreas = [...weight.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([area]) => area);

  return {
    programmeName: record.programmeName?.trim() || 'Undeclared programme',
    discipline,
    currentYear: record.currentYear ?? 1,
    currentSemester: record.currentSemester ?? 1,
    currentUnits: units,
    knowledgeAreas,
    provenance,
    provenanceLabel: ACADEMIC_PROVENANCE_LABEL[provenance],
    provenanceRecordedAt: record.provenanceRecordedAt ?? new Date(0),
  };
}

/** The student's academic context, or `null` if they have not recorded one. */
export async function loadAcademicContext(
  studentId: string | mongoose.Types.ObjectId
): Promise<AcademicContext | null> {
  const { default: StudentEnrolment } = await import('@/lib/models/StudentEnrolment.model');
  const enrolment = await StudentEnrolment.findOne({ studentId } as object).lean();
  return toAcademicContext(enrolment as EnrolmentRecord | null);
}

// ---------------------------------------------------------------------------
// Recording an enrolment
// ---------------------------------------------------------------------------

export interface ResolvedEnrolment {
  programmeId?: mongoose.Types.ObjectId;
  institutionId?: mongoose.Types.ObjectId;
  programmeName: string;
  discipline: AcademicDiscipline;
  currentUnits: Array<{
    unitId?: mongoose.Types.ObjectId;
    code?: string;
    title: string;
    knowledgeAreas: KnowledgeArea[];
  }>;
  completedUnits: ResolvedEnrolment['currentUnits'];
  provenance: AcademicProvenance;
}

function snapshot(unit: EnrolledUnitInput): ResolvedEnrolment['currentUnits'][number] {
  return {
    ...(unit.code ? { code: unit.code.toUpperCase() } : {}),
    title: unit.title,
    knowledgeAreas: unit.knowledgeAreas,
  };
}

/**
 * Reconcile what the student submitted against the published curriculum.
 *
 * Where a unit names a real `CurriculumUnit` on the chosen programme, the
 * institution's own title and mapping win over whatever arrived in the request
 * — the point of publishing a curriculum is that the institution's version is
 * the one on record. Everything else is kept as the student wrote it and
 * carries no institutional weight.
 *
 * Provenance is decided here and only here: institution-published when the
 * programme resolved and every current unit came from it, self-declared
 * otherwise. A partially matched submission is self-declared, because "your
 * institution published this" must be true of the whole record or it misleads.
 */
export async function resolveEnrolment(
  input: EnrolmentUpdateInput,
  studentInstitutionId?: mongoose.Types.ObjectId
): Promise<ResolvedEnrolment> {
  const fallbackName = input.programmeName?.trim() ?? '';

  if (!input.programmeId) {
    return {
      ...(studentInstitutionId ? { institutionId: studentInstitutionId } : {}),
      programmeName: fallbackName || 'Undeclared programme',
      discipline: input.discipline,
      currentUnits: input.currentUnits.map(snapshot),
      completedUnits: input.completedUnits.map(snapshot),
      provenance: AcademicProvenance.SELF_DECLARED,
    };
  }

  const { default: AcademicProgramme } = await import('@/lib/models/AcademicProgramme.model');
  const { default: CurriculumUnit } = await import('@/lib/models/CurriculumUnit.model');

  const programme = await AcademicProgramme.findById(input.programmeId).lean();
  if (!programme) {
    // A programme id that does not resolve is not an error the student can act
    // on; it is simply not evidence. The record stands as self-declared.
    return {
      ...(studentInstitutionId ? { institutionId: studentInstitutionId } : {}),
      programmeName: fallbackName || 'Undeclared programme',
      discipline: input.discipline,
      currentUnits: input.currentUnits.map(snapshot),
      completedUnits: input.completedUnits.map(snapshot),
      provenance: AcademicProvenance.SELF_DECLARED,
    };
  }

  const referenced = input.currentUnits
    .concat(input.completedUnits)
    .map((u) => u.unitId)
    .filter((id): id is string => typeof id === 'string');

  const published = referenced.length
    ? await CurriculumUnit.find({
        _id: { $in: referenced },
        programmeId: programme._id,
      } as object).lean()
    : [];

  const byId = new Map(published.map((u) => [String(u._id), u]));

  const resolve = (unit: EnrolledUnitInput): ResolvedEnrolment['currentUnits'][number] => {
    const match = unit.unitId ? byId.get(unit.unitId) : undefined;
    if (!match) return snapshot(unit);
    return {
      unitId: match._id as mongoose.Types.ObjectId,
      ...(match.code ? { code: match.code } : {}),
      title: match.title,
      knowledgeAreas: match.knowledgeAreas.filter(isKnowledgeArea),
    };
  };

  const currentUnits = input.currentUnits.map(resolve);
  const everyUnitPublished = currentUnits.every((u) => u.unitId !== undefined);

  return {
    programmeId: programme._id as mongoose.Types.ObjectId,
    ...(programme.institutionId
      ? { institutionId: programme.institutionId as mongoose.Types.ObjectId }
      : studentInstitutionId
        ? { institutionId: studentInstitutionId }
        : {}),
    programmeName: programme.name,
    discipline: (programme.discipline as AcademicDiscipline) ?? input.discipline,
    currentUnits,
    completedUnits: input.completedUnits.map(resolve),
    provenance: everyUnitPublished
      ? AcademicProvenance.INSTITUTION_CURRICULUM
      : AcademicProvenance.SELF_DECLARED,
  };
}

// ---------------------------------------------------------------------------
// Rendering the context for a language model
// ---------------------------------------------------------------------------

/**
 * The academic context as a prompt block.
 *
 * `depth` caps how many areas are described in full: a brief written from every
 * area of a seven-unit semester is a brief about nothing in particular.
 */
export function academicContextPrompt(context: AcademicContext, depth = 3): string {
  const leading = context.knowledgeAreas.slice(0, depth);
  const unitLines = context.currentUnits.map(
    (u) => `- ${u.code ? `${u.code} ` : ''}${u.title} (${u.areaLabels.join(', ')})`
  );

  const areaBlocks = leading.map((area) => {
    const profile = KNOWLEDGE_AREAS[area];
    return [
      `${profile.label} — ${profile.summary}`,
      `  Must exercise: ${profile.capabilities.join('; ')}.`,
      `  Architectural pressures that make it load-bearing: ${profile.architecturalPressures.join('; ')}.`,
      `  Does NOT count as exercising it: ${profile.antiPatterns.join('; ')}.`,
    ].join('\n');
  });

  return [
    `Programme: ${context.programmeName} (${context.discipline}), year ${context.currentYear}, semester ${context.currentSemester}.`,
    `Units this semester:`,
    ...unitLines,
    ``,
    `Knowledge areas this project must exercise, in priority order:`,
    ...areaBlocks,
  ].join('\n');
}
