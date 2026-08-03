'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TransactionReceipt } from '@/components/foodhub/TransactionReceipt';
import { Page } from '@/components/app';

// ---------------------------------------------------------------------------
// Farmer receipt view — the same receipt and audit trail the buyer and the
// admin see. The farmer's interest is specifically in when the funds became
// theirs, which the trail states explicitly.
// ---------------------------------------------------------------------------

export default function FarmerOrderReceiptPage(): React.ReactElement {
  const params = useParams();
  const orderId = typeof params?.['orderId'] === 'string' ? params['orderId'] : '';

  return (
    <Page width="focus">
      <Link
        href="/dashboard/farmer/orders"
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
        Back to orders
      </Link>

      <TransactionReceipt orderId={orderId} />
    </Page>
  );
}
