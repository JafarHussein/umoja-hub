import { notFound } from 'next/navigation';

interface IPageProps {
  params: Promise<{ projectId: string }>;
}

interface IVerifyResponse {
  data?: {
    verificationUrl: string;
    verifiedAt: string | null;
    project: {
      id: string;
      title: string;
      track: string;
      tier: string;
      githubRepoUrl: string | null;
      brief?: {
        projectTitle: string;
        problemStatement: string;
        suggestedTechStack: string[];
        industryContext: string;
      } | null;
    };
    student: {
      firstName: string;
      lastName: string;
      county: string;
      universityAffiliation: string | null;
      githubUsername: string | null;
    };
    review: {
      decision: string;
      scores: {
        problemUnderstanding: number;
        solutionQuality: number;
        processQuality: number;
        aiUsage: number;
      };
      lecturerName: string;
      lecturerInstitution: string | null;
      reviewedAt: string;
    } | null;
    peerReview: {
      status: string;
      scores: {
        codeQuality?: number;
        documentationClarity?: number;
      };
    } | null;
    integrity: {
      documentHashes: {
        problemBreakdown: string;
        approachPlan: string;
        finalReflection: string;
      };
      recordedAt: string;
    } | null;
  };
  error?: string;
}

async function fetchVerification(projectId: string): Promise<IVerifyResponse['data'] | null> {
  try {
    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/experience/verify/${projectId}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) return null;
    const data = (await res.json()) as IVerifyResponse;
    return data.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: IPageProps) {
  const { projectId } = await params;
  const data = await fetchVerification(projectId);
  if (!data) return { title: 'Not Found — UmojaHub' };

  return {
    title: `${data.project.title} — Verified Project · UmojaHub`,
    description: `Verified project by ${data.student.firstName} ${data.student.lastName} on UmojaHub Education.`,
  };
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-green transition-all duration-150"
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
      <span className="font-mono text-t6 text-text-secondary w-8 text-right">
        {score}/{max}
      </span>
    </div>
  );
}

export default async function VerifyProjectPage({ params }: IPageProps) {
  const { projectId } = await params;
  const data = await fetchVerification(projectId);

  if (!data) notFound();

  const avgScore = data.review
    ? (Object.values(data.review.scores).reduce((a, b) => a + b, 0) / 4).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
        {/* Verification badge */}
        <div className="bg-surface-elevated border border-accent-green/20 rounded p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12L9 17L20 6"
                stroke="#007F4E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="font-mono text-t5 text-accent-green uppercase tracking-wider">
              Verified Project
            </p>
          </div>
          <h1 className="font-heading text-t1 text-text-primary mb-2">{data.project.title}</h1>
          <p className="font-body text-t5 text-text-secondary">
            {data.project.brief?.industryContext ?? data.project.track}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="font-mono text-t6 text-text-secondary border border-white/10 rounded-[2px] px-2 py-0.5">
              {data.project.track}
            </span>
            <span className="font-mono text-t6 text-accent-green border border-accent-green/30 rounded-[2px] px-2 py-0.5">
              {data.project.tier}
            </span>
            {data.verifiedAt && (
              <span className="font-mono text-t6 text-text-disabled">
                Verified{' '}
                {new Date(data.verifiedAt).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Student */}
        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-wider mb-3">
            Student
          </p>
          <p className="font-heading text-t2 text-text-primary">
            {data.student.firstName} {data.student.lastName}
          </p>
          {data.student.universityAffiliation && (
            <p className="font-body text-t5 text-text-secondary mt-1">
              {data.student.universityAffiliation}
            </p>
          )}
          <p className="font-body text-t5 text-text-secondary">{data.student.county}</p>
          {data.student.githubUsername && (
            <a
              href={`https://github.com/${data.student.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-t6 text-accent-green hover:underline mt-1 block"
            >
              github.com/{data.student.githubUsername}
            </a>
          )}
        </div>

        {/* Lecturer review */}
        {data.review && (
          <div className="bg-surface-elevated border border-white/5 rounded p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-wider mb-4">
              Lecturer Review
            </p>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="font-body text-t5 text-text-primary">{data.review.lecturerName}</p>
                {data.review.lecturerInstitution && (
                  <p className="font-body text-t6 text-text-secondary">{data.review.lecturerInstitution}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-t2 text-text-primary">{avgScore}</p>
                <p className="font-body text-t6 text-text-disabled">avg score</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { key: 'problemUnderstanding', label: 'Problem Understanding' },
                { key: 'solutionQuality', label: 'Solution Quality' },
                { key: 'processQuality', label: 'Process Quality' },
                { key: 'aiUsage', label: 'AI Usage' },
              ].map((dim) => (
                <div key={dim.key}>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-t6 text-text-secondary">{dim.label}</span>
                  </div>
                  <ScoreBar
                    score={data.review!.scores[dim.key as keyof typeof data.review.scores]}
                  />
                </div>
              ))}
            </div>

            <p className="font-body text-t6 text-text-disabled mt-4">
              Reviewed on{' '}
              {new Date(data.review.reviewedAt).toLocaleDateString('en-KE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Tech stack */}
        {data.project.brief?.suggestedTechStack && (
          <div className="bg-surface-elevated border border-white/5 rounded p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-wider mb-3">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {data.project.brief.suggestedTechStack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-t5 text-text-secondary bg-surface-secondary border border-white/5 rounded-[2px] px-3 py-1"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Integrity */}
        {data.integrity && (
          <div className="bg-surface-elevated border border-white/5 rounded p-6">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-wider mb-3">
              Document Integrity Hashes
            </p>
            <p className="font-body text-t6 text-text-disabled mb-3">
              SHA-256 hashes recorded at time of submission. These cannot be changed.
            </p>
            <div className="space-y-2">
              {Object.entries(data.integrity.documentHashes).map(([key, hash]) => (
                <div key={key} className="flex gap-3 items-start">
                  <span className="font-body text-t6 text-text-secondary capitalize flex-shrink-0 w-28">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span className="font-mono text-t6 text-text-disabled break-all">{hash}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GitHub link */}
        {data.project.githubRepoUrl && (
          <div className="text-center">
            <a
              href={data.project.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-t5 text-accent-green hover:underline"
            >
              View GitHub Repository
            </a>
          </div>
        )}

        <p className="text-center font-body text-t6 text-text-disabled">
          This verification record is permanent and publicly accessible.
          <br />
          Issued by UmojaHub Education · umojahub.co.ke
        </p>
      </div>
    </div>
  );
}
