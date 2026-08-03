'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Modal,
  Input,
  Page,
  PageHeader,
  Table,
  THead,
  TH,
  TR,
  TD,
} from '@/components/app';
import { Role, DocumentType, VerificationStatus } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

interface IVerificationDocument {
  documentType: DocumentType;
  documentNumber: string;
  documentImageUrl: string;
  submittedAt: string;
}

interface IPendingFarmer {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  county: string;
  farmerData: {
    cropsGrown: string[];
    farmSizeAcres?: number;
    verificationStatus: VerificationStatus;
    verificationDocument?: IVerificationDocument;
  };
  createdAt: string;
}

interface IQueueResponse {
  farmers: IPendingFarmer[];
  nextCursor: string | null;
  total: number;
}

type PageState = 'loading' | 'ready' | 'error';

type ActionModal =
  | { type: 'approve'; farmer: IPendingFarmer }
  | { type: 'reject'; farmer: IPendingFarmer }
  | { type: 'detail'; farmer: IPendingFarmer }
  | null;

// Key/value tile inside the detail modal.
function DetailTile({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-app-control bg-app-sunken p-3">
      <p className="app-label mb-1 text-app-muted">{label}</p>
      <p className="app-body text-app-ink">{children}</p>
    </div>
  );
}

// Join names without rendering the literal "undefined" when a lastName is absent.
function fullName(f: { firstName: string; lastName?: string }): string {
  return [f.firstName, f.lastName].filter(Boolean).join(' ');
}

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

// Cloudinary: inserting fl_attachment after /upload/ forces a file download
// (with the stored filename) instead of inline rendering.
function downloadUrl(url: string): string {
  return url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
}

// Inline evidence viewer for the admin. Images render in-place and open full
// resolution in a new tab on click (zoom); PDFs show an open/download card.
// Both expose an explicit download. The uploaded document is evidence, so it is
// presented directly rather than hidden behind a bare link.
function DocumentPreview({ url }: { url: string }): React.ReactElement {
  if (!url) {
    return <p className="app-body text-app-faint">No document image was provided.</p>;
  }
  const pdf = isPdfUrl(url);
  return (
    <div className="space-y-2">
      {pdf ? (
        <div className="flex items-center gap-3 rounded-app-control border border-app-hairline bg-app-sunken p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-app-control bg-app-card font-app-mono text-app-brand">
            PDF
          </div>
          <p className="app-body text-app-muted">PDF document — open to review full resolution.</p>
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" title="Open full resolution">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Submitted verification document"
            className="max-h-72 w-full cursor-zoom-in rounded-app-control border border-app-hairline bg-app-sunken object-contain"
          />
        </a>
      )}
      <div className="flex items-center gap-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="app-body inline-flex items-center gap-1.5 text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
        >
          Open full size
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 10L10 2M10 2H6M10 2V6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
        <a
          href={downloadUrl(url)}
          className="app-body inline-flex items-center gap-1.5 text-app-muted transition-colors duration-150 hover:text-app-ink"
        >
          Download
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M6 1.5V8M6 8L3.5 5.5M6 8L8.5 5.5M2 10.5h8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}

export default function AdminVerificationQueuePage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [farmers, setFarmers] = useState<IPendingFarmer[]>([]);
  const [total, setTotal] = useState(0);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [activeModal, setActiveModal] = useState<ActionModal>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchQueue = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/verification-queue');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = (await res.json()) as IQueueResponse;
      setFarmers(data.farmers ?? []);
      setTotal(data.total ?? 0);
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
      if (session.user.role !== Role.ADMIN) {
        router.push('/auth/unauthorized');
        return;
      }
      void fetchQueue();
    }
  }, [status, session, router, fetchQueue]);

  async function handleDecision(
    farmerId: string,
    decision: VerificationStatus.APPROVED | VerificationStatus.REJECTED,
    reason?: string,
  ): Promise<void> {
    setIsActioning(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/verify-farmer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId,
          decision,
          ...(reason ? { rejectionReason: reason } : {}),
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg =
          typeof data['error'] === 'string' ? data['error'] : 'Action failed. Try again.';
        setActionError(msg);
        return;
      }

      setFarmers((prev) => prev.filter((f) => f._id !== farmerId));
      setTotal((t) => Math.max(0, t - 1));
      setActiveModal(null);
      setRejectionReason('');
    } finally {
      setIsActioning(false);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function docTypeLabel(type: DocumentType): string {
    const labels: Record<DocumentType, string> = {
      [DocumentType.NATIONAL_ID]: 'National ID',
      [DocumentType.COOPERATIVE_CARD]: 'Cooperative Card',
      [DocumentType.PASSPORT]: 'Passport',
    };
    return labels[type];
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading' || pageState === 'loading') {
    return (
      <Page>
        <div className="skeleton h-8 w-56 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </Page>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <Page>
        <PageHeader title="Verification queue" />
        <EmptyState
          title="We could not load the verification queue"
          description="No farmer's submission has been affected — this screen just could not reach the queue."
          action={{ label: 'Try again', onClick: () => void fetchQueue() }}
        />
      </Page>
    );
  }

  const selectedFarmer =
    activeModal?.type === 'detail' || activeModal?.type === 'reject'
      ? activeModal.farmer
      : null;

  return (
    <Page>
      {/* Page header */}
      <PageHeader
        title="Verification queue"
        description="Farmers waiting on a decision before they can sell. Approving someone is what puts a verified badge next to their produce, so read the document against the name on the account before you decide."
        meta={
          total > 0 ? (
            <span>
              {total} pending verification{total !== 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {/* Empty state */}
      {farmers.length === 0 ? (
        <EmptyState
          title="The queue is clear"
          description="Every farmer verification request has been reviewed. New submissions land here as soon as farmers upload their documents — nothing is waiting on you right now."
          hints={[
            {
              label: 'Review suppliers',
              href: '/dashboard/admin/supplier-verification',
              description: 'input suppliers awaiting credential checks',
            },
            {
              label: 'Review lecturers',
              href: '/dashboard/admin/lecturer-verification',
              description: 'academic accounts awaiting approval',
            },
          ]}
        />
      ) : (
        /* Queue table */
        <Table layout="fixed">
          <THead>
            <TH className="w-[28%]">Farmer</TH>
            <TH className="w-[16%]">County</TH>
            <TH className="w-[22%]">Document</TH>
            <TH className="w-[16%]">Submitted</TH>
            <TH className="w-[18%] text-right">Actions</TH>
          </THead>
          <tbody>
            {farmers.map((farmer) => (
              <TR key={farmer._id}>
                <TD>
                  <p className="app-body-strong text-app-ink">
                    {fullName(farmer)}
                  </p>
                  <p className="app-meta truncate text-app-faint">
                    {farmer.farmerData.cropsGrown.join(', ')}
                  </p>
                </TD>
                <TD className="text-app-muted">{farmer.county}</TD>
                <TD className="font-app-mono text-app-muted">
                  {farmer.farmerData.verificationDocument
                    ? docTypeLabel(farmer.farmerData.verificationDocument.documentType)
                    : '—'}
                </TD>
                <TD className="text-app-faint">
                  {farmer.farmerData.verificationDocument
                    ? formatDate(farmer.farmerData.verificationDocument.submittedAt)
                    : formatDate(farmer.createdAt)}
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModal({ type: 'detail', farmer })}
                    >
                      Review
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveModal({ type: 'approve', farmer })}
                      aria-label={`Approve ${farmer.firstName} ${farmer.lastName}`}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setActiveModal({ type: 'reject', farmer });
                        setRejectionReason('');
                        setActionError(null);
                      }}
                      aria-label={`Reject ${farmer.firstName} ${farmer.lastName}`}
                    >
                      Reject
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}

      {/* ── Approve confirm modal ──────────────────────────────────────────── */}
      <Modal
        open={activeModal?.type === 'approve'}
        onClose={() => setActiveModal(null)}
        title="Approve verification"
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveModal(null)} disabled={isActioning}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isLoading={isActioning}
              onClick={() => {
                if (activeModal?.type === 'approve') {
                  void handleDecision(activeModal.farmer._id, VerificationStatus.APPROVED);
                }
              }}
            >
              Approve farmer
            </Button>
          </>
        }
      >
        {activeModal?.type === 'approve' && (
          <p className="app-body text-app-body">
            Approve {fullName(activeModal.farmer)} as a verified
            farmer? This will grant them a 40-point trust score and send an SMS notification.
          </p>
        )}
      </Modal>

      {/* ── Reject modal ──────────────────────────────────────────────────── */}
      {activeModal?.type === 'reject' && selectedFarmer && (
        <Modal
          open
          onClose={() => setActiveModal(null)}
          title="Reject verification"
          className="max-w-sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setActiveModal(null)} disabled={isActioning}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={isActioning}
                disabled={!rejectionReason.trim()}
                onClick={() =>
                  void handleDecision(
                    selectedFarmer._id,
                    VerificationStatus.REJECTED,
                    rejectionReason,
                  )
                }
              >
                Reject farmer
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="app-body text-app-muted">
              Provide a reason for rejecting {fullName(selectedFarmer)}.
              They will be notified via SMS.
            </p>
            <Input
              label="Rejection reason"
              placeholder="e.g. Document number could not be verified"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              error={actionError ?? undefined}
            />
          </div>
        </Modal>
      )}

      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      {activeModal?.type === 'detail' && selectedFarmer && (
        <Modal
          open
          onClose={() => setActiveModal(null)}
          title={fullName(selectedFarmer)}
          className="max-w-lg"
          footer={
            <div className="flex w-full gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setActiveModal({ type: 'approve', farmer: selectedFarmer })}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  setActiveModal({ type: 'reject', farmer: selectedFarmer });
                  setRejectionReason('');
                  setActionError(null);
                }}
              >
                Reject
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Personal info */}
            <div className="grid grid-cols-2 gap-3">
              <DetailTile label="Phone">
                <span className="font-app-mono">{selectedFarmer.phoneNumber}</span>
              </DetailTile>
              <DetailTile label="County">{selectedFarmer.county}</DetailTile>
              {selectedFarmer.farmerData.farmSizeAcres && (
                <DetailTile label="Farm size">
                  {selectedFarmer.farmerData.farmSizeAcres} acres
                </DetailTile>
              )}
              <DetailTile label="Registered">{formatDate(selectedFarmer.createdAt)}</DetailTile>
            </div>

            {/* Crops */}
            <div>
              <p className="app-label mb-2 text-app-muted">Crops grown</p>
              <div className="flex flex-wrap gap-2">
                {selectedFarmer.farmerData.cropsGrown.map((crop) => (
                  <span
                    key={crop}
                    className="app-meta rounded-app-pill border border-app-hairline bg-app-sunken px-2 py-1 text-app-muted"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>

            {/* Verification document */}
            {selectedFarmer.farmerData.verificationDocument ? (
              <div className="space-y-3">
                <p className="app-label text-app-muted">Verification document</p>
                <div className="grid grid-cols-2 gap-3">
                  <DetailTile label="Type">
                    {docTypeLabel(selectedFarmer.farmerData.verificationDocument.documentType)}
                  </DetailTile>
                  <DetailTile label="Number">
                    <span className="font-app-mono">
                      {selectedFarmer.farmerData.verificationDocument.documentNumber}
                    </span>
                  </DetailTile>
                  <DetailTile label="Submitted">
                    {formatDate(selectedFarmer.farmerData.verificationDocument.submittedAt)}
                  </DetailTile>
                </div>
                <DocumentPreview
                  url={selectedFarmer.farmerData.verificationDocument.documentImageUrl}
                />
              </div>
            ) : (
              <div className="rounded-app-control bg-app-sunken p-3">
                <span className="app-label inline-flex items-center rounded-app-pill bg-app-card px-2 py-0.5 text-app-muted">
                  Pending
                </span>
                <p className="app-body mt-1 text-app-faint">
                  No verification document submitted yet
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Page>
  );
}
