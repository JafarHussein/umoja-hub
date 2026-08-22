'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, EmptyState, Input, Page, PageHeader, Select } from '@/components/app';
import { Role, DemonstrationFormat } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';
import { formatSlotTime } from '@/components/education/DemonstrationPanel';

// ---------------------------------------------------------------------------
// The times a lecturer is available to hold demonstrations.
//
// This is the whole of UmojaHub's scheduling. It is not a calendar: no
// recurrence, no invitations, no video hosting. A lecturer says "I am free at
// these times, here is where to meet me", and a student books one.
// ---------------------------------------------------------------------------

interface ISlot {
  _id: string;
  startsAt: string;
  durationMinutes: number;
  format: string;
  location?: string;
  notes?: string;
  status: string;
  demonstration?: { _id: string; status: string; studentName: string };
}

const DURATIONS = [20, 30, 45, 60, 90];

/** A local datetime-local value one hour ahead, rounded to the next half hour. */
function defaultStart(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LecturerAvailabilityPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [slots, setSlots] = useState<ISlot[]>([]);
  const [pageState, setPageState] = useState<'loading' | 'ready' | 'unverified' | 'error'>(
    'loading'
  );
  const [startsAt, setStartsAt] = useState(defaultStart());
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [format, setFormat] = useState<string>(DemonstrationFormat.VIDEO_CALL);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/lecturer/availability');
      if (res.status === 403) {
        setPageState('unverified');
        return;
      }
      if (!res.ok) {
        setPageState('error');
        return;
      }
      const body = (await res.json()) as { data: ISlot[] };
      setSlots(body.data ?? []);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated') {
      if (session.user.role !== Role.LECTURER) {
        router.push('/auth/unauthorized');
        return;
      }
      void load();
    }
  }, [status, session, router, load]);

  async function publish(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/lecturer/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes,
          format,
          ...(location.trim() ? { location: location.trim() } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not offer that time.');
        setBusy(false);
        return;
      }
      setNotes('');
      await load();
      setBusy(false);
    } catch {
      setError('Network error. Try again.');
      setBusy(false);
    }
  }

  async function withdraw(slotId: string): Promise<void> {
    setError(null);
    try {
      const res = await fetch(`/api/lecturer/availability/${slotId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? 'Could not withdraw that time.');
        return;
      }
      await load();
    } catch {
      setError('Network error. Try again.');
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page width="focus">
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  if (pageState === 'unverified') {
    return (
      <Page width="focus">
        <PageHeader title="Demonstration availability" />
        <Alert tone="warning">
          Your lecturer credentials have not been verified yet. Once an administrator confirms
          them, you can offer demonstration times here.
        </Alert>
      </Page>
    );
  }

  return (
    <Page width="focus">
      <PageHeader
        title="Demonstration availability"
        description="The times you are free to watch a student demonstrate their system. Students whose reports you have accepted book these directly."
      />

      {error && <Alert tone="danger">{error}</Alert>}

      <Card>
        <p className="app-h3 text-app-ink">Offer a time</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startsAt" className="app-label text-app-body">
              Starts
            </label>
            <Input
              id="startsAt"
              type="datetime-local"
              className="mt-1.5"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="duration" className="app-label text-app-body">
              Length
            </label>
            <Select
              id="duration"
              className="mt-1.5"
              value={String(durationMinutes)}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} minutes
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="format" className="app-label text-app-body">
              Format
            </label>
            <Select
              id="format"
              className="mt-1.5"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value={DemonstrationFormat.VIDEO_CALL}>Video call</option>
              <option value={DemonstrationFormat.IN_PERSON}>In person</option>
            </Select>
          </div>
          <div>
            <label htmlFor="location" className="app-label text-app-body">
              Where {format === DemonstrationFormat.VIDEO_CALL ? '(joining link)' : '(room)'}
            </label>
            <Input
              id="location"
              className="mt-1.5"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={
                format === DemonstrationFormat.VIDEO_CALL
                  ? 'Paste your meeting link'
                  : 'Lab 3, Block B'
              }
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="notes" className="app-label text-app-body">
            Anything the student should know (optional)
          </label>
          <Input
            id="notes"
            className="mt-1.5"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Have your system running before you join."
          />
        </div>

        <p className="app-meta mt-3 text-app-muted">
          UmojaHub does not host the meeting. It manages the appointment; the link or room is
          yours.
        </p>

        <Button className="mt-4" isLoading={busy} onClick={() => void publish()}>
          Offer this time
        </Button>
      </Card>

      {slots.length === 0 ? (
        <EmptyState
          title="No times offered yet"
          description="Students cannot book a demonstration until you offer some times. A student whose report you have accepted is waiting on this."
        />
      ) : (
        <div className="space-y-3">
          <p className="app-label text-app-muted">Your times</p>
          {slots.map((slot) => (
            <div
              key={slot._id}
              className="rounded-app-card border border-app-hairline bg-app-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="app-body-strong text-app-ink">{formatSlotTime(slot.startsAt)}</p>
                  <p className="app-meta mt-0.5 text-app-muted">
                    {slot.durationMinutes} minutes ·{' '}
                    {slot.format === DemonstrationFormat.VIDEO_CALL ? 'Video call' : 'In person'}
                    {slot.demonstration
                      ? ` · booked by ${slot.demonstration.studentName}`
                      : ' · open'}
                  </p>
                  {slot.location && (
                    <p className="app-meta mt-0.5 break-all text-app-faint">{slot.location}</p>
                  )}
                </div>
                {!slot.demonstration && (
                  <Button size="sm" variant="secondary" onClick={() => void withdraw(slot._id)}>
                    Withdraw
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
