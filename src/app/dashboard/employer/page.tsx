import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { Card, Table, THead, TH, TR, TD, Button } from '@/components/app';
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

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <Card>
      <p className="app-label text-app-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-app-ink">{value}</p>
    </Card>
  );
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="app-h1 text-app-ink">Discover talent</h1>
          <p className="app-body text-app-muted">
            Verified student portfolios, reviewed and certified by lecturers.
          </p>
        </div>
        <Link href="/dashboard/employer/talent">
          <Button variant="primary" size="md">
            Search talent
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Public portfolios available" value={publicCount} />
        <Stat label="Your recent views" value={views.length} />
      </div>

      {rows.length > 0 ? (
        <Table>
          <THead>
            <TH>Student</TH>
            <TH>Tier</TH>
            <TH>Viewed</TH>
            <TH />
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="app-body-strong text-app-ink">{r.name}</TD>
                <TD>{r.tier}</TD>
                <TD>{r.viewedAt}</TD>
                <TD className="text-right">
                  {r.slug ? (
                    <Link href={`/portfolio/${r.slug}`} className="app-link text-app-accent">
                      View
                    </Link>
                  ) : null}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      ) : (
        <Card>
          <p className="app-body text-app-muted">
            You haven&apos;t viewed any portfolios yet. Start with{' '}
            <Link href="/dashboard/employer/talent" className="app-link text-app-accent">
              Search talent
            </Link>
            .
          </p>
        </Card>
      )}
    </div>
  );
}
