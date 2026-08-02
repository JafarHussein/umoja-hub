'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TransactionReceipt } from '@/components/foodhub/TransactionReceipt';

// ---------------------------------------------------------------------------
// Admin view of one escrow: the receipt and the complete audit trail for the
// order. Same component and same route the parties see — the admin has no
// separate, privileged rendering of the facts, which is what makes the trail
// worth anything.
// ---------------------------------------------------------------------------

export default function AdminEscrowDetailPage(): React.ReactElement {
  const params = useParams();
  const orderId = typeof params?.['orderId'] === 'string' ? params['orderId'] : '';

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/dashboard/admin/escrow"
        className="app-body inline-flex items-center gap-1.5 text-app-muted transition-colors duration-150 hover:text-app-ink print:hidden"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M9.5 6H2.5M5.5 9L2.5 6L5.5 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to escrow ledger
      </Link>

      <TransactionReceipt orderId={orderId} />
    </div>
  );
}
