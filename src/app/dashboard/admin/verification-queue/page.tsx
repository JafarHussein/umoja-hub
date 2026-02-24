'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
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
        <div className="skeleton h-6 w-48 rounded" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load verification queue
        </p>
        <p className="text-t5 font-body text-text-secondary mb-4">
          Check your connection and try again.
        </p>
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
        <h1 className="text-t2 font-heading font-semibold text-text-primary">
          Verification queue
        </h1>
        <p className="text-t5 font-body text-text-secondary mt-0.5">
          {total} pending verification{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {farmers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded bg-surface-elevated">
          <div className="w-12 h-12 rounded bg-surface-secondary border border-white/5 flex items-center justify-center mb-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8L7 12L17 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-accent-green"
              />
            </svg>
          </div>
          <p className="text-t4 font-body font-medium text-text-primary mb-1">
            Queue is clear
          </p>
          <p className="text-t5 font-body text-text-secondary">
            All farmer verification requests have been reviewed.
          </p>
        </div>
      ) : (
        /* Queue table */
        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5">
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Farmer
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              County
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Document
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Submitted
            </span>
            <span className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
              Actions
            </span>
          </div>

          {farmers.map((farmer) => (
            <div
              key={farmer._id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
            >
              {/* Farmer name + crops */}
              <div className="min-w-0">
                <p className="text-t5 font-body font-medium text-text-primary">
                  {farmer.firstName} {farmer.lastName}
                </p>
                <p className="text-t6 font-body text-text-disabled truncate">
                  {farmer.farmerData.cropsGrown.join(', ')}
                </p>
              </div>

              {/* County */}
              <span className="text-t5 font-body text-text-secondary">{farmer.county}</span>

              {/* Document type */}
              <span className="text-t6 font-mono text-text-secondary">
                {farmer.farmerData.verificationDocument
                  ? docTypeLabel(farmer.farmerData.verificationDocument.documentType)
                  : '—'}
              </span>

              {/* Submission date */}
              <span className="text-t6 font-body text-text-disabled">
                {farmer.farmerData.verificationDocument
                  ? formatDate(farmer.farmerData.verificationDocument.submittedAt)
                  : formatDate(farmer.createdAt)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2">
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
                  variant="destructive"
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
            </div>
          ))}
        </div>
      )}

      {/* ── Approve confirm modal ──────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={activeModal?.type === 'approve'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => {
          if (activeModal?.type === 'approve') {
            void handleDecision(activeModal.farmer._id, VerificationStatus.APPROVED);
          }
        }}
        title="Approve verification"
        message={
          activeModal?.type === 'approve'
            ? `Approve ${activeModal.farmer.firstName} ${activeModal.farmer.lastName} as a verified farmer? This will grant them a 40-point trust score and send an SMS notification.`
            : ''
        }
        confirmLabel="Approve farmer"
        isLoading={isActioning}
      />

      {/* ── Reject modal ──────────────────────────────────────────────────── */}
      {activeModal?.type === 'reject' && selectedFarmer && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="Reject verification"
          description={`Provide a reason for rejecting ${selectedFarmer.firstName} ${selectedFarmer.lastName}. They will be notified via SMS.`}
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="Rejection reason"
              placeholder="e.g. Document number could not be verified"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              error={actionError ?? undefined}
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setActiveModal(null)}
                disabled={isActioning}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
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
            </div>
          </div>
        </Modal>
      )}

      {/* ── Detail modal ──────────────────────────────────────────────────── */}
      {activeModal?.type === 'detail' && selectedFarmer && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title={`${selectedFarmer.firstName} ${selectedFarmer.lastName}`}
          size="md"
        >
          <div className="space-y-5">
            {/* Personal info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  Phone
                </p>
                <p className="text-t5 font-mono text-text-primary">
                  {selectedFarmer.phoneNumber}
                </p>
              </div>
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  County
                </p>
                <p className="text-t5 font-body text-text-primary">
                  {selectedFarmer.county}
                </p>
              </div>
              {selectedFarmer.farmerData.farmSizeAcres && (
                <div className="bg-surface-secondary rounded p-3">
                  <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                    Farm size
                  </p>
                  <p className="text-t5 font-body text-text-primary">
                    {selectedFarmer.farmerData.farmSizeAcres} acres
                  </p>
                </div>
              )}
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  Registered
                </p>
                <p className="text-t5 font-body text-text-primary">
                  {formatDate(selectedFarmer.createdAt)}
                </p>
              </div>
            </div>

            {/* Crops */}
            <div>
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
                Crops grown
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedFarmer.farmerData.cropsGrown.map((crop) => (
                  <span
                    key={crop}
                    className="text-t6 font-body text-text-secondary bg-surface-secondary border border-white/5 rounded-[2px] px-2 py-1"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>

            {/* Verification document */}
            {selectedFarmer.farmerData.verificationDocument ? (
              <div className="space-y-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                  Verification document
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-secondary rounded p-3">
                    <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                      Type
                    </p>
                    <p className="text-t5 font-body text-text-primary">
                      {docTypeLabel(selectedFarmer.farmerData.verificationDocument.documentType)}
                    </p>
                  </div>
                  <div className="bg-surface-secondary rounded p-3">
                    <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                      Number
                    </p>
                    <p className="text-t5 font-mono text-text-primary">
                      {selectedFarmer.farmerData.verificationDocument.documentNumber}
                    </p>
                  </div>
                </div>
                <a
                  href={selectedFarmer.farmerData.verificationDocument.documentImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-t5 font-body text-accent-green hover:underline underline-offset-2"
                >
                  View document image
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
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
              <div className="bg-surface-secondary rounded p-3">
                <Badge label="PENDING" />
                <p className="text-t5 font-body text-text-disabled mt-1">
                  No verification document submitted yet
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setActiveModal({ type: 'approve', farmer: selectedFarmer });
                }}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
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
          </div>
        </Modal>
      )}
    </div>
  );
}
