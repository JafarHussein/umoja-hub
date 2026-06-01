'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Role, DocumentType, VerificationStatus } from '@/types';

interface IFarmerDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  county: string;
  status: string;
  isEmailVerified: boolean;
  createdAt: string;
  farmerData?: {
    verificationStatus: VerificationStatus;
    isVerified: boolean;
    documentType?: DocumentType;
    documentImageUrl?: string;
    documentNumber?: string;
    cropsGrown: string[];
    livestockKept: string[];
    farmSizeAcres?: number;
    primaryLanguage?: string;
  };
}

type PageState = 'loading' | 'ready' | 'not-found' | 'error';
type ActiveModal = 'approve' | 'reject' | null;

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.NATIONAL_ID]: 'National ID',
  [DocumentType.COOPERATIVE_CARD]: 'Cooperative Card',
  [DocumentType.PASSPORT]: 'Passport',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PageSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="h-3 w-36 bg-surface-secondary rounded-sm animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-20 bg-surface-secondary rounded-sm animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-7 w-52 bg-surface-secondary rounded-sm animate-pulse" />
          <div className="h-5 w-16 bg-surface-secondary rounded-sm animate-pulse" />
        </div>
      </div>
      {[4, 3, 2].map((rows, i) => (
        <div key={i} className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-4 space-y-3">
          <div className="h-3 w-28 bg-surface-secondary rounded-sm animate-pulse" />
          <div>
            {Array.from({ length: rows }).map((_, j) => (
              <div
                key={j}
                className="flex justify-between py-2.5 border-b border-zinc-800/50 last:border-0"
              >
                <div className="h-4 w-24 bg-surface-secondary rounded-sm animate-pulse" />
                <div className="h-4 w-36 bg-surface-secondary rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <div className="h-11 w-32 bg-surface-secondary rounded-sm animate-pulse" />
        <div className="h-11 w-24 bg-surface-secondary rounded-sm animate-pulse" />
      </div>
    </div>
  );
}

export default function AdminFarmerDetailPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const farmerId = typeof params.farmerId === 'string' ? params.farmerId : '';

  const [farmer, setFarmer] = useState<IFarmerDetail | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchFarmer = useCallback(async (): Promise<void> => {
    if (!farmerId) return;
    setPageState('loading');
    try {
      const res = await fetch(`/api/admin/farmers/${farmerId}`);
      if (res.status === 404) {
        setPageState('not-found');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const body = (await res.json()) as { data: IFarmerDetail };
      setFarmer(body.data);
      setVerificationStatus(body.data.farmerData?.verificationStatus ?? null);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [farmerId]);

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
      void fetchFarmer();
    }
  }, [status, session, router, fetchFarmer]);

  async function handleDecision(
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
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(typeof body.error === 'string' ? body.error : 'Action failed. Try again.');
        return;
      }
      setVerificationStatus(decision);
      setActiveModal(null);
      setRejectionReason('');
    } finally {
      setIsActioning(false);
    }
  }

  if (status === 'loading' || pageState === 'loading') {
    return <PageSkeleton />;
  }

  if (pageState === 'not-found') {
    return (
      <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-8 text-center">
        <p className="text-t4 font-body text-text-primary">Farmer not found.</p>
        <p className="text-t5 font-body text-text-secondary mt-1">
          This record may have been removed or the ID is invalid.
        </p>
        <div className="mt-4">
          <Link href="/dashboard/admin/verification-queue">
            <Button variant="secondary" size="sm">
              Back to queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load farmer profile
        </p>
        <p className="text-t5 font-body text-text-secondary mb-4">
          Check your connection and try again.
        </p>
        <Button variant="secondary" onClick={() => void fetchFarmer()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!farmer) return <PageSkeleton />;

  const isPending = verificationStatus === VerificationStatus.PENDING;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/admin/verification-queue"
        className="inline-flex items-center gap-1.5 text-t6 font-body text-text-disabled hover:text-text-secondary transition-colors duration-150"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M8 10L4 6L8 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Verification queue
      </Link>

      {/* Page header */}
      <div>
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
          Admin · Farmer Verification
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-t2 font-heading font-semibold text-text-primary tracking-tight">
            {farmer.firstName} {farmer.lastName}
          </h1>
          {verificationStatus && <Badge label={verificationStatus} />}
        </div>
      </div>

      {/* Personal information */}
      <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-4">
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
          Personal information
        </p>
        <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
          <span className="text-t5 font-body text-text-secondary">Phone</span>
          <span className="text-t5 font-mono text-text-primary tabular-nums">{farmer.phoneNumber}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
          <span className="text-t5 font-body text-text-secondary">Email</span>
          <span className="text-t5 font-mono text-text-primary">{farmer.email}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
          <span className="text-t5 font-body text-text-secondary">County</span>
          <span className="text-t5 font-body text-text-primary">{farmer.county}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-t5 font-body text-text-secondary">Registered</span>
          <span className="text-t5 font-body text-text-disabled">{formatDate(farmer.createdAt)}</span>
        </div>
      </div>

      {/* Farm details */}
      <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-4 space-y-3">
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
          Farm details
        </p>
        {farmer.farmerData ? (
          <>
            {farmer.farmerData.cropsGrown.length > 0 && (
              <div>
                <p className="text-t6 font-body text-text-secondary mb-2">Crops grown</p>
                <div className="flex flex-wrap gap-2">
                  {farmer.farmerData.cropsGrown.map((crop) => (
                    <span
                      key={crop}
                      className="text-t6 font-body text-text-secondary bg-surface-secondary border border-zinc-800/50 rounded-[2px] px-2 py-1"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {farmer.farmerData.livestockKept.length > 0 && (
              <div>
                <p className="text-t6 font-body text-text-secondary mb-2">Livestock kept</p>
                <div className="flex flex-wrap gap-2">
                  {farmer.farmerData.livestockKept.map((animal) => (
                    <span
                      key={animal}
                      className="text-t6 font-body text-text-secondary bg-surface-secondary border border-zinc-800/50 rounded-[2px] px-2 py-1"
                    >
                      {animal}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(farmer.farmerData.farmSizeAcres != null || farmer.farmerData.primaryLanguage) && (
              <div className="border-t border-zinc-800/50 pt-1">
                {farmer.farmerData.farmSizeAcres != null && (
                  <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-0">
                    <span className="text-t5 font-body text-text-secondary">Farm size</span>
                    <span className="text-t5 font-mono text-text-primary tabular-nums">
                      {farmer.farmerData.farmSizeAcres} acres
                    </span>
                  </div>
                )}
                {farmer.farmerData.primaryLanguage && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-t5 font-body text-text-secondary">Primary language</span>
                    <span className="text-t5 font-body text-text-primary">
                      {farmer.farmerData.primaryLanguage}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-t5 font-body text-text-disabled">No farm data on record.</p>
        )}
      </div>

      {/* Verification document */}
      <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-4 space-y-1">
        <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
          Verification document
        </p>
        {farmer.farmerData?.documentType ? (
          <>
            <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
              <span className="text-t5 font-body text-text-secondary">Type</span>
              <span className="text-t5 font-body text-text-primary">
                {DOC_TYPE_LABELS[farmer.farmerData.documentType]}
              </span>
            </div>
            {farmer.farmerData.documentNumber && (
              <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
                <span className="text-t5 font-body text-text-secondary">Number</span>
                <span className="text-t5 font-mono text-text-primary tabular-nums">
                  {farmer.farmerData.documentNumber}
                </span>
              </div>
            )}
            {farmer.farmerData.documentImageUrl && (
              <div className="py-2.5">
                <a
                  href={farmer.farmerData.documentImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-t5 font-body text-accent-green hover:underline underline-offset-2"
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
            )}
          </>
        ) : (
          <p className="text-t5 font-body text-text-disabled">No verification document submitted.</p>
        )}
      </div>

      {/* Actions */}
      {isPending ? (
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => {
              setActiveModal('approve');
              setActionError(null);
            }}
          >
            Approve farmer
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setActiveModal('reject');
              setRejectionReason('');
              setActionError(null);
            }}
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm px-4 py-3">
          <p className="text-t5 font-body text-text-secondary">
            Verification is{' '}
            <span className="text-text-primary font-medium">
              {verificationStatus?.toLowerCase() ?? 'not set'}
            </span>
            . No further action required.
          </p>
        </div>
      )}

      {/* Approve confirm modal */}
      <ConfirmModal
        isOpen={activeModal === 'approve'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => void handleDecision(VerificationStatus.APPROVED)}
        title="Approve verification"
        message={`Approve ${farmer.firstName} ${farmer.lastName} as a verified farmer? This will grant them a 40-point trust score and send an SMS notification.`}
        confirmLabel="Approve farmer"
        isLoading={isActioning}
      />

      {/* Reject modal */}
      {activeModal === 'reject' && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title="Reject verification"
          description={`Provide a reason for rejecting ${farmer.firstName} ${farmer.lastName}. They will be notified via SMS.`}
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
              <Button variant="ghost" onClick={() => setActiveModal(null)} disabled={isActioning}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                isLoading={isActioning}
                disabled={!rejectionReason.trim()}
                onClick={() => void handleDecision(VerificationStatus.REJECTED, rejectionReason)}
              >
                Reject farmer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
