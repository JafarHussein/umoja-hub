'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
        setErrorMsg(body.error ?? 'Failed to log blocker. Try again.');
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
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
          Log a blocker
        </p>

        {errorMsg && (
          <p className="text-t6 font-body text-red-400" role="alert">
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
          disabled={!isValid || formState === 'saving'}
        >
          {formState === 'saving' ? 'Logging...' : 'Log blocker'}
        </Button>
      </form>

      {/* Log list */}
      <div className="space-y-2">
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
          Blocker log
        </p>

        {blockers.length === 0 ? (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-6 text-center">
            <p className="text-t5 font-body text-text-secondary">No blockers logged yet.</p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
            {blockers.map((blocker, idx) => (
              <div
                key={idx}
                className="px-4 py-3 border-b border-zinc-800/50 last:border-0 space-y-0.5"
              >
                <p className="text-t5 font-body text-text-primary">{blocker.stuckOn}</p>
                <p className="text-t6 font-mono text-text-disabled">
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
