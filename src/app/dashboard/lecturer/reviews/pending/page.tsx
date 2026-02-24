import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import User from '@/lib/models/User.model';
import { Role, ProjectStatus } from '@/types';
import LecturerRubric from '@/components/educationhub/LecturerRubric';
import Link from 'next/link';

export const metadata = {
  title: 'Review Queue — UmojaHub Education',
};

export default async function LecturerReviewQueuePage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.LECTURER) {
    redirect('/auth/login');
  }

  await connectDB();

  // Load all engagements under lecturer review
  const engagements = await ProjectEngagement.find({
    status: ProjectStatus.UNDER_LECTURER_REVIEW,
  })
    .sort({ createdAt: 1 }) // Oldest first
    .limit(20)
    .lean();

  const studentIds = [...new Set(engagements.map((e) => String(e.studentId)))];
  const students = await User.find({ _id: { $in: studentIds } })
    .select('firstName lastName county studentData.universityAffiliation')
    .lean();

  const studentMap = new Map(students.map((s) => [String(s._id), s]));

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="font-heading text-t1 text-text-primary">Review Queue</h1>
        <p className="font-body text-t4 text-text-secondary mt-2">
          {engagements.length} project{engagements.length !== 1 ? 's' : ''} awaiting lecturer review.
          Oldest submissions first.
        </p>
      </div>

      {engagements.length === 0 ? (
        <div className="bg-surface-elevated border border-white/5 rounded p-8 text-center">
          <p className="font-body text-t4 text-text-secondary">
            No projects awaiting review at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {engagements.map((engagement) => {
            const brief = engagement.brief as Record<string, unknown> | undefined;
            const projectTitle =
              (brief?.projectTitle as string) ?? engagement.githubRepoName ?? 'Open Source Project';
            const student = studentMap.get(String(engagement.studentId));
            const docs = engagement.documents as {
              problemBreakdown?: { content?: string };
              approachPlan?: { content?: string };
              finalReflection?: { content?: string };
              blockerLog?: unknown[];
              aiUsageLog?: unknown[];
            };

            return (
              <div key={String(engagement._id)}>
                {/* Engagement header */}
                <div className="bg-surface-elevated border border-white/5 rounded p-6 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-heading text-t2 text-text-primary">{projectTitle}</h2>
                      {student && (
                        <p className="font-body text-t5 text-text-secondary mt-1">
                          {student.firstName} {student.lastName}
                          {student.studentData?.universityAffiliation
                            ? ` · ${student.studentData.universityAffiliation}`
                            : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="font-mono text-t6 text-accent-green border border-accent-green/30 rounded-[2px] px-2 py-0.5">
                        {engagement.tier}
                      </span>
                      <span className="font-mono text-t6 text-text-secondary">
                        {engagement.track}
                      </span>
                    </div>
                  </div>

                  {/* Process documents preview */}
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    <p className="font-mono text-t6 text-text-disabled uppercase tracking-wider">
                      Process Documents
                    </p>

                    {docs.problemBreakdown?.content && (
                      <div>
                        <p className="font-body text-t6 text-text-secondary mb-1">Problem Breakdown</p>
                        <div className="bg-surface-secondary border border-white/5 rounded-sm p-3">
                          <p className="font-body text-t6 text-text-secondary leading-relaxed line-clamp-3">
                            {docs.problemBreakdown.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {docs.approachPlan?.content && (
                      <div>
                        <p className="font-body text-t6 text-text-secondary mb-1">Approach Plan</p>
                        <div className="bg-surface-secondary border border-white/5 rounded-sm p-3">
                          <p className="font-body text-t6 text-text-secondary leading-relaxed line-clamp-3">
                            {docs.approachPlan.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {docs.finalReflection?.content && (
                      <div>
                        <p className="font-body text-t6 text-text-secondary mb-1">Final Reflection</p>
                        <div className="bg-surface-secondary border border-white/5 rounded-sm p-3">
                          <p className="font-body text-t6 text-text-secondary leading-relaxed line-clamp-3">
                            {docs.finalReflection.content}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <span className="font-body text-t6 text-text-disabled">
                        Blockers: {(docs.blockerLog ?? []).length}
                      </span>
                      <span className="font-body text-t6 text-text-disabled">
                        AI usage entries: {(docs.aiUsageLog ?? []).length}
                      </span>
                    </div>

                    {engagement.githubRepoUrl && (
                      <a
                        href={engagement.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-t6 text-accent-green hover:underline"
                      >
                        {engagement.githubRepoUrl}
                      </a>
                    )}
                  </div>
                </div>

                {/* Rubric */}
                <LecturerRubric engagementId={String(engagement._id)} />
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard"
        className="block text-center font-body text-t5 text-text-disabled hover:text-text-secondary transition-all duration-150"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
