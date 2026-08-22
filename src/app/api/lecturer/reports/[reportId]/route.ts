import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { documentationReviewSchema } from '@/lib/validation/educationSchema';
import { latestVersion, statusForOutcome } from '@/lib/education/report';
import { loadDocumentationForLecturer, toDocumentationView } from '@/lib/education/reportAccess';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import {
  Role,
  ProjectStatus,
  SubmissionStatus,
  DocumentationOutcome,
  NotificationType,
  LecturerDecision,
} from '@/types';
import { notify } from '@/lib/notifications/notify';

// ---------------------------------------------------------------------------
// One student's submitted report, for the lecturer who may read it.
//
// GET  — the versions, the project they belong to, and the logs the student
//        kept while building, so the lecturer arrives at the demonstration
//        already knowing the project rather than meeting it for the first time.
// POST — the decision: accept it for demonstration, or send it back.
//
// Auth: LECTURER, credential-verified, student at their own institution.
// ---------------------------------------------------------------------------

async function verifiedLecturer(sessionUserId: string): Promise<{
  institutionId: mongoose.Types.ObjectId;
}> {
  const { default: User } = await import('@/lib/models/User.model');
  const lecturer = await User.findById(sessionUserId)
    .select('lecturerData.isVerified lecturerData.institutionId')
    .lean();

  if (!lecturer?.lecturerData?.isVerified) {
    throw new AppError(
      'Lecturer verification required before you can review reports.',
      403,
      'LECTURER_NOT_VERIFIED'
    );
  }
  if (!lecturer.lecturerData.institutionId) {
    throw new AppError(
      'Your account has no institution on record, so there are no students whose work you can read.',
      409,
      'LECTURER_NOT_AFFILIATED'
    );
  }
  return { institutionId: lecturer.lecturerData.institutionId as mongoose.Types.ObjectId };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const { reportId } = await params;
    if (!mongoose.isValidObjectId(reportId)) {
      throw new AppError('Report not found.', 404, 'NOT_FOUND');
    }

    await connectDB();
    const { institutionId } = await verifiedLecturer(session!.user.id);
    const doc = await loadDocumentationForLecturer(reportId, institutionId);

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const { default: User } = await import('@/lib/models/User.model');
    const { default: Demonstration } = await import('@/lib/models/Demonstration.model');

    const [engagement, student, demonstrations] = await Promise.all([
      ProjectEngagement.findById(doc.engagementId)
        .select(
          'brief track status revisionNumber githubRepoUrl githubRepoName interest industryName documents.blockerLog documents.aiUsageLog'
        )
        .lean(),
      User.findById(doc.studentId).select('firstName lastName email').lean(),
      Demonstration.find({ engagementId: doc.engagementId } as object)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // The blocker log and the AI usage log are not in the report. They are the
    // platform's structured record of how the work went, captured while it
    // happened rather than reconstructed afterwards, and a lecturer reading a
    // report is exactly who they were kept for.
    const raw = engagement as
      | {
          documents?: { blockerLog?: unknown[]; aiUsageLog?: unknown[] };
          [k: string]: unknown;
        }
      | null;

    return NextResponse.json({
      data: {
        documentation: toDocumentationView(doc),
        engagement: raw
          ? {
              _id: String(raw['_id']),
              brief: raw['brief'],
              track: raw['track'],
              status: raw['status'],
              revisionNumber: raw['revisionNumber'],
              githubRepoUrl: raw['githubRepoUrl'],
              githubRepoName: raw['githubRepoName'],
              interest: raw['interest'],
              industryName: raw['industryName'],
              blockerLog: raw.documents?.blockerLog ?? [],
              aiUsageLog: raw.documents?.aiUsageLog ?? [],
            }
          : null,
        student: student
          ? {
              name: `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
              email: student.email,
            }
          : null,
        demonstrations: demonstrations.map((d) => ({
          _id: String(d._id),
          status: d.status,
          scheduledFor: d.scheduledFor,
          revisionNumber: d.revisionNumber,
          evaluation: d.evaluation,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.LECTURER);

    const { reportId } = await params;
    if (!mongoose.isValidObjectId(reportId)) {
      throw new AppError('Report not found.', 404, 'NOT_FOUND');
    }

    const body: unknown = await req.json();
    const parsed = documentationReviewSchema.safeParse(body);
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
    const lecturerId = session!.user.id;
    const { institutionId } = await verifiedLecturer(lecturerId);
    const doc = await loadDocumentationForLecturer(reportId, institutionId);

    const pending = latestVersion(doc.versions ?? []);
    if (!pending) throw new AppError('Report not found.', 404, 'NOT_FOUND');

    if (pending.status !== SubmissionStatus.SUBMITTED) {
      throw new AppError(
        pending.status === SubmissionStatus.READY_FOR_DEMONSTRATION
          ? 'This report has already been accepted.'
          : 'This report is already back with the student.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const {
      outcome,
      scores,
      summary,
      strengths,
      concerns,
      requiredChanges,
      questionsForDemonstration,
      pageNotes,
      checklist,
    } = parsed.data;

    const accepted = outcome === DocumentationOutcome.READY_FOR_DEMONSTRATION;
    const { default: ProjectDocumentation } = await import(
      '@/lib/models/ProjectDocumentation.model'
    );

    // Conditional on the version still being the submitted one, so two
    // lecturers opening the same report produce one decision and one 409.
    const updated = await ProjectDocumentation.findOneAndUpdate(
      {
        _id: doc._id,
        versions: {
          $elemMatch: { _id: pending._id, status: SubmissionStatus.SUBMITTED },
        },
      } as object,
      {
        $set: {
          'versions.$[target].status': statusForOutcome(outcome),
          'versions.$[target].review': {
            lecturerId,
            outcome,
            scores,
            summary,
            ...(strengths ? { strengths } : {}),
            ...(concerns ? { concerns } : {}),
            ...(requiredChanges ? { requiredChanges } : {}),
            ...(questionsForDemonstration ? { questionsForDemonstration } : {}),
            pageNotes,
            checklist,
            reviewedAt: new Date(),
          },
        },
      } as object,
      { new: true, arrayFilters: [{ 'target._id': pending._id }] }
    );

    if (!updated) {
      throw new AppError(
        'This report was decided by somebody else while you were reading it.',
        409,
        'ORDER_INVALID_STATUS_TRANSITION'
      );
    }

    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');
    const engagement = await ProjectEngagement.findById(doc.engagementId)
      .select('revisionNumber')
      .lean();
    const revisionNumber = (engagement as { revisionNumber?: number } | null)?.revisionNumber ?? 0;

    // The Hub's own review record, written alongside the version's. It carries
    // the four scored dimensions and feeds the lecturer's effectiveness
    // counters, both of which predate this workflow and both of which still
    // mean what they meant — this is the assessment of the written work.
    const { default: LecturerReview } = await import('@/lib/models/LecturerReview.model');
    const { default: LecturerEffectiveness } = await import(
      '@/lib/models/LecturerEffectiveness.model'
    );

    const lecturerReview = await LecturerReview.create({
      engagementId: doc.engagementId,
      lecturerId,
      revisionNumber,
      decision: accepted ? LecturerDecision.VERIFIED : LecturerDecision.REVISION_REQUIRED,
      scores,
      comments: {
        // The rubric asks for a comment per dimension. A report review asks for
        // one summary plus what has to change, which is the more useful shape
        // for a document — so the summary stands behind each dimension rather
        // than four near-identical paragraphs being demanded of a lecturer.
        problemUnderstanding: summary,
        solutionQuality: summary,
        processQuality: summary,
        aiUsage: summary,
        overallFeedback: summary,
      },
      ...(requiredChanges ? { rejectionReason: requiredChanges } : {}),
    });

    await ProjectEngagement.updateOne({ _id: doc.engagementId } as object, {
      $set: {
        status: accepted ? ProjectStatus.READY_FOR_DEMONSTRATION : ProjectStatus.REVISION_REQUIRED,
        lecturerReviewId: lecturerReview._id,
      },
    });

    await LecturerEffectiveness.findOneAndUpdate(
      { lecturerId } as object,
      {
        $inc: {
          totalReviews: 1,
          ...(accepted ? { verifiedCount: 1 } : { revisionCount: 1 }),
        },
        $set: { lastReviewAt: new Date() },
      },
      { upsert: true }
    );

    logger.info('lecturer/reports', 'Report version reviewed', {
      reportId,
      lecturerId,
      accepted,
      versionNumber: pending.versionNumber,
      pageNotes: pageNotes.length,
    });

    void notify({
      userId: String(doc.studentId),
      type: NotificationType.REVIEW_UPDATE,
      title: accepted
        ? 'Your report was accepted — you can book your demonstration'
        : 'Your lecturer has asked for changes to your report',
      body: accepted
        ? 'Your lecturer has read your report and accepted it. The next step is to book a live demonstration and show them the system running.'
        : `Your lecturer has read your report and asked for changes${pageNotes.length > 0 ? `, with notes on ${pageNotes.length} page${pageNotes.length === 1 ? '' : 's'}` : ''}. Open your project to read what they said.`,
      relatedEntity: { kind: 'ProjectEngagement', id: String(doc.engagementId) },
    });

    return NextResponse.json({
      data: toDocumentationView(updated as unknown as never),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
