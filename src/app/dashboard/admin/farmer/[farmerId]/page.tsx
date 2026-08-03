'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Modal, Input, VerificationBadge } from '@/components/app';
import { Role, DocumentType, VerificationStatus } from '@/types';
import { loginUrlWithIntent } from '@/lib/auth/intent';

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

// Bordered card section with an uppercase section label.
function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
      <p className="app-label mb-2 text-app-muted">{title}</p>
      {children}
    </div>
  );
}

// Key/value row with a bottom hairline (last row drops it).
function InfoRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-app-hairline py-2.5 last:border-0">
      <span className="app-body text-app-muted">{label}</span>
      <span className={mono ? 'app-data-m text-app-ink' : 'app-body text-right text-app-ink'}>
        {children}
      </span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="app-meta rounded-app-pill border border-app-hairline bg-app-sunken px-2 py-1 text-app-muted">
      {children}
    </span>
  );
}

// Verification status as a trust badge (status by icon + text, never colour
// alone).
function StatusBadge({ status }: { status: VerificationStatus }): React.ReactElement {
  switch (status) {
    case VerificationStatus.APPROVED:
      return <VerificationBadge state="verified" />;
    case VerificationStatus.REJECTED:
      return <VerificationBadge state="denied" label="Rejected" />;
    default:
      return <VerificationBadge state="pending" />;
  }
}

function PageSkeleton(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-app-focus space-y-10">
      <div className="skeleton h-3 w-36 rounded" />
      <div className="skeleton h-7 w-52 rounded" />
      <div className="skeleton h-40 rounded-app-card" />
      <div className="skeleton h-32 rounded-app-card" />
      <div className="skeleton h-24 rounded-app-card" />
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
      router.push(loginUrlWithIntent());
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
      <div className="rounded-app-card border border-app-hairline bg-app-card p-8 text-center">
        <p className="app-title text-app-ink">Farmer not found.</p>
        <p className="app-body mt-1 text-app-muted">
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
        <p className="app-title mb-2 text-app-ink">Could not load farmer profile</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchFarmer()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!farmer) return <PageSkeleton />;

  const isPending = verificationStatus === VerificationStatus.PENDING;

  return (
    <div className="mx-auto w-full max-w-app-focus space-y-10">
      {/* Back link */}
      <Link
        href="/dashboard/admin/verification-queue"
        className="app-meta inline-flex items-center gap-1.5 text-app-muted transition-colors duration-150 hover:text-app-ink"
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
        <p className="app-label mb-1 text-app-faint">Admin · Farmer Verification</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="app-h1 text-app-ink">
            {farmer.firstName} {farmer.lastName}
          </h1>
          {verificationStatus && <StatusBadge status={verificationStatus} />}
        </div>
      </div>

      {/* Personal information */}
      <Section title="Personal information">
        <InfoRow label="Phone" mono>
          {farmer.phoneNumber}
        </InfoRow>
        <InfoRow label="Email" mono>
          {farmer.email}
        </InfoRow>
        <InfoRow label="County">{farmer.county}</InfoRow>
        <InfoRow label="Registered">{formatDate(farmer.createdAt)}</InfoRow>
      </Section>

      {/* Farm details */}
      <Section title="Farm details">
        {farmer.farmerData ? (
          <div className="space-y-3">
            {farmer.farmerData.cropsGrown.length > 0 && (
              <div>
                <p className="app-meta mb-2 text-app-muted">Crops grown</p>
                <div className="flex flex-wrap gap-2">
                  {farmer.farmerData.cropsGrown.map((crop) => (
                    <Chip key={crop}>{crop}</Chip>
                  ))}
                </div>
              </div>
            )}
            {farmer.farmerData.livestockKept.length > 0 && (
              <div>
                <p className="app-meta mb-2 text-app-muted">Livestock kept</p>
                <div className="flex flex-wrap gap-2">
                  {farmer.farmerData.livestockKept.map((animal) => (
                    <Chip key={animal}>{animal}</Chip>
                  ))}
                </div>
              </div>
            )}
            {(farmer.farmerData.farmSizeAcres != null || farmer.farmerData.primaryLanguage) && (
              <div className="border-t border-app-hairline pt-1">
                {farmer.farmerData.farmSizeAcres != null && (
                  <InfoRow label="Farm size" mono>
                    {farmer.farmerData.farmSizeAcres} acres
                  </InfoRow>
                )}
                {farmer.farmerData.primaryLanguage && (
                  <InfoRow label="Primary language">{farmer.farmerData.primaryLanguage}</InfoRow>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="app-body text-app-faint">No farm data on record.</p>
        )}
      </Section>

      {/* Verification document */}
      <Section title="Verification document">
        {farmer.farmerData?.documentType ? (
          <>
            <InfoRow label="Type">{DOC_TYPE_LABELS[farmer.farmerData.documentType]}</InfoRow>
            {farmer.farmerData.documentNumber && (
              <InfoRow label="Number" mono>
                {farmer.farmerData.documentNumber}
              </InfoRow>
            )}
            {farmer.farmerData.documentImageUrl && (
              <div className="py-2.5">
                <a
                  href={farmer.farmerData.documentImageUrl}
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
            )}
          </>
        ) : (
          <p className="app-body text-app-faint">No verification document submitted.</p>
        )}
      </Section>

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
            variant="danger"
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
        <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-3">
          <p className="app-body text-app-muted">
            Verification is{' '}
            <span className="app-body-strong text-app-ink">
              {verificationStatus?.toLowerCase() ?? 'not set'}
            </span>
            . No further action required.
          </p>
        </div>
      )}

      {/* Approve confirm modal */}
      <Modal
        open={activeModal === 'approve'}
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
              onClick={() => void handleDecision(VerificationStatus.APPROVED)}
            >
              Approve farmer
            </Button>
          </>
        }
      >
        <p className="app-body text-app-body">
          Approve {farmer.firstName} {farmer.lastName} as a verified farmer? This will grant them a
          40-point trust score and send an SMS notification.
        </p>
      </Modal>

      {/* Reject modal */}
      {activeModal === 'reject' && (
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
                onClick={() => void handleDecision(VerificationStatus.REJECTED, rejectionReason)}
              >
                Reject farmer
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="app-body text-app-muted">
              Provide a reason for rejecting {farmer.firstName} {farmer.lastName}. They will be
              notified via SMS.
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
    </div>
  );
}
