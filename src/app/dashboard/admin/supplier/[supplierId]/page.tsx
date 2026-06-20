'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Modal, VerificationBadge } from '@/components/app';
import { Role, SupplierVerificationStatus } from '@/types';

interface IRegistrations {
  kebsNumber?: string;
  pcpbNumber?: string;
  kephisNumber?: string;
}

interface ISupplierDetail {
  _id: string;
  businessName: string;
  contactPhone: string;
  contactEmail?: string;
  county: string;
  physicalAddress?: string;
  inputCategories: string[];
  registrations?: IRegistrations;
  verificationStatus: SupplierVerificationStatus;
  createdAt: string;
}

type PageState = 'loading' | 'ready' | 'not-found' | 'error';
type ActiveModal = 'verify' | 'suspend' | null;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-app-card border border-app-hairline bg-app-card p-4">
      <p className="app-label mb-2 text-app-muted">{title}</p>
      {children}
    </div>
  );
}

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

function StatusBadge({ status }: { status: SupplierVerificationStatus }): React.ReactElement {
  switch (status) {
    case SupplierVerificationStatus.VERIFIED:
      return <VerificationBadge state="verified" />;
    case SupplierVerificationStatus.SUSPENDED:
      return <VerificationBadge state="denied" label="Suspended" />;
    default:
      return <VerificationBadge state="pending" />;
  }
}

function PageSkeleton(): React.ReactElement {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="skeleton h-3 w-36 rounded" />
      <div className="skeleton h-7 w-52 rounded" />
      <div className="skeleton h-40 rounded-app-card" />
      <div className="skeleton h-24 rounded-app-card" />
    </div>
  );
}

export default function AdminSupplierDetailPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const supplierId = typeof params.supplierId === 'string' ? params.supplierId : '';

  const [supplier, setSupplier] = useState<ISupplierDetail | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [verificationStatus, setVerificationStatus] = useState<SupplierVerificationStatus | null>(
    null,
  );
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSupplier = useCallback(async (): Promise<void> => {
    if (!supplierId) return;
    setPageState('loading');
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}`);
      if (res.status === 404) {
        setPageState('not-found');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const body = (await res.json()) as { data: ISupplierDetail };
      setSupplier(body.data);
      setVerificationStatus(body.data.verificationStatus);
      setPageState('ready');
    } catch {
      setPageState('error');
    }
  }, [supplierId]);

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
      void fetchSupplier();
    }
  }, [status, session, router, fetchSupplier]);

  async function handleAction(decision: 'VERIFIED' | 'SUSPENDED'): Promise<void> {
    setIsActioning(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/verify-supplier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, decision }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(typeof body.error === 'string' ? body.error : 'Action failed. Try again.');
        return;
      }
      setVerificationStatus(
        decision === 'VERIFIED'
          ? SupplierVerificationStatus.VERIFIED
          : SupplierVerificationStatus.SUSPENDED,
      );
      setActiveModal(null);
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
        <p className="app-title text-app-ink">Supplier not found.</p>
        <p className="app-body mt-1 text-app-muted">
          This record may have been removed or the ID is invalid.
        </p>
        <div className="mt-4">
          <Link href="/dashboard/admin/supplier-verification">
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
        <p className="app-title mb-2 text-app-ink">Could not load supplier profile</p>
        <p className="app-body mb-4 text-app-muted">Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void fetchSupplier()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!supplier) return <PageSkeleton />;

  const isPending = verificationStatus === SupplierVerificationStatus.PENDING;

  const registrations = supplier.registrations ?? {};
  const regLines = (
    [
      registrations.kebsNumber ? { label: 'KEBS', value: registrations.kebsNumber } : null,
      registrations.pcpbNumber ? { label: 'PCPB', value: registrations.pcpbNumber } : null,
      registrations.kephisNumber ? { label: 'KEPHIS', value: registrations.kephisNumber } : null,
    ] as Array<{ label: string; value: string } | null>
  ).filter((r): r is { label: string; value: string } => r !== null);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/admin/supplier-verification"
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
        Supplier verification
      </Link>

      {/* Page header */}
      <div>
        <p className="app-label mb-1 text-app-faint">Admin · Supplier Verification</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="app-h1 text-app-ink">{supplier.businessName}</h1>
          {verificationStatus && <StatusBadge status={verificationStatus} />}
        </div>
      </div>

      {/* Business information */}
      <Section title="Business information">
        <InfoRow label="Phone" mono>
          {supplier.contactPhone}
        </InfoRow>
        {supplier.contactEmail && (
          <InfoRow label="Email" mono>
            {supplier.contactEmail}
          </InfoRow>
        )}
        <InfoRow label="County">{supplier.county}</InfoRow>
        {supplier.physicalAddress && <InfoRow label="Address">{supplier.physicalAddress}</InfoRow>}
        <InfoRow label="Registered">{formatDate(supplier.createdAt)}</InfoRow>
      </Section>

      {/* Input categories */}
      {supplier.inputCategories.length > 0 && (
        <Section title="Input categories">
          <div className="flex flex-wrap gap-2">
            {supplier.inputCategories.map((cat) => (
              <span
                key={cat}
                className="app-meta rounded-app-pill border border-app-hairline bg-app-sunken px-2 py-1 uppercase text-app-muted"
              >
                {cat}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Regulatory registrations */}
      {regLines.length > 0 && (
        <Section title="Regulatory registrations">
          {regLines.map((reg) => (
            <InfoRow key={reg.label} label={reg.label} mono>
              {reg.value}
            </InfoRow>
          ))}
        </Section>
      )}

      {/* Actions */}
      {isPending ? (
        <>
          {actionError && (
            <p role="alert" className="app-body text-app-danger">
              {actionError}
            </p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => {
                setActiveModal('verify');
                setActionError(null);
              }}
            >
              Verify supplier
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setActiveModal('suspend');
                setActionError(null);
              }}
            >
              Suspend
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-app-card border border-app-hairline bg-app-card px-4 py-3">
          <p className="app-body text-app-muted">
            Supplier is{' '}
            <span className="app-body-strong text-app-ink">
              {verificationStatus?.toLowerCase() ?? 'not reviewed'}
            </span>
            . No further action required.
          </p>
        </div>
      )}

      {/* Verify confirm modal */}
      <Modal
        open={activeModal === 'verify'}
        onClose={() => setActiveModal(null)}
        title="Verify supplier"
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveModal(null)} disabled={isActioning}>
              Cancel
            </Button>
            <Button variant="primary" isLoading={isActioning} onClick={() => void handleAction('VERIFIED')}>
              Verify supplier
            </Button>
          </>
        }
      >
        <p className="app-body text-app-body">
          Verify {supplier.businessName} as a trusted input supplier? They will be listed as
          verified on the platform.
        </p>
      </Modal>

      {/* Suspend confirm modal */}
      <Modal
        open={activeModal === 'suspend'}
        onClose={() => setActiveModal(null)}
        title="Suspend supplier"
        footer={
          <>
            <Button variant="ghost" onClick={() => setActiveModal(null)} disabled={isActioning}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={isActioning} onClick={() => void handleAction('SUSPENDED')}>
              Suspend supplier
            </Button>
          </>
        }
      >
        <p className="app-body text-app-body">
          Suspend {supplier.businessName}? Their profile will be marked as suspended and they will
          not appear as verified.
        </p>
      </Modal>
    </div>
  );
}
