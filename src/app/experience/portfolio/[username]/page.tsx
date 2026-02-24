import { notFound } from 'next/navigation';
import PortfolioPage from '@/components/educationhub/PortfolioPage';

interface IPageProps {
  params: Promise<{ username: string }>;
}

interface IPortfolioApiResponse {
  data?: {
    student: {
      firstName: string;
      lastName: string;
      county: string;
      universityAffiliation: string | null;
      githubUsername: string | null;
      memberSince: string;
    };
    portfolio: {
      currentTier: string;
      portfolioStrength: string;
      stats: {
        verifiedProjectCount: number;
        totalProjectCount: number;
        techStacksUsed: string[];
        reviewerInstitutions: string[];
      };
      verifiedProjects: Array<{
        engagementId: string;
        title: string;
        tier: string;
        techStack: string[];
        verifiedAt: string;
        averageScore: number;
        lecturerInstitution: string;
      }>;
      verifiedSkills: Array<{
        skillName: string;
        category: string;
        tierDemonstrated: string;
        firstVerifiedAt: string;
        projectTitle: string;
        engagementId: string;
      }>;
      tierProgressionTimeline: Array<{ tier: string; unlockedAt: string }>;
      lastRecalculatedAt: string | null;
    };
  };
  error?: string;
}

async function fetchPortfolio(username: string): Promise<IPortfolioApiResponse['data'] | null> {
  try {
    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/education/portfolio/${encodeURIComponent(username)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as IPortfolioApiResponse;
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: IPageProps) {
  const { username } = await params;
  const data = await fetchPortfolio(username);
  if (!data) return { title: 'Portfolio Not Found — UmojaHub' };

  return {
    title: `${data.student.firstName} ${data.student.lastName} — Portfolio · UmojaHub`,
    description: `${data.student.firstName}'s verified project portfolio on UmojaHub Education. ${data.portfolio.stats.verifiedProjectCount} verified project${data.portfolio.stats.verifiedProjectCount !== 1 ? 's' : ''}.`,
  };
}

export default async function PublicPortfolioPage({ params }: IPageProps) {
  const { username } = await params;
  const data = await fetchPortfolio(username);

  if (!data) notFound();

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-2">
        <div className="flex items-center justify-between mb-8">
          <p className="font-body text-t6 text-text-disabled">
            UmojaHub Education · Verified Portfolio
          </p>
        </div>

        <PortfolioPage
          student={data.student}
          portfolio={data.portfolio}
          verificationBaseUrl=""
        />

        <p className="text-center font-body text-t6 text-text-disabled pt-8">
          Portfolio verified by UmojaHub Education · umojahub.co.ke
        </p>
      </div>
    </div>
  );
}
