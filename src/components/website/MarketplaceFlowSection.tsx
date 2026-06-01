import React from 'react';
import Link from 'next/link';
import { ProcessFlow } from '@/components/website/ProcessFlow';

const steps = [
  {
    actor: 'Admin',
    action: 'Farmer verification reviewed',
    detail:
      'National ID or passport, land tenure document or signed lease, and produce photograph submitted. UmojaHub admin reviews and approves or rejects.',
  },
  {
    actor: 'Farmer',
    action: 'Listing created',
    detail:
      'Crop type, price per kilogram, available quantity, pickup county, and preferred contact method set. Listing appears immediately after approval.',
  },
  {
    actor: 'Buyer',
    action: 'Listing found',
    detail:
      "Buyers browse by county and crop type. Each listing shows the farmer's trust tier, completed order count, and verification status.",
  },
  {
    actor: 'Buyer',
    action: 'Payment sent',
    detail:
      "STK Push sent to the buyer's registered M-Pesa number. Buyer enters PIN. Safaricom confirms. Order status updates to Paid.",
  },
  {
    actor: 'Farmer',
    action: 'Order fulfilled',
    detail:
      'Order progresses from Paid → Dispatched → Received. Both parties leave a rating. The farmer\'s trust score updates on completion.',
  },
];

export function MarketplaceFlowSection(): React.ReactElement {
  return (
    <section className="bg-surface-elevated w-full py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Food Security Hub · How it works
          </p>
          <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight mb-4">
            How the marketplace works
          </h2>
          <p className="font-body text-t4 text-text-secondary max-w-prose">
            Five steps from farmer registration to completed order. Every transaction is between a
            verified farmer and an M-Pesa payment — no cash, no broker.
          </p>
        </div>

        <ProcessFlow steps={steps} />

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Browse marketplace
          </Link>
          <Link
            href="/for/farmers"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            For farmers
          </Link>
          <Link
            href="/for/buyers"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            For buyers
          </Link>
        </div>
      </div>
    </section>
  );
}
