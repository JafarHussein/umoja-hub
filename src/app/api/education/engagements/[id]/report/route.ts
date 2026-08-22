import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { documentationSubmissionSchema } from '@/lib/validation/educationSchema';
import {
  nextVersionNumber,
  requiresStudentNote,
  submissionRejection,
  SUBMISSION_REJECTION_MESSAGE,
} from '@/lib/education/report';
import { loadOrCreateDocumentation, toDocumentationView } from '@/lib/education/reportAccess';
import { storeDocument } from '@/lib/integrations/documentStorage';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { notify } from '@/lib/notifications/notify';
import { Role, ProjectStatus, SubmissionStatus, NotificationType } from '@/types';

// ---------------------------------------------------------------------------
// The student's project report.
//
// GET  — every version they have submitted, with the lecturer's response to
//        each, and whether they may submit another.
// POST — upload a version. Uploading *is* submitting: there is no draft state,
//        because the draft lives in whatever the student writes in, and a
//        platform that held a half-finished copy would be claiming to be the
//        place the report is written. It is not; it is the place it is handed
//        in, read and answered.
//
// Auth: STUDENT, owner of the engagement.
// ---------------------------------------------------------------------------

const REPORT_FOLDER = 'umojahub/project-reports';

async function ownEngagement(id: string, studentId: string): Promise<void> {
  const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
  const engagement = await ProjectEngagement.findOne({ _id: id, studentId } as object)
    .select('_id')
    .lean();
  if (!engagement) throw new AppError('Project not found.', 404, 'NOT_FOUND');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid project ID.', 400, 'VALIDATION_FAILED');
    }

    await connectDB();
    const studentId = session!.user.id;
    await ownEngagement(id, studentId);

    const doc = await loadOrCreateDocumentation(id, studentId);
    return NextResponse.json({ data: toDocumentationView(doc) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid project ID.', 400, 'VALIDATION_FAILED');
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw new AppError('Choose the PDF of your report to upload.', 400, 'VALIDATION_FAILED');
    }

    const parsed = documentationSubmissionSchema.safeParse({
      ...(typeof form.get('studentNote') === 'string'
        ? { studentNote: form.get('studentNote') as string }
        : {}),
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    await connectDB();
    const studentId = session!.user.id;

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const engagement = await ProjectEngagement.findOne({ _id: id, studentId } as object)
      .select('status revisionNumber')
      .lean();

    if (!engagement) throw new AppError('Project not found.', 404, 'NOT_FOUND');

    const engagementStatus = (engagement as { status: string }).status;
    if (
      engagementStatus !== ProjectStatus.IN_PROGRESS &&
      engagementStatus !== ProjectStatus.BRIEF_GENERATED &&
      engagementStatus !== ProjectStatus.REVISION_REQUIRED
    ) {
      throw new AppError(
        'This project is not in a state where a report can be submitted.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const doc = await loadOrCreateDocumentation(id, studentId);
    const versions = doc.versions ?? [];

    const rejection = submissionRejection(versions);
    if (rejection) {
      throw new AppError(SUBMISSION_REJECTION_MESSAGE[rejection], 409, 'REPORT_ALREADY_SUBMITTED');
    }

    // Insisted on here rather than in the schema, because only the route knows
    // whether there is anything to answer. A second version arriving with no
    // word about what changed makes a lecturer diff two PDFs by eye.
    const studentNote = parsed.data.studentNote?.trim() ?? '';
    if (requiresStudentNote(versions) && studentNote.length < 10) {
      throw new AppError(
        'Say what changed in this version. Your lecturer is reading it against the one they sent back.',
        400,
        'VALIDATION_FAILED'
      );
    }

    // Storage before the record, so a failed upload leaves no version pointing
    // at a file that was never stored. The reverse failure — a stored file with
    // no version — costs an unreferenced object and nothing else.
    const stored = await storeDocument(file, REPORT_FOLDER);

    const versionNumber = nextVersionNumber(versions);
    const { default: ProjectDocumentation } = await import(
      '@/lib/models/ProjectDocumentation.model'
    );

    // Conditional on the version number not already existing, so two tabs
    // pressing upload produce one version and one 409 rather than two.
    const updated = await ProjectDocumentation.findOneAndUpdate(
      { _id: doc._id, 'versions.versionNumber': { $ne: versionNumber } } as object,
      {
        $push: {
          versions: {
            versionNumber,
            fileName: file.name,
            publicId: stored.publicId,
            bytes: stored.bytes,
            ...(stored.pageCount !== undefined ? { pageCount: stored.pageCount } : {}),
            submittedAt: new Date(),
            ...(studentNote ? { studentNote } : {}),
            status: SubmissionStatus.SUBMITTED,
          },
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new AppError(
        'That version was already submitted. Reload the page to see it.',
        409,
        'REPORT_ALREADY_SUBMITTED'
      );
    }

    // Everything before this one is now history. It keeps its file and the
    // feedback that prompted the change — superseded, never deleted, because
    // the sequence of versions is the only account of how the work developed.
    if (versionNumber > 1) {
      await ProjectDocumentation.updateOne({ _id: doc._id } as object, {
        $set: { 'versions.$[old].status': SubmissionStatus.SUPERSEDED },
      } as object, {
        arrayFilters: [
          {
            'old.versionNumber': { $lt: versionNumber },
            'old.status': { $ne: SubmissionStatus.SUPERSEDED },
          },
        ],
      });
    }

    await ProjectEngagement.updateOne({ _id: id } as object, {
      $set: { status: ProjectStatus.UNDER_LECTURER_REVIEW },
    });

    logger.info('education/report', 'Report version submitted', {
      engagementId: id,
      studentId,
      versionNumber,
      bytes: stored.bytes,
      pageCount: stored.pageCount ?? 'unknown',
    });

    void notify({
      userId: studentId,
      type: NotificationType.REVIEW_UPDATE,
      title: 'Your project report was submitted',
      body: 'Your report is with your lecturer. They will read it and either accept it for demonstration or tell you what to change.',
      relatedEntity: { kind: 'ProjectEngagement', id },
    });

    // The lecturers who can actually act on it: verified, at this student's own
    // institution. A fan-out to every lecturer on the platform would be noise
    // to all of them and a boundary violation besides.
    const { default: User } = await import('@/lib/models/User.model');
    const student = await User.findById(studentId)
      .select('firstName lastName studentData.institutionId')
      .lean();
    const institutionId = student?.studentData?.institutionId;

    if (institutionId) {
      const lecturers = await User.find({
        role: Role.LECTURER,
        'lecturerData.isVerified': true,
        'lecturerData.institutionId': institutionId,
      } as object)
        .select('_id')
        .lean();

      const studentName =
        `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() || 'A student';

      await Promise.all(
        lecturers.map((l) =>
          notify({
            userId: String(l._id),
            type: NotificationType.REVIEW_UPDATE,
            title: `${studentName} submitted a project report`,
            body: 'A project report is waiting for your review. Read it, then either accept it for demonstration or send it back with what needs to change.',
            relatedEntity: { kind: 'ProjectEngagement', id },
          })
        )
      );
    }

    await assignPeerReader(id, studentId, institutionId);

    // Re-read rather than returning `updated`.
    //
    // `findOneAndUpdate` captured the record as it was when the new version was
    // pushed — which is before the supersede above ran. Returning it told the
    // student their previous version was still "changes requested" while the
    // database already said superseded, and the two only agreed once they
    // reloaded. A response that contradicts the record it just wrote is the
    // kind of misleading state this workflow cannot afford.
    const settled = await loadOrCreateDocumentation(id, studentId);

    return NextResponse.json({ data: toDocumentationView(settled) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Give a peer in the same cohort the report to read.
 *
 * Peer review used to sit *between* submission and the lecturer: a project
 * could not reach a lecturer until another student had read it. It no longer
 * gates anything. Reading a peer's work is valuable and stays, but a student
 * whose cohort is slow should not be held out of their own assessment, and a
 * lecturer should not be waiting on a third party to begin.
 *
 * Best-effort by design. Every failure here is swallowed: an institution with
 * one student has no peer to ask, and refusing that student's report over it
 * would be the platform breaking its own workflow on a nicety.
 */
async function assignPeerReader(
  engagementId: string,
  studentId: string,
  institutionId?: unknown
): Promise<void> {
  try {
    const { default: User } = await import('@/lib/models/User.model');
    const { default: PeerReview } = await import('@/lib/models/PeerReview.model');
    const { selectPeerReviewer } = await import('@/lib/education/peerReviewer');
    const { UserStatus, PeerReviewStatus } = await import('@/types');

    const eligible = { role: Role.STUDENT, status: UserStatus.ACTIVE, _id: { $ne: studentId } };
    const candidates = institutionId
      ? await User.find({ ...eligible, 'studentData.institutionId': institutionId } as object)
          .select('_id')
          .lean()
      : [];
    if (candidates.length === 0) return;

    const previous = (
      await PeerReview.find({ engagementId } as object)
        .select('reviewerId')
        .lean()
    ).map((r) => String(r.reviewerId));

    const openCounts = await PeerReview.aggregate<{ _id: unknown; n: number }>([
      {
        $match: {
          reviewerId: { $in: candidates.map((c) => c._id) },
          status: PeerReviewStatus.ASSIGNED,
        },
      },
      { $group: { _id: '$reviewerId', n: { $sum: 1 } } },
    ]);
    const openByReviewer = new Map(openCounts.map((row) => [String(row._id), row.n]));

    const reviewer = selectPeerReviewer({
      candidates: candidates.map((c) => ({
        id: String(c._id),
        openAssignments: openByReviewer.get(String(c._id)) ?? 0,
      })),
      excludeIds: previous,
    });
    if (!reviewer) return;

    const peerReview = await PeerReview.create({
      engagementId,
      reviewerId: reviewer.id,
      status: PeerReviewStatus.ASSIGNED,
    });

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    await ProjectEngagement.updateOne({ _id: engagementId } as object, {
      $set: { peerReviewId: peerReview._id },
    });

    void notify({
      userId: reviewer.id,
      type: NotificationType.REVIEW_UPDATE,
      title: 'You have a project report to read',
      body: 'A student in your cohort has submitted their project report. Reading it is not a gate on their assessment — it is a chance to see how somebody else solved a problem, and to give them something useful.',
      relatedEntity: { kind: 'ProjectEngagement', id: engagementId },
    });
  } catch (error) {
    logger.warn('education/report', 'Could not assign a peer reader — submission stands', {
      engagementId,
      error,
    });
  }
}
