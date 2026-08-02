'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TransactionReceipt } from '@/components/foodhub/TransactionReceipt';

// ---------------------------------------------------------------------------
// Buyer receipt view — the formal record of a protected payment, plus the full
// audit trail. Access is enforced server-side by the receipt route (party or
// admin only); this page only renders what that route returns.
// ---------------------------------------------------------------------------

export default function BuyerOrderReceiptPage(): React.ReactElement {
  const params = useParams();
  const orderId = typeof params?.['orderId'] === 'string' ? params['orderId'] : '';

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/dashboard/buyer/orders/${orderId}`}
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
        Back to order
      </Link>

      <TransactionReceipt orderId={orderId} />
    </div>
  );
}
