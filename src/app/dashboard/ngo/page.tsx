import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { Card, Table, THead, TH, TR, TD, StatusPill } from '@/components/app';

// NGO overview — the cooperatives this NGO sponsors and the reach of that
// support. Server component reading the sponsorship graph directly.

interface CoopRow {
  id: string;
  groupName: string;
  county: string;
  memberCount: number;
  status: string;
}

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <Card>
      <p className="app-label text-app-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-app-ink">{value}</p>
    </Card>
  );
}

export default async function NgoOverviewPage(): Promise<React.ReactElement> {
  await connectDB();
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { default: NgoOrganization } = await import('@/lib/models/NgoOrganization.model');
  const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');

  const org = await NgoOrganization.findOne({ adminUserId: userId }).lean();
  const groups = org
    ? await FarmerGroup.find({ sponsoredByNgoId: org._id }).sort({ memberCount: -1 }).lean()
    : [];

  const totalMembers = groups.reduce((sum, g) => sum + (g.memberCount ?? 0), 0);
  const counties = new Set(groups.map((g) => g.county)).size;

  const rows: CoopRow[] = groups.map((g) => ({
    id: String(g._id),
    groupName: g.groupName,
    county: g.county,
    memberCount: g.memberCount ?? 0,
    status: g.status ?? 'ACTIVE',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-h1 text-app-ink">{org?.name ?? 'NGO'}</h1>
        <p className="app-body text-app-muted">
          {org?.focusAreas?.length
            ? org.focusAreas.join(' · ')
            : 'Cooperatives you sponsor on UmojaHub.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Cooperatives sponsored" value={groups.length} />
        <Stat label="Farmers reached" value={totalMembers} />
        <Stat label="Counties" value={counties} />
      </div>

      {rows.length > 0 ? (
        <Table>
          <THead>
            <TH>Cooperative</TH>
            <TH>County</TH>
            <TH className="text-right">Members</TH>
            <TH>Status</TH>
          </THead>
          <tbody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="app-body-strong text-app-ink">{r.groupName}</TD>
                <TD>{r.county}</TD>
                <TD className="text-right app-data-m">{r.memberCount}</TD>
                <TD>
                  <StatusPill
                    state={r.status === 'ACTIVE' ? 'verified' : 'denied'}
                    label={r.status}
                  />
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      ) : (
        <Card>
          <p className="app-body text-app-muted">
            No sponsored cooperatives yet. Cooperatives you support will appear here.
          </p>
        </Card>
      )}
    </div>
  );
}
