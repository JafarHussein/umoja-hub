'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role, SupplierVerificationStatus } from '@/types';

interface IRegistrations {
  kebsNumber?: string;
  pcpbNumber?: string;
  kephisNumber?: string;
}

interface ISupplier {
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

interface IQueueResponse {
  data: ISupplier[];
  meta: { queueSize: number };
}

type PageState = 'loading' | 'ready' | 'error';
type Decision = 'VERIFIED' | 'SUSPENDED';

interface IPendingAction {
  supplierId: string;
  decision: Decision;
}

export default function AdminSupplierVerificationPage(): React.ReactElement {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [queueSize, setQueueSize] = useState(0);
  const [pendingAction, setPendingAction] = useState<IPendingAction | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQueue = useCallback(async (): Promise<void> => {
    setPageState('loading');
    try {
      const res = await fetch('/api/admin/supplier-verification');
      if (!res.ok) throw new Error('Request failed');
      const data = (await res.json()) as IQueueResponse;
      setSuppliers(data.data ?? []);
      setQueueSize(data.meta?.queueSize ?? 0);
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

  async function handleConfirmAction(): Promise<void> {
    if (!pendingAction) return;
    setIsActioning(true);
    setActionError(null);
    try {
      const res = await fetch('/api/admin/verify-supplier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: pendingAction.supplierId,
          decision: pendingAction.decision,
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? 'Action failed. Try again.');
      }
      setSuppliers((prev) => prev.filter((s) => s._id !== pendingAction.supplierId));
      setQueueSize((n) => Math.max(0, n - 1));
      setPendingAction(null);
      setExpandedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'An error occurred.');
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
    return <p className="p-4">Loading...</p>;
  }

  if (pageState === 'error') {
    return (
      <div className="p-4 flex flex-col gap-2">
        <p>Failed to load supplier verification queue.</p>
        <button type="button" onClick={() => void fetchQueue()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-semibold">Supplier Verification</h1>
        <p className="text-sm text-gray-500">
          {queueSize} pending verification{queueSize !== 1 ? 's' : ''}
        </p>
      </div>

      {suppliers.length === 0 && (
        <p className="text-sm text-gray-500">Queue is clear. No pending supplier verifications.</p>
      )}

      {suppliers.map((supplier) => {
        const isExpanded = expandedId === supplier._id;
        const isPending =
          pendingAction?.supplierId === supplier._id;
        const registrations = supplier.registrations ?? {};
        const hasRegistrations =
          registrations.kebsNumber ?? registrations.pcpbNumber ?? registrations.kephisNumber;

        return (
          <div key={supplier._id} className="border border-gray-300 flex flex-col gap-0">
            {/* ── Summary row ─── */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{supplier.businessName}</span>
                <span className="text-xs text-gray-500">
                  {supplier.county} · {supplier.inputCategories.join(', ')} · Applied{' '}
                  {formatDate(supplier.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : supplier._id)}
                className="text-xs border border-gray-300 px-2 py-1"
              >
                {isExpanded ? 'Collapse' : 'Review'}
              </button>
            </div>

            {/* ── Detail view ─── */}
            {isExpanded && (
              <div className="px-3 py-3 flex flex-col gap-3 border-b border-gray-300">
                <table className="border-collapse text-sm w-full">
                  <tbody>
                    <tr className="border border-gray-300">
                      <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300 w-36">
                        Phone
                      </th>
                      <td className="px-3 py-2 font-mono text-xs">{supplier.contactPhone}</td>
                    </tr>
                    {supplier.contactEmail && (
                      <tr className="border border-gray-300">
                        <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                          Email
                        </th>
                        <td className="px-3 py-2 text-xs">{supplier.contactEmail}</td>
                      </tr>
                    )}
                    {supplier.physicalAddress && (
                      <tr className="border border-gray-300">
                        <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                          Address
                        </th>
                        <td className="px-3 py-2 text-xs">{supplier.physicalAddress}</td>
                      </tr>
                    )}
                    {hasRegistrations && (
                      <tr className="border border-gray-300">
                        <th className="px-3 py-2 text-left bg-gray-50 border-r border-gray-300">
                          Registrations
                        </th>
                        <td className="px-3 py-2 font-mono text-xs">
                          {[
                            registrations.kebsNumber && `KEBS: ${registrations.kebsNumber}`,
                            registrations.pcpbNumber && `PCPB: ${registrations.pcpbNumber}`,
                            registrations.kephisNumber && `KEPHIS: ${registrations.kephisNumber}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Action bar ─── */}
            <div className="px-3 py-2 flex items-center gap-3">
              {!isPending ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAction({ supplierId: supplier._id, decision: 'VERIFIED' });
                      setActionError(null);
                    }}
                    className="border border-gray-400 px-3 py-1 text-sm"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAction({ supplierId: supplier._id, decision: 'SUSPENDED' });
                      setActionError(null);
                    }}
                    className="border border-gray-400 px-3 py-1 text-sm"
                  >
                    Suspend
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm">
                    Confirm{' '}
                    <strong>
                      {pendingAction.decision === 'VERIFIED' ? 'verify' : 'suspend'}
                    </strong>{' '}
                    {supplier.businessName}?
                  </span>
                  <button
                    type="button"
                    disabled={isActioning}
                    onClick={() => void handleConfirmAction()}
                    className="border border-gray-400 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    {isActioning ? 'Processing...' : 'Yes, confirm'}
                  </button>
                  <button
                    type="button"
                    disabled={isActioning}
                    onClick={() => setPendingAction(null)}
                    className="border border-gray-300 px-3 py-1 text-sm text-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
              {isPending && actionError !== null && (
                <p role="alert" className="text-xs text-red-600">
                  {actionError}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
