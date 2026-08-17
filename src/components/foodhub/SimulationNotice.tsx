import React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// The standing disclosure about what just happened to a payment.
//
// This component used to say one thing — "simulated payment" — because there
// was only one thing to say. There are now three, and they are genuinely
// different claims:
//
//   simulation      Nothing reaches Safaricom. UmojaHub generates the outcome.
//   daraja-sandbox  A real HTTPS request is authenticated against Safaricom's
//                   Daraja API, Safaricom issues a real CheckoutRequestID and
//                   POSTs a real callback back to us. No money moves and no
//                   handset rings, because that is what a sandbox is.
//   demo-bridge     The above happened, and then the confirmation was recorded
//                   by UmojaHub rather than by Safaricom, because the sandbox
//                   cannot complete a payment at all.
//
// Calling the middle one "simulated" understates it: the integration is real
// and that is the point of the demonstration. Calling it "M-Pesa payment"
// overstates it. Each mode gets its own sentence, and none of them claims more
// than the system did.
// ---------------------------------------------------------------------------

export type PaymentMode = 'simulation' | 'daraja-sandbox' | 'daraja-production' | 'demo-bridge';

interface IModeCopy {
  /** Short label for dense contexts. */
  badge: string;
  /** The lead-in on the inline notice. */
  title: string;
  /** What actually happened, and what did not. */
  body: string;
}

const COPY: Record<PaymentMode, IModeCopy | null> = {
  // A real production payment needs no disclosure — it is what it appears to be.
  'daraja-production': null,

  simulation: {
    badge: 'Simulated payment',
    title: 'Payment simulation.',
    body: 'UmojaHub generated this payment outcome itself. No request reached Safaricom, no money moved and no PIN was requested on any handset. The order, the escrow workflow and the records that follow are real.',
  },

  'daraja-sandbox': {
    badge: 'Daraja sandbox',
    title: 'Daraja sandbox payment.',
    body: 'This request was genuinely sent to Safaricom’s Daraja API, which authenticated UmojaHub, issued the checkout reference below and replied to our server. It is the sandbox, so no money moves and no prompt reaches a handset.',
  },

  'demo-bridge': {
    badge: 'Demonstration confirmation',
    title: 'Confirmed for the demonstration.',
    body: 'A real payment request was sent to Safaricom and a real reply came back. The Daraja sandbox cannot complete a payment — there is no one to enter a PIN on its test handset — so this order’s confirmation was recorded by UmojaHub, not by Safaricom. Everything after it is the ordinary escrow workflow.',
  },
};

export interface ISimulationNoticeProps {
  /** Which leg of the payment this order actually used. */
  mode?: PaymentMode;
  variant?: 'inline' | 'badge';
  className?: string;
}

export function SimulationNotice({
  mode = 'simulation',
  variant = 'inline',
  className,
}: ISimulationNoticeProps): React.ReactElement | null {
  const copy = COPY[mode];
  if (!copy) return null;

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'app-label inline-flex items-center gap-1 rounded-app-pill bg-app-info-surface px-2 py-0.5 text-app-info',
          className
        )}
      >
        <span aria-hidden>◑</span>
        {copy.badge}
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
      <p className="app-meta text-pretty text-app-muted">
        <span className="app-body-strong text-app-info">{copy.title}</span> {copy.body}
      </p>
    </div>
  );
}
