import React from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { notify } from '@/lib/notifications/notify';
import { Card } from '@/components/app';
import { Role, PortfolioVisibility, NotificationType } from '@/types';

// Public, shareable student portfolio page. Reachable by slug when the portfolio
// is PUBLIC. An authenticated EMPLOYER view is recorded (PortfolioView) and the
// student is notified. This is the human-facing counterpart to
// GET /api/portfolio/[slug].

interface VerifiedProject {
  title?: string;
  tier?: string;
  techStack?: string[];
  verifiedAt?: Date;
  averageScore?: number;
  lecturerInstitution?: string;
}

interface VerifiedSkill {
  skillName?: string;
  category?: string;
  tierDemonstrated?: string;
}

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  await connectDB();
  const { slug } = await params;

  const { default: StudentPortfolioStatus } = await import(
    '@/lib/models/StudentPortfolioStatus.model'
  );
  const { default: User } = await import('@/lib/models/User.model');
  const { default: PortfolioView } = await import('@/lib/models/PortfolioView.model');

  const portfolio = await StudentPortfolioStatus.findOne({
    publicSlug: slug,
    visibility: PortfolioVisibility.PUBLIC,
  }).lean();

  if (!portfolio) {
    notFound();
  }

  const student = await User.findById(portfolio.studentId)
    .select('firstName lastName profilePhotoUrl bio county studentData.universityAffiliation')
    .lean();

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;
  const isEmployerView =
    session?.user?.role === Role.EMPLOYER &&
    viewerId &&
    String(viewerId) !== String(portfolio.studentId);

  if (isEmployerView) {
    void (async () => {
      await PortfolioView.create({
        studentId: portfolio.studentId,
        viewerId,
        viewerRole: Role.EMPLOYER,
        viewedAt: new Date(),
      });
      await notify({
        userId: portfolio.studentId,
        type: NotificationType.PORTFOLIO_VIEW,
        title: 'An employer viewed your portfolio',
        body: 'Your public portfolio was opened by an employer on UmojaHub.',
        relatedEntity: { kind: 'User', id: portfolio.studentId },
      });
    })().catch(() => {});
  }

  const viewCount = await PortfolioView.countDocuments({ studentId: portfolio.studentId });
  const projects = (portfolio.verifiedProjects ?? []) as VerifiedProject[];
  const skills = (portfolio.verifiedSkills ?? []) as VerifiedSkill[];
  const fullName = student ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() : 'Student';

  return (
    <div className="theme-app min-h-screen bg-app-canvas px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex items-center gap-4">
          {student?.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.profilePhotoUrl}
              alt={fullName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-app-sunken text-xl font-semibold text-app-ink">
              {fullName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="app-h1 text-app-ink">{fullName}</h1>
            <p className="app-body text-app-muted">
              {portfolio.currentTier} · {portfolio.portfolioStrength}
              {student?.studentData?.universityAffiliation
                ? ` · ${student.studentData.universityAffiliation}`
                : ''}
            </p>
          </div>
        </header>

        {student?.bio && (
          <Card>
            <p className="app-body text-app-body">{student.bio}</p>
          </Card>
        )}

        <div className="flex gap-4">
          <Card className="flex-1 text-center">
            <p className="text-2xl font-semibold text-app-ink">{projects.length}</p>
            <p className="app-label text-app-muted">Verified projects</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="text-2xl font-semibold text-app-ink">{skills.length}</p>
            <p className="app-label text-app-muted">Verified skills</p>
          </Card>
          <Card className="flex-1 text-center">
            <p className="text-2xl font-semibold text-app-ink">{viewCount}</p>
            <p className="app-label text-app-muted">Profile views</p>
          </Card>
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span
                key={`${s.skillName}-${i}`}
                className="rounded-app-control border border-app-hairline bg-app-card px-3 py-1 app-label text-app-body"
              >
                {s.skillName}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="app-h2 text-app-ink">Verified projects</h2>
          {projects.length > 0 ? (
            projects.map((p, i) => (
              <Card key={`${p.title}-${i}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="app-body-strong text-app-ink">{p.title ?? 'Project'}</p>
                    <p className="app-label text-app-muted">
                      {p.tier}
                      {p.lecturerInstitution ? ` · verified by ${p.lecturerInstitution}` : ''}
                    </p>
                  </div>
                  {typeof p.averageScore === 'number' && (
                    <span className="app-data-m text-app-ink">{p.averageScore.toFixed(1)}/5</span>
                  )}
                </div>
                {p.techStack && p.techStack.length > 0 && (
                  <p className="mt-2 app-body text-app-muted">{p.techStack.join(' · ')}</p>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <p className="app-body text-app-muted">No verified projects yet.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
