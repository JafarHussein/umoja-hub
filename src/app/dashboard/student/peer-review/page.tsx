import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import PeerReview from '@/lib/models/PeerReview.model';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import { Role, PeerReviewStatus } from '@/types';
import PeerReviewForm from '@/components/educationhub/PeerReviewForm';
import Link from 'next/link';

export const metadata = {
  title: 'Peer Reviews — UmojaHub Education',
};

export default async function PeerReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    redirect('/auth/login');
  }

  await connectDB();

  // Find all peer reviews assigned to this student (as reviewer)
  const assignedReviews = await PeerReview.find({
    reviewerId: session.user.id,
    status: PeerReviewStatus.ASSIGNED,
  }).lean();

  // Load the corresponding engagements
  const engagementIds = assignedReviews.map((r) => r.engagementId);
  const engagements = await ProjectEngagement.find({
    _id: { $in: engagementIds },
  }).lean();

  const engagementMap = new Map(engagements.map((e) => [String(e._id), e]));

  const pendingReviews = assignedReviews.map((review) => ({
    reviewId: String(review._id),
    engagementId: String(review.engagementId),
    engagement: engagementMap.get(String(review.engagementId)),
  }));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="font-heading text-t1 text-text-primary">Peer Reviews</h1>
        <p className="font-body text-t4 text-text-secondary mt-2">
          Projects assigned to you for peer review.
        </p>
      </div>

      {pendingReviews.length === 0 ? (
        <div className="bg-surface-elevated border border-white/5 rounded p-8 text-center">
          <p className="font-body text-t4 text-text-secondary mb-2">
            No pending peer reviews
          </p>
          <p className="font-body text-t5 text-text-disabled">
            You will be notified when a project is assigned to you for review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingReviews.map(({ engagementId, engagement }) => {
            const brief = engagement?.brief as Record<string, unknown> | undefined;
            const projectTitle =
              (brief?.projectTitle as string) ?? engagement?.githubRepoName ?? 'Open Source Project';

            return (
              <div key={engagementId}>
                <div className="bg-surface-elevated border border-white/5 rounded p-4 mb-4">
                  <h3 className="font-heading text-t3 text-text-primary">{projectTitle}</h3>
                  <div className="flex gap-3 mt-1">
                    <span className="font-mono text-t6 text-text-secondary">
                      {engagement?.track}
                    </span>
                    <span className="font-mono text-t6 text-accent-green">
                      {engagement?.tier}
                    </span>
                  </div>
                  {engagement?.githubRepoUrl && (
                    <a
                      href={engagement.githubRepoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-t6 text-accent-green hover:underline mt-2 block"
                    >
                      {engagement.githubRepoUrl}
                    </a>
                  )}
                </div>
                <PeerReviewForm engagementId={engagementId} />
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard/student/projects/new"
        className="block text-center font-body text-t5 text-text-disabled hover:text-text-secondary transition-all duration-150"
      >
        Start your own project
      </Link>
    </div>
  );
}
