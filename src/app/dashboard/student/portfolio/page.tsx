import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import StudentPortfolioStatus from '@/lib/models/StudentPortfolioStatus.model';
import User from '@/lib/models/User.model';
import { Role } from '@/types';
import PortfolioPage from '@/components/educationhub/PortfolioPage';
import Link from 'next/link';

export const metadata = {
  title: 'My Portfolio — UmojaHub Education',
};

export default async function StudentPortfolioPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.STUDENT) {
    redirect('/auth/login');
  }

  await connectDB();

  const [student, portfolio] = await Promise.all([
    User.findById(session.user.id)
      .select('firstName lastName county studentData createdAt')
      .lean(),
    StudentPortfolioStatus.findOne({ studentId: session.user.id }).lean(),
  ]);

  if (!student) redirect('/auth/login');

  if (!portfolio) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="font-heading text-t1 text-text-primary mb-4">My Portfolio</h1>
        <div className="bg-surface-elevated border border-white/5 rounded p-8 text-center">
          <p className="font-body text-t4 text-text-secondary mb-4">
            Your portfolio will appear here once you start your first project.
          </p>
          <Link
            href="/dashboard/student/projects/new"
            className="px-6 py-3 bg-accent-green text-white font-body text-t4 rounded-sm hover:opacity-90 transition-all duration-150 inline-block min-h-[44px]"
          >
            Start a Project
          </Link>
        </div>
      </div>
    );
  }

  const serialisedPortfolio = {
    currentTier: portfolio.currentTier,
    portfolioStrength: portfolio.portfolioStrength,
    stats: portfolio.stats as {
      verifiedProjectCount: number;
      totalProjectCount: number;
      techStacksUsed: string[];
      reviewerInstitutions: string[];
    },
    verifiedProjects: (portfolio.verifiedProjects as Array<{
      engagementId: unknown;
      title: string;
      tier: string;
      techStack: string[];
      verifiedAt: Date;
      averageScore: number;
      lecturerInstitution: string;
    }>).map((p) => ({
      engagementId: String(p.engagementId),
      title: p.title,
      tier: p.tier,
      techStack: p.techStack,
      verifiedAt: p.verifiedAt.toISOString(),
      averageScore: p.averageScore,
      lecturerInstitution: p.lecturerInstitution,
    })),
    verifiedSkills: (portfolio.verifiedSkills as Array<{
      skillName: string;
      category: string;
      tierDemonstrated: string;
      firstVerifiedAt: Date;
      projectTitle: string;
      engagementId: unknown;
    }>).map((s) => ({
      skillName: s.skillName,
      category: s.category,
      tierDemonstrated: s.tierDemonstrated,
      firstVerifiedAt: s.firstVerifiedAt.toISOString(),
      projectTitle: s.projectTitle,
      engagementId: String(s.engagementId),
    })),
    tierProgressionTimeline: (portfolio.tierProgressionTimeline as Array<{
      tier: string;
      unlockedAt: Date;
    }>).map((t) => ({
      tier: t.tier,
      unlockedAt: t.unlockedAt.toISOString(),
    })),
    lastRecalculatedAt: portfolio.lastRecalculatedAt?.toISOString() ?? null,
  };

  const studentInfo = {
    firstName: student.firstName,
    lastName: student.lastName,
    county: student.county,
    universityAffiliation: student.studentData?.universityAffiliation ?? null,
    githubUsername: student.studentData?.githubUsername ?? null,
    memberSince: (student.createdAt as Date).toISOString(),
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-t1 text-text-primary">My Portfolio</h1>
        <Link
          href={`/experience/portfolio/${student.email}`}
          className="px-4 py-2 bg-surface-secondary border border-white/10 text-text-secondary rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px] flex items-center"
          target="_blank"
        >
          Public view
        </Link>
      </div>

      <PortfolioPage
        student={studentInfo}
        portfolio={serialisedPortfolio}
        verificationBaseUrl=""
      />
    </div>
  );
}
