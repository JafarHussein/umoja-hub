import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import {
  EmptyState,
  MetricGrid,
  MetricTile,
  Page,
  PageHeader,
  PageSection,
  Table,
  THead,
  TH,
  TR,
  TD,
  Button,
} from '@/components/app';
import { PortfolioVisibility } from '@/types';

// Employer overview — discover verified student talent. Shows how many public
// portfolios are available and this employer's recent views, with a path into
// the talent search.

interface ViewRow {
  id: string;
  name: string;
  tier: string;
  slug: string | undefined;
  viewedAt: string;
}

export default async function EmployerOverviewPage(): Promise<React.ReactElement> {
  await connectDB();
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { default: StudentPortfolioStatus } = await import(
    '@/lib/models/StudentPortfolioStatus.model'
  );
  const { default: PortfolioView } = await import('@/lib/models/PortfolioView.model');
  const { default: User } = await import('@/lib/models/User.model');

  const [publicCount, views] = await Promise.all([
    StudentPortfolioStatus.countDocuments({ visibility: PortfolioVisibility.PUBLIC }),
    PortfolioView.find({ viewerId: userId }).sort({ viewedAt: -1 }).limit(10).lean(),
  ]);

  const studentIds = views.map((v) => v.studentId);
  const [students, portfolios] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).select('firstName lastName').lean(),
    StudentPortfolioStatus.find({ studentId: { $in: studentIds } })
      .select('studentId currentTier publicSlug')
      .lean(),
  ]);
  const nameById = new Map(students.map((s) => [String(s._id), `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim()]));
  const portfolioByStudent = new Map(portfolios.map((p) => [String(p.studentId), p]));

  const rows: ViewRow[] = views.map((v) => {
    const p = portfolioByStudent.get(String(v.studentId));
    return {
      id: String(v._id),
      name: nameById.get(String(v.studentId)) || '—',
      tier: p?.currentTier ?? '—',
      slug: p?.publicSlug ?? undefined,
      viewedAt: v.viewedAt ? new Date(v.viewedAt).toLocaleDateString() : '—',
    };
  });

  return (
    <Page>
      <PageHeader
        title="Discover talent"
        description="Student portfolios where every project has been reviewed and signed off by a lecturer. What you are looking at is checked work, not a self-reported CV."
        actions={
          <Link href="/dashboard/employer/talent">
            <Button variant="primary">Search talent</Button>
          </Link>
        }
      />

      <MetricGrid columns={2}>
        <MetricTile
          label="Public portfolios available"
          value={publicCount}
          emphasis
          caption="Students who have opened their verified work to employers."
        />
        <MetricTile
          label="Your recent views"
          value={views.length}
          caption="Portfolios you have opened. Students are not told who viewed them."
        />
      </MetricGrid>

      <PageSection title="Recently viewed">
        {rows.length > 0 ? (
          <Table layout="fixed">
            <THead>
              <TH className="w-[40%]">Student</TH>
              <TH className="w-[22%]">Tier</TH>
              <TH className="w-[22%]">Viewed</TH>
              <TH className="w-[16%] text-right">
                <span className="sr-only">Actions</span>
              </TH>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="app-body-strong text-app-ink">{r.name}</TD>
                  <TD>{r.tier}</TD>
                  <TD>{r.viewedAt}</TD>
                  <TD className="text-right">
                    {r.slug ? (
                      <Link
                        href={`/portfolio/${r.slug}`}
                        className="app-body-strong text-app-brand hover:text-app-brand-hover"
                      >
                        View
                      </Link>
                    ) : null}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="You haven't opened a portfolio yet"
            description="Portfolios you look at are kept here so you can return to a candidate without searching for them again. Start with a search — you can filter by tier, technology and institution."
            action={{ label: 'Search talent', href: '/dashboard/employer/talent' }}
          />
        )}
      </PageSection>
    </Page>
  );
}
