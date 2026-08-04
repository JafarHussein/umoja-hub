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
import { Role } from '@/types';

// Institution overview — the students and lecturers hosted by this institution.
// Server component reading the affiliation graph directly.

interface MemberRow {
  id: string;
  name: string;
  role: string;
  detail: string;
  verified: boolean;
}

export default async function InstitutionOverviewPage(): Promise<React.ReactElement> {
  await connectDB();
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const { default: Institution } = await import('@/lib/models/Institution.model');
  const { default: User } = await import('@/lib/models/User.model');

  const institution = await Institution.findOne({ adminUserId: userId }).lean();

  const members = institution
    ? await User.find({
        $or: [
          { role: Role.STUDENT, 'studentData.institutionId': institution._id },
          { role: Role.LECTURER, 'lecturerData.institutionId': institution._id },
        ],
      })
        .select('firstName lastName role studentData lecturerData')
        .lean()
    : [];

  const students = members.filter((m) => m.role === Role.STUDENT);
  const lecturers = members.filter((m) => m.role === Role.LECTURER);

  const rows: MemberRow[] = members.map((m) => ({
    id: String(m._id),
    name: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim(),
    role: m.role === Role.LECTURER ? 'Lecturer' : 'Student',
    detail:
      m.role === Role.LECTURER
        ? (m.lecturerData?.departmentAssignment ?? '—')
        : (m.studentData?.currentTier ?? '—'),
    verified:
      m.role === Role.LECTURER
        ? Boolean(m.lecturerData?.isVerified)
        : Boolean(m.studentData?.institutionalEmailVerified),
  }));

  return (
    <Page>
      <PageHeader
        title={institution?.name ?? 'Institution'}
        description="The students and lecturers affiliated with your institution, and where each stands on verification."
        meta={
          institution?.county ? (
            <>
              <span>{institution.type ?? 'Institution'}</span>
              <span>{institution.county}</span>
            </>
          ) : undefined
        }
      />

      <MetricGrid columns={3}>
        <MetricTile
          label="Students"
          value={students.length}
          emphasis
          caption="Enrolled and doing reviewed engineering work under your name."
        />
        <MetricTile
          label="Lecturers"
          value={lecturers.length}
          caption="Academics able to review and sign off student work."
        />
        <MetricTile
          label="Total members"
          value={members.length}
          caption="Everyone affiliated with your institution on UmojaHub."
        />
      </MetricGrid>

      <PageSection title="Affiliated members">
        {rows.length > 0 ? (
          <Table layout="fixed">
            <THead>
              <TH className="w-[30%]">Name</TH>
              <TH className="w-[18%]">Role</TH>
              <TH className="w-[32%]">Detail</TH>
              <TH className="w-[20%]">Status</TH>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="app-body-strong text-app-ink">{r.name || '—'}</TD>
                  <TD>{r.role}</TD>
                  <TD>{r.detail}</TD>
                  <TD>
                    <StatusPill
                      state={r.verified ? 'verified' : 'pending'}
                      label={r.verified ? 'Verified' : 'Pending'}
                    />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="Nobody is affiliated with your institution yet"
            description="Students who verify with an email on your domain, and lecturers an administrator links to you, will be listed here with their verification status."
          />
        )}
      </PageSection>
    </Page>
  );
}
