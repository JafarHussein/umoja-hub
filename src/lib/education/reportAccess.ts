import type mongoose from 'mongoose';
import { AppError } from '@/lib/utils';
import { Role, SubmissionStatus } from '@/types';
import { documentationStage, submissionRejection, SUBMISSION_REJECTION_MESSAGE } from './report';
import type {
  ProjectDocumentationDoc,
  SubmissionVersionValue,
} from '@/lib/models/ProjectDocumentation.model';

// ---------------------------------------------------------------------------
// Loading a submitted report, and deciding who may read it.
//
// Every route that touches project documentation comes through here, so the
// ownership rule is written once. A student reaches their own report and no
// other. A lecturer reaches a report belonging to a student at their own
// institution. A peer reaches one they were asked to read.
//
// Refusals are 404, not 403, everywhere: telling somebody "this exists but you
// may not read it" is itself a disclosure about a student's work.
// ---------------------------------------------------------------------------

/** One version, as every screen wants it. Never carries the storage handle. */
function toVersionView(version: SubmissionVersionValue): Record<string, unknown> {
  return {
    _id: String(version._id),
    versionNumber: version.versionNumber,
    fileName: version.fileName,
    bytes: version.bytes,
    ...(version.pageCount !== undefined ? { pageCount: version.pageCount } : {}),
    submittedAt: version.submittedAt,
    ...(version.studentNote ? { studentNote: version.studentNote } : {}),
    status: version.status,
    ...(version.review
      ? {
          review: {
            outcome: version.review.outcome,
            scores: version.review.scores,
            summary: version.review.summary,
            ...(version.review.strengths ? { strengths: version.review.strengths } : {}),
            ...(version.review.concerns ? { concerns: version.review.concerns } : {}),
            ...(version.review.requiredChanges
              ? { requiredChanges: version.review.requiredChanges }
              : {}),
            ...(version.review.questionsForDemonstration
              ? { questionsForDemonstration: version.review.questionsForDemonstration }
              : {}),
            pageNotes: version.review.pageNotes ?? [],
            checklist: version.review.checklist ?? [],
            reviewedAt: version.review.reviewedAt,
          },
        }
      : {}),
  };
}

/**
 * The documentation record as the workspace and the lecturer's screen both want
 * it: every version newest first, with whose turn it is.
 *
 * Assembled in one place so the two screens cannot drift into describing the
 * same report differently.
 */
export function toDocumentationView(doc: ProjectDocumentationDoc): {
  _id: string;
  engagementId: string;
  stage: string;
  canSubmit: boolean;
  blockedReason?: string;
  versions: Array<Record<string, unknown>>;
} {
  const versions = doc.versions ?? [];
  const rejection = submissionRejection(versions);

  return {
    _id: String(doc._id),
    engagementId: String(doc.engagementId),
    stage: documentationStage(versions),
    canSubmit: rejection === null,
    ...(rejection ? { blockedReason: SUBMISSION_REJECTION_MESSAGE[rejection] } : {}),
    versions: [...versions]
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map((v) => toVersionView(v)),
  };
}

/**
 * The same record as a peer reader may see it: the version they were asked to
 * read, and nothing else.
 *
 * Deliberately not `toDocumentationView`. That shape carries the lecturer's
 * summary and scores, and a student reading a classmate's work has no business
 * knowing what their lecturer thought of it — peer review exists so that
 * somebody reads the project, not so the cohort can compare marks.
 */
export function toPeerDocumentationView(doc: ProjectDocumentationDoc): {
  versionId: string;
  versionNumber: number;
  fileName: string;
  pageCount?: number;
  submittedAt: Date;
} | null {
  const current = (doc.versions ?? [])
    .filter((v) => v.status !== SubmissionStatus.SUPERSEDED)
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
  if (!current) return null;

  return {
    versionId: String(current._id),
    versionNumber: current.versionNumber,
    fileName: current.fileName,
    ...(current.pageCount !== undefined ? { pageCount: current.pageCount } : {}),
    submittedAt: current.submittedAt,
  };
}

/**
 * The documentation for an engagement, creating the record the first time it is
 * opened.
 *
 * Created lazily rather than alongside the engagement so that a project started
 * before this workflow existed still opens, and so a student who never reaches
 * the report stage leaves no empty record behind.
 */
export async function loadOrCreateDocumentation(
  engagementId: string | mongoose.Types.ObjectId,
  studentId: string | mongoose.Types.ObjectId
): Promise<ProjectDocumentationDoc> {
  const { default: ProjectDocumentation } = await import(
    '@/lib/models/ProjectDocumentation.model'
  );

  const existing = await ProjectDocumentation.findOne({ engagementId } as object);
  if (existing) return existing as unknown as ProjectDocumentationDoc;

  try {
    const created = await ProjectDocumentation.create({ engagementId, studentId });
    return created as unknown as ProjectDocumentationDoc;
  } catch (error) {
    // Two tabs opening the workspace at once both miss the read and both
    // create. The unique index on engagementId decides it; the loser re-reads
    // rather than surfacing a duplicate-key error to a student who did nothing
    // wrong.
    if ((error as { code?: number }).code === 11000) {
      const raced = await ProjectDocumentation.findOne({ engagementId } as object);
      if (raced) return raced as unknown as ProjectDocumentationDoc;
    }
    throw error;
  }
}

/**
 * A report a lecturer may read.
 *
 * Two conditions, and both matter. The student must be at the lecturer's own
 * institution — the same boundary the review queue enforces. And something must
 * have been submitted: a record with no versions in it is a student who has not
 * handed anything in, and there is nothing there to read.
 */
export async function loadDocumentationForLecturer(
  documentationId: string,
  lecturerInstitutionId: mongoose.Types.ObjectId | string
): Promise<ProjectDocumentationDoc> {
  const { default: ProjectDocumentation } = await import(
    '@/lib/models/ProjectDocumentation.model'
  );
  const { default: User } = await import('@/lib/models/User.model');

  const found = await ProjectDocumentation.findById(documentationId);
  if (!found) throw new AppError('Report not found.', 404, 'NOT_FOUND');

  const doc = found as unknown as ProjectDocumentationDoc;
  if ((doc.versions ?? []).length === 0) {
    throw new AppError('Report not found.', 404, 'NOT_FOUND');
  }

  const student = await User.findById(doc.studentId).select('studentData.institutionId').lean();
  const studentInstitution = student?.studentData?.institutionId;
  if (!studentInstitution || String(studentInstitution) !== String(lecturerInstitutionId)) {
    throw new AppError('Report not found.', 404, 'NOT_FOUND');
  }

  return doc;
}

/**
 * The stored file behind one version, for a reader who is allowed it.
 *
 * The three readers are the three people the workflow puts in front of the
 * document: the student who wrote it, a verified lecturer at their institution,
 * and the peer who was asked to read it. Everyone else gets the same answer as
 * somebody asking about a project that does not exist.
 *
 * Note what is returned — a Cloudinary handle, never a URL. The bytes go back
 * through the calling route so that every read is a decision the application
 * makes now, rather than one it made once at upload time.
 */
export async function loadVersionFileForReader(params: {
  engagementId: string;
  versionId: string;
  userId: string;
  role: string;
}): Promise<{ publicId: string; fileName: string }> {
  const { engagementId, versionId, userId, role } = params;

  const { default: ProjectDocumentation } = await import(
    '@/lib/models/ProjectDocumentation.model'
  );
  const found = await ProjectDocumentation.findOne({ engagementId } as object).lean();
  if (!found) throw new AppError('Document not found.', 404, 'NOT_FOUND');

  const doc = found as unknown as ProjectDocumentationDoc;
  const version = (doc.versions ?? []).find((v) => String(v._id) === versionId);
  if (!version) throw new AppError('Document not found.', 404, 'NOT_FOUND');

  const allowed = await mayRead({ doc, version, userId, role, engagementId });
  if (!allowed) throw new AppError('Document not found.', 404, 'NOT_FOUND');

  return { publicId: version.publicId, fileName: version.fileName };
}

async function mayRead(params: {
  doc: ProjectDocumentationDoc;
  version: SubmissionVersionValue;
  userId: string;
  role: string;
  engagementId: string;
}): Promise<boolean> {
  const { doc, version, userId, role, engagementId } = params;

  if (String(doc.studentId) === userId) return true;

  const { default: User } = await import('@/lib/models/User.model');

  if (role === Role.LECTURER) {
    const lecturer = await User.findById(userId)
      .select('lecturerData.isVerified lecturerData.institutionId')
      .lean();
    if (!lecturer?.lecturerData?.isVerified) return false;

    const institutionId = lecturer.lecturerData.institutionId;
    if (!institutionId) return false;

    const student = await User.findById(doc.studentId).select('studentData.institutionId').lean();
    return String(student?.studentData?.institutionId ?? '') === String(institutionId);
  }

  if (role === Role.STUDENT) {
    // The peer who was asked to read it, and only the version that was handed
    // in: a peer has no business in a draft the student later replaced.
    if (version.status === SubmissionStatus.SUPERSEDED) return false;

    const { default: PeerReview } = await import('@/lib/models/PeerReview.model');
    const assignment = await PeerReview.findOne({ engagementId, reviewerId: userId } as object)
      .select('_id')
      .lean();
    return Boolean(assignment);
  }

  return false;
}
