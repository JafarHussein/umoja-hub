import React from 'react';
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
  StatusPill,
} from '@/components/app';

// NGO overview — the cooperatives this NGO sponsors and the reach of that
// support. Server component reading the sponsorship graph directly.

interface CoopRow {
  id: string;
  groupName: string;
  county: string;
  memberCount: number;
  status: string;
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
    <Page>
      <PageHeader
        title={org?.name ?? 'NGO'}
        description="The cooperatives your organisation sponsors on UmojaHub, and how far that support reaches."
        meta={
          org?.focusAreas?.length ? (
            <>
              {org.focusAreas.map((area) => (
                <span key={area}>{area}</span>
              ))}
            </>
          ) : undefined
        }
      />

      <MetricGrid columns={3}>
        <MetricTile
          label="Cooperatives sponsored"
          value={groups.length}
          emphasis
          caption="Groups receiving your support on the platform."
        />
        <MetricTile
          label="Farmers reached"
          value={totalMembers}
          caption="Individual members across every cooperative you sponsor."
        />
        <MetricTile
          label="Counties"
          value={counties}
          caption="Geographic spread of your programme."
        />
      </MetricGrid>

      <PageSection title="Sponsored cooperatives">
        {rows.length > 0 ? (
          <Table layout="fixed">
            <THead>
              <TH className="w-[40%]">Cooperative</TH>
              <TH className="w-[22%]">County</TH>
              <TH className="w-[16%] text-right">Members</TH>
              <TH className="w-[22%]">Status</TH>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="app-body-strong text-app-ink">{r.groupName}</TD>
                  <TD>{r.county}</TD>
                  <TD className="app-data-m text-right">{r.memberCount}</TD>
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
          <EmptyState
            title="No cooperatives are linked to your organisation yet"
            description="Once an administrator attaches a cooperative to your sponsorship, it appears here with its membership and county — and the reach figures above start counting."
            hints={[
              {
                label: 'See market health',
                href: '/dashboard/ngo/market-health',
                description: 'county-level price and supply conditions',
              },
            ]}
          />
        )}
      </PageSection>
    </Page>
  );
}
