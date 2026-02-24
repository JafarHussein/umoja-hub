import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import { Role } from '@/types';
import BriefDisplay from '@/components/educationhub/BriefDisplay';
import ProcessDocumentForm from '@/components/educationhub/ProcessDocumentForm';
import Link from 'next/link';
import SubmitButton from './SubmitButton';

interface IPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Project Workspace — UmojaHub Education',
};

export default async function ProjectWorkspacePage({ params }: IPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    redirect('/auth/login');
  }

  await connectDB();
  const engagement = await ProjectEngagement.findOne({
    _id: id,
    studentId: session.user.id,
  }).lean();

  if (!engagement) notFound();

  const brief = engagement.brief as Record<string, unknown> | undefined;
  const docs = engagement.documents as {
    problemBreakdown?: { content?: string; hash?: string; submittedAt?: Date };
    approachPlan?: { content?: string; hash?: string; submittedAt?: Date };
    finalReflection?: { content?: string; hash?: string; submittedAt?: Date };
    blockerLog?: unknown[];
    aiUsageLog?: unknown[];
  };

  const serialisedDocs = {
    ...(docs.problemBreakdown
      ? {
          problemBreakdown: {
            content: docs.problemBreakdown.content ?? '',
            hash: docs.problemBreakdown.hash ?? '',
            ...(docs.problemBreakdown.submittedAt
              ? { submittedAt: docs.problemBreakdown.submittedAt.toISOString() }
              : {}),
          },
        }
      : {}),
    ...(docs.approachPlan
      ? {
          approachPlan: {
            content: docs.approachPlan.content ?? '',
            hash: docs.approachPlan.hash ?? '',
            ...(docs.approachPlan.submittedAt
              ? { submittedAt: docs.approachPlan.submittedAt.toISOString() }
              : {}),
          },
        }
      : {}),
    ...(docs.finalReflection
      ? {
          finalReflection: {
            content: docs.finalReflection.content ?? '',
            hash: docs.finalReflection.hash ?? '',
            ...(docs.finalReflection.submittedAt
              ? { submittedAt: docs.finalReflection.submittedAt.toISOString() }
              : {}),
          },
        }
      : {}),
    blockerLog: (docs.blockerLog ?? []) as Array<{
      stuckOn: string;
      resolution: string;
      durationHours: number;
    }>,
    aiUsageLog: (docs.aiUsageLog ?? []) as Array<{
      toolUsed: string;
      prompt: string;
      outputReceived: string;
      studentAction: string;
    }>,
  };

  const statusLabels: Record<string, string> = {
    IN_PROGRESS: 'In Progress',
    UNDER_PEER_REVIEW: 'Under Peer Review',
    UNDER_LECTURER_REVIEW: 'Under Lecturer Review',
    VERIFIED: 'Verified',
    REVISION_REQUIRED: 'Revision Required',
    DENIED: 'Denied',
  };

  const isEditable = engagement.status === 'IN_PROGRESS';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-t1 text-text-primary">
            {brief?.projectTitle
              ? String(brief.projectTitle)
              : engagement.githubRepoName ?? 'Open Source Project'}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-t6 text-text-secondary border border-white/10 rounded-[2px] px-2 py-0.5">
              {engagement.track}
            </span>
            <span className="font-mono text-t6 text-accent-green border border-accent-green/30 rounded-[2px] px-2 py-0.5">
              {engagement.tier}
            </span>
            <span className="font-mono text-t6 text-text-secondary">
              {statusLabels[engagement.status] ?? engagement.status}
            </span>
          </div>
        </div>
        <Link
          href={`/dashboard/student/projects/${id}/mentor`}
          className="px-4 py-2 bg-surface-secondary border border-white/10 text-text-secondary rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px] flex items-center"
        >
          AI Mentor
        </Link>
      </div>

      {/* Brief (AI_BRIEF track) */}
      {brief && engagement.track === 'AI_BRIEF' && (
        <section>
          <h2 className="font-heading text-t2 text-text-primary mb-4">Project Brief</h2>
          <BriefDisplay
            brief={
              brief as Parameters<typeof BriefDisplay>[0]['brief']
            }
            tier={engagement.tier}
          />
        </section>
      )}

      {/* GitHub repo info (OPEN_SOURCE track) */}
      {engagement.track === 'OPEN_SOURCE' && engagement.githubRepoUrl && (
        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h2 className="font-heading text-t2 text-text-primary mb-3">Repository</h2>
          <a
            href={engagement.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-t5 text-accent-green hover:underline break-all"
          >
            {engagement.githubRepoUrl}
          </a>
        </div>
      )}

      {/* Process Documents */}
      <section>
        <h2 className="font-heading text-t2 text-text-primary mb-4">Process Documents</h2>
        {isEditable ? (
          <ProcessDocumentForm engagementId={id} documents={serialisedDocs} />
        ) : (
          <div className="bg-surface-elevated border border-white/5 rounded p-6">
            <p className="font-body text-t4 text-text-secondary">
              This project is {statusLabels[engagement.status] ?? engagement.status}. Documents can only be edited while the project is In Progress.
            </p>
            {engagement.verificationUrl && (
              <Link
                href={engagement.verificationUrl}
                className="mt-4 inline-block font-body text-t5 text-accent-green hover:underline"
              >
                View public verification record
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Submit button */}
      {isEditable && (
        <SubmitProjectButton engagementId={id} />
      )}
    </div>
  );
}

function SubmitProjectButton({ engagementId }: { engagementId: string }) {
  return (
    <div className="bg-surface-elevated border border-white/5 rounded p-6">
      <h2 className="font-heading text-t2 text-text-primary mb-2">Submit for Review</h2>
      <p className="font-body text-t5 text-text-secondary mb-4">
        When all 5 process documents are complete, submit your project for peer and lecturer review.
        Your GitHub commits will be verified at this point.
      </p>
      <SubmitButton engagementId={engagementId} />
    </div>
  );
}
