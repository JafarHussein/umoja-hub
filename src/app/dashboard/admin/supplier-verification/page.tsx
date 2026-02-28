'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import { Role, SupplierVerificationStatus, SupplierInputCategory } from '@/types';

interface IRegistrations {
  kebsNumber?: string;
  pcpbNumber?: string;
  kephisNumber?: string;
}

interface IPendingSupplier {
  _id: string;
  businessName: string;
  contactPhone: string;
  contactEmail?: string;
  county: string;
  physicalAddress?: string;
  inputCategories: SupplierInputCategory[];
  registrations: IRegistrations;
  verificationStatus: SupplierVerificationStatus;
  createdAt: string;
}

interface IQueueResponse {
  data: IPendingSupplier[];
  nextCursor: string | null;
  hasMore: boolean;
  meta: { queueSize: number };
}

type PageState = 'loading' | 'ready' | 'error';
type ActionModal =
  | { type: 'verify'; supplier: IPendingSupplier }
  | { type: 'suspend'; supplier: IPendingSupplier }
  | { type: 'detail'; supplier: IPendingSupplier }
  | null;

const CATEGORY_LABELS: Record<SupplierInputCategory, string> = {
  [SupplierInputCategory.FERTILIZER]: 'Fertilizer',
  [SupplierInputCategory.SEED]: 'Seed',
  [SupplierInputCategory.PESTICIDE]: 'Pesticide',
  [SupplierInputCategory.VETERINARY]: 'Veterinary',
  [SupplierInputCategory.EQUIPMENT]: 'Equipment',
};

export default function AdminSupplierVerificationPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<IPendingSupplier[]>([]);
  const [total, setTotal] = useState(0);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [activeModal, setActiveModal] = useState<ActionModal>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchQueue = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/supplier-verification');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as IQueueResponse;
      setSuppliers(json.data ?? []);
      setTotal(json.meta?.queueSize ?? json.data?.length ?? 0);
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
    supplierId: string,
    decision: 'VERIFIED' | 'SUSPENDED',
  ): Promise<void> {
    setIsActioning(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/verify-supplier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, decision }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        const msg = typeof data['error'] === 'string' ? data['error'] : 'Action failed.';
        setActionError(msg);
        return;
      }

      setSuppliers((prev) => prev.filter((s) => s._id !== supplierId));
      setTotal((t) => Math.max(0, t - 1));
      setActiveModal(null);
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

  if (status === 'loading' || pageState === 'loading') {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-56 rounded" />
        <ListSkeleton rows={5} />
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-t4 font-body font-medium text-text-primary mb-2">
          Could not load supplier queue
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

  const detailSupplier =
    activeModal?.type === 'detail' ? activeModal.supplier : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-t2 font-heading font-semibold text-text-primary">
          Supplier verification
        </h1>
        <p className="text-t5 font-body text-text-secondary mt-0.5">
          {total} pending supplier{total !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {/* Empty state */}
      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 rounded bg-surface-elevated">
          <div className="w-12 h-12 rounded bg-surface-secondary border border-white/5 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 8L7 12L17 4"
                stroke="#007F4E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-t4 font-body font-medium text-text-primary mb-1">
            Queue is clear
          </p>
          <p className="text-t5 font-body text-text-secondary">
            All supplier applications have been reviewed.
          </p>
        </div>
      ) : (
        <div className="bg-surface-elevated border border-white/5 rounded overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/5">
            {['Business', 'County', 'Categories', 'Submitted', 'Actions'].map((h) => (
              <span key={h} className="text-t6 font-mono text-text-disabled uppercase tracking-widest">
                {h}
              </span>
            ))}
          </div>

          {suppliers.map((supplier) => (
            <div
              key={supplier._id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-4 border-b border-white/5 last:border-0 items-center"
            >
              <div className="min-w-0">
                <p className="text-t5 font-body font-medium text-text-primary truncate">
                  {supplier.businessName}
                </p>
                <p className="text-t6 font-body text-text-disabled">{supplier.contactPhone}</p>
              </div>

              <span className="text-t5 font-body text-text-secondary">{supplier.county}</span>

              <div className="flex flex-wrap gap-1">
                {supplier.inputCategories.slice(0, 2).map((cat) => (
                  <span
                    key={cat}
                    className="text-t6 font-body text-text-secondary bg-surface-secondary border border-white/5 rounded-[2px] px-1.5 py-0.5"
                  >
                    {CATEGORY_LABELS[cat]}
                  </span>
                ))}
                {supplier.inputCategories.length > 2 && (
                  <span className="text-t6 font-body text-text-disabled">
                    +{supplier.inputCategories.length - 2}
                  </span>
                )}
              </div>

              <span className="text-t6 font-body text-text-disabled">
                {formatDate(supplier.createdAt)}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveModal({ type: 'detail', supplier })}
                >
                  Review
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveModal({ type: 'verify', supplier })}
                >
                  Verify
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setActionError(null);
                    setActiveModal({ type: 'suspend', supplier });
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Verify confirm modal ─────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={activeModal?.type === 'verify'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => {
          if (activeModal?.type === 'verify') {
            void handleDecision(activeModal.supplier._id, 'VERIFIED');
          }
        }}
        title="Verify supplier"
        message={
          activeModal?.type === 'verify'
            ? `Verify ${activeModal.supplier.businessName} as a registered supplier? They will appear in the public supplier directory.`
            : ''
        }
        confirmLabel="Verify supplier"
        isLoading={isActioning}
      />

      {/* ── Reject confirm modal ─────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={activeModal?.type === 'suspend'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => {
          if (activeModal?.type === 'suspend') {
            void handleDecision(activeModal.supplier._id, 'SUSPENDED');
          }
        }}
        title="Reject supplier application"
        message={
          activeModal?.type === 'suspend'
            ? `Reject ${activeModal.supplier.businessName}? Their application will be marked as rejected.`
            : ''
        }
        confirmLabel="Reject application"
        isLoading={isActioning}
      />

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      {detailSupplier && (
        <Modal
          isOpen
          onClose={() => setActiveModal(null)}
          title={detailSupplier.businessName}
          size="md"
        >
          <div className="space-y-5">
            {actionError && (
              <p className="text-t5 font-body text-red-400 bg-red-400/10 border border-red-400/20 rounded p-3">
                {actionError}
              </p>
            )}

            {/* Contact info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  Phone
                </p>
                <p className="text-t5 font-mono text-text-primary">{detailSupplier.contactPhone}</p>
              </div>
              {detailSupplier.contactEmail && (
                <div className="bg-surface-secondary rounded p-3">
                  <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                    Email
                  </p>
                  <p className="text-t5 font-body text-text-primary">{detailSupplier.contactEmail}</p>
                </div>
              )}
              <div className="bg-surface-secondary rounded p-3">
                <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                  County
                </p>
                <p className="text-t5 font-body text-text-primary">{detailSupplier.county}</p>
              </div>
              {detailSupplier.physicalAddress && (
                <div className="bg-surface-secondary rounded p-3">
                  <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-1">
                    Address
                  </p>
                  <p className="text-t5 font-body text-text-primary">{detailSupplier.physicalAddress}</p>
                </div>
              )}
            </div>

            {/* Registration numbers */}
            <div>
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
                Registration numbers
              </p>
              <div className="space-y-2">
                {detailSupplier.registrations.kebsNumber && (
                  <div className="flex items-center justify-between bg-surface-secondary rounded p-3">
                    <span className="text-t6 font-mono text-text-disabled">KEBS</span>
                    <span className="text-t5 font-mono text-text-primary">
                      {detailSupplier.registrations.kebsNumber}
                    </span>
                    <a
                      href="https://www.kebs.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-t6 font-body text-accent-green hover:underline underline-offset-2"
                    >
                      Verify
                    </a>
                  </div>
                )}
                {detailSupplier.registrations.pcpbNumber && (
                  <div className="flex items-center justify-between bg-surface-secondary rounded p-3">
                    <span className="text-t6 font-mono text-text-disabled">PCPB</span>
                    <span className="text-t5 font-mono text-text-primary">
                      {detailSupplier.registrations.pcpbNumber}
                    </span>
                    <a
                      href="https://www.pcpb.or.ke/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-t6 font-body text-accent-green hover:underline underline-offset-2"
                    >
                      Verify
                    </a>
                  </div>
                )}
                {detailSupplier.registrations.kephisNumber && (
                  <div className="flex items-center justify-between bg-surface-secondary rounded p-3">
                    <span className="text-t6 font-mono text-text-disabled">KEPHIS</span>
                    <span className="text-t5 font-mono text-text-primary">
                      {detailSupplier.registrations.kephisNumber}
                    </span>
                    <a
                      href="https://www.kephis.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-t6 font-body text-accent-green hover:underline underline-offset-2"
                    >
                      Verify
                    </a>
                  </div>
                )}
                {!detailSupplier.registrations.kebsNumber &&
                  !detailSupplier.registrations.pcpbNumber &&
                  !detailSupplier.registrations.kephisNumber && (
                    <p className="text-t5 font-body text-text-disabled">
                      No registration numbers provided
                    </p>
                  )}
              </div>
            </div>

            {/* Input categories */}
            <div>
              <p className="text-t6 font-mono text-text-disabled uppercase tracking-widest mb-2">
                Input categories
              </p>
              <div className="flex flex-wrap gap-2">
                {detailSupplier.inputCategories.map((cat) => (
                  <span
                    key={cat}
                    className="text-t5 font-body text-text-secondary bg-surface-secondary border border-white/5 rounded-[2px] px-2 py-1"
                  >
                    {CATEGORY_LABELS[cat]}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              <Button
                variant="primary"
                className="flex-1"
                isLoading={isActioning}
                onClick={() => void handleDecision(detailSupplier._id, 'VERIFIED')}
              >
                Verify supplier
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                isLoading={isActioning}
                onClick={() => void handleDecision(detailSupplier._id, 'SUSPENDED')}
              >
                Reject application
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
