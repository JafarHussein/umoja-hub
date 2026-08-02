'use client';

import React, { useState } from 'react';
import { Alert, Button, Select, Textarea } from '@/components/app';
import {
  MediationCategory,
  MediationInitiator,
  MediationRequestStatus,
  Role,
} from '@/types';

// ---------------------------------------------------------------------------
// MediationPanel — the respondent's half of a dispute.
//
// Whoever did not raise an escalation gets exactly one statement, optionally
// with photos, before an admin decides what happens to the held funds. Before
// this existed a case was decided on one account alone, which is a complaints
// box rather than mediation.
//
// Also renders the case as both parties see it: who raised it, on what ground,
// both statements, and every photo attached by either side. Nobody is shown a
// version of the case the other party cannot see.
// ---------------------------------------------------------------------------

export const MEDIATION_CATEGORY_LABEL: Record<MediationCategory, string> = {
  [MediationCategory.NOT_DELIVERED]: 'Order not delivered',
  [MediationCategory.QUALITY_ISSUE]: 'Quality issue',
  [MediationCategory.WRONG_QUANTITY]: 'Wrong quantity',
  [MediationCategory.RECEIPT_NOT_CONFIRMED]: 'Receipt not confirmed',
  [MediationCategory.OTHER]: 'Something else',
};

export interface IMediationEvidence {
  url: string;
  uploadedByRole: string;
  uploadedAt: string;
}

export interface IMediationCase {
  _id: string;
  status: MediationRequestStatus;
  category: MediationCategory;
  description: string;
  initiatedBy: MediationInitiator;
  respondentStatement?: string | null;
  respondentRespondedAt?: string | null;
  evidence?: IMediationEvidence[];
  resolutionNote?: string | null;
  createdAt: string;
}

export interface IMediationPanelProps {
  orderId: string;
  mediation: IMediationCase;
  /** The signed-in party's role, used to work out who may respond. */
  viewerRole: Role.BUYER | Role.FARMER;
  onResponded: () => void;
}

async function uploadEvidence(file: File): Promise<{ url: string; publicId: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', 'umojahub/disputes');
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const body = (await res.json()) as {
    data?: { url: string; publicId: string };
    error?: string;
  };
  if (!res.ok || !body.data) throw new Error(body.error ?? 'Upload failed.');
  return body.data;
}

export function MediationPanel({
  orderId,
  mediation,
  viewerRole,
  onResponded,
}: IMediationPanelProps): React.ReactElement {
  const [statement, setStatement] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filedByBuyer = mediation.initiatedBy === MediationInitiator.BUYER;
  const viewerFiled =
    (filedByBuyer && viewerRole === Role.BUYER) || (!filedByBuyer && viewerRole === Role.FARMER);
  const isResolved = mediation.status === MediationRequestStatus.RESOLVED;
  const canRespond = !viewerFiled && !mediation.respondentStatement && !isResolved;

  async function submit(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const evidence = [];
      for (const file of files) {
        evidence.push(await uploadEvidence(file));
      }

      const res = await fetch(`/api/orders/${orderId}/mediation/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement,
          ...(evidence.length > 0 && { evidence }),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not record your response.');
        setSubmitting(false);
        return;
      }
      setStatement('');
      setFiles([]);
      setSubmitting(false);
      onResponded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record your response.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-app-card border border-app-hairline bg-app-card p-4">
      <div>
        <p className="app-label text-app-muted">Mediation case</p>
        <p className="app-meta text-app-faint">
          Raised by the {filedByBuyer ? 'buyer' : 'farmer'} ·{' '}
          {MEDIATION_CATEGORY_LABEL[mediation.category]}
        </p>
      </div>

      {/* The filer's account */}
      <div className="rounded-app-control border border-app-hairline bg-app-sunken px-3 py-2.5">
        <p className="app-label text-app-muted">
          What the {filedByBuyer ? 'buyer' : 'farmer'} reported
        </p>
        <p className="app-body mt-1 whitespace-pre-line text-app-ink">{mediation.description}</p>
      </div>

      {/* The respondent's account, once given */}
      {mediation.respondentStatement && (
        <div className="rounded-app-control border border-app-hairline bg-app-sunken px-3 py-2.5">
          <p className="app-label text-app-muted">
            What the {filedByBuyer ? 'farmer' : 'buyer'} said in reply
          </p>
          <p className="app-body mt-1 whitespace-pre-line text-app-ink">
            {mediation.respondentStatement}
          </p>
        </div>
      )}

      {/* Evidence from either side */}
      {mediation.evidence && mediation.evidence.length > 0 && (
        <div>
          <p className="app-label mb-2 text-app-muted">Photos attached</p>
          <div className="flex flex-wrap gap-2">
            {mediation.evidence.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Evidence from the ${item.uploadedByRole.toLowerCase()}`}
                  className="h-20 w-20 rounded-app-control border border-app-hairline object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {mediation.resolutionNote && (
        <Alert tone="info">
          <span className="app-body-strong">Decision.</span> {mediation.resolutionNote}
        </Alert>
      )}

      {/* Respondent's form */}
      {canRespond && (
        <div className="space-y-3 border-t border-app-hairline pt-4">
          <div>
            <p className="app-body-strong text-app-ink">Give your side of what happened</p>
            <p className="app-meta text-app-muted">
              The mediation team will read both accounts before deciding what happens to the funds
              held in escrow. You get one statement, so include everything that matters.
            </p>
          </div>

          <Textarea
            rows={4}
            value={statement}
            maxLength={1000}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Explain what happened from your side."
            aria-label="Your account of what happened"
          />

          <div className="space-y-1.5">
            <label htmlFor="evidence-files" className="app-label block text-app-muted">
              Photos (optional, up to 5)
            </label>
            <input
              id="evidence-files"
              type="file"
              accept="image/*"
              multiple
              className="app-body block w-full text-app-muted file:mr-3 file:rounded-app-control file:border file:border-app-border-strong file:bg-app-card file:px-3 file:py-1.5 file:text-app-ink"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            />
            {files.length > 0 && (
              <p className="app-meta text-app-faint">
                {files.length} photo{files.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <Button
            isLoading={submitting}
            disabled={statement.trim().length < 20}
            onClick={() => void submit()}
            className="w-full"
          >
            Submit my response
          </Button>
        </div>
      )}

      {viewerFiled && !mediation.respondentStatement && !isResolved && (
        <p className="app-meta text-app-faint">
          Waiting for the {filedByBuyer ? 'farmer' : 'buyer'} to give their account.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EscalateForm — raising a case. Categories differ by side, so the caller
// passes the ones the API will accept from this role.
// ---------------------------------------------------------------------------

export interface IEscalateFormProps {
  orderId: string;
  categories: MediationCategory[];
  onFiled: () => void;
}

export function EscalateForm({
  orderId,
  categories,
  onFiled,
}: IEscalateFormProps): React.ReactElement {
  const [category, setCategory] = useState<MediationCategory>(
    categories[0] ?? MediationCategory.OTHER
  );
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const evidence = [];
      for (const file of files) {
        evidence.push(await uploadEvidence(file));
      }

      const res = await fetch(`/api/orders/${orderId}/mediation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description,
          ...(evidence.length > 0 && { evidence }),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Could not file this report.');
        setSubmitting(false);
        return;
      }
      setDescription('');
      setFiles([]);
      setSubmitting(false);
      onFiled();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not file this report.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Select
        value={category}
        onChange={(e) => setCategory(e.target.value as MediationCategory)}
        aria-label="What is the problem?"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {MEDIATION_CATEGORY_LABEL[c]}
          </option>
        ))}
      </Select>

      <Textarea
        rows={3}
        value={description}
        maxLength={1000}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what happened, in at least 20 characters."
        aria-label="Describe the problem"
      />

      <div className="space-y-1.5">
        <label htmlFor="escalate-files" className="app-label block text-app-muted">
          Photos (optional, up to 5)
        </label>
        <input
          id="escalate-files"
          type="file"
          accept="image/*"
          multiple
          className="app-body block w-full text-app-muted file:mr-3 file:rounded-app-control file:border file:border-app-border-strong file:bg-app-card file:px-3 file:py-1.5 file:text-app-ink"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
        />
      </div>

      {error && <Alert tone="danger">{error}</Alert>}

      <Button
        isLoading={submitting}
        disabled={description.trim().length < 20}
        onClick={() => void submit()}
        className="w-full"
      >
        Ask UmojaHub to step in
      </Button>
    </div>
  );
}
