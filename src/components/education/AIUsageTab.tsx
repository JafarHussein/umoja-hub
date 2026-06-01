'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';

export interface IAIUsageEntry {
  toolUsed: string;
  prompt: string;
  outputReceived: string;
  studentAction: string;
  loggedAt: string;
  source: string;
}

export interface IAIUsageTabProps {
  engagementId: string;
  initialEntries: IAIUsageEntry[];
  onEntryAdded: (entry: IAIUsageEntry) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AIUsageTab({
  engagementId,
  initialEntries,
  onEntryAdded,
}: IAIUsageTabProps): React.ReactElement {
  const [entries, setEntries] = useState<IAIUsageEntry[]>(initialEntries);
  const [toolUsed, setToolUsed] = useState('');
  const [prompt, setPrompt] = useState('');
  const [outputReceived, setOutputReceived] = useState('');
  const [studentAction, setStudentAction] = useState('');
  const [formState, setFormState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isValid =
    toolUsed.length >= 1 &&
    prompt.length >= 10 &&
    outputReceived.length >= 10 &&
    studentAction.length >= 10;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!isValid) return;

    setFormState('saving');
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/education/engagements/${engagementId}/ai-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolUsed, prompt, outputReceived, studentAction }),
      });

      const body = (await res.json()) as { data?: IAIUsageEntry; error?: string };

      if (!res.ok) {
        setErrorMsg(body.error ?? 'Failed to log entry. Try again.');
        setFormState('error');
        return;
      }

      if (body.data) {
        setEntries((prev) => [body.data!, ...prev]);
        onEntryAdded(body.data);
      }

      setToolUsed('');
      setPrompt('');
      setOutputReceived('');
      setStudentAction('');
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
          Log AI usage
        </p>

        {errorMsg && (
          <p className="text-t6 font-body text-red-400" role="alert">
            {errorMsg}
          </p>
        )}

        <Input
          label="AI tool used"
          value={toolUsed}
          onChange={(e) => setToolUsed(e.target.value)}
          placeholder="e.g. ChatGPT, GitHub Copilot, Claude"
        />
        <Textarea
          rows={3}
          label="Prompt you gave the AI"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What did you ask the AI?"
        />
        <Textarea
          rows={3}
          label="What the AI returned"
          value={outputReceived}
          onChange={(e) => setOutputReceived(e.target.value)}
          placeholder="Summarise the AI response"
        />
        <Textarea
          rows={3}
          label="What you did with the output"
          value={studentAction}
          onChange={(e) => setStudentAction(e.target.value)}
          placeholder="How did you use, adapt, or reject this output?"
        />

        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!isValid || formState === 'saving'}
        >
          {formState === 'saving' ? 'Logging...' : 'Log usage'}
        </Button>
      </form>

      {/* Log list */}
      <div className="space-y-2">
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
          AI usage log
        </p>

        {entries.length === 0 ? (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] p-6 text-center">
            <p className="text-t5 font-body text-text-secondary">No AI usage logged yet.</p>
          </div>
        ) : (
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-[4px] overflow-hidden">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="px-4 py-3 border-b border-zinc-800/50 last:border-0 space-y-0.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-t5 font-body font-medium text-text-primary">
                    {entry.toolUsed}
                  </p>
                  {entry.loggedAt && (
                    <p className="text-t6 font-mono text-text-disabled flex-shrink-0">
                      {formatDate(entry.loggedAt)}
                    </p>
                  )}
                </div>
                <p className="text-t6 font-body text-text-secondary">
                  {entry.prompt.length > 120
                    ? `${entry.prompt.slice(0, 120)}…`
                    : entry.prompt}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
