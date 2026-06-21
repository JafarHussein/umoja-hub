'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Input, Table, THead, TH, TR, TD } from '@/components/app';
import { Role, DocumentType, VerificationStatus } from '@/types';

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
      router.push('/auth/login');
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
      <div className="space-y-6">
        <div className="skeleton h-7 w-48 rounded" />
        <div className="skeleton h-64 rounded-app-card" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="app-title mb-2 text-app-ink">Could not load verification queue</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchQueue()}>
          Retry
        </Button>
      </div>
    );
  }

  const selectedFarmer =
    activeModal?.type === 'detail' || activeModal?.type === 'reject'
      ? activeModal.farmer
      : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="app-h1 text-app-ink">Verification queue</h1>
        <p className="app-body mt-1 text-app-muted">
          {total} pending verification{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {farmers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-app-card border border-app-hairline bg-app-card py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-app-control border border-app-hairline bg-app-sunken">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 8L7 12L17 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-app-brand"
              />
            </svg>
          </div>
          <p className="app-body-strong mb-1 text-app-ink">Queue is clear</p>
          <p className="app-body text-app-muted">
            All farmer verification requests have been reviewed.
          </p>
        </div>
      ) : (
        /* Queue table */
        <Table>
          <THead>
            <TH>Farmer</TH>
            <TH>County</TH>
            <TH>Document</TH>
            <TH>Submitted</TH>
            <TH className="text-right">Actions</TH>
          </THead>
          <tbody>
            {farmers.map((farmer) => (
              <TR key={farmer._id}>
                <TD>
                  <p className="app-body-strong text-app-ink">
                    {farmer.firstName} {farmer.lastName}
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
            Approve {activeModal.farmer.firstName} {activeModal.farmer.lastName} as a verified
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
              Provide a reason for rejecting {selectedFarmer.firstName} {selectedFarmer.lastName}.
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
          title={`${selectedFarmer.firstName} ${selectedFarmer.lastName}`}
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
                </div>
                <a
                  href={selectedFarmer.farmerData.verificationDocument.documentImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-body inline-flex items-center gap-2 text-app-brand transition-colors duration-150 hover:text-app-brand-hover"
                >
                  View document image
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
    </div>
  );
}
