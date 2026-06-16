'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
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

function PageSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="h-3 w-36 bg-surface-raised rounded-sm animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-20 bg-surface-raised rounded-sm animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-7 w-52 bg-surface-raised rounded-sm animate-pulse" />
          <div className="h-5 w-16 bg-surface-raised rounded-sm animate-pulse" />
        </div>
      </div>
      {[4, 3].map((rows, i) => (
        <div key={i} className="bg-surface border border-zinc-800/50 rounded-sm p-4 space-y-3">
          <div className="h-3 w-28 bg-surface-raised rounded-sm animate-pulse" />
          <div>
            {Array.from({ length: rows }).map((_, j) => (
              <div
                key={j}
                className="flex justify-between py-2.5 border-b border-zinc-800/50 last:border-0"
              >
                <div className="h-4 w-24 bg-surface-raised rounded-sm animate-pulse" />
                <div className="h-4 w-36 bg-surface-raised rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-3">
        <div className="h-11 w-32 bg-surface-raised rounded-sm animate-pulse" />
        <div className="h-11 w-24 bg-surface-raised rounded-sm animate-pulse" />
      </div>
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
      <div className="bg-surface border border-zinc-800/50 rounded-sm p-8 text-center">
        <p className="text-t4 font-body text-fg">Supplier not found.</p>
        <p className="text-t5 font-body text-fg-muted mt-1">
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
        <p className="text-t4 font-body font-medium text-fg mb-2">
          Could not load supplier profile
        </p>
        <p className="text-t5 font-body text-fg-muted mb-4">
          Check your connection and try again.
        </p>
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
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/admin/supplier-verification"
        className="inline-flex items-center gap-1.5 text-t6 font-body text-fg-disabled hover:text-fg-muted transition-colors duration-150"
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
        <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-1">
          Admin · Supplier Verification
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-t2 font-heading font-semibold text-fg tracking-tight">
            {supplier.businessName}
          </h1>
          {verificationStatus && <Badge label={verificationStatus} />}
        </div>
      </div>

      {/* Business information */}
      <div className="bg-surface border border-zinc-800/50 rounded-sm p-4">
        <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-2">
          Business information
        </p>
        <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
          <span className="text-t5 font-body text-fg-muted">Phone</span>
          <span className="text-t5 font-mono text-fg tabular-nums">
            {supplier.contactPhone}
          </span>
        </div>
        {supplier.contactEmail && (
          <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
            <span className="text-t5 font-body text-fg-muted">Email</span>
            <span className="text-t5 font-mono text-fg">{supplier.contactEmail}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
          <span className="text-t5 font-body text-fg-muted">County</span>
          <span className="text-t5 font-body text-fg">{supplier.county}</span>
        </div>
        {supplier.physicalAddress && (
          <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50">
            <span className="text-t5 font-body text-fg-muted">Address</span>
            <span className="text-t5 font-body text-fg">{supplier.physicalAddress}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-2.5">
          <span className="text-t5 font-body text-fg-muted">Registered</span>
          <span className="text-t5 font-body text-fg-disabled">{formatDate(supplier.createdAt)}</span>
        </div>
      </div>

      {/* Input categories */}
      {supplier.inputCategories.length > 0 && (
        <div className="bg-surface border border-zinc-800/50 rounded-sm p-4 space-y-3">
          <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest">
            Input categories
          </p>
          <div className="flex flex-wrap gap-2">
            {supplier.inputCategories.map((cat) => (
              <span
                key={cat}
                className="text-t6 font-mono text-fg-muted bg-surface-raised border border-zinc-800/50 rounded-[2px] px-2 py-1 uppercase"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Regulatory registrations */}
      {regLines.length > 0 && (
        <div className="bg-surface border border-zinc-800/50 rounded-sm p-4">
          <p className="text-t6 font-mono text-fg-disabled uppercase tracking-widest mb-2">
            Regulatory registrations
          </p>
          {regLines.map((reg, i) => (
            <div
              key={reg.label}
              className={`flex items-center justify-between py-2.5 ${i < regLines.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
            >
              <span className="text-t5 font-body text-fg-muted">{reg.label}</span>
              <span className="text-t5 font-mono text-fg tabular-nums">{reg.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isPending ? (
        <>
          {actionError && (
            <p role="alert" className="text-t5 font-body text-red-400">
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
              variant="destructive"
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
        <div className="bg-surface border border-zinc-800/50 rounded-sm px-4 py-3">
          <p className="text-t5 font-body text-fg-muted">
            Supplier is{' '}
            <span className="text-fg font-medium">
              {verificationStatus?.toLowerCase() ?? 'not reviewed'}
            </span>
            . No further action required.
          </p>
        </div>
      )}

      {/* Verify confirm modal */}
      <ConfirmModal
        isOpen={activeModal === 'verify'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => void handleAction('VERIFIED')}
        title="Verify supplier"
        message={`Verify ${supplier.businessName} as a trusted input supplier? They will be listed as verified on the platform.`}
        confirmLabel="Verify supplier"
        isLoading={isActioning}
      />

      {/* Suspend confirm modal */}
      <ConfirmModal
        isOpen={activeModal === 'suspend'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => void handleAction('SUSPENDED')}
        title="Suspend supplier"
        message={`Suspend ${supplier.businessName}? Their profile will be marked as suspended and they will not appear as verified.`}
        confirmLabel="Suspend supplier"
        isLoading={isActioning}
      />
    </div>
  );
}
