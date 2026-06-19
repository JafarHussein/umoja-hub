'use client';

import React, { useState } from 'react';
import { Button, Input } from '@/components/app';

// ---------------------------------------------------------------------------
// LinkGroupTokenForm (UI-05) — single-input control in the farmer settings
// pane for redeeming an admin-minted institutional group token (BE-07). This
// is the only self-service path into a cooperative roster (Decision Record
// 03/08-C); the server enforces the verified-farmer gate (FIX-06) and
// single-use semantics, so this surface only mints the request and reports the
// outcome.
// ---------------------------------------------------------------------------

interface IRedeemResponse {
  data?: { groupName?: string };
  error?: string;
}

export function LinkGroupTokenForm(): React.ReactElement {
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const value = token.trim();
    if (!value) {
      setError('Enter a join token.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/groups/redeem-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: value }),
      });
      const body = (await res.json()) as IRedeemResponse;
      if (!res.ok) {
        setError(body.error ?? 'Could not link this token.');
        return;
      }
      setSuccess(`You've joined ${body.data?.groupName ?? 'the group'}.`);
      setToken('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md rounded-app-card border border-app-hairline bg-app-card p-5">
      <h2 className="app-h2 text-app-ink">Link Institutional Group Token</h2>
      <p className="app-meta mb-4 mt-1 text-app-muted">
        Received a join code from a cooperative administrator? Enter it to join the group. Codes
        are single-use and only verified farmers can redeem them.
      </p>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
        <Input
          label="Join token"
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
          placeholder="e.g. K7M2QX9P"
          maxLength={32}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          error={error ?? undefined}
          aria-label="Group join token"
        />
        {success && (
          <p className="app-body text-app-brand" role="status">
            {success}
          </p>
        )}
        <Button type="submit" size="sm" isLoading={submitting} className="self-start">
          Link group
        </Button>
      </form>
    </div>
  );
}
