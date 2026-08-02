import React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// SimulationNotice — the platform's standing disclosure that payments are
// simulated.
//
// UmojaHub runs a controlled payment simulation while Daraja production access
// is pending. Everything downstream of the payment network is real: the order
// state machine, the escrow hold, the audit logs, the receipts and the payout
// queue. Only the M-Pesa leg is simulated. Saying so plainly is a trust
// property, not a disclaimer — a payment surface that implies a real charge
// when none occurs is simply wrong.
//
// Two variants: `inline` for a payment surface, `badge` for a dense context
// (receipt header, table row, admin ledger).
// ---------------------------------------------------------------------------

export interface ISimulationNoticeProps {
  variant?: 'inline' | 'badge';
  className?: string;
}

export function SimulationNotice({
  variant = 'inline',
  className,
}: ISimulationNoticeProps): React.ReactElement {
  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'app-label inline-flex items-center gap-1 rounded-app-pill bg-app-info-surface px-2 py-0.5 text-app-info',
          className
        )}
      >
        <span aria-hidden>◑</span>
        Simulated payment
      </span>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-app-control border border-app-info/30 bg-app-info-surface px-3 py-2.5',
        className
      )}
    >
      <span aria-hidden className="app-body-strong leading-5 text-app-info">
        ◑
      </span>
      <p className="app-meta text-app-muted">
        <span className="app-body-strong text-app-info">Payment simulation.</span> UmojaHub is
        running a controlled M-Pesa simulation for this pilot. The order, the escrow hold, the
        records and this receipt are real — no money moves on the Safaricom network and no PIN is
        requested on your handset.
      </p>
    </div>
  );
}
