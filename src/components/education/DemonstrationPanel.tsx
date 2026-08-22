'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Textarea } from '@/components/app';
import { cn } from '@/lib/cn';
import { DemonstrationStatus, ProjectStatus } from '@/types';

// ---------------------------------------------------------------------------
// Booking and holding a demonstration, from the student's side.
//
// Three states, and the panel shows exactly one: nothing booked (choose a
// time), something outstanding (what it is and how to get out of it), or
// something finished (what the lecturer said).
//
// The student can book and can cancel. They cannot confirm their own
// demonstration and cannot mark it as having happened — a record of a meeting
// that the assessed party can write is not evidence of anything, and this
// component gives them no way to try.
// ---------------------------------------------------------------------------

export interface IDemonstrationSlot {
  _id: string;
  lecturerName: string;
  startsAt: string;
  durationMinutes: number;
  format: string;
  notes?: string;
}

export interface IDemonstration {
  _id: string;
  engagementId: string;
  lecturerName: string;
  scheduledFor: string;
  durationMinutes: number;
  format: string;
  location?: string;
  studentNotes?: string;
  status: string;
  revisionNumber: number;
  declineReason?: string;
  cancelledReason?: string;
  evaluation?: {
    scores: Record<string, number>;
    comments: Record<string, string>;
    outcome: string;
    questioningNotes?: string;
    failureDuringDemonstration?: string;
  };
}

const FORMAT_LABEL: Record<string, string> = {
  VIDEO_CALL: 'Video call',
  IN_PERSON: 'In person',
};

export function formatSlotTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export interface IDemonstrationPanelProps {
  engagementId: string;
  projectStatus: string;
  demonstration: IDemonstration | null;
  onChange: () => void;
}

export function DemonstrationPanel({
  engagementId,
  projectStatus,
  demonstration,
  onChange,
}: IDemonstrationPanelProps): React.ReactElement {
  const [slots, setSlots] = useState<IDemonstrationSlot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const outstanding =
    demonstration &&
    (demonstration.status === DemonstrationStatus.REQUESTED ||
      demonstration.status === DemonstrationStatus.SCHEDULED ||
      demonstration.status === DemonstrationStatus.COMPLETED);

  const loadSlots = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/education/demonstration-slots');
      if (res.ok) {
        const body = (await res.json()) as { data: IDemonstrationSlot[] };
        setSlots(body.data ?? []);
      }
    } catch {
      // An empty list reads as "nothing offered yet", which is the truth when
      // the request fails too.
    }
  }, []);

  useEffect(() => {
    if (!outstanding && projectStatus === ProjectStatus.READY_FOR_DEMONSTRATION) {
      void loadSlots();
    }
  }, [outstanding, projectStatus, loadSlots]);

  async function book(): Promise<void> {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/education/demonstrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engagementId, slotId: selected, studentNotes: notes }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not book that time.');
        // The commonest failure is somebody else taking the slot a moment
        // earlier, so the list is refreshed rather than left showing a time
        // that has gone.
        await loadSlots();
        setSelected(null);
        setBusy(false);
        return;
      }
      onChange();
      setBusy(false);
    } catch {
      setError('Network error. Try again.');
      setBusy(false);
    }
  }

  async function cancel(): Promise<void> {
    if (!demonstration) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/education/demonstrations/${demonstration._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not cancel.');
        setBusy(false);
        return;
      }
      setCancelling(false);
      setCancelReason('');
      onChange();
      setBusy(false);
    } catch {
      setError('Network error. Try again.');
      setBusy(false);
    }
  }

  // ---- Something outstanding ----
  if (outstanding && demonstration) {
    return (
      <Card>
        <p className="app-label text-app-muted">
          {demonstration.status === DemonstrationStatus.REQUESTED
            ? 'Requested — waiting on your lecturer'
            : demonstration.status === DemonstrationStatus.SCHEDULED
              ? 'Confirmed'
              : 'Held — awaiting your result'}
        </p>
        <p className="app-h3 mt-1 text-app-ink">{formatSlotTime(demonstration.scheduledFor)}</p>
        <p className="app-body mt-1 text-app-body">
          {demonstration.durationMinutes} minutes with {demonstration.lecturerName} ·{' '}
          {FORMAT_LABEL[demonstration.format] ?? demonstration.format}
        </p>
        {demonstration.location && (
          <p className="app-meta mt-1 break-all text-app-muted">{demonstration.location}</p>
        )}

        {demonstration.studentNotes && (
          <div className="mt-4">
            <p className="app-label text-app-muted">What you said you would show</p>
            <p className="app-body mt-1 whitespace-pre-line text-app-body">
              {demonstration.studentNotes}
            </p>
          </div>
        )}

        {demonstration.status === DemonstrationStatus.SCHEDULED && (
          <Alert tone="info" className="mt-4">
            Have the system running before you join. If something breaks during the demonstration,
            say what you think is happening and how you would find out — that is assessed on how
            you respond to it, not on the fact that it happened.
          </Alert>
        )}

        {demonstration.status !== DemonstrationStatus.COMPLETED && (
          <div className="mt-4">
            {!cancelling ? (
              <Button size="sm" variant="secondary" onClick={() => setCancelling(true)}>
                Cancel this demonstration
              </Button>
            ) : (
              <div className="rounded-app-control border border-app-hairline p-4">
                <p className="app-body-strong text-app-ink">Why are you cancelling?</p>
                <p className="app-meta mt-0.5 text-app-muted">
                  Your lecturer sees this, and the time goes back on the board for somebody else.
                </p>
                <Textarea
                  className="mt-2"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  aria-label="Reason for cancelling"
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    isLoading={busy}
                    disabled={cancelReason.trim().length < 5}
                    onClick={() => void cancel()}
                  >
                    Cancel it
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setCancelling(false)}>
                    Keep it
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert tone="danger" className="mt-3">
            {error}
          </Alert>
        )}
      </Card>
    );
  }

  // ---- Finished ----
  if (demonstration && demonstration.status === DemonstrationStatus.EVALUATED) {
    const evaluation = demonstration.evaluation;
    return (
      <Card>
        <p className="app-label text-app-muted">Demonstration held</p>
        <p className="app-h3 mt-1 text-app-ink">
          {evaluation?.outcome === 'APPROVED' ? 'Approved' : 'More work asked for'}
        </p>
        {evaluation && (
          <div className="mt-4 space-y-3">
            {Object.entries(evaluation.comments).map(([criterion, comment]) => (
              <div key={criterion}>
                <p className="app-label text-app-muted">
                  {criterion.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} ·{' '}
                  {evaluation.scores[criterion]}/5
                </p>
                <p className="app-body mt-0.5 text-app-body">{comment}</p>
              </div>
            ))}
            {evaluation.questioningNotes && (
              <div>
                <p className="app-label text-app-muted">Questions you were asked</p>
                <p className="app-body mt-0.5 whitespace-pre-line text-app-body">
                  {evaluation.questioningNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }

  // ---- Nothing booked ----
  if (projectStatus !== ProjectStatus.READY_FOR_DEMONSTRATION) {
    return (
      <Card>
        <p className="app-body-strong text-app-ink">Not yet</p>
        <p className="app-body mt-1 text-app-muted">
          You book a demonstration once your lecturer has read and accepted your project report.
          That order is deliberate — it means they arrive already knowing your project, and the
          session is spent on your system rather than on catching up.
        </p>
        {demonstration?.declineReason && (
          <Alert tone="warning" className="mt-3">
            <span className="app-body-strong">Your last request was declined: </span>
            {demonstration.declineReason}
          </Alert>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {demonstration?.declineReason && (
        <Alert tone="warning">
          <span className="app-body-strong">Your last request was declined: </span>
          {demonstration.declineReason}
        </Alert>
      )}

      <Card>
        <p className="app-label text-app-muted">Choose a time</p>
        <p className="app-body mt-1 text-app-body">
          These are the times your lecturers have offered. Pick one and say what you will show.
        </p>

        {slots.length === 0 ? (
          <p className="app-body mt-4 text-app-muted">
            No times are on offer yet. Your lecturers publish their availability here — check back,
            or ask them directly.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {slots.map((slot) => (
              <button
                key={slot._id}
                type="button"
                aria-pressed={selected === slot._id}
                onClick={() => setSelected(slot._id)}
                className={cn(
                  'w-full rounded-app-control border p-4 text-left transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring',
                  selected === slot._id
                    ? 'border-app-brand bg-app-brand-surface'
                    : 'border-app-hairline bg-app-card hover:border-app-border-strong'
                )}
              >
                <p className="app-body-strong text-app-ink">{formatSlotTime(slot.startsAt)}</p>
                <p className="app-meta mt-0.5 text-app-muted">
                  {slot.durationMinutes} minutes with {slot.lecturerName} ·{' '}
                  {FORMAT_LABEL[slot.format] ?? slot.format}
                </p>
                {slot.notes && <p className="app-meta mt-1 text-app-faint">{slot.notes}</p>}
              </button>
            ))}
          </div>
        )}
      </Card>

      {selected && (
        <Card>
          <p className="app-label text-app-muted">What will you show?</p>
          <p className="app-body mt-1 text-app-body">
            The flows you will run, what state the system needs, and — this matters — anything you
            already know is incomplete or fragile. Saying so in advance is professional behaviour
            and is treated as such.
          </p>
          <Textarea
            className="mt-3"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="What you will show"
            placeholder="I will show sign-in, recording an entry offline, and the sync reconciling two devices. The reporting screen is not finished — the weekly summary is hard-coded."
          />
          <div className="mt-3 flex items-center gap-3">
            <Button isLoading={busy} disabled={notes.trim().length < 20} onClick={() => void book()}>
              Request this demonstration
            </Button>
            <p className="app-meta text-app-muted">
              Your lecturer confirms it before it is final.
            </p>
          </div>
          {error && (
            <Alert tone="danger" className="mt-3">
              {error}
            </Alert>
          )}
        </Card>
      )}
    </div>
  );
}
