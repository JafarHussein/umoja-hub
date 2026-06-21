import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { Card, Table, THead, TH, TR, TD, StatusPill } from '@/components/app';
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

function Stat({ label, value }: { label: string; value: string | number }): React.ReactElement {
  return (
    <Card>
      <p className="app-label text-app-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-app-ink">{value}</p>
    </Card>
  );
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
    <div className="space-y-6">
      <div>
        <h1 className="app-h1 text-app-ink">{institution?.name ?? 'Institution'}</h1>
        <p className="app-body text-app-muted">
          {institution?.county
            ? `${institution.type ?? 'Institution'} · ${institution.county}`
            : 'Students and lecturers affiliated with your institution.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Students" value={students.length} />
        <Stat label="Lecturers" value={lecturers.length} />
        <Stat label="Members" value={members.length} />
      </div>

      {rows.length > 0 ? (
        <Table>
          <THead>
            <TH>Name</TH>
            <TH>Role</TH>
            <TH>Detail</TH>
            <TH>Status</TH>
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
        <Card>
          <p className="app-body text-app-muted">
            No affiliated members yet. Students and lecturers linked to your institution will appear
            here.
          </p>
        </Card>
      )}
    </div>
  );
}
