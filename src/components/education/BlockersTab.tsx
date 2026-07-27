'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/app';

export interface IBlockerEntry {
  stuckOn: string;
  resolution: string;
  durationHours: number;
  loggedAt: string;
}

export interface IBlockersTabProps {
  engagementId: string;
  initialBlockers: IBlockerEntry[];
  onBlockerAdded: (entry: IBlockerEntry) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BlockersTab({
  engagementId,
  initialBlockers,
  onBlockerAdded,
}: IBlockersTabProps): React.ReactElement {
  const [blockers, setBlockers] = useState<IBlockerEntry[]>(initialBlockers);
  const [stuckOn, setStuckOn] = useState('');
  const [resolution, setResolution] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [formState, setFormState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValid =
    stuckOn.length >= 10 && resolution.length >= 10 && parseFloat(durationHours) > 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!isValid) return;

    setFormState('saving');
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/education/engagements/${engagementId}/blockers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stuckOn,
          resolution,
          durationHours: parseFloat(durationHours),
        }),
      });

      const body = (await res.json()) as { data?: IBlockerEntry; error?: string };

      if (!res.ok) {
        setErrorMsg(body.error ?? 'Could not save the blocker. Try again.');
        setFormState('error');
        return;
      }

      if (body.data) {
        setBlockers((prev) => [body.data!, ...prev]);
        onBlockerAdded(body.data);
      }

      setStuckOn('');
      setResolution('');
      setDurationHours('');
      setFormState('idle');
    } catch {
      setErrorMsg('Network error. Try again.');
      setFormState('error');
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Add form */}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <p className="app-label text-app-muted">Log a blocker</p>

        {errorMsg && (
          <p className="app-meta text-app-danger" role="alert">
            {errorMsg}
          </p>
        )}

        <Input
          label="What were you stuck on?"
          value={stuckOn}
          onChange={(e) => setStuckOn(e.target.value)}
          placeholder="e.g. Couldn't figure out the M-Pesa callback format"
        />
        <Input
          label="How did you resolve it?"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="e.g. Read the Daraja API docs and found the correct field names"
        />
        <Input
          type="number"
          label="Time spent (hours)"
          value={durationHours}
          onChange={(e) => setDurationHours(e.target.value)}
          placeholder="e.g. 1.5"
          hint="Enter a positive number"
        />

        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!isValid}
          isLoading={formState === 'saving'}
        >
          Log blocker
        </Button>
      </form>

      {/* Log list */}
      <div className="space-y-2">
        <p className="app-label text-app-muted">Blocker log</p>

        {blockers.length === 0 ? (
          <div className="rounded-app-card border border-app-hairline bg-app-card p-6 text-center">
            <p className="app-body text-app-muted">No blockers logged yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            {blockers.map((blocker, idx) => (
              <div
                key={idx}
                className="space-y-0.5 border-b border-app-hairline px-4 py-3 last:border-0"
              >
                <p className="app-body text-app-ink">{blocker.stuckOn}</p>
                <p className="app-meta text-app-muted">
                  {blocker.resolution} · {blocker.durationHours}h
                  {blocker.loggedAt ? ` · ${formatDate(blocker.loggedAt)}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
