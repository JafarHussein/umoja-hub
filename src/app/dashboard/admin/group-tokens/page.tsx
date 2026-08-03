'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, Page, PageHeader, Select, Alert } from '@/components/app';
import { Role } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

// ---------------------------------------------------------------------------
// UI-15 — Admin group-token mint console (BE-07).
//
// Mints a single-use group join token via POST /api/admin/group-tokens: binds
// an unambiguous 8-char code to one ACTIVE group, SMS-dispatches it to the
// recipient farmer, and returns the code so the admin can also relay it
// manually. The farmer self-redeems it from their settings pane (UI-05). There
// is no group-listing endpoint for admins, so the group is identified by id.
// ---------------------------------------------------------------------------

// Expiry presets (hours) — the schema accepts 1…720h; 14 days is the route default.
const EXPIRY_OPTIONS: { label: string; hours: number }[] = [
  { label: '1 day', hours: 24 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
  { label: '30 days', hours: 720 },
];

interface IMintResult {
  token: string;
  groupId: string;
  expiresAt: string;
}

type SubmitState = 'idle' | 'submitting';

export default function AdminGroupTokensPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [groupId, setGroupId] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(336);

  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<IMintResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(loginUrlWithIntent());
      return;
    }
    if (status === 'authenticated' && session.user.role !== Role.ADMIN) {
      router.push('/auth/unauthorized');
    }
  }, [status, session, router]);

  if (status !== 'authenticated' || session.user.role !== Role.ADMIN) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="skeleton h-7 w-44 rounded" />
        <div className="skeleton h-72 rounded-app-card" />
      </div>
    );
  }

  async function mint(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFormError(null);

    if (groupId.trim().length === 0) {
      setFormError('Enter the group ID to mint a token for.');
      return;
    }
    if (recipientPhone.trim().length === 0) {
      setFormError("Enter the recipient farmer's phone number.");
      return;
    }

    setSubmitState('submitting');
    try {
      const res = await fetch('/api/admin/group-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: groupId.trim(),
          recipientPhone: recipientPhone.trim(),
          expiresInHours,
        }),
      });
      const body = (await res.json()) as { data?: IMintResult; error?: string };
      if (!res.ok || !body.data) {
        throw new Error(body.error ?? 'Could not mint a token. Check the details and try again.');
      }
      setResult(body.data);
      setCopied(false);
      setGroupId('');
      setRecipientPhone('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitState('idle');
    }
  }

  async function copyToken(): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable; the code is shown for manual copy anyway.
    }
  }

  return (
    <Page width="focus">
      {/* Header */}
      <PageHeader
        title="Group Tokens"
        description="Mint a single-use join code for a cooperative group. The code is texted to the recipient farmer, who redeems it from their profile. Each code works once and then expires."
      />

      {/* Mint result */}
      {result && (
        <div className="space-y-3 rounded-app-card border border-app-brand-border bg-app-brand-surface p-4">
          <p className="app-label text-app-brand">Token minted</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="app-data-xl tracking-[0.2em] text-app-brand">{result.token}</span>
            <Button variant="secondary" size="sm" onClick={() => void copyToken()}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="app-meta text-app-muted">
            Texted to the recipient. Expires{' '}
            {new Date(result.expiresAt).toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            . If the SMS does not arrive, relay this code directly; it is single-use.
          </p>
        </div>
      )}

      {/* Mint form */}
      <form
        onSubmit={(e) => void mint(e)}
        className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-6"
      >
        <h2 className="app-h2 text-app-ink">Mint a join code</h2>

        <Input
          label="Group ID"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="The cooperative group's identifier"
          hint="The group must exist and be active."
        />

        <Input
          label="Recipient phone"
          type="tel"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          placeholder="0712 345 678 or +254712345678"
        />

        <Select
          label="Expires in"
          value={expiresInHours}
          onChange={(e) => setExpiresInHours(Number(e.target.value))}
        >
          {EXPIRY_OPTIONS.map((opt) => (
            <option key={opt.hours} value={opt.hours}>
              {opt.label}
            </option>
          ))}
        </Select>

        {formError !== null && <Alert tone="danger">{formError}</Alert>}

        <Button type="submit" variant="primary" isLoading={submitState === 'submitting'}>
          Mint token
        </Button>
      </form>
    </Page>
  );
}
