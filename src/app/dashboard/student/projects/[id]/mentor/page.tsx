import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import User from '@/lib/models/User.model';
import { Role } from '@/types';
import AIMentorChat from '@/components/educationhub/AIMentorChat';
import Link from 'next/link';

interface IPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'AI Mentor — UmojaHub Education',
};

export default async function MentorPage({ params }: IPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    redirect('/auth/login');
  }

  await connectDB();

  const [engagement, student] = await Promise.all([
    ProjectEngagement.findOne({
      _id: id,
      studentId: session.user.id,
    }).lean(),
    User.findById(session.user.id).select('firstName').lean(),
  ]);

  if (!engagement) notFound();

  const brief = engagement.brief as
    | {
        projectTitle?: string;
        problemStatement?: string;
        kenyanConstraints?: string[];
      }
    | undefined;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-t1 text-text-primary">AI Mentor</h1>
          <p className="font-body text-t4 text-text-secondary mt-1">
            {brief?.projectTitle ?? engagement.githubRepoName ?? 'Open Source Project'}
          </p>
        </div>
        <Link
          href={`/dashboard/student/projects/${id}`}
          className="px-4 py-2 bg-surface-secondary border border-white/10 text-text-secondary rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px] flex items-center"
        >
          Back to Project
        </Link>
      </div>

      <div className="h-[600px]">
        <AIMentorChat
          engagementId={id}
          studentName={student?.firstName ?? 'Student'}
          {...(brief ? { brief } : {})}
          tier={engagement.tier}
        />
      </div>
    </div>
  );
}
