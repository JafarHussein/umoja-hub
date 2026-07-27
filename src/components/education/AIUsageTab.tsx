'use client';

import React, { useState } from 'react';
import { Button, Input, Textarea } from '@/components/app';

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
        setErrorMsg(body.error ?? 'Could not save your entry. Try again.');
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
        <p className="app-label text-app-muted">Log AI usage</p>

        {errorMsg && (
          <p className="app-meta text-app-danger" role="alert">
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
          disabled={!isValid}
          isLoading={formState === 'saving'}
        >
          Log usage
        </Button>
      </form>

      {/* Log list */}
      <div className="space-y-2">
        <p className="app-label text-app-muted">AI usage log</p>

        {entries.length === 0 ? (
          <div className="rounded-app-card border border-app-hairline bg-app-card p-6 text-center">
            <p className="app-body text-app-muted">No AI usage logged yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-app-card border border-app-hairline bg-app-card">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="space-y-0.5 border-b border-app-hairline px-4 py-3 last:border-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="app-body-strong text-app-ink">{entry.toolUsed}</p>
                  {entry.loggedAt && (
                    <p className="app-meta flex-shrink-0 font-app-mono text-app-faint">
                      {formatDate(entry.loggedAt)}
                    </p>
                  )}
                </div>
                <p className="app-meta text-app-muted">
                  {entry.prompt.length > 120 ? `${entry.prompt.slice(0, 120)}…` : entry.prompt}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
